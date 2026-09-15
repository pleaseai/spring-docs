---
title: "Reactive Libraries"
source: "ROOT:web/webflux-reactive-libraries.adoc"
---

<a id="webflux-reactive-libraries"></a>

# Reactive Libraries

`spring-webflux` depends on `reactor-core` and uses it internally to compose asynchronous
logic and to provide Reactive Streams support. Generally, WebFlux APIs return `Flux` or
`Mono` (since those are used internally) and leniently accept any Reactive Streams
`Publisher` implementation as input.
When a `Publisher` is provided, it can be treated only as a stream with unknown semantics (0..N).
If, however, the semantics are known, you should wrap it with `Flux` or `Mono.from(Publisher)` instead
of passing the raw `Publisher`.
The use of `Flux` versus `Mono` is important, because it helps to express cardinality — for example, whether a single or multiple asynchronous values are expected,
and that can be essential for making decisions (for example, when encoding or decoding HTTP messages).

For annotated controllers, WebFlux transparently adapts to the reactive library chosen by
the application. This is done with the help of the
[`ReactiveAdapterRegistry`](https://docs.spring.io/spring-framework/docs/7.0.9/javadoc-api/org/springframework/core/ReactiveAdapterRegistry.html), which
provides pluggable support for reactive library and other asynchronous types. The registry
has built-in support for RxJava 3, Kotlin coroutines and SmallRye Mutiny, but you can
register others, too.
