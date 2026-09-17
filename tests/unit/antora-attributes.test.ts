import type { AttributeSources } from '../../scripts/lib/antora-attributes.ts'
import { describe, expect, test } from 'bun:test'
import {
  BOOT_3_MANAGED_VERSIONS,
  BOOT_4_MANAGED_VERSIONS,
  parseManagedVersions,
  parseProperties,
  synthesizeAttributes,
  versionSourceBoms,
} from '../../scripts/lib/antora-attributes.ts'

describe('parseProperties', () => {
  test('reads key=value lines, ignoring comments and blanks', () => {
    const properties = parseProperties('# a comment\n\nversion = 3.5.16\nempty=\n')

    expect(properties.get('version')).toBe('3.5.16')
    expect(properties.get('empty')).toBe('')
    expect(properties.size).toBe(2)
  })

  test('keeps everything after the first separator', () => {
    expect(parseProperties('url=https://example.com/a=b').get('url'))
      .toBe('https://example.com/a=b')
  })
})

describe('parseManagedVersions', () => {
  const pom = `
<properties>
  <jackson.version>2.21.4</jackson.version>
  <jackson.version.core>\${jackson.version}</jackson.version.core>
  <unresolvable.version>\${nowhere.defined}</unresolvable.version>
</properties>
<dependencyManagement><dependencies>
  <dependency><groupId>org.springframework.data</groupId>
    <artifactId>spring-data-jpa</artifactId><version>3.5.4</version></dependency>
  <dependency><groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-core</artifactId><version>\${jackson.version.core}</version></dependency>
  <dependency><groupId>org.apache.pulsar</groupId>
    <artifactId>pulsar-client-api</artifactId><version>\${project.version}</version></dependency>
  <dependency><groupId>com.example</groupId>
    <artifactId>mystery</artifactId><version>\${unresolvable.version}</version></dependency>
</dependencies></dependencyManagement>`

  const versions = parseManagedVersions(pom, '4.0.11')

  test('keys each managed dependency by groupId:artifactId', () => {
    expect(versions['org.springframework.data:spring-data-jpa']).toBe('3.5.4')
  })

  test('follows a property that references another property', () => {
    expect(versions['com.fasterxml.jackson.core:jackson-core']).toBe('2.21.4')
  })

  test('resolves the project.version placeholder to the fetched bom version', () => {
    expect(versions['org.apache.pulsar:pulsar-client-api']).toBe('4.0.11')
  })

  test('drops an entry whose placeholder nothing defines', () => {
    expect(versions['com.example:mystery']).toBeUndefined()
  })
})

const STATIC_ATTRIBUTES = `
# === URLs ===
url-ant-docs=https://ant.apache.org/manual
url-spring-data-jpa-docs=https://docs.spring.io/spring-data/jpa/reference/{antoraversion-spring-data-jpa}
url-spring-data-jpa-javadoc=https://docs.spring.io/spring-data/jpa/docs/{dotxversion-spring-data-jpa}/api
url-spring-data-geode-site=https://spring.io/projects/spring-data-geode
code-spring-boot=https://github.com/{github-repo}/tree/{github-ref}
`

const BOM_BUILD_SCRIPT = `
bom {
  library("Spring Framework", "\${springFrameworkVersion}") {
    links {
      site("https://spring.io/projects/spring-framework")
      javadoc(version -> "https://docs.spring.io/spring-framework/docs/%s/javadoc-api"
        .formatted(version.forMajorMinorGeneration()), "org.springframework.[aop|web]")
    }
  }
  library("Example", "1.0.0") {
    links {
      site("https://example.com")
    }
  }
}
`

const GRADLE_PROPERTIES = `
version=3.5.16
spring.build-type=oss
graalVersion=22.3
nativeBuildToolsVersion=0.10.6
springFrameworkVersion=6.2.19
`

function sources(overrides: Partial<AttributeSources> = {}): AttributeSources {
  return {
    version: '3.5.16',
    githubRepo: 'spring-projects/spring-boot',
    staticAttributes: STATIC_ATTRIBUTES,
    bomBuildScript: BOM_BUILD_SCRIPT,
    gradleProperties: GRADLE_PROPERTIES,
    managedVersions: { 'org.springframework.data:spring-data-jpa': '3.5.4' },
    managedVersionAttributes: BOOT_3_MANAGED_VERSIONS,
    ...overrides,
  }
}

