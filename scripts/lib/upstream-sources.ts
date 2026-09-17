/**
 * Upstream source coordinates per Spring project.
 *
 * Pure data + pure functions. No I/O — `fetch-upstream.ts` performs the fetching.
 *
 * One Antora content source is assembled from the component root, sparse-checked
 * out from the release tag, plus the generated half of the component. Where that
 * generated half comes from depends on the version's layout era (ADR-0004):
 * published content zips for Boot 4.0.8+, reconstruction from the tag for Boot
 * 3.3-4.0.7, and — where a project commits a descriptor its build only tops up —
 * an overlay of the checked-in one.
 */

import type { ManagedVersionAttribute } from './antora-attributes.ts'
import type { Attributes } from './component-descriptor.ts'
import type { DeclaredSymlink } from './reject-symlinks.ts'
import {
  BOOT_3_MANAGED_VERSIONS,
  BOOT_4_MANAGED_VERSIONS,
  parseProperties,
} from './antora-attributes.ts'
import { securityAttributes } from './security-attributes.ts'
import { parseVersionCatalog } from './version-catalog.ts'

/** Plain `major.minor.patch`; anything else is a pre-release. */
const GA_VERSION = /^\d+\.\d+\.\d+$/

/** Published Spring Boot documentation site. */
const SPRING_BOOT_DOCS = 'https://docs.spring.io/spring-boot'

/** Spring Framework sources served straight from a release tag. */
const SPRING_FRAMEWORK_RAW = 'https://raw.githubusercontent.com/spring-projects/spring-framework'

/** Spring Security sources served straight from a release tag. */
const SPRING_SECURITY_RAW = 'https://raw.githubusercontent.com/spring-projects/spring-security'

/** Maven Central base for released Spring artifacts. */
const MAVEN_CENTRAL = 'https://repo1.maven.org/maven2'

/** One published Antora content archive. */
export interface ContentArchive {
  /** Maven classifier, e.g. `root-aggregate-content`. */
  readonly classifier: string
  /** Absolute download URL. */
  readonly url: string
}

/** One published jar whose `META-INF` carries configuration-property metadata. */
export interface MetadataJar {
  /** Maven artifact id, which is also the partial directory it is dropped into. */
  readonly artifact: string
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
  /** How the generated half of the component is assembled for this version. */
  readonly assembly: ComponentAssembly
  /**
   * Published archives to merge over the checked-out component root.
   *
   * Empty for a synthesized or overlay era, neither of which has one to merge.
   */
  readonly archives: readonly ContentArchive[]
  /**
   * Published jars supplying the configuration-property metadata a synthesized
   * era drops in as partials.
   *
   * Empty for an archive era, which gets that metadata inside the zip, and for
   * an overlay era, whose project publishes none.
   *
   * Resolved here rather than at the download site so the availability gate and
   * the download cannot disagree about where an artifact lives — the same
   * single-sourcing {@link archives} already gives the archive era.
   */
  readonly metadataJars: readonly MetadataJar[]
  /**
   * Repo-relative paths the sparse checkout must materialize.
   *
   * Always includes {@link componentPath}; a synthesized era adds the build
   * inputs its reconstruction reads.
   */
  readonly checkoutPaths: readonly string[]
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
  /**
   * Base URL of this version's published `_images/` directory.
   *
   * Image assets ship inside the component but not inside a release archive,
   * which carries Markdown only — so block images are linked to the published
   * site rather than to a path that would not survive extraction. Pinned to the
   * exact version, like every other reference this pipeline emits.
   */
  readonly imageBase: string
}

/** Where an era's component descriptor and generated content come from. */
export type DescriptorSource = 'archive' | 'synthesized' | 'overlay'

/**
 * Repo-relative inputs used to rebuild what Spring's Gradle build would have
 * generated, for an era that publishes no content archive.
 *
 * Every path here is checked out from the release tag, so the reconstruction is
 * pinned to the same commit as the prose it accompanies.
 */
