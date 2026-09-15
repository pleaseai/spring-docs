---
title: "REST Clients"
source: "ROOT:web/webmvc-client.adoc"
---

<a id="webmvc-client"></a>

# REST Clients

This section describes options for client-side access to REST endpoints.

<a id="webmvc-restclient"></a>

## `RestClient`

`RestClient` is a synchronous HTTP client that exposes a modern, fluent API.

See [`RestClient`](../integration/rest-clients.md#rest-restclient) for more details.

<a id="webmvc-webclient"></a>

## `WebClient`

`WebClient` is a reactive client for making HTTP requests with a fluent API.

See [`WebClient`](webflux-webclient.md) for more details.

<a id="webmvc-resttemplate"></a>

## `RestTemplate`

`RestTemplate` is a synchronous client for making HTTP requests. It is the original
Spring REST client and exposes a simple, template-method API over underlying HTTP client
libraries.

See [`RestTemplate`](../integration/rest-clients.md#rest-resttemplate) for details.

<a id="webmvc-http-interface"></a>

## HTTP Interface

The Spring Framework lets you define an HTTP service as a Java interface with HTTP
exchange methods. You can then generate a proxy that implements this interface and
performs the exchanges. This helps to simplify HTTP remote access and provides additional
flexibility for choosing an API style such as synchronous or reactive.

See [HTTP Interface](../integration/rest-clients.md#rest-http-interface) for details.
