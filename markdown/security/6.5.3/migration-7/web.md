---
title: "Web Migrations"
source: "ROOT:migration-7/web.adoc"
---

# Web Migrations

<a id="_favor_relative_uris"></a>

## Favor Relative URIs

When redirecting to a login endpoint, Spring Security has favored absolute URIs in the past.
For example, if you set your login page like so:

#### Java

```java
http
    // ...
    .formLogin((form) -> form.loginPage("/my-login"))
    // ...
```

#### Kotlin

```kotlin
http {
    formLogin {
        loginPage = "/my-login"
    }
}
```

#### Xml

```kotlin
<http ...>
    <form-login login-page="/my-login"/>
</http>
```

then when redirecting to `/my-login` Spring Security would use a `Location:` like the following:

```
302 Found
// ...
Location: https://myapp.example.org/my-login
```

However, this is no longer necessary given that the RFC is was based on is now obsolete.

In Spring Security 7, this is changed to use a relative URI like so:

```
302 Found
// ...
Location: /my-login
```

Most applications will not notice a difference.
However, in the event that this change causes problems, you can switch back to the Spring Security 6 behavior by setting the `favorRelativeUrls` value:

#### Java

```java
LoginUrlAuthenticationEntryPoint entryPoint = new LoginUrlAuthenticationEntryPoint("/my-login");
entryPoint.setFavorRelativeUris(false);
http
    // ...
    .exceptionHandling((exceptions) -> exceptions.authenticaitonEntryPoint(entryPoint))
    // ...
```

#### Kotlin

```kotlin
LoginUrlAuthenticationEntryPoint entryPoint = LoginUrlAuthenticationEntryPoint("/my-login")
entryPoint.setFavorRelativeUris(false)

http {
    exceptionHandling {
        authenticationEntryPoint = entryPoint
    }
}
```

#### Xml

```xml
<http entry-point-ref="myEntryPoint">
    <!-- ... -->
</http>

<b:bean id="myEntryPoint" class="org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint">
    <b:property name="favorRelativeUris" value="true"/>
</b:bean>
```

<a id="_portresolver"></a>

## PortResolver

Spring Security uses an API called `PortResolver` to provide a workaround for a bug in Internet Explorer.
The workaround is no longer necessary and can cause users problems in some scenarios.
For this reason, Spring Security 7 will remove the `PortResolver` interface.

To prepare for this change, users should expose the `PortResolver.NO_OP` as a Bean named `portResolver`.
This ensures that the `PortResolver` implementation that is used is a no-op (e.g. does nothing) which simulates the removal of `PortResolver`.
An example configuration can be found below:

#### Java

```java
@Bean
PortResolver portResolver() {
	return PortResolver.NO_OP;
}
```

#### Kotlin

```kotlin
@Bean
open fun portResolver(): PortResolver {
    return PortResolver.NO_OP
}
```

#### Xml

```xml

<util:constant id="portResolver"
    static-field="org.springframework.security.web.PortResolver.NO_OP">
```

<a id="use-path-pattern"></a>

## Use PathPatternRequestMatcher by Default

In Spring Security 7, `AntPathRequestMatcher` and `MvcRequestMatcher` are no longer supported and the Java DSL requires that all URIs be absolute (less any context root).
At that time, Spring Security 7 will use `PathPatternRequestMatcher` by default.

To check how prepared you are for this change, you can publish this bean:

#### Java

```java
@Bean
PathPatternRequestMatcherBuilderFactoryBean requestMatcherBuilder() {
	return new PathPatternRequestMatcherBuilderFactoryBean();
}
```

#### Kotlin

```kotlin
@Bean
fun requestMatcherBuilder(): PathPatternRequestMatcherBuilderFactoryBean {
    return PathPatternRequestMatcherBuilderFactoryBean()
}
```

#### Xml

```xml
<b:bean class="org.springframework.security.config.web.PathPatternRequestMatcherBuilderFactoryBean"/>
```

