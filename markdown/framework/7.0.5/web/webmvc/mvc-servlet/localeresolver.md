---
title: "Locale"
source: "ROOT:web/webmvc/mvc-servlet/localeresolver.adoc"
---

<a id="mvc-localeresolver"></a>

# Locale

Most parts of Spring’s architecture support internationalization, as the Spring web
MVC framework does. `DispatcherServlet` lets you automatically resolve messages
by using the client’s locale. This is done with `LocaleResolver` objects.

When a request comes in, the `DispatcherServlet` looks for a locale resolver and, if it
finds one, it tries to use it to set the locale. By using the `RequestContext.getLocale()`
method, you can always retrieve the locale that was resolved by the locale resolver.

In addition to automatic locale resolution, you can also attach an interceptor to the
handler mapping (see [Interception](handlermapping-interceptor.md) for more information on handler
mapping interceptors) to change the locale under specific circumstances (for example,
based on a parameter in the request).

Locale resolvers and interceptors are defined in the
`org.springframework.web.servlet.i18n` package and are configured in your application
context in the normal way. The following selection of locale resolvers is included in
Spring.

- [Time Zone](#mvc-timezone)
- [Header Resolver](#mvc-localeresolver-acceptheader)
- [Cookie Resolver](#mvc-localeresolver-cookie)
- [Session Resolver](#mvc-localeresolver-session)
- [Locale Interceptor](#mvc-localeresolver-interceptor)

<a id="mvc-timezone"></a>

## Time Zone

In addition to obtaining the client’s locale, it is often useful to know its time zone.
The `LocaleContextResolver` interface offers an extension to `LocaleResolver` that lets
resolvers provide a richer `LocaleContext`, which may include time zone information.

When available, the user’s `TimeZone` can be obtained by using the
`RequestContext.getTimeZone()` method. Time zone information is automatically used
by any Date/Time `Converter` and `Formatter` objects that are registered with Spring’s
`ConversionService`.

<a id="mvc-localeresolver-acceptheader"></a>

## Header Resolver

This locale resolver inspects the `accept-language` header in the request that was sent
by the client (for example, a web browser). Usually, this header field contains the locale of
the client’s operating system. Note that this resolver does not support time zone
information.

<a id="mvc-localeresolver-cookie"></a>

## Cookie Resolver

This locale resolver inspects a `Cookie` that might exist on the client to see if a
`Locale` or `TimeZone` is specified. If so, it uses the specified details. By using the
properties of this locale resolver, you can specify the name of the cookie as well as the
maximum age. The following example defines a `CookieLocaleResolver` bean:

#### Java

```java
@Configuration
public class WebConfiguration {

	@Bean
	public LocaleResolver localeResolver() {
		CookieLocaleResolver localeResolver = new CookieLocaleResolver("clientlanguage");
		localeResolver.setCookieMaxAge(Duration.ofSeconds(100000));
		return localeResolver;
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfiguration {

	@Bean
	fun localeResolver(): LocaleResolver = CookieLocaleResolver("clientlanguage").apply {
		setCookieMaxAge(Duration.ofSeconds(100000))
	}
}
```

#### Xml

```xml
<bean id="localeResolver" class="org.springframework.web.servlet.i18n.CookieLocaleResolver">

	<constructor-arg index="0" value="clientlanguage"/>

	<!-- in seconds. If set to -1, the cookie is not persisted (deleted when browser shuts down) -->
	<property name="cookieMaxAge" value="100000"/>

</bean>
```

<a id="mvc-localeresolver-session"></a>

## Session Resolver

The `SessionLocaleResolver` lets you retrieve `Locale` and `TimeZone` from the
session that might be associated with the user’s request. In contrast to
`CookieLocaleResolver`, this strategy stores locally chosen locale settings in the
Servlet container’s `HttpSession`. As a consequence, those settings are temporary
for each session and are, therefore, lost when each session ends.

Note that there is no direct relationship with external session management mechanisms,
such as the Spring Session project. This `SessionLocaleResolver` evaluates and
modifies the corresponding `HttpSession` attributes against the current `HttpServletRequest`.

<a id="mvc-localeresolver-interceptor"></a>

## Locale Interceptor

You can enable changing of locales by adding the `LocaleChangeInterceptor` to one of the
`HandlerMapping` definitions. It detects a parameter in the request and changes the locale
accordingly, calling the `setLocale` method on the `LocaleResolver` in the dispatcher’s
application context. The next example shows that calls to all `*.view` resources
that contain a parameter named `siteLanguage` now changes the locale. So, for example,
a request for the URL `domain.com/home.view?siteLanguage=nl` changes the site
language to Dutch. The following example shows how to intercept the locale:

#### Java

```java
@Configuration
public class WebConfiguration {

	@Bean
	public LocaleResolver localeResolver() {
		return new CookieLocaleResolver();
	}

	@Bean
	public SimpleUrlHandlerMapping urlMapping() {
		SimpleUrlHandlerMapping urlHandlerMapping = new SimpleUrlHandlerMapping();
		LocaleChangeInterceptor interceptor = new LocaleChangeInterceptor();
		interceptor.setParamName("siteLanguage");
		urlHandlerMapping.setInterceptors(interceptor);
		urlHandlerMapping.setUrlMap(Map.of("/**/*.view", "someController"));
		return urlHandlerMapping;
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfiguration {

	@Bean
	fun localeResolver(): LocaleResolver {
		return CookieLocaleResolver()
	}

	@Bean
	fun urlMapping() = SimpleUrlHandlerMapping().apply {
		setInterceptors(LocaleChangeInterceptor().apply {
			paramName = "siteLanguage"
		})
		urlMap = mapOf("/**/*.view" to "someController")
	}
}
```

#### Xml

```xml
<bean id="localeChangeInterceptor"
	  class="org.springframework.web.servlet.i18n.LocaleChangeInterceptor">
	<property name="paramName" value="siteLanguage"/>
</bean>

<bean id="localeResolver"
	  class="org.springframework.web.servlet.i18n.CookieLocaleResolver"/>

<bean id="urlMapping"
	  class="org.springframework.web.servlet.handler.SimpleUrlHandlerMapping">
	<property name="interceptors">
		<list>
			<ref bean="localeChangeInterceptor"/>
		</list>
	</property>
	<property name="mappings">
		<value>/**/*.view=someController</value>
	</property>
</bean>
```
