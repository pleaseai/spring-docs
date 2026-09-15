---
title: "Interceptors"
source: "ROOT:web/webmvc/mvc-config/interceptors.adoc"
---

<a id="mvc-config-interceptors"></a>

# Interceptors

You can register interceptors to apply to incoming requests, as the following example shows:

#### Java

```java
@Configuration
public class WebConfiguration implements WebMvcConfigurer {

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new LocaleChangeInterceptor());
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfiguration : WebMvcConfigurer {

	override fun addInterceptors(registry: InterceptorRegistry) {
		registry.addInterceptor(LocaleChangeInterceptor())
		registry.addInterceptor(ThemeChangeInterceptor()).addPathPatterns("/**").excludePathPatterns("/admin/**")
	}
}
```

#### Xml

```xml
<mvc:interceptors>
	<bean class="org.springframework.web.servlet.i18n.LocaleChangeInterceptor"/>
	<mvc:interceptor>
		<mvc:mapping path="/**"/>
		<mvc:exclude-mapping path="/admin/**"/>
		<bean class="org.springframework.web.servlet.theme.ThemeChangeInterceptor"/>
	</mvc:interceptor>
</mvc:interceptors>
```

> [!WARNING]
> Interceptors are not ideally suited as a security layer due to the potential for
> a mismatch with annotated controller path matching. Generally, we recommend using Spring
> Security, or alternatively a similar approach integrated with the Servlet filter chain,
> and applied as early as possible.

> [!NOTE]
> The XML config declares interceptors as `MappedInterceptor` beans, and those are in
> turn detected by any `HandlerMapping` bean, including those from other frameworks.
> By contrast, the Java config passes interceptors only to the  `HandlerMapping` beans it manages.
> To re-use the same interceptors across Spring MVC and other framework `HandlerMapping`
> beans with the MVC Java config, either declare `MappedInterceptor` beans (and don’t
> manually add them in the Java config), or configure the same interceptors in both
> the Java config and in other `HandlerMapping` beans.
