---
title: "Using `depends-on`"
source: "ROOT:core/beans/dependencies/factory-dependson.adoc"
---

<a id="beans-factory-dependson"></a>

# Using `depends-on`

If a bean is a dependency of another bean, that usually means that one bean is set as a
property of another. Typically you accomplish this with the
[`<ref/>` element>](factory-properties-detailed.md#beans-ref-element)
in XML-based metadata or through [autowiring](factory-autowire.md).

However, sometimes dependencies between beans are less direct. An example is when a static
initializer in a class needs to be triggered, such as for database driver registration.
The `depends-on` attribute or `@DependsOn` annotation can explicitly force one or more beans
to be initialized before the bean using this element is initialized. The following example
uses the `depends-on` attribute to express a dependency on a single bean:

```xml
<bean id="beanOne" class="ExampleBean" depends-on="manager"/>
<bean id="manager" class="ManagerBean" />
```

To express a dependency on multiple beans, supply a list of bean names as the value of
the `depends-on` attribute (commas, whitespace, and semicolons are valid
delimiters):

```xml
<bean id="beanOne" class="ExampleBean" depends-on="manager,accountDao">
	<property name="manager" ref="manager" />
</bean>

<bean id="manager" class="ManagerBean" />
<bean id="accountDao" class="x.y.jdbc.JdbcAccountDao" />
```

> [!NOTE]
> The `depends-on` attribute can specify both an initialization-time dependency and,
> in the case of [singleton](../factory-scopes.md#beans-factory-scopes-singleton)
> beans only, a corresponding destruction-time dependency. Dependent beans that define a
> `depends-on` relationship with a given bean are destroyed first, prior to the given bean
> itself being destroyed. Thus, `depends-on` can also control shutdown order.
