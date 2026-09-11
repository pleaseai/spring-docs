/**
 * Upstream source coordinates per Spring project.
 *
 * Pure data + pure functions. No I/O — `fetch-upstream.ts` performs the fetching.
 *
 * Two inputs make up one Antora content source (see ADR-0002):
 *   1. the component root, sparse-checked-out from the release tag
 *   2. the generated content zips Spring publishes to Maven Central
 */

/** Plain `major.minor.patch`; anything else is a pre-release. */
const GA_VERSION = /^\d+\.\d+\.\d+$/

/** Published Spring Boot documentation site. */
const SPRING_BOOT_DOCS = 'https://docs.spring.io/spring-boot'

/** Maven Central base for released Spring artifacts. */
const MAVEN_CENTRAL = 'https://repo1.maven.org/maven2'

/** One published Antora content archive. */
export interface ContentArchive {
  /** Maven classifier, e.g. `root-aggregate-content`. */
  readonly classifier: string
  /** Absolute download URL. */
  readonly url: string
}

/** Everything needed to acquire one `(project, version)` pair. */
export interface UpstreamCoordinates {
  /** Catalog project key, e.g. `boot`. */
  readonly project: string
  /** Upstream version, e.g. `4.1.1`. */
  readonly version: string
  /** `owner/name` of the upstream GitHub repository. */
  readonly repo: string
  /** Clone URL for the upstream repository. */
  readonly cloneUrl: string
  /** Git tag holding this version, e.g. `v4.1.1`. */
  readonly tag: string
  /** Repo-relative path of the Antora component root (holds `antora.yml`). */
  readonly componentPath: string
  /** Published archives to merge over the checked-out component root. */
  readonly archives: readonly ContentArchive[]
  /**
   * Base URL for `javadoc:` macro targets.
   *
   * Upstream points these at an `api` Antora component built from a javadoc
   * archive. That component is not built here, so the macros are pointed at the
   * published aggregated javadoc instead — otherwise every one of them resolves
   * to a dangling `#api:java/...` fragment.
   */
  readonly javadocLocation: string
  /**
   * Antora components referenced by `xref:` that this build does not produce,
   * mapped to the base URL of their published documentation.
   *
   * Antora leaves a reference into an absent component as a dangling
   * `#<component>:<path>` fragment. Rewriting those to the upstream site keeps
   * the link useful instead of emitting a fragment that resolves nowhere.
   */
  readonly externalComponents: Readonly<Record<string, string>>
}

/** Static definition of a supported upstream project. */
interface ProjectDefinition {
  readonly repo: string
  readonly componentPath: string
  readonly mavenGroupPath: string
  readonly mavenArtifact: string
  readonly archiveClassifiers: readonly string[]
  readonly externalComponentsFor: (version: string) => Readonly<Record<string, string>>
  /** Prefix the upstream repository puts in front of a version to form a tag. */
  readonly tagPrefix: string
  /**
   * Oldest version this pipeline can build.
   *
   * A cheap pre-filter over what upstream actually publishes — the authority is
   * whether the content archives exist, which `detect-upstream-versions.ts`
   * checks per candidate version.
   */
  readonly minimumVersion: string
  /** Maps a catalog version to its published aggregated javadoc base URL. */
  readonly javadocLocationFor: (version: string) => string
}

const PROJECTS: Readonly<Record<string, ProjectDefinition>> = {
  boot: {
    repo: 'spring-projects/spring-boot',
    componentPath: 'documentation/spring-boot-docs/src/docs/antora',
    mavenGroupPath: 'org/springframework/boot',
    mavenArtifact: 'spring-boot-docs',
    // `root-aggregate-content` carries the generated component descriptor
    // (912 resolved attributes) plus the ROOT:example$ java/kotlin sample tree
    // that `include-code::` resolves against.
    archiveClassifiers: ['root-aggregate-content'],
    // Separate Antora components, published as their own artifacts and not built
    // here. Their xref targets are rewritten to the upstream documentation site.
    externalComponentsFor: version => ({
      // `api` is referenced two ways: `javadoc:` macros resolve through
      // `javadoc-location`, but the generated auto-configuration tables in the
      // appendix write `xref:api:java/...` directly.
      'api': `${SPRING_BOOT_DOCS}/${version}/api`,
      'gradle-plugin': `${SPRING_BOOT_DOCS}/${version}/gradle-plugin`,
      'maven-plugin': `${SPRING_BOOT_DOCS}/${version}/maven-plugin`,
    }),
    tagPrefix: 'v',
    // Not a compatibility guess: `spring-boot-docs` is published to Maven Central
    // only for 2.2.x-2.4.2 and then again from 4.0.8, and this pipeline needs that
    // artifact's `root-aggregate-content` archive. 4.0.0-4.0.7 and 4.1.0 have no
    // archive at all, so they cannot be built however the converter behaves.
    minimumVersion: '4.0.8',
    javadocLocationFor: version => `${SPRING_BOOT_DOCS}/${version}/api/java`,
  },
}

