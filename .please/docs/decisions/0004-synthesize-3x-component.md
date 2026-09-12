# ADR-0004: Reconstruct the Generated Component for Spring Boot 3.x

## Status

Accepted — 2026-09-12

## Context

ADR-0002 established that one Antora content source is assembled from two halves: a sparse
checkout of the docs subtree at the release tag, plus the content archive Spring publishes
to Maven Central. Only the archive carries the resolved `antora.yml` (912 attributes at
4.1.1) and the `ROOT:example$` sample tree that `include-code::` reads.

Extending coverage to Spring Boot 3.x breaks that second half. Measured on 2026-09-12:

1. **The component moved.** 3.3-3.5 keep it at
   `spring-boot-project/spring-boot-docs/src/docs/antora`; 4.x moved it to
   `documentation/spring-boot-docs/src/docs/antora`.
2. **The archives are not published.** `spring-boot-docs` exists on Maven Central for
   2.2.9-2.4.2 and then from 4.0.8. The cause is explicit, not incidental: 3.x ships
   `.github/actions/sync-to-maven-central/artifacts.spec`, which excludes
   `org/springframework/boot/spring-boot-docs/*` from the sync. 4.x dropped that file.
   The archives do exist on `repo.spring.io`, which returns 401 to anonymous requests.
3. **3.2 and older predate the component.** `antora.yml` first appears at v3.3.0.

Converting the checkout alone was measured against 3.5.16. It produces 145 pages and
exit 0, but with 350 unresolved attribute references, 837 unresolved `configprop:` macros
and 326 silently empty `include-code::` tab groups. Unresolved attributes reach the output
as literal text — `{url-spring-framework-site}[Spring Data]` — which is worse than an
absent page, because it looks like content.

## Decision

Model each project as a sequence of **layout eras**, and reconstruct the generated half for
eras that publish no archive.

An era pins the component path and the assembly strategy together, because having one
without the other yields a tree that classifies but converts wrongly. Eras are not
contiguous: 4.0.0-4.0.7 moved to the 4.x path but published no archive, so they belong to
no era and are refused outright rather than silently fetched from a path that does not
exist at their tag.

For the synthesized era the four missing inputs are rebuilt from sources pinned to the same
release tag, plus artifacts Maven Central does publish:

| Missing input | Reconstructed from |
|---|---|
| `ROOT:example$` sample tree | `spring-boot-docs/src/main`, in the checkout — the same directory the Gradle build copies |
| ~540-880 asciidoc attributes | `antora-asciidoc-attributes.properties` + the dependency BOM's `library`/`links` DSL + `gradle.properties`, all in the checkout |
| Managed dependency versions | the BOMs the build script imports (`spring-data-bom`, `jackson-bom`, `pulsar-bom`, …), fetched from Maven Central |
| `spring-configuration-metadata.json` | `META-INF/` of the eight published `spring-boot-*` jars that carry it |

The attribute reconstruction is a port of `buildSrc/.../AntoraAsciidocAttributes.java` and
a parser for the `library(...)`/`links { }` DSL subset the BOM actually uses. It is pure:
every input arrives as text, so it is verifiable offline.

The DSL is not stable across the supported range, and each variant was found by a build
failing loudly rather than by reading ahead: 3.3-3.4 write link factories as Groovy closures
(`docs { version -> … }`, `add("userguide") { … }`) where 3.5 uses Java lambdas in
parentheses, and declare imported BOMs as `imports = ["spring-data-bom"]` where 3.5 uses
`bom("spring-data-bom")`. A module's version comes from the BOM it is imported through, or
from the declaring library when it is listed under `modules = [...]` instead.

An attribute whose value still holds an unresolved placeholder is **withheld and named**,
never emitted half-rendered. A half-rendered URL reads as a working link; an absent
attribute at least makes Asciidoctor warn.

## Verification

