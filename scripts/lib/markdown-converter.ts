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
import { escapeHtmlAttribute, inlineHtmlToMarkdown } from './inline-html.ts'

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

/** Heading level used for a block's own title, matching tab labels. */
const BLOCK_TITLE_LEVEL = '#### '

/** Deepest ATX heading GFM defines. */
const MAX_HEADING_LEVEL = 6

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

  const inline = (html: string | undefined): string =>
    inlineHtmlToMarkdown(html ?? '', {
      externalComponents: options.externalComponents,
      onUnknownTag: tag => warnings.add(`unknown inline tag <${tag}>`),
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

  const renderListing = (node: AsciidoctorNode): string => {
    // `getSource()`, not `getContent()`: the latter carries the code-folding
    // extension's `<span class="fold-block">` wrappers. The raw source instead
    // carries the fold directives themselves, which are stripped here.
    const body = node.getSource().replace(FOLD_DIRECTIVE, '').replace(BLANK_LINE_RUN, '\n')
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

  const renderListItem = (item: AsciidoctorListItem, marker: string): string => {
    const text = inline(item.getText())
    const nested = renderBlocks(item.getBlocks())
    const head = `${marker}${text}`
    if (nested.length === 0)
      return head
    const padding = ' '.repeat(marker.length)
    return [head, ...nested.map(chunk => indent(chunk, padding))].join('\n\n')
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
      case 'admonition':
        return renderAdmonition(node)
      case 'ulist':
        return renderList(node, '- ')
      case 'olist':
        return renderList(node, '1. ')
      case 'dlist':
        return renderDefinitionList(node)
      case 'example':
        return node.getStyle() === 'tabs' ? renderTabs(node) : renderChildren(node)
      case 'table':
        return renderTable(node as AsciidoctorTable)
      case 'sidebar':
        return withTitle(node, blockquote(trimChunk(renderBody(node))))
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
