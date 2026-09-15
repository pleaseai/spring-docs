---
title: "Annotated Controllers"
source: "ROOT:web/webmvc/mvc-controller.adoc"
---

<a id="mvc-controller"></a>

# Annotated Controllers

[See equivalent in the Reactive stack](../webflux/controller.md)

Spring MVC provides an annotation-based programming model where `@Controller` and
`@RestController` components use annotations to express request mappings, request input,
exception handling, and more. Annotated controllers have flexible method signatures and
do not have to extend base classes nor implement specific interfaces.
The following example shows a controller defined by annotations:

#### Java

```java
@Controller
public class HelloController {

	@GetMapping("/hello")
	public String handle(Model model) {
		model.addAttribute("message", "Hello World!");
		return "index";
	}
}
```

#### Kotlin

```kotlin
import org.springframework.ui.set

@Controller
class HelloController {

	@GetMapping("/hello")
	fun handle(model: Model): String {
		model["message"] = "Hello World!"
		return "index"
	}
}
```

In the preceding example, the method accepts a `Model` and returns a view name as a `String`,
but many other options exist and are explained later in this chapter.

> [!TIP]
> Guides and tutorials on [spring.io](https://spring.io/guides) use the annotation-based
> programming model described in this section.