/**
 * `testcontainers-bom` 1.20.4, reduced to the modules the Boot corpus links to.
 *
 * Transcribed from the published pom rather than from `TESTCONTAINERS_MODULES`,
 * so it is an independent statement of what those coordinates are actually
 * called — which is the only way a test can catch a typo in that list.
 */
const TESTCONTAINERS_BOM = `
<project>
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>activemq</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>cassandra</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>clickhouse</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>couchbase</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>elasticsearch</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>grafana</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>jdbc</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>kafka</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>mariadb</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>mongodb</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>mssqlserver</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>mysql</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>neo4j</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>oracle-free</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>oracle-xe</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>postgresql</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>pulsar</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>r2dbc</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>rabbitmq</artifactId>
        <version>\${project.version}</version>
      </dependency>
      <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>redpanda</artifactId>
        <version>\${project.version}</version>
      </dependency>
    </dependencies>
  </dependencyManagement>
</project>
`

describe('synthesizeAttributes', () => {
  const { attributes, unresolved } = synthesizeAttributes(sources())

  test('pins the build to the release tag it was checked out from', () => {
    expect(attributes['github-repo']).toBe('spring-projects/spring-boot')
    expect(attributes['github-ref']).toBe('v3.5.16')
  })

  test('reports an open-source build for any value but "commercial"', () => {
    expect(attributes['build-type']).toBe('opensource')
    expect(attributes['build-and-artifact-release-type']).toBe('opensource-release')
    expect(
      synthesizeAttributes(sources({ gradleProperties: 'spring.build-type=commercial' }))
        .attributes['build-type'],
    ).toBe('commercial')
  })

  test('resolves an interpolated library version through gradle.properties', () => {
    expect(attributes['version-spring-framework']).toBe('6.2.19')
    expect(attributes['version-example']).toBe('1.0.0')
  })

  test('carries toolchain versions the BOM does not manage', () => {
    expect(attributes['version-graal']).toBe('22.3')
    expect(attributes['version-native-build-tools']).toBe('0.10.6')
  })

  test('renders BOM links against each library version', () => {
    expect(attributes['url-spring-framework-site']).toBe('https://spring.io/projects/spring-framework')
    expect(attributes['url-spring-framework-javadoc'])
      .toBe('https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api')
  })

  test('points each documented package at the javadoc link covering it', () => {
    expect(attributes['javadoc-location-org-springframework-aop'])
      .toBe('{url-spring-framework-javadoc}')
    expect(attributes['javadoc-location-org-springframework-web'])
      .toBe('{url-spring-framework-javadoc}')
  })

  test('resolves the static file\'s spring-data placeholders', () => {
    expect(attributes['url-spring-data-jpa-docs'])
      .toBe('https://docs.spring.io/spring-data/jpa/reference/3.5')
    expect(attributes['url-spring-data-jpa-javadoc'])
      .toBe('https://docs.spring.io/spring-data/jpa/docs/3.5.x/api')
  })

  test('emits the spring-data documentation versions 3.3.4 and 3.3.5 link through', () => {
    // Those two releases put these two names in the descriptor itself; 3.3.6
    // moved the same values behind `antoraversion-`/`dotxversion-`. Both shapes
    // are emitted, so the older corpus resolves without the newer one changing.
    expect(attributes['version-spring-data-jpa-docs']).toBe('3.5')
    expect(attributes['version-spring-data-jpa-javadoc']).toBe('3.5.x')
  })

  test('names every testcontainers module against the published bom', () => {
    // `TESTCONTAINERS_BOM` is transcribed from testcontainers-bom 1.20.4, not
    // from the module list under test, so the count below is what pins each of
    // the 20 literals: a typo names a coordinate the real bom does not manage,
    // its attribute is silently omitted, and 20 becomes 19. Asserting the
    // mapping itself would prove nothing — the attribute name and the lookup
    // coordinate are built from the same string.
    const { attributes: emitted } = synthesizeAttributes(sources({
      managedVersions: parseManagedVersions(TESTCONTAINERS_BOM, '1.20.4'),
    }))
    const named = Object.keys(emitted).filter(name => name.startsWith('version-testcontainers-'))

    expect(named).toHaveLength(20)
    expect(emitted['version-testcontainers-jdbc']).toBe('1.20.4')
    expect(emitted['version-testcontainers-oracle-free']).toBe('1.20.4')
  })

  test('omits a testcontainers module the release does not manage', () => {
    // Upstream's own list grew and shrank across the era, so a module a given
    // bom does not carry is absent rather than left dangling in the descriptor.
    const { attributes: emitted } = synthesizeAttributes(sources({
      managedVersions: { 'org.testcontainers:jdbc': '1.20.4' },
    }))

    expect(emitted['version-testcontainers-jdbc']).toBe('1.20.4')
    expect('version-testcontainers-redpanda' in emitted).toBe(false)
  })

  test('passes attribute cross-references through for Asciidoctor to resolve', () => {
    expect(attributes['code-spring-boot']).toBe('https://github.com/{github-repo}/tree/{github-ref}')
    expect(attributes['url-ant-docs']).toBe('https://ant.apache.org/manual')
  })

  test('falls back to the declaring library version for a directly-listed module', () => {
    // 3.3-3.4 list Pulsar Reactive's modules instead of importing a bom, so the
    // module carries the library's own version and nothing resolves it remotely.
    const listed = synthesizeAttributes(sources({
      bomBuildScript: `
bom {
  library("Pulsar Reactive", "0.5.9") {
    group("org.apache.pulsar") {
      modules = [
        "pulsar-client-reactive-api"
      ]
    }
  }
}
`,
      managedVersions: {},
    }))

    expect(listed.attributes['version-pulsar-client-reactive-api']).toBe('0.5.9')
  })

  test('resolves everything when every source is present', () => {
    expect(unresolved).toEqual([])
  })

  test('withholds an attribute whose version placeholder nothing resolved', () => {
    // A half-rendered URL reads as a working link, so it is dropped and named
    // rather than emitted with a dangling `{antoraversion-…}`.
    const withoutSpringData = synthesizeAttributes(sources({ managedVersions: {} }))

    expect(withoutSpringData.unresolved).toEqual([
      'url-spring-data-jpa-docs',
      'url-spring-data-jpa-javadoc',
    ])
    expect(withoutSpringData.attributes['url-spring-data-jpa-docs']).toBeUndefined()
    // One without a placeholder is unaffected.
    expect(withoutSpringData.attributes['url-spring-data-geode-site'])
      .toBe('https://spring.io/projects/spring-data-geode')
  })

  test('withholds a link whose template outnumbers the values the version supplies', () => {
    // `componentInts()` keeps only the numeric parts, so a qualified version
    // feeds two values to a three-specifier template and the third `%02d`
    // survives rendering. A URL carrying a literal `%02d` reads as a working
    // link, so it is withheld and named like any other half-rendered value.
    const qualified = synthesizeAttributes(sources({
      bomBuildScript: `
bom {
  library("Hibernate", "6.5.Final") {
    links {
      docs(version -> "https://hibernate.org/%02d.%02d.%02d/manual"
        .formatted(version.componentInts()))
    }
  }
}
`,
    }))

    expect(qualified.unresolved).toContain('url-hibernate-docs')
    expect(qualified.attributes['url-hibernate-docs']).toBeUndefined()
  })

  test('lets a later library overwrite an earlier half-rendered link of the same name', () => {
    // Both the attribute map and the half-rendered set are keyed by attribute
    // name, so the second `links("shared")` block wins the value — and has to
    // clear the first block's mark too, or a valid URL stays withheld.
    const reused = synthesizeAttributes(sources({
      bomBuildScript: `
bom {
  library("First", "6.5.Final") {
    links("shared") {
      docs(version -> "https://example.com/%02d.%02d.%02d/manual"
        .formatted(version.componentInts()))
    }
  }
  library("Second", "1.2.3") {
    links("shared") {
      docs(version -> "https://example.com/%s/manual".formatted(version.toString()))
    }
  }
}
`,
    }))

    expect(reused.unresolved).not.toContain('url-shared-docs')
    expect(reused.attributes['url-shared-docs']).toBe('https://example.com/1.2.3/manual')
  })

  test('withholds the package aliases of a withheld link, not just the link', () => {
    // A `javadoc-location-*` alias is exactly `{url-…-javadoc}`. Dropping only
    // the link would leave the alias pointing at an attribute the descriptor no
    // longer defines, which reaches the reader as the dangling text withholding
    // exists to prevent.
    const orphaned = synthesizeAttributes(sources({
      bomBuildScript: `
bom {
  library("Hibernate", "6.5.Final") {
    links {
      javadoc(version -> "https://hibernate.org/%02d.%02d.%02d/javadoc"
        .formatted(version.componentInts()), "org.hibernate")
    }
  }
}
`,
    }))

    expect(orphaned.unresolved).toContain('url-hibernate-javadoc')
    expect(orphaned.unresolved).toContain('javadoc-location-org-hibernate')
    expect(orphaned.attributes['javadoc-location-org-hibernate']).toBeUndefined()
  })

  test('reads each jackson attribute from the coordinate its era table names', () => {
    // 4.0.0 moved Jackson 3 to `tools.jackson.*` and kept the 2.x line behind a
    // separate `version-jackson2-databind`. Managing both coordinate sets at
    // once is what makes a wrong groupId visible: the attribute resolves to the
    // other line's version instead of to nothing, so it survives the
    // `setIfPresent` that would otherwise hide it.
    const managedVersions = {
      'com.fasterxml.jackson.core:jackson-annotations': '2.21.5',
      'com.fasterxml.jackson.core:jackson-core': '2.21.5',
      'com.fasterxml.jackson.core:jackson-databind': '2.21.5',
      'com.fasterxml.jackson.dataformat:jackson-dataformat-xml': '2.21.5',
      // Managed at a coordinate neither table names, so only a regressed
      // `jackson-annotations` row can reach it.
      'tools.jackson.core:jackson-annotations': '3.1.5',
      'tools.jackson.core:jackson-core': '3.1.5',
      'tools.jackson.core:jackson-databind': '3.1.5',
      'tools.jackson.dataformat:jackson-dataformat-xml': '3.1.5',
    }

    const boot4 = synthesizeAttributes(sources({
      managedVersions,
      managedVersionAttributes: BOOT_4_MANAGED_VERSIONS,
    })).attributes

    expect(boot4['version-jackson-core']).toBe('3.1.5')
    expect(boot4['version-jackson-databind']).toBe('3.1.5')
    expect(boot4['version-jackson-dataformat-xml']).toBe('3.1.5')
    expect(boot4['version-jackson2-databind']).toBe('2.21.5')
    // `jackson-annotations` is the one artifact 4.x's `Jackson Bom` permits
    // through on the 2.x coordinate, so both tables read the same row.
    expect(boot4['version-jackson-annotations']).toBe('2.21.5')

    const boot3 = synthesizeAttributes(sources({
      managedVersions,
      managedVersionAttributes: BOOT_3_MANAGED_VERSIONS,
    })).attributes

    expect(boot3['version-jackson-core']).toBe('2.21.5')
    expect(boot3['version-jackson-databind']).toBe('2.21.5')
    expect(boot3['version-jackson-dataformat-xml']).toBe('2.21.5')
    expect(boot3['version-jackson-annotations']).toBe('2.21.5')
    // Upstream names no such attribute before 4.0.0, and the corpus never links
    // through it; emitting it there would be a fabricated attribute.
    expect(boot3['version-jackson2-databind']).toBeUndefined()
  })
})

