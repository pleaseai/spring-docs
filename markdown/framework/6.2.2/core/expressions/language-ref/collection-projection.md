---
title: "Collection Projection"
source: "ROOT:core/expressions/language-ref/collection-projection.adoc"
---

<a id="expressions-collection-projection"></a>

# Collection Projection

Projection lets a collection drive the evaluation of a sub-expression, and the result is
a new collection. The syntax for projection is `.![projectionExpression]`. For example,
suppose we have a list of inventors but want the list of cities where they were born.
Effectively, we want to evaluate `placeOfBirth.city` for every entry in the inventor
list. The following example uses projection to do so:

#### Java

```java
// evaluates to ["Smiljan", "Idvor"]
List placesOfBirth = parser.parseExpression("members.![placeOfBirth.city]")
		.getValue(societyContext, List.class);
```

#### Kotlin

```kotlin
// evaluates to ["Smiljan", "Idvor"]
val placesOfBirth = parser.parseExpression("members.![placeOfBirth.city]")
 		.getValue(societyContext) as List<*>
```

Projection is supported for arrays and anything that implements `java.lang.Iterable` or
`java.util.Map`. When using a map to drive projection, the projection expression is
evaluated against each entry in the map (represented as a Java `Map.Entry`). The result
of a projection across a map is a list that consists of the evaluation of the projection
expression against each map entry.

> [!NOTE]
> The Spring Expression Language also supports safe navigation for collection projection.
>
> See
> [Safe Collection Selection and Projection](operator-safe-navigation.md#expressions-operator-safe-navigation-selection-and-projection)
> for details.
