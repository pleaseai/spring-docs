---
title: "System Requirements"
source: "ROOT:system-requirements.adoc"
---

<a id="getting-started.system-requirements"></a>

# System Requirements

Spring Boot 3.3.10 requires at least [Java 17](https://www.java.com) and is compatible with versions up to and including Java 23.
[Spring Framework 6.1.18](https://docs.spring.io/spring-framework/reference/6.1/) or above is also required.

Explicit build support is provided for the following build tools:

| Build Tool | Version |
| --- | --- |
| Maven | 3.6.3 or later |
| Gradle | 7.x (7.5 or later) and 8.x |

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
