/**
 * Asciidoctor block AST → Markdown.
 *
 * The document handed in is already fully resolved by Antora (ADR-0002): `xref:`,
 * `include::`, `include-code::`, `javadoc:` and `configprop:` have all been expanded,
 * so this module only maps block contexts to Markdown and delegates inline content
 * to `inlineHtmlToMarkdown`.
 *
 * Pure: no I/O, no clock, no environment. Identical input → byte-identical output.
 */

import type {
  AsciidoctorListItem,
  AsciidoctorNode,
  AsciidoctorTable,
  AsciidoctorTableCell,
} from './antora-types.ts'
import { decodeEntities, escapeHtmlAttribute, inlineHtmlToMarkdown } from './inline-html.ts'

/**
 * The inline HTML of a node, as Asciidoctor actually hands it across.
 *
 * `getText()` and `getContent()` are declared to return a string, and for most
 * nodes they do. A `ListItem` whose description carries only nested blocks does
 * not: Asciidoctor returns Ruby `nil`, and Opal passes that over as an object
 * carrying `call`/`apply` rather than converting it to `undefined`. A nullish
 * fallback does not catch it — the object is neither `null` nor `undefined` — so it
 * reached the entity decoder as a non-string and threw `text.replace is not a
 * function`, with no page or node named.
 *
 * Every hand-written tab group has exactly that shape: `Java::` alone on its
 * line, then `+`, then the listing. Spring Boot's corpus never hit it because
 * `include-code::` generates its tab groups and fills the text in; Spring
 * Framework writes them by hand, 1,932 times at v6.2.14.
 *
 * An empty string is the faithful reading — the description has no inline text,
 * only blocks, and `renderDescription` already drops an empty chunk and renders
 * the blocks.
 */
function asInlineHtml(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** Inputs the converter needs beyond the document itself. */
export interface ConvertOptions {
  /** Upstream page coordinate, recorded in the frontmatter (e.g. `reference:data/nosql.adoc`). */
  readonly sourcePath: string
  /**
   * Antora components this build does not produce, mapped to their published
   * base URL. References into them are rewritten there instead of being left as
   * a dangling `#component:path` fragment.
   */
  readonly externalComponents?: Readonly<Record<string, string>>
  /**
   * Base URL of the project's published `_images/` directory, version-pinned.
   *
   * Image assets live in the component (`modules/ROOT/assets/images/`) but are
   * not part of a release: the archives carry Markdown only. A relative link
   * would therefore resolve to nothing once extracted. Pointing at the
   * published site instead keeps the reference useful, which is the same rule
   * {@link externalComponents} already applies to components this build does
   * not produce.
   */
  readonly imageBase?: string
}

/** One converted page, plus everything the converter could not convert faithfully. */
export interface ConvertResult {
  /** The Markdown page, LF-terminated with exactly one trailing newline. */
  readonly markdown: string
  /** Unhandled constructs, deduplicated. Never empty when something was dropped. */
  readonly warnings: readonly string[]
}

/** AsciiDoc admonition styles mapped to their GFM alert keyword. */
const ALERT_TYPES: Readonly<Record<string, string>> = {
  CAUTION: 'CAUTION',
  IMPORTANT: 'IMPORTANT',
  NOTE: 'NOTE',
  TIP: 'TIP',
  WARNING: 'WARNING',
}

/** Leading / trailing blank lines around a rendered chunk. */
const LEADING_NEWLINES = /^\n+/
const TRAILING_NEWLINES = /\n+$/

/** Three or more consecutive newlines, left behind when a line is removed. */
const BLANK_LINE_RUN = /\n{3,}/g

/** A run of three or more backticks, used to size a code fence. */
const BACKTICK_RUN = /`{3,}/g

/** A fenced code block, captured so a table cell can inline its body. */
const FENCED_BLOCK = /`{3}[^\n]*\n([\s\S]*?)\n`{3,}/g

/** Any newline plus the whitespace hugging it. */
const NEWLINE_RUN = /\s*\n\s*/g

/**
 * A code-folding directive line.
 *
 * `@springio/asciidoctor-extensions` folds these into a collapsible region when
 * rendering HTML, but `getSource()` returns the raw marker. Mirrors
 * `FoldDirectiveRx` in that extension so the markers never reach the output.
 */
const FOLD_DIRECTIVE = /^[^\S\n]*\/\/ @fold:(?:on( \S[^\n]*)?|off)$/gm

/** A trailing slash on a base URL, so joining never doubles it. */
const TRAILING_SLASH = /\/+$/

/** Heading level used for a block's own title, matching tab labels. */
const BLOCK_TITLE_LEVEL = '#### '

/** Deepest ATX heading GFM defines. */
const MAX_HEADING_LEVEL = 6

/** How much of a text run a warning quotes before eliding the rest. */
const EXCERPT_LIMIT = 60

/** A `dlist` item: a list of terms and the description that follows them. */
type DefinitionItem = readonly [readonly AsciidoctorListItem[], AsciidoctorListItem | undefined]

/** Quote a value for YAML frontmatter. Always quoted, so no value can change type. */
function yamlString(value: string): string {
  const escaped = value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\n', '\\n')
  return `"${escaped}"`
}

/** Strip leading and trailing blank lines so chunks join predictably. */
function trimChunk(text: string): string {
  return text.replace(LEADING_NEWLINES, '').replace(TRAILING_NEWLINES, '')
}

/** Prefix every line of `text` with `prefix`, leaving blank lines unpadded. */
function indent(text: string, prefix: string): string {
  return text
    .split('\n')
    .map(line => (line === '' ? '' : `${prefix}${line}`))
    .join('\n')
}

/** Wrap rendered Markdown in a blockquote, keeping blank lines inside the quote. */
function blockquote(text: string): string {
  return text
    .split('\n')
    .map(line => (line === '' ? '>' : `> ${line}`))
    .join('\n')
}

/** A fence long enough to contain `body` without being closed early. */
function fenceFor(body: string): string {
  const runs = body.match(BACKTICK_RUN) ?? []
  const longest = runs.reduce((max, run) => Math.max(max, run.length), 2)
  return '`'.repeat(longest + 1)
}

