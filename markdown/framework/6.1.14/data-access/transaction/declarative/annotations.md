---
title: "Using `@Transactional`"
source: "ROOT:data-access/transaction/declarative/annotations.adoc"
---

<a id="transaction-declarative-annotations"></a>

# Using `@Transactional`

In addition to the XML-based declarative approach to transaction configuration, you can
use an annotation-based approach. Declaring transaction semantics directly in the Java
source code puts the declarations much closer to the affected code. There is not much
danger of undue coupling, because code that is meant to be used transactionally is
almost always deployed that way anyway.

> [!NOTE]
> The standard `jakarta.transaction.Transactional` annotation is also supported as
> a drop-in replacement to Spring’s own annotation. Please refer to the JTA documentation
> for more details.

The ease-of-use afforded by the use of the `@Transactional` annotation is best
illustrated with an example, which is explained in the text that follows.
Consider the following class definition:

#### Java

```java
// the service class that we want to make transactional
@Transactional
public class DefaultFooService implements FooService {

	@Override
	public Foo getFoo(String fooName) {
		// ...
	}

	@Override
	public Foo getFoo(String fooName, String barName) {
		// ...
	}

	@Override
	public void insertFoo(Foo foo) {
		// ...
	}

	@Override
	public void updateFoo(Foo foo) {
		// ...
	}
}
```

#### Kotlin

```kotlin
// the service class that we want to make transactional
@Transactional
class DefaultFooService : FooService {

	override fun getFoo(fooName: String): Foo {
		// ...
	}

	override fun getFoo(fooName: String, barName: String): Foo {
		// ...
	}

	override fun insertFoo(foo: Foo) {
		// ...
	}

	override fun updateFoo(foo: Foo) {
		// ...
	}
}
```

