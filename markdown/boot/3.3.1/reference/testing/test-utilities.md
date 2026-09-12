---
title: "Test Utilities"
source: "reference:testing/test-utilities.adoc"
---

<a id="testing.utilities"></a>

# Test Utilities

A few test utility classes that are generally useful when testing your application are packaged as part of `spring-boot`.

<a id="testing.utilities.config-data-application-context-initializer"></a>

## ConfigDataApplicationContextInitializer

`ConfigDataApplicationContextInitializer` is an `ApplicationContextInitializer` that you can apply to your tests to load Spring Boot `application.properties` files.
You can use it when you do not need the full set of features provided by `@SpringBootTest`, as shown in the following example:

```java
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.test.context.ContextConfiguration;

@ContextConfiguration(classes = Config.class, initializers = ConfigDataApplicationContextInitializer.class)
class MyConfigFileTests {

	// ...

}
```

> [!NOTE]
> Using `ConfigDataApplicationContextInitializer` alone does not provide support for `@Value("${…​}")` injection.
> Its only job is to ensure that `application.properties` files are loaded into Spring’s `Environment`.
> For `@Value` support, you need to either additionally configure a `PropertySourcesPlaceholderConfigurer` or use `@SpringBootTest`, which auto-configures one for you.

<a id="testing.utilities.test-property-values"></a>

## TestPropertyValues

`TestPropertyValues` lets you quickly add properties to a `ConfigurableEnvironment` or `ConfigurableApplicationContext`.
You can call it with `key=value` strings, as follows:

```java
import org.junit.jupiter.api.Test;

import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;

class MyEnvironmentTests {

	@Test
	void testPropertySources() {
		MockEnvironment environment = new MockEnvironment();
		TestPropertyValues.of("org=Spring", "name=Boot").applyTo(environment);
		assertThat(environment.getProperty("name")).isEqualTo("Boot");
	}

}
```

<a id="testing.utilities.output-capture"></a>

## OutputCapture

`OutputCapture` is a JUnit `Extension` that you can use to capture `System.out` and `System.err` output.
To use it, add `@ExtendWith(OutputCaptureExtension.class)` and inject `CapturedOutput` as an argument to your test class constructor or test method as follows:

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(OutputCaptureExtension.class)
class MyOutputCaptureTests {

	@Test
	void testName(CapturedOutput output) {
		System.out.println("Hello World!");
		assertThat(output).contains("World");
	}

}
```

<a id="testing.utilities.test-rest-template"></a>

## TestRestTemplate

`TestRestTemplate` is a convenience alternative to Spring’s `RestTemplate` that is useful in integration tests.
You can get a vanilla template or one that sends Basic HTTP authentication (with a username and password).
In either case, the template is fault tolerant.
This means that it behaves in a test-friendly way by not throwing exceptions on 4xx and 5xx errors.
Instead, such errors can be detected through the returned `ResponseEntity` and its status code.

> [!TIP]
> Spring Framework 5.0 provides a new `WebTestClient` that works for [WebFlux integration tests](spring-boot-applications.md#testing.spring-boot-applications.spring-webflux-tests) and both [WebFlux and MVC end-to-end testing](spring-boot-applications.md#testing.spring-boot-applications.with-running-server).
> It provides a fluent API for assertions, unlike `TestRestTemplate`.

It is recommended, but not mandatory, to use the Apache HTTP Client (version 5.1 or better).
If you have that on your classpath, the `TestRestTemplate` responds by configuring the client appropriately.
If you do use Apache’s HTTP client, some additional test-friendly features are enabled:

- Redirects are not followed (so you can assert the response location).
- Cookies are ignored (so the template is stateless).

`TestRestTemplate` can be instantiated directly in your integration tests, as shown in the following example:

```java
import org.junit.jupiter.api.Test;

import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class MyTests {

	private final TestRestTemplate template = new TestRestTemplate();

	@Test
	void testRequest() {
		ResponseEntity<String> headers = this.template.getForEntity("https://myhost.example.com/example", String.class);
		assertThat(headers.getHeaders().getLocation()).hasHost("other.example.com");
	}

}
```

Alternatively, if you use the `@SpringBootTest` annotation with `WebEnvironment.RANDOM_PORT` or `WebEnvironment.DEFINED_PORT`, you can inject a fully configured `TestRestTemplate` and start using it.
If necessary, additional customizations can be applied through the `RestTemplateBuilder` bean.
Any URLs that do not specify a host and port automatically connect to the embedded server, as shown in the following example:

```java
import java.time.Duration;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class MySpringBootTests {

	@Autowired
	private TestRestTemplate template;

	@Test
	void testRequest() {
		HttpHeaders headers = this.template.getForEntity("/example", String.class).getHeaders();
		assertThat(headers.getLocation()).hasHost("other.example.com");
	}

	@TestConfiguration(proxyBeanMethods = false)
	static class RestTemplateBuilderConfiguration {

		@Bean
		RestTemplateBuilder restTemplateBuilder() {
			return new RestTemplateBuilder().setConnectTimeout(Duration.ofSeconds(1))
				.setReadTimeout(Duration.ofSeconds(1));
		}

	}

}
```
