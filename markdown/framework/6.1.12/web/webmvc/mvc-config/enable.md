---
title: "Enable MVC Configuration"
source: "ROOT:web/webmvc/mvc-config/enable.adoc"
---

<a id="mvc-config-enable"></a>

# Enable MVC Configuration

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-enable)

In Java configuration, you can use the `@EnableWebMvc` annotation to enable MVC
configuration, as the following example shows:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfig {
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebMvc
class WebConfig
```

In XML configuration, you can use the `<mvc:annotation-driven>` element to enable MVC
configuration, as the following example shows:

```xml
<?xml version="1.0" encoding="UTF-8"?>
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

The preceding example registers a number of Spring MVC
[infrastructure beans](../mvc-servlet/special-bean-types.md) and adapts to dependencies
available on the classpath (for example, payload converters for JSON, XML, and others).
