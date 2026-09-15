---
title: "MVC Config API"
source: "ROOT:web/webmvc/mvc-config/customize.adoc"
---

<a id="mvc-config-customize"></a>

# MVC Config API

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-customize)

In Java configuration, you can implement the `WebMvcConfigurer` interface, as the
following example shows:

#### Java

```java
@Configuration
public class WebConfiguration implements WebMvcConfigurer {

	// Implement configuration methods...
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfiguration : WebMvcConfigurer {

	// Implement configuration methods...
}
```

In XML, you can check attributes and sub-elements of `<mvc:annotation-driven/>`. You can
view the [Spring MVC XML schema](https://schema.spring.io/mvc/spring-mvc.xsd) or use
the code completion feature of your IDE to discover what attributes and
sub-elements are available.
