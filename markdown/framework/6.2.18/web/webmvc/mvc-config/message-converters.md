---
title: "Message Converters"
source: "ROOT:web/webmvc/mvc-config/message-converters.adoc"
---

<a id="mvc-config-message-converters"></a>

# Message Converters

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-message-codecs)

You can set the `HttpMessageConverter` instances to use in Java configuration,
replacing the ones used by default, by overriding
[`configureMessageConverters()`](https://docs.spring.io/spring-framework/docs/6.2.18/javadoc-api/org/springframework/web/servlet/config/annotation/WebMvcConfigurer.html#configureMessageConverters-java.util.List-).
You can also customize the list of configured message converters at the end by overriding
[`extendMessageConverters()`](https://docs.spring.io/spring-framework/docs/6.2.18/javadoc-api/org/springframework/web/servlet/config/annotation/WebMvcConfigurer.html#extendMessageConverters-java.util.List-).

> [!TIP]
> In a Spring Boot application, the `WebMvcAutoConfiguration` adds any
> `HttpMessageConverter` beans it detects, in addition to default converters. Hence, in a
> Boot application, prefer to use the [HttpMessageConverters](https://docs.spring.io/spring-boot/reference/web/servlet.html#web.servlet.spring-mvc.message-converters)
> mechanism. Or alternatively, use `extendMessageConverters` to modify message converters
> at the end.

The following example adds XML and Jackson JSON converters with a customized `ObjectMapper`
instead of the default ones:

#### Java

```java
@Configuration
public class WebConfiguration implements WebMvcConfigurer {

	@Override
	public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
		Jackson2ObjectMapperBuilder builder = new Jackson2ObjectMapperBuilder()
				.indentOutput(true)
				.dateFormat(new SimpleDateFormat("yyyy-MM-dd"))
				.modulesToInstall(new ParameterNamesModule());
		converters.add(new MappingJackson2HttpMessageConverter(builder.build()));
		converters.add(new MappingJackson2XmlHttpMessageConverter(builder.createXmlMapper(true).build()));
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfiguration : WebMvcConfigurer {

	override fun configureMessageConverters(converters: MutableList<HttpMessageConverter<*>>) {
		val builder = Jackson2ObjectMapperBuilder()
			.indentOutput(true)
			.dateFormat(SimpleDateFormat("yyyy-MM-dd"))
			.modulesToInstall(ParameterNamesModule())
		converters.add(MappingJackson2HttpMessageConverter(builder.build()))
		converters.add(MappingJackson2XmlHttpMessageConverter(builder.createXmlMapper(true).build()))
	}
}
```

#### Xml

```xml
<mvc:annotation-driven>
	<mvc:message-converters>
		<bean class="org.springframework.http.converter.json.MappingJackson2HttpMessageConverter">
			<property name="objectMapper" ref="objectMapper"/>
		</bean>
		<bean class="org.springframework.http.converter.xml.MappingJackson2XmlHttpMessageConverter">
			<property name="objectMapper" ref="xmlMapper"/>
		</bean>
	</mvc:message-converters>
</mvc:annotation-driven>

<bean id="objectMapper" class="org.springframework.http.converter.json.Jackson2ObjectMapperFactoryBean"
	  p:indentOutput="true"
	  p:simpleDateFormat="yyyy-MM-dd"
	  p:modulesToInstall="com.fasterxml.jackson.module.paramnames.ParameterNamesModule"/>

<bean id="xmlMapper" parent="objectMapper" p:createXmlMapper="true"/>
```

In the preceding example,
[`Jackson2ObjectMapperBuilder`](https://docs.spring.io/spring-framework/docs/6.2.18/javadoc-api/org/springframework/http/converter/json/Jackson2ObjectMapperBuilder.html)
is used to create a common configuration for both `MappingJackson2HttpMessageConverter` and
`MappingJackson2XmlHttpMessageConverter` with indentation enabled, a customized date format,
and the registration of
[`jackson-module-parameter-names`](https://github.com/FasterXML/jackson-module-parameter-names),
Which adds support for accessing parameter names (a feature added in Java 8).

This builder customizes Jackson’s default properties as follows:

- [`DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES`](https://fasterxml.github.io/jackson-databind/javadoc/2.6/com/fasterxml/jackson/databind/DeserializationFeature.html#FAIL_ON_UNKNOWN_PROPERTIES) is disabled.
- [`MapperFeature.DEFAULT_VIEW_INCLUSION`](https://fasterxml.github.io/jackson-databind/javadoc/2.6/com/fasterxml/jackson/databind/MapperFeature.html#DEFAULT_VIEW_INCLUSION) is disabled.

It also automatically registers the following well-known modules if they are detected on the classpath:

- [jackson-datatype-jsr310](https://github.com/FasterXML/jackson-datatype-jsr310): Support for Java 8 Date and Time API types.
- [jackson-datatype-jdk8](https://github.com/FasterXML/jackson-datatype-jdk8): Support for other Java 8 types, such as `Optional`.
- [jackson-module-kotlin](https://github.com/FasterXML/jackson-module-kotlin): Support for Kotlin classes and data classes.

> [!NOTE]
> Enabling indentation with Jackson XML support requires
> [`woodstox-core-asl`](https://search.maven.org/#search%7Cgav%7C1%7Cg%3A%22org.codehaus.woodstox%22%20AND%20a%3A%22woodstox-core-asl%22)
> dependency in addition to [`jackson-dataformat-xml`](https://search.maven.org/#search%7Cga%7C1%7Ca%3A%22jackson-dataformat-xml%22) one.

Other interesting Jackson modules are available:

- [jackson-datatype-money](https://github.com/zalando/jackson-datatype-money): Support for `javax.money` types (unofficial module).
- [jackson-datatype-hibernate](https://github.com/FasterXML/jackson-datatype-hibernate): Support for Hibernate-specific types and properties (including lazy-loading aspects).
