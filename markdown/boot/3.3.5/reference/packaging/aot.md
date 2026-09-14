---
title: "Ahead-of-Time Processing With the JVM"
source: "reference:packaging/aot.adoc"
---

<a id="packaging.aot"></a>

# Ahead-of-Time Processing With the JVM

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

To learn more about ahead-of-time processing, please see the [packaging/native-image/introducing-graalvm-native-images.adoc#packaging.native-image.introducing-graalvm-native-images.understanding-aot-processing](native-image/introducing-graalvm-native-images.md#packaging.native-image.introducing-graalvm-native-images.understanding-aot-processing) section.
