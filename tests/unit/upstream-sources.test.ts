import { describe, expect, test } from 'bun:test'
import {
  isGaVersion,
  mavenArchiveUrl,
  resolveUpstream,
  supportedProjects,
} from '../../scripts/lib/upstream-sources.ts'

describe('isGaVersion', () => {
  test('accepts plain major.minor.patch versions', () => {
    expect(isGaVersion('4.1.1')).toBe(true)
    expect(isGaVersion('10.0.12')).toBe(true)
  })

  test('rejects pre-release versions, which are out of scope', () => {
    for (const version of ['4.1.0-M1', '4.1.0-RC1', '4.2.0-SNAPSHOT', '4.1']) {
      expect(isGaVersion(version)).toBe(false)
    }
  })
})

describe('mavenArchiveUrl', () => {
  test('builds the published archive URL for a classifier', () => {
    expect(
      mavenArchiveUrl('org/springframework/boot', 'spring-boot-docs', '4.1.1', 'root-aggregate-content'),
    ).toBe(
      'https://repo1.maven.org/maven2/org/springframework/boot/spring-boot-docs/4.1.1/spring-boot-docs-4.1.1-root-aggregate-content.zip',
    )
  })
})

describe('resolveUpstream', () => {
  test('resolves boot 4.1.1 to its tag, component path and archives', () => {
    const upstream = resolveUpstream('boot', '4.1.1')

    expect(upstream.repo).toBe('spring-projects/spring-boot')
    expect(upstream.tag).toBe('v4.1.1')
    expect(upstream.cloneUrl).toBe('https://github.com/spring-projects/spring-boot.git')
    expect(upstream.componentPath).toBe('documentation/spring-boot-docs/src/docs/antora')
    expect(upstream.archives).toHaveLength(1)
    expect(upstream.archives[0]?.classifier).toBe('root-aggregate-content')
    expect(upstream.archives[0]?.url).toContain('spring-boot-docs-4.1.1-root-aggregate-content.zip')
  })

  test('maps the components it does not build to their published docs', () => {
    const { externalComponents } = resolveUpstream('boot', '4.1.1')

    // Left unmapped, references into these render as dangling "#component:path".
    expect(Object.keys(externalComponents).sort()).toEqual(['api', 'gradle-plugin', 'maven-plugin'])
    expect(externalComponents.api).toBe('https://docs.spring.io/spring-boot/4.1.1/api')
  })

  test('pins the javadoc base URL to the exact patch version', () => {
    expect(resolveUpstream('boot', '4.1.1').javadocLocation).toBe(
      'https://docs.spring.io/spring-boot/4.1.1/api/java',
    )
  })

  test('rejects an unknown project, naming what is supported', () => {
    expect(() => resolveUpstream('cloud', '4.1.1')).toThrow(/Unknown project "cloud"/)
    expect(() => resolveUpstream('cloud', '4.1.1')).toThrow(/boot/)
  })

  test('rejects a pre-release version rather than fetching it', () => {
    expect(() => resolveUpstream('boot', '4.2.0-M1')).toThrow(/not a GA version/)
  })
})

describe('supportedProjects', () => {
  test('lists the known projects', () => {
    expect(supportedProjects()).toEqual(['boot'])
  })
})
