/**
 * Read and write the Antora component descriptor (`antora.yml`).
 *
 * The synthesized era rebuilds this file from scratch, so its serialization is
 * what makes every `{url-…}` reference in the corpus resolve — a mis-quoted
 * value does not fail loudly, it renders as literal text on a published page.
 * That is why the two pure pieces live here, beside the repo's other tested
 * logic, rather than inside the fetch script.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Serialize a component descriptor.
 *
 * Every attribute value is single-quoted: they carry `:`, `{`, `#` and `%`, each
 * of which changes meaning in a bare YAML scalar. Keys are plain identifiers by
 * construction, so they need no quoting.
 */
export function renderDescriptor(
  name: string,
  version: string,
  hasNav: boolean,
  attributes: Readonly<Record<string, string>>,
): string {
  const lines = [`name: ${name}`, `version: '${version}'`]
  if (hasNav)
    lines.push('nav:', '- nav.adoc')
  lines.push('asciidoc:', '  attributes:')
  for (const [key, value] of Object.entries(attributes))
    lines.push(`    ${key}: '${value.replaceAll('\'', '\'\'')}'`)
  return `${lines.join('\n')}\n`
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
