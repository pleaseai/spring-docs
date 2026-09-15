---
title: "View Resolvers"
source: "ROOT:web/webmvc/mvc-config/view-resolvers.adoc"
---

<a id="mvc-config-view-resolvers"></a>

# View Resolvers

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-view-resolvers)

The MVC configuration simplifies the registration of view resolvers.

The following Java configuration example configures content negotiation view
resolution by using JSP and Jackson as a default `View` for JSON rendering:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

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
@EnableWebMvc
class WebConfig : WebMvcConfigurer {

	override fun configureViewResolvers(registry: ViewResolverRegistry) {
		registry.enableContentNegotiation(MappingJackson2JsonView())
		registry.jsp()
	}
}
```

The following example shows how to achieve the same configuration in XML:

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
configuration of the underlying view technology.

The MVC namespace provides dedicated elements. The following example works with FreeMarker:

```xml
<mvc:view-resolvers>
	<mvc:content-negotiation>
		<mvc:default-views>
			<bean class="org.springframework.web.servlet.view.json.MappingJackson2JsonView"/>
		</mvc:default-views>
	</mvc:content-negotiation>
	<mvc:freemarker cache="false"/>
</mvc:view-resolvers>

<mvc:freemarker-configurer>
	<mvc:template-loader-path location="/freemarker"/>
</mvc:freemarker-configurer>
```

In Java configuration, you can add the respective `Configurer` bean,
as the following example shows:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

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
@EnableWebMvc
class WebConfig : WebMvcConfigurer {

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
