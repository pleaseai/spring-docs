---
title: "Constructors"
source: "ROOT:core/expressions/language-ref/constructors.adoc"
---

<a id="expressions-constructors"></a>

# Constructors

You can invoke constructors by using the `new` operator. You should use the fully
qualified class name for all types except those located in the `java.lang` package
(`Integer`, `Float`, `String`, and so on).
[Varargs](varargs.md) are also supported.

The following example shows how to use the `new` operator to invoke constructors.

#### Java

```java
Inventor einstein = parser.parseExpression(
	"new org.spring.samples.spel.inventor.Inventor('Albert Einstein', 'German')")
		.getValue(Inventor.class);

// create new Inventor instance within the add() method of List
parser.parseExpression(
	"Members.add(new org.spring.samples.spel.inventor.Inventor('Albert Einstein', 'German'))")
		.getValue(societyContext);
```

#### Kotlin

```kotlin
val einstein = parser.parseExpression(
	"new org.spring.samples.spel.inventor.Inventor('Albert Einstein', 'German')")
		.getValue(Inventor::class.java)

// create new Inventor instance within the add() method of List
parser.parseExpression(
	"Members.add(new org.spring.samples.spel.inventor.Inventor('Albert Einstein', 'German'))")
		.getValue(societyContext)
```
