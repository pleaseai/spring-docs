---
title: "URI Links"
source: "ROOT:web/webmvc/mvc-uri-building.adoc"
---

<a id="mvc-uri-building"></a>

# URI Links

[See equivalent in the Reactive stack](../webflux/uri-building.md)

This section describes various options available in the Spring Framework to work with URI’s.

<a id="uricomponents"></a>

## UriComponents

Spring MVC and Spring WebFlux

`UriComponentsBuilder` helps to build URI’s from URI templates with variables, as the following example shows:

#### Java

```java
UriComponents uriComponents = UriComponentsBuilder
		.fromUriString("https://example.com/hotels/{hotel}") // <1>
		.queryParam("q", "{q}") // <2>
		.encode() // <3>
		.build(); // <4>

URI uri = uriComponents.expand("Westin", "123").toUri(); // <5>
```

1. Static factory method with a URI template.
1. Add or replace URI components.
1. Request to have the URI template and URI variables encoded.
1. Build a `UriComponents`.
1. Expand variables and obtain the `URI`.

#### Kotlin

```kotlin
val uriComponents = UriComponentsBuilder
		.fromUriString("https://example.com/hotels/{hotel}") // <1>
		.queryParam("q", "{q}") // <2>
		.encode() // <3>
		.build() // <4>

val uri = uriComponents.expand("Westin", "123").toUri() // <5>
```

1. Static factory method with a URI template.
1. Add or replace URI components.
1. Request to have the URI template and URI variables encoded.
1. Build a `UriComponents`.
1. Expand variables and obtain the `URI`.

The preceding example can be consolidated into one chain and shortened with `buildAndExpand`,
as the following example shows:

#### Java

```java
URI uri = UriComponentsBuilder
		.fromUriString("https://example.com/hotels/{hotel}")
		.queryParam("q", "{q}")
		.encode()
		.buildAndExpand("Westin", "123")
		.toUri();
```

#### Kotlin

```kotlin
val uri = UriComponentsBuilder
		.fromUriString("https://example.com/hotels/{hotel}")
		.queryParam("q", "{q}")
		.encode()
		.buildAndExpand("Westin", "123")
		.toUri()
```

You can shorten it further by going directly to a URI (which implies encoding),
as the following example shows:

#### Java

```java
URI uri = UriComponentsBuilder
		.fromUriString("https://example.com/hotels/{hotel}")
		.queryParam("q", "{q}")
		.build("Westin", "123");
```

#### Kotlin

```kotlin
val uri = UriComponentsBuilder
		.fromUriString("https://example.com/hotels/{hotel}")
		.queryParam("q", "{q}")
		.build("Westin", "123")
```

You can shorten it further still with a full URI template, as the following example shows:

#### Java

```java
URI uri = UriComponentsBuilder
		.fromUriString("https://example.com/hotels/{hotel}?q={q}")
		.build("Westin", "123");
```

#### Kotlin

```kotlin
val uri = UriComponentsBuilder
		.fromUriString("https://example.com/hotels/{hotel}?q={q}")
		.build("Westin", "123")
```

<a id="uribuilder"></a>

## UriBuilder

Spring MVC and Spring WebFlux

