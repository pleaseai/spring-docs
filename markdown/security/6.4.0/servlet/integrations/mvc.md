---
title: "Spring MVC Integration"
source: "ROOT:servlet/integrations/mvc.adoc"
---

<a id="mvc"></a>

# Spring MVC Integration

Spring Security provides a number of optional integrations with Spring MVC.
This section covers the integration in further detail.

<a id="mvc-enablewebmvcsecurity"></a>

## @EnableWebMvcSecurity

> [!NOTE]
> As of Spring Security 4.0, `@EnableWebMvcSecurity` is deprecated.
> The replacement is `@EnableWebSecurity`, which adds the Spring MVC features, based upon the classpath.

To enable Spring Security integration with Spring MVC, add the `@EnableWebSecurity` annotation to your configuration.

> [!NOTE]
> Spring Security provides the configuration by using Spring MVC’s [`WebMvcConfigurer`](https://docs.spring.io/spring/docs/5.0.0.RELEASE/spring-framework-reference/web.html#mvc-config-customize).
> This means that, if you use more advanced options, such as integrating with `WebMvcConfigurationSupport` directly, you need to manually provide the Spring Security configuration.

<a id="mvc-requestmatcher"></a>

## MvcRequestMatcher

Spring Security provides deep integration with how Spring MVC matches on URLs with `MvcRequestMatcher`.
This is helpful to ensure that your Security rules match the logic used to handle your requests.

To use `MvcRequestMatcher`, you must place the Spring Security Configuration in the same `ApplicationContext` as your `DispatcherServlet`.
This is necessary because Spring Security’s `MvcRequestMatcher` expects a `HandlerMappingIntrospector` bean with the name of `mvcHandlerMappingIntrospector` to be registered by your Spring MVC configuration that is used to perform the matching.

For a `web.xml` file, this means that you should place your configuration in the `DispatcherServlet.xml`:

```xml
<listener>
  <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
</listener>

<!-- All Spring Configuration (both MVC and Security) are in /WEB-INF/spring/ -->
<context-param>
  <param-name>contextConfigLocation</param-name>
  <param-value>/WEB-INF/spring/*.xml</param-value>
</context-param>

<servlet>
  <servlet-name>spring</servlet-name>
  <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
  <!-- Load from the ContextLoaderListener -->
  <init-param>
    <param-name>contextConfigLocation</param-name>
    <param-value></param-value>
  </init-param>
</servlet>

<servlet-mapping>
  <servlet-name>spring</servlet-name>
  <url-pattern>/</url-pattern>
</servlet-mapping>
```

The following `WebSecurityConfiguration` in placed in the  `ApplicationContext` of the `DispatcherServlet`.

#### Java

```java
public class SecurityInitializer extends
    AbstractAnnotationConfigDispatcherServletInitializer {

  @Override
  protected Class<?>[] getRootConfigClasses() {
    return null;
  }

  @Override
  protected Class<?>[] getServletConfigClasses() {
    return new Class[] { RootConfiguration.class,
        WebMvcConfiguration.class };
  }

  @Override
  protected String[] getServletMappings() {
    return new String[] { "/" };
  }
}
```

#### Kotlin

```kotlin
class SecurityInitializer : AbstractAnnotationConfigDispatcherServletInitializer() {
    override fun getRootConfigClasses(): Array<Class<*>>? {
        return null
    }

    override fun getServletConfigClasses(): Array<Class<*>> {
        return arrayOf(
            RootConfiguration::class.java,
            WebMvcConfiguration::class.java
        )
    }

    override fun getServletMappings(): Array<String> {
        return arrayOf("/")
    }
}
```

> [!NOTE]
> We always recommend that you provide authorization rules by matching on the `HttpServletRequest` and method security.
>
> Providing authorization rules by matching on `HttpServletRequest` is good, because it happens very early in the code path and helps reduce the [attack surface](https://en.wikipedia.org/wiki/Attack_surface).
> Method security ensures that, if someone has bypassed the web authorization rules, your application is still secured.
> This is known as [Defense in Depth](<https://en.wikipedia.org/wiki/Defense_in_depth_(computing)>)

Consider a controller that is mapped as follows:

#### Java

```java
@RequestMapping("/admin")
public String admin() {
	// ...
}
```

#### Kotlin

```kotlin
@RequestMapping("/admin")
fun admin(): String {
    // ...
}
```

To restrict access to this controller method to admin users, you can provide authorization rules by matching on the `HttpServletRequest` with the following:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	http
		.authorizeHttpRequests((authorize) -> authorize
			.requestMatchers("/admin").hasRole("ADMIN")
		);
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        authorizeHttpRequests {
            authorize("/admin", hasRole("ADMIN"))
        }
    }
    return http.build()
}
```

The following listing does the same thing in XML:

```xml
<http>
	<intercept-url pattern="/admin" access="hasRole('ADMIN')"/>
</http>
```

With either configuration, the `/admin` URL requires the authenticated user to be an admin user.
However, depending on our Spring MVC configuration, the `/admin.html` URL also maps to our `admin()` method.
Additionally, depending on our Spring MVC configuration, the `/admin` URL also maps to our `admin()` method.

The problem is that our security rule protects only  `/admin`.
We could add additional rules for all the permutations of Spring MVC, but this would be quite verbose and tedious.

Fortunately, when using the `requestMatchers` DSL method, Spring Security automatically creates a `MvcRequestMatcher` if it detects that Spring MVC is available in the classpath.
Therefore, it will protect the same URLs that Spring MVC will match on by using Spring MVC to match on the URL.

One common requirement when using Spring MVC is to specify the servlet path property, for that you can use the `MvcRequestMatcher.Builder` to create multiple `MvcRequestMatcher` instances that share the same servlet path:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http, HandlerMappingIntrospector introspector) throws Exception {
	MvcRequestMatcher.Builder mvcMatcherBuilder = new MvcRequestMatcher.Builder(introspector).servletPath("/path");
	http
		.authorizeHttpRequests((authorize) -> authorize
			.requestMatchers(mvcMatcherBuilder.pattern("/admin")).hasRole("ADMIN")
			.requestMatchers(mvcMatcherBuilder.pattern("/user")).hasRole("USER")
		);
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity, introspector: HandlerMappingIntrospector): SecurityFilterChain {
    val mvcMatcherBuilder = MvcRequestMatcher.Builder(introspector)
    http {
        authorizeHttpRequests {
            authorize(mvcMatcherBuilder.pattern("/admin"), hasRole("ADMIN"))
            authorize(mvcMatcherBuilder.pattern("/user"), hasRole("USER"))
        }
    }
    return http.build()
}
```

The following XML has the same effect:

```xml
<http request-matcher="mvc">
	<intercept-url pattern="/admin" access="hasRole('ADMIN')"/>
</http>
```

<a id="mvc-authentication-principal"></a>

## @AuthenticationPrincipal

Spring Security provides `AuthenticationPrincipalArgumentResolver`, which can automatically resolve the current `Authentication.getPrincipal()` for Spring MVC arguments.
By using `@EnableWebSecurity`, you automatically have this added to your Spring MVC configuration.
If you use XML-based configuration, you must add this yourself:

```xml
<mvc:annotation-driven>
		<mvc:argument-resolvers>
				<bean class="org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver" />
		</mvc:argument-resolvers>
</mvc:annotation-driven>
```

Once you have properly configured `AuthenticationPrincipalArgumentResolver`, you can entirely decouple from Spring Security in your Spring MVC layer.

Consider a situation where a custom `UserDetailsService` returns an `Object` that implements `UserDetails` and your own `CustomUser` `Object`. The `CustomUser` of the currently authenticated user could be accessed by using the following code:

#### Java

```java
@RequestMapping("/messages/inbox")
public ModelAndView findMessagesForUser() {
	Authentication authentication =
	SecurityContextHolder.getContext().getAuthentication();
	CustomUser custom = (CustomUser) authentication == null ? null : authentication.getPrincipal();

	// .. find messages for this user and return them ...
}
```

#### Kotlin

```kotlin
@RequestMapping("/messages/inbox")
open fun findMessagesForUser(): ModelAndView {
    val authentication: Authentication = SecurityContextHolder.getContext().authentication
    val custom: CustomUser? = if (authentication as CustomUser == null) null else authentication.principal

    // .. find messages for this user and return them ...
}
```

As of Spring Security 3.2, we can resolve the argument more directly by adding an annotation:

#### Java

```java
import org.springframework.security.core.annotation.AuthenticationPrincipal;

// ...

@RequestMapping("/messages/inbox")
public ModelAndView findMessagesForUser(@AuthenticationPrincipal CustomUser customUser) {

	// .. find messages for this user and return them ...
}
```

#### Kotlin

```kotlin
@RequestMapping("/messages/inbox")
open fun findMessagesForUser(@AuthenticationPrincipal customUser: CustomUser?): ModelAndView {

    // .. find messages for this user and return them ...
}
```

Sometimes, you may need to transform the principal in some way.
For example, if `CustomUser` needed to be final, it could not be extended.
In this situation, the `UserDetailsService` might return an `Object` that implements `UserDetails` and provides a method named `getCustomUser` to access `CustomUser`:

#### Java

```java
public class CustomUserUserDetails extends User {
		// ...
		public CustomUser getCustomUser() {
				return customUser;
		}
}
```

#### Kotlin

```kotlin
class CustomUserUserDetails(
    username: String?,
    password: String?,
    authorities: MutableCollection<out GrantedAuthority>?
) : User(username, password, authorities) {
    // ...
    val customUser: CustomUser? = null
}
```

We could then access the `CustomUser` by using a [SpEL expression](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/expressions.html) that uses `Authentication.getPrincipal()` as the root object:

#### Java

```java
import org.springframework.security.core.annotation.AuthenticationPrincipal;

// ...

@RequestMapping("/messages/inbox")
public ModelAndView findMessagesForUser(@AuthenticationPrincipal(expression = "customUser") CustomUser customUser) {

	// .. find messages for this user and return them ...
}
```

#### Kotlin

```kotlin
import org.springframework.security.core.annotation.AuthenticationPrincipal

// ...

@RequestMapping("/messages/inbox")
open fun findMessagesForUser(@AuthenticationPrincipal(expression = "customUser") customUser: CustomUser?): ModelAndView {

    // .. find messages for this user and return them ...
}
```

We can also refer to beans in our SpEL expressions.
For example, we could use the following if we were using JPA to manage our users and if we wanted to modify and save a property on the current user:

#### Java

```java
import org.springframework.security.core.annotation.AuthenticationPrincipal;

// ...

@PutMapping("/users/self")
public ModelAndView updateName(@AuthenticationPrincipal(expression = "@jpaEntityManager.merge(#this)") CustomUser attachedCustomUser,
		@RequestParam String firstName) {

	// change the firstName on an attached instance which will be persisted to the database
	attachedCustomUser.setFirstName(firstName);

	// ...
}
```

#### Kotlin

```kotlin
import org.springframework.security.core.annotation.AuthenticationPrincipal

// ...

@PutMapping("/users/self")
open fun updateName(
    @AuthenticationPrincipal(expression = "@jpaEntityManager.merge(#this)") attachedCustomUser: CustomUser,
    @RequestParam firstName: String?
): ModelAndView {

    // change the firstName on an attached instance which will be persisted to the database
    attachedCustomUser.setFirstName(firstName)

    // ...
}
```

We can further remove our dependency on Spring Security by making `@AuthenticationPrincipal` a meta-annotation on our own annotation.
The next example demonstrates how we could do so on an annotation named `@CurrentUser`.

> [!NOTE]
> To remove the dependency on Spring Security, it is the consuming application that would create `@CurrentUser`.
> This step is not strictly required but assists in isolating your dependency to Spring Security to a more central location.

#### Java

```java
@Target({ElementType.PARAMETER, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@AuthenticationPrincipal
public @interface CurrentUser {}
```

#### Kotlin

```kotlin
@Target(AnnotationTarget.VALUE_PARAMETER, AnnotationTarget.TYPE)
@Retention(AnnotationRetention.RUNTIME)
@MustBeDocumented
@AuthenticationPrincipal
annotation class CurrentUser
```

We have isolated our dependency on Spring Security to a single file.
Now that `@CurrentUser` has been specified, we can use it to signal to resolve our `CustomUser` of the currently authenticated user:

#### Java

```java
@RequestMapping("/messages/inbox")
public ModelAndView findMessagesForUser(@CurrentUser CustomUser customUser) {

	// .. find messages for this user and return them ...
}
```

#### Kotlin

```kotlin
@RequestMapping("/messages/inbox")
open fun findMessagesForUser(@CurrentUser customUser: CustomUser?): ModelAndView {

    // .. find messages for this user and return them ...
}
```

Once it is a meta-annotation, parameterization is also available to you.

For example, consider when you have a JWT as your principal and you want to say which claim to retrieve.
As a meta-annotation, you might do:

#### Java

```java
@Target({ElementType.PARAMETER, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@AuthenticationPrincipal(expression = "claims['sub']")
public @interface CurrentUser {}
```

#### Kotlin

```kotlin
@Target(AnnotationTarget.VALUE_PARAMETER, AnnotationTarget.TYPE)
@Retention(AnnotationRetention.RUNTIME)
@MustBeDocumented
@AuthenticationPrincipal(expression = "claims['sub']")
annotation class CurrentUser
```

which is already quite powerful.
But, it is also limited to retrieving the `sub` claim.

To make this more flexible, first publish the `AnnotationTemplateExpressionDefaults` bean like so:

#### Java

```java
@Bean
public AnnotationTemplateExpressionDefaults templateDefaults() {
	return new AnnotationTemplateExpressionDeafults();
}
```

#### Kotlin

```kotlin
@Bean
fun templateDefaults(): AnnotationTemplateExpressionDefaults {
	return AnnotationTemplateExpressionDeafults()
}
```

#### Xml

```xml
<b:bean name="annotationExpressionTemplateDefaults" class="org.springframework.security.core.annotation.AnnotationTemplateExpressionDefaults"/>
```

and then you can supply a parameter to `@CurrentUser` like so:

#### Java

```java
@Target({ElementType.PARAMETER, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@AuthenticationPrincipal(expression = "claims['{claim}']")
public @interface CurrentUser {
	String claim() default 'sub';
}
```

#### Kotlin

```kotlin
@Target(AnnotationTarget.VALUE_PARAMETER, AnnotationTarget.TYPE)
@Retention(AnnotationRetention.RUNTIME)
@MustBeDocumented
@AuthenticationPrincipal(expression = "claims['{claim}']")
annotation class CurrentUser(val claim: String = "sub")
```

This will allow you more flexibility across your set of applications in the following way:

#### Java

```java
@RequestMapping("/messages/inbox")
public ModelAndView findMessagesForUser(@CurrentUser("user_id") String userId) {

	// .. find messages for this user and return them ...
}
```

#### Kotlin

```kotlin
@RequestMapping("/messages/inbox")
open fun findMessagesForUser(@CurrentUser("user_id") userId: String?): ModelAndView {

    // .. find messages for this user and return them ...
}
```

<a id="mvc-async"></a>

## Spring MVC Async Integration

Spring Web MVC 3.2+ has excellent support for [Asynchronous Request Processing](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/mvc.html#mvc-ann-async).
With no additional configuration, Spring Security automatically sets up the `SecurityContext` to the `Thread` that invokes a `Callable` returned by your controllers.
For example, the following method automatically has its `Callable` invoked with the `SecurityContext` that was available when the `Callable` was created:

#### Java

```java
@RequestMapping(method=RequestMethod.POST)
public Callable<String> processUpload(final MultipartFile file) {

return new Callable<String>() {
	public Object call() throws Exception {
	// ...
	return "someView";
	}
};
}
```

#### Kotlin

```kotlin
@RequestMapping(method = [RequestMethod.POST])
open fun processUpload(file: MultipartFile?): Callable<String> {
    return Callable {
        // ...
        "someView"
    }
}
```

> [!NOTE]
> More technically speaking, Spring Security integrates with `WebAsyncManager`.
> The `SecurityContext` that is used to process the `Callable` is the `SecurityContext` that exists on the `SecurityContextHolder` when `startCallableProcessing` is invoked.

There is no automatic integration with a `DeferredResult` that is returned by controllers.
This is because `DeferredResult` is processed by the users and, thus, there is no way of automatically integrating with it.
However, you can still use [Concurrency Support](../../features/integrations/concurrency.md#concurrency) to provide transparent integration with Spring Security.

<a id="mvc-csrf"></a>

## Spring MVC and CSRF Integration

Spring Security integrates with Spring MVC to add CSRF protection.

<a id="_automatic_token_inclusion"></a>

### Automatic Token Inclusion

Spring Security automatically [include the CSRF Token](../exploits/csrf.md#csrf-integration-form) within forms that use the [Spring MVC form tag](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/view.html#view-jsp-formtaglib-formtag).
Consider the following JSP:

```xml
<jsp:root xmlns:jsp="http://java.sun.com/JSP/Page"
	xmlns:c="http://java.sun.com/jsp/jstl/core"
	xmlns:form="http://www.springframework.org/tags/form" version="2.0">
	<jsp:directive.page language="java" contentType="text/html" />
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
	<!-- ... -->

	<c:url var="logoutUrl" value="/logout"/>
	<form:form action="${logoutUrl}"
		method="post">
	<input type="submit"
		value="Log out" />
	<input type="hidden"
		name="${_csrf.parameterName}"
		value="${_csrf.token}"/>
	</form:form>

	<!-- ... -->
</html>
</jsp:root>
```

The preceding example output HTMLs that is similar to the following:

```xml
<!-- ... -->

<form action="/context/logout" method="post">
<input type="submit" value="Log out"/>
<input type="hidden" name="_csrf" value="f81d4fae-7dec-11d0-a765-00a0c91e6bf6"/>
</form>

<!-- ... -->
```

<a id="mvc-csrf-resolver"></a>

### Resolving the CsrfToken

Spring Security provides `CsrfTokenArgumentResolver`, which can automatically resolve the current `CsrfToken` for Spring MVC arguments.
By using [@EnableWebSecurity](../configuration/java.md#jc-hello-wsca), you automatically have this added to your Spring MVC configuration.
If you use XML-based configuration, you must add this yourself.

Once `CsrfTokenArgumentResolver` is properly configured, you can expose the `CsrfToken` to your static HTML based application:

#### Java

```java
@RestController
public class CsrfController {

	@RequestMapping("/csrf")
	public CsrfToken csrf(CsrfToken token) {
		return token;
	}
}
```

#### Kotlin

```kotlin
@RestController
class CsrfController {
    @RequestMapping("/csrf")
    fun csrf(token: CsrfToken): CsrfToken {
        return token
    }
}
```

It is important to keep the `CsrfToken` a secret from other domains.
This means that, if you use [Cross Origin Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS), you should **NOT** expose the `CsrfToken` to any external domains.
