---
title: "Calling REST Services"
source: "reference:io/rest-client.adoc"
---

<a id="io.rest-client"></a>

# Calling REST Services

Spring Boot provides various convenient ways to call remote REST services.
If you are developing a non-blocking reactive application and you’re using Spring WebFlux, then you can use [`WebClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html).
If you prefer blocking APIs then you can use [`RestClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.html) or [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestTemplate.html).

<a id="io.rest-client.webclient"></a>

## WebClient

If you have Spring WebFlux on your classpath we recommend that you use [`WebClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html) to call remote REST services.
The [`WebClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html) interface provides a functional style API and is fully reactive.
You can learn more about the [`WebClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html) in the dedicated [section in the Spring Framework docs](https://docs.spring.io/spring-framework/reference/6.1/web/webflux-webclient.html).

> [!TIP]
> If you are not writing a reactive Spring WebFlux application you can use the [`RestClient`](#io.rest-client.restclient) instead of a [`WebClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html).
> This provides a similar functional API, but is blocking rather than reactive.

Spring Boot creates and pre-configures a prototype [`WebClient.Builder`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.Builder.html) bean for you.
It is strongly advised to inject it in your components and use it to create [`WebClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html) instances.
Spring Boot is configuring that builder to share HTTP resources and reflect codecs setup in the same fashion as the server ones (see [WebFlux HTTP codecs auto-configuration](../web/reactive.md#web.reactive.webflux.httpcodecs)), and more.

The following code shows a typical example:

#### Java

```java
import reactor.core.publisher.Mono;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class MyService {

	private final WebClient webClient;

	public MyService(WebClient.Builder webClientBuilder) {
		this.webClient = webClientBuilder.baseUrl("https://example.org").build();
	}

	public Mono<Details> someRestCall(String name) {
		return this.webClient.get().uri("/{name}/details", name).retrieve().bodyToMono(Details.class);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

@Service
class MyService(webClientBuilder: WebClient.Builder) {

	private val webClient: WebClient

	init {
		webClient = webClientBuilder.baseUrl("https://example.org").build()
	}

	fun someRestCall(name: String?): Mono<Details> {
		return webClient.get().uri("/{name}/details", name)
				.retrieve().bodyToMono(Details::class.java)
	}

}

```

<a id="io.rest-client.webclient.runtime"></a>

### WebClient Runtime

Spring Boot will auto-detect which [`ClientHttpConnector`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/http/client/reactive/ClientHttpConnector.html) to use to drive [`WebClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html) depending on the libraries available on the application classpath.
In order of preference, the following clients are supported:

1. Reactor Netty
1. Jetty RS client
1. Apache HttpClient
1. JDK HttpClient

If multiple clients are available on the classpath, the most preferred client will be used.

The `spring-boot-starter-webflux` starter depends on `io.projectreactor.netty:reactor-netty` by default, which brings both server and client implementations.
If you choose to use Jetty as a reactive server instead, you should add a dependency on the Jetty Reactive HTTP client library, `org.eclipse.jetty:jetty-reactive-httpclient`.
Using the same technology for server and client has its advantages, as it will automatically share HTTP resources between client and server.

Developers can override the resource configuration for Jetty and Reactor Netty by providing a custom [`ReactorResourceFactory`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/http/client/ReactorResourceFactory.html) or [`JettyResourceFactory`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/http/client/reactive/JettyResourceFactory.html) bean - this will be applied to both clients and servers.

If you wish to override that choice for the client, you can define your own [`ClientHttpConnector`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/http/client/reactive/ClientHttpConnector.html) bean and have full control over the client configuration.

You can learn more about the [`WebClient` configuration options in the Spring Framework reference documentation](https://docs.spring.io/spring-framework/reference/6.1/web/webflux-webclient/client-builder.html).

<a id="io.rest-client.webclient.customization"></a>

### WebClient Customization

There are three main approaches to [`WebClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html) customization, depending on how broadly you want the customizations to apply.

To make the scope of any customizations as narrow as possible, inject the auto-configured [`WebClient.Builder`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.Builder.html) and then call its methods as required.
[`WebClient.Builder`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.Builder.html) instances are stateful: Any change on the builder is reflected in all clients subsequently created with it.
If you want to create several clients with the same builder, you can also consider cloning the builder with `WebClient.Builder other = builder.clone();`.

To make an application-wide, additive customization to all [`WebClient.Builder`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.Builder.html) instances, you can declare [`WebClientCustomizer`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/reactive/function/client/WebClientCustomizer.html) beans and change the [`WebClient.Builder`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.Builder.html) locally at the point of injection.

Finally, you can fall back to the original API and use `WebClient.create()`.
In that case, no auto-configuration or [`WebClientCustomizer`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/reactive/function/client/WebClientCustomizer.html) is applied.

<a id="io.rest-client.webclient.ssl"></a>

### WebClient SSL Support

If you need custom SSL configuration on the [`ClientHttpConnector`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/http/client/reactive/ClientHttpConnector.html) used by the [`WebClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html), you can inject a [`WebClientSsl`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/autoconfigure/web/reactive/function/client/WebClientSsl.html) instance that can be used with the builder’s `apply` method.

The [`WebClientSsl`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/autoconfigure/web/reactive/function/client/WebClientSsl.html) interface provides access to any [SSL bundles](../features/ssl.md#features.ssl.bundles) that you have defined in your `application.properties` or `application.yaml` file.

The following code shows a typical example:

#### Java

```java
import reactor.core.publisher.Mono;

import org.springframework.boot.autoconfigure.web.reactive.function.client.WebClientSsl;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class MyService {

	private final WebClient webClient;

	public MyService(WebClient.Builder webClientBuilder, WebClientSsl ssl) {
		this.webClient = webClientBuilder.baseUrl("https://example.org").apply(ssl.fromBundle("mybundle")).build();
	}

	public Mono<Details> someRestCall(String name) {
		return this.webClient.get().uri("/{name}/details", name).retrieve().bodyToMono(Details.class);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.autoconfigure.web.reactive.function.client.WebClientSsl
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

@Service
class MyService(webClientBuilder: WebClient.Builder, ssl: WebClientSsl) {

	private val webClient: WebClient

	init {
		webClient = webClientBuilder.baseUrl("https://example.org")
				.apply(ssl.fromBundle("mybundle")).build()
	}

	fun someRestCall(name: String?): Mono<Details> {
		return webClient.get().uri("/{name}/details", name)
				.retrieve().bodyToMono(Details::class.java)
	}

}

```

<a id="io.rest-client.restclient"></a>

## RestClient

If you are not using Spring WebFlux or Project Reactor in your application we recommend that you use [`RestClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.html) to call remote REST services.

The [`RestClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.html) interface provides a functional style blocking API.

Spring Boot creates and pre-configures a prototype [`RestClient.Builder`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.Builder.html) bean for you.
It is strongly advised to inject it in your components and use it to create [`RestClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.html) instances.
Spring Boot is configuring that builder with [`HttpMessageConverters`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/autoconfigure/http/HttpMessageConverters.html) and an appropriate [`ClientHttpRequestFactory`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/http/client/ClientHttpRequestFactory.html).

The following code shows a typical example:

#### Java

```java
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class MyService {

	private final RestClient restClient;

	public MyService(RestClient.Builder restClientBuilder) {
		this.restClient = restClientBuilder.baseUrl("https://example.org").build();
	}

	public Details someRestCall(String name) {
		return this.restClient.get().uri("/{name}/details", name).retrieve().body(Details.class);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.docs.io.restclient.restclient.ssl.Details
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient

@Service
class MyService(restClientBuilder: RestClient.Builder) {

	private val restClient: RestClient

	init {
		restClient = restClientBuilder.baseUrl("https://example.org").build()
	}

	fun someRestCall(name: String?): Details {
		return restClient.get().uri("/{name}/details", name)
				.retrieve().body(Details::class.java)!!
	}

}

```

<a id="io.rest-client.restclient.customization"></a>

### RestClient Customization

There are three main approaches to [`RestClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.html) customization, depending on how broadly you want the customizations to apply.

To make the scope of any customizations as narrow as possible, inject the auto-configured [`RestClient.Builder`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.Builder.html) and then call its methods as required.
[`RestClient.Builder`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.Builder.html) instances are stateful: Any change on the builder is reflected in all clients subsequently created with it.
If you want to create several clients with the same builder, you can also consider cloning the builder with `RestClient.Builder other = builder.clone();`.

To make an application-wide, additive customization to all [`RestClient.Builder`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.Builder.html) instances, you can declare [`RestClientCustomizer`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestClientCustomizer.html) beans and change the [`RestClient.Builder`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.Builder.html) locally at the point of injection.

Finally, you can fall back to the original API and use `RestClient.create()`.
In that case, no auto-configuration or [`RestClientCustomizer`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestClientCustomizer.html) is applied.

<a id="io.rest-client.restclient.ssl"></a>

### RestClient SSL Support

If you need custom SSL configuration on the [`ClientHttpRequestFactory`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/http/client/ClientHttpRequestFactory.html) used by the [`RestClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.html), you can inject a [`RestClientSsl`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/autoconfigure/web/client/RestClientSsl.html) instance that can be used with the builder’s `apply` method.

The [`RestClientSsl`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/autoconfigure/web/client/RestClientSsl.html) interface provides access to any [SSL bundles](../features/ssl.md#features.ssl.bundles) that you have defined in your `application.properties` or `application.yaml` file.

The following code shows a typical example:

#### Java

```java
import org.springframework.boot.autoconfigure.web.client.RestClientSsl;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class MyService {

	private final RestClient restClient;

	public MyService(RestClient.Builder restClientBuilder, RestClientSsl ssl) {
		this.restClient = restClientBuilder.baseUrl("https://example.org").apply(ssl.fromBundle("mybundle")).build();
	}

	public Details someRestCall(String name) {
		return this.restClient.get().uri("/{name}/details", name).retrieve().body(Details.class);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.autoconfigure.web.client.RestClientSsl
import org.springframework.boot.docs.io.restclient.restclient.ssl.settings.Details
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient

@Service
class MyService(restClientBuilder: RestClient.Builder, ssl: RestClientSsl) {

	private val restClient: RestClient

	init {
		restClient = restClientBuilder.baseUrl("https://example.org")
				.apply(ssl.fromBundle("mybundle")).build()
	}

	fun someRestCall(name: String?): Details {
		return restClient.get().uri("/{name}/details", name)
				.retrieve().body(Details::class.java)!!
	}

}
```

If you need to apply other customization in addition to an SSL bundle, you can use the [`ClientHttpRequestFactorySettings`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/ClientHttpRequestFactorySettings.html) class with [`ClientHttpRequestFactories`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/ClientHttpRequestFactories.html):

#### Java

```java
import java.time.Duration;

import org.springframework.boot.ssl.SslBundles;
import org.springframework.boot.web.client.ClientHttpRequestFactories;
import org.springframework.boot.web.client.ClientHttpRequestFactorySettings;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class MyService {

	private final RestClient restClient;

	public MyService(RestClient.Builder restClientBuilder, SslBundles sslBundles) {
		ClientHttpRequestFactorySettings settings = ClientHttpRequestFactorySettings.DEFAULTS
			.withReadTimeout(Duration.ofMinutes(2))
			.withSslBundle(sslBundles.getBundle("mybundle"));
		ClientHttpRequestFactory requestFactory = ClientHttpRequestFactories.get(settings);
		this.restClient = restClientBuilder.baseUrl("https://example.org").requestFactory(requestFactory).build();
	}

	public Details someRestCall(String name) {
		return this.restClient.get().uri("/{name}/details", name).retrieve().body(Details.class);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.ssl.SslBundles
import org.springframework.boot.web.client.ClientHttpRequestFactories
import org.springframework.boot.web.client.ClientHttpRequestFactorySettings
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import java.time.Duration

@Service
class MyService(restClientBuilder: RestClient.Builder, sslBundles: SslBundles) {

	private val restClient: RestClient

	init {
		val settings = ClientHttpRequestFactorySettings.DEFAULTS
				.withReadTimeout(Duration.ofMinutes(2))
				.withSslBundle(sslBundles.getBundle("mybundle"))
		val requestFactory = ClientHttpRequestFactories.get(settings)
		restClient = restClientBuilder
				.baseUrl("https://example.org")
				.requestFactory(requestFactory).build()
	}

	fun someRestCall(name: String?): Details {
		return restClient.get().uri("/{name}/details", name).retrieve().body(Details::class.java)!!
	}

}

```

<a id="io.rest-client.resttemplate"></a>

## RestTemplate

Spring Framework’s [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestTemplate.html) class predates [`RestClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.html) and is the classic way that many applications use to call remote REST services.
You might choose to use [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestTemplate.html) when you have existing code that you don’t want to migrate to [`RestClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.html), or because you’re already familiar with the [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestTemplate.html) API.

Since [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestTemplate.html) instances often need to be customized before being used, Spring Boot does not provide any single auto-configured [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestTemplate.html) bean.
It does, however, auto-configure a [`RestTemplateBuilder`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestTemplateBuilder.html), which can be used to create [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestTemplate.html) instances when needed.
The auto-configured [`RestTemplateBuilder`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestTemplateBuilder.html) ensures that sensible [`HttpMessageConverters`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/autoconfigure/http/HttpMessageConverters.html) and an appropriate [`ClientHttpRequestFactory`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/http/client/ClientHttpRequestFactory.html) are applied to [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestTemplate.html) instances.

The following code shows a typical example:

#### Java

```java
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class MyService {

	private final RestTemplate restTemplate;

	public MyService(RestTemplateBuilder restTemplateBuilder) {
		this.restTemplate = restTemplateBuilder.build();
	}

	public Details someRestCall(String name) {
		return this.restTemplate.getForObject("/{name}/details", Details.class, name);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.web.client.RestTemplateBuilder
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate

@Service
class MyService(restTemplateBuilder: RestTemplateBuilder) {

	private val restTemplate: RestTemplate

	init {
		restTemplate = restTemplateBuilder.build()
	}

	fun someRestCall(name: String): Details {
		return restTemplate.getForObject("/{name}/details", Details::class.java, name)!!
	}

}
```

[`RestTemplateBuilder`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestTemplateBuilder.html) includes a number of useful methods that can be used to quickly configure a [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestTemplate.html).
For example, to add BASIC authentication support, you can use `builder.basicAuthentication("user", "password").build()`.

<a id="io.rest-client.resttemplate.customization"></a>

### RestTemplate Customization

There are three main approaches to [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestTemplate.html) customization, depending on how broadly you want the customizations to apply.

To make the scope of any customizations as narrow as possible, inject the auto-configured [`RestTemplateBuilder`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestTemplateBuilder.html) and then call its methods as required.
Each method call returns a new [`RestTemplateBuilder`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestTemplateBuilder.html) instance, so the customizations only affect this use of the builder.

To make an application-wide, additive customization, use a [`RestTemplateCustomizer`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestTemplateCustomizer.html) bean.
All such beans are automatically registered with the auto-configured [`RestTemplateBuilder`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestTemplateBuilder.html) and are applied to any templates that are built with it.

The following example shows a customizer that configures the use of a proxy for all hosts except `192.168.0.5`:

#### Java

```java
import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.client5.http.impl.routing.DefaultProxyRoutePlanner;
import org.apache.hc.client5.http.routing.HttpRoutePlanner;
import org.apache.hc.core5.http.HttpException;
import org.apache.hc.core5.http.HttpHost;
import org.apache.hc.core5.http.protocol.HttpContext;

import org.springframework.boot.web.client.RestTemplateCustomizer;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

public class MyRestTemplateCustomizer implements RestTemplateCustomizer {

	@Override
	public void customize(RestTemplate restTemplate) {
		HttpRoutePlanner routePlanner = new CustomRoutePlanner(new HttpHost("proxy.example.com"));
		HttpClient httpClient = HttpClientBuilder.create().setRoutePlanner(routePlanner).build();
		restTemplate.setRequestFactory(new HttpComponentsClientHttpRequestFactory(httpClient));
	}

	static class CustomRoutePlanner extends DefaultProxyRoutePlanner {

		CustomRoutePlanner(HttpHost proxy) {
			super(proxy);
		}

		@Override
		protected HttpHost determineProxy(HttpHost target, HttpContext context) throws HttpException {
			if (target.getHostName().equals("192.168.0.5")) {
				return null;
			}
			return super.determineProxy(target, context);
		}

	}

}
```

#### Kotlin

```kotlin
import org.apache.hc.client5.http.classic.HttpClient
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder
import org.apache.hc.client5.http.impl.routing.DefaultProxyRoutePlanner
import org.apache.hc.client5.http.routing.HttpRoutePlanner
import org.apache.hc.core5.http.HttpException
import org.apache.hc.core5.http.HttpHost
import org.apache.hc.core5.http.protocol.HttpContext
import org.springframework.boot.web.client.RestTemplateCustomizer
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory
import org.springframework.web.client.RestTemplate

class MyRestTemplateCustomizer : RestTemplateCustomizer {

	override fun customize(restTemplate: RestTemplate) {
		val routePlanner: HttpRoutePlanner = CustomRoutePlanner(HttpHost("proxy.example.com"))
		val httpClient: HttpClient = HttpClientBuilder.create().setRoutePlanner(routePlanner).build()
		restTemplate.requestFactory = HttpComponentsClientHttpRequestFactory(httpClient)
	}

	internal class CustomRoutePlanner(proxy: HttpHost?) : DefaultProxyRoutePlanner(proxy) {

		@Throws(HttpException::class)
		public override fun determineProxy(target: HttpHost, context: HttpContext): HttpHost? {
			if (target.hostName == "192.168.0.5") {
				return null
			}
			return  super.determineProxy(target, context)
		}

	}

}
```

Finally, you can define your own [`RestTemplateBuilder`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestTemplateBuilder.html) bean.
Doing so will replace the auto-configured builder.
If you want any [`RestTemplateCustomizer`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestTemplateCustomizer.html) beans to be applied to your custom builder, as the auto-configuration would have done, configure it using a [`RestTemplateBuilderConfigurer`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/autoconfigure/web/client/RestTemplateBuilderConfigurer.html).
The following example exposes a [`RestTemplateBuilder`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestTemplateBuilder.html) that matches what Spring Boot’s auto-configuration would have done, except that custom connect and read timeouts are also specified:

#### Java

```java
import java.time.Duration;

import org.springframework.boot.autoconfigure.web.client.RestTemplateBuilderConfigurer;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyRestTemplateBuilderConfiguration {

	@Bean
	public RestTemplateBuilder restTemplateBuilder(RestTemplateBuilderConfigurer configurer) {
		return configurer.configure(new RestTemplateBuilder())
			.setConnectTimeout(Duration.ofSeconds(5))
			.setReadTimeout(Duration.ofSeconds(2));
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.autoconfigure.web.client.RestTemplateBuilderConfigurer
import org.springframework.boot.web.client.RestTemplateBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.time.Duration

@Configuration(proxyBeanMethods = false)
class MyRestTemplateBuilderConfiguration {

	@Bean
	fun restTemplateBuilder(configurer: RestTemplateBuilderConfigurer): RestTemplateBuilder {
		return configurer.configure(RestTemplateBuilder()).setConnectTimeout(Duration.ofSeconds(5))
			.setReadTimeout(Duration.ofSeconds(2))
	}

}
```

The most extreme (and rarely used) option is to create your own [`RestTemplateBuilder`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestTemplateBuilder.html) bean without using a configurer.
In addition to replacing the auto-configured builder, this also prevents any [`RestTemplateCustomizer`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestTemplateCustomizer.html) beans from being used.

<a id="io.rest-client.resttemplate.ssl"></a>

### RestTemplate SSL Support

If you need custom SSL configuration on the [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestTemplate.html), you can apply an [SSL bundle](../features/ssl.md#features.ssl.bundles) to the [`RestTemplateBuilder`](https://docs.spring.io/spring-boot/3.3.9/api/java/org/springframework/boot/web/client/RestTemplateBuilder.html) as shown in this example:

#### Java

```java
import org.springframework.boot.docs.io.restclient.resttemplate.Details;
import org.springframework.boot.ssl.SslBundles;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class MyService {

	private final RestTemplate restTemplate;

	public MyService(RestTemplateBuilder restTemplateBuilder, SslBundles sslBundles) {
		this.restTemplate = restTemplateBuilder.setSslBundle(sslBundles.getBundle("mybundle")).build();
	}

	public Details someRestCall(String name) {
		return this.restTemplate.getForObject("/{name}/details", Details.class, name);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.docs.io.restclient.resttemplate.Details
import org.springframework.boot.ssl.SslBundles
import org.springframework.boot.web.client.RestTemplateBuilder
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate

@Service
class MyService(restTemplateBuilder: RestTemplateBuilder, sslBundles: SslBundles) {

    private val restTemplate: RestTemplate

    init {
        restTemplate = restTemplateBuilder.setSslBundle(sslBundles.getBundle("mybundle")).build()
    }

    fun someRestCall(name: String): Details {
        return restTemplate.getForObject("/{name}/details", Details::class.java, name)!!
    }

}
```

<a id="io.rest-client.clienthttprequestfactory"></a>

## HTTP Client Detection for RestClient and RestTemplate

Spring Boot will auto-detect which HTTP client to use with [`RestClient`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestClient.html) and [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/client/RestTemplate.html) depending on the libraries available on the application classpath.
In order of preference, the following clients are supported:

1. Apache HttpClient
1. Jetty HttpClient
1. OkHttp (deprecated)
1. Simple JDK client (`HttpURLConnection`)

If multiple clients are available on the classpath, the most preferred client will be used.
