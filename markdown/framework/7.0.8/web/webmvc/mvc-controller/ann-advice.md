---
title: "Controller Advice"
source: "ROOT:web/webmvc/mvc-controller/ann-advice.adoc"
---

<a id="mvc-ann-controller-advice"></a>

# Controller Advice

[See equivalent in the Reactive stack](../../webflux/controller/ann-advice.md)

`@ExceptionHandler`, `@InitBinder`, and `@ModelAttribute` methods apply only to the
`@Controller` class, or class hierarchy, in which they are declared. If, instead, they
are declared in an `@ControllerAdvice` or `@RestControllerAdvice` class, then they apply
to any controller. Moreover, as of 5.3, `@ExceptionHandler` methods in `@ControllerAdvice`
can be used to handle exceptions from any `@Controller` or any other handler.

`@ControllerAdvice` is meta-annotated with `@Component` and therefore can be registered as
a Spring bean through [component scanning](../../../core/beans/java/instantiating-container.md#beans-java-instantiating-container-scan).

`@RestControllerAdvice` is a shortcut annotation that combines `@ControllerAdvice`
with `@ResponseBody`, in effect simply an `@ControllerAdvice` whose exception handler
methods render to the response body.

On startup, `RequestMappingHandlerMapping` and `ExceptionHandlerExceptionResolver` detect
controller advice beans and apply them at runtime. Global `@ExceptionHandler` methods,
from an `@ControllerAdvice`, are applied *after* local ones, from the `@Controller`.
By contrast, global `@ModelAttribute` and `@InitBinder` methods are applied *before* local ones.

By default, both `@ControllerAdvice` and `@RestControllerAdvice` apply to any controller,
including `@Controller` and `@RestController`. Use attributes of the annotation to narrow
the set of controllers and handlers that they apply to. For example:

#### Java

```java
// Target all Controllers annotated with @RestController
@ControllerAdvice(annotations = RestController.class)
public class ExampleAdvice1 {}

// Target all Controllers within specific packages
@ControllerAdvice("org.example.controllers")
public class ExampleAdvice2 {}

// Target all Controllers assignable to specific classes
@ControllerAdvice(assignableTypes = {ControllerInterface.class, AbstractController.class})
public class ExampleAdvice3 {}
```

#### Kotlin

```kotlin
// Target all Controllers annotated with @RestController
@ControllerAdvice(annotations = [RestController::class])
class ExampleAdvice1

// Target all Controllers within specific packages
@ControllerAdvice("org.example.controllers")
class ExampleAdvice2

// Target all Controllers assignable to specific classes
@ControllerAdvice(assignableTypes = [ControllerInterface::class, AbstractController::class])
class ExampleAdvice3
```

The selectors in the preceding example are evaluated at runtime and may negatively impact
performance if used extensively. See the
[`@ControllerAdvice`](https://docs.spring.io/spring-framework/docs/7.0.8/javadoc-api/org/springframework/web/bind/annotation/ControllerAdvice.html)
javadoc for more details.
