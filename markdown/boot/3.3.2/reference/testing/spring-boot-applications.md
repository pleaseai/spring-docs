---
title: "Testing Spring Boot Applications"
source: "reference:testing/spring-boot-applications.adoc"
---

<a id="testing.spring-boot-applications"></a>

# Testing Spring Boot Applications

A Spring Boot application is a Spring `ApplicationContext`, so nothing very special has to be done to test it beyond what you would normally do with a vanilla Spring context.

> [!NOTE]
> External properties, logging, and other features of Spring Boot are installed in the context by default only if you use `SpringApplication` to create it.

Spring Boot provides a `@SpringBootTest` annotation, which can be used as an alternative to the standard `spring-test` `@ContextConfiguration` annotation when you need Spring Boot features.
The annotation works by [creating the `ApplicationContext` used in your tests through `SpringApplication`](#testing.spring-boot-applications.detecting-configuration).
In addition to `@SpringBootTest` a number of other annotations are also provided for [testing more specific slices](#testing.spring-boot-applications.autoconfigured-tests) of an application.

> [!TIP]
> If you are using JUnit 4, do not forget to also add `@RunWith(SpringRunner.class)` to your test, otherwise the annotations will be ignored.
> If you are using JUnit 5, there is no need to add the equivalent `@ExtendWith(SpringExtension.class)` as `@SpringBootTest` and the other `@…​Test` annotations are already annotated with it.

By default, `@SpringBootTest` will not start a server.
You can use the `webEnvironment` attribute of `@SpringBootTest` to further refine how your tests run:

- `MOCK`(Default) : Loads a web `ApplicationContext` and provides a mock web environment.
Embedded servers are not started when using this annotation.
If a web environment is not available on your classpath, this mode transparently falls back to creating a regular non-web `ApplicationContext`.
It can be used in conjunction with [`@AutoConfigureMockMvc` or `@AutoConfigureWebTestClient`](#testing.spring-boot-applications.with-mock-environment) for mock-based testing of your web application.
- `RANDOM_PORT`: Loads a `WebServerApplicationContext` and provides a real web environment.
Embedded servers are started and listen on a random port.
- `DEFINED_PORT`: Loads a `WebServerApplicationContext` and provides a real web environment.
Embedded servers are started and listen on a defined port (from your `application.properties`) or on the default port of `8080`.
- `NONE`: Loads an `ApplicationContext` by using `SpringApplication` but does not provide *any* web environment (mock or otherwise).

> [!NOTE]
> If your test is `@Transactional`, it rolls back the transaction at the end of each test method by default.
> However, as using this arrangement with either `RANDOM_PORT` or `DEFINED_PORT` implicitly provides a real servlet environment, the HTTP client and server run in separate threads and, thus, in separate transactions.
> Any transaction initiated on the server does not roll back in this case.

> [!NOTE]
> `@SpringBootTest` with `webEnvironment = WebEnvironment.RANDOM_PORT` will also start the management server on a separate random port if your application uses a different port for the management server.

<a id="testing.spring-boot-applications.detecting-web-app-type"></a>

## Detecting Web Application Type

If Spring MVC is available, a regular MVC-based application context is configured.
If you have only Spring WebFlux, we will detect that and configure a WebFlux-based application context instead.

If both are present, Spring MVC takes precedence.
If you want to test a reactive web application in this scenario, you must set the `spring.main.web-application-type` property:

```java
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "spring.main.web-application-type=reactive")
class MyWebFluxTests {

	// ...

}
```

<a id="testing.spring-boot-applications.detecting-configuration"></a>

## Detecting Test Configuration

If you are familiar with the Spring Test Framework, you may be used to using `@ContextConfiguration(classes=…​)` in order to specify which Spring `@Configuration` to load.
Alternatively, you might have often used nested `@Configuration` classes within your test.

When testing Spring Boot applications, this is often not required.
Spring Boot’s `@*Test` annotations search for your primary configuration automatically whenever you do not explicitly define one.

The search algorithm works up from the package that contains the test until it finds a class annotated with `@SpringBootApplication` or `@SpringBootConfiguration`.
As long as you [structured your code](../using/structuring-your-code.md) in a sensible way, your main configuration is usually found.

> [!NOTE]
> If you use a [test annotation to test a more specific slice of your application](#testing.spring-boot-applications.autoconfigured-tests), you should avoid adding configuration settings that are specific to a particular area on the [main method’s application class](#testing.spring-boot-applications.user-configuration-and-slicing).
>
> The underlying component scan configuration of `@SpringBootApplication` defines exclude filters that are used to make sure slicing works as expected.
> If you are using an explicit `@ComponentScan` directive on your `@SpringBootApplication`-annotated class, be aware that those filters will be disabled.
> If you are using slicing, you should define them again.

If you want to customize the primary configuration, you can use a nested `@TestConfiguration` class.
Unlike a nested `@Configuration` class, which would be used instead of your application’s primary configuration, a nested `@TestConfiguration` class is used in addition to your application’s primary configuration.

> [!NOTE]
> Spring’s test framework caches application contexts between tests.
> Therefore, as long as your tests share the same configuration (no matter how it is discovered), the potentially time-consuming process of loading the context happens only once.

<a id="testing.spring-boot-applications.using-main"></a>

## Using the Test Configuration Main Method

Typically the test configuration discovered by `@SpringBootTest` will be your main `@SpringBootApplication`.
In most well structured applications, this configuration class will also include the `main` method used to launch the application.

For example, the following is a very common code pattern for a typical Spring Boot application:

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyApplication {

	public static void main(String[] args) {
		SpringApplication.run(MyApplication.class, args);
	}

}
```

In the example above, the `main` method doesn’t do anything other than delegate to `SpringApplication.run`.
It is, however, possible to have a more complex `main` method that applies customizations before calling `SpringApplication.run`.

For example, here is an application that changes the banner mode and sets additional profiles:

```java
import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyApplication {

	public static void main(String[] args) {
		SpringApplication application = new SpringApplication(MyApplication.class);
		application.setBannerMode(Banner.Mode.OFF);
		application.setAdditionalProfiles("myprofile");
		application.run(args);
	}

}
```

Since customizations in the `main` method can affect the resulting `ApplicationContext`, it’s possible that you might also want to use the `main` method to create the `ApplicationContext` used in your tests.
By default, `@SpringBootTest` will not call your `main` method, and instead the class itself is used directly to create the `ApplicationContext`

If you want to change this behavior, you can change the `useMainMethod` attribute of `@SpringBootTest` to `UseMainMethod.ALWAYS` or `UseMainMethod.WHEN_AVAILABLE`.
When set to `ALWAYS`, the test will fail if no `main` method can be found.
When set to `WHEN_AVAILABLE` the `main` method will be used if it is available, otherwise the standard loading mechanism will be used.

For example, the following test will invoke the `main` method of `MyApplication` in order to create the `ApplicationContext`.
If the main method sets additional profiles then those will be active when the `ApplicationContext` starts.

```java
import org.junit.jupiter.api.Test;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.UseMainMethod;

@SpringBootTest(useMainMethod = UseMainMethod.ALWAYS)
class MyApplicationTests {

	@Test
	void exampleTest() {
		// ...
	}

}
```

<a id="testing.spring-boot-applications.excluding-configuration"></a>

## Excluding Test Configuration

If your application uses component scanning (for example, if you use `@SpringBootApplication` or `@ComponentScan`), you may find top-level configuration classes that you created only for specific tests accidentally get picked up everywhere.

As we [have seen earlier](#testing.spring-boot-applications.detecting-configuration), `@TestConfiguration` can be used on an inner class of a test to customize the primary configuration.
`@TestConfiguration` can also be used on a top-level class. Doing so indicates that the class should not be picked up by scanning.
You can then import the class explicitly where it is required, as shown in the following example:

```java
import org.junit.jupiter.api.Test;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(MyTestsConfiguration.class)
class MyTests {

	@Test
	void exampleTest() {
		// ...
	}

}
```

> [!NOTE]
> If you directly use `@ComponentScan` (that is, not through `@SpringBootApplication`) you need to register the `TypeExcludeFilter` with it.
> See the [`TypeExcludeFilter`](https://docs.spring.io/spring-boot/3.3.2/api/java/org/springframework/boot/context/TypeExcludeFilter.html) API documentation for details.

> [!NOTE]
> An imported `@TestConfiguration` is processed earlier than an inner-class `@TestConfiguration` and an imported `@TestConfiguration` will be processed before any configuration found through component scanning.
> Generally speaking, this difference in ordering has no noticeable effect but it is something to be aware of if you’re relying on bean overriding.

<a id="testing.spring-boot-applications.using-application-arguments"></a>

## Using Application Arguments

If your application expects [arguments](../features/spring-application.md#features.spring-application.application-arguments), you can
have `@SpringBootTest` inject them using the `args` attribute.

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(args = "--app.test=one")
class MyApplicationArgumentTests {

	@Test
	void applicationArgumentsPopulated(@Autowired ApplicationArguments args) {
		assertThat(args.getOptionNames()).containsOnly("app.test");
		assertThat(args.getOptionValues("app.test")).containsOnly("one");
	}

}
```

<a id="testing.spring-boot-applications.with-mock-environment"></a>

## Testing With a Mock Environment

By default, `@SpringBootTest` does not start the server but instead sets up a mock environment for testing web endpoints.

With Spring MVC, we can query our web endpoints using [`MockMvc`](https://docs.spring.io/spring-framework/reference/6.1.11/testing/spring-mvc-test-framework.html) or `WebTestClient`, as shown in the following example:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MyMockMvcTests {

	@Test
	void testWithMockMvc(@Autowired MockMvc mvc) throws Exception {
		mvc.perform(get("/")).andExpect(status().isOk()).andExpect(content().string("Hello World"));
	}

	// If Spring WebFlux is on the classpath, you can drive MVC tests with a WebTestClient
	@Test
	void testWithWebTestClient(@Autowired WebTestClient webClient) {
		webClient
				.get().uri("/")
				.exchange()
				.expectStatus().isOk()
				.expectBody(String.class).isEqualTo("Hello World");
	}

}
```

> [!TIP]
> If you want to focus only on the web layer and not start a complete `ApplicationContext`, consider [using `@WebMvcTest` instead](#testing.spring-boot-applications.spring-mvc-tests).

With Spring WebFlux endpoints, you can use [`WebTestClient`](https://docs.spring.io/spring-framework/reference/6.1.11/testing/webtestclient.html) as shown in the following example:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest
@AutoConfigureWebTestClient
class MyMockWebTestClientTests {

	@Test
	void exampleTest(@Autowired WebTestClient webClient) {
		webClient
			.get().uri("/")
			.exchange()
			.expectStatus().isOk()
			.expectBody(String.class).isEqualTo("Hello World");
	}

}
```

> [!TIP]
> Testing within a mocked environment is usually faster than running with a full servlet container.
> However, since mocking occurs at the Spring MVC layer, code that relies on lower-level servlet container behavior cannot be directly tested with MockMvc.
>
> For example, Spring Boot’s error handling is based on the “error page” support provided by the servlet container.
> This means that, whilst you can test your MVC layer throws and handles exceptions as expected, you cannot directly test that a specific [custom error page](../web/servlet.md#web.servlet.spring-mvc.error-handling.error-pages) is rendered.
> If you need to test these lower-level concerns, you can start a fully running server as described in the next section.

<a id="testing.spring-boot-applications.with-running-server"></a>

## Testing With a Running Server

If you need to start a full running server, we recommend that you use random ports.
If you use `@SpringBootTest(webEnvironment=WebEnvironment.RANDOM_PORT)`, an available port is picked at random each time your test runs.

The `@LocalServerPort` annotation can be used to [inject the actual port used](../../how-to/webserver.md#howto.webserver.discover-port) into your test.
For convenience, tests that need to make REST calls to the started server can additionally `@Autowire` a [`WebTestClient`](https://docs.spring.io/spring-framework/reference/6.1.11/testing/webtestclient.html), which resolves relative links to the running server and comes with a dedicated API for verifying responses, as shown in the following example:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class MyRandomPortWebTestClientTests {

	@Test
	void exampleTest(@Autowired WebTestClient webClient) {
		webClient
			.get().uri("/")
			.exchange()
			.expectStatus().isOk()
			.expectBody(String.class).isEqualTo("Hello World");
	}

}
```

> [!TIP]
> `WebTestClient` can also used with a [mock environment](#testing.spring-boot-applications.with-mock-environment), removing the need for a running server, by annotating your test class with `@AutoConfigureWebTestClient`.

This setup requires `spring-webflux` on the classpath.
If you can not or will not add webflux, Spring Boot also provides a `TestRestTemplate` facility:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.client.TestRestTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class MyRandomPortTestRestTemplateTests {

	@Test
	void exampleTest(@Autowired TestRestTemplate restTemplate) {
		String body = restTemplate.getForObject("/", String.class);
		assertThat(body).isEqualTo("Hello World");
	}

}
```

<a id="testing.spring-boot-applications.customizing-web-test-client"></a>

## Customizing WebTestClient

To customize the `WebTestClient` bean, configure a `WebTestClientBuilderCustomizer` bean.
Any such beans are called with the `WebTestClient.Builder` that is used to create the `WebTestClient`.

<a id="testing.spring-boot-applications.jmx"></a>

## Using JMX

As the test context framework caches context, JMX is disabled by default to prevent identical components to register on the same domain.
If such test needs access to an `MBeanServer`, consider marking it dirty as well:

```java
import javax.management.MBeanServer;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = "spring.jmx.enabled=true")
@DirtiesContext
class MyJmxTests {

	@Autowired
	private MBeanServer mBeanServer;

	@Test
	void exampleTest() {
		assertThat(this.mBeanServer.getDomains()).contains("java.lang");
		// ...
	}

}
```

<a id="testing.spring-boot-applications.observations"></a>

## Using Observations

If you annotate [a sliced test](#testing.spring-boot-applications.autoconfigured-tests) with `@AutoConfigureObservability`, it auto-configures an `ObservationRegistry`.

<a id="testing.spring-boot-applications.metrics"></a>

## Using Metrics

Regardless of your classpath, meter registries, except the in-memory backed, are not auto-configured when using `@SpringBootTest`.

If you need to export metrics to a different backend as part of an integration test, annotate it with `@AutoConfigureObservability`.

If you annotate [a sliced test](#testing.spring-boot-applications.autoconfigured-tests) with `@AutoConfigureObservability`, it auto-configures an in-memory `MeterRegistry`.
Data exporting in sliced tests is not supported with the `@AutoConfigureObservability` annotation.

<a id="testing.spring-boot-applications.tracing"></a>

## Using Tracing

Regardless of your classpath, tracing components which are reporting data are not auto-configured when using `@SpringBootTest`.

If you need those components as part of an integration test, annotate the test with `@AutoConfigureObservability`.

If you have created your own reporting components (e.g. a custom `SpanExporter` or `SpanHandler`) and you don’t want them to be active in tests, you can use the `@ConditionalOnEnabledTracing` annotation to disable them.

If you annotate [a sliced test](#testing.spring-boot-applications.autoconfigured-tests) with `@AutoConfigureObservability`, it auto-configures a no-op `Tracer`.
Data exporting in sliced tests is not supported with the `@AutoConfigureObservability` annotation.

<a id="testing.spring-boot-applications.mocking-beans"></a>

## Mocking and Spying Beans

When running tests, it is sometimes necessary to mock certain components within your application context.
For example, you may have a facade over some remote service that is unavailable during development.
Mocking can also be useful when you want to simulate failures that might be hard to trigger in a real environment.

Spring Boot includes a `@MockBean` annotation that can be used to define a Mockito mock for a bean inside your `ApplicationContext`.
You can use the annotation to add new beans or replace a single existing bean definition.
The annotation can be used directly on test classes, on fields within your test, or on `@Configuration` classes and fields.
When used on a field, the instance of the created mock is also injected.
Mock beans are automatically reset after each test method.

> [!NOTE]
> If your test uses one of Spring Boot’s test annotations (such as `@SpringBootTest`), this feature is automatically enabled.
> To use this feature with a different arrangement, listeners must be explicitly added, as shown in the following example:
>
> ```java
> import org.springframework.boot.test.mock.mockito.MockitoTestExecutionListener;
> import org.springframework.boot.test.mock.mockito.ResetMocksTestExecutionListener;
> import org.springframework.test.context.ContextConfiguration;
> import org.springframework.test.context.TestExecutionListeners;
>
> @ContextConfiguration(classes = MyConfig.class)
> @TestExecutionListeners({ MockitoTestExecutionListener.class, ResetMocksTestExecutionListener.class })
> class MyTests {
>
> 	// ...
>
> }
> ```

The following example replaces an existing `RemoteService` bean with a mock implementation:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@SpringBootTest
class MyTests {

	@Autowired
	private Reverser reverser;

	@MockBean
	private RemoteService remoteService;

	@Test
	void exampleTest() {
		given(this.remoteService.getValue()).willReturn("spring");
		String reverse = this.reverser.getReverseValue(); // Calls injected RemoteService
		assertThat(reverse).isEqualTo("gnirps");
	}

}
```

> [!NOTE]
> `@MockBean` cannot be used to mock the behavior of a bean that is exercised during application context refresh.
> By the time the test is executed, the application context refresh has completed and it is too late to configure the mocked behavior.
> We recommend using a `@Bean` method to create and configure the mock in this situation.

Additionally, you can use `@SpyBean` to wrap any existing bean with a Mockito `spy`.
See the [`SpyBean`](https://docs.spring.io/spring-boot/3.3.2/api/java/org/springframework/boot/test/mock/mockito/SpyBean.html) API documentation for full details.

> [!NOTE]
> While Spring’s test framework caches application contexts between tests and reuses a context for tests sharing the same configuration, the use of `@MockBean` or `@SpyBean` influences the cache key, which will most likely increase the number of contexts.

> [!TIP]
> If you are using `@SpyBean` to spy on a bean with `@Cacheable` methods that refer to parameters by name, your application must be compiled with `-parameters`.
> This ensures that the parameter names are available to the caching infrastructure once the bean has been spied upon.

> [!TIP]
> When you are using `@SpyBean` to spy on a bean that is proxied by Spring, you may need to remove Spring’s proxy in some situations, for example when setting expectations using `given` or `when`.
> Use `AopTestUtils.getTargetObject(yourProxiedSpy)` to do so.

<a id="testing.spring-boot-applications.autoconfigured-tests"></a>

## Auto-configured Tests

Spring Boot’s auto-configuration system works well for applications but can sometimes be a little too much for tests.
It often helps to load only the parts of the configuration that are required to test a “slice” of your application.
For example, you might want to test that Spring MVC controllers are mapping URLs correctly, and you do not want to involve database calls in those tests, or you might want to test JPA entities, and you are not interested in the web layer when those tests run.

The `spring-boot-test-autoconfigure` module includes a number of annotations that can be used to automatically configure such “slices”.
Each of them works in a similar way, providing a `@…​Test` annotation that loads the `ApplicationContext` and one or more `@AutoConfigure…​` annotations that can be used to customize auto-configuration settings.

> [!NOTE]
> Each slice restricts component scan to appropriate components and loads a very restricted set of auto-configuration classes.
> If you need to exclude one of them, most `@…​Test` annotations provide an `excludeAutoConfiguration` attribute.
> Alternatively, you can use `@ImportAutoConfiguration#exclude`.

> [!NOTE]
> Including multiple “slices” by using several `@…​Test` annotations in one test is not supported.
> If you need multiple “slices”, pick one of the `@…​Test` annotations and include the `@AutoConfigure…​` annotations of the other “slices” by hand.

> [!TIP]
> It is also possible to use the `@AutoConfigure…​` annotations with the standard `@SpringBootTest` annotation.
> You can use this combination if you are not interested in “slicing” your application but you want some of the auto-configured test beans.

<a id="testing.spring-boot-applications.json-tests"></a>

## Auto-configured JSON Tests

To test that object JSON serialization and deserialization is working as expected, you can use the `@JsonTest` annotation.
`@JsonTest` auto-configures the available supported JSON mapper, which can be one of the following libraries:

- Jackson `ObjectMapper`, any `@JsonComponent` beans and any Jackson `Module`s
- `Gson`
- `Jsonb`

> [!TIP]
> A list of the auto-configurations that are enabled by `@JsonTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

If you need to configure elements of the auto-configuration, you can use the `@AutoConfigureJsonTesters` annotation.

Spring Boot includes AssertJ-based helpers that work with the JSONAssert and JsonPath libraries to check that JSON appears as expected.
The `JacksonTester`, `GsonTester`, `JsonbTester`, and `BasicJsonTester` classes can be used for Jackson, Gson, Jsonb, and Strings respectively.
Any helper fields on the test class can be `@Autowired` when using `@JsonTest`.
The following example shows a test class for Jackson:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;

import static org.assertj.core.api.Assertions.assertThat;

@JsonTest
class MyJsonTests {

	@Autowired
	private JacksonTester<VehicleDetails> json;

	@Test
	void serialize() throws Exception {
		VehicleDetails details = new VehicleDetails("Honda", "Civic");
		// Assert against a `.json` file in the same package as the test
		assertThat(this.json.write(details)).isEqualToJson("expected.json");
		// Or use JSON path based assertions
		assertThat(this.json.write(details)).hasJsonPathStringValue("@.make");
		assertThat(this.json.write(details)).extractingJsonPathStringValue("@.make").isEqualTo("Honda");
	}

	@Test
	void deserialize() throws Exception {
		String content = "{\"make\":\"Ford\",\"model\":\"Focus\"}";
		assertThat(this.json.parse(content)).isEqualTo(new VehicleDetails("Ford", "Focus"));
		assertThat(this.json.parseObject(content).getMake()).isEqualTo("Ford");
	}

}
```

> [!NOTE]
> JSON helper classes can also be used directly in standard unit tests.
> To do so, call the `initFields` method of the helper in your `@Before` method if you do not use `@JsonTest`.

If you use Spring Boot’s AssertJ-based helpers to assert on a number value at a given JSON path, you might not be able to use `isEqualTo` depending on the type.
Instead, you can use AssertJ’s `satisfies` to assert that the value matches the given condition.
For instance, the following example asserts that the actual number is a float value close to `0.15` within an offset of `0.01`.

```java
	@Test
	void someTest() throws Exception {
		SomeObject value = new SomeObject(0.152f);
		assertThat(this.json.write(value)).extractingJsonPathNumberValue("@.test.numberValue")
			.satisfies((number) -> assertThat(number.floatValue()).isCloseTo(0.15f, within(0.01f)));
	}
```

<a id="testing.spring-boot-applications.spring-mvc-tests"></a>

## Auto-configured Spring MVC Tests

To test whether Spring MVC controllers are working as expected, use the `@WebMvcTest` annotation.
`@WebMvcTest` auto-configures the Spring MVC infrastructure and limits scanned beans to `@Controller`, `@ControllerAdvice`, `@JsonComponent`, `Converter`, `GenericConverter`, `Filter`, `HandlerInterceptor`, `WebMvcConfigurer`, `WebMvcRegistrations`, and `HandlerMethodArgumentResolver`.
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@WebMvcTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.

> [!TIP]
> A list of the auto-configuration settings that are enabled by `@WebMvcTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

> [!TIP]
> If you need to register extra components, such as the Jackson `Module`, you can import additional configuration classes by using `@Import` on your test.

Often, `@WebMvcTest` is limited to a single controller and is used in combination with `@MockBean` to provide mock implementations for required collaborators.

`@WebMvcTest` also auto-configures `MockMvc`.
Mock MVC offers a powerful way to quickly test MVC controllers without needing to start a full HTTP server.

> [!TIP]
> You can also auto-configure `MockMvc` in a non-`@WebMvcTest` (such as `@SpringBootTest`) by annotating it with `@AutoConfigureMockMvc`.
> The following example uses `MockMvc`:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserVehicleController.class)
class MyControllerTests {

	@Autowired
	private MockMvc mvc;

	@MockBean
	private UserVehicleService userVehicleService;

	@Test
	void testExample() throws Exception {
		given(this.userVehicleService.getVehicleDetails("sboot"))
			.willReturn(new VehicleDetails("Honda", "Civic"));
		this.mvc.perform(get("/sboot/vehicle").accept(MediaType.TEXT_PLAIN))
			.andExpect(status().isOk())
			.andExpect(content().string("Honda Civic"));
	}

}
```

> [!TIP]
> If you need to configure elements of the auto-configuration (for example, when servlet filters should be applied) you can use attributes in the `@AutoConfigureMockMvc` annotation.

If you use HtmlUnit and Selenium, auto-configuration also provides an HtmlUnit `WebClient` bean and/or a Selenium `WebDriver` bean.
The following example uses HtmlUnit:

```java
import com.gargoylesoftware.htmlunit.WebClient;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@WebMvcTest(UserVehicleController.class)
class MyHtmlUnitTests {

	@Autowired
	private WebClient webClient;

	@MockBean
	private UserVehicleService userVehicleService;

	@Test
	void testExample() throws Exception {
		given(this.userVehicleService.getVehicleDetails("sboot")).willReturn(new VehicleDetails("Honda", "Civic"));
		HtmlPage page = this.webClient.getPage("/sboot/vehicle.html");
		assertThat(page.getBody().getTextContent()).isEqualTo("Honda Civic");
	}

}
```

> [!NOTE]
> By default, Spring Boot puts `WebDriver` beans in a special “scope” to ensure that the driver exits after each test and that a new instance is injected.
> If you do not want this behavior, you can add `@Scope("singleton")` to your `WebDriver` `@Bean` definition.

> [!WARNING]
> The `webDriver` scope created by Spring Boot will replace any user defined scope of the same name.
> If you define your own `webDriver` scope you may find it stops working when you use `@WebMvcTest`.

If you have Spring Security on the classpath, `@WebMvcTest` will also scan `WebSecurityConfigurer` beans.
Instead of disabling security completely for such tests, you can use Spring Security’s test support.
More details on how to use Spring Security’s `MockMvc` support can be found in this [how-to:testing.adoc#howto.testing.with-spring-security](../../how-to/testing.md#howto.testing.with-spring-security) “How-to Guides” section.

> [!TIP]
> Sometimes writing Spring MVC tests is not enough; Spring Boot can help you run [full end-to-end tests with an actual server](#testing.spring-boot-applications.with-running-server).

<a id="testing.spring-boot-applications.spring-webflux-tests"></a>

## Auto-configured Spring WebFlux Tests

To test that [Spring WebFlux](https://docs.spring.io/spring-framework/reference/6.1.11/web-reactive.html) controllers are working as expected, you can use the `@WebFluxTest` annotation.
`@WebFluxTest` auto-configures the Spring WebFlux infrastructure and limits scanned beans to `@Controller`, `@ControllerAdvice`, `@JsonComponent`, `Converter`, `GenericConverter`, `WebFilter`, and `WebFluxConfigurer`.
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@WebFluxTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.

> [!TIP]
> A list of the auto-configurations that are enabled by `@WebFluxTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

> [!TIP]
> If you need to register extra components, such as Jackson `Module`, you can import additional configuration classes using `@Import` on your test.

Often, `@WebFluxTest` is limited to a single controller and used in combination with the `@MockBean` annotation to provide mock implementations for required collaborators.

`@WebFluxTest` also auto-configures [`WebTestClient`](https://docs.spring.io/spring-framework/reference/6.1.11/testing/webtestclient.html), which offers a powerful way to quickly test WebFlux controllers without needing to start a full HTTP server.

> [!TIP]
> You can also auto-configure `WebTestClient` in a non-`@WebFluxTest` (such as `@SpringBootTest`) by annotating it with `@AutoConfigureWebTestClient`.
> The following example shows a class that uses both `@WebFluxTest` and a `WebTestClient`:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.mockito.BDDMockito.given;

@WebFluxTest(UserVehicleController.class)
class MyControllerTests {

	@Autowired
	private WebTestClient webClient;

	@MockBean
	private UserVehicleService userVehicleService;

	@Test
	void testExample() {
		given(this.userVehicleService.getVehicleDetails("sboot"))
			.willReturn(new VehicleDetails("Honda", "Civic"));
		this.webClient.get().uri("/sboot/vehicle").accept(MediaType.TEXT_PLAIN).exchange()
			.expectStatus().isOk()
			.expectBody(String.class).isEqualTo("Honda Civic");
	}

}
```

> [!TIP]
> This setup is only supported by WebFlux applications as using `WebTestClient` in a mocked web application only works with WebFlux at the moment.

> [!NOTE]
> `@WebFluxTest` cannot detect routes registered through the functional web framework.
> For testing `RouterFunction` beans in the context, consider importing your `RouterFunction` yourself by using `@Import` or by using `@SpringBootTest`.

> [!NOTE]
> `@WebFluxTest` cannot detect custom security configuration registered as a `@Bean` of type `SecurityWebFilterChain`.
> To include that in your test, you will need to import the configuration that registers the bean by using `@Import` or by using `@SpringBootTest`.

> [!TIP]
> Sometimes writing Spring WebFlux tests is not enough; Spring Boot can help you run [full end-to-end tests with an actual server](#testing.spring-boot-applications.with-running-server).

<a id="testing.spring-boot-applications.spring-graphql-tests"></a>

## Auto-configured Spring GraphQL Tests

Spring GraphQL offers a dedicated testing support module; you’ll need to add it to your project:

#### Maven

```xml
<dependencies>
	<dependency>
		<groupId>org.springframework.graphql</groupId>
		<artifactId>spring-graphql-test</artifactId>
		<scope>test</scope>
	</dependency>
	<!-- Unless already present in the compile scope -->
	<dependency>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-webflux</artifactId>
		<scope>test</scope>
	</dependency>
</dependencies>
```

#### Gradle

```gradle
dependencies {
	testImplementation("org.springframework.graphql:spring-graphql-test")
	// Unless already present in the implementation configuration
	testImplementation("org.springframework.boot:spring-boot-starter-webflux")
}
```

This testing module ships the [GraphQlTester](https://docs.spring.io/spring-graphql/reference/1.3/#testing-graphqltester).
The tester is heavily used in test, so be sure to become familiar with using it.
There are `GraphQlTester` variants and Spring Boot will auto-configure them depending on the type of tests:

- the `ExecutionGraphQlServiceTester` performs tests on the server side, without a client nor a transport
- the `HttpGraphQlTester` performs tests with a client that connects to a server, with or without a live server

Spring Boot helps you to test your [Spring GraphQL Controllers](https://docs.spring.io/spring-graphql/reference/1.3/#controllers) with the `@GraphQlTest` annotation.
`@GraphQlTest` auto-configures the Spring GraphQL infrastructure, without any transport nor server being involved.
This limits scanned beans to `@Controller`, `RuntimeWiringConfigurer`, `JsonComponent`, `Converter`, `GenericConverter`, `DataFetcherExceptionResolver`, `Instrumentation` and `GraphQlSourceBuilderCustomizer`.
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@GraphQlTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.

> [!TIP]
> A list of the auto-configurations that are enabled by `@GraphQlTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

Often, `@GraphQlTest` is limited to a set of controllers and used in combination with the `@MockBean` annotation to provide mock implementations for required collaborators.

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.docs.web.graphql.runtimewiring.GreetingController;
import org.springframework.boot.test.autoconfigure.graphql.GraphQlTest;
import org.springframework.graphql.test.tester.GraphQlTester;

@GraphQlTest(GreetingController.class)
class GreetingControllerTests {

	@Autowired
	private GraphQlTester graphQlTester;

	@Test
	void shouldGreetWithSpecificName() {
		this.graphQlTester.document("{ greeting(name: \"Alice\") } ")
			.execute()
			.path("greeting")
			.entity(String.class)
			.isEqualTo("Hello, Alice!");
	}

	@Test
	void shouldGreetWithDefaultName() {
		this.graphQlTester.document("{ greeting } ")
			.execute()
			.path("greeting")
			.entity(String.class)
			.isEqualTo("Hello, Spring!");
	}

}
```

`@SpringBootTest` tests are full integration tests and involve the entire application.
When using a random or defined port, a live server is configured and an `HttpGraphQlTester` bean is contributed automatically so you can use it to test your server.
When a MOCK environment is configured, you can also request an `HttpGraphQlTester` bean by annotating your test class with `@AutoConfigureHttpGraphQlTester`:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureHttpGraphQlTester;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.graphql.test.tester.HttpGraphQlTester;

@AutoConfigureHttpGraphQlTester
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
class GraphQlIntegrationTests {

	@Test
	void shouldGreetWithSpecificName(@Autowired HttpGraphQlTester graphQlTester) {
		HttpGraphQlTester authenticatedTester = graphQlTester.mutate()
			.webTestClient((client) -> client.defaultHeaders((headers) -> headers.setBasicAuth("admin", "ilovespring")))
			.build();
		authenticatedTester.document("{ greeting(name: \"Alice\") } ")
			.execute()
			.path("greeting")
			.entity(String.class)
			.isEqualTo("Hello, Alice!");
	}

}
```

<a id="testing.spring-boot-applications.autoconfigured-spring-data-cassandra"></a>

## Auto-configured Data Cassandra Tests

You can use `@DataCassandraTest` to test Cassandra applications.
By default, it configures a `CassandraTemplate`, scans for `@Table` classes, and configures Spring Data Cassandra repositories.
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@DataCassandraTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.
(For more about using Cassandra with Spring Boot, see [data/nosql.adoc#data.nosql.cassandra](../data/nosql.md#data.nosql.cassandra).)

> [!TIP]
> A list of the auto-configuration settings that are enabled by `@DataCassandraTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

The following example shows a typical setup for using Cassandra tests in Spring Boot:

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.cassandra.DataCassandraTest;

@DataCassandraTest
class MyDataCassandraTests {

	@Autowired
	private SomeRepository repository;

}
```

<a id="testing.spring-boot-applications.autoconfigured-spring-data-couchbase"></a>

## Auto-configured Data Couchbase Tests

You can use `@DataCouchbaseTest` to test Couchbase applications.
By default, it configures a `CouchbaseTemplate` or `ReactiveCouchbaseTemplate`, scans for `@Document` classes, and configures Spring Data Couchbase repositories.
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@DataCouchbaseTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.
(For more about using Couchbase with Spring Boot, see [data/nosql.adoc#data.nosql.couchbase](../data/nosql.md#data.nosql.couchbase), earlier in this chapter.)

> [!TIP]
> A list of the auto-configuration settings that are enabled by `@DataCouchbaseTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

The following example shows a typical setup for using Couchbase tests in Spring Boot:

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.couchbase.DataCouchbaseTest;

@DataCouchbaseTest
class MyDataCouchbaseTests {

	@Autowired
	private SomeRepository repository;

	// ...

}
```

<a id="testing.spring-boot-applications.autoconfigured-spring-data-elasticsearch"></a>

## Auto-configured Data Elasticsearch Tests

You can use `@DataElasticsearchTest` to test Elasticsearch applications.
By default, it configures an `ElasticsearchRestTemplate`, scans for `@Document` classes, and configures Spring Data Elasticsearch repositories.
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@DataElasticsearchTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.
(For more about using Elasticsearch with Spring Boot, see [data/nosql.adoc#data.nosql.elasticsearch](../data/nosql.md#data.nosql.elasticsearch), earlier in this chapter.)

> [!TIP]
> A list of the auto-configuration settings that are enabled by `@DataElasticsearchTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

The following example shows a typical setup for using Elasticsearch tests in Spring Boot:

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.elasticsearch.DataElasticsearchTest;

@DataElasticsearchTest
class MyDataElasticsearchTests {

	@Autowired
	private SomeRepository repository;

	// ...

}
```

<a id="testing.spring-boot-applications.autoconfigured-spring-data-jpa"></a>

## Auto-configured Data JPA Tests

You can use the `@DataJpaTest` annotation to test JPA applications.
By default, it scans for `@Entity` classes and configures Spring Data JPA repositories.
If an embedded database is available on the classpath, it configures one as well.
SQL queries are logged by default by setting the `spring.jpa.show-sql` property to `true`.
This can be disabled using the `showSql` attribute of the annotation.

Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@DataJpaTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.

> [!TIP]
> A list of the auto-configuration settings that are enabled by `@DataJpaTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

By default, data JPA tests are transactional and roll back at the end of each test.
See the [relevant section](https://docs.spring.io/spring-framework/reference/6.1.11/testing/testcontext-framework/tx.html#testcontext-tx-enabling-transactions) in the Spring Framework Reference Documentation for more details.
If that is not what you want, you can disable transaction management for a test or for the whole class as follows:

```java
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@DataJpaTest
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class MyNonTransactionalTests {

	// ...

}
```

Data JPA tests may also inject a [`TestEntityManager`](https://docs.spring.io/spring-boot/3.3.2/api/java/org/springframework/boot/test/autoconfigure/orm/jpa/TestEntityManager.html) bean, which provides an alternative to the standard JPA `EntityManager` that is specifically designed for tests.

> [!TIP]
> `TestEntityManager` can also be auto-configured to any of your Spring-based test class by adding `@AutoConfigureTestEntityManager`.
> When doing so, make sure that your test is running in a transaction, for instance by adding  `@Transactional` on your test class or method.

A `JdbcTemplate` is also available if you need that.
The following example shows the `@DataJpaTest` annotation in use:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class MyRepositoryTests {

	@Autowired
	private TestEntityManager entityManager;

	@Autowired
	private UserRepository repository;

	@Test
	void testExample() {
		this.entityManager.persist(new User("sboot", "1234"));
		User user = this.repository.findByUsername("sboot");
		assertThat(user.getUsername()).isEqualTo("sboot");
		assertThat(user.getEmployeeNumber()).isEqualTo("1234");
	}

}
```

In-memory embedded databases generally work well for tests, since they are fast and do not require any installation.
If, however, you prefer to run tests against a real database you can use the `@AutoConfigureTestDatabase` annotation, as shown in the following example:

```java
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
class MyRepositoryTests {

	// ...

}
```

<a id="testing.spring-boot-applications.autoconfigured-jdbc"></a>

## Auto-configured JDBC Tests

`@JdbcTest` is similar to `@DataJpaTest` but is for tests that only require a `DataSource` and do not use Spring Data JDBC.
By default, it configures an in-memory embedded database and a `JdbcTemplate`.
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@JdbcTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.

> [!TIP]
> A list of the auto-configurations that are enabled by `@JdbcTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

By default, JDBC tests are transactional and roll back at the end of each test.
See the [relevant section](https://docs.spring.io/spring-framework/reference/6.1.11/testing/testcontext-framework/tx.html#testcontext-tx-enabling-transactions) in the Spring Framework Reference Documentation for more details.
If that is not what you want, you can disable transaction management for a test or for the whole class, as follows:

```java
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@JdbcTest
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class MyTransactionalTests {

}
```

If you prefer your test to run against a real database, you can use the `@AutoConfigureTestDatabase` annotation in the same way as for `@DataJpaTest`.
(See [Auto-configured Data JPA Tests](#testing.spring-boot-applications.autoconfigured-spring-data-jpa).)

<a id="testing.spring-boot-applications.autoconfigured-spring-data-jdbc"></a>

## Auto-configured Data JDBC Tests

`@DataJdbcTest` is similar to `@JdbcTest` but is for tests that use Spring Data JDBC repositories.
By default, it configures an in-memory embedded database, a `JdbcTemplate`, and Spring Data JDBC repositories.
Only `AbstractJdbcConfiguration` subclasses are scanned when the `@DataJdbcTest` annotation is used, regular `@Component` and `@ConfigurationProperties` beans are not scanned.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.

> [!TIP]
> A list of the auto-configurations that are enabled by `@DataJdbcTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

By default, Data JDBC tests are transactional and roll back at the end of each test.
See the [relevant section](https://docs.spring.io/spring-framework/reference/6.1.11/testing/testcontext-framework/tx.html#testcontext-tx-enabling-transactions) in the Spring Framework Reference Documentation for more details.
If that is not what you want, you can disable transaction management for a test or for the whole test class as [shown in the JDBC example](#testing.spring-boot-applications.autoconfigured-jdbc).

If you prefer your test to run against a real database, you can use the `@AutoConfigureTestDatabase` annotation in the same way as for `@DataJpaTest`.
(See [Auto-configured Data JPA Tests](#testing.spring-boot-applications.autoconfigured-spring-data-jpa).)

<a id="testing.spring-boot-applications.autoconfigured-spring-data-r2dbc"></a>

## Auto-configured Data R2DBC Tests

`@DataR2dbcTest` is similar to `@DataJdbcTest` but is for tests that use Spring Data R2DBC repositories.
By default, it configures an in-memory embedded database, an `R2dbcEntityTemplate`, and Spring Data R2DBC repositories.
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@DataR2dbcTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.

> [!TIP]
> A list of the auto-configurations that are enabled by `@DataR2dbcTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

By default, Data R2DBC tests are not transactional.

If you prefer your test to run against a real database, you can use the `@AutoConfigureTestDatabase` annotation in the same way as for `@DataJpaTest`.
(See [Auto-configured Data JPA Tests](#testing.spring-boot-applications.autoconfigured-spring-data-jpa).)

<a id="testing.spring-boot-applications.autoconfigured-jooq"></a>

## Auto-configured jOOQ Tests

You can use `@JooqTest` in a similar fashion as `@JdbcTest` but for jOOQ-related tests.
As jOOQ relies heavily on a Java-based schema that corresponds with the database schema, the existing `DataSource` is used.
If you want to replace it with an in-memory database, you can use `@AutoConfigureTestDatabase` to override those settings.
(For more about using jOOQ with Spring Boot, see [data/sql.adoc#data.sql.jooq](../data/sql.md#data.sql.jooq).)
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@JooqTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.

> [!TIP]
> A list of the auto-configurations that are enabled by `@JooqTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

`@JooqTest` configures a `DSLContext`.
The following example shows the `@JooqTest` annotation in use:

```java
import org.jooq.DSLContext;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jooq.JooqTest;

@JooqTest
class MyJooqTests {

	@Autowired
	private DSLContext dslContext;

	// ...

}
```

JOOQ tests are transactional and roll back at the end of each test by default.
If that is not what you want, you can disable transaction management for a test or for the whole test class as [shown in the JDBC example](#testing.spring-boot-applications.autoconfigured-jdbc).

<a id="testing.spring-boot-applications.autoconfigured-spring-data-mongodb"></a>

## Auto-configured Data MongoDB Tests

You can use `@DataMongoTest` to test MongoDB applications.
By default, it configures a `MongoTemplate`, scans for `@Document` classes, and configures Spring Data MongoDB repositories.
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@DataMongoTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.
(For more about using MongoDB with Spring Boot, see [data/nosql.adoc#data.nosql.mongodb](../data/nosql.md#data.nosql.mongodb).)

> [!TIP]
> A list of the auto-configuration settings that are enabled by `@DataMongoTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

The following class shows the `@DataMongoTest` annotation in use:

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.data.mongodb.core.MongoTemplate;

@DataMongoTest
class MyDataMongoDbTests {

	@Autowired
	private MongoTemplate mongoTemplate;

	// ...

}
```

<a id="testing.spring-boot-applications.autoconfigured-spring-data-neo4j"></a>

## Auto-configured Data Neo4j Tests

You can use `@DataNeo4jTest` to test Neo4j applications.
By default, it scans for `@Node` classes, and configures Spring Data Neo4j repositories.
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@DataNeo4jTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.
(For more about using Neo4J with Spring Boot, see [data/nosql.adoc#data.nosql.neo4j](../data/nosql.md#data.nosql.neo4j).)

> [!TIP]
> A list of the auto-configuration settings that are enabled by `@DataNeo4jTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

The following example shows a typical setup for using Neo4J tests in Spring Boot:

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.neo4j.DataNeo4jTest;

@DataNeo4jTest
class MyDataNeo4jTests {

	@Autowired
	private SomeRepository repository;

	// ...

}
```

By default, Data Neo4j tests are transactional and roll back at the end of each test.
See the [relevant section](https://docs.spring.io/spring-framework/reference/6.1.11/testing/testcontext-framework/tx.html#testcontext-tx-enabling-transactions) in the Spring Framework Reference Documentation for more details.
If that is not what you want, you can disable transaction management for a test or for the whole class, as follows:

```java
import org.springframework.boot.test.autoconfigure.data.neo4j.DataNeo4jTest;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@DataNeo4jTest
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class MyDataNeo4jTests {

}
```

> [!NOTE]
> Transactional tests are not supported with reactive access.
> If you are using this style, you must configure `@DataNeo4jTest` tests as described above.

<a id="testing.spring-boot-applications.autoconfigured-spring-data-redis"></a>

## Auto-configured Data Redis Tests

You can use `@DataRedisTest` to test Redis applications.
By default, it scans for `@RedisHash` classes and configures Spring Data Redis repositories.
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@DataRedisTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.
(For more about using Redis with Spring Boot, see [data/nosql.adoc#data.nosql.redis](../data/nosql.md#data.nosql.redis).)

> [!TIP]
> A list of the auto-configuration settings that are enabled by `@DataRedisTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

The following example shows the `@DataRedisTest` annotation in use:

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.redis.DataRedisTest;

@DataRedisTest
class MyDataRedisTests {

	@Autowired
	private SomeRepository repository;

	// ...

}
```

<a id="testing.spring-boot-applications.autoconfigured-spring-data-ldap"></a>

## Auto-configured Data LDAP Tests

You can use `@DataLdapTest` to test LDAP applications.
By default, it configures an in-memory embedded LDAP (if available), configures an `LdapTemplate`, scans for `@Entry` classes, and configures Spring Data LDAP repositories.
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@DataLdapTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.
(For more about using LDAP with Spring Boot, see [data/nosql.adoc#data.nosql.ldap](../data/nosql.md#data.nosql.ldap).)

> [!TIP]
> A list of the auto-configuration settings that are enabled by `@DataLdapTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

The following example shows the `@DataLdapTest` annotation in use:

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.ldap.DataLdapTest;
import org.springframework.ldap.core.LdapTemplate;

@DataLdapTest
class MyDataLdapTests {

	@Autowired
	private LdapTemplate ldapTemplate;

	// ...

}
```

In-memory embedded LDAP generally works well for tests, since it is fast and does not require any developer installation.
If, however, you prefer to run tests against a real LDAP server, you should exclude the embedded LDAP auto-configuration, as shown in the following example:

```java
import org.springframework.boot.autoconfigure.ldap.embedded.EmbeddedLdapAutoConfiguration;
import org.springframework.boot.test.autoconfigure.data.ldap.DataLdapTest;

@DataLdapTest(excludeAutoConfiguration = EmbeddedLdapAutoConfiguration.class)
class MyDataLdapTests {

	// ...

}
```

<a id="testing.spring-boot-applications.autoconfigured-rest-client"></a>

## Auto-configured REST Clients

You can use the `@RestClientTest` annotation to test REST clients.
By default, it auto-configures Jackson, GSON, and Jsonb support, configures a `RestTemplateBuilder` and a `RestClient.Builder`, and adds support for `MockRestServiceServer`.
Regular `@Component` and `@ConfigurationProperties` beans are not scanned when the `@RestClientTest` annotation is used.
`@EnableConfigurationProperties` can be used to include `@ConfigurationProperties` beans.

> [!TIP]
> A list of the auto-configuration settings that are enabled by `@RestClientTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

The specific beans that you want to test should be specified by using the `value` or `components` attribute of `@RestClientTest`.

When using a `RestTemplateBuilder` in the beans under test and `RestTemplateBuilder.rootUri(String rootUri)` has been called when building the `RestTemplate`, then the root URI should be omitted from the `MockRestServiceServer` expectations as shown in the following example:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.client.RestClientTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@RestClientTest(org.springframework.boot.docs.testing.springbootapplications.autoconfiguredrestclient.RemoteVehicleDetailsService.class)
class MyRestTemplateServiceTests {

	@Autowired
	private RemoteVehicleDetailsService service;

	@Autowired
	private MockRestServiceServer server;

	@Test
	void getVehicleDetailsWhenResultIsSuccessShouldReturnDetails() {
		this.server.expect(requestTo("/greet/details")).andRespond(withSuccess("hello", MediaType.TEXT_PLAIN));
		String greeting = this.service.callRestService();
		assertThat(greeting).isEqualTo("hello");
	}

}
```

When using a `RestClient.Builder` in the beans under test, or when using a `RestTemplateBuilder` without calling `rootUri(String rootURI)`, the full URI must be used in the `MockRestServiceServer` expectations as shown in the following example:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.client.RestClientTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@RestClientTest(RemoteVehicleDetailsService.class)
class MyRestClientServiceTests {

	@Autowired
	private RemoteVehicleDetailsService service;

	@Autowired
	private MockRestServiceServer server;

	@Test
	void getVehicleDetailsWhenResultIsSuccessShouldReturnDetails() {
		this.server.expect(requestTo("https://example.com/greet/details"))
			.andRespond(withSuccess("hello", MediaType.TEXT_PLAIN));
		String greeting = this.service.callRestService();
		assertThat(greeting).isEqualTo("hello");
	}

}
```

<a id="testing.spring-boot-applications.autoconfigured-spring-restdocs"></a>

## Auto-configured Spring REST Docs Tests

You can use the `@AutoConfigureRestDocs` annotation to use [Spring REST Docs](https://spring.io/projects/spring-restdocs) in your tests with Mock MVC, REST Assured, or WebTestClient.
It removes the need for the JUnit extension in Spring REST Docs.

`@AutoConfigureRestDocs` can be used to override the default output directory (`target/generated-snippets` if you are using Maven or `build/generated-snippets` if you are using Gradle).
It can also be used to configure the host, scheme, and port that appears in any documented URIs.

<a id="testing.spring-boot-applications.autoconfigured-spring-restdocs.with-mock-mvc"></a>

### Auto-configured Spring REST Docs Tests With Mock MVC

`@AutoConfigureRestDocs` customizes the `MockMvc` bean to use Spring REST Docs when testing servlet-based web applications.
You can inject it by using `@Autowired` and use it in your tests as you normally would when using Mock MVC and Spring REST Docs, as shown in the following example:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.restdocs.AutoConfigureRestDocs;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureRestDocs
class MyUserDocumentationTests {

	@Autowired
	private MockMvc mvc;

	@Test
	void listUsers() throws Exception {
		this.mvc.perform(get("/users").accept(MediaType.TEXT_PLAIN))
			.andExpect(status().isOk())
			.andDo(document("list-users"));
	}

}
```

If you require more control over Spring REST Docs configuration than offered by the attributes of `@AutoConfigureRestDocs`, you can use a `RestDocsMockMvcConfigurationCustomizer` bean, as shown in the following example:

```java
import org.springframework.boot.test.autoconfigure.restdocs.RestDocsMockMvcConfigurationCustomizer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.restdocs.mockmvc.MockMvcRestDocumentationConfigurer;
import org.springframework.restdocs.templates.TemplateFormats;

@TestConfiguration(proxyBeanMethods = false)
public class MyRestDocsConfiguration implements RestDocsMockMvcConfigurationCustomizer {

	@Override
	public void customize(MockMvcRestDocumentationConfigurer configurer) {
		configurer.snippets().withTemplateFormat(TemplateFormats.markdown());
	}

}
```

If you want to make use of Spring REST Docs support for a parameterized output directory, you can create a `RestDocumentationResultHandler` bean.
The auto-configuration calls `alwaysDo` with this result handler, thereby causing each `MockMvc` call to automatically generate the default snippets.
The following example shows a `RestDocumentationResultHandler` being defined:

```java
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.restdocs.mockmvc.MockMvcRestDocumentation;
import org.springframework.restdocs.mockmvc.RestDocumentationResultHandler;

@TestConfiguration(proxyBeanMethods = false)
public class MyResultHandlerConfiguration {

	@Bean
	public RestDocumentationResultHandler restDocumentation() {
		return MockMvcRestDocumentation.document("{method-name}");
	}

}
```

<a id="testing.spring-boot-applications.autoconfigured-spring-restdocs.with-web-test-client"></a>

### Auto-configured Spring REST Docs Tests With WebTestClient

`@AutoConfigureRestDocs` can also be used with `WebTestClient` when testing reactive web applications.
You can inject it by using `@Autowired` and use it in your tests as you normally would when using `@WebFluxTest` and Spring REST Docs, as shown in the following example:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.restdocs.AutoConfigureRestDocs;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.springframework.restdocs.webtestclient.WebTestClientRestDocumentation.document;

@WebFluxTest
@AutoConfigureRestDocs
class MyUsersDocumentationTests {

	@Autowired
	private WebTestClient webTestClient;

	@Test
	void listUsers() {
		this.webTestClient
			.get().uri("/")
		.exchange()
		.expectStatus()
			.isOk()
		.expectBody()
			.consumeWith(document("list-users"));
	}

}
```

If you require more control over Spring REST Docs configuration than offered by the attributes of `@AutoConfigureRestDocs`, you can use a `RestDocsWebTestClientConfigurationCustomizer` bean, as shown in the following example:

```java
import org.springframework.boot.test.autoconfigure.restdocs.RestDocsWebTestClientConfigurationCustomizer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.restdocs.webtestclient.WebTestClientRestDocumentationConfigurer;

@TestConfiguration(proxyBeanMethods = false)
public class MyRestDocsConfiguration implements RestDocsWebTestClientConfigurationCustomizer {

	@Override
	public void customize(WebTestClientRestDocumentationConfigurer configurer) {
		configurer.snippets().withEncoding("UTF-8");
	}

}
```

If you want to make use of Spring REST Docs support for a parameterized output directory, you can use a `WebTestClientBuilderCustomizer` to configure a consumer for every entity exchange result.
The following example shows such a `WebTestClientBuilderCustomizer` being defined:

```java
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.reactive.server.WebTestClientBuilderCustomizer;
import org.springframework.context.annotation.Bean;

import static org.springframework.restdocs.webtestclient.WebTestClientRestDocumentation.document;

@TestConfiguration(proxyBeanMethods = false)
public class MyWebTestClientBuilderCustomizerConfiguration {

	@Bean
	public WebTestClientBuilderCustomizer restDocumentation() {
		return (builder) -> builder.entityExchangeResultConsumer(document("{method-name}"));
	}

}
```

<a id="testing.spring-boot-applications.autoconfigured-spring-restdocs.with-rest-assured"></a>

### Auto-configured Spring REST Docs Tests With REST Assured

`@AutoConfigureRestDocs` makes a `RequestSpecification` bean, preconfigured to use Spring REST Docs, available to your tests.
You can inject it by using `@Autowired` and use it in your tests as you normally would when using REST Assured and Spring REST Docs, as shown in the following example:

```java
import io.restassured.specification.RequestSpecification;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.restdocs.AutoConfigureRestDocs;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.is;
import static org.springframework.restdocs.restassured.RestAssuredRestDocumentation.document;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestDocs
class MyUserDocumentationTests {

	@Test
	void listUsers(@Autowired RequestSpecification documentationSpec, @LocalServerPort int port) {
		given(documentationSpec)
			.filter(document("list-users"))
		.when()
			.port(port)
			.get("/")
		.then().assertThat()
			.statusCode(is(200));
	}

}
```

If you require more control over Spring REST Docs configuration than offered by the attributes of `@AutoConfigureRestDocs`, a `RestDocsRestAssuredConfigurationCustomizer` bean can be used, as shown in the following example:

```java
import org.springframework.boot.test.autoconfigure.restdocs.RestDocsRestAssuredConfigurationCustomizer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.restdocs.restassured.RestAssuredRestDocumentationConfigurer;
import org.springframework.restdocs.templates.TemplateFormats;

@TestConfiguration(proxyBeanMethods = false)
public class MyRestDocsConfiguration implements RestDocsRestAssuredConfigurationCustomizer {

	@Override
	public void customize(RestAssuredRestDocumentationConfigurer configurer) {
		configurer.snippets().withTemplateFormat(TemplateFormats.markdown());
	}

}
```

<a id="testing.spring-boot-applications.autoconfigured-webservices"></a>

## Auto-configured Spring Web Services Tests

<a id="testing.spring-boot-applications.autoconfigured-webservices.client"></a>

### Auto-configured Spring Web Services Client Tests

You can use `@WebServiceClientTest` to test applications that call web services using the Spring Web Services project.
By default, it configures a mock `WebServiceServer` bean and automatically customizes your `WebServiceTemplateBuilder`.
(For more about using Web Services with Spring Boot, see [io/webservices.adoc](../io/webservices.md).)

> [!TIP]
> A list of the auto-configuration settings that are enabled by `@WebServiceClientTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

The following example shows the `@WebServiceClientTest` annotation in use:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.webservices.client.WebServiceClientTest;
import org.springframework.ws.test.client.MockWebServiceServer;
import org.springframework.xml.transform.StringSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.ws.test.client.RequestMatchers.payload;
import static org.springframework.ws.test.client.ResponseCreators.withPayload;

@WebServiceClientTest(SomeWebService.class)
class MyWebServiceClientTests {

	@Autowired
	private MockWebServiceServer server;

	@Autowired
	private SomeWebService someWebService;

	@Test
	void mockServerCall() {
		this.server
			.expect(payload(new StringSource("<request/>")))
			.andRespond(withPayload(new StringSource("<response><status>200</status></response>")));
		assertThat(this.someWebService.test())
			.extracting(Response::getStatus)
			.isEqualTo(200);
	}

}
```

<a id="testing.spring-boot-applications.autoconfigured-webservices.server"></a>

### Auto-configured Spring Web Services Server Tests

You can use `@WebServiceServerTest` to test applications that implement web services using the Spring Web Services project.
By default, it configures a `MockWebServiceClient` bean that can be used to call your web service endpoints.
(For more about using Web Services with Spring Boot, see [io/webservices.adoc](../io/webservices.md).)

> [!TIP]
> A list of the auto-configuration settings that are enabled by `@WebServiceServerTest` can be [found in the appendix](../../appendix/test-auto-configuration/index.md).

The following example shows the `@WebServiceServerTest` annotation in use:

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.webservices.server.WebServiceServerTest;
import org.springframework.ws.test.server.MockWebServiceClient;
import org.springframework.ws.test.server.RequestCreators;
import org.springframework.ws.test.server.ResponseMatchers;
import org.springframework.xml.transform.StringSource;

@WebServiceServerTest(ExampleEndpoint.class)
class MyWebServiceServerTests {

	@Autowired
	private MockWebServiceClient client;

	@Test
	void mockServerCall() {
		this.client
			.sendRequest(RequestCreators.withPayload(new StringSource("<ExampleRequest/>")))
			.andExpect(ResponseMatchers.payload(new StringSource("<ExampleResponse>42</ExampleResponse>")));
	}

}
```

<a id="testing.spring-boot-applications.additional-autoconfiguration-and-slicing"></a>

## Additional Auto-configuration and Slicing

Each slice provides one or more `@AutoConfigure…​` annotations that namely defines the auto-configurations that should be included as part of a slice.
Additional auto-configurations can be added on a test-by-test basis by creating a custom `@AutoConfigure…​` annotation or by adding `@ImportAutoConfiguration` to the test as shown in the following example:

```java
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.integration.IntegrationAutoConfiguration;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;

@JdbcTest
@ImportAutoConfiguration(IntegrationAutoConfiguration.class)
class MyJdbcTests {

}
```

> [!NOTE]
> Make sure to not use the regular `@Import` annotation to import auto-configurations as they are handled in a specific way by Spring Boot.

Alternatively, additional auto-configurations can be added for any use of a slice annotation by registering them in a file stored in `META-INF/spring` as shown in the following example:

#### META-INF/spring/org.springframework.boot.test.autoconfigure.jdbc.JdbcTest.imports

```
com.example.IntegrationAutoConfiguration
```

In this example, the `com.example.IntegrationAutoConfiguration` is enabled on every test annotated with `@JdbcTest`.

> [!TIP]
> You can use comments with `#` in this file.

> [!TIP]
> A slice or `@AutoConfigure…​` annotation can be customized this way as long as it is meta-annotated with `@ImportAutoConfiguration`.

<a id="testing.spring-boot-applications.user-configuration-and-slicing"></a>

## User Configuration and Slicing

If you [structure your code](../using/structuring-your-code.md) in a sensible way, your `@SpringBootApplication` class is [used by default](#testing.spring-boot-applications.detecting-configuration) as the configuration of your tests.

It then becomes important not to litter the application’s main class with configuration settings that are specific to a particular area of its functionality.

Assume that you are using Spring Data MongoDB, you rely on the auto-configuration for it, and you have enabled auditing.
You could define your `@SpringBootApplication` as follows:

```java
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class MyApplication {

	// ...

}
```

Because this class is the source configuration for the test, any slice test actually tries to enable Mongo auditing, which is definitely not what you want to do.
A recommended approach is to move that area-specific configuration to a separate `@Configuration` class at the same level as your application, as shown in the following example:

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@Configuration(proxyBeanMethods = false)
@EnableMongoAuditing
public class MyMongoConfiguration {

	// ...

}
```

> [!NOTE]
> Depending on the complexity of your application, you may either have a single `@Configuration` class for your customizations or one class per domain area.
> The latter approach lets you enable it in one of your tests, if necessary, with the `@Import` annotation.
> See [this how-to section](../../how-to/testing.md#howto.testing.slice-tests) for more details on when you might want to enable specific `@Configuration` classes for slice tests.

Test slices exclude `@Configuration` classes from scanning.
For example, for a `@WebMvcTest`, the following configuration will not include the given `WebMvcConfigurer` bean in the application context loaded by the test slice:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration(proxyBeanMethods = false)
public class MyWebConfiguration {

	@Bean
	public WebMvcConfigurer testConfigurer() {
		return new WebMvcConfigurer() {
			// ...
		};
	}

}
```

The configuration below will, however, cause the custom `WebMvcConfigurer` to be loaded by the test slice.

```java
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Component
public class MyWebMvcConfigurer implements WebMvcConfigurer {

	// ...

}
```

Another source of confusion is classpath scanning.
Assume that, while you structured your code in a sensible way, you need to scan an additional package.
Your application may resemble the following code:

```java
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan({ "com.example.app", "com.example.another" })
public class MyApplication {

	// ...

}
```

Doing so effectively overrides the default component scan directive with the side effect of scanning those two packages regardless of the slice that you chose.
For instance, a `@DataJpaTest` seems to suddenly scan components and user configurations of your application.
Again, moving the custom directive to a separate class is a good way to fix this issue.

> [!TIP]
> If this is not an option for you, you can create a `@SpringBootConfiguration` somewhere in the hierarchy of your test so that it is used instead.
> Alternatively, you can specify a source for your test, which disables the behavior of finding a default one.

<a id="testing.spring-boot-applications.spock"></a>

## Using Spock to Test Spring Boot Applications

Spock 2.2 or later can be used to test a Spring Boot application.
To do so, add a dependency on a `-groovy-4.0` version of Spock’s `spock-spring` module to your application’s build.
`spock-spring` integrates Spring’s test framework into Spock.
See [the documentation for Spock’s Spring module](https://spockframework.org/spock/docs/2.2-M1/modules.html#_spring_module) for further details.
