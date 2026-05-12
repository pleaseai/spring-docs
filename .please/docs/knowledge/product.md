# Product Guide — @pleaseai/spring-docs

> Pre-converted, version-pinned Spring documentation in Markdown — distributed as GitHub Release archives.

## Vision

A tool-agnostic **content repository** that decouples Spring documentation generation from any single consumer. By publishing each `(project, version)` pair as a standalone GitHub Release archive, we make LLM-friendly Spring docs reusable across the entire LLM-tooling ecosystem — Claude Code plugins, Cursor rules, Continue prompts, RAG indexers, and internal chatbots alike.

## Mission

Convert upstream Spring AsciiDoc/Antora documentation into clean, version-pinned Markdown that LLM tools can consume without re-parsing AsciiDoc, scraping HTML, or scraping cloned upstream repos. Keep the conversion pipeline auditable, the artifacts reproducible, and the licensing surface clean.

## Target Users

| Persona | Need | How We Help |
|---|---|---|
| **Claude Code plugin authors** (e.g., `@pleaseai/spring`) | Auto-load Spring docs as version-matched skills | Pre-built archives addressable by Gradle/Maven dependency versions |
| **Cursor / Continue / Codex users** | Drop in Spring reference docs as project rules or context files | Direct `curl` download of `.tar.gz` archives, no plugin required |
| **RAG / vector index maintainers** | Ingest Spring docs at known revisions without an AsciiDoc toolchain | Stable Markdown output with manifest metadata for indexing |
| **Internal AI tooling teams** | Embed Spring knowledge into chatbots with provenance guarantees | Pinned `(repo, ref, commit)` in every `manifest.json` |
| **Spring maintainers (downstream observers)** | Trust that mirroring respects upstream license and intent | Apache-2.0 preserved, `NOTICE` shipped with every archive, content unchanged in meaning |

## Core Value Propositions

1. **Version pinning** — Each Spring release maps to one immutable archive tag (e.g., `framework-6.2.0`). Consumers fetch exactly the docs that match the dependencies in their `build.gradle` / `pom.xml`.
2. **Tool agnosticism** — Plain Markdown + JSON manifest. No vendor lock-in, no plugin runtime required.
3. **Decoupled release cadence** — Documentation can be regenerated independently of any consumer plugin's release schedule.
4. **Provenance** — Every archive carries upstream commit SHA, conversion toolchain version, and SHA-256 checksum.
5. **Conversion isolation** — Antora/AsciiDoc machinery lives next to the content it produces, not in consumer codebases.

## Scope

### In Scope

- AsciiDoc → Markdown conversion pipeline (Antora-aware)
- Per-`(project, version)` GitHub Release artifacts with manifests
- `catalog.json` master index
- Coverage of major Spring ecosystem projects: Framework, Boot, Security, Data, Cloud (extensible)
- Latest two minor lines per project as the default coverage window
- Nightly detection of new upstream releases

### Out of Scope

- Claude Code plugin functionality (lives in `@pleaseai/spring`)
- Pre-release / milestone / RC versions of upstream Spring projects
- Relicensing or modifying the *meaning* of upstream content
- Hosting the Markdown for direct web browsing (use the plugin or download archives)
- Authoring original Spring tutorials or guides

## Success Criteria

- Every supported `(project, version)` resolves to exactly one immutable archive tag
- Conversion pipeline produces byte-stable output for the same upstream commit
- New upstream Spring releases are detected and published within 24 hours of GA
- Archive manifests contain enough metadata to fully reproduce the build
- Downstream consumers (`@pleaseai/spring`, custom RAG indexes) integrate via `catalog.json` without scraping
- License compliance: 100% of archives ship with upstream attribution

## Constraints

- **License**: This repo's tooling code is Apache-2.0. Generated content retains Spring's upstream Apache-2.0 license with attribution.
- **Tag immutability**: Once `<project>-<version>` is published, the tag is never deleted. Rebuilds get a suffix (`+rebuild.1`).
- **Stability dependency**: Upstream projects must use Antora and maintain stable doc structure across versions.
- **CI budget**: Full ecosystem rebuild (~10 projects × 5 versions) must complete in under 15 minutes on free-tier runners.

## Related Projects

- [`@pleaseai/spring`](https://github.com/pleaseai/spring) — Primary consumer; Claude Code plugin
- [`@pleaseai/ask`](https://github.com/pleaseai/ask) — Generic library docs for Claude Code (npm, pypi, github, pub)
- Upstream: `spring-projects/spring-framework`, `spring-boot`, `spring-security`, `spring-data-jpa`, `spring-cloud`
