---
title: "Traditional Deployment"
source: "how-to:deployment/traditional-deployment.adoc"
---

<a id="howto.traditional-deployment"></a>

# Traditional Deployment

Spring Boot supports traditional deployment as well as more modern forms of deployment.
This section answers common questions about traditional deployment.

<a id="howto.traditional-deployment.war"></a>

## Create a Deployable War File

> [!WARNING]
> Because Spring WebFlux does not strictly depend on the servlet API and applications are deployed by default on an embedded Reactor Netty server, War deployment is not supported for WebFlux applications.

The first step in producing a deployable war file is to provide a [`SpringBootServletInitializer`](https://docs.spring.io/spring-boot/4.0.1/api/java/org/springframework/boot/web/servlet/support/SpringBootServletInitializer.html) subclass and override its `configure` method.
Doing so makes use of Spring Framework’s servlet 3.0 support and lets you configure your application when it is launched by the servlet container.
Typically, you should update your application’s main class to extend [`SpringBootServletInitializer`](https://docs.spring.io/spring-boot/4.0.1/api/java/org/springframework/boot/web/servlet/support/SpringBootServletInitializer.html), as shown in the following example:

#### Java

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class MyApplication extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(MyApplication.class);
	}

	public static void main(String[] args) {
		SpringApplication.run(MyApplication.class, args);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.builder.SpringApplicationBuilder
import org.springframework.boot.runApplication
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer

@SpringBootApplication
class MyApplication : SpringBootServletInitializer() {

	override fun configure(application: SpringApplicationBuilder): SpringApplicationBuilder {
		return application.sources(MyApplication::class.java)
	}

}

fun main(args: Array<String>) {
	runApplication<MyApplication>(*args)
}

```

The next step is to update your build configuration such that your project produces a war file rather than a jar file.
If you use Maven and `spring-boot-starter-parent` (which configures Maven’s war plugin for you), all you need to do is to modify `pom.xml` to change the packaging to war, as follows:

```xml
<packaging>war</packaging>
```

If you use Gradle, you need to modify `build.gradle` to apply the war plugin to the project, as follows:

```gradle
apply plugin: 'war'
```

The final step in the process is to ensure that the embedded servlet container does not interfere with the servlet container to which the war file is deployed.

For Maven, you need to mark the embedded servlet container dependency as being `provided`.
For example:

```xml
<dependencies>
	<!-- ... -->
	<dependency>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-tomcat</artifactId>
		<scope>provided</scope>
	</dependency>
	<!-- ... -->
</dependencies>
```

If you use Gradle, you need to move only the runtime dependencies into the `providedRuntime` configuration.
For example:

```gradle
dependencies {
	// ...
	providedRuntime 'org.springframework.boot:spring-boot-starter-tomcat-runtime'
	// ...
}
```

> [!TIP]
> `providedRuntime` is preferred to Gradle’s `compileOnly` configuration.
> Among other limitations, `compileOnly` dependencies are not on the test classpath, so any web-based integration tests fail.

If you use the Spring Boot [build-tool-plugin:index.adoc](../../build-tool-plugin/index.md), marking the embedded servlet container dependency as provided produces an executable war file with the provided dependencies packaged in a `lib-provided` directory.
This means that, in addition to being deployable to a servlet container, you can also run your application by using `java -jar` on the command line.

<a id="howto.traditional-deployment.convert-existing-application"></a>

## Convert an Existing Application to Spring Boot

To convert an existing non-web Spring application to a Spring Boot application, replace the code that creates your [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/ApplicationContext.html) and replace it with calls to [`SpringApplication`](https://docs.spring.io/spring-boot/4.0.1/api/java/org/springframework/boot/SpringApplication.html) or [`SpringApplicationBuilder`](https://docs.spring.io/spring-boot/4.0.1/api/java/org/springframework/boot/builder/SpringApplicationBuilder.html).
Spring MVC web applications are generally amenable to first creating a deployable war application and then migrating it later to an executable war or jar.

To create a deployable war by extending [`SpringBootServletInitializer`](https://docs.spring.io/spring-boot/4.0.1/api/java/org/springframework/boot/web/servlet/support/SpringBootServletInitializer.html) (for example, in a class called `Application`) and adding the Spring Boot [`@SpringBootApplication`](https://docs.spring.io/spring-boot/4.0.1/api/java/org/springframework/boot/autoconfigure/SpringBootApplication.html) annotation, use code similar to that shown in the following example:

#### Java

```java

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class MyApplication extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		// Customize the application or call application.sources(...) to add sources
		// Since our example is itself a @Configuration class (through
		// @SpringBootApplication)
		// we actually do not need to override this method.
		return application;
	}
}

