---
title: "API Version"
source: "ROOT:web/webmvc/mvc-config/api-version.adoc"
---

<a id="mvc-config-api-version"></a>

# API Version

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-api-version)

To enable API versioning, use the `ApiVersionConfigurer` callback of `WebMvcConfigurer`:

#### Java

```java
@Configuration
public class WebConfiguration implements WebMvcConfigurer {

	@Override
	public void configureApiVersioning(ApiVersionConfigurer configurer) {
		configurer.useRequestHeader("API-Version");
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfiguration : WebMvcConfigurer {

	override fun configureApiVersioning(configurer: ApiVersionConfigurer) {
		configurer.useRequestHeader("API-Version")
	}
}
```

You can resolve the version through one of the built-in options listed below, or
alternatively use a custom `ApiVersionResolver`:

- Request header
- Request parameter
- Path segment
- Media type parameter

To resolve from a path segment, you need to specify the index of the path segment expected
to contain the version. The path segment must be declared as a URI variable, e.g.
"/{version}", "/api/{version}", etc. where the actual name is not important.
As the version is typically at the start of the path, consider configuring it externally
as a common path prefix for all handlers through the
[Path Matching](path-matching.md) options.

By default, the version is parsed with `SemanticVersionParser`, but you can also configure
a custom [ApiVersionParser](../../webmvc-versioning.md#mvc-versioning-parser).

Supported versions are transparently detected from versions declared in request mappings
for convenience, but you can turn that off through a flag in the MVC config, and
consider only the versions configured explicitly in the config as supported.
Requests with a version that is not supported are rejected with
`InvalidApiVersionException` resulting in a 400 response.

You can set an `ApiVersionDeprecationHandler` to send information about deprecated
versions to clients. The built-in standard handler can set "Deprecation", "Sunset", and
"Link" headers based on [RFC 9745](https://datatracker.ietf.org/doc/html/rfc9745) and
[RFC 8594](https://datatracker.ietf.org/doc/html/rfc8594).

Once API versioning is configured, you can begin to map requests to
[controller methods](../mvc-controller/ann-requestmapping.md#mvc-ann-requestmapping-version)
according to the request version.
