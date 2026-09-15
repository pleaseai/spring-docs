---
title: "Advanced XML Config"
source: "ROOT:web/webmvc/mvc-config/advanced-xml.adoc"
---

<a id="mvc-config-advanced-xml"></a>

# Advanced XML Config

The MVC namespace does not have an advanced mode. If you need to customize a property on
a bean that you cannot change otherwise, you can use the `BeanPostProcessor` lifecycle
hook of the Spring `ApplicationContext`, as the following example shows:

#### Java

```java
@Component
public class MyPostProcessor implements BeanPostProcessor {

	public Object postProcessBeforeInitialization(Object bean, String name) throws BeansException {
		// ...
		return bean;
	}
}
```

#### Kotlin

```kotlin
@Component
class MyPostProcessor : BeanPostProcessor {

	override fun postProcessBeforeInitialization(bean: Any, name: String): Any {
		// ...
		return bean
	}
}
```

Note that you need to declare `MyPostProcessor` as a bean, either explicitly in XML or
by letting it be detected through a `<component-scan/>` declaration.
