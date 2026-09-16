---
title: "Authorization Architecture"
source: "ROOT:servlet/authorization/architecture.adoc"
---

<a id="authz-arch"></a>

# Authorization Architecture

This section describes the Spring Security architecture that applies to authorization.

<a id="authz-authorities"></a>

## Authorities

[`Authentication`](../authentication/architecture.md#servlet-authentication-authentication) discusses how all `Authentication` implementations store a list of `GrantedAuthority` objects.
These represent the authorities that have been granted to the principal.
The `GrantedAuthority` objects are inserted into the `Authentication` object by the `AuthenticationManager` and are later read by `AccessDecisionManager` instances when making authorization decisions.

The `GrantedAuthority` interface has only one method:

```java
String getAuthority();

```

This method is used by an
`AuthorizationManager` instance to obtain a precise `String` representation of the `GrantedAuthority`.
By returning a representation as a `String`, a `GrantedAuthority` can be easily "read" by most `AuthorizationManager` implementations.
If a `GrantedAuthority` cannot be precisely represented as a `String`, the `GrantedAuthority` is considered "complex" and `getAuthority()` must return `null`.

An example of a complex `GrantedAuthority` would be an implementation that stores a list of operations and authority thresholds that apply to different customer account numbers.
Representing this complex `GrantedAuthority` as a `String` would be quite difficult. As a result, the `getAuthority()` method should return `null`.
This indicates to any `AuthorizationManager` that it needs to support the specific `GrantedAuthority` implementation to understand its contents.

Spring Security includes one concrete `GrantedAuthority` implementation: `SimpleGrantedAuthority`.
This implementation lets any user-specified `String` be converted into a `GrantedAuthority`.
All `AuthenticationProvider` instances included with the security architecture use `SimpleGrantedAuthority` to populate the `Authentication` object.

<a id="jc-method-security-custom-granted-authority-defaults"></a>

By default, role-based authorization rules include `ROLE_` as a prefix.
This means that if there is an authorization rule that requires a security context to have a role of "USER", Spring Security will by default look for a `GrantedAuthority#getAuthority` that returns "ROLE\_USER".

You can customize this with `GrantedAuthorityDefaults`.
`GrantedAuthorityDefaults` exists to allow customizing the prefix to use for role-based authorization rules.

You can configure the authorization rules to use a different prefix by exposing a `GrantedAuthorityDefaults` bean, like so:

#### Java

```java
@Bean
static GrantedAuthorityDefaults grantedAuthorityDefaults() {
	return new GrantedAuthorityDefaults("MYPREFIX_");
}
```

#### Kotlin

```kotlin
companion object {
	@Bean
	fun grantedAuthorityDefaults() : GrantedAuthorityDefaults {
		return GrantedAuthorityDefaults("MYPREFIX_");
	}
}
```

#### Xml

```xml
<bean id="grantedAuthorityDefaults" class="org.springframework.security.config.core.GrantedAuthorityDefaults">
	<constructor-arg value="MYPREFIX_"/>
</bean>
```

> [!TIP]
> You expose `GrantedAuthorityDefaults` using a `static` method to ensure that Spring publishes it before it initializes Spring Security’s method security `@Configuration` classes

<a id="authz-pre-invocation"></a>

## Invocation Handling

Spring Security provides interceptors that control access to secure objects, such as method invocations or web requests.
A pre-invocation decision on whether the invocation is allowed to proceed is made by `AuthorizationManager` instances.
Also post-invocation decisions on whether a given value may be returned is made by `AuthorizationManager` instances.

<a id="_the_authorizationmanager"></a>

### The AuthorizationManager

`AuthorizationManager` supersedes both [`AccessDecisionManager` and `AccessDecisionVoter`](#authz-legacy-note).

Applications that customize an `AccessDecisionManager` or `AccessDecisionVoter` are encouraged to [change to using `AuthorizationManager`](#authz-voter-adaptation).

`AuthorizationManager`s are called by Spring Security’s [request-based](authorize-http-requests.md), [method-based](method-security.md), and [message-based](../integrations/websocket.md) authorization components and are responsible for making final access control decisions.
The `AuthorizationManager` interface contains two methods:

```java
AuthorizationDecision check(Supplier<Authentication> authentication, Object secureObject);

default void verify(Supplier<Authentication> authentication, Object secureObject)
        throws AccessDeniedException {
    // ...
}
```

The `AuthorizationManager`'s `check` method is passed all the relevant information it needs in order to make an authorization decision.
In particular, passing the secure `Object` enables those arguments contained in the actual secure object invocation to be inspected.
For example, let’s assume the secure object was a `MethodInvocation`.
It would be easy to query the `MethodInvocation` for any `Customer` argument, and then implement some sort of security logic in the `AuthorizationManager` to ensure the principal is permitted to operate on that customer.
Implementations are expected to return a positive `AuthorizationDecision` if access is granted, negative `AuthorizationDecision` if access is denied, and a null `AuthorizationDecision` when abstaining from making a decision.

`verify` calls `check` and subsequently throws an `AccessDeniedException` in the case of a negative `AuthorizationDecision`.

<a id="authz-delegate-authorization-manager"></a>

### Delegate-based AuthorizationManager Implementations

Whilst users can implement their own `AuthorizationManager` to control all aspects of authorization, Spring Security ships with a delegating `AuthorizationManager` that can collaborate with individual `AuthorizationManager`s.

`RequestMatcherDelegatingAuthorizationManager` will match the request with the most appropriate delegate `AuthorizationManager`.
For method security, you can use `AuthorizationManagerBeforeMethodInterceptor` and `AuthorizationManagerAfterMethodInterceptor`.

[Authorization Manager Implementations](#authz-authorization-manager-implementations) illustrates the relevant classes.

<a id="authz-authorization-manager-implementations"></a>

#### Authorization Manager Implementations

![authorizationhierarchy](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.10/docs/modules/ROOT/assets/images/servlet/authorization/authorizationhierarchy.png)

Using this approach, a composition of `AuthorizationManager` implementations can be polled on an authorization decision.

<a id="authz-authority-authorization-manager"></a>

#### AuthorityAuthorizationManager

The most common `AuthorizationManager` provided with Spring Security is `AuthorityAuthorizationManager`.
It is configured with a given set of authorities to look for on the current `Authentication`.
It will return positive `AuthorizationDecision` should the `Authentication` contain any of the configured authorities.
It will return a negative `AuthorizationDecision` otherwise.

<a id="authz-authenticated-authorization-manager"></a>

#### AuthenticatedAuthorizationManager

Another manager is the `AuthenticatedAuthorizationManager`.
It can be used to differentiate between anonymous, fully-authenticated and remember-me authenticated users.
Many sites allow certain limited access under remember-me authentication, but require a user to confirm their identity by logging in for full access.

<a id="authz-authorization-managers"></a>

#### AuthorizationManagers

There are also helpful static factories in [`AuthorizationManagers`](https://docs.spring.io/spring-security/site/docs/6.3.10/api/org/springframework/security/authorization/AuthorizationManagers.html) for composing individual `AuthorizationManager`s into more sophisticated expressions.

<a id="authz-custom-authorization-manager"></a>

#### Custom Authorization Managers

Obviously, you can also implement a custom `AuthorizationManager` and you can put just about any access-control logic you want in it.
It might be specific to your application (business-logic related) or it might implement some security administration logic.
For example, you can create an implementation that can query Open Policy Agent or your own authorization database.

> [!TIP]
> You’ll find a [blog article](https://spring.io/blog/2009/01/03/spring-security-customization-part-2-adjusting-secured-session-in-real-time) on the Spring web site which describes how to use the legacy `AccessDecisionVoter` to deny access in real-time to users whose accounts have been suspended.
> You can achieve the same outcome by implementing `AuthorizationManager` instead.

<a id="authz-voter-adaptation"></a>

## Adapting AccessDecisionManager and AccessDecisionVoters

Previous to `AuthorizationManager`, Spring Security published [`AccessDecisionManager` and `AccessDecisionVoter`](#authz-legacy-note).

In some cases, like migrating an older application, it may be desirable to introduce an `AuthorizationManager` that invokes an `AccessDecisionManager` or `AccessDecisionVoter`.

To call an existing `AccessDecisionManager`, you can do:

#### Java

```java
@Component
public class AccessDecisionManagerAuthorizationManagerAdapter implements AuthorizationManager {
    private final AccessDecisionManager accessDecisionManager;
    private final SecurityMetadataSource securityMetadataSource;

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authentication, Object object) {
        try {
            Collection<ConfigAttribute> attributes = this.securityMetadataSource.getAttributes(object);
            this.accessDecisionManager.decide(authentication.get(), object, attributes);
            return new AuthorizationDecision(true);
        } catch (AccessDeniedException ex) {
            return new AuthorizationDecision(false);
        }
    }

    @Override
    public void verify(Supplier<Authentication> authentication, Object object) {
        Collection<ConfigAttribute> attributes = this.securityMetadataSource.getAttributes(object);
        this.accessDecisionManager.decide(authentication.get(), object, attributes);
    }
}
```

And then wire it into your `SecurityFilterChain`.

Or to only call an `AccessDecisionVoter`, you can do:

#### Java

```java
@Component
public class AccessDecisionVoterAuthorizationManagerAdapter implements AuthorizationManager {
    private final AccessDecisionVoter accessDecisionVoter;
    private final SecurityMetadataSource securityMetadataSource;

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authentication, Object object) {
        Collection<ConfigAttribute> attributes = this.securityMetadataSource.getAttributes(object);
        int decision = this.accessDecisionVoter.vote(authentication.get(), object, attributes);
        switch (decision) {
        case ACCESS_GRANTED:
            return new AuthorizationDecision(true);
        case ACCESS_DENIED:
            return new AuthorizationDecision(false);
        }
        return null;
    }
}
```

And then wire it into your `SecurityFilterChain`.

<a id="authz-hierarchical-roles"></a>

## Hierarchical Roles

It is a common requirement that a particular role in an application should automatically "include" other roles.
For example, in an application which has the concept of an "admin" and a "user" role, you may want an admin to be able to do everything a normal user can.
To achieve this, you can either make sure that all admin users are also assigned the "user" role.
Alternatively, you can modify every access constraint which requires the "user" role to also include the "admin" role.
This can get quite complicated if you have a lot of different roles in your application.

The use of a role-hierarchy allows you to configure which roles (or authorities) should include others.
This is supported for filter-based authorization in `HttpSecurity#authorizeHttpRequests` and for method-based authorization through `DefaultMethodSecurityExpressionHandler` for pre-post annotations, `SecuredAuthorizationManager` for `@Secured`, and `Jsr250AuthorizationManager` for JSR-250 annotations.
You can configure the behavior for all of them at once in the following way:

#### Java

```java
@Bean
static RoleHierarchy roleHierarchy() {
    return RoleHierarchyImpl.withDefaultRolePrefix()
        .role("ADMIN").implies("STAFF")
        .role("STAFF").implies("USER")
        .role("USER").implies("GUEST")
        .build();
}

// and, if using pre-post method security also add
@Bean
static MethodSecurityExpressionHandler methodSecurityExpressionHandler(RoleHierarchy roleHierarchy) {
	DefaultMethodSecurityExpressionHandler expressionHandler = new DefaultMethodSecurityExpressionHandler();
	expressionHandler.setRoleHierarchy(roleHierarchy);
	return expressionHandler;
}
```

#### Xml

```java
<bean id="roleHierarchy"
		class="org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl" factory-method="fromHierarchy">
	<constructor-arg>
		<value>
			ROLE_ADMIN > ROLE_STAFF
			ROLE_STAFF > ROLE_USER
			ROLE_USER > ROLE_GUEST
		</value>
	</constructor-arg>
</bean>

<!-- and, if using method security also add -->
<bean id="methodSecurityExpressionHandler"
        class="org.springframework.security.access.expression.method.MethodSecurityExpressionHandler">
    <property ref="roleHierarchy"/>
</bean>
```

Here we have four roles in a hierarchy `ROLE_ADMIN ⇒ ROLE_STAFF ⇒ ROLE_USER ⇒ ROLE_GUEST`.
A user who is authenticated with `ROLE_ADMIN`, will behave as if they have all four roles when security constraints are evaluated against any filter- or method-based rules.

> [!TIP]
> The `>` symbol can be thought of as meaning "includes".

Role hierarchies offer a convenient means of simplifying the access-control configuration data for your application and/or reducing the number of authorities which you need to assign to a user.
For more complex requirements you may wish to define a logical mapping between the specific access-rights your application requires and the roles that are assigned to users, translating between the two when loading the user information.

<a id="authz-legacy-note"></a>

## Legacy Authorization Components

> [!NOTE]
> Spring Security contains some legacy components.
> Since they are not yet removed, documentation is included for historical purposes.
> Their recommended replacements are above.

<a id="authz-access-decision-manager"></a>

### The AccessDecisionManager

The `AccessDecisionManager` is called by the `AbstractSecurityInterceptor` and is responsible for making final access control decisions.
The `AccessDecisionManager` interface contains three methods:

```java
void decide(Authentication authentication, Object secureObject,
	Collection<ConfigAttribute> attrs) throws AccessDeniedException;

boolean supports(ConfigAttribute attribute);

boolean supports(Class clazz);
```

The `decide` method of the `AccessDecisionManager` is passed all the relevant information it needs to make an authorization decision.
In particular, passing the secure `Object` lets those arguments contained in the actual secure object invocation be inspected.
For example, assume the secure object is a `MethodInvocation`.
You can query the `MethodInvocation` for any `Customer` argument and then implement some sort of security logic in the `AccessDecisionManager` to ensure the principal is permitted to operate on that customer.
Implementations are expected to throw an `AccessDeniedException` if access is denied.

The `supports(ConfigAttribute)` method is called by the `AbstractSecurityInterceptor` at startup time to determine if the `AccessDecisionManager` can process the passed `ConfigAttribute`.
The `supports(Class)` method is called by a security interceptor implementation to ensure the configured `AccessDecisionManager` supports the type of secure object that the security interceptor presents.

<a id="authz-voting-based"></a>

### Voting-Based AccessDecisionManager Implementations

While users can implement their own `AccessDecisionManager` to control all aspects of authorization, Spring Security includes several `AccessDecisionManager` implementations that are based on voting.
[Voting Decision Manager](#authz-access-voting) describes the relevant classes.

The following image shows the `AccessDecisionManager` interface:

<a id="authz-access-voting"></a>

#### Voting Decision Manager

![access decision voting](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.10/docs/modules/ROOT/assets/images/servlet/authorization/access-decision-voting.png)

By using this approach, a series of `AccessDecisionVoter` implementations are polled on an authorization decision.
The `AccessDecisionManager` then decides whether or not to throw an `AccessDeniedException` based on its assessment of the votes.

The `AccessDecisionVoter` interface has three methods:

```java
int vote(Authentication authentication, Object object, Collection<ConfigAttribute> attrs);

boolean supports(ConfigAttribute attribute);

boolean supports(Class clazz);
```

Concrete implementations return an `int`, with possible values being reflected in the `AccessDecisionVoter` static fields named `ACCESS_ABSTAIN`, `ACCESS_DENIED` and `ACCESS_GRANTED`.
A voting implementation returns `ACCESS_ABSTAIN` if it has no opinion on an authorization decision.
If it does have an opinion, it must return either `ACCESS_DENIED` or `ACCESS_GRANTED`.

There are three concrete `AccessDecisionManager` implementations provided with Spring Security to tally the votes.
The `ConsensusBased` implementation grants or denies access based on the consensus of non-abstain votes.
Properties are provided to control behavior in the event of an equality of votes or if all votes are abstain.
The `AffirmativeBased` implementation grants access if one or more `ACCESS_GRANTED` votes were received (in other words, a deny vote will be ignored, provided there was at least one grant vote).
Like the `ConsensusBased` implementation, there is a parameter that controls the behavior if all voters abstain.
The `UnanimousBased` provider expects unanimous `ACCESS_GRANTED` votes in order to grant access, ignoring abstains.
It denies access if there is any `ACCESS_DENIED` vote.
Like the other implementations, there is a parameter that controls the behavior if all voters abstain.

You can implement a custom `AccessDecisionManager` that tallies votes differently.
For example, votes from a particular `AccessDecisionVoter` might receive additional weighting, while a deny vote from a particular voter may have a veto effect.

<a id="authz-role-voter"></a>

#### RoleVoter

The most commonly used `AccessDecisionVoter` provided with Spring Security is the `RoleVoter`, which treats configuration attributes as role names and votes to grant access if the user has been assigned that role.

It votes if any `ConfigAttribute` begins with the `ROLE_` prefix.
It votes to grant access if there is a `GrantedAuthority` that returns a `String` representation (from the `getAuthority()` method) exactly equal to one or more `ConfigAttributes` that start with the `ROLE_` prefix.
If there is no exact match of any `ConfigAttribute` starting with `ROLE_`, `RoleVoter` votes to deny access.
If no `ConfigAttribute` begins with `ROLE_`, the voter abstains.

<a id="authz-authenticated-voter"></a>

#### AuthenticatedVoter

Another voter which we have implicitly seen is the `AuthenticatedVoter`, which can be used to differentiate between anonymous, fully-authenticated, and remember-me authenticated users.
Many sites allow certain limited access under remember-me authentication but require a user to confirm their identity by logging in for full access.

When we have used the `IS_AUTHENTICATED_ANONYMOUSLY` attribute to grant anonymous access, this attribute was being processed by the `AuthenticatedVoter`.
For more information, see
[`AuthenticatedVoter`](https://docs.spring.io/spring-security/site/docs/6.3.10/api/org/springframework/security/access/vote/AuthenticatedVoter.html).

<a id="authz-custom-voter"></a>

#### Custom Voters

You can also implement a custom `AccessDecisionVoter` and put just about any access-control logic you want in it.
It might be specific to your application (business-logic related) or it might implement some security administration logic.
For example, on the Spring web site, you can find a [blog article](https://spring.io/blog/2009/01/03/spring-security-customization-part-2-adjusting-secured-session-in-real-time) that describes how to use a voter to deny access in real-time to users whose accounts have been suspended.

<a id="authz-after-invocation"></a>

#### After Invocation Implementation

![after invocation](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.10/docs/modules/ROOT/assets/images/servlet/authorization/after-invocation.png)

Like many other parts of Spring Security, `AfterInvocationManager` has a single concrete implementation, `AfterInvocationProviderManager`, which polls a list of `AfterInvocationProvider`s.
Each `AfterInvocationProvider` is allowed to modify the return object or throw an `AccessDeniedException`.
Indeed multiple providers can modify the object, as the result of the previous provider is passed to the next in the list.

Please be aware that if you’re using `AfterInvocationManager`, you will still need configuration attributes that allow the `MethodSecurityInterceptor`'s `AccessDecisionManager` to allow an operation.
If you’re using the typical Spring Security included `AccessDecisionManager` implementations, having no configuration attributes defined for a particular secure method invocation will cause each `AccessDecisionVoter` to abstain from voting.
In turn, if the `AccessDecisionManager` property           “allowIfAllAbstainDecisions” is `false`, an `AccessDeniedException` will be thrown.
You may avoid this potential issue by either (i) setting “allowIfAllAbstainDecisions” to `true` (although this is generally not recommended) or (ii) simply ensure that there is at least one configuration attribute that an `AccessDecisionVoter` will vote to grant access for.
This latter (recommended) approach is usually achieved through a `ROLE_USER` or `ROLE_AUTHENTICATED` configuration attribute.
