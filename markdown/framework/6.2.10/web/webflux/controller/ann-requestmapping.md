---
title: "Mapping Requests"
source: "ROOT:web/webflux/controller/ann-requestmapping.adoc"
---

<a id="webflux-ann-requestmapping"></a>

# Mapping Requests

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-requestmapping.md)

This section discusses request mapping for annotated controllers.

<a id="webflux-ann-requestmapping-annotation"></a>

## `@RequestMapping`

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-requestmapping.md#mvc-ann-requestmapping-annotation)

The `@RequestMapping` annotation is used to map requests to controllers methods. It has
various attributes to match by URL, HTTP method, request parameters, headers, and media
types. You can use it at the class level to express shared mappings or at the method level
to narrow down to a specific endpoint mapping.

There are also HTTP method specific shortcut variants of `@RequestMapping`:

- `@GetMapping`
- `@PostMapping`
- `@PutMapping`
- `@DeleteMapping`
- `@PatchMapping`

The preceding annotations are [Custom Annotations](#webflux-ann-requestmapping-composed) that are provided
because, arguably, most controller methods should be mapped to a specific HTTP method versus
using `@RequestMapping`, which, by default, matches to all HTTP methods. At the same time, a
`@RequestMapping` is still needed at the class level to express shared mappings.

> [!NOTE]
> `@RequestMapping` cannot be used in conjunction with other `@RequestMapping`
> annotations that are declared on the same element (class, interface, or method). If
> multiple `@RequestMapping` annotations are detected on the same element, a warning will
> be logged, and only the first mapping will be used. This also applies to composed
> `@RequestMapping` annotations such as `@GetMapping`, `@PostMapping`, etc.

The following example uses type and method level mappings:

#### Java

```java
@RestController
@RequestMapping("/persons")
class PersonController {

	@GetMapping("/{id}")
	public Person getPerson(@PathVariable Long id) {
		// ...
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public void add(@RequestBody Person person) {
		// ...
	}
}
```

#### Kotlin

```kotlin
@RestController
@RequestMapping("/persons")
class PersonController {

	@GetMapping("/{id}")
	fun getPerson(@PathVariable id: Long): Person {
		// ...
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	fun add(@RequestBody person: Person) {
		// ...
	}
}
```

<a id="webflux-ann-requestmapping-uri-templates"></a>

## URI Patterns

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-requestmapping.md#mvc-ann-requestmapping-uri-templates)

You can map requests by using glob patterns and wildcards:

| Pattern | Description | Example |
| --- | --- | --- |
| `?` | Matches one character | `"/pages/t?st.html"` matches `"/pages/test.html"` and `"/pages/t3st.html"` |
| `*` | Matches zero or more characters within a path segment | `"/resources/*.png"` matches `"/resources/file.png"` `"/projects/*/versions"` matches `"/projects/spring/versions"` but does not match `"/projects/spring/boot/versions"` |
| `**` | Matches zero or more path segments until the end of the path | `"/resources/**"` matches `"/resources/file.png"` and `"/resources/images/file.png"` `"/resources/**/file.png"` is invalid as `**` is only allowed at the end of the path. |
| `{name}` | Matches a path segment and captures it as a variable named "name" | `"/projects/{project}/versions"` matches `"/projects/spring/versions"` and captures `project=spring` |
| `{name:[a-z]}+` | Matches the regexp `"[a-z]"+` as a path variable named "name" | ``"/projects/{project:[a-z]}/versions"` matches `"/projects/spring/versions"` but not `"/projects/spring1/versions"+`` |
| `{*path}` | Matches zero or more path segments until the end of the path and captures it as a variable named "path" | `"/resources/{*file}"` matches `"/resources/images/file.png"` and captures `file=/images/file.png` |

Captured URI variables can be accessed with `@PathVariable`, as the following example shows:

#### Java

```java
@GetMapping("/owners/{ownerId}/pets/{petId}")
public Pet findPet(@PathVariable Long ownerId, @PathVariable Long petId) {
	// ...
}
```

#### Kotlin

```kotlin
@GetMapping("/owners/{ownerId}/pets/{petId}")
fun findPet(@PathVariable ownerId: Long, @PathVariable petId: Long): Pet {
	// ...
}
```

You can declare URI variables at the class and method levels, as the following example shows:

#### Java

```java
@Controller
@RequestMapping("/owners/{ownerId}") // <1>
public class OwnerController {

	@GetMapping("/pets/{petId}") // <2>
	public Pet findPet(@PathVariable Long ownerId, @PathVariable Long petId) {
		// ...
	}
}
```

1. Class-level URI mapping.
1. Method-level URI mapping.

#### Kotlin

```kotlin
@Controller
@RequestMapping("/owners/{ownerId}") // <1>
class OwnerController {

	@GetMapping("/pets/{petId}") // <2>
	fun findPet(@PathVariable ownerId: Long, @PathVariable petId: Long): Pet {
		// ...
	}
}
```

1. Class-level URI mapping.
1. Method-level URI mapping.

URI variables are automatically converted to the appropriate type or a `TypeMismatchException`
is raised. Simple types (`int`, `long`, `Date`, and so on) are supported by default and you can
register support for any other data type.
See [Type Conversion](ann-methods/typeconversion.md) and [`DataBinder`](ann-initbinder.md).

URI variables can be named explicitly (for example, `@PathVariable("customId")`), but you can
leave that detail out if the names are the same and you compile your code with the `-parameters`
compiler flag.

The syntax `{*varName}` declares a URI variable that matches zero or more remaining path
segments. For example `/resources/{*path}` matches all files under `/resources/`, and the
`"path"` variable captures the complete path under `/resources`.

The syntax `{varName:regex}` declares a URI variable with a regular expression that has the
syntax: `{varName:regex}`. For example, given a URL of `/spring-web-3.0.5.jar`, the following method
extracts the name, version, and file extension:

#### Java

```java
@GetMapping("/{name:[a-z-]+}-{version:\\d\\.\\d\\.\\d}{ext:\\.[a-z]+}")
public void handle(@PathVariable String version, @PathVariable String ext) {
	// ...
}
```

#### Kotlin

```kotlin
@GetMapping("/{name:[a-z-]+}-{version:\\d\\.\\d\\.\\d}{ext:\\.[a-z]+}")
fun handle(@PathVariable version: String, @PathVariable ext: String) {
	// ...
}
```

URI path patterns can also have:

- Embedded `${…​}` placeholders that are resolved on startup via
`PropertySourcesPlaceholderConfigurer` against local, system, environment, and
other property sources. This is useful, for example, to parameterize a base URL based on
external configuration.
- SpEL expressions `#{…​}`.

> [!NOTE]
> Spring WebFlux uses `PathPattern` and the `PathPatternParser` for URI path matching support.
> Both classes are located in `spring-web` and are expressly designed for use with HTTP URL
> paths in web applications where a large number of URI path patterns are matched at runtime.

Spring WebFlux does not support suffix pattern matching — unlike Spring MVC, where a
mapping such as `/person` also matches to `/person.*`. For URL-based content
negotiation, if needed, we recommend using a query parameter, which is simpler, more
explicit, and less vulnerable to URL path based exploits.

<a id="webflux-ann-requestmapping-pattern-comparison"></a>

## Pattern Comparison

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-requestmapping.md#mvc-ann-requestmapping-pattern-comparison)

When multiple patterns match a URL, they must be compared to find the best match. This is done
with `PathPattern.SPECIFICITY_COMPARATOR`, which looks for patterns that are more specific.

For every pattern, a score is computed, based on the number of URI variables and wildcards,
where a URI variable scores lower than a wildcard. A pattern with a lower total score
wins. If two patterns have the same score, the longer is chosen.

Catch-all patterns (for example, `**`, `{*varName}`) are excluded from the scoring and are always
sorted last instead. If two patterns are both catch-all, the longer is chosen.

<a id="webflux-ann-requestmapping-consumes"></a>

## Consumable Media Types

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-requestmapping.md#mvc-ann-requestmapping-consumes)

You can narrow the request mapping based on the `Content-Type` of the request,
as the following example shows:

#### Java

```java
@PostMapping(path = "/pets", consumes = "application/json")
public void addPet(@RequestBody Pet pet) {
	// ...
}
```

#### Kotlin

```kotlin
@PostMapping("/pets", consumes = ["application/json"])
fun addPet(@RequestBody pet: Pet) {
	// ...
}
```

The consumes attribute also supports negation expressions — for example, `!text/plain` means any
content type other than `text/plain`.

You can declare a shared `consumes` attribute at the class level. Unlike most other request
mapping attributes, however, when used at the class level, a method-level `consumes` attribute
overrides rather than extends the class-level declaration.

> [!TIP]
> `MediaType` provides constants for commonly used media types — for example,
> `APPLICATION_JSON_VALUE` and `APPLICATION_XML_VALUE`.

<a id="webflux-ann-requestmapping-produces"></a>

## Producible Media Types

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-requestmapping.md#mvc-ann-requestmapping-produces)

You can narrow the request mapping based on the `Accept` request header and the list of
content types that a controller method produces, as the following example shows:

#### Java

```java
@GetMapping(path = "/pets/{petId}", produces = "application/json")
@ResponseBody
public Pet getPet(@PathVariable String petId) {
	// ...
}
```

#### Kotlin

```kotlin
@GetMapping("/pets/{petId}", produces = ["application/json"])
@ResponseBody
fun getPet(@PathVariable petId: String): Pet {
	// ...
}
```

The media type can specify a character set. Negated expressions are supported — for example,
`!text/plain` means any content type other than `text/plain`.

You can declare a shared `produces` attribute at the class level. Unlike most other request
mapping attributes, however, when used at the class level, a method-level `produces` attribute
overrides rather than extend the class level declaration.

> [!TIP]
> `MediaType` provides constants for commonly used media types — for example,
> `APPLICATION_JSON_VALUE`, `APPLICATION_XML_VALUE`.

<a id="webflux-ann-requestmapping-params-and-headers"></a>

## Parameters and Headers

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-requestmapping.md#mvc-ann-requestmapping-params-and-headers)

You can narrow request mappings based on query parameter conditions. You can test for the
presence of a query parameter (`myParam`), for its absence (`!myParam`), or for a
specific value (`myParam=myValue`). The following examples tests for a parameter with a value:

#### Java

```java
@GetMapping(path = "/pets/{petId}", params = "myParam=myValue") // <1>
public void findPet(@PathVariable String petId) {
	// ...
}
```

1. Check that `myParam` equals `myValue`.

#### Kotlin

```kotlin
@GetMapping("/pets/{petId}", params = ["myParam=myValue"]) // <1>
fun findPet(@PathVariable petId: String) {
	// ...
}
```

1. Check that `myParam` equals `myValue`.

You can also use the same with request header conditions, as the following example shows:

#### Java

```java
@GetMapping(path = "/pets/{petId}", headers = "myHeader=myValue") // <1>
public void findPet(@PathVariable String petId) {
	// ...
}
```

1. Check that `myHeader` equals `myValue`.

#### Kotlin

```kotlin
@GetMapping("/pets/{petId}", headers = ["myHeader=myValue"]) // <1>
fun findPet(@PathVariable petId: String) {
	// ...
}
```

1. Check that `myHeader` equals `myValue`.

<a id="webflux-ann-requestmapping-head-options"></a>

## HTTP HEAD, OPTIONS

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-requestmapping.md#mvc-ann-requestmapping-head-options)

`@GetMapping` and `@RequestMapping(method=HttpMethod.GET)` support HTTP HEAD
transparently for request mapping purposes. Controller methods need not change.
A response wrapper, applied in the `HttpHandler` server adapter, ensures a `Content-Length`
header is set to the number of bytes written without actually writing to the response.

By default, HTTP OPTIONS is handled by setting the `Allow` response header to the list of HTTP
methods listed in all `@RequestMapping` methods with matching URL patterns.

For a `@RequestMapping` without HTTP method declarations, the `Allow` header is set to
`GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS`. Controller methods should always declare the
supported HTTP methods (for example, by using the HTTP method specific variants — `@GetMapping`, `@PostMapping`, and others).

You can explicitly map a `@RequestMapping` method to HTTP HEAD and HTTP OPTIONS, but that
is not necessary in the common case.

<a id="webflux-ann-requestmapping-composed"></a>

## Custom Annotations

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-requestmapping.md#mvc-ann-requestmapping-composed)

Spring WebFlux supports the use of [composed annotations](../../../core/beans/classpath-scanning.md#beans-meta-annotations)
for request mapping. Those are annotations that are themselves meta-annotated with
`@RequestMapping` and composed to redeclare a subset (or all) of the `@RequestMapping`
attributes with a narrower, more specific purpose.

`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, and `@PatchMapping` are
examples of composed annotations. They are provided, because, arguably, most
controller methods should be mapped to a specific HTTP method versus using `@RequestMapping`,
which, by default, matches to all HTTP methods. If you need an example of how to implement
a composed annotation, look at how those are declared.

> [!NOTE]
> `@RequestMapping` cannot be used in conjunction with other `@RequestMapping`
> annotations that are declared on the same element (class, interface, or method). If
> multiple `@RequestMapping` annotations are detected on the same element, a warning will
> be logged, and only the first mapping will be used. This also applies to composed
> `@RequestMapping` annotations such as `@GetMapping`, `@PostMapping`, etc.

Spring WebFlux also supports custom request mapping attributes with custom request matching
logic. This is a more advanced option that requires sub-classing
`RequestMappingHandlerMapping` and overriding the `getCustomMethodCondition` method, where
you can check the custom attribute and return your own `RequestCondition`.

<a id="webflux-ann-requestmapping-registration"></a>

## Explicit Registrations

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-requestmapping.md#mvc-ann-requestmapping-registration)

You can programmatically register Handler methods, which can be used for dynamic
registrations or for advanced cases, such as different instances of the same handler
under different URLs. The following example shows how to do so:

#### Java

```java
@Configuration
public class MyConfig {

	@Autowired
	public void setHandlerMapping(RequestMappingHandlerMapping mapping, UserHandler handler) // <1>
			throws NoSuchMethodException {

		RequestMappingInfo info = RequestMappingInfo
				.paths("/user/{id}").methods(RequestMethod.GET).build(); // <2>

		Method method = UserHandler.class.getMethod("getUser", Long.class); // <3>

		mapping.registerMapping(info, handler, method); // <4>
	}

}
```

1. Inject target handlers and the handler mapping for controllers.
1. Prepare the request mapping metadata.
1. Get the handler method.
1. Add the registration.

#### Kotlin

```kotlin
@Configuration
class MyConfig {

	@Autowired
	fun setHandlerMapping(mapping: RequestMappingHandlerMapping, handler: UserHandler) { // <1>

		val info = RequestMappingInfo.paths("/user/{id}").methods(RequestMethod.GET).build() // <2>

		val method = UserHandler::class.java.getMethod("getUser", Long::class.java) // <3>

		mapping.registerMapping(info, handler, method) // <4>
	}
}
```

1. Inject target handlers and the handler mapping for controllers.
1. Prepare the request mapping metadata.
1. Get the handler method.
1. Add the registration.

<a id="webflux-ann-httpexchange-annotation"></a>

## `@HttpExchange`

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-requestmapping.md#mvc-ann-httpexchange-annotation)

While the main purpose of `@HttpExchange` is to abstract HTTP client code with a
generated proxy, the
[HTTP Interface](../../../integration/rest-clients.md#rest-http-interface) on which
such annotations are placed is a contract neutral to client vs server use.
In addition to simplifying client code, there are also cases where an HTTP Interface
may be a convenient way for servers to expose their API for client access. This leads
to increased coupling between client and server and is often not a good choice,
especially for public API’s, but may be exactly the goal for an internal API.
It is an approach commonly used in Spring Cloud, and it is why `@HttpExchange` is
supported as an alternative to `@RequestMapping` for server side handling in
controller classes.

For example:

#### Java

```java
@HttpExchange("/persons")
interface PersonService {

	@GetExchange("/{id}")
	Person getPerson(@PathVariable Long id);

	@PostExchange
	void add(@RequestBody Person person);
}

@RestController
class PersonController implements PersonService {

	public Person getPerson(@PathVariable Long id) {
		// ...
	}

	@ResponseStatus(HttpStatus.CREATED)
	public void add(@RequestBody Person person) {
		// ...
	}
}
```

#### Kotlin

```kotlin
@HttpExchange("/persons")
interface PersonService {

	@GetExchange("/{id}")
	fun getPerson(@PathVariable id: Long): Person

	@PostExchange
	fun add(@RequestBody person: Person)
}

@RestController
class PersonController : PersonService {

	override fun getPerson(@PathVariable id: Long): Person {
		// ...
	}

	@ResponseStatus(HttpStatus.CREATED)
	override fun add(@RequestBody person: Person) {
		// ...
	}
}
```

`@HttpExchange` and `@RequestMapping` have differences.
`@RequestMapping` can map to any number of requests by path patterns, HTTP methods,
and more, while `@HttpExchange` declares a single endpoint with a concrete HTTP method,
path, and content types.

For method parameters and returns values, generally, `@HttpExchange` supports a
subset of the method parameters that `@RequestMapping` does. Notably, it excludes any
server-side specific parameter types. For details, see the list for
[@HttpExchange](../../../integration/rest-clients.md#rest-http-interface-method-parameters) and
[@RequestMapping](ann-methods/arguments.md).
