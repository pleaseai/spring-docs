---
title: "Testing"
source: "ROOT:web/webflux-webclient/client-testing.adoc"
---

<a id="webflux-client-testing"></a>

# Testing

To test code that uses the `WebClient`, you can use a mock web server, such as the
[OkHttp MockWebServer](https://github.com/square/okhttp#mockwebserver). To see an example
of its use, check out
[`WebClientIntegrationTests`](https://github.com/spring-projects/spring-framework/tree/main/spring-webflux/src/test/java/org/springframework/web/reactive/function/client/WebClientIntegrationTests.java)
in the Spring Framework test suite or the
[`static-server`](https://github.com/square/okhttp/tree/master/samples/static-server)
sample in the OkHttp repository.
