import { describe, expect, test } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { componentNameOf, overlayDescriptor, renderDescriptor } from '../../scripts/lib/component-descriptor.ts'

describe('renderDescriptor', () => {
  test('renders name, quoted version and the attribute block', () => {
    expect(renderDescriptor('spring-boot', '3.5.16', false, { 'version-graal': '22.3' })).toBe(
      `name: spring-boot\nversion: '3.5.16'\nasciidoc:\n  attributes:\n    version-graal: '22.3'\n`,
    )
  })

  test('quotes the version, so a trailing-zero patch stays a string', () => {
    // Bare `4.10` is a YAML float and loads as 4.1, which would silently point
    // the whole component at a version that was never built.
    expect(renderDescriptor('c', '4.10', false, {})).toContain(`version: '4.10'`)
  })

  test('doubles a single quote inside a value rather than ending the scalar', () => {
    // Upstream link templates carry apostrophes; an unescaped one closes the
    // scalar and makes the rest of the line YAML syntax.
    expect(renderDescriptor('c', '1.0.0', false, { note: `it's here` }))
      .toContain(`    note: 'it''s here'\n`)
  })

  test('keeps a value containing YAML metacharacters intact', () => {
    const url = 'https://example.com/a#b{c}%s'

    expect(renderDescriptor('c', '1.0.0', false, { 'url-x': url })).toContain(`    url-x: '${url}'\n`)
  })

  test('declares nav only when the component has one', () => {
    expect(renderDescriptor('c', '1.0.0', true, {})).toContain('nav:\n- nav.adoc\n')
    expect(renderDescriptor('c', '1.0.0', false, {})).not.toContain('nav:')
  })

  test('emits the attribute block even with no attributes', () => {
    // Antora reads `asciidoc.attributes`; omitting the key entirely is a
    // different document shape from an empty one.
    expect(renderDescriptor('c', '1.0.0', false, {})).toBe(
      `name: c\nversion: '1.0.0'\nasciidoc:\n  attributes:\n`,
    )
  })

  test('ends with exactly one trailing newline', () => {
    const rendered = renderDescriptor('c', '1.0.0', false, { a: '1' })

    expect(rendered.endsWith('\n')).toBe(true)
    expect(rendered.endsWith('\n\n')).toBe(false)
  })
})

