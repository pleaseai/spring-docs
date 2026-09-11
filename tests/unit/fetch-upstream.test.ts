import { describe, expect, test } from 'bun:test'
import { parseArgs } from '../../scripts/fetch-upstream.ts'

describe('parseArgs', () => {
  test('parses positional project/version and --out', () => {
    const args = parseArgs(['boot', '4.1.1', '--out', 'dist/upstream'])

    expect(args).toEqual({ project: 'boot', version: '4.1.1', out: 'dist/upstream' })
  })

  test('accepts --out=value', () => {
    const args = parseArgs(['boot', '4.1.1', '--out=dist/upstream'])

    expect(args).toEqual({ project: 'boot', version: '4.1.1', out: 'dist/upstream' })
  })

  test('throws when --out is missing', () => {
    expect(() => parseArgs(['boot', '4.1.1'])).toThrow(/Usage: fetch-upstream\.ts/)
  })

  test('throws when a positional is missing', () => {
    expect(() => parseArgs(['boot', '--out', 'dist'])).toThrow(/Usage: fetch-upstream\.ts/)
  })
})