```

#### Kotlin

```kotlin

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.builder.SpringApplicationBuilder
import org.springframework.boot.runApplication
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer

@SpringBootApplication
class MyApplication : SpringBootServletInitializer() {

	override fun configure(application: SpringApplicationBuilder): SpringApplicationBuilder {
		// Customize the application or call application.sources(...) to add sources
		// Since our example is itself a @Configuration class (through @SpringBootApplication)
		// we actually do not need to override this method.
		return application
	}

}

```

Remember that, whatever you put in the `sources` is merely a Spring [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/ApplicationContext.html).
Normally, anything that already works should work here.
There might be some beans you can remove later and let Spring Boot provide its own defaults for them, but it should be possible to get something working before you need to do that.

Static resources can be moved to `/public` (or `/static` or `/resources` or `/META-INF/resources`) in the classpath root.
The same applies to `messages.properties` (which Spring Boot automatically detects in the root of the classpath).

Vanilla usage of Spring [`DispatcherServlet`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/web/servlet/DispatcherServlet.html) and Spring Security should require no further changes.
If you have other features in your application (for instance, using other servlets or filters), you may need to add some configuration to your `Application` context, by replacing those elements from the `web.xml`, as follows:

- A [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) of type [`Servlet`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/Servlet.html) or [`ServletRegistrationBean`](https://docs.spring.io/spring-boot/4.0.1/api/java/org/springframework/boot/web/servlet/ServletRegistrationBean.html) installs that bean in the container as if it were a `<servlet/>` and `<servlet-mapping/>` in `web.xml`.
- A [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) of type [`Filter`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/Filter.html) or [`FilterRegistrationBean`](https://docs.spring.io/spring-boot/4.0.1/api/java/org/springframework/boot/web/servlet/FilterRegistrationBean.html) behaves similarly (as a `<filter/>` and `<filter-mapping/>`).
- An [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/ApplicationContext.html) in an XML file can be added through an [`@ImportResource`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/ImportResource.html) in your `Application`.
Alternatively, cases where annotation configuration is heavily used already can be recreated in a few lines as [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) definitions.

Once the war file is working, you can make it executable by adding a `main` method to your `Application`, as shown in the following example:

#### Java

```java
	public static void main(String[] args) {
		SpringApplication.run(MyApplication.class, args);
	}
