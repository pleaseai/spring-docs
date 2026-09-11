import { describe, expect, test } from 'bun:test'
import { parseArgs } from '../../scripts/release-mode.ts'

const REQUIRED = [
  '--project',
  'boot',
  '--version',
  '4.1.1',
  '--tag',
  'boot-4.1.1',
  '--catalog',
  'catalog.json',
] as const

describe('parseArgs', () => {
  test('parses the required options', () => {
    const args = parseArgs([...REQUIRED, '--release-exists', 'true'])

    expect(args).toEqual({
      project: 'boot',
      version: '4.1.1',
      tag: 'boot-4.1.1',
      catalog: 'catalog.json',
      releaseExists: true,
    })
  })

  test('accepts the --key=value form', () => {
    const args = parseArgs([
      '--project=boot',
      '--version=4.1.1',
      '--tag=boot-4.1.1',
      '--catalog=/tmp/catalog.json',
      '--release-exists=false',
    ])

    expect(args).toMatchObject({ catalog: '/tmp/catalog.json', releaseExists: false })
  })

  test('rejects an unknown option', () => {
    expect(() => parseArgs([...REQUIRED, '--release-exist', 'true']))
      .toThrow(/Unknown option "--release-exist"/)
  })

  test('rejects a positional argument', () => {
    expect(() => parseArgs([...REQUIRED, '--release-exists', 'true', 'boot-4.1.1']))
      .toThrow(/Unexpected argument "boot-4\.1\.1"/)
  })

  test('rejects a missing --catalog', () => {
    expect(() => parseArgs(['--project', 'boot', '--version', '4.1.1', '--tag', 'boot-4.1.1', '--release-exists', 'true']))
      .toThrow(/Usage: release-mode\.ts/)
  })

  test('rejects an option with no value', () => {
    expect(() => parseArgs([...REQUIRED, '--release-exists']))
      .toThrow(/"--release-exists" needs a value/)
  })

  test('rejects a --release-exists that is neither true nor false', () => {
    // A shell probe that emits anything else must stop the run: read as "no
    // release", it would republish over an archive that already exists.
    expect(() => parseArgs([...REQUIRED, '--release-exists', 'yes']))
      .toThrow(/takes "true" or "false", not "yes"/)
  })
})
