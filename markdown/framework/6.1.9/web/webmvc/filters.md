---
title: "Filters"
source: "ROOT:web/webmvc/filters.adoc"
---

<a id="filters"></a>

# Filters

[See equivalent in the Reactive stack](../webflux/reactive-spring.md#webflux-filters)

The `spring-web` module provides some useful filters:

- [Form Data](#filters-http-put)
- [Forwarded Headers](#filters-forwarded-headers)
- [Shallow ETag](#filters-shallow-etag)
- [CORS](#filters-cors)

<a id="filters-http-put"></a>

## Form Data

Browsers can submit form data only through HTTP GET or HTTP POST but non-browser clients can also
use HTTP PUT, PATCH, and DELETE. The Servlet API requires `ServletRequest.getParameter*()`
methods to support form field access only for HTTP POST.

The `spring-web` module provides `FormContentFilter` to intercept HTTP PUT, PATCH, and DELETE
requests with a content type of `application/x-www-form-urlencoded`, read the form data from
the body of the request, and wrap the `ServletRequest` to make the form data
available through the `ServletRequest.getParameter*()` family of methods.

<a id="forwarded-headers"></a>

## Forwarded Headers

[See equivalent in the Reactive stack](../webflux/reactive-spring.md#webflux-forwarded-headers)

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
is a de-facto standard header that is used to communicate the original protocol (e.g. https / https)
to a downstream server. For example, if a request of `example.com/resource` is sent to
a proxy which forwards the request to `localhost:8080/resource`, then a header of
`X-Forwarded-Proto: https` can be sent to inform the server that the original protocol was `https`.

<a id="x-forwarded-ssl"></a>

#### X-Forwarded-Ssl

While not standard, `X-Forwarded-Ssl: (on|off)` is a de-facto standard header that is used to communicate the
original protocol (e.g. https / https) to a downstream server. For example, if a request of
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
> - Added security, e.g. same origin policy
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

<a id="filters-forwarded-headers-non-forwardedheaderfilter"></a>

### ForwardedHeaderFilter

`ForwardedHeaderFilter` is a Servlet filter that modifies the request in order to
a) change the host, port, and scheme based on `Forwarded` headers, and b) to remove those
headers to eliminate further impact. The filter relies on wrapping the request, and
therefore it must be ordered ahead of other filters, such as `RequestContextFilter`, that
should work with the modified and not the original request.

<a id="filters-forwarded-headers-security"></a>

### Security Considerations

There are security considerations for forwarded headers since an application cannot know
if the headers were added by a proxy, as intended, or by a malicious client. This is why
a proxy at the boundary of trust should be configured to remove untrusted `Forwarded`
headers that come from the outside. You can also configure the `ForwardedHeaderFilter`
with `removeOnly=true`, in which case it removes but does not use the headers.

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
