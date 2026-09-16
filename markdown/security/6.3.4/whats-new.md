---
title: "What’s New in Spring Security 6.3"
source: "ROOT:whats-new.adoc"
---

<a id="new"></a>

# What’s New in Spring Security 6.3

Spring Security 6.3 provides a number of new features.
Below are the highlights of the release, or you can view [the release notes](https://github.com/spring-projects/spring-security/releases) for a detailed listing of each feature and bug fix.

<a id="_passive_jdk_serialization_support"></a>

## Passive JDK Serialization Support

When it comes to its support for JDK-serialized security components, Spring Security has historically been quite aggressive, supporting each serialization version for only one Spring Security minor version.
This meant that if you had JDK-serialized security components, then they would need to be evacuated before upgrading to the next Spring Security version since they would no longer be deserializable.

Now that Spring Security performs a minor release every six months, this became a much larger pain point.
To address that, Spring Security now will [maintain passivity with JDK serialization](https://spring.io/blog/2024/01/19/spring-security-6-3-adds-passive-jdk-serialization-deserialization-for), like it does with JSON serialization, making for more seamless upgrades.

<a id="_authorization"></a>

## Authorization

An ongoing theme for the last several releases has been to refactor and improve Spring Security’s authorization subsystem.
Starting with replacing the `AccessDecisionManager` API with `AuthorizationManager` it’s now come to the point where we are able to add several exciting new features.

<a id="_annotation_parameters_14480"></a>

### Annotation Parameters - [#14480](https://github.com/spring-projects/spring-security/issues/14480)

The first 6.3 feature is [support for annotation parameters](https://github.com/spring-projects/spring-security/issues/14480).
Consider Spring Security’s support for [meta-annotations](servlet/authorization/method-security.md#meta-annotations) like this one:

#### Java

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@PreAuthorize("hasAuthority('SCOPE_message:read')")
public @interface HasMessageRead {}
```

#### Kotlin

#### Kotlin

```kotlin
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@PreAuthorize("hasAuthority('SCOPE_message:read')")
annotation class HasMessageRead
```

Before this release, something like this is only helpful when it is used widely across the codebase.
But now, [you can add parameters](servlet/authorization/method-security.md#_templating_meta_annotation_expressions) like so:

#### Java

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@PreAuthorize("hasAuthority('SCOPE_{scope}')")
public @interface HasScope {
	String scope();
}
```

#### Kotlin

```kotlin
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@PreAuthorize("hasAuthority('SCOPE_{scope}')")
annotation class HasScope (val scope:String)
```

making it possible to do things like this:

#### Java

```java
@HasScope("message:read")
public String method() { ... }
```

#### Kotlin

```kotlin
@HasScope("message:read")
fun method(): String { ... }
```

and apply your SpEL expression in several more places.

<a id="_secure_return_values_14596_14597"></a>

### Secure Return Values - [#14596](https://github.com/spring-projects/spring-security/issues/14596), [#14597](https://github.com/spring-projects/spring-security/issues/14597)

Since the early days of Spring Security, you’ve been able to [annotate Spring beans with `@PreAuthorize` and `@PostAuthorize`](servlet/authorization/method-security.md#use-preauthorize).
But controllers, services, and repositories are not the only things you care to secure.
For example, what about a domain object `Order` where only admins should be able to call the `Order#getPayment` method?

Now in 6.3, [you can annotate those methods](https://github.com/spring-projects/spring-security/issues/14597), too.
First, annotate the `getPayment` method like you would a Spring bean:

#### Java

```java
public class Order {

	@HasScope("payment:read")
	Payment getPayment() { ... }

}
```

#### Kotlin

```kotlin
class Order {

	@HasScope("payment:read")
	fun getPayment(): Payment { ... }

}
```

And then [annotate your Spring Data repository with `@AuthorizeReturnObject`](servlet/authorization/method-security.md#authorize-object) like so:

#### Java

```java
public interface OrderRepository implements CrudRepository<Order, String> {

	@AuthorizeReturnObject
	Optional<Order> findOrderById(String id);

}
```

#### Kotlin

```kotlin
interface OrderRepository : CrudRepository<Order, String> {
    @AuthorizeReturnObject
    fun findOrderById(id: String?): Optional<Order?>?
}
```

At that point, Spring Security will protect any `Order` returned from `findOrderById` by way of [proxying the `Order` instance](https://github.com/spring-projects/spring-security/issues/14596).

<a id="_error_handling_14598_14600_14601"></a>

### Error Handling - [#14598](https://github.com/spring-projects/spring-security/issues/14598), [#14600](https://github.com/spring-projects/spring-security/issues/14600), [#14601](https://github.com/spring-projects/spring-security/issues/14601)

In this release, you can also [intercept and handle failure at the method level](https://github.com/spring-projects/spring-security/issues/14601) with its last new method security annotation.

When you [annotate a method with `@HandleAuthorizationDenied`](servlet/authorization/method-security.md#fallback-values-authorization-denied) like so:

#### Java

```java
public class Payment {
    @HandleAuthorizationDenied(handlerClass=Mask.class)
    @PreAuthorize("hasAuthority('card:read')")
    public String getCreditCardNumber() { ... }
}
```

#### Kotlin

```kotlin
class Payment {
    @HandleAuthorizationDenied(handlerClass=Mask.class)
    @PreAuthorize("hasAuthority('card:read')")
    fun getCreditCardNumber(): String { ... }
}
```

and publish a `Mask` bean:

#### Java

```java
@Component
public class Mask implements MethodAuthorizationDeniedHandler {
	@Override
    public Object handleDeniedInvocation(MethodInvocation invocation, AuthorizationResult result) {
		return "***";
    }
}
```

#### Kotlin

```kotlin
@Component
class Mask : MethodAuthorizationDeniedHandler {
    fun handleDeniedInvocation(invocation: MethodInvocation?, result: AuthorizationResult?): Any = "***"
}
```

then any unauthorized call to `Payment#getCreditCardNumber` will return `***` instead of the number.

You can see all these features at work together in [the latest Spring Security Data sample](https://github.com/spring-projects/spring-security-samples/tree/main/servlet/spring-boot/java/data).

<a id="_compromised_password_checking_7395"></a>

## Compromised Password Checking - [#7395](https://github.com/spring-projects/spring-security/issues/7395)

If you are going to let users pick passwords, it’s critical to ensure that such a password isn’t already compromised.
Spring Security 6.3 makes this as simple as [publishing a `CompromisedPasswordChecker` bean](features/authentication/password-storage.md#authentication-compromised-password-check):

#### Java

```java
@Bean
public CompromisedPasswordChecker compromisedPasswordChecker() {
    return new HaveIBeenPwnedRestApiPasswordChecker();
}
```

#### Kotlin

```kotlin
@Bean
fun compromisedPasswordChecker(): CompromisedPasswordChecker = HaveIBeenPwnedRestApiPasswordChecker()
```

<a id="_spring_security_rsa_is_now_part_of_spring_security_14202"></a>

## `spring-security-rsa` is now part of Spring Security - [#14202](https://github.com/spring-projects/spring-security/issues/14202)

Since 2017, Spring Security has been undergoing a long-standing initiative to fold various Spring Security extensions into Spring Security proper.
In 6.3, `spring-security-rsa` becomes the latest of these projects which will help the team maintain and add features to it, long-term.

`spring-security-rsa` provides a number of [handy `BytesEncryptor`](https://github.com/spring-projects/spring-security/blob/main/crypto/src/main/java/org/springframework/security/crypto/encrypt/RsaSecretEncryptor.java) [implementations](https://github.com/spring-projects/spring-security/blob/main/crypto/src/main/java/org/springframework/security/crypto/encrypt/RsaRawEncryptor.java) as well as [a simpler API for working with `KeyStore`s](https://github.com/spring-projects/spring-security/blob/main/crypto/src/main/java/org/springframework/security/crypto/encrypt/KeyStoreKeyFactory.java).

<a id="_oauth_2_0_token_exchange_grant_5199"></a>

## OAuth 2.0 Token Exchange Grant - [#5199](https://github.com/spring-projects/spring-security/issues/5199)

One of [the most highly-voted OAuth 2.0 features](https://github.com/spring-projects/spring-security/issues/5199) in Spring Security is now in place in 6.3, which is the support for [the OAuth 2.0 Token Exchange grant](https://datatracker.ietf.org/doc/html/rfc8693#section-2).

For [any client configured for token exchange](servlet/oauth2/client/authorization-grants.md#token-exchange-grant-access-token), you can activate it in Spring Security by adding a `TokenExchangeAuthorizedClientProvider` instance to your `OAuth2AuthorizedClientManager` like so:

#### Java

```java
@Bean
public OAuth2AuthorizedClientProvider tokenExchange() {
	return new TokenExchangeOAuth2AuthorizedClientProvider();
}
```

#### Kotlin

```kotlin
@Bean
fun tokenExchange(): OAuth2AuthorizedClientProvider = TokenExchangeOAuth2AuthorizedClientProvider()
```

and then [use the `@RegisteredOAuth2AuthorizedClient` annotation](servlet/oauth2/client/authorized-clients.md#oauth2Client-registered-authorized-client) as per usual to retrieve the appropriate token with the expanded privileges your resource server needs.

<a id="_additional_highlights"></a>

## Additional Highlights

- [gh-14655](https://github.com/spring-projects/spring-security/pull/14655) - Add `DelegatingAuthenticationConverter`
- [gh-6192](https://github.com/spring-projects/spring-security/issues/6192) - Add Concurrent Sessions Control on WebFlux ([docs](reactive/authentication/concurrent-sessions-control.md))
- [gh-14193](https://github.com/spring-projects/spring-security/pull/14193) - Added support for CAS Gateway Authentication
- [gh-13259](https://github.com/spring-projects/spring-security/issues/13259) - Customize when UserInfo is called
- [gh-14168](https://github.com/spring-projects/spring-security/pull/14168) - Introduce Customizable AuthorizationFailureHandler in OAuth2AuthorizationRequestRedirectFilter
- [gh-14672](https://github.com/spring-projects/spring-security/issues/14672) - Customize mapping the OidcUser from OidcUserRequest and OidcUserInfo
- [gh-13763](https://github.com/spring-projects/spring-security/issues/13763) - Simplify configuration of reactive OAuth2 Client component model
- [gh-14758](https://github.com/spring-projects/spring-security/issues/14758) - Update reactive OAuth2 docs landing page with examples ([docs](reactive/oauth2/index.md))
- [gh-10538](https://github.com/spring-projects/spring-security/issues/10538) - Support Certificate-Bound JWT Access Token Validation
- [gh-14265](https://github.com/spring-projects/spring-security/pull/14265) - Support Nested username in UserInfo response
- [gh-14449](https://github.com/spring-projects/spring-security/pull/14265) - Add `SecurityContext` argument resolver
- [gh-11440](https://github.com/spring-projects/spring-security/issues/11440) - Simplify Disabling `application/x-www-form-urlencoded` Encoding Client ID and Secret ([servlet docs](servlet/oauth2/client/client-authentication.md#_authenticate_using_client_secret_basic), [reactive docs](reactive/oauth2/client/client-authentication.md#_authenticate_using_client_secret_basic))

And for an exhaustive list, please see the release notes for [6.3.0-RC1](https://github.com/spring-projects/spring-security/releases/tag/6.3.0-RC1), [6.3.0-M3](https://github.com/spring-projects/spring-security/releases/tag/6.3.0-M3), [6.3.0-M2](https://github.com/spring-projects/spring-security/releases/tag/6.3.0-M2), and [6.3.0-M1](https://github.com/spring-projects/spring-security/releases/tag/6.3.0-M1).
