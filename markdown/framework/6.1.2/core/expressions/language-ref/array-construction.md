---
title: "Array Construction"
source: "ROOT:core/expressions/language-ref/array-construction.adoc"
---

<a id="expressions-array-construction"></a>

# Array Construction

You can build arrays by using the familiar Java syntax, optionally supplying an initializer
to have the array populated at construction time. The following example shows how to do so:

#### Java

```java
int[] numbers1 = (int[]) parser.parseExpression("new int[4]").getValue(context);

// Array with initializer
int[] numbers2 = (int[]) parser.parseExpression("new int[]{1,2,3}").getValue(context);

// Multi dimensional array
int[][] numbers3 = (int[][]) parser.parseExpression("new int[4][5]").getValue(context);
```

#### Kotlin

```kotlin
val numbers1 = parser.parseExpression("new int[4]").getValue(context) as IntArray

// Array with initializer
val numbers2 = parser.parseExpression("new int[]{1,2,3}").getValue(context) as IntArray

// Multi dimensional array
val numbers3 = parser.parseExpression("new int[4][5]").getValue(context) as Array<IntArray>
```

You cannot currently supply an initializer when you construct a multi-dimensional array.
