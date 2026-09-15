---
title: "Properties, Arrays, Lists, Maps, and Indexers"
source: "ROOT:core/expressions/language-ref/properties-arrays.adoc"
---

<a id="expressions-properties-arrays"></a>

# Properties, Arrays, Lists, Maps, and Indexers

Navigating with property references is easy. To do so, use a period to indicate a nested
property value. The instances of the `Inventor` class, `pupin` and `tesla`, were
populated with data listed in the [Classes used in the examples](../example-classes.md)
 section. To navigate "down" the object graph and get Tesla’s year of birth and
Pupin’s city of birth, we use the following expressions:

#### Java

```java
// evaluates to 1856
int year = (Integer) parser.parseExpression("birthdate.year + 1900").getValue(context);

String city = (String) parser.parseExpression("placeOfBirth.city").getValue(context);
```

#### Kotlin

```kotlin
// evaluates to 1856
val year = parser.parseExpression("birthdate.year + 1900").getValue(context) as Int

val city = parser.parseExpression("placeOfBirth.city").getValue(context) as String
```

> [!NOTE]
> Case insensitivity is allowed for the first letter of property names. Thus, the
> expressions in the above example may be written as `Birthdate.Year + 1900` and
> `PlaceOfBirth.City`, respectively. In addition, properties may optionally be accessed via
> method invocations — for example, `getPlaceOfBirth().getCity()` instead of
> `placeOfBirth.city`.

The contents of arrays and lists are obtained by using square bracket notation, as the
following example shows:

#### Java

```java
ExpressionParser parser = new SpelExpressionParser();
EvaluationContext context = SimpleEvaluationContext.forReadOnlyDataBinding().build();

// Inventions Array

// evaluates to "Induction motor"
String invention = parser.parseExpression("inventions[3]").getValue(
		context, tesla, String.class);

// Members List

// evaluates to "Nikola Tesla"
String name = parser.parseExpression("members[0].name").getValue(
		context, ieee, String.class);

// List and Array navigation
// evaluates to "Wireless communication"
String invention = parser.parseExpression("members[0].inventions[6]").getValue(
		context, ieee, String.class);
```

#### Kotlin

```kotlin
val parser = SpelExpressionParser()
val context = SimpleEvaluationContext.forReadOnlyDataBinding().build()

// Inventions Array

// evaluates to "Induction motor"
val invention = parser.parseExpression("inventions[3]").getValue(
		context, tesla, String::class.java)

// Members List

// evaluates to "Nikola Tesla"
val name = parser.parseExpression("members[0].name").getValue(
		context, ieee, String::class.java)

// List and Array navigation
// evaluates to "Wireless communication"
val invention = parser.parseExpression("members[0].inventions[6]").getValue(
		context, ieee, String::class.java)
```

The contents of maps are obtained by specifying the literal key value within the
brackets. In the following example, because keys for the `officers` map are strings, we can specify
string literals:

#### Java

```java
// Officer's Dictionary

Inventor pupin = parser.parseExpression("officers['president']").getValue(
		societyContext, Inventor.class);

// evaluates to "Idvor"
String city = parser.parseExpression("officers['president'].placeOfBirth.city").getValue(
		societyContext, String.class);

// setting values
parser.parseExpression("officers['advisors'][0].placeOfBirth.country").setValue(
		societyContext, "Croatia");
```

#### Kotlin

```kotlin
// Officer's Dictionary

val pupin = parser.parseExpression("officers['president']").getValue(
		societyContext, Inventor::class.java)

// evaluates to "Idvor"
val city = parser.parseExpression("officers['president'].placeOfBirth.city").getValue(
		societyContext, String::class.java)

// setting values
parser.parseExpression("officers['advisors'][0].placeOfBirth.country").setValue(
		societyContext, "Croatia")
```
