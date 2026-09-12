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
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@WebMvcTest(UserController.class)
class MySecurityTests {

	@Autowired
	private MockMvc mvc;

	@Test
	@WithMockUser(roles = "ADMIN")
	void requestProtectedUrlWithUser() throws Exception {
		this.mvc.perform(get("/"));
	}

}
```

#### Kotlin

```kotlin
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders

@WebMvcTest(UserController::class)
class MySecurityTests(@Autowired val mvc: MockMvc) {

	@Test
	@WithMockUser(roles = ["ADMIN"])
	fun requestProtectedUrlWithUser() {
		mvc.perform(MockMvcRequestBuilders.get("/"))
	}

}
```

Spring Security provides comprehensive integration with Spring MVC Test, and this can also be used when testing controllers using the `@WebMvcTest` slice and `MockMvc`.

For additional details on Spring Security’s testing support, see Spring Security’s [reference documentation](https://docs.spring.io/spring-security/reference/6.3/servlet/test/index.html).

<a id="howto.testing.slice-tests"></a>

## Structure `@Configuration` Classes for Inclusion in Slice Tests

Slice tests work by restricting Spring Framework’s component scanning to a limited set of components based on their type.
For any beans that are not created through component scanning, for example, beans that are created using the `@Bean` annotation, slice tests will not be able to include/exclude them from the application context.
Consider this example:

```java
import org.apache.commons.dbcp2.BasicDataSource;

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
	public BasicDataSource secondDataSource() {
		return DataSourceBuilder.create().type(BasicDataSource.class).build();
	}

}
```

For a `@WebMvcTest` for an application with the above `@Configuration` class, you might expect to have the `SecurityFilterChain` bean in the application context so that you can test if your controller endpoints are secured properly.
However, `MyConfiguration` is not picked up by @WebMvcTest’s component scanning filter because it doesn’t match any of the types specified by the filter.
You can include the configuration explicitly by annotating the test class with `@Import(MyConfiguration.class)`.
This will load all the beans in `MyConfiguration` including the `BasicDataSource` bean which isn’t required when testing the web tier.
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
import org.apache.commons.dbcp2.BasicDataSource;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyDatasourceConfiguration {

	@Bean
	@ConfigurationProperties("app.datasource.second")
	public BasicDataSource secondDataSource() {
		return DataSourceBuilder.create().type(BasicDataSource.class).build();
	}

}
```

Having a single configuration class can be inefficient when beans from a certain domain need to be included in slice tests.
Instead, structuring the application’s configuration as multiple granular classes with beans for a specific domain can enable importing them only for specific slice tests.
