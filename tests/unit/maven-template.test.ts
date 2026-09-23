import { describe, expect, test } from 'bun:test'
import {
  commitYearOf,
  fillTemplate,
  parentVersionOf,
  parsePom,
  pinnedVersionOf,
  resolveTemplateProperties,
} from '../../scripts/lib/maven-template.ts'

/** `spring-data-jpa`'s root `pom.xml` at 3.5.6, reduced to what the filter reads. */
const PROJECT_POM = `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <artifactId>spring-data-jpa-parent</artifactId>
  <version>3.5.6</version>
  <parent>
    <groupId>org.springframework.data.build</groupId>
    <artifactId>spring-data-parent</artifactId>
    <version>3.5.6</version>
  </parent>
  <properties>
    <hibernate>6.6.35.Final</hibernate>
    <!-- <springdata.commons>0.0.0</springdata.commons> -->
    <springdata.commons>3.5.6</springdata.commons>
  </properties>
  <profiles>
    <profile>
      <id>hibernate-62</id>
      <properties>
        <hibernate>6.2.38.Final</hibernate>
      </properties>
    </profile>
  </profiles>
</project>`

/** `spring-data-build`'s `parent/pom.xml` at 3.5.6, reduced likewise. */
const PARENT_POM = `<project>
  <artifactId>spring-data-parent</artifactId>
  <parent>
    <groupId>org.springframework.data.build</groupId>
    <artifactId>spring-data-build</artifactId>
    <version>3.5.6</version>
  </parent>
  <properties>
    <spring>6.2.13</spring>
    <documentation.baseurl>https://docs.spring.io</documentation.baseurl>
    <documentation.spring-javadoc-url>\${documentation.baseurl}/spring-framework/docs/\${spring}/javadoc-api</documentation.spring-javadoc-url>
    <spring-hateoas>2.5.1</spring-hateoas>
    <releasetrain>2025.0.6</releasetrain>
    <java-module-name/>
  </properties>
  <profiles>
    <profile>
      <id>spring6-next</id>
      <properties>
        <spring>6.2.11-SNAPSHOT</spring>
      </properties>
    </profile>
  </profiles>
</project>`

/** The store's resources template at 3.5.6, abridged. */
const TEMPLATE = `version: \${antora-component.version}
prerelease: \${antora-component.prerelease}

asciidoc:
  attributes:
    attribute-missing: 'warn'
    version: '\${project.version}'
    copyright-year: '\${current.year}'
    springversionshort: '\${spring.short}'
    springversion: '\${spring}'
    commons: '\${springdata.commons.docs}'
    include-xml-namespaces: false
    spring-data-commons-docs-url: '\${documentation.baseurl}/spring-data/commons/reference/\${springdata.commons.short}'
    spring-data-commons-javadoc-base: '{spring-data-commons-docs-url}/api/java'
    springjavadocurl: '\${documentation.spring-javadoc-url}'
    releasetrainversion: '\${releasetrain}'
    store: Jpa
`

function properties(overrides: { projectPom?: string, parentPom?: string } = {}) {
  return resolveTemplateProperties({
    version: '3.5.6',
    projectPom: overrides.projectPom ?? PROJECT_POM,
    parentPom: overrides.parentPom ?? PARENT_POM,
    commitYear: '2025',
  })
}

describe('parsePom', () => {
  test('reads the parent coordinates the parent POM is checked out by', () => {
    expect(parsePom(PROJECT_POM).parent).toEqual({
      groupId: 'org.springframework.data.build',
      artifactId: 'spring-data-parent',
      version: '3.5.6',
    })
  })

  test('reads top-level properties, not a profile\'s or a comment\'s', () => {
    // `hibernate-62` rebinds `hibernate` only when activated, and the
    // documentation build activates no such profile.
    const { properties } = parsePom(PROJECT_POM)

    expect(properties.get('hibernate')).toBe('6.6.35.Final')
    expect(properties.get('springdata.commons')).toBe('3.5.6')
  })
})