export interface SynthesisSources {
  /** Directory whose *contents* become `modules/ROOT/examples`. */
  readonly examplesPath: string
  /** Java properties file of asciidoc attributes that carry no version. */
  readonly staticAttributesPath: string
  /** Build script declaring the dependency BOM's libraries and their links. */
  readonly bomBuildScriptPath: string
  /** Properties file holding toolchain versions the BOM does not manage. */
  readonly gradlePropertiesPath: string
  /**
   * The dependency-version attributes this era's upstream build declares.
   *
   * Not derivable from the paths above: the `addDependencyVersion` calls live in
   * `AntoraAsciidocAttributes.java`, and 4.x renamed the Jackson coordinates
   * three of them read. Pinned with the paths so an era cannot take one line's
   * build inputs and the other line's reading of them.
   */
  readonly managedVersionAttributes: readonly ManagedVersionAttribute[]
  /**
   * Maven artifact ids whose published jar ships
   * `META-INF/spring-configuration-metadata.json`.
   *
   * `configprop:` resolves against any partial with that basename, regardless of
   * directory (see `configuration-properties-extension.js`), so these are merely
   * dropped under `modules/ROOT/partials/<artifact>/`.
   */
  readonly metadataArtifacts: readonly string[]
}

/**
 * Attributes an overlay era derives from files in the checkout.
 *
 * Spring Framework's generated half is a function of the version alone, so it is
 * resolved before the clone. Spring Security's is not: its build reads the
 * committed version catalog and `gradle.properties`, so the values only exist
 * once the tag is checked out. Naming those files here rather than reading them
 * in the era keeps this module free of I/O and keeps the sparse checkout and the
 * derivation from disagreeing about which paths are needed.
 */
export interface DerivedAttributes {
  /**
   * Repo-relative files the derivation reads.
   *
   * Added to the era's `checkoutPaths`, so declaring one is what makes it
   * present.
   */
  readonly sources: readonly string[]
  /**
   * Pure: the version plus the contents of {@link sources}, keyed by path.
   *
   * @throws if a source has moved or lost a value the upstream build reads.
   */
  readonly resolve: (
    version: string,
    sources: Readonly<Record<string, string>>,
  ) => DerivedAttributeResult
}

/** What a {@link DerivedAttributes.resolve} produced, and what it could not. */
export interface DerivedAttributeResult {
  readonly attributes: Attributes
  /**
   * Attributes the checkout does not declare a value for.
   *
   * Reported rather than dropped: a corpus referencing one publishes a literal
   * `{name}`, and the operator needs the name to tell an upstream change from a
   * derivation bug.
   */
  readonly absent: readonly string[]
}

/**
 * How one era's component content is assembled, as resolved for one version.
 *
 * Pure data, with one exception: an overlay era's {@link DerivedAttributes}
 * carries the function that reads its sources, because those sources do not
 * exist until the checkout. Everything the *version* determines is already
 * evaluated by {@link resolveUpstream}, and nothing here reaches the release
 * manifest but `descriptor`.
 */
export type ComponentAssembly
  = | { readonly descriptor: 'archive', readonly archiveClassifiers: readonly string[] }
    | { readonly descriptor: 'synthesized', readonly synthesis: SynthesisSources }
    | {
      readonly descriptor: 'overlay'
      readonly generatedAttributes: Attributes
      readonly derivedAttributes?: DerivedAttributes
      readonly internalSymlinks: readonly DeclaredSymlink[]
    }

/**
 * How an era declares its assembly, before a version is known.
 *
 * Identical to {@link ComponentAssembly} except for the overlay era, whose
 * generated attributes are a function of the version — `spring-version` is the
 * version — and so cannot be spelled in a static era table.
 */
type EraAssembly
  = | { readonly descriptor: 'archive', readonly archiveClassifiers: readonly string[] }
    | { readonly descriptor: 'synthesized', readonly synthesis: SynthesisSources }
    | {
      readonly descriptor: 'overlay'
      readonly generatedAttributesFor: (version: string) => Attributes
      /** Attributes read out of the checkout, for a build that resolves versions. */
      readonly derivedAttributes?: DerivedAttributes
      /**
       * Component-root-relative symlinks this layout ships, each paired with
       * its expected component-root-relative target, to be replaced by real
       * copies of what they point at before the tree is copied in.
       *
       * Declared rather than discovered, and pinned by target as well as path:
       * an undeclared link still fails the copy guard, and a declared one
       * resolving anywhere but its pinned target fails too, so upstream
       * adding, moving or retargeting one surfaces as a build failure instead
       * of being silently followed.
       */
      readonly internalSymlinks: readonly DeclaredSymlink[]
    }

