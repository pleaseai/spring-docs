---
title: "WebFlux Config"
source: "ROOT:web/webflux/config.adoc"
---

<a id="webflux-config"></a>

# WebFlux Config

[See equivalent in the Servlet stack](../webmvc/mvc-config.md)

The WebFlux Java configuration declares the components that are required to process
requests with annotated controllers or functional endpoints, and it offers an API to
customize the configuration. That means you do not need to understand the underlying
beans created by the Java configuration. However, if you want to understand them,
you can see them in `WebFluxConfigurationSupport` or read more about what they are
in [Special Bean Types](dispatcher-handler.md#webflux-special-bean-types).

For more advanced customizations, not available in the configuration API, you can
gain full control over the configuration through the
[Advanced Configuration Mode](#webflux-config-advanced-java).

<a id="webflux-config-enable"></a>

## Enabling WebFlux Config

[See equivalent in the Servlet stack](../webmvc/mvc-config/enable.md)

You can use the `@EnableWebFlux` annotation in your Java config, as the following example shows:

#### Java

```java
@Configuration
@EnableWebFlux
public class WebConfig {
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebFlux
class WebConfig
```

> [!NOTE]
> When using Spring Boot, you may want to use `@Configuration` classes of type `WebFluxConfigurer` but without
> `@EnableWebFlux` to keep Spring Boot WebFlux customizations. See more details in
> [the WebFlux config API section](#webflux-config-customize) and in
> [the dedicated Spring Boot documentation](https://docs.spring.io/spring-boot/reference/web/reactive.html#web.reactive.webflux.auto-configuration).

The preceding example registers a number of Spring WebFlux
[infrastructure beans](dispatcher-handler.md#webflux-special-bean-types) and adapts to dependencies
available on the classpath — for JSON, XML, and others.

<a id="webflux-config-customize"></a>

## WebFlux config API

[See equivalent in the Servlet stack](../webmvc/mvc-config/customize.md)

In your Java configuration, you can implement the `WebFluxConfigurer` interface,
as the following example shows:

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {

	// Implement configuration methods...
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {

	// Implement configuration methods...
}
```

<a id="webflux-config-conversion"></a>

## Conversion, formatting

[See equivalent in the Servlet stack](../webmvc/mvc-config/conversion.md)

By default, formatters for various number and date types are installed, along with support
for customization via `@NumberFormat`, `@DurationFormat`, and `@DateTimeFormat` on fields
and parameters.

To register custom formatters and converters in Java config, use the following:

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {

	@Override
	public void addFormatters(FormatterRegistry registry) {
		// ...
	}

}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {

	override fun addFormatters(registry: FormatterRegistry) {
		// ...
	}
}
```

By default Spring WebFlux considers the request Locale when parsing and formatting date
values. This works for forms where dates are represented as Strings with "input" form
fields. For "date" and "time" form fields, however, browsers use a fixed format defined
in the HTML spec. For such cases date and time formatting can be customized as follows:

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {

	@Override
	public void addFormatters(FormatterRegistry registry) {
		DateTimeFormatterRegistrar registrar = new DateTimeFormatterRegistrar();
		registrar.setUseIsoFormat(true);
		registrar.registerFormatters(registry);
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {

	override fun addFormatters(registry: FormatterRegistry) {
		val registrar = DateTimeFormatterRegistrar()
		registrar.setUseIsoFormat(true)
		registrar.registerFormatters(registry)
	}
}
```

> [!NOTE]
> See [`FormatterRegistrar` SPI](../../core/validation/format.md#format-FormatterRegistrar-SPI)
> and the `FormattingConversionServiceFactoryBean` for more information on when to
> use `FormatterRegistrar` implementations.

<a id="webflux-config-validation"></a>

## Validation

[See equivalent in the Servlet stack](../webmvc/mvc-config/validation.md)

By default, if [Bean Validation](../../core/validation/beanvalidation.md#validation-beanvalidation-overview) is present
on the classpath (for example, the Hibernate Validator), the `LocalValidatorFactoryBean`
is registered as a global [validator](../../core/validation/validator.md) for use with `@Valid` and
`@Validated` on `@Controller` method arguments.

In your Java configuration, you can customize the global `Validator` instance,
as the following example shows:

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {

	@Override
	public Validator getValidator() {
		// ...
	}

}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {

	override fun getValidator(): Validator {
		// ...
	}

}
```

Note that you can also register `Validator` implementations locally,
as the following example shows:

#### Java

```java
@Controller
public class MyController {

	@InitBinder
	protected void initBinder(WebDataBinder binder) {
		binder.addValidators(new FooValidator());
	}

}
```

#### Kotlin

```kotlin
@Controller
class MyController {

	@InitBinder
	protected fun initBinder(binder: WebDataBinder) {
		binder.addValidators(FooValidator())
	}
}
```

> [!TIP]
> If you need to have a `LocalValidatorFactoryBean` injected somewhere, create a bean and
> mark it with `@Primary` in order to avoid conflict with the one declared in the MVC config.

<a id="webflux-config-content-negotiation"></a>

## Content Type Resolvers

[See equivalent in the Servlet stack](../webmvc/mvc-config/content-negotiation.md)

You can configure how Spring WebFlux determines the requested media types for
`@Controller` instances from the request. By default, only the `Accept` header is checked,
but you can also enable a query parameter-based strategy.

The following example shows how to customize the requested content type resolution:

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {

	@Override
	public void configureContentTypeResolver(RequestedContentTypeResolverBuilder builder) {
		// ...
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {

	override fun configureContentTypeResolver(builder: RequestedContentTypeResolverBuilder) {
		// ...
	}
}
```

<a id="webflux-config-message-codecs"></a>

## HTTP message codecs

[See equivalent in the Servlet stack](../webmvc/mvc-config/message-converters.md)

The following example shows how to customize how the request and response body are read and written:

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {

	@Override
	public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
		configurer.defaultCodecs().maxInMemorySize(512 * 1024);
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {

	override fun configureHttpMessageCodecs(configurer: ServerCodecConfigurer) {
		configurer.defaultCodecs().maxInMemorySize(512 * 1024)
	}
}
```

`ServerCodecConfigurer` provides a set of default readers and writers. You can use it to add
more readers and writers, customize the default ones, or replace the default ones completely.

For Jackson JSON and XML, consider using
[`Jackson2ObjectMapperBuilder`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/http/converter/json/Jackson2ObjectMapperBuilder.html),
which customizes Jackson’s default properties with the following ones:

- [`DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES`](https://fasterxml.github.io/jackson-databind/javadoc/2.6/com/fasterxml/jackson/databind/DeserializationFeature.html#FAIL_ON_UNKNOWN_PROPERTIES) is disabled.
- [`MapperFeature.DEFAULT_VIEW_INCLUSION`](https://fasterxml.github.io/jackson-databind/javadoc/2.6/com/fasterxml/jackson/databind/MapperFeature.html#DEFAULT_VIEW_INCLUSION) is disabled.

It also automatically registers the following well-known modules if they are detected on the classpath:

- [`jackson-datatype-jsr310`](https://github.com/FasterXML/jackson-datatype-jsr310): Support for Java 8 Date and Time API types.
- [`jackson-datatype-jdk8`](https://github.com/FasterXML/jackson-datatype-jdk8): Support for other Java 8 types, such as `Optional`.
- [`jackson-module-kotlin`](https://github.com/FasterXML/jackson-module-kotlin): Support for Kotlin classes and data classes.

<a id="webflux-config-view-resolvers"></a>

## View Resolvers

[See equivalent in the Servlet stack](../webmvc/mvc-config/view-resolvers.md)

The following example shows how to configure view resolution:

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {

	@Override
	public void configureViewResolvers(ViewResolverRegistry registry) {
		// ...
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {

	override fun configureViewResolvers(registry: ViewResolverRegistry) {
		// ...
	}
}
```

The `ViewResolverRegistry` has shortcuts for view technologies with which the Spring Framework
integrates. The following example uses FreeMarker (which also requires configuring the
underlying FreeMarker view technology):

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {
	@Override
	public void configureViewResolvers(ViewResolverRegistry registry) {
		registry.freeMarker();
	}

	// Configure Freemarker...

	@Bean
	public FreeMarkerConfigurer freeMarkerConfigurer() {
		FreeMarkerConfigurer configurer = new FreeMarkerConfigurer();
		configurer.setTemplateLoaderPath("classpath:/templates");
		return configurer;
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {

	override fun configureViewResolvers(registry: ViewResolverRegistry) {
		registry.freeMarker()
	}

	// Configure Freemarker...

	@Bean
	fun freeMarkerConfigurer() = FreeMarkerConfigurer().apply {
		setTemplateLoaderPath("classpath:/templates")
	}
}
```

You can also plug in any `ViewResolver` implementation, as the following example shows:

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {
	@Override
	public void configureViewResolvers(ViewResolverRegistry registry) {
		ViewResolver resolver = ... ;
		registry.viewResolver(resolver);
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {

	override fun configureViewResolvers(registry: ViewResolverRegistry) {
		val resolver: ViewResolver = ...
		registry.viewResolver(resolver
	}
}
```

To support [Content Negotiation](dispatcher-handler.md#webflux-multiple-representations) and rendering other formats
through view resolution (besides HTML), you can configure one or more default views based
on the `HttpMessageWriterView` implementation, which accepts any of the available
[Codecs](reactive-spring.md#webflux-codecs) from `spring-web`. The following example shows how to do so:

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {
	@Override
	public void configureViewResolvers(ViewResolverRegistry registry) {
		registry.freeMarker();

		Jackson2JsonEncoder encoder = new Jackson2JsonEncoder();
		registry.defaultViews(new HttpMessageWriterView(encoder));
	}

	// ...
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {
	override fun configureViewResolvers(registry: ViewResolverRegistry) {
		registry.freeMarker()

		val encoder = Jackson2JsonEncoder()
		registry.defaultViews(HttpMessageWriterView(encoder))
	}

	// ...
}
```

See [View Technologies](../webflux-view.md) for more on the view technologies that are integrated with Spring WebFlux.

<a id="webflux-config-static-resources"></a>

## Static Resources

[See equivalent in the Servlet stack](../webmvc/mvc-config/static-resources.md)

This option provides a convenient way to serve static resources from a list of
[`Resource`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/core/io/Resource.html)-based locations.

In the next example, given a request that starts with `/resources`, the relative path is
used to find and serve static resources relative to `/static` on the classpath. Resources
are served with a one-year future expiration to ensure maximum use of the browser cache
and a reduction in HTTP requests made by the browser. The `Last-Modified` header is also
evaluated and, if present, a `304` status code is returned. The following listing shows
the example:

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.addResourceHandler("/resources/**")
				.addResourceLocations("/public", "classpath:/static/")
				.setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS));
	}

}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {

	override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
		registry.addResourceHandler("/resources/**")
				.addResourceLocations("/public", "classpath:/static/")
				.setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS))
	}
}
```

See also [HTTP caching support for static resources](caching.md#webflux-caching-static-resources).

The resource handler also supports a chain of
[`ResourceResolver`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/web/reactive/resource/ResourceResolver.html) implementations and
[`ResourceTransformer`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/web/reactive/resource/ResourceTransformer.html) implementations,
which can be used to create a toolchain for working with optimized resources.

You can use the `VersionResourceResolver` for versioned resource URLs based on an MD5 hash
computed from the content, a fixed application version, or other information. A
`ContentVersionStrategy` (MD5 hash) is a good choice with some notable exceptions (such as
JavaScript resources used with a module loader).

The following example shows how to use `VersionResourceResolver` in your Java configuration:

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.addResourceHandler("/resources/**")
				.addResourceLocations("/public/")
				.resourceChain(true)
				.addResolver(new VersionResourceResolver().addContentVersionStrategy("/**"));
	}

}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {

	override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
		registry.addResourceHandler("/resources/**")
				.addResourceLocations("/public/")
				.resourceChain(true)
				.addResolver(VersionResourceResolver().addContentVersionStrategy("/**"))
	}

}
```

You can use `ResourceUrlProvider` to rewrite URLs and apply the full chain of resolvers and
transformers (for example, to insert versions). The WebFlux configuration provides a `ResourceUrlProvider`
so that it can be injected into others.

Unlike Spring MVC, at present, in WebFlux, there is no way to transparently rewrite static
resource URLs, since there are no view technologies that can make use of a non-blocking chain
of resolvers and transformers. When serving only local resources, the workaround is to use
`ResourceUrlProvider` directly (for example, through a custom element) and block.

Note that, when using both `EncodedResourceResolver` (for example, Gzip, Brotli encoded) and
`VersionedResourceResolver`, they must be registered in that order, to ensure content-based
versions are always computed reliably based on the unencoded file.

For [WebJars](https://www.webjars.org/documentation), versioned URLs like
`/webjars/jquery/1.2.0/jquery.min.js` are the recommended and most efficient way to use them.
The related resource location is configured out of the box with Spring Boot (or can be configured
manually via `ResourceHandlerRegistry`) and does not require to add the
`org.webjars:webjars-locator-core` dependency.

Version-less URLs like `/webjars/jquery/jquery.min.js` are supported through the
`WebJarsResourceResolver` which is automatically registered when the
`org.webjars:webjars-locator-core` library is present on the classpath, at the cost of a
classpath scanning that could slow down application startup. The resolver can re-write URLs to
include the version of the jar and can also match against incoming URLs without versions — for example, from `/webjars/jquery/jquery.min.js` to `/webjars/jquery/1.2.0/jquery.min.js`.

> [!TIP]
> The Java configuration based on `ResourceHandlerRegistry` provides further options
> for fine-grained control, for example, last-modified behavior and optimized resource resolution.

<a id="webflux-config-path-matching"></a>

## Path Matching

[See equivalent in the Servlet stack](../webmvc/mvc-config/path-matching.md)

You can customize options related to path matching. For details on the individual options, see the
[`PathMatchConfigurer`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/web/reactive/config/PathMatchConfigurer.html) javadoc.
The following example shows how to use `PathMatchConfigurer`:

#### Java

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.reactive.config.PathMatchConfigurer;
import org.springframework.web.reactive.config.WebFluxConfigurer;

@Configuration
public class WebConfig implements WebFluxConfigurer {

	@Override
	public void configurePathMatching(PathMatchConfigurer configurer) {
		configurer.addPathPrefix(
				"/api", HandlerTypePredicate.forAnnotation(RestController.class));
	}
}
```

#### Kotlin

```kotlin
import org.springframework.context.annotation.Configuration
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.method.HandlerTypePredicate
import org.springframework.web.reactive.config.PathMatchConfigurer
import org.springframework.web.reactive.config.WebFluxConfigurer

@Configuration
class WebConfig : WebFluxConfigurer {

	override fun configurePathMatching(configurer: PathMatchConfigurer) {
		configurer.addPathPrefix(
			"/api", HandlerTypePredicate.forAnnotation(RestController::class.java))
	}
}
```

> [!TIP]
> Spring WebFlux relies on a parsed representation of the request path called
> `RequestPath` for access to decoded path segment values, with semicolon content removed
> (that is, path or matrix variables). That means, unlike in Spring MVC, you need not indicate
> whether to decode the request path nor whether to remove semicolon content for
> path matching purposes.
>
> Spring WebFlux also does not support suffix pattern matching, unlike in Spring MVC, where we
> are also [recommend](../webmvc/mvc-controller/ann-requestmapping.md#mvc-ann-requestmapping-suffix-pattern-match) moving away from
> reliance on it.

<a id="webflux-config-blocking-execution"></a>

## Blocking Execution

The WebFlux Java config allows you to customize blocking execution in WebFlux.

You can have blocking controller methods called on a separate thread by providing
an `AsyncTaskExecutor` such as the
[`VirtualThreadTaskExecutor`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/core/task/VirtualThreadTaskExecutor.html)
as follows:

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {

	@Override
	public void configureBlockingExecution(BlockingExecutionConfigurer configurer) {
		AsyncTaskExecutor executor = ...
		configurer.setExecutor(executor);
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {

	@Override
	fun configureBlockingExecution(configurer: BlockingExecutionConfigurer) {
		val executor = ...
		configurer.setExecutor(executor)
	}
}
```

By default, controller methods whose return type is not recognized by the configured
`ReactiveAdapterRegistry` are considered blocking, but you can set a custom controller
method predicate via `BlockingExecutionConfigurer`.

<a id="webflux-config-websocket-service"></a>

## WebSocketService

The WebFlux Java config declares of a `WebSocketHandlerAdapter` bean which provides
support for the invocation of WebSocket handlers. That means all that remains to do in
order to handle a WebSocket handshake request is to map a `WebSocketHandler` to a URL
via `SimpleUrlHandlerMapping`.

In some cases it may be necessary to create the `WebSocketHandlerAdapter` bean with a
provided `WebSocketService` service which allows configuring WebSocket server properties.
For example:

#### Java

```java
@Configuration
public class WebConfig implements WebFluxConfigurer {

	@Override
	public WebSocketService getWebSocketService() {
		TomcatRequestUpgradeStrategy strategy = new TomcatRequestUpgradeStrategy();
		strategy.setMaxSessionIdleTimeout(0L);
		return new HandshakeWebSocketService(strategy);
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : WebFluxConfigurer {

	@Override
	fun webSocketService(): WebSocketService {
		val strategy = TomcatRequestUpgradeStrategy().apply {
			setMaxSessionIdleTimeout(0L)
		}
		return HandshakeWebSocketService(strategy)
	}
}
```

<a id="webflux-config-advanced-java"></a>

## Advanced Configuration Mode

[See equivalent in the Servlet stack](../webmvc/mvc-config/advanced-java.md)

`@EnableWebFlux` imports `DelegatingWebFluxConfiguration` that:

- Provides default Spring configuration for WebFlux applications
- detects and delegates to `WebFluxConfigurer` implementations to customize that configuration.

For advanced mode, you can remove `@EnableWebFlux` and extend directly from
`DelegatingWebFluxConfiguration` instead of implementing `WebFluxConfigurer`,
as the following example shows:

#### Java

```java
@Configuration
public class WebConfig extends DelegatingWebFluxConfiguration {

	// ...
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfig : DelegatingWebFluxConfiguration {

	// ...
}
```

You can keep existing methods in `WebConfig`, but you can now also override bean declarations
from the base class and still have any number of other `WebMvcConfigurer` implementations on
the classpath.
