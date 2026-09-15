---
title: "Exceptions"
source: "ROOT:web/webflux/controller/ann-exceptions.adoc"
---

<a id="webflux-ann-controller-exceptions"></a>

# Exceptions

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-exceptionhandler.md)

`@Controller` and [@ControllerAdvice](ann-advice.md) classes can have
`@ExceptionHandler` methods to handle exceptions from controller methods. The following
example includes such a handler method:

#### Java

```java
@Controller
public class SimpleController {

	// ...

	@ExceptionHandler // <1>
	public ResponseEntity<String> handle(IOException ex) {
		// ...
	}
}
```

1. Declaring an `@ExceptionHandler`.

#### Kotlin

```kotlin
@Controller
class SimpleController {

	// ...

	@ExceptionHandler // <1>
	fun handle(ex: IOException): ResponseEntity<String> {
		// ...
	}
}
```

1. Declaring an `@ExceptionHandler`.

The exception can match against a top-level exception being propagated (that is, a direct
`IOException` being thrown) or against the immediate cause within a top-level wrapper
exception (for example, an `IOException` wrapped inside an `IllegalStateException`).

For matching exception types, preferably declare the target exception as a method argument,
as shown in the preceding example. Alternatively, the annotation declaration can narrow the
exception types to match. We generally recommend being as specific as possible in the
argument signature and to declare your primary root exception mappings on a
`@ControllerAdvice` prioritized with a corresponding order.
See [the MVC section](../../webmvc/mvc-controller/ann-exceptionhandler.md) for details.

> [!NOTE]
> An `@ExceptionHandler` method in WebFlux supports the same method arguments and
> return values as a `@RequestMapping` method, with the exception of request body-
> and `@ModelAttribute`-related method arguments.

Support for `@ExceptionHandler` methods in Spring WebFlux is provided by the
`HandlerAdapter` for `@RequestMapping` methods. See [`DispatcherHandler`](../dispatcher-handler.md)
for more detail.

<a id="webflux-ann-exceptionhandler-args"></a>

## Method Arguments

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-exceptionhandler.md#mvc-ann-exceptionhandler-args)

`@ExceptionHandler` methods support the same [method arguments](ann-methods/arguments.md)
as `@RequestMapping` methods, except the request body might have been consumed already.

<a id="webflux-ann-exceptionhandler-return-values"></a>

## Return Values

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-exceptionhandler.md#mvc-ann-exceptionhandler-return-values)

`@ExceptionHandler` methods support the same [return values](ann-methods/return-types.md)
as `@RequestMapping` methods.
