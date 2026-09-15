---
title: "Testing"
source: "ROOT:web/webflux-webclient/client-testing.adoc"
---

<a id="webflux-client-testing"></a>

# Testing

To test code that uses the `WebClient`, you can use a mock web server, such as
[OkHttp MockWebServer](https://github.com/square/okhttp#mockwebserver) or
[WireMock](https://wiremock.org/). Mock web servers accept requests over HTTP like a regular
server, and that means you can test with the same HTTP client that is also configured in
the same way as in production, which is important because there are often subtle
differences in the way different clients handle network I/O. Another advantage of mock
web servers is the ability to simulate specific network issues and conditions at the
transport level, in combination with the client used in production.

For example use of MockWebServer, see
[`WebClientIntegrationTests`](https://github.com/spring-projects/spring-framework/tree/7.0.x/spring-webflux/src/test/java/org/springframework/web/reactive/function/client/WebClientIntegrationTests.java)
in the Spring Framework test suite or the
[`static-server`](https://github.com/square/okhttp/tree/master/samples/static-server)
sample in the OkHttp repository.
