---
title: "Streaming Responses"
source: "ROOT:testing/spring-mvc-test-framework/vs-streaming-response.adoc"
---

<a id="spring-mvc-test-vs-streaming-response"></a>

# Streaming Responses

The best way to test streaming responses such as Server-Sent Events is through the
[\[WebTestClient\]](#WebTestClient) which can be used as a test client to connect to a `MockMvc` instance
to perform tests on Spring MVC controllers without a running server. For example:

#### Java

```java
WebTestClient client = MockMvcWebTestClient.bindToController(new SseController()).build();

FluxExchangeResult<Person> exchangeResult = client.get()
		.uri("/persons")
		.exchange()
		.expectStatus().isOk()
		.expectHeader().contentType("text/event-stream")
		.returnResult(Person.class);

// Use StepVerifier from Project Reactor to test the streaming response

StepVerifier.create(exchangeResult.getResponseBody())
		.expectNext(new Person("N0"), new Person("N1"), new Person("N2"))
		.expectNextCount(4)
		.consumeNextWith(person -> assertThat(person.getName()).endsWith("7"))
		.thenCancel()
		.verify();
```

`WebTestClient` can also connect to a live server and perform full end-to-end integration
tests. This is also supported in Spring Boot where you can
[test a running server](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-testing-spring-boot-applications-testing-with-running-server).
