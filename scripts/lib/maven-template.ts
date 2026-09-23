/**
 * Fill a Maven-filtered Antora resources template the way Spring Data's build does.
 *
 * A Spring Data store commits a stub `antora.yml` and a second file,
 * `src/main/antora/resources/antora-resources/antora.yml`, whose attributes are
 * `${…}` Maven properties. The `antora-process-resources` profile of
 * `spring-data-build`'s parent POM filters that template: the properties come from
 * the store's own `pom.xml` and the parent POM it inherits, plus four values an
 * antrun step derives at build time. Every one of those inputs is a committed
 * file, so the reconstruction runs no Maven and resolves no dependency.
 *
 * Pure: no I/O, no clock. `fetch-upstream.ts` reads the files, and passes the
 * year the build would have stamped (see {@link TemplateInputs.commitYear}).
 */

import type { Attributes, AttributeValue } from './component-descriptor.ts'

/** Maven coordinates of a POM's `<parent>`. */
export interface PomParent {
  readonly groupId: string
  readonly artifactId: string
  readonly version: string
}

/** The parts of a POM the template filter reads. */
export interface PomModel {
  readonly parent?: PomParent
  /** The top-level `<properties>`, uninterpolated, in declaration order. */
  readonly properties: ReadonlyMap<string, string>
}

/** Everything {@link resolveTemplateProperties} reads. */
export interface TemplateInputs {
  /** The version being built, which is `project.version` in the build. */
  readonly version: string
  /** The store's own `pom.xml`. */
  readonly projectPom: string
  /** The `spring-data-parent` POM that `projectPom` names as its parent. */
  readonly parentPom: string
  /**
   * The year `${current.year}` stands for.
   *
   * Upstream stamps it from the build machine's clock (`<tstamp>`), which is
   * the one input no file pins. Taking the clock here would make a rebuild of
   * the same tag produce different bytes, breaking the reproducibility releases
   * rest on, so the caller pins it to the tag commit instead.
   */
  readonly commitYear: string
}

/** A `${…}` reference. */
const PLACEHOLDER = /\$\{([^}]+)\}/g

/** One `<name>value</name>` property; a self-closing `<name/>` is empty and unread. */
const PROPERTY = /<([a-z][\w.-]*)>([^<>]*)<\/\1>/gi

/** XML comments, which may hold commented-out properties. */
const COMMENT = /<!--[\s\S]*?-->/g

/**
 * Sections that can carry a `<properties>` or `<parent>` of their own.
 *
 * A profile overrides properties only when activated — `spring-data-jpa`'s
 * `hibernate-62` profile rebinds `hibernate` — and the documentation build
 * activates none that touch the template, so only the top-level block counts.
 */
const NESTED_SECTIONS = /<(profiles|build|reporting)>[\s\S]*?<\/\1>/g

const PROPERTIES_BLOCK = /<properties>([\s\S]*?)<\/properties>/
const PARENT_BLOCK = /<parent>([\s\S]*?)<\/parent>/
const GROUP_ID = /<groupId>([^<]+)<\/groupId>/
const ARTIFACT_ID = /<artifactId>([^<]+)<\/artifactId>/
const VERSION = /<version>([^<]+)<\/version>/

/** A plain `major.minor.patch` release, the only kind a pinned tag is taken from. */
const GA_VERSION = /^\d+\.\d+\.\d+$/

/** The leading `major.minor` the antrun step keeps, qualifier and patch dropped. */
const MAJOR_MINOR = /^\d+\.\d+/
/** The leading `major.minor.patch` it keeps for the Commons docs version. */
const MAJOR_MINOR_PATCH = /^\d+\.\d+\.\d+/

/** How many times a property may expand into another before giving up. */
const MAX_EXPANSION_DEPTH = 10

/**
 * Read a POM's parent coordinates and top-level properties.
 *
 * Regular expressions rather than an XML parser, like `parseManagedVersions`:
 * the shape read here is a flat list of leaf elements, and nothing else in
 * the file is interpreted.
 */
export function parsePom(xml: string): PomModel {
  const topLevel = xml.replace(COMMENT, '').replace(NESTED_SECTIONS, '')

  const properties = new Map<string, string>()
  const block = PROPERTIES_BLOCK.exec(topLevel)?.[1] ?? ''
  for (const match of block.matchAll(PROPERTY))
    properties.set(match[1] ?? '', (match[2] ?? '').trim())

  const parentBlock = PARENT_BLOCK.exec(topLevel)?.[1]
  const parent = parentBlock === undefined ? undefined : parentOf(parentBlock)
  return parent === undefined ? { properties } : { parent, properties }
}

function parentOf(block: string): PomParent | undefined {
  const field = (pattern: RegExp): string | undefined => pattern.exec(block)?.[1]?.trim()
  const groupId = field(GROUP_ID)
  const artifactId = field(ARTIFACT_ID)
  const version = field(VERSION)
  return groupId && artifactId && version ? { groupId, artifactId, version } : undefined
}

/**
 * The version of the parent POM a project inherits its properties from.
 *
 * `expected` is the `groupId:artifactId` the project must inherit from.
 * @throws if the POM names no parent or another one: its properties would then
 * be read from a POM the template was never filtered against.
 */
