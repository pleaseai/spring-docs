import { describe, expect, test } from 'bun:test'
import {
  cloneUrlFor,
  compareGaVersions,
  compareVersionKeys,
  isGaVersion,
  mavenArchiveUrl,
  requiredArtifactUrls,
  resolveUpstream,
  supportedProjects,
  supportedVersionsFromTags,
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
    expect(supportedProjects()).toEqual(['boot', 'framework'])
  })
})

describe('compareGaVersions', () => {
  test('orders by numeric segment, not lexically', () => {
    expect(compareGaVersions('4.10.0', '4.9.0')).toBeGreaterThan(0)
    expect(compareGaVersions('4.9.0', '4.10.0')).toBeLessThan(0)
  })

  test('is zero for equal versions', () => {
    expect(compareGaVersions('4.1.1', '4.1.1')).toBe(0)
  })

  test('compares major before minor before patch', () => {
    expect(compareGaVersions('5.0.0', '4.99.99')).toBeGreaterThan(0)
    expect(compareGaVersions('4.1.2', '4.1.1')).toBeGreaterThan(0)
  })

  test('refuses non-GA versions instead of ordering them arbitrarily', () => {
    expect(() => compareGaVersions('4.2.0-M1', '4.1.1')).toThrow(/Not GA versions/)
  })

  test('treats a leading-zero segment as distinct from its bare form', () => {
    // Number("04") === Number("4"), so a Number-based comparator would wrongly
    // report these as equal even though they are distinct catalog keys.
    expect(compareGaVersions('4.01.1', '4.1.1')).not.toBe(0)
  })

  test('does not read a leading zero as extra magnitude', () => {
    // Digit count is only a proxy for magnitude once leading zeroes are gone.
    // Raw, "00" is longer than "8", so 4.00.0 would outrank 4.0.8 — and slip
    // past the supported floor in resolveUpstream.
    expect(compareGaVersions('4.00.0', '4.0.8')).toBeLessThan(0)
    expect(compareGaVersions('4.000000.0', '4.1.0')).toBeLessThan(0)
  })

  test('stays a finite comparison past Number.MAX_SAFE_INTEGER', () => {
    // A segment this long overflows Number to Infinity, and Infinity - Infinity
    // is NaN — an invalid Array#sort comparator result, not just an odd order.
    const huge = '9'.repeat(400)
    expect(compareGaVersions(`${huge}.0.0`, '4.1.1')).toBeGreaterThan(0)
  })
})

describe('resolveUpstream version floor spellings', () => {
  test('admits a leading-zero spelling of the floor itself', () => {
    // The floor is a numeric question. compareGaVersions deliberately orders
    // numerically-equal spellings rather than reporting them equal, so a raw
    // comparison rejected "04.0.8" as *below* the 4.0.8 floor it actually meets.
    for (const version of ['4.0.8', '4.00.8', '04.0.8', '4.0.08', '0004.000.0008'])
      expect(() => resolveUpstream('boot', version)).not.toThrow()
  })

  test('still rejects a leading-zero spelling of a version inside the 4.0 gap', () => {
    expect(() => resolveUpstream('boot', '04.0.7')).toThrow(/not buildable/)
  })
})

describe('compareVersionKeys', () => {
  test('orders GA keys numerically, same as compareGaVersions', () => {
    expect(compareVersionKeys('4.10.0', '4.9.0')).toBeGreaterThan(0)
  })

  test('never throws on a non-GA key, unlike compareGaVersions', () => {
    expect(() => compareVersionKeys('4.2.0-RC1', '4.1.1')).not.toThrow()
  })
})

describe('supportedVersionsFromTags', () => {
  test('maps release tags to versions, oldest first', () => {
    expect(supportedVersionsFromTags('boot', ['v4.1.1', 'v4.0.8'])).toEqual(['4.0.8', '4.1.1'])
  })

  test('keeps 3.3+ tags and drops ones no era covers', () => {
    // 4.0.7 is above the oldest floor yet belongs to no era, so era membership
    // — not a bare floor comparison — has to decide.
    expect(supportedVersionsFromTags('boot', ['v4.0.7', 'v3.5.8', 'v4.0.8', 'v3.2.12']))
      .toEqual(['3.5.8', '4.0.8'])
  })

  test('drops pre-releases and unrelated tag names', () => {
    expect(supportedVersionsFromTags('boot', ['v4.2.0-M1', 'docs-4.1.1', '4.1.1']))
      .toEqual([])
  })
})