4.x publishes both the git inputs and the authoritative descriptor, so it is ground truth
for code only 3.x needs. Running the reconstruction over 4.1.1's checked-out inputs and
diffing against the descriptor its content archive ships:

- 904 of 912 attributes **identical**, 0 differing, 0 extra
- the 8 absent are `version-*` for dependencies only 4.x names; no 3.x page references them

End to end on 3.5.16, against the same converter:

| Counter | Before | After |
|---|---|---|
| unresolved attribute references | 350 | **0** |
| unresolved `configprop:` | 837 | **0** |
| unresolved `include-code::` | 326 | **0** |
| xref errors to absent external components | 493 | 493 (rewritten to the upstream site, as in 4.x) |

The same three counters are zero for every minor across the range — 3.3.0, 3.3.13, 3.4.0,
3.4.13, 3.5.0 and 3.5.16 each convert with no unresolved attribute, `configprop:` or
`include-code::`.

## Consequences

### Positive

- **Fidelity is measured, not assumed.** The 4.x ground-truth diff is the regression test for
  the reconstruction. If upstream changes the BOM DSL, that diff catches it on a 4.x build
  before a 3.x build ships wrong URLs.
- **Version detection is era-aware.** `requiredArtifactUrls` reports the content zips for an
  archive era and the metadata jars for a synthesized one, so nightly detection never offers
  a version the build would refuse.
- **The prose corpus is complete.** Reference, how-to, tutorial and specification convert
  with no unresolved attribute, `configprop:` or `include-code::` on any minor in the range.

### Negative

- **The generated appendix is lost.** ~101 pages of auto-configuration class listings and
  configuration-property tables are not reconstructed, leaving 46 `include::` failures in the
  appendix's index pages and 4 dangling `xref:appendix:` targets. Those are Gradle task
  outputs with no published equivalent, and reproducing them means reimplementing Spring's
  build. 3.x therefore ships ~146 pages against 4.1.1's 246.
- **New upstream coupling.** The reconstruction reads four upstream build files by path, and
  parses a Groovy DSL subset that upstream is free to change. Both are pinned per era, so a
  layout change surfaces as a fetch failure naming the missing path rather than as silently
  degraded output — but a DSL change surfaces only as attributes going missing.

### Neutral

- **Two assembly strategies coexist.** 4.x keeps reading the published archive unchanged; the
  synthesis path runs only for eras that declare it, so neither line can regress the other.

## Alternatives Considered

- **Run Spring's Gradle build to generate the component.** Rejected: it reintroduces the JVM
  and Gradle toolchain ADR-0001 and ADR-0002 deliberately excluded, and needs the full
  dependency graph resolved per release. What it buys over the reconstruction is the appendix
  — the part of the corpus with the least prose value.

- **Fetch the archives from `repo.spring.io`.** Rejected: it answers 401 to anonymous
  requests, so it would require credentials this pipeline cannot hold.

- **Scrape the rendered HTML from `docs.spring.io`.** Rejected: ADR-0002 converts from the
  Asciidoctor AST. HTML is the output of that conversion — the source structure, xrefs and
  attribute references it reads are already flattened away.

- **Ship 3.x from the git checkout alone, without the generated half.** Rejected on
  measurement: 350 unresolved attribute references, 837 unresolved `configprop:` macros and
  326 empty `include-code::` groups on 3.5.16. Unresolved markup reaches the reader as
  literal text, which is worse than an absent page because it looks like content.

## Related

- `scripts/lib/upstream-sources.ts` — the layout eras this decision introduces.
- `scripts/lib/antora-attributes.ts` — the `AntoraAsciidocAttributes` port.
- `scripts/lib/bom-libraries.ts` — the BOM `library`/`links` DSL parser.
- `scripts/lib/component-descriptor.ts` — the descriptor this decision rebuilds, read and written.
- `scripts/fetch-upstream.ts` — the archive/synthesis branch.
- ADR-0002 — the two-half content source this extends.
- `.please/docs/knowledge/upstream-antora.md` — the measured upstream traps behind it.