/** Project keys this pipeline knows how to fetch. */
export function supportedProjects(): readonly string[] {
  return Object.keys(PROJECTS).sort()
}

/**
 * Build the Maven Central download URL for one published archive.
 *
 * @example
 * mavenArchiveUrl('org/springframework/boot', 'spring-boot-docs', '4.1.1', 'root-aggregate-content')
 * // https://repo1.maven.org/maven2/org/springframework/boot/spring-boot-docs/4.1.1/spring-boot-docs-4.1.1-root-aggregate-content.zip
 */
export function mavenArchiveUrl(
  groupPath: string,
  artifact: string,
  version: string,
  classifier: string,
): string {
  return `${MAVEN_CENTRAL}/${groupPath}/${artifact}/${version}/${artifact}-${version}-${classifier}.zip`
}

/**
 * Resolve the coordinates for one `(project, version)` pair.
 *
 * @throws if the project is not supported, or the version is not a plain GA version.
 */
export function resolveUpstream(project: string, version: string): UpstreamCoordinates {
  const definition = PROJECTS[project]
  if (!definition) {
    throw new Error(
      `Unknown project "${project}". Supported: ${supportedProjects().join(', ')}`,
    )
  }

  if (!isGaVersion(version)) {
    throw new Error(
      `Version "${version}" is not a GA version. `
      + `Pre-release versions (M*, RC*, SNAPSHOT) are out of scope — see product.md.`,
    )
  }

  // Canonical on both sides: the floor is a question about numeric value, not
  // about key identity, so a leading-zero spelling of the floor itself must pass.
  if (compareGaVersions(canonicalGaVersion(version), canonicalGaVersion(definition.minimumVersion)) < 0) {
    throw new Error(
      `Version "${version}" of "${project}" is below the supported floor `
      + `${definition.minimumVersion}: the documentation layout and published archives differ there.`,
    )
  }

  return {
    project,
    version,
    repo: definition.repo,
    cloneUrl: `https://github.com/${definition.repo}.git`,
    tag: `${definition.tagPrefix}${version}`,
    componentPath: definition.componentPath,
    archives: definition.archiveClassifiers.map(classifier => ({
      classifier,
      url: mavenArchiveUrl(
        definition.mavenGroupPath,
        definition.mavenArtifact,
        version,
        classifier,
      ),
    })),
    javadocLocation: definition.javadocLocationFor(version),
    externalComponents: definition.externalComponentsFor(version),
  }
}

/**
 * True for plain `major.minor.patch` GA versions.
 *
 * Milestones, release candidates and snapshots are deliberately rejected:
 * only GA versions are built (ARCHITECTURE.md, Distribution Invariants).
 */
export function isGaVersion(version: string): boolean {
  return GA_VERSION.test(version)
}

/**
 * Clone URL of a project's upstream repository.
 *
 * Version-independent, unlike {@link resolveUpstream}: tag discovery has to
 * reach the repository before any version is known.
 *
 * @throws if the project is not supported.
 */
export function cloneUrlFor(project: string): string {
  const definition = PROJECTS[project]
  if (!definition)
    throw new Error(`Unknown project "${project}". Supported: ${supportedProjects().join(', ')}`)
  return `https://github.com/${definition.repo}.git`
}

/** Leading zeroes of a digit run. */
const LEADING_ZEROES = /^0+/

/** Drop leading zeroes from a digit run, keeping "0" for an all-zero segment. */
function magnitudeOf(segment: string): string {
  const stripped = segment.replace(LEADING_ZEROES, '')
  return stripped === '' ? '0' : stripped
}

/**
 * The one spelling of a GA version that carries its numeric value.
 *
 * `4.00.8`, `04.0.8` and `0004.000.0008` all canonicalize to `4.0.8`. Use this
 * wherever the question is "which version is this", as opposed to "which key is
 * this": {@link compareGaVersions} deliberately orders numerically-equal
 * spellings rather than reporting them equal, so a raw floor comparison would
 * reject `04.0.8` as *below* a `4.0.8` floor it actually meets.
 */
function canonicalGaVersion(version: string): string {
  return version.split('.').map(magnitudeOf).join('.')
}

