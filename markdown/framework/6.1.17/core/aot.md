---
title: "Ahead of Time Optimizations"
source: "ROOT:core/aot.adoc"
---

<a id="aot"></a>

# Ahead of Time Optimizations

This chapter covers Spring’s Ahead of Time (AOT) optimizations.

For AOT support specific to integration tests, see [Ahead of Time Support for Tests](../testing/testcontext-framework/aot.md).

<a id="aot.introduction"></a>

## Introduction to Ahead of Time Optimizations

Spring’s support for AOT optimizations is meant to inspect an `ApplicationContext` at build time and apply decisions and discovery logic that usually happens at runtime.
Doing so allows building an application startup arrangement that is more straightforward and focused on a fixed set of features based mainly on the classpath and the `Environment`.

Applying such optimizations early implies the following restrictions:

- The classpath is fixed and fully defined at build time.
- The beans defined in your application cannot change at runtime, meaning:

  - `@Profile`, in particular profile-specific configuration, needs to be chosen at build time and is automatically enabled at runtime when AOT is enabled.
  - `Environment` properties that impact the presence of a bean (`@Conditional`) are only considered at build time.
- Bean definitions with instance suppliers (lambdas or method references) cannot be transformed ahead-of-time.
- Beans registered as singletons (using `registerSingleton`, typically from
`ConfigurableListableBeanFactory`) cannot be transformed ahead-of-time either.
- As we cannot rely on the instance, make sure that the bean type is as precise as
possible.

