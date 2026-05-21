#!/usr/bin/env bun
/**
 * Validate catalog.json against the canonical zod schema.
 *
 * Exit codes:
 *   0 — catalog.json parses cleanly
 *   1 — schema violation (errors printed to stderr)
 *   2 — file not found or unreadable
 */

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { CatalogSchema } from './lib/catalog-schema.ts'

const catalogPath = resolve(process.cwd(), 'catalog.json')

let raw: string
try {
  raw = await readFile(catalogPath, 'utf8')
}
catch (error) {
  console.error(`✗ Cannot read catalog.json at ${catalogPath}`)
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(2)
}

let parsed: unknown
try {
  parsed = JSON.parse(raw)
}
catch (error) {
  console.error(`✗ catalog.json is not valid JSON`)
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

const result = CatalogSchema.safeParse(parsed)
if (!result.success) {
  console.error(`✗ catalog.json failed schema validation:`)
  for (const issue of result.error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
    console.error(`  - ${path}: ${issue.message}`)
  }
  process.exit(1)
}

const projectCount = Object.keys(result.data.projects).length
const versionCount = Object.values(result.data.projects).reduce(
  (sum, project) => sum + Object.keys(project).length,
  0,
)

console.log(
  `✓ catalog.json valid (version=${result.data.version}, ${projectCount} project(s), ${versionCount} version(s))`,
)
