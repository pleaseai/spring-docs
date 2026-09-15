---
title: "Static Resources"
source: "ROOT:web/webmvc/mvc-config/static-resources.adoc"
---

<a id="mvc-config-static-resources"></a>

# Static Resources

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-static-resources)

This option provides a convenient way to serve static resources from a list of
[`Resource`](https://docs.spring.io/spring-framework/docs/6.1.12/javadoc-api/org/springframework/core/io/Resource.html)-based locations.

In the next example, given a request that starts with `/resources`, the relative path is
used to find and serve static resources relative to `/public` under the web application
root or on the classpath under `/static`. The resources are served with a one-year future
expiration to ensure maximum use of the browser cache and a reduction in HTTP requests
made by the browser. The `Last-Modified` information is deduced from `Resource#lastModified`
so that HTTP conditional requests are supported with `"Last-Modified"` headers.

The following listing shows how to do so with Java configuration:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.addResourceHandler("/resources/**")
				.addResourceLocations("/public", "classpath:/static/")
				.setCacheControl(CacheControl.maxAge(Duration.ofDays(365)));
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebMvc
class WebConfig : WebMvcConfigurer {

	override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
		registry.addResourceHandler("/resources/**")
				.addResourceLocations("/public", "classpath:/static/")
				.setCacheControl(CacheControl.maxAge(Duration.ofDays(365)))
	}
}
```

The following example shows how to achieve the same configuration in XML:

```xml
<mvc:resources mapping="/resources/**"
	location="/public, classpath:/static/"
	cache-period="31556926" />
```

See also
[HTTP caching support for static resources](../mvc-caching.md#mvc-caching-static-resources).

The resource handler also supports a chain of
[`ResourceResolver`](https://docs.spring.io/spring-framework/docs/6.1.12/javadoc-api/org/springframework/web/servlet/resource/ResourceResolver.html) implementations and
[`ResourceTransformer`](https://docs.spring.io/spring-framework/docs/6.1.12/javadoc-api/org/springframework/web/servlet/resource/ResourceTransformer.html) implementations,
which you can use to create a toolchain for working with optimized resources.

You can use the `VersionResourceResolver` for versioned resource URLs based on an MD5 hash
computed from the content, a fixed application version, or other. A
`ContentVersionStrategy` (MD5 hash) is a good choice — with some notable exceptions, such as
JavaScript resources used with a module loader.

The following example shows how to use `VersionResourceResolver` in Java configuration:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

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
@EnableWebMvc
class WebConfig : WebMvcConfigurer {

	override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
		registry.addResourceHandler("/resources/**")
				.addResourceLocations("/public/")
				.resourceChain(true)
				.addResolver(VersionResourceResolver().addContentVersionStrategy("/**"))
	}
}
```

The following example shows how to achieve the same configuration in XML:

```xml
<mvc:resources mapping="/resources/**" location="/public/">
	<mvc:resource-chain resource-cache="true">
		<mvc:resolvers>
			<mvc:version-resolver>
				<mvc:content-version-strategy patterns="/**"/>
			</mvc:version-resolver>
		</mvc:resolvers>
	</mvc:resource-chain>
</mvc:resources>
```

You can then use `ResourceUrlProvider` to rewrite URLs and apply the full chain of resolvers and
transformers — for example, to insert versions. The MVC configuration provides a `ResourceUrlProvider`
bean so that it can be injected into others. You can also make the rewrite transparent with the
`ResourceUrlEncodingFilter` for Thymeleaf, JSPs, FreeMarker, and others with URL tags that
rely on `HttpServletResponse#encodeURL`.

Note that, when using both `EncodedResourceResolver` (for example, for serving gzipped or
brotli-encoded resources) and `VersionResourceResolver`, you must register them in this order.
That ensures content-based versions are always computed reliably, based on the unencoded file.

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
> for fine-grained control, e.g. last-modified behavior and optimized resource resolution.
