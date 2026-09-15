---
title: "`@ContextConfiguration`"
source: "ROOT:testing/annotations/integration-spring/annotation-contextconfiguration.adoc"
---

<a id="spring-testing-annotation-contextconfiguration"></a>

# `@ContextConfiguration`

`@ContextConfiguration` is an annotation that can be applied to a test class to configure
metadata that is used to determine how to load and configure an `ApplicationContext` for
integration tests. Specifically, `@ContextConfiguration` declares the application context
resource `locations` or the component `classes` used to load the context.

Resource locations are typically XML configuration files or Groovy scripts located in the
classpath, while component classes are typically `@Configuration` classes. However,
resource locations can also refer to files and scripts in the file system, and component
classes can be `@Component` classes, `@Service` classes, and so on. See
[Component Classes](../../testcontext-framework/ctx-management/javaconfig.md#testcontext-ctx-management-javaconfig-component-classes)
for further details.

The following example shows a `@ContextConfiguration` annotation that refers to an XML
file:

#### Java

```java
@ContextConfiguration("/test-config.xml") // <1>
class XmlApplicationContextTests {
	// class body...
}
```

1. Referring to an XML file.

#### Kotlin

```kotlin
@ContextConfiguration("/test-config.xml") // <1>
class XmlApplicationContextTests {
	// class body...
}
```

1. Referring to an XML file.

The following example shows a `@ContextConfiguration` annotation that refers to a class:

#### Java

```java
@ContextConfiguration(classes = TestConfig.class) // <1>
class ConfigClassApplicationContextTests {
	// class body...
}
```

1. Referring to a class.

#### Kotlin

```kotlin
@ContextConfiguration(classes = [TestConfig::class]) // <1>
class ConfigClassApplicationContextTests {
	// class body...
}
```

1. Referring to a class.

As an alternative or in addition to declaring resource locations or component classes,
you can use `@ContextConfiguration` to declare `ApplicationContextInitializer` classes.
The following example shows such a case:

#### Java

```java
@ContextConfiguration(initializers = CustomContextInitializer.class) // <1>
class ContextInitializerTests {
	// class body...
}
```

1. Declaring an initializer class.

#### Kotlin

```kotlin
@ContextConfiguration(initializers = [CustomContextInitializer::class]) // <1>
class ContextInitializerTests {
	// class body...
}
```

1. Declaring an initializer class.

You can optionally use `@ContextConfiguration` to declare the `ContextLoader` strategy as
well. Note, however, that you typically do not need to explicitly configure the loader,
since the default loader supports `initializers` and either resource `locations` or
component `classes`.

The following example uses both a location and a loader:

#### Java

```java
@ContextConfiguration(locations = "/test-context.xml", loader = CustomContextLoader.class) // <1>
class CustomLoaderXmlApplicationContextTests {
	// class body...
}
```

1. Configuring both a location and a custom loader.

#### Kotlin

```kotlin
@ContextConfiguration("/test-context.xml", loader = CustomContextLoader::class) // <1>
class CustomLoaderXmlApplicationContextTests {
	// class body...
}
```

1. Configuring both a location and a custom loader.

> [!NOTE]
> `@ContextConfiguration` provides support for inheriting resource locations or
> configuration classes as well as context initializers that are declared by superclasses
> or enclosing classes.

See [Context Management](../../testcontext-framework/ctx-management.md),
[`@Nested` test class configuration](../../testcontext-framework/support-classes.md#testcontext-junit-jupiter-nested-test-configuration),
and the [`@ContextConfiguration`](https://docs.spring.io/spring-framework/docs/6.2.19/javadoc-api/org/springframework/test/context/ContextConfiguration.html)
javadocs for further details.
