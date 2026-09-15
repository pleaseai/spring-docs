---
title: "Type Conversion"
source: "ROOT:web/webmvc/mvc-config/conversion.adoc"
---

<a id="mvc-config-conversion"></a>

# Type Conversion

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-conversion)

By default, formatters for various number and date types are installed, along with support
for customization via `@NumberFormat` and `@DateTimeFormat` on fields and parameters.

To register custom formatters and converters in Java config, use the following:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void addFormatters(FormatterRegistry registry) {
		// ...
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebMvc
class WebConfig : WebMvcConfigurer {

	override fun addFormatters(registry: FormatterRegistry) {
		// ...
	}
}
```

To do the same in XML config, use the following:

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

	<mvc:annotation-driven conversion-service="conversionService"/>

	<bean id="conversionService"
			class="org.springframework.format.support.FormattingConversionServiceFactoryBean">
		<property name="converters">
			<set>
				<bean class="org.example.MyConverter"/>
			</set>
		</property>
		<property name="formatters">
			<set>
				<bean class="org.example.MyFormatter"/>
				<bean class="org.example.MyAnnotationFormatterFactory"/>
			</set>
		</property>
		<property name="formatterRegistrars">
			<set>
				<bean class="org.example.MyFormatterRegistrar"/>
			</set>
		</property>
	</bean>

</beans>
```

By default Spring MVC considers the request Locale when parsing and formatting date
values. This works for forms where dates are represented as Strings with "input" form
fields. For "date" and "time" form fields, however, browsers use a fixed format defined
in the HTML spec. For such cases date and time formatting can be customized as follows:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void addFormatters(FormatterRegistry registry) {
		DateTimeFormatterRegistrar registrar = new DateTimeFormatterRegistrar();
		registrar.setUseIsoFormat(true);
		registrar.registerFormatters(registry);
     	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebMvc
class WebConfig : WebMvcConfigurer {

	override fun addFormatters(registry: FormatterRegistry) {
		val registrar = DateTimeFormatterRegistrar()
		registrar.setUseIsoFormat(true)
		registrar.registerFormatters(registry)
	}
}
```

> [!NOTE]
> See [the `FormatterRegistrar` SPI](../../../core/validation/format.md#format-FormatterRegistrar-SPI)
> and the `FormattingConversionServiceFactoryBean` for more information on when to use
> FormatterRegistrar implementations.
