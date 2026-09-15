---
title: "Annotation-based Container Configuration"
source: "ROOT:core/beans/annotation-config.adoc"
---

<a id="beans-annotation-config"></a>

# Annotation-based Container Configuration

#### Are annotations better than XML for configuring Spring?

> The introduction of annotation-based configuration raised the question of whether this
> approach is “better” than XML. The short answer is “it depends.” The long answer is
> that each approach has its pros and cons, and, usually, it is up to the developer to
> decide which strategy suits them better. Due to the way they are defined, annotations
> provide a lot of context in their declaration, leading to shorter and more concise
> configuration. However, XML excels at wiring up components without touching their source
> code or recompiling them. Some developers prefer having the wiring close to the source
> while others argue that annotated classes are no longer POJOs and, furthermore, that the
> configuration becomes decentralized and harder to control.
>
> No matter the choice, Spring can accommodate both styles and even mix them together.
> It is worth pointing out that through its [JavaConfig](java.md) option, Spring lets
> annotations be used in a non-invasive way, without touching the target components'
> source code and that, in terms of tooling, all configuration styles are supported by
> [Spring Tools](https://spring.io/tools) for Eclipse, Visual Studio Code, and Theia.

An alternative to XML setup is provided by annotation-based configuration, which relies
on bytecode metadata for wiring up components instead of XML declarations. Instead of
using XML to describe a bean wiring, the developer moves the configuration into the
component class itself by using annotations on the relevant class, method, or field
declaration. As mentioned in [Example: The `AutowiredAnnotationBeanPostProcessor`](factory-extension.md#beans-factory-extension-bpp-examples-aabpp), using a
`BeanPostProcessor` in conjunction with annotations is a common means of extending the
Spring IoC container. For example, the [`@Autowired`](annotation-config/autowired.md)
annotation provides the same capabilities as described in [Autowiring Collaborators](dependencies/factory-autowire.md) but
with more fine-grained control and wider applicability. In addition, Spring provides
support for JSR-250 annotations, such as `@PostConstruct` and `@PreDestroy`, as well as
support for JSR-330 (Dependency Injection for Java) annotations contained in the
`jakarta.inject` package such as `@Inject` and `@Named`. Details about those annotations
can be found in the [relevant section](standard-annotations.md).

> [!NOTE]
> Annotation injection is performed before XML injection. Thus, the XML configuration
> overrides the annotations for properties wired through both approaches.

As always, you can register the post-processors as individual bean definitions, but they
can also be implicitly registered by including the following tag in an XML-based Spring
configuration (notice the inclusion of the `context` namespace):

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

- [`ConfigurationClassPostProcessor`](https://docs.spring.io/spring-framework/docs/6.1.1/javadoc-api/org/springframework/context/annotation/ConfigurationClassPostProcessor.html)
- [`AutowiredAnnotationBeanPostProcessor`](https://docs.spring.io/spring-framework/docs/6.1.1/javadoc-api/org/springframework/beans/factory/annotation/AutowiredAnnotationBeanPostProcessor.html)
- [`CommonAnnotationBeanPostProcessor`](https://docs.spring.io/spring-framework/docs/6.1.1/javadoc-api/org/springframework/context/annotation/CommonAnnotationBeanPostProcessor.html)
- [`PersistenceAnnotationBeanPostProcessor`](https://docs.spring.io/spring-framework/docs/6.1.1/javadoc-api/org/springframework/orm/jpa/support/PersistenceAnnotationBeanPostProcessor.html)
- [`EventListenerMethodProcessor`](https://docs.spring.io/spring-framework/docs/6.1.1/javadoc-api/org/springframework/context/event/EventListenerMethodProcessor.html)

> [!NOTE]
> `<context:annotation-config/>` only looks for annotations on beans in the same
> application context in which it is defined. This means that, if you put
> `<context:annotation-config/>` in a `WebApplicationContext` for a `DispatcherServlet`,
> it only checks for `@Autowired` beans in your controllers, and not your services. See
> [The DispatcherServlet](../../web/webmvc/mvc-servlet.md) for more information.