describe('resolveTemplateProperties', () => {
  test('lets the project override what it inherits', () => {
    const project = PROJECT_POM.replace(
      '<hibernate>6.6.35.Final</hibernate>',
      '<spring>6.2.14</spring>',
    )

    expect(properties({ projectPom: project }).get('spring')).toBe('6.2.14')
  })

  test('expands a property built from others', () => {
    expect(properties().get('documentation.spring-javadoc-url'))
      .toBe('https://docs.spring.io/spring-framework/docs/6.2.13/javadoc-api')
  })

  test('derives what the antrun step computes, as its regexes do', () => {
    const resolved = properties()

    expect(resolved.get('spring.short')).toBe('6.2')
    expect(resolved.get('springdata.commons.short')).toBe('3.5')
    expect(resolved.get('springdata.commons.docs')).toBe('3.5.6')
  })

  test('drops a qualifier the way the build does', () => {
    const parent = PARENT_POM.replace('<spring>6.2.13</spring>', '<spring>7.0.0-SNAPSHOT</spring>')

    expect(properties({ parentPom: parent }).get('spring.short')).toBe('7.0')
  })

  test('takes the year it is given rather than reading a clock', () => {
    // Upstream stamps the build machine's year; a rebuild of the same tag has to
    // produce the same bytes, so the caller pins it to the tag commit.
    expect(properties().get('current.year')).toBe('2025')
  })
})

describe('fillTemplate', () => {
  test('resolves every attribute from the two POMs', () => {
    expect(fillTemplate(TEMPLATE, properties())).toEqual({
      'attribute-missing': 'warn',
      'version': '3.5.6',
      'copyright-year': '2025',
      'springversionshort': '6.2',
      'springversion': '6.2.13',
      'commons': '3.5.6',
      'include-xml-namespaces': false,
      'spring-data-commons-docs-url': 'https://docs.spring.io/spring-data/commons/reference/3.5',
      'spring-data-commons-javadoc-base': '{spring-data-commons-docs-url}/api/java',
      'springjavadocurl': 'https://docs.spring.io/spring-framework/docs/6.2.13/javadoc-api',
      'releasetrainversion': '2025.0.6',
      'store': 'Jpa',
    })
  })

  test('keeps declaration order, which an attribute\'s own references rely on', () => {
    const names = Object.keys(fillTemplate(TEMPLATE, properties()))

    // Antora resolves `{spring-data-commons-docs-url}` against the attributes
    // already defined, so the reference has to come after its target.
    expect(names.indexOf('spring-data-commons-docs-url'))
      .toBeLessThan(names.indexOf('spring-data-commons-javadoc-base'))
  })

  test('names a property neither POM declares, rather than publishing it literally', () => {
    const template = `${TEMPLATE}    springdocsurl: '\${documentation.spring-reference-url}/{springversionshort}'\n`

    expect(() => fillTemplate(template, properties()))
      .toThrow(/documentation\.spring-reference-url/)
  })
})

describe('parentVersionOf', () => {
  const coordinates = 'org.springframework.data.build:spring-data-parent'

  test('is the version the parent POM is checked out at', () => {
    expect(parentVersionOf(PROJECT_POM, coordinates)).toBe('3.5.6')
  })

  test('refuses a POM inheriting from anything else', () => {
    // Reading another parent's properties would fill the template from a POM
    // upstream never filtered it against.
    const other = PROJECT_POM.replace('spring-data-parent', 'spring-boot-starter-parent')

    expect(() => parentVersionOf(other, coordinates)).toThrow(/spring-boot-starter-parent/)
    expect(() => parentVersionOf('<project/>', coordinates)).toThrow(/inherits from none/)
  })
})

describe('pinnedVersionOf', () => {
  test('is the GA version a property pins', () => {
    expect(pinnedVersionOf(properties(), 'springdata.commons')).toBe('3.5.6')
  })

  test('refuses an undeclared or pre-release version, which has no GA tag', () => {
    expect(() => pinnedVersionOf(properties(), 'springdata.keyvalue')).toThrow(/undeclared/)
    expect(() => pinnedVersionOf(new Map([['springdata.commons', '4.0.0-M1']]), 'springdata.commons'))
      .toThrow(/4\.0\.0-M1/)
  })
})

describe('commitYearOf', () => {
  test('takes the year in UTC, whatever offset the commit was made at', () => {
    expect(commitYearOf('2025-12-31T23:30:00-02:00')).toBe('2026')
    expect(commitYearOf('2025-11-20T09:00:00+09:00')).toBe('2025')
  })

  test('refuses a date it cannot read rather than stamping NaN', () => {
    expect(() => commitYearOf('')).toThrow(/ISO-8601/)
  })
})
