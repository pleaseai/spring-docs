---
title: "Methods"
source: "ROOT:core/expressions/language-ref/methods.adoc"
---

<a id="expressions-methods"></a>

# Methods

You can invoke methods by using typical Java programming syntax. You can also invoke methods
on literals. Variable arguments are also supported. The following examples show how to
invoke methods:

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
