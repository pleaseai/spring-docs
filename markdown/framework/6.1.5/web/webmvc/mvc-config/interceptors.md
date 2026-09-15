---
title: "Interceptors"
source: "ROOT:web/webmvc/mvc-config/interceptors.adoc"
---

<a id="mvc-config-interceptors"></a>

# Interceptors

In Java configuration, you can register interceptors to apply to incoming requests, as
the following example shows:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new LocaleChangeInterceptor());
		registry.addInterceptor(new ThemeChangeInterceptor()).addPathPatterns("/**").excludePathPatterns("/admin/**");
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebMvc
class WebConfig : WebMvcConfigurer {

	override fun addInterceptors(registry: InterceptorRegistry) {
		registry.addInterceptor(LocaleChangeInterceptor())
		registry.addInterceptor(ThemeChangeInterceptor()).addPathPatterns("/**").excludePathPatterns("/admin/**")
	}
}
```

The following example shows how to achieve the same configuration in XML:

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

> [!NOTE]
> Interceptors are not ideally suited as a security layer due to the potential
> for a mismatch with annotated controller path matching, which can also match trailing
> slashes and path extensions transparently, along with other path matching options. Many
> of these options have been deprecated but the potential for a mismatch remains.
> Generally, we recommend using Spring Security which includes a dedicated
> [MvcRequestMatcher](https://docs.spring.io/spring-security/reference/servlet/integrations/mvc.html#mvc-requestmatcher)
> to align with Spring MVC path matching and also has a security firewall that blocks many
> unwanted characters in URL paths.

> [!NOTE]
> The XML config declares interceptors as `MappedInterceptor` beans, and those are in
> turn detected by any `HandlerMapping` bean, including those from other frameworks.
> By contrast, the Java config passes interceptors only to the  `HandlerMapping` beans it manages.
> To re-use the same interceptors across Spring MVC and other framework `HandlerMapping`
> beans with the MVC Java config, either declare `MappedInterceptor` beans (and don’t
> manually add them in the Java config), or configure the same interceptors in both
> the Java config and in other `HandlerMapping` beans.
