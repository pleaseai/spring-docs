---
title: "`@WebAppConfiguration`"
source: "ROOT:testing/annotations/integration-spring/annotation-webappconfiguration.adoc"
---

<a id="spring-testing-annotation-webappconfiguration"></a>

# `@WebAppConfiguration`

`@WebAppConfiguration` is a class-level annotation that you can use to declare that the
`ApplicationContext` loaded for an integration test should be a `WebApplicationContext`.
The mere presence of `@WebAppConfiguration` on a test class ensures that a
`WebApplicationContext` is loaded for the test, using the default value of
`"file:src/main/webapp"` for the path to the root of the web application (that is, the
resource base path). The resource base path is used behind the scenes to create a
`MockServletContext`, which serves as the `ServletContext` for the test’s
`WebApplicationContext`.

The following example shows how to use the `@WebAppConfiguration` annotation:

#### Java

```java
@ContextConfiguration
@WebAppConfiguration // <1>
class WebAppTests {
	// class body...
}
```

1. The `@WebAppConfiguration` annotation.

#### Kotlin

```kotlin
@ContextConfiguration
@WebAppConfiguration // <1>
class WebAppTests {
	// class body...
}
```

1. The `@WebAppConfiguration` annotation.

To override the default, you can specify a different base resource path by using the
implicit `value` attribute. Both `classpath:` and `file:` resource prefixes are
supported. If no resource prefix is supplied, the path is assumed to be a file system
resource. The following example shows how to specify a classpath resource:

#### Java

```java
@ContextConfiguration
@WebAppConfiguration("classpath:test-web-resources") // <1>
class WebAppTests {
	// class body...
}
```

1. Specifying a classpath resource.

#### Kotlin

```kotlin
@ContextConfiguration
@WebAppConfiguration("classpath:test-web-resources") // <1>
class WebAppTests {
	// class body...
}
```

1. Specifying a classpath resource.

Note that `@WebAppConfiguration` must be used in conjunction with
`@ContextConfiguration`, either within a single test class or within a test class
hierarchy. See the
[`@WebAppConfiguration`](https://docs.spring.io/spring-framework/docs/6.1.13/javadoc-api/org/springframework/test/context/web/WebAppConfiguration.html)
javadoc for further details.
