---
title: "Methods"
source: "ROOT:core/expressions/language-ref/methods.adoc"
---

<a id="expressions-methods"></a>

# Methods

You can invoke methods by using the typical Java programming syntax. You can also invoke
methods directly on literals such as strings or numbers.
[Varargs](varargs.md) are supported as well.

The following examples show how to invoke methods.

#### Java

```java
// string literal, evaluates to "bc"
String bc = parser.parseExpression("'abc'.substring(1, 3)").getValue(String.class);

// evaluates to true
boolean isMember = parser.parseExpression("isMember('Mihajlo Pupin')").getValue(
		societyContext, Boolean.class);
```

#### Kotlin

```kotlin
// string literal, evaluates to "bc"
val bc = parser.parseExpression("'abc'.substring(1, 3)").getValue(String::class.java)

// evaluates to true
val isMember = parser.parseExpression("isMember('Mihajlo Pupin')").getValue(
		societyContext, Boolean::class.java)
```
