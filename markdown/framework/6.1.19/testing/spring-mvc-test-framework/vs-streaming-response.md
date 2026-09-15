---
title: "Streaming Responses"
source: "ROOT:testing/spring-mvc-test-framework/vs-streaming-response.adoc"
---

<a id="spring-mvc-test-vs-streaming-response"></a>

# Streaming Responses

You can use `WebTestClient` to test [streaming responses](../webtestclient.md#webtestclient-stream)
such as Server-Sent Events. However, `MockMvcWebTestClient` doesn’t support infinite
streams because there is no way to cancel the server stream from the client side.
To test infinite streams, you’ll need to
[bind to](../webtestclient.md#webtestclient-server-config) a running server,
or when using Spring Boot,
[test with a running server](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-testing-spring-boot-applications-testing-with-running-server).

`MockMvcWebTestClient` does support asynchronous responses, and even streaming responses.
The limitation is that it can’t influence the server to stop, and therefore the server
must finish writing the response on its own.
