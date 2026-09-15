---
title: "Properties, Arrays, Lists, Maps, and Indexers"
source: "ROOT:core/expressions/language-ref/properties-arrays.adoc"
---

<a id="expressions-properties-arrays"></a>

# Properties, Arrays, Lists, Maps, and Indexers

The Spring Expression Language provides support for navigating object graphs and indexing
into various structures.

> [!NOTE]
> Numerical index values are zero-based, such as when accessing the n<sup>th</sup> element of
> an array in Java.

> [!TIP]
> See the [Safe Navigation Operator](operator-safe-navigation.md)
> section for details on how to navigate object graphs and index into various structures
> using the null-safe operator.

<a id="expressions-property-navigation"></a>

## Property Navigation

You can navigate property references within an object graph by using a period to indicate
a nested property value. The instances of the `Inventor` class, `pupin` and `tesla`, were
populated with data listed in the
[Classes used in the examples](../example-classes.md) section. To
navigate *down* the object graph and get Tesla’s year of birth and Pupin’s city of birth,
we use the following expressions:

#### Java

```java
// evaluates to 1856
int year = (Integer) parser.parseExpression("birthdate.year + 1900").getValue(context);

// evaluates to "Smiljan"
String city = (String) parser.parseExpression("placeOfBirth.city").getValue(context);
```

#### Kotlin

```kotlin
// evaluates to 1856
val year = parser.parseExpression("birthdate.year + 1900").getValue(context) as Int

// evaluates to "Smiljan"
val city = parser.parseExpression("placeOfBirth.city").getValue(context) as String
```

> [!NOTE]
> Case insensitivity is allowed for the first letter of property names. Thus, the
> expressions in the above example may be written as `Birthdate.Year + 1900` and
> `PlaceOfBirth.City`, respectively. In addition, properties may optionally be accessed via
> method invocations — for example, `getPlaceOfBirth().getCity()` instead of
> `placeOfBirth.city`.

<a id="expressions-indexing-arrays-and-collections"></a>

## Indexing into Arrays and Collections

The n<sup>th</sup> element of an array or collection (for example, a `Set` or `List`) can be
obtained by using square bracket notation, as the following example shows.

> [!NOTE]
> If the indexed collection is a `java.util.List`, the n<sup>th</sup> element will be accessed
> directly via `list.get(n)`.
>
> For any other type of `Collection`, the n<sup>th</sup> element will be accessed by iterating over
> the collection using its `Iterator` and returning the n<sup>th</sup> element encountered.

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

// List and Array Indexing

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

// List and Array Indexing

// evaluates to "Wireless communication"
val invention = parser.parseExpression("members[0].inventions[6]").getValue(
		context, ieee, String::class.java)
```

<a id="expressions-indexing-strings"></a>

## Indexing into Strings

The n<sup>th</sup> character of a string can be obtained by specifying the index within square
brackets, as demonstrated in the following example.

> [!NOTE]
> The n<sup>th</sup> character of a string will evaluate to a `java.lang.String`, not a
> `java.lang.Character`.

#### Java

```java
// evaluates to "T" (8th letter of "Nikola Tesla")
String character = parser.parseExpression("members[0].name[7]")
		.getValue(societyContext, String.class);
```

#### Kotlin

```kotlin
// evaluates to "T" (8th letter of "Nikola Tesla")
val character = parser.parseExpression("members[0].name[7]")
		.getValue(societyContext, String::class.java)
```

<a id="expressions-indexing-maps"></a>

## Indexing into Maps

The contents of maps are obtained by specifying the key value within square brackets. In
the following example, because keys for the `officers` map are strings, we can specify
string literals such as `'president'`:

#### Java

```java
// Officer's Map

// evaluates to Inventor("Pupin")
Inventor pupin = parser.parseExpression("officers['president']")
		.getValue(societyContext, Inventor.class);

// evaluates to "Idvor"
String city = parser.parseExpression("officers['president'].placeOfBirth.city")
		.getValue(societyContext, String.class);

String countryExpression = "officers['advisors'][0].placeOfBirth.country";

// setting values
parser.parseExpression(countryExpression)
		.setValue(societyContext, "Croatia");

// evaluates to "Croatia"
String country = parser.parseExpression(countryExpression)
		.getValue(societyContext, String.class);
```

#### Kotlin

```kotlin
// Officer's Map

// evaluates to Inventor("Pupin")
val pupin = parser.parseExpression("officers['president']")
		.getValue(societyContext, Inventor::class.java)

// evaluates to "Idvor"
val city = parser.parseExpression("officers['president'].placeOfBirth.city")
		.getValue(societyContext, String::class.java)

val countryExpression = "officers['advisors'][0].placeOfBirth.country"

// setting values
parser.parseExpression(countryExpression)
		.setValue(societyContext, "Croatia")

