---
title: "HTTP Caching"
source: "ROOT:web/webmvc/mvc-caching.adoc"
---

<a id="mvc-caching"></a>

# HTTP Caching

[See equivalent in the Reactive stack](../webflux/caching.md)

HTTP caching can significantly improve the performance of a web application. HTTP caching
revolves around the `Cache-Control` response header and, subsequently, conditional request
headers (such as `Last-Modified` and `ETag`). `Cache-Control` advises private (for example, browser)
and public (for example, proxy) caches on how to cache and re-use responses. An `ETag` header is used
to make a conditional request that may result in a 304 (NOT\_MODIFIED) without a body,
if the content has not changed. `ETag` can be seen as a more sophisticated successor to
the `Last-Modified` header.

This section describes the HTTP caching-related options that are available in Spring Web MVC.

<a id="mvc-caching-cachecontrol"></a>

## `CacheControl`

[See equivalent in the Reactive stack](../webflux/caching.md#webflux-caching-cachecontrol)

[`CacheControl`](https://docs.spring.io/spring-framework/docs/6.1.10/javadoc-api/org/springframework/http/CacheControl.html) provides support for
configuring settings related to the `Cache-Control` header and is accepted as an argument
in a number of places:

- [`WebContentInterceptor`](https://docs.spring.io/spring-framework/docs/6.1.10/javadoc-api/org/springframework/web/servlet/mvc/WebContentInterceptor.html)
- [`WebContentGenerator`](https://docs.spring.io/spring-framework/docs/6.1.10/javadoc-api/org/springframework/web/servlet/support/WebContentGenerator.html)
- [Controllers](#mvc-caching-etag-lastmodified)
- [Static Resources](#mvc-caching-static-resources)

While [RFC 7234](https://datatracker.ietf.org/doc/html/rfc7234#section-5.2.2) describes all possible
directives for the `Cache-Control` response header, the `CacheControl` type takes a
use case-oriented approach that focuses on the common scenarios:

#### Java

```java
// Cache for an hour - "Cache-Control: max-age=3600"
CacheControl ccCacheOneHour = CacheControl.maxAge(1, TimeUnit.HOURS);

// Prevent caching - "Cache-Control: no-store"
CacheControl ccNoStore = CacheControl.noStore();

// Cache for ten days in public and private caches,
// public caches should not transform the response
// "Cache-Control: max-age=864000, public, no-transform"
CacheControl ccCustom = CacheControl.maxAge(10, TimeUnit.DAYS).noTransform().cachePublic();
```

#### Kotlin

```kotlin
// Cache for an hour - "Cache-Control: max-age=3600"
val ccCacheOneHour = CacheControl.maxAge(1, TimeUnit.HOURS)

// Prevent caching - "Cache-Control: no-store"
val ccNoStore = CacheControl.noStore()

// Cache for ten days in public and private caches,
// public caches should not transform the response
// "Cache-Control: max-age=864000, public, no-transform"
val ccCustom = CacheControl.maxAge(10, TimeUnit.DAYS).noTransform().cachePublic()
```

`WebContentGenerator` also accepts a simpler `cachePeriod` property (defined in seconds) that
works as follows:

- A `-1` value does not generate a `Cache-Control` response header.
- A `0` value prevents caching by using the `'Cache-Control: no-store'` directive.
- An `n > 0` value caches the given response for `n` seconds by using the
`'Cache-Control: max-age=n'` directive.

<a id="mvc-caching-etag-lastmodified"></a>

## Controllers

[See equivalent in the Reactive stack](../webflux/caching.md#webflux-caching-etag-lastmodified)

Controllers can add explicit support for HTTP caching. We recommended doing so, since the
`lastModified` or `ETag` value for a resource needs to be calculated before it can be compared
against conditional request headers. A controller can add an `ETag` header and `Cache-Control`
settings to a `ResponseEntity`, as the following example shows:

#### Java

```java
@GetMapping("/book/{id}")
public ResponseEntity<Book> showBook(@PathVariable Long id) {

	Book book = findBook(id);
	String version = book.getVersion();

	return ResponseEntity
			.ok()
			.cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS))
			.eTag(version) // lastModified is also available
			.body(book);
}
```

#### Kotlin

```kotlin
@GetMapping("/book/{id}")
fun showBook(@PathVariable id: Long): ResponseEntity<Book> {

	val book = findBook(id);
	val version = book.getVersion()

	return ResponseEntity
			.ok()
			.cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS))
			.eTag(version) // lastModified is also available
			.body(book)
}
```

The preceding example sends a 304 (NOT\_MODIFIED) response with an empty body if the comparison
to the conditional request headers indicates that the content has not changed. Otherwise, the
`ETag` and `Cache-Control` headers are added to the response.

You can also make the check against conditional request headers in the controller,
as the following example shows:

#### Java

```java
@RequestMapping
public String myHandleMethod(WebRequest request, Model model) {

	long eTag = ... // <1>

	if (request.checkNotModified(eTag)) {
		return null; // <2>
	}

	model.addAttribute(...); // <3>
	return "myViewName";
}
```

1. Application-specific calculation.
1. The response has been set to 304 (NOT\_MODIFIED) — no further processing.
1. Continue with the request processing.

#### Kotlin

```kotlin
@RequestMapping
fun myHandleMethod(request: WebRequest, model: Model): String? {

	val eTag: Long = ... // <1>

	if (request.checkNotModified(eTag)) {
		return null // <2>
	}

	model[...] = ... // <3>
	return "myViewName"
}
```

1. Application-specific calculation.
1. The response has been set to 304 (NOT\_MODIFIED) — no further processing.
1. Continue with the request processing.

There are three variants for checking conditional requests against `eTag` values, `lastModified`
values, or both. For conditional `GET` and `HEAD` requests, you can set the response to
304 (NOT\_MODIFIED). For conditional `POST`, `PUT`, and `DELETE`, you can instead set the response
to 412 (PRECONDITION\_FAILED), to prevent concurrent modification.

<a id="mvc-caching-static-resources"></a>

## Static Resources

[See equivalent in the Reactive stack](../webflux/caching.md#webflux-caching-static-resources)

You should serve static resources with a `Cache-Control` and conditional response headers
for optimal performance. See the section on configuring [Static Resources](mvc-config/static-resources.md).

<a id="mvc-httpcaching-shallowetag"></a>

## `ETag` Filter

You can use the `ShallowEtagHeaderFilter` to add “shallow” `eTag` values that are computed from the
response content and, thus, save bandwidth but not CPU time. See [Shallow ETag](filters.md#filters-shallow-etag).
