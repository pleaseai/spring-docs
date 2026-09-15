---
title: "Expressions in Bean Definitions"
source: "ROOT:core/expressions/beandef.adoc"
---

<a id="expressions-beandef"></a>

# Expressions in Bean Definitions

You can use SpEL expressions with XML-based or annotation-based configuration metadata for
defining `BeanDefinition` instances. In both cases, the syntax to define the expression is of the
form `#{ <expression string> }`.

<a id="expressions-beandef-xml-based"></a>

## XML Configuration

A property or constructor argument value can be set by using expressions, as the following
example shows:

```xml
<bean id="numberGuess" class="org.spring.samples.NumberGuess">
	<property name="randomNumber" value="#{ T(java.lang.Math).random() * 100.0 }"/>

	<!-- other properties -->
</bean>
```

All beans in the application context are available as predefined variables with their
common bean name. This includes standard context beans such as `environment` (of type
`org.springframework.core.env.Environment`) as well as `systemProperties` and
`systemEnvironment` (of type `Map<String, Object>`) for access to the runtime environment.

The following example shows access to the `systemProperties` bean as a SpEL variable:

```xml
<bean id="taxCalculator" class="org.spring.samples.TaxCalculator">
	<property name="defaultLocale" value="#{ systemProperties['user.region'] }"/>

	<!-- other properties -->
</bean>
```

Note that you do not have to prefix the predefined variable with the `#` symbol here.

You can also refer to other bean properties by name, as the following example shows:

```xml
<bean id="numberGuess" class="org.spring.samples.NumberGuess">
	<property name="randomNumber" value="#{ T(java.lang.Math).random() * 100.0 }"/>

	<!-- other properties -->
</bean>

<bean id="shapeGuess" class="org.spring.samples.ShapeGuess">
	<property name="initialShapeSeed" value="#{ numberGuess.randomNumber }"/>

	<!-- other properties -->
</bean>
```

<a id="expressions-beandef-annotation-based"></a>

## Annotation Configuration

To specify a default value, you can place the `@Value` annotation on fields, methods,
and method or constructor parameters.

The following example sets the default value of a field:

#### Java

```java
public class FieldValueTestBean {

	@Value("#{ systemProperties['user.region'] }")
	private String defaultLocale;

	public void setDefaultLocale(String defaultLocale) {
		this.defaultLocale = defaultLocale;
	}

	public String getDefaultLocale() {
		return this.defaultLocale;
	}
}
```

#### Kotlin

```kotlin
class FieldValueTestBean {

	@Value("#{ systemProperties['user.region'] }")
	var defaultLocale: String? = null
}
```

The following example shows the equivalent but on a property setter method:

#### Java

```java
public class PropertyValueTestBean {

	private String defaultLocale;

	@Value("#{ systemProperties['user.region'] }")
	public void setDefaultLocale(String defaultLocale) {
		this.defaultLocale = defaultLocale;
	}

	public String getDefaultLocale() {
		return this.defaultLocale;
	}
}
```

#### Kotlin

```kotlin
class PropertyValueTestBean {

	@Value("#{ systemProperties['user.region'] }")
	var defaultLocale: String? = null
}
```

Autowired methods and constructors can also use the `@Value` annotation, as the following
examples show:

#### Java

```java
public class SimpleMovieLister {

	private MovieFinder movieFinder;
	private String defaultLocale;

	@Autowired
	public void configure(MovieFinder movieFinder,
			@Value("#{ systemProperties['user.region'] }") String defaultLocale) {
		this.movieFinder = movieFinder;
		this.defaultLocale = defaultLocale;
	}

	// ...
}
```

#### Kotlin

```kotlin
class SimpleMovieLister {

	private lateinit var movieFinder: MovieFinder
	private lateinit var defaultLocale: String

	@Autowired
	fun configure(movieFinder: MovieFinder,
				@Value("#{ systemProperties['user.region'] }") defaultLocale: String) {
		this.movieFinder = movieFinder
		this.defaultLocale = defaultLocale
	}

	// ...
}
```

#### Java

```java
public class MovieRecommender {

	private String defaultLocale;

	private CustomerPreferenceDao customerPreferenceDao;

	public MovieRecommender(CustomerPreferenceDao customerPreferenceDao,
			@Value("#{systemProperties['user.country']}") String defaultLocale) {
		this.customerPreferenceDao = customerPreferenceDao;
		this.defaultLocale = defaultLocale;
	}

	// ...
}
```

#### Kotlin

```kotlin
class MovieRecommender(private val customerPreferenceDao: CustomerPreferenceDao,
			@Value("#{systemProperties['user.country']}") private val defaultLocale: String) {
	// ...
}
```
