import { describe, expect, test } from 'bun:test'
import { securityAttributes } from '../../scripts/lib/security-attributes.ts'
import { parseVersionCatalog } from '../../scripts/lib/version-catalog.ts'

/** The shape of Spring Security's catalog, reduced to what the derivation reads. */
const CATALOG = parseVersionCatalog(`
[versions]
org-apache-directory-server = "1.5.5"
org-springframework = "6.2.12"

[libraries]
com-unboundid-unboundid-ldapsdk = "com.unboundid:unboundid-ldapsdk:6.0.11"
org-apache-directory-server-apacheds-core = { module = "org.apache.directory.server:apacheds-core", version.ref = "org-apache-directory-server" }
webauthn4j-core = 'com.webauthn4j:webauthn4j-core:0.29.7.RELEASE'
`)

const PROPERTIES = new Map([
  ['springBootVersion', '3.3.3'],
  ['samplesBranch', '6.5.x'],
  ['version', '6.5.6'],
])

function derive(overrides: {
  catalog?: ReturnType<typeof parseVersionCatalog>
  properties?: ReadonlyMap<string, string>
} = {}) {
  return securityAttributes({
    version: '6.5.6',
    catalog: overrides.catalog ?? CATALOG,
    gradleProperties: overrides.properties ?? PROPERTIES,
  })
}

describe('securityAttributes', () => {
  test('pins every documentation URL to the version being built', () => {
    const { attributes } = derive()

    expect(attributes['spring-security-version']).toBe('6.5.6')
    expect(attributes['security-api-url'])
      .toBe('https://docs.spring.io/spring-security/site/docs/6.5.6/api/')
    expect(attributes['gh-url'])
      .toBe('https://github.com/spring-projects/spring-security/tree/6.5.6')
  })

  test('takes the Framework version from the catalog, not from the build', () => {
    const { attributes } = derive()

    expect(attributes['spring-framework-reference-url'])
      .toBe('https://docs.spring.io/spring-framework/reference/6.2.12/')
    expect(attributes['spring-framework-api-url'])
      .toBe('https://docs.spring.io/spring-framework/docs/6.2.12/javadoc-api/')
  })

  test('points the samples at the branch gradle.properties names', () => {
    const { attributes } = derive()

    expect(attributes['gh-samples-url'])
      .toBe('https://github.com/spring-projects/spring-security-samples/tree/6.5.x')
  })

  test('links the Boot release a snapshot dependency was cut against', () => {
    // 7.0.7 carries `springBootVersion=4.0.0-SNAPSHOT`, and docs.spring.io
    // publishes no snapshot path — a URL built from it resolves nowhere.
    const { attributes } = derive({
      properties: new Map([...PROPERTIES, ['springBootVersion', '4.0.0-SNAPSHOT']]),
    })

    expect(attributes['spring-boot-reference-url']).toBe('https://docs.spring.io/spring-boot/4.0.0/')
  })

  test('derives the four dependency versions the corpus reads', () => {
    const { attributes, absent } = derive()

    expect(attributes['spring-core-version']).toBe('6.2.12')
    expect(attributes['apacheds-core-version']).toBe('1.5.5')
    expect(attributes['unboundid-ldapsdk-version']).toBe('6.0.11')
    expect(attributes['webauthn4j-core-version']).toBe('0.29.7.RELEASE')
    expect(absent).toEqual([])
  })

  test('reports a dependency the line does not carry instead of inventing one', () => {
    // 6.2 predates WebAuthn support, and 7.0 dropped ApacheDS; both are
    // upstream's own shape, and a page referencing one has to be traceable to
    // the version rather than to a derivation bug.
    const catalog = parseVersionCatalog(`
[versions]
org-springframework = "7.0.9"

[libraries]
com-unboundid-unboundid-ldapsdk = "com.unboundid:unboundid-ldapsdk:7.0.5"
`)
    const { attributes, absent } = derive({ catalog })

    expect(absent).toEqual(['apacheds-core-version', 'webauthn4j-core-version'])
    expect('apacheds-core-version' in attributes).toBe(false)
  })

  test('refuses a gradle.properties missing a value the build reads', () => {
    expect(() => derive({ properties: new Map([['samplesBranch', '6.5.x']]) }))
      .toThrow(/springBootVersion/)
  })

  test('refuses a catalog that declares no Framework version', () => {
    expect(() => derive({ catalog: parseVersionCatalog('[versions]\nother = "1.0"\n') }))
      .toThrow(/org-springframework/)
  })
})
