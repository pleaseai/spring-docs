---
title: "WebClient"
source: "ROOT:web/webflux-webclient.adoc"
---

<a id="webflux-client"></a>

# WebClient

Spring WebFlux includes a client to perform HTTP requests with. `WebClient` has a
functional, fluent API based on Reactor, see [Reactive Libraries](../web-reactive.md#webflux-reactive-libraries),
which enables declarative composition of asynchronous logic without the need to deal with
threads or concurrency. It is fully non-blocking, it supports streaming, and relies on
the same [codecs](webflux/reactive-spring.md#webflux-codecs) that are also used to encode and
decode request and response content on the server side.

`WebClient` needs an HTTP client library to perform requests with. There is built-in
support for the following:

- [Reactor Netty](https://github.com/reactor/reactor-netty)
- [JDK HttpClient](https://docs.oracle.com/en/java/javase/17/docs/api/java.net.http/java/net/http/HttpClient.html)
- [Jetty Reactive HttpClient](https://github.com/jetty-project/jetty-reactive-httpclient)
- [Apache HttpComponents](https://hc.apache.org/index.html)
- Others can be plugged via `ClientHttpConnector`.