This will tell the Spring Security DSL to use `PathPatternRequestMatcher` for all request matchers that it constructs.

In the event that you are directly constructing an object (as opposed to having the DSL construct it) that has a `setRequestMatcher` method. you should also proactively specify a `PathPatternRequestMatcher` there as well.

<a id="_migrate_exituserurl_and_switchuserurl_request_matchers_in_switchuserfilter"></a>

### Migrate `exitUserUrl` and `switchUserUrl` Request Matchers in `SwitchUserFilter`

`SwitchUserFilter`, constructs an `AntPathRequestMatcher` in its `setExitUserUrl` and `setSwitchUserUrl` methods.
This will change to use `PathPatternRequestMatcher` in Spring Security 7.

To prepare for this change, call `setExitUserMatcher` and `setSwithcUserMatcher` to provide this `PathPatternRequestMatcher` in advance.
That is, change this:

#### Java

```java
SwitchUserFilter switchUser = new SwitchUserFilter();
// ... other configuration
switchUser.setExitUserUrl("/exit/impersonate");
```

#### Kotlin

```kotlin
val switchUser = SwitchUserFilter()
// ... other configuration
switchUser.setExitUserUrl("/exit/impersonate")
```

to this:

#### Java

```java
SwitchUserFilter switchUser = new SwitchUserFilter();
// ... other configuration
switchUser.setExitUserMatcher(PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.POST, "/exit/impersonate"));
```

#### Kotlin

```kotlin
val switchUser = SwitchUserFilter()
// ... other configuration
switchUser.setExitUserMatcher(PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.POST, "/exit/impersonate"))
```

<a id="_migrate_filterprocessingurl_request_matcher_in_abstractauthenticationprocessingfilter_implementations"></a>

### Migrate `filterProcessingUrl` Request Matcher in `AbstractAuthenticationProcessingFilter` Implementations

Spring Security 6 converts any processing endpoint configured through `setFilterProcessingUrl` to an `AntPathRequestMatcher`.
In Spring Security 7, this will change to `PathPatternRequestMatcher`.

If you are directly invoking `setFilterProcessingUrl` on a filter that extends `AbstractAuthenticationProcessingFilter`, like `UsernamePasswordAuthenticationFilter`, `OAuth2LoginAuthenticationFilter`, `Saml2WebSsoAuthenticationFilter`, `OneTimeTokenAuthenticationFilter`, or `WebAuthnAuthenticationFilter`, call `setRequiredAuthenticationRequestMatcher` instead to provide this `PathPatternRequestMatcher` in advance.

That is, change this:

#### Java

```java
UsernamePasswordAuthenticationFilter usernamePassword = new UsernamePasswordAuthenticationFilter(authenticationManager);
usernamePassword.setFilterProcessingUrl("/my/processing/url");
```

#### Kotlin

```kotlin
val usernamePassword = UsernamePasswordAuthenticationFilter(authenticationManager)
usernamePassword.setFilterProcessingUrl("/my/processing/url")
```

to this:

#### Java

```java
UsernamePasswordAuthenticationFilter usernamePassword = new UsernamePasswordAuthenticationFilter(authenticationManager);
RequestMatcher requestMatcher = PathPatternRequestMatcher.withDefaults().matcher("/my/processing/url");
usernamePassword.setRequest(requestMatcher);
```

#### Kotlin

```kotlin
val usernamePassword = UsernamePasswordAuthenticationFilter(authenticationManager)
val requestMatcher = PathPatternRequestMatcher.withDefaults().matcher("/my/processing/url")
usernamePassword.setRequest(requestMatcher)
```

```
Most applications use the DSL instead of setting the `filterProcessingUrl` directly on a filter instance.
```

<a id="_migrate_cas_proxy_receptor_request_matcher"></a>

### Migrate CAS Proxy Receptor Request Matcher

