/**
 * Inline HTML → Markdown.
 *
 * `block.getContent()` does not return an AST: Asciidoctor has already applied
 * inline substitutions and handed back a restricted HTML string (`<a>`, `<code>`,
 * `<strong>`, `<em>`, `<sub>`, `<sup>`, `<br>`). Converting inline content is
 * therefore a small HTML pass rather than an AST walk — see ADR-0002 and
 * `.please/docs/knowledge/upstream-antora.md`.
 *
 * Pure: no I/O, no shared state, identical input → identical output.
 */

/** Elements that never carry children. */
const VOID_TAGS: ReadonlySet<string> = new Set(['br', 'hr', 'img', 'wbr'])

/** Named entities Asciidoctor emits. Numeric forms are decoded generically. */
const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  apos: '\'',
  gt: '>',
  hellip: '…',
  lsquo: '‘',
  lt: '<',
  ldquo: '“',
  mdash: '—',
  nbsp: ' ',
  ndash: '–',
  quot: '"',
  rdquo: '”',
  rsquo: '’',
}

/** A run of literal text. */
interface TextNode {
  readonly kind: 'text'
  readonly value: string
}

/** A parsed element, with its attributes already decoded. */
interface ElementNode {
  readonly kind: 'element'
  readonly tag: string
  readonly attrs: ReadonlyMap<string, string>
  readonly children: HtmlNode[]
}

type HtmlNode = TextNode | ElementNode

