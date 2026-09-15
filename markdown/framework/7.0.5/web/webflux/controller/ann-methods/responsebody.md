---
title: "`@ResponseBody`"
source: "ROOT:web/webflux/controller/ann-methods/responsebody.adoc"
---

<a id="webflux-ann-responsebody"></a>

# `@ResponseBody`

[See equivalent in the Servlet stack](../../../webmvc/mvc-controller/ann-methods/responsebody.md)

You can use the `@ResponseBody` annotation on a method to have the return serialized
to the response body through an [HttpMessageWriter](../../reactive-spring.md#webflux-codecs). The following
example shows how to do so:

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

`@ResponseBody` supports reactive types, which means you can return Reactor or RxJava
types and have the asynchronous values they produce rendered to the response.
For additional details, see [Streaming](../../reactive-spring.md#webflux-codecs-streaming)
and [JSON rendering](../../reactive-spring.md#webflux-codecs-jackson).

You can combine `@ResponseBody` methods with JSON serialization views.
See [Jackson JSON](jackson.md) for details.

You can use the [HTTP message codecs](../../config.md#webflux-config-message-codecs)
option of the [WebFlux Config](../../dispatcher-handler.md#webflux-framework-config)
to configure or customize message writing.