Used at the class level as above, the annotation indicates a default for all methods
of the declaring class (as well as its subclasses). Alternatively, each method can be
annotated individually. See
[method visibility](#transaction-declarative-annotations-method-visibility)
for further details on which methods Spring considers transactional. Note that a class-level
annotation does not apply to ancestor classes up the class hierarchy; in such a scenario,
inherited methods need to be locally redeclared in order to participate in a
subclass-level annotation.

When a POJO class such as the one above is defined as a bean in a Spring context,
you can make the bean instance transactional through an `@EnableTransactionManagement`
annotation in a `@Configuration` class. See the
[javadoc](https://docs.spring.io/spring-framework/docs/6.1.14/javadoc-api/org/springframework/transaction/annotation/EnableTransactionManagement.html)
for full details.

In XML configuration, the `<tx:annotation-driven/>` tag provides similar convenience:

```xml
<!-- from the file 'context.xml' -->
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:aop="http://www.springframework.org/schema/aop"
	xmlns:tx="http://www.springframework.org/schema/tx"
	xsi:schemaLocation="
		http://www.springframework.org/schema/beans
		https://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/tx
		https://www.springframework.org/schema/tx/spring-tx.xsd
		http://www.springframework.org/schema/aop
		https://www.springframework.org/schema/aop/spring-aop.xsd">

	<!-- this is the service object that we want to make transactional -->
	<bean id="fooService" class="x.y.service.DefaultFooService"/>

	<!-- enable the configuration of transactional behavior based on annotations -->
	<!-- a TransactionManager is still required -->
	<tx:annotation-driven transaction-manager="txManager"/> <1>

	<bean id="txManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
		<!-- (this dependency is defined somewhere else) -->
		<property name="dataSource" ref="dataSource"/>
	</bean>

	<!-- other <bean/> definitions here -->

</beans>
```

1. The line that makes the bean instance transactional.

> [!TIP]
> You can omit the `transaction-manager` attribute in the `<tx:annotation-driven/>`
> tag if the bean name of the `TransactionManager` that you want to wire in has the name
> `transactionManager`. If the `TransactionManager` bean that you want to dependency-inject
> has any other name, you have to use the `transaction-manager` attribute, as in the
> preceding example.

Reactive transactional methods use reactive return types in contrast to imperative
programming arrangements as the following listing shows:

#### Java

```java
// the reactive service class that we want to make transactional
@Transactional
public class DefaultFooService implements FooService {

	@Override
	public Publisher<Foo> getFoo(String fooName) {
		// ...
	}

	@Override
	public Mono<Foo> getFoo(String fooName, String barName) {
		// ...
	}

	@Override
	public Mono<Void> insertFoo(Foo foo) {
		// ...
	}

	@Override
	public Mono<Void> updateFoo(Foo foo) {
		// ...
	}
}
```

#### Kotlin

```kotlin
// the reactive service class that we want to make transactional
@Transactional
class DefaultFooService : FooService {

	override fun getFoo(fooName: String): Flow<Foo> {
		// ...
	}

	override fun getFoo(fooName: String, barName: String): Mono<Foo> {
		// ...
	}

	override fun insertFoo(foo: Foo): Mono<Void> {
		// ...
	}

	override fun updateFoo(foo: Foo): Mono<Void> {
		// ...
	}
}
```

Note that there are special considerations for the returned `Publisher` with regards to
Reactive Streams cancellation signals. See the
[Cancel Signals](../programmatic.md#tx-prog-operator-cancel)
section under "Using the TransactionalOperator" for more details.

<a id="transaction-declarative-annotations-method-visibility"></a>

> [!NOTE]
> The `@Transactional` annotation is typically used on methods with `public` visibility.
> As of 6.0, `protected` or package-visible methods can also be made transactional for
> class-based proxies by default. Note that transactional methods in interface-based
> proxies must always be `public` and defined in the proxied interface. For both kinds
> of proxies, only external method calls coming in through the proxy are intercepted.
>
> If you prefer consistent treatment of method visibility across the different kinds of
> proxies (which was the default up until 5.3), consider specifying `publicMethodsOnly`:
>
> ```java
> /**
>  * Register a custom AnnotationTransactionAttributeSource with the
>  * publicMethodsOnly flag set to true to consistently ignore non-public methods.
>  * @see ProxyTransactionManagementConfiguration#transactionAttributeSource()
>  */
> @Bean
> TransactionAttributeSource transactionAttributeSource() {
> 	return new AnnotationTransactionAttributeSource(true);
> }
> ```
>
> The *Spring TestContext Framework* supports non-private `@Transactional` test methods
> by default as well. See [Transaction Management](../../../testing/testcontext-framework/tx.md)
> in the testing chapter for examples.

You can apply the `@Transactional` annotation to an interface definition, a method
on an interface, a class definition, or a method on a class. However, the mere presence
of the `@Transactional` annotation is not enough to activate the transactional behavior.
The `@Transactional` annotation is merely metadata that can be consumed by corresponding
runtime infrastructure which uses that metadata to configure the appropriate beans with
transactional behavior. In the preceding example, the `<tx:annotation-driven/>` element
switches on actual transaction management at runtime.

> [!TIP]
> The Spring team recommends that you annotate methods of concrete classes with the
> `@Transactional` annotation, rather than relying on annotated methods in interfaces,
> even if the latter does work for interface-based and target-class proxies as of 5.0.
> Since Java annotations are not inherited from interfaces, interface-declared annotations
> are still not recognized by the weaving infrastructure when using AspectJ mode, so the
> aspect does not get applied. As a consequence, your transaction annotations may be
> silently ignored: Your code might appear to "work" until you test a rollback scenario.

> [!NOTE]
> In proxy mode (which is the default), only external method calls coming in through
> the proxy are intercepted. This means that self-invocation (in effect, a method within
> the target object calling another method of the target object) does not lead to an actual
> transaction at runtime even if the invoked method is marked with `@Transactional`. Also,
> the proxy must be fully initialized to provide the expected behavior, so you should not
> rely on this feature in your initialization code — e.g. in a `@PostConstruct` method.

Consider using AspectJ mode (see the `mode` attribute in the following table) if you
expect self-invocations to be wrapped with transactions as well. In this case, there is
no proxy in the first place. Instead, the target class is woven (that is, its byte code
is modified) to support `@Transactional` runtime behavior on any kind of method.

<a id="tx-annotation-driven-settings"></a>

| XML Attribute | Annotation Attribute | Default | Description |
| --- | --- | --- | --- |
| `transaction-manager` | N/A (see [`TransactionManagementConfigurer`](https://docs.spring.io/spring-framework/docs/6.1.14/javadoc-api/org/springframework/transaction/annotation/TransactionManagementConfigurer.html) javadoc) | `transactionManager` | Name of the transaction manager to use. Required only if the name of the transaction manager is not `transactionManager`, as in the preceding example. |
| `mode` | `mode` | `proxy` | The default mode (`proxy`) processes annotated beans to be proxied by using Spring’s AOP framework (following proxy semantics, as discussed earlier, applying to method calls coming in through the proxy only). The alternative mode (`aspectj`) instead weaves the affected classes with Spring’s AspectJ transaction aspect, modifying the target class byte code to apply to any kind of method call. AspectJ weaving requires `spring-aspects.jar` in the classpath as well as having load-time weaving (or compile-time weaving) enabled. (See [Spring configuration](../../../core/aop/using-aspectj.md#aop-aj-ltw-spring) for details on how to set up load-time weaving.) |
| `proxy-target-class` | `proxyTargetClass` | `false` | Applies to `proxy` mode only. Controls what type of transactional proxies are created for classes annotated with the `@Transactional` annotation. If the `proxy-target-class` attribute is set to `true`, class-based proxies are created. If `proxy-target-class` is `false` or if the attribute is omitted, then standard JDK interface-based proxies are created. (See [Proxying Mechanisms](../../../core/aop/proxying.md) for a detailed examination of the different proxy types.) |
| `order` | `order` | `Ordered.LOWEST_PRECEDENCE` | Defines the order of the transaction advice that is applied to beans annotated with `@Transactional`. (For more information about the rules related to ordering of AOP advice, see [Advice Ordering](../../../core/aop/ataspectj/advice.md#aop-ataspectj-advice-ordering).) No specified ordering means that the AOP subsystem determines the order of the advice. |

> [!NOTE]
> The default advice mode for processing `@Transactional` annotations is `proxy`,
> which allows for interception of calls through the proxy only. Local calls within the
> same class cannot get intercepted that way. For a more advanced mode of interception,
> consider switching to `aspectj` mode in combination with compile-time or load-time weaving.

> [!NOTE]
> The `proxy-target-class` attribute controls what type of transactional proxies are
> created for classes annotated with the `@Transactional` annotation. If
> `proxy-target-class` is set to `true`, class-based proxies are created. If
> `proxy-target-class` is `false` or if the attribute is omitted, standard JDK
> interface-based proxies are created. (See [Proxying Mechanisms](../../../core/aop/proxying.md)
> for a discussion of the different proxy types.)

> [!NOTE]
> `@EnableTransactionManagement` and `<tx:annotation-driven/>` look for
> `@Transactional` only on beans in the same application context in which they are defined.
> This means that, if you put annotation-driven configuration in a `WebApplicationContext`
> for a `DispatcherServlet`, it checks for `@Transactional` beans only in your controllers
> and not in your services. See [MVC](../../../web/webmvc/mvc-servlet.md) for more information.

The most derived location takes precedence when evaluating the transactional settings
for a method. In the case of the following example, the `DefaultFooService` class is
annotated at the class level with the settings for a read-only transaction, but the
`@Transactional` annotation on the `updateFoo(Foo)` method in the same class takes
precedence over the transactional settings defined at the class level.

#### Java

```java
@Transactional(readOnly = true)
public class DefaultFooService implements FooService {

	public Foo getFoo(String fooName) {
		// ...
	}

	// these settings have precedence for this method
	@Transactional(readOnly = false, propagation = Propagation.REQUIRES_NEW)
	public void updateFoo(Foo foo) {
		// ...
	}
}
```

#### Kotlin

```kotlin
@Transactional(readOnly = true)
class DefaultFooService : FooService {

	override fun getFoo(fooName: String): Foo {
		// ...
	}

	// these settings have precedence for this method
	@Transactional(readOnly = false, propagation = Propagation.REQUIRES_NEW)
	override fun updateFoo(foo: Foo) {
		// ...
	}
}
```

<a id="transaction-declarative-attransactional-settings"></a>

## `@Transactional` Settings

The `@Transactional` annotation is metadata that specifies that an interface, class,
or method must have transactional semantics (for example, "start a brand new read-only
transaction when this method is invoked, suspending any existing transaction").
The default `@Transactional` settings are as follows:

- The propagation setting is `PROPAGATION_REQUIRED.`
- The isolation level is `ISOLATION_DEFAULT.`
- The transaction is read-write.
- The transaction timeout defaults to the default timeout of the underlying transaction
system, or to none if timeouts are not supported.
- Any `RuntimeException` or `Error` triggers rollback, and any checked `Exception` does
not.

You can change these default settings. The following table summarizes the various
properties of the `@Transactional` annotation:

<a id="tx-attransactional-properties"></a>

| Property | Type | Description |
| --- | --- | --- |
| [value](#tx-multiple-tx-mgrs-with-attransactional) | `String` | Optional qualifier that specifies the transaction manager to be used. |
| `transactionManager` | `String` | Alias for `value`. |
| `label` | Array of `String` labels to add an expressive description to the transaction. | Labels may be evaluated by transaction managers to associate implementation-specific behavior with the actual transaction. |
| [propagation](tx-propagation.md) | `enum`: `Propagation` | Optional propagation setting. |
| `isolation` | `enum`: `Isolation` | Optional isolation level. Applies only to propagation values of `REQUIRED` or `REQUIRES_NEW`. |
| `timeout` | `int` (in seconds of granularity) | Optional transaction timeout. Applies only to propagation values of `REQUIRED` or `REQUIRES_NEW`. |
| `timeoutString` | `String` (in seconds of granularity) | Alternative for specifying the `timeout` in seconds as a `String` value — for example, as a placeholder. |
| `readOnly` | `boolean` | Read-write versus read-only transaction. Only applicable to values of `REQUIRED` or `REQUIRES_NEW`. |
| `rollbackFor` | Array of `Class` objects, which must be derived from `Throwable.` | Optional array of exception types that must cause rollback. |
| `rollbackForClassName` | Array of exception name patterns. | Optional array of exception name patterns that must cause rollback. |
| `noRollbackFor` | Array of `Class` objects, which must be derived from `Throwable.` | Optional array of exception types that must not cause rollback. |
| `noRollbackForClassName` | Array of exception name patterns. | Optional array of exception name patterns that must not cause rollback. |

> [!TIP]
> See
> [Rollback rules](rolling-back.md#transaction-declarative-rollback-rules)
> for further details on rollback rule semantics, patterns, and warnings
> regarding possible unintentional matches for pattern-based rollback rules.

Currently, you cannot have explicit control over the name of a transaction, where 'name'
means the transaction name that appears in a transaction monitor and in logging output.
For declarative transactions, the transaction name is always the fully-qualified class
name + `.` + the method name of the transactionally advised class. For example, if the
`handlePayment(..)` method of the `BusinessService` class started a transaction, the
name of the transaction would be: `com.example.BusinessService.handlePayment`.

<a id="tx-multiple-tx-mgrs-with-attransactional"></a>

## Multiple Transaction Managers with `@Transactional`

Most Spring applications need only a single transaction manager, but there may be
situations where you want multiple independent transaction managers in a single
application. You can use the `value` or `transactionManager` attribute of the
`@Transactional` annotation to optionally specify the identity of the
`TransactionManager` to be used. This can either be the bean name or the qualifier value
of the transaction manager bean. For example, using the qualifier notation, you can
combine the following Java code with the following transaction manager bean declarations
in the application context:

#### Java

```java
public class TransactionalService {

	@Transactional("order")
	public void setSomething(String name) { ... }

	@Transactional("account")
	public void doSomething() { ... }

	@Transactional("reactive-account")
	public Mono<Void> doSomethingReactive() { ... }
}
```

#### Kotlin

```kotlin
class TransactionalService {

	@Transactional("order")
	fun setSomething(name: String) {
		// ...
	}

	@Transactional("account")
	fun doSomething() {
		// ...
	}

	@Transactional("reactive-account")
	fun doSomethingReactive(): Mono<Void> {
		// ...
	}
}
```

The following listing shows the bean declarations:

```xml
<tx:annotation-driven/>

	<bean id="transactionManager1" class="org.springframework.jdbc.support.JdbcTransactionManager">
		...
		<qualifier value="order"/>
	</bean>

	<bean id="transactionManager2" class="org.springframework.jdbc.support.JdbcTransactionManager">
		...
		<qualifier value="account"/>
	</bean>

	<bean id="transactionManager3" class="org.springframework.data.r2dbc.connection.R2dbcTransactionManager">
		...
		<qualifier value="reactive-account"/>
	</bean>
```

In this case, the individual methods on `TransactionalService` run under separate
transaction managers, differentiated by the `order`, `account`, and `reactive-account`
qualifiers. The default `<tx:annotation-driven>` target bean name, `transactionManager`,
is still used if no specifically qualified `TransactionManager` bean is found.

<a id="tx-custom-attributes"></a>

## Custom Composed Annotations

If you find you repeatedly use the same attributes with `@Transactional` on many different
methods, [Spring’s meta-annotation support](../../../core/beans/classpath-scanning.md#beans-meta-annotations) lets you
define custom composed annotations for your specific use cases. For example, consider the
following annotation definitions:

#### Java

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Transactional(transactionManager = "order", label = "causal-consistency")
public @interface OrderTx {
}

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Transactional(transactionManager = "account", label = "retryable")
public @interface AccountTx {
}
```

#### Kotlin

```kotlin
@Target(AnnotationTarget.FUNCTION, AnnotationTarget.TYPE)
@Retention(AnnotationRetention.RUNTIME)
@Transactional(transactionManager = "order", label = ["causal-consistency"])
annotation class OrderTx

@Target(AnnotationTarget.FUNCTION, AnnotationTarget.TYPE)
@Retention(AnnotationRetention.RUNTIME)
@Transactional(transactionManager = "account", label = ["retryable"])
annotation class AccountTx
```

The preceding annotations let us write the example from the previous section as follows:

#### Java

```java
public class TransactionalService {

	@OrderTx
	public void setSomething(String name) {
		// ...
	}

	@AccountTx
	public void doSomething() {
		// ...
	}
}
```

#### Kotlin

```kotlin
class TransactionalService {

	@OrderTx
	fun setSomething(name: String) {
		// ...
	}

	@AccountTx
	fun doSomething() {
		// ...
	}
}
```

In the preceding example, we used the syntax to define the transaction manager qualifier
and transactional labels, but we could also have included propagation behavior,
rollback rules, timeouts, and other features.