```

#### Kotlin

```kotlin
fun main(args: Array<String>) {
	runApplication<MyApplication>(*args)
}
```

> [!NOTE]
> If you intend to start your application as a war or as an executable application, you need to share the customizations of the builder in a method that is both available to the [`SpringBootServletInitializer`](https://docs.spring.io/spring-boot/4.0.1/api/java/org/springframework/boot/web/servlet/support/SpringBootServletInitializer.html) callback and in the `main` method in a class similar to the following:
>
> #### Java
>
> ```java
> import org.springframework.boot.Banner;
> import org.springframework.boot.autoconfigure.SpringBootApplication;
> import org.springframework.boot.builder.SpringApplicationBuilder;
> import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
>
> @SpringBootApplication
> public class MyApplication extends SpringBootServletInitializer {
>
> 	@Override
> 	protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
> 		return customizerBuilder(builder);
> 	}
>
> 	public static void main(String[] args) {
> 		customizerBuilder(new SpringApplicationBuilder()).run(args);
> 	}
>
> 	private static SpringApplicationBuilder customizerBuilder(SpringApplicationBuilder builder) {
> 		return builder.sources(MyApplication.class).bannerMode(Banner.Mode.OFF);
> 	}
>
> }
> ```
>
> #### Kotlin
>
> ```kotlin
> import org.springframework.boot.Banner
> import org.springframework.boot.autoconfigure.SpringBootApplication
> import org.springframework.boot.builder.SpringApplicationBuilder
> import org.springframework.boot.web.servlet.support.SpringBootServletInitializer
>
> @SpringBootApplication
> class MyApplication : SpringBootServletInitializer() {
>
> 	override fun configure(builder: SpringApplicationBuilder): SpringApplicationBuilder {
> 		return customizerBuilder(builder)
> 	}
>
> 	companion object {
>
> 		@JvmStatic
> 		fun main(args: Array<String>) {
> 			customizerBuilder(SpringApplicationBuilder()).run(*args)
> 		}
>
> 		private fun customizerBuilder(builder: SpringApplicationBuilder): SpringApplicationBuilder {
> 			return builder.sources(MyApplication::class.java).bannerMode(Banner.Mode.OFF)
> 		}
>
> 	}
>
> }
>
> ```

Applications can fall into more than one category:

- Servlet 3.0+ applications with no `web.xml`.
- Applications with a `web.xml`.
- Applications with a context hierarchy.
- Applications without a context hierarchy.

All of these should be amenable to translation, but each might require slightly different techniques.

Servlet 3.0+ applications might translate pretty easily if they already use the Spring Servlet 3.0+ initializer support classes.
Normally, all the code from an existing [`WebApplicationInitializer`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/web/WebApplicationInitializer.html) can be moved into a [`SpringBootServletInitializer`](https://docs.spring.io/spring-boot/4.0.1/api/java/org/springframework/boot/web/servlet/support/SpringBootServletInitializer.html).
If your existing application has more than one [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/ApplicationContext.html) (for example, if it uses [`AbstractDispatcherServletInitializer`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/web/servlet/support/AbstractDispatcherServletInitializer.html)) then you might be able to combine all your context sources into a single [`SpringApplication`](https://docs.spring.io/spring-boot/4.0.1/api/java/org/springframework/boot/SpringApplication.html).
The main complication you might encounter is if combining does not work and you need to maintain the context hierarchy.
See the [entry on building a hierarchy](../application.md#howto.application.context-hierarchy) for examples.
An existing parent context that contains web-specific features usually needs to be broken up so that all the [`ServletContextAware`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/web/context/ServletContextAware.html) components are in the child context.

Applications that are not already Spring applications might be convertible to Spring Boot applications, and the previously mentioned guidance may help.
However, you may yet encounter problems.
In that case, we suggest [asking questions on Stack Overflow with a tag of `spring-boot`](https://stackoverflow.com/questions/tagged/spring-boot).

<a id="howto.traditional-deployment.weblogic"></a>

## Deploying a WAR to WebLogic

To deploy a Spring Boot application to WebLogic, you must ensure that your servlet initializer **directly** implements [`WebApplicationInitializer`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/web/WebApplicationInitializer.html) (even if you extend from a base class that already implements it).

A typical initializer for WebLogic should resemble the following example:

#### Java

```java
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.web.WebApplicationInitializer;

@SpringBootApplication
public class MyApplication extends SpringBootServletInitializer implements WebApplicationInitializer {

}
```

#### Kotlin

```kotlin
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer
import org.springframework.web.WebApplicationInitializer

@SpringBootApplication
class MyApplication : SpringBootServletInitializer(), WebApplicationInitializer

```

If you use Logback, you also need to tell WebLogic to prefer the packaged version rather than the version that was pre-installed with the server.
You can do so by adding a `WEB-INF/weblogic.xml` file with the following contents:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<wls:weblogic-web-app
	xmlns:wls="http://xmlns.oracle.com/weblogic/weblogic-web-app"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://java.sun.com/xml/ns/javaee
		https://java.sun.com/xml/ns/javaee/ejb-jar_3_0.xsd
		http://xmlns.oracle.com/weblogic/weblogic-web-app
		https://xmlns.oracle.com/weblogic/weblogic-web-app/1.4/weblogic-web-app.xsd">
	<wls:container-descriptor>
		<wls:prefer-application-packages>
			<wls:package-name>org.slf4j</wls:package-name>
		</wls:prefer-application-packages>
	</wls:container-descriptor>
</wls:weblogic-web-app>
```
