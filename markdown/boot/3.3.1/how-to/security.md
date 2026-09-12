---
title: "Security"
source: "how-to:security.adoc"
---

<a id="howto.security"></a>

# Security

This section addresses questions about security when working with Spring Boot, including questions that arise from using Spring Security with Spring Boot.

For more about Spring Security, see the [Spring Security project page](https://spring.io/projects/spring-security).

<a id="howto.security.switch-off-spring-boot-configuration"></a>

## Switch off the Spring Boot Security Configuration

If you define a `@Configuration` with a `SecurityFilterChain` bean in your application, this action switches off the default webapp security settings in Spring Boot.

<a id="howto.security.change-user-details-service-and-add-user-accounts"></a>

## Change the UserDetailsService and Add User Accounts

If you provide a `@Bean` of type `AuthenticationManager`, `AuthenticationProvider`, or `UserDetailsService`, the default `@Bean` for `InMemoryUserDetailsManager` is not created.
This means you have the full feature set of Spring Security available (such as [various authentication options](https://docs.spring.io/spring-security/reference/6.3/servlet/authentication/index.html)).

The easiest way to add user accounts is by providing your own `UserDetailsService` bean.

<a id="howto.security.enable-https"></a>

## Enable HTTPS When Running behind a Proxy Server

Ensuring that all your main endpoints are only available over HTTPS is an important chore for any application.
If you use Tomcat as a servlet container, then Spring Boot adds Tomcat’s own `RemoteIpValve` automatically if it detects some environment settings, allowing you to rely on the `HttpServletRequest` to report whether it is secure or not (even downstream of a proxy server that handles the real SSL termination).
The standard behavior is determined by the presence or absence of certain request headers (`x-forwarded-for` and `x-forwarded-proto`), whose names are conventional, so it should work with most front-end proxies.
You can switch on the valve by adding some entries to `application.properties`, as shown in the following example:

#### Properties

```properties
server.tomcat.remoteip.remote-ip-header=x-forwarded-for
server.tomcat.remoteip.protocol-header=x-forwarded-proto
```

#### YAML

```yaml
server:
  tomcat:
    remoteip:
      remote-ip-header: "x-forwarded-for"
      protocol-header: "x-forwarded-proto"
```

(The presence of either of those properties switches on the valve.
Alternatively, you can add the `RemoteIpValve` by customizing the `TomcatServletWebServerFactory` using a `WebServerFactoryCustomizer` bean.)

To configure Spring Security to require a secure channel for all (or some) requests, consider adding your own `SecurityFilterChain` bean that adds the following `HttpSecurity` configuration:

#### Java

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class MySecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		// Customize the application security ...
		http.requiresChannel((channel) -> channel.anyRequest().requiresSecure());
		return http.build();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.SecurityFilterChain

@Configuration
class MySecurityConfig {

	@Bean
	fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
		// Customize the application security ...
		http.requiresChannel { requests -> requests.anyRequest().requiresSecure() }
		return http.build()
	}

}
```