/** A named or numeric HTML entity. */
const ENTITY = /&(#X[0-9A-F]+|#\d+|[A-Z][A-Z0-9]*);/gi

/** A single whitespace character. */
const WHITESPACE = /\s/

/** Whitespace or the `=` that ends an attribute name. */
const ATTR_NAME_END = /[\s=]/

/**
 * A tag's name and its attribute section.
 *
 * The attribute group must begin with whitespace. Without that anchor the two
 * groups can exchange characters, which makes the match backtrack super-linearly
 * on a long tag.
 */
const TAG_PARTS = /^([A-Z][\w:-]*)(\s[\s\S]*)?$/i

/** A run of backticks, used to size a code span. */
const BACKTICK_RUN = /`+/g

/** Markdown characters that change how a text run parses. */
const MARKDOWN_SPECIALS = /[\\*_[\]]/g

/** A leading `#`, which would otherwise start a heading. */
const LEADING_HASH = /^(\s*)#/

/** The `.adoc` extension of an unresolved page reference. */
const ADOC_EXTENSION = /\.adoc$/

/** A `.html` target with an optional fragment or query. */
const HTML_TARGET = /^([^#?]*)\.html([#?][\s\S]*)?$/

/**
 * A reference into an Antora component that was not built, which Antora leaves
 * as `#<component>:<path>[#fragment]`.
 */
const DANGLING_COMPONENT = /^#([a-z][\w-]*):([^#]*)(#[\s\S]*)?$/i

/** Characters that force a Markdown destination to be bracketed. */
const NEEDS_BRACKETS = /[\s()<>]/

/** Angle brackets, which must be encoded inside a bracketed destination. */
const ANGLE_BRACKETS = /[<>]/g

/** Runs of whitespace separating CSS class names. */
const CLASS_SEPARATOR = /\s+/

/** Decode the HTML entities Asciidoctor emits, named and numeric alike. */
function decodeEntities(text: string): string {
  return text.replace(ENTITY, (match, body: string) => {
    if (body.startsWith('#')) {
      const hex = body[1] === 'x' || body[1] === 'X'
      const code = Number.parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10)
      if (!Number.isFinite(code) || code < 0 || code > 0x10FFFF)
        return match
      return String.fromCodePoint(code)
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match
  })
}

/**
 * Index of the `>` closing the tag that starts at `start`, or `-1`.
 *
 * Quote-aware: an attribute value may legitimately contain `>`.
 */
function findTagEnd(html: string, start: number): number {
  let quote: string | undefined
  for (let i = start + 1; i < html.length; i++) {
    const char = html[i]
    if (quote !== undefined) {
      if (char === quote)
        quote = undefined
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      continue
    }
    if (char === '>')
      return i
  }
  return -1
}

/**
 * Parse the attribute section of a tag, respecting quotes.
 *
 * A naive `\b([a-z-]+)=` scan over the whole tag misreads
 * `<a href="https://start.spring.io/#!language=kotlin">` as carrying a
 * `language` attribute, so attributes are only ever read positionally here.
 */
function parseAttributes(source: string): Map<string, string> {
  const attrs = new Map<string, string>()
  let i = 0

  while (i < source.length) {
    while (i < source.length && WHITESPACE.test(source[i] ?? '')) i++
    if (i >= source.length)
      break

    const nameStart = i
    while (i < source.length && !ATTR_NAME_END.test(source[i] ?? '')) i++
    const name = source.slice(nameStart, i).toLowerCase()
    if (name === '') {
      i++
      continue
    }

    while (i < source.length && WHITESPACE.test(source[i] ?? '')) i++
    if (source[i] !== '=') {
      attrs.set(name, '')
      continue
    }
    i++
    while (i < source.length && WHITESPACE.test(source[i] ?? '')) i++

    const quote = source[i]
    if (quote === '"' || quote === '\'') {
      i++
      const end = source.indexOf(quote, i)
      const stop = end === -1 ? source.length : end
      attrs.set(name, decodeEntities(source.slice(i, stop)))
      i = stop + 1
    }
    else {
      const valueStart = i
      while (i < source.length && !WHITESPACE.test(source[i] ?? '')) i++
      attrs.set(name, decodeEntities(source.slice(valueStart, i)))
    }
  }

  return attrs
}

/** Parse restricted HTML into a shallow node tree. Unmatched tags are tolerated. */
function parseHtml(html: string): readonly HtmlNode[] {
  const root: ElementNode = { kind: 'element', tag: '#root', attrs: new Map(), children: [] }
  const stack: ElementNode[] = [root]
  const pushText = (value: string): void => {
    if (value !== '')
      stack.at(-1)?.children.push({ kind: 'text', value })
  }

  let i = 0
  while (i < html.length) {
    const lt = html.indexOf('<', i)
    if (lt === -1) {
      pushText(html.slice(i))
      break
    }
    pushText(html.slice(i, lt))

    const end = findTagEnd(html, lt)
    if (end === -1) {
      pushText(html.slice(lt))
      break
    }
    const raw = html.slice(lt + 1, end)
    i = end + 1

    // Comments, CDATA and doctypes carry nothing we emit.
    if (raw.startsWith('!'))
      continue

    if (raw.startsWith('/')) {
      const tag = raw.slice(1).trim().toLowerCase()
      for (let depth = stack.length - 1; depth > 0; depth--) {
        if (stack[depth]?.tag === tag) {
          stack.length = depth
          break
        }
      }
      continue
    }

    const selfClosing = raw.endsWith('/')
    const parsed = TAG_PARTS.exec(selfClosing ? raw.slice(0, -1) : raw)
    if (parsed === null) {
      // Not a tag after all (a bare `<` in prose); keep it as literal text.
      pushText(html.slice(lt, end + 1))
      continue
    }

    const tag = (parsed[1] ?? '').toLowerCase()
    const node: ElementNode = {
      kind: 'element',
      tag,
      attrs: parseAttributes(parsed[2] ?? ''),
      children: [],
    }
    stack.at(-1)?.children.push(node)
    if (!selfClosing && !VOID_TAGS.has(tag))
      stack.push(node)
  }

  return root.children
}

/** Literal text of a subtree, entity-decoded and unescaped — used for code spans. */
function rawText(nodes: readonly HtmlNode[]): string {
  let text = ''
  for (const node of nodes) {
    if (node.kind === 'text')
      text += decodeEntities(node.value)
    else if (node.tag === 'br')
      text += ' '
    else text += rawText(node.children)
  }
  return text
}

/**
 * Wrap literal text as a Markdown code span.
 *
 * The delimiter grows past the longest backtick run in the content, and content
 * that would otherwise collide with the delimiter is padded with spaces.
 */
function codeSpan(text: string): string {
  const runs = text.match(BACKTICK_RUN) ?? []
  const longest = runs.reduce((max, run) => Math.max(max, run.length), 0)
  const fence = '`'.repeat(longest + 1)
  const pad = text.startsWith('`') || text.endsWith('`') ? ' ' : ''
  return `${fence}${pad}${text}${pad}${fence}`
}

/**
 * Escape the Markdown-significant characters that can change how a text run parses.
 *
 * Deliberately conservative: over-escaping ordinary prose costs more readability
 * than the rare under-escape costs correctness. `#` only matters at line start.
 */
function escapeText(text: string, atLineStart: boolean): string {
  const escaped = text.replace(MARKDOWN_SPECIALS, '\\$&')
  return atLineStart ? escaped.replace(LEADING_HASH, '$1\\#') : escaped
}

/**
 * Rewrite a resolved Antora xref target for the Markdown tree.
 *
 * Antora resolves `xref:` to a `.html` URL that is already relative to the
 * current page, so only the extension changes — never the path.
 */
function rewriteXrefTarget(href: string, externalComponents: Readonly<Record<string, string>>): string {
  const dangling = DANGLING_COMPONENT.exec(href)
  if (dangling !== null) {
    const base = externalComponents[(dangling[1] ?? '').toLowerCase()]
    if (base === undefined)
      return href
    const path = (dangling[2] ?? '').replace(ADOC_EXTENSION, '.html')
    return `${base}/${path}${dangling[3] ?? ''}`
  }
  const parsed = HTML_TARGET.exec(href)
  return parsed === null ? href : `${parsed[1] ?? ''}.md${parsed[2] ?? ''}`
}

/** Render a URL as a Markdown destination, bracketing it when it needs one. */
function formatDestination(url: string): string {
  return NEEDS_BRACKETS.test(url) ? `<${url.replace(ANGLE_BRACKETS, encodeURIComponent)}>` : url
}

/** Inputs that change how inline content is rendered. */
export interface InlineOptions {
  /** Called once per tag with no conversion rule, so the caller can warn. */
  readonly onUnknownTag?: (tag: string) => void
  /**
   * Antora components that were not built, mapped to their published base URL.
   * References into them are rewritten there rather than left dangling.
   */
  readonly externalComponents?: Readonly<Record<string, string>>
}

/**
 * Convert the restricted inline HTML of one block to Markdown.
 *
 * @param html - The string returned by `node.getContent()` or `node.getText()`.
 * @param options - Rendering inputs; see {@link InlineOptions}. An element with
 *   no conversion rule is stripped and its text kept, but `onUnknownTag` is
 *   called so the construct is surfaced rather than silently dropped.
 * @returns Markdown equivalent of `html`.
 */
export function inlineHtmlToMarkdown(html: string, options: InlineOptions = {}): string {
  const { onUnknownTag, externalComponents = {} } = options
  let out = ''
  const emit = (text: string): void => {
    out += text
  }

  const walk = (nodes: readonly HtmlNode[]): void => {
    for (const node of nodes) {
      if (node.kind === 'text') {
        emit(escapeText(decodeEntities(node.value), out === '' || out.endsWith('\n')))
        continue
      }

      switch (node.tag) {
        case 'code':
          emit(codeSpan(rawText(node.children)))
          break
        case 'a': {
          const href = node.attrs.get('href')
          // `<a id="…"></a>` is a section anchor; GFM generates its own.
          if (href === undefined) {
            walk(node.children)
            break
          }
          const classes = (node.attrs.get('class') ?? '').split(CLASS_SEPARATOR)
          const target = classes.includes('xref')
            ? rewriteXrefTarget(href, externalComponents)
            : href
          emit('[')
          walk(node.children)
          emit(`](${formatDestination(target)})`)
          break
        }
        case 'strong':
        case 'b':
          emit('**')
          walk(node.children)
          emit('**')
          break
        case 'em':
        case 'i':
          emit('*')
          walk(node.children)
          emit('*')
          break
        case 'br':
          emit('\n')
          break
        // No GFM equivalent; guideline 1 prefers explicit markup over a lossy one.
        case 'sub':
        case 'sup':
          emit(`<${node.tag}>`)
          walk(node.children)
          emit(`</${node.tag}>`)
          break
        default:
          onUnknownTag?.(node.tag)
          walk(node.children)
          break
      }
    }
  }

  walk(parseHtml(html))
  return out
}
