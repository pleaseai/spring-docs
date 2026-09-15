---
title: "`@RequestBody`"
source: "ROOT:web/webflux/controller/ann-methods/requestbody.adoc"
---

<a id="webflux-ann-requestbody"></a>

# `@RequestBody`

[See equivalent in the Servlet stack](../../../webmvc/mvc-controller/ann-methods/requestbody.md)

You can use the `@RequestBody` annotation to have the request body read and deserialized into an
`Object` through an [HttpMessageReader](../../reactive-spring.md#webflux-codecs).
The following example uses a `@RequestBody` argument:

#### Java

```java
@PostMapping("/accounts")
public void handle(@RequestBody Account account) {
	// ...
}
```

#### Kotlin

```kotlin
@PostMapping("/accounts")
fun handle(@RequestBody account: Account) {
	// ...
}
```

Unlike Spring MVC, in WebFlux, the `@RequestBody` method argument supports reactive types
and fully non-blocking reading and (client-to-server) streaming.

#### Java

```java
@PostMapping("/accounts")
public void handle(@RequestBody Mono<Account> account) {
	// ...
}
```

#### Kotlin

```kotlin
@PostMapping("/accounts")
fun handle(@RequestBody accounts: Flow<Account>) {
	// ...
}
```

You can use the [HTTP message codecs](../../config.md#webflux-config-message-codecs) option of the [WebFlux Config](../../dispatcher-handler.md#webflux-framework-config) to
configure or customize message readers.

You can use `@RequestBody` in combination with `jakarta.validation.Valid` or Spring’s
`@Validated` annotation, which causes Standard Bean Validation to be applied. Validation
errors cause a `WebExchangeBindException`, which results in a 400 (BAD\_REQUEST) response.
The exception contains a `BindingResult` with error details and can be handled in the
controller method by declaring the argument with an async wrapper and then using error
related operators:

#### Java

```java
@PostMapping("/accounts")
public void handle(@Valid @RequestBody Mono<Account> account) {
	// use one of the onError* operators...
}
```

#### Kotlin

```kotlin
@PostMapping("/accounts")
fun handle(@Valid @RequestBody account: Mono<Account>) {
	// ...
}
```

You can also declare an `Errors` parameter for access to validation errors, but in
that case the request body must not be a `Mono`, and will be resolved first:

#### Java

```java
@PostMapping("/accounts")
public void handle(@Valid @RequestBody Account account, Errors errors) {
	// use one of the onError* operators...
}
```

#### Kotlin

```kotlin
@PostMapping("/accounts")
fun handle(@Valid @RequestBody account: Mono<Account>) {
	// ...
}
```

If method validation applies because other parameters have `@Constraint` annotations,
then `HandlerMethodValidationException` is raised instead. For more details, see the
section on [Validation](../ann-validation.md).
