---
title: "Request Body"
source: "ROOT:web/webflux-webclient/client-body.adoc"
---

<a id="webflux-client-body"></a>

# Request Body

The request body can be encoded from any asynchronous type handled by `ReactiveAdapterRegistry`,
like `Mono` or Kotlin Coroutines `Deferred` as the following example shows:

#### Java

```java
Mono<Person> personMono = ... ;

Mono<Void> result = client.post()
		.uri("/persons/{id}", id)
		.contentType(MediaType.APPLICATION_JSON)
		.body(personMono, Person.class)
		.retrieve()
		.bodyToMono(Void.class);
```

#### Kotlin

```kotlin
val personDeferred: Deferred<Person> = ...

client.post()
		.uri("/persons/{id}", id)
		.contentType(MediaType.APPLICATION_JSON)
		.body<Person>(personDeferred)
		.retrieve()
		.awaitBody<Unit>()
```

You can also have a stream of objects be encoded, as the following example shows:

#### Java

```java
Flux<Person> personFlux = ... ;

Mono<Void> result = client.post()
		.uri("/persons/{id}", id)
		.contentType(MediaType.APPLICATION_STREAM_JSON)
		.body(personFlux, Person.class)
		.retrieve()
		.bodyToMono(Void.class);
```

#### Kotlin

```kotlin
val people: Flow<Person> = ...

client.post()
		.uri("/persons/{id}", id)
		.contentType(MediaType.APPLICATION_JSON)
		.body(people)
		.retrieve()
		.awaitBody<Unit>()
```

Alternatively, if you have the actual value, you can use the `bodyValue` shortcut method,
as the following example shows:

#### Java

```java
Person person = ... ;

Mono<Void> result = client.post()
		.uri("/persons/{id}", id)
		.contentType(MediaType.APPLICATION_JSON)
		.bodyValue(person)
		.retrieve()
		.bodyToMono(Void.class);
```

#### Kotlin

```kotlin
val person: Person = ...

client.post()
		.uri("/persons/{id}", id)
		.contentType(MediaType.APPLICATION_JSON)
		.bodyValue(person)
		.retrieve()
		.awaitBody<Unit>()
```

<a id="webflux-client-body-form"></a>

## Form Data

To send form data, you can provide a `MultiValueMap<String, String>` as the body. Note that the
content is automatically set to `application/x-www-form-urlencoded` by the
`FormHttpMessageWriter`. The following example shows how to use `MultiValueMap<String, String>`:

#### Java

```java
MultiValueMap<String, String> formData = ... ;

Mono<Void> result = client.post()
		.uri("/path", id)
		.bodyValue(formData)
		.retrieve()
		.bodyToMono(Void.class);
```

#### Kotlin

```kotlin
val formData: MultiValueMap<String, String> = ...

client.post()
		.uri("/path", id)
		.bodyValue(formData)
		.retrieve()
		.awaitBody<Unit>()
```

You can also supply form data in-line by using `BodyInserters`, as the following example shows:

#### Java

```java
import static org.springframework.web.reactive.function.BodyInserters.*;

Mono<Void> result = client.post()
		.uri("/path", id)
		.body(fromFormData("k1", "v1").with("k2", "v2"))
		.retrieve()
		.bodyToMono(Void.class);
```

#### Kotlin

```kotlin
import org.springframework.web.reactive.function.BodyInserters.*

client.post()
		.uri("/path", id)
		.body(fromFormData("k1", "v1").with("k2", "v2"))
		.retrieve()
		.awaitBody<Unit>()
```

<a id="webflux-client-body-multipart"></a>

## Multipart Data

To send multipart data, you need to provide a `MultiValueMap<String, ?>` whose values are
either `Object` instances that represent part content or `HttpEntity` instances that represent the content and
headers for a part. `MultipartBodyBuilder` provides a convenient API to prepare a
multipart request. The following example shows how to create a `MultiValueMap<String, ?>`:

#### Java

```java
MultipartBodyBuilder builder = new MultipartBodyBuilder();
builder.part("fieldPart", "fieldValue");
builder.part("filePart1", new FileSystemResource("...logo.png"));
builder.part("jsonPart", new Person("Jason"));
builder.part("myPart", part); // Part from a server request

MultiValueMap<String, HttpEntity<?>> parts = builder.build();
```

#### Kotlin

```kotlin
val builder = MultipartBodyBuilder().apply {
	part("fieldPart", "fieldValue")
	part("filePart1", FileSystemResource("...logo.png"))
	part("jsonPart", Person("Jason"))
	part("myPart", part) // Part from a server request
}

val parts = builder.build()
```

In most cases, you do not have to specify the `Content-Type` for each part. The content
type is determined automatically based on the `HttpMessageWriter` chosen to serialize it
or, in the case of a `Resource`, based on the file extension. If necessary, you can
explicitly provide the `MediaType` to use for each part through one of the overloaded
builder `part` methods.

Once a `MultiValueMap` is prepared, the easiest way to pass it to the `WebClient` is
through the `body` method, as the following example shows:

#### Java

```java
MultipartBodyBuilder builder = ...;

Mono<Void> result = client.post()
		.uri("/path", id)
		.body(builder.build())
		.retrieve()
		.bodyToMono(Void.class);
```

#### Kotlin

```kotlin
val builder: MultipartBodyBuilder = ...

client.post()
		.uri("/path", id)
		.body(builder.build())
		.retrieve()
		.awaitBody<Unit>()
```

If the `MultiValueMap` contains at least one non-`String` value, which could also
represent regular form data (that is, `application/x-www-form-urlencoded`), you need not
set the `Content-Type` to `multipart/form-data`. This is always the case when using
`MultipartBodyBuilder`, which ensures an `HttpEntity` wrapper.

As an alternative to `MultipartBodyBuilder`, you can also provide multipart content,
inline-style, through the built-in `BodyInserters`, as the following example shows:

#### Java

```java
import static org.springframework.web.reactive.function.BodyInserters.*;

Mono<Void> result = client.post()
		.uri("/path", id)
		.body(fromMultipartData("fieldPart", "value").with("filePart", resource))
		.retrieve()
		.bodyToMono(Void.class);
```

#### Kotlin

```kotlin
import org.springframework.web.reactive.function.BodyInserters.*

client.post()
		.uri("/path", id)
		.body(fromMultipartData("fieldPart", "value").with("filePart", resource))
		.retrieve()
		.awaitBody<Unit>()
```

<a id="partevent"></a>

### `PartEvent`

To stream multipart data sequentially, you can provide multipart content through `PartEvent`
objects.

- Form fields can be created via `FormPartEvent::create`.
- File uploads can be created via `FilePartEvent::create`.

You can concatenate the streams returned from methods via `Flux::concat`, and create a request for
the `WebClient`.

For instance, this sample will POST a multipart form containing a form field and a file.

#### Java

```java
Resource resource = ...
Mono<String> result = webClient
	.post()
	.uri("https://example.com")
	.body(Flux.concat(
			FormPartEvent.create("field", "field value"),
			FilePartEvent.create("file", resource)
	), PartEvent.class)
	.retrieve()
	.bodyToMono(String.class);
```

#### Kotlin

```kotlin
var resource: Resource = ...
var result: Mono<String> = webClient
	.post()
	.uri("https://example.com")
	.body(
		Flux.concat(
			FormPartEvent.create("field", "field value"),
			FilePartEvent.create("file", resource)
		)
	)
	.retrieve()
	.bodyToMono()
```

On the server side, `PartEvent` objects that are received via `@RequestBody` or
`ServerRequest::bodyToFlux(PartEvent.class)` can be relayed to another service
via the `WebClient`.
