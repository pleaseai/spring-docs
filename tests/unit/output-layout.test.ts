import type { AntoraPage } from '../../scripts/lib/antora-types.ts'
import { describe, expect, test } from 'bun:test'
import {
  assertUniquePaths,
  buildIndex,
  INDEX_FILENAME,
  outputPathFor,
} from '../../scripts/lib/output-layout.ts'

function page(module: string, relative: string): AntoraPage {
  return {
    src: { component: 'boot', version: '4.1.1', module, relative, family: 'page' },
  }
}

describe('outputPathFor', () => {
  test('ROOT pages land at the tree root with a .md extension', () => {
    expect(outputPathFor(page('ROOT', 'index.adoc'))).toBe('index.md')
  })

  test('nested ROOT pages keep their source path', () => {
    expect(outputPathFor(page('ROOT', 'how-to/actuator.adoc'))).toBe('how-to/actuator.md')
  })

  test('non-ROOT modules are prefixed with the module name', () => {
    expect(outputPathFor(page('cli', 'installation.adoc'))).toBe('cli/installation.md')
  })

  test('only the trailing .adoc is replaced', () => {
    expect(outputPathFor(page('ROOT', 'x.adoc.d/y.adoc'))).toBe('x.adoc.d/y.md')
  })
})

describe('assertUniquePaths', () => {
  test('accepts distinct paths', () => {
    expect(() => assertUniquePaths(['index.md', 'cli/index.md', INDEX_FILENAME])).not.toThrow()
  })

  test('rejects two pages that map onto the same path', () => {
    expect(() => assertUniquePaths(['guide/nested.md', 'guide/nested.md']))
      .toThrow(/collision/)
  })

  test('rejects paths differing only in case, which collide on macOS but not Linux', () => {
    expect(() => assertUniquePaths(['index.md', 'INDEX.md']))
      .toThrow(/case-insensitively/)
  })

  test('names both colliding paths so the offending page can be found', () => {
    expect(() => assertUniquePaths(['a/Page.md', 'a/page.md']))
      .toThrow(/"a\/Page\.md" and "a\/page\.md"/)
  })

  test('the generated listing does not collide with a converted index page', () => {
    expect(() => assertUniquePaths(['index.md', INDEX_FILENAME])).not.toThrow()
  })
})

describe('buildIndex', () => {
  test('lists every page, sorted, regardless of input order', () => {
    const index = buildIndex('boot', '4.1.1', ['z.md', 'a.md'])
    expect(index).toBe(
      '# boot 4.1.1\n'
      + '\n'
      + '2 pages, converted from upstream Spring AsciiDoc.\n'
      + '\n'
      + '- [a](./a.md)\n'
      + '- [z](./z.md)\n',
    )
  })

  test('is deterministic for the same set of pages in any order', () => {
    const paths = ['cli/index.md', 'index.md', 'how-to/a.md']
    expect(buildIndex('boot', '4.1.1', paths)).toBe(
      buildIndex('boot', '4.1.1', [...paths].reverse()),
    )
  })

  test('handles an empty tree without emitting a stray list', () => {
    expect(buildIndex('boot', '4.1.1', [])).toBe(
      '# boot 4.1.1\n\n0 pages, converted from upstream Spring AsciiDoc.\n\n',
    )
  })
})
