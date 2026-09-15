---
title: "Annotations"
source: "ROOT:languages/kotlin/annotations.adoc"
---

<a id="kotlin-annotations"></a>

# Annotations

The Spring Framework also takes advantage of [Kotlin null-safety](https://kotlinlang.org/docs/reference/null-safety.html)
to determine if an HTTP parameter is required without having to explicitly
define the `required` attribute. That means `@RequestParam name: String?` is treated
as not required and, conversely, `@RequestParam name: String` is treated as being required.
This feature is also supported on the Spring Messaging `@Header` annotation.

In a similar fashion, Spring bean injection with `@Autowired`, `@Bean`, or `@Inject` uses
this information to determine if a bean is required or not.

For example, `@Autowired lateinit var thing: Thing` implies that a bean
of type `Thing` must be registered in the application context, while `@Autowired lateinit var thing: Thing?`
does not raise an error if such a bean does not exist.

Following the same principle, `@Bean fun play(toy: Toy, car: Car?) = Baz(toy, Car)` implies
that a bean of type `Toy` must be registered in the application context, while a bean of
type `Car` may or may not exist. The same behavior applies to autowired constructor parameters.

> [!NOTE]
> If you use bean validation on classes with properties or a primary constructor
> parameters, you may need to use
> [annotation use-site targets](https://kotlinlang.org/docs/reference/annotations.html#annotation-use-site-targets),
> such as `@field:NotNull` or `@get:Size(min=5, max=15)`, as described in
> [this Stack Overflow response](https://stackoverflow.com/a/35853200/1092077).
