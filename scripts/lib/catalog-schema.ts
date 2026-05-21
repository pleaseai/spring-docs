import { z } from 'zod'

/**
 * Catalog version literal.
 *
 * Bumped only when the catalog.json shape changes in a breaking way.
 * Consumers MUST refuse to parse mismatched versions.
 */
export const CATALOG_VERSION = '1' as const

const ReleasedAt = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .describe('ISO-8601 release timestamp; null until the first build publishes')

const Tag = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9.+-]*$/i, {
    message: 'Tag must be lowercase-ish (alphanumeric + . + - + +)',
  })
  .describe('GitHub release tag, e.g. "framework-6.2.0"')

const VersionEntry = z.object({
  tag: Tag,
  released_at: ReleasedAt,
})

const ProjectEntry = z.record(z.string().min(1), VersionEntry)

export const CatalogSchema = z.object({
  $schema: z.string().url().optional(),
  version: z.literal(CATALOG_VERSION),
  generated_at: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .describe('ISO-8601 timestamp of last catalog generation; null on initial scaffold'),
  projects: z.record(z.string().min(1), ProjectEntry),
})

export type Catalog = z.infer<typeof CatalogSchema>
export type CatalogVersionEntry = z.infer<typeof VersionEntry>
