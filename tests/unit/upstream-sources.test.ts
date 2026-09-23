import { describe, expect, test } from 'bun:test'
import { BOOT_4_MANAGED_VERSIONS } from '../../scripts/lib/antora-attributes.ts'
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
    expect(supportedProjects()).toEqual(['ai', 'boot', 'data-jpa', 'framework', 'security'])
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

  test('canonicalizes on the way to an era, not just past the floor', () => {
    // A padded spelling has to pick the same era as the plain one: 4.0.7 is the
    // last version of the synthesized 4.x era, and reading "04.0.7" literally
    // would order it below every floor.
    expect(resolveUpstream('boot', '04.0.7').componentPath)
      .toBe(resolveUpstream('boot', '4.0.7').componentPath)
  })

  test('still rejects a leading-zero spelling of a version below every floor', () => {
    expect(() => resolveUpstream('boot', '03.2.12')).toThrow(/not buildable/)
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
    // 3.2.12 is below the oldest floor, so era membership — not a bare
    // comparison against the newest floor — has to decide.
    expect(supportedVersionsFromTags('boot', ['v4.0.7', 'v3.5.8', 'v4.0.8', 'v3.2.12']))
      .toEqual(['3.5.8', '4.0.7', '4.0.8'])
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

  test('treats an era ceiling as exclusive, so the ceiling starts the next era', () => {
    // The two ceilings are the only versions that distinguish `< until` from
    // `<= until`. Read as inclusive, 4.0.0 would take the 3.x era and be fetched
    // from a component path that does not exist at its tag, and 4.0.8 would be
    // synthesized instead of taking the archive it does publish.
    expect(resolveUpstream('boot', '4.0.0').componentPath)
      .toBe('documentation/spring-boot-docs/src/docs/antora')
    expect(resolveUpstream('boot', '4.0.8').assembly.descriptor).toBe('archive')
  })

  test('names the buildable ranges when it refuses', () => {
    expect(() => resolveUpstream('boot', '3.2.12'))
      .toThrow(/3\.3\.0-<4\.0\.0, 4\.0\.0-<4\.0\.8, >= 4\.0\.8/)
  })

  test('accepts each era floor itself', () => {
    expect(resolveUpstream('boot', '3.3.0').tag).toBe('v3.3.0')
    expect(resolveUpstream('boot', '4.0.0').tag).toBe('v4.0.0')
    expect(resolveUpstream('boot', '4.0.8').tag).toBe('v4.0.8')
  })

  test('resolves a 3.x version to the synthesized era', () => {
    const upstream = resolveUpstream('boot', '3.5.16')

    expect(upstream.componentPath).toBe('spring-boot-project/spring-boot-docs/src/docs/antora')
    expect(upstream.assembly.descriptor).toBe('synthesized')
    expect(upstream.archives).toEqual([])
    expect(upstream.checkoutPaths).toContain('gradle.properties')
  })

  test('resolves a 4.0.0-4.0.7 version to the synthesized era on the 4.x paths', () => {
    // The two halves moved apart here: 4.0.0 relocated the component under
    // `documentation/` while the content archive stayed unpublished until 4.0.8,
    // so this era has to take the 4.x paths and the 3.x assembly.
    for (const version of ['4.0.0', '4.0.7']) {
      const upstream = resolveUpstream('boot', version)

      expect(upstream.componentPath).toBe('documentation/spring-boot-docs/src/docs/antora')
      expect(upstream.assembly.descriptor).toBe('synthesized')
      expect(upstream.archives).toEqual([])
      expect(upstream.checkoutPaths).toEqual([
        'documentation/spring-boot-docs/src/docs/antora',
        'documentation/spring-boot-docs/src/main',
        'buildSrc/src/main/resources/org/springframework/boot/build/antora/antora-asciidoc-attributes.properties',
        'platform/spring-boot-dependencies/build.gradle',
        'gradle.properties',
      ])
    }
  })

  test('reads the 4.x dependency bom, not the one 3.x kept under spring-boot-project', () => {
    const { assembly } = resolveUpstream('boot', '4.0.7')
    if (assembly.descriptor !== 'synthesized')
      throw new Error(`expected a synthesized era, got "${assembly.descriptor}"`)

    expect(assembly.synthesis.bomBuildScriptPath)
      .toBe('platform/spring-boot-dependencies/build.gradle')
    // 4.x renamed the Jackson coordinates, so taking the 3.x table against the
    // 4.x bom would silently drop `version-jackson-databind` and friends.
    expect(assembly.synthesis.managedVersionAttributes).toBe(BOOT_4_MANAGED_VERSIONS)
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

  test('the 4.0.x era carries the 4.x metadata set, which 3.x does not cover', () => {
    const { metadataJars } = resolveUpstream('boot', '4.0.7')
    const artifacts = metadataJars.map(jar => jar.artifact)

    // Boot 4 split the 3.x modules into ~140 projects. Measured 2026-09-17:
    // 103 of them publish a 4.0.x jar carrying the metadata file, and those are
    // exactly the partials the 4.0.8 content archive ships.
    expect(artifacts).toHaveLength(103)
    expect(artifacts).toContain('spring-boot-kafka')
    // Split out of `spring-boot-autoconfigure` in 4.x, so a 3.x list would miss it.
    expect(artifacts).toContain('spring-boot-webmvc')
    // Publishes a jar and no metadata file, in both lines.
    expect(artifacts).not.toContain('spring-boot-test')
    expect(metadataJars[0]?.url).toBe(
      'https://repo1.maven.org/maven2/org/springframework/boot/spring-boot/4.0.7/spring-boot-4.0.7.jar',
    )
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
    // `assertNoSymlinks`; declared, it is replaced by a real copy — pinned to
    // the target it must resolve to, so retargeting it fails too.
    expect(assembly.internalSymlinks).toEqual([
      { path: 'modules/ROOT/examples/docs-src', target: 'src' },
    ])
  })

  test('checks out the component root alone, symlink target included', () => {
    // `framework-docs/src` is inside `framework-docs`, so one path covers both
    // the component and the tree its examples symlink points at.
    expect(resolveUpstream('framework', '6.2.14').checkoutPaths).toEqual(['framework-docs'])
  })

  test('pins images and javadoc to the exact version', () => {
    const upstream = resolveUpstream('framework', '6.2.14')

    // The reference site collapses a patch to its minor, so images are taken
    // from the release tag, which serves the exact version or nothing.
    expect(upstream.imageBase).toBe(
      'https://raw.githubusercontent.com/spring-projects/spring-framework/v6.2.14'
      + '/framework-docs/modules/ROOT/assets/images',
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

describe('resolveUpstream for Spring Security', () => {
  test('tags a release as the bare version, with no v prefix', () => {
    expect(resolveUpstream('security', '6.5.6').tag).toBe('6.5.6')
  })

  test('refuses a version older than the catalog its attributes are derived from', () => {
    // `gradle/libs.versions.toml` first appears at 6.2.0; 6.1.x declares its
    // dependency versions elsewhere, so the derivation has nothing to read.
    expect(() => resolveUpstream('security', '6.1.0')).toThrow(/not buildable/)
  })

  test('resolves both eras to the same component path', () => {
    expect(resolveUpstream('security', '6.2.0').componentPath).toBe('docs')
    expect(resolveUpstream('security', '7.1.1').componentPath).toBe('docs')
  })

  test('checks out the two files its attributes are derived from', () => {
    const { checkoutPaths } = resolveUpstream('security', '6.5.6')

    // The sparse checkout and the derivation cannot disagree about these: the
    // era declares them once and both sides read that declaration.
    expect(checkoutPaths).toEqual(['docs', 'gradle/libs.versions.toml', 'gradle.properties'])
  })

  test('declares the examples symlink only for the era that ships one', () => {
    // 6.5.1 added `modules/ROOT/examples/docs-src`; before it the component has
    // no examples tree, and a declared-but-absent link fails the materialization.
    const before = resolveUpstream('security', '6.5.0').assembly
    const after = resolveUpstream('security', '6.5.1').assembly

    expect(before.descriptor === 'overlay' && before.internalSymlinks).toEqual([])
    expect(after.descriptor === 'overlay' && after.internalSymlinks).toEqual([
      { path: 'modules/ROOT/examples/docs-src', target: 'src' },
    ])
  })

  test('waits on no published artifact, because the tag carries everything', () => {
    expect(requiredArtifactUrls('security', '6.5.6')).toEqual([])
  })

  test('points javadoc macros at the api root, which is not nested under java', () => {
    // Unlike Boot, whose javadoc sits at `api/java`. Verified against
    // `…/6.5.6/api/org/springframework/security/core/Authentication.html`.
    expect(resolveUpstream('security', '6.5.6').javadocLocation)
      .toBe('https://docs.spring.io/spring-security/site/docs/6.5.6/api')
  })
})

describe('ai', () => {
  test('resolves to its component root under an overlay era', () => {
    const upstream = resolveUpstream('ai', '1.0.0')

    expect(upstream.repo).toBe('spring-projects/spring-ai')
    expect(upstream.tag).toBe('v1.0.0')
    expect(upstream.componentPath).toBe('spring-ai-docs/src/main/antora')
    expect(upstream.assembly.descriptor).toBe('overlay')
  })

  test('waits on no published artifact, because the tag carries everything', () => {
    // Being tagged upstream is the whole of being buildable: Spring AI publishes
    // no content archive, and the era reads no metadata jar.
    const upstream = resolveUpstream('ai', '1.0.0')

    expect(upstream.archives).toEqual([])
    expect(upstream.metadataJars).toEqual([])
    expect(requiredArtifactUrls('ai', '1.0.0')).toEqual([])
  })

  test('generates no attribute, because the build contributes none', () => {
    const { assembly } = resolveUpstream('ai', '1.0.0')
    if (assembly.descriptor !== 'overlay')
      throw new Error('expected an overlay assembly')

    // `resources/antora-resources/antora.yml` is two lines — `version` and
    // `prerelease` — and neither is an asciidoc attribute: `version` is the
    // descriptor field the overlay writes from the catalog version, and only GA
    // versions are built, so `prerelease` is never true.
    expect(assembly.generatedAttributes).toEqual({})
    expect(assembly.derivedAttributes).toBeUndefined()
  })

  test('declares no symlink, because the component ships none', () => {
    const { assembly } = resolveUpstream('ai', '1.0.0')
    if (assembly.descriptor !== 'overlay')
      throw new Error('expected an overlay assembly')

    // No mode 120000 blob exists under `spring-ai-docs` at v1.0.0 or v2.0.1, and
    // there is no examples tree to reach through one — the corpus contains no
    // `include-code::`.
    expect(assembly.internalSymlinks).toEqual([])
  })

  test('checks out the component root alone', () => {
    expect(resolveUpstream('ai', '1.0.0').checkoutPaths).toEqual([
      'spring-ai-docs/src/main/antora',
    ])
  })

  test('pins images and javadoc to the exact version', () => {
    const upstream = resolveUpstream('ai', '2.0.1')

    // The reference site collapses a patch to its minor — `/reference/2.0.1/_images/`
    // answers a 301 to `/reference/2.0/_images/` — so images come from the tag.
    // Spring AI uses Antora's short `modules/ROOT/images`, not `assets/images`.
    expect(upstream.imageBase).toBe(
      'https://raw.githubusercontent.com/spring-projects/spring-ai/v2.0.1'
      + '/spring-ai-docs/src/main/antora/modules/ROOT/images',
    )
    expect(upstream.javadocLocation).toBe('https://docs.spring.io/spring-ai/docs/2.0.1/api')
  })

  test('maps no external components, because every xref stays in-component', () => {
    // The only qualified references in the corpus are four `xref:ROOT:` into this
    // component's own module.
    expect(resolveUpstream('ai', '1.0.0').externalComponents).toEqual({})
  })

  test('refuses 0.8.x, which Spring never synced to Maven Central', () => {
    // The layout is byte-identical at v0.8.0, so the floor is a publication fact,
    // as Boot's archive floor is: `org/springframework/ai/spring-ai-bom` begins at
    // `1.0.0-M5`, and no consumer can pin a dependency to a 0.8.x that is not
    // there.
    expect(() => resolveUpstream('ai', '0.8.1')).toThrow(/not buildable/)
    expect(() => resolveUpstream('ai', '1.0.0')).not.toThrow()
  })

  test('runs one era with no ceiling, across the 1.x-to-2.x line', () => {
    // v2.0.1 keeps v1.0.0's component path, `mvnw process-resources` collector,
    // single `ROOT` module and two-line generated template, so 2.x is not a
    // second era.
    for (const version of ['1.0.0', '1.1.8', '2.0.0', '2.0.1']) {
      const upstream = resolveUpstream('ai', version)
      expect(upstream.componentPath).toBe('spring-ai-docs/src/main/antora')
      expect(upstream.assembly.descriptor).toBe('overlay')
    }
  })

  test('orders versions from tags the same way the build does', () => {
    expect(
      supportedVersionsFromTags('ai', ['v0.8.1', 'v1.0.0', 'v1.1.8', 'v2.0.1', 'v2.1.0-M1']),
    ).toEqual(['1.0.0', '1.1.8', '2.0.1'])
  })
})

describe('data-jpa', () => {
  test('is a template era read from bare-version tags, with nothing to download', () => {
    // The parent POM and the included component come from their own git tags,
    // not from Maven Central, so being tagged upstream is the whole of being
    // buildable, as for an overlay era.
    expect(resolveUpstream('data-jpa', '3.5.6')).toMatchObject({
      repo: 'spring-projects/spring-data-jpa',
      tag: '3.5.6',
      componentPath: 'src/main/antora',
      assembly: { descriptor: 'template' },
      archives: [],
      metadataJars: [],
      javadocLocation: 'https://docs.spring.io/spring-data/jpa/docs/3.5.6/api',
      externalComponents: {},
    })
    expect(requiredArtifactUrls('data-jpa', '3.5.6')).toEqual([])
  })

  test('checks out the template and the POM it is filtered through', () => {
    expect(resolveUpstream('data-jpa', '3.5.6').checkoutPaths).toEqual([
      'src/main/antora',
      'src/main/antora/resources/antora-resources/antora.yml',
      'pom.xml',
    ])
  })

  test('reads the parent POM and the included component from their own repositories', () => {
    const { assembly } = resolveUpstream('data-jpa', '3.5.6')
    if (assembly.descriptor !== 'template')
      throw new Error('expected a template assembly')

    expect(assembly.template.parent).toEqual({
      repo: 'spring-projects/spring-data-build',
      tagPrefix: '',
      coordinates: 'org.springframework.data.build:spring-data-parent',
      pomPath: 'parent/pom.xml',
    })
    // `include::{commons}@data-commons::page$…[]` asks for the version this
    // property pins, so the same property names the tag it is checked out at.
    expect(assembly.template.companion).toEqual({
      repo: 'spring-projects/spring-data-commons',
      tagPrefix: '',
      componentPath: 'src/main/antora',
      versionProperty: 'springdata.commons',
    })
  })

  test('builds every GA tag from 3.2.0 on through one era, and nothing older', () => {
    // 3.1.x ships no Antora component; `.RELEASE` tags predate bare versions.
    const tags = ['2.3.0.RELEASE', '3.1.12', '3.2.0', '4.1.1', '3.5.6', '4.2.0-M1']
    const versions = supportedVersionsFromTags('data-jpa', tags)

    expect(versions).toEqual(['3.2.0', '3.5.6', '4.1.1'])
    expect(new Set(versions.map(v => resolveUpstream('data-jpa', v).assembly.descriptor)))
      .toEqual(new Set(['template']))
    expect(() => resolveUpstream('data-jpa', '3.1.12')).toThrow(/not buildable/)
  })
})