/**
 * Compare two GA version segments (each a run of digits, per `GA_VERSION`)
 * by numeric magnitude, without going through `Number`.
 *
 * `GA_VERSION` places no bound on segment length and allows leading zeroes,
 * and `Number` mishandles both: `Number("04") === Number("4")`, so two
 * distinct segments compare equal, and a segment long enough overflows to
 * `Infinity` — `Infinity - Infinity` is `NaN`, an invalid `Array#sort`
 * comparator result. Comparing the digit strings directly avoids both: same
 * length compares lexicographically (exact, since every character is a
 * digit), and a longer run of digits is always the larger number, so length
 * decides first.
 *
 * Leading zeroes are stripped *before* that length test, because digit count
 * is only a proxy for magnitude once they are gone: raw, "00" would outrank
 * "8", so `4.00.0` would sort above `4.0.8` and slip past the supported floor
 * in {@link resolveUpstream}. Two spellings of one number therefore compare
 * equal here; {@link compareGaVersions} separates them at whole-version level,
 * where doing so cannot mask a difference in a later, more significant segment.
 */
function compareGaSegment(a: string, b: string): number {
  const left = magnitudeOf(a)
  const right = magnitudeOf(b)
  if (left.length !== right.length)
    return left.length - right.length
  return left < right ? -1 : left > right ? 1 : 0
}

/**
 * Order two GA versions numerically.
 *
 * Returns a negative number when `a` precedes `b`, as `Array#sort` expects.
 * String comparison would place `4.10.0` before `4.9.0`, so each segment is
 * compared with {@link compareGaSegment} instead of lexically as a whole
 * string.
 *
 * Two versions that are numerically equal but spelled differently (`4.01.1`
 * and `4.1.1`) are distinct catalog keys, so they are ordered by the raw
 * string rather than reported equal. That tie-break runs only once every
 * segment has compared equal — applying it per segment would let a spelling
 * difference in the minor short-circuit a real difference in the patch.
 *
 * @throws if either argument is not a GA version.
 */
export function compareGaVersions(a: string, b: string): number {
  if (!isGaVersion(a) || !isGaVersion(b))
    throw new Error(`Not GA versions: "${a}", "${b}"`)

  const left = a.split('.')
  const right = b.split('.')
  for (let i = 0; i < 3; i++) {
    const diff = compareGaSegment(left[i] ?? '0', right[i] ?? '0')
    if (diff !== 0)
      return diff
  }
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * Order two catalog version keys, without ever throwing.
 *
 * `catalog.json` version keys are typed as any non-empty string
 * (`catalog-schema.ts`) and `validate-catalog.ts` accepts a pre-release one
 * (e.g. `4.2.0-RC1`) even though {@link resolveUpstream} refuses to build it —
 * a catalog can legitimately hold a non-GA key. `compareGaVersions` documents
 * `@throws` for a non-GA argument, by design: {@link resolveUpstream} depends
 * on that throw. So `serializeCatalog` cannot sort with `compareGaVersions`
 * directly without turning from a total function into a partial one.
 *
 * The rule here: GA keys sort numerically among themselves and precede every
 * non-GA key; non-GA keys sort lexicographically among themselves. That keeps
 * the common case (all-GA) numerically ordered exactly as before, gives a
 * stable place for the rare non-GA key, and never throws regardless of input.
 */
export function compareVersionKeys(a: string, b: string): number {
  const aIsGa = isGaVersion(a)
  const bIsGa = isGaVersion(b)
  if (aIsGa && bIsGa)
    return compareGaVersions(a, b)
  if (aIsGa !== bIsGa)
    return aIsGa ? -1 : 1
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * The versions of `project` this pipeline would build, given upstream's tag names.
 *
 * Drops tags that are not this project's release tags, pre-releases, and
 * anything below the project's supported floor. Sorted oldest first.
 *
 * @throws if the project is not supported.
 */
export function supportedVersionsFromTags(
  project: string,
  tags: readonly string[],
): readonly string[] {
  const definition = PROJECTS[project]
  if (!definition)
    throw new Error(`Unknown project "${project}". Supported: ${supportedProjects().join(', ')}`)

  return tags
    .filter(tag => tag.startsWith(definition.tagPrefix))
    .map(tag => tag.slice(definition.tagPrefix.length))
    .filter(version => isGaVersion(version))
    // Same floor rule as `resolveUpstream`, canonical on both sides — the two
    // must agree, or detection would offer a version the build then refuses.
    .filter(version => compareGaVersions(canonicalGaVersion(version), canonicalGaVersion(definition.minimumVersion)) >= 0)
    .sort(compareGaVersions)
}