describe('versionSourceBoms', () => {
  test('fetches the testcontainers bom, which pins every module attribute', () => {
    const boms = versionSourceBoms(
      `
bom {
  library("Testcontainers", "1.20.4") {
    group("org.testcontainers") {
      imports = [
        "testcontainers-bom"
      ]
    }
  }
  library("Unreferenced", "1.0.0") {
    group("com.example") {
      imports = [
        "example-bom"
      ]
    }
  }
}
`,
      'version=3.5.16\n',
      BOOT_3_MANAGED_VERSIONS,
    )

    expect(boms).toEqual([
      { groupId: 'org.testcontainers', artifactId: 'testcontainers-bom', version: '1.20.4' },
    ])
  })

  test('follows the era table, so 4.x also resolves the second jackson bom', () => {
    // 4.x pins `version-jackson2-databind` through a `Jackson 2 Bom` library the
    // 3.x table never names. Resolving the BOM set from the same table the
    // attributes are built from is what keeps the fetch and the synthesis from
    // disagreeing about which coordinates exist.
    const buildScript = `
bom {
  library("Jackson 2 Bom", "2.21.5") {
    group("com.fasterxml.jackson") {
      bom("jackson-bom")
    }
  }
  library("Jackson Bom", "3.1.5") {
    group("tools.jackson") {
      bom("jackson-bom")
    }
  }
}
`

    expect(versionSourceBoms(buildScript, '', BOOT_4_MANAGED_VERSIONS)).toEqual([
      { groupId: 'com.fasterxml.jackson', artifactId: 'jackson-bom', version: '2.21.5' },
      { groupId: 'tools.jackson', artifactId: 'jackson-bom', version: '3.1.5' },
    ])
    expect(versionSourceBoms(buildScript, '', BOOT_3_MANAGED_VERSIONS)).toEqual([
      { groupId: 'tools.jackson', artifactId: 'jackson-bom', version: '3.1.5' },
    ])
  })
})
