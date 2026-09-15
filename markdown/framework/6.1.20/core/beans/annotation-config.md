---
title: "Annotation-based Container Configuration"
source: "ROOT:core/beans/annotation-config.adoc"
---

<a id="beans-annotation-config"></a>

# Annotation-based Container Configuration

Spring provides comprehensive support for annotation-based configuration, operating on
metadata in the component class itself by using annotations on the relevant class,
method, or field declaration. As mentioned in
[Example: The `AutowiredAnnotationBeanPostProcessor`](factory-extension.md#beans-factory-extension-bpp-examples-aabpp),
Spring uses `BeanPostProcessors` in conjunction with annotations to make the core IOC
container aware of specific annotations.

For example, the [`@Autowired`](annotation-config/autowired.md)
annotation provides the same capabilities as described in
[Autowiring Collaborators](dependencies/factory-autowire.md) but
with more fine-grained control and wider applicability. In addition, Spring provides
support for JSR-250 annotations, such as `@PostConstruct` and `@PreDestroy`, as well as
support for JSR-330 (Dependency Injection for Java) annotations contained in the
`jakarta.inject` package such as `@Inject` and `@Named`. Details about those annotations
can be found in the [relevant section](standard-annotations.md).

> [!NOTE]
> Annotation injection is performed before external property injection. Thus, external
> configuration (e.g. XML-specified bean properties) effectively overrides the annotations
> for properties when wired through mixed approaches.

Technically, you can register the post-processors as individual bean definitions, but they
are implicitly registered in an `AnnotationConfigApplicationContext` already.

In an XML-based Spring setup, you may include the following configuration tag to enable
mixing and matching with annotation-based configuration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:context="http://www.springframework.org/schema/context"
	xsi:schemaLocation="http://www.springframework.org/schema/beans
		https://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/context
		https://www.springframework.org/schema/context/spring-context.xsd">

	<context:annotation-config/>

</beans>
```

The `<context:annotation-config/>` element implicitly registers the following post-processors:

- [`ConfigurationClassPostProcessor`](https://docs.spring.io/spring-framework/docs/6.1.20/javadoc-api/org/springframework/context/annotation/ConfigurationClassPostProcessor.html)
- [`AutowiredAnnotationBeanPostProcessor`](https://docs.spring.io/spring-framework/docs/6.1.20/javadoc-api/org/springframework/beans/factory/annotation/AutowiredAnnotationBeanPostProcessor.html)
- [`CommonAnnotationBeanPostProcessor`](https://docs.spring.io/spring-framework/docs/6.1.20/javadoc-api/org/springframework/context/annotation/CommonAnnotationBeanPostProcessor.html)
- [`PersistenceAnnotationBeanPostProcessor`](https://docs.spring.io/spring-framework/docs/6.1.20/javadoc-api/org/springframework/orm/jpa/support/PersistenceAnnotationBeanPostProcessor.html)
- [`EventListenerMethodProcessor`](https://docs.spring.io/spring-framework/docs/6.1.20/javadoc-api/org/springframework/context/event/EventListenerMethodProcessor.html)

> [!NOTE]
> `<context:annotation-config/>` only looks for annotations on beans in the same
> application context in which it is defined. This means that, if you put
> `<context:annotation-config/>` in a `WebApplicationContext` for a `DispatcherServlet`,
> it only checks for `@Autowired` beans in your controllers, and not your services. See
> [The DispatcherServlet](../../web/webmvc/mvc-servlet.md) for more information.
