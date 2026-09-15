---
title: "Lazy-initialized Beans"
source: "ROOT:core/beans/dependencies/factory-lazy-init.adoc"
---

<a id="beans-factory-lazy-init"></a>

# Lazy-initialized Beans

By default, `ApplicationContext` implementations eagerly create and configure all
[singleton](../factory-scopes.md#beans-factory-scopes-singleton) beans as part of the initialization
process. Generally, this pre-instantiation is desirable, because errors in the
configuration or surrounding environment are discovered immediately, as opposed to hours
or even days later. When this behavior is not desirable, you can prevent
pre-instantiation of a singleton bean by marking the bean definition as being
lazy-initialized. A lazy-initialized bean tells the IoC container to create a bean
instance when it is first requested, rather than at startup.

This behavior is controlled by the `@Lazy` annotation or in XML the `lazy-init` attribute on the `<bean/>` element, as
the following example shows:

#### Java

```java
@Bean
@Lazy
ExpensiveToCreateBean lazy() {
	return new ExpensiveToCreateBean();
}

@Bean
AnotherBean notLazy() {
	return new AnotherBean();
}
```

#### Kotlin

```kotlin
@Bean
@Lazy
fun lazy(): ExpensiveToCreateBean {
	return ExpensiveToCreateBean()
}

@Bean
fun notLazy(): AnotherBean {
	return AnotherBean()
}
```

#### Xml

```xml
<bean id="lazy" class="com.something.ExpensiveToCreateBean" lazy-init="true"/>

<bean name="notLazy" class="com.something.AnotherBean"/>
```

When the preceding configuration is consumed by an `ApplicationContext`, the `lazy` bean
is not eagerly pre-instantiated when the `ApplicationContext` starts,
whereas the `notLazy` one is eagerly pre-instantiated.

However, when a lazy-initialized bean is a dependency of a singleton bean that is
not lazy-initialized, the `ApplicationContext` creates the lazy-initialized bean at
startup, because it must satisfy the singleton’s dependencies. The lazy-initialized bean
is injected into a singleton bean elsewhere that is not lazy-initialized.

You can also control lazy-initialization for a set of beans by using the `@Lazy` annotation on your `@Configuration`
annotated class or in XML using the `default-lazy-init` attribute on the `<beans/>` element, as the following example
shows:

#### Java

```java
@Configuration
@Lazy
public class LazyConfiguration {
	// No bean will be pre-instantiated...
}
```

#### Kotlin

```kotlin
@Configuration
@Lazy
class LazyConfiguration {
	// No bean will be pre-instantiated...
}
```

#### Xml

```xml
<beans default-lazy-init="true">

	<!-- No bean will be pre-instantiated... -->
</beans>
```
