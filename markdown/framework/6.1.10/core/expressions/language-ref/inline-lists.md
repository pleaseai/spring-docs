---
title: "Inline Lists"
source: "ROOT:core/expressions/language-ref/inline-lists.adoc"
---

<a id="expressions-inline-lists"></a>

# Inline Lists

You can directly express lists in an expression by using `{}` notation.

#### Java

```java
// evaluates to a Java list containing the four numbers
List numbers = (List) parser.parseExpression("{1,2,3,4}").getValue(context);

List listOfLists = (List) parser.parseExpression("{{'a','b'},{'x','y'}}").getValue(context);
```

#### Kotlin

```kotlin
// evaluates to a Java list containing the four numbers
val numbers = parser.parseExpression("{1,2,3,4}").getValue(context) as List<*>

val listOfLists = parser.parseExpression("{{'a','b'},{'x','y'}}").getValue(context) as List<*>
```

`{}` by itself means an empty list. For performance reasons, if the list is itself
entirely composed of fixed literals, a constant list is created to represent the
expression (rather than building a new list on each evaluation).
