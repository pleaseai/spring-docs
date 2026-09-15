---
title: "Expressions in Bean Definitions"
source: "ROOT:core/expressions/beandef.adoc"
---

<a id="expressions-beandef"></a>

# Expressions in Bean Definitions

You can use SpEL expressions with configuration metadata for defining bean instances. In both
cases, the syntax to define the expression is of the form `#{ <expression string> }`.

All beans in the application context are available as predefined variables with their
common bean name. This includes standard context beans such as `environment` (of type
`org.springframework.core.env.Environment`) as well as `systemProperties` and
`systemEnvironment` (of type `Map<String, Object>`) for access to the runtime environment.

To specify a default value, you can place the `@Value` annotation on fields, methods,
and method or constructor parameters (or XML equivalent).

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

	@field:Value("#{ systemProperties['user.region'] }")
	lateinit var defaultLocale: String
}
```

Note that you do not have to prefix the predefined variable with the `#` symbol here.

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

	@set:Value("#{ systemProperties['user.region'] }")
	lateinit var defaultLocale: String
}
```

#### Xml

```xml
<bean id="testBean" class="org.springframework.docs.core.expressions.expressionsbeandef.PropertyValueTestBean">
	<property name="defaultLocale" value="#{ systemProperties['user.region'] }"/>
</bean>
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
					   @Value("#{systemProperties['user.country']}")
					   private val defaultLocale: String) {
	// ...
}
```

#### Xml

```xml
<bean id="testBean" class="org.springframework.docs.core.expressions.expressionsbeandef.MovieRecommender">
	<constructor-arg ref="customerPreferenceDao"/>
	<constructor-arg value="#{ systemProperties['user.country'] }"/>
</bean>
```

You can also refer to other bean properties by name, as the following example shows:

#### Java

```java
public class ShapeGuess {

	private double initialShapeSeed;

	@Value("#{ numberGuess.randomNumber }")
	public void setInitialShapeSeed(double initialShapeSeed) {
		this.initialShapeSeed = initialShapeSeed;
	}

	public double getInitialShapeSeed() {
		return initialShapeSeed;
	}
}
```

#### Kotlin

```kotlin
class ShapeGuess {

	@set:Value("#{ numberGuess.randomNumber }")
	var initialShapeSeed: Double = 0.0
}
```

#### Xml

```xml
<bean id="shapeGuess" class="org.springframework.docs.core.expressions.expressionsbeandef.ShapeGuess">
	<property name="initialShapeSeed" value="#{ numberGuess.randomNumber }"/>
</bean>
```
