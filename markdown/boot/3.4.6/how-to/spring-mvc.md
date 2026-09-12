---
title: "Spring MVC"
source: "how-to:spring-mvc.adoc"
---

<a id="howto.spring-mvc"></a>

# Spring MVC

Spring Boot has a number of starters that include Spring MVC.
Note that some starters include a dependency on Spring MVC rather than include it directly.
This section answers common questions about Spring MVC and Spring Boot.

<a id="howto.spring-mvc.write-json-rest-service"></a>

## Write a JSON REST Service

Any Spring [`@RestController`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/annotation/RestController.html) in a Spring Boot application should render JSON response by default as long as Jackson2 is on the classpath, as shown in the following example:

#### Java

```java
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MyController {

	@RequestMapping("/thing")
	public MyThing thing() {
		return new MyThing();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class MyController {

	@RequestMapping("/thing")
	fun thing(): MyThing {
		return MyThing()
	}

}
```

As long as `MyThing` can be serialized by Jackson2 (true for a normal POJO or Groovy object), then `localhost:8080/thing` serves a JSON representation of it by default.
Note that, in a browser, you might sometimes see XML responses, because browsers tend to send accept headers that prefer XML.

<a id="howto.spring-mvc.write-xml-rest-service"></a>

## Write an XML REST Service

If you have the Jackson XML extension (`jackson-dataformat-xml`) on the classpath, you can use it to render XML responses.
The previous example that we used for JSON would work.
To use the Jackson XML renderer, add the following dependency to your project:

```xml
<dependency>
	<groupId>com.fasterxml.jackson.dataformat</groupId>
	<artifactId>jackson-dataformat-xml</artifactId>
</dependency>
```