describe('componentNameOf', () => {
  /** Write `antora.yml` into a fresh directory and read its name back. */
  async function nameOf(stub: string): Promise<string> {
    const root = await mkdtemp(join(tmpdir(), 'component-descriptor-'))
    try {
      await writeFile(join(root, 'antora.yml'), stub)
      return await componentNameOf(root)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  }

  test('reads the name from the stub', async () => {
    expect(await nameOf('name: spring-boot\nversion: true\n')).toBe('spring-boot')
  })

  test('reads a name that is not on the first line', async () => {
    expect(await nameOf('# comment\nversion: true\nname: spring-boot\n')).toBe('spring-boot')
  })

  test('tolerates tabs and extra spaces after the colon', async () => {
    expect(await nameOf('name:\t  spring-boot\n')).toBe('spring-boot')
  })

  test('ignores an indented name:, which belongs to a nested mapping', async () => {
    // Anchoring at column 0 is what keeps `ext:`/`nav:` sub-keys and attribute
    // values from being read as the component name.
    expect(await nameOf('ext:\n  collector:\n    name: not-the-component\nname: spring-boot\n'))
      .toBe('spring-boot')
  })

  test('throws when the stub declares no name, naming the file it read', async () => {
    await expect(nameOf('version: true\n')).rejects.toThrow(/antora\.yml/)
  })
})

describe('overlayDescriptor', () => {
  /** The shape `io.spring.antora.generate-antora-yml` merges into. */
  const CHECKED_IN = `name: framework
version: true
title: Spring Framework
nav:
  - modules/ROOT/nav.adoc
ext:
  collector:
    run:
      command: gradlew :framework-docs:generateAntoraResources
      local: true
    scan:
      dir: ./build/generated-antora-resources
asciidoc:
  attributes:
    attribute-missing: 'warn'
    include-java: 'example$docs-src/main/java/org/springframework/docs'
    docs-spring: "{docs-site}/spring-framework/docs/{spring-version}"
`

  test('resolves the version placeholder the build would have filled in', () => {
    const out = overlayDescriptor(CHECKED_IN, '6.2.14', {})

    // `version: true` means "take it from the build"; nothing downstream
    // resolves it, so it has to be replaced here.
    expect(out).toContain('version: \'6.2.14\'')
    expect(out).not.toContain('version: true')
  })

  test('keeps every committed attribute', () => {
    const out = overlayDescriptor(CHECKED_IN, '6.2.14', {})

    // Rebuilding from scratch, as the synthesized era does, would drop these.
    expect(out).toContain('attribute-missing: \'warn\'')
    expect(out).toContain('include-java: \'example$docs-src/main/java/org/springframework/docs\'')
    expect(out).toContain('docs-spring: \'{docs-site}/spring-framework/docs/{spring-version}\'')
  })

  test('adds the generated attributes alongside them', () => {
    expect(overlayDescriptor(CHECKED_IN, '6.2.14', { 'spring-version': '6.2.14' }))
      .toContain('spring-version: \'6.2.14\'')
  })

  test('lets a generated attribute win over a committed one, as the plugin does', () => {
    // The Gradle plugin applies `asciidocAttributes` on top of the file's own.
    const out = overlayDescriptor(CHECKED_IN, '6.2.14', { 'attribute-missing': 'skip' })

    expect(out).toContain('attribute-missing: \'skip\'')
    expect(out).not.toContain('attribute-missing: \'warn\'')
  })

  test('preserves the component name, title and nav', () => {
    const out = overlayDescriptor(CHECKED_IN, '6.2.14', {})

    expect(out).toContain('name: framework')
    expect(out).toContain('title: \'Spring Framework\'')
    expect(out).toContain('- \'modules/ROOT/nav.adoc\'')
  })

  test('drops the collector, whose command is what this era avoids running', () => {
    const out = overlayDescriptor(CHECKED_IN, '6.2.14', {})

    expect(out).not.toContain('collector')
    expect(out).not.toContain('gradlew')
  })

  test('drops prerelease, since only GA versions are built', () => {
    const out = overlayDescriptor('name: ai\nversion: true\nprerelease: true\n', '2.0.0', {})

    expect(out).not.toContain('prerelease')
  })

  test('writes a boolean attribute bare, so Antora still reads it as unset', () => {
    // Quoting it would set the attribute to the truthy string "false".
    const out = overlayDescriptor(
      'name: data-jpa\nversion: true\nasciidoc:\n  attributes:\n    include-xml-namespaces: false\n',
      '4.1.1',
      {},
    )

    expect(out).toContain('include-xml-namespaces: false')
    expect(out).not.toContain('\'false\'')
  })

  test('escapes a quote inside an attribute value', () => {
    const out = overlayDescriptor(
      'name: x\nversion: true\nasciidoc:\n  attributes:\n    quoted: "it\'s"\n',
      '1.0.0',
      {},
    )

    expect(out).toContain('quoted: \'it\'\'s\'')
  })

  test('survives a descriptor with no asciidoc block at all', () => {
    // Spring AI's committed descriptor carries none.
    const out = overlayDescriptor('name: ai\nversion: true\ntitle: Spring AI\n', '2.0.0', {
      'spring-ai-version': '2.0.0',
    })

    expect(out).toContain('name: ai')
    expect(out).toContain('spring-ai-version: \'2.0.0\'')
  })

  test('refuses a descriptor with no component name', () => {
    expect(() => overlayDescriptor('version: true\n', '1.0.0', {})).toThrow(/component name/)
  })

  test('refuses a descriptor that is not a mapping', () => {
    expect(() => overlayDescriptor('- one\n- two\n', '1.0.0', {})).toThrow(/mapping/)
  })
})
