---
title: "Reactive Core"
source: "ROOT:web/webflux/reactive-spring.adoc"
---

<a id="webflux-reactive-spring-web"></a>

# Reactive Core

The `spring-web` module contains the following foundational support for reactive web
applications:

- For server request processing there are two levels of support.

  - [HttpHandler](#webflux-httphandler): Basic contract for HTTP request handling with
  non-blocking I/O and Reactive Streams back pressure, along with adapters for Reactor Netty,
  Undertow, Tomcat, Jetty, and any Servlet container.
  - [`WebHandler` API](#webflux-web-handler-api): Slightly higher level, general-purpose web API for
  request handling, on top of which concrete programming models such as annotated
  controllers and functional endpoints are built.
- For the client side, there is a basic `ClientHttpConnector` contract to perform HTTP
requests with non-blocking I/O and Reactive Streams back pressure, along with adapters for
[Reactor Netty](https://github.com/reactor/reactor-netty), reactive
[Jetty HttpClient](https://github.com/jetty-project/jetty-reactive-httpclient)
and [Apache HttpComponents](https://hc.apache.org/).
The higher level [WebClient](../webflux-webclient.md) used in applications
builds on this basic contract.
- For client and server, [codecs](#webflux-codecs) for serialization and
deserialization of HTTP request and response content.

<a id="webflux-httphandler"></a>

## `HttpHandler`

[HttpHandler](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/http/server/reactive/HttpHandler.html)
is a simple contract with a single method to handle a request and a response. It is
intentionally minimal, and its main and only purpose is to be a minimal abstraction
over different HTTP server APIs.

The following table describes the supported server APIs:

| Server name | Server API used | Reactive Streams support |
| --- | --- | --- |
| Netty | Netty API | [Reactor Netty](https://github.com/reactor/reactor-netty) |
| Undertow | Undertow API | spring-web: Undertow to Reactive Streams bridge |
| Tomcat | Servlet non-blocking I/O; Tomcat API to read and write ByteBuffers vs byte\[\] | spring-web: Servlet non-blocking I/O to Reactive Streams bridge |
| Jetty | Servlet non-blocking I/O; Jetty API to write ByteBuffers vs byte\[\] | spring-web: Servlet non-blocking I/O to Reactive Streams bridge |
| Servlet container | Servlet non-blocking I/O | spring-web: Servlet non-blocking I/O to Reactive Streams bridge |

The following table describes server dependencies (also see
[supported versions](https://github.com/spring-projects/spring-framework/wiki/What%27s-New-in-the-Spring-Framework)):

| Server name | Group id | Artifact name |
| --- | --- | --- |
| Reactor Netty | io.projectreactor.netty | reactor-netty |
| Undertow | io.undertow | undertow-core |
| Tomcat | org.apache.tomcat.embed | tomcat-embed-core |
| Jetty | org.eclipse.jetty | jetty-server, jetty-servlet |

The code snippets below show using the `HttpHandler` adapters with each server API:

**Reactor Netty**

#### Java

```java
HttpHandler handler = ...
ReactorHttpHandlerAdapter adapter = new ReactorHttpHandlerAdapter(handler);
HttpServer.create().host(host).port(port).handle(adapter).bindNow();
```

#### Kotlin

```kotlin
val handler: HttpHandler = ...
val adapter = ReactorHttpHandlerAdapter(handler)
HttpServer.create().host(host).port(port).handle(adapter).bindNow()
```

**Undertow**

#### Java

```java
HttpHandler handler = ...
UndertowHttpHandlerAdapter adapter = new UndertowHttpHandlerAdapter(handler);
Undertow server = Undertow.builder().addHttpListener(port, host).setHandler(adapter).build();
server.start();
```

#### Kotlin

```kotlin
val handler: HttpHandler = ...
val adapter = UndertowHttpHandlerAdapter(handler)
val server = Undertow.builder().addHttpListener(port, host).setHandler(adapter).build()
server.start()
```

**Tomcat**

#### Java

```java
HttpHandler handler = ...
Servlet servlet = new TomcatHttpHandlerAdapter(handler);

Tomcat server = new Tomcat();
File base = new File(System.getProperty("java.io.tmpdir"));
Context rootContext = server.addContext("", base.getAbsolutePath());
Tomcat.addServlet(rootContext, "main", servlet);
rootContext.addServletMappingDecoded("/", "main");
server.setHost(host);
server.setPort(port);
server.start();
```

#### Kotlin

```kotlin
val handler: HttpHandler = ...
val servlet = TomcatHttpHandlerAdapter(handler)

val server = Tomcat()
val base = File(System.getProperty("java.io.tmpdir"))
val rootContext = server.addContext("", base.absolutePath)
Tomcat.addServlet(rootContext, "main", servlet)
rootContext.addServletMappingDecoded("/", "main")
server.host = host
server.setPort(port)
server.start()
```

**Jetty**

#### Java

```java
HttpHandler handler = ...
Servlet servlet = new JettyHttpHandlerAdapter(handler);

Server server = new Server();
ServletContextHandler contextHandler = new ServletContextHandler(server, "");
contextHandler.addServlet(new ServletHolder(servlet), "/");
contextHandler.start();

ServerConnector connector = new ServerConnector(server);
connector.setHost(host);
connector.setPort(port);
server.addConnector(connector);
server.start();
```

#### Kotlin

```kotlin
val handler: HttpHandler = ...
val servlet = JettyHttpHandlerAdapter(handler)

val server = Server()
val contextHandler = ServletContextHandler(server, "")
contextHandler.addServlet(ServletHolder(servlet), "/")
contextHandler.start();

val connector = ServerConnector(server)
connector.host = host
connector.port = port
server.addConnector(connector)
server.start()
```

**Servlet Container**

To deploy as a WAR to any Servlet container, you can extend and include
[`AbstractReactiveWebInitializer`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/web/server/adapter/AbstractReactiveWebInitializer.html)
in the WAR. That class wraps an `HttpHandler` with `ServletHttpHandlerAdapter` and registers
that as a `Servlet`.

<a id="webflux-web-handler-api"></a>

## `WebHandler` API

The `org.springframework.web.server` package builds on the
[`HttpHandler`](#webflux-httphandler) contract
to provide a general-purpose web API for processing requests through a chain of multiple
[`WebExceptionHandler`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/web/server/WebExceptionHandler.html), multiple
[`WebFilter`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/web/server/WebFilter.html), and a single
[`WebHandler`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/web/server/WebHandler.html) component. The chain can
be put together with `WebHttpHandlerBuilder` by simply pointing to a Spring
`ApplicationContext` where components are
[auto-detected](#webflux-web-handler-api-special-beans), and/or by registering components
with the builder.

While `HttpHandler` has a simple goal to abstract the use of different HTTP servers, the
`WebHandler` API aims to provide a broader set of features commonly used in web applications
such as:

- User session with attributes.
- Request attributes.
- Resolved `Locale` or `Principal` for the request.
- Access to parsed and cached form data.
- Abstractions for multipart data.
- and more..

<a id="webflux-web-handler-api-special-beans"></a>

### Special bean types

The table below lists the components that `WebHttpHandlerBuilder` can auto-detect in a
Spring ApplicationContext, or that can be registered directly with it:

| Bean name | Bean type | Count | Description |
| --- | --- | --- | --- |
| <any> | `WebExceptionHandler` | 0..N | Provide handling for exceptions from the chain of `WebFilter` instances and the target `WebHandler`. For more details, see [Exceptions](#webflux-exception-handler). |
| <any> | `WebFilter` | 0..N | Apply interception style logic to before and after the rest of the filter chain and the target `WebHandler`. For more details, see [Filters](#webflux-filters). |
| `webHandler` | `WebHandler` | 1 | The handler for the request. |
| `webSessionManager` | `WebSessionManager` | 0..1 | The manager for `WebSession` instances exposed through a method on `ServerWebExchange`. `DefaultWebSessionManager` by default. |
| `serverCodecConfigurer` | `ServerCodecConfigurer` | 0..1 | For access to `HttpMessageReader` instances for parsing form data and multipart data that is then exposed through methods on `ServerWebExchange`. `ServerCodecConfigurer.create()` by default. |
| `localeContextResolver` | `LocaleContextResolver` | 0..1 | The resolver for `LocaleContext` exposed through a method on `ServerWebExchange`. `AcceptHeaderLocaleContextResolver` by default. |
| `forwardedHeaderTransformer` | `ForwardedHeaderTransformer` | 0..1 | For processing forwarded type headers, either by extracting and removing them or by removing them only. Not used by default. |

<a id="webflux-form-data"></a>

### Form Data

`ServerWebExchange` exposes the following method for accessing form data:

#### Java

```java
Mono<MultiValueMap<String, String>> getFormData();
```

#### Kotlin

```Kotlin
suspend fun getFormData(): MultiValueMap<String, String>
```

The `DefaultServerWebExchange` uses the configured `HttpMessageReader` to parse form data
(`application/x-www-form-urlencoded`) into a `MultiValueMap`. By default,
`FormHttpMessageReader` is configured for use by the `ServerCodecConfigurer` bean
(see the [Web Handler API](#webflux-web-handler-api)).

<a id="webflux-multipart"></a>

### Multipart Data

[See equivalent in the Servlet stack](../webmvc/mvc-servlet/multipart.md)

`ServerWebExchange` exposes the following method for accessing multipart data:

#### Java

```java
Mono<MultiValueMap<String, Part>> getMultipartData();
```

#### Kotlin

```Kotlin
suspend fun getMultipartData(): MultiValueMap<String, Part>
```

The `DefaultServerWebExchange` uses the configured
`HttpMessageReader<MultiValueMap<String, Part>>` to parse `multipart/form-data`,
`multipart/mixed`, and `multipart/related` content into a `MultiValueMap`.
By default, this is the `DefaultPartHttpMessageReader`, which does not have any third-party
dependencies.
Alternatively, the `SynchronossPartHttpMessageReader` can be used, which is based on the
[Synchronoss NIO Multipart](https://github.com/synchronoss/nio-multipart) library.
Both are configured through the `ServerCodecConfigurer` bean
(see the [Web Handler API](#webflux-web-handler-api)).

To parse multipart data in streaming fashion, you can use the `Flux<PartEvent>` returned from the
`PartEventHttpMessageReader` instead of using `@RequestPart`, as that  implies `Map`-like access
to individual parts by name and, hence, requires parsing multipart data in full.
By contrast, you can use `@RequestBody` to decode the content to `Flux<PartEvent>` without
collecting to a `MultiValueMap`.

<a id="webflux-forwarded-headers"></a>

### Forwarded Headers

[See equivalent in the Servlet stack](../webmvc/filters.md#filters-forwarded-headers)

As a request goes through proxies such as load balancers the host, port, and
scheme may change, and that makes it a challenge to create links that point to the correct
host, port, and scheme from a client perspective.

[RFC 7239](https://datatracker.ietf.org/doc/html/rfc7239) defines the `Forwarded` HTTP header
that proxies can use to provide information about the original request.

<a id="forwarded-headers-non-standard"></a>

### Non-standard Headers

There are other non-standard headers, too, including `X-Forwarded-Host`, `X-Forwarded-Port`,
`X-Forwarded-Proto`, `X-Forwarded-Ssl`, and `X-Forwarded-Prefix`.

<a id="x-forwarded-host"></a>

#### X-Forwarded-Host

While not standard, [`X-Forwarded-Host: <host>`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Host)
is a de-facto standard header that is used to communicate the original host to a
downstream server. For example, if a request of `example.com/resource` is sent to
a proxy which forwards the request to `localhost:8080/resource`, then a header of
`X-Forwarded-Host: example.com` can be sent to inform the server that the original host was `example.com`.

<a id="x-forwarded-port"></a>

#### X-Forwarded-Port

While not standard, `X-Forwarded-Port: <port>` is a de-facto standard header that is used to
communicate the original port to a downstream server. For example, if a request of
`example.com/resource` is sent to a proxy which forwards the request to
`localhost:8080/resource`, then a header of `X-Forwarded-Port: 443` can be sent
to inform the server that the original port was `443`.

<a id="x-forwarded-proto"></a>

#### X-Forwarded-Proto

While not standard, [`X-Forwarded-Proto: (https|http)`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto)
is a de-facto standard header that is used to communicate the original protocol (for example, https / http)
to a downstream server. For example, if a request of `example.com/resource` is sent to
a proxy which forwards the request to `localhost:8080/resource`, then a header of
`X-Forwarded-Proto: https` can be sent to inform the server that the original protocol was `https`.

<a id="x-forwarded-ssl"></a>

#### X-Forwarded-Ssl

While not standard, `X-Forwarded-Ssl: (on|off)` is a de-facto standard header that is used to communicate the
original protocol (for example, https / https) to a downstream server. For example, if a request of
`example.com/resource` is sent to a proxy which forwards the request to
`localhost:8080/resource`, then a header of `X-Forwarded-Ssl: on` to inform the server that the
original protocol was `https`.

<a id="x-forwarded-prefix"></a>

#### X-Forwarded-Prefix

While not standard, [`X-Forwarded-Prefix: <prefix>`](https://microsoft.github.io/reverse-proxy/articles/transforms.html#defaults)
is a de-facto standard header that is used to communicate the original URL path prefix to a
downstream server.

Use of `X-Forwarded-Prefix` can vary by deployment scenario, and needs to be flexible to
allow replacing, removing, or prepending the path prefix of the target server.

*Scenario 1: Override path prefix*

```
https://example.com/api/{path} -> http://localhost:8080/app1/{path}
```

The prefix is the start of the path before the capture group `{path}`. For the proxy,
the prefix is `/api` while for the server the prefix is `/app1`. In this case, the proxy
can send `X-Forwarded-Prefix: /api` to have the original prefix `/api` override the
server prefix `/app1`.

*Scenario 2: Remove path prefix*

At times, an application may want to have the prefix removed. For example, consider the
following proxy to server mapping:

```
https://app1.example.com/{path} -> http://localhost:8080/app1/{path}
https://app2.example.com/{path} -> http://localhost:8080/app2/{path}
```

The proxy has no prefix, while applications `app1` and `app2` have path prefixes
`/app1` and `/app2` respectively. The proxy can send `X-Forwarded-Prefix: ` to
have the empty prefix override server prefixes `/app1` and `/app2`.

> [!NOTE]
> A common case for this deployment scenario is where licenses are paid per
> production application server, and it is preferable to deploy multiple applications per
> server to reduce fees. Another reason is to run more applications on the same server in
> order to share the resources required by the server to run.
>
> In these scenarios, applications need a non-empty context root because there are multiple
> applications on the same server. However, this should not be visible in URL paths of
> the public API where applications may use different subdomains that provides benefits
> such as:
>
> - Added security, for example, same origin policy
> - Independent scaling of applications (different domain points to different IP address)

*Scenario 3: Insert path prefix*

In other cases, it may be necessary to prepend a prefix. For example, consider the
following proxy to server mapping:

```
https://example.com/api/app1/{path} -> http://localhost:8080/app1/{path}
```

In this case, the proxy has a prefix of `/api/app1` and the server has a prefix of
`/app1`. The proxy can send `X-Forwarded-Prefix: /api/app1` to have the original prefix
`/api/app1` override the server prefix `/app1`.

<a id="webflux-forwarded-headers-transformer"></a>

### ForwardedHeaderTransformer

`ForwardedHeaderTransformer` is a component that modifies the host, port, and scheme of
the request, based on forwarded headers, and then removes those headers. If you declare
it as a bean with the name `forwardedHeaderTransformer`, it will be
[detected](#webflux-web-handler-api-special-beans) and used.

> [!NOTE]
> In 5.1 `ForwardedHeaderFilter` was deprecated and superseded by
> `ForwardedHeaderTransformer` so forwarded headers can be processed earlier, before the
> exchange is created. If the filter is configured anyway, it is taken out of the list of
> filters, and `ForwardedHeaderTransformer` is used instead.

<a id="webflux-forwarded-headers-security"></a>

### Security Considerations

There are security considerations for forwarded headers since an application cannot know
if the headers were added by a proxy, as intended, or by a malicious client. This is why
a proxy at the boundary of trust should be configured to remove untrusted forwarded traffic coming
from the outside. You can also configure the `ForwardedHeaderTransformer` with
`removeOnly=true`, in which case it removes but does not use the headers.

<a id="webflux-filters"></a>

## Filters

[See equivalent in the Servlet stack](../webmvc/filters.md)

In the [`WebHandler` API](#webflux-web-handler-api), you can use a `WebFilter` to apply interception-style
logic before and after the rest of the processing chain of filters and the target
`WebHandler`. When using the [WebFlux Config](dispatcher-handler.md#webflux-framework-config), registering a `WebFilter` is as simple
as declaring it as a Spring bean and (optionally) expressing precedence by using `@Order` on
the bean declaration or by implementing `Ordered`.

<a id="webflux-filters-cors"></a>

### CORS

[See equivalent in the Servlet stack](../webmvc/filters.md#filters-cors)

Spring WebFlux provides fine-grained support for CORS configuration through annotations on
controllers. However, when you use it with Spring Security, we advise relying on the built-in
`CorsFilter`, which must be ordered ahead of Spring Security’s chain of filters.

See the section on [CORS](../webflux-cors.md) and the [CORS `WebFilter`](../webflux-cors.md#webflux-cors-webfilter) for more details.

<a id="filters.url-handler"></a>

### URL Handler

[See equivalent in the Servlet stack](../webmvc/filters.md#filters.url-handler)

You may want your controller endpoints to match routes with or without a trailing slash in the URL path.
For example, both "GET /home" and "GET /home/" should be handled by a controller method annotated with `@GetMapping("/home")`.

Adding trailing slash variants to all mapping declarations is not the best way to handle this use case.
The `UrlHandlerFilter` web filter has been designed for this purpose. It can be configured to:

- respond with an HTTP redirect status when receiving URLs with trailing slashes, sending browsers to the non-trailing slash URL variant.
- mutate the request to act as if the request was sent without a trailing slash and continue the processing of the request.

Here is how you can instantiate and configure a `UrlHandlerFilter` for a blog application:

#### Java

```java
UrlHandlerFilter urlHandlerFilter = UrlHandlerFilter
		// will HTTP 308 redirect "/blog/my-blog-post/" -> "/blog/my-blog-post"
		.trailingSlashHandler("/blog/**").redirect(HttpStatus.PERMANENT_REDIRECT)
		// will mutate the request to "/admin/user/account/" and make it as "/admin/user/account"
		.trailingSlashHandler("/admin/**").mutateRequest()
		.build();
```

#### Kotlin

```kotlin
val urlHandlerFilter = UrlHandlerFilter
	// will HTTP 308 redirect "/blog/my-blog-post/" -> "/blog/my-blog-post"
	.trailingSlashHandler("/blog/**").redirect(HttpStatus.PERMANENT_REDIRECT)
	// will mutate the request to "/admin/user/account/" and make it as "/admin/user/account"
	.trailingSlashHandler("/admin/**").mutateRequest()
	.build()
```

<a id="webflux-exception-handler"></a>

## Exceptions

[See equivalent in the Servlet stack](../webmvc/mvc-servlet/exceptionhandlers.md#mvc-ann-customer-servlet-container-error-page)

In the [`WebHandler` API](#webflux-web-handler-api), you can use a `WebExceptionHandler` to handle
exceptions from the chain of `WebFilter` instances and the target `WebHandler`. When using the
[WebFlux Config](dispatcher-handler.md#webflux-framework-config), registering a `WebExceptionHandler` is as simple as declaring it as a
Spring bean and (optionally) expressing precedence by using `@Order` on the bean declaration or
by implementing `Ordered`.

The following table describes the available `WebExceptionHandler` implementations:

| Exception Handler | Description |
| --- | --- |
| `ResponseStatusExceptionHandler` | Provides handling for exceptions of type [`ResponseStatusException`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/web/server/ResponseStatusException.html) by setting the response to the HTTP status code of the exception. |
| `WebFluxResponseStatusExceptionHandler` | Extension of `ResponseStatusExceptionHandler` that can also determine the HTTP status code of a `@ResponseStatus` annotation on any exception. This handler is declared in the [WebFlux Config](dispatcher-handler.md#webflux-framework-config). |

<a id="webflux-codecs"></a>

## Codecs

[See equivalent in the Servlet stack](../webmvc/message-converters.md#message-converters)

The `spring-web` and `spring-core` modules provide support for serializing and
deserializing byte content to and from higher level objects through non-blocking I/O with
Reactive Streams back pressure. The following describes this support:

- [`Encoder`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/core/codec/Encoder.html) and
[`Decoder`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/core/codec/Decoder.html) are low level contracts to
encode and decode content independent of HTTP.
- [`HttpMessageReader`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/http/codec/HttpMessageReader.html) and
[`HttpMessageWriter`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/http/codec/HttpMessageWriter.html) are contracts
to encode and decode HTTP message content.
- An `Encoder` can be wrapped with `EncoderHttpMessageWriter` to adapt it for use in a web
application, while a `Decoder` can be wrapped with `DecoderHttpMessageReader`.
- [`DataBuffer`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/core/io/buffer/DataBuffer.html) abstracts different
byte buffer representations (for example, Netty `ByteBuf`, `java.nio.ByteBuffer`, etc.) and is
what all codecs work on. See [Data Buffers and Codecs](../../core/databuffer-codec.md) in the
"Spring Core" section for more on this topic.

The `spring-core` module provides `byte[]`, `ByteBuffer`, `DataBuffer`, `Resource`, and
`String` encoder and decoder implementations. The `spring-web` module provides Jackson
JSON, Jackson Smile, JAXB2, Protocol Buffers and other encoders and decoders along with
web-only HTTP message reader and writer implementations for form data, multipart content,
server-sent events, and others.

`ClientCodecConfigurer` and `ServerCodecConfigurer` are typically used to configure and
customize the codecs to use in an application. See the section on configuring
[HTTP message codecs](config.md#webflux-config-message-codecs).

<a id="webflux-codecs-jackson"></a>

### Jackson JSON

JSON and binary JSON ([Smile](https://github.com/FasterXML/smile-format-specification)) are
both supported when the Jackson library is present.

The `Jackson2Decoder` works as follows:

- Jackson’s asynchronous, non-blocking parser is used to aggregate a stream of byte chunks
into `TokenBuffer`'s each representing a JSON object.
- Each `TokenBuffer` is passed to Jackson’s `ObjectMapper` to create a higher level object.
- When decoding to a single-value publisher (for example, `Mono`), there is one `TokenBuffer`.
- When decoding to a multi-value publisher (for example, `Flux`), each `TokenBuffer` is passed to
the `ObjectMapper` as soon as enough bytes are received for a fully formed object. The
input content can be a JSON array, or any
[line-delimited JSON](https://en.wikipedia.org/wiki/JSON_streaming) format such as NDJSON,
JSON Lines, or JSON Text Sequences.

The `Jackson2Encoder` works as follows:

- For a single value publisher (for example, `Mono`), simply serialize it through the
`ObjectMapper`.
- For a multi-value publisher with `application/json`, by default collect the values with
`Flux#collectToList()` and then serialize the resulting collection.
- For a multi-value publisher with a streaming media type such as
`application/x-ndjson` or `application/stream+x-jackson-smile`, encode, write, and
flush each value individually using a
[line-delimited JSON](https://en.wikipedia.org/wiki/JSON_streaming) format. Other
streaming media types may be registered with the encoder.
- For SSE the `Jackson2Encoder` is invoked per event and the output is flushed to ensure
delivery without delay.

> [!NOTE]
> By default both `Jackson2Encoder` and `Jackson2Decoder` do not support elements of type
> `String`. Instead the default assumption is that a string or a sequence of strings
> represent serialized JSON content, to be rendered by the `CharSequenceEncoder`. If what
> you need is to render a JSON array from `Flux<String>`, use `Flux#collectToList()` and
> encode a `Mono<List<String>>`.

<a id="webflux-codecs-forms"></a>

### Form Data

`FormHttpMessageReader` and `FormHttpMessageWriter` support decoding and encoding
`application/x-www-form-urlencoded` content.

On the server side where form content often needs to be accessed from multiple places,
`ServerWebExchange` provides a dedicated `getFormData()` method that parses the content
through `FormHttpMessageReader` and then caches the result for repeated access.
See [Form Data](#webflux-form-data) in the
[`WebHandler` API](#webflux-web-handler-api) section.

Once `getFormData()` is used, the original raw content can no longer be read from the
request body. For this reason, applications are expected to go through `ServerWebExchange`
consistently for access to the cached form data versus reading from the raw request body.

<a id="webflux-codecs-multipart"></a>

### Multipart

`MultipartHttpMessageReader` and `MultipartHttpMessageWriter` support decoding and
encoding "multipart/form-data", "multipart/mixed", and "multipart/related" content.
In turn `MultipartHttpMessageReader` delegates to another `HttpMessageReader`
for the actual parsing to a `Flux<Part>` and then simply collects the parts into a `MultiValueMap`.
By default, the `DefaultPartHttpMessageReader` is used, but this can be changed through the
`ServerCodecConfigurer`.
For more information about the `DefaultPartHttpMessageReader`, refer to the
[javadoc of `DefaultPartHttpMessageReader`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/http/codec/multipart/DefaultPartHttpMessageReader.html).

On the server side where multipart form content may need to be accessed from multiple
places, `ServerWebExchange` provides a dedicated `getMultipartData()` method that parses
the content through `MultipartHttpMessageReader` and then caches the result for repeated access.
See [Multipart Data](#webflux-multipart) in the
[`WebHandler` API](#webflux-web-handler-api) section.

Once `getMultipartData()` is used, the original raw content can no longer be read from the
request body. For this reason applications have to consistently use `getMultipartData()`
for repeated, map-like access to parts, or otherwise rely on the
`SynchronossPartHttpMessageReader` for a one-time access to `Flux<Part>`.

<a id="webflux-codecs-protobuf"></a>

### Protocol Buffers

`ProtobufEncoder` and `ProtobufDecoder` supporting decoding and encoding "application/x-protobuf", "application/octet-stream"
and "application/vnd.google.protobuf" content for `com.google.protobuf.Message` types. They also support stream of values
if content is received/sent with the "delimited" parameter along the content type (like "application/x-protobuf;delimited=true").
This requires the "com.google.protobuf:protobuf-java" library, version 3.29 and higher.

The `ProtobufJsonDecoder` and `ProtobufJsonEncoder` variants support reading and writing JSON documents to and from Protobuf messages.
They require the "com.google.protobuf:protobuf-java-util" dependency. Note, the JSON variants do not support reading stream of messages,
see the [javadoc of `ProtobufJsonDecoder`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/http/codec/protobuf/ProtobufJsonDecoder.html) for more details.

<a id="webflux-codecs-limits"></a>

### Limits

`Decoder` and `HttpMessageReader` implementations that buffer some or all of the input
stream can be configured with a limit on the maximum number of bytes to buffer in memory.
In some cases buffering occurs because input is aggregated and represented as a single
object — for example, a controller method with `@RequestBody byte[]`,
`x-www-form-urlencoded` data, and so on. Buffering can also occur with streaming, when
splitting the input stream — for example, delimited text, a stream of JSON objects, and
so on. For those streaming cases, the limit applies to the number of bytes associated
with one object in the stream.

To configure buffer sizes, you can check if a given `Decoder` or `HttpMessageReader`
exposes a `maxInMemorySize` property and if so the Javadoc will have details about default
values. On the server side, `ServerCodecConfigurer` provides a single place from where to
set all codecs, see [HTTP message codecs](config.md#webflux-config-message-codecs). On the client side, the limit for
all codecs can be changed in
[WebClient.Builder](../webflux-webclient/client-builder.md#webflux-client-builder-maxinmemorysize).

For [Multipart parsing](#webflux-codecs-multipart) the `maxInMemorySize` property limits
the size of non-file parts. For file parts, it determines the threshold at which the part
is written to disk. For file parts written to disk, there is an additional
`maxDiskUsagePerPart` property to limit the amount of disk space per part. There is also
a `maxParts` property to limit the overall number of parts in a multipart request.
To configure all three in WebFlux, you’ll need to supply a pre-configured instance of
`MultipartHttpMessageReader` to `ServerCodecConfigurer`.

<a id="webflux-codecs-streaming"></a>

### Streaming

[See equivalent in the Servlet stack](../webmvc/mvc-ann-async.md#mvc-ann-async-http-streaming)

When streaming to the HTTP response (for example, `text/event-stream`,
`application/x-ndjson`), it is important to send data periodically, in order to
reliably detect a disconnected client sooner rather than later. Such a send could be a
comment-only, empty SSE event or any other "no-op" data that would effectively serve as
a heartbeat.

<a id="webflux-codecs-buffers"></a>

### `DataBuffer`

`DataBuffer` is the representation for a byte buffer in WebFlux. The Spring Core part of
this reference has more on that in the section on
[Data Buffers and Codecs](../../core/databuffer-codec.md). The key point to understand is that on some
servers like Netty, byte buffers are pooled and reference counted, and must be released
when consumed to avoid memory leaks.

WebFlux applications generally do not need to be concerned with such issues, unless they
consume or produce data buffers directly, as opposed to relying on codecs to convert to
and from higher level objects, or unless they choose to create custom codecs. For such
cases please review the information in [Data Buffers and Codecs](../../core/databuffer-codec.md),
especially the section on [Using DataBuffer](../../core/databuffer-codec.md#databuffers-using).

<a id="webflux-logging"></a>

## Logging

[See equivalent in the Servlet stack](../webmvc/mvc-servlet/logging.md)

`DEBUG` level logging in Spring WebFlux is designed to be compact, minimal, and
human-friendly. It focuses on high value bits of information that are useful over and
over again vs others that are useful only when debugging a specific issue.

`TRACE` level logging generally follows the same principles as `DEBUG` (and for example also
should not be a firehose) but can be used for debugging any issue. In addition, some log
messages may show a different level of detail at `TRACE` vs `DEBUG`.

Good logging comes from the experience of using the logs. If you spot anything that does
not meet the stated goals, please let us know.

<a id="webflux-logging-id"></a>

### Log Id

In WebFlux, a single request can be run over multiple threads and the thread ID
is not useful for correlating log messages that belong to a specific request. This is why
WebFlux log messages are prefixed with a request-specific ID by default.

On the server side, the log ID is stored in the `ServerWebExchange` attribute
([`LOG_ID_ATTRIBUTE`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/web/server/ServerWebExchange.html#LOG_ID_ATTRIBUTE)),
while a fully formatted prefix based on that ID is available from
`ServerWebExchange#getLogPrefix()`. On the `WebClient` side, the log ID is stored in the
`ClientRequest` attribute
([`LOG_ID_ATTRIBUTE`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/web/reactive/function/client/ClientRequest.html#LOG_ID_ATTRIBUTE))
,while a fully formatted prefix is available from `ClientRequest#logPrefix()`.

<a id="webflux-logging-sensitive-data"></a>

### Sensitive Data

[See equivalent in the Servlet stack](../webmvc/mvc-servlet/logging.md#mvc-logging-sensitive-data)

`DEBUG` and `TRACE` logging can log sensitive information. This is why form parameters and
headers are masked by default and you must explicitly enable their logging in full.

The following example shows how to do so for server-side requests:

#### Java

```java
@Configuration
@EnableWebFlux
class MyConfig implements WebFluxConfigurer {

	@Override
	public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
		configurer.defaultCodecs().enableLoggingRequestDetails(true);
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebFlux
class MyConfig : WebFluxConfigurer {

	override fun configureHttpMessageCodecs(configurer: ServerCodecConfigurer) {
		configurer.defaultCodecs().enableLoggingRequestDetails(true)
	}
}
```

The following example shows how to do so for client-side requests:

#### Java

```java
Consumer<ClientCodecConfigurer> consumer = configurer ->
		configurer.defaultCodecs().enableLoggingRequestDetails(true);

WebClient webClient = WebClient.builder()
		.exchangeStrategies(strategies -> strategies.codecs(consumer))
		.build();
```

#### Kotlin

```kotlin
val consumer: (ClientCodecConfigurer) -> Unit  = { configurer -> configurer.defaultCodecs().enableLoggingRequestDetails(true) }

val webClient = WebClient.builder()
		.exchangeStrategies({ strategies -> strategies.codecs(consumer) })
		.build()
```

<a id="webflux-logging-appenders"></a>

### Appenders

Logging libraries such as SLF4J and Log4J 2 provide asynchronous loggers that avoid
blocking. While those have their own drawbacks such as potentially dropping messages
that could not be queued for logging, they are the best available options currently
for use in a reactive, non-blocking application.

<a id="webflux-codecs-custom"></a>

### Custom codecs

Applications can register custom codecs for supporting additional media types,
or specific behaviors that are not supported by the default codecs.

Some configuration options expressed by developers are enforced on default codecs.
Custom codecs might want to get a chance to align with those preferences,
like [enforcing buffering limits](#webflux-codecs-limits)
or [logging sensitive data](#webflux-logging-sensitive-data).

The following example shows how to do so for client-side requests:

#### Java

```java
WebClient webClient = WebClient.builder()
		.codecs(configurer -> {
			CustomDecoder decoder = new CustomDecoder();
			configurer.customCodecs().registerWithDefaultConfig(decoder);
		})
		.build();
```

#### Kotlin

```kotlin
val webClient = WebClient.builder()
		.codecs({ configurer ->
			val decoder = CustomDecoder()
			configurer.customCodecs().registerWithDefaultConfig(decoder)
		 })
		.build()
```
