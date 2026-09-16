---
title: "Persisting Authentication"
source: "ROOT:servlet/authentication/persistence.adoc"
---

<a id="persistant"></a>

# Persisting Authentication

The first time a user requests a protected resource, they are [prompted for credentials](architecture.md#servlet-authentication-authenticationentrypoint).
One of the most common ways to prompt for credentials is to redirect the user to a [log in page](passwords/form.md).
A summarized HTTP exchange for an unauthenticated user requesting a protected resource might look like this:

```http
GET / HTTP/1.1
Host: example.com
Cookie: SESSION=91470ce0-3f3c-455b-b7ad-079b02290f7b
```

```http
HTTP/1.1 302 Found
Location: /login
```

The user submits their username and password.

#### Username and Password Submitted

```http
POST /login HTTP/1.1
Host: example.com
Cookie: SESSION=91470ce0-3f3c-455b-b7ad-079b02290f7b

username=user&password=password&_csrf=35942e65-a172-4cd4-a1d4-d16a51147b3e
```

Upon authenticating the user, the user is associated to a new session id to prevent [session fixation attacks](session-management.md#ns-session-fixation).

#### Authenticated User is Associated to New Session

```http
HTTP/1.1 302 Found
Location: /
Set-Cookie: SESSION=4c66e474-3f5a-43ed-8e48-cc1d8cb1d1c8; Path=/; HttpOnly; SameSite=Lax
```

Subsequent requests include the session cookie which is used to authenticate the user for the remainder of the session.

#### Authenticated Session Provided as Credentials

```http
GET / HTTP/1.1
Host: example.com
Cookie: SESSION=4c66e474-3f5a-43ed-8e48-cc1d8cb1d1c8
```

<a id="securitycontextrepository"></a>

## SecurityContextRepository

In Spring Security the association of the user to future requests is made using  [`SecurityContextRepository`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/context/SecurityContextRepository.html).
The default implementation of `SecurityContextRepository` is [`DelegatingSecurityContextRepository`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/context/DelegatingSecurityContextRepository.html) which delegates to the following:

- [`HttpSessionSecurityContextRepository`](#httpsecuritycontextrepository)
- [`RequestAttributeSecurityContextRepository`](#requestattributesecuritycontextrepository)

<a id="httpsecuritycontextrepository"></a>

### HttpSessionSecurityContextRepository

The [`HttpSessionSecurityContextRepository`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/context/HttpSessionSecurityContextRepository.html) associates the [`SecurityContext`](architecture.md#servlet-authentication-securitycontext) to the `HttpSession`.
Users can replace `HttpSessionSecurityContextRepository` with another implementation of `SecurityContextRepository` if they wish to associate the user with subsequent requests in another way or not at all.

<a id="nullsecuritycontextrepository"></a>

### NullSecurityContextRepository

If it is not desirable to associate the `SecurityContext` to an `HttpSession` (i.e. when authenticating with OAuth) the [`NullSecurityContextRepository`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/context/NullSecurityContextRepository.html) is an implementation of `SecurityContextRepository` that does nothing.

<a id="requestattributesecuritycontextrepository"></a>

### RequestAttributeSecurityContextRepository

The [`RequestAttributeSecurityContextRepository`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/context/RequestAttributeSecurityContextRepository.html) saves the `SecurityContext` as a request attribute to make sure the `SecurityContext` is available for a single request that occurs across dispatch types that may clear out the `SecurityContext`.

For example, assume that a client makes a request, is authenticated, and then an error occurs.
Depending on the servlet container implementation, the error means that any `SecurityContext` that was established is cleared out and then the error dispatch is made.
When the error dispatch is made, there is no `SecurityContext` established.
This means that the error page cannot use the `SecurityContext` for authorization or displaying the current user unless the `SecurityContext` is persisted somehow.

#### Java

```java
public SecurityFilterChain filterChain(HttpSecurity http) {
	http
		// ...
		.securityContext((securityContext) -> securityContext
			.securityContextRepository(new RequestAttributeSecurityContextRepository())
		);
	return http.build();
}
```

#### XML

```xml
<http security-context-repository-ref="contextRepository">
	<!-- ... -->
</http>
<b:bean name="contextRepository"
	class="org.springframework.security.web.context.RequestAttributeSecurityContextRepository" />
```

<a id="delegatingsecuritycontextrepository"></a>

### DelegatingSecurityContextRepository

The [`DelegatingSecurityContextRepository`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/context/DelegatingSecurityContextRepository.html) saves the `SecurityContext` to multiple `SecurityContextRepository` delegates and allows retrieval from any of the delegates in a specified order.

The most useful arrangement for this is configured with the following example, which allows the use of both [`RequestAttributeSecurityContextRepository`](#requestattributesecuritycontextrepository) and [`HttpSessionSecurityContextRepository`](#httpsecuritycontextrepository) simultaneously.

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	http
		// ...
		.securityContext((securityContext) -> securityContext
			.securityContextRepository(new DelegatingSecurityContextRepository(
				new RequestAttributeSecurityContextRepository(),
				new HttpSessionSecurityContextRepository()
			))
		);
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
	http {
		// ...
		securityContext {
			securityContextRepository = DelegatingSecurityContextRepository(
				RequestAttributeSecurityContextRepository(),
				HttpSessionSecurityContextRepository()
			)
		}
	}
	return http.build()
}
```

#### XML

```xml
<http security-context-repository-ref="contextRepository">
	<!-- ... -->
</http>
<bean name="contextRepository"
	class="org.springframework.security.web.context.DelegatingSecurityContextRepository">
		<constructor-arg>
			<bean class="org.springframework.security.web.context.RequestAttributeSecurityContextRepository" />
		</constructor-arg>
		<constructor-arg>
			<bean class="org.springframework.security.web.context.HttpSessionSecurityContextRepository" />
		</constructor-arg>
</bean>
```

> [!NOTE]
> In Spring Security 6, the example shown above is the default configuration.

<a id="securitycontextpersistencefilter"></a>

## SecurityContextPersistenceFilter

The [`SecurityContextPersistenceFilter`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/context/SecurityContextPersistenceFilter.html) is responsible for persisting the `SecurityContext` between requests using the [`SecurityContextRepository`](#securitycontextrepository).

![securitycontextpersistencefilter](https://raw.githubusercontent.com/spring-projects/spring-security/6.4.5/docs/modules/ROOT/assets/images/servlet/authentication/securitycontextpersistencefilter.png)

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.4.5/docs/modules/ROOT/assets/images/icons/number_1.png) Before running the rest of the application, `SecurityContextPersistenceFilter` loads the `SecurityContext` from the `SecurityContextRepository` and sets it on the `SecurityContextHolder`.

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.4.5/docs/modules/ROOT/assets/images/icons/number_2.png) Next, the application is ran.

![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.4.5/docs/modules/ROOT/assets/images/icons/number_3.png) Finally, if the `SecurityContext` has changed, we save the `SecurityContext` using the `SecurityContextRepository`.
This means that when using `SecurityContextPersistenceFilter`, just setting the `SecurityContextHolder` will ensure that the `SecurityContext` is persisted using `SecurityContextRepository`.

In some cases a response is committed and written to the client before the `SecurityContextPersistenceFilter` method completes.
For example, if a redirect is sent to the client the response is immediately written back to the client.
This means that establishing an `HttpSession` would not be possible in step 3 because the session id could not be included in the already written response.
Another situation that can happen is that if a client authenticates successfully, the response is committed before `SecurityContextPersistenceFilter` completes, and the client makes a second request before the `SecurityContextPersistenceFilter` completes. the wrong authentication could be present in the second request.

To avoid these problems, the `SecurityContextPersistenceFilter` wraps both the `HttpServletRequest` and the `HttpServletResponse` to detect if the `SecurityContext` has changed and if so save the `SecurityContext` just before the response is committed.

<a id="securitycontextholderfilter"></a>

## SecurityContextHolderFilter

The [`SecurityContextHolderFilter`](https://docs.spring.io/spring-security/site/docs/6.4.5/api/org/springframework/security/web/context/SecurityContextHolderFilter.html) is responsible for loading the `SecurityContext` between requests using the [`SecurityContextRepository`](#securitycontextrepository).

![securitycontextholderfilter](https://raw.githubusercontent.com/spring-projects/spring-security/6.4.5/docs/modules/ROOT/assets/images/servlet/authentication/securitycontextholderfilter.png)

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.4.5/docs/modules/ROOT/assets/images/icons/number_1.png) Before running the rest of the application, `SecurityContextHolderFilter` loads the `SecurityContext` from the `SecurityContextRepository` and sets it on the `SecurityContextHolder`.

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.4.5/docs/modules/ROOT/assets/images/icons/number_2.png) Next, the application is ran.

Unlike, [`SecurityContextPersistenceFilter`](#securitycontextpersistencefilter), `SecurityContextHolderFilter` only loads the `SecurityContext` it does not save the `SecurityContext`.
This means that when using `SecurityContextHolderFilter`, it is required that the `SecurityContext` is explicitly saved.

#### Java

```java
public SecurityFilterChain filterChain(HttpSecurity http) {
	http
		// ...
		.securityContext((securityContext) -> securityContext
			.requireExplicitSave(true)
		);
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun springSecurity(http: HttpSecurity): SecurityFilterChain {
    http {
        securityContext {
            requireExplicitSave = true
        }
    }
    return http.build()
}
```

#### XML

```xml
<http security-context-explicit-save="true">
	<!-- ... -->
</http>
```

Upon using the configuration, it is important that any code that sets the `SecurityContextHolder` with a `SecurityContext` also saves the `SecurityContext` to the `SecurityContextRepository` if it should be persisted between requests.

For example, the following code:

#### Java

```java
SecurityContextHolder.setContext(securityContext);
```

#### Kotlin

```kotlin
SecurityContextHolder.setContext(securityContext)
```

should be replaced with

#### Java

```java
SecurityContextHolder.setContext(securityContext);
securityContextRepository.saveContext(securityContext, httpServletRequest, httpServletResponse);
```

#### Kotlin

```kotlin
SecurityContextHolder.setContext(securityContext)
securityContextRepository.saveContext(securityContext, httpServletRequest, httpServletResponse)
```
