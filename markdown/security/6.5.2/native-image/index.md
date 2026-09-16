---
title: "GraalVM Native Image Support"
source: "ROOT:native-image/index.adoc"
---

# GraalVM Native Image Support

Spring Boot 3.0 provides [support for generating native images with GraalVM](https://docs.spring.io/spring-boot/docs/current/reference/html/native-image.html#native-image.introducing-graalvm-native-images).
Spring Security integrates with that support and provides its features ready for native images.

However, as mentioned in the [Spring Boot documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/native-image.html#native-image.introducing-graalvm-native-images.understanding-aot-processing.hint-file-generation), there are some cases where we need to provide hints to be used by GraalVM.

This section aims to provide guidance in some Spring Security features that likely need to have additional hints provided by the application.
