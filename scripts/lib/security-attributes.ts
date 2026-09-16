/**
 * Rebuild the attributes Spring Security's Gradle build contributes to its
 * component descriptor.
 *
 * `docs/spring-security-docs.gradle` fills `generateAntoraYml` from two sources:
 * `generateAttributes()`, which builds documentation URLs out of three committed
 * values, and `resolvedVersions(testRuntimeClasspath)`, which turns the whole
 * resolved test classpath into `<artifact>-version` attributes. Only four of the
 * latter are referenced by the corpus, and every version behind them is declared
 * in the committed version catalog — so the reconstruction needs no Gradle, no
 * dependency resolution and no network.
 *
 * Pure: no I/O, no clock. `fetch-upstream.ts` reads the two files.
 */

import type { Attributes } from './component-descriptor.ts'
import type { VersionCatalog } from './version-catalog.ts'

/** Published documentation site. */
const DOCS_SITE = 'https://docs.spring.io'

/** The upstream GitHub organization, as the build script spells it. */
const GITHUB_ORG = 'https://github.com/spring-projects'

/**
 * Samples that moved out of the main repository after 5.4.
 *
 * A constant in `generateAttributes()` too — the old samples live on a branch
 * that is never rebuilt, so this does not follow the version.
 */
const OLD_SAMPLES_URL = `${GITHUB_ORG}/spring-security/tree/5.4.x/samples`

/** A pre-release or snapshot qualifier on a version, e.g. `-SNAPSHOT`, `-M2`. */
const QUALIFIER = /-.*$/

/** Everything the derivation reads, already parsed. */
export interface SecurityAttributeSources {
  /** The version being built, which is also `project.version` in the build. */
  readonly version: string
  /** The committed `gradle/libs.versions.toml`. */
  readonly catalog: VersionCatalog
  /** The committed `gradle.properties`. */
  readonly gradleProperties: ReadonlyMap<string, string>
}

/** The derived attributes, plus what this version's catalog does not pin. */
export interface DerivedSecurityAttributes {
  readonly attributes: Attributes
  /**
   * Dependency-version attributes absent from this version's catalog.
   *
   * The dependency set moves with the line — 6.2 predates the WebAuthn support
   * that brings in `webauthn4j-core`, and 7.0 dropped ApacheDS — so an attribute
   * missing here is upstream's own shape, not a failure. It is reported rather
   * than dropped quietly, because the page that references one would otherwise
   * publish a literal `{…-version}` with nothing naming the cause.
   */
  readonly absent: readonly string[]
}

/**
 * The four `<artifact>-version` attributes the corpus actually reads, and where
 * each one's version is declared in the catalog.
 *
 * `resolvedVersions()` generates one per resolved artifact — hundreds — but a
 * reconstruction is measured by what the pages reference, not by what the task
 * emits. `spring-core` takes the `[versions]` entry behind `spring-framework-bom`,
 * which is what pins it; the other three are library aliases.
 */
const DEPENDENCY_VERSIONS: readonly {
  readonly attribute: string
  readonly table: 'versions' | 'libraries'
  readonly alias: string
}[] = [
  { attribute: 'spring-core-version', table: 'versions', alias: 'org-springframework' },
  {
    attribute: 'apacheds-core-version',
    table: 'libraries',
    alias: 'org-apache-directory-server-apacheds-core',
  },
  {
    attribute: 'unboundid-ldapsdk-version',
    table: 'libraries',
    alias: 'com-unboundid-unboundid-ldapsdk',
  },
  { attribute: 'webauthn4j-core-version', table: 'libraries', alias: 'webauthn4j-core' },
]

/**
 * Build the generated half of Spring Security's descriptor.
 *
 * @throws if `gradle.properties` is missing a value the build script reads.
 */
export function securityAttributes(
  sources: SecurityAttributeSources,
): DerivedSecurityAttributes {
  const { version, catalog, gradleProperties } = sources

  const samplesBranch = requiredProperty(gradleProperties, 'samplesBranch')
  // Upstream points Boot links at whatever `gradle.properties` carries, which on
  // a maintenance line is a snapshot (`4.0.0-SNAPSHOT` at 7.0.7). docs.spring.io
  // publishes no snapshot path, so the qualifier is dropped and the release it
  // was cut against is linked instead — the same reason the Framework era stopped
  // taking image URLs from a base that only appeared to be version-pinned.
  const bootVersion = release(requiredProperty(gradleProperties, 'springBootVersion'))
  // `generateAttributes()` strips the qualifier here itself.
  const frameworkVersion = release(requiredCatalogVersion(catalog, 'org-springframework'))

  const attributes: Record<string, string> = {
    'gh-old-samples-url': OLD_SAMPLES_URL,
    'gh-samples-url': `${GITHUB_ORG}/spring-security-samples/tree/${samplesBranch}`,
    'gh-url': `${GITHUB_ORG}/spring-security/tree/${version}`,
    'security-api-url': `${DOCS_SITE}/spring-security/site/docs/${version}/api/`,
    'security-reference-url': `${DOCS_SITE}/spring-security/site/docs/${version}/reference/html5/`,
    'spring-framework-api-url': `${DOCS_SITE}/spring-framework/docs/${frameworkVersion}/javadoc-api/`,
    'spring-framework-reference-url': `${DOCS_SITE}/spring-framework/reference/${frameworkVersion}/`,
    'spring-boot-api-url': `${DOCS_SITE}/spring-boot/${bootVersion}/api/java/`,
    'spring-boot-reference-url': `${DOCS_SITE}/spring-boot/${bootVersion}/`,
    'spring-security-version': version,
  }

  const absent: string[] = []
  for (const { attribute, table, alias } of DEPENDENCY_VERSIONS) {
    const declared = catalog[table][alias]
    if (declared === undefined)
      absent.push(attribute)
    else
      attributes[attribute] = declared
  }

  return { attributes, absent }
}

/** A version with any pre-release or snapshot qualifier removed. */
function release(version: string): string {
  return version.replace(QUALIFIER, '')
}

/**
 * One `gradle.properties` value the build script reads.
 *
 * `project.property()` throws upstream when it is absent, and so does this: the
 * value feeds a published URL, and a build whose inputs moved should stop here
 * rather than emit `undefined` into one.
 */
function requiredProperty(properties: ReadonlyMap<string, string>, name: string): string {
  const value = properties.get(name)
  if (value === undefined || value === '')
    throw new Error(`gradle.properties carries no "${name}", which the documentation build reads`)
  return value
}

/** One `[versions]` entry the derivation cannot do without. */
function requiredCatalogVersion(catalog: VersionCatalog, alias: string): string {
  const value = catalog.versions[alias]
  if (value === undefined)
    throw new Error(`The version catalog declares no "${alias}" version`)
  return value
}