> [!TIP]
> See also the [Best Practices](#aot.bestpractices) section.

When these restrictions are in place, it becomes possible to perform ahead-of-time processing at build time and generate additional assets.
A Spring AOT processed application typically generates:

- Java source code
- Bytecode (usually for dynamic proxies)
- [`RuntimeHints`](https://docs.spring.io/spring-framework/docs/6.1.17/javadoc-api/org/springframework/aot/hint/RuntimeHints.html) for the use of reflection, resource loading, serialization, and JDK proxies

> [!NOTE]
> At the moment, AOT is focused on allowing Spring applications to be deployed as native images using GraalVM.
> We intend to support more JVM-based use cases in future generations.

<a id="aot.basics"></a>

## AOT Engine Overview

The entry point of the AOT engine for processing an `ApplicationContext` is `ApplicationContextAotGenerator`. It takes care of the following steps, based on a `GenericApplicationContext` that represents the application to optimize and a [`GenerationContext`](https://docs.spring.io/spring-framework/docs/6.1.17/javadoc-api/org/springframework/aot/generate/GenerationContext.html):

- Refresh an `ApplicationContext` for AOT processing. Contrary to a traditional refresh, this version only creates bean definitions, not bean instances.
- Invoke the available `BeanFactoryInitializationAotProcessor` implementations and apply their contributions against the `GenerationContext`.
For instance, a core implementation iterates over all candidate bean definitions and generates the necessary code to restore the state of the `BeanFactory`.

Once this process completes, the `GenerationContext` will have been updated with the generated code, resources, and classes that are necessary for the application to run.
The `RuntimeHints` instance can also be used to generate the relevant GraalVM native image configuration files.

`ApplicationContextAotGenerator#processAheadOfTime` returns the class name of the `ApplicationContextInitializer` entry point that allows the context to be started with AOT optimizations.

Those steps are covered in greater detail in the sections below.

<a id="aot.refresh"></a>

## Refresh for AOT Processing

Refresh for AOT processing is supported on all `GenericApplicationContext` implementations.
An application context is created with any number of entry points, usually in the form of `@Configuration`-annotated classes.

Let’s look at a basic example:

```java
	@Configuration(proxyBeanMethods=false)
	@ComponentScan
	@Import({DataSourceConfiguration.class, ContainerConfiguration.class})
	public class MyApplication {
	}
```

Starting this application with the regular runtime involves a number of steps including classpath scanning, configuration class parsing, bean instantiation, and lifecycle callback handling.
Refresh for AOT processing only applies a subset of what happens with a [regular `refresh`](beans/introduction.md).
AOT processing can be triggered as follows:

```java
		RuntimeHints hints = new RuntimeHints();
		AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
		context.register(MyApplication.class);
		context.refreshForAotProcessing(hints);
		// ...
		context.close();
```

In this mode, [`BeanFactoryPostProcessor` implementations](beans/factory-extension.md#beans-factory-extension-factory-postprocessors) are invoked as usual.
This includes configuration class parsing, import selectors, classpath scanning, etc.
Such steps make sure that the `BeanRegistry` contains the relevant bean definitions for the application.
If bean definitions are guarded by conditions (such as `@Profile`), these are evaluated,
and bean definitions that don’t match their conditions are discarded at this stage.

If custom code needs to register extra beans programmatically, make sure that custom
registration code uses `BeanDefinitionRegistry` instead of `BeanFactory` as only bean
definitions are taken into account. A good pattern is to implement
`ImportBeanDefinitionRegistrar` and register it via an `@Import` on one of your
configuration classes.

Because this mode does not actually create bean instances, `BeanPostProcessor` implementations are not invoked, except for specific variants that are relevant for AOT processing.
These are:

- `MergedBeanDefinitionPostProcessor` implementations post-process bean definitions to extract additional settings, such as `init` and `destroy` methods.
- `SmartInstantiationAwareBeanPostProcessor` implementations determine a more precise bean type if necessary.
This makes sure to create any proxy that will be required at runtime.

Once this part completes, the `BeanFactory` contains the bean definitions that are necessary for the application to run. It does not trigger bean instantiation but allows the AOT engine to inspect the beans that will be created at runtime.

<a id="aot.bean-factory-initialization-contributions"></a>

## Bean Factory Initialization AOT Contributions

Components that want to participate in this step can implement the [`BeanFactoryInitializationAotProcessor`](https://docs.spring.io/spring-framework/docs/6.1.17/javadoc-api/org/springframework/beans/factory/aot/BeanFactoryInitializationAotProcessor.html) interface.
Each implementation can return an AOT contribution, based on the state of the bean factory.

An AOT contribution is a component that contributes generated code which reproduces a particular behavior.
It can also contribute `RuntimeHints` to indicate the need for reflection, resource loading, serialization, or JDK proxies.

A `BeanFactoryInitializationAotProcessor` implementation can be registered in `META-INF/spring/aot.factories` with a key equal to the fully-qualified name of the interface.

The `BeanFactoryInitializationAotProcessor` interface can also be implemented directly by a bean.
In this mode, the bean provides an AOT contribution equivalent to the feature it provides with a regular runtime.
Consequently, such a bean is automatically excluded from the AOT-optimized context.

> [!NOTE]
> If a bean implements the `BeanFactoryInitializationAotProcessor` interface, the bean and **all** of its dependencies will be initialized during AOT processing.
> We generally recommend that this interface is only implemented by infrastructure beans such as `BeanFactoryPostProcessor` which have limited dependencies and are already initialized early in the bean factory lifecycle.
> If such a bean is registered using an `@Bean` factory method, ensure the method is `static` so that its enclosing `@Configuration` class does not have to be initialized.

<a id="aot.bean-registration-contributions"></a>

### Bean Registration AOT Contributions

A core `BeanFactoryInitializationAotProcessor` implementation is responsible for collecting the necessary contributions for each candidate `BeanDefinition`.
It does so using a dedicated `BeanRegistrationAotProcessor`.

This interface is used as follows:

- Implemented by a `BeanPostProcessor` bean, to replace its runtime behavior.
For instance [`AutowiredAnnotationBeanPostProcessor`](beans/factory-extension.md#beans-factory-extension-bpp-examples-aabpp) implements this interface to generate code that injects members annotated with `@Autowired`.
- Implemented by a type registered in `META-INF/spring/aot.factories` with a key equal to the fully-qualified name of the interface.
Typically used when the bean definition needs to be tuned for specific features of the core framework.

> [!NOTE]
> If a bean implements the `BeanRegistrationAotProcessor` interface, the bean and **all** of its dependencies will be initialized during AOT processing.
> We generally recommend that this interface is only implemented by infrastructure beans such as `BeanFactoryPostProcessor` which have limited dependencies and are already initialized early in the bean factory lifecycle.
> If such a bean is registered using an `@Bean` factory method, ensure the method is `static` so that its enclosing `@Configuration` class does not have to be initialized.

If no `BeanRegistrationAotProcessor` handles a particular registered bean, a default implementation processes it.
This is the default behavior, since tuning the generated code for a bean definition should be restricted to corner cases.

Taking our previous example, let’s assume that `DataSourceConfiguration` is as follows:

#### Java

```java
@Configuration(proxyBeanMethods = false)
public class DataSourceConfiguration {

	@Bean
	public SimpleDataSource dataSource() {
		return new SimpleDataSource();
	}

}
```

#### Kotlin

```kotlin
@Configuration(proxyBeanMethods = false)
class DataSourceConfiguration {

	@Bean
	fun dataSource() = SimpleDataSource()

}
```

> [!WARNING]
> Kotlin class names with backticks that use invalid Java identifiers (not starting with a letter, containing spaces, etc.) are not supported.

Since there isn’t any particular condition on this class, `dataSourceConfiguration` and `dataSource` are identified as candidates.
The AOT engine will convert the configuration class above to code similar to the following:

#### Java

```java
/**
 * Bean definitions for {@link DataSourceConfiguration}
 */
@Generated
public class DataSourceConfiguration__BeanDefinitions {
	/**
	 * Get the bean definition for 'dataSourceConfiguration'
	 */
	public static BeanDefinition getDataSourceConfigurationBeanDefinition() {
		Class<?> beanType = DataSourceConfiguration.class;
		RootBeanDefinition beanDefinition = new RootBeanDefinition(beanType);
		beanDefinition.setInstanceSupplier(DataSourceConfiguration::new);
		return beanDefinition;
	}

	/**
	 * Get the bean instance supplier for 'dataSource'.
	 */
	private static BeanInstanceSupplier<SimpleDataSource> getDataSourceInstanceSupplier() {
		return BeanInstanceSupplier.<SimpleDataSource>forFactoryMethod(DataSourceConfiguration.class, "dataSource")
				.withGenerator((registeredBean) -> registeredBean.getBeanFactory().getBean(DataSourceConfiguration.class).dataSource());
	}

	/**
	 * Get the bean definition for 'dataSource'
	 */
	public static BeanDefinition getDataSourceBeanDefinition() {
		Class<?> beanType = SimpleDataSource.class;
		RootBeanDefinition beanDefinition = new RootBeanDefinition(beanType);
		beanDefinition.setInstanceSupplier(getDataSourceInstanceSupplier());
		return beanDefinition;
	}
}
```

> [!NOTE]
> The exact code generated may differ depending on the exact nature of your bean definitions.

> [!TIP]
> Each generated class is annotated with `org.springframework.aot.generate.Generated` to
> identify them if they need to be excluded, for instance by static analysis tools.

The generated code above creates bean definitions equivalent to the `@Configuration` class, but in a direct way and without the use of reflection if at all possible.
There is a bean definition for `dataSourceConfiguration` and one for `dataSourceBean`.
When a `datasource` instance is required, a `BeanInstanceSupplier` is called.
This supplier invokes the `dataSource()` method on the `dataSourceConfiguration` bean.

<a id="aot.running"></a>

## Running with AOT Optimizations

AOT is a mandatory step to transform a Spring application to a native executable, so it
is automatically enabled when running in this mode. It is possible to use those optimizations
on the JVM by setting the `spring.aot.enabled` System property to `true`.

> [!NOTE]
> When AOT optimizations are included, some decisions that have been taken at build-time
> are hard-coded in the application setup. For instance, profiles that have been enabled at
> build-time are automatically enabled at runtime as well.

<a id="aot.bestpractices"></a>

## Best Practices

The AOT engine is designed to handle as many use cases as possible, with no code change in applications.
However, keep in mind that some optimizations are made at build time based on a static definition of the beans.

This section lists the best practices that make sure your application is ready for AOT.

<a id="aot.bestpractices.bean-registration"></a>

### Programmatic Bean Registration

The AOT engine takes care of the `@Configuration` model and any callback that might be
invoked as part of processing your configuration. If you need to register additional
beans programmatically, make sure to use a `BeanDefinitionRegistry` to register
bean definitions.

This can typically be done via a `BeanDefinitionRegistryPostProcessor`. Note that, if it
is registered itself as a bean, it will be invoked again at runtime unless you make
sure to implement `BeanFactoryInitializationAotProcessor` as well. A more idiomatic
way is to implement `ImportBeanDefinitionRegistrar` and register it using `@Import` on
one of your configuration classes. This invokes your custom code as part of configuration
class parsing.

If you declare additional beans programmatically using a different callback, they are
likely not going to be handled by the AOT engine, and therefore no hints are going to be
generated for them. Depending on the environment, those beans may not be registered at
all. For instance, classpath scanning does not work in a native image as there is no
notion of a classpath. For cases like this, it is crucial that the scanning happens at
build time.

<a id="aot.bestpractices.bean-type"></a>

### Expose the Most Precise Bean Type

While your application may interact with an interface that a bean implements, it is still very important to declare the most precise type.
The AOT engine performs additional checks on the bean type, such as detecting the presence of `@Autowired` members or lifecycle callback methods.

For `@Configuration` classes, make sure that the return type of the factory `@Bean` method is as precise as possible.
Consider the following example:

#### Java

```java
@Configuration(proxyBeanMethods = false)
public class UserConfiguration {

	@Bean
	public MyInterface myInterface() {
		return new MyImplementation();
	}

}
```

In the example above, the declared  type for the `myInterface` bean is `MyInterface`.
None of the usual post-processing will take `MyImplementation` into account.
For instance, if there is an annotated handler method on `MyImplementation` that the context should register, it won’t be detected upfront.

The example above should be rewritten as follows:

#### Java

```java
@Configuration(proxyBeanMethods = false)
public class UserConfiguration {

	@Bean
	public MyImplementation myInterface() {
		return new MyImplementation();
	}

}
```

If you are registering bean definitions programmatically, consider using `RootBeanBefinition` as it allows to specify a `ResolvableType` that handles generics.

<a id="aot.bestpractices.constructors"></a>

### Avoid Multiple Constructors

The container is able to choose the most appropriate constructor to use based on several candidates.
However, this is not a best practice and flagging the preferred constructor with `@Autowired` if necessary is preferred.

In case you are working on a code base that you cannot modify, you can set the [`preferredConstructors` attribute](https://docs.spring.io/spring-framework/docs/6.1.17/javadoc-api/org/springframework/beans/factory/support/AbstractBeanDefinition.html#PREFERRED_CONSTRUCTORS_ATTRIBUTE) on the related bean definition to indicate which constructor should be used.

<a id="aot.bestpractices.complex-data-structures"></a>

### Avoid Complex Data Structures for Constructor Parameters and Properties

When crafting a `RootBeanDefinition` programmatically, you are not constrained in terms of types that you can use.
For instance, you may have a custom `record` with several properties that your bean takes as a constructor argument.

While this works fine with the regular runtime, AOT does not know how to generate the code of your custom data structure.
A good rule of thumb is to keep in mind that bean definitions are an abstraction on top of several models.
Rather than using such structures, decomposing to simple types or referring to a bean that is built as such is recommended.

As a last resort, you can implement your own `org.springframework.aot.generate.ValueCodeGenerator$Delegate`.
To use it, register its fully qualified name in `META-INF/spring/aot.factories` using the `Delegate` as the key.

<a id="aot.bestpractices.custom-arguments"></a>

### Avoid Creating Beans with Custom Arguments

Spring AOT detects what needs to be done to create a bean and translates that in generated code using an instance supplier.
The container also supports creating a bean with [custom arguments](<https://docs.spring.io/spring-framework/docs/6.1.17/javadoc-api/org/springframework/beans/factory/BeanFactory.html#getBean(java.lang.String,java.lang.Object...)>) that leads to several issues with AOT:

1. The custom arguments require dynamic introspection of a matching constructor or factory method.
Those arguments cannot be detected by AOT, so the necessary reflection hints will have to be provided manually.
1. By-passing the instance supplier means that all other optimizations after creation are skipped as well.
For instance, autowiring on fields and methods will be skipped as they are handled in the instance supplier.

Rather than having prototype-scoped beans created with custom arguments, we recommend a manual factory pattern where a bean is responsible for the creation of the instance.

<a id="aot.bestpractices.circular-dependencies"></a>

### Avoid Circular Dependencies

Certain use cases can result in circular dependencies between one or more beans. With the
regular runtime, it may be possible to wire those circular dependencies via `@Autowired`
on setter methods or fields. However, an AOT-optimized context will fail to start with
explicit circular dependencies.

In an AOT-optimized application, you should therefore strive to avoid circular
dependencies. If that is not possible, you can use `@Lazy` injection points or
`ObjectProvider` to lazily access or retrieve the necessary collaborating beans. See
[this tip](beans/classpath-scanning.md#beans-factorybeans-annotations-lazy-injection-points)
for further information.

<a id="aot.bestpractices.factory-bean"></a>

### FactoryBean

`FactoryBean` should be used with care as it introduces an intermediate layer in terms of bean type resolution that may not be conceptually necessary.
As a rule of thumb, if the `FactoryBean` instance does not hold long-term state and is not needed at a later point in time at runtime, it should be replaced by a regular factory method, possibly with a `FactoryBean` adapter layer on top (for declarative configuration purposes).

If your `FactoryBean` implementation does not resolve the object type (i.e. `T`), extra care is necessary.
Consider the following example:

#### Java

```java
public class ClientFactoryBean<T extends AbstractClient> implements FactoryBean<T> {
	// ...
}
```

A concrete client declaration should provide a resolved generic for the client, as shown in the following example:

#### Java

```java
@Configuration(proxyBeanMethods = false)
public class UserConfiguration {

	@Bean
	public ClientFactoryBean<MyClient> myClient() {
		return new ClientFactoryBean<>(...);
	}

}
```

If the `FactoryBean` bean definition is registered programmatically, make sure to follow these steps:

1. Use `RootBeanDefinition`.
1. Set the `beanClass` to the `FactoryBean` class so that AOT knows that it is an intermediate layer.
1. Set the `ResolvableType` to a resolved generic, which makes sure the most precise type is exposed.

The following example showcases a basic definition:

#### Java

```java
RootBeanDefinition beanDefinition = new RootBeanDefinition(ClientFactoryBean.class);
beanDefinition.setTargetType(ResolvableType.forClassWithGenerics(ClientFactoryBean.class, MyClient.class));
// ...
registry.registerBeanDefinition("myClient", beanDefinition);
```

<a id="aot.bestpractices.jpa"></a>

### JPA

The JPA persistence unit has to be known upfront for certain optimizations to apply. Consider the following basic example:

#### Java

```java
@Bean
LocalContainerEntityManagerFactoryBean customDBEntityManagerFactory(DataSource dataSource) {
	LocalContainerEntityManagerFactoryBean factoryBean = new LocalContainerEntityManagerFactoryBean();
	factoryBean.setDataSource(dataSource);
	factoryBean.setPackagesToScan("com.example.app");
	return factoryBean;
}
```

To make sure the scanning occurs ahead of time, a `PersistenceManagedTypes` bean must be declared and used by the
factory bean definition, as shown by the following example:

#### Java

```java
@Bean
PersistenceManagedTypes persistenceManagedTypes(ResourceLoader resourceLoader) {
	return new PersistenceManagedTypesScanner(resourceLoader)
			.scan("com.example.app");
}

@Bean
LocalContainerEntityManagerFactoryBean customDBEntityManagerFactory(DataSource dataSource, PersistenceManagedTypes managedTypes) {
	LocalContainerEntityManagerFactoryBean factoryBean = new LocalContainerEntityManagerFactoryBean();
	factoryBean.setDataSource(dataSource);
	factoryBean.setManagedTypes(managedTypes);
	return factoryBean;
}
```

<a id="aot.hints"></a>

## Runtime Hints

Running an application as a native image requires additional information compared to a regular JVM runtime.
For instance, GraalVM needs to know ahead of time if a component uses reflection.
Similarly, classpath resources are not included in a native image unless specified explicitly.
Consequently, if the application needs to load a resource, it must be referenced from the corresponding GraalVM native image configuration file.

The [`RuntimeHints`](https://docs.spring.io/spring-framework/docs/6.1.17/javadoc-api/org/springframework/aot/hint/RuntimeHints.html) API collects the need for reflection, resource loading, serialization, and JDK proxies at runtime.
The following example makes sure that `config/app.properties` can be loaded from the classpath at runtime within a native image:

#### Java

```java
runtimeHints.resources().registerPattern("config/app.properties");
```

A number of contracts are handled automatically during AOT processing.
For instance, the return type of a `@Controller` method is inspected, and relevant reflection hints are added if Spring detects that the type should be serialized (typically to JSON).

For cases that the core container cannot infer, you can register such hints programmatically.
A number of convenient annotations are also provided for common use cases.

<a id="aot.hints.import-runtime-hints"></a>

### `@ImportRuntimeHints`

`RuntimeHintsRegistrar` implementations allow you to get a callback to the `RuntimeHints` instance managed by the AOT engine.
Implementations of this interface can be registered using `@ImportRuntimeHints` on any Spring bean or `@Bean` factory method.
`RuntimeHintsRegistrar` implementations are detected and invoked at build time.

```java
import java.util.Locale;

import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;
import org.springframework.context.annotation.ImportRuntimeHints;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
@ImportRuntimeHints(SpellCheckService.SpellCheckServiceRuntimeHints.class)
public class SpellCheckService {

	public void loadDictionary(Locale locale) {
		ClassPathResource resource = new ClassPathResource("dicts/" + locale.getLanguage() + ".txt");
		//...
	}

	static class SpellCheckServiceRuntimeHints implements RuntimeHintsRegistrar {

		@Override
		public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
			hints.resources().registerPattern("dicts/*");
		}
	}

}
```

If at all possible, `@ImportRuntimeHints` should be used as close as possible to the component that requires the hints.
This way, if the component is not contributed to the `BeanFactory`, the hints won’t be contributed either.

It is also possible to register an implementation statically by adding an entry in `META-INF/spring/aot.factories` with a key equal to the fully-qualified name of the `RuntimeHintsRegistrar` interface.

<a id="aot.hints.reflective"></a>

### `@Reflective`

[`@Reflective`](https://docs.spring.io/spring-framework/docs/6.1.17/javadoc-api/org/springframework/aot/hint/annotation/Reflective.html) provides an idiomatic way to flag the need for reflection on an annotated element.
For instance, `@EventListener` is meta-annotated with `@Reflective` since the underlying implementation invokes the annotated method using reflection.

By default, only Spring beans are considered, and an invocation hint is registered for the annotated element.
This can be tuned by specifying a custom `ReflectiveProcessor` implementation via the
`@Reflective` annotation.

Library authors can reuse this annotation for their own purposes.
If components other than Spring beans need to be processed, a `BeanFactoryInitializationAotProcessor` can detect the relevant types and use `ReflectiveRuntimeHintsRegistrar` to process them.

<a id="aot.hints.register-reflection-for-binding"></a>

### `@RegisterReflectionForBinding`

[`@RegisterReflectionForBinding`](https://docs.spring.io/spring-framework/docs/6.1.17/javadoc-api/org/springframework/aot/hint/annotation/RegisterReflectionForBinding.html) is a specialization of `@Reflective` that registers the need for serializing arbitrary types.
A typical use case is the use of DTOs that the container cannot infer, such as using a web client within a method body.

`@RegisterReflectionForBinding` can be applied to any Spring bean at the class level, but it can also be applied directly to a method, field, or constructor to better indicate where the hints are actually required.
The following example registers `Account` for serialization.

#### Java

```java
@Component
public class OrderService {

	@RegisterReflectionForBinding(Account.class)
	public void process(Order order) {
		// ...
	}

}
```

<a id="aot.hints.testing"></a>

### Testing Runtime Hints

Spring Core also ships `RuntimeHintsPredicates`, a utility for checking that existing hints match a particular use case.
This can be used in your own tests to validate that a `RuntimeHintsRegistrar` contains the expected results.
We can write a test for our `SpellCheckService` and ensure that we will be able to load a dictionary at runtime:

```java
	@Test
	void shouldRegisterResourceHints() {
		RuntimeHints hints = new RuntimeHints();
		new SpellCheckServiceRuntimeHints().registerHints(hints, getClass().getClassLoader());
		assertThat(RuntimeHintsPredicates.resource().forResource("dicts/en.txt"))
				.accepts(hints);
	}
```

With `RuntimeHintsPredicates`, we can check for reflection, resource, serialization, or proxy generation hints.
This approach works well for unit tests but implies that the runtime behavior of a component is well known.

You can learn more about the global runtime behavior of an application by running its test suite (or the app itself) with the [GraalVM tracing agent](https://www.graalvm.org/22.3/reference-manual/native-image/metadata/AutomaticMetadataCollection/).
This agent will record all relevant calls requiring GraalVM hints at runtime and write them out as JSON configuration files.

For more targeted discovery and testing, Spring Framework ships a dedicated module with core AOT testing utilities, `"org.springframework:spring-core-test"`.
This module contains the RuntimeHints Agent, a Java agent that records all method invocations that are related to runtime hints and helps you to assert that a given `RuntimeHints` instance covers all recorded invocations.
Let’s consider a piece of infrastructure for which we’d like to test the hints we’re contributing during the AOT processing phase.

```java
import java.lang.reflect.Method;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.springframework.util.ClassUtils;

public class SampleReflection {

	private final Log logger = LogFactory.getLog(SampleReflection.class);

	public void performReflection() {
		try {
			Class<?> springVersion = ClassUtils.forName("org.springframework.core.SpringVersion", null);
			Method getVersion = ClassUtils.getMethod(springVersion, "getVersion");
			String version = (String) getVersion.invoke(null);
			logger.info("Spring version:" + version);
		}
		catch (Exception exc) {
			logger.error("reflection failed", exc);
		}
	}

}
```

We can then write a unit test (no native compilation required) that checks our contributed hints:

```java
import java.util.List;

import org.junit.jupiter.api.Test;

import org.springframework.aot.hint.ExecutableMode;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.test.agent.EnabledIfRuntimeHintsAgent;
import org.springframework.aot.test.agent.RuntimeHintsInvocations;
import org.springframework.aot.test.agent.RuntimeHintsRecorder;
import org.springframework.core.SpringVersion;

import static org.assertj.core.api.Assertions.assertThat;

// @EnabledIfRuntimeHintsAgent signals that the annotated test class or test
// method is only enabled if the RuntimeHintsAgent is loaded on the current JVM.
// It also tags tests with the "RuntimeHints" JUnit tag.
@EnabledIfRuntimeHintsAgent
class SampleReflectionRuntimeHintsTests {

	@Test
	void shouldRegisterReflectionHints() {
		RuntimeHints runtimeHints = new RuntimeHints();
		// Call a RuntimeHintsRegistrar that contributes hints like:
		runtimeHints.reflection().registerType(SpringVersion.class, typeHint ->
				typeHint.withMethod("getVersion", List.of(), ExecutableMode.INVOKE));

		// Invoke the relevant piece of code we want to test within a recording lambda
		RuntimeHintsInvocations invocations = RuntimeHintsRecorder.record(() -> {
			SampleReflection sample = new SampleReflection();
			sample.performReflection();
		});
		// assert that the recorded invocations are covered by the contributed hints
		assertThat(invocations).match(runtimeHints);
	}

}
```

If you forgot to contribute a hint, the test will fail and provide some details about the invocation:

```txt
org.springframework.docs.core.aot.hints.testing.SampleReflection performReflection
INFO: Spring version:6.0.0-SNAPSHOT

Missing <"ReflectionHints"> for invocation <java.lang.Class#forName>
with arguments ["org.springframework.core.SpringVersion",
    false,
    jdk.internal.loader.ClassLoaders$AppClassLoader@251a69d7].
Stacktrace:
<"org.springframework.util.ClassUtils#forName, Line 284
io.spring.runtimehintstesting.SampleReflection#performReflection, Line 19
io.spring.runtimehintstesting.SampleReflectionRuntimeHintsTests#lambda$shouldRegisterReflectionHints$0, Line 25
```

There are various ways to configure this Java agent in your build, so please refer to the documentation of your build tool and test execution plugin.
The agent itself can be configured to instrument specific packages (by default, only `org.springframework` is instrumented).
You’ll find more details in the [Spring Framework `buildSrc` README](https://github.com/spring-projects/spring-framework/tree/main/buildSrc/README.md) file.
