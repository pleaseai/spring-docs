---
title: "`retrieve()`"
source: "ROOT:web/webflux-webclient/client-retrieve.adoc"
---

<a id="webflux-client-retrieve"></a>

# `retrieve()`

The `retrieve()` method can be used to declare how to extract the response. For example:

#### Java

```java
WebClient client = WebClient.create("https://example.org");

Mono<ResponseEntity<Person>> result = client.get()
		.uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
		.retrieve()
		.toEntity(Person.class);
```

#### Kotlin

```kotlin
val client = WebClient.create("https://example.org")

val result = client.get()
		.uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
		.retrieve()
		.toEntity<Person>().awaitSingle()
```

Or to get only the body:

#### Java

```java
WebClient client = WebClient.create("https://example.org");

Mono<Person> result = client.get()
		.uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
		.retrieve()
		.bodyToMono(Person.class);
```

#### Kotlin

```kotlin
val client = WebClient.create("https://example.org")

val result = client.get()
		.uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
		.retrieve()
		.awaitBody<Person>()
```

To get a stream of decoded objects:

#### Java

```java
Flux<Quote> result = client.get()
		.uri("/quotes").accept(MediaType.TEXT_EVENT_STREAM)
		.retrieve()
		.bodyToFlux(Quote.class);
```

#### Kotlin

```kotlin
val result = client.get()
		.uri("/quotes").accept(MediaType.TEXT_EVENT_STREAM)
		.retrieve()
		.bodyToFlow<Quote>()
```

By default, 4xx or 5xx responses result in an `WebClientResponseException`, including
sub-classes for specific HTTP status codes. To customize the handling of error
responses, use `onStatus` handlers as follows:

#### Java

```java
Mono<Person> result = client.get()
		.uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
		.retrieve()
		.onStatus(HttpStatusCode::is4xxClientError, response -> ...)
		.onStatus(HttpStatusCode::is5xxServerError, response -> ...)
		.bodyToMono(Person.class);
```

#### Kotlin

```kotlin
val result = client.get()
		.uri("/persons/{id}", id).accept(MediaType.APPLICATION_JSON)
		.retrieve()
		.onStatus(HttpStatusCode::is4xxClientError) { ... }
		.onStatus(HttpStatusCode::is5xxServerError) { ... }
		.awaitBody<Person>()
```
