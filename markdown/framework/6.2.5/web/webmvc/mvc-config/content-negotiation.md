---
title: "Content Types"
source: "ROOT:web/webmvc/mvc-config/content-negotiation.adoc"
---

<a id="mvc-config-content-negotiation"></a>

# Content Types

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-content-negotiation)

You can configure how Spring MVC determines the requested media types from the request
(for example, `Accept` header, URL path extension, query parameter, and others).

By default, only the `Accept` header is checked.

If you must use URL-based content type resolution, consider using the query parameter
strategy over path extensions. See
[Suffix Match](../mvc-controller/ann-requestmapping.md#mvc-ann-requestmapping-suffix-pattern-match) and [Suffix Match and RFD](../mvc-controller/ann-requestmapping.md#mvc-ann-requestmapping-rfd) for
more details.

You can customize requested content type resolution, as the following example shows:

#### Java

```java
@Configuration
public class WebConfiguration implements WebMvcConfigurer {

	@Override
	public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
		configurer.mediaType("json", MediaType.APPLICATION_JSON);
		configurer.mediaType("xml", MediaType.APPLICATION_XML);
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfiguration : WebMvcConfigurer {

	override fun configureContentNegotiation(configurer: ContentNegotiationConfigurer) {
		configurer.mediaType("json", MediaType.APPLICATION_JSON)
		configurer.mediaType("xml", MediaType.APPLICATION_XML)
	}
}
```

#### Xml

```xml
<mvc:annotation-driven content-negotiation-manager="contentNegotiationManager"/>

<bean id="contentNegotiationManager" class="org.springframework.web.accept.ContentNegotiationManagerFactoryBean">
<property name="mediaTypes">
	<value>
		json=application/json
		xml=application/xml
	</value>
</property>
</bean>
```
