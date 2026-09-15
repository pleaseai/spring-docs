---
title: "Message Converters"
source: "ROOT:web/webmvc/mvc-config/message-converters.adoc"
---

<a id="mvc-config-message-converters"></a>

# Message Converters

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-message-codecs)

You can configure the `HttpMessageConverter` instances to use by overriding
[`configureMessageConverters()`](<https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/web/servlet/config/annotation/WebMvcConfigurer.html#configureMessageConverters(org.springframework.http.converter.HttpMessageConverters.Builder)>).

The following example configures custom Jackson JSON and XML converters with customized mappers instead of the default
ones:

#### Java

```java
@Configuration
public class WebConfiguration implements WebMvcConfigurer {

	@Override
	public void configureMessageConverters(HttpMessageConverters.ServerBuilder builder) {
		JsonMapper jsonMapper = JsonMapper.builder()
				.findAndAddModules()
				.enable(SerializationFeature.INDENT_OUTPUT)
				.defaultDateFormat(new SimpleDateFormat("yyyy-MM-dd"))
				.build();
		XmlMapper xmlMapper = XmlMapper.builder()
				.findAndAddModules()
				.defaultUseWrapper(false)
				.build();
		builder.withJsonConverter(new JacksonJsonHttpMessageConverter(jsonMapper))
				.withXmlConverter(new JacksonXmlHttpMessageConverter(xmlMapper));
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfiguration : WebMvcConfigurer {

	override fun configureMessageConverters(builder: HttpMessageConverters.ServerBuilder) {
		val jsonMapper = JsonMapper.builder()
			.findAndAddModules()
			.enable(SerializationFeature.INDENT_OUTPUT)
			.defaultDateFormat(SimpleDateFormat("yyyy-MM-dd"))
			.build()
		val xmlMapper = XmlMapper.builder()
			.findAndAddModules()
			.defaultUseWrapper(false)
			.build()
		builder.withJsonConverter(JacksonJsonHttpMessageConverter(jsonMapper))
			.withXmlConverter(JacksonXmlHttpMessageConverter(xmlMapper))
	}
}
```
