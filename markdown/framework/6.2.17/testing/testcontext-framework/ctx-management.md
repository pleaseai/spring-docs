---
title: "Context Management"
source: "ROOT:testing/testcontext-framework/ctx-management.adoc"
---

<a id="testcontext-ctx-management"></a>

# Context Management

Each `TestContext` provides context management and caching support for the test instance
for which it is responsible. Test instances do not automatically receive access to the
configured `ApplicationContext`. However, if a test class implements the
`ApplicationContextAware` interface, a reference to the `ApplicationContext` is supplied
to the test instance. Note that `AbstractJUnit4SpringContextTests` and
`AbstractTestNGSpringContextTests` implement `ApplicationContextAware` and, therefore,
provide access to the `ApplicationContext` automatically.

> [!TIP]
> As an alternative to implementing the `ApplicationContextAware` interface, you can inject
> the application context for your test class through the `@Autowired` annotation on either
> a field or setter method, as the following example shows:
>
> #### Java
>
> ```java
> @SpringJUnitConfig
> class MyTest {
>
> 	@Autowired // <1>
> 	ApplicationContext applicationContext;
>
> 	// class body...
> }
> ```
>
> 1. Injecting the `ApplicationContext`.
>
> #### Kotlin
>
> ```kotlin
> @SpringJUnitConfig
> class MyTest {
>
> 	@Autowired // <1>
> 	lateinit var applicationContext: ApplicationContext
>
> 	// class body...
> }
> ```
>
> 1. Injecting the `ApplicationContext`.
>
> Similarly, if your test is configured to load a `WebApplicationContext`, you can inject
> the web application context into your test, as follows:
>
> #### Java
>
> ```java
> @SpringJUnitWebConfig // <1>
> class MyWebAppTest {
>
> 	@Autowired // <2>
> 	WebApplicationContext wac;
>
> 	// class body...
> }
> ```
>
> 1. Configuring the `WebApplicationContext`.
> 1. Injecting the `WebApplicationContext`.
>
> #### Kotlin
>
> ```kotlin
> @SpringJUnitWebConfig // <1>
> class MyWebAppTest {
>
> 	@Autowired // <2>
> 	lateinit var wac: WebApplicationContext
> 	// class body...
> }
> ```
>
> 1. Configuring the `WebApplicationContext`.
> 1. Injecting the `WebApplicationContext`.
>
> Dependency injection by using `@Autowired` is provided by the
> `DependencyInjectionTestExecutionListener`, which is configured by default
> (see [Dependency Injection of Test Fixtures](fixture-di.md)).

Test classes that use the TestContext framework do not need to extend any particular
class or implement a specific interface to configure their application context. Instead,
configuration is achieved by declaring the `@ContextConfiguration` annotation at the
class level. If your test class does not explicitly declare component classes or resource
locations, the configured `ContextLoader` determines how to load a context from *default*
configuration classes or a *default* location. In addition to component classes and
context resource locations, an application context can also be configured through
[context customizers](ctx-management/context-customizers.md)
or [context initializers](ctx-management/initializers.md).

The following sections explain how to use `@ContextConfiguration` and related annotations
to configure a test `ApplicationContext` by using component classes (typically
`@Configuration` classes), XML configuration files, Groovy scripts, context customizers,
or context initializers. Alternatively, you can implement and configure your own custom
`SmartContextLoader` for advanced use cases.

- [Context Configuration with Component Classes](ctx-management/javaconfig.md)
- [Context Configuration with XML resources](ctx-management/xml.md)
- [Context Configuration with Groovy Scripts](ctx-management/groovy.md)
- [Mixing Component Classes, XML, and Groovy Scripts](ctx-management/mixed-config.md)
- [Context Configuration with Context Customizers](ctx-management/context-customizers.md)
- [Context Configuration with Context Initializers](ctx-management/initializers.md)
- [Context Configuration Inheritance](ctx-management/inheritance.md)
- [Context Configuration with Environment Profiles](ctx-management/env-profiles.md)
- [Context Configuration with Test Property Sources](ctx-management/property-sources.md)
- [Context Configuration with Dynamic Property Sources](ctx-management/dynamic-property-sources.md)
- [Loading a `WebApplicationContext`](ctx-management/web.md)
- [Context Caching](ctx-management/caching.md)
- [Context Failure Threshold](ctx-management/failure-threshold.md)
- [Context Hierarchies](ctx-management/hierarchies.md)
