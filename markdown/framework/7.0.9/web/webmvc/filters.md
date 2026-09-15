---
title: "Filters"
source: "ROOT:web/webmvc/filters.adoc"
---

<a id="filters"></a>

# Filters

[See equivalent in the Reactive stack](../webflux/reactive-spring.md#webflux-filters)

In the Servlet API, you can add a `jakarta.servlet.Filter` to apply interception-style logic
before and after the rest of the processing chain of filters and the target `Servlet`.

The `spring-web` module has a number of built-in `Filter` implementations:

- [Form Data](#filters-http-put)
- [Forwarded Headers](#filters-forwarded-headers)
- [Shallow ETag](#filters-shallow-etag)
- [CORS](#filters-cors)
- [URL Handler](#filters.url-handler)

There are also base class implementations for use in Spring applications:

- `GenericFilterBean` — base class for a `Filter` configured as a Spring bean;
integrates with the Spring `ApplicationContext` lifecycle.
- `OncePerRequestFilter` — extension of `GenericFilterBean` that supports a single
invocation at the start of a request, i.e. during the `REQUEST` dispatch phase, and
ignoring further handling via `FORWARD` dispatches. The filter also provides control
over whether the `Filter` gets involved in `ASYNC` and `ERROR` dispatches.

Servlet filters can be configured in `web.xml` or via Servlet annotations.
In a Spring Boot application, you can
[declare Filter’s as beans](https://docs.spring.io/spring-boot/how-to/webserver.html#howto.webserver.add-servlet-filter-listener.spring-bean)
and Boot will have them configured.

<a id="filters-http-put"></a>

## Form Data

Browsers can submit form data only through HTTP GET or HTTP POST but non-browser clients can also
use HTTP PUT, PATCH, and DELETE. The Servlet API requires `ServletRequest.getParameter*()`
methods to support form field access only for HTTP POST.

The `spring-web` module provides `FormContentFilter` to intercept HTTP PUT, PATCH, and DELETE
requests with a content type of `application/x-www-form-urlencoded`, read the form data from
the body of the request, and wrap the `ServletRequest` to make the form data
available through the `ServletRequest.getParameter*()` family of methods.

<a id="filters-forwarded-headers"></a>

## Forwarded Headers

[See equivalent in the Reactive stack](../webflux/reactive-spring.md#webflux-forwarded-headers)

As a request goes through a chain of proxies, request details such as the scheme, host,
port, remote address, and local address change. Proxies can insert headers that keep track of
the hops, and that can help to restore the request from the original client’s perspective.
This allows an application to create self-reference links for external clients.

There are two alternatives for headers that proxies can use:

- [RFC 7239](https://datatracker.ietf.org/doc/html/rfc7239) defines the `"Forwarded"` HTTP header, a single header with
individual attributes for each component in the chain of proxied requests with the
following syntax.
- `"X-Forwarded-"` prefixed headers are the original approach that predates the standard
and uses a separate header for each request component.

The Spring Framework supports both approaches. Most proxies today support the original
`"X-Forwarded"` headers only as a de facto standard.

> [!WARNING]
> For maximum security, a proxy at the edge of trust must be configured to reset both
> the standard `"Forwarded"` and `"X-Forwarded-"` headers regardless of which ones are chosen
> for use. Likewise, when configuring forwarded header handling in Spring, you need to indicate
> which type of headers to use. More on security considerations later in this section.

<a id="forwarded-headers-non-standard"></a>

### X-Forwarded Headers

This section describes supported `"X-Forwarded"` headers.

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

<a id="x-forwarded-for"></a>

#### X-Forwarded-For

[`X-Forwarded-For: <address>`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Forwarded-For)
is a de-facto standard header that is used to communicate the original `InetSocketAddress` of the client to a
downstream server. For example, if a request is sent by a client at `[fd00:fefe:1::4]` to a proxy at
`192.168.0.1`, the "remote address" information contained in the HTTP request will reflect the actual address of the
client, not the proxy.

<a id="filters-forwarded-headers-non-forwardedheaderfilter"></a>

### ForwardedHeaderFilter

`ForwardedHeaderFilter` is a Servlet filter that modifies the request to match information
from the standard `"Forwarded"` or `"X-Forwarded"` headers, and also removes those headers
to eliminate further impact. The filter wraps the request and must be ordered ahead
of other filters such as `RequestContextFilter` in order for all downstream
handlers to see the modified request.

<a id="filters-forwarded-headers-security"></a>

### Security Considerations

Forwarded headers are intended to be set by trusted proxies and never allowed in from the
outside. A proxy at the edge of trust must remove forwarded headers including both the
standard `"Forwarded"` and `"X-Forwarded"` headers, regardless of which one they use,
to protect applications which may check both.

When creating `ForwardedHeaderFilter` you can specify whether to use the
standard `"Forwarded"` or `"X-Forwarded"` headers. A separate property on the filter
lets you turn use of `"X-Forwarded-Prefix"` on and off.

`ForwardedHeaderFilter` can be configured in `removeOnly` mode, in which case it removes
forwarded headers from the request without using them.

<a id="filters-forwarded-headers-dispatcher"></a>

### Dispatcher Types

In order to support [asynchronous requests](mvc-ann-async.md) and error dispatches this
filter should be mapped with `DispatcherType.ASYNC` and also `DispatcherType.ERROR`.
If using Spring Framework’s `AbstractAnnotationConfigDispatcherServletInitializer`
(see [Servlet Config](mvc-servlet/container-config.md)) all filters are automatically registered for all dispatch
types. However if registering the filter via `web.xml` or in Spring Boot via a
`FilterRegistrationBean` be sure to include `DispatcherType.ASYNC` and
`DispatcherType.ERROR` in addition to `DispatcherType.REQUEST`.

<a id="filters-shallow-etag"></a>

## Shallow ETag

The `ShallowEtagHeaderFilter` filter creates a “shallow” ETag by caching the content
written to the response and computing an MD5 hash from it. The next time a client sends,
it does the same, but it also compares the computed value against the `If-None-Match`
request header and, if the two are equal, returns a 304 (NOT\_MODIFIED).

This strategy saves network bandwidth but not CPU, as the full response must be computed for each request.
State-changing HTTP methods and other HTTP conditional request headers such as `If-Match` and
`If-Unmodified-Since` are outside the scope of this filter. Other strategies at the controller level
can avoid the computation and have a broader support for HTTP conditional requests.
See [HTTP Caching](mvc-caching.md).

This filter has a `writeWeakETag` parameter that configures the filter to write weak ETags
similar to the following: `W/"02a2d595e6ed9a0b24f027f2b63b134d6"` (as defined in
[RFC 7232 Section 2.3](https://datatracker.ietf.org/doc/html/rfc7232#section-2.3)).

In order to support [asynchronous requests](mvc-ann-async.md) this filter must be mapped
with `DispatcherType.ASYNC` so that the filter can delay and successfully generate an
ETag to the end of the last async dispatch. If using Spring Framework’s
`AbstractAnnotationConfigDispatcherServletInitializer` (see [Servlet Config](mvc-servlet/container-config.md))
all filters are automatically registered for all dispatch types. However if registering
the filter via `web.xml` or in Spring Boot via a `FilterRegistrationBean` be sure to include
`DispatcherType.ASYNC`.

<a id="filters-cors"></a>

## CORS

[See equivalent in the Reactive stack](../webflux/reactive-spring.md#webflux-filters-cors)

Spring MVC provides fine-grained support for CORS configuration through annotations on
controllers. However, when used with Spring Security, we advise relying on the built-in
`CorsFilter` that must be ordered ahead of Spring Security’s chain of filters.

See the sections on [CORS](../webmvc-cors.md) and the [CORS Filter](../webmvc-cors.md#mvc-cors-filter) for more details.

<a id="filters.url-handler"></a>

## URL Handler

[See equivalent in the Reactive stack](../webflux/reactive-spring.md#filters.url-handler)

You may want your controller endpoints to match routes with or without a trailing slash in the URL path.
For example, both "GET /home" and "GET /home/" should be handled by a controller method annotated with `@GetMapping("/home")`.

Spring provides `UrlHandlerFilter` that removes the trailing slash from URL paths to ensure a consistent view of paths with or without a trailing slash.
This is important to avoid a mismatch between URL-based authorization decisions and web framework request mappings.
The filter can remove the trailing slash in one of a couple of ways:

- respond with an HTTP redirect status that sends clients to the same path without a trailing slash.
- wrap the request to remove the trailing slash.

> [!NOTE]
> Historically Spring MVC supported trailing slash matching of URL paths.
> This capability was deprecated in 6.0 for security reasons and removed in 7.0 with
> `UrlHandlerFilter` providing a safer alternative.

Here is how you can instantiate and configure a `UrlHandlerFilter` for a blog application:

#### Java

```java
UrlHandlerFilter urlHandlerFilter = UrlHandlerFilter
		// will HTTP 308 redirect "/blog/my-blog-post/" -> "/blog/my-blog-post"
		.trailingSlashHandler("/blog/**").redirect(HttpStatus.PERMANENT_REDIRECT)
		// will wrap the request to "/admin/user/account/" and make it as "/admin/user/account"
		.trailingSlashHandler("/admin/**").wrapRequest()
		.build();
```

#### Kotlin

```kotlin
val urlHandlerFilter = UrlHandlerFilter
		// will HTTP 308 redirect "/blog/my-blog-post/" -> "/blog/my-blog-post"
		.trailingSlashHandler("/blog/**").redirect(HttpStatus.PERMANENT_REDIRECT)
		// will wrap the request to "/admin/user/account/" and make it as "/admin/user/account"
		.trailingSlashHandler("/admin/**").wrapRequest()
		.build()
```

Keep in mind the following:

- the root path `"/"` is excluded from trailing slash handling.
- `@RequestMapping("/")` adds a trailing slash to a type-level mapping, and therefore will
not map when trailing slash handling applies; use `@RequestMapping` (no path attribute) instead.
