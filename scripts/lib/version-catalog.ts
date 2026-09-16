/**
 * Read a Gradle version catalog (`gradle/libs.versions.toml`).
 *
 * An overlay era whose upstream build resolves dependency versions has to obtain
 * them without running Gradle. The catalog is where they are declared, and it is
 * committed in the tag — so the versions come from the same commit as the prose,
 * with nothing downloaded and nothing resolved over the network.
 *
 * Pure: no I/O. `fetch-upstream.ts` reads the file.
 */

/** One catalog, with every library entry reduced to the version it pins. */
export interface VersionCatalog {
  /** The `[versions]` table, alias → version. */
  readonly versions: Readonly<Record<string, string>>
  /**
   * The `[libraries]` table, alias → the version that entry resolves to.
   *
   * An entry declaring no version at all — `module` alone, left to a platform to
   * pin — is absent rather than present-and-empty: there is no version to report,
   * and an empty string would read as one.
   */
  readonly libraries: Readonly<Record<string, string>>
}

/** `group:artifact:version`, the shorthand form of a library entry. */
const COORDINATE_PARTS = 3

/**
 * Parse a version catalog.
 *
 * Both library forms upstream writes are handled: the `'group:artifact:version'`
 * shorthand, and the table form whose `version` is either a literal or a
 * `version.ref` into `[versions]`.
 *
 * @throws if the file is not valid TOML.
 */
export function parseVersionCatalog(toml: string): VersionCatalog {
  const parsed = Bun.TOML.parse(toml)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('Version catalog is not a TOML table')

  const doc = parsed as Record<string, unknown>
  const versions = stringTable(doc.versions)
  const libraries: Record<string, string> = {}

  for (const [alias, entry] of Object.entries(tableOf(doc.libraries))) {
    const version = libraryVersion(entry, versions)
    if (version !== undefined)
      libraries[alias] = version
  }

  return { versions, libraries }
}

/** The version one `[libraries]` entry pins, or undefined when it pins none. */
function libraryVersion(
  entry: unknown,
  versions: Readonly<Record<string, string>>,
): string | undefined {
  if (typeof entry === 'string') {
    const parts = entry.split(':')
    return parts.length === COORDINATE_PARTS ? parts[COORDINATE_PARTS - 1] : undefined
  }
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry))
    return undefined

  const version = (entry as Record<string, unknown>).version
  if (typeof version === 'string')
    return version
  if (version === null || typeof version !== 'object' || Array.isArray(version))
    return undefined

  // `version.ref = "alias"` parses as a nested table, since TOML reads the
  // dotted key as a path rather than as a name containing a dot.
  const ref = (version as Record<string, unknown>).ref
  return typeof ref === 'string' ? versions[ref] : undefined
}

/** One TOML table, or an empty one when the key is absent or not a table. */
function tableOf(value: unknown): Record<string, unknown> {
  return value === null || typeof value !== 'object' || Array.isArray(value)
    ? {}
    : (value as Record<string, unknown>)
}

/** A TOML table reduced to its string-valued entries. */
function stringTable(value: unknown): Readonly<Record<string, string>> {
  const kept: Record<string, string> = {}
  for (const [key, entry] of Object.entries(tableOf(value))) {
    if (typeof entry === 'string')
      kept[key] = entry
  }
  return kept
}
