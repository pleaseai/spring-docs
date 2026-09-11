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
  /** Maps a catalog version to its upstream git tag. */
  readonly tagFor: (version: string) => string
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
    tagFor: version => `v${version}`,
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

  return {
    project,
    version,
    repo: definition.repo,
    cloneUrl: `https://github.com/${definition.repo}.git`,
    tag: definition.tagFor(version),
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
