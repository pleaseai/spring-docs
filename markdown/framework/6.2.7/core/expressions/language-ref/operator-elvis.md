---
title: "The Elvis Operator"
source: "ROOT:core/expressions/language-ref/operator-elvis.adoc"
---

<a id="expressions-operator-elvis"></a>

# The Elvis Operator

The Elvis operator is a shortening of the ternary operator syntax and is used in the
[Groovy](https://www.groovy-lang.org/operators.html#_elvis_operator) language.
With the ternary operator syntax, you usually have to repeat a variable twice, as the
following example shows:

```groovy
String name = "Elvis Presley";
String displayName = (name != null ? name : "Unknown");
```

Instead, you can use the Elvis operator (named for the resemblance to Elvis' hair style).
The following example shows how to use the Elvis operator:

#### Java

```java
ExpressionParser parser = new SpelExpressionParser();

String name = parser.parseExpression("name?:'Unknown'").getValue(new Inventor(), String.class);
System.out.println(name);  // 'Unknown'
```

#### Kotlin

```kotlin
val parser = SpelExpressionParser()

val name = parser.parseExpression("name?:'Unknown'").getValue(Inventor(), String::class.java)
println(name)  // 'Unknown'
```

> [!NOTE]
> The SpEL Elvis operator also checks for *empty* Strings in addition to `null` objects.
> The original snippet is thus only close to emulating the semantics of the operator (it would need an
> additional `!name.isEmpty()` check).

The following listing shows a more complex example:

#### Java

```java
ExpressionParser parser = new SpelExpressionParser();
EvaluationContext context = SimpleEvaluationContext.forReadOnlyDataBinding().build();

Inventor tesla = new Inventor("Nikola Tesla", "Serbian");
String name = parser.parseExpression("name?:'Elvis Presley'").getValue(context, tesla, String.class);
System.out.println(name);  // Nikola Tesla

tesla.setName("");
name = parser.parseExpression("name?:'Elvis Presley'").getValue(context, tesla, String.class);
System.out.println(name);  // Elvis Presley
```

#### Kotlin

```kotlin
val parser = SpelExpressionParser()
val context = SimpleEvaluationContext.forReadOnlyDataBinding().build()

val tesla = Inventor("Nikola Tesla", "Serbian")
var name = parser.parseExpression("name?:'Elvis Presley'").getValue(context, tesla, String::class.java)
println(name)  // Nikola Tesla

tesla.setName("")
name = parser.parseExpression("name?:'Elvis Presley'").getValue(context, tesla, String::class.java)
println(name)  // Elvis Presley
```

> [!NOTE]
> You can use the Elvis operator to apply default values in expressions. The following
> example shows how to use the Elvis operator in a `@Value` expression:
>
> ```java
> @Value("#{systemProperties['pop3.port'] ?: 25}")
> ```
>
> This will inject a system property `pop3.port` if it is defined or 25 if not.
