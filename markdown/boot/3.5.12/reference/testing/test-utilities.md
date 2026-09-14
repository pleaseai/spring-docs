---
title: "Test Utilities"
source: "reference:testing/test-utilities.adoc"
---

<a id="testing.utilities"></a>

# Test Utilities

A few test utility classes that are generally useful when testing your application are packaged as part of `spring-boot`.

<a id="testing.utilities.config-data-application-context-initializer"></a>

## ConfigDataApplicationContextInitializer

[`ConfigDataApplicationContextInitializer`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/test/context/ConfigDataApplicationContextInitializer.html) is an [`ApplicationContextInitializer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ApplicationContextInitializer.html) that you can apply to your tests to load Spring Boot `application.properties` files.
You can use it when you do not need the full set of features provided by [`@SpringBootTest`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/test/context/SpringBootTest.html), as shown in the following example:

#### Java

```java
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.test.context.ContextConfiguration;

@ContextConfiguration(classes = Config.class, initializers = ConfigDataApplicationContextInitializer.class)
class MyConfigFileTests {

	// ...

}
```

#### Kotlin

```kotlin
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer
import org.springframework.test.context.ContextConfiguration

@ContextConfiguration(classes = [Config::class], initializers = [ConfigDataApplicationContextInitializer::class])
class MyConfigFileTests {

	// ...

}

```

> [!NOTE]
> Using [`ConfigDataApplicationContextInitializer`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/test/context/ConfigDataApplicationContextInitializer.html) alone does not provide support for `@Value("${…​}")` injection.
> Its only job is to ensure that `application.properties` files are loaded into Spring’s [`Environment`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/env/Environment.html).
> For [`@Value`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/beans/factory/annotation/Value.html) support, you need to either additionally configure a [`PropertySourcesPlaceholderConfigurer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/support/PropertySourcesPlaceholderConfigurer.html) or use [`@SpringBootTest`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/test/context/SpringBootTest.html), which auto-configures one for you.

<a id="testing.utilities.test-property-values"></a>

## TestPropertyValues

[`TestPropertyValues`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/test/util/TestPropertyValues.html) lets you quickly add properties to a [`ConfigurableEnvironment`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/env/ConfigurableEnvironment.html) or [`ConfigurableApplicationContext`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ConfigurableApplicationContext.html).
You can call it with `key=value` strings, as follows:

#### Java

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

#### Kotlin

```kotlin
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.boot.test.util.TestPropertyValues
import org.springframework.mock.env.MockEnvironment

class MyEnvironmentTests {

	@Test
	fun testPropertySources() {
		val environment = MockEnvironment()
		TestPropertyValues.of("org=Spring", "name=Boot").applyTo(environment)
		assertThat(environment.getProperty("name")).isEqualTo("Boot")
	}

}

```

<a id="testing.utilities.output-capture"></a>

## OutputCaptureExtension

