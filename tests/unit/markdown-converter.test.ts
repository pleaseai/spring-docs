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

  test('renders exactly one anchor for a section with an explicit id', () => {
    // renderBlock's generic anchor prepend must not duplicate the one
    // renderBlockContent already emits inline for the section case.
    const { markdown } = convert('= T\n\n[[my.section.id]]\n== Level One')

    expect(markdown.match(/<a id="my\.section\.id">/g)).toHaveLength(1)
  })
})

describe('non-section anchors', () => {
  test('renders an anchor before a table with an explicit id', () => {
    // A minority of explicit anchors (~7 of 1,150 on the real upstream tree)
    // sit on something other than a heading; an xref into one must not dangle.
    const { markdown } = convert('= T\n\n[[my.table.id]]\n|===\n| A | B\n|===')

    expect(markdown).toContain('<a id="my.table.id"></a>\n\n|  |  |')
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

describe('quote blocks', () => {
  test('renders a bare quote as a blockquote', () => {
    // Spring Framework 7.0.x and 6.2.19 quote a log message this way; no
    // earlier line in either corpus writes a `[quote]` at all.
    const { markdown, warnings } = convert('= T\n\n[quote]\nBean \'someBean\' is not eligible.')

    expect(markdown).toContain('> Bean \'someBean\' is not eligible.')
    expect(warnings).toEqual([])
  })

  test('keeps the attribution and citation inside the quote', () => {
    const { markdown } = convert('= T\n\n[quote, Rod Johnson, J2EE Design and Development]\n____\nQuoted.\n____')

    expect(markdown).toContain('> Quoted.')
    expect(markdown).toContain('> — Rod Johnson, J2EE Design and Development')
  })

  test('renders a compound quote through its child blocks', () => {
    const { markdown, warnings } = convert('= T\n\n[quote]\n____\nFirst.\n\nNOTE: second.\n____')

    expect(markdown).toContain('> First.')
    expect(markdown).toContain('> > [!NOTE]')
    expect(warnings).toEqual([])
  })
})

describe('warnings', () => {
  test('reports an unhandled construct rather than dropping it silently', () => {
    const { warnings } = convert('= T\n\n[verse]\n____\nLine one.\n____')

    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings.some(w => w.includes('verse'))).toBe(true)
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

describe('callout lists', () => {
  test('renders as an ordered list, keeping the numbering the markers use', () => {
    const { markdown, warnings } = convert(`
[source,java]
----
route(); // <1>
----
<1> Create router using \`route()\`.
<2> Then use it.
`)

    // The `// <1>` markers survive in the fence because listings are read from
    // `getSource()`, so the list has to number the same way to stay readable.
    expect(markdown).toContain('1. Create router using `route()`.')
    expect(markdown).toContain('1. Then use it.')
    expect(warnings).toEqual([])
  })
})

describe('literal blocks', () => {
  test('fences the substituted text, not the raw source', () => {
    // Verbatim from `core/resources.adoc`: `\*` is AsciiDoc's escape for a
    // literal `*`, and reading `getSource()` would keep the backslash and print
    // a path nobody can copy.
    const { markdown, warnings } = convert(`
[literal,subs="verbatim,quotes"]
----
/WEB-INF/\\*-context.xml
com/mycompany/\\**/applicationContext.xml
----
`)

    // The rule under test is which accessor is read, so the assertion is that
    // the escape is gone — not how Asciidoctor pairs the remaining `*` runs,
    // which depends on the whole block and is its behaviour, not ours.
    expect(markdown).toContain('/WEB-INF/*-context.xml')
    expect(markdown).not.toContain('/WEB-INF/\\*-context.xml')
    expect(markdown).toContain('```')
    expect(warnings).toEqual([])
  })

  test('decodes entities rather than building Markdown inside the fence', () => {
    const { markdown } = convert('....\na < b && c > d\n....')

    expect(markdown).toContain('a < b && c > d')
    expect(markdown).not.toContain('&lt;')
  })
})

describe('discrete headings', () => {
  test('renders the heading without opening a section', () => {
    const { markdown, warnings } = convert(`
== Real Section

[discrete]
=== Constructor argument index

Body.
`)

    // Level 2 heading + 1, the same convention `section` uses.
    expect(markdown).toContain('### Constructor argument index')
    // Anchored exactly once: the generic prepend covers this context.
    expect(markdown.match(/<a id="_constructor_argument_index"><\/a>/g)).toHaveLength(1)
    expect(warnings).toEqual([])
  })
})

describe('block images', () => {
  test('links to the published, version-pinned image', () => {
    const { markdown, warnings } = convert('image::message-flow.png[Message flow]', {
      imageBase: 'https://docs.spring.io/spring-framework/reference/6.2.14/_images',
    })

    expect(markdown).toContain(
      '![Message flow](https://docs.spring.io/spring-framework/reference/6.2.14/_images/message-flow.png)',
    )
    expect(warnings).toEqual([])
  })

  test('does not double a slash when the base carries one', () => {
    const { markdown } = convert('image::a.png[]', { imageBase: 'https://example.test/_images/' })

    expect(markdown).toContain('(https://example.test/_images/a.png)')
  })

  test('warns rather than guessing when no image base is configured', () => {
    // A release archive carries Markdown only, so a relative link would dangle.
    const { markdown, warnings } = convert('image::a.png[Diagram]')

    expect(warnings.join(' ')).toContain('no published image base')
    expect(markdown).toContain('![Diagram]()')
  })
})

describe('role spans', () => {
  test('keeps the content and drops the presentational wrapper', () => {
    // `[.small]#…#` renders as <span class="small">, which has no GFM equivalent.
    const { markdown, warnings } = convert('[.small]#just text#')

    expect(markdown).toContain('just text')
    expect(markdown).not.toContain('<span')
    expect(warnings).toEqual([])
  })
})

describe('tab groups written by hand', () => {
  test('renders a description that carries only blocks', () => {
    // `Java::` then `+` then the listing: the description has no inline text,
    // and Asciidoctor returns Ruby nil for it, which crosses into JS as an
    // object rather than undefined.
    const { markdown, warnings } = convert(`
[tabs]
======
Java::
+
[source,java]
----
var x = 1;
----

Kotlin::
+
[source,kotlin]
----
val x = 1
----
======
`)

    expect(markdown).toContain('#### Java')
    expect(markdown).toContain('var x = 1;')
    expect(markdown).toContain('#### Kotlin')
    expect(markdown).toContain('val x = 1')
    expect(warnings).toEqual([])
  })
})

describe('listings that declare attribute substitution', () => {
  test('resolves the attributes, so a copied snippet carries the version', () => {
    // How every project writes its "add the dependency" snippet. The raw source
    // is the one text where substitution has not happened yet, and it is what
    // listings are otherwise read from.
    const { markdown } = convert(`= T
:spring-security-version: 6.5.6

[source,xml,subs="verbatim,attributes"]
----
<version>{spring-security-version}</version>
----`)

    expect(markdown).toContain('<version>6.5.6</version>')
    expect(markdown).not.toContain('{spring-security-version}')
  })

  test('leaves a plain listing untouched, placeholders included', () => {
    // A code sample's own braces are content: substituting them would rewrite
    // the program the reader is meant to copy.
    const { markdown } = convert(`= T
:name: resolved

[source,java]
----
String greeting = "Hello, {name}";
----`)

    expect(markdown).toContain('"Hello, {name}"')
  })

  test('sees an attribute set in the body, not only in the header', () => {
    // Spring Data JPA's projections page sets this after its title, right before
    // the listings that read it. The parser leaves a body entry for conversion
    // to replay, so a walker that never replays it published the literal.
    const { markdown } = convert(`= T

:projection-collection: Collection

[source,java,subs="+attributes"]
----
{projection-collection}<Person> findByLastname(String lastname);
----`)

    expect(markdown).toContain('Collection<Person> findByLastname')
  })

  test('applies a body entry from where it appears onwards, as upstream does', () => {
    const { markdown } = convert(`= T
:store: Header

Before: {store}.

:store: Jpa

After: {store}.`)

    expect(markdown).toContain('Before: Header.')
    expect(markdown).toContain('After: Jpa.')
  })
})

describe('inline images', () => {
  const imageBase = 'https://example.test/images'

  test('links to the published, version-pinned base', () => {
    // Antora resolves the src against the page's depth, so it arrives as
    // `../_images/…` rather than as the target the AsciiDoc wrote.
    const { markdown, warnings } = convert('= T\n\nStep image:icons/number_1.png[number 1] first.', {
      imageBase,
    })

    expect(markdown).toContain('![number 1](https://example.test/images/icons/number_1.png)')
    expect(warnings).toEqual([])
  })

  test('keeps the alt text and reports the drop when no base is configured', () => {
    const { markdown, warnings } = convert('= T\n\nStep image:icons/number_1.png[number 1] first.')

    expect(markdown).toContain('![number 1]()')
    expect(warnings.some(w => w.includes('inline image'))).toBe(true)
  })

  test('leaves an absolute image URL alone', () => {
    const { markdown, warnings } = convert(
      '= T\n\nBadge image:https://img.example/badge.svg[build] here.',
      { imageBase },
    )

    expect(markdown).toContain('![build](https://img.example/badge.svg)')
    expect(warnings).toEqual([])
  })
})
