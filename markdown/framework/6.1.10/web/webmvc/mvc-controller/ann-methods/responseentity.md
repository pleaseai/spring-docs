---
title: "ResponseEntity"
source: "ROOT:web/webmvc/mvc-controller/ann-methods/responseentity.adoc"
---

<a id="mvc-ann-responseentity"></a>

# ResponseEntity

[See equivalent in the Reactive stack](../../../webflux/controller/ann-methods/responseentity.md)

`ResponseEntity` is like [`@ResponseBody`](responsebody.md) but with status and headers. For example:

#### Java

```java
@GetMapping("/something")
public ResponseEntity<String> handle() {
	String body = ... ;
	String etag = ... ;
	return ResponseEntity.ok().eTag(etag).body(body);
}
```

#### Kotlin

```kotlin
@GetMapping("/something")
fun handle(): ResponseEntity<String> {
	val body = ...
	val etag = ...
	return ResponseEntity.ok().eTag(etag).build(body)
}
```

The body will usually be provided as a value object to be rendered to a corresponding
response representation (e.g. JSON) by one of the registered `HttpMessageConverters`.

A `ResponseEntity<Resource>` can be returned for file content, copying the `InputStream`
content of the provided resource to the response `OutputStream`. Note that the
`InputStream` should be lazily retrieved by the `Resource` handle in order to reliably
close it after it has been copied to the response. If you are using `InputStreamResource`
for such a purpose, make sure to construct it with an on-demand `InputStreamSource`
(e.g. through a lambda expression that retrieves the actual `InputStream`).

Spring MVC supports using a single value [reactive type](../../mvc-ann-async.md#mvc-ann-async-reactive-types)
to produce the `ResponseEntity` asynchronously, and/or single and multi-value reactive
types for the body. This allows the following types of async responses:

- `ResponseEntity<Mono<T>>` or `ResponseEntity<Flux<T>>` make the response status and
headers known immediately while the body is provided asynchronously at a later point.
Use `Mono` if the body consists of 0..1 values or `Flux` if it can produce multiple values.
- `Mono<ResponseEntity<T>>` provides all three — response status, headers, and body,
asynchronously at a later point. This allows the response status and headers to vary
depending on the outcome of asynchronous request handling.