[`UriComponentsBuilder`](#web-uricomponents) implements `UriBuilder`. You can create a
`UriBuilder`, in turn, with a `UriBuilderFactory`. Together, `UriBuilderFactory` and
`UriBuilder` provide a pluggable mechanism to build URIs from URI templates, based on
shared configuration, such as a base URL, encoding preferences, and other details.

You can configure `RestTemplate` and `WebClient` with a `UriBuilderFactory`
to customize the preparation of URIs. `DefaultUriBuilderFactory` is a default
implementation of `UriBuilderFactory` that uses `UriComponentsBuilder` internally and
exposes shared configuration options.

The following example shows how to configure a `RestTemplate`:

#### Java

```java
// import org.springframework.web.util.DefaultUriBuilderFactory.EncodingMode;

String baseUrl = "https://example.org";
DefaultUriBuilderFactory factory = new DefaultUriBuilderFactory(baseUrl);
factory.setEncodingMode(EncodingMode.TEMPLATE_AND_VALUES);

RestTemplate restTemplate = new RestTemplate();
restTemplate.setUriTemplateHandler(factory);
```

#### Kotlin

```kotlin
// import org.springframework.web.util.DefaultUriBuilderFactory.EncodingMode

val baseUrl = "https://example.org"
val factory = DefaultUriBuilderFactory(baseUrl)
factory.encodingMode = EncodingMode.TEMPLATE_AND_VALUES

val restTemplate = RestTemplate()
restTemplate.uriTemplateHandler = factory
```

The following example configures a `WebClient`:

#### Java

```java
// import org.springframework.web.util.DefaultUriBuilderFactory.EncodingMode;

String baseUrl = "https://example.org";
DefaultUriBuilderFactory factory = new DefaultUriBuilderFactory(baseUrl);
factory.setEncodingMode(EncodingMode.TEMPLATE_AND_VALUES);

WebClient client = WebClient.builder().uriBuilderFactory(factory).build();
```

#### Kotlin

```kotlin
// import org.springframework.web.util.DefaultUriBuilderFactory.EncodingMode

val baseUrl = "https://example.org"
val factory = DefaultUriBuilderFactory(baseUrl)
factory.encodingMode = EncodingMode.TEMPLATE_AND_VALUES

val client = WebClient.builder().uriBuilderFactory(factory).build()
```

In addition, you can also use `DefaultUriBuilderFactory` directly. It is similar to using
`UriComponentsBuilder` but, instead of static factory methods, it is an actual instance
that holds configuration and preferences, as the following example shows:

#### Java

```java
String baseUrl = "https://example.com";
DefaultUriBuilderFactory uriBuilderFactory = new DefaultUriBuilderFactory(baseUrl);

URI uri = uriBuilderFactory.uriString("/hotels/{hotel}")
		.queryParam("q", "{q}")
		.build("Westin", "123");
```

#### Kotlin

```kotlin
val baseUrl = "https://example.com"
val uriBuilderFactory = DefaultUriBuilderFactory(baseUrl)

val uri = uriBuilderFactory.uriString("/hotels/{hotel}")
		.queryParam("q", "{q}")
		.build("Westin", "123")
```

<a id="uri-parsing"></a>

## URI Parsing

Spring MVC and Spring WebFlux

`UriComponentsBuilder` supports two URI parser types:

1. RFC parser — this parser type expects URI strings to conform to RFC 3986 syntax,
and treats deviations from the syntax as illegal.
1. WhatWG parser — this parser is based on the
[URL parsing algorithm](https://github.com/web-platform-tests/wpt/tree/master/url) in the
[WhatWG URL Living standard](https://url.spec.whatwg.org). It provides lenient handling of
a wide range of cases of unexpected input. Browsers implement this in order to handle
leniently user typed URL’s. For more details, see the URL Living Standard and URL parsing
[test cases](https://github.com/web-platform-tests/wpt/tree/master/url).

By default, `RestClient`, `WebClient`, and `RestTemplate` use the RFC parser type, and
expect applications to provide with URL templates that conform to RFC syntax. To change
that you can customize the `UriBuilderFactory` on any of the clients.

Applications and frameworks may further rely on `UriComponentsBuilder` for their own needs
to parse user provided URL’s in order to inspect and possibly validated URI components
such as the scheme, host, port, path, and query. Such components can decide to use the
WhatWG parser type in order to handle URL’s more leniently, and to align with the way
browsers parse URI’s, in case of a redirect to the input URL or if it is included in a
response to a browser.

<a id="uri-encoding"></a>

## URI Encoding

Spring MVC and Spring WebFlux

`UriComponentsBuilder` exposes encoding options at two levels:

- [UriComponentsBuilder#encode()](https://docs.spring.io/spring-framework/docs/7.0.1/javadoc-api/org/springframework/web/util/UriComponentsBuilder.html#encode--):
Pre-encodes the URI template first and then strictly encodes URI variables when expanded.
- [UriComponents#encode()](https://docs.spring.io/spring-framework/docs/7.0.1/javadoc-api/org/springframework/web/util/UriComponents.html#encode--):
Encodes URI components *after* URI variables are expanded.

Both options replace non-ASCII and illegal characters with escaped octets. However, the first option
also replaces characters with reserved meaning that appear in URI variables.

> [!TIP]
> Consider ";", which is legal in a path but has reserved meaning. The first option replaces
> ";" with "%3B" in URI variables but not in the URI template. By contrast, the second option never
> replaces ";", since it is a legal character in a path.

For most cases, the first option is likely to give the expected result, because it treats URI
variables as opaque data to be fully encoded, while the second option is useful if URI
variables do intentionally contain reserved characters. The second option is also useful
when not expanding URI variables at all since that will also encode anything that
incidentally looks like a URI variable.

The following example uses the first option:

#### Java

```java
URI uri = UriComponentsBuilder.fromPath("/hotel list/{city}")
		.queryParam("q", "{q}")
		.encode()
		.buildAndExpand("New York", "foo+bar")
		.toUri();

// Result is "/hotel%20list/New%20York?q=foo%2Bbar"
```

#### Kotlin

```kotlin
val uri = UriComponentsBuilder.fromPath("/hotel list/{city}")
		.queryParam("q", "{q}")
		.encode()
		.buildAndExpand("New York", "foo+bar")
		.toUri()

// Result is "/hotel%20list/New%20York?q=foo%2Bbar"
```

You can shorten the preceding example by going directly to the URI (which implies encoding),
as the following example shows:

#### Java

```java
URI uri = UriComponentsBuilder.fromPath("/hotel list/{city}")
		.queryParam("q", "{q}")
		.build("New York", "foo+bar");
```

#### Kotlin

```kotlin
val uri = UriComponentsBuilder.fromPath("/hotel list/{city}")
		.queryParam("q", "{q}")
		.build("New York", "foo+bar")
```

You can shorten it further still with a full URI template, as the following example shows:

#### Java

```java
URI uri = UriComponentsBuilder.fromUriString("/hotel list/{city}?q={q}")
		.build("New York", "foo+bar");
```

#### Kotlin

```kotlin
val uri = UriComponentsBuilder.fromUriString("/hotel list/{city}?q={q}")
		.build("New York", "foo+bar")
```

The `WebClient` and the `RestTemplate` expand and encode URI templates internally through
the `UriBuilderFactory` strategy. Both can be configured with a custom strategy,
as the following example shows:

#### Java

```java
String baseUrl = "https://example.com";
DefaultUriBuilderFactory factory = new DefaultUriBuilderFactory(baseUrl)
factory.setEncodingMode(EncodingMode.TEMPLATE_AND_VALUES);

// Customize the RestTemplate..
RestTemplate restTemplate = new RestTemplate();
restTemplate.setUriTemplateHandler(factory);

// Customize the WebClient..
WebClient client = WebClient.builder().uriBuilderFactory(factory).build();
```

#### Kotlin

```kotlin
val baseUrl = "https://example.com"
val factory = DefaultUriBuilderFactory(baseUrl).apply {
	encodingMode = EncodingMode.TEMPLATE_AND_VALUES
}

// Customize the RestTemplate..
val restTemplate = RestTemplate().apply {
	uriTemplateHandler = factory
}

// Customize the WebClient..
val client = WebClient.builder().uriBuilderFactory(factory).build()
```

The `DefaultUriBuilderFactory` implementation uses `UriComponentsBuilder` internally to
expand and encode URI templates. As a factory, it provides a single place to configure
the approach to encoding, based on one of the below encoding modes:

- `TEMPLATE_AND_VALUES`: Uses `UriComponentsBuilder#encode()`, corresponding to
the first option in the earlier list, to pre-encode the URI template and strictly encode URI variables when
expanded.
- `VALUES_ONLY`: Does not encode the URI template and, instead, applies strict encoding
to URI variables through `UriUtils#encodeUriVariables` prior to expanding them into the
template.
- `URI_COMPONENT`: Uses `UriComponents#encode()`, corresponding to the second option in the earlier list, to
encode URI component value *after* URI variables are expanded.
- `NONE`: No encoding is applied.

The `RestTemplate` is set to `EncodingMode.URI_COMPONENT` for historical
reasons and for backwards compatibility. The `WebClient` relies on the default value
in `DefaultUriBuilderFactory`, which was changed from `EncodingMode.URI_COMPONENT` in
5.0.x to `EncodingMode.TEMPLATE_AND_VALUES` in 5.1.

<a id="mvc-servleturicomponentsbuilder"></a>

## Relative Servlet Requests

You can use `ServletUriComponentsBuilder` to create URIs relative to the current request,
as the following example shows:

#### Java

```java
HttpServletRequest request = ...

// Re-uses scheme, host, port, path, and query string...

URI uri = ServletUriComponentsBuilder.fromRequest(request)
		.replaceQueryParam("accountId", "{id}")
		.build("123");
```

#### Kotlin

```kotlin
val request: HttpServletRequest = ...

// Re-uses scheme, host, port, path, and query string...

val uri = ServletUriComponentsBuilder.fromRequest(request)
		.replaceQueryParam("accountId", "{id}")
		.build("123")
```

You can create URIs relative to the context path, as the following example shows:

#### Java

```java
HttpServletRequest request = ...

// Re-uses scheme, host, port, and context path...

URI uri = ServletUriComponentsBuilder.fromContextPath(request)
		.path("/accounts")
		.build()
		.toUri();
```

#### Kotlin

```kotlin
val request: HttpServletRequest = ...

// Re-uses scheme, host, port, and context path...

val uri = ServletUriComponentsBuilder.fromContextPath(request)
		.path("/accounts")
		.build()
		.toUri()
```

You can create URIs relative to a Servlet (for example, `/main/*`),
as the following example shows:

#### Java

```java
HttpServletRequest request = ...

// Re-uses scheme, host, port, context path, and Servlet mapping prefix...

URI uri = ServletUriComponentsBuilder.fromServletMapping(request)
		.path("/accounts")
		.build()
		.toUri();
```

#### Kotlin

```kotlin
val request: HttpServletRequest = ...

// Re-uses scheme, host, port, context path, and Servlet mapping prefix...

val uri = ServletUriComponentsBuilder.fromServletMapping(request)
		.path("/accounts")
		.build()
		.toUri()
```

> [!NOTE]
> As of 5.1, `ServletUriComponentsBuilder` ignores information from the `Forwarded` and
> `X-Forwarded-*` headers, which specify the client-originated address. Consider using the
> [`ForwardedHeaderFilter`](filters.md#filters-forwarded-headers) to extract and use or to discard
> such headers.

<a id="mvc-links-to-controllers"></a>

## Links to Controllers

Spring MVC provides a mechanism to prepare links to controller methods. For example,
the following MVC controller allows for link creation:

#### Java

```java
@Controller
@RequestMapping("/hotels/{hotel}")
public class BookingController {

	@GetMapping("/bookings/{booking}")
	public ModelAndView getBooking(@PathVariable Long booking) {
		// ...
	}
}
```

#### Kotlin

```kotlin
@Controller
@RequestMapping("/hotels/{hotel}")
class BookingController {

	@GetMapping("/bookings/{booking}")
	fun getBooking(@PathVariable booking: Long): ModelAndView {
		// ...
	}
}
```

You can prepare a link by referring to the method by name, as the following example shows:

#### Java

```java
UriComponents uriComponents = MvcUriComponentsBuilder
	.fromMethodName(BookingController.class, "getBooking", 21).buildAndExpand(42);

URI uri = uriComponents.encode().toUri();
```

#### Kotlin

```kotlin
val uriComponents = MvcUriComponentsBuilder
	.fromMethodName(BookingController::class.java, "getBooking", 21).buildAndExpand(42)

val uri = uriComponents.encode().toUri()
```

In the preceding example, we provide actual method argument values (in this case, the long value: `21`)
to be used as a path variable and inserted into the URL. Furthermore, we provide the
value, `42`, to fill in any remaining URI variables, such as the `hotel` variable inherited
from the type-level request mapping. If the method had more arguments, we could supply null for
arguments not needed for the URL. In general, only `@PathVariable` and `@RequestParam` arguments
are relevant for constructing the URL.

There are additional ways to use `MvcUriComponentsBuilder`. For example, you can use a technique
akin to mock testing through proxies to avoid referring to the controller method by name, as the following example shows
(the example assumes static import of `MvcUriComponentsBuilder.on`):

#### Java

```java
UriComponents uriComponents = MvcUriComponentsBuilder
	.fromMethodCall(on(BookingController.class).getBooking(21)).buildAndExpand(42);

URI uri = uriComponents.encode().toUri();
```

#### Kotlin

```kotlin
val uriComponents = MvcUriComponentsBuilder
	.fromMethodCall(on(BookingController::class.java).getBooking(21)).buildAndExpand(42)

val uri = uriComponents.encode().toUri()
```

> [!NOTE]
> Controller method signatures are limited in their design when they are supposed to be usable for
> link creation with `fromMethodCall`. Aside from needing a proper parameter signature,
> there is a technical limitation on the return type (namely, generating a runtime proxy
> for link builder invocations), so the return type must not be `final`. In particular,
> the common `String` return type for view names does not work here. You should use `ModelAndView`
> or even plain `Object` (with a `String` return value) instead.

The earlier examples use static methods in `MvcUriComponentsBuilder`. Internally, they rely
on `ServletUriComponentsBuilder` to prepare a base URL from the scheme, host, port,
context path, and servlet path of the current request. This works well in most cases.
However, sometimes, it can be insufficient. For example, you may be outside the context of
a request (such as a batch process that prepares links) or perhaps you need to insert a path
prefix (such as a locale prefix that was removed from the request path and needs to be
re-inserted into links).

For such cases, you can use the static `fromXxx` overloaded methods that accept a
`UriComponentsBuilder` to use a base URL. Alternatively, you can create an instance of `MvcUriComponentsBuilder`
with a base URL and then use the instance-based `withXxx` methods. For example, the
following listing uses `withMethodCall`:

#### Java

```java
UriComponentsBuilder base = ServletUriComponentsBuilder.fromCurrentContextPath().path("/en");
MvcUriComponentsBuilder builder = MvcUriComponentsBuilder.relativeTo(base);
builder.withMethodCall(on(BookingController.class).getBooking(21)).buildAndExpand(42);

URI uri = uriComponents.encode().toUri();
```

#### Kotlin

```kotlin
val base = ServletUriComponentsBuilder.fromCurrentContextPath().path("/en")
val builder = MvcUriComponentsBuilder.relativeTo(base)
builder.withMethodCall(on(BookingController::class.java).getBooking(21)).buildAndExpand(42)

val uri = uriComponents.encode().toUri()
```

> [!NOTE]
> As of 5.1, `MvcUriComponentsBuilder` ignores information from the `Forwarded` and
> `X-Forwarded-*` headers, which specify the client-originated address. Consider using the
> [ForwardedHeaderFilter](filters.md#filters-forwarded-headers) to extract and use or to discard
> such headers.

<a id="mvc-links-to-controllers-from-views"></a>

## Links in Views

In views such as Thymeleaf, FreeMarker, or JSP, you can build links to annotated controllers
by referring to the implicitly or explicitly assigned name for each request mapping.

Consider the following example:

#### Java

```java
@RequestMapping("/people/{id}/addresses")
public class PersonAddressController {

	@RequestMapping("/{country}")
	public HttpEntity<PersonAddress> getAddress(@PathVariable String country) { ... }
}
```

#### Kotlin

```kotlin
@RequestMapping("/people/{id}/addresses")
class PersonAddressController {

	@RequestMapping("/{country}")
	fun getAddress(@PathVariable country: String): HttpEntity<PersonAddress> { ... }
}
```

Given the preceding controller, you can prepare a link from a JSP, as follows:

```jsp
<%@ taglib uri="http://www.springframework.org/tags" prefix="s" %>
...
<a href="${s:mvcUrl('PAC#getAddress').arg(0,'US').buildAndExpand('123')}">Get Address</a>
```

The preceding example relies on the `mvcUrl` function declared in the Spring tag library
(that is, META-INF/spring.tld), but it is easy to define your own function or prepare a
similar one for other templating technologies.

Here is how this works. On startup, every `@RequestMapping` is assigned a default name
through `HandlerMethodMappingNamingStrategy`, whose default implementation uses the
capital letters of the class and the method name (for example, the `getThing` method in
`ThingController` becomes "TC#getThing"). If there is a name clash, you can use
`@RequestMapping(name="..")` to assign an explicit name or implement your own
`HandlerMethodMappingNamingStrategy`.
