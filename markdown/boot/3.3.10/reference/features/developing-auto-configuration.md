---
title: "Creating Your Own Auto-configuration"
source: "reference:features/developing-auto-configuration.adoc"
---

<a id="features.developing-auto-configuration"></a>

# Creating Your Own Auto-configuration

If you work in a company that develops shared libraries, or if you work on an open-source or commercial library, you might want to develop your own auto-configuration.
Auto-configuration classes can be bundled in external jars and still be picked up by Spring Boot.

Auto-configuration can be associated to a “starter” that provides the auto-configuration code as well as the typical libraries that you would use with it.
We first cover what you need to know to build your own auto-configuration and then we move on to the [typical steps required to create a custom starter](#features.developing-auto-configuration.custom-starter).

<a id="features.developing-auto-configuration.understanding-auto-configured-beans"></a>

## Understanding Auto-configured Beans

Classes that implement auto-configuration are annotated with [`@AutoConfiguration`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/AutoConfiguration.html).
This annotation itself is meta-annotated with [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Configuration.html), making auto-configurations standard [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Configuration.html) classes.
Additional [`@Conditional`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Conditional.html) annotations are used to constrain when the auto-configuration should apply.
Usually, auto-configuration classes use [`@ConditionalOnClass`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnClass.html) and [`@ConditionalOnMissingBean`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnMissingBean.html) annotations.
This ensures that auto-configuration applies only when relevant classes are found and when you have not declared your own [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Configuration.html).

You can browse the source code of [`spring-boot-autoconfigure`](https://github.com/spring-projects/spring-boot/tree/v3.3.10/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure) to see the [`@AutoConfiguration`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/AutoConfiguration.html) classes that Spring provides (see the [`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`](https://github.com/spring-projects/spring-boot/tree/v3.3.10/spring-boot-project/spring-boot-autoconfigure/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports) file).

<a id="features.developing-auto-configuration.locating-auto-configuration-candidates"></a>

## Locating Auto-configuration Candidates

Spring Boot checks for the presence of a `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` file within your published jar.
The file should list your configuration classes, with one class name per line, as shown in the following example:

```
com.mycorp.libx.autoconfigure.LibXAutoConfiguration
com.mycorp.libx.autoconfigure.LibXWebAutoConfiguration
```

> [!TIP]
> You can add comments to the imports file using the `#` character.

> [!TIP]
> In the unusual case that an auto-configuration class is not a top-level class, its class name should use `$` to separate it from its containing class, for example `com.example.Outer$NestedAutoConfiguration`.

> [!NOTE]
> Auto-configurations must be loaded *only* by being named in the imports file.
> Make sure that they are defined in a specific package space and that they are never the target of component scanning.
> Furthermore, auto-configuration classes should not enable component scanning to find additional components.
> Specific [`@Import`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Import.html) annotations should be used instead.

If your configuration needs to be applied in a specific order, you can use the `before`, `beforeName`, `after` and `afterName` attributes on the [`@AutoConfiguration`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/AutoConfiguration.html) annotation or the dedicated [`@AutoConfigureBefore`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/AutoConfigureBefore.html) and [`@AutoConfigureAfter`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/AutoConfigureAfter.html) annotations.
For example, if you provide web-specific configuration, your class may need to be applied after [`WebMvcAutoConfiguration`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/web/servlet/WebMvcAutoConfiguration.html).

If you want to order certain auto-configurations that should not have any direct knowledge of each other, you can also use [`@AutoConfigureOrder`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/AutoConfigureOrder.html).
That annotation has the same semantic as the regular [`@Order`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/core/annotation/Order.html) annotation but provides a dedicated order for auto-configuration classes.

As with standard [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Configuration.html) classes, the order in which auto-configuration classes are applied only affects the order in which their beans are defined.
The order in which those beans are subsequently created is unaffected and is determined by each bean’s dependencies and any [`@DependsOn`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/DependsOn.html) relationships.

<a id="features.developing-auto-configuration.condition-annotations"></a>

## Condition Annotations

You almost always want to include one or more [`@Conditional`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Conditional.html) annotations on your auto-configuration class.
The [`@ConditionalOnMissingBean`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnMissingBean.html) annotation is one common example that is used to allow developers to override auto-configuration if they are not happy with your defaults.

Spring Boot includes a number of [`@Conditional`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Conditional.html) annotations that you can reuse in your own code by annotating [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Configuration.html) classes or individual [`@Bean`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Bean.html) methods.
These annotations include:

- [Class Conditions](#features.developing-auto-configuration.condition-annotations.class-conditions)
- [Bean Conditions](#features.developing-auto-configuration.condition-annotations.bean-conditions)
- [Property Conditions](#features.developing-auto-configuration.condition-annotations.property-conditions)
- [Resource Conditions](#features.developing-auto-configuration.condition-annotations.resource-conditions)
- [Web Application Conditions](#features.developing-auto-configuration.condition-annotations.web-application-conditions)
- [SpEL Expression Conditions](#features.developing-auto-configuration.condition-annotations.spel-conditions)

<a id="features.developing-auto-configuration.condition-annotations.class-conditions"></a>

### Class Conditions

The [`@ConditionalOnClass`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnClass.html) and [`@ConditionalOnMissingClass`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnMissingClass.html) annotations let [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Configuration.html) classes be included based on the presence or absence of specific classes.
Due to the fact that annotation metadata is parsed by using [ASM](https://asm.ow2.io/), you can use the `value` attribute to refer to the real class, even though that class might not actually appear on the running application classpath.
You can also use the `name` attribute if you prefer to specify the class name by using a [`String`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/String.html) value.

This mechanism does not apply the same way to [`@Bean`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Bean.html) methods where typically the return type is the target of the condition: before the condition on the method applies, the JVM will have loaded the class and potentially processed method references which will fail if the class is not present.

To handle this scenario, a separate [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Configuration.html) class can be used to isolate the condition, as shown in the following example:

#### Java

```java
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@AutoConfiguration
// Some conditions ...
public class MyAutoConfiguration {

	// Auto-configured beans ...

	@Configuration(proxyBeanMethods = false)
	@ConditionalOnClass(SomeService.class)
	public static class SomeServiceConfiguration {

		@Bean
		@ConditionalOnMissingBean
		public SomeService someService() {
			return new SomeService();
		}

	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
// Some conditions ...
class MyAutoConfiguration {

	// Auto-configured beans ...
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnClass(SomeService::class)
	class SomeServiceConfiguration {

		@Bean
		@ConditionalOnMissingBean
		fun someService(): SomeService {
			return SomeService()
		}

	}

}
```

> [!TIP]
> If you use [`@ConditionalOnClass`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnClass.html) or [`@ConditionalOnMissingClass`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnMissingClass.html) as a part of a meta-annotation to compose your own composed annotations, you must use `name` as referring to the class in such a case is not handled.

<a id="features.developing-auto-configuration.condition-annotations.bean-conditions"></a>

### Bean Conditions

The [`@ConditionalOnBean`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnBean.html) and [`@ConditionalOnMissingBean`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnMissingBean.html) annotations let a bean be included based on the presence or absence of specific beans.
You can use the `value` attribute to specify beans by type or `name` to specify beans by name.
The `search` attribute lets you limit the [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/ApplicationContext.html) hierarchy that should be considered when searching for beans.

When placed on a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Bean.html) method, the target type defaults to the return type of the method, as shown in the following example:

#### Java

```java
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
public class MyAutoConfiguration {

	@Bean
	@ConditionalOnMissingBean
	public SomeService someService() {
		return new SomeService();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyAutoConfiguration {

	@Bean
	@ConditionalOnMissingBean
	fun someService(): SomeService {
		return SomeService()
	}

}
```

In the preceding example, the `someService` bean is going to be created if no bean of type `SomeService` is already contained in the [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/ApplicationContext.html).

> [!TIP]
> You need to be very careful about the order in which bean definitions are added, as these conditions are evaluated based on what has been processed so far.
> For this reason, we recommend using only [`@ConditionalOnBean`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnBean.html) and [`@ConditionalOnMissingBean`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnMissingBean.html) annotations on auto-configuration classes (since these are guaranteed to load after any user-defined bean definitions have been added).

> [!NOTE]
> [`@ConditionalOnBean`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnBean.html) and [`@ConditionalOnMissingBean`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnMissingBean.html) do not prevent [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Configuration.html) classes from being created.
> The only difference between using these conditions at the class level and marking each contained [`@Bean`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Bean.html) method with the annotation is that the former prevents registration of the [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Configuration.html) class as a bean if the condition does not match.

> [!TIP]
> When declaring a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Bean.html) method, provide as much type information as possible in the method’s return type.
> For example, if your bean’s concrete class implements an interface the bean method’s return type should be the concrete class and not the interface.
> Providing as much type information as possible in [`@Bean`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Bean.html) methods is particularly important when using bean conditions as their evaluation can only rely upon to type information that is available in the method signature.

<a id="features.developing-auto-configuration.condition-annotations.property-conditions"></a>

### Property Conditions

The [`@ConditionalOnProperty`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnProperty.html) annotation lets configuration be included based on a Spring Environment property.
Use the `prefix` and `name` attributes to specify the property that should be checked.
By default, any property that exists and is not equal to `false` is matched.
You can also create more advanced checks by using the `havingValue` and `matchIfMissing` attributes.

If multiple names are given in the `name` attribute, all of the properties have to pass the test for the condition to match.

<a id="features.developing-auto-configuration.condition-annotations.resource-conditions"></a>

### Resource Conditions

The [`@ConditionalOnResource`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnResource.html) annotation lets configuration be included only when a specific resource is present.
Resources can be specified by using the usual Spring conventions, as shown in the following example: `file:/home/user/test.dat`.

<a id="features.developing-auto-configuration.condition-annotations.web-application-conditions"></a>

### Web Application Conditions

The [`@ConditionalOnWebApplication`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnWebApplication.html) and [`@ConditionalOnNotWebApplication`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnNotWebApplication.html) annotations let configuration be included depending on whether the application is a web application.
A servlet-based web application is any application that uses a Spring [`WebApplicationContext`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/context/WebApplicationContext.html), defines a `session` scope, or has a [`ConfigurableWebEnvironment`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/web/context/ConfigurableWebEnvironment.html).
A reactive web application is any application that uses a [`ReactiveWebApplicationContext`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/web/reactive/context/ReactiveWebApplicationContext.html), or has a [`ConfigurableReactiveWebEnvironment`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/web/reactive/context/ConfigurableReactiveWebEnvironment.html).

The [`@ConditionalOnWarDeployment`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnWarDeployment.html) and [`@ConditionalOnNotWarDeployment`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnNotWarDeployment.html) annotations let configuration be included depending on whether the application is a traditional WAR application that is deployed to a servlet container.
This condition will not match for applications that are run with an embedded web server.

<a id="features.developing-auto-configuration.condition-annotations.spel-conditions"></a>

### SpEL Expression Conditions

The [`@ConditionalOnExpression`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionalOnExpression.html) annotation lets configuration be included based on the result of a [SpEL expression](https://docs.spring.io/spring-framework/reference/6.1/core/expressions.html).

> [!NOTE]
> Referencing a bean in the expression will cause that bean to be initialized very early in context refresh processing.
> As a result, the bean won’t be eligible for post-processing (such as configuration properties binding) and its state may be incomplete.

<a id="features.developing-auto-configuration.testing"></a>

## Testing your Auto-configuration

An auto-configuration can be affected by many factors: user configuration (`@Bean` definition and [`Environment`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/core/env/Environment.html) customization), condition evaluation (presence of a particular library), and others.
Concretely, each test should create a well defined [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/ApplicationContext.html) that represents a combination of those customizations.
[`ApplicationContextRunner`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/test/context/runner/ApplicationContextRunner.html) provides a great way to achieve that.

> [!WARNING]
> [`ApplicationContextRunner`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/test/context/runner/ApplicationContextRunner.html) doesn’t work when running the tests in a native image.

[`ApplicationContextRunner`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/test/context/runner/ApplicationContextRunner.html) is usually defined as a field of the test class to gather the base, common configuration.
The following example makes sure that `MyServiceAutoConfiguration` is always invoked:

#### Java

```java
	private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
		.withConfiguration(AutoConfigurations.of(MyServiceAutoConfiguration.class));

```

#### Kotlin

```kotlin
	val contextRunner = ApplicationContextRunner()
		.withConfiguration(AutoConfigurations.of(MyServiceAutoConfiguration::class.java))

```

> [!TIP]
> If multiple auto-configurations have to be defined, there is no need to order their declarations as they are invoked in the exact same order as when running the application.

Each test can use the runner to represent a particular use case.
For instance, the sample below invokes a user configuration (`UserConfiguration`) and checks that the auto-configuration backs off properly.
Invoking `run` provides a callback context that can be used with AssertJ.

#### Java

```java
	@Test
	void defaultServiceBacksOff() {
		this.contextRunner.withUserConfiguration(UserConfiguration.class).run((context) -> {
			assertThat(context).hasSingleBean(MyService.class);
			assertThat(context).getBean("myCustomService").isSameAs(context.getBean(MyService.class));
		});
	}

	@Configuration(proxyBeanMethods = false)
	static class UserConfiguration {

		@Bean
		MyService myCustomService() {
			return new MyService("mine");
		}

	}
```

#### Kotlin

```kotlin
	@Test
	fun defaultServiceBacksOff() {
		contextRunner.withUserConfiguration(UserConfiguration::class.java)
			.run { context: AssertableApplicationContext ->
				assertThat(context).hasSingleBean(MyService::class.java)
				assertThat(context).getBean("myCustomService")
					.isSameAs(context.getBean(MyService::class.java))
			}
	}

	@Configuration(proxyBeanMethods = false)
	internal class UserConfiguration {

		@Bean
		fun myCustomService(): MyService {
			return MyService("mine")
		}

	}
```

It is also possible to easily customize the [`Environment`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/core/env/Environment.html), as shown in the following example:

#### Java

```java
	@Test
	void serviceNameCanBeConfigured() {
		this.contextRunner.withPropertyValues("user.name=test123").run((context) -> {
			assertThat(context).hasSingleBean(MyService.class);
			assertThat(context.getBean(MyService.class).getName()).isEqualTo("test123");
		});
	}
```

#### Kotlin

```kotlin
	@Test
	fun serviceNameCanBeConfigured() {
		contextRunner.withPropertyValues("user.name=test123").run { context: AssertableApplicationContext ->
			assertThat(context).hasSingleBean(MyService::class.java)
			assertThat(context.getBean(MyService::class.java).name).isEqualTo("test123")
		}
	}
```

The runner can also be used to display the [`ConditionEvaluationReport`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/condition/ConditionEvaluationReport.html).
The report can be printed at `INFO` or `DEBUG` level.
The following example shows how to use the [`ConditionEvaluationReportLoggingListener`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/logging/ConditionEvaluationReportLoggingListener.html) to print the report in auto-configuration tests.

#### Java

```java
import org.junit.jupiter.api.Test;

import org.springframework.boot.autoconfigure.logging.ConditionEvaluationReportLoggingListener;
import org.springframework.boot.logging.LogLevel;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class MyConditionEvaluationReportingTests {

	@Test
	void autoConfigTest() {
		new ApplicationContextRunner()
			.withInitializer(ConditionEvaluationReportLoggingListener.forLogLevel(LogLevel.INFO))
			.run((context) -> {
				// Test something...
			});
	}

}
```

#### Kotlin

```kotlin
import org.junit.jupiter.api.Test
import org.springframework.boot.autoconfigure.logging.ConditionEvaluationReportLoggingListener
import org.springframework.boot.logging.LogLevel
import org.springframework.boot.test.context.assertj.AssertableApplicationContext
import org.springframework.boot.test.context.runner.ApplicationContextRunner

class MyConditionEvaluationReportingTests {

	@Test
	fun autoConfigTest() {
		ApplicationContextRunner()
			.withInitializer(ConditionEvaluationReportLoggingListener.forLogLevel(LogLevel.INFO))
			.run { context: AssertableApplicationContext? -> }
	}

}
```

<a id="features.developing-auto-configuration.testing.simulating-a-web-context"></a>

### Simulating a Web Context

If you need to test an auto-configuration that only operates in a servlet or reactive web application context, use the [`WebApplicationContextRunner`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/test/context/runner/WebApplicationContextRunner.html) or [`ReactiveWebApplicationContextRunner`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/test/context/runner/ReactiveWebApplicationContextRunner.html) respectively.

<a id="features.developing-auto-configuration.testing.overriding-classpath"></a>

### Overriding the Classpath

It is also possible to test what happens when a particular class and/or package is not present at runtime.
Spring Boot ships with a [`FilteredClassLoader`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/test/context/FilteredClassLoader.html) that can easily be used by the runner.
In the following example, we assert that if `MyService` is not present, the auto-configuration is properly disabled:

#### Java

```java
	@Test
	void serviceIsIgnoredIfLibraryIsNotPresent() {
		this.contextRunner.withClassLoader(new FilteredClassLoader(MyService.class))
			.run((context) -> assertThat(context).doesNotHaveBean("myService"));
	}
```

#### Kotlin

```kotlin
	@Test
	fun serviceIsIgnoredIfLibraryIsNotPresent() {
		contextRunner.withClassLoader(FilteredClassLoader(MyService::class.java))
			.run { context: AssertableApplicationContext? ->
				assertThat(context).doesNotHaveBean("myService")
			}
	}
```

<a id="features.developing-auto-configuration.custom-starter"></a>

## Creating Your Own Starter

A typical Spring Boot starter contains code to auto-configure and customize the infrastructure of a given technology, let’s call that "acme".
To make it easily extensible, a number of configuration keys in a dedicated namespace can be exposed to the environment.
Finally, a single "starter" dependency is provided to help users get started as easily as possible.

Concretely, a custom starter can contain the following:

- The `autoconfigure` module that contains the auto-configuration code for "acme".
- The `starter` module that provides a dependency to the `autoconfigure` module as well as "acme" and any additional dependencies that are typically useful.
In a nutshell, adding the starter should provide everything needed to start using that library.

This separation in two modules is in no way necessary.
If "acme" has several flavors, options or optional features, then it is better to separate the auto-configuration as you can clearly express the fact some features are optional.
Besides, you have the ability to craft a starter that provides an opinion about those optional dependencies.
At the same time, others can rely only on the `autoconfigure` module and craft their own starter with different opinions.

If the auto-configuration is relatively straightforward and does not have optional features, merging the two modules in the starter is definitely an option.

<a id="features.developing-auto-configuration.custom-starter.naming"></a>

### Naming

You should make sure to provide a proper namespace for your starter.
Do not start your module names with `spring-boot`, even if you use a different Maven `groupId`.
We may offer official support for the thing you auto-configure in the future.

As a rule of thumb, you should name a combined module after the starter.
For example, assume that you are creating a starter for "acme" and that you name the auto-configure module `acme-spring-boot` and the starter `acme-spring-boot-starter`.
If you only have one module that combines the two, name it `acme-spring-boot-starter`.

<a id="features.developing-auto-configuration.custom-starter.configuration-keys"></a>

### Configuration keys

If your starter provides configuration keys, use a unique namespace for them.
In particular, do not include your keys in the namespaces that Spring Boot uses (such as `server`, `management`, `spring`, and so on).
If you use the same namespace, we may modify these namespaces in the future in ways that break your modules.
As a rule of thumb, prefix all your keys with a namespace that you own (for example `acme`).

Make sure that configuration keys are documented by adding field Javadoc for each property, as shown in the following example:

#### Java

```java
import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("acme")
public class AcmeProperties {

	/**
	 * Whether to check the location of acme resources.
	 */
	private boolean checkLocation = true;

	/**
	 * Timeout for establishing a connection to the acme server.
	 */
	private Duration loginTimeout = Duration.ofSeconds(3);
	public boolean isCheckLocation() {
		return this.checkLocation;
	}

	public void setCheckLocation(boolean checkLocation) {
		this.checkLocation = checkLocation;
	}

	public Duration getLoginTimeout() {
		return this.loginTimeout;
	}

	public void setLoginTimeout(Duration loginTimeout) {
		this.loginTimeout = loginTimeout;
	}
}
```

#### Kotlin

```kotlin
import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

@ConfigurationProperties("acme")
class AcmeProperties(

	/**
	 * Whether to check the location of acme resources.
	 */
	var isCheckLocation: Boolean = true,

	/**
	 * Timeout for establishing a connection to the acme server.
	 */
	var loginTimeout:Duration = Duration.ofSeconds(3))
```

> [!NOTE]
> You should only use plain text with [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/context/properties/ConfigurationProperties.html) field Javadoc, since they are not processed before being added to the JSON.

If you use [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/context/properties/ConfigurationProperties.html) with record class then record components' descriptions should be provided via class-level Javadoc tag `@param` (there are no explicit instance fields in record classes to put regular field-level Javadocs on).

Here are some rules we follow internally to make sure descriptions are consistent:

- Do not start the description by "The" or "A".
- For `boolean` types, start the description with "Whether" or "Enable".
- For collection-based types, start the description with "Comma-separated list"
- Use [`Duration`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/Duration.html) rather than `long` and describe the default unit if it differs from milliseconds, such as "If a duration suffix is not specified, seconds will be used".
- Do not provide the default value in the description unless it has to be determined at runtime.

Make sure to [trigger meta-data generation](../../specification/configuration-metadata/annotation-processor.md) so that IDE assistance is available for your keys as well.
You may want to review the generated metadata (`META-INF/spring-configuration-metadata.json`) to make sure your keys are properly documented.
Using your own starter in a compatible IDE is also a good idea to validate that quality of the metadata.

<a id="features.developing-auto-configuration.custom-starter.autoconfigure-module"></a>

### The “autoconfigure” Module

The `autoconfigure` module contains everything that is necessary to get started with the library.
It may also contain configuration key definitions (such as [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/context/properties/ConfigurationProperties.html)) and any callback interface that can be used to further customize how the components are initialized.

> [!TIP]
> You should mark the dependencies to the library as optional so that you can include the `autoconfigure` module in your projects more easily.
> If you do it that way, the library is not provided and, by default, Spring Boot backs off.

Spring Boot uses an annotation processor to collect the conditions on auto-configurations in a metadata file (`META-INF/spring-autoconfigure-metadata.properties`).
If that file is present, it is used to eagerly filter auto-configurations that do not match, which will improve startup time.

When building with Maven, configure the compiler plugin (3.12.0 or later) to add `spring-boot-autoconfigure-processor` to the annotation processor paths:

```xml
<project>
	<build>
		<plugins>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-compiler-plugin</artifactId>
				<configuration>
					<annotationProcessorPaths>
						<path>
							<groupId>org.springframework.boot</groupId>
							<artifactId>spring-boot-autoconfigure-processor</artifactId>
						</path>
					</annotationProcessorPaths>
				</configuration>
			</plugin>
		</plugins>
	</build>
</project>
```

With Gradle, the dependency should be declared in the `annotationProcessor` configuration, as shown in the following example:

```gradle
dependencies {
	annotationProcessor "org.springframework.boot:spring-boot-autoconfigure-processor"
}
```

<a id="features.developing-auto-configuration.custom-starter.starter-module"></a>

### Starter Module

The starter is really an empty jar.
Its only purpose is to provide the necessary dependencies to work with the library.
You can think of it as an opinionated view of what is required to get started.

Do not make assumptions about the project in which your starter is added.
If the library you are auto-configuring typically requires other starters, mention them as well.
Providing a proper set of *default* dependencies may be hard if the number of optional dependencies is high, as you should avoid including dependencies that are unnecessary for a typical usage of the library.
In other words, you should not include optional dependencies.

> [!NOTE]
> Either way, your starter must reference the core Spring Boot starter (`spring-boot-starter`) directly or indirectly (there is no need to add it if your starter relies on another starter).
> If a project is created with only your custom starter, Spring Boot’s core features will be honoured by the presence of the core starter.
