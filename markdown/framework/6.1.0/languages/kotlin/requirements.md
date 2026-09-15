---
title: "Requirements"
source: "ROOT:languages/kotlin/requirements.adoc"
---

<a id="kotlin-requirements"></a>

# Requirements

Spring Framework supports Kotlin 1.3+ and requires
[`kotlin-stdlib`](https://search.maven.org/artifact/org.jetbrains.kotlin/kotlin-stdlib)
(or one of its variants, such as [`kotlin-stdlib-jdk8`](https://search.maven.org/artifact/org.jetbrains.kotlin/kotlin-stdlib-jdk8))
and [`kotlin-reflect`](https://search.maven.org/artifact/org.jetbrains.kotlin/kotlin-reflect)
to be present on the classpath. They are provided by default if you bootstrap a Kotlin project on
[start.spring.io](https://start.spring.io/#!language=kotlin&type=gradle-project).

> [!WARNING]
> Kotlin [inline classes](https://kotlinlang.org/docs/inline-classes.html) are not yet supported.

> [!NOTE]
> The [Jackson Kotlin module](https://github.com/FasterXML/jackson-module-kotlin) is required
> for serializing or deserializing JSON data for Kotlin classes with Jackson, so make sure to add the
> `com.fasterxml.jackson.module:jackson-module-kotlin` dependency to your project if you have such need.
> It is automatically registered when found in the classpath.
