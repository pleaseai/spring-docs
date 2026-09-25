---
title: "Kotlin"
source: "ROOT:r2dbc/kotlin.adoc"
---

<a id="kotlin"></a>

# Kotlin

This part of the reference documentation explains the specific Kotlin functionality offered by Spring Data R2DBC.
See [kotlin.adoc](../kotlin.md) for the general functionality provided by Spring Data.

To retrieve a list of `SWCharacter` objects in Java, you would normally write the following:

```java
Flux<SWCharacter> characters = client.select().from(SWCharacter.class).fetch().all();
```

With Kotlin and the Spring Data extensions, you can instead write the following:

```kotlin
val characters =  client.select().from<SWCharacter>().fetch().all()
// or (both are equivalent)
val characters : Flux<SWCharacter> = client.select().from().fetch().all()
```

As in Java, `characters` in Kotlin is strongly typed, but Kotlin’s clever type inference allows for shorter syntax.

Spring Data R2DBC provides the following extensions:

- Reified generics support for `DatabaseClient` and `Criteria`.
- [kotlin/coroutines.adoc](../kotlin/coroutines.md) extensions for `DatabaseClient`.
