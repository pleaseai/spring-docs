---
title: "Extensions"
source: "ROOT:kotlin/extensions.adoc"
---

<a id="kotlin.extensions"></a>

# Extensions

Kotlin [extensions](https://kotlinlang.org/docs/reference/extensions.html) provide the ability to extend existing classes with additional functionality. Spring Data Kotlin APIs use these extensions to add new Kotlin-specific conveniences to existing Spring APIs.

> [!NOTE]
> Keep in mind that Kotlin extensions need to be imported to be used.
> Similar to static imports, an IDE should automatically suggest the import in most cases.

For example, [Kotlin reified type parameters](https://kotlinlang.org/docs/reference/inline-functions.html#reified-type-parameters) provide a workaround for JVM [generics type erasure](https://docs.oracle.com/javase/tutorial/java/generics/erasure.html), and Spring Data provides some extensions to take advantage of this feature.
This allows for a better Kotlin API.
