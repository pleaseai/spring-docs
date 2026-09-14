---
title: "Validation"
source: "reference:io/validation.adoc"
---

<a id="io.validation"></a>

# Validation

The method validation feature supported by Bean Validation 1.1 is automatically enabled as long as a JSR-303 implementation (such as Hibernate validator) is on the classpath.
This lets bean methods be annotated with `jakarta.validation` constraints on their parameters and/or on their return value.
Target classes with such annotated methods need to be annotated with the `@Validated` annotation at the type level for their methods to be searched for inline constraint annotations.

For instance, the following service triggers the validation of the first argument, making sure its size is between 8 and 10:

#### Java

```java
import jakarta.validation.constraints.Size;

import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

@Service
@Validated
public class MyBean {

	public Archive findByCodeAndAuthor(@Size(min = 8, max = 10) String code, Author author) {
		return ...
	}

}
```

#### Kotlin

```kotlin
import jakarta.validation.constraints.Size
import org.springframework.stereotype.Service
import org.springframework.validation.annotation.Validated

@Service
@Validated
class MyBean {

	fun findByCodeAndAuthor(code: @Size(min = 8, max = 10) String?, author: Author?): Archive? {
		return null
	}

}
```

The application’s `MessageSource` is used when resolving `{parameters}` in constraint messages.
This allows you to use [your application’s `messages.properties` files](../features/internationalization.md) for Bean Validation messages.
Once the parameters have been resolved, message interpolation is completed using Bean Validation’s default interpolator.

To customize the `Configuration` used to build the `ValidatorFactory`, define a `ValidationConfigurationCustomizer` bean.
When multiple customizer beans are defined, they are called in order based on their `@Order` annotation or `Ordered` implementation.
