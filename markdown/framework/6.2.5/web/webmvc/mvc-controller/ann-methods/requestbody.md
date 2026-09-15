---
title: "`@RequestBody`"
source: "ROOT:web/webmvc/mvc-controller/ann-methods/requestbody.adoc"
---

<a id="mvc-ann-requestbody"></a>

# `@RequestBody`

[See equivalent in the Reactive stack](../../../webflux/controller/ann-methods/requestbody.md)

You can use the `@RequestBody` annotation to have the request body read and deserialized into an
`Object` through an [`HttpMessageConverter`](../../../../integration/rest-clients.md#rest-message-conversion).
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

You can use the [Message Converters](../../mvc-config/message-converters.md) option of the [MVC Config](../../mvc-config.md) to
configure or customize message conversion.

> [!NOTE]
> Form data should be read using [`@RequestParam`](requestparam.md),
> not with `@RequestBody` which can’t always be used reliably since in the Servlet API, request parameter
> access causes the request body to be parsed, and it can’t be read again.

You can use `@RequestBody` in combination with `jakarta.validation.Valid` or Spring’s
`@Validated` annotation, both of which cause Standard Bean Validation to be applied.
By default, validation errors cause a `MethodArgumentNotValidException`, which is turned
into a 400 (BAD\_REQUEST) response. Alternatively, you can handle validation errors locally
within the controller through an `Errors` or `BindingResult` argument,
as the following example shows:

#### Java

```java
@PostMapping("/accounts")
public void handle(@Valid @RequestBody Account account, Errors errors) {
	// ...
}
```

#### Kotlin

```kotlin
@PostMapping("/accounts")
fun handle(@Valid @RequestBody account: Account, errors: Errors) {
	// ...
}
```

If method validation applies because other parameters have `@Constraint` annotations,
then `HandlerMethodValidationException` is raised instead. For more details, see the
section on [Validation](../ann-validation.md).
