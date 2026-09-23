# ADR-0007: Fill Spring Data's Descriptor from Its Maven Template, and Build Commons Beside It

## Status

Accepted — 2026-09-23

## Context

#73 left Spring Data out on two counts, and both still hold at every tag from 3.2.0 to 4.1.1:

1. **The descriptor is a template, not a complete file.** `spring-data-jpa/src/main/antora/antora.yml`
   is a stub — name, `version: true`, title, nav, and a Maven collector. The attributes live in
   `src/main/antora/resources/antora-resources/antora.yml`, whose values are `${…}` Maven
   properties. The `antora-process-resources` profile of `spring-data-build`'s parent POM filters
   it: the properties come from the store's `pom.xml`, the `spring-data-parent` POM it inherits,
   and four values an antrun step computes (`spring.short`, `springdata.commons.short`,
   `springdata.commons.docs`, `current.year`).
2. **The corpus includes a second component.** 19 of JPA 3.5.6's pages are, entirely or in
   part, `include::{commons}@data-commons::page$…[]`. Upstream's playbook adds
   `spring-projects/spring-data-commons` as a second content source. Its documentation is
   not an artifact anywhere, so there is nothing to download.

The issue proposed `-Pdistribute` as the step that brings Commons in. It does not: that profile
aggregates javadoc into `target/antora/modules/ROOT/assets/attachments`. Commons reaches the
build through the playbook's content sources and Antora's version matching. `{commons}` resolves
to `springdata.commons.docs`, which is also the component version the include asks for.

Measured at 3.5.6 with neither half, conversion still exits 0. It leaves 31 unresolved attribute
references and 19 includes that Asciidoctor drops without failing (`include dropped due to
missing attribute`). The output is 100,621 bytes of text against 236,708 with both halves: 58% of
the documentation disappears and `--strict` reports nothing.

None of the three existing assemblies fits. There is no archive to merge. `synthesized` rebuilds
from Gradle inputs Spring Data does not have. `overlay` tops up a descriptor that is already
complete, and its `derivedAttributes` reads files from the one checkout only, while the parent
POM and Commons live in two other repositories.

## Decision

Add a fourth assembly, **`template`**, and declare one era for `data-jpa`: `>= 3.2.0` with no
ceiling. The era is sized to the one store that ships. It generalizes to the other stores
because it names their shared parts (`spring-data-build`, `spring-data-commons`, the template
path) as data.

The fetch does four things, all from git tags:

- **Parent POM.** Reads the store's `<parent>`, refuses anything other than
  `org.springframework.data.build:spring-data-parent`, and sparse-checks out
  `parent/pom.xml` from `spring-data-build` at the version it names.
- **Properties.** Resolves Maven inheritance: the parent's top-level properties, overridden by
  the project's, plus `project.version`. Properties inside a profile do not count, because the
  documentation build activates none that the template reads. Adds the antrun values with the
  same regexes. `current.year` is the **tag commit's UTC year**, not the clock's, so rebuilding a
  tag reproduces the archive byte for byte.
- **Template.** Filters it as text, as Maven's resource filtering does, and then parses the
  YAML. Declaration order is kept, because a later attribute references an earlier one. A
  placeholder neither POM declares **fails the fetch** and names the property. Maven resolves
  every one for the real build, so a leftover placeholder is a gap here, not upstream's shape.
- **Companion.** Checks out `src/main/antora` from `spring-data-commons` at the tag
  `springdata.commons` names. It goes under `_companion/`, with that version written into its
  stub. The conversion names `_companion` as a second `start_paths` entry of the same content
  source. It emits only the pages of the component at the source root, so Commons pages reach
  a release only through the store pages that include them.

`requiredArtifactUrls` is empty for this era. Being tagged in the three repositories is the
whole of being buildable, as for an overlay. The parent and companion commits go into the
`.upstream.json` sidecar under `template_sources`.

The corpus also surfaced a converter bug that affects every project. An attribute entry in the
body, such as `:projection-collection: Collection` between two blocks, is attached to the next
block. Asciidoctor replays it onto the document in `AbstractBlock#convert`. The AST walker never
calls `convert`, so every substitution after the entry saw only the header's attributes. The
walker now calls `playbackAttributes` for each block, in document order.

## Verification

`data-jpa`, end to end under `--strict`, zero converter warnings:

| Version | Pages | Attributes filled | Non-`section ID` Asciidoctor warnings |
|---|---|---|---|
| 3.2.0 | 32 | 15 | 0 |
| 3.4.13 | 33 | 18 | 0 |
| 3.5.6 | 33 | 18 | 0 |
| 4.0.0 | 35 | 18 | 0 |
| 4.1.1 | 34 | 18 | 0 |

In every build, each `{…}` left in the output sits inside code: `${querydslVersion}` in build
snippets, `${tenant-config.suffix}` and `?#{…}` SpEL, and `/{id}` request mappings. Every
heading of the projections page matches docs.spring.io. Rebuilding 3.5.6 from scratch
reproduces the archive's sha256.

The playback fix moves no published archive except Spring Security's. Re-converting boot 3.3.0
and 4.1.1, framework 6.1.0 and 7.0.9, security 6.2.0 and ai 2.0.1 matches `markdown/` byte for
byte. security 7.1.1 differs on two pages, `servlet/` and `reactive/oauth2/client/authorization-grants`,
where `{class-name}`, `{grant-type}` and `{section-id}` had been published literally. The same
two pages carry those literals in the 36 published Security versions from 6.4.0 to 7.1.1.

## Consequences

### Positive

- **Spring Data JPA becomes buildable**, and each version records the three commits it read.
- **The shape covers the release train.** Every store shares the stub, the template path, the
  `spring-data-parent` parent and the `springdata.commons` property. Adding one should need
  only a `PROJECTS` entry.
- **Measured failure where there was silent loss.** A dropped Commons include was exit 0; an
  unresolved template property now fails the fetch.

### Negative

- **Three repositories per build.** A tag missing from `spring-data-build` or
  `spring-data-commons` fails the fetch after the store checkout. Detection cannot see this,
  because it knows the parent and Commons versions only once the POM has been read.
- **The per-release `NOTICE` and `manifest.json` pin the store commit only.** Commons text is
  included verbatim. It is pinned transitively (store commit → `springdata.commons` → tag), and
  the sidecar records its commit, but the public manifest schema is not extended here.
- **36 published Security releases need `+rebuild.1` tags** to pick up the playback fix.

### Neutral

- **A companion's own attributes are not reconstructed.** Its pages are only ever loaded
  through an include, which evaluates them against the store's attributes. Commons' own
  template is never read.

## Alternatives Considered

- **Widen `overlay` with a second repository.** Rejected. Overlay means the committed
  descriptor is complete. Here it is a stub, and the second component is content, not an
  attribute source.
- **Fetch the parent POM from Maven Central.** It is published there. Rejected so that the era
  has one kind of input, a git tag, and needs no availability gate.
- **Emit Commons pages alongside the store's.** Rejected. Every store would republish the same
  Commons pages under its own name, and they would collide with the store pages that include
  them at the same paths (`repositories/definition`, …).

## Related

- ADR-0002 — Antora as a library; the second start path is Antora's own content model.
- ADR-0004 — the era model this adds an assembly to.
- `scripts/lib/maven-template.ts` — the POM and template reconstruction.
- `scripts/lib/upstream-sources.ts` — `TemplateSources` and the `data-jpa` era.
- Issue #139.
