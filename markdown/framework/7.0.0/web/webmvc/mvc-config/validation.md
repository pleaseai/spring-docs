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

You can customize the global `Validator` instance, as the
following example shows:

#### Java

```java
@Configuration
public class WebConfiguration implements WebMvcConfigurer {

	@Override
	public Validator getValidator() {
		Validator validator = new OptionalValidatorFactoryBean();
		// ...
		return validator;
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfiguration : WebMvcConfigurer {

	override fun getValidator(): Validator {
		val validator = OptionalValidatorFactoryBean()
		// ...
		return validator
	}
}
```

#### Xml

```xml
<mvc:annotation-driven validator="globalValidator"/>
```

Note that you can also register `Validator` implementations locally, as the following
example shows:

#### Java

```java
@Controller
public class MyController {

	@InitBinder
	public void initBinder(WebDataBinder binder) {
		binder.addValidators(new FooValidator());
	}
}
```

#### Kotlin

```kotlin
@Controller
class MyController {

	@InitBinder
	fun initBinder(binder: WebDataBinder) {
		binder.addValidators(FooValidator())
	}
}
```

> [!TIP]
> If you need to have a `LocalValidatorFactoryBean` injected somewhere, create a bean and
> mark it with `@Primary` in order to avoid conflict with the one declared in the MVC configuration.
