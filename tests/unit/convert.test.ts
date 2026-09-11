import { describe, expect, test } from 'bun:test'
import { parseArgs } from '../../scripts/convert.ts'

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
