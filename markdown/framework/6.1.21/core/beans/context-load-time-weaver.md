---
title: "Registering a `LoadTimeWeaver`"
source: "ROOT:core/beans/context-load-time-weaver.adoc"
---

<a id="context-load-time-weaver"></a>

# Registering a `LoadTimeWeaver`

The `LoadTimeWeaver` is used by Spring to dynamically transform classes as they are
loaded into the Java virtual machine (JVM).

To enable load-time weaving, you can add the `@EnableLoadTimeWeaving` to one of your
`@Configuration` classes, as the following example shows:

#### Java

```java
@Configuration
@EnableLoadTimeWeaving
public class AppConfig {
}
```

#### Kotlin

```kotlin
@Configuration
@EnableLoadTimeWeaving
class AppConfig
```

Alternatively, for XML configuration, you can use the `context:load-time-weaver` element:

```xml
<beans>
	<context:load-time-weaver/>
</beans>
```

Once configured for the `ApplicationContext`, any bean within that `ApplicationContext`
may implement `LoadTimeWeaverAware`, thereby receiving a reference to the load-time
weaver instance. This is particularly useful in combination with
[Spring’s JPA support](../../data-access/orm/jpa.md) where load-time weaving may be
necessary for JPA class transformation.
Consult the
[`LocalContainerEntityManagerFactoryBean`](https://docs.spring.io/spring-framework/docs/6.1.21/javadoc-api/org/springframework/orm/jpa/LocalContainerEntityManagerFactoryBean.html)
javadoc for more detail. For more on AspectJ load-time weaving, see [Load-time Weaving with AspectJ in the Spring Framework](../aop/using-aspectj.md#aop-aj-ltw).
