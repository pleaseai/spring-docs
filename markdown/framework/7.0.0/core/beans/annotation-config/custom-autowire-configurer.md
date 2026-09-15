---
title: "Using `CustomAutowireConfigurer`"
source: "ROOT:core/beans/annotation-config/custom-autowire-configurer.adoc"
---

<a id="beans-custom-autowire-configurer"></a>

# Using `CustomAutowireConfigurer`

[`CustomAutowireConfigurer`](https://docs.spring.io/spring-framework/docs/7.0.0/javadoc-api/org/springframework/beans/factory/annotation/CustomAutowireConfigurer.html)
is a `BeanFactoryPostProcessor` that lets you register your own custom qualifier
annotation types, even if they are not annotated with Spring’s `@Qualifier` annotation.
The following example shows how to use `CustomAutowireConfigurer`:

```xml
<bean id="customAutowireConfigurer"
		class="org.springframework.beans.factory.annotation.CustomAutowireConfigurer">
	<property name="customQualifierTypes">
		<set>
			<value>example.CustomQualifier</value>
		</set>
	</property>
</bean>
```

The `AutowireCandidateResolver` determines autowire candidates by:

- The `autowire-candidate` value of each bean definition
- Any `default-autowire-candidates` patterns available on the `<beans/>` element
- The presence of `@Qualifier` annotations and any custom annotations registered
with the `CustomAutowireConfigurer`

When multiple beans qualify as autowire candidates, the determination of a “primary” is
as follows: If exactly one bean definition among the candidates has a `primary`
attribute set to `true`, it is selected.
