---
title: "Servlet Web Applications"
source: "reference:web/servlet.adoc"
---

<a id="web.servlet"></a>

# Servlet Web Applications

If you want to build servlet-based web applications, you can take advantage of Spring Boot’s auto-configuration for Spring MVC or Jersey.

<a id="web.servlet.spring-mvc"></a>

## The “Spring Web MVC Framework”

The [Spring Web MVC framework](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc.html) (often referred to as “Spring MVC”) is a rich “model view controller” web framework.
Spring MVC lets you create special [`@Controller`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/stereotype/Controller.html) or [`@RestController`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/annotation/RestController.html) beans to handle incoming HTTP requests.
Methods in your controller are mapped to HTTP by using [`@RequestMapping`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/annotation/RequestMapping.html) annotations.

The following code shows a typical [`@RestController`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/annotation/RestController.html) that serves JSON data:

#### Java

```java
import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class MyRestController {

	private final UserRepository userRepository;

	private final CustomerRepository customerRepository;

	public MyRestController(UserRepository userRepository, CustomerRepository customerRepository) {
		this.userRepository = userRepository;
		this.customerRepository = customerRepository;
	}

	@GetMapping("/{userId}")
	public User getUser(@PathVariable Long userId) {
		return this.userRepository.findById(userId).get();
	}

	@GetMapping("/{userId}/customers")
	public List<Customer> getUserCustomers(@PathVariable Long userId) {
		return this.userRepository.findById(userId).map(this.customerRepository::findByUser).get();
	}

	@DeleteMapping("/{userId}")
	public void deleteUser(@PathVariable Long userId) {
		this.userRepository.deleteById(userId);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
@RestController
@RequestMapping("/users")
class MyRestController(private val userRepository: UserRepository, private val customerRepository: CustomerRepository) {

	@GetMapping("/{userId}")
	fun getUser(@PathVariable userId: Long): User {
		return userRepository.findById(userId).get()
	}

	@GetMapping("/{userId}/customers")
	fun getUserCustomers(@PathVariable userId: Long): List<Customer> {
		return userRepository.findById(userId).map(customerRepository::findByUser).get()
	}

	@DeleteMapping("/{userId}")
	fun deleteUser(@PathVariable userId: Long) {
		userRepository.deleteById(userId)
	}

}

```

“WebMvc.fn”, the functional variant, separates the routing configuration from the actual handling of the requests, as shown in the following example:

#### Java

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.function.RequestPredicate;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import static org.springframework.web.servlet.function.RequestPredicates.accept;
import static org.springframework.web.servlet.function.RouterFunctions.route;

@Configuration(proxyBeanMethods = false)
public class MyRoutingConfiguration {

	private static final RequestPredicate ACCEPT_JSON = accept(MediaType.APPLICATION_JSON);