Spring Security 6 converts any configured `proxyReceptorUrl` to a request matcher that matches the end of the request, that is `/**/proxy/receptor`.
In Spring Security 7, this pattern is not allowed and will change to using `PathPatternRequestMatcher`.
Also in Spring Security 7m the URL should by absolute, excluding any context path, like so: `/proxy/receptor`.

So to prepare for these change, you can use `setProxyReceptorRequestMatcher` instead of `setProxyReceptorUrl`.

That is, change this:

#### Java

```java
casAuthentication.setProxyReceptorUrl("/proxy/receptor");
```

#### Kotlin

```kotlin
casAuthentication.setProxyReceptorUrl("/proxy/receptor")
```

to this:

#### Java

```java
casAuthentication.setProxyReceptorUrl(PathPatternRequestMatcher.withDefaults().matcher("/proxy/receptor"));
```

#### Kotlin

```kotlin
casAuthentication.setProxyReceptorUrl(PathPatternRequestMatcher.withDefaults().matcher("/proxy/receptor"))
```

<a id="_migrate_your_webinvocationprivilegeevaluator"></a>

### Migrate your WebInvocationPrivilegeEvaluator

If you are using Spring Security’s JSP Taglibs or are using `WebInvocationPrivilegeEvaluator` directly, be aware of the following changes:

1. `RequestMatcherWebInvocationPrivilegeEvaluator` is deprecated in favor of `AuthorizationManagerWebInvocationPrivilegeEvaluator`
1. `HandlerMappingIntrospectorRequestTransformer` is deprecated in favor of `PathPatternRequestTransformer`

If you are not constructing these directly, you can opt-in to both changes in advance by publishing a `PathPatternRequestTransformer` like so:

#### Java

```java
@Bean
HttpServletRequestTransformer pathPatternRequestTransformer() {
	return new PathPatternRequestTransformer();
}
```

#### Kotlin

```kotlin
@Bean
fun pathPatternRequestTransformer(): HttpServletRequestTransformer {
    return PathPatternRequestTransformer()
}
```

#### Xml

```xml
<b:bean class="org.springframework.security.web.access.PathPatternRequestTransformer"/>
```

Spring Security will take this as a signal to use the new implementations.

<a id="NOTE"></a>

```
One difference you may notice is that `AuthorizationManagerWebPrivilegeInvocationEvaluator` allows the authentication to be `null` if the authorization rule is `permitAll`.

Test your endpoints that `permitAll` in case JSP requests using this same require should not, in fact, be permitted.
```

<a id="_include_the_servlet_path_prefix_in_authorization_rules"></a>

## Include the Servlet Path Prefix in Authorization Rules