// evaluates to "Croatia"
val country = parser.parseExpression(countryExpression)
		.getValue(societyContext, String::class.java)
```

<a id="expressions-indexing-objects"></a>

## Indexing into Objects

A property of an object can be obtained by specifying the name of the property within
square brackets. This is analogous to accessing the value of a map based on its key. The
following example demonstrates how to *index* into an object to retrieve a specific
property.

#### Java

```java
// Create an inventor to use as the root context object.
Inventor tesla = new Inventor("Nikola Tesla");

// evaluates to "Nikola Tesla"
String name = parser.parseExpression("#root['name']")
		.getValue(context, tesla, String.class);
```

#### Kotlin

```kotlin
// Create an inventor to use as the root context object.
val tesla = Inventor("Nikola Tesla")

// evaluates to "Nikola Tesla"
val name = parser.parseExpression("#root['name']")
		.getValue(context, tesla, String::class.java)
```

<a id="expressions-indexing-custom"></a>

## Indexing into Custom Structures

Since Spring Framework 6.2, the Spring Expression Language supports indexing into custom
structures by allowing developers to implement and register an `IndexAccessor` with the
`EvaluationContext`. If you would like to support
[compilation](../evaluation.md#expressions-spel-compilation) of
expressions that rely on a custom index accessor, that index accessor must implement the
`CompilableIndexAccessor` SPI.

To support common use cases, Spring provides a built-in `ReflectiveIndexAccessor` which
is a flexible `IndexAccessor` that uses reflection to read from and optionally write to
an indexed structure of a target object. The indexed structure can be accessed through a
`public` read-method (when being read) or a `public` write-method (when being written).
The relationship between the read-method and write-method is based on a convention that
is applicable for typical implementations of indexed structures.

> [!NOTE]
> `ReflectiveIndexAccessor` also implements `CompilableIndexAccessor` in order to
> support [compilation](../evaluation.md#expressions-spel-compilation)
> to bytecode for read access. Note, however, that the configured read-method must be
> invocable via a `public` class or `public` interface for compilation to succeed.

The following code listings define a `Color` enum and `FruitMap` type that behaves like a
map but does not implement the `java.util.Map` interface. Thus, if you want to index into
a `FruitMap` within a SpEL expression, you will need to register an `IndexAccessor`.

```java
public enum Color {
	RED, ORANGE, YELLOW
}
```

```java
public class FruitMap {

	private final Map<Color, String> map = new HashMap<>();

	public FruitMap() {
		this.map.put(Color.RED, "cherry");
		this.map.put(Color.ORANGE, "orange");
		this.map.put(Color.YELLOW, "banana");
	}

	public String getFruit(Color color) {
		return this.map.get(color);
	}

	public void setFruit(Color color, String fruit) {
		this.map.put(color, fruit);
	}
}
```

A read-only `IndexAccessor` for `FruitMap` can be created via `new
ReflectiveIndexAccessor(FruitMap.class, Color.class, "getFruit")`. With that accessor
registered and a `FruitMap` registered as a variable named `#fruitMap`, the SpEL
expression `#fruitMap[T(example.Color).RED]` will evaluate to `"cherry"`.

A read-write `IndexAccessor` for `FruitMap` can be created via `new
ReflectiveIndexAccessor(FruitMap.class, Color.class, "getFruit", "setFruit")`. With that
accessor registered and a `FruitMap` registered as a variable named `#fruitMap`, the SpEL
expression `#fruitMap[T(example.Color).RED] = 'strawberry'` can be used to change the
fruit mapping for the color red from `"cherry"` to `"strawberry"`.

The following example demonstrates how to register a `ReflectiveIndexAccessor` to index
into a `FruitMap` and then index into the `FruitMap` within a SpEL expression.

#### Java

```java
// Create a ReflectiveIndexAccessor for FruitMap
IndexAccessor fruitMapAccessor = new ReflectiveIndexAccessor(
		FruitMap.class, Color.class, "getFruit", "setFruit");

// Register the IndexAccessor for FruitMap
context.addIndexAccessor(fruitMapAccessor);

// Register the fruitMap variable
context.setVariable("fruitMap", new FruitMap());

// evaluates to "cherry"
String fruit = parser.parseExpression("#fruitMap[T(example.Color).RED]")
		.getValue(context, String.class);
```

#### Kotlin

```kotlin
// Create a ReflectiveIndexAccessor for FruitMap
val fruitMapAccessor = ReflectiveIndexAccessor(
		FruitMap::class.java, Color::class.java, "getFruit", "setFruit")

// Register the IndexAccessor for FruitMap
context.addIndexAccessor(fruitMapAccessor)

// Register the fruitMap variable
context.setVariable("fruitMap", FruitMap())

// evaluates to "cherry"
val fruit = parser.parseExpression("#fruitMap[T(example.Color).RED]")
	.getValue(context, String::class.java)
```
