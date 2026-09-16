---
title: "Testing GraalVM Native Images"
source: "how-to:native-image/testing-native-applications.adoc"
---

<a id="howto.native-image.testing"></a>

# Testing GraalVM Native Images

When writing native image applications, we recommend that you continue to use the JVM whenever possible to develop the majority of your unit and integration tests.
This will help keep developer build times down and allow you to use existing IDE integrations.
With broad test coverage on the JVM, you can then focus native image testing on the areas that are likely to be different.

For native image testing, you’re generally looking to ensure that the following aspects work:

- The Spring AOT engine is able to process your application, and it will run in an AOT-processed mode.
- GraalVM has enough hints to ensure that a valid native image can be produced.

<a id="howto.native-image.testing.with-the-jvm"></a>

## Testing Ahead-of-Time Processing With the JVM

When a Spring Boot application runs, it attempts to detect if it is running as a native image.
If it is running as a native image, it will initialize the application using the code that was generated during at build-time by the Spring AOT engine.

If the application is running on a regular JVM, then any AOT generated code is ignored.

Since the `native-image` compilation phase can take a while to complete, it’s sometimes useful to run your application on the JVM but have it use the AOT generated initialization code.
Doing so helps you to quickly validate that there are no errors in the AOT generated code and nothing is missing when your application is eventually converted to a native image.

To run a Spring Boot application on the JVM and have it use AOT generated code you can set the `spring.aot.enabled` system property to `true`.

For example:

```shell
$ java -Dspring.aot.enabled=true -jar myapplication.jar
```

> [!NOTE]
> You need to ensure that the jar you are testing includes AOT generated code.
> For Maven, this means that you should build with `-Pnative` to activate the `native` profile.
> For Gradle, you need to ensure that your build includes the `org.graalvm.buildtools.native` plugin.

If your application starts with the `spring.aot.enabled` property set to `true`, then you have higher confidence that it will work when converted to a native image.

You can also consider running integration tests against the running application.
For example, you could use the Spring [`WebClient`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html) to call your application REST endpoints.
Or you might consider using a project like Selenium to check your application’s HTML responses.

<a id="howto.native-image.testing.with-native-build-tools"></a>

## Testing With Native Build Tools

GraalVM Native Build Tools includes the ability to run tests inside a native image.
This can be helpful when you want to deeply test that the internals of your application work in a GraalVM native image.

Generating the native image that contains the tests to run can be a time-consuming operation, so most developers will probably prefer to use the JVM locally.
They can, however, be very useful as part of a CI pipeline.
For example, you might choose to run native tests once a day.

Spring Framework includes ahead-of-time support for running tests.
All the usual Spring testing features work with native image tests.
For example, you can continue to use the [`@SpringBootTest`](https://docs.spring.io/spring-boot/3.4.1/api/java/org/springframework/boot/test/context/SpringBootTest.html) annotation.
You can also use Spring Boot [test slices](../../reference/testing/spring-boot-applications.md#testing.spring-boot-applications.autoconfigured-tests) to test only specific parts of your application.

Spring Framework’s native testing support works in the following way:

- Tests are analyzed in order to discover any [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ApplicationContext.html) instances that will be required.
- Ahead-of-time processing is applied to each of these application contexts and assets are generated.
- A native image is created, with the generated assets being processed by GraalVM.
- The native image also includes the JUnit [`TestEngine`](https://junit.org/junit5/docs/5.11.4/api/org.junit.platform.engine/org/junit/platform/engine/TestEngine.html) configured with a list of the discovered tests.
- The native image is started, triggering the engine which will run each test and report results.

<a id="howto.native-image.testing.with-native-build-tools.maven"></a>

### Using Maven

To run native tests using Maven, ensure that your `pom.xml` file uses the `spring-boot-starter-parent`.
You should have a `<parent>` section that looks like this:

```xml
<parent>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-parent</artifactId>
	<version>3.4.1</version>
</parent>
```

The `spring-boot-starter-parent` declares a `nativeTest` profile that configures the executions that are needed to run the native tests.
You can activate profiles using the `-P` flag on the command line.

> [!TIP]
> If you don’t want to use `spring-boot-starter-parent` you’ll need to configure executions for the `process-test-aot` goal from the Spring Boot plugin and the `test` goal from the Native Build Tools plugin.

To build the image and run the tests, use the `test` goal with the `nativeTest` profile active:

```shell
$ mvn -PnativeTest test
```

<a id="howto.native-image.testing.with-native-build-tools.gradle"></a>

### Using Gradle

The Spring Boot Gradle plugin automatically configures AOT test tasks when the GraalVM Native Image plugin is applied.
You should check that your Gradle build contains a `plugins` block that includes `org.graalvm.buildtools.native`.

To run native tests using Gradle you can use the `nativeTest` task:

```shell
$ gradle nativeTest
```
