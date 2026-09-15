---
title: "Range Requests"
source: "ROOT:web/webmvc/mvc-range.adoc"
---

<a id="mvc-range"></a>

# Range Requests

[See equivalent in the Reactive stack](../webflux/range.md)

Spring MVC supports [RFC 9110](https://datatracker.ietf.org/doc/html/rfc9110#section-14)
range requests. For an overview, see the
[Ranger Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests)
Mozilla guide.

The `Range` header is parsed and handled transparently in Spring MVC when an annotated
controller returns a `Resource` or `ResponseEntity<Resource>`, or a functional endpoint
[serves a `Resource`](../webmvc-functional.md#webmvc-fn-resources). `Range` header
support is also transparently handled when serving
[static resources](mvc-config/static-resources.md).

> [!TIP]
> The `Resource` must not be an `InputStreamResource` and with `ResponseEntity<Resource>`,
> the status of the response must be 200.

The underlying support is in the `HttpRange` class, which exposes methods to parse
`Range` headers and split a `Resource` into a `List<ResourceRegion>` that in turn can be
then written to the response via `ResourceRegionHttpMessageConverter`.
