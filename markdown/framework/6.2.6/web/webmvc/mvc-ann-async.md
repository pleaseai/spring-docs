---
title: "Asynchronous Requests"
source: "ROOT:web/webmvc/mvc-ann-async.adoc"
---

<a id="mvc-ann-async"></a>

# Asynchronous Requests

Spring MVC has an extensive integration with Servlet asynchronous request
[processing](#mvc-ann-async-processing):

- [`DeferredResult`](#mvc-ann-async-deferredresult) and [`Callable`](#mvc-ann-async-callable)
return values in controller methods provide basic support for a single asynchronous
return value.
- Controllers can [stream](#mvc-ann-async-http-streaming) multiple values, including
[SSE](#mvc-ann-async-sse) and [raw data](#mvc-ann-async-output-stream).
- Controllers can use reactive clients and return
[reactive types](#mvc-ann-async-reactive-types) for response handling.

For an overview of how this differs from Spring WebFlux, see the [Async Spring MVC compared to WebFlux](#mvc-ann-async-vs-webflux) section below.

<a id="mvc-ann-async-deferredresult"></a>

## `DeferredResult`

Once the asynchronous request processing feature is [enabled](#mvc-ann-async-configuration)
in the Servlet container, controller methods can wrap any supported controller method
return value with `DeferredResult`, as the following example shows:

#### Java

```java
@GetMapping("/quotes")
@ResponseBody
public DeferredResult<String> quotes() {
	DeferredResult<String> deferredResult = new DeferredResult<>();
	// Save the deferredResult somewhere..
	return deferredResult;
}

// From some other thread...
deferredResult.setResult(result);
```

#### Kotlin

```kotlin
@GetMapping("/quotes")
@ResponseBody
fun quotes(): DeferredResult<String> {
	val deferredResult = DeferredResult<String>()
	// Save the deferredResult somewhere..
	return deferredResult
}

// From some other thread...
deferredResult.setResult(result)
```

The controller can produce the return value asynchronously, from a different thread — for
example, in response to an external event (JMS message), a scheduled task, or other event.

<a id="mvc-ann-async-callable"></a>

## `Callable`

A controller can wrap any supported return value with `java.util.concurrent.Callable`,
as the following example shows:

#### Java

```java
@PostMapping
public Callable<String> processUpload(final MultipartFile file) {
	return () -> "someView";
}
```

#### Kotlin

```kotlin
@PostMapping
fun processUpload(file: MultipartFile) = Callable<String> {
	// ...
	"someView"
}
```

The return value can then be obtained by running the given task through the
[configured](#mvc-ann-async-configuration-spring-mvc) `AsyncTaskExecutor`.

<a id="mvc-ann-async-processing"></a>

## Processing

Here is a very concise overview of Servlet asynchronous request processing:

- A `ServletRequest` can be put in asynchronous mode by calling `request.startAsync()`.
The main effect of doing so is that the Servlet (as well as any filters) can exit, but
the response remains open to let processing complete later.
- The call to `request.startAsync()` returns `AsyncContext`, which you can use for
further control over asynchronous processing. For example, it provides the `dispatch` method,
which is similar to a forward from the Servlet API, except that it lets an
application resume request processing on a Servlet container thread.
- The `ServletRequest` provides access to the current `DispatcherType`, which you can
use to distinguish between processing the initial request, an asynchronous
dispatch, a forward, and other dispatcher types.

`DeferredResult` processing works as follows:

- The controller returns a `DeferredResult` and saves it in some in-memory
queue or list where it can be accessed.
- Spring MVC calls `request.startAsync()`.
- Meanwhile, the `DispatcherServlet` and all configured filters exit the request
processing thread, but the response remains open.
- The application sets the `DeferredResult` from some thread, and Spring MVC
dispatches the request back to the Servlet container.
- The `DispatcherServlet` is invoked again, and processing resumes with the
asynchronously produced return value.

`Callable` processing works as follows:

- The controller returns a `Callable`.
- Spring MVC calls `request.startAsync()` and submits the `Callable` to
an `AsyncTaskExecutor` for processing in a separate thread.
- Meanwhile, the `DispatcherServlet` and all filters exit the Servlet container thread,
but the response remains open.
- Eventually the `Callable` produces a result, and Spring MVC dispatches the request back
to the Servlet container to complete processing.
- The `DispatcherServlet` is invoked again, and processing resumes with the
asynchronously produced return value from the `Callable`.

For further background and context, you can also read
[the
blog posts](https://spring.io/blog/2012/05/07/spring-mvc-3-2-preview-introducing-servlet-3-async-support) that introduced asynchronous request processing support in Spring MVC 3.2.

<a id="mvc-ann-async-exceptions"></a>

### Exception Handling

When you use a `DeferredResult`, you can choose whether to call `setResult` or
`setErrorResult` with an exception. In both cases, Spring MVC dispatches the request back
to the Servlet container to complete processing. It is then treated either as if the
controller method returned the given value or as if it produced the given exception.
The exception then goes through the regular exception handling mechanism (for example, invoking
`@ExceptionHandler` methods).

When you use `Callable`, similar processing logic occurs, the main difference being that
the result is returned from the `Callable` or an exception is raised by it.

<a id="mvc-ann-async-interception"></a>

### Interception

`HandlerInterceptor` instances can be of type `AsyncHandlerInterceptor`, to receive the
`afterConcurrentHandlingStarted` callback on the initial request that starts asynchronous
processing (instead of `postHandle` and `afterCompletion`).

`HandlerInterceptor` implementations can also register a `CallableProcessingInterceptor`
or a `DeferredResultProcessingInterceptor`, to integrate more deeply with the
lifecycle of an asynchronous request (for example, to handle a timeout event). See
[`AsyncHandlerInterceptor`](https://docs.spring.io/spring-framework/docs/6.2.6/javadoc-api/org/springframework/web/servlet/AsyncHandlerInterceptor.html)
for more details.

`DeferredResult` provides `onTimeout(Runnable)` and `onCompletion(Runnable)` callbacks.
See the [javadoc of `DeferredResult`](https://docs.spring.io/spring-framework/docs/6.2.6/javadoc-api/org/springframework/web/context/request/async/DeferredResult.html)
for more details. `Callable` can be substituted for `WebAsyncTask` that exposes additional
methods for timeout and completion callbacks.

<a id="mvc-ann-async-vs-webflux"></a>

### Async Spring MVC compared to WebFlux

The Servlet API was originally built for making a single pass through the Filter-Servlet
chain. Asynchronous request processing lets applications exit the Filter-Servlet chain
but leave the response open for further processing. The Spring MVC asynchronous support
is built around that mechanism. When a controller returns a `DeferredResult`, the
Filter-Servlet chain is exited, and the Servlet container thread is released. Later, when
the `DeferredResult` is set, an `ASYNC` dispatch (to the same URL) is made, during which the
controller is mapped again but, rather than invoking it, the `DeferredResult` value is used
(as if the controller returned it) to resume processing.

By contrast, Spring WebFlux is neither built on the Servlet API, nor does it need such an
asynchronous request processing feature, because it is asynchronous by design. Asynchronous
handling is built into all framework contracts and is intrinsically supported through all
stages of request processing.

From a programming model perspective, both Spring MVC and Spring WebFlux support
asynchronous and [Reactive Types](#mvc-ann-async-reactive-types) as return values in controller methods.
Spring MVC even supports streaming, including reactive back pressure. However, individual
writes to the response remain blocking (and are performed on a separate thread), unlike WebFlux,
which relies on non-blocking I/O and does not need an extra thread for each write.

Another fundamental difference is that Spring MVC does not support asynchronous or reactive
types in controller method arguments (for example, `@RequestBody`, `@RequestPart`, and others),
nor does it have any explicit support for asynchronous and reactive types as model attributes.
Spring WebFlux does support all that.

Finally, from a configuration perspective the asynchronous request processing feature must be
[enabled at the Servlet container level](#mvc-ann-async-configuration).

<a id="mvc-ann-async-http-streaming"></a>

## HTTP Streaming

[See equivalent in the Reactive stack](../webflux/reactive-spring.md#webflux-codecs-streaming)

You can use `DeferredResult` and `Callable` for a single asynchronous return value.
What if you want to produce multiple asynchronous values and have those written to the
response? This section describes how to do so.

<a id="mvc-ann-async-objects"></a>

### Objects

You can use the `ResponseBodyEmitter` return value to produce a stream of objects, where
each object is serialized with an
[`HttpMessageConverter`](../../integration/rest-clients.md#rest-message-conversion) and written to the
response, as the following example shows:

#### Java

```java
@GetMapping("/events")
public ResponseBodyEmitter handle() {
	ResponseBodyEmitter emitter = new ResponseBodyEmitter();
	// Save the emitter somewhere..
	return emitter;
}

// In some other thread
emitter.send("Hello once");

// and again later on
emitter.send("Hello again");

// and done at some point
emitter.complete();
```

#### Kotlin

```kotlin
@GetMapping("/events")
fun handle() = ResponseBodyEmitter().apply {
	// Save the emitter somewhere..
}

// In some other thread
emitter.send("Hello once")

// and again later on
emitter.send("Hello again")

// and done at some point
emitter.complete()
```

You can also use `ResponseBodyEmitter` as the body in a `ResponseEntity`, letting you
customize the status and headers of the response.

When an `emitter` throws an `IOException` (for example, if the remote client went away), applications
are not responsible for cleaning up the connection and should not invoke `emitter.complete`
or `emitter.completeWithError`. Instead, the servlet container automatically initiates an
`AsyncListener` error notification, in which Spring MVC makes a `completeWithError` call.
This call, in turn, performs one final `ASYNC` dispatch to the application, during which Spring MVC
invokes the configured exception resolvers and completes the request.

<a id="mvc-ann-async-sse"></a>

### SSE

`SseEmitter` (a subclass of `ResponseBodyEmitter`) provides support for
[Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html), where events sent from the server
are formatted according to the W3C SSE specification. To produce an SSE
stream from a controller, return `SseEmitter`, as the following example shows:

#### Java

```java
@GetMapping(path="/events", produces=MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter handle() {
	SseEmitter emitter = new SseEmitter();
	// Save the emitter somewhere..
	return emitter;
}

// In some other thread
emitter.send("Hello once");

// and again later on
emitter.send("Hello again");

// and done at some point
emitter.complete();
```

#### Kotlin

```kotlin
@GetMapping("/events", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
fun handle() = SseEmitter().apply {
	// Save the emitter somewhere..
}

// In some other thread
emitter.send("Hello once")

// and again later on
emitter.send("Hello again")

// and done at some point
emitter.complete()
```

While SSE is the main option for streaming into browsers, note that Internet Explorer
does not support Server-Sent Events. Consider using Spring’s
[WebSocket messaging](../websocket.md) with
[SockJS fallback](../websocket/fallback.md) transports (including SSE) that target
a wide range of browsers.

See also [previous section](#mvc-ann-async-objects) for notes on exception handling.

<a id="mvc-ann-async-output-stream"></a>

### Raw Data

Sometimes, it is useful to bypass message conversion and stream directly to the response
`OutputStream` (for example, for a file download). You can use the `StreamingResponseBody`
return value type to do so, as the following example shows:

#### Java

```java
@GetMapping("/download")
public StreamingResponseBody handle() {
	return new StreamingResponseBody() {
		@Override
		public void writeTo(OutputStream outputStream) throws IOException {
			// write...
		}
	};
}
```

#### Kotlin

```kotlin
@GetMapping("/download")
fun handle() = StreamingResponseBody {
	// write...
}
```

You can use `StreamingResponseBody` as the body in a `ResponseEntity` to
customize the status and headers of the response.

<a id="mvc-ann-async-reactive-types"></a>

## Reactive Types

[See equivalent in the Reactive stack](../webflux/reactive-spring.md#webflux-codecs-streaming)

Spring MVC supports use of reactive client libraries in a controller (also read
[Reactive Libraries](../../web-reactive.md#webflux-reactive-libraries) in the WebFlux section).
This includes the `WebClient` from `spring-webflux` and others, such as Spring Data
reactive data repositories. In such scenarios, it is convenient to be able to return
reactive types from the controller method.

Reactive return values are handled as follows:

- A single-value promise is adapted to, similar to using `DeferredResult`. Examples
include `Mono` (Reactor) or `Single` (RxJava).
- A multi-value stream with a streaming media type (such as `application/x-ndjson`
or `text/event-stream`) is adapted to, similar to using `ResponseBodyEmitter` or
`SseEmitter`. Examples include `Flux` (Reactor) or `Observable` (RxJava).
Applications can also return `Flux<ServerSentEvent>` or `Observable<ServerSentEvent>`.
- A multi-value stream with any other media type (such as `application/json`) is adapted
to, similar to using `DeferredResult<List<?>>`.

> [!TIP]
> Spring MVC supports Reactor and RxJava through the
> [`ReactiveAdapterRegistry`](https://docs.spring.io/spring-framework/docs/6.2.6/javadoc-api/org/springframework/core/ReactiveAdapterRegistry.html) from
> `spring-core`, which lets it adapt from multiple reactive libraries.

For streaming to the response, reactive back pressure is supported, but writes to the
response are still blocking and are run on a separate thread through the
[configured](#mvc-ann-async-configuration-spring-mvc)
`AsyncTaskExecutor`, to avoid blocking the upstream source such as a `Flux` returned
from `WebClient`.

<a id="mvc-ann-async-context-propagation"></a>

## Context Propagation

It is common to propagate context via `java.lang.ThreadLocal`. This works transparently
for handling on the same thread, but requires additional work for asynchronous handling
across multiple threads. The Micrometer
[Context Propagation](https://github.com/micrometer-metrics/context-propagation#context-propagation-library)
library simplifies context propagation across threads, and across context mechanisms such
as `ThreadLocal` values,
Reactor [context](https://projectreactor.io/docs/core/release/reference/#context),
GraphQL Java [context](https://www.graphql-java.com/documentation/concerns/#context-objects),
and others.

If Micrometer Context Propagation is present on the classpath, when a controller method
returns a [reactive type](#mvc-ann-async-reactive-types) such as `Flux` or `Mono`, all
`ThreadLocal` values, for which there is a registered `io.micrometer.ThreadLocalAccessor`,
are written to the Reactor `Context` as key-value pairs, using the key assigned by the
`ThreadLocalAccessor`.

For other asynchronous handling scenarios, you can use the Context Propagation library
directly. For example:

#### Java

```java
// Capture ThreadLocal values from the main thread ...
ContextSnapshot snapshot = ContextSnapshot.captureAll();

// On a different thread: restore ThreadLocal values
try (ContextSnapshot.Scope scope = snapshot.setThreadLocals()) {
	// ...
}
```

The following `ThreadLocalAccessor` implementations are provided out of the box:

- `LocaleContextThreadLocalAccessor` — propagates `LocaleContext` via `LocaleContextHolder`
- `RequestAttributesThreadLocalAccessor` — propagates `RequestAttributes` via `RequestContextHolder`

The above are not registered automatically. You need to register them via `ContextRegistry.getInstance()` on startup.

For more details, see the [documentation](https://docs.micrometer.io/context-propagation/reference/) of the
Micrometer Context Propagation library.

<a id="mvc-ann-async-disconnects"></a>

## Disconnects

[See equivalent in the Reactive stack](../webflux/reactive-spring.md#webflux-codecs-streaming)

The Servlet API does not provide any notification when a remote client goes away.
Therefore, while streaming to the response, whether through [SseEmitter](#mvc-ann-async-sse)
or [reactive types](#mvc-ann-async-reactive-types), it is important to send data periodically,
since the write fails if the client has disconnected. The send could take the form of an
empty (comment-only) SSE event or any other data that the other side would have to interpret
as a heartbeat and ignore.

Alternatively, consider using web messaging solutions (such as
[STOMP over WebSocket](../websocket/stomp.md) or WebSocket with [SockJS](../websocket/fallback.md))
that have a built-in heartbeat mechanism.

<a id="mvc-ann-async-configuration"></a>

## Configuration

The asynchronous request processing feature must be enabled at the Servlet container level.
The MVC configuration also exposes several options for asynchronous requests.

<a id="mvc-ann-async-configuration-servlet3"></a>

### Servlet Container

Filter and Servlet declarations have an `asyncSupported` flag that needs to be set to `true`
to enable asynchronous request processing. In addition, Filter mappings should be
declared to handle the `ASYNC` `jakarta.servlet.DispatchType`.

In Java configuration, when you use `AbstractAnnotationConfigDispatcherServletInitializer`
to initialize the Servlet container, this is done automatically.

In `web.xml` configuration, you can add `<async-supported>true</async-supported>` to the
`DispatcherServlet` and to `Filter` declarations and add
`<dispatcher>ASYNC</dispatcher>` to filter mappings.

<a id="mvc-ann-async-configuration-spring-mvc"></a>

### Spring MVC

The MVC configuration exposes the following options for asynchronous request processing:

- Java configuration: Use the `configureAsyncSupport` callback on `WebMvcConfigurer`.
- XML namespace: Use the `<async-support>` element under `<mvc:annotation-driven>`.

You can configure the following:

- The default timeout value for async requests depends
on the underlying Servlet container, unless it is set explicitly.
- `AsyncTaskExecutor` to use for blocking writes when streaming with
[Reactive Types](#mvc-ann-async-reactive-types) and for
executing `Callable` instances returned from controller methods.
The one used by default is not suitable for production under load.
- `DeferredResultProcessingInterceptor` implementations and `CallableProcessingInterceptor` implementations.

Note that you can also set the default timeout value on a `DeferredResult`,
a `ResponseBodyEmitter`, and an `SseEmitter`. For a `Callable`, you can use
`WebAsyncTask` to provide a timeout value.