For many applications [the above](#use-path-pattern) will make no difference since most commonly all URIs listed are matched by the default servlet.

However, if you have other servlets with servlet path prefixes, [then these paths now need to be supplied separately](../servlet/authorization/authorize-http-requests.md).

For example, if I have a Spring MVC controller with `@RequestMapping("/orders")` and my MVC application is deployed to `/mvc` (instead of the default servlet), then the URI for this endpoint is `/mvc/orders`.
Historically, the Java DSL hasn’t had a simple way to specify the servlet path prefix and Spring Security attempted to infer it.

Over time, we learned that these inference would surprise developers.
Instead of taking this responsibility away from developers, now it is simpler to specify the servlet path prefix like so:

```
PathPatternRequestParser.Builder servlet = PathPatternRequestParser.withDefaults().basePath("/mvc");
http
    .authorizeHttpRequests((authorize) -> authorize
        .requestMatchers(servlet.pattern("/orders/**").matcher()).authenticated()
    )
```

For paths that belong to the default servlet, use `PathPatternRequestParser.withDefaults()` instead:

```
PathPatternRequestParser.Builder request = PathPatternRequestParser.withDefaults();
http
    .authorizeHttpRequests((authorize) -> authorize
        .requestMatchers(request.pattern("/js/**").matcher()).authenticated()
    )
```

Note that this doesn’t address every kind of servlet since not all servlets have a path prefix.
For example, expressions that match the JSP Servlet might use an ant pattern `/*/.jsp`.

There is not yet a general-purpose replacement for these, and so you are encouraged to use `RegexRequestMatcher`, like so:  `regexMatcher("\\.jsp$")`.

For many applications this will make no difference since most commonly all URIs listed are matched by the default servlet.

<a id="use-redirect-to-https"></a>

## Use RedirectToHttps Instead of Channel Security

Years ago, HTTPS at large was enough of a performance and configuration concern that applications wanted to be able to decide which segments of an application would require HTTPS.

`requires-channel` in XML and `requiresChannel` in Java Config allowed configurating an application with that in mind:

#### Java

```java
http
    .requiresChannel((channel) -> channel
        .requestMatchers("/secure/**").requiresSecureChannel()
        .requestMatchers("/insecure/**").requiresInsecureChannel()
    )
```

#### Kotlin

```kotlin
http {
    requiresChannel {
        secure("/secure/**")
        seccure("/insecure/**", "REQUIRES_INSECURE_CHANNEL")
    }
}
```

#### Xml

```xml
<http>
    <intercept-url pattern="/secure/**" access="authenticated" requires-channel="REQUIRES_SECURE_CHANNEL"/>
    <intercept-url pattern="/insecure/**" access="authenticated" requires-channel="REQUIRES_INSECURE_CHANNEL"/>
</http>
```

Modern applications should either always require HTTPS.
However, there are times, like when developing locally, when one would like the application to use HTTP.
Or, you may have continuing circumstances that require part of your application to be HTTP.

In any case, you can migrate to `redirect-to-https-request-matcher-ref` and `redirectToHttps` by first constructing a `RequestMatcher` that contains all circumstances where redirecting to HTTPS is needed.
Then you can reference that request matcher like so:

#### Java

```java
http
    .redirectToHttps((https) -> https.requestMatchers("/secure/**"))
    // ...
```

#### Kotlin

```kotlin
var secure: RequestMatcher = PathPatternRequestMatcher.withDefaults().pattern("/secure/**")
http {
    redirectToHttps {
        requestMatchers = secure
    }
    // ...
}
```

#### Xml

```xml
<b:bean id="builder" class="org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher$Builder"/>
<b:bean id="secure" class="org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher" factory-bean="builder" factory-method="matcher">
    <b:constructor-arg value="/secure/**"/>
</b:bean>
<http redirect-to-https-request-matcher-ref="secure">
    <intercept-url pattern="/secure/**" access="authenticated"/>
    <intercept-url pattern="/insecure/**" access="authenticated"/>
    <!-- ... -->
</http>
```

> [!TIP]
> If you have several circumstances where HTTP is needed, consider using `OrRequestMatcher` to combine them into a single `RequestMatcher` instance.

<a id="_use_setcookiecustomizer_instead_of_individual_setters"></a>

## Use `setCookieCustomizer` instead of individual setters

In favor of a simpler API, `CookieCsrfTokenRepository#setCookieCustomizer` allows you to change any aspect of the cookie, replacing `setCookieHttpOnly`, `setCookieMaxAge`, `setSecure`, and `setCookieDomain`.

Change this:

#### Java

```java
CookeCsrfTokenRepository csrf = CookeCsrfTokenRepository.withHttpOnlyFalse();
csrf.setCookieMaxAge(86400)
```

#### Kotlin

```kotlin
val csrf = CookeCsrfTokenRepository.withHttpOnlyFalse()
csrf.setCookieMaxAge(86400)
```

to this:

#### Java

```java
CookeCsrfTokenRepository csrf = CookeCsrfTokenRepository.withHttpOnlyFalse();
csrf.setCookieCustomizer((c) -> c.maxAge(86400));
```

#### Kotlin

```kotlin
val csrf = CookeCsrfTokenRepository.withHttpOnlyFalse()
csrf.setCookieCustomizer { -> it.maxAge(86400) }
```
