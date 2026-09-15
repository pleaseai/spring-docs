---
title: "Controller Advice"
source: "ROOT:web/webflux/controller/ann-advice.adoc"
---

<a id="webflux-ann-controller-advice"></a>

# Controller Advice

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-advice.md)

Typically, the `@ExceptionHandler`, `@InitBinder`, and `@ModelAttribute` methods apply
within the `@Controller` class (or class hierarchy) in which they are declared. If you
want such methods to apply more globally (across controllers), you can declare them in a
class annotated with `@ControllerAdvice` or `@RestControllerAdvice`.

`@ControllerAdvice` is annotated with `@Component`, which means that such classes can be
registered as Spring beans through [component scanning](../../../core/beans/java/instantiating-container.md#beans-java-instantiating-container-scan)
. `@RestControllerAdvice` is a composed annotation that is annotated
with both `@ControllerAdvice` and `@ResponseBody`, which essentially means
`@ExceptionHandler` methods are rendered to the response body through message conversion
(versus view resolution or template rendering).

On startup, the infrastructure classes for `@RequestMapping` and `@ExceptionHandler`
methods detect Spring beans annotated with `@ControllerAdvice` and then apply their
methods at runtime. Global `@ExceptionHandler` methods (from a `@ControllerAdvice`) are
applied *after* local ones (from the `@Controller`). By contrast, global `@ModelAttribute`
and `@InitBinder` methods are applied *before* local ones.

By default, `@ControllerAdvice` methods apply to every request (that is, all controllers),
but you can narrow that down to a subset of controllers by using attributes on the
annotation, as the following example shows:

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
public class ExampleAdvice1 {}

// Target all Controllers within specific packages
@ControllerAdvice("org.example.controllers")
public class ExampleAdvice2 {}

// Target all Controllers assignable to specific classes
@ControllerAdvice(assignableTypes = [ControllerInterface::class, AbstractController::class])
public class ExampleAdvice3 {}
```

The selectors in the preceding example are evaluated at runtime and may negatively impact
performance if used extensively. See the
[`@ControllerAdvice`](https://docs.spring.io/spring-framework/docs/6.1.8/javadoc-api/org/springframework/web/bind/annotation/ControllerAdvice.html)
javadoc for more details.
