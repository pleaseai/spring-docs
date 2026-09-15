---
title: "`@ResponseBody`"
source: "ROOT:web/webmvc/mvc-controller/ann-methods/responsebody.adoc"
---

<a id="mvc-ann-responsebody"></a>

# `@ResponseBody`

[See equivalent in the Reactive stack](../../../webflux/controller/ann-methods/responsebody.md)

You can use the `@ResponseBody` annotation on a method to have the return serialized
to the response body through an
[HttpMessageConverter](../../../../integration/rest-clients.md#rest-message-conversion).
The following listing shows an example:

#### Java

```java
@GetMapping("/accounts/{id}")
@ResponseBody
public Account handle() {
	// ...
}
```

#### Kotlin

```kotlin
@GetMapping("/accounts/{id}")
@ResponseBody
fun handle(): Account {
	// ...
}
```

`@ResponseBody` is also supported at the class level, in which case it is inherited by
all controller methods. This is the effect of `@RestController`, which is nothing more
than a meta-annotation marked with `@Controller` and `@ResponseBody`.

You can use `@ResponseBody` with reactive types.
See [Asynchronous Requests](../../mvc-ann-async.md) and [Reactive Types](../../mvc-ann-async.md#mvc-ann-async-reactive-types) for more details.

You can use the [Message Converters](../../mvc-config/message-converters.md) option of the [MVC Config](../../mvc-config.md) to
configure or customize message conversion.

You can combine `@ResponseBody` methods with JSON serialization views.
See [Jackson JSON](jackson.md) for details.
