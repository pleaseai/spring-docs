import { describe, expect, test } from 'bun:test'
import { parseArgs } from '../../scripts/promote-markdown.ts'

describe('parseArgs', () => {
  test('defaults --out to "markdown"', () => {
    expect(parseArgs(['dist/boot-4.1.1'])).toEqual({ source: 'dist/boot-4.1.1', out: 'markdown' })
  })

  test('accepts --out value and --out=value forms', () => {
    expect(parseArgs(['dist/boot-4.1.1', '--out', 'site'])).toEqual({ source: 'dist/boot-4.1.1', out: 'site' })
    expect(parseArgs(['dist/boot-4.1.1', '--out=site'])).toEqual({ source: 'dist/boot-4.1.1', out: 'site' })
  })

  test('throws when no source is given', () => {
    expect(() => parseArgs([])).toThrow(/Usage: promote-markdown\.ts/)
  })

  test('throws on an unknown option', () => {
    expect(() => parseArgs(['dist/boot-4.1.1', '--foo'])).toThrow(/Unknown option "--foo"/)
  })

  test('throws when --out has no value', () => {
    expect(() => parseArgs(['dist/boot-4.1.1', '--out'])).toThrow(/"--out" needs a directory/)
  })

  test('throws when --out= is empty, which would target the repository root', () => {
    expect(() => parseArgs(['dist/boot-4.1.1', '--out='])).toThrow(/"--out" needs a directory/)
  })

  test('throws when --out is followed by another option instead of a value', () => {
    expect(() => parseArgs(['dist/boot-4.1.1', '--out', '--foo'])).toThrow(/"--out" needs a directory/)
  })
})