[`OutputCaptureExtension`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/test/system/OutputCaptureExtension.html) is a JUnit [`Extension`](https://junit.org/junit5/docs/5.12.2/api/org.junit.jupiter.api/org/junit/jupiter/api/extension/Extension.html) that you can use to capture [`System.out`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/System.html#out) and [`System.err`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/System.html#err) output.
To use it, add `@ExtendWith(OutputCaptureExtension.class)` and inject [`CapturedOutput`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/test/system/CapturedOutput.html) as an argument to your test class constructor or test method as follows:

#### Java

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

#### Kotlin

```kotlin
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.boot.test.system.CapturedOutput
import org.springframework.boot.test.system.OutputCaptureExtension

@ExtendWith(OutputCaptureExtension::class)
class MyOutputCaptureTests {

	@Test
	fun testName(output: CapturedOutput?) {
		println("Hello World!")
		assertThat(output).contains("World")
	}

}

```

<a id="testing.utilities.test-rest-template"></a>

## TestRestTemplate

[`TestRestTemplate`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/test/web/client/TestRestTemplate.html) is a convenience alternative to Spring’s [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/client/RestTemplate.html) that is useful in integration tests.
You can get a vanilla template or one that sends Basic HTTP authentication (with a username and password).
In either case, the template is fault tolerant.
This means that it behaves in a test-friendly way by not throwing exceptions on 4xx and 5xx errors.
Instead, such errors can be detected through the returned [`ResponseEntity`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/ResponseEntity.html) and its status code.

> [!TIP]
> Spring Framework 5.0 provides a new [`WebTestClient`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/test/web/reactive/server/WebTestClient.html) that works for [WebFlux integration tests](spring-boot-applications.md#testing.spring-boot-applications.spring-webflux-tests) and both [WebFlux and MVC end-to-end testing](spring-boot-applications.md#testing.spring-boot-applications.with-running-server).
> It provides a fluent API for assertions, unlike [`TestRestTemplate`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/test/web/client/TestRestTemplate.html).

It is recommended, but not mandatory, to use the Apache HTTP Client (version 5.1 or better).
If you have that on your classpath, the [`TestRestTemplate`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/test/web/client/TestRestTemplate.html) responds by configuring the client appropriately.
If you do use Apache’s HTTP client it is configured to ignore cookies (so the template is stateless).

[`TestRestTemplate`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/test/web/client/TestRestTemplate.html) can be instantiated directly in your integration tests, as shown in the following example:

#### Java

```java
import org.junit.jupiter.api.Test;

import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class MyTests {

	private final TestRestTemplate template = new TestRestTemplate();

	@Test
	void testRequest() {
		ResponseEntity<String> response = this.template.getForEntity("https://myhost.example.com/example",
				String.class);
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		// Other assertions to verify the response
	}

}
```

#### Kotlin

```kotlin
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.http.HttpStatus

class MyTests {

	private val template = TestRestTemplate()

	@Test
	fun testRequest() {
		val response = template.getForEntity("https://myhost.example.com/example", String::class.java)
		assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
		// Other assertions to verify the response
	}

}

```

Alternatively, if you use the [`@SpringBootTest`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/test/context/SpringBootTest.html) annotation with `WebEnvironment.RANDOM_PORT` or `WebEnvironment.DEFINED_PORT`, you can inject a fully configured [`TestRestTemplate`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/test/web/client/TestRestTemplate.html) and start using it.
If necessary, additional customizations can be applied through the [`RestTemplateBuilder`](https://docs.spring.io/spring-boot/3.5.12/api/java/org/springframework/boot/web/client/RestTemplateBuilder.html) bean.
Any URLs that do not specify a host and port automatically connect to the embedded server, as shown in the following example:

#### Java

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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class MySpringBootTests {

	@Autowired
	private TestRestTemplate template;

	@Test
	void testRequest() {
		ResponseEntity<String> response = this.template.getForEntity("/example", String.class);
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		// Other assertions to verify the response
	}

	@TestConfiguration(proxyBeanMethods = false)
	static class RestTemplateBuilderConfiguration {

		@Bean
		RestTemplateBuilder restTemplateBuilder() {
			return new RestTemplateBuilder().connectTimeout(Duration.ofSeconds(1)).readTimeout(Duration.ofSeconds(1));
		}

	}

}
```

#### Kotlin

```kotlin
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.web.client.RestTemplateBuilder
import org.springframework.context.annotation.Bean
import org.springframework.http.HttpStatus
import java.time.Duration

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class MySpringBootTests(@Autowired val template: TestRestTemplate) {

	@Test
	fun testRequest() {
		val response = template.getForEntity("/example", String::class.java)
		assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
		// Other assertions to verify the response
	}

	@TestConfiguration(proxyBeanMethods = false)
	internal class RestTemplateBuilderConfiguration {

		@Bean
		fun restTemplateBuilder(): RestTemplateBuilder {
			return RestTemplateBuilder().connectTimeout(Duration.ofSeconds(1))
				.readTimeout(Duration.ofSeconds(1))
		}

	}

}

```
