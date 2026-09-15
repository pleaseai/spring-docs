---
title: "Ternary Operator (If-Then-Else)"
source: "ROOT:core/expressions/language-ref/operator-ternary.adoc"
---

<a id="expressions-operator-ternary"></a>

# Ternary Operator (If-Then-Else)

You can use the ternary operator for performing if-then-else conditional logic inside
the expression. The following listing shows a minimal example:

#### Java

```java
String falseString = parser.parseExpression(
		"false ? 'trueExp' : 'falseExp'").getValue(String.class);
```

#### Kotlin

```kotlin
val falseString = parser.parseExpression(
		"false ? 'trueExp' : 'falseExp'").getValue(String::class.java)
```

In this case, the boolean `false` results in returning the string value `'falseExp'`. A more
realistic example follows:

#### Java

```java
parser.parseExpression("name").setValue(societyContext, "IEEE");
societyContext.setVariable("queryName", "Nikola Tesla");

expression = "isMember(#queryName)? #queryName + ' is a member of the ' " +
		"+ Name + ' Society' : #queryName + ' is not a member of the ' + Name + ' Society'";

String queryResultString = parser.parseExpression(expression)
		.getValue(societyContext, String.class);
// queryResultString = "Nikola Tesla is a member of the IEEE Society"
```

#### Kotlin

```kotlin
parser.parseExpression("name").setValue(societyContext, "IEEE")
societyContext.setVariable("queryName", "Nikola Tesla")

expression = "isMember(#queryName)? #queryName + ' is a member of the ' " + "+ Name + ' Society' : #queryName + ' is not a member of the ' + Name + ' Society'"

val queryResultString = parser.parseExpression(expression)
		.getValue(societyContext, String::class.java)
// queryResultString = "Nikola Tesla is a member of the IEEE Society"
```

See the next section on the Elvis operator for an even shorter syntax for the
ternary operator.