If Jackson’s XML extension is not available and JAXB is available, XML can be rendered with the additional requirement of having `MyThing` annotated as [`@XmlRootElement`](https://jakarta.ee/specifications/xml-binding/4.0/apidocs/jakarta.xml.bind/jakarta/xml/bind/annotation/XmlRootElement.html), as shown in the following example:

#### Java

```java
import jakarta.xml.bind.annotation.XmlRootElement;

@XmlRootElement
public class MyThing {

	private String name;
	public String getName() {
		return this.name;
	}

	public void setName(String name) {
		this.name = name;
	}
}
```

#### Kotlin

```kotlin
import jakarta.xml.bind.annotation.XmlRootElement

@XmlRootElement
class MyThing {

	var name: String? = null

}
```

You will need to ensure that the JAXB library is part of your project, for example by adding:

```xml
<dependency>
	<groupId>org.glassfish.jaxb</groupId>
	<artifactId>jaxb-runtime</artifactId>
</dependency>
```

> [!NOTE]
> To get the server to render XML instead of JSON, you might have to send an `Accept: text/xml` header (or use a browser).

<a id="howto.spring-mvc.customize-jackson-objectmapper"></a>

## Customize the Jackson ObjectMapper

Spring MVC (client and server side) uses [`HttpMessageConverters`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/autoconfigure/http/HttpMessageConverters.html) to negotiate content conversion in an HTTP exchange.
If Jackson is on the classpath, you already get the default converter(s) provided by [`Jackson2ObjectMapperBuilder`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/converter/json/Jackson2ObjectMapperBuilder.html), an instance of which is auto-configured for you.

The [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/ObjectMapper.html) (or [`XmlMapper`](https://javadoc.io/doc/com.fasterxml.jackson.dataformat/jackson-dataformat-xml/2.18.4/com/fasterxml/jackson/dataformat/xml/XmlMapper.html) for Jackson XML converter) instance (created by default) has the following customized properties:

- `MapperFeature.DEFAULT_VIEW_INCLUSION` is disabled
- `DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES` is disabled
- `SerializationFeature.WRITE_DATES_AS_TIMESTAMPS` is disabled
- `SerializationFeature.WRITE_DURATIONS_AS_TIMESTAMPS` is disabled

Spring Boot also has some features to make it easier to customize this behavior.

You can configure the [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/ObjectMapper.html) and [`XmlMapper`](https://javadoc.io/doc/com.fasterxml.jackson.dataformat/jackson-dataformat-xml/2.18.4/com/fasterxml/jackson/dataformat/xml/XmlMapper.html) instances by using the environment.
Jackson provides an extensive suite of on/off features that can be used to configure various aspects of its processing.
These features are described in several enums (in Jackson) that map onto properties in the environment:

| Enum | Property | Values |
| --- | --- | --- |
| [`EnumFeature`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/cfg/EnumFeature.html) | `spring.jackson.datatype.enum.<feature_name>` | `true`, `false` |
| [`JsonNodeFeature`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/cfg/JsonNodeFeature.html) | `spring.jackson.datatype.json-node.<feature_name>` | `true`, `false` |
| [`DeserializationFeature`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/DeserializationFeature.html) | `spring.jackson.deserialization.<feature_name>` | `true`, `false` |
| [`JsonGenerator.Feature`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-core/2.18.4/com/fasterxml/jackson/core/JsonGenerator.Feature.html) | `spring.jackson.generator.<feature_name>` | `true`, `false` |
| [`MapperFeature`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/MapperFeature.html) | `spring.jackson.mapper.<feature_name>` | `true`, `false` |
| [`JsonParser.Feature`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-core/2.18.4/com/fasterxml/jackson/core/JsonParser.Feature.html) | `spring.jackson.parser.<feature_name>` | `true`, `false` |
| [`SerializationFeature`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/SerializationFeature.html) | `spring.jackson.serialization.<feature_name>` | `true`, `false` |
| [`JsonInclude.Include`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-annotations/2.18.4/com/fasterxml/jackson/annotation/JsonInclude.Include.html) | `spring.jackson.default-property-inclusion` | `always`, `non_null`, `non_absent`, `non_default`, `non_empty` |

For example, to enable pretty print, set `spring.jackson.serialization.indent_output=true`.
Note that, thanks to the use of [relaxed binding](../reference/features/external-config.md#features.external-config.typesafe-configuration-properties.relaxed-binding), the case of `indent_output` does not have to match the case of the corresponding enum constant, which is `INDENT_OUTPUT`.

This environment-based configuration is applied to the auto-configured [`Jackson2ObjectMapperBuilder`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/converter/json/Jackson2ObjectMapperBuilder.html) bean and applies to any mappers created by using the builder, including the auto-configured [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/ObjectMapper.html) bean.

The context’s [`Jackson2ObjectMapperBuilder`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/converter/json/Jackson2ObjectMapperBuilder.html) can be customized by one or more [`Jackson2ObjectMapperBuilderCustomizer`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/autoconfigure/jackson/Jackson2ObjectMapperBuilderCustomizer.html) beans.
Such customizer beans can be ordered (Boot’s own customizer has an order of 0), letting additional customization be applied both before and after Boot’s customization.

Any beans of type [`Module`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/Module.html) are automatically registered with the auto-configured [`Jackson2ObjectMapperBuilder`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/converter/json/Jackson2ObjectMapperBuilder.html) and are applied to any [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/ObjectMapper.html) instances that it creates.
This provides a global mechanism for contributing custom modules when you add new features to your application.

If you want to replace the default [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/ObjectMapper.html) completely, either define a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) of that type or, if you prefer the builder-based approach, define a [`Jackson2ObjectMapperBuilder`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/converter/json/Jackson2ObjectMapperBuilder.html) [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html).
When defining an [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/ObjectMapper.html) bean, marking it as [`@Primary`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Primary.html) is recommended as the auto-configuration’s [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/ObjectMapper.html) that it will replace is [`@Primary`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Primary.html).
Note that, in either case, doing so disables all auto-configuration of the [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.4/com/fasterxml/jackson/databind/ObjectMapper.html).

If you provide any [`@Beans`](https://docs.oracle.com/en/java/javase/17/docs/api/java.desktop/java/beans/Beans.html) of type [`MappingJackson2HttpMessageConverter`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/converter/json/MappingJackson2HttpMessageConverter.html), they replace the default value in the MVC configuration.
Also, a convenience bean of type [`HttpMessageConverters`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/autoconfigure/http/HttpMessageConverters.html) is provided (and is always available if you use the default MVC configuration).
It has some useful methods to access the default and user-enhanced message converters.

See the [Customize the @ResponseBody Rendering](#howto.spring-mvc.customize-responsebody-rendering) section and the [`WebMvcAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.4.6/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/web/servlet/WebMvcAutoConfiguration.java) source code for more details.

<a id="howto.spring-mvc.customize-responsebody-rendering"></a>

## Customize the @ResponseBody Rendering

Spring uses [`HttpMessageConverters`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/autoconfigure/http/HttpMessageConverters.html) to render [`@ResponseBody`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/annotation/ResponseBody.html) (or responses from [`@RestController`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/annotation/RestController.html)).
You can contribute additional converters by adding beans of the appropriate type in a Spring Boot context.
If a bean you add is of a type that would have been included by default anyway (such as [`MappingJackson2HttpMessageConverter`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/converter/json/MappingJackson2HttpMessageConverter.html) for JSON conversions), it replaces the default value.
A convenience bean of type [`HttpMessageConverters`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/autoconfigure/http/HttpMessageConverters.html) is provided and is always available if you use the default MVC configuration.
It has some useful methods to access the default and user-enhanced message converters (For example, it can be useful if you want to manually inject them into a custom [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/client/RestTemplate.html)).

As in normal MVC usage, any [`WebMvcConfigurer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/WebMvcConfigurer.html) beans that you provide can also contribute converters by overriding the `configureMessageConverters` method.
However, unlike with normal MVC, you can supply only additional converters that you need (because Spring Boot uses the same mechanism to contribute its defaults).
Finally, if you opt out of the default Spring Boot MVC configuration by providing your own [`@EnableWebMvc`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/EnableWebMvc.html) configuration, you can take control completely and do everything manually by using `getMessageConverters` from [`WebMvcConfigurationSupport`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/WebMvcConfigurationSupport.html).

See the [`WebMvcAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.4.6/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/web/servlet/WebMvcAutoConfiguration.java) source code for more details.

<a id="howto.spring-mvc.multipart-file-uploads"></a>

## Handling Multipart File Uploads

Spring Boot embraces the servlet 5 [`Part`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/http/Part.html) API to support uploading files.
By default, Spring Boot configures Spring MVC with a maximum size of 1MB per file and a maximum of 10MB of file data in a single request.
You may override these values, the location to which intermediate data is stored (for example, to the `/tmp` directory), and the threshold past which data is flushed to disk by using the properties exposed in the [`MultipartProperties`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/autoconfigure/web/servlet/MultipartProperties.html) class.
For example, if you want to specify that files be unlimited, set the `spring.servlet.multipart.max-file-size` property to `-1`.

The multipart support is helpful when you want to receive multipart encoded file data as a [`@RequestParam`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/annotation/RequestParam.html)-annotated parameter of type [`MultipartFile`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/multipart/MultipartFile.html) in a Spring MVC controller handler method.

See the [`MultipartAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.4.6/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/web/servlet/MultipartAutoConfiguration.java) source for more details.

> [!NOTE]
> It is recommended to use the container’s built-in support for multipart uploads rather than introduce an additional dependency such as Apache Commons File Upload.

<a id="howto.spring-mvc.switch-off-dispatcherservlet"></a>

## Switch Off the Spring MVC DispatcherServlet

By default, all content is served from the root of your application (`/`).
If you would rather map to a different path, you can configure one as follows:

#### Properties

```properties
spring.mvc.servlet.path=/mypath
```

#### YAML

```yaml
spring:
  mvc:
    servlet:
      path: "/mypath"
```

If you have additional servlets you can declare a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) of type [`Servlet`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Servlet.html) or [`ServletRegistrationBean`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/web/servlet/ServletRegistrationBean.html) for each and Spring Boot will register them transparently to the container.
Because servlets are registered that way, they can be mapped to a sub-context of the [`DispatcherServlet`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/DispatcherServlet.html) without invoking it.

Configuring the [`DispatcherServlet`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/DispatcherServlet.html) yourself is unusual but if you really need to do it, a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) of type [`DispatcherServletPath`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/autoconfigure/web/servlet/DispatcherServletPath.html) must be provided as well to provide the path of your custom [`DispatcherServlet`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/DispatcherServlet.html).

<a id="howto.spring-mvc.switch-off-default-configuration"></a>

## Switch Off the Default MVC Configuration

The easiest way to take complete control over MVC configuration is to provide your own [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Configuration.html) with the [`@EnableWebMvc`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/EnableWebMvc.html) annotation.
Doing so leaves all MVC configuration in your hands.

<a id="howto.spring-mvc.customize-view-resolvers"></a>

## Customize ViewResolvers

A [`ViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/ViewResolver.html) is a core component of Spring MVC, translating view names in [`@Controller`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/stereotype/Controller.html) to actual [`View`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/View.html) implementations.
Note that view resolvers are mainly used in UI applications, rather than REST-style services (a [`View`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/View.html) is not used to render a [`@ResponseBody`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/annotation/ResponseBody.html)).
There are many implementations of [`ViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/ViewResolver.html) to choose from, and Spring on its own is not opinionated about which ones you should use.
Spring Boot, on the other hand, installs one or two for you, depending on what it finds on the classpath and in the application context.
The [`DispatcherServlet`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/DispatcherServlet.html) uses all the resolvers it finds in the application context, trying each one in turn until it gets a result.
If you add your own, you have to be aware of the order and in which position your resolver is added.

[`WebMvcAutoConfiguration`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/autoconfigure/web/servlet/WebMvcAutoConfiguration.html) adds the following [`ViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/ViewResolver.html) beans to your context:

- An [`InternalResourceViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/view/InternalResourceViewResolver.html) named ‘defaultViewResolver’.
This one locates physical resources that can be rendered by using the `DefaultServlet` (including static resources and JSP pages, if you use those).
It applies a prefix and a suffix to the view name and then looks for a physical resource with that path in the servlet context (the defaults are both empty but are accessible for external configuration through `spring.mvc.view.prefix` and `spring.mvc.view.suffix`).
You can override it by providing a bean of the same type.
- A [`BeanNameViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/view/BeanNameViewResolver.html) named ‘beanNameViewResolver’.
This is a useful member of the view resolver chain and picks up any beans with the same name as the [`View`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/View.html) being resolved.
It should not be necessary to override or replace it.
- A [`ContentNegotiatingViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/view/ContentNegotiatingViewResolver.html) named ‘viewResolver’ is added only if there **are** actually beans of type [`View`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/View.html) present.
This is a composite resolver, delegating to all the others and attempting to find a match to the ‘Accept’ HTTP header sent by the client.
There is a useful [blog about [`ContentNegotiatingViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/view/ContentNegotiatingViewResolver.html)](https://spring.io/blog/2013/06/03/content-negotiation-using-views) that you might like to study to learn more, and you might also look at the source code for detail.
You can switch off the auto-configured [`ContentNegotiatingViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/view/ContentNegotiatingViewResolver.html) by defining a bean named ‘viewResolver’.
- If you use Thymeleaf, you also have a [`ThymeleafViewResolver`](https://www.thymeleaf.org/apidocs/thymeleaf-spring6/3.1.3.RELEASE/org/thymeleaf/spring6/view/ThymeleafViewResolver.html) named ‘thymeleafViewResolver’.
It looks for resources by surrounding the view name with a prefix and suffix.
The prefix is `spring.thymeleaf.prefix`, and the suffix is `spring.thymeleaf.suffix`.
The values of the prefix and suffix default to ‘classpath:/templates/’ and ‘.html’, respectively.
You can override [`ThymeleafViewResolver`](https://www.thymeleaf.org/apidocs/thymeleaf-spring6/3.1.3.RELEASE/org/thymeleaf/spring6/view/ThymeleafViewResolver.html) by providing a bean of the same name.
- If you use FreeMarker, you also have a [`FreeMarkerViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/view/freemarker/FreeMarkerViewResolver.html) named ‘freeMarkerViewResolver’.
It looks for resources in a loader path (which is externalized to `spring.freemarker.templateLoaderPath` and has a default value of ‘classpath:/templates/’) by surrounding the view name with a prefix and a suffix.
The prefix is externalized to `spring.freemarker.prefix`, and the suffix is externalized to `spring.freemarker.suffix`.
The default values of the prefix and suffix are empty and ‘.ftlh’, respectively.
You can override [`FreeMarkerViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/view/freemarker/FreeMarkerViewResolver.html) by providing a bean of the same name.
FreeMarker variables can be customized by defining a bean of type [`FreeMarkerVariablesCustomizer`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/autoconfigure/freemarker/FreeMarkerVariablesCustomizer.html).
- If you use Groovy templates (actually, if `groovy-templates` is on your classpath), you also have a [`GroovyMarkupViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/view/groovy/GroovyMarkupViewResolver.html) named ‘groovyMarkupViewResolver’.
It looks for resources in a loader path by surrounding the view name with a prefix and suffix (externalized to `spring.groovy.template.prefix` and `spring.groovy.template.suffix`).
The prefix and suffix have default values of ‘classpath:/templates/’ and ‘.tpl’, respectively.
You can override [`GroovyMarkupViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/view/groovy/GroovyMarkupViewResolver.html) by providing a bean of the same name.
- If you use Mustache, you also have a [`MustacheViewResolver`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/web/servlet/view/MustacheViewResolver.html) named ‘mustacheViewResolver’.
It looks for resources by surrounding the view name with a prefix and suffix.
The prefix is `spring.mustache.prefix`, and the suffix is `spring.mustache.suffix`.
The values of the prefix and suffix default to ‘classpath:/templates/’ and ‘.mustache’, respectively.
You can override [`MustacheViewResolver`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/web/servlet/view/MustacheViewResolver.html) by providing a bean of the same name.

For more detail, see the following sections:

- [`WebMvcAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.4.6/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/web/servlet/WebMvcAutoConfiguration.java)
- [`ThymeleafAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.4.6/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/thymeleaf/ThymeleafAutoConfiguration.java)
- [`FreeMarkerAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.4.6/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/freemarker/FreeMarkerAutoConfiguration.java)
- [`GroovyTemplateAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.4.6/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/groovy/template/GroovyTemplateAutoConfiguration.java)

<a id="howto.spring-mvc.customize-whitelabel-error-page"></a>

## Customize the ‘whitelabel’ Error Page

Spring Boot installs a ‘whitelabel’ error page that you see in a browser client if you encounter a server error (machine clients consuming JSON and other media types should see a sensible response with the right error code).

> [!NOTE]
> Set `server.error.whitelabel.enabled=false` to switch the default error page off.
> Doing so restores the default of the servlet container that you are using.
> Note that Spring Boot still tries to resolve the error view, so you should probably add your own error page rather than disabling it completely.

Overriding the error page with your own depends on the templating technology that you use.
For example, if you use Thymeleaf, you can add an `error.html` template.
If you use FreeMarker, you can add an `error.ftlh` template.
In general, you need a [`View`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/View.html) that resolves with a name of `error` or a [`@Controller`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/stereotype/Controller.html) that handles the `/error` path.
Unless you replaced some of the default configuration, you should find a [`BeanNameViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/view/BeanNameViewResolver.html) in your [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ApplicationContext.html), so a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) named `error` would be one way of doing that.
See [`ErrorMvcAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.4.6/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/web/servlet/error/ErrorMvcAutoConfiguration.java) for more options.

See also the section on [reference:web/servlet.adoc#web.servlet.spring-mvc.error-handling](../reference/web/servlet.md#web.servlet.spring-mvc.error-handling) for details of how to register handlers in the servlet container.