/**
 * One documentation layout era of an upstream project.
 *
 * Spring Boot has moved its Antora component and changed how — and whether —
 * the generated half of it reaches the public, and the two did not move
 * together: 3.3.0 introduced the component but its content archives are
 * excluded from the Maven Central sync
 * (`.github/actions/sync-to-maven-central/artifacts.spec`); 4.0.0 relocated it
 * under `documentation/` while the archives stayed unpublished; 4.0.8 is where
 * they first appear. An era pins both facts together, because getting one
 * without the other produces a tree that classifies but converts with
 * unresolved attributes.
 */
interface LayoutEra {
  /** Inclusive floor: the oldest version built with this layout. */
  readonly since: string
  /**
   * Exclusive ceiling, when the era does not run to the newest release.
   *
   * Adjacent eras can share neither their component path nor their assembly:
   * 4.0.0 moved the component to `documentation/` while still publishing no
   * content archive, and 4.0.8 began publishing one without moving anything.
   * Each boundary needs a ceiling — without one an era would swallow the next
   * and fetch from a path, or an archive, that does not exist at its tag.
   */
  readonly until?: string
  /** Repo-relative path of the Antora component root (holds `antora.yml`). */
  readonly componentPath: string
  /** How the generated half of the component is obtained. */
  readonly assembly: EraAssembly
}

/** Static definition of a supported upstream project. */
interface ProjectDefinition {
  readonly repo: string
  /**
   * Maven coordinates of the artifact publishing this project's content
   * archives or metadata jars.
   *
   * Absent for a project none of whose eras reads Maven Central — an overlay
   * era needs nothing but the git checkout. {@link resolveUpstream} refuses an
   * archive or synthesized era declared without them rather than building a URL
   * around `undefined`.
   */
  readonly mavenGroupPath?: string
  readonly mavenArtifact?: string
  readonly externalComponentsFor: (version: string) => Readonly<Record<string, string>>
  /** Prefix the upstream repository puts in front of a version to form a tag. */
  readonly tagPrefix: string
  /** Layout eras, oldest first. The first one's `since` is the supported floor. */
  readonly eras: readonly [LayoutEra, ...LayoutEra[]]
  /** Maps a catalog version to its published `_images/` base URL. */
  readonly imageBaseFor: (version: string) => string
  /** Maps a catalog version to its published aggregated javadoc base URL. */
  readonly javadocLocationFor: (version: string) => string
}

/**
 * Modules whose jar carries configuration-property metadata in the 3.3-3.5 line.
 *
 * Measured against 3.5.16, not guessed: `spring-boot-test` publishes a jar but
 * ships no `META-INF/spring-configuration-metadata.json`, so it is absent here.
 */
const BOOT_3_METADATA_ARTIFACTS = [
  'spring-boot',
  'spring-boot-actuator',
  'spring-boot-actuator-autoconfigure',
  'spring-boot-autoconfigure',
  'spring-boot-devtools',
  'spring-boot-docker-compose',
  'spring-boot-test-autoconfigure',
  'spring-boot-testcontainers',
] as const

/**
 * Modules whose jar carries configuration-property metadata in the 4.0.x line.
 *
 * Boot 4 split the three 3.x module trees into ~140 projects, so
 * {@link BOOT_3_METADATA_ARTIFACTS} does not carry over. Measured two ways that
 * agree exactly on these 103 (2026-09-17): they are the artifacts the 4.0.8
 * content archive ships a `spring-configuration-metadata.json` partial for, and
 * every one of them publishes a 4.0.0 and a 4.0.7 jar carrying
 * `META-INF/spring-configuration-metadata.json`. Of the 34 other modules v4.0.0
 * declares, 4 publish no jar and 30 publish one with no metadata file —
 * `spring-boot-test` among them, as in 3.x.
 */
