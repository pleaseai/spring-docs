---
title: "Authentication Migrations"
source: "ROOT:migration/servlet/authentication.adoc"
---

# Authentication Migrations

The following steps relate to how to finish migrating authentication support.

<a id="_propagate_authenticationserviceexceptions"></a>

## Propagate `AuthenticationServiceException`s

[`AuthenticationFilter`](https://docs.spring.io/spring-security/site/docs/6.5.11/api/org/springframework/security/web/authentication/AuthenticationFilter.html) propagates [`AuthenticationServiceException`](https://docs.spring.io/spring-security/site/docs/6.5.11/api/org/springframework/security/authentication/AuthenticationServiceException.html)s to the [`AuthenticationEntryPoint`](https://docs.spring.io/spring-security/site/docs/6.5.11/api/org/springframework/security/web/AuthenticationEntryPoint.html).
Because `AuthenticationServiceException`s represent a server-side error instead of a client-side error, in 6.0, this changes to propagate them to the container.

So, if you opted into this behavior by setting `rethrowAuthenticationServiceException` to `true`, you can now remove it like so:

#### Java

```java
AuthenticationFilter authenticationFilter = new AuthenticationFilter(...);
AuthenticationEntryPointFailureHandler handler = new AuthenticationEntryPointFailureHandler(...);
handler.setRethrowAuthenticationServiceException(true);
authenticationFilter.setAuthenticationFailureHandler(handler);
```

#### Kotlin

```kotlin
val authenticationFilter: AuthenticationFilter = AuthenticationFilter(...)
val handler: AuthenticationEntryPointFailureHandler = AuthenticationEntryPointFailureHandler(...)
handler.setRethrowAuthenticationServiceException(true)
authenticationFilter.setAuthenticationFailureHandler(handler)
```

#### Xml

```xml
<bean id="authenticationFilter" class="org.springframework.security.web.authentication.AuthenticationFilter">
    <!-- ... -->
    <property ref="authenticationFailureHandler"/>
</bean>

<bean id="authenticationFailureHandler" class="org.springframework.security.web.authentication.AuthenticationEntryPointFailureHandler">
    <property name="rethrowAuthenticationServiceException" value="true"/>
</bean>
```

changes to:

#### Java

```java
AuthenticationFilter authenticationFilter = new AuthenticationFilter(...);
AuthenticationEntryPointFailureHandler handler = new AuthenticationEntryPointFailureHandler(...);
authenticationFilter.setAuthenticationFailureHandler(handler);
```

#### Kotlin

```kotlin
val authenticationFilter: AuthenticationFilter = AuthenticationFilter(...)
val handler: AuthenticationEntryPointFailureHandler = AuthenticationEntryPointFailureHandler(...)
authenticationFilter.setAuthenticationFailureHandler(handler)
```

#### Xml

```xml
<bean id="authenticationFilter" class="org.springframework.security.web.authentication.AuthenticationFilter">
    <!-- ... -->
    <property ref="authenticationFailureHandler"/>
</bean>

<bean id="authenticationFailureHandler" class="org.springframework.security.web.authentication.AuthenticationEntryPointFailureHandler">
    <!-- ... -->
</bean>
```

<a id="servlet-opt-in-sha256-rememberme"></a>

## Use SHA-256 in Remember Me

In 6.0, the `TokenBasedRememberMeServices` uses SHA-256 to encode and match the token.
To complete the migration, any default values can be removed.

For example, if you opted in to the 6.0 default for `encodingAlgorithm` and `matchingAlgorithm` like so:

#### Java

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, RememberMeServices rememberMeServices) throws Exception {
        http
                // ...
                .rememberMe((remember) -> remember
                    .rememberMeServices(rememberMeServices)
                );
        return http.build();
    }
    @Bean
    RememberMeServices rememberMeServices(UserDetailsService userDetailsService) {
        RememberMeTokenAlgorithm encodingAlgorithm = RememberMeTokenAlgorithm.SHA256;
        TokenBasedRememberMeServices rememberMe = new TokenBasedRememberMeServices(myKey, userDetailsService, encodingAlgorithm);
        rememberMe.setMatchingAlgorithm(RememberMeTokenAlgorithm.SHA256);
        return rememberMe;
    }
}
```

#### XML

```xml
<http>
  <remember-me services-ref="rememberMeServices"/>
</http>
<bean id="rememberMeServices" class=
"org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices">
    <property name="userDetailsService" ref="myUserDetailsService"/>
    <property name="key" value="springRocks"/>
    <property name="matchingAlgorithm" value="SHA256"/>
    <property name="encodingAlgorithm" value="SHA256"/>
</bean>
```

then the defaults can be removed:

#### Java

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, RememberMeServices rememberMeServices) throws Exception {
        http
                // ...
                .rememberMe((remember) -> remember
                    .rememberMeServices(rememberMeServices)
                );
        return http.build();
    }
    @Bean
    RememberMeServices rememberMeServices(UserDetailsService userDetailsService) {
        return new TokenBasedRememberMeServices(myKey, userDetailsService);
    }
}
```

#### XML

```xml
<http>
  <remember-me services-ref="rememberMeServices"/>
</http>
<bean id="rememberMeServices" class=
"org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices">
    <property name="userDetailsService" ref="myUserDetailsService"/>
    <property name="key" value="springRocks"/>
</bean>
```

<a id="_default_authorities_for_oauth2login"></a>

## Default authorities for oauth2Login()

In Spring Security 5, the default `GrantedAuthority` given to a user that authenticates with an OAuth2 or OpenID Connect 1.0 provider (via `oauth2Login()`) is `ROLE_USER`.

In Spring Security 6, the default authority given to a user authenticating with an OAuth2 provider is `OAUTH2_USER`.
The default authority given to a user authenticating with an OpenID Connect 1.0 provider is `OIDC_USER`.
If you configured the `GrantedAuthoritiesMapper` only for the purpose of updating to 6.0, you can remove it completely.
