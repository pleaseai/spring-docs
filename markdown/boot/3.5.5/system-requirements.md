---
title: "System Requirements"
source: "ROOT:system-requirements.adoc"
---

<a id="getting-started.system-requirements"></a>

# System Requirements

Spring Boot 3.5.5 requires at least [Java 17](https://www.java.com) and is compatible with versions up to and including Java 24.
[Spring Framework 6.2.10](https://docs.spring.io/spring-framework/reference/6.2/) or above is also required.

Explicit build support is provided for the following build tools:

| Build Tool | Version |
| --- | --- |
| Maven | 3.6.3 or later |
| Gradle | Gradle 7.x (7.6.4 or later) or 8.x (8.4 or later) |

<a id="getting-started.system-requirements.servlet-containers"></a>

## Servlet Containers

Spring Boot supports the following embedded servlet containers:

| Name | Servlet Version |
| --- | --- |
| Tomcat 10.1 (10.1.25 or later) | 6.0 |
| Jetty 12.0 | 6.0 |
| Undertow 2.3 | 6.0 |

You can also deploy Spring Boot applications to any servlet 5.0+ compatible container.

<a id="getting-started.system-requirements.graal"></a>

## GraalVM Native Images

Spring Boot applications can be [converted into a Native Image](reference/packaging/native-image/introducing-graalvm-native-images.md) using GraalVM 22.3 or above.

Images can be created using the [native build tools](https://github.com/graalvm/native-build-tools) Gradle/Maven plugins or `native-image` tool provided by GraalVM.
You can also create native images using the [native-image Paketo buildpack](https://github.com/paketo-buildpacks/native-image).

The following versions are supported:

| Name | Version |
| --- | --- |
| GraalVM Community | 22.3 |
| Native Build Tools | 0.10.6 |
