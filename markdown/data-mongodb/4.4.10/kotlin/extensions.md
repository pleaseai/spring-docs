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

To retrieve a list of `SWCharacter` objects in Java, you would normally write the following:

```java
Flux<SWCharacter> characters = template.query(SWCharacter.class).inTable("star-wars").all()
```

With Kotlin and the Spring Data extensions, you can instead write the following:

```kotlin
val characters = template.query<SWCharacter>().inTable("star-wars").all()
// or (both are equivalent)
val characters : Flux<SWCharacter> = template.query().inTable("star-wars").all()
```

As in Java, `characters` in Kotlin is strongly typed, but Kotlin’s clever type inference allows for shorter syntax.

<a id="mongo.query.kotlin-support"></a>

## Type-safe Queries for Kotlin

Kotlin embraces domain-specific language creation through its language syntax and its extension system.
Spring Data MongoDB ships with a Kotlin Extension for `Criteria` using [Kotlin property references](https://kotlinlang.org/docs/reference/reflection.html#property-references) to build type-safe queries.
Queries using this extension are typically benefit from improved readability.
Most keywords on `Criteria` have a matching Kotlin extension, such as `inValues` and `regex`.

Consider the following example explaining Type-safe Queries:

```kotlin
import org.springframework.data.mongodb.core.query.*

mongoOperations.find<Book>(
  Query(Book::title isEqualTo "Moby-Dick")               <1>
)

mongoOperations.find<Book>(
  Query(titlePredicate = Book::title exists true)
)

mongoOperations.find<Book>(
  Query(
    Criteria().andOperator(
      Book::price gt 5,
      Book::price lt 10
    ))
)

// Binary operators
mongoOperations.find<BinaryMessage>(
  Query(BinaryMessage::payload bits { allClear(0b101) }) <2>
)

// Nested Properties (i.e. refer to "book.author")
mongoOperations.find<Book>(
  Query(Book::author / Author::name regex "^H")          <3>
)
```

1. `isEqualTo()` is an infix extension function with receiver type `KProperty<T>` that returns `Criteria`.
1. For bitwise operators, pass a lambda argument where you call one of the methods of `Criteria.BitwiseCriteriaOperators`.
1. To construct nested properties, use the `/` character (overloaded operator `div`).

<a id="mongo.update.kotlin-support"></a>

## Type-safe Updates for Kotlin

A syntax similar to [Type-safe Queries for Kotlin](#mongo.query.kotlin-support) can be used to update documents:

```kotlin
mongoOperations.updateMulti<Book>(
  Query(Book::title isEqualTo "Moby-Dick"),
  update(Book:title, "The Whale")                        <1>
    .inc(Book::price, 100)                               <2>
    .addToSet(Book::authors, "Herman Melville")          <3>
)
```

1. `update()` is a factory function with receiver type `KProperty<T>` that returns `Update`.
1. Most methods from `Update` have a matching Kotlin extension.
1. Functions with `KProperty<T>` can be used as well on collections types
