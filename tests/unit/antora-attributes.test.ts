import type { AttributeSources } from '../../scripts/lib/antora-attributes.ts'
import { describe, expect, test } from 'bun:test'
import {
  parseManagedVersions,
  parseProperties,
  synthesizeAttributes,
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
    ...overrides,
  }
}

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
})
