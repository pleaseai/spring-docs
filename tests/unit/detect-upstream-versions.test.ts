import { describe, expect, test } from 'bun:test'
import { parseArgs } from '../../scripts/detect-upstream-versions.ts'

describe('parseArgs', () => {
  test('defaults to every supported project, no limit, and text output', () => {
    const args = parseArgs([])

    expect(args).toEqual({ projects: ['ai', 'boot', 'data-jpa', 'framework', 'security'], limit: null, json: false })
  })

  test('accepts --project value and --project=value forms', () => {
    expect(parseArgs(['--project', 'boot']).projects).toEqual(['boot'])
    expect(parseArgs(['--project=boot']).projects).toEqual(['boot'])
  })

  test('accepts --limit and --json', () => {
    const args = parseArgs(['--limit', '5', '--json'])

    expect(args).toEqual({ projects: ['ai', 'boot', 'data-jpa', 'framework', 'security'], limit: 5, json: true })
  })

  test('rejects an unknown project', () => {
    expect(() => parseArgs(['--project', 'nope'])).toThrow(/Unknown project "nope"/)
  })

  test('rejects a non-integer --limit', () => {
    expect(() => parseArgs(['--limit', 'abc'])).toThrow(/--limit must be a positive integer/)
  })

  test('rejects a --limit below 1', () => {
    expect(() => parseArgs(['--limit', '0'])).toThrow(/--limit must be a positive integer/)
  })
})
