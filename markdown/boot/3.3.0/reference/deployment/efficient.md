---
title: "Efficient Deployments"
source: "reference:deployment/efficient.adoc"
---

<a id="deployment.efficient"></a>

# Efficient Deployments

<a id="deployment.efficient.unpacking"></a>

## Unpacking the Executable JAR

You can run your application using the executable jar, but loading the classes from nested jars has a small cost.
Depending on the size of the jar, running the application from an exploded structure is faster and recommended in production.
Certain PaaS implementations may also choose to extract archives before they run.
For example, Cloud Foundry operates this way.

Spring Boot supports extracting your application to a directory using different layouts.
The default layout is the most efficient, and is [CDS friendly](#deployment.efficient.cds).

In this layout, the libraries are extracted to a `lib/` folder, and the application JAR
contains the application classes and a manifest which references the libraries in the `lib/` folder.

```shell
$ java -Djarmode=tools -jar my-app.jar extract
$ java -jar my-app/my-app.jar
```

After startup, you should not expect any differences.

> [!TIP]
> Run `java -Djarmode=tools -jar my-app.jar help extract` to see all possible options.

<a id="deployment.efficient.cds"></a>

## Optimize Startup Time with CDS

Class Data Sharing (CDS) is a [JVM feature](https://docs.oracle.com/en/java/javase/17/vm/class-data-sharing.html) that can help reduce the startup time and memory footprint of Java applications.

To use it, you should first perform a training run on your application in exploded form:

```shell
$ java -Djarmode=tools -jar my-app.jar extract --destination application
$ cd application
$ java -XX:ArchiveClassesAtExit=application.jsa -Dspring.context.exit=onRefresh -jar my-app.jar
```

This creates an `application.jsa` file that can be reused as long as the application is not updated.

To use the cache, you need to add an extra parameter when starting the application:

```shell
$ java -XX:SharedArchiveFile=application.jsa -jar my-app.jar
```

> [!NOTE]
> For more details about CDS, refer to the [Spring Framework reference documentation](https://docs.spring.io/spring-framework/reference/6.1.8/integration/cds.html)

<a id="deployment.efficient.aot"></a>

## Using Ahead-of-time Processing With the JVM

It’s beneficial for the startup time to run your application using the AOT generated initialization code.
First, you need to ensure that the jar you are building includes AOT generated code.

> [!NOTE]
> CDS and AOT can be combined to further improve startup time.

For Maven, this means that you should build with `-Pnative` to activate the `native` profile:

```shell
$ mvn -Pnative package
```

For Gradle, you need to ensure that your build includes the `org.springframework.boot.aot` plugin.

When the JAR has been built, run it with `spring.aot.enabled` system property set to `true`. For example:

```shell
$ java -Dspring.aot.enabled=true -jar myapplication.jar

........ Starting AOT-processed MyApplication ...
```

Beware that using the ahead-of-time processing has drawbacks.
It implies the following restrictions:

- The classpath is fixed and fully defined at build time
- The beans defined in your application cannot change at runtime, meaning:

  - The Spring `@Profile` annotation and profile-specific configuration [have limitations](../../how-to/aot.md#howto.aot.conditions).
  - Properties that change if a bean is created are not supported (for example, `@ConditionalOnProperty` and `.enable` properties).

To learn more about ahead-of-time processing, please see the [Understanding Spring Ahead-of-Time Processing section](../native-image/introducing-graalvm-native-images.md#native-image.introducing-graalvm-native-images.understanding-aot-processing).

<a id="deployment.efficient.checkpoint-restore"></a>

## Checkpoint and Restore With the JVM

[Coordinated Restore at Checkpoint](https://wiki.openjdk.org/display/crac/Main) (CRaC) is an OpenJDK project that defines a new Java API to allow you to checkpoint and restore an application on the HotSpot JVM.
It is based on [CRIU](https://github.com/checkpoint-restore/criu), a project that implements checkpoint/restore functionality on Linux.

The principle is the following: you start your application almost as usual but with a CRaC enabled version of the JDK like [BellSoft Liberica JDK with CRaC](https://bell-sw.com/pages/downloads/?package=jdk-crac) or [Azul Zulu JDK with CRaC](https://www.azul.com/downloads/?package=jdk-crac#zulu).
Then at some point, potentially after some workloads that will warm up your JVM by executing all common code paths, you trigger a checkpoint using an API call, a `jcmd` command, an HTTP endpoint, or a different mechanism.

A memory representation of the running JVM, including its warmness, is then serialized to disk, allowing a fast restoration at a later point, potentially on another machine with a similar operating system and CPU architecture.
The restored process retains all the capabilities of the HotSpot JVM, including further JIT optimizations at runtime.

Based on the foundations provided by Spring Framework, Spring Boot provides support for checkpointing and restoring your application, and manages out-of-the-box the lifecycle of resources such as socket, files and thread pools [on a limited scope](https://github.com/spring-projects/spring-lifecycle-smoke-tests/blob/main/STATUS.adoc).
Additional lifecycle management is expected for other dependencies and potentially for the application code dealing with such resources.

You can find more details about the two modes supported ("on demand checkpoint/restore of a running application" and "automatic checkpoint/restore at startup"), how to enable checkpoint and restore support and some guidelines in [the Spring Framework JVM Checkpoint Restore support documentation](https://docs.spring.io/spring-framework/reference/6.1.8/integration/checkpoint-restore.html).
