import type { ConvertOptions } from '../../scripts/lib/markdown-converter.ts'
import { describe, expect, test } from 'bun:test'
import Asciidoctor from '@asciidoctor/core'
import { convertDocument } from '../../scripts/lib/markdown-converter.ts'

const asciidoctor = Asciidoctor()

/** Convert an AsciiDoc fragment the way the pipeline would. */
function convert(source: string, options: Partial<ConvertOptions> = {}) {
  const doc = asciidoctor.load(source, { safe: 'safe' })
  return convertDocument(doc, { sourcePath: 'reference:test.adoc', ...options })
}

describe('document frontmatter', () => {
  test('emits the title and source path, and nothing time-dependent', () => {
    const { markdown } = convert('= Developer Tools\n\nBody.')

    expect(markdown.startsWith('---\n')).toBe(true)
    expect(markdown).toContain('title: "Developer Tools"')
    expect(markdown).toContain('source: "reference:test.adoc"')
    // Determinism invariant: no timestamps in converted content.
    expect(markdown).not.toMatch(/\d{4}-\d{2}-\d{2}T/)
  })

  test('quotes a title containing a double quote', () => {
    const { markdown } = convert('= A "quoted" title\n\nBody.')

    expect(markdown).toContain('title: "A \\"quoted\\" title"')
  })

  test('ends with exactly one newline', () => {
    const { markdown } = convert('= T\n\nBody.')

    expect(markdown.endsWith('Body.\n')).toBe(true)
  })

  test('never emits three consecutive newlines', () => {
    const { markdown } = convert('= T\n\nOne.\n\n== S\n\nTwo.\n\n=== S2\n\nThree.')

    expect(markdown).not.toContain('\n\n\n')
  })

  test('renders an anchor before the document title when it has an explicit id', () => {
    // 143 of 242 measured document-level ids are cross-page link targets.
    const { markdown } = convert('[[my.page.id]]\n= T\n\nBody.')

    expect(markdown).toContain('<a id="my.page.id"></a>\n\n# T')
  })
})

describe('headings', () => {
  test('shifts section levels one deeper than the document title', () => {
    const { markdown } = convert('= T\n\n== Level One\n\n=== Level Two')

    expect(markdown).toContain('## Level One')
    expect(markdown).toContain('### Level Two')
  })

  test('renders an anchor before a section with an explicit id', () => {
    const { markdown } = convert('= T\n\n[[my.section.id]]\n== Level One')

    expect(markdown).toContain('<a id="my.section.id"></a>\n\n## Level One')
  })

  test('renders a section without an id exactly as before', () => {
    // Asciidoctor auto-assigns section ids by default; :sectids!: is the only
    // way to get a section with none, exercising the "no id" branch.
    const { markdown } = convert(':sectids!:\n\n= T\n\n== Level One')

    expect(markdown).not.toContain('<a id=')
    expect(markdown).toContain('## Level One')
  })
})

describe('admonitions', () => {
  test('converts a simple admonition to a GFM alert', () => {
    const { markdown } = convert('= T\n\nNOTE: Be careful.')

    expect(markdown).toContain('> [!NOTE]\n> Be careful.')
  })

  test('maps every admonition style', () => {
    for (const style of ['TIP', 'WARNING', 'CAUTION', 'IMPORTANT']) {
      expect(convert(`= T\n\n${style}: Text.`).markdown).toContain(`> [!${style}]`)
    }
  })

  test('recurses into a compound admonition instead of flattening it to HTML', () => {
    // getContent() on a compound block returns <div class="listingblock">…</div>.
    const { markdown } = convert(`= T

[NOTE]
====
Leading text.

[source,java]
----
int x = 1;
----
====`)

    expect(markdown).toContain('> [!NOTE]')
    expect(markdown).toContain('> ```java')
    expect(markdown).toContain('> int x = 1;')
    expect(markdown).not.toContain('<div')
  })
})

