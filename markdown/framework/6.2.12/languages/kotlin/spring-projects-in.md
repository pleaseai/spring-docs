---
title: "Spring Projects in Kotlin"
source: "ROOT:languages/kotlin/spring-projects-in.adoc"
---

<a id="kotlin-spring-projects-in-kotlin"></a>

# Spring Projects in Kotlin

This section provides some specific hints and recommendations worth for developing Spring projects
in Kotlin.

<a id="final-by-default"></a>

## Final by Default

By default, [all classes and member functions in Kotlin are `final`](https://discuss.kotlinlang.org/t/classes-final-by-default/166).
The `open` modifier on a class is the opposite of Java’s `final`: It allows others to inherit from this
class. This also applies to member functions, in that they need to be marked as `open` to be overridden.

While Kotlin’s JVM-friendly design is generally frictionless with Spring, this specific Kotlin feature
can prevent the application from starting, if this fact is not taken into consideration. This is because
Spring beans (such as `@Configuration` annotated classes which by default need to be extended at runtime for technical
reasons) are normally proxied by CGLIB. The workaround is to add an `open` keyword on each class and
member function of Spring beans that are proxied by CGLIB, which can
quickly become painful and is against the Kotlin principle of keeping code concise and predictable.

> [!NOTE]
> It is also possible to avoid CGLIB proxies for configuration classes by using `@Configuration(proxyBeanMethods = false)`.
> See [`proxyBeanMethods` Javadoc](https://docs.spring.io/spring-framework/docs/6.2.12/javadoc-api/org/springframework/context/annotation/Configuration.html#proxyBeanMethods--) for more details.

Fortunately, Kotlin provides a
[`kotlin-spring`](https://kotlinlang.org/docs/compiler-plugins.html#kotlin-spring-compiler-plugin)
plugin (a preconfigured version of the `kotlin-allopen` plugin) that automatically opens classes
and their member functions for types that are annotated or meta-annotated with one of the following
annotations:

- `@Component`
- `@Async`
- `@Transactional`
- `@Cacheable`

Meta-annotation support means that types annotated with `@Configuration`, `@Controller`,
`@RestController`, `@Service`, or `@Repository` are automatically opened since these
annotations are meta-annotated with `@Component`.

> [!WARNING]
> Some use cases involving proxies and automatic generation of final methods by the Kotlin compiler require extra
> care. For example, a Kotlin class with properties will generate related `final` getters and setters. In order
> to be able to proxy related methods, a type level `@Component` annotation should be preferred to method level `@Bean` in
> order to have those methods opened by the `kotlin-spring` plugin. A typical use case is `@Scope` and its popular
> `@RequestScope` specialization.

[start.spring.io](https://start.spring.io/#!language=kotlin&type=gradle-project) enables
the `kotlin-spring` plugin by default. So, in practice, you can write your Kotlin beans
without any additional `open` keyword, as in Java.

> [!NOTE]
> The Kotlin code samples in Spring Framework documentation do not explicitly specify
> `open` on the classes and their member functions. The samples are written for projects
> using the `kotlin-allopen` plugin, since this is the most commonly used setup.

<a id="using-immutable-class-instances-for-persistence"></a>

## Using Immutable Class Instances for Persistence

In Kotlin, it is convenient and considered to be a best practice to declare read-only properties
within the primary constructor, as in the following example:

```kotlin
class Person(val name: String, val age: Int)
```

You can optionally add [the `data` keyword](https://kotlinlang.org/docs/data-classes.html)
to make the compiler automatically derive the following members from all properties declared
in the primary constructor:

- `equals()` and `hashCode()`
- `toString()` of the form `"User(name=John, age=42)"`
- `componentN()` functions that correspond to the properties in their order of declaration
- `copy()` function

As the following example shows, this allows for easy changes to individual properties, even if `Person` properties are read-only:

```kotlin
data class Person(val name: String, val age: Int)

val jack = Person(name = "Jack", age = 1)
val olderJack = jack.copy(age = 2)
```

Common persistence technologies (such as JPA) require a default constructor, preventing this
kind of design. Fortunately, there is a workaround for this
[“default constructor hell”](https://stackoverflow.com/questions/32038177/kotlin-with-jpa-default-constructor-hell),
since Kotlin provides a [`kotlin-jpa`](https://kotlinlang.org/docs/compiler-plugins.html#kotlin-jpa-compiler-plugin)
plugin that generates synthetic no-arg constructor for classes annotated with JPA annotations.

If you need to leverage this kind of mechanism for other persistence technologies, you can configure
the [`kotlin-noarg`](https://kotlinlang.org/docs/compiler-plugins.html#how-to-use-no-arg-plugin)
plugin.

> [!NOTE]
> As of the Kay release train, Spring Data supports Kotlin immutable class instances and
> does not require the `kotlin-noarg` plugin if the module uses Spring Data object mappings
> (such as MongoDB, Redis, Cassandra, and others).

<a id="injecting-dependencies"></a>

## Injecting Dependencies

<a id="favor-constructor-injection"></a>

### Favor constructor injection

Our recommendation is to try to favor constructor injection with `val` read-only (and
non-nullable when possible) [properties](https://kotlinlang.org/docs/properties.html),
as the following example shows:

```kotlin
@Component
class YourBean(
	private val mongoTemplate: MongoTemplate,
	private val solrClient: SolrClient
)
```

> [!NOTE]
> Classes with a single constructor have their parameters automatically autowired.
> That’s why there is no need for an explicit `@Autowired constructor` in the example shown
> above.

If you really need to use field injection, you can use the `lateinit var` construct,
as the following example shows:

```kotlin
@Component
class YourBean {

	@Autowired
	lateinit var mongoTemplate: MongoTemplate

	@Autowired
	lateinit var solrClient: SolrClient
}
```

<a id="internal-functions-name-mangling"></a>

### Internal functions name mangling

Kotlin functions with the `internal` [visibility modifier](https://kotlinlang.org/docs/visibility-modifiers.html#class-members) have
their names mangled when compiled to JVM bytecode, which has a side effect when injecting dependencies by name.

For example, this Kotlin class:

```kotlin
@Configuration
class SampleConfiguration {

	@Bean
	internal fun sampleBean() = SampleBean()
}
```

Translates to this Java representation of the compiled JVM bytecode:

```java
@Configuration
@Metadata(/* ... */)
public class SampleConfiguration {

	@Bean
	@NotNull
	public SampleBean sampleBean$demo_kotlin_internal_test() {
		return new SampleBean();
	}
}
```

As a consequence, the related bean name represented as a Kotlin string is `"sampleBean\$demo_kotlin_internal_test"`,
instead of `"sampleBean"` for the regular `public` function use-case. Make sure to use the mangled name when injecting
such bean by name, or add `@JvmName("sampleBean")` to disable name mangling.

<a id="injecting-configuration-properties"></a>

## Injecting Configuration Properties

In Java, you can inject configuration properties by using annotations (such as `@Value("${property}")`).
However, in Kotlin, `$` is a reserved character that is used for
[string interpolation](https://kotlinlang.org/docs/idioms.html#string-interpolation).

Therefore, if you wish to use the `@Value` annotation in Kotlin, you need to escape the `$`
character by writing `@Value("\${property}")`.

> [!NOTE]
> If you use Spring Boot, you should probably use
> [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/reference/features/external-config.html#features.external-config.typesafe-configuration-properties)
> instead of `@Value` annotations.

As an alternative, you can customize the property placeholder prefix by declaring the
following `PropertySourcesPlaceholderConfigurer` bean:

```kotlin
@Bean
fun propertyConfigurer() = PropertySourcesPlaceholderConfigurer().apply {
	setPlaceholderPrefix("%{")
}
```

You can support components (such as Spring Boot actuators or `@LocalServerPort`) that use
the standard `${…​}` syntax alongside components that use the custom `%{…​}` syntax by
declaring multiple `PropertySourcesPlaceholderConfigurer` beans, as the following example
shows:

```kotlin
@Bean
fun kotlinPropertyConfigurer() = PropertySourcesPlaceholderConfigurer().apply {
	setPlaceholderPrefix("%{")
	setIgnoreUnresolvablePlaceholders(true)
}

@Bean
fun defaultPropertyConfigurer() = PropertySourcesPlaceholderConfigurer()
```

In addition, the default escape character can be changed or disabled globally by setting
the `spring.placeholder.escapeCharacter.default` property via a JVM system property (or
via the [`SpringProperties`](../../appendix.md#appendix-spring-properties) mechanism).

<a id="checked-exceptions"></a>

## Checked Exceptions

Java and [Kotlin exception handling](https://kotlinlang.org/docs/exceptions.html)
are pretty close, with the main difference being that Kotlin treats all exceptions as
unchecked exceptions. However, when using proxied objects (for example classes or methods
annotated with `@Transactional`), checked exceptions thrown will be wrapped by default in
an `UndeclaredThrowableException`.

To get the original exception thrown like in Java, methods should be annotated with
[`@Throws`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.jvm/-throws/index.html)
to specify explicitly the checked exceptions thrown (for example `@Throws(IOException::class)`).

<a id="annotation-array-attributes"></a>

## Annotation Array Attributes

Kotlin annotations are mostly similar to Java annotations, but array attributes (which are
extensively used in Spring) behave differently. As explained in the
[Kotlin documentation](https://kotlinlang.org/docs/annotations.html) you can omit
the `value` attribute name, unlike other attributes, and specify it as a `vararg` parameter.

To understand what that means, consider `@RequestMapping` (which is one of the most widely
used Spring annotations) as an example. This Java annotation is declared as follows:

```java
public @interface RequestMapping {

	@AliasFor("path")
	String[] value() default {};

	@AliasFor("value")
	String[] path() default {};

	RequestMethod[] method() default {};

	// ...
}
```

The typical use case for `@RequestMapping` is to map a handler method to a specific path
and method. In Java, you can specify a single value for the annotation array attribute,
and it is automatically converted to an array.

That is why one can write
`@RequestMapping(value = "/toys", method = RequestMethod.GET)` or
`@RequestMapping(path = "/toys", method = RequestMethod.GET)`.

However, in Kotlin, you must write `@RequestMapping("/toys", method = [RequestMethod.GET])`
or `@RequestMapping(path = ["/toys"], method = [RequestMethod.GET])` (square brackets need
to be specified with named array attributes).

An alternative for this specific `method` attribute (the most common one) is to
use a shortcut annotation, such as `@GetMapping`, `@PostMapping`, and others.

> [!NOTE]
> If the `@RequestMapping` `method` attribute is not specified, all HTTP methods will
> be matched, not only the `GET` method.

<a id="declaration-site-variance"></a>

## Declaration-site variance

Dealing with generic types in Spring applications written in Kotlin may require, for some use cases, to understand
Kotlin [declaration-site variance](https://kotlinlang.org/docs/generics.html#declaration-site-variance)
which allows to define the variance when declaring a type, which is not possible in Java which supports only use-site
variance.

For example, declaring `List<Foo>` in Kotlin is conceptually equivalent to `java.util.List<? extends Foo>` because
`kotlin.collections.List` is declared as
[`interface List<out E> : kotlin.collections.Collection<E>`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-list/).

This needs to be taken into account by using the `out` Kotlin keyword on generic types when using Java classes,
for example when writing a `org.springframework.core.convert.converter.Converter` from a Kotlin type to a Java type.

```kotlin
class ListOfFooConverter : Converter<List<Foo>, CustomJavaList<out Foo>> {
	// ...
}
```

When converting any kind of objects, star projection with `*` can be used instead of `out Any`.

```kotlin
class ListOfAnyConverter : Converter<List<*>, CustomJavaList<*>> {
	// ...
}
```

> [!NOTE]
> Spring Framework does not leverage yet declaration-site variance type information for injecting beans,
> subscribe to [spring-framework#22313](https://github.com/spring-projects/spring-framework/issues/22313) to track related
> progresses.

<a id="testing"></a>

## Testing

This section addresses testing with the combination of Kotlin and Spring Framework.
The recommended testing framework is [JUnit 5](https://junit.org/junit5/) along with
[Mockk](https://mockk.io/) for mocking.

> [!NOTE]
> If you are using Spring Boot, see
> [this related documentation](https://docs.spring.io/spring-boot/reference/features/kotlin.html#features.kotlin.testing).

<a id="constructor-injection"></a>

### Constructor injection

As described in the [dedicated section](../../testing/testcontext-framework/support-classes.md#testcontext-junit-jupiter-di),
JUnit Jupiter (JUnit 5) allows constructor injection of beans which is pretty useful with Kotlin
in order to use `val` instead of `lateinit var`. You can use
[`@TestConstructor(autowireMode = AutowireMode.ALL)`](https://docs.spring.io/spring-framework/docs/6.2.12/javadoc-api/org/springframework/test/context/TestConstructor.html)
to enable autowiring for all parameters.

> [!NOTE]
> You can also change the default behavior to `ALL` in a `junit-platform.properties`
> file with a `spring.test.constructor.autowire.mode = all` property.

```kotlin
@SpringJUnitConfig(TestConfig::class)
@TestConstructor(autowireMode = AutowireMode.ALL)
class OrderServiceIntegrationTests(
				val orderService: OrderService,
				val customerService: CustomerService) {

	// tests that use the injected OrderService and CustomerService
}
```

<a id="per_class-lifecycle"></a>

### `PER_CLASS` Lifecycle

Kotlin lets you specify meaningful test function names between backticks (`` ` ``).
With JUnit Jupiter (JUnit 5), Kotlin test classes can use the `@TestInstance(TestInstance.Lifecycle.PER_CLASS)`
annotation to enable single instantiation of test classes, which allows the use of `@BeforeAll`
and `@AfterAll` annotations on non-static methods, which is a good fit for Kotlin.

> [!NOTE]
> You can also change the default behavior to `PER_CLASS` in a `junit-platform.properties`
> file with a `junit.jupiter.testinstance.lifecycle.default = per_class` property.

The following example demonstrates `@BeforeAll` and `@AfterAll` annotations on non-static methods:

```kotlin
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class IntegrationTests {

	val application = Application(8181)
	val client = WebClient.create("http://localhost:8181")

	@BeforeAll
	fun beforeAll() {
		application.start()
	}

	@Test
	fun `Find all users on HTML page`() {
		client.get().uri("/users")
				.accept(TEXT_HTML)
				.retrieve()
				.bodyToMono<String>()
				.test()
				.expectNextMatches { it.contains("Foo") }
				.verifyComplete()
	}

	@AfterAll
	fun afterAll() {
		application.stop()
	}
}
```

<a id="specification-like-tests"></a>

### Specification-like Tests

You can create specification-like tests with JUnit 5 and Kotlin.
The following example shows how to do so:

```kotlin
class SpecificationLikeTests {

	@Nested
	@DisplayName("a calculator")
	inner class Calculator {

		val calculator = SampleCalculator()

		@Test
		fun `should return the result of adding the first number to the second number`() {
			val sum = calculator.sum(2, 4)
			assertEquals(6, sum)
		}

		@Test
		fun `should return the result of subtracting the second number from the first number`() {
			val subtract = calculator.subtract(4, 2)
			assertEquals(2, subtract)
		}
	}
}
```
