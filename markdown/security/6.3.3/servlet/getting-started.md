---
title: "Hello Spring Security"
source: "ROOT:servlet/getting-started.adoc"
---

<a id="servlet-hello"></a>

# Hello Spring Security

This section covers the minimum setup for how to use Spring Security with [Spring Boot](https://docs.spring.io/spring-boot/3.1.1/) and then points you to next steps after that.

> [!NOTE]
> The completed starter application can be found [in our samples repository](https://github.com/spring-projects/spring-security-samples/tree/6.3.x/servlet/spring-boot/java/hello-security).
> For your convenience, you can download a minimal Spring Boot + Spring Security application [prepared by Spring Initializr](https://start.spring.io/starter.zip?type=maven-project&language=java&packaging=jar&jvmVersion=1.8&groupId=example&artifactId=hello-security&name=hello-security&description=Hello%20Security&packageName=example.hello-security&dependencies=web,security).

<a id="servlet-hello-dependencies"></a>

## Updating Dependencies

You first need to add Spring Security to your application’s classpath; two ways to do this are to [use Maven](../getting-spring-security.md#getting-maven-boot) or [Gradle](../getting-spring-security.md#getting-gradle-boot).

<a id="servlet-hello-starting"></a>

## Starting Hello Spring Security Boot

With Spring Security [on the classpath](#servlet-hello-dependencies), you can now [run the Spring Boot application](https://docs.spring.io/spring-boot/3.1.1/#using.running-your-application).
The following snippet shows some of the output that indicates that Spring Security is enabled in your application:

#### Maven

```bash
$ ./mvnw spring-boot:run
...
INFO 23689 --- [  restartedMain] .s.s.UserDetailsServiceAutoConfiguration :

Using generated security password: 8e557245-73e2-4286-969a-ff57fe326336

...
```

#### Gradle

```bash
$ ./gradlew :bootRun
...
INFO 23689 --- [  restartedMain] .s.s.UserDetailsServiceAutoConfiguration :

Using generated security password: 8e557245-73e2-4286-969a-ff57fe326336

...
```

#### Jar

```bash
$ java -jar target/myapplication-0.0.1.jar
...
INFO 23689 --- [  restartedMain] .s.s.UserDetailsServiceAutoConfiguration :

Using generated security password: 8e557245-73e2-4286-969a-ff57fe326336

...
```

Now that you have it running, you might try hitting an endpoint to see what happens.
If you hit an endpoint without credentials like so:

#### Querying a Secured Boot Application

```bash
$ curl -i http://localhost:8080/some/path
HTTP/1.1 401
...
```

then Spring Security denies access with a `401 Unauthorized`.

> [!TIP]
> If you provide the same URL in a browser, it will redirect to a default login page.

And if you hit an endpoint with credentials (found in the console output) as follows:

#### Querying with Credentials

```bash
$ curl -i -u user:8e557245-73e2-4286-969a-ff57fe326336 http://localhost:8080/some/path
HTTP/1.1 404
...
```

then Spring Boot will service the request, returning a `404 Not Found` in this case since `/some/path` doesn’t exist.

From here, you can:

- Better understand [what Spring Boot enables in Spring Security by default](#servlet-hello-auto-configuration)
- Read about [common use cases](#security-use-cases) that Spring Security helps with
- Start configuring [authentication](authentication/index.md)

<a id="servlet-hello-auto-configuration"></a>

## Runtime Expectations

The default arrangement of Spring Boot and Spring Security affords the following behaviors at runtime:

- Requires an authenticated user [for any endpoint](authorization/authorize-http-requests.md) (including Boot’s `/error` endpoint)
- [Registers a default user](authentication/passwords/user-details-service.md) with a generated password at startup (the password is logged to the console; in the preceding example, the password is `8e557245-73e2-4286-969a-ff57fe326336`)
- Protects [password storage with BCrypt](authentication/passwords/password-encoder.md) as well as others
- Provides form-based [login](authentication/passwords/form.md) and [logout](authentication/logout.md) flows
- Authenticates [form-based login](authentication/passwords/form.md) as well as [HTTP Basic](authentication/passwords/basic.md)
- Provides content negotiation; for web requests, redirects to the login page; for service requests, returns a `401 Unauthorized`
- [Mitigates CSRF](exploits/csrf.md) attacks
- [Mitigates Session Fixation](authentication/session-management.md#ns-session-fixation) attacks
- Writes [Strict-Transport-Security](exploits/headers.md#servlet-headers-hsts) to [ensure HTTPS](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security)
- Writes [X-Content-Type-Options](exploits/headers.md#servlet-headers-content-type-options) to mitigate [sniffing attacks](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html#x-content-type-options)
- Writes [Cache Control headers](exploits/headers.md#servlet-headers-cache-control) that protect authenticated resources
- Writes [X-Frame-Options](exploits/headers.md#servlet-headers-frame-options) to mitigate [Clickjacking](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html#x-frame-options)
- Integrates with [`HttpServletRequest`'s authentication methods](integrations/servlet-api.md)
- Publishes [authentication success and failure events](authentication/events.md)

It can be helpful to understand how Spring Boot is coordinating with Spring Security to achieve this.
Taking a look at [Boot’s security auto configuration](https://docs.spring.io/spring-boot/3.1.1/api/java/org/springframework/boot/autoconfigure/security/servlet/SecurityAutoConfiguration.html), it does the following (simplified for illustration):

#### Spring Boot Security Auto Configuration

```java
@EnableWebSecurity <1>
@Configuration
public class DefaultSecurityConfig {
    @Bean
    @ConditionalOnMissingBean(UserDetailsService.class)
    InMemoryUserDetailsManager inMemoryUserDetailsManager() { <2>
        String generatedPassword = // ...;
        return new InMemoryUserDetailsManager(User.withUsername("user")
                .password(generatedPassword).roles("USER").build());
    }

    @Bean
    @ConditionalOnMissingBean(AuthenticationEventPublisher.class)
    DefaultAuthenticationEventPublisher defaultAuthenticationEventPublisher(ApplicationEventPublisher delegate) { <3>
        return new DefaultAuthenticationEventPublisher(delegate);
    }
}
```

1. Adds the `@EnableWebSecurity` annotation. (Among other things, this publishes [Spring Security’s default `Filter` chain](architecture.md#servlet-securityfilterchain) as a `@Bean`)
1. Publishes a [`UserDetailsService`](authentication/passwords/user-details-service.md) `@Bean` with a username of `user` and a randomly generated password that is logged to the console
1. Publishes an [`AuthenticationEventPublisher`](authentication/events.md) `@Bean` for publishing authentication events

> [!NOTE]
> Spring Boot adds any `Filter` published as a `@Bean` to the application’s filter chain.
> This means that using `@EnableWebSecurity` in conjunction with Spring Boot automatically registers Spring Security’s filter chain for every request.

<a id="security-use-cases"></a>

## Security Use Cases

There are a number of places that you may want to go from here.
To figure out what’s next for you and your application, consider these common use cases that Spring Security is built to address:

- I am building a REST API, and I need to [authenticate a JWT](oauth2/resource-server/jwt.md) or [other bearer token](oauth2/resource-server/opaque-token.md)
- I am building a Web Application, API Gateway, or BFF and

  - I need to [login using OAuth 2.0 or OIDC](oauth2/login/core.md)
  - I need to [login using SAML 2.0](saml2/login/index.md)
  - I need to [login using CAS](authentication/cas.md)
- I need to manage

  - Users in [LDAP](authentication/passwords/ldap.md) or [Active Directory](authentication/passwords/ldap.md#_active_directory), with [Spring Data](integrations/data.md), or with [JDBC](authentication/passwords/jdbc.md)
  - [Passwords](authentication/passwords/storage.md)

In case none of those match what you are looking for, consider thinking about your application in the following order:

1. **Protocol**: First, consider the protocol your application will use to communicate.
For servlet-based applications, Spring Security supports HTTP as well as [Websockets](integrations/websocket.md).
1. **Authentication**: Next, consider how users will [authenticate](authentication/index.md) and if that authentication will be stateful or stateless
1. **Authorization**: Then, consider how you will determine [what a user is authorized to do](authorization/index.md)
1. **Defense**: Finally, [integrate with Spring Security’s default protections](exploits/csrf.md#csrf-considerations) and consider [which additional protections you need](exploits/headers.md)
