---
name: docs-spring-io-version-collapse
description: docs.spring.io reference sites 301-collapse a patch version to its minor, so reference URLs can never be version-pinned — but the legacy docs/site/docs javadoc archives are genuinely per-patch
metadata:
  type: project
---

`docs.spring.io` serves two layouts, and only one of them is really pinned to a
patch version. Which one a URL is in decides whether a catalog version can be
substituted into it.

**Antora reference sites collapse a patch to its minor** (301, verified
2026-09-18): `/spring-framework/reference/6.2.14/…` →
`/spring-framework/reference/6.2/…`, `/spring-security/reference/6.5.6/…` →
`/spring-security/reference/6.5/…`, and Spring Boot — whose reference site sits
at the project root — `/spring-boot/3.3.13/…` → `/spring-boot/3.3/…`, its
`api/java/` subtree included. Older minors also stop serving assets entirely
(6.1 image paths 404 while the asset is present in tag v6.1.0). A reference URL
built from a catalog version therefore *looks* pinned but serves whatever that
minor currently publishes.

**The legacy `docs` / `site/docs` archives do not collapse.** They answer 200 at
the exact patch — `/spring-framework/docs/6.2.13/javadoc-api/` and
`/spring-security/site/docs/6.3.1/api/` — and both projects'
`javadocLocationFor` points there deliberately. Do not rewrite those to a minor
or to a raw URL.

**Why:** a Spring Framework `imageBaseFor` built on the reference site published
404ing image URLs across the whole declared 6.1.x range; fixed by pointing at
`raw.githubusercontent.com/spring-projects/<repo>/v<version>/<componentPath>/modules/ROOT/assets/images`.

**How to apply:** when adding or reviewing a project's `imageBaseFor` /
`javadocLocationFor` in `scripts/lib/upstream-sources.ts`, first note which
layout the URL is in, then verify with `curl -o /dev/null -w '%{http_code}
%{redirect_url}'` *without* `-L` — a `-L` check hides the collapse behind a 200.
Prefer a release-tag raw URL for anything on a reference site that must be exact
per patch version.