	@Bean
	public RouterFunction<ServerResponse> routerFunction(MyUserHandler userHandler) {
		return route()
				.GET("/{user}", ACCEPT_JSON, userHandler::getUser)
				.GET("/{user}/customers", ACCEPT_JSON, userHandler::getUserCustomers)
				.DELETE("/{user}", ACCEPT_JSON, userHandler::deleteUser)
				.build();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.MediaType
import org.springframework.web.servlet.function.RequestPredicates.accept
import org.springframework.web.servlet.function.RouterFunction
import org.springframework.web.servlet.function.RouterFunctions
import org.springframework.web.servlet.function.ServerResponse

@Configuration(proxyBeanMethods = false)
class MyRoutingConfiguration {

	@Bean
	fun routerFunction(userHandler: MyUserHandler): RouterFunction<ServerResponse> {
		return RouterFunctions.route()
			.GET("/{user}", ACCEPT_JSON, userHandler::getUser)
			.GET("/{user}/customers", ACCEPT_JSON, userHandler::getUserCustomers)
			.DELETE("/{user}", ACCEPT_JSON, userHandler::deleteUser)
			.build()
	}

	companion object {
		private val ACCEPT_JSON = accept(MediaType.APPLICATION_JSON)
	}

}
```

#### Java

```java
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.function.ServerRequest;
import org.springframework.web.servlet.function.ServerResponse;

@Component
public class MyUserHandler {

	public ServerResponse getUser(ServerRequest request) {
		...
	}

	public ServerResponse getUserCustomers(ServerRequest request) {
		...
	}

	public ServerResponse deleteUser(ServerRequest request) {
		...
	}

}
```

#### Kotlin

```kotlin
import org.springframework.stereotype.Component
import org.springframework.web.servlet.function.ServerRequest
import org.springframework.web.servlet.function.ServerResponse

@Component
class MyUserHandler {

	fun getUser(request: ServerRequest?): ServerResponse {
		...
	}

	fun getUserCustomers(request: ServerRequest?): ServerResponse {
		...
	}

	fun deleteUser(request: ServerRequest?): ServerResponse {
		...
	}

}
```

Spring MVC is part of the core Spring Framework, and detailed information is available in the [reference documentation](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc.html).
There are also several guides that cover Spring MVC available at [spring.io/guides](https://spring.io/guides).

> [!TIP]
> You can define as many [`RouterFunction`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/function/RouterFunction.html) beans as you like to modularize the definition of the router.
> Beans can be ordered if you need to apply a precedence.

<a id="web.servlet.spring-mvc.auto-configuration"></a>

### Spring MVC Auto-configuration

Spring Boot provides auto-configuration for Spring MVC that works well with most applications.
It replaces the need for [`@EnableWebMvc`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/EnableWebMvc.html) and the two cannot be used together.
In addition to Spring MVC’s defaults, the auto-configuration provides the following features:

- Inclusion of [`ContentNegotiatingViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/view/ContentNegotiatingViewResolver.html) and [`BeanNameViewResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/view/BeanNameViewResolver.html) beans.
- Support for serving static resources, including support for WebJars (covered [later in this document](#web.servlet.spring-mvc.static-content)).
- Automatic registration of [`Converter`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/convert/converter/Converter.html), [`GenericConverter`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/convert/converter/GenericConverter.html), and [`Formatter`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/format/Formatter.html) beans.
- Support for [`HttpMessageConverters`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/autoconfigure/http/HttpMessageConverters.html) (covered [later in this document](#web.servlet.spring-mvc.message-converters)).
- Automatic registration of [`MessageCodesResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/validation/MessageCodesResolver.html) (covered [later in this document](#web.servlet.spring-mvc.message-codes)).
- Static `index.html` support.
- Automatic use of a [`ConfigurableWebBindingInitializer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/support/ConfigurableWebBindingInitializer.html) bean (covered [later in this document](#web.servlet.spring-mvc.binding-initializer)).

If you want to keep those Spring Boot MVC customizations and make more [MVC customizations](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc.html) (interceptors, formatters, view controllers, and other features), you can add your own [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Configuration.html) class of type [`WebMvcConfigurer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/WebMvcConfigurer.html) but **without** [`@EnableWebMvc`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/EnableWebMvc.html).

If you want to provide custom instances of [`RequestMappingHandlerMapping`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/RequestMappingHandlerMapping.html), [`RequestMappingHandlerAdapter`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/RequestMappingHandlerAdapter.html), or [`ExceptionHandlerExceptionResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/ExceptionHandlerExceptionResolver.html), and still keep the Spring Boot MVC customizations, you can declare a bean of type [`WebMvcRegistrations`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/autoconfigure/web/servlet/WebMvcRegistrations.html) and use it to provide custom instances of those components.
The custom instances will be subject to further initialization and configuration by Spring MVC.
To participate in, and if desired, override that subsequent processing, a [`WebMvcConfigurer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/WebMvcConfigurer.html) should be used.

If you do not want to use the auto-configuration and want to take complete control of Spring MVC, add your own [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Configuration.html) annotated with [`@EnableWebMvc`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/EnableWebMvc.html).
Alternatively, add your own [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Configuration.html)-annotated [`DelegatingWebMvcConfiguration`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/DelegatingWebMvcConfiguration.html) as described in the [`@EnableWebMvc`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/EnableWebMvc.html) API documentation.

<a id="web.servlet.spring-mvc.conversion-service"></a>

### Spring MVC Conversion Service

Spring MVC uses a different [`ConversionService`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/convert/ConversionService.html) to the one used to convert values from your `application.properties` or `application.yaml` file.
It means that [`Period`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/Period.html), [`Duration`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/Duration.html) and [`DataSize`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/util/unit/DataSize.html) converters are not available and that [`@DurationUnit`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/convert/DurationUnit.html) and [`@DataSizeUnit`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/convert/DataSizeUnit.html) annotations will be ignored.

If you want to customize the [`ConversionService`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/convert/ConversionService.html) used by Spring MVC, you can provide a [`WebMvcConfigurer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/WebMvcConfigurer.html) bean with an `addFormatters` method.
From this method you can register any converter that you like, or you can delegate to the static methods available on [`ApplicationConversionService`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/convert/ApplicationConversionService.html).

Conversion can also be customized using the `spring.mvc.format.*` configuration properties.
When not configured, the following defaults are used:

| Property | `DateTimeFormatter` | Formats |
| --- | --- | --- |
| `spring.mvc.format.date` | `ofLocalizedDate(FormatStyle.SHORT)` | `java.util.Date` and [`LocalDate`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/LocalDate.html) |
| `spring.mvc.format.time` | `ofLocalizedTime(FormatStyle.SHORT)` | java.time’s [`LocalTime`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/LocalTime.html) and [`OffsetTime`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/OffsetTime.html) |
| `spring.mvc.format.date-time` | `ofLocalizedDateTime(FormatStyle.SHORT)` | java.time’s [`LocalDateTime`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/LocalDateTime.html), [`OffsetDateTime`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/OffsetDateTime.html), and [`ZonedDateTime`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/ZonedDateTime.html) |

<a id="web.servlet.spring-mvc.message-converters"></a>

### HttpMessageConverters

Spring MVC uses the [`HttpMessageConverter`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/converter/HttpMessageConverter.html) interface to convert HTTP requests and responses.
Sensible defaults are included out of the box.
For example, objects can be automatically converted to JSON (by using the Jackson library) or XML (by using the Jackson XML extension, if available, or by using JAXB if the Jackson XML extension is not available).
By default, strings are encoded in `UTF-8`.

Any [`HttpMessageConverter`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/converter/HttpMessageConverter.html) bean that is present in the context is added to the list of converters.
You can also override default converters in the same way.

If you need to add or customize converters, you can use Spring Boot’s [`HttpMessageConverters`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/autoconfigure/http/HttpMessageConverters.html) class, as shown in the following listing:

#### Java

```java
import org.springframework.boot.autoconfigure.http.HttpMessageConverters;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;

@Configuration(proxyBeanMethods = false)
public class MyHttpMessageConvertersConfiguration {

	@Bean
	public HttpMessageConverters customConverters() {
		HttpMessageConverter<?> additional = new AdditionalHttpMessageConverter();
		HttpMessageConverter<?> another = new AnotherHttpMessageConverter();
		return new HttpMessageConverters(additional, another);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.autoconfigure.http.HttpMessageConverters
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.converter.HttpMessageConverter

@Configuration(proxyBeanMethods = false)
class MyHttpMessageConvertersConfiguration {

	@Bean
	fun customConverters(): HttpMessageConverters {
		val additional: HttpMessageConverter<*> = AdditionalHttpMessageConverter()
		val another: HttpMessageConverter<*> = AnotherHttpMessageConverter()
		return HttpMessageConverters(additional, another)
	}

}
```

For further control, you can also sub-class [`HttpMessageConverters`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/autoconfigure/http/HttpMessageConverters.html) and override its `postProcessConverters` and/or `postProcessPartConverters` methods.
This can be useful when you want to re-order or remove some of the converters that Spring MVC configures by default.

<a id="web.servlet.spring-mvc.message-codes"></a>

### MessageCodesResolver

Spring MVC has a strategy for generating error codes for rendering error messages from binding errors: [`MessageCodesResolver`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/validation/MessageCodesResolver.html).
If you set the `spring.mvc.message-codes-resolver-format` property `PREFIX_ERROR_CODE` or `POSTFIX_ERROR_CODE`, Spring Boot creates one for you (see the enumeration in [`DefaultMessageCodesResolver.Format`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/validation/DefaultMessageCodesResolver.html#Format)).

<a id="web.servlet.spring-mvc.static-content"></a>

### Static Content

By default, Spring Boot serves static content from a directory called `/static` (or `/public` or `/resources` or `/META-INF/resources`) in the classpath or from the root of the [`ServletContext`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/ServletContext.html).
It uses the [`ResourceHttpRequestHandler`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/resource/ResourceHttpRequestHandler.html) from Spring MVC so that you can modify that behavior by adding your own [`WebMvcConfigurer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/WebMvcConfigurer.html) and overriding the `addResourceHandlers` method.

In a stand-alone web application, the default servlet from the container is not enabled.
It can be enabled using the `server.servlet.register-default-servlet` property.

The default servlet acts as a fallback, serving content from the root of the [`ServletContext`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/ServletContext.html) if Spring decides not to handle it.
Most of the time, this does not happen (unless you modify the default MVC configuration), because Spring can always handle requests through the [`DispatcherServlet`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/DispatcherServlet.html).

By default, resources are mapped on `/**`, but you can tune that with the `spring.mvc.static-path-pattern` property.
For instance, relocating all resources to `/resources/**` can be achieved as follows:

#### Properties

```properties
spring.mvc.static-path-pattern=/resources/**
```

#### YAML

```yaml
spring:
  mvc:
    static-path-pattern: "/resources/**"
```

You can also customize the static resource locations by using the `spring.web.resources.static-locations` property (replacing the default values with a list of directory locations).
The root servlet context path, `"/"`, is automatically added as a location as well.

In addition to the “standard” static resource locations mentioned earlier, a special case is made for [Webjars content](https://www.webjars.org/).
By default, any resources with a path in `/webjars/**` are served from jar files if they are packaged in the Webjars format.
The path can be customized with the `spring.mvc.webjars-path-pattern` property.

> [!TIP]
> Do not use the `src/main/webapp` directory if your application is packaged as a jar.
> Although this directory is a common standard, it works **only** with war packaging, and it is silently ignored by most build tools if you generate a jar.

Spring Boot also supports the advanced resource handling features provided by Spring MVC, allowing use cases such as cache-busting static resources or using version agnostic URLs for Webjars.

To use version agnostic URLs for Webjars, add the `org.webjars:webjars-locator-lite` dependency.
Then declare your Webjar.
Using jQuery as an example, adding `"/webjars/jquery/jquery.min.js"` results in `"/webjars/jquery/x.y.z/jquery.min.js"` where `x.y.z` is the Webjar version.

To use cache busting, the following configuration configures a cache busting solution for all static resources, effectively adding a content hash, such as `<link href="/css/spring-2a2d595e6ed9a0b24f027f2b63b134d6.css"/>`, in URLs:

#### Properties

```properties
spring.web.resources.chain.strategy.content.enabled=true
spring.web.resources.chain.strategy.content.paths=/**
```

#### YAML

```yaml
spring:
  web:
    resources:
      chain:
        strategy:
          content:
            enabled: true
            paths: "/**"
```

> [!NOTE]
> Links to resources are rewritten in templates at runtime, thanks to a [`ResourceUrlEncodingFilter`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/resource/ResourceUrlEncodingFilter.html) that is auto-configured for Thymeleaf and FreeMarker.
> You should manually declare this filter when using JSPs.
> Other template engines are currently not automatically supported but can be with custom template macros/helpers and the use of the [`ResourceUrlProvider`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/resource/ResourceUrlProvider.html).

When loading resources dynamically with, for example, a JavaScript module loader, renaming files is not an option.
That is why other strategies are also supported and can be combined.
A "fixed" strategy adds a static version string in the URL without changing the file name, as shown in the following example:

#### Properties

```properties
spring.web.resources.chain.strategy.content.enabled=true
spring.web.resources.chain.strategy.content.paths=/**
spring.web.resources.chain.strategy.fixed.enabled=true
spring.web.resources.chain.strategy.fixed.paths=/js/lib/
spring.web.resources.chain.strategy.fixed.version=v12
```

#### YAML

```yaml
spring:
  web:
    resources:
      chain:
        strategy:
          content:
            enabled: true
            paths: "/**"
          fixed:
            enabled: true
            paths: "/js/lib/"
            version: "v12"
```

With this configuration, JavaScript modules located under `"/js/lib/"` use a fixed versioning strategy (`"/v12/js/lib/mymodule.js"`), while other resources still use the content one (`<link href="/css/spring-2a2d595e6ed9a0b24f027f2b63b134d6.css"/>`).

See [`WebProperties.Resources`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/autoconfigure/web/WebProperties.Resources.html) for more supported options.

> [!TIP]
> This feature has been thoroughly described in a dedicated [blog post](https://spring.io/blog/2014/07/24/spring-framework-4-1-handling-static-web-resources) and in Spring Framework’s [reference documentation](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-config/static-resources.html).

<a id="web.servlet.spring-mvc.welcome-page"></a>

### Welcome Page

Spring Boot supports both static and templated welcome pages.
It first looks for an `index.html` file in the configured static content locations.
If one is not found, it then looks for an `index` template.
If either is found, it is automatically used as the welcome page of the application.

This only acts as a fallback for actual index routes defined by the application.
The ordering is defined by the order of [`HandlerMapping`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/HandlerMapping.html) beans which is by default the following:

|  |  |
| --- | --- |
| `RouterFunctionMapping` | Endpoints declared with [`RouterFunction`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/function/RouterFunction.html) beans |
| `RequestMappingHandlerMapping` | Endpoints declared in [`@Controller`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/stereotype/Controller.html) beans |
| `WelcomePageHandlerMapping` | The welcome page support |

<a id="web.servlet.spring-mvc.favicon"></a>

### Custom Favicon

As with other static resources, Spring Boot checks for a `favicon.ico` in the configured static content locations.
If such a file is present, it is automatically used as the favicon of the application.

<a id="web.servlet.spring-mvc.content-negotiation"></a>

### Path Matching and Content Negotiation

Spring MVC can map incoming HTTP requests to handlers by looking at the request path and matching it to the mappings defined in your application (for example, [`@GetMapping`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/annotation/GetMapping.html) annotations on Controller methods).

Spring Boot chooses to disable suffix pattern matching by default, which means that requests like `"GET /projects/spring-boot.json"` will not be matched to `@GetMapping("/projects/spring-boot")` mappings.
This is considered as a [best practice for Spring MVC applications](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-requestmapping.html#mvc-ann-requestmapping-suffix-pattern-match).
This feature was mainly useful in the past for HTTP clients which did not send proper "Accept" request headers; we needed to make sure to send the correct Content Type to the client.
Nowadays, Content Negotiation is much more reliable.

There are other ways to deal with HTTP clients that do not consistently send proper "Accept" request headers.
Instead of using suffix matching, we can use a query parameter to ensure that requests like `"GET /projects/spring-boot?format=json"` will be mapped to `@GetMapping("/projects/spring-boot")`:

#### Properties

```properties
spring.mvc.contentnegotiation.favor-parameter=true
```

#### YAML

```yaml
spring:
  mvc:
    contentnegotiation:
      favor-parameter: true
```

Or if you prefer to use a different parameter name:

#### Properties

```properties
spring.mvc.contentnegotiation.favor-parameter=true
spring.mvc.contentnegotiation.parameter-name=myparam
```

#### YAML

```yaml
spring:
  mvc:
    contentnegotiation:
      favor-parameter: true
      parameter-name: "myparam"
```

Most standard media types are supported out-of-the-box, but you can also define new ones:

#### Properties

```properties
spring.mvc.contentnegotiation.media-types.markdown=text/markdown
```

#### YAML

```yaml
spring:
  mvc:
    contentnegotiation:
      media-types:
        markdown: "text/markdown"
```

As of Spring Framework 5.3, Spring MVC supports two strategies for matching request paths to controllers.
By default, Spring Boot uses the [`PathPatternParser`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/util/pattern/PathPatternParser.html) strategy.
[`PathPatternParser`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/util/pattern/PathPatternParser.html) is an [optimized implementation](https://spring.io/blog/2020/06/30/url-matching-with-pathpattern-in-spring-mvc) but comes with some restrictions compared to the [`AntPathMatcher`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/util/AntPathMatcher.html) strategy.
[`PathPatternParser`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/util/pattern/PathPatternParser.html) restricts usage of [some path pattern variants](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-requestmapping.html#mvc-ann-requestmapping-uri-templates).
It is also incompatible with configuring the [`DispatcherServlet`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/DispatcherServlet.html) with a path prefix (`spring.mvc.servlet.path`).

The strategy can be configured using the `spring.mvc.pathmatch.matching-strategy` configuration property, as shown in the following example:

#### Properties

```properties
spring.mvc.pathmatch.matching-strategy=ant-path-matcher
```

#### YAML

```yaml
spring:
  mvc:
    pathmatch:
      matching-strategy: "ant-path-matcher"
```

Spring MVC will throw a [`NoHandlerFoundException`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/NoHandlerFoundException.html) if a handler is not found for a request.
Note that, by default, the [serving of static content](#web.servlet.spring-mvc.static-content) is mapped to `/**` and will, therefore, provide a handler for all requests.
If no static content is available, [`ResourceHttpRequestHandler`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/resource/ResourceHttpRequestHandler.html) will throw a [`NoResourceFoundException`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/resource/NoResourceFoundException.html).
For a [`NoHandlerFoundException`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/NoHandlerFoundException.html) to be thrown, set `spring.mvc.static-path-pattern` to a more specific value such as `/resources/**` or set `spring.web.resources.add-mappings` to `false` to disable serving of static content entirely.

<a id="web.servlet.spring-mvc.binding-initializer"></a>

### ConfigurableWebBindingInitializer

Spring MVC uses a [`WebBindingInitializer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/support/WebBindingInitializer.html) to initialize a [`WebDataBinder`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/WebDataBinder.html) for a particular request.
If you create your own [`ConfigurableWebBindingInitializer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/support/ConfigurableWebBindingInitializer.html) [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html), Spring Boot automatically configures Spring MVC to use it.

<a id="web.servlet.spring-mvc.template-engines"></a>

### Template Engines

As well as REST web services, you can also use Spring MVC to serve dynamic HTML content.
Spring MVC supports a variety of templating technologies, including Thymeleaf, FreeMarker, and JSPs.
Also, many other templating engines include their own Spring MVC integrations.

Spring Boot includes auto-configuration support for the following templating engines:

- [FreeMarker](https://freemarker.apache.org/docs/)
- [Groovy](https://docs.groovy-lang.org/docs/next/html/documentation/template-engines.html#_the_markuptemplateengine)
- [Thymeleaf](https://www.thymeleaf.org)
- [Mustache](https://mustache.github.io/)

> [!TIP]
> If possible, JSPs should be avoided.
> There are several [known limitations](#web.servlet.embedded-container.jsp-limitations) when using them with embedded servlet containers.

When you use one of these templating engines with the default configuration, your templates are picked up automatically from `src/main/resources/templates`.

> [!TIP]
> Depending on how you run your application, your IDE may order the classpath differently.
> Running your application in the IDE from its main method results in a different ordering than when you run your application by using Maven or Gradle or from its packaged jar.
> This can cause Spring Boot to fail to find the expected template.
> If you have this problem, you can reorder the classpath in the IDE to place the module’s classes and resources first.

<a id="web.servlet.spring-mvc.error-handling"></a>

### Error Handling

By default, Spring Boot provides an `/error` mapping that handles all errors in a sensible way, and it is registered as a “global” error page in the servlet container.
For machine clients, it produces a JSON response with details of the error, the HTTP status, and the exception message.
For browser clients, there is a “whitelabel” error view that renders the same data in HTML format (to customize it, add a [`View`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/View.html) that resolves to `error`).

There are a number of `server.error` properties that can be set if you want to customize the default error handling behavior.
See the [Server Properties](../../appendix/application-properties/index.md#appendix.application-properties.server) section of the Appendix.

To replace the default behavior completely, you can implement [`ErrorController`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/error/ErrorController.html) and register a bean definition of that type or add a bean of type [`ErrorAttributes`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/error/ErrorAttributes.html) to use the existing mechanism but replace the contents.

> [!TIP]
> The [`BasicErrorController`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/autoconfigure/web/servlet/error/BasicErrorController.html) can be used as a base class for a custom [`ErrorController`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/error/ErrorController.html).
> This is particularly useful if you want to add a handler for a new content type (the default is to handle `text/html` specifically and provide a fallback for everything else).
> To do so, extend [`BasicErrorController`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/autoconfigure/web/servlet/error/BasicErrorController.html), add a public method with a [`@RequestMapping`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/annotation/RequestMapping.html) that has a `produces` attribute, and create a bean of your new type.

As of Spring Framework 6.0, [RFC 9457 Problem Details](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-ann-rest-exceptions.html) is supported.
Spring MVC can produce custom error messages with the `application/problem+json` media type, like:

```json
{
	"type": "https://example.org/problems/unknown-project",
	"title": "Unknown project",
	"status": 404,
	"detail": "No project found for id 'spring-unknown'",
	"instance": "/projects/spring-unknown"
}
```

This support can be enabled by setting `spring.mvc.problemdetails.enabled` to `true`.

You can also define a class annotated with [`@ControllerAdvice`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/annotation/ControllerAdvice.html) to customize the JSON document to return for a particular controller and/or exception type, as shown in the following example:

#### Java

```java
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@ControllerAdvice(basePackageClasses = SomeController.class)
public class MyControllerAdvice extends ResponseEntityExceptionHandler {

	@ResponseBody
	@ExceptionHandler(MyException.class)
	public ResponseEntity<?> handleControllerException(HttpServletRequest request, Throwable ex) {
		HttpStatus status = getStatus(request);
		return new ResponseEntity<>(new MyErrorBody(status.value(), ex.getMessage()), status);
	}

	private HttpStatus getStatus(HttpServletRequest request) {
		Integer code = (Integer) request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
		HttpStatus status = HttpStatus.resolve(code);
		return (status != null) ? status : HttpStatus.INTERNAL_SERVER_ERROR;
	}

}
```

#### Kotlin

```kotlin
import jakarta.servlet.RequestDispatcher
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler

@ControllerAdvice(basePackageClasses = [SomeController::class])
class MyControllerAdvice : ResponseEntityExceptionHandler() {

	@ResponseBody
	@ExceptionHandler(MyException::class)
	fun handleControllerException(request: HttpServletRequest, ex: Throwable): ResponseEntity<*> {
		val status = getStatus(request)
		return ResponseEntity(MyErrorBody(status.value(), ex.message), status)
	}

	private fun getStatus(request: HttpServletRequest): HttpStatus {
		val code = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE) as Int
		val status = HttpStatus.resolve(code)
		return status ?: HttpStatus.INTERNAL_SERVER_ERROR
	}

}
```

In the preceding example, if `MyException` is thrown by a controller defined in the same package as `SomeController`, a JSON representation of the `MyErrorBody` POJO is used instead of the [`ErrorAttributes`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/error/ErrorAttributes.html) representation.

In some cases, errors handled at the controller level are not recorded by web observations or the [metrics infrastructure](../actuator/metrics.md#actuator.metrics.supported.spring-mvc).
Applications can ensure that such exceptions are recorded with the observations by [setting the handled exception on the observation context](https://docs.spring.io/spring-framework/reference/6.2/integration/observability.html#observability.http-server.servlet).

<a id="web.servlet.spring-mvc.error-handling.error-pages"></a>

#### Custom Error Pages

If you want to display a custom HTML error page for a given status code, you can add a file to an `/error` directory.
Error pages can either be static HTML (that is, added under any of the static resource directories) or be built by using templates.
The name of the file should be the exact status code or a series mask.

For example, to map `404` to a static HTML file, your directory structure would be as follows:

```
src/
 +- main/
     +- java/
     |   + <source code>
     +- resources/
         +- public/
             +- error/
             |   +- 404.html
             +- <other public assets>
```

To map all `5xx` errors by using a FreeMarker template, your directory structure would be as follows:

```
src/
 +- main/
     +- java/
     |   + <source code>
     +- resources/
         +- templates/
             +- error/
             |   +- 5xx.ftlh
             +- <other templates>
```

For more complex mappings, you can also add beans that implement the [`ErrorViewResolver`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/autoconfigure/web/servlet/error/ErrorViewResolver.html) interface, as shown in the following example:

#### Java

```java
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.boot.autoconfigure.web.servlet.error.ErrorViewResolver;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.ModelAndView;

public class MyErrorViewResolver implements ErrorViewResolver {

	@Override
	public ModelAndView resolveErrorView(HttpServletRequest request, HttpStatus status, Map<String, Object> model) {
		// Use the request or status to optionally return a ModelAndView
		if (status == HttpStatus.INSUFFICIENT_STORAGE) {
			// We could add custom model values here
			new ModelAndView("myview");
		}
		return null;
	}

}
```

#### Kotlin

```kotlin
import jakarta.servlet.http.HttpServletRequest
import org.springframework.boot.autoconfigure.web.servlet.error.ErrorViewResolver
import org.springframework.http.HttpStatus
import org.springframework.web.servlet.ModelAndView

class MyErrorViewResolver : ErrorViewResolver {

	override fun resolveErrorView(request: HttpServletRequest, status: HttpStatus,
			model: Map<String, Any>): ModelAndView? {
		// Use the request or status to optionally return a ModelAndView
		if (status == HttpStatus.INSUFFICIENT_STORAGE) {
			// We could add custom model values here
			return ModelAndView("myview")
		}
		return null
	}

}
```

You can also use regular Spring MVC features such as [`@ExceptionHandler` methods](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-servlet/exceptionhandlers.html) and [`@ControllerAdvice`](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-advice.html).
The [`ErrorController`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/error/ErrorController.html) then picks up any unhandled exceptions.

<a id="web.servlet.spring-mvc.error-handling.error-pages-without-spring-mvc"></a>

#### Mapping Error Pages Outside of Spring MVC

For applications that do not use Spring MVC, you can use the [`ErrorPageRegistrar`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/server/ErrorPageRegistrar.html) interface to directly register [`ErrorPage`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/server/ErrorPage.html) instances.
This abstraction works directly with the underlying embedded servlet container and works even if you do not have a Spring MVC [`DispatcherServlet`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/DispatcherServlet.html).

#### Java

```java
import org.springframework.boot.web.server.ErrorPage;
import org.springframework.boot.web.server.ErrorPageRegistrar;
import org.springframework.boot.web.server.ErrorPageRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;

@Configuration(proxyBeanMethods = false)
public class MyErrorPagesConfiguration {

	@Bean
	public ErrorPageRegistrar errorPageRegistrar() {
		return this::registerErrorPages;
	}

	private void registerErrorPages(ErrorPageRegistry registry) {
		registry.addErrorPages(new ErrorPage(HttpStatus.BAD_REQUEST, "/400"));
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.web.server.ErrorPage
import org.springframework.boot.web.server.ErrorPageRegistrar
import org.springframework.boot.web.server.ErrorPageRegistry
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus

@Configuration(proxyBeanMethods = false)
class MyErrorPagesConfiguration {

	@Bean
	fun errorPageRegistrar(): ErrorPageRegistrar {
		return ErrorPageRegistrar { registry: ErrorPageRegistry -> registerErrorPages(registry) }
	}

	private fun registerErrorPages(registry: ErrorPageRegistry) {
		registry.addErrorPages(ErrorPage(HttpStatus.BAD_REQUEST, "/400"))
	}

}
```

> [!NOTE]
> If you register an [`ErrorPage`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/server/ErrorPage.html) with a path that ends up being handled by a [`Filter`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Filter.html) (as is common with some non-Spring web frameworks, like Jersey and Wicket), then the [`Filter`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Filter.html) has to be explicitly registered as an `ERROR` dispatcher, as shown in the following example:

#### Java

```java
import java.util.EnumSet;

import jakarta.servlet.DispatcherType;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyFilterConfiguration {

	@Bean
	public FilterRegistrationBean<MyFilter> myFilter() {
		FilterRegistrationBean<MyFilter> registration = new FilterRegistrationBean<>(new MyFilter());
		// ...
		registration.setDispatcherTypes(EnumSet.allOf(DispatcherType.class));
		return registration;
	}

}
```

#### Kotlin

```kotlin
import jakarta.servlet.DispatcherType
import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.EnumSet

@Configuration(proxyBeanMethods = false)
class MyFilterConfiguration {

	@Bean
	fun myFilter(): FilterRegistrationBean<MyFilter> {
		val registration = FilterRegistrationBean(MyFilter())
		// ...
		registration.setDispatcherTypes(EnumSet.allOf(DispatcherType::class.java))
		return registration
	}

}
```

Note that the default [`FilterRegistrationBean`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/FilterRegistrationBean.html) does not include the `ERROR` dispatcher type.

<a id="web.servlet.spring-mvc.error-handling.in-a-war-deployment"></a>

#### Error Handling in a WAR Deployment

When deployed to a servlet container, Spring Boot uses its error page filter to forward a request with an error status to the appropriate error page.
This is necessary as the servlet specification does not provide an API for registering error pages.
Depending on the container that you are deploying your war file to and the technologies that your application uses, some additional configuration may be required.

The error page filter can only forward the request to the correct error page if the response has not already been committed.
By default, WebSphere Application Server 8.0 and later commits the response upon successful completion of a servlet’s service method.
You should disable this behavior by setting `com.ibm.ws.webcontainer.invokeFlushAfterService` to `false`.

<a id="web.servlet.spring-mvc.cors"></a>

### CORS Support

[Cross-origin resource sharing](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) (CORS) is a [W3C specification](https://www.w3.org/TR/cors/) implemented by [most browsers](https://caniuse.com/#feat=cors) that lets you specify in a flexible way what kind of cross-domain requests are authorized, instead of using some less secure and less powerful approaches such as IFRAME or JSONP.

As of version 4.2, Spring MVC [supports CORS](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc-cors.html).
Using [controller method CORS configuration](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc-cors.html#mvc-cors-controller) with [`@CrossOrigin`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/bind/annotation/CrossOrigin.html) annotations in your Spring Boot application does not require any specific configuration.
[Global CORS configuration](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc-cors.html#mvc-cors-global) can be defined by registering a [`WebMvcConfigurer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/config/annotation/WebMvcConfigurer.html) bean with a customized `addCorsMappings(CorsRegistry)` method, as shown in the following example:

#### Java

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration(proxyBeanMethods = false)
public class MyCorsConfiguration {

	@Bean
	public WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {

			@Override
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/api/**");
			}

		};
	}

}
```

#### Kotlin

```kotlin
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration(proxyBeanMethods = false)
class MyCorsConfiguration {

	@Bean
	fun corsConfigurer(): WebMvcConfigurer {
		return object : WebMvcConfigurer {
			override fun addCorsMappings(registry: CorsRegistry) {
				registry.addMapping("/api/**")
			}
		}
	}

}
```

<a id="web.servlet.jersey"></a>

## JAX-RS and Jersey

If you prefer the JAX-RS programming model for REST endpoints, you can use one of the available implementations instead of Spring MVC.
[Jersey](https://jersey.github.io/) and [Apache CXF](https://cxf.apache.org/) work quite well out of the box.
CXF requires you to register its [`Servlet`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Servlet.html) or [`Filter`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Filter.html) as a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) in your application context.
Jersey has some native Spring support, so we also provide auto-configuration support for it in Spring Boot, together with a starter.

To get started with Jersey, include the `spring-boot-starter-jersey` as a dependency and then you need one [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) of type [`ResourceConfig`](https://javadoc.io/doc/org.glassfish.jersey.core/jersey-server/3.1.9/org/glassfish/jersey/server/ResourceConfig.html) in which you register all the endpoints, as shown in the following example:

```java
import org.glassfish.jersey.server.ResourceConfig;

import org.springframework.stereotype.Component;

@Component
public class MyJerseyConfig extends ResourceConfig {

	public MyJerseyConfig() {
		register(MyEndpoint.class);
	}

}
```

> [!WARNING]
> Jersey’s support for scanning executable archives is rather limited.
> For example, it cannot scan for endpoints in a package found in a [fully executable jar file](../../how-to/deployment/installing.md) or in `WEB-INF/classes` when running an executable war file.
> To avoid this limitation, the `packages` method should not be used, and endpoints should be registered individually by using the `register` method, as shown in the preceding example.

For more advanced customizations, you can also register an arbitrary number of beans that implement [`ResourceConfigCustomizer`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/autoconfigure/jersey/ResourceConfigCustomizer.html).

All the registered endpoints should be a [`@Component`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/stereotype/Component.html) with HTTP resource annotations (`@GET` and others), as shown in the following example:

```java
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;

import org.springframework.stereotype.Component;

@Component
@Path("/hello")
public class MyEndpoint {

	@GET
	public String message() {
		return "Hello";
	}

}
```

Since the [`@Endpoint`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/actuate/endpoint/annotation/Endpoint.html) is a Spring [`@Component`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/stereotype/Component.html), its lifecycle is managed by Spring and you can use the [`@Autowired`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/beans/factory/annotation/Autowired.html) annotation to inject dependencies and use the [`@Value`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/beans/factory/annotation/Value.html) annotation to inject external configuration.
By default, the Jersey servlet is registered and mapped to `/*`.
You can change the mapping by adding [`@ApplicationPath`](https://jakarta.ee/specifications/restful-ws/3.1/apidocs/jakarta/ws/rs/ApplicationPath.html) to your [`ResourceConfig`](https://javadoc.io/doc/org.glassfish.jersey.core/jersey-server/3.1.9/org/glassfish/jersey/server/ResourceConfig.html).

By default, Jersey is set up as a servlet in a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) of type [`ServletRegistrationBean`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/ServletRegistrationBean.html) named `jerseyServletRegistration`.
By default, the servlet is initialized lazily, but you can customize that behavior by setting `spring.jersey.servlet.load-on-startup`.
You can disable or override that bean by creating one of your own with the same name.
You can also use a filter instead of a servlet by setting `spring.jersey.type=filter` (in which case, the [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) to replace or override is `jerseyFilterRegistration`).
The filter has an [`@Order`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/annotation/Order.html), which you can set with `spring.jersey.filter.order`.
When using Jersey as a filter, a servlet that will handle any requests that are not intercepted by Jersey must be present.
If your application does not contain such a servlet, you may want to enable the default servlet by setting `server.servlet.register-default-servlet` to `true`.
Both the servlet and the filter registrations can be given init parameters by using `spring.jersey.init.*` to specify a map of properties.

<a id="web.servlet.embedded-container"></a>

## Embedded Servlet Container Support

For servlet application, Spring Boot includes support for embedded [Tomcat](https://tomcat.apache.org/), [Jetty](https://www.eclipse.org/jetty/), and [Undertow](https://github.com/undertow-io/undertow) servers.
Most developers use the appropriate starter to obtain a fully configured instance.
By default, the embedded server listens for HTTP requests on port `8080`.

<a id="web.servlet.embedded-container.servlets-filters-listeners"></a>

### Servlets, Filters, and Listeners

When using an embedded servlet container, you can register servlets, filters, and all the listeners (such as [`HttpSessionListener`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/http/HttpSessionListener.html)) from the servlet spec, either by using Spring beans or by scanning for servlet components.

<a id="web.servlet.embedded-container.servlets-filters-listeners.beans"></a>

#### Registering Servlets, Filters, and Listeners as Spring Beans

Any [`Servlet`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Servlet.html), [`Filter`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Filter.html), or servlet `*Listener` instance that is a Spring bean is registered with the embedded container.
This can be particularly convenient if you want to refer to a value from your `application.properties` during configuration.

By default, if the context contains only a single Servlet, it is mapped to `/`.
In the case of multiple servlet beans, the bean name is used as a path prefix.
Filters map to `/*`.

If convention-based mapping is not flexible enough, you can use the [`ServletRegistrationBean`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/ServletRegistrationBean.html), [`FilterRegistrationBean`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/FilterRegistrationBean.html), and [`ServletListenerRegistrationBean`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/ServletListenerRegistrationBean.html) classes for complete control.

It is usually safe to leave filter beans unordered.
If a specific order is required, you should annotate the [`Filter`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Filter.html) with [`@Order`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/annotation/Order.html) or make it implement [`Ordered`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/Ordered.html).
You cannot configure the order of a [`Filter`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Filter.html) by annotating its bean method with [`@Order`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/annotation/Order.html).
If you cannot change the [`Filter`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Filter.html) class to add [`@Order`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/annotation/Order.html) or implement [`Ordered`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/Ordered.html), you must define a [`FilterRegistrationBean`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/FilterRegistrationBean.html) for the [`Filter`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Filter.html) and set the registration bean’s order using the `setOrder(int)` method.
Avoid configuring a filter that reads the request body at `Ordered.HIGHEST_PRECEDENCE`, since it might go against the character encoding configuration of your application.
If a servlet filter wraps the request, it should be configured with an order that is less than or equal to `OrderedFilter.REQUEST_WRAPPER_FILTER_MAX_ORDER`.

> [!TIP]
> To see the order of every [`Filter`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Filter.html) in your application, enable debug level logging for the `web` [logging group](../features/logging.md#features.logging.log-groups) (`logging.level.web=debug`).
> Details of the registered filters, including their order and URL patterns, will then be logged at startup.

> [!WARNING]
> Take care when registering [`Filter`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Filter.html) beans since they are initialized very early in the application lifecycle.
> If you need to register a [`Filter`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/Filter.html) that interacts with other beans, consider using a [`DelegatingFilterProxyRegistrationBean`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/DelegatingFilterProxyRegistrationBean.html) instead.

<a id="web.servlet.embedded-container.context-initializer"></a>

### Servlet Context Initialization

Embedded servlet containers do not directly execute the [`ServletContainerInitializer`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/ServletContainerInitializer.html) interface or Spring’s [`WebApplicationInitializer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/WebApplicationInitializer.html) interface.
This is an intentional design decision intended to reduce the risk that third party libraries designed to run inside a war may break Spring Boot applications.

If you need to perform servlet context initialization in a Spring Boot application, you should register a bean that implements the [`ServletContextInitializer`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/ServletContextInitializer.html) interface.
The single `onStartup` method provides access to the [`ServletContext`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/ServletContext.html) and, if necessary, can easily be used as an adapter to an existing [`WebApplicationInitializer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/WebApplicationInitializer.html).

<a id="web.servlet.embedded-container.context-initializer.scanning"></a>

#### Scanning for Servlets, Filters, and listeners

When using an embedded container, automatic registration of classes annotated with [`@WebServlet`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/annotation/WebServlet.html), [`@WebFilter`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/annotation/WebFilter.html), and [`@WebListener`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/annotation/WebListener.html) can be enabled by using [`@ServletComponentScan`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/ServletComponentScan.html).

> [!TIP]
> [`@ServletComponentScan`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/ServletComponentScan.html) has no effect in a standalone container, where the container’s built-in discovery mechanisms are used instead.

<a id="web.servlet.embedded-container.application-context"></a>

### The ServletWebServerApplicationContext

Under the hood, Spring Boot uses a different type of [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ApplicationContext.html) for embedded servlet container support.
The [`ServletWebServerApplicationContext`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/context/ServletWebServerApplicationContext.html) is a special type of [`WebApplicationContext`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/context/WebApplicationContext.html) that bootstraps itself by searching for a single [`ServletWebServerFactory`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/server/ServletWebServerFactory.html) bean.
Usually a [`TomcatServletWebServerFactory`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/embedded/tomcat/TomcatServletWebServerFactory.html), [`JettyServletWebServerFactory`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/embedded/jetty/JettyServletWebServerFactory.html), or [`UndertowServletWebServerFactory`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/embedded/undertow/UndertowServletWebServerFactory.html) has been auto-configured.

> [!NOTE]
> You usually do not need to be aware of these implementation classes.
> Most applications are auto-configured, and the appropriate [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ApplicationContext.html) and [`ServletWebServerFactory`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/server/ServletWebServerFactory.html) are created on your behalf.

In an embedded container setup, the [`ServletContext`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/ServletContext.html) is set as part of server startup which happens during application context initialization.
Because of this beans in the [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ApplicationContext.html) cannot be reliably initialized with a [`ServletContext`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/ServletContext.html).
One way to get around this is to inject [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ApplicationContext.html) as a dependency of the bean and access the [`ServletContext`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/ServletContext.html) only when it is needed.
Another way is to use a callback once the server has started.
This can be done using an [`ApplicationListener`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ApplicationListener.html) which listens for the [`ApplicationStartedEvent`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/context/event/ApplicationStartedEvent.html) as follows:

```java
import jakarta.servlet.ServletContext;

import org.springframework.boot.context.event.ApplicationStartedEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationListener;
import org.springframework.web.context.WebApplicationContext;

public class MyDemoBean implements ApplicationListener<ApplicationStartedEvent> {

	private ServletContext servletContext;

	@Override
	public void onApplicationEvent(ApplicationStartedEvent event) {
		ApplicationContext applicationContext = event.getApplicationContext();
		this.servletContext = ((WebApplicationContext) applicationContext).getServletContext();
	}

}
```

<a id="web.servlet.embedded-container.customizing"></a>

### Customizing Embedded Servlet Containers

Common servlet container settings can be configured by using Spring [`Environment`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/env/Environment.html) properties.
Usually, you would define the properties in your `application.properties` or `application.yaml` file.

Common server settings include:

- Network settings: Listen port for incoming HTTP requests (`server.port`), interface address to bind to (`server.address`), and so on.
- Session settings: Whether the session is persistent (`server.servlet.session.persistent`), session timeout (`server.servlet.session.timeout`), location of session data (`server.servlet.session.store-dir`), and session-cookie configuration (`server.servlet.session.cookie.*`).
- Error management: Location of the error page (`server.error.path`) and so on.
- [SSL](../../how-to/webserver.md#howto.webserver.configure-ssl)
- [HTTP compression](../../how-to/webserver.md#howto.webserver.enable-response-compression)

Spring Boot tries as much as possible to expose common settings, but this is not always possible.
For those cases, dedicated namespaces offer server-specific customizations (see `server.tomcat` and `server.undertow`).
For instance, [access logs](../../how-to/webserver.md#howto.webserver.configure-access-logs) can be configured with specific features of the embedded servlet container.

> [!TIP]
> See the [`ServerProperties`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/autoconfigure/web/ServerProperties.html) class for a complete list.

<a id="web.servlet.embedded-container.customizing.samesite"></a>

#### SameSite Cookies

The `SameSite` cookie attribute can be used by web browsers to control if and how cookies are submitted in cross-site requests.
The attribute is particularly relevant for modern web browsers which have started to change the default value that is used when the attribute is missing.

If you want to change the `SameSite` attribute of your session cookie, you can use the `server.servlet.session.cookie.same-site` property.
This property is supported by auto-configured Tomcat, Jetty and Undertow servers.
It is also used to configure Spring Session servlet based [`SessionRepository`](https://docs.spring.io/spring-session/docs/3.4.x/api/org/springframework/session/SessionRepository.html) beans.

For example, if you want your session cookie to have a `SameSite` attribute of `None`, you can add the following to your `application.properties` or `application.yaml` file:

#### Properties

```properties
server.servlet.session.cookie.same-site=none
```

#### YAML

```yaml
server:
  servlet:
    session:
      cookie:
        same-site: "none"
```

If you want to change the `SameSite` attribute on other cookies added to your [`HttpServletResponse`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/http/HttpServletResponse.html), you can use a [`CookieSameSiteSupplier`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/server/CookieSameSiteSupplier.html).
The [`CookieSameSiteSupplier`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/server/CookieSameSiteSupplier.html) is passed a [`Cookie`](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/http/Cookie.html) and may return a `SameSite` value, or `null`.

There are a number of convenience factory and filter methods that you can use to quickly match specific cookies.
For example, adding the following bean will automatically apply a `SameSite` of `Lax` for all cookies with a name that matches the regular expression `myapp.*`.

#### Java

```java
import org.springframework.boot.web.servlet.server.CookieSameSiteSupplier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MySameSiteConfiguration {

	@Bean
	public CookieSameSiteSupplier applicationCookieSameSiteSupplier() {
		return CookieSameSiteSupplier.ofLax().whenHasNameMatching("myapp.*");
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.web.servlet.server.CookieSameSiteSupplier
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MySameSiteConfiguration {

	@Bean
	fun applicationCookieSameSiteSupplier(): CookieSameSiteSupplier {
		return CookieSameSiteSupplier.ofLax().whenHasNameMatching("myapp.*")
	}

}
```

<a id="web.servlet.embedded-container.customizing.encoding"></a>

#### Character Encoding

The character encoding behavior of the embedded servlet container for request and response handling can be configured using the `server.servlet.encoding.*` configuration properties.

When a request’s `Accept-Language` header indicates a locale for the request it will be automatically mapped to a charset by the servlet container.
Each container provides default locale to charset mappings and you should verify that they meet your application’s needs.
When they do not, use the `server.servlet.encoding.mapping` configuration property to customize the mappings, as shown in the following example:

#### Properties

```properties
server.servlet.encoding.mapping.ko=UTF-8
```

#### YAML

```yaml
server:
  servlet:
    encoding:
      mapping:
        ko: "UTF-8"
```

In the preceding example, the `ko` (Korean) locale has been mapped to `UTF-8`.
This is equivalent to a `<locale-encoding-mapping-list>` entry in a `web.xml` file of a traditional war deployment.

<a id="web.servlet.embedded-container.customizing.programmatic"></a>

#### Programmatic Customization

If you need to programmatically configure your embedded servlet container, you can register a Spring bean that implements the [`WebServerFactoryCustomizer`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/server/WebServerFactoryCustomizer.html) interface.
[`WebServerFactoryCustomizer`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/server/WebServerFactoryCustomizer.html) provides access to the [`ConfigurableServletWebServerFactory`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/server/ConfigurableServletWebServerFactory.html), which includes numerous customization setter methods.
The following example shows programmatically setting the port:

#### Java

```java
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.stereotype.Component;

@Component
public class MyWebServerFactoryCustomizer implements WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> {

	@Override
	public void customize(ConfigurableServletWebServerFactory server) {
		server.setPort(9000);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.web.server.WebServerFactoryCustomizer
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory
import org.springframework.stereotype.Component

@Component
class MyWebServerFactoryCustomizer : WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> {

	override fun customize(server: ConfigurableServletWebServerFactory) {
		server.setPort(9000)
	}

}
```

[`TomcatServletWebServerFactory`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/embedded/tomcat/TomcatServletWebServerFactory.html), [`JettyServletWebServerFactory`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/embedded/jetty/JettyServletWebServerFactory.html) and [`UndertowServletWebServerFactory`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/embedded/undertow/UndertowServletWebServerFactory.html) are dedicated variants of [`ConfigurableServletWebServerFactory`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/server/ConfigurableServletWebServerFactory.html) that have additional customization setter methods for Tomcat, Jetty and Undertow respectively.
The following example shows how to customize [`TomcatServletWebServerFactory`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/embedded/tomcat/TomcatServletWebServerFactory.html) that provides access to Tomcat-specific configuration options:

#### Java

```java
import java.time.Duration;

import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.stereotype.Component;

@Component
public class MyTomcatWebServerFactoryCustomizer implements WebServerFactoryCustomizer<TomcatServletWebServerFactory> {

	@Override
	public void customize(TomcatServletWebServerFactory server) {
		server.addConnectorCustomizers((connector) -> connector.setAsyncTimeout(Duration.ofSeconds(20).toMillis()));
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory
import org.springframework.boot.web.server.WebServerFactoryCustomizer
import org.springframework.stereotype.Component
import java.time.Duration

@Component
class MyTomcatWebServerFactoryCustomizer : WebServerFactoryCustomizer<TomcatServletWebServerFactory> {

	override fun customize(server: TomcatServletWebServerFactory) {
		server.addConnectorCustomizers({ connector -> connector.asyncTimeout = Duration.ofSeconds(20).toMillis() })
	}

}
```

<a id="web.servlet.embedded-container.customizing.direct"></a>

#### Customizing ConfigurableServletWebServerFactory Directly

For more advanced use cases that require you to extend from [`ServletWebServerFactory`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/server/ServletWebServerFactory.html), you can expose a bean of such type yourself.

Setters are provided for many configuration options.
Several protected method “hooks” are also provided should you need to do something more exotic.
See the [`ConfigurableServletWebServerFactory`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/web/servlet/server/ConfigurableServletWebServerFactory.html) API documentation for details.

> [!NOTE]
> Auto-configured customizers are still applied on your custom factory, so use that option carefully.

<a id="web.servlet.embedded-container.jsp-limitations"></a>

### JSP Limitations

When running a Spring Boot application that uses an embedded servlet container (and is packaged as an executable archive), there are some limitations in the JSP support.

- With Jetty and Tomcat, it should work if you use war packaging.
An executable war will work when launched with `java -jar`, and will also be deployable to any standard container.
JSPs are not supported when using an executable jar.
- Undertow does not support JSPs.
- Creating a custom `error.jsp` page does not override the default view for [error handling](#web.servlet.spring-mvc.error-handling).
[Custom error pages](#web.servlet.spring-mvc.error-handling.error-pages) should be used instead.
