---
title: "Return Values"
source: "ROOT:web/webmvc/mvc-controller/ann-methods/return-types.adoc"
---

<a id="mvc-ann-return-types"></a>

# Return Values

[See equivalent in the Reactive stack](../../../webflux/controller/ann-methods/return-types.md)

The next table describes the supported controller method return values. Reactive types are
supported for all return values.

| Controller method return value | Description |
| --- | --- |
| `@ResponseBody` | The return value is converted through `HttpMessageConverter` implementations and written to the response. See [`@ResponseBody`](responsebody.md). |
| `HttpEntity<B>`, `ResponseEntity<B>` | The return value that specifies the full response (including HTTP headers and body) is to be converted through `HttpMessageConverter` implementations and written to the response. See [ResponseEntity](responseentity.md). |
| `HttpHeaders` | For returning a response with headers and no body. |
| `ErrorResponse` | To render an RFC 7807 error response with details in the body, see [Error Responses](../../mvc-ann-rest-exceptions.md) |
| `ProblemDetail` | To render an RFC 7807 error response with details in the body, see [Error Responses](../../mvc-ann-rest-exceptions.md) |
| `String` | A view name to be resolved with `ViewResolver` implementations and used together with the implicit model — determined through command objects and `@ModelAttribute` methods. The handler method can also programmatically enrich the model by declaring a `Model` argument (see [Explicit Registrations](../ann-requestmapping.md#mvc-ann-requestmapping-registration)). |
| `View` | A `View` instance to use for rendering together with the implicit model — determined through command objects and `@ModelAttribute` methods. The handler method can also programmatically enrich the model by declaring a `Model` argument (see [Explicit Registrations](../ann-requestmapping.md#mvc-ann-requestmapping-registration)). |
| `java.util.Map`, `org.springframework.ui.Model` | Attributes to be added to the implicit model, with the view name implicitly determined through a `RequestToViewNameTranslator`. |
| `@ModelAttribute` | An attribute to be added to the model, with the view name implicitly determined through a `RequestToViewNameTranslator`. Note that `@ModelAttribute` is optional. See "Any other return value" at the end of this table. |
| `ModelAndView` object | The view and model attributes to use and, optionally, a response status. |
| `void` | A method with a `void` return type (or `null` return value) is considered to have fully handled the response if it also has a `ServletResponse`, an `OutputStream` argument, or an `@ResponseStatus` annotation. The same is also true if the controller has made a positive `ETag` or `lastModified` timestamp check (see [Controllers](../../mvc-caching.md#mvc-caching-etag-lastmodified) for details). If none of the above is true, a `void` return type can also indicate “no response body” for REST controllers or a default view name selection for HTML controllers. |
| `DeferredResult<V>` | Produce any of the preceding return values asynchronously from any thread — for example, as a result of some event or callback. See [Asynchronous Requests](../../mvc-ann-async.md) and [`DeferredResult`](../../mvc-ann-async.md#mvc-ann-async-deferredresult). |
| `Callable<V>` | Produce any of the above return values asynchronously in a Spring MVC-managed thread. See [Asynchronous Requests](../../mvc-ann-async.md) and [`Callable`](../../mvc-ann-async.md#mvc-ann-async-callable). |
| `ListenableFuture<V>`, `java.util.concurrent.CompletionStage<V>`, `java.util.concurrent.CompletableFuture<V>` | Alternative to `DeferredResult`, as a convenience (for example, when an underlying service returns one of those). |
| `ResponseBodyEmitter`, `SseEmitter` | Emit a stream of objects asynchronously to be written to the response with `HttpMessageConverter` implementations. Also supported as the body of a `ResponseEntity`. See [Asynchronous Requests](../../mvc-ann-async.md) and [HTTP Streaming](../../mvc-ann-async.md#mvc-ann-async-http-streaming). |
| `StreamingResponseBody` | Write to the response `OutputStream` asynchronously. Also supported as the body of a `ResponseEntity`. See [Asynchronous Requests](../../mvc-ann-async.md) and [HTTP Streaming](../../mvc-ann-async.md#mvc-ann-async-http-streaming). |
| Reactor and other reactive types registered via `ReactiveAdapterRegistry` | A single value type, e.g. `Mono`, is comparable to returning `DeferredResult`. A multi-value type, e.g. `Flux`, may be treated as a stream depending on the requested media type, e.g. "text/event-stream", "application/json+stream", or otherwise is collected to a List and rendered as a single value. See [Asynchronous Requests](../../mvc-ann-async.md) and [Reactive Types](../../mvc-ann-async.md#mvc-ann-async-reactive-types). |
| Other return values | If a return value remains unresolved in any other way, it is treated as a model attribute, unless it is a simple type as determined by [BeanUtils#isSimpleProperty](https://docs.spring.io/spring-framework/docs/6.1.2/javadoc-api/org/springframework/beans/BeanUtils.html#isSimpleProperty-java.lang.Class-), in which case it remains unresolved. |
