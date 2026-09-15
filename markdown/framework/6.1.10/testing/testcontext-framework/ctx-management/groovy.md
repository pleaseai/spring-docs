---
title: "Context Configuration with Groovy Scripts"
source: "ROOT:testing/testcontext-framework/ctx-management/groovy.adoc"
---

<a id="testcontext-ctx-management-groovy"></a>

# Context Configuration with Groovy Scripts

To load an `ApplicationContext` for your tests by using Groovy scripts that use the
[Groovy Bean Definition DSL](../../../core/beans/basics.md#beans-factory-groovy), you can annotate
your test class with `@ContextConfiguration` and configure the `locations` or `value`
attribute with an array that contains the resource locations of Groovy scripts. Resource
lookup semantics for Groovy scripts are the same as those described for
[XML configuration files](xml.md).

> [!TIP]
> Support for using Groovy scripts to load an `ApplicationContext` in the Spring
> TestContext Framework is enabled automatically if Groovy is on the classpath.

The following example shows how to specify Groovy configuration files:

#### Java

```java
@ExtendWith(SpringExtension.class)
// ApplicationContext will be loaded from "/AppConfig.groovy" and
// "/TestConfig.groovy" in the root of the classpath
@ContextConfiguration({"/AppConfig.groovy", "/TestConfig.Groovy"}) <1>
class MyTest {
	// class body...
}
```

1. Specifying the location of Groovy configuration files.

#### Kotlin

```kotlin
@ExtendWith(SpringExtension::class)
// ApplicationContext will be loaded from "/AppConfig.groovy" and
// "/TestConfig.groovy" in the root of the classpath
@ContextConfiguration("/AppConfig.groovy", "/TestConfig.Groovy") // <1>
class MyTest {
	// class body...
}
```

1. Specifying the location of Groovy configuration files.

If you omit both the `locations` and `value` attributes from the `@ContextConfiguration`
annotation, the TestContext framework tries to detect a default Groovy script.
Specifically, `GenericGroovyXmlContextLoader` and `GenericGroovyXmlWebContextLoader`
detect a default location based on the name of the test class. If your class is named
`com.example.MyTest`, the Groovy context loader loads your application context from
`"classpath:com/example/MyTestContext.groovy"`. The following example shows how to use
the default:

#### Java

```java
@ExtendWith(SpringExtension.class)
// ApplicationContext will be loaded from
// "classpath:com/example/MyTestContext.groovy"
@ContextConfiguration // <1>
class MyTest {
	// class body...
}
```

1. Loading configuration from the default location.

#### Kotlin

```kotlin
@ExtendWith(SpringExtension::class)
// ApplicationContext will be loaded from
// "classpath:com/example/MyTestContext.groovy"
@ContextConfiguration // <1>
class MyTest {
	// class body...
}
```

1. Loading configuration from the default location.

> [!TIP]
> You can declare both XML configuration files and Groovy scripts simultaneously by using
> the `locations` or `value` attribute of `@ContextConfiguration`. If the path to a
> configured resource location ends with `.xml`, it is loaded by using an
> `XmlBeanDefinitionReader`. Otherwise, it is loaded by using a
> `GroovyBeanDefinitionReader`.
>
> The following listing shows how to combine both in an integration test:
>
> #### Java
>
> ```java
> @ExtendWith(SpringExtension.class)
> // ApplicationContext will be loaded from
> // "/app-config.xml" and "/TestConfig.groovy"
> @ContextConfiguration({ "/app-config.xml", "/TestConfig.groovy" })
> class MyTest {
> 	// class body...
> }
> ```
>
> #### Kotlin
>
> ```kotlin
> @ExtendWith(SpringExtension::class)
> // ApplicationContext will be loaded from
> // "/app-config.xml" and "/TestConfig.groovy"
> @ContextConfiguration("/app-config.xml", "/TestConfig.groovy")
> class MyTest {
> 	// class body...
> }
> ```
