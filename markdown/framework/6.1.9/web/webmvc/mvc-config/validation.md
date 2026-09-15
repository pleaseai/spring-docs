---
title: "Validation"
source: "ROOT:web/webmvc/mvc-config/validation.adoc"
---

<a id="mvc-config-validation"></a>

# Validation

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-validation)

By default, if [Bean Validation](../../../core/validation/beanvalidation.md#validation-beanvalidation-overview) is present
on the classpath (for example, Hibernate Validator), the `LocalValidatorFactoryBean` is
registered as a global [Validator](../../../core/validation/validator.md) for use with `@Valid` and
`@Validated` on controller method arguments.

In Java configuration, you can customize the global `Validator` instance, as the
following example shows:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

	@Override
	public Validator getValidator() {
		// ...
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebMvc
class WebConfig : WebMvcConfigurer {

	override fun getValidator(): Validator {
		// ...
	}
}
```

The following example shows how to achieve the same configuration in XML:

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

	<mvc:annotation-driven validator="globalValidator"/>

</beans>
```

Note that you can also register `Validator` implementations locally, as the following
example shows:

#### Java

```java
@Controller
public class MyController {

	@InitBinder
	protected void initBinder(WebDataBinder binder) {
		binder.addValidators(new FooValidator());
	}
}
```

#### Kotlin

```kotlin
@Controller
class MyController {

	@InitBinder
	protected fun initBinder(binder: WebDataBinder) {
		binder.addValidators(FooValidator())
	}
}
```

> [!TIP]
> If you need to have a `LocalValidatorFactoryBean` injected somewhere, create a bean and
> mark it with `@Primary` in order to avoid conflict with the one declared in the MVC configuration.
