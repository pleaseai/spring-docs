---
title: "System Requirements"
source: "ROOT:system-requirements.adoc"
---

<a id="getting-started.system-requirements"></a>

# System Requirements

Spring Boot 4.1.1 requires at least [Java 17](https://www.java.com) and is compatible with versions up to and including Java 26.
[Spring Framework 7.0.9](https://docs.spring.io/spring-framework/reference/7.0/) or above is also required.

Support for third-party projects may have additional or higher requirements.
Refer to the documentation for that support for further details.

Explicit build support is provided for the following build tools:

| Build Tool | Version |
| --- | --- |
| Maven | 3.6.3 or later |
| Gradle | Gradle 8.x (8.14 or later) and 9.x |

<a id="getting-started.system-requirements.servlet-containers"></a>

## Servlet Containers

Spring Boot supports the following embedded servlet containers:

| Name | Servlet Version |
| --- | --- |
| Tomcat 11.0.x | 6.1 |
| Jetty 12.1.x | 6.1 |

You can also deploy Spring Boot applications to any Servlet 6.1+ compatible container.

<a id="getting-started.system-requirements.graal"></a>

## GraalVM Native Images

Spring Boot applications can be [converted into a Native Image](reference/packaging/native-image/introducing-graalvm-native-images.md) using GraalVM 25 or above.

Images can be created using the [native build tools](https://github.com/graalvm/native-build-tools) Gradle/Maven plugins or `native-image` tool provided by GraalVM.
You can also create native images using the [native-image Paketo buildpack](https://github.com/paketo-buildpacks/native-image).

The following versions are supported:

| Name | Version |
| --- | --- |
| GraalVM Community | 25 |
| Native Build Tools | 1.1.8 |
