/**
 * Read and write the Antora component descriptor (`antora.yml`).
 *
 * Two of the three assembly eras produce this file rather than taking it from an
 * archive, so its serialization is what makes every `{url-…}` reference in the
 * corpus resolve — a mis-quoted value does not fail loudly, it renders as literal
 * text on a published page. That is why the pure pieces live here, beside the
 * repo's other tested logic, rather than inside the fetch script.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * A value an `asciidoc.attributes` entry can hold.
 *
 * Booleans are not incidental: Antora reads `false` as an attribute that is
 * unset*, which several upstream descriptors rely on (`include-xml-namespaces:
 * false`). Collapsing one to a string would set it instead.
 */
export type AttributeValue = string | boolean | number

/** Attributes as they reach serialization. */
export type Attributes = Readonly<Record<string, AttributeValue>>

/**
 * Serialize one attribute value.
 *
 * Strings are single-quoted: they carry `:`, `{`, `#` and `%`, each of which
 * changes meaning in a bare YAML scalar. Booleans and numbers are written bare,
 * because quoting a boolean turns an unset attribute into the present, truthy
 * string `"false"`.
 */
function renderValue(value: AttributeValue): string {
  return typeof value === 'string' ? `'${value.replaceAll('\'', '\'\'')}'` : String(value)
}

/**
 * Serialize a component descriptor rebuilt from scratch.
 *
 * Used by the synthesized era, whose checked-out `antora.yml` is a stub worth
 * nothing but its component name.
 */
export function renderDescriptor(
  name: string,
  version: string,
  hasNav: boolean,
  attributes: Attributes,
): string {
  const lines = [`name: ${name}`, `version: '${version}'`]
  if (hasNav)
    lines.push('nav:', '- nav.adoc')
  lines.push('asciidoc:', '  attributes:')
  for (const [key, value] of Object.entries(attributes))
    lines.push(`    ${key}: ${renderValue(value)}`)
  return `${lines.join('\n')}\n`
}

/**
 * The descriptor keys this pipeline preserves when overlaying.
 *
 * Antora reads more than these, but the rest are deliberately dropped rather
 * than carried:
 *
 *   - `ext.collector` names a Gradle or Maven command that regenerates the
 *     component. That command is exactly what the overlay era exists to avoid
 *     running, and the collector extension is not registered in this pipeline's
 *     playbook, so carrying it would preserve a pointer to an unrun build.
 *   - `prerelease` marks a non-GA line. Only GA versions are built, so a
 *     descriptor written here is never a prerelease whatever the stub said.
 *   - `display_version` derives from `version`, which the overlay rewrites.
 */
interface PreservedFields {
  readonly name: string
  readonly title?: string
  readonly startPage?: string
  readonly nav: readonly string[]
  readonly attributes: Attributes
}

/**
 * Overlay a checked-in component descriptor with the version and the handful of
 * attributes the upstream build would have generated.
 *
 * This is the third assembly era (`overlay`), and it exists because some
 * projects commit a descriptor that is already complete. Spring Framework's
 * `framework-docs/antora.yml` carries all 96 lines of its attributes, and its
 * Gradle build contributes exactly one — `spring-version` — through the
 * `io.spring.antora.generate-antora-yml` plugin, which merges rather than
 * replaces. Rebuilding such a descriptor from scratch, as the synthesized era
 * does, would discard the committed attributes; taking it verbatim would leave
 * `version: true` unresolved and every generated attribute missing.
 *
 * Generated attributes win over committed ones, matching the plugin: its
 * `asciidocAttributes` are applied on top of the file's own.
 *
 * @throws if the descriptor carries no component name.
 */
export function overlayDescriptor(
  checkedIn: string,
  version: string,
  generated: Attributes,
): string {
  const fields = preservedFieldsOf(checkedIn)

  const lines = [`name: ${fields.name}`, `version: '${version}'`]
  if (fields.title !== undefined)
    lines.push(`title: '${fields.title.replaceAll('\'', '\'\'')}'`)
  if (fields.startPage !== undefined)
    lines.push(`start_page: '${fields.startPage}'`)
  if (fields.nav.length > 0) {
    lines.push('nav:')
    for (const entry of fields.nav)
      lines.push(`- '${entry}'`)
  }

  const attributes = { ...fields.attributes, ...generated }
  lines.push('asciidoc:', '  attributes:')
  for (const [key, value] of Object.entries(attributes))
    lines.push(`    ${key}: ${renderValue(value)}`)

  return `${lines.join('\n')}\n`
}

/** Parse the checked-in descriptor down to the fields the overlay preserves. */
function preservedFieldsOf(checkedIn: string): PreservedFields {
  const parsed = Bun.YAML.parse(checkedIn)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('Component descriptor is not a YAML mapping')

  const doc = parsed as Record<string, unknown>
  const name = doc.name
  if (typeof name !== 'string' || name === '')
    throw new Error('No component name in the checked-in antora.yml')

  return {
    name,
    title: typeof doc.title === 'string' ? doc.title : undefined,
    startPage: typeof doc.start_page === 'string' ? doc.start_page : undefined,
    nav: Array.isArray(doc.nav) ? doc.nav.filter(entry => typeof entry === 'string') : [],
    attributes: attributesOf(doc.asciidoc),
  }
}

/**
 * The `asciidoc.attributes` mapping, with any value this pipeline cannot
 * serialize dropped.
 *
 * A nested mapping or sequence under an attribute is not something AsciiDoc can
 * hold, so upstream does not write one; dropping rather than throwing keeps a
 * future descriptor that adds an unrelated structured key from failing the
 * build over a value nothing reads.
 */
function attributesOf(asciidoc: unknown): Attributes {
  if (asciidoc === null || typeof asciidoc !== 'object' || Array.isArray(asciidoc))
    return {}
  const attributes = (asciidoc as Record<string, unknown>).attributes
  if (attributes === null || typeof attributes !== 'object' || Array.isArray(attributes))
    return {}

  const kept: Record<string, AttributeValue> = {}
  for (const [key, value] of Object.entries(attributes as Record<string, unknown>)) {
    if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number')
      kept[key] = value
  }
  return kept
}

/**
 * The `name:` entry of a component descriptor.
 *
 * Anchored at column 0 on purpose: `name:` also appears indented under `ext:`
 * and inside attribute values, and an unanchored match would take whichever
 * came first.
 */
const COMPONENT_NAME = /^name:[ \t]*(\S+)/m

/** The component name declared by the checked-out `antora.yml` stub. */
export async function componentNameOf(componentRoot: string): Promise<string> {
  const stub = await readFile(join(componentRoot, 'antora.yml'), 'utf8')
  const name = COMPONENT_NAME.exec(stub)?.[1]
  if (name === undefined)
    throw new Error(`No component name in ${join(componentRoot, 'antora.yml')}`)
  return name
}
