---
title: "SpringApplication"
source: "reference:features/spring-application.adoc"
---

<a id="features.spring-application"></a>

# SpringApplication

The `SpringApplication` class provides a convenient way to bootstrap a Spring application that is started from a `main()` method.
In many situations, you can delegate to the static `SpringApplication.run` method, as shown in the following example:

#### Java

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyApplication {

	public static void main(String[] args) {
		SpringApplication.run(MyApplication.class, args);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
@SpringBootApplication
class MyApplication

fun main(args: Array<String>) {
	runApplication<MyApplication>(*args)
}
```

When your application starts, you should see something similar to the following output:

```
Unresolved include directive in modules/reference/pages/features/spring-application.adoc - include::ROOT:partial$application/spring-application.txt[]
```

By default, `INFO` logging messages are shown, including some relevant startup details, such as the user that launched the application.
If you need a log level other than `INFO`, you can set it, as described in [Log Levels](logging.md#features.logging.log-levels).
The application version is determined using the implementation version from the main application class’s package.
Startup information logging can be turned off by setting `spring.main.log-startup-info` to `false`.
This will also turn off logging of the application’s active profiles.

> [!TIP]
> To add additional logging during startup, you can override `logStartupInfo(boolean)` in a subclass of `SpringApplication`.

<a id="features.spring-application.startup-failure"></a>

## Startup Failure

If your application fails to start, registered `FailureAnalyzers` get a chance to provide a dedicated error message and a concrete action to fix the problem.
For instance, if you start a web application on port `8080` and that port is already in use, you should see something similar to the following message:

```
***************************
APPLICATION FAILED TO START
***************************

Description:

Embedded servlet container failed to start. Port 8080 was already in use.

Action:

Identify and stop the process that is listening on port 8080 or configure this application to listen on another port.
```

> [!NOTE]
> Spring Boot provides numerous `FailureAnalyzer` implementations, and you can [add your own](../../how-to/application.md#howto.application.failure-analyzer).

If no failure analyzers are able to handle the exception, you can still display the full conditions report to better understand what went wrong.
To do so, you need to [enable the `debug` property](external-config.md) or [enable `DEBUG` logging](logging.md#features.logging.log-levels) for `org.springframework.boot.autoconfigure.logging.ConditionEvaluationReportLoggingListener`.

For instance, if you are running your application by using `java -jar`, you can enable the `debug` property as follows:

```shell
$ java -jar myproject-0.0.1-SNAPSHOT.jar --debug
```

<a id="features.spring-application.lazy-initialization"></a>

## Lazy Initialization

`SpringApplication` allows an application to be initialized lazily.
When lazy initialization is enabled, beans are created as they are needed rather than during application startup.
As a result, enabling lazy initialization can reduce the time that it takes your application to start.
In a web application, enabling lazy initialization will result in many web-related beans not being initialized until an HTTP request is received.

A downside of lazy initialization is that it can delay the discovery of a problem with the application.
If a misconfigured bean is initialized lazily, a failure will no longer occur during startup and the problem will only become apparent when the bean is initialized.
Care must also be taken to ensure that the JVM has sufficient memory to accommodate all of the application’s beans and not just those that are initialized during startup.
For these reasons, lazy initialization is not enabled by default and it is recommended that fine-tuning of the JVM’s heap size is done before enabling lazy initialization.

Lazy initialization can be enabled programmatically using the `lazyInitialization` method on `SpringApplicationBuilder` or the `setLazyInitialization` method on `SpringApplication`.
Alternatively, it can be enabled using the `spring.main.lazy-initialization` property as shown in the following example:

#### Properties

```properties
spring.main.lazy-initialization=true
```

#### YAML

```yaml
spring:
  main:
    lazy-initialization: true
```

> [!TIP]
> If you want to disable lazy initialization for certain beans while using lazy initialization for the rest of the application, you can explicitly set their lazy attribute to false using the `@Lazy(false)` annotation.

<a id="features.spring-application.banner"></a>

## Customizing the Banner

The banner that is printed on start up can be changed by adding a `banner.txt` file to your classpath or by setting the `spring.banner.location` property to the location of such a file.
If the file has an encoding other than UTF-8, you can set `spring.banner.charset`.

Inside your `banner.txt` file, you can use any key available in the `Environment` as well as any of the following placeholders:

| Variable | Description |
| --- | --- |
| `${application.version}` | The version number of your application, as declared in `MANIFEST.MF`. For example, `Implementation-Version: 1.0` is printed as `1.0`. |
| `${application.formatted-version}` | The version number of your application, as declared in `MANIFEST.MF` and formatted for display (surrounded with brackets and prefixed with `v`). For example `(v1.0)`. |
| `${spring-boot.version}` | The Spring Boot version that you are using. For example `3.3.1`. |
| `${spring-boot.formatted-version}` | The Spring Boot version that you are using, formatted for display (surrounded with brackets and prefixed with `v`). For example `(v3.3.1)`. |
| `${Ansi.NAME}` (or `${AnsiColor.NAME}`, `${AnsiBackground.NAME}`, `${AnsiStyle.NAME}`) | Where `NAME` is the name of an ANSI escape code. See [`AnsiPropertySource`](https://docs.spring.io/spring-boot/3.3.1/api/java/org/springframework/boot/ansi/AnsiPropertySource.html) for details. |
| `${application.title}` | The title of your application, as declared in `MANIFEST.MF`. For example `Implementation-Title: MyApp` is printed as `MyApp`. |

> [!TIP]
> The `SpringApplication.setBanner(…​)` method can be used if you want to generate a banner programmatically.
> Use the `org.springframework.boot.Banner` interface and implement your own `printBanner()` method.

You can also use the `spring.main.banner-mode` property to determine if the banner has to be printed on `System.out` (`console`), sent to the configured logger (`log`), or not produced at all (`off`).

The printed banner is registered as a singleton bean under the following name: `springBootBanner`.

> [!NOTE]
> The `application.title`, `application.version`, and `application.formatted-version` properties are only available if you are using `java -jar` or `java -cp` with Spring Boot launchers.
> The values will not be resolved if you are running an unpacked jar and starting it with `java -cp <classpath> <mainclass>`
> or running your application as a native image.
>
> To use the `application.` properties, launch your application as a packed jar using `java -jar` or as an unpacked jar using `java org.springframework.boot.loader.launch.JarLauncher`.
> This will initialize the `application.` banner properties before building the classpath and launching your app.

<a id="features.spring-application.customizing-spring-application"></a>

## Customizing SpringApplication

If the `SpringApplication` defaults are not to your taste, you can instead create a local instance and customize it.
For example, to turn off the banner, you could write:

#### Java

```java
import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyApplication {

	public static void main(String[] args) {
		SpringApplication application = new SpringApplication(MyApplication.class);
		application.setBannerMode(Banner.Mode.OFF);
		application.run(args);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.Banner
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class MyApplication

fun main(args: Array<String>) {
	runApplication<MyApplication>(*args) {
		setBannerMode(Banner.Mode.OFF)
	}
}
```

> [!NOTE]
> The constructor arguments passed to `SpringApplication` are configuration sources for Spring beans.
> In most cases, these are references to `@Configuration` classes, but they could also be direct references `@Component` classes.

It is also possible to configure the `SpringApplication` by using an `application.properties` file.
See *[Externalized Configuration](external-config.md)* for details.

For a complete list of the configuration options, see the [`SpringApplication` Javadoc](https://docs.spring.io/spring-boot/3.3.1/api/java/org/springframework/boot/SpringApplication.html).

<a id="features.spring-application.fluent-builder-api"></a>

## Fluent Builder API

If you need to build an `ApplicationContext` hierarchy (multiple contexts with a parent/child relationship) or if you prefer using a “fluent” builder API, you can use the `SpringApplicationBuilder`.

The `SpringApplicationBuilder` lets you chain together multiple method calls and includes `parent` and `child` methods that let you create a hierarchy, as shown in the following example:

#### Java

```java
		new SpringApplicationBuilder().sources(Parent.class)
			.child(Application.class)
			.bannerMode(Banner.Mode.OFF)
			.run(args);
```

#### Kotlin

```kotlin
		SpringApplicationBuilder()
			.sources(Parent::class.java)
			.child(Application::class.java)
			.bannerMode(Banner.Mode.OFF)
			.run(*args)
```

> [!NOTE]
> There are some restrictions when creating an `ApplicationContext` hierarchy.
> For example, Web components **must** be contained within the child context, and the same `Environment` is used for both parent and child contexts.
> See the [`SpringApplicationBuilder` Javadoc](https://docs.spring.io/spring-boot/3.3.1/api/java/org/springframework/boot/builder/SpringApplicationBuilder.html) for full details.

<a id="features.spring-application.application-availability"></a>

## Application Availability

When deployed on platforms, applications can provide information about their availability to the platform using infrastructure such as [Kubernetes Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/).
Spring Boot includes out-of-the box support for the commonly used “liveness” and “readiness” availability states.
If you are using Spring Boot’s “actuator” support then these states are exposed as health endpoint groups.

In addition, you can also obtain availability states by injecting the `ApplicationAvailability` interface into your own beans.

<a id="features.spring-application.application-availability.liveness"></a>

### Liveness State

The “Liveness” state of an application tells whether its internal state allows it to work correctly, or recover by itself if it is currently failing.
A broken “Liveness” state means that the application is in a state that it cannot recover from, and the infrastructure should restart the application.

> [!NOTE]
> In general, the "Liveness" state should not be based on external checks, such as [Health checks](../actuator/endpoints.md#actuator.endpoints.health).
> If it did, a failing external system (a database, a Web API, an external cache) would trigger massive restarts and cascading failures across the platform.

The internal state of Spring Boot applications is mostly represented by the Spring `ApplicationContext`.
If the application context has started successfully, Spring Boot assumes that the application is in a valid state.
An application is considered live as soon as the context has been refreshed, see [Spring Boot application lifecycle and related Application Events](#features.spring-application.application-events-and-listeners).

<a id="features.spring-application.application-availability.readiness"></a>

### Readiness State

The “Readiness” state of an application tells whether the application is ready to handle traffic.
A failing “Readiness” state tells the platform that it should not route traffic to the application for now.
This typically happens during startup, while `CommandLineRunner` and `ApplicationRunner` components are being processed, or at any time if the application decides that it is too busy for additional traffic.

An application is considered ready as soon as application and command-line runners have been called, see [Spring Boot application lifecycle and related Application Events](#features.spring-application.application-events-and-listeners).

> [!TIP]
> Tasks expected to run during startup should be executed by `CommandLineRunner` and `ApplicationRunner` components instead of using Spring component lifecycle callbacks such as `@PostConstruct`.

<a id="features.spring-application.application-availability.managing"></a>

### Managing the Application Availability State

Application components can retrieve the current availability state at any time, by injecting the `ApplicationAvailability` interface and calling methods on it.
More often, applications will want to listen to state updates or update the state of the application.

For example, we can export the "Readiness" state of the application to a file so that a Kubernetes "exec Probe" can look at this file:

#### Java

```java
import org.springframework.boot.availability.AvailabilityChangeEvent;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class MyReadinessStateExporter {

	@EventListener
	public void onStateChange(AvailabilityChangeEvent<ReadinessState> event) {
		switch (event.getState()) {
			case ACCEPTING_TRAFFIC -> {
				// create file /tmp/healthy
			}
			case REFUSING_TRAFFIC -> {
				// remove file /tmp/healthy
			}
		}
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.availability.AvailabilityChangeEvent
import org.springframework.boot.availability.ReadinessState
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

@Component
class MyReadinessStateExporter {

	@EventListener
	fun onStateChange(event: AvailabilityChangeEvent<ReadinessState?>) {
		when (event.state) {
			ReadinessState.ACCEPTING_TRAFFIC -> {
				// create file /tmp/healthy
			}
			ReadinessState.REFUSING_TRAFFIC -> {
				// remove file /tmp/healthy
			}
			else -> {
				// ...
			}
		}
	}

}
```

We can also update the state of the application, when the application breaks and cannot recover:

#### Java

```java
import org.springframework.boot.availability.AvailabilityChangeEvent;
import org.springframework.boot.availability.LivenessState;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class MyLocalCacheVerifier {

	private final ApplicationEventPublisher eventPublisher;

	public MyLocalCacheVerifier(ApplicationEventPublisher eventPublisher) {
		this.eventPublisher = eventPublisher;
	}

	public void checkLocalCache() {
		try {
			// ...
		}
		catch (CacheCompletelyBrokenException ex) {
			AvailabilityChangeEvent.publish(this.eventPublisher, ex, LivenessState.BROKEN);
		}
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.availability.AvailabilityChangeEvent
import org.springframework.boot.availability.LivenessState
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Component

@Component
class MyLocalCacheVerifier(private val eventPublisher: ApplicationEventPublisher) {

	fun checkLocalCache() {
		try {
			// ...
		} catch (ex: CacheCompletelyBrokenException) {
			AvailabilityChangeEvent.publish(eventPublisher, ex, LivenessState.BROKEN)
		}
	}

}
```

Spring Boot provides [Kubernetes HTTP probes for "Liveness" and "Readiness" with Actuator Health Endpoints](../actuator/endpoints.md#actuator.endpoints.kubernetes-probes).
You can get more guidance about [deploying Spring Boot applications on Kubernetes in the dedicated section](../../how-to/deployment/cloud.md#howto.deployment.cloud.kubernetes).

<a id="features.spring-application.application-events-and-listeners"></a>

## Application Events and Listeners

In addition to the usual Spring Framework events, such as [`ContextRefreshedEvent`](https://docs.spring.io/spring-framework/docs/6.1.10/javadoc-api/org/springframework/context/event/ContextRefreshedEvent.html), a `SpringApplication` sends some additional application events.

> [!NOTE]
> Some events are actually triggered before the `ApplicationContext` is created, so you cannot register a listener on those as a `@Bean`.
> You can register them with the `SpringApplication.addListeners(…​)` method or the `SpringApplicationBuilder.listeners(…​)` method.
>
> If you want those listeners to be registered automatically, regardless of the way the application is created, you can add a `META-INF/spring.factories` file to your project and reference your listener(s) by using the `org.springframework.context.ApplicationListener` key, as shown in the following example:
>
> ```
> org.springframework.context.ApplicationListener=com.example.project.MyListener
> ```

Application events are sent in the following order, as your application runs:

1. An `ApplicationStartingEvent` is sent at the start of a run but before any processing, except for the registration of listeners and initializers.
1. An `ApplicationEnvironmentPreparedEvent` is sent when the `Environment` to be used in the context is known but before the context is created.
1. An `ApplicationContextInitializedEvent` is sent when the `ApplicationContext` is prepared and ApplicationContextInitializers have been called but before any bean definitions are loaded.
1. An `ApplicationPreparedEvent` is sent just before the refresh is started but after bean definitions have been loaded.
1. An `ApplicationStartedEvent` is sent after the context has been refreshed but before any application and command-line runners have been called.
1. An `AvailabilityChangeEvent` is sent right after with `LivenessState.CORRECT` to indicate that the application is considered as live.
1. An `ApplicationReadyEvent` is sent after any [application and command-line runners](#features.spring-application.command-line-runner) have been called.
1. An `AvailabilityChangeEvent` is sent right after with `ReadinessState.ACCEPTING_TRAFFIC` to indicate that the application is ready to service requests.
1. An `ApplicationFailedEvent` is sent if there is an exception on startup.

The above list only includes `SpringApplicationEvent`s that are tied to a `SpringApplication`.
In addition to these, the following events are also published after `ApplicationPreparedEvent` and before `ApplicationStartedEvent`:

- A `WebServerInitializedEvent` is sent after the `WebServer` is ready.
`ServletWebServerInitializedEvent` and `ReactiveWebServerInitializedEvent` are the servlet and reactive variants respectively.
- A `ContextRefreshedEvent` is sent when an `ApplicationContext` is refreshed.

> [!TIP]
> You often need not use application events, but it can be handy to know that they exist.
> Internally, Spring Boot uses events to handle a variety of tasks.

> [!NOTE]
> Event listeners should not run potentially lengthy tasks as they execute in the same thread by default.
> Consider using [application and command-line runners](#features.spring-application.command-line-runner) instead.

Application events are sent by using Spring Framework’s event publishing mechanism.
Part of this mechanism ensures that an event published to the listeners in a child context is also published to the listeners in any ancestor contexts.
As a result of this, if your application uses a hierarchy of `SpringApplication` instances, a listener may receive multiple instances of the same type of application event.

To allow your listener to distinguish between an event for its context and an event for a descendant context, it should request that its application context is injected and then compare the injected context with the context of the event.
The context can be injected by implementing `ApplicationContextAware` or, if the listener is a bean, by using `@Autowired`.

<a id="features.spring-application.web-environment"></a>

## Web Environment

A `SpringApplication` attempts to create the right type of `ApplicationContext` on your behalf.
The algorithm used to determine a `WebApplicationType` is the following:

- If Spring MVC is present, an `AnnotationConfigServletWebServerApplicationContext` is used
- If Spring MVC is not present and Spring WebFlux is present, an `AnnotationConfigReactiveWebServerApplicationContext` is used
- Otherwise, `AnnotationConfigApplicationContext` is used

This means that if you are using Spring MVC and the new `WebClient` from Spring WebFlux in the same application, Spring MVC will be used by default.
You can override that easily by calling `setWebApplicationType(WebApplicationType)`.

It is also possible to take complete control of the `ApplicationContext` type that is used by calling `setApplicationContextFactory(…​)`.

> [!TIP]
> It is often desirable to call `setWebApplicationType(WebApplicationType.NONE)` when using `SpringApplication` within a JUnit test.

<a id="features.spring-application.application-arguments"></a>

## Accessing Application Arguments

If you need to access the application arguments that were passed to `SpringApplication.run(…​)`, you can inject a `org.springframework.boot.ApplicationArguments` bean.
The `ApplicationArguments` interface provides access to both the raw `String[]` arguments as well as parsed `option` and `non-option` arguments, as shown in the following example:

#### Java

```java
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	public MyBean(ApplicationArguments args) {
		boolean debug = args.containsOption("debug");
		List<String> files = args.getNonOptionArgs();
		if (debug) {
			System.out.println(files);
		}
		// if run with "--debug logfile.txt" prints ["logfile.txt"]
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.ApplicationArguments
import org.springframework.stereotype.Component

@Component
class MyBean(args: ApplicationArguments) {

	init {
		val debug = args.containsOption("debug")
		val files = args.nonOptionArgs
		if (debug) {
			println(files)
		}
		// if run with "--debug logfile.txt" prints ["logfile.txt"]
	}

}
```

> [!TIP]
> Spring Boot also registers a `CommandLinePropertySource` with the Spring `Environment`.
> This lets you also inject single application arguments by using the `@Value` annotation.

<a id="features.spring-application.command-line-runner"></a>

## Using the ApplicationRunner or CommandLineRunner

If you need to run some specific code once the `SpringApplication` has started, you can implement the `ApplicationRunner` or `CommandLineRunner` interfaces.
Both interfaces work in the same way and offer a single `run` method, which is called just before `SpringApplication.run(…​)` completes.

> [!NOTE]
> This contract is well suited for tasks that should run after application startup but before it starts accepting traffic.

The `CommandLineRunner` interfaces provides access to application arguments as a string array, whereas the `ApplicationRunner` uses the `ApplicationArguments` interface discussed earlier.
The following example shows a `CommandLineRunner` with a `run` method:

#### Java

```java
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class MyCommandLineRunner implements CommandLineRunner {

	@Override
	public void run(String... args) {
		// Do something...
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.CommandLineRunner
import org.springframework.stereotype.Component

@Component
class MyCommandLineRunner : CommandLineRunner {

	override fun run(vararg args: String) {
		// Do something...
	}

}
```

If several `CommandLineRunner` or `ApplicationRunner` beans are defined that must be called in a specific order, you can additionally implement the `org.springframework.core.Ordered` interface or use the `org.springframework.core.annotation.Order` annotation.

<a id="features.spring-application.application-exit"></a>

## Application Exit

Each `SpringApplication` registers a shutdown hook with the JVM to ensure that the `ApplicationContext` closes gracefully on exit.
All the standard Spring lifecycle callbacks (such as the `DisposableBean` interface or the `@PreDestroy` annotation) can be used.

In addition, beans may implement the `org.springframework.boot.ExitCodeGenerator` interface if they wish to return a specific exit code when `SpringApplication.exit()` is called.
This exit code can then be passed to `System.exit()` to return it as a status code, as shown in the following example:

#### Java

```java
import org.springframework.boot.ExitCodeGenerator;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MyApplication {

	@Bean
	public ExitCodeGenerator exitCodeGenerator() {
		return () -> 42;
	}

	public static void main(String[] args) {
		System.exit(SpringApplication.exit(SpringApplication.run(MyApplication.class, args)));
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.ExitCodeGenerator
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean

import kotlin.system.exitProcess

@SpringBootApplication
class MyApplication {

	@Bean
	fun exitCodeGenerator() = ExitCodeGenerator { 42 }

}

fun main(args: Array<String>) {
	exitProcess(SpringApplication.exit(
		runApplication<MyApplication>(*args)))
}
```

Also, the `ExitCodeGenerator` interface may be implemented by exceptions.
When such an exception is encountered, Spring Boot returns the exit code provided by the implemented `getExitCode()` method.

If there is more than one `ExitCodeGenerator`, the first non-zero exit code that is generated is used.
To control the order in which the generators are called, additionally implement the `org.springframework.core.Ordered` interface or use the `org.springframework.core.annotation.Order` annotation.

<a id="features.spring-application.admin"></a>

## Admin Features

It is possible to enable admin-related features for the application by specifying the `spring.application.admin.enabled` property.
This exposes the [`SpringApplicationAdminMXBean`](https://docs.spring.io/spring-boot/3.3.1/api/java/org/springframework/boot/admin/SpringApplicationAdminMXBean.html) on the platform `MBeanServer`.
You could use this feature to administer your Spring Boot application remotely.
This feature could also be useful for any service wrapper implementation.

> [!TIP]
> If you want to know on which HTTP port the application is running, get the property with a key of `local.server.port`.

<a id="features.spring-application.startup-tracking"></a>

## Application Startup tracking

During the application startup, the `SpringApplication` and the `ApplicationContext` perform many tasks related to the application lifecycle,
the beans lifecycle or even processing application events.
With [`ApplicationStartup`](https://docs.spring.io/spring-framework/docs/6.1.10/javadoc-api/org/springframework/core/metrics/ApplicationStartup.html), Spring Framework  [allows you to track the application startup sequence with `StartupStep` objects](https://docs.spring.io/spring-framework/reference/6.1.10/core/beans/context-introduction.html#context-functionality-startup).
This data can be collected for profiling purposes, or just to have a better understanding of an application startup process.

You can choose an `ApplicationStartup` implementation when setting up the `SpringApplication` instance.
For example, to use the `BufferingApplicationStartup`, you could write:

#### Java

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.metrics.buffering.BufferingApplicationStartup;

@SpringBootApplication
public class MyApplication {

	public static void main(String[] args) {
		SpringApplication application = new SpringApplication(MyApplication.class);
		application.setApplicationStartup(new BufferingApplicationStartup(2048));
		application.run(args);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.metrics.buffering.BufferingApplicationStartup
import org.springframework.boot.runApplication

@SpringBootApplication
class MyApplication

fun main(args: Array<String>) {
	runApplication<MyApplication>(*args) {
		applicationStartup = BufferingApplicationStartup(2048)
	}
}
```

The first available implementation, `FlightRecorderApplicationStartup` is provided by Spring Framework.
It adds Spring-specific startup events to a Java Flight Recorder session and is meant for profiling applications and correlating their Spring context lifecycle with JVM events (such as allocations, GCs, class loading…​).
Once configured, you can record data by running the application with the Flight Recorder enabled:

```shell
$ java -XX:StartFlightRecording:filename=recording.jfr,duration=10s -jar demo.jar
```

Spring Boot ships with the `BufferingApplicationStartup` variant; this implementation is meant for buffering the startup steps and draining them into an external metrics system.
Applications can ask for the bean of type `BufferingApplicationStartup` in any component.

Spring Boot can also be configured to expose a [`startup` endpoint](https://docs.spring.io/spring-boot/3.3.1/api/rest/actuator/startup.html) that provides this information as a JSON document.

<a id="features.spring-application.virtual-threads"></a>

## Virtual threads

If you’re running on Java 21 or up, you can enable virtual threads by setting the property `spring.threads.virtual.enabled` to `true`.

Before turning on this option for your application, you should consider [reading the official Java virtual threads documentation](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html).
In some cases, applications can experience lower throughput because of "Pinned Virtual Threads"; this page also explains how to detect such cases with JDK Flight Recorder or the `jcmd` CLI.

> [!WARNING]
> One side effect of virtual threads is that they are daemon threads.
> A JVM will exit if all of its threads are daemon threads.
> This behavior can be a problem when you rely on `@Scheduled` beans, for example, to keep your application alive.
> If you use virtual threads, the scheduler thread is a virtual thread and therefore a daemon thread and won’t keep the JVM alive.
> This not only affects scheduling and can be the case with other technologies too.
> To keep the JVM running in all cases, it is recommended to set the property `spring.main.keep-alive` to `true`.
> This ensures that the JVM is kept alive, even if all threads are virtual threads.