/** Collapse rendered Markdown onto one line so it can live in a GFM table cell. */
function flattenForCell(text: string): string {
  return text
    .replace(FENCED_BLOCK, (_match, code: string) => `\`${code.replace(NEWLINE_RUN, ' ')}\``)
    .replace(NEWLINE_RUN, ' ')
    .replaceAll('|', '\\|')
    .trim()
}

/**
 * Convert one fully resolved Asciidoctor document to Markdown.
 *
 * @param doc - The `Document` node returned by `@antora/asciidoc-loader`.
 * @param options - Conversion inputs; see {@link ConvertOptions}.
 * @returns The Markdown page and any construct that had no conversion rule.
 */
export function convertDocument(doc: AsciidoctorNode, options: ConvertOptions): ConvertResult {
  const warnings = new Set<string>()

  /**
   * A one-line, bounded excerpt of a text run, for naming it in a warning.
   *
   * The run can be a whole paragraph, and a warning is read in a terminal.
   */
  const excerpt = (run: string): string => {
    const oneLine = run.replace(NEWLINE_RUN, ' ').trim()
    return oneLine.length <= EXCERPT_LIMIT ? oneLine : `${oneLine.slice(0, EXCERPT_LIMIT)}…`
  }

  /**
   * Render an explicit `[[id]]` as its own inline-HTML anchor block.
   *
   * GFM derives a heading's slug from its text and generates nothing at all for
   * an `[[...]]` id, so a cross-page link built from that id (930 of 963 unique
   * cross-page fragment targets, measured against the real dist/ output) has no
   * other target once the heading is rendered.
   */
  const renderAnchor = (id: string | undefined): string[] =>
    id === undefined || id === '' ? [] : [`<a id="${escapeHtmlAttribute(id)}"></a>`]

  const warn = (message: string, node?: AsciidoctorNode): void => {
    const line = node?.getLineNumber?.()
    warnings.add(line === undefined ? message : `${message} (line ${line})`)
  }

  const inline = (html: unknown): string =>
    inlineHtmlToMarkdown(asInlineHtml(html), {
      externalComponents: options.externalComponents,
      ...(options.imageBase === undefined ? {} : { imageBase: options.imageBase }),
      onImageWithoutBase: src =>
        warnings.add(`inline image "${src}" dropped: no published image base for this project`),
      onUnknownTag: tag => warnings.add(`unknown inline tag <${tag}>`),
      onUnpairedStem: run =>
        warnings.add(
          `stem:[…] delimiters do not pair up, so the run was left escaped: "${excerpt(run)}"`,
        ),
    })

  /** Render a node list into joinable chunks, dropping the ones that render empty. */
  const renderBlocks = (nodes: readonly AsciidoctorNode[]): string[] =>
    nodes.flatMap((node) => {
      const chunk = trimChunk(renderBlock(node))
      return chunk === '' ? [] : [chunk]
    })

  const renderChildren = (node: AsciidoctorNode): string => renderBlocks(node.getBlocks()).join('\n\n')

  /**
   * Content of a block that may be simple (inline HTML) or compound (nested blocks).
   *
   * Asciidoctor 2.2 exposes the content model only as the Opal-native
   * `$content_model()`, so presence of child blocks is used instead: it carries the
   * same distinction without reaching into Opal internals. This matters because a
   * compound admonition's `getContent()` flattens its children to HTML.
   */
  const renderBody = (node: AsciidoctorNode): string =>
    node.getBlocks().length > 0 ? renderChildren(node) : inline(node.getContent())

  /**
   * A listing block: the source, fenced, with its language.
   *
   * `getSource()`, not `getContent()`: the latter carries the code-folding
   * extension's `<span class="fold-block">` wrappers. The raw source instead
   * carries the fold directives themselves, which are stripped here.
   *
   * A listing that opts into attribute substitution — `[source,xml,
   * subs="verbatim,attributes"]`, how every project writes its "add the
   * dependency" snippet — gets it applied, because the raw source is the one
   * text where that has *not* happened yet. Without this the snippet a reader
   * copies carries `{spring-security-version}` where the version belongs.
   * Asciidoctor applies it rather than a regex over the source, so the result is
   * what upstream publishes; only `attributes` is applied, since the other
   * substitutions a listing can declare (`specialcharacters`, `macros`) produce
   * HTML, which has no place inside a fence.
   */
  const renderListing = (node: AsciidoctorNode): string => {
    const raw = node.hasSubstitution?.('attributes') === true
      ? node.applySubstitutions?.(node.getSource(), ['attributes']) ?? node.getSource()
      : node.getSource()
    const body = raw.replace(FOLD_DIRECTIVE, '').replace(BLANK_LINE_RUN, '\n')
    const language = node.getAttribute('language')
    const fence = fenceFor(body)
    return `${fence}${typeof language === 'string' ? language : ''}\n${body}\n${fence}`
  }

  const renderAdmonition = (node: AsciidoctorNode): string => {
    const style = node.getStyle() ?? ''
    const alert = ALERT_TYPES[style.toUpperCase()]
    if (alert === undefined)
      warn(`unknown admonition style "${style}"`, node)
    // Trap 2: a compound admonition's `getContent()` flattens nested blocks to HTML.
    const body = trimChunk(renderBody(node))
    return blockquote([`[!${alert ?? 'NOTE'}]`, ...(body === '' ? [] : [body])].join('\n'))
  }

  /**
   * A `[quote]` block: the quoted body, with whatever credit it carries.
   *
   * Rendered as a plain blockquote, like `sidebar` — GFM has no quote-with-
   * attribution form, so the credit follows the body as an em-dash line inside
   * the same quote, which is how the attribution reads in the HTML upstream
   * publishes.
   *
   * The credit is rendered rather than dropped even though neither half occurs
   * in the corpus that motivated this rule — Spring Framework 7.0.x writes two
   * bare `[quote]` blocks, both a log message quoted verbatim, and no earlier
   * line writes one at all. Dropping it silently is the failure mode this
   * converter refuses everywhere else: an attributed quote in a later version
   * would lose its source with nothing reported.
   */
  const renderQuote = (node: AsciidoctorNode): string => {
    const credit = ['attribution', 'citetitle']
      .map(name => node.getAttribute(name))
      .filter((value): value is string => typeof value === 'string' && value !== '')
      .map(value => inline(value))
      .join(', ')
    const body = trimChunk(renderBody(node))
    const chunks = [
      ...(body === '' ? [] : [body]),
      ...(credit === '' ? [] : [`— ${credit}`]),
    ]
    return blockquote(chunks.join('\n\n'))
  }

  const renderListItem = (item: AsciidoctorListItem, marker: string): string => {
    const text = inline(item.getText())
    const nested = renderBlocks(item.getBlocks())
    const head = `${marker}${text}`
    if (nested.length === 0)
      return head
    const padding = ' '.repeat(marker.length)
    return [head, ...nested.map(chunk => indent(chunk, padding))].join('\n\n')
  }

  /**
   * A block image, linked to the project's published documentation site.
   *
   * The asset is real — it sits in `modules/ROOT/assets/images/` — but a release
   * archive carries Markdown only, so a relative link would dangle the moment
   * the archive is extracted. The published, version-pinned `_images/` URL is
   * the one reference that resolves for every consumer, and it pins to the same
   * version as the prose around it.
   *
   * Without a base URL the target is dropped rather than guessed at: an
   * `![alt]()` with an empty destination reads as a broken image, while the alt
   * text alone still tells a reader — or a model — what the diagram showed.
   */
  const renderImage = (node: AsciidoctorNode): string => {
    const target = node.getAttribute('target')
    const alt = node.getAttribute('alt')
    const altText = typeof alt === 'string' ? inline(alt) : ''
    if (typeof target !== 'string' || target === '') {
      warn('image block with no target', node)
      return altText === '' ? '' : `![${altText}]()`
    }
    if (options.imageBase === undefined) {
      warn(`image "${target}" dropped: no published image base for this project`, node)
      return altText === '' ? '' : `![${altText}]()`
    }
    return `![${altText}](${options.imageBase.replace(TRAILING_SLASH, '')}/${target})`
  }

  /**
   * A `[literal]` block: preformatted text carrying no language.
   *
   * `getContent()`, not `getSource()` — the opposite of {@link renderListing},
   * and for the opposite reason. A listing suppresses substitutions, so its raw
   * source is the faithful text; a literal block applies them, so reading the
   * source would leave AsciiDoc's own escapes in the output —
   * `[literal,subs="verbatim,quotes"]` in `core/resources.adoc` writes
   * `\*-context.xml` to render a literal `*`, and only the substituted content
   * spells the path a reader should copy.
   *
   * That content is HTML-escaped text, so entities are decoded rather than run
   * through the inline converter: a fence is verbatim, and building Markdown
   * syntax inside one would emit link and emphasis markup that renders as
   * itself.
   */
  const renderLiteral = (node: AsciidoctorNode): string => {
    const body = decodeEntities(asInlineHtml(node.getContent()))
    const fence = fenceFor(body)
    return `${fence}\n${body}\n${fence}`
  }

  const renderList = (node: AsciidoctorNode, marker: string): string =>
    (node.getItems() as AsciidoctorListItem[])
      .map(item => renderListItem(item, marker))
      .join('\n')

  /** Blocks of a `dlist` description: its own inline text first, then nested blocks. */
  const renderDescription = (description: AsciidoctorListItem | undefined): string[] => {
    if (description === undefined)
      return []
    const text = trimChunk(inline(description.getText()))
    return [...(text === '' ? [] : [text]), ...renderBlocks(description.getBlocks())]
  }

  const renderDefinitionList = (node: AsciidoctorNode): string =>
    // Trap 1: `dlist.getBlocks()` yields `[terms, description]` pairs, not nodes.
    (node.getItems() as DefinitionItem[])
      .map(([terms, description]) => [
        ...terms.map(term => `**${inline(term.getText())}**`),
        ...renderDescription(description),
      ].join('\n\n'))
      .join('\n\n')

  /**
   * A `[tabs]` group: a `dlist` whose terms are tab labels.
   *
   * product-guidelines.md requires headed code fences here, never tab-widget HTML.
   */
  const renderTabs = (node: AsciidoctorNode): string =>
    node.getBlocks().flatMap((child) => {
      if (child.getContext() !== 'dlist')
        return renderBlocks([child])
      return (child.getItems() as DefinitionItem[]).map(([terms, description]) => [
        `#### ${terms.map(term => inline(term.getText())).join(' / ')}`,
        ...renderDescription(description),
      ].join('\n\n'))
    }).join('\n\n')

  const renderCell = (cell: AsciidoctorTableCell): string => {
    if (cell.getStyle() === 'asciidoc') {
      const inner = cell.getInnerDocument()
      if (inner !== undefined)
        return flattenForCell(renderBlocks(inner.getBlocks()).join('\n\n'))
    }
    return flattenForCell(inline(cell.getText()))
  }

  const renderTable = (node: AsciidoctorTable): string => {
    const head = node.getHeadRows().map(row => row.map(renderCell))
    const body = node.getBodyRows().map(row => row.map(renderCell))
    const columns = [...head, ...body].reduce((max, row) => Math.max(max, row.length), 0)
    if (columns === 0)
      return ''

    const toRow = (cells: readonly string[]): string =>
      `| ${Array.from({ length: columns }, (_unused, i) => cells[i] ?? '').join(' | ')} |`

    // GFM has no headerless table; an empty header row keeps the body parseable.
    const emptyHeader = Array.from<string>({ length: columns }).fill('')
    const [first, ...rest] = head.length > 0 ? head : [emptyHeader]
    return [
      toRow(first ?? []),
      `| ${Array.from<string>({ length: columns }).fill('---').join(' | ')} |`,
      ...rest.map(toRow),
      ...body.map(toRow),
    ].join('\n')
  }

  /**
   * Prefix a rendered block with its own title, if it has one.
   *
   * `include-code::` labels each sample `.Java` / `.Kotlin`, and those titles are
   * the only remaining signal of which language a fence holds once the tabs
   * extension is out of the picture (see ADR-0002). Rendered at the same level as
   * a tab label so both forms read alike.
   */
  const withTitle = (node: AsciidoctorNode, body: string): string => {
    const title = node.getTitle()
    if (title === undefined || title === '')
      return body
    return `${BLOCK_TITLE_LEVEL}${inline(title)}\n\n${body}`
  }

  /**
   * Render one block's own content, without its anchor.
   *
   * `section` renders its heading right after the anchor rather than letting
   * {@link renderBlock} prepend one separately — the heading text has to follow
   * the anchor immediately, and folding both into one join keeps that ordering
   * obviously correct instead of relying on call order between two functions.
   */
  function renderBlockContent(node: AsciidoctorNode, context: string): string {
    switch (context) {
      case 'section': {
        const level = Math.min(node.getLevel() + 1, MAX_HEADING_LEVEL)
        return [
          ...renderAnchor(node.getId()),
          `${'#'.repeat(level)} ${inline(node.getTitle())}`,
          ...renderBlocks(node.getBlocks()),
        ].join('\n\n')
      }
      case 'preamble':
      case 'open':
        return renderChildren(node)
      case 'paragraph':
        return inline(node.getContent())
      case 'listing':
        return withTitle(node, renderListing(node))
      case 'literal':
        return withTitle(node, renderLiteral(node))
      case 'floating_title': {
        // `[discrete]`: a heading deliberately kept out of the section tree, so
        // it owns no blocks — unlike `section`, there are no children to render
        // after it. Its level follows the same convention, one deeper than
        // Asciidoctor reports, so a discrete heading sits at the depth its
        // surrounding prose implies.
        //
        // No anchor here: unlike `section`, this context is not excluded from
        // the generic prepend in {@link renderBlock}, which already emits one
        // immediately before this heading.
        const level = Math.min(node.getLevel() + 1, MAX_HEADING_LEVEL)
        return `${'#'.repeat(level)} ${inline(node.getTitle())}`
      }
      case 'image':
        return withTitle(node, renderImage(node))
      case 'admonition':
        return renderAdmonition(node)
      case 'ulist':
        return renderList(node, '- ')
      case 'olist':
        return renderList(node, '1. ')
      case 'colist':
        // A callout list: the `<1>`, `<2>` … entries under a listing. Rendered
        // as an ordered list so the numbering keeps matching the `// <1>`
        // markers, which survive in the fence because `renderListing` reads
        // `getSource()`. Its items are ordinary `ListItem`s — measured over
        // Spring Framework 6.2.14, every one carries inline text and no nested
        // blocks — so the `olist` rendering applies unchanged.
        return renderList(node, '1. ')
      case 'dlist':
        return renderDefinitionList(node)
      case 'example':
        return node.getStyle() === 'tabs' ? renderTabs(node) : renderChildren(node)
      case 'table':
        return renderTable(node as AsciidoctorTable)
      case 'sidebar':
        return withTitle(node, blockquote(trimChunk(renderBody(node))))
      case 'quote':
        return withTitle(node, renderQuote(node))
      default:
        warn(`unhandled block context "${context}" (style=${node.getStyle() ?? 'none'})`, node)
        return inline(node.getContent())
    }
  }

  /**
   * Render a block, anchoring it first when it carries an explicit `[[id]]`.
   *
   * `section` renders its own anchor inline (see {@link renderBlockContent}) so
   * it is excluded here — anchoring it again would duplicate the id attribute.
   * Every other context (tables, listings, admonitions, …) reaches an explicit
   * id only through this generic path; measured against the real upstream tree
   * that is a small population (roughly 7 of 1,150 explicit anchors), so a
   * single shared prepend covers it without a per-context special case.
   */
  function renderBlock(node: AsciidoctorNode): string {
    const context = node.getContext()
    const body = renderBlockContent(node, context)
    if (context === 'section')
      return body
    return [...renderAnchor(node.getId()), body].join('\n\n')
  }

  const title = inline(doc.getTitle())
  const frontmatter = [
    '---',
    `title: ${yamlString(title)}`,
    `source: ${yamlString(options.sourcePath)}`,
    '---',
  ].join('\n')

  const chunks = [
    frontmatter,
    // The document's own `[[id]]` (its title's anchor) is a cross-page link
    // target too — 143 of 242 measured document-level ids are referenced this
    // way — so it needs the same anchor as a section id.
    ...renderAnchor(doc.getId()),
    ...(title === '' ? [] : [`# ${title}`]),
    ...renderBlocks(doc.getBlocks()),
  ]

  return { markdown: `${chunks.join('\n\n')}\n`, warnings: [...warnings] }
}
