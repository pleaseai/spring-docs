---
title: "Testing"
source: "how-to:testing.adoc"
---

<a id="howto.testing"></a>

# Testing

Spring Boot includes a number of testing utilities and support classes as well as a dedicated starter that provides common test dependencies.
This section answers common questions about testing.

<a id="howto.testing.with-spring-security"></a>

## Testing With Spring Security

Spring Security provides support for running tests as a specific user.
For example, the test in the snippet below will run with an authenticated user that has the `ADMIN` role.

#### Java

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import static org.assertj.core.api.Assertions.assertThat;

@WebMvcTest(UserController.class)
class MySecurityTests {

	@Autowired
	private MockMvcTester mvc;

	@Test
	@WithMockUser(roles = "ADMIN")
	void requestProtectedUrlWithUser() {
		assertThat(this.mvc.get().uri("/")).doesNotHaveFailed();
	}

}
```

#### Kotlin

```kotlin
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.web.servlet.assertj.MockMvcTester

@WebMvcTest(UserController::class)
class MySecurityTests(@Autowired val mvc: MockMvcTester) {

	@Test
	@WithMockUser(roles = ["ADMIN"])
	fun requestProtectedUrlWithUser() {
		assertThat(mvc.get().uri("/"))
				.doesNotHaveFailed()
	}

}

```

Spring Security provides comprehensive integration with Spring MVC Test, and this can also be used when testing controllers using the [`@WebMvcTest`](https://docs.spring.io/spring-boot/3.5.15/api/java/org/springframework/boot/test/autoconfigure/web/servlet/WebMvcTest.html) slice and [`MockMvc`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/test/web/servlet/MockMvc.html).

For additional details on Spring Security’s testing support, see Spring Security’s [reference documentation](https://docs.spring.io/spring-security/reference/6.5/servlet/test/index.html).

<a id="howto.testing.slice-tests"></a>

## Structure [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Configuration.html) Classes for Inclusion in Slice Tests

Slice tests work by restricting Spring Framework’s component scanning to a limited set of components based on their type.
For any beans that are not created through component scanning, for example, beans that are created using the [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) annotation, slice tests will not be able to include/exclude them from the application context.
Consider this example:

```java
import com.zaxxer.hikari.HikariDataSource;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration(proxyBeanMethods = false)
public class MyConfiguration {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http.authorizeHttpRequests((requests) -> requests.anyRequest().authenticated());
		return http.build();
	}

	@Bean
	@ConfigurationProperties("app.datasource.second")
	public HikariDataSource secondDataSource() {
		return DataSourceBuilder.create().type(HikariDataSource.class).build();
	}

}
```

For a [`@WebMvcTest`](https://docs.spring.io/spring-boot/3.5.15/api/java/org/springframework/boot/test/autoconfigure/web/servlet/WebMvcTest.html) for an application with the above [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Configuration.html) class, you might expect to have the [`SecurityFilterChain`](https://docs.spring.io/spring-security/site/docs/6.5.x/api/org/springframework/security/web/SecurityFilterChain.html) bean in the application context so that you can test if your controller endpoints are secured properly.
However, `MyConfiguration` is not picked up by @WebMvcTest’s component scanning filter because it doesn’t match any of the types specified by the filter.
You can include the configuration explicitly by annotating the test class with `@Import(MyConfiguration.class)`.
This will load all the beans in `MyConfiguration` including the [`HikariDataSource`](https://javadoc.io/doc/com.zaxxer/HikariCP/6.3.3/com.zaxxer.hikari/com/zaxxer/hikari/HikariDataSource.html) bean which isn’t required when testing the web tier.
Splitting the configuration class into two will enable importing just the security configuration.

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration(proxyBeanMethods = false)
public class MySecurityConfiguration {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http.authorizeHttpRequests((requests) -> requests.anyRequest().authenticated());
		return http.build();
	}

}
```

```java
import com.zaxxer.hikari.HikariDataSource;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyDatasourceConfiguration {

	@Bean
	@ConfigurationProperties("app.datasource.second")
	public HikariDataSource secondDataSource() {
		return DataSourceBuilder.create().type(HikariDataSource.class).build();
	}

}
```

Having a single configuration class can be inefficient when beans from a certain domain need to be included in slice tests.
Instead, structuring the application’s configuration as multiple granular classes with beans for a specific domain can enable importing them only for specific slice tests.

<a id="howto.testing.testcontainers-api-downgrade"></a>

## Downgrading Testcontainers Docker API Version

Recent versions of Docker Desktop do not support the default API version used by the Testcontainers dependency managed by Spring Boot.
To help prevent issues, Spring Boot ships with `docker-java.properties` files in the `spring-boot-testcontainers` and `spring-boot-test` jars that upgrade the API version that Testcontainers uses.

If you don’t want the API version to be changed, you should add a `docker-java.properties` file in your own projects classpath.
An empty file will restore default behavior, or you can set a `api.version` property to whatever value you prefer.
