---
title: "Session Management Migrations"
source: "ROOT:migration/servlet/session-management.adoc"
---

# Session Management Migrations

The following steps relate to how to finish migrating session management support.

<a id="_require_explicit_saving_of_securitycontextrepository"></a>

## Require Explicit Saving of SecurityContextRepository

In Spring Security 5, the default behavior is for the [`SecurityContext`](../../servlet/authentication/architecture.md#servlet-authentication-securitycontext) to automatically be saved to the [`SecurityContextRepository`](../../servlet/authentication/persistence.md#securitycontextrepository) using the [`SecurityContextPersistenceFilter`](../../servlet/authentication/persistence.md#securitycontextpersistencefilter).
Saving must be done just prior to the `HttpServletResponse` being committed and just before `SecurityContextPersistenceFilter`.
Unfortunately, automatic persistence of the `SecurityContext` can surprise users when it is done prior to the request completing (i.e. just prior to committing the `HttpServletResponse`).
It also is complex to keep track of the state to determine if a save is necessary causing unnecessary writes to the `SecurityContextRepository` (i.e. `HttpSession`) at times.

In Spring Security 6, the default behavior is that the [`SecurityContextHolderFilter`](../../servlet/authentication/persistence.md#securitycontextholderfilter) will only read the `SecurityContext` from  `SecurityContextRepository` and populate it in the `SecurityContextHolder`.
Users now must explicitly save the `SecurityContext` with the `SecurityContextRepository` if they want the `SecurityContext` to persist between requests.
This removes ambiguity and improves performance by only requiring writing to the `SecurityContextRepository` (i.e. `HttpSession`) when it is necessary.

> [!NOTE]
> Saving the context is also needed when clearing it out, for example during logout. Refer to this section to [know more about that](../../servlet/authentication/session-management.md#properly-clearing-authentication).

If you are explicitly opting into Spring Security 6’s new defaults, the following configuration can be removed to accept the Spring Security 6 defaults.

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

<a id="_multiple_securitycontextrepository"></a>

## Multiple SecurityContextRepository

In Spring Security 5, the default [`SecurityContextRepository`](../../servlet/authentication/persistence.md#securitycontextrepository) was `HttpSessionSecurityContextRepository`.

In Spring Security 6, the default `SecurityContextRepository` is `DelegatingSecurityContextRepository`.
If you configured the `SecurityContextRepository` only for the purpose of updating to 6.0, you can remove it completely.

<a id="_deprecation_in_securitycontextrepository"></a>

## Deprecation in SecurityContextRepository

There are no further migration steps for this deprecation.

<a id="requestcache-query-optimization"></a>

## Optimize Querying of `RequestCache`

In Spring Security 5, the default behavior is to query the [saved request](../../servlet/architecture.md#savedrequests) on every request.
This means that in a typical setup, that in order to use the [`RequestCache`](../../servlet/architecture.md#requestcache) the `HttpSession` is queried on every request.

In Spring Security 6, the default is that `RequestCache` will only be queried for a cached request if the HTTP parameter `continue` is defined.
This allows Spring Security to avoid unnecessarily reading the `HttpSession` with the `RequestCache`.

In Spring Security 5 the default is to use `HttpSessionRequestCache` which will be queried for a cached request on every request.
If you are not overriding the defaults (i.e. using `NullRequestCache`), then the following configuration can be used to explicitly opt into the Spring Security 6 behavior in Spring Security 5.8:

#### Java

```java
@Bean
DefaultSecurityFilterChain springSecurity(HttpSecurity http) throws Exception {
	HttpSessionRequestCache requestCache = new HttpSessionRequestCache();
	requestCache.setMatchingRequestParameterName("continue");
	http
		// ...
		.requestCache((cache) -> cache
			.requestCache(requestCache)
		);
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun springSecurity(http: HttpSecurity): SecurityFilterChain {
    val httpRequestCache = HttpSessionRequestCache()
    httpRequestCache.setMatchingRequestParameterName("continue")
    http {
        requestCache {
            requestCache = httpRequestCache
        }
    }
    return http.build()
}
```

#### XML

```xml
<http auto-config="true">
	<!-- ... -->
	<request-cache ref="requestCache"/>
</http>

<b:bean id="requestCache" class="org.springframework.security.web.savedrequest.HttpSessionRequestCache"
	p:matchingRequestParameterName="continue"/>
```