const BOOT_4_METADATA_ARTIFACTS = [
  'spring-boot',
  'spring-boot-activemq',
  'spring-boot-actuator',
  'spring-boot-actuator-autoconfigure',
  'spring-boot-amqp',
  'spring-boot-artemis',
  'spring-boot-autoconfigure',
  'spring-boot-batch',
  'spring-boot-batch-jdbc',
  'spring-boot-cache',
  'spring-boot-cache-test',
  'spring-boot-cassandra',
  'spring-boot-couchbase',
  'spring-boot-data-cassandra',
  'spring-boot-data-commons',
  'spring-boot-data-couchbase',
  'spring-boot-data-elasticsearch',
  'spring-boot-data-jdbc',
  'spring-boot-data-jpa',
  'spring-boot-data-ldap',
  'spring-boot-data-mongodb',
  'spring-boot-data-neo4j',
  'spring-boot-data-r2dbc',
  'spring-boot-data-redis',
  'spring-boot-data-rest',
  'spring-boot-devtools',
  'spring-boot-docker-compose',
  'spring-boot-elasticsearch',
  'spring-boot-flyway',
  'spring-boot-freemarker',
  'spring-boot-graphql',
  'spring-boot-groovy-templates',
  'spring-boot-gson',
  'spring-boot-h2console',
  'spring-boot-hateoas',
  'spring-boot-hazelcast',
  'spring-boot-health',
  'spring-boot-hibernate',
  'spring-boot-http-client',
  'spring-boot-http-codec',
  'spring-boot-http-converter',
  'spring-boot-integration',
  'spring-boot-jackson',
  'spring-boot-jackson2',
  'spring-boot-jdbc',
  'spring-boot-jdbc-test',
  'spring-boot-jersey',
  'spring-boot-jetty',
  'spring-boot-jms',
  'spring-boot-jooq',
  'spring-boot-jpa',
  'spring-boot-kafka',
  'spring-boot-kotlinx-serialization-json',
  'spring-boot-ldap',
  'spring-boot-liquibase',
  'spring-boot-mail',
  'spring-boot-micrometer-metrics',
  'spring-boot-micrometer-metrics-test',
  'spring-boot-micrometer-observation',
  'spring-boot-micrometer-tracing',
  'spring-boot-micrometer-tracing-brave',
  'spring-boot-micrometer-tracing-opentelemetry',
  'spring-boot-micrometer-tracing-test',
  'spring-boot-mongodb',
  'spring-boot-mustache',
  'spring-boot-neo4j',
  'spring-boot-netty',
  'spring-boot-opentelemetry',
  'spring-boot-persistence',
  'spring-boot-pulsar',
  'spring-boot-quartz',
  'spring-boot-r2dbc',
  'spring-boot-reactor',
  'spring-boot-reactor-netty',
  'spring-boot-restclient-test',
  'spring-boot-restdocs',
  'spring-boot-rsocket',
  'spring-boot-security',
  'spring-boot-security-oauth2-authorization-server',
  'spring-boot-security-oauth2-client',
  'spring-boot-security-oauth2-resource-server',
  'spring-boot-security-saml2',
  'spring-boot-sendgrid',
  'spring-boot-servlet',
  'spring-boot-session',
  'spring-boot-session-data-redis',
  'spring-boot-session-jdbc',
  'spring-boot-sql',
  'spring-boot-test-autoconfigure',
  'spring-boot-testcontainers',
  'spring-boot-thymeleaf',
  'spring-boot-tomcat',
  'spring-boot-transaction',
  'spring-boot-validation',
  'spring-boot-web-server',
  'spring-boot-webflux',
  'spring-boot-webflux-test',
  'spring-boot-webmvc',
  'spring-boot-webmvc-test',
  'spring-boot-webservices',
  'spring-boot-webservices-test',
  'spring-boot-websocket',
  'spring-boot-zipkin',
] as const

/** The committed version catalog Spring Security's build resolves against. */
const SECURITY_CATALOG_PATH = 'gradle/libs.versions.toml'

/** Where Spring Security commits `springBootVersion` and `samplesBranch`. */
const SECURITY_PROPERTIES_PATH = 'gradle.properties'

/**
 * Spring Security's generated attributes, derived from two committed files.
 *
 * Shared by both of its eras: the layout moved between them, the derivation did
 * not. See `security-attributes.ts` for what the upstream build does with these.
 */
const SECURITY_ATTRIBUTES: DerivedAttributes = {
  sources: [SECURITY_CATALOG_PATH, SECURITY_PROPERTIES_PATH],
  resolve: (version, sources) => securityAttributes({
    version,
    catalog: parseVersionCatalog(requiredSource(sources, SECURITY_CATALOG_PATH)),
    gradleProperties: parseProperties(requiredSource(sources, SECURITY_PROPERTIES_PATH)),
  }),
}

/**
 * One declared attribute source, as read by the caller.
 *
 * Reaching here without it means the fetch read a different set of paths than
 * the era declared, which is a wiring bug rather than bad input — so it throws
 * instead of deriving attributes from an empty file.
 */
