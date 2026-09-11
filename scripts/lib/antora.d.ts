/**
 * Ambient module declarations for the untyped Antora packages.
 *
 * This file must stay free of top-level `import`/`export`: those would turn it
 * into a module, and its `declare module` blocks would be read as augmentations
 * of packages that have no declarations to augment — silently leaving every
 * Antora import as `any`. Structural types live in `antora-types.ts` and are
 * referenced here through `import(...)` type queries.
 */

declare module '@antora/playbook-builder' {
  const buildPlaybook: (
    args: string[],
    env: Record<string, string | undefined>,
    schema?: unknown,
  ) => Record<string, unknown>
  export = buildPlaybook
}

declare module '@antora/content-aggregator' {
  const aggregateContent: (playbook: unknown) => Promise<unknown>
  export = aggregateContent
}

declare module '@antora/content-classifier' {
  const classifyContent: (
    playbook: unknown,
    aggregate: unknown,
    asciidocConfig?: unknown,
  ) => import('./antora-types.ts').ContentCatalog
  export = classifyContent
}

declare module '@antora/asciidoc-loader' {
  const loadAsciiDoc: {
    (
      page: import('./antora-types.ts').AntoraPage,
      catalog: import('./antora-types.ts').ContentCatalog,
      config: unknown,
    ): import('./antora-types.ts').AsciidoctorNode
    resolveConfig: (playbook: unknown) => unknown
  }
  export = loadAsciiDoc
}

declare module '@asciidoctor/core' {
  /** Factory returning an Asciidoctor instance. Used by tests to build real AST nodes. */
  const Asciidoctor: () => {
    load: (
      input: string,
      options?: Record<string, unknown>,
    ) => import('./antora-types.ts').AsciidoctorNode
  }
  export = Asciidoctor
}
