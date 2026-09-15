---
title: "Configuration"
source: "ROOT:web/webflux-webclient/client-builder.adoc"
---

<a id="webflux-client-builder"></a>

# Configuration

The simplest way to create a `WebClient` is through one of the static factory methods:

- `WebClient.create()`
- `WebClient.create(String baseUrl)`

You can also use `WebClient.builder()` with further options:

- `uriBuilderFactory`: Customized `UriBuilderFactory` to use as a base URL.
- `defaultUriVariables`: default values to use when expanding URI templates.
- `defaultHeader`: Headers for every request.
- `defaultCookie`: Cookies for every request.
- `defaultRequest`: `Consumer` to customize every request.
- `filter`: Client filter for every request.
- `exchangeStrategies`: HTTP message reader/writer customizations.
- `clientConnector`: HTTP client library settings.
- `observationRegistry`: the registry to use for enabling [Observability support](../../integration/observability.md#http-client.webclient).
- `observationConvention`: [an optional, custom convention to extract metadata](../../integration/observability.md#config) for recorded observations.

For example:

#### Java

```java
WebClient client = WebClient.builder()
		.codecs(configurer -> ... )
		.build();
```

#### Kotlin

```kotlin
val webClient = WebClient.builder()
		.codecs { configurer -> ... }
		.build()
```

Once built, a `WebClient` is immutable. However, you can clone it and build a
modified copy as follows:

#### Java

```java
WebClient client1 = WebClient.builder()
		.filter(filterA).filter(filterB).build();

WebClient client2 = client1.mutate()
		.filter(filterC).filter(filterD).build();

// client1 has filterA, filterB

// client2 has filterA, filterB, filterC, filterD
```

#### Kotlin

```kotlin
val client1 = WebClient.builder()
		.filter(filterA).filter(filterB).build()

val client2 = client1.mutate()
		.filter(filterC).filter(filterD).build()

// client1 has filterA, filterB

// client2 has filterA, filterB, filterC, filterD
```

<a id="webflux-client-builder-maxinmemorysize"></a>

## MaxInMemorySize

Codecs have [limits](../webflux/reactive-spring.md#webflux-codecs-limits) for buffering data in
memory to avoid application memory issues. By default those are set to 256KB.
If that’s not enough you’ll get the following error:

```
org.springframework.core.io.buffer.DataBufferLimitException: Exceeded limit on max bytes to buffer
```

To change the limit for default codecs, use the following:

#### Java

```java
WebClient webClient = WebClient.builder()
		.codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
		.build();
```

#### Kotlin

```kotlin
val webClient = WebClient.builder()
		.codecs { configurer -> configurer.defaultCodecs().maxInMemorySize(2 * 1024 * 1024) }
		.build()
```

<a id="webflux-client-builder-reactor"></a>

## Reactor Netty

To customize Reactor Netty settings, provide a pre-configured `HttpClient`:

#### Java

```java
HttpClient httpClient = HttpClient.create().secure(sslSpec -> ...);

WebClient webClient = WebClient.builder()
		.clientConnector(new ReactorClientHttpConnector(httpClient))
		.build();
```

#### Kotlin

```kotlin
val httpClient = HttpClient.create().secure { ... }

val webClient = WebClient.builder()
	.clientConnector(ReactorClientHttpConnector(httpClient))
	.build()
```

<a id="webflux-client-builder-reactor-resources"></a>

### Resources

By default, `HttpClient` participates in the global Reactor Netty resources held in
`reactor.netty.http.HttpResources`, including event loop threads and a connection pool.
This is the recommended mode, since fixed, shared resources are preferred for event loop
concurrency. In this mode global resources remain active until the process exits.

If the server is timed with the process, there is typically no need for an explicit
shutdown. However, if the server can start or stop in-process (for example, a Spring MVC
application deployed as a WAR), you can declare a Spring-managed bean of type
`ReactorResourceFactory` with `globalResources=true` (the default) to ensure that the Reactor
Netty global resources are shut down when the Spring `ApplicationContext` is closed,
as the following example shows:

#### Java

```java
@Bean
public ReactorResourceFactory reactorResourceFactory() {
	return new ReactorResourceFactory();
}
```

#### Kotlin

```kotlin
@Bean
fun reactorResourceFactory() = ReactorResourceFactory()
```

You can also choose not to participate in the global Reactor Netty resources. However,
in this mode, the burden is on you to ensure that all Reactor Netty client and server
instances use shared resources, as the following example shows:

#### Java

```java
@Bean
public ReactorResourceFactory resourceFactory() {
	ReactorResourceFactory factory = new ReactorResourceFactory();
	factory.setUseGlobalResources(false); // <1>
	return factory;
}

@Bean
public WebClient webClient() {

	Function<HttpClient, HttpClient> mapper = client -> {
		// Further customizations...
	};

	ClientHttpConnector connector =
			new ReactorClientHttpConnector(resourceFactory(), mapper); // <2>

	return WebClient.builder().clientConnector(connector).build(); // <3>
}
```

1. Create resources independent of global ones.
1. Use the `ReactorClientHttpConnector` constructor with resource factory.
1. Plug the connector into the `WebClient.Builder`.

#### Kotlin

```kotlin
@Bean
fun resourceFactory() = ReactorResourceFactory().apply {
	isUseGlobalResources = false // <1>
}

@Bean
fun webClient(): WebClient {

	val mapper: (HttpClient) -> HttpClient = {
		// Further customizations...
	}

	val connector = ReactorClientHttpConnector(resourceFactory(), mapper) // <2>

	return WebClient.builder().clientConnector(connector).build() // <3>
}
```

1. Create resources independent of global ones.
1. Use the `ReactorClientHttpConnector` constructor with resource factory.
1. Plug the connector into the `WebClient.Builder`.

<a id="webflux-client-builder-reactor-timeout"></a>

### Timeouts

To configure a connection timeout:

#### Java

```java
import io.netty.channel.ChannelOption;

HttpClient httpClient = HttpClient.create()
		.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000);

WebClient webClient = WebClient.builder()
		.clientConnector(new ReactorClientHttpConnector(httpClient))
		.build();
```

#### Kotlin

```kotlin
import io.netty.channel.ChannelOption

val httpClient = HttpClient.create()
		.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000);

val webClient = WebClient.builder()
		.clientConnector(ReactorClientHttpConnector(httpClient))
		.build();
```

To configure a read or write timeout:

#### Java

```java
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;

HttpClient httpClient = HttpClient.create()
		.doOnConnected(conn -> conn
				.addHandlerLast(new ReadTimeoutHandler(10))
				.addHandlerLast(new WriteTimeoutHandler(10)));

// Create WebClient...

```

#### Kotlin

```kotlin
import io.netty.handler.timeout.ReadTimeoutHandler
import io.netty.handler.timeout.WriteTimeoutHandler

val httpClient = HttpClient.create()
		.doOnConnected { conn -> conn
				.addHandlerLast(ReadTimeoutHandler(10))
				.addHandlerLast(WriteTimeoutHandler(10))
		}

// Create WebClient...
```

To configure a response timeout for all requests:

#### Java

```java
HttpClient httpClient = HttpClient.create()
		.responseTimeout(Duration.ofSeconds(2));

// Create WebClient...
```

#### Kotlin

```kotlin
val httpClient = HttpClient.create()
		.responseTimeout(Duration.ofSeconds(2));

// Create WebClient...
```

To configure a response timeout for a specific request:

#### Java

```java
WebClient.create().get()
		.uri("https://example.org/path")
		.httpRequest(httpRequest -> {
			HttpClientRequest reactorRequest = httpRequest.getNativeRequest();
			reactorRequest.responseTimeout(Duration.ofSeconds(2));
		})
		.retrieve()
		.bodyToMono(String.class);
```

#### Kotlin

```kotlin
WebClient.create().get()
		.uri("https://example.org/path")
		.httpRequest { httpRequest: ClientHttpRequest ->
			val reactorRequest = httpRequest.getNativeRequest<HttpClientRequest>()
			reactorRequest.responseTimeout(Duration.ofSeconds(2))
		}
		.retrieve()
		.bodyToMono(String::class.java)
```

<a id="webflux-client-builder-jdk-httpclient"></a>

## JDK HttpClient

The following example shows how to customize the JDK `HttpClient`:

#### Java

```java
HttpClient httpClient = HttpClient.newBuilder()
    .followRedirects(Redirect.NORMAL)
    .connectTimeout(Duration.ofSeconds(20))
    .build();

ClientHttpConnector connector =
        new JdkClientHttpConnector(httpClient, new DefaultDataBufferFactory());

WebClient webClient = WebClient.builder().clientConnector(connector).build();
```

#### Kotlin

```kotlin
val httpClient = HttpClient.newBuilder()
    .followRedirects(Redirect.NORMAL)
    .connectTimeout(Duration.ofSeconds(20))
    .build()

val connector = JdkClientHttpConnector(httpClient, DefaultDataBufferFactory())

val webClient = WebClient.builder().clientConnector(connector).build()
```

<a id="webflux-client-builder-jetty"></a>

## Jetty

The following example shows how to customize Jetty `HttpClient` settings:

#### Java

```java
HttpClient httpClient = new HttpClient();
httpClient.setCookieStore(...);

WebClient webClient = WebClient.builder()
		.clientConnector(new JettyClientHttpConnector(httpClient))
		.build();
```

#### Kotlin

```kotlin
val httpClient = HttpClient()
httpClient.cookieStore = ...

val webClient = WebClient.builder()
		.clientConnector(JettyClientHttpConnector(httpClient))
		.build();
```

By default, `HttpClient` creates its own resources (`Executor`, `ByteBufferPool`, `Scheduler`),
which remain active until the process exits or `stop()` is called.

You can share resources between multiple instances of the Jetty client (and server) and
ensure that the resources are shut down when the Spring `ApplicationContext` is closed by
declaring a Spring-managed bean of type `JettyResourceFactory`, as the following example
shows:

#### Java

```java
@Bean
public JettyResourceFactory resourceFactory() {
	return new JettyResourceFactory();
}

@Bean
public WebClient webClient() {

	HttpClient httpClient = new HttpClient();
	// Further customizations...

	ClientHttpConnector connector =
			new JettyClientHttpConnector(httpClient, resourceFactory()); <1>

	return WebClient.builder().clientConnector(connector).build(); <2>
}
```

1. Use the `JettyClientHttpConnector` constructor with resource factory.
1. Plug the connector into the `WebClient.Builder`.

#### Kotlin

```kotlin
@Bean
fun resourceFactory() = JettyResourceFactory()

@Bean
fun webClient(): WebClient {

	val httpClient = HttpClient()
	// Further customizations...

	val connector = JettyClientHttpConnector(httpClient, resourceFactory()) // <1>

	return WebClient.builder().clientConnector(connector).build() // <2>
}
```

1. Use the `JettyClientHttpConnector` constructor with resource factory.
1. Plug the connector into the `WebClient.Builder`.

<a id="webflux-client-builder-http-components"></a>

## HttpComponents

The following example shows how to customize Apache HttpComponents `HttpClient` settings:

#### Java

```java
HttpAsyncClientBuilder clientBuilder = HttpAsyncClients.custom();
clientBuilder.setDefaultRequestConfig(...);
CloseableHttpAsyncClient client = clientBuilder.build();

ClientHttpConnector connector = new HttpComponentsClientHttpConnector(client);

WebClient webClient = WebClient.builder().clientConnector(connector).build();
```

#### Kotlin

```kotlin
val client = HttpAsyncClients.custom().apply {
	setDefaultRequestConfig(...)
}.build()
val connector = HttpComponentsClientHttpConnector(client)
val webClient = WebClient.builder().clientConnector(connector).build()
```
