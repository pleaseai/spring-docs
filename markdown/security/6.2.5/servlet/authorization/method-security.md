---
title: "Method Security"
source: "ROOT:servlet/authorization/method-security.adoc"
---

<a id="jc-method"></a>

# Method Security

In addition to [modeling authorization at the request level](authorize-http-requests.md), Spring Security also supports modeling at the method level.

<a id="activate-method-security"></a>

You can activate it in your application by annotating any `@Configuration` class with `@EnableMethodSecurity` or adding `<method-security>` to any  XML configuration file, like so:

#### Java

```java
@EnableMethodSecurity
```

#### Kotlin

```kotlin
@EnableMethodSecurity
```

#### Xml

```xml
<sec:method-security/>
```

Then, you are immediately able to annotate any Spring-managed class or method with [`@PreAuthorize`](#use-preauthorize), [`@PostAuthorize`](#use-postauthorize), [`@PreFilter`](#use-prefilter), and [`@PostFilter`](#use-postfilter) to authorize method invocations, including the input parameters and return values.

> [!NOTE]
> [Spring Boot Starter Security](https://docs.spring.io/spring-boot/3.1.1/using.html#using.build-systems.starters) does not activate method-level authorization by default.

Method Security supports many other use cases as well including [AspectJ support](#use-aspectj), [custom annotations](#use-programmatic-authorization), and several configuration points.
Consider learning about the following use cases:

- [Migrating from `@EnableGlobalMethodSecurity`](#migration-enableglobalmethodsecurity)
- Understanding [how method security works](#method-security-architecture) and reasons to use it
- Comparing [request-level and method-level authorization](#request-vs-method)
- Authorizing methods with [`@PreAuthorize`](#use-preauthorize) and [`@PostAuthorize`](#use-postauthorize)
- Filtering methods with [`@PreFilter`](#use-prefilter) and [`@PostFilter`](#use-postfilter)
- Authorizing methods with [JSR-250 annotations](#use-jsr250)
- Authorizing methods with [AspectJ expressions](#use-aspectj)
- Integrating with [AspectJ byte-code weaving](#weave-aspectj)
- Coordinating with [@Transactional and other AOP-based annotations](#changing-the-order)
- Customizing [SpEL expression handling](#customizing-expression-handling)
- Integrating with [custom authorization systems](#custom-authorization-managers)

<a id="method-security-architecture"></a>

## How Method Security Works

Spring Security’s method authorization support is handy for:

- Extracting fine-grained authorization logic; for example, when the method parameters and return values contribute to the authorization decision.
- Enforcing security at the service layer
- Stylistically favoring annotation-based over `HttpSecurity`-based configuration

And since Method Security is built using [Spring AOP](https://docs.spring.io/spring-framework/reference/6.1.9/core.html#aop-api), you have access to all its expressive power to override Spring Security’s defaults as needed.

As already mentioned, you begin by adding `@EnableMethodSecurity` to a `@Configuration` class or `<sec:method-security/>` in a Spring XML configuration file.

<a id="use-method-security"></a>

> [!NOTE]
> This annotation and XML element supercede `@EnableGlobalMethodSecurity` and `<sec:global-method-security/>`, respectively.
> They offer the following improvements:
>
> 1. Uses the simplified `AuthorizationManager` API instead of metadata sources, config attributes, decision managers, and voters.
> This simplifies reuse and customization.
> 1. Favors direct bean-based configuration, instead of requiring extending `GlobalMethodSecurityConfiguration` to customize beans
> 1. Is built using native Spring AOP, removing abstractions and allowing you to use Spring AOP building blocks to customize
> 1. Checks for conflicting annotations to ensure an unambiguous security configuration
> 1. Complies with JSR-250
> 1. Enables `@PreAuthorize`, `@PostAuthorize`, `@PreFilter`, and `@PostFilter` by default
>
> If you are using `@EnableGlobalMethodSecurity` or `<global-method-security/>`, these are now deprecated, and you are encouraged to migrate.

Method authorization is a combination of before- and after-method authorization.
Consider a service bean that is annotated in the following way:

#### Java

```java
@Service
public class MyCustomerService {
    @PreAuthorize("hasAuthority('permission:read')")
    @PostAuthorize("returnObject.owner == authentication.name")
    public Customer readCustomer(String id) { ... }
}
```

#### Kotlin

```kotlin
@Service
open class MyCustomerService {
    @PreAuthorize("hasAuthority('permission:read')")
    @PostAuthorize("returnObject.owner == authentication.name")
    fun readCustomer(val id: String): Customer { ... }
}
```

A given invocation to `MyCustomerService#readCustomer` may look something like this when Method Security [is activated](#activate-method-security):

![methodsecurity](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.5/docs/modules/ROOT/assets/images/servlet/authorization/methodsecurity.png)

1. Spring AOP invokes its proxy method for `readCustomer`. Among the proxy’s other advisors, it invokes an [`AuthorizationManagerBeforeMethodInterceptor`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/AuthorizationManagerBeforeMethodInterceptor/html) that matches [the `@PreAuthorize` pointcut](#annotation-method-pointcuts)
1. The interceptor invokes [`PreAuthorizeAuthorizationManager#check`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/PreAuthorizeAuthorizationManager.html)
1. The authorization manager uses a `MethodSecurityExpressionHandler` to parse the annotation’s [SpEL expression](#authorization-expressions) and constructs a corresponding `EvaluationContext` from a `MethodSecurityExpressionRoot` containing [a `Supplier<Authentication>`](../authentication/architecture.md#servlet-authentication-authentication) and `MethodInvocation`.
1. The interceptor uses this context to evaluate the expression; specifically, it reads [the `Authentication`](../authentication/architecture.md#servlet-authentication-authentication) from the `Supplier` and checks whether it has `permission:read` in its collection of [authorities](architecture.md#authz-authorities)
1. If the evaluation passes, then Spring AOP proceeds to invoke the method.
1. If not, the interceptor publishes an `AuthorizationDeniedEvent` and throws an [`AccessDeniedException`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/access/AccessDeniedException.html) which [the `ExceptionTranslationFilter`](../architecture.md#servlet-exceptiontranslationfilter) catches and returns a 403 status code to the response
1. After the method returns, Spring AOP invokes an [`AuthorizationManagerAfterMethodInterceptor`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/AuthorizationManagerAfterMethodInterceptor.html) that matches [the `@PostAuthorize` pointcut](#annotation-method-pointcuts), operating the same as above, but with [`PostAuthorizeAuthorizationManager`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/PostAuthorizeAuthorizationManager.html)
1. If the evaluation passes (in this case, the return value belongs to the logged-in user), processing continues normally
1. If not, the interceptor publishes an `AuthorizationDeniedEvent` and throws an [`AccessDeniedException`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/access/AccessDeniedException.html), which [the `ExceptionTranslationFilter`](../architecture.md#servlet-exceptiontranslationfilter) catches and returns a 403 status code to the response

> [!NOTE]
> If the method is not being called in the context of an HTTP request, you will likely need to handle the `AccessDeniedException` yourself

<a id="unanimous-based-authorization-decisions"></a>

### Multiple Annotations Are Computed In Series

As demonstrated above, if a method invocation involves multiple [Method Security annotations](#authorizing-with-annotations), each of those is processed one at a time.
This means that they can collectively be thought of as being "anded" together.
In other words, for an invocation to be authorized, all annotation inspections need to pass authorization.

<a id="repeated-annotations"></a>

### Repeated Annotations Are Not Supported

That said, it is not supported to repeat the same annotation on the same method.
For example, you cannot place `@PreAuthorize` twice on the same method.

Instead, use SpEL’s boolean support or its support for delegating to a separate bean.

<a id="annotation-method-pointcuts"></a>

### Each Annotation Has Its Own Pointcut

Each annotation has its own pointcut instance that looks for that annotation or its [meta-annotation](#meta-annotations) counterparts across the entire object hierarchy, starting at [the method and its enclosing class](#class-or-interface-annotations).

You can see the specifics of this in [`AuthorizationMethodPointcuts`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/AuthorizationMethodPointcuts.html).

<a id="annotation-method-interceptors"></a>

### Each Annotation Has Its Own Method Interceptor

Each annotation has its own dedicated method interceptor.
The reason for this is to make things more composable.
For example, if needed, you can disable the Spring Security defaults and [publish only the `@PostAuthorize` method interceptor](#_enabling_certain_annotations).

The method interceptors are as follows:

- For [`@PreAuthorize`](#use-preauthorize), Spring Security uses [`AuthenticationManagerBeforeMethodInterceptor#preAuthorize`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/AuthorizationManagerBeforeMethodInterceptor.html), which in turn uses [`PreAuthorizeAuthorizationManager`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/PreAuthorizeAuthorizationManager.html)
- For [`@PostAuthorize`](#use-postauthorize), Spring Security uses [`AuthenticationManagerAfterMethodInterceptor#postAuthorize`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/AuthorizationManagerAfterMethodInterceptor.html), which in turn uses [`PostAuthorizeAuthorizationManager`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/PostAuthorizeAuthorizationManager.html)
- For [`@PreFilter`](#use-prefilter), Spring Security uses [`PreFilterAuthorizationMethodInterceptor`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/PreFilterAuthorizationMethodInterceptor.html)
- For [`@PostFilter`](#use-postfilter), Spring Security uses [`PostFilterAuthorizationMethodInterceptor`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/PostFilterAuthorizationMethodInterceptor.html)
- For [`@Secured`](#use-secured), Spring Security uses [`AuthenticationManagerBeforeMethodInterceptor#secured`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/AuthorizationManagerBeforeMethodInterceptor.html), which in turn uses [`SecuredAuthorizationManager`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/SecuredAuthorizationManager.html)
- For JSR-250 annotations, Spring Security uses [`AuthenticationManagerBeforeMethodInterceptor#jsr250`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/AuthorizationManagerBeforeMethodInterceptor.html), which in turn uses [`Jsr250AuthorizationManager`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authorization/method/Jsr250AuthorizationManager.html)

Generally speaking, you can consider the following listing as representative of what interceptors Spring Security publishes when you add `@EnableMethodSecurity`:

#### Java

```java
@Bean
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
static Advisor preAuthorizeMethodInterceptor() {
    return AuthorizationManagerBeforeMethodInterceptor.preAuthorize();
}

@Bean
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
static Advisor postAuthorizeMethodInterceptor() {
    return AuthorizationManagerAfterMethodInterceptor.postAuthorize();
}

@Bean
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
static Advisor preFilterMethodInterceptor() {
    return AuthorizationManagerBeforeMethodInterceptor.preFilter();
}

@Bean
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
static Advisor postFilterMethodInterceptor() {
    return AuthorizationManagerAfterMethodInterceptor.postFilter();
}
```

<a id="favor-granting-authorities"></a>

### Favor Granting Authorities Over Complicated SpEL Expressions

Quite often it can be tempting to introduce a complicated SpEL expression like the following:

#### Java

```java
@PreAuthorize("hasAuthority('permission:read') || hasRole('ADMIN')")
```

#### Kotlin

```kotlin
@PreAuthorize("hasAuthority('permission:read') || hasRole('ADMIN')")
```

However, you could instead grant `permission:read` to those with `ROLE_ADMIN`.
One way to do this is with a `RoleHierarchy` like so:

#### Java

```java
@Bean
static RoleHierarchy roleHierarchy() {
    return new RoleHierarchyImpl("ROLE_ADMIN > permission:read");
}
```

#### Kotlin

```java
companion object {
    @Bean
    fun roleHierarchy(): RoleHierarchy {
        return RoleHierarchyImpl("ROLE_ADMIN > permission:read")
    }
}
```

#### Xml

```xml
<bean id="roleHierarchy" class="org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl">
    <constructor-arg value="ROLE_ADMIN > permission:read"/>
</bean>
```

and then [set that in a `MethodSecurityExpressionHandler` instance](#customizing-expression-handling).
This then allows you to have a simpler [`@PreAuthorize`](#use-preauthorize) expression like this one:

#### Java

```java
@PreAuthorize("hasAuthority('permission:read')")
```

#### Kotlin

```kotlin
@PreAuthorize("hasAuthority('permission:read')")
```

Or, where possible, adapt application-specific authorization logic into granted authorities at login time.

<a id="request-vs-method"></a>

## Comparing Request-level vs Method-level Authorization

When should you favor method-level authorization over [request-level authorization](authorize-http-requests.md)?
Some of it comes down to taste; however, consider the following strengths list of each to help you decide.

|  |  |  |
| --- | --- | --- |
|  | **request-level** | **method-level** |
| **authorization type** | coarse-grained | fine-grained |
| **configuration location** | declared in a config class | local to method declaration |
| **configuration style** | DSL | Annotations |
| **authorization definitions** | programmatic | SpEL |

The main tradeoff seems to be where you want your authorization rules to live.

> [!NOTE]
> It’s important to remember that when you use annotation-based Method Security, then unannotated methods are not secured.
> To protect against this, declare [a catch-all authorization rule](authorize-http-requests.md#activate-request-security) in your [`HttpSecurity`](../configuration/java.md#jc-httpsecurity) instance.

<a id="authorizing-with-annotations"></a>

## Authorizing with Annotations

The primary way Spring Security enables method-level authorization support is through annotations that you can add to methods, classes, and interfaces.

<a id="use-preauthorize"></a>

### Authorizing Method Invocation with `@PreAuthorize`

When [Method Security is active](#activate-method-security), you can annotate a method with the [`@PreAuthorize`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/access/prepost/PreAuthorize.html) annotation like so:

#### Java

```java
@Component
public class BankService {
	@PreAuthorize("hasRole('ADMIN')")
	public Account readAccount(Long id) {
        // ... is only invoked if the `Authentication` has the `ROLE_ADMIN` authority
	}
}
```

#### Kotlin

```kotlin
@Component
open class BankService {
	@PreAuthorize("hasRole('ADMIN')")
	fun readAccount(val id: Long): Account {
        // ... is only invoked if the `Authentication` has the `ROLE_ADMIN` authority
	}
}
```

This is meant to indicate that the method can only be invoked if the provided expression `hasRole('ADMIN')` passes.

You can then [test the class](../test/method.md) to confirm it is enforcing the authorization rule like so:

#### Java

```java
@Autowired
BankService bankService;

@WithMockUser(roles="ADMIN")
@Test
void readAccountWithAdminRoleThenInvokes() {
    Account account = this.bankService.readAccount("12345678");
    // ... assertions
}

@WithMockUser(roles="WRONG")
@Test
void readAccountWithWrongRoleThenAccessDenied() {
    assertThatExceptionOfType(AccessDeniedException.class).isThrownBy(
        () -> this.bankService.readAccount("12345678"));
}
```

#### Kotlin

```kotlin
@WithMockUser(roles="ADMIN")
@Test
fun readAccountWithAdminRoleThenInvokes() {
    val account: Account = this.bankService.readAccount("12345678")
    // ... assertions
}

@WithMockUser(roles="WRONG")
@Test
fun readAccountWithWrongRoleThenAccessDenied() {
    assertThatExceptionOfType(AccessDeniedException::class.java).isThrownBy {
        this.bankService.readAccount("12345678")
    }
}
```

> [!TIP]
> `@PreAuthorize` also can be a [meta-annotation](#meta-annotations), be defined [at the class or interface level](#class-or-interface-annotations), and use [SpEL Authorization Expressions](#authorization-expressions).

While `@PreAuthorize` is quite helpful for declaring needed authorities, it can also be used to evaluate more complex [expressions that involve the method parameters](#using_method_parameters).

<a id="use-postauthorize"></a>

### Authorization Method Results with `@PostAuthorize`

When Method Security is active, you can annotate a method with the [`@PostAuthorize`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/access/prepost/PostAuthorize.html) annotation like so:

#### Java

```java
@Component
public class BankService {
	@PostAuthorize("returnObject.owner == authentication.name")
	public Account readAccount(Long id) {
        // ... is only returned if the `Account` belongs to the logged in user
	}
}
```

#### Kotlin

```kotlin
@Component
open class BankService {
	@PostAuthorize("returnObject.owner == authentication.name")
	fun readAccount(val id: Long): Account {
        // ... is only returned if the `Account` belongs to the logged in user
	}
}
```

This is meant to indicate that the method can only return the value if the provided expression `returnObject.owner == authentication.name` passes.
`returnObject` represents the `Account` object to be returned.

You can then [test the class](../test/method.md) to confirm it is enforcing the authorization rule:

#### Java

```java
@Autowired
BankService bankService;

@WithMockUser(username="owner")
@Test
void readAccountWhenOwnedThenReturns() {
    Account account = this.bankService.readAccount("12345678");
    // ... assertions
}

@WithMockUser(username="wrong")
@Test
void readAccountWhenNotOwnedThenAccessDenied() {
    assertThatExceptionOfType(AccessDeniedException.class).isThrownBy(
        () -> this.bankService.readAccount("12345678"));
}
```

#### Kotlin

```kotlin
@WithMockUser(username="owner")
@Test
fun readAccountWhenOwnedThenReturns() {
    val account: Account = this.bankService.readAccount("12345678")
    // ... assertions
}

@WithMockUser(username="wrong")
@Test
fun readAccountWhenNotOwnedThenAccessDenied() {
    assertThatExceptionOfType(AccessDeniedException::class.java).isThrownBy {
        this.bankService.readAccount("12345678")
    }
}
```

> [!TIP]
> `@PostAuthorize` also can be a [meta-annotation](#meta-annotations), be defined [at the class or interface level](#class-or-interface-annotations), and use [SpEL Authorization Expressions](#authorization-expressions).

`@PostAuthorize` is particularly helpful when defending against [Insecure Direct Object Reference](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html).
In fact, it can be defined as a [meta-annotation](#meta-annotations) like so:

#### Java

```java
@Target({ ElementType.METHOD, ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@PostAuthorize("returnObject.owner == authentication.name")
public @interface RequireOwnership {}
```

#### Kotlin

```kotlin
@Target(ElementType.METHOD, ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@PostAuthorize("returnObject.owner == authentication.name")
annotation class RequireOwnership
```

Allowing you to instead annotate the service in the following way:

#### Java

```java
@Component
public class BankService {
	@RequireOwnership
	public Account readAccount(Long id) {
        // ... is only returned if the `Account` belongs to the logged in user
	}
}
```

#### Kotlin

```kotlin
@Component
open class BankService {
	@RequireOwnership
	fun readAccount(val id: Long): Account {
        // ... is only returned if the `Account` belongs to the logged in user
	}
}
```

The result is that the above method will only return the `Account` if its `owner` attribute matches the logged-in user’s `name`.
If not, Spring Security will throw an `AccessDeniedException` and return a 403 status code.

<a id="use-prefilter"></a>

### Filtering Method Parameters with `@PreFilter`

> [!NOTE]
> `@PreFilter` is not yet supported for Kotlin-specific data types; for that reason, only Java snippets are shown

When Method Security is active, you can annotate a method with the [`@PreFilter`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/access/prepost/PreFilter.html) annotation like so:

#### Java

```java
@Component
public class BankService {
	@PreFilter("filterObject.owner == authentication.name")
	public Collection<Account> updateAccounts(Account... accounts) {
        // ... `accounts` will only contain the accounts owned by the logged-in user
        return updated;
	}
}
```

This is meant to filter out any values from `accounts` where the expression `filterObject.owner == authentication.name` fails.
`filterObject` represents each `account` in `accounts` and is used to test each `account`.

You can then test the class in the following way to confirm it is enforcing the authorization rule:

#### Java

```java
@Autowired
BankService bankService;

@WithMockUser(username="owner")
@Test
void updateAccountsWhenOwnedThenReturns() {
    Account ownedBy = ...
    Account notOwnedBy = ...
    Collection<Account> updated = this.bankService.updateAccounts(ownedBy, notOwnedBy);
    assertThat(updated).containsOnly(ownedBy);
}
```

> [!TIP]
> `@PreFilter` also can be a [meta-annotation](#meta-annotations), be defined [at the class or interface level](#class-or-interface-annotations), and use [SpEL Authorization Expressions](#authorization-expressions).

`@PreFilter` supports arrays, collections, maps, and streams (so long as the stream is still open).

For example, the above `updateAccounts` declaration will function the same way as the following other four:

#### Java

```java
@PreFilter("filterObject.owner == authentication.name")
public Collection<Account> updateAccounts(Account[] accounts)

@PreFilter("filterObject.owner == authentication.name")
public Collection<Account> updateAccounts(Collection<Account> accounts)

@PreFilter("filterObject.value.owner == authentication.name")
public Collection<Account> updateAccounts(Map<String, Account> accounts)

@PreFilter("filterObject.owner == authentication.name")
public Collection<Account> updateAccounts(Stream<Account> accounts)
```

The result is that the above method will only have the `Account` instances where their `owner` attribute matches the logged-in user’s `name`.

<a id="use-postfilter"></a>

### Filtering Method Results with `@PostFilter`

> [!NOTE]
> `@PostFilter` is not yet supported for Kotlin-specific data types; for that reason, only Java snippets are shown

When Method Security is active, you can annotate a method with the [`@PostFilter`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/access/prepost/PostFilter.html) annotation like so:

#### Java

```java
@Component
public class BankService {
	@PostFilter("filterObject.owner == authentication.name")
	public Collection<Account> readAccounts(String... ids) {
        // ... the return value will be filtered to only contain the accounts owned by the logged-in user
        return accounts;
	}
}
```

This is meant to filter out any values from the return value where the expression `filterObject.owner == authentication.name` fails.
`filterObject` represents each `account` in `accounts` and is used to test each `account`.

You can then test the class like so to confirm it is enforcing the authorization rule:

#### Java

```java
@Autowired
BankService bankService;

@WithMockUser(username="owner")
@Test
void readAccountsWhenOwnedThenReturns() {
    Collection<Account> accounts = this.bankService.updateAccounts("owner", "not-owner");
    assertThat(accounts).hasSize(1);
    assertThat(accounts.get(0).getOwner()).isEqualTo("owner");
}
```

> [!TIP]
> `@PostFilter` also can be a [meta-annotation](#meta-annotations), be defined [at the class or interface level](#class-or-interface-annotations), and use [SpEL Authorization Expressions](#authorization-expressions).

`@PostFilter` supports arrays, collections, maps, and streams (so long as the stream is still open).

For example, the above `readAccounts` declaration will function the same way as the following other three:

```java
@PostFilter("filterObject.owner == authentication.name")
public Account[] readAccounts(String... ids)

@PostFilter("filterObject.value.owner == authentication.name")
public Map<String, Account> readAccounts(String... ids)

@PostFilter("filterObject.owner == authentication.name")
public Stream<Account> readAccounts(String... ids)
```

The result is that the above method will return the `Account` instances where their `owner` attribute matches the logged-in user’s `name`.

> [!NOTE]
> In-memory filtering can obviously be expensive, and so be considerate of whether it is better to [filter the data in the data layer](../integrations/data.md) instead.

<a id="use-secured"></a>

### Authorizing Method Invocation with `@Secured`

[`@Secured`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/access/annotation/Secured.html) is a legacy option for authorizing invocations.
[`@PreAuthorize`](#use-preauthorize) supercedes it and is recommended instead.

To use the `@Secured` annotation, you should first change your Method Security declaration to enable it like so:

#### Java

```java
@EnableMethodSecurity(securedEnabled = true)
```

#### Kotlin

```kotlin
@EnableMethodSecurity(securedEnabled = true)
```

#### Xml

```xml
<sec:method-security secured-enabled="true"/>
```

This will cause Spring Security to publish [the corresponding method interceptor](#annotation-method-interceptors) that authorizes methods, classes, and interfaces annotated with `@Secured`.

<a id="use-jsr250"></a>

### Authorizing Method Invocation with JSR-250 Annotations

In case you would like to use [JSR-250](https://jcp.org/en/jsr/detail?id=250) annotations, Spring Security also supports that.
[`@PreAuthorize`](#use-preauthorize) has more expressive power and is thus recommended.

To use the JSR-250 annotations, you should first change your Method Security declaration to enable them like so:

#### Java

```java
@EnableMethodSecurity(jsr250Enabled = true)
```

#### Kotlin

```kotlin
@EnableMethodSecurity(jsr250Enabled = true)
```

#### Xml

```xml
<sec:method-security jsr250-enabled="true"/>
```

This will cause Spring Security to publish [the corresponding method interceptor](#annotation-method-interceptors) that authorizes methods, classes, and interfaces annotated with `@RolesAllowed`, `@PermitAll`, and `@DenyAll`.

<a id="class-or-interface-annotations"></a>

### Declaring Annotations at the Class or Interface Level

It’s also supported to have Method Security annotations at the class and interface level.

If it is at the class level like so:

#### Java

```java
@Controller
@PreAuthorize("hasAuthority('ROLE_USER')")
public class MyController {
    @GetMapping("/endpoint")
    public String endpoint() { ... }
}
```

#### Kotlin

```kotlin
@Controller
@PreAuthorize("hasAuthority('ROLE_USER')")
open class MyController {
    @GetMapping("/endpoint")
    fun endpoint(): String { ... }
}
```

then all methods inherit the class-level behavior.

Or, if it’s declared like the following at both the class and method level:

#### Java

```java
@Controller
@PreAuthorize("hasAuthority('ROLE_USER')")
public class MyController {
    @GetMapping("/endpoint")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public String endpoint() { ... }
}
```

#### Kotlin

```kotlin
@Controller
@PreAuthorize("hasAuthority('ROLE_USER')")
open class MyController {
    @GetMapping("/endpoint")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    fun endpoint(): String { ... }
}
```

then methods declaring the annotation override the class-level annotation.

The same is true for interfaces, with the exception that if a class inherits the annotation from two different interfaces, then startup will fail.
This is because Spring Security has no way to tell which one you want to use.

In cases like this, you can resolve the ambiguity by adding the annotation to the concrete method.

<a id="meta-annotations"></a>

### Using Meta Annotations

Method Security supports meta annotations.
This means that you can take any annotation and improve readability based on your application-specific use cases.

For example, you can simplify `@PreAuthorize("hasRole('ADMIN')")` to `@IsAdmin` like so:

#### Java

```java
@Target({ ElementType.METHOD, ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasRole('ADMIN')")
public @interface IsAdmin {}
```

#### Kotlin

```kotlin
@Target(ElementType.METHOD, ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasRole('ADMIN')")
annotation class IsAdmin
```

And the result is that on your secured methods you can now do the following instead:

#### Java

```java
@Component
public class BankService {
	@IsAdmin
	public Account readAccount(Long id) {
        // ... is only returned if the `Account` belongs to the logged in user
	}
}
```

#### Kotlin

```kotlin
@Component
open class BankService {
	@IsAdmin
	fun readAccount(val id: Long): Account {
        // ... is only returned if the `Account` belongs to the logged in user
	}
}
```

This results in more readable method definitions.

<a id="enable-annotation"></a>

### Enabling Certain Annotations

You can turn off `@EnableMethodSecurity`'s pre-configuration and replace it with you own.
You may choose to do this if you want to [customize the `AuthorizationManager`](#custom-authorization-managers) or `Pointcut`.
Or you may simply want to only enable a specific annotation, like `@PostAuthorize`.

You can do this in the following way:

#### Java

```java
@Configuration
@EnableMethodSecurity(prePostEnabled = false)
class MethodSecurityConfig {
	@Bean
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	Advisor postAuthorize() {
		return AuthorizationManagerAfterMethodInterceptor.postAuthorize();
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableMethodSecurity(prePostEnabled = false)
class MethodSecurityConfig {
	@Bean
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	fun postAuthorize() : Advisor {
		return AuthorizationManagerAfterMethodInterceptor.postAuthorize()
	}
}
```

#### Xml

```xml
<sec:method-security pre-post-enabled="false"/>

<aop:config/>

<bean id="postAuthorize"
	class="org.springframework.security.authorization.method.AuthorizationManagerBeforeMethodInterceptor"
	factory-method="postAuthorize"/>
```

The above snippet achieves this by first disabling Method Security’s pre-configurations and then publishing [the `@PostAuthorize` interceptor](#annotation-method-interceptors) itself.

<a id="use-intercept-methods"></a>

## Authorizing with `<intercept-methods>`

While using Spring Security’s [annotation-based support](#authorizing-with-annotations) is preferred for method security, you can also use XML to declare bean authorization rules.

If you need to declare it in your XML configuration instead, you can use [`<intercept-methods>`](../appendix/namespace/method-security.md#nsa-intercept-methods) like so:

#### Xml

```xml
<bean class="org.mycompany.MyController">
    <intercept-methods>
        <protect method="get*" access="hasAuthority('read')"/>
        <protect method="*" access="hasAuthority('write')"/>
    </intercept-methods>
</bean>
```

> [!NOTE]
> This only supports matching method by prefix or by name.
> If your needs are more complex than that, [use annotation support](#authorizing-with-annotations) instead.

<a id="use-programmatic-authorization"></a>

## Authorizing Methods Programmatically

As you’ve already seen, there are several ways that you can specify non-trivial authorization rules using [Method Security SpEL expressions](#authorization-expressions).

There are a number of ways that you can instead allow your logic to be Java-based instead of SpEL-based.
This gives use access the entire Java language for increased testability and flow control.

<a id="_using_a_custom_bean_in_spel"></a>

### Using a Custom Bean in SpEL

The first way to authorize a method programmatically is a two-step process.

First, declare a bean that has a method that takes a `MethodSecurityExpressionOperations` instance like the following:

#### Java

```java
@Component("authz")
public class AuthorizationLogic {
    public boolean decide(MethodSecurityExpressionOperations operations) {
        // ... authorization logic
    }
}
```

#### Kotlin

```kotlin
@Component("authz")
open class AuthorizationLogic {
    fun decide(val operations: MethodSecurityExpressionOperations): boolean {
        // ... authorization logic
    }
}
```

Then, reference that bean in your annotations in the following way:

#### Java

```java
@Controller
public class MyController {
    @PreAuthorize("@authz.decide(#root)")
    @GetMapping("/endpoint")
    public String endpoint() {
        // ...
    }
}
```

#### Kotlin

```kotlin
@Controller
open class MyController {
    @PreAuthorize("@authz.decide(#root)")
    @GetMapping("/endpoint")
    fun String endpoint() {
        // ...
    }
}
```

Spring Security will invoke the given method on that bean for each method invocation.

What’s nice about this is all your authorization logic is in a separate class that can be independently unit tested and verified for correctness.
It also has access to the full Java language.

<a id="custom-authorization-managers"></a>

### Using a Custom Authorization Manager

The second way to authorize a method programmatically is to create a custom [`AuthorizationManager`](architecture.md#_the_authorizationmanager).

First, declare an authorization manager instance, perhaps like this one:

#### Java

```java
@Component
public class MyAuthorizationManager implements AuthorizationManager<MethodInvocation>, AuthorizationManager<MethodInvocationResult> {
    @Override
    public AuthorizationDecision check(Supplier<Authentication> authentication, MethodInvocation invocation) {
        // ... authorization logic
    }

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authentication, MethodInvocationResult invocation) {
        // ... authorization logic
    }
}
```

#### Kotlin

```kotlin
@Component
class MyAuthorizationManager : AuthorizationManager<MethodInvocation>, AuthorizationManager<MethodInvocationResult> {
    override fun check(authentication: Supplier<Authentication>, invocation: MethodInvocation): AuthorizationDecision {
        // ... authorization logic
    }

    override fun check(authentication: Supplier<Authentication>, invocation: MethodInvocationResult): AuthorizationDecision {
        // ... authorization logic
    }
}
```

Then, publish the method interceptor with a pointcut that corresponds to when you want that `AuthorizationManager` to run.
For example, you could replace how `@PreAuthorize` and `@PostAuthorize` work like so:

#### Java

```java
@Configuration
@EnableMethodSecurity(prePostEnabled = false)
class MethodSecurityConfig {
    @Bean
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	Advisor preAuthorize(MyAuthorizationManager manager) {
		return AuthorizationManagerBeforeMethodInterceptor.preAuthorize(manager);
	}

	@Bean
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	Advisor postAuthorize(MyAuthorizationManager manager) {
		return AuthorizationManagerAfterMethodInterceptor.postAuthorize(manager);
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableMethodSecurity(prePostEnabled = false)
class MethodSecurityConfig {
   	@Bean
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	fun preAuthorize(val manager: MyAuthorizationManager) : Advisor {
		return AuthorizationManagerBeforeMethodInterceptor.preAuthorize(manager)
	}

	@Bean
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	fun postAuthorize(val manager: MyAuthorizationManager) : Advisor {
		return AuthorizationManagerAfterMethodInterceptor.postAuthorize(manager)
	}
}
```

#### Xml

```xml
<sec:method-security pre-post-enabled="false"/>

<aop:config/>

<bean id="preAuthorize"
	class="org.springframework.security.authorization.method.AuthorizationManagerBeforeMethodInterceptor"
	factory-method="preAuthorize">
    <constructor-arg ref="myAuthorizationManager"/>
</bean>

<bean id="postAuthorize"
	class="org.springframework.security.authorization.method.AuthorizationManagerAfterMethodInterceptor"
	factory-method="postAuthorize">
    <constructor-arg ref="myAuthorizationManager"/>
</bean>
```

> [!TIP]
> You can place your interceptor in between Spring Security method interceptors using the order constants specified in `AuthorizationInterceptorsOrder`.

<a id="customizing-expression-handling"></a>

### Customizing Expression Handling

Or, third, you can customize how each SpEL expression is handled.
To do that, you can expose a custom [`MethodSecurityExpressionHandler`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org.springframework.security.access.expression.method.MethodSecurityExpressionHandler.html), like so:

#### Java

```java
@Bean
static MethodSecurityExpressionHandler methodSecurityExpressionHandler(RoleHierarchy roleHierarchy) {
	DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
	handler.setRoleHierarchy(roleHierarchy);
	return handler;
}
```

#### Kotlin

```kotlin
companion object {
	@Bean
	fun methodSecurityExpressionHandler(val roleHierarchy: RoleHierarchy) : MethodSecurityExpressionHandler {
		val handler = DefaultMethodSecurityExpressionHandler()
		handler.setRoleHierarchy(roleHierarchy)
		return handler
	}
}
```

#### Xml

```xml
<sec:method-security>
	<sec:expression-handler ref="myExpressionHandler"/>
</sec:method-security>

<bean id="myExpressionHandler"
		class="org.springframework.security.messaging.access.expression.DefaultMessageSecurityExpressionHandler">
	<property name="roleHierarchy" ref="roleHierarchy"/>
</bean>
```

> [!TIP]
> We expose `MethodSecurityExpressionHandler` using a `static` method to ensure that Spring publishes it before it initializes Spring Security’s method security `@Configuration` classes

You can also [subclass `DefaultMessageSecurityExpressionHandler`](#subclass-defaultmethodsecurityexpressionhandler) to add your own custom authorization expressions beyond the defaults.

<a id="use-aspectj"></a>

## Authorizing with AspectJ

<a id="match-by-pointcut"></a>

### Matching Methods with Custom Pointcuts

Being built on Spring AOP, you can declare patterns that are not related to annotations, similar to [request-level authorization](authorize-http-requests.md).
This has the potential advantage of centralizing method-level authorization rules.

For example, you can use publish your own `Advisor` or use [`<protect-pointcut>`](../appendix/namespace/method-security.md#nsa-protect-pointcut) to match AOP expressions to authorization rules for your service layer like so:

#### Java

```java
import static org.springframework.security.authorization.AuthorityAuthorizationManager.hasRole

@Bean
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
static Advisor protectServicePointcut() {
    AspectJExpressionPointcut pattern = new AspectJExpressionPointcut()
    pattern.setExpression("execution(* com.mycompany.*Service.*(..))")
    return new AuthorizationManagerBeforeMethodInterceptor(pattern, hasRole("USER"))
}
```

#### Kotlin

```kotlin
import static org.springframework.security.authorization.AuthorityAuthorizationManager.hasRole

companion object {
    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    fun protectServicePointcut(): Advisor {
        val pattern = AspectJExpressionPointcut()
        pattern.setExpression("execution(* com.mycompany.*Service.*(..))")
        return new AuthorizationManagerBeforeMethodInterceptor(pattern, hasRole("USER"))
    }
}
```

#### Xml

```xml
<sec:method-security>
    <protect-pointcut expression="execution(* com.mycompany.*Service.*(..))" access="hasRole('USER')"/>
</sec:method-security>
```

<a id="weave-aspectj"></a>

### Integrate with AspectJ Byte-weaving

Performance can at times be enhanced by using AspectJ to weave Spring Security advice into the byte code of your beans.

After setting up AspectJ, you can quite simply state in the `@EnableMethodSecurity` annotation or `<method-security>` element that you are using AspectJ:

#### Java

```java
@EnableMethodSecurity(mode=AdviceMode.ASPECTJ)
```

#### Kotlin

```kotlin
@EnableMethodSecurity(mode=AdviceMode.ASPECTJ)
```

#### Xml

```xml
<sec:method-security mode="aspectj"/>
```

And the result will be that Spring Security will publish its advisors as AspectJ advice so that they can be woven in accordingly.

<a id="changing-the-order"></a>

## Specifying Order

As already noted, there is a Spring AOP method interceptor for each annotation, and each of these has a location in the Spring AOP advisor chain.

Namely, the `@PreFilter` method interceptor’s order is 100, `@PreAuthorize`'s is 200, and so on.

The reason this is important to note is that there are other AOP-based annotations like `@EnableTransactionManagement` that have an order of `Integer.MAX_VALUE`.
In other words, they are located at the end of the advisor chain by default.

At times, it can be valuable to have other advice execute before Spring Security.
For example, if you have a method annotated with `@Transactional` and `@PostAuthorize`, you might want the transaction to still be open when `@PostAuthorize` runs so that an `AccessDeniedException` will cause a rollback.

To get `@EnableTransactionManagement` to open a transaction before method authorization advice runs, you can set `@EnableTransactionManagement`'s order like so:

#### Java

```java
@EnableTransactionManagement(order = 0)
```

#### Kotlin

```kotlin
@EnableTransactionManagement(order = 0)
```

#### Xml

```xml
<tx:annotation-driven ref="txManager" order="0"/>
```

Since the earliest method interceptor (`@PreFilter`) is set to an order of 100, a setting of zero means that the transaction advice will run before all Spring Security advice.

<a id="authorization-expressions"></a>

## Expressing Authorization with SpEL

You’ve already seen several examples using SpEL, so now let’s cover the API a bit more in depth.

Spring Security encapsulates all of its authorization fields and methods in a set of root objects.
The most generic root object is called `SecurityExpressionRoot` and it forms the basis for `MethodSecurityExpressionRoot`.
Spring Security supplies this root object to `MethodSecurityEvaluationContext` when preparing to evaluate an authorization expression.

<a id="using-authorization-expression-fields-and-methods"></a>

### Using Authorization Expression Fields and Methods

The first thing this provides is an enhanced set of authorization fields and methods to your SpEL expressions.
What follows is a quick overview of the most common methods:

- `permitAll` - The method requires no authorization to be invoked; note that in this case, [the `Authentication`](../authentication/architecture.md#servlet-authentication-authentication) is never retrieved from the session
- `denyAll` - The method is not allowed under any circumstances; note that in this case, the `Authentication` is never retrieved from the session
- `hasAuthority` - The method requires that the `Authentication` have [a `GrantedAuthority`](architecture.md#authz-authorities) that matches the given value
- `hasRole` - A shortcut for `hasAuthority` that prefixes `ROLE_` or whatever is configured as the default prefix
- `hasAnyAuthority` - The method requires that the `Authentication` have a `GrantedAuthority` that matches any of the given values
- `hasAnyRole` - A shortcut for `hasAnyAuthority` that prefixes `ROLE_` or whatever is configured as the default prefix
- `hasPermission` - A hook into your `PermissionEvaluator` instance for doing object-level authorization

And here is a brief look at the most common fields:

- `authentication` - The `Authentication` instance associated with this method invocation
- `principal` - The `Authentication#getPrincipal` associated with this method invocation

Having now learned the patterns, rules, and how they can be paired together, you should be able to understand what is going on in this more complex example:

#### Java

```java
@Component
public class MyService {
    @PreAuthorize("denyAll") <1>
    MyResource myDeprecatedMethod(...);

    @PreAuthorize("hasRole('ADMIN')") <2>
    MyResource writeResource(...)

    @PreAuthorize("hasAuthority('db') and hasRole('ADMIN')") <3>
    MyResource deleteResource(...)

    @PreAuthorize("principal.claims['aud'] == 'my-audience'") <4>
    MyResource readResource(...);

	@PreAuthorize("@authz.check(authentication, #root)")
    MyResource shareResource(...);
}
```

#### Kotlin

```kotlin
@Component
open class MyService {
    @PreAuthorize("denyAll") <1>
    fun myDeprecatedMethod(...): MyResource

    @PreAuthorize("hasRole('ADMIN')") <2>
    fun writeResource(...): MyResource

    @PreAuthorize("hasAuthority('db') and hasRole('ADMIN')") <3>
    fun deleteResource(...): MyResource

    @PreAuthorize("principal.claims['aud'] == 'my-audience'") <4>
    fun readResource(...): MyResource

    @PreAuthorize("@authz.check(#root)")
    fun shareResource(...): MyResource
}
```

#### Xml

```xml
<sec:method-security>
    <protect-pointcut expression="execution(* com.mycompany.*Service.myDeprecatedMethod(..))" access="denyAll"/> <1>
    <protect-pointcut expression="execution(* com.mycompany.*Service.writeResource(..))" access="hasRole('ADMIN')"/> <2>
    <protect-pointcut expression="execution(* com.mycompany.*Service.deleteResource(..))" access="hasAuthority('db') and hasRole('ADMIN')"/> <3>
    <protect-pointcut expression="execution(* com.mycompany.*Service.readResource(..))" access="principal.claims['aud'] == 'my-audience'"/> <4>
    <protect-pointcut expression="execution(* com.mycompany.*Service.shareResource(..))" access="@authz.check(#root)"/> <5>
</sec:method-security>
```

1. This method may not be invoked by anyone for any reason
1. This method may only be invoked by `Authentication`s granted the `ROLE_ADMIN` authority
1. This method may only be invoked by `Authentication`s granted the `db` and `ROLE_ADMIN` authorities
1. This method may only be invoked by `Princpal`s with an `aud` claim equal to "my-audience"
1. This method may only be invoked if the bean `authz`'s `check` method returns `true`

<a id="using_method_parameters"></a>

### Using Method Parameters

Additionally, Spring Security provides a mechanism for discovering method parameters so they can also be accessed in the SpEL expression as well.

For a complete reference, Spring Security uses `DefaultSecurityParameterNameDiscoverer` to discover the parameter names.
By default, the following options are tried for a method.

1. If Spring Security’s `@P` annotation is present on a single argument to the method, the value is used.
The following example uses the `@P` annotation:

   #### Java

   ```java
   import org.springframework.security.access.method.P;

   ...

   @PreAuthorize("hasPermission(#c, 'write')")
   public void updateContact(@P("c") Contact contact);
   ```

   #### Kotlin

   ```kotlin
   import org.springframework.security.access.method.P

   ...

   @PreAuthorize("hasPermission(#c, 'write')")
   fun doSomething(@P("c") contact: Contact?)
   ```

   The intention of this expression is to require that the current `Authentication` have `write` permission specifically for this `Contact` instance.

   Behind the scenes, this is implemented by using `AnnotationParameterNameDiscoverer`, which you can customize to support the value attribute of any specified annotation.

   - If [Spring Data’s](../integrations/data.md) `@Param` annotation is present on at least one parameter for the method, the value is used.
   The following example uses the `@Param` annotation:

     #### Java

     ```java
     import org.springframework.data.repository.query.Param;

     ...

     @PreAuthorize("#n == authentication.name")
     Contact findContactByName(@Param("n") String name);
     ```

     #### Kotlin

     ```kotlin
     import org.springframework.data.repository.query.Param

     ...

     @PreAuthorize("#n == authentication.name")
     fun findContactByName(@Param("n") name: String?): Contact?
     ```

     The intention of this expression is to require that `name` be equal to `Authentication#getName` for the invocation to be authorized.

     Behind the scenes, this is implemented by using `AnnotationParameterNameDiscoverer`, which you can customize to support the value attribute of any specified annotation.
   - If you compile your code with the `-parameters` argument, the standard JDK reflection API is used to discover the parameter names.
   This works on both classes and interfaces.
   - Finally, if you compile your code with debug symbols, the parameter names are discovered by using the debug symbols.
   This does not work for interfaces, since they do not have debug information about the parameter names.
   For interfaces, either annotations or the `-parameters` approach must be used.

<a id="migration-enableglobalmethodsecurity"></a>

## Migrating from `@EnableGlobalMethodSecurity`

If you are using `@EnableGlobalMethodSecurity`, you should migrate to `@EnableMethodSecurity`.

<a id="servlet-replace-globalmethodsecurity-with-methodsecurity"></a>

### Replace [global method security](#jc-enable-global-method-security) with [method security](#jc-enable-method-security)

[`@EnableGlobalMethodSecurity`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/config/annotation/method/configuration/EnableGlobalMethodSecurity.html) and [`<global-method-security>`](../appendix/namespace/method-security.md#nsa-global-method-security) are deprecated in favor of [`@EnableMethodSecurity`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/config/annotation/method/configuration/EnableMethodSecurity.html) and [`<method-security>`](../appendix/namespace/method-security.md#nsa-method-security), respectively.
The new annotation and XML element activate Spring’s [pre-post annotations](#jc-enable-method-security) by default and use `AuthorizationManager` internally.

This means that the following two listings are functionally equivalent:

#### Java

```java
@EnableGlobalMethodSecurity(prePostEnabled = true)
```

#### Kotlin

```kotlin
@EnableGlobalMethodSecurity(prePostEnabled = true)
```

#### Xml

```xml
<global-method-security pre-post-enabled="true"/>
```

and:

#### Java

```java
@EnableMethodSecurity
```

#### Kotlin

```kotlin
@EnableMethodSecurity
```

#### Xml

```xml
<method-security/>
```

For applications not using the pre-post annotations, make sure to turn it off to avoid activating unwanted behavior.

For example, a listing like:

#### Java

```java
@EnableGlobalMethodSecurity(securedEnabled = true)
```

#### Kotlin

```kotlin
@EnableGlobalMethodSecurity(securedEnabled = true)
```

#### Xml

```xml
<global-method-security secured-enabled="true"/>
```

should change to:

#### Java

```java
@EnableMethodSecurity(securedEnabled = true, prePostEnabled = false)
```

#### Kotlin

```kotlin
@EnableMethodSecurity(securedEnabled = true, prePostEnabled = false)
```

#### Xml

```xml
<method-security secured-enabled="true" pre-post-enabled="false"/>
```

<a id="_use_a_custom_bean_instead_of_subclassing_defaultmethodsecurityexpressionhandler"></a>

### Use a Custom `@Bean` instead of subclassing `DefaultMethodSecurityExpressionHandler`

As a performance optimization, a new method was introduced to `MethodSecurityExpressionHandler` that takes a `Supplier<Authentication>` instead of an `Authentication`.

This allows Spring Security to defer the lookup of the `Authentication`, and is taken advantage of automatically when you use `@EnableMethodSecurity` instead of `@EnableGlobalMethodSecurity`.

However, let’s say that your code extends `DefaultMethodSecurityExpressionHandler` and overrides `createSecurityExpressionRoot(Authentication, MethodInvocation)` to return a custom `SecurityExpressionRoot` instance.
This will no longer work because the arrangement that `@EnableMethodSecurity` sets up calls `createEvaluationContext(Supplier<Authentication>, MethodInvocation)` instead.

Happily, such a level of customization is often unnecessary.
Instead, you can create a custom bean with the authorization methods that you need.

For example, let’s say you are wanting a custom evaluation of `@PostAuthorize("hasAuthority('ADMIN')")`.
You can create a custom `@Bean` like this one:

#### Java

```java
class MyAuthorizer {
	boolean isAdmin(MethodSecurityExpressionOperations root) {
		boolean decision = root.hasAuthority("ADMIN");
		// custom work ...
        return decision;
	}
}
```

#### Kotlin

```kotlin
class MyAuthorizer {
	fun isAdmin(val root: MethodSecurityExpressionOperations): boolean {
		val decision = root.hasAuthority("ADMIN");
		// custom work ...
        return decision;
	}
}
```

and then refer to it in the annotation like so:

#### Java

```java
@PreAuthorize("@authz.isAdmin(#root)")
```

#### Kotlin

```kotlin
@PreAuthorize("@authz.isAdmin(#root)")
```

<a id="subclass-defaultmethodsecurityexpressionhandler"></a>

#### I’d still prefer to subclass `DefaultMethodSecurityExpressionHandler`

If you must continue subclassing `DefaultMethodSecurityExpressionHandler`, you can still do so.
Instead, override the `createEvaluationContext(Supplier<Authentication>, MethodInvocation)` method like so:

#### Java

```java
@Component
class MyExpressionHandler extends DefaultMethodSecurityExpressionHandler {
    @Override
    public EvaluationContext createEvaluationContext(Supplier<Authentication> authentication, MethodInvocation mi) {
		StandardEvaluationContext context = (StandardEvaluationContext) super.createEvaluationContext(authentication, mi);
        MethodSecurityExpressionOperations delegate = (MethodSecurityExpressionOperations) context.getRootObject().getValue();
        MySecurityExpressionRoot root = new MySecurityExpressionRoot(delegate);
        context.setRootObject(root);
        return context;
    }
}
```

#### Kotlin

```kotlin
@Component
class MyExpressionHandler: DefaultMethodSecurityExpressionHandler {
    override fun createEvaluationContext(val authentication: Supplier<Authentication>,
        val mi: MethodInvocation): EvaluationContext {
		val context = super.createEvaluationContext(authentication, mi) as StandardEvaluationContext
        val delegate = context.getRootObject().getValue() as MethodSecurityExpressionOperations
        val root = MySecurityExpressionRoot(delegate)
        context.setRootObject(root)
        return context
    }
}
```

<a id="_further_reading"></a>

## Further Reading

Now that you have secured your application’s requests, please [secure its requests](authorize-http-requests.md) if you haven’t already.
You can also read further on [testing your application](../test/index.md) or on integrating Spring Security with other aspects of you application like [the data layer](../integrations/data.md) or [tracing and metrics](../integrations/observability.md).
