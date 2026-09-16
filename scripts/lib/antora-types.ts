/**
 * Structural types for the Antora pipeline and the Asciidoctor AST.
 *
 * Antora 3.2 ships no type declarations. These cover only the surface this
 * pipeline uses (see ADR-0002); they are deliberately narrow rather than complete.
 * Module declarations for the untyped packages live in `antora.d.ts`.
 */

/** An Asciidoctor AST node, as exposed by the Opal-backed API. */
export interface AsciidoctorNode {
  getContext: () => string
  getStyle: () => string | undefined
  getNodeName: () => string
  getId: () => string | undefined
  getTitle: () => string | undefined
  getContent: () => string | undefined
  getSource: () => string
  getText: () => string
  getLevel: () => number
  getBlocks: () => AsciidoctorNode[]
  getItems: () => unknown[]
  getAttribute: (name: string, fallback?: unknown) => unknown
  getLineNumber: () => number | undefined
  hasBlocks?: () => boolean
  /** Whether this block declares one of AsciiDoc's substitution groups. */
  hasSubstitution?: (name: string) => boolean
  /** Apply named substitutions to text, the way Asciidoctor itself would. */
  applySubstitutions?: (text: string, subs: readonly string[]) => string
}

/** A table cell. */
export interface AsciidoctorTableCell {
  getText: () => string
  getStyle: () => string | undefined
  getInnerDocument: () => AsciidoctorNode | undefined
  getColumnSpan?: () => number | undefined
}

/** A table node. */
export interface AsciidoctorTable extends AsciidoctorNode {
  getHeadRows: () => AsciidoctorTableCell[][]
  getBodyRows: () => AsciidoctorTableCell[][]
}

/** A list item, which carries both inline text and optional nested blocks. */
export interface AsciidoctorListItem extends AsciidoctorNode {
  getText: () => string
}

/** Antora's virtual file for one page. */
export interface AntoraPage {
  src: {
    component: string
    version: string
    module: string
    relative: string
    family: string
  }
  out?: { path: string }
  pub?: { url: string }
}

/** Antora's content catalog. */
export interface ContentCatalog {
  getPages: (filter?: (page: AntoraPage) => boolean) => AntoraPage[]
  getComponentVersion: (component: string, version: string) => { asciidoc: unknown }
}
