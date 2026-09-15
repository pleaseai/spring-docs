---
title: "Enable MVC Configuration"
source: "ROOT:web/webmvc/mvc-config/enable.adoc"
---

<a id="mvc-config-enable"></a>

# Enable MVC Configuration

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-enable)

You can use the `@EnableWebMvc` annotation to enable MVC configuration with programmatic configuration, or `<mvc:annotation-driven>` with XML configuration, as the following example shows:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfiguration {
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebMvc
class WebConfiguration {
}
```

#### Xml

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:mvc="http://www.springframework.org/schema/mvc"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	   xsi:schemaLocation="
			http://www.springframework.org/schema/beans
			https://www.springframework.org/schema/beans/spring-beans.xsd
			http://www.springframework.org/schema/mvc
			https://www.springframework.org/schema/mvc/spring-mvc.xsd">

	<mvc:annotation-driven/>

</beans>
```

> [!NOTE]
> When using Spring Boot, you may want to use `@Configuration` classes of type `WebMvcConfigurer` but without `@EnableWebMvc` to keep Spring Boot MVC customizations. See more details in [the MVC Config API section](customize.md) and in [the dedicated Spring Boot documentation](https://docs.spring.io/spring-boot/reference/web/servlet.html#web.servlet.spring-mvc.auto-configuration).

The preceding example registers a number of Spring MVC
[infrastructure beans](../mvc-servlet/special-bean-types.md) and adapts to dependencies
available on the classpath (for example, payload converters for JSON, XML, and others).
