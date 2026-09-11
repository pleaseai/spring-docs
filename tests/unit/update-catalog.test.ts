import { describe, expect, test } from 'bun:test'
import { parseArgs } from '../../scripts/update-catalog.ts'

describe('parseArgs', () => {
  test('parses the required options and defaults releasedAt/dryRun', () => {
    const args = parseArgs(['--project', 'boot', '--version', '4.1.1', '--tag', 'boot-4.1.1'])

    expect(args.project).toBe('boot')
    expect(args.version).toBe('4.1.1')
    expect(args.tag).toBe('boot-4.1.1')
    expect(args.releasedAt).toBeNull()
    expect(args.dryRun).toBe(false)
    expect(args.now).toBeInstanceOf(Date)
  })

  test('accepts the --key=value form', () => {
    const args = parseArgs(['--project=boot', '--version=4.1.1', '--tag=boot-4.1.1'])

    expect(args).toMatchObject({ project: 'boot', version: '4.1.1', tag: 'boot-4.1.1' })
  })

  test('accepts --released-at and --dry-run', () => {
    const args = parseArgs([
      '--project',
      'boot',
      '--version',
      '4.1.1',
      '--tag',
      'boot-4.1.1',
      '--released-at',
      '2026-09-11T00:00:00Z',
      '--dry-run',
    ])

    expect(args.releasedAt).toBe('2026-09-11T00:00:00Z')
    expect(args.dryRun).toBe(true)
  })

  test('rejects an unknown option', () => {
    expect(() => parseArgs(['--project', 'boot', '--released-att', 'x']))
      .toThrow(/Unknown option "--released-att"/)
  })

  test('rejects an option missing its value', () => {
    expect(() => parseArgs(['--project', 'boot', '--version', '4.1.1', '--tag']))
      .toThrow(/Option "--tag" needs a value/)
  })

  test('rejects a positional argument', () => {
    expect(() => parseArgs(['--project', 'boot', '--version', '4.1.1', '--tag', 'boot-4.1.1', 'extra']))
      .toThrow(/Unexpected argument "extra"/)
  })

  test('throws when a required option is missing', () => {
    expect(() => parseArgs(['--project', 'boot', '--version', '4.1.1']))
      .toThrow(/Usage: update-catalog\.ts/)
  })
})