describe('code blocks', () => {
  test('fences a source block with its language', () => {
    const { markdown } = convert('= T\n\n[source,java]\n----\nint x = 1;\n----')

    expect(markdown).toContain('```java\nint x = 1;\n```')
  })

  test('widens the fence when the body contains a fence', () => {
    const { markdown } = convert('= T\n\n[source,markdown]\n----\n```\nnested\n```\n----')

    expect(markdown).toContain('````markdown')
  })

  test('strips code-folding directives left in the raw source', () => {
    const { markdown } = convert(`= T

[source,java]
----
class A {
\t// @fold:on // ...
\tint x = 1;
\t// @fold:off
}
----`)

    expect(markdown).not.toContain('@fold')
    expect(markdown).toContain('int x = 1;')
  })

  test('renders a block title as a heading, so the sample language survives', () => {
    // include-code:: labels samples .Java / .Kotlin when the tabs extension is absent.
    const { markdown } = convert('= T\n\n.Java\n[source,java]\n----\nint x = 1;\n----')

    expect(markdown).toContain('#### Java')
  })
})

describe('lists', () => {
  test('converts unordered and ordered lists', () => {
    expect(convert('= T\n\n* one\n* two').markdown).toContain('- one\n- two')
    expect(convert('= T\n\n. one\n. two').markdown).toContain('1. one\n1. two')
  })

  test('indents a nested list under its parent item', () => {
    const { markdown } = convert('= T\n\n* outer\n** inner')

    expect(markdown).toContain('- outer')
    expect(markdown).toContain('  - inner')
  })
})

describe('definition lists', () => {
  test('renders terms and descriptions without tripping over item pairs', () => {
    // Trap: dlist.getBlocks() returns [terms, description] pairs, not nodes.
    const { markdown, warnings } = convert('= T\n\nMaven:: Use the plugin.\nGradle:: Use the task.')

    expect(markdown).toContain('**Maven**')
    expect(markdown).toContain('Use the plugin.')
    expect(markdown).toContain('**Gradle**')
    expect(warnings).toEqual([])
  })
})

describe('tab groups', () => {
  test('converts a [tabs] block to headed code fences', () => {
    const { markdown } = convert(`= T

[tabs]
======
Maven::
+
[source,xml]
----
<dependency/>
----
Gradle::
+
[source,gradle]
----
implementation("x")
----
======`)

    expect(markdown).toContain('#### Maven')
    expect(markdown).toContain('```xml')
    expect(markdown).toContain('#### Gradle')
    expect(markdown).toContain('```gradle')
    expect(markdown).not.toContain('<div')
  })
})

describe('tables', () => {
  test('converts a table with a header row', () => {
    const { markdown } = convert(`= T

[cols="1,1"]
|===
| Name | Value

| a | 1
|===`)

    expect(markdown).toContain('| Name | Value |')
    expect(markdown).toContain('| --- | --- |')
    expect(markdown).toContain('| a | 1 |')
  })

  test('synthesizes a header row when the table has none', () => {
    const { markdown } = convert('= T\n\n|===\n| a | b\n|===')

    // GFM cannot parse a table without a header row.
    expect(markdown).toContain('| --- | --- |')
  })

  test('escapes a pipe inside a cell', () => {
    const { markdown } = convert('= T\n\n|===\n| a \\| b | c\n|===')

    expect(markdown).toContain('\\|')
  })
})

describe('sidebars', () => {
  test('renders a sidebar as a blockquote', () => {
    const { markdown } = convert('= T\n\n.Gradle Wrapper\n****\nSidebar text.\n****')

    expect(markdown).toContain('#### Gradle Wrapper')
    expect(markdown).toContain('> Sidebar text.')
  })
})

describe('warnings', () => {
  test('reports an unhandled construct rather than dropping it silently', () => {
    const { warnings } = convert('= T\n\n[quote]\n____\nQuoted.\n____')

    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings.some(w => w.includes('quote'))).toBe(true)
  })

  test('is silent for a page it fully understands', () => {
    const { warnings } = convert('= T\n\nText.\n\nNOTE: note.\n\n* a\n* b')

    expect(warnings).toEqual([])
  })
})

describe('determinism', () => {
  test('produces byte-identical output across runs', () => {
    const source = '= T\n\nText with `code`.\n\nNOTE: note.\n\n[source,java]\n----\nint x = 1;\n----'

    expect(convert(source).markdown).toBe(convert(source).markdown)
  })
})
