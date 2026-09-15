---
title: "Collection Selection"
source: "ROOT:core/expressions/language-ref/collection-selection.adoc"
---

<a id="expressions-collection-selection"></a>

# Collection Selection

Selection is a powerful expression language feature that lets you transform a
source collection into another collection by selecting from its entries.

Selection uses a syntax of `.?[selectionExpression]`. It filters the collection and
returns a new collection that contains a subset of the original elements. For example,
selection lets us easily get a list of Serbian inventors, as the following example shows:

#### Java

```java
List<Inventor> list = (List<Inventor>) parser.parseExpression(
		"members.?[nationality == 'Serbian']").getValue(societyContext);
```

#### Kotlin

```kotlin
val list = parser.parseExpression(
		"members.?[nationality == 'Serbian']").getValue(societyContext) as List<Inventor>
```

Selection is supported for arrays and anything that implements `java.lang.Iterable` or
`java.util.Map`. For a list or array, the selection criteria is evaluated against each
individual element. Against a map, the selection criteria is evaluated against each map
entry (objects of the Java type `Map.Entry`). Each map entry has its `key` and `value`
accessible as properties for use in the selection.

The following expression returns a new map that consists of those elements of the
original map where the entry’s value is less than 27:

#### Java

```java
Map newMap = parser.parseExpression("map.?[value<27]").getValue();
```

#### Kotlin

```kotlin
val newMap = parser.parseExpression("map.?[value<27]").getValue()
```

In addition to returning all the selected elements, you can retrieve only the first or
the last element. To obtain the first element matching the selection, the syntax is
`.^[selectionExpression]`. To obtain the last matching selection, the syntax is
`.$[selectionExpression]`.