export function parentVersionOf(projectPom: string, expected: string): string {
  const parent = parsePom(projectPom).parent
  const declared = parent === undefined ? 'none' : `${parent.groupId}:${parent.artifactId}`
  if (parent === undefined || declared !== expected) {
    throw new Error(
      `The POM inherits from ${declared}, not ${expected} — `
      + `the template's properties would be read from the wrong parent POM`,
    )
  }
  return parent.version
}

/**
 * The GA version a property pins, for checking out another repository at.
 *
 * @throws if the property is undeclared or not a plain `major.minor.patch`:
 * only GA versions are built, so no GA store pins anything else.
 */
export function pinnedVersionOf(properties: ReadonlyMap<string, string>, name: string): string {
  const version = properties.get(name)
  if (version === undefined || !GA_VERSION.test(version))
    throw new Error(`${name} is ${version ?? 'undeclared'}, not a GA version to check out`)
  return version
}

/**
 * The year `${current.year}` stands for, from the tag commit's ISO-8601 date.
 *
 * UTC, so the result does not depend on the machine the fetch runs on.
 */
export function commitYearOf(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime()))
    throw new Error(`Not an ISO-8601 commit date: "${isoDate}"`)
  return String(date.getUTCFullYear())
}

/**
 * Every property the template filter can see, fully interpolated.
 *
 * Maven's inheritance order: the parent's properties, overridden by the
 * project's own, with `project.version` the version being built. Then the four
 * values the `export-properties` antrun execution adds — each a regex over an
 * interpolated property, reproduced exactly, or the stamped year.
 *
 * A property whose value still holds a placeholder after expansion is kept as
 * it is: it is only an error if the template actually reads it, which
 * {@link fillTemplate} decides.
 */
export function resolveTemplateProperties(inputs: TemplateInputs): ReadonlyMap<string, string> {
  const merged = new Map<string, string>([
    ...parsePom(inputs.parentPom).properties,
    ...parsePom(inputs.projectPom).properties,
    ['project.version', inputs.version],
  ])

  const resolved = new Map<string, string>()
  for (const [name, value] of merged)
    resolved.set(name, expand(value, merged))

  // `<replaceregex pattern="([\d]+\.[\d]+)(.*)" replace="\1"/>` and its
  // three-segment sibling: the leading `major.minor` (or `major.minor.patch`)
  // with any qualifier dropped, or the value unchanged when it does not match.
  setDerived(resolved, 'spring.short', resolved.get('spring'), MAJOR_MINOR)
  setDerived(resolved, 'springdata.commons.short', resolved.get('springdata.commons'), MAJOR_MINOR)
  setDerived(resolved, 'springdata.commons.docs', resolved.get('springdata.commons'), MAJOR_MINOR_PATCH)
  resolved.set('current.year', inputs.commitYear)
  return resolved
}

function setDerived(
  properties: Map<string, string>,
  name: string,
  source: string | undefined,
  pattern: RegExp,
): void {
  if (source !== undefined)
    properties.set(name, pattern.exec(source)?.[0] ?? source)
}

/** Expand `${…}` references until none resolves further. */
function expand(value: string, properties: ReadonlyMap<string, string>): string {
  let current = value
  for (let depth = 0; depth < MAX_EXPANSION_DEPTH && current.includes('${'); depth++) {
    const next = current.replace(PLACEHOLDER, (whole, name: string) => properties.get(name) ?? whole)
    if (next === current)
      break
    current = next
  }
  return current
}

/**
 * The template's `asciidoc.attributes`, filtered through `properties`.
 *
 * Filtering is textual and happens before the YAML is parsed, as with Maven's
 * resource filtering — so a value lands in the descriptor with whatever type
 * YAML gives the substituted text, exactly as upstream's build produces it.
 * Declaration order is kept: a later attribute may reference an earlier one
 * (`spring-data-commons-javadoc-base: '{spring-data-commons-docs-url}/api/java'`),
 * and Antora resolves such references against what is already defined.
 *
 * The top-level `version` and `prerelease` placeholders are descriptor fields,
 * not attributes; the overlay writes the version itself, and only GA versions
 * are built.
 *
 * @throws naming every placeholder an attribute still holds. Maven resolves
 * each one for the real build, so one left here is a gap in this
 * reconstruction, and publishing it would put a literal `${…}` on a page.
 */
export function fillTemplate(template: string, properties: ReadonlyMap<string, string>): Attributes {
  const filtered = template.replace(PLACEHOLDER, (whole, name: string) => properties.get(name) ?? whole)
  const attributes = attributesOf(Bun.YAML.parse(filtered))

  const unresolved = new Set<string>()
  for (const value of Object.values(attributes)) {
    if (typeof value === 'string') {
      for (const match of value.matchAll(PLACEHOLDER))
        unresolved.add(match[1] ?? '')
    }
  }
  if (unresolved.size > 0) {
    throw new Error(
      `The Antora resources template reads ${unresolved.size} Maven propert`
      + `${unresolved.size === 1 ? 'y' : 'ies'} neither POM declares: ${[...unresolved].join(', ')}`,
    )
  }
  return attributes
}

/** The `asciidoc.attributes` mapping of a parsed template. */
function attributesOf(doc: unknown): Attributes {
  const asciidoc = mappingOf(doc)?.asciidoc
  const attributes = mappingOf(mappingOf(asciidoc)?.attributes)
  if (attributes === undefined)
    throw new Error('The Antora resources template declares no asciidoc.attributes')

  const kept: Record<string, AttributeValue> = {}
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number')
      kept[key] = value
  }
  return kept
}

function mappingOf(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
