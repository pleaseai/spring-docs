---
title: "Annotated Controllers"
source: "ROOT:web/webflux/controller.adoc"
---

<a id="webflux-controller"></a>

# Annotated Controllers

[See equivalent in the Servlet stack](../webmvc/mvc-controller.md)

Spring WebFlux provides an annotation-based programming model, where `@Controller` and
`@RestController` components use annotations to express request mappings, request input,
handle exceptions, and more. Annotated controllers have flexible method signatures and
do not have to extend base classes nor implement specific interfaces.

The following listing shows a basic example:

#### Java

```java
@RestController
public class HelloController {

	@GetMapping("/hello")
	public String handle() {
		return "Hello WebFlux";
	}
}
```

#### Kotlin

```kotlin
@RestController
class HelloController {

	@GetMapping("/hello")
	fun handle() = "Hello WebFlux"
}
```

In the preceding example, the method returns a `String` to be written to the response body.
