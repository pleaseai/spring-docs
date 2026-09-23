import { describe, expect, test } from 'bun:test'
import { parseArgs, playbookFor } from '../../scripts/convert.ts'

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
