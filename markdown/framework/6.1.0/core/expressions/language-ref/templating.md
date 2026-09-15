---
title: "Expression templating"
source: "ROOT:core/expressions/language-ref/templating.adoc"
---

<a id="expressions-templating"></a>

# Expression templating

Expression templates allow mixing literal text with one or more evaluation blocks.
Each evaluation block is delimited with prefix and suffix characters that you can
define. A common choice is to use `#{ }` as the delimiters, as the following example
shows:

#### Java

```java
String randomPhrase = parser.parseExpression(
		"random number is #{T(java.lang.Math).random()}",
		new TemplateParserContext()).getValue(String.class);

// evaluates to "random number is 0.7038186818312008"
```

#### Kotlin

```kotlin
val randomPhrase = parser.parseExpression(
		"random number is #{T(java.lang.Math).random()}",
		TemplateParserContext()).getValue(String::class.java)

// evaluates to "random number is 0.7038186818312008"
```

The string is evaluated by concatenating the literal text `'random number is '` with the
result of evaluating the expression inside the `#{ }` delimiter (in this case, the result
of calling that `random()` method). The second argument to the `parseExpression()` method
is of the type `ParserContext`. The `ParserContext` interface is used to influence how
the expression is parsed in order to support the expression templating functionality.
The definition of `TemplateParserContext` follows:

#### Java

```java
public class TemplateParserContext implements ParserContext {

	public String getExpressionPrefix() {
		return "#{";
	}

	public String getExpressionSuffix() {
		return "}";
	}

	public boolean isTemplate() {
		return true;
	}
}
```

#### Kotlin

```kotlin
class TemplateParserContext : ParserContext {

	override fun getExpressionPrefix(): String {
		return "#{"
	}

	override fun getExpressionSuffix(): String {
		return "}"
	}

	override fun isTemplate(): Boolean {
		return true
	}
}
```