function requiredSource(sources: Readonly<Record<string, string>>, path: string): string {
  const contents = sources[path]
  if (contents === undefined)
    throw new Error(`Declared attribute source "${path}" was not read before deriving attributes`)
  return contents
}

const PROJECTS: Readonly<Record<string, ProjectDefinition>> = {
  boot: {
    repo: 'spring-projects/spring-boot',
    mavenGroupPath: 'org/springframework/boot',
    mavenArtifact: 'spring-boot-docs',
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
    eras: [
      {
        // 3.3.0 is where the Antora component first appears; 3.2.x and older
        // ship the pre-Antora `src/docs/asciidoc` layout this pipeline cannot
        // classify. Verified by probing `antora.yml` at each minor's `.0` tag.
        since: '3.3.0',
        // 4.0.0 moved the component to `documentation/` and restructured the
        // build inputs the reconstruction reads, so the synthesis continues in
        // the next era rather than here.
        until: '4.0.0',
        componentPath: 'spring-boot-project/spring-boot-docs/src/docs/antora',
        assembly: {
          descriptor: 'synthesized',
          synthesis: {
            examplesPath: 'spring-boot-project/spring-boot-docs/src/main',
            staticAttributesPath:
              'buildSrc/src/main/resources/org/springframework/boot/build/antora/antora-asciidoc-attributes.properties',
            bomBuildScriptPath: 'spring-boot-project/spring-boot-dependencies/build.gradle',
            gradlePropertiesPath: 'gradle.properties',
            managedVersionAttributes: BOOT_3_MANAGED_VERSIONS,
            metadataArtifacts: BOOT_3_METADATA_ARTIFACTS,
          },
        },
      },
      {
        // 4.0.0-4.0.7 sit between the two published states: the 4.x component
        // path, but no content archive on Maven Central (`root-aggregate-content`
        // 404s for 4.0.0 and 4.0.7 and answers 200 from 4.0.8, probed
        // 2026-09-17). Same shape as 3.3-3.x, so the same reconstruction runs —
        // only the paths it reads moved, and `documentation/` is why this is a
        // third era rather than a wider first one.
        since: '4.0.0',
        until: '4.0.8',
        componentPath: 'documentation/spring-boot-docs/src/docs/antora',
        assembly: {
          descriptor: 'synthesized',
          synthesis: {
            // Moved with the component, out of `spring-boot-project/`.
            examplesPath: 'documentation/spring-boot-docs/src/main',
            // Unchanged across the restructure; its contents differ (123 entries
            // against 3.5.16's 111) but the `key=value` shape `parseProperties`
            // reads does not, and 4.0.0's file is byte-identical to 4.0.8's.
            staticAttributesPath:
              'buildSrc/src/main/resources/org/springframework/boot/build/antora/antora-asciidoc-attributes.properties',
            // The dependency BOM moved to `platform/`. Same `library(...)`/`links`
            // DSL: reconstructing 4.0.8 from it reproduces all 876 attributes of
            // the descriptor its own content archive ships, none differing.
            bomBuildScriptPath: 'platform/spring-boot-dependencies/build.gradle',
            gradlePropertiesPath: 'gradle.properties',
            managedVersionAttributes: BOOT_4_MANAGED_VERSIONS,
            metadataArtifacts: BOOT_4_METADATA_ARTIFACTS,
          },
        },
      },
      {
        // `spring-boot-docs` is published to Maven Central only for 2.2.x-2.4.2
        // and then again from 4.0.8, and this era needs that artifact's
        // `root-aggregate-content` archive. 4.1.0 has no archive at all, so it
        // cannot be built however the converter behaves — a publication gap the
        // availability gate catches, not an era gap.
        since: '4.0.8',
        componentPath: 'documentation/spring-boot-docs/src/docs/antora',
        assembly: {
          descriptor: 'archive',
          // `root-aggregate-content` carries the generated component descriptor
          // (912 resolved attributes) plus the ROOT:example$ java/kotlin sample
          // tree that `include-code::` resolves against.
          archiveClassifiers: ['root-aggregate-content'],
        },
      },
    ],
    javadocLocationFor: version => `${SPRING_BOOT_DOCS}/${version}/api/java`,
    imageBaseFor: version => `${SPRING_BOOT_DOCS}/${version}/_images`,
  },

  framework: {
    repo: 'spring-projects/spring-framework',
    // No Maven coordinates: every era here is an overlay, assembled entirely
    // from the git checkout. Spring Framework publishes no Antora content
    // archive to Maven Central — `org/springframework/spring-docs` does not
    // exist there (probed 2026-09-14).
    //
    // Every xref in the corpus is intra-component: `xref:<component>:` does not
    // occur once across the 456 pages of v6.2.14, so there is no unbuilt
    // component for a reference to dangle into.
    externalComponentsFor: () => ({}),
    tagPrefix: 'v',
    eras: [
      {
        // v6.1.0 is where `framework-docs/antora.yml` first appears; v6.0.0
        // returns 404 for it. One era runs from there with no ceiling: v6.1.0
        // commits 31 lines of attributes and v6.2.0 onward commit 96, but that
        // is committed *content*, not layout — the component path, the examples
        // symlink and the single generated attribute are identical at v6.1.0,
        // v6.2.14, v7.0.0 and v7.0.4.
        since: '6.1.0',
        componentPath: 'framework-docs',
        assembly: {
          descriptor: 'overlay',
          // `framework-docs.gradle` is the whole story, unchanged across the
          // range:
          //
          //   tasks.named("generateAntoraYml") {
          //     asciidocAttributes = provider({ ["spring-version": project.version] })
          //   }
          //   tasks.register("generateAntoraResources") { dependsOn 'generateAntoraYml' }
          //
          // `generateAntoraResources` depends on `generateAntoraYml` and nothing
          // else, so one attribute is the entire generated half of the
          // component. The `example$docs-src` tree `include-code::` resolves
          // against is a symlink to `framework-docs/src`, already inside the
          // checkout, so unlike Boot there is nothing to copy or download.
          generatedAttributesFor: version => ({ 'spring-version': version }),
          // `example$docs-src` is a mode 120000 blob holding `../../../src`,
          // present at v6.1.0 and v6.2.14 alike. It resolves to
          // `framework-docs/src`, inside the checked-out component, so it is
          // replaced by a real copy rather than followed at read time.
          internalSymlinks: [{ path: 'modules/ROOT/examples/docs-src', target: 'src' }],
        },
      },
    ],
    // Retargets `javadoc:` macros. The corpus contains none at v6.2.14 — it
    // links Javadoc through the committed `{api-spring-framework}` attribute
    // instead — but the playbook sets `javadoc-location` unconditionally, and a
    // later version adding the macro should resolve rather than dangle.
    javadocLocationFor: version =>
      `https://docs.spring.io/spring-framework/docs/${version}/javadoc-api`,
    // Images come from the release tag, not the reference site: docs.spring.io
    // collapses a patch to its minor (`/reference/6.2.14/_images/…` answers a
    // 301 to `/reference/6.2/_images/…`, verified 2026-09-14), so a URL built
    // from a catalog version is pinned in appearance only and serves whatever
    // that minor currently publishes — or nothing, as with 6.1, where
    // `/reference/6.1.0/_images/container-magic.png` 404s while the asset is
    // present in the tag. The raw path is the component's own `assets/images`,
    // which `image::` names resolve against unchanged.
    imageBaseFor: version =>
      `${SPRING_FRAMEWORK_RAW}/v${version}/framework-docs/modules/ROOT/assets/images`,
  },

  security: {
    repo: 'spring-projects/spring-security',
    // No Maven coordinates: both eras are overlays. `spring-security-docs` is not
    // on Maven Central at all (probed 2026-09-14, #73), and nothing here needs
    // it — the descriptor, the examples and the versions behind the generated
    // attributes are all committed in the tag.
    externalComponentsFor: () => ({}),
    // Spring Security tags a release as the bare version: `6.5.6`, not `v6.5.6`.
    tagPrefix: '',
    eras: [
      {
        // 6.2.0 is where `gradle/libs.versions.toml` first appears; 6.0.x and
        // 6.1.x declare their dependency versions elsewhere, so the four
        // `<artifact>-version` attributes the corpus reads cannot be derived from
        // a checkout there.
        since: '6.2.0',
        // 6.5.1 added `modules/ROOT/examples/docs-src` and the `include-java` /
        // `include-kotlin` attributes that resolve against it. Before that the
        // component ships no examples tree at all, so declaring the link here
        // would fail on every version of this era.
        until: '6.5.1',
        componentPath: 'docs',
        assembly: {
          descriptor: 'overlay',
          generatedAttributesFor: () => ({}),
          derivedAttributes: SECURITY_ATTRIBUTES,
          internalSymlinks: [],
        },
      },
      {
        since: '6.5.1',
        componentPath: 'docs',
        assembly: {
          descriptor: 'overlay',
          // Everything Spring Security's build generates depends on files in the
          // checkout rather than on the version alone, so it is all derived.
          generatedAttributesFor: () => ({}),
          derivedAttributes: SECURITY_ATTRIBUTES,
          // A mode 120000 blob holding `../../../src`, present at 6.5.1 through
          // 7.1.1. It resolves to `docs/src`, inside the checked-out component,
          // and is what `include-java` / `include-kotlin` name.
          internalSymlinks: [{ path: 'modules/ROOT/examples/docs-src', target: 'src' }],
        },
      },
    ],
    // `javadoc:` macros and the `{security-api-url}` attribute point at the same
    // site, whose javadoc root is `api` — unlike Boot, which nests it under
    // `api/java`. Verified against
    // `…/6.5.6/api/org/springframework/security/core/Authentication.html`.
    javadocLocationFor: version =>
      `https://docs.spring.io/spring-security/site/docs/${version}/api`,
    // The release tag, not the reference site: docs.spring.io collapses a patch
    // to its minor there (`/reference/6.5.6/_images/…` answers a 301 to
    // `/reference/6.5/_images/…`, verified 2026-09-16), so a URL built from a
    // catalog version would be pinned in appearance only. The same reason the
    // Framework era takes its images from the tag.
    imageBaseFor: version =>
      `${SPRING_SECURITY_RAW}/${version}/docs/modules/ROOT/assets/images`,
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
 * Build the Maven Central download URL for one published jar.
 *
 * @example
 * mavenJarUrl('org/springframework/boot', 'spring-boot-autoconfigure', '3.5.16')
 * // https://repo1.maven.org/maven2/org/springframework/boot/spring-boot-autoconfigure/3.5.16/spring-boot-autoconfigure-3.5.16.jar
 */
export function mavenJarUrl(groupPath: string, artifact: string, version: string): string {
  return `${MAVEN_CENTRAL}/${groupPath}/${artifact}/${version}/${artifact}-${version}.jar`
}

/**
 * The era that built a given version.
 *
 * Eras are declared oldest first with disjoint ranges, and the first one whose
 * range contains the version — `since` inclusive, `until` exclusive — is the
 * match. Two overlapping declarations would resolve to the older one.
 *
 * @returns the era, or `undefined` when the version predates every era.
 */
function eraFor(definition: ProjectDefinition, version: string): LayoutEra | undefined {
  const canonical = canonicalGaVersion(version)
  return definition.eras.find((era) => {
    if (compareGaVersions(canonical, canonicalGaVersion(era.since)) < 0)
      return false
    return era.until === undefined
      || compareGaVersions(canonical, canonicalGaVersion(era.until)) < 0
  })
}

/** Human-readable list of the version ranges a project can be built from. */
function buildableRanges(definition: ProjectDefinition): string {
  return definition.eras
    .map(era => (era.until === undefined ? `>= ${era.since}` : `${era.since}-<${era.until}`))
    .join(', ')
}

/**
 * Resolve the coordinates for one `(project, version)` pair.
 *
 * @throws if the project is not supported, the version is not a plain GA
 * version, or it predates the project's oldest buildable layout.
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
  const era = eraFor(definition, version)
  if (!era) {
    throw new Error(
      `Version "${version}" of "${project}" is not buildable: neither its `
      + `documentation layout nor its published artifacts are supported. `
      + `Buildable ranges: ${buildableRanges(definition)}.`,
    )
  }

  const archives = era.assembly.descriptor === 'archive'
    ? era.assembly.archiveClassifiers.map(classifier => ({
        classifier,
        url: mavenArchiveUrl(
          mavenGroupPathOf(definition, project),
          mavenArtifactOf(definition, project),
          version,
          classifier,
        ),
      }))
    : []

  const metadataJars = era.assembly.descriptor === 'synthesized'
    ? era.assembly.synthesis.metadataArtifacts.map(artifact => ({
        artifact,
        url: mavenJarUrl(mavenGroupPathOf(definition, project), artifact, version),
      }))
    : []

  return {
    project,
    version,
    repo: definition.repo,
    cloneUrl: `https://github.com/${definition.repo}.git`,
    tag: `${definition.tagPrefix}${version}`,
    componentPath: era.componentPath,
    assembly: resolveAssembly(era.assembly, version),
    archives,
    metadataJars,
    checkoutPaths: checkoutPathsFor(era),
    javadocLocation: definition.javadocLocationFor(version),
    externalComponents: definition.externalComponentsFor(version),
    imageBase: definition.imageBaseFor(version),
  }
}

/**
 * Evaluate an era's assembly against one version.
 *
 * Only the overlay era has anything to evaluate; the other two are already the
 * data they declare.
 */
function resolveAssembly(assembly: EraAssembly, version: string): ComponentAssembly {
  return assembly.descriptor === 'overlay'
    ? {
        descriptor: 'overlay',
        generatedAttributes: assembly.generatedAttributesFor(version),
        ...(assembly.derivedAttributes === undefined
          ? {}
          : { derivedAttributes: assembly.derivedAttributes }),
        internalSymlinks: assembly.internalSymlinks,
      }
    : assembly
}

/**
 * The Maven group path an archive or synthesized era reads from.
 *
 * Declared optional on {@link ProjectDefinition} because an overlay-only project
 * has no Maven artifact at all. Reaching here without one is a definition bug,
 * not bad input, so it throws rather than producing a URL containing
 * `undefined` that would 404 much later with nothing pointing back here.
 */
function mavenGroupPathOf(definition: ProjectDefinition, project: string): string {
  if (definition.mavenGroupPath === undefined) {
    throw new Error(
      `Project "${project}" declares an era that reads Maven Central but no mavenGroupPath`,
    )
  }
  return definition.mavenGroupPath
}

/** The Maven artifact an archive era's content zips are published under. */
function mavenArtifactOf(definition: ProjectDefinition, project: string): string {
  if (definition.mavenArtifact === undefined) {
    throw new Error(
      `Project "${project}" declares an archive era but no mavenArtifact`,
    )
  }
  return definition.mavenArtifact
}

/** Repo-relative paths the sparse checkout must materialize for one era. */
function checkoutPathsFor(era: LayoutEra): readonly string[] {
  // An overlay era assembles from the component root alone — plus, where its
  // build resolves versions rather than inventing them, the committed files
  // those versions are declared in. That root is also where its `example$` tree
  // lives: Spring Framework and Spring Security both reach it through a relative
  // symlink that stays inside the checked-out path.
  if (era.assembly.descriptor === 'overlay') {
    return [era.componentPath, ...(era.assembly.derivedAttributes?.sources ?? [])]
  }
  if (era.assembly.descriptor !== 'synthesized')
    return [era.componentPath]
  const { synthesis } = era.assembly
  return [
    era.componentPath,
    synthesis.examplesPath,
    synthesis.staticAttributesPath,
    synthesis.bomBuildScriptPath,
    synthesis.gradlePropertiesPath,
  ]
}

/**
 * Every remote file a version's build depends on, as absolute URLs.
 *
 * Upstream tags a release long before — and sometimes without ever — publishing
 * the artifacts this pipeline reads. Which artifacts those are depends on the
 * era: an archive era needs the content zips, a synthesized era needs the jars
 * carrying configuration-property metadata, and an overlay era needs none at
 * all, because the git tag carries everything it assembles.
 * `detect-upstream-versions.ts` checks these so a version that cannot be built
 * is never offered as one that can.
 *
 * An empty result therefore means "nothing to wait for", not "nothing checked":
 * for an overlay project, being tagged upstream is the whole of being
 * buildable.
 *
 * @throws if the project is not supported or the version is not buildable.
 */
export function requiredArtifactUrls(project: string, version: string): readonly string[] {
  // Both lists are built by `resolveUpstream`, which is also what the download
  // side reads — so the gate cannot check a URL the fetch will not request.
  // `resolveUpstream` raises the unknown-project error itself.
  const upstream = resolveUpstream(project, version)
  switch (upstream.assembly.descriptor) {
    case 'archive':
      return upstream.archives.map(archive => archive.url)
    case 'synthesized':
      return upstream.metadataJars.map(jar => jar.url)
    case 'overlay':
      return []
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
    // Same era rule as `resolveUpstream` — the two must agree, or detection
    // would offer a version the build then refuses. Era membership, not a bare
    // floor: 4.0.0-4.0.7 sit above the floor and are still not buildable.
    .filter(version => eraFor(definition, version) !== undefined)
    .sort(compareGaVersions)
}
