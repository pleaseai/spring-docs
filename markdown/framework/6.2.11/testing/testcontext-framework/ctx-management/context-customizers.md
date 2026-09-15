---
title: "Context Configuration with Context Customizers"
source: "ROOT:testing/testcontext-framework/ctx-management/context-customizers.adoc"
---

<a id="testcontext-context-customizers"></a>

# Context Configuration with Context Customizers

A `ContextCustomizer` is responsible for customizing the supplied
`ConfigurableApplicationContext` after bean definitions have been loaded into the context
but before the context has been refreshed.

A `ContextCustomizerFactory` is responsible for creating a `ContextCustomizer`, based on
some custom logic which determines if the `ContextCustomizer` is necessary for a given
test class — for example, based on the presence of a certain annotation. Factories are
invoked after `ContextLoaders` have processed context configuration attributes for a test
class but before the `MergedContextConfiguration` is created.

For example, Spring Framework provides the following `ContextCustomizerFactory`
implementation which is registered by default:

**`MockServerContainerContextCustomizerFactory`**

Creates a
`MockServerContainerContextCustomizer` if WebSocket support is present in the classpath
and the test class or one of its enclosing classes is annotated or meta-annotated with
`@WebAppConfiguration`. `MockServerContainerContextCustomizer` instantiates a new
`MockServerContainer` and stores it in the `ServletContext` under the attribute named
`jakarta.websocket.server.ServerContainer`.

<a id="testcontext-context-customizers-registration"></a>

## Registering `ContextCustomizerFactory` Implementations

You can register `ContextCustomizerFactory` implementations explicitly for a test class, its
subclasses, and its nested classes by using the `@ContextCustomizerFactories` annotation. See
[annotation support](../../annotations/integration-spring/annotation-contextcustomizerfactories.md)
and the javadoc for
[`@ContextCustomizerFactories`](https://docs.spring.io/spring-framework/docs/6.2.11/javadoc-api/org/springframework/test/context/ContextCustomizerFactories.html)
for details and examples.

<a id="testcontext-context-customizers-automatic-discovery"></a>

## Automatic Discovery of Default `ContextCustomizerFactory` Implementations

Registering `ContextCustomizerFactory` implementations by using `@ContextCustomizerFactories` is
suitable for custom factories that are used in limited testing scenarios. However, it can
become cumbersome if a custom factory needs to be used across an entire test suite. This
issue is addressed through support for automatic discovery of default
`ContextCustomizerFactory` implementations through the `SpringFactoriesLoader` mechanism.

For example, the modules that make up the testing support in Spring Framework and Spring
Boot declare all core default `ContextCustomizerFactory` implementations under the
`org.springframework.test.context.ContextCustomizerFactory` key in their
`META-INF/spring.factories` properties files. The `spring.factories` file for the
`spring-test` module can be viewed
[here](https://github.com/spring-projects/spring-framework/tree/main/spring-test/src/main/resources/META-INF/spring.factories).
Third-party frameworks and developers can contribute their own `ContextCustomizerFactory`
implementations to the list of default factories in the same manner through their own
`spring.factories` files.

<a id="testcontext-context-customizers-merging"></a>

## Merging `ContextCustomizerFactory` Implementations

If a custom `ContextCustomizerFactory` is registered via `@ContextCustomizerFactories`, it
will be *merged* with the default factories that have been registered using the aforementioned
[automatic discovery mechanism](#testcontext-context-customizers-automatic-discovery).

The merging algorithm ensures that duplicates are removed from the list and that locally
declared factories are appended to the list of default factories when merged.

> [!TIP]
> To replace the default factories for a test class, its subclasses, and its nested
> classes, you can set the `mergeMode` attribute of `@ContextCustomizerFactories` to
> `MergeMode.REPLACE_DEFAULTS`.
