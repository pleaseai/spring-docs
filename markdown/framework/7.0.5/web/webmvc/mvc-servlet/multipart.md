---
title: "Multipart Resolver"
source: "ROOT:web/webmvc/mvc-servlet/multipart.adoc"
---

<a id="mvc-multipart"></a>

# Multipart Resolver

[See equivalent in the Reactive stack](../../webflux/reactive-spring.md#webflux-multipart)

`MultipartResolver` from the `org.springframework.web.multipart` package is a strategy
for parsing multipart requests including file uploads. There is a container-based
`StandardServletMultipartResolver` implementation for Servlet multipart request parsing.

To enable multipart handling, you need to declare a `MultipartResolver` bean in your
`DispatcherServlet` Spring configuration with a name of `multipartResolver`.
The `DispatcherServlet` detects it and applies it to the incoming request. When a POST
with a content type of `multipart/form-data` is received, the resolver parses the
content wraps the current `HttpServletRequest` as a `MultipartHttpServletRequest` to
provide access to resolved files in addition to exposing parts as request parameters.

<a id="mvc-multipart-resolver-standard"></a>

## Servlet Multipart Parsing

Servlet multipart parsing needs to be enabled through Servlet container configuration.
To do so:

- In Java, set a `MultipartConfigElement` on the Servlet registration.
- In `web.xml`, add a `"<multipart-config>"` section to the servlet declaration.

The following example shows how to set a `MultipartConfigElement` on the Servlet registration:

#### Java

```java
public class AppInitializer extends AbstractAnnotationConfigDispatcherServletInitializer {
	@Override
	protected String[] getServletMappings() {
		...
	}

	@Override
	protected Class<?> @Nullable [] getRootConfigClasses() {
		...
	}

	@Override
	protected Class<?> @Nullable [] getServletConfigClasses() {
		...
	}
	@Override
	protected void customizeRegistration(ServletRegistration.Dynamic registration) {

		// Optionally also set maxFileSize, maxRequestSize, fileSizeThreshold
		registration.setMultipartConfig(new MultipartConfigElement("/tmp"));
	}
}
```

#### Kotlin

```kotlin
class AppInitializer : AbstractAnnotationConfigDispatcherServletInitializer() {
	override fun getServletMappings(): Array<out String> {
		...
	}

	override fun getRootConfigClasses(): Array<out Class<*>>? {
		...
	}

	override fun getServletConfigClasses(): Array<out Class<*>>? {
		...
	}
	override fun customizeRegistration(registration: ServletRegistration.Dynamic) {

		// Optionally also set maxFileSize, maxRequestSize, fileSizeThreshold
		registration.setMultipartConfig(MultipartConfigElement("/tmp"))
	}

}
```

Once the Servlet multipart configuration is in place, you can add a bean of type
`StandardServletMultipartResolver` with a name of `multipartResolver`.

> [!NOTE]
> This resolver variant uses your Servlet container’s multipart parser as-is,
> potentially exposing the application to container implementation differences.
> By default, it will try to parse any `multipart/` content type with any HTTP
> method but this may not be supported across all Servlet containers. See the
> [`StandardServletMultipartResolver`](https://docs.spring.io/spring-framework/docs/7.0.5/javadoc-api/org/springframework/web/multipart/support/StandardServletMultipartResolver.html)
> javadoc for details and configuration options.
