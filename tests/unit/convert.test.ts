import { describe, expect, test } from 'bun:test'
import { externalXrefComponent, isAcceptedLoss, parseArgs, playbookFor } from '../../scripts/convert.ts'

describe('parseArgs', () => {
  test('parses the required options with a separate-value form and defaults strict to false', () => {
    const args = parseArgs(['dist/upstream/boot-4.1.1', '--project', 'boot', '--version', '4.1.1', '--out', 'dist'])

    expect(args).toEqual({
      source: 'dist/upstream/boot-4.1.1',
      project: 'boot',
      version: '4.1.1',
      out: 'dist',
      strict: false,
    })
  })

  test('accepts the --key=value form', () => {
    const args = parseArgs(['src', '--project=boot', '--version=4.1.1', '--out=dist'])

    expect(args).toEqual({ source: 'src', project: 'boot', version: '4.1.1', out: 'dist', strict: false })
  })

  test('--strict sets strict to true', () => {
    const args = parseArgs(['src', '--project', 'boot', '--version', '4.1.1', '--out', 'dist', '--strict'])

    expect(args.strict).toBe(true)
  })

  test('throws when a required option is missing', () => {
    expect(() => parseArgs(['src', '--version', '4.1.1', '--out', 'dist']))
      .toThrow(/Usage: convert\.ts/)
  })

  test('throws when the source positional is missing', () => {
    expect(() => parseArgs(['--project', 'boot', '--version', '4.1.1', '--out', 'dist']))
      .toThrow(/Usage: convert\.ts/)
  })
})

describe('playbookFor', () => {
  test('reads a template era\'s companion as a second start path of the same source', () => {
    // `include::{commons}@data-commons::page$…[]` resolves only when the
    // included component is in the catalog, and it sits under `_companion/`.
    const yaml = Bun.YAML.parse(playbookFor('/src', 'https://javadoc.test', true)) as {
      content: { sources: Record<string, unknown>[] }
    }

    expect(yaml.content.sources).toEqual([
      { url: '/src', branches: 'HEAD', start_paths: ['.', '_companion'] },
    ])
  })

  test('reads the source root alone when there is no companion', () => {
    const yaml = Bun.YAML.parse(playbookFor('/src', 'https://javadoc.test', false)) as {
      content: { sources: Record<string, unknown>[] }
    }

    expect(yaml.content.sources).toEqual([{ url: '/src', branches: 'HEAD' }])
  })
})

describe('externalXrefComponent', () => {
  const external = new Set(['maven-plugin', 'api'])

  test('names the external component an unresolved xref points into', () => {
    expect(externalXrefComponent('target of xref not found: maven-plugin:index.adoc', external)).toBe('maven-plugin')
    expect(externalXrefComponent('target of xref not found: api::rest/index.adoc#x', external)).toBe('api')
  })

  test('is undefined for a component that is not external, or no component at all', () => {
    expect(externalXrefComponent('target of xref not found: appendix:absent.adoc', external)).toBeUndefined()
    expect(externalXrefComponent('target of xref not found: attachment$api/java/index.html', external)).toBeUndefined()
    expect(externalXrefComponent('target of include not found: maven-plugin:index.adoc', external)).toBeUndefined()
  })

  test('does not exempt a versioned id, which the converter leaves dangling', () => {
    expect(externalXrefComponent('target of xref not found: 4.1.1@maven-plugin:index.adoc', external)).toBeUndefined()
    expect(externalXrefComponent('target of xref not found: 4.1.1@maven-plugin:x.adoc', external)).toBeUndefined()
  })

  test('reads an @ after the first colon as part of the page path, not a version', () => {
    expect(externalXrefComponent('target of xref not found: maven-plugin:page@2x.adoc', external)).toBe('maven-plugin')
  })
})

describe('isAcceptedLoss', () => {
  const accepted = {
    includes: ['partial$configuration-properties/', 'ROOT:partial$logging/logging-format.txt'],
    xrefs: ['appendix:auto.adoc#auto'],
  }

  test('accepts an id under a declared directory prefix or equal to a declared id', () => {
    expect(isAcceptedLoss('target of include not found: partial$configuration-properties/web.adoc', accepted)).toBe(true)
    expect(isAcceptedLoss('target of include not found: ROOT:partial$logging/logging-format.txt', accepted)).toBe(true)
    expect(isAcceptedLoss('target of xref not found: appendix:auto.adoc#auto', accepted)).toBe(true)
  })

  test('rejects a sibling of a declared file, a lookalike prefix, and the wrong message kind', () => {
    expect(isAcceptedLoss('target of include not found: ROOT:partial$logging/other.txt', accepted)).toBe(false)
    expect(isAcceptedLoss('target of include not found: partial$configuration-properties-extra.adoc', accepted)).toBe(false)
    expect(isAcceptedLoss('target of xref not found: partial$configuration-properties/web.adoc', accepted)).toBe(false)
    expect(isAcceptedLoss('target of include not found: appendix:auto.adoc#auto', accepted)).toBe(false)
  })

  test('rejects a prefix match that climbs out of the declared directory', () => {
    expect(isAcceptedLoss('target of include not found: partial$configuration-properties/../other.adoc', accepted)).toBe(false)
    expect(isAcceptedLoss('target of include not found: partial$configuration-properties/a/../../b.adoc', accepted)).toBe(false)
  })
})