describe('cloneUrlFor', () => {
  test('resolves without knowing a version', () => {
    expect(cloneUrlFor('boot')).toBe('https://github.com/spring-projects/spring-boot.git')
  })

  test('rejects an unsupported project', () => {
    expect(() => cloneUrlFor('cloud')).toThrow(/Unknown project "cloud"/)
  })
})

describe('resolveUpstream layout eras', () => {
  test('refuses a version older than every era', () => {
    // 3.2.x predates the Antora component entirely.
    expect(() => resolveUpstream('boot', '3.2.12')).toThrow(/not buildable/)
  })

  test('refuses a version that falls in the gap between two eras', () => {
    // 4.0.0-4.0.7 moved to the 4.x path but published no content archive.
    expect(() => resolveUpstream('boot', '4.0.7')).toThrow(/not buildable/)
  })

  test('treats an era ceiling as exclusive, so the ceiling itself is refused', () => {
    // 4.0.0 is the only version that distinguishes `< until` from `<= until`:
    // every other gap version is above the ceiling and refused either way. A
    // ceiling read as inclusive would resolve 4.0.0 to the 3.x era and fetch a
    // component path that does not exist at its tag.
    expect(() => resolveUpstream('boot', '4.0.0')).toThrow(/not buildable/)
  })

  test('names the buildable ranges when it refuses', () => {
    expect(() => resolveUpstream('boot', '4.0.7')).toThrow(/3\.3\.0-<4\.0\.0, >= 4\.0\.8/)
  })

  test('accepts each era floor itself', () => {
    expect(resolveUpstream('boot', '3.3.0').tag).toBe('v3.3.0')
    expect(resolveUpstream('boot', '4.0.8').tag).toBe('v4.0.8')
  })

  test('resolves a 3.x version to the synthesized era', () => {
    const upstream = resolveUpstream('boot', '3.5.16')

    expect(upstream.componentPath).toBe('spring-boot-project/spring-boot-docs/src/docs/antora')
    expect(upstream.assembly.descriptor).toBe('synthesized')
    expect(upstream.archives).toEqual([])
    expect(upstream.checkoutPaths).toContain('gradle.properties')
  })

  test('resolves a 4.x version to the archive era', () => {
    const upstream = resolveUpstream('boot', '4.1.1')

    expect(upstream.componentPath).toBe('documentation/spring-boot-docs/src/docs/antora')
    expect(upstream.assembly.descriptor).toBe('archive')
    expect(upstream.archives).toHaveLength(1)
    // An archive era needs nothing beyond the component root.
    expect(upstream.checkoutPaths).toEqual(['documentation/spring-boot-docs/src/docs/antora'])
  })
})

describe('metadataJars', () => {
  test('a synthesized era carries the jars whose metadata it drops in as partials', () => {
    const { metadataJars } = resolveUpstream('boot', '3.5.16')

    expect(metadataJars.length).toBeGreaterThan(0)
    for (const jar of metadataJars) {
      expect(jar.url).toBe(
        `https://repo1.maven.org/maven2/org/springframework/boot/${jar.artifact}/3.5.16/${jar.artifact}-3.5.16.jar`,
      )
    }
  })

  test('an archive era has none, because the zip already carries that metadata', () => {
    expect(resolveUpstream('boot', '4.1.1').metadataJars).toEqual([])
  })

  test('is the very list the availability gate checks', () => {
    // These two must not be able to disagree about where an artifact lives:
    // `detect-upstream-versions.ts` offers a version as buildable from the gate's
    // URLs, and `fetch-upstream.ts` then downloads from the coordinates'. Built
    // from one source in `resolveUpstream`, a group path cannot change on only
    // one side and turn a buildable version into a 404 mid-fetch.
    expect(resolveUpstream('boot', '3.5.16').metadataJars.map(jar => jar.url))
      .toEqual([...requiredArtifactUrls('boot', '3.5.16')])
  })
})

