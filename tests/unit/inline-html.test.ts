import { describe, expect, test } from 'bun:test'
import { inlineHtmlToMarkdown } from '../../scripts/lib/inline-html.ts'

describe('inlineHtmlToMarkdown', () => {
  test('converts code, strong and em', () => {
    expect(inlineHtmlToMarkdown('<code>spring</code>')).toBe('`spring`')
    expect(inlineHtmlToMarkdown('<strong>are</strong>')).toBe('**are**')
    expect(inlineHtmlToMarkdown('<em>could</em>')).toBe('*could*')
  })

  test('widens a code span that contains a backtick', () => {
    const result = inlineHtmlToMarkdown('<code>a`b</code>')

    expect(result).toBe('``a`b``')
    expect(result.startsWith('``')).toBe(true)
  })

  test('does not escape Markdown characters inside a code span', () => {
    expect(inlineHtmlToMarkdown('<code>a_b*c</code>')).toBe('`a_b*c`')
  })

  test('escapes Markdown characters in prose', () => {
    expect(inlineHtmlToMarkdown('a_b')).toBe('a\\_b')
    expect(inlineHtmlToMarkdown('[x]')).toBe('\\[x\\]')
  })

  test('converts an external link', () => {
    expect(inlineHtmlToMarkdown('<a href="https://redis.io/">Redis</a>')).toBe(
      '[Redis](https://redis.io/)',
    )
  })

  test('rewrites a resolved xref from .html to .md, leaving the path alone', () => {
    expect(
      inlineHtmlToMarkdown('<a href="../installing.html#cli" class="xref page">text</a>'),
    ).toBe('[text](../installing.md#cli)')
  })

  test('leaves a non-xref .html link untouched', () => {
    // An external javadoc URL must keep its .html extension.
    expect(
      inlineHtmlToMarkdown('<a href="https://docs.example/Foo.html">Foo</a>'),
    ).toBe('[Foo](https://docs.example/Foo.html)')
  })

  test('rewrites a reference into a component that was not built', () => {
    const result = inlineHtmlToMarkdown(
      '<a href="#maven-plugin:build-image.adoc#build-image" class="xref page">build</a>',
      { externalComponents: { 'maven-plugin': 'https://docs.example/maven-plugin' } },
    )

    expect(result).toBe('[build](https://docs.example/maven-plugin/build-image.html#build-image)')
  })

  test('leaves a dangling component reference alone when it has no mapping', () => {
    expect(
      inlineHtmlToMarkdown('<a href="#other:x.adoc" class="xref page">x</a>'),
    ).toBe('[x](#other:x.adoc)')
  })

  test('does not misread a query string as an attribute', () => {
    // A naive \\b([a-z-]+)= scan reads "language" as an attribute here.
    expect(
      inlineHtmlToMarkdown('<a href="https://start.spring.io/#!language=kotlin">start</a>'),
    ).toBe('[start](https://start.spring.io/#!language=kotlin)')
  })

  test('emits an inline anchor with an id instead of dropping it', () => {
    // GFM generates nothing for a non-heading anchor, so a config-property
    // self-link (e.g. the application-properties appendix) has no other target.
    expect(inlineHtmlToMarkdown('<a id="section.id"></a>text')).toBe('<a id="section.id"></a>text')
  })

  test('unwraps an anchor with neither href nor id to its children', () => {
    expect(inlineHtmlToMarkdown('<a>text</a>')).toBe('text')
  })

  test('escapes the id of an inline anchor', () => {
    expect(inlineHtmlToMarkdown('<a id="a&b&quot;c"></a>')).toBe('<a id="a&amp;b&quot;c"></a>')
  })

  test('decodes named and numeric entities', () => {
    expect(inlineHtmlToMarkdown('&lt;tag&gt; &amp; &quot;q&quot;')).toBe('<tag> & "q"')
    expect(inlineHtmlToMarkdown('&#8217;')).toBe('’')
    expect(inlineHtmlToMarkdown('&#x2019;')).toBe('’')
  })

  test('turns a line break into a newline', () => {
    expect(inlineHtmlToMarkdown('a<br>b')).toBe('a\nb')
    expect(inlineHtmlToMarkdown('a<br/>b')).toBe('a\nb')
  })

  test('keeps sub and sup, which GFM cannot express', () => {
    expect(inlineHtmlToMarkdown('x<sub>1</sub>')).toBe('x<sub>1</sub>')
    expect(inlineHtmlToMarkdown('x<sup>2</sup>')).toBe('x<sup>2</sup>')
  })

  test('reports an unknown tag instead of dropping it silently', () => {
    const seen: string[] = []
    const result = inlineHtmlToMarkdown('<mark>kept</mark>', { onUnknownTag: t => seen.push(t) })

    expect(seen).toEqual(['mark'])
    expect(result).toBe('kept')
  })

  test('returns an empty string for empty input', () => {
    expect(inlineHtmlToMarkdown('')).toBe('')
  })
})
