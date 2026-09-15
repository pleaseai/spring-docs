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
import java.io.IOException;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ExceptionHandler;

@Controller
public class SimpleController {

	@ExceptionHandler(IOException.class)
	public ResponseEntity<String> handle() {
		return ResponseEntity.internalServerError().body("Could not read file storage");
	}

}
```

#### Kotlin

```kotlin
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.ExceptionHandler
import java.io.IOException

@Controller
class SimpleController {

	@ExceptionHandler(IOException::class)
	fun handle() : ResponseEntity<String> {
		return ResponseEntity.internalServerError().body("Could not read file storage")
	}
	
}
```

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

<a id="webflux-ann-exceptionhandler-media"></a>

## Media Type Mapping

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-exceptionhandler.md#mvc-ann-exceptionhandler-media)

In addition to exception types, `@ExceptionHandler` methods can also declare producible media types.
This allows to refine error responses depending on the media types requested by HTTP clients, typically in the "Accept" HTTP request header.

Applications can declare producible media types directly on annotations, for the same exception type:

#### Java

```java
@ExceptionHandler(produces = "application/json")
public ResponseEntity<ErrorMessage> handleJson(IllegalArgumentException exc) {
	return ResponseEntity.badRequest().body(new ErrorMessage(exc.getMessage(), 42));
}

@ExceptionHandler(produces = "text/html")
public String handle(IllegalArgumentException exc, Model model) {
	model.addAttribute("error", new ErrorMessage(exc.getMessage(), 42));
	return "errorView";
}
```

#### Kotlin

```kotlin
@ExceptionHandler(produces = ["application/json"])
fun handleJson(exc: IllegalArgumentException): ResponseEntity<ErrorMessage> {
	return ResponseEntity.badRequest().body(ErrorMessage(exc.message, 42))
}

@ExceptionHandler(produces = ["text/html"])
fun handle(exc: IllegalArgumentException, model: Model): String {
	model.addAttribute("error", ErrorMessage(exc.message, 42))
	return "errorView"
}
```

Here, methods handle the same exception type but will not be rejected as duplicates.
Instead, API clients requesting "application/json" will receive a JSON error, and browsers will get an HTML error view.
Each `@ExceptionHandler` annotation can declare several producible media types,
the content negotiation during the error handling phase will decide which content type will be used.

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