describe('requiredArtifactUrls', () => {
  test('an archive era depends on its content zips', () => {
    expect(requiredArtifactUrls('boot', '4.1.1')).toEqual([
      'https://repo1.maven.org/maven2/org/springframework/boot/spring-boot-docs/4.1.1/spring-boot-docs-4.1.1-root-aggregate-content.zip',
    ])
  })

  test('a synthesized era depends on the jars carrying property metadata', () => {
    const urls = requiredArtifactUrls('boot', '3.5.16')

    expect(urls).toHaveLength(8)
    expect(urls).toContain(
      'https://repo1.maven.org/maven2/org/springframework/boot/spring-boot-autoconfigure/3.5.16/spring-boot-autoconfigure-3.5.16.jar',
    )
    // Publishes a jar but ships no configuration metadata (measured on 3.5.16).
    expect(urls.some(url => url.includes('/spring-boot-test/'))).toBe(false)
  })
})

describe('framework', () => {
  test('resolves to its component root with nothing to download', () => {
    const upstream = resolveUpstream('framework', '6.2.14')

    expect(upstream.repo).toBe('spring-projects/spring-framework')
    expect(upstream.tag).toBe('v6.2.14')
    expect(upstream.componentPath).toBe('framework-docs')
    expect(upstream.assembly.descriptor).toBe('overlay')
    // The whole point of the overlay era: the git tag carries everything.
    expect(upstream.archives).toEqual([])
    expect(upstream.metadataJars).toEqual([])
    expect(requiredArtifactUrls('framework', '6.2.14')).toEqual([])
  })

  test('generates exactly the one attribute the Gradle build contributes', () => {
    const { assembly } = resolveUpstream('framework', '6.2.14')
    if (assembly.descriptor !== 'overlay')
      throw new Error('expected an overlay assembly')

    // `framework-docs.gradle` sets asciidocAttributes to ["spring-version": version]
    // and `generateAntoraResources` depends on `generateAntoraYml` alone.
    expect(assembly.generatedAttributes).toEqual({ 'spring-version': '6.2.14' })
  })

  test('declares the examples symlink so the copy guard can be kept strict', () => {
    const { assembly } = resolveUpstream('framework', '6.2.14')
    if (assembly.descriptor !== 'overlay')
      throw new Error('expected an overlay assembly')

    // A mode 120000 blob holding `../../../src`. Undeclared, it would fail
    // `assertNoSymlinks`; declared, it is replaced by a real copy.
    expect(assembly.internalSymlinks).toEqual(['modules/ROOT/examples/docs-src'])
  })

  test('checks out the component root alone, symlink target included', () => {
    // `framework-docs/src` is inside `framework-docs`, so one path covers both
    // the component and the tree its examples symlink points at.
    expect(resolveUpstream('framework', '6.2.14').checkoutPaths).toEqual(['framework-docs'])
  })

  test('pins images and javadoc to the exact version', () => {
    const upstream = resolveUpstream('framework', '6.2.14')

    expect(upstream.imageBase).toBe(
      'https://docs.spring.io/spring-framework/reference/6.2.14/_images',
    )
    expect(upstream.javadocLocation).toBe(
      'https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api',
    )
  })

  test('maps no external components, because every xref stays in-component', () => {
    expect(resolveUpstream('framework', '6.2.14').externalComponents).toEqual({})
  })

  test('refuses 6.0.x, which ships no Antora component at all', () => {
    // `framework-docs/antora.yml` is a 404 at v6.0.0 and present from v6.1.0.
    expect(() => resolveUpstream('framework', '6.0.9')).toThrow(/not buildable/)
    expect(() => resolveUpstream('framework', '6.1.0')).not.toThrow()
  })

  test('runs one era with no ceiling, across the committed-attribute change', () => {
    // v6.1.0 commits 31 lines of attributes and v6.2.0 onward commit 96, but
    // the component path and the generated half are identical, so 7.x resolves
    // through the same era rather than falling off the end of the table.
    for (const version of ['6.1.0', '6.2.14', '7.0.4']) {
      const upstream = resolveUpstream('framework', version)
      expect(upstream.componentPath).toBe('framework-docs')
      expect(upstream.assembly.descriptor).toBe('overlay')
    }
  })

  test('orders versions from tags the same way the build does', () => {
    expect(
      supportedVersionsFromTags('framework', ['v6.0.9', 'v6.1.0', 'v6.2.14', 'v7.0.4', 'v7.1.0-M1']),
    ).toEqual(['6.1.0', '6.2.14', '7.0.4'])
  })
})

describe('boot image base', () => {
  test('pins to the exact version, beside the javadoc location', () => {
    expect(resolveUpstream('boot', '4.1.1').imageBase).toBe(
      'https://docs.spring.io/spring-boot/4.1.1/_images',
    )
  })
})
