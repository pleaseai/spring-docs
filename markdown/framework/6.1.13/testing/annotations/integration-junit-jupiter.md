---
title: "Spring JUnit Jupiter Testing Annotations"
source: "ROOT:testing/annotations/integration-junit-jupiter.adoc"
---

<a id="integration-testing-annotations-junit-jupiter"></a>

# Spring JUnit Jupiter Testing Annotations

The following annotations are supported when used in conjunction with the
[`SpringExtension`](../testcontext-framework/support-classes.md#testcontext-junit-jupiter-extension) and JUnit Jupiter
(that is, the programming model in JUnit 5):

- [`@SpringJUnitConfig`](#integration-testing-annotations-junit-jupiter-springjunitconfig)
- [`@SpringJUnitWebConfig`](#integration-testing-annotations-junit-jupiter-springjunitwebconfig)
- [`@TestConstructor`](#integration-testing-annotations-testconstructor)
- [`@NestedTestConfiguration`](#integration-testing-annotations-nestedtestconfiguration)
- [`@EnabledIf`](#integration-testing-annotations-junit-jupiter-enabledif)
- [`@DisabledIf`](#integration-testing-annotations-junit-jupiter-disabledif)
- [`@DisabledInAotMode`](integration-spring/annotation-disabledinaotmode.md)

<a id="integration-testing-annotations-junit-jupiter-springjunitconfig"></a>

## `@SpringJUnitConfig`

`@SpringJUnitConfig` is a composed annotation that combines
`@ExtendWith(SpringExtension.class)` from JUnit Jupiter with `@ContextConfiguration` from
the Spring TestContext Framework. It can be used at the class level as a drop-in
replacement for `@ContextConfiguration`. With regard to configuration options, the only
difference between `@ContextConfiguration` and `@SpringJUnitConfig` is that component
classes may be declared with the `value` attribute in `@SpringJUnitConfig`.

The following example shows how to use the `@SpringJUnitConfig` annotation to specify a
configuration class:

#### Java

```java
@SpringJUnitConfig(TestConfig.class) // <1>
class ConfigurationClassJUnitJupiterSpringTests {
	// class body...
}
```

1. Specify the configuration class.

#### Kotlin

```kotlin
@SpringJUnitConfig(TestConfig::class) // <1>
class ConfigurationClassJUnitJupiterSpringTests {
	// class body...
}
```

1. Specify the configuration class.

The following example shows how to use the `@SpringJUnitConfig` annotation to specify the
location of a configuration file:

#### Java

```java
@SpringJUnitConfig(locations = "/test-config.xml") // <1>
class XmlJUnitJupiterSpringTests {
	// class body...
}
```

1. Specify the location of a configuration file.

#### Kotlin

```kotlin
@SpringJUnitConfig(locations = ["/test-config.xml"]) // <1>
class XmlJUnitJupiterSpringTests {
	// class body...
}
```

1. Specify the location of a configuration file.

See [Context Management](../testcontext-framework/ctx-management.md) as well as the javadoc for
[`@SpringJUnitConfig`](https://docs.spring.io/spring-framework/docs/6.1.13/javadoc-api/org/springframework/test/context/junit/jupiter/SpringJUnitConfig.html)
and `@ContextConfiguration` for further details.

<a id="integration-testing-annotations-junit-jupiter-springjunitwebconfig"></a>

## `@SpringJUnitWebConfig`

`@SpringJUnitWebConfig` is a composed annotation that combines
`@ExtendWith(SpringExtension.class)` from JUnit Jupiter with `@ContextConfiguration` and
`@WebAppConfiguration` from the Spring TestContext Framework. You can use it at the class
level as a drop-in replacement for `@ContextConfiguration` and `@WebAppConfiguration`.
With regard to configuration options, the only difference between `@ContextConfiguration`
and `@SpringJUnitWebConfig` is that you can declare component classes by using the
`value` attribute in `@SpringJUnitWebConfig`. In addition, you can override the `value`
attribute from `@WebAppConfiguration` only by using the `resourcePath` attribute in
`@SpringJUnitWebConfig`.

The following example shows how to use the `@SpringJUnitWebConfig` annotation to specify
a configuration class:

#### Java

```java
@SpringJUnitWebConfig(TestConfig.class) // <1>
class ConfigurationClassJUnitJupiterSpringWebTests {
	// class body...
}
```

1. Specify the configuration class.

#### Kotlin

```kotlin
@SpringJUnitWebConfig(TestConfig::class) // <1>
class ConfigurationClassJUnitJupiterSpringWebTests {
	// class body...
}
```

1. Specify the configuration class.

The following example shows how to use the `@SpringJUnitWebConfig` annotation to specify the
location of a configuration file:

#### Java

```java
@SpringJUnitWebConfig(locations = "/test-config.xml") // <1>
class XmlJUnitJupiterSpringWebTests {
	// class body...
}
```

1. Specify the location of a configuration file.

#### Kotlin

```kotlin
@SpringJUnitWebConfig(locations = ["/test-config.xml"]) // <1>
class XmlJUnitJupiterSpringWebTests {
	// class body...
}
```

1. Specify the location of a configuration file.

See [Context Management](../testcontext-framework/ctx-management.md) as well as the javadoc for
[`@SpringJUnitWebConfig`](https://docs.spring.io/spring-framework/docs/6.1.13/javadoc-api/org/springframework/test/context/junit/jupiter/web/SpringJUnitWebConfig.html),
[`@ContextConfiguration`](https://docs.spring.io/spring-framework/docs/6.1.13/javadoc-api/org/springframework/test/context/ContextConfiguration.html), and
[`@WebAppConfiguration`](https://docs.spring.io/spring-framework/docs/6.1.13/javadoc-api/org/springframework/test/context/web/WebAppConfiguration.html)
for further details.

<a id="integration-testing-annotations-testconstructor"></a>

## `@TestConstructor`

`@TestConstructor` is a type-level annotation that is used to configure how the parameters
of a test class constructor are autowired from components in the test’s
`ApplicationContext`.

If `@TestConstructor` is not present or meta-present on a test class, the default *test
constructor autowire mode* will be used. See the tip below for details on how to change
the default mode. Note, however, that a local declaration of `@Autowired`,
`@jakarta.inject.Inject`, or `@javax.inject.Inject` on a constructor takes precedence
over both `@TestConstructor` and the default mode.

> [!TIP]
> The default *test constructor autowire mode* can be changed by setting the
> `spring.test.constructor.autowire.mode` JVM system property to `all`. Alternatively, the
> default mode may be set via the
> [`SpringProperties`](../../appendix.md#appendix-spring-properties) mechanism.
>
> As of Spring Framework 5.3, the default mode may also be configured as a
> [JUnit Platform configuration parameter](https://junit.org/junit5/docs/current/user-guide/#running-tests-config-params).
>
> If the `spring.test.constructor.autowire.mode` property is not set, test class
> constructors will not be automatically autowired.

> [!NOTE]
> As of Spring Framework 5.2, `@TestConstructor` is only supported in conjunction
> with the `SpringExtension` for use with JUnit Jupiter. Note that the `SpringExtension` is
> often automatically registered for you – for example, when using annotations such as
> `@SpringJUnitConfig` and `@SpringJUnitWebConfig` or various test-related annotations from
> Spring Boot Test.

<a id="integration-testing-annotations-nestedtestconfiguration"></a>

## `@NestedTestConfiguration`

`@NestedTestConfiguration` is a type-level annotation that is used to configure how
Spring test configuration annotations are processed within enclosing class hierarchies
for inner test classes.

If `@NestedTestConfiguration` is not present or meta-present on a test class, in its
supertype hierarchy, or in its enclosing class hierarchy, the default *enclosing
configuration inheritance mode* will be used. See the tip below for details on how to
change the default mode.

> [!TIP]
> The default *enclosing configuration inheritance mode* is `INHERIT`, but it can be
> changed by setting the `spring.test.enclosing.configuration` JVM system property to
> `OVERRIDE`. Alternatively, the default mode may be set via the
> [`SpringProperties`](../../appendix.md#appendix-spring-properties) mechanism.

The [Spring TestContext Framework](../testcontext-framework.md) honors `@NestedTestConfiguration` semantics for the
following annotations.

- [`@BootstrapWith`](integration-spring/annotation-bootstrapwith.md)
- [`@ContextConfiguration`](integration-spring/annotation-contextconfiguration.md)
- [`@WebAppConfiguration`](integration-spring/annotation-webappconfiguration.md)
- [`@ContextHierarchy`](integration-spring/annotation-contexthierarchy.md)
- [`@ContextCustomizerFactories`](integration-spring/annotation-contextcustomizerfactories.md)
- [`@ActiveProfiles`](integration-spring/annotation-activeprofiles.md)
- [`@TestPropertySource`](integration-spring/annotation-testpropertysource.md)
- [`@DynamicPropertySource`](integration-spring/annotation-dynamicpropertysource.md)
- [`@DirtiesContext`](integration-spring/annotation-dirtiescontext.md)
- [`@TestExecutionListeners`](integration-spring/annotation-testexecutionlisteners.md)
- [`@RecordApplicationEvents`](integration-spring/annotation-recordapplicationevents.md)
- [`@Transactional`](../testcontext-framework/tx.md)
- [`@Commit`](integration-spring/annotation-commit.md)
- [`@Rollback`](integration-spring/annotation-rollback.md)
- [`@Sql`](integration-spring/annotation-sql.md)
- [`@SqlConfig`](integration-spring/annotation-sqlconfig.md)
- [`@SqlMergeMode`](integration-spring/annotation-sqlmergemode.md)
- [`@TestConstructor`](#integration-testing-annotations-testconstructor)

> [!NOTE]
> The use of `@NestedTestConfiguration` typically only makes sense in conjunction
> with `@Nested` test classes in JUnit Jupiter; however, there may be other testing
> frameworks with support for Spring and nested test classes that make use of this
> annotation.

See [`@Nested` test class configuration](../testcontext-framework/support-classes.md#testcontext-junit-jupiter-nested-test-configuration) for an example and further
details.

<a id="integration-testing-annotations-junit-jupiter-enabledif"></a>

## `@EnabledIf`

`@EnabledIf` is used to signal that the annotated JUnit Jupiter test class or test method
is enabled and should be run if the supplied `expression` evaluates to `true`.
Specifically, if the expression evaluates to `Boolean.TRUE` or a `String` equal to `true`
(ignoring case), the test is enabled. When applied at the class level, all test methods
within that class are automatically enabled by default as well.

Expressions can be any of the following:

- [Spring Expression Language](../../core/expressions.md) (SpEL) expression. For example:
`@EnabledIf("#{systemProperties['os.name'].toLowerCase().contains('mac')}")`
- Placeholder for a property available in the Spring [`Environment`](../../core/beans/environment.md).
For example: `@EnabledIf("${smoke.tests.enabled}")`
- Text literal. For example: `@EnabledIf("true")`

Note, however, that a text literal that is not the result of dynamic resolution of a
property placeholder is of zero practical value, since `@EnabledIf("false")` is
equivalent to `@Disabled` and `@EnabledIf("true")` is logically meaningless.

You can use `@EnabledIf` as a meta-annotation to create custom composed annotations. For
example, you can create a custom `@EnabledOnMac` annotation as follows:

#### Java

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@EnabledIf(
	expression = "#{systemProperties['os.name'].toLowerCase().contains('mac')}",
	reason = "Enabled on Mac OS"
)
public @interface EnabledOnMac {}
```

#### Kotlin

```kotlin
@Target(AnnotationTarget.TYPE, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@EnabledIf(
		expression = "#{systemProperties['os.name'].toLowerCase().contains('mac')}",
		reason = "Enabled on Mac OS"
)
annotation class EnabledOnMac {}
```

> [!NOTE]
> `@EnabledOnMac` is meant only as an example of what is possible. If you have that exact
> use case, please use the built-in `@EnabledOnOs(MAC)` support in JUnit Jupiter.

> [!WARNING]
> Since JUnit 5.7, JUnit Jupiter also has a condition annotation named `@EnabledIf`. Thus,
> if you wish to use Spring’s `@EnabledIf` support make sure you import the annotation type
> from the correct package.

<a id="integration-testing-annotations-junit-jupiter-disabledif"></a>

## `@DisabledIf`

`@DisabledIf` is used to signal that the annotated JUnit Jupiter test class or test
method is disabled and should not be run if the supplied `expression` evaluates to
`true`. Specifically, if the expression evaluates to `Boolean.TRUE` or a `String` equal
to `true` (ignoring case), the test is disabled. When applied at the class level, all
test methods within that class are automatically disabled as well.

Expressions can be any of the following:

- [Spring Expression Language](../../core/expressions.md) (SpEL) expression. For example:
`@DisabledIf("#{systemProperties['os.name'].toLowerCase().contains('mac')}")`
- Placeholder for a property available in the Spring [`Environment`](../../core/beans/environment.md).
For example: `@DisabledIf("${smoke.tests.disabled}")`
- Text literal. For example: `@DisabledIf("true")`

Note, however, that a text literal that is not the result of dynamic resolution of a
property placeholder is of zero practical value, since `@DisabledIf("true")` is
equivalent to `@Disabled` and `@DisabledIf("false")` is logically meaningless.

You can use `@DisabledIf` as a meta-annotation to create custom composed annotations. For
example, you can create a custom `@DisabledOnMac` annotation as follows:

#### Java

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@DisabledIf(
	expression = "#{systemProperties['os.name'].toLowerCase().contains('mac')}",
	reason = "Disabled on Mac OS"
)
public @interface DisabledOnMac {}
```

#### Kotlin

```kotlin
@Target(AnnotationTarget.TYPE, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@DisabledIf(
		expression = "#{systemProperties['os.name'].toLowerCase().contains('mac')}",
		reason = "Disabled on Mac OS"
)
annotation class DisabledOnMac {}
```

> [!NOTE]
> `@DisabledOnMac` is meant only as an example of what is possible. If you have that exact
> use case, please use the built-in `@DisabledOnOs(MAC)` support in JUnit Jupiter.

> [!WARNING]
> Since JUnit 5.7, JUnit Jupiter also has a condition annotation named `@DisabledIf`. Thus,
> if you wish to use Spring’s `@DisabledIf` support make sure you import the annotation type
> from the correct package.
