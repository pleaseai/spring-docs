---
title: "View Resolvers"
source: "ROOT:web/webmvc/mvc-config/view-resolvers.adoc"
---

<a id="mvc-config-view-resolvers"></a>

# View Resolvers

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-view-resolvers)

The MVC configuration simplifies the registration of view resolvers.

The following example configures content negotiation view resolution by using JSP and Jackson as a
default `View` for JSON rendering:

#### Java

```java
@Configuration
public class WebConfiguration implements WebMvcConfigurer {

	@Override
	public void configureViewResolvers(ViewResolverRegistry registry) {
		registry.enableContentNegotiation(new MappingJackson2JsonView());
		registry.jsp();
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfiguration : WebMvcConfigurer {
	override fun configureViewResolvers(registry: ViewResolverRegistry) {
		registry.enableContentNegotiation(MappingJackson2JsonView())
		registry.jsp()
	}
}
```

#### Xml

```xml
<mvc:view-resolvers>
	<mvc:content-negotiation>
		<mvc:default-views>
			<bean class="org.springframework.web.servlet.view.json.MappingJackson2JsonView"/>
		</mvc:default-views>
	</mvc:content-negotiation>
	<mvc:jsp/>
</mvc:view-resolvers>
```

Note, however, that FreeMarker, Groovy Markup, and script templates also require
configuration of the underlying view technology. The following example works with FreeMarker:

#### Java

```java
@Configuration
public class FreeMarkerConfiguration implements WebMvcConfigurer {

	@Override
	public void configureViewResolvers(ViewResolverRegistry registry) {
		registry.enableContentNegotiation(new MappingJackson2JsonView());
		registry.freeMarker().cache(false);
	}

	@Bean
	public FreeMarkerConfigurer freeMarkerConfigurer() {
		FreeMarkerConfigurer configurer = new FreeMarkerConfigurer();
		configurer.setTemplateLoaderPath("/freemarker");
		return configurer;
	}
}
```

#### Kotlin

```kotlin
@Configuration
class FreeMarkerConfiguration : WebMvcConfigurer {

	override fun configureViewResolvers(registry: ViewResolverRegistry) {
		registry.enableContentNegotiation(MappingJackson2JsonView())
		registry.freeMarker().cache(false)
	}

	@Bean
	fun freeMarkerConfigurer() = FreeMarkerConfigurer().apply {
		setTemplateLoaderPath("/freemarker")
	}
}
```

#### Xml

```xml
<mvc:view-resolvers>
	<mvc:content-negotiation>
		<mvc:default-views>
			<bean class="org.springframework.web.servlet.view.json.MappingJackson2JsonView"/>
		</mvc:default-views>
	</mvc:content-negotiation>
	<mvc:freemarker cache-views="false"/>
</mvc:view-resolvers>

<mvc:freemarker-configurer>
	<mvc:template-loader-path location="/freemarker"/>
</mvc:freemarker-configurer>
```
