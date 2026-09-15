---
title: "Testing"
source: "ROOT:web/webflux-test.adoc"
---

<a id="webflux-test"></a>

# Testing

The `spring-test` module provides mock implementations of `ServerHttpRequest`,
`ServerHttpResponse`, and `ServerWebExchange`.
See [Spring Web Reactive](../testing/unit.md#mock-objects-web-reactive) for a
discussion of mock objects.

[`WebTestClient`](../testing/webtestclient.md) builds on these mock request and
response objects to provide support for testing WebFlux applications without an HTTP
server. You can use the `WebTestClient` for end-to-end integration tests, too.
