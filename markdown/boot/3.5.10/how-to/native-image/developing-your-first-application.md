---
title: "Developing Your First GraalVM Native Application"
source: "how-to:native-image/developing-your-first-application.adoc"
---

<a id="howto.native-image.developing-your-first-application"></a>

# Developing Your First GraalVM Native Application

There are two main ways to build a Spring Boot native image application:

- Using Spring Boot [support for Cloud Native Buildpacks](../../reference/packaging/container-images/cloud-native-buildpacks.md) with the [Paketo Java Native Image buildpack](https://paketo.io/docs/reference/java-native-image-reference/) to generate a lightweight container containing a native executable.
- Using GraalVM Native Build Tools to generate a native executable.

> [!TIP]
> The easiest way to start a new native Spring Boot project is to go to [start.spring.io](https://start.spring.io), add the `GraalVM Native Support` dependency and generate the project.
> The included `HELP.md` file will provide getting started hints.

<a id="howto.native-image.developing-your-first-application.sample-application"></a>

## Sample Application

We need an example application that we can use to create our native image.
For our purposes, the simple "Hello World!" web application that’s covered in the [tutorial:first-application/index.adoc](../../tutorial/first-application/index.md) section will suffice.

To recap, our main application code looks like this:

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@SpringBootApplication
public class MyApplication {

	@RequestMapping("/")
	String home() {
		return "Hello World!";
	}

	public static void main(String[] args) {
		SpringApplication.run(MyApplication.class, args);
	}

}
```

This application uses Spring MVC and embedded Tomcat, both of which have been tested and verified to work with GraalVM native images.

<a id="howto.native-image.developing-your-first-application.buildpacks"></a>

## Building a Native Image Using Buildpacks

Spring Boot supports building Docker images containing native executables, using Cloud Native Buildpacks (CNB) integration with both Maven and Gradle and the [Paketo Java Native Image buildpack](https://paketo.io/docs/reference/java-native-image-reference/).
This means you can just type a single command and quickly get a sensible image into your locally running Docker daemon.
The resulting image doesn’t contain a JVM, instead the native image is compiled statically.
This leads to smaller images.

> [!NOTE]
> The CNB builder used for the images is `paketobuildpacks/builder-noble-java-tiny:latest`.
> It has a small footprint and reduced attack surface. It does not include a shell and contains a reduced set of system libraries.
> If you need more tools in the resulting image, you can use `paketobuildpacks/ubuntu-noble-run:latest` as the **run** image.

<a id="howto.native-image.developing-your-first-application.buildpacks.system-requirements"></a>

### System Requirements

Docker should be installed. See [Get Docker](https://docs.docker.com/installation/#installation) for more details.
[Configure it to allow non-root user](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user) if you are on Linux.

> [!NOTE]
> You can run `docker run hello-world` (without `sudo`) to check the Docker daemon is reachable as expected.
> Check the [Maven](https://docs.spring.io/spring-boot/3.5.10/maven-plugin/build-image.html#build-image.docker-daemon) or [Gradle](https://docs.spring.io/spring-boot/3.5.10/gradle-plugin/packaging-oci-image.html#build-image.docker-daemon) Spring Boot plugin documentation for more details.

> [!TIP]
> On macOS, it is recommended to increase the memory allocated to Docker to at least `8GB`, and potentially add more CPUs as well.
> See this [Stack Overflow answer](https://stackoverflow.com/questions/44533319/how-to-assign-more-memory-to-docker-container/44533437#44533437) for more details.
> On Microsoft Windows, make sure to enable the [Docker WSL 2 backend](https://docs.docker.com/docker-for-windows/wsl/) for better performance.

<a id="howto.native-image.developing-your-first-application.buildpacks.maven"></a>

### Using Maven

To build a native image container using Maven you should ensure that your `pom.xml` file uses the `spring-boot-starter-parent` and the `org.graalvm.buildtools:native-maven-plugin`.
You should have a `<parent>` section that looks like this:

```xml
<parent>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-parent</artifactId>
	<version>3.5.10</version>
</parent>
```

You additionally should have this in the `<build> <plugins>` section:

```xml
<plugin>
	<groupId>org.graalvm.buildtools</groupId>
	<artifactId>native-maven-plugin</artifactId>
</plugin>
```

The `spring-boot-starter-parent` declares a `native` profile that configures the executions that need to run in order to create a native image.
You can activate profiles using the `-P` flag on the command line.

> [!TIP]
> If you don’t want to use `spring-boot-starter-parent` you’ll need to configure executions for the `process-aot` goal from Spring Boot’s plugin and the `add-reachability-metadata` goal from the Native Build Tools plugin.

To build the image, you can run the `spring-boot:build-image` goal with the `native` profile active:

```shell
$ mvn -Pnative spring-boot:build-image
```

<a id="howto.native-image.developing-your-first-application.buildpacks.gradle"></a>

### Using Gradle

The Spring Boot Gradle plugin automatically configures AOT tasks when the GraalVM Native Image plugin is applied.
You should check that your Gradle build contains a `plugins` block that includes `org.graalvm.buildtools.native`.

As long as the `org.graalvm.buildtools.native` plugin is applied, the `bootBuildImage` task will generate a native image rather than a JVM one.
You can run the task using:

```shell
$ gradle bootBuildImage
```

<a id="howto.native-image.developing-your-first-application.buildpacks.running"></a>

### Running the example

Once you have run the appropriate build command, a Docker image should be available.
You can start your application using `docker run`:

```shell
$ docker run --rm -p 8080:8080 docker.io/library/myproject:0.0.1-SNAPSHOT
```

You should see output similar to the following:

```shell
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::  (v{version-spring-boot})
....... . . .
....... . . . (log output here)
....... . . .
........ Started MyApplication in 0.08 seconds (process running for 0.095)
```

> [!NOTE]
> The startup time differs from machine to machine, but it should be much faster than a Spring Boot application running on a JVM.

If you open a web browser to `localhost:8080`, you should see the following output:

```
Hello World!
```

To gracefully exit the application, press `ctrl-c`.

<a id="howto.native-image.developing-your-first-application.native-build-tools"></a>

## Building a Native Image using Native Build Tools

If you want to generate a native executable directly without using Docker, you can use GraalVM Native Build Tools.
Native Build Tools are plugins shipped by GraalVM for both Maven and Gradle.
You can use them to perform a variety of GraalVM tasks, including generating a native image.

<a id="howto.native-image.developing-your-first-application.native-build-tools.prerequisites"></a>

### Prerequisites

To build a native image using the Native Build Tools, you’ll need a GraalVM distribution on your machine.
You can either download it manually on the [Liberica Native Image Kit page](https://bell-sw.com/pages/downloads/native-image-kit/#/nik-22-17), or you can use a download manager like SDKMAN!.

<a id="howto.native-image.developing-your-first-application.native-build-tools.prerequisites.linux-macos"></a>

#### Linux and macOS

To install the native image compiler on macOS or Linux, we recommend using SDKMAN!.
Get SDKMAN! from [sdkman.io](https://sdkman.io) and install the Liberica GraalVM distribution by using the following commands:

```shell
$ sdk install java 22.3.r17-nik
$ sdk use java 22.3.r17-nik
```

Verify that the correct version has been configured by checking the output of `java -version`:

```shell
$ java -version
openjdk version "17.0.5" 2022-10-18 LTS
OpenJDK Runtime Environment GraalVM 22.3.0 (build 17.0.5+8-LTS)
OpenJDK 64-Bit Server VM GraalVM 22.3.0 (build 17.0.5+8-LTS, mixed mode)
```

<a id="howto.native-image.developing-your-first-application.native-build-tools.prerequisites.windows"></a>

#### Windows

On Windows, follow [these instructions](https://medium.com/graalvm/using-graalvm-and-native-image-on-windows-10-9954dc071311) to install either [GraalVM](https://www.graalvm.org/downloads/) or [Liberica Native Image Kit](https://bell-sw.com/pages/downloads/native-image-kit/#/nik-22-17) in version 22.3, the Visual Studio Build Tools and the Windows SDK.
Due to the [Windows related command-line maximum length](https://docs.microsoft.com/en-US/troubleshoot/windows-client/shell-experience/command-line-string-limitation), make sure to use x64 Native Tools Command Prompt instead of the regular Windows command line to run Maven or Gradle plugins.

<a id="howto.native-image.developing-your-first-application.native-build-tools.maven"></a>

### Using Maven

As with the [buildpacks support](#howto.native-image.developing-your-first-application.buildpacks.maven), you need to make sure that you’re using `spring-boot-starter-parent` in order to inherit the `native` profile and that the `org.graalvm.buildtools:native-maven-plugin` plugin is used.

With the `native` profile active, you can invoke the `native:compile` goal to trigger `native-image` compilation:

```shell
$ mvn -Pnative native:compile
```

The native image executable can be found in the `target` directory.

<a id="howto.native-image.developing-your-first-application.native-build-tools.gradle"></a>

### Using Gradle

When the Native Build Tools Gradle plugin is applied to your project, the Spring Boot Gradle plugin will automatically trigger the Spring AOT engine.
Task dependencies are automatically configured, so you can just run the standard `nativeCompile` task to generate a native image:

```shell
$ gradle nativeCompile
```

The native image executable can be found in the `build/native/nativeCompile` directory.

<a id="howto.native-image.developing-your-first-application.native-build-tools.running"></a>

### Running the Example

At this point, your application should work. You can now start the application by running it directly:

#### Maven

```shell
$ target/myproject
```

#### Gradle

```shell
$ build/native/nativeCompile/myproject
```

You should see output similar to the following:

```shell
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::  (v3.5.10)
....... . . .
....... . . . (log output here)
....... . . .
........ Started MyApplication in 0.08 seconds (process running for 0.095)
```

> [!NOTE]
> The startup time differs from machine to machine, but it should be much faster than a Spring Boot application running on a JVM.

If you open a web browser to `localhost:8080`, you should see the following output:

```
Hello World!
```

To gracefully exit the application, press `ctrl-c`.
