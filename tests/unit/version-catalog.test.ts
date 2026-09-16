import { describe, expect, test } from 'bun:test'
import { parseVersionCatalog } from '../../scripts/lib/version-catalog.ts'

describe('parseVersionCatalog', () => {
  test('reads the versions table', () => {
    const catalog = parseVersionCatalog('[versions]\norg-springframework = "6.2.12"\n')

    expect(catalog.versions['org-springframework']).toBe('6.2.12')
  })

  test('takes the version out of a group:artifact:version shorthand', () => {
    const catalog = parseVersionCatalog(
      '[libraries]\ncom-unboundid-unboundid-ldapsdk = "com.unboundid:unboundid-ldapsdk:6.0.11"\n',
    )

    expect(catalog.libraries['com-unboundid-unboundid-ldapsdk']).toBe('6.0.11')
  })

  test('resolves a version.ref through the versions table', () => {
    // How Spring Security declares ApacheDS: five artifacts, one shared version.
    const catalog = parseVersionCatalog(`
[versions]
org-apache-directory-server = "1.5.5"

[libraries]
org-apache-directory-server-apacheds-core = { module = "org.apache.directory.server:apacheds-core", version.ref = "org-apache-directory-server" }
`)

    expect(catalog.libraries['org-apache-directory-server-apacheds-core']).toBe('1.5.5')
  })

  test('reads a literal version off a table entry', () => {
    const catalog = parseVersionCatalog(
      '[libraries]\na = { module = "g:a", version = "1.0" }\n',
    )

    expect(catalog.libraries.a).toBe('1.0')
  })

  test('omits an entry that pins no version rather than reporting an empty one', () => {
    // A platform pins these; there is no version here to report, and an empty
    // string would read as one.
    const catalog = parseVersionCatalog(`
[libraries]
managed = { module = "g:a" }
short = "g:a"
`)

    expect('managed' in catalog.libraries).toBe(false)
    expect('short' in catalog.libraries).toBe(false)
  })

  test('omits a ref pointing at a version that is not declared', () => {
    const catalog = parseVersionCatalog(
      '[libraries]\na = { module = "g:a", version.ref = "absent" }\n',
    )

    expect('a' in catalog.libraries).toBe(false)
  })

  test('is empty, not a throw, for a catalog with neither table', () => {
    const catalog = parseVersionCatalog('[plugins]\nsome = "id:1.0"\n')

    expect(catalog.versions).toEqual({})
    expect(catalog.libraries).toEqual({})
  })

  test('refuses a file that is not TOML', () => {
    expect(() => parseVersionCatalog('= not toml =')).toThrow()
  })
})
