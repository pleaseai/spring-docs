# Project Gotchas

> Known pitfalls and workarounds for `@pleaseai/spring-docs`.
> Check here before debugging recurring issues.

## Tooling

- **lint-staged ↔ CI lint 정렬 불일치** — Bun과 Node가 sort 규칙이 달라 동일 ESLint 룰에서도 다른 결과를 낼 수 있다. lint-staged는 `bun --bun x eslint`로 호출해 CI(Bun 런타임)와 동일한 결과를 보장한다. 발견: `project-bootstrap-20260521` 트랙 review iteration 1.
