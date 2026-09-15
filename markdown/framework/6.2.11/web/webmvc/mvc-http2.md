---
title: "HTTP/2"
source: "ROOT:web/webmvc/mvc-http2.adoc"
---

<a id="mvc-http2"></a>

# HTTP/2

[See equivalent in the Reactive stack](../webflux/http2.md)

Servlet 4 containers are required to support HTTP/2, and Spring Framework 5 is compatible
with Servlet API 4. From a programming model perspective, there is nothing specific that
applications need to do. However, there are considerations related to server configuration.
For more details, see the
[HTTP/2 wiki page](https://github.com/spring-projects/spring-framework/wiki/HTTP-2-support).

The Servlet API does expose one construct related to HTTP/2. You can use the
`jakarta.servlet.http.PushBuilder` to proactively push resources to clients, and it
is supported as a [method argument](mvc-controller/ann-methods/arguments.md)
to `@RequestMapping` methods.
