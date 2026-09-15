---
title: "Meta-Annotation Support for Testing"
source: "ROOT:testing/annotations/integration-meta.adoc"
---

<a id="integration-testing-annotations-meta"></a>

# Meta-Annotation Support for Testing

You can use most test-related annotations as
[meta-annotations](../../core/beans/classpath-scanning.md#beans-meta-annotations) to
create custom composed annotations and reduce configuration duplication across a test
suite.

For example, you can use each of the following as a meta-annotation in conjunction with
the [TestContext framework](../testcontext-framework.md).

- `@BootstrapWith`
- `@ContextConfiguration`
- `@ContextHierarchy`
- `@ContextCustomizerFactories`
- `@ActiveProfiles`
- `@TestPropertySource`
- `@DirtiesContext`
- `@WebAppConfiguration`
- `@TestExecutionListeners`
- `@Transactional`
- `@BeforeTransaction`
- `@AfterTransaction`
- `@Commit`
- `@Rollback`
- `@Sql`
- `@SqlConfig`
- `@SqlMergeMode`
- `@SqlGroup`
- `@Repeat` *(only supported on JUnit 4)*
- `@Timed` *(only supported on JUnit 4)*
- `@IfProfileValue` *(only supported on JUnit 4)*
- `@ProfileValueSourceConfiguration` *(only supported on JUnit 4)*
- `@SpringJUnitConfig` *(only supported on JUnit Jupiter)*
- `@SpringJUnitWebConfig` *(only supported on JUnit Jupiter)*
- `@TestConstructor` *(only supported on JUnit Jupiter)*
- `@NestedTestConfiguration` *(only supported on JUnit Jupiter)*
- `@EnabledIf` *(only supported on JUnit Jupiter)*
- `@DisabledIf` *(only supported on JUnit Jupiter)*

Consider the following test classes that use the `SpringExtension` with JUnit Jupiter:

#### Java

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {AppConfig.class, TestDataAccessConfig.class})
@ActiveProfiles("dev")
@Transactional
class OrderRepositoryTests { }

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {AppConfig.class, TestDataAccessConfig.class})
@ActiveProfiles("dev")
@Transactional
class UserRepositoryTests { }
```

#### Kotlin

```kotlin
@ExtendWith(SpringExtension::class)
@ContextConfiguration(classes = [AppConfig::class, TestDataAccessConfig::class])
@ActiveProfiles("dev")
@Transactional
class OrderRepositoryTests { }

@ExtendWith(SpringExtension::class)
@ContextConfiguration(classes = [AppConfig::class, TestDataAccessConfig::class])
@ActiveProfiles("dev")
@Transactional
class UserRepositoryTests { }
```

If we discover that we are repeating the preceding configuration across our test suite,
we can reduce the duplication by introducing a custom composed annotation that
centralizes the common test configuration for Spring and JUnit Jupiter, as follows:

#### Java

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {AppConfig.class, TestDataAccessConfig.class})
@ActiveProfiles("dev")
@Transactional
public @interface TransactionalDevTestConfig { }
```

#### Kotlin

```kotlin
@Target(AnnotationTarget.TYPE)
@Retention(AnnotationRetention.RUNTIME)
@ExtendWith(SpringExtension::class)
@ContextConfiguration(classes = [AppConfig::class, TestDataAccessConfig::class])
@ActiveProfiles("dev")
@Transactional
annotation class TransactionalDevTestConfig { }
```

Then we can use our custom `@TransactionalDevTestConfig` annotation to simplify the
configuration of individual JUnit Jupiter based test classes, as follows:

#### Java

```java
@TransactionalDevTestConfig
class OrderRepositoryTests { }

@TransactionalDevTestConfig
class UserRepositoryTests { }
```

#### Kotlin

```kotlin
@TransactionalDevTestConfig
class OrderRepositoryTests { }

@TransactionalDevTestConfig
class UserRepositoryTests { }
```

Since JUnit Jupiter supports the use of `@Test`, `@RepeatedTest`, `ParameterizedTest`,
and others as meta-annotations, you can also create custom composed annotations at the
test method level. For example, if we wish to create a composed annotation that combines
the `@Test` and `@Tag` annotations from JUnit Jupiter with the `@Transactional`
annotation from Spring, we could create an `@TransactionalIntegrationTest` annotation, as
follows:

#### Java

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Transactional
@Tag("integration-test") // org.junit.jupiter.api.Tag
@Test // org.junit.jupiter.api.Test
public @interface TransactionalIntegrationTest { }
```

#### Kotlin

```kotlin
@Target(AnnotationTarget.TYPE)
@Retention(AnnotationRetention.RUNTIME)
@Transactional
@Tag("integration-test") // org.junit.jupiter.api.Tag
@Test // org.junit.jupiter.api.Test
annotation class TransactionalIntegrationTest { }
```

Then we can use our custom `@TransactionalIntegrationTest` annotation to simplify the
configuration of individual JUnit Jupiter based test methods, as follows:

#### Java

```java
@TransactionalIntegrationTest
void saveOrder() { }

@TransactionalIntegrationTest
void deleteOrder() { }
```

#### Kotlin

```kotlin
@TransactionalIntegrationTest
fun saveOrder() { }

@TransactionalIntegrationTest
fun deleteOrder() { }
```

For further details, see the
[Spring Annotation Programming Model](https://github.com/spring-projects/spring-framework/wiki/Spring-Annotation-Programming-Model)
wiki page.
