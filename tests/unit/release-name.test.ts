import { describe, expect, test } from 'bun:test'
import { parseReleaseName, releaseName } from '../../scripts/lib/release-name.ts'

describe('releaseName', () => {
  test('joins a pair with a hyphen', () => {
    expect(releaseName('boot', '4.1.1')).toBe('boot-4.1.1')
  })
})

describe('parseReleaseName', () => {
  test('splits a plain release name', () => {
    expect(parseReleaseName('boot-4.1.1')).toEqual({ project: 'boot', version: '4.1.1' })
  })

  test('keeps a rebuild suffix with the version', () => {
    expect(parseReleaseName('boot-4.1.1+rebuild.1'))
      .toEqual({ project: 'boot', version: '4.1.1+rebuild.1' })
  })

  test('splits at the hyphen a version follows, not the first one', () => {
    expect(parseReleaseName('data-jpa-4.1.1')).toEqual({ project: 'data-jpa', version: '4.1.1' })
  })

  test('round-trips with releaseName', () => {
    const name = releaseName('data-jpa', '4.1.1')
    expect(parseReleaseName(name)).toEqual({ project: 'data-jpa', version: '4.1.1' })
  })

  test('rejects a name with no version', () => {
    expect(() => parseReleaseName('boot')).toThrow(/not a <project>-<version> name/)
  })

  test('rejects a version that does not start with a digit', () => {
    expect(() => parseReleaseName('boot-latest')).toThrow(/not a <project>-<version> name/)
  })

  test('rejects an empty project key', () => {
    expect(() => parseReleaseName('-4.1.1')).toThrow(/not a <project>-<version> name/)
  })
})
