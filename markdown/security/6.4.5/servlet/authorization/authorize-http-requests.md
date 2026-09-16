---
title: "Authorize HttpServletRequests"
source: "ROOT:servlet/authorization/authorize-http-requests.adoc"
---

<a id="servlet-authorization-authorizationfilter"></a>

# Authorize HttpServletRequests

Spring Security allows you to [model your authorization](index.md) at the request level.
For example, with Spring Security you can say that all pages under `/admin` require one authority while all other pages simply require authentication.

By default, Spring Security requires that every request be authenticated.
That said, any time you use [an `HttpSecurity` instance](../configuration/java.md#jc-httpsecurity), it’s necessary to declare your authorization rules.

<a id="activate-request-security"></a>

Whenever you have an `HttpSecurity` instance, you should at least do:

#### Java

```java
http
    .authorizeHttpRequests((authorize) -> authorize
        .anyRequest().authenticated()
    )
```

#### Kotlin

```kotlin
http {
    authorizeHttpRequests {
        authorize(anyRequest, authenticated)
    }
}
```

#### Xml

```xml
<http>
    <intercept-url pattern="/**" access="authenticated"/>
</http>
```

This tells Spring Security that any endpoint in your application requires that the security context at a minimum be authenticated in order to allow it.

In many cases, your authorization rules will be more sophisticated than that, so please consider the following use cases:

- I have an app that uses `authorizeRequests` and I want to [migrate it to `authorizeHttpRequests`](#migrate-authorize-requests)
- I want to [understand how the `AuthorizationFilter` components work](#request-authorization-architecture)
- I want to [match requests](#match-requests) based on a pattern; specifically [regex](#match-by-regex)
- I want to match request, and I map Spring MVC to [something other than the default servlet](#mvc-not-default-servlet)
- I want to [authorize requests](#authorize-requests)
- I want to [match a request programmatically](#match-by-custom)
- I want to [authorize a request programmatically](#authorize-requests)
- I want to [delegate request authorization](#remote-authorization-manager) to a policy agent

<a id="request-authorization-architecture"></a>

## Understanding How Request Authorization Components Work

> [!NOTE]
> This section builds on [Servlet Architecture and Implementation](../architecture.md#servlet-architecture) by digging deeper into how [authorization](index.md#servlet-authorization) works at the request level in Servlet-based applications.

#### Authorize HttpServletRequest

![authorizationfilter](https://raw.githubusercontent.com/spring-projects/spring-security/6.4.5/docs/modules/ROOT/assets/images/servlet/authorization/authorizationfilter.png)

- ![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.4.5/docs/modules/ROOT/assets/images/icons/number_1.png) First, the `AuthorizationFilter` constructs a `Supplier` that retrieves an  [Authentication](../authentication/architecture.md#servlet-authentication-authentication) from the [SecurityContextHolder](../authentication/architecture.md#servlet-authentication-securitycontextholder).
- ![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.4.5/docs/modules/ROOT/assets/images/icons/number_2.png) Second, it passes the `Supplier<Authentication>` and the `HttpServletRequest` to the [`AuthorizationManager`](../architecture.md#authz-authorization-manager).
The `AuthorizationManager` matches the request to the patterns in `authorizeHttpRequests`, and runs the corresponding rule.

  - ![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.4.5/docs/modules/ROOT/assets/images/icons/number_3.png) If authorization is denied, [an `AuthorizationDeniedEvent` is published](events.md), and an `AccessDeniedException` is thrown.
  In this case the [`ExceptionTranslationFilter`](../architecture.md#servlet-exceptiontranslationfilter) handles the `AccessDeniedException`.
  - ![number 4](https://raw.githubusercontent.com/spring-projects/spring-security/6.4.5/docs/modules/ROOT/assets/images/icons/number_4.png) If access is granted, [an `AuthorizationGrantedEvent` is published](events.md) and `AuthorizationFilter` continues with the [FilterChain](../architecture.md#servlet-filters-review) which allows the application to process normally.

<a id="_authorizationfilter_is_last_by_default"></a>

### `AuthorizationFilter` Is Last By Default

The `AuthorizationFilter` is last in [the Spring Security filter chain](../architecture.md#servlet-filterchain-figure) by default.
This means that Spring Security’s [authentication filters](../authentication/index.md), [exploit protections](../exploits/index.md), and other filter integrations do not require authorization.
If you add filters of your own before the `AuthorizationFilter`, they will also not require authorization; otherwise, they will.

A place where this typically becomes important is when you are adding [Spring MVC](https://docs.spring.io/spring-framework/reference/6.2.6/web.html#spring-web) endpoints.
Because they are executed by the [`DispatcherServlet`](https://docs.spring.io/spring-framework/reference/6.2.6/web.html#mvc-servlet) and this comes after the `AuthorizationFilter`, your endpoints need to be [included in `authorizeHttpRequests` to be permitted](#authorizing-endpoints).

<a id="_all_dispatches_are_authorized"></a>

### All Dispatches Are Authorized

The `AuthorizationFilter` runs not just on every request, but on every dispatch.
This means that the `REQUEST` dispatch needs authorization, but also `FORWARD`s, `ERROR`s, and `INCLUDE`s.

For example, [Spring MVC](https://docs.spring.io/spring-framework/reference/6.2.6/web.html#spring-web) can `FORWARD` the request to a view resolver that renders a Thymeleaf template, like so:

#### Java

```java
@Controller
public class MyController {
    @GetMapping("/endpoint")
    public String endpoint() {
        return "endpoint";
    }
}
```

#### Kotlin

```kotlin
@Controller
class MyController {
    @GetMapping("/endpoint")
    fun endpoint(): String {
        return "endpoint"
    }
}
```

In this case, authorization happens twice; once for authorizing `/endpoint` and once for forwarding to Thymeleaf to render the "endpoint" template.

For that reason, you may want to [permit all `FORWARD` dispatches](#match-by-dispatcher-type).

Another example of this principle is [how Spring Boot handles errors](https://docs.spring.io/spring-boot/3.3.3/reference/web/servlet.html#web.servlet.spring-mvc.error-handling).
If the container catches an exception, say like the following:

#### Java

```java
@Controller
public class MyController {
    @GetMapping("/endpoint")
    public String endpoint() {
        throw new UnsupportedOperationException("unsupported");
    }
}
```

#### Kotlin

```kotlin
@Controller
class MyController {
    @GetMapping("/endpoint")
    fun endpoint(): String {
        throw UnsupportedOperationException("unsupported")
    }
}
```

then Boot will dispatch it to the `ERROR` dispatch.

In that case, authorization also happens twice; once for authorizing `/endpoint` and once for dispatching the error.

For that reason, you may want to [permit all `ERROR` dispatches](#match-by-dispatcher-type).

<a id="_authentication_lookup_is_deferred"></a>

### `Authentication` Lookup is Deferred

Remember that [the `AuthorizationManager` API uses a `Supplier<Authentication>`](architecture.md#_the_authorizationmanager).

This matters with `authorizeHttpRequests` when requests are [always permitted or always denied](#authorize-requests).
In those cases, [the `Authentication`](../authentication/architecture.md#servlet-authentication-authentication) is not queried, making for a faster request.

<a id="authorizing-endpoints"></a>

## Authorizing an Endpoint

You can configure Spring Security to have different rules by adding more rules in order of precedence.

If you want to require that `/endpoint` only be accessible by end users with the `USER` authority, then you can do:

#### Java

```java
@Bean
public SecurityFilterChain web(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests((authorize) -> authorize
	    .requestMatchers("/endpoint").hasAuthority("USER")
            .anyRequest().authenticated()
        )
        // ...

    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun web(http: HttpSecurity): SecurityFilterChain {
    http {
        authorizeHttpRequests {
            authorize("/endpoint", hasAuthority("USER"))
            authorize(anyRequest, authenticated)
        }
    }

    return http.build()
}
```

#### Xml

```xml
<http>
    <intercept-url pattern="/endpoint" access="hasAuthority('USER')"/>
    <intercept-url pattern="/**" access="authenticated"/>
</http>
```

As you can see, the declaration can be broken up in to pattern/rule pairs.

`AuthorizationFilter` processes these pairs in the order listed, applying only the first match to the request.
This means that even though `/**` would also match for `/endpoint` the above rules are not a problem.
The way to read the above rules is "if the request is `/endpoint`, then require the `USER` authority; else, only require authentication".

Spring Security supports several patterns and several rules; you can also programmatically create your own of each.

Once authorized, you can test it using [Security’s test support](../test/method.md#test-method-withmockuser) in the following way:

#### Java

```java
@WithMockUser(authorities="USER")
@Test
void endpointWhenUserAuthorityThenAuthorized() {
    this.mvc.perform(get("/endpoint"))
        .andExpect(status().isOk());
}

@WithMockUser
@Test
void endpointWhenNotUserAuthorityThenForbidden() {
    this.mvc.perform(get("/endpoint"))
        .andExpect(status().isForbidden());
}

@Test
void anyWhenUnauthenticatedThenUnauthorized() {
    this.mvc.perform(get("/any"))
        .andExpect(status().isUnauthorized());
}
```

<a id="match-requests"></a>

## Matching Requests

Above you’ve already seen [two ways to match requests](#authorizing-endpoints).

The first you saw was the simplest, which is to match any request.

The second is to match by a URI pattern.
Spring Security supports two languages for URI pattern-matching: [Ant](#match-by-ant) (as seen above) and [Regular Expressions](#match-by-regex).

<a id="match-by-ant"></a>

### Matching Using Ant

Ant is the default language that Spring Security uses to match requests.

You can use it to match a single endpoint or a directory, and you can even capture placeholders for later use.
You can also refine it to match a specific set of HTTP methods.

Let’s say that you instead of wanting to match the `/endpoint` endpoint, you want to match all endpoints under the `/resource` directory.
In that case, you can do something like the following:

#### Java

```java
http
    .authorizeHttpRequests((authorize) -> authorize
        .requestMatchers("/resource/**").hasAuthority("USER")
        .anyRequest().authenticated()
    )
```

#### Kotlin

```kotlin
http {
    authorizeHttpRequests {
        authorize("/resource/**", hasAuthority("USER"))
        authorize(anyRequest, authenticated)
    }
}
```

#### Xml

```xml
<http>
    <intercept-url pattern="/resource/**" access="hasAuthority('USER')"/>
    <intercept-url pattern="/**" access="authenticated"/>
</http>
```

The way to read this is "if the request is `/resource` or some subdirectory, require the `USER` authority; otherwise, only require authentication"

You can also extract path values from the request, as seen below:

#### Java

```java
http
    .authorizeHttpRequests((authorize) -> authorize
        .requestMatchers("/resource/{name}").access(new WebExpressionAuthorizationManager("#name == authentication.name"))
        .anyRequest().authenticated()
    )
```

#### Kotlin

```kotlin
http {
    authorizeHttpRequests {
        authorize("/resource/{name}", WebExpressionAuthorizationManager("#name == authentication.name"))
        authorize(anyRequest, authenticated)
    }
}
```

#### Xml

```xml
<http>
    <intercept-url pattern="/resource/{name}" access="#name == authentication.name"/>
    <intercept-url pattern="/**" access="authenticated"/>
</http>
```

Once authorized, you can test it using [Security’s test support](../test/method.md#test-method-withmockuser) in the following way:

#### Java

```java
@WithMockUser(authorities="USER")
@Test
void endpointWhenUserAuthorityThenAuthorized() {
    this.mvc.perform(get("/endpoint/jon"))
        .andExpect(status().isOk());
}

@WithMockUser
@Test
void endpointWhenNotUserAuthorityThenForbidden() {
    this.mvc.perform(get("/endpoint/jon"))
        .andExpect(status().isForbidden());
}

@Test
void anyWhenUnauthenticatedThenUnauthorized() {
    this.mvc.perform(get("/any"))
        .andExpect(status().isUnauthorized());
}
```

> [!NOTE]
> Spring Security only matches paths.
> If you want to match query parameters, you will need a custom request matcher.

<a id="match-by-regex"></a>

### Matching Using Regular Expressions

Spring Security supports matching requests against a regular expression.
This can come in handy if you want to apply more strict matching criteria than `**` on a subdirectory.

For example, consider a path that contains the username and the rule that all usernames must be alphanumeric.
You can use [`RegexRequestMatcher`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/util/matcher/RegexRequestMatcher.html) to respect this rule, like so:

#### Java

```java
http
    .authorizeHttpRequests((authorize) -> authorize
        .requestMatchers(RegexRequestMatcher.regexMatcher("/resource/[A-Za-z0-9]+")).hasAuthority("USER")
        .anyRequest().denyAll()
    )
```

#### Kotlin

```kotlin
http {
    authorizeHttpRequests {
        authorize(RegexRequestMatcher.regexMatcher("/resource/[A-Za-z0-9]+"), hasAuthority("USER"))
        authorize(anyRequest, denyAll)
    }
}
```

#### Xml

```xml
<http>
    <intercept-url request-matcher="regex" pattern="/resource/[A-Za-z0-9]+" access="hasAuthority('USER')"/>
    <intercept-url pattern="/**" access="denyAll"/>
</http>
```

<a id="match-by-httpmethod"></a>

### Matching By Http Method

You can also match rules by HTTP method.
One place where this is handy is when authorizing by permissions granted, like being granted a `read` or `write` privilege.

To require all `GET`s to have the `read` permission and all `POST`s to have the `write` permission, you can do something like this:

#### Java

```java
http
    .authorizeHttpRequests((authorize) -> authorize
        .requestMatchers(HttpMethod.GET).hasAuthority("read")
        .requestMatchers(HttpMethod.POST).hasAuthority("write")
        .anyRequest().denyAll()
    )
```

#### Kotlin

```kotlin
http {
    authorizeHttpRequests {
        authorize(HttpMethod.GET, hasAuthority("read"))
        authorize(HttpMethod.POST, hasAuthority("write"))
        authorize(anyRequest, denyAll)
    }
}
```

#### Xml

```xml
<http>
    <intercept-url http-method="GET" pattern="/**" access="hasAuthority('read')"/>
    <intercept-url http-method="POST" pattern="/**" access="hasAuthority('write')"/>
    <intercept-url pattern="/**" access="denyAll"/>
</http>
```

These authorization rules should read as: "if the request is a GET, then require `read` permission; else, if the request is a POST, then require `write` permission; else, deny the request"

> [!TIP]
> Denying the request by default is a healthy security practice since it turns the set of rules into an allow list.

Once authorized, you can test it using [Security’s test support](../test/method.md#test-method-withmockuser) in the following way:

#### Java

```java
@WithMockUser(authorities="read")
@Test
void getWhenReadAuthorityThenAuthorized() {
    this.mvc.perform(get("/any"))
        .andExpect(status().isOk());
}

@WithMockUser
@Test
void getWhenNoReadAuthorityThenForbidden() {
    this.mvc.perform(get("/any"))
        .andExpect(status().isForbidden());
}

@WithMockUser(authorities="write")
@Test
void postWhenWriteAuthorityThenAuthorized() {
    this.mvc.perform(post("/any").with(csrf()))
        .andExpect(status().isOk());
}

@WithMockUser(authorities="read")
@Test
void postWhenNoWriteAuthorityThenForbidden() {
    this.mvc.perform(get("/any").with(csrf()))
        .andExpect(status().isForbidden());
}
```

<a id="match-by-dispatcher-type"></a>

### Matching By Dispatcher Type

> [!NOTE]
> This feature is not currently supported in XML

As stated earlier, Spring Security [authorizes all dispatcher types by default](#_all_dispatches_are_authorized).
And even though [the security context](../authentication/architecture.md#servlet-authentication-securitycontext) established on the `REQUEST` dispatch carries over to subsequent dispatches, subtle mismatches can sometimes cause an unexpected `AccessDeniedException`.

To address that, you can configure Spring Security Java configuration to allow dispatcher types like `FORWARD` and `ERROR`, like so:

#### Java

```java
http
    .authorizeHttpRequests((authorize) -> authorize
        .dispatcherTypeMatchers(DispatcherType.FORWARD, DispatcherType.ERROR).permitAll()
        .requestMatchers("/endpoint").permitAll()
        .anyRequest().denyAll()
    )
```

#### Kotlin

```kotlin
http {
    authorizeHttpRequests {
        authorize(DispatcherTypeRequestMatcher(DispatcherType.FORWARD), permitAll)
        authorize(DispatcherTypeRequestMatcher(DispatcherType.ERROR), permitAll)
        authorize("/endpoint", permitAll)
        authorize(anyRequest, denyAll)
    }
}
```

<a id="match-by-mvc"></a>

### Using an MvcRequestMatcher

Generally speaking, you can use `requestMatchers(String)` as demonstrated above.

However, if you map Spring MVC to a different servlet path, then you need to account for that in your security configuration.

For example, if Spring MVC is mapped to `/spring-mvc` instead of `/` (the default), then you may have an endpoint like `/spring-mvc/my/controller` that you want to authorize.

You need to use `MvcRequestMatcher` to split the servlet path and the controller path in your configuration like so:

#### Java

```java
@Bean
MvcRequestMatcher.Builder mvc(HandlerMappingIntrospector introspector) {
	return new MvcRequestMatcher.Builder(introspector).servletPath("/spring-mvc");
}

@Bean
SecurityFilterChain appEndpoints(HttpSecurity http, MvcRequestMatcher.Builder mvc) {
	http
        .authorizeHttpRequests((authorize) -> authorize
            .requestMatchers(mvc.pattern("/my/controller/**")).hasAuthority("controller")
            .anyRequest().authenticated()
        );

	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun mvc(introspector: HandlerMappingIntrospector): MvcRequestMatcher.Builder =
    MvcRequestMatcher.Builder(introspector).servletPath("/spring-mvc");

@Bean
fun appEndpoints(http: HttpSecurity, mvc: MvcRequestMatcher.Builder): SecurityFilterChain =
    http {
        authorizeHttpRequests {
            authorize(mvc.pattern("/my/controller/**"), hasAuthority("controller"))
            authorize(anyRequest, authenticated)
        }
    }
```

#### Xml

```xml
<http>
    <intercept-url servlet-path="/spring-mvc" pattern="/my/controller/**" access="hasAuthority('controller')"/>
    <intercept-url pattern="/**" access="authenticated"/>
</http>
```

This need can arise in at least two different ways:

- If you use the `spring.mvc.servlet.path` Boot property to change the default path (`/`) to something else
- If you register more than one Spring MVC `DispatcherServlet` (thus requiring that one of them not be the default path)

<a id="match-by-custom"></a>

### Using a Custom Matcher

> [!NOTE]
> This feature is not currently supported in XML

In Java configuration, you can create your own [`RequestMatcher`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/util/matcher/RequestMatcher.html) and supply it to the DSL like so:

#### Java

```java
RequestMatcher printview = (request) -> request.getParameter("print") != null;
http
    .authorizeHttpRequests((authorize) -> authorize
        .requestMatchers(printview).hasAuthority("print")
        .anyRequest().authenticated()
    )
```

#### Kotlin

```kotlin
val printview: RequestMatcher = { (request) -> request.getParameter("print") != null }
http {
    authorizeHttpRequests {
        authorize(printview, hasAuthority("print"))
        authorize(anyRequest, authenticated)
    }
}
```

> [!TIP]
> Because [`RequestMatcher`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/util/matcher/RequestMatcher.html) is a functional interface, you can supply it as a lambda in the DSL.
> However, if you want to extract values from the request, you will need to have a concrete class since that requires overriding a `default` method.

Once authorized, you can test it using [Security’s test support](../test/method.md#test-method-withmockuser) in the following way:

#### Java

```java
@WithMockUser(authorities="print")
@Test
void printWhenPrintAuthorityThenAuthorized() {
    this.mvc.perform(get("/any?print"))
        .andExpect(status().isOk());
}

@WithMockUser
@Test
void printWhenNoPrintAuthorityThenForbidden() {
    this.mvc.perform(get("/any?print"))
        .andExpect(status().isForbidden());
}
```

<a id="authorize-requests"></a>

## Authorizing Requests

Once a request is matched, you can authorize it in several ways [already seen](#match-requests) like `permitAll`, `denyAll`, and `hasAuthority`.

As a quick summary, here are the authorization rules built into the DSL:

- `permitAll` - The request requires no authorization and is a public endpoint; note that in this case, [the `Authentication`](../authentication/architecture.md#servlet-authentication-authentication) is never retrieved from the session
- `denyAll` - The request is not allowed under any circumstances; note that in this case, the `Authentication` is never retrieved from the session
- `hasAuthority` - The request requires that the `Authentication` have [a `GrantedAuthority`](architecture.md#authz-authorities) that matches the given value
- `hasRole` - A shortcut for `hasAuthority` that prefixes `ROLE_` or whatever is configured as the default prefix
- `hasAnyAuthority` - The request requires that the `Authentication` have a `GrantedAuthority` that matches any of the given values
- `hasAnyRole` - A shortcut for `hasAnyAuthority` that prefixes `ROLE_` or whatever is configured as the default prefix
- `access` - The request uses this custom `AuthorizationManager` to determine access

Having now learned the patterns, rules, and how they can be paired together, you should be able to understand what is going on in this more complex example:

#### Java

```java
import static jakarta.servlet.DispatcherType.*;

import static org.springframework.security.authorization.AuthorizationManagers.allOf;
import static org.springframework.security.authorization.AuthorityAuthorizationManager.hasAuthority;
import static org.springframework.security.authorization.AuthorityAuthorizationManager.hasRole;

@Bean
SecurityFilterChain web(HttpSecurity http) throws Exception {
	http
		// ...
		.authorizeHttpRequests(authorize -> authorize                                  // <1>
            .dispatcherTypeMatchers(FORWARD, ERROR).permitAll() // <2>
			.requestMatchers("/static/**", "/signup", "/about").permitAll()         // <3>
			.requestMatchers("/admin/**").hasRole("ADMIN")                             // <4>
			.requestMatchers("/db/**").access(allOf(hasAuthority("db"), hasRole("ADMIN")))   // <5>
			.anyRequest().denyAll()                                                // <6>
		);

	return http.build();
}
```

1. There are multiple authorization rules specified.
Each rule is considered in the order they were declared.
1. Dispatches `FORWARD` and `ERROR` are permitted to allow [Spring MVC](https://docs.spring.io/spring-framework/reference/6.2.6/web.html#spring-web) to render views and Spring Boot to render errors
1. We specified multiple URL patterns that any user can access.
Specifically, any user can access a request if the URL starts with "/static/", equals "/signup", or equals "/about".
1. Any URL that starts with "/admin/" will be restricted to users who have the role "ROLE\_ADMIN".
You will notice that since we are invoking the `hasRole` method we do not need to specify the "ROLE\_" prefix.
1. Any URL that starts with "/db/" requires the user to have both been granted the "db" permission as well as be a "ROLE\_ADMIN".
You will notice that since we are using the `hasRole` expression we do not need to specify the "ROLE\_" prefix.
1. Any URL that has not already been matched on is denied access.
This is a good strategy if you do not want to accidentally forget to update your authorization rules.

<a id="authorization-expressions"></a>

## Expressing Authorization with SpEL

While using a concrete `AuthorizationManager` is recommended, there are some cases where an expression is necessary, like with `<intercept-url>` or with JSP Taglibs.
For that reason, this section will focus on examples from those domains.

Given that, let’s cover Spring Security’s Web Security Authorization SpEL API a bit more in depth.

Spring Security encapsulates all of its authorization fields and methods in a set of root objects.
The most generic root object is called `SecurityExpressionRoot` and it forms the basis for `WebSecurityExpressionRoot`.
Spring Security supplies this root object to `StandardEvaluationContext` when preparing to evaluate an authorization expression.

<a id="using-authorization-expression-fields-and-methods"></a>

### Using Authorization Expression Fields and Methods

The first thing this provides is an enhanced set of authorization fields and methods to your SpEL expressions.
What follows is a quick overview of the most common methods:

- `permitAll` - The request requires no authorization to be invoked; note that in this case, [the `Authentication`](../authentication/architecture.md#servlet-authentication-authentication) is never retrieved from the session
- `denyAll` - The request is not allowed under any circumstances; note that in this case, the `Authentication` is never retrieved from the session
- `hasAuthority` - The request requires that the `Authentication` have [a `GrantedAuthority`](architecture.md#authz-authorities) that matches the given value
- `hasRole` - A shortcut for `hasAuthority` that prefixes `ROLE_` or whatever is configured as the default prefix
- `hasAnyAuthority` - The request requires that the `Authentication` have a `GrantedAuthority` that matches any of the given values
- `hasAnyRole` - A shortcut for `hasAnyAuthority` that prefixes `ROLE_` or whatever is configured as the default prefix
- `hasPermission` - A hook into your `PermissionEvaluator` instance for doing object-level authorization

And here is a brief look at the most common fields:

- `authentication` - The `Authentication` instance associated with this method invocation
- `principal` - The `Authentication#getPrincipal` associated with this method invocation

Having now learned the patterns, rules, and how they can be paired together, you should be able to understand what is going on in this more complex example:

#### Xml

```java
<http>
    <intercept-url pattern="/static/**" access="permitAll"/> <1>
    <intercept-url pattern="/admin/**" access="hasRole('ADMIN')"/> <2>
    <intercept-url pattern="/db/**" access="hasAuthority('db') and hasRole('ADMIN')"/> <3>
    <intercept-url pattern="/**" access="denyAll"/> <4>
</http>
```

1. We specified a URL pattern that any user can access.
Specifically, any user can access a request if the URL starts with "/static/".
1. Any URL that starts with "/admin/" will be restricted to users who have the role "ROLE\_ADMIN".
You will notice that since we are invoking the `hasRole` method we do not need to specify the "ROLE\_" prefix.
1. Any URL that starts with "/db/" requires the user to have both been granted the "db" permission as well as be a "ROLE\_ADMIN".
You will notice that since we are using the `hasRole` expression we do not need to specify the "ROLE\_" prefix.
1. Any URL that has not already been matched on is denied access.
This is a good strategy if you do not want to accidentally forget to update your authorization rules.

<a id="using_path_parameters"></a>

### Using Path Parameters

Additionally, Spring Security provides a mechanism for discovering path parameters so they can also be accessed in the SpEL expression as well.

For example, you can access a path parameter in your SpEL expression in the following way:

#### Xml

```xml
<http>
    <intercept-url pattern="/resource/{name}" access="#name == authentication.name"/>
    <intercept-url pattern="/**" access="authenticated"/>
</http>
```

This expression refers to the path variable after `/resource/` and requires that it is equal to `Authentication#getName`.

<a id="remote-authorization-manager"></a>

### Use an Authorization Database, Policy Agent, or Other Service

If you want to configure Spring Security to use a separate service for authorization, you can create your own `AuthorizationManager` and match it to `anyRequest`.

First, your `AuthorizationManager` may look something like this:

#### Java

```java
@Component
public final class OpenPolicyAgentAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {
    @Override
    public AuthorizationDecision check(Supplier<Authentication> authentication, RequestAuthorizationContext context) {
        // make request to Open Policy Agent
    }
}
```

Then, you can wire it into Spring Security in the following way:

#### Java

```java
@Bean
SecurityFilterChain web(HttpSecurity http, AuthorizationManager<RequestAuthorizationContext> authz) throws Exception {
	http
		// ...
		.authorizeHttpRequests((authorize) -> authorize
            .anyRequest().access(authz)
		);

	return http.build();
}
```

<a id="favor-permitall"></a>

### Favor `permitAll` over `ignoring`

When you have static resources it can be tempting to configure the filter chain to ignore these values.
A more secure approach is to permit them using `permitAll` like so:

#### Java

```java
http
    .authorizeHttpRequests((authorize) -> authorize
        .requestMatchers("/css/**").permitAll()
        .anyRequest().authenticated()
    )
```

#### Kotlin

```kotlin
http {
    authorizeHttpRequests {
        authorize("/css/**", permitAll)
        authorize(anyRequest, authenticated)
    }
}
```

It’s more secure because even with static resources it’s important to write secure headers, which Spring Security cannot do if the request is ignored.

In this past, this came with a performance tradeoff since the session was consulted by Spring Security on every request.
As of Spring Security 6, however, the session is no longer pinged unless required by the authorization rule.
Because the performance impact is now addressed, Spring Security recommends using at least `permitAll` for all requests.

<a id="migrate-authorize-requests"></a>

## Migrating from `authorizeRequests`

> [!NOTE]
> `AuthorizationFilter` supersedes [`FilterSecurityInterceptor`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/access/intercept/FilterSecurityInterceptor.html).
> To remain backward compatible, `FilterSecurityInterceptor` remains the default.
> This section discusses how `AuthorizationFilter` works and how to override the default configuration.

The [`AuthorizationFilter`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/access/intercept/AuthorizationFilter.html) provides [authorization](index.md#servlet-authorization) for `HttpServletRequest`s.
It is inserted into the [FilterChainProxy](../architecture.md#servlet-filterchainproxy) as one of the [Security Filters](../architecture.md#servlet-security-filters).

You can override the default when you declare a `SecurityFilterChain`.
Instead of using [authorizeRequests](<https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/config/annotation/web/builders/HttpSecurity.html#authorizeRequests()>), use `authorizeHttpRequests`, like so:

#### Java

```java
@Bean
SecurityFilterChain web(HttpSecurity http) throws AuthenticationException {
    http
        .authorizeHttpRequests((authorize) -> authorize
            .anyRequest().authenticated();
        )
        // ...

    return http.build();
}
```

This improves on `authorizeRequests` in a number of ways:

1. Uses the simplified `AuthorizationManager` API instead of metadata sources, config attributes, decision managers, and voters.
This simplifies reuse and customization.
1. Delays `Authentication` lookup.
Instead of the authentication needing to be looked up for every request, it will only look it up in requests where an authorization decision requires authentication.
1. Bean-based configuration support.

When `authorizeHttpRequests` is used instead of `authorizeRequests`, then [`AuthorizationFilter`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/access/intercept/AuthorizationFilter.html) is used instead of [`FilterSecurityInterceptor`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/access/intercept/FilterSecurityInterceptor.html).

<a id="_migrating_expressions"></a>

### Migrating Expressions

Where possible, it is recommended that you use type-safe authorization managers instead of SpEL.
For Java configuration, [`WebExpressionAuthorizationManager`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/access/expression/WebExpressionAuthorizationManager.html) is available to help migrate legacy SpEL.

To use `WebExpressionAuthorizationManager`, you can construct one with the expression you are trying to migrate, like so:

#### Java

```java
.requestMatchers("/test/**").access(new WebExpressionAuthorizationManager("hasRole('ADMIN') && hasRole('USER')"))
```

#### Kotlin

```kotlin
.requestMatchers("/test/**").access(WebExpressionAuthorizationManager("hasRole('ADMIN') && hasRole('USER')"))
```

If you are referring to a bean in your expression like so: `@webSecurity.check(authentication, request)`, it’s recommended that you instead call the bean directly, which will look something like the following:

#### Java

```java
.requestMatchers("/test/**").access((authentication, context) ->
    new AuthorizationDecision(webSecurity.check(authentication.get(), context.getRequest())))
```

#### Kotlin

```kotlin
.requestMatchers("/test/**").access((authentication, context): AuthorizationManager<RequestAuthorizationContext> ->
    AuthorizationDecision(webSecurity.check(authentication.get(), context.getRequest())))
```

For complex instructions that include bean references as well as other expressions, it is recommended that you change those to implement `AuthorizationManager` and refer to them by calling `.access(AuthorizationManager)`.

If you are not able to do that, you can configure a [`DefaultHttpSecurityExpressionHandler`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/access/expression/DefaultHttpSecurityExpressionHandler.html) with a bean resolver and supply that to `WebExpressionAuthorizationManager#setExpressionhandler`.

<a id="security-matchers"></a>

## Security Matchers

The [`RequestMatcher`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/util/matcher/RequestMatcher.html) interface is used to determine if a request matches a given rule.
We use `securityMatchers` to determine if [a given `HttpSecurity`](../configuration/java.md#jc-httpsecurity) should be applied to a given request.
The same way, we can use `requestMatchers` to determine the authorization rules that we should apply to a given request.
Look at the following example:

#### Java

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.securityMatcher("/api/**")                            <1>
			.authorizeHttpRequests(authorize -> authorize
				.requestMatchers("/api/user/**").hasRole("USER")   <2>
				.requestMatchers("/api/admin/**").hasRole("ADMIN") <3>
				.anyRequest().authenticated()                      <4>
			)
			.formLogin(withDefaults());
		return http.build();
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSecurity
open class SecurityConfig {

    @Bean
    open fun web(http: HttpSecurity): SecurityFilterChain {
        http {
            securityMatcher("/api/**")                                           <1>
            authorizeHttpRequests {
                authorize("/api/user/**", hasRole("USER"))                       <2>
                authorize("/api/admin/**", hasRole("ADMIN"))                     <3>
                authorize(anyRequest, authenticated)                             <4>
            }
        }
        return http.build()
    }

}
```

1. Configure `HttpSecurity` to only be applied to URLs that start with `/api/`
1. Allow access to URLs that start with `/api/user/` to users with the `USER` role
1. Allow access to URLs that start with `/api/admin/` to users with the `ADMIN` role
1. Any other request that doesn’t match the rules above, will require authentication

The `securityMatcher(s)` and `requestMatcher(s)` methods will decide which `RequestMatcher` implementation fits best for your application: If [Spring MVC](https://docs.spring.io/spring-framework/reference/6.2.6/web.html#spring-web) is in the classpath, then [`MvcRequestMatcher`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/servlet/util/matcher/MvcRequestMatcher.html) will be used, otherwise, [`AntPathRequestMatcher`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/util/matcher/AntPathRequestMatcher.html) will be used.
You can read more about the Spring MVC integration [here](../integrations/mvc.md).

If you want to use a specific `RequestMatcher`, just pass an implementation to the `securityMatcher` and/or `requestMatcher` methods:

#### Java

```java
import static org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher; <1>
import static org.springframework.security.web.util.matcher.RegexRequestMatcher.regexMatcher;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.securityMatcher(antMatcher("/api/**"))                              <2>
			.authorizeHttpRequests(authorize -> authorize
				.requestMatchers(antMatcher("/api/user/**")).hasRole("USER")     <3>
				.requestMatchers(regexMatcher("/api/admin/.*")).hasRole("ADMIN") <4>
				.requestMatchers(new MyCustomRequestMatcher()).hasRole("SUPERVISOR")     <5>
				.anyRequest().authenticated()
			)
			.formLogin(withDefaults());
		return http.build();
	}
}

public class MyCustomRequestMatcher implements RequestMatcher {

    @Override
    public boolean matches(HttpServletRequest request) {
        // ...
    }
}
```

#### Kotlin

```kotlin
import org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher <1>
import org.springframework.security.web.util.matcher.RegexRequestMatcher.regexMatcher

@Configuration
@EnableWebSecurity
open class SecurityConfig {

    @Bean
    open fun web(http: HttpSecurity): SecurityFilterChain {
        http {
            securityMatcher(antMatcher("/api/**"))                               <2>
            authorizeHttpRequests {
                authorize(antMatcher("/api/user/**"), hasRole("USER"))           <3>
                authorize(regexMatcher("/api/admin/**"), hasRole("ADMIN"))       <4>
                authorize(MyCustomRequestMatcher(), hasRole("SUPERVISOR"))       <5>
                authorize(anyRequest, authenticated)
            }
        }
        return http.build()
    }

}
```

1. Import the static factory methods from `AntPathRequestMatcher` and `RegexRequestMatcher` to create `RequestMatcher` instances.
1. Configure `HttpSecurity` to only be applied to URLs that start with `/api/`, using `AntPathRequestMatcher`
1. Allow access to URLs that start with `/api/user/` to users with the `USER` role, using `AntPathRequestMatcher`
1. Allow access to URLs that start with `/api/admin/` to users with the `ADMIN` role, using `RegexRequestMatcher`
1. Allow access to URLs that match the `MyCustomRequestMatcher` to users with the `SUPERVISOR` role, using a custom `RequestMatcher`

<a id="_further_reading"></a>

## Further Reading

Now that you have secured your application’s requests, consider [securing its methods](method-security.md).
You can also read further on [testing your application](../test/index.md) or on integrating Spring Security with other aspects of you application like [the data layer](../integrations/data.md) or [tracing and metrics](../integrations/observability.md).
