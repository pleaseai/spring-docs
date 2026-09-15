---
title: "Safe Navigation Operator"
source: "ROOT:core/expressions/language-ref/operator-safe-navigation.adoc"
---

<a id="expressions-operator-safe-navigation"></a>

# Safe Navigation Operator

The safe navigation operator (`?.`) is used to avoid a `NullPointerException` and comes
from the [Groovy](https://www.groovy-lang.org/operators.html#_safe_navigation_operator)
language. Typically, when you have a reference to an object, you might need to verify
that it is not `null` before accessing methods or properties of the object. To avoid
this, the safe navigation operator returns `null` for the particular null-safe operation
instead of throwing an exception.

> [!WARNING]
> When the safe navigation operator evaluates to `null` for a particular null-safe
> operation within a compound expression, the remainder of the compound expression will
> still be evaluated.
>
> See [Null-safe Operations in Compound Expressions](#expressions-operator-safe-navigation-compound-expressions) for details.

<a id="expressions-operator-safe-navigation-property-access"></a>

## Safe Property and Method Access

The following example shows how to use the safe navigation operator for property access
(`?.`).

#### Java

```java
ExpressionParser parser = new SpelExpressionParser();
EvaluationContext context = SimpleEvaluationContext.forReadOnlyDataBinding().build();

Inventor tesla = new Inventor("Nikola Tesla", "Serbian");
tesla.setPlaceOfBirth(new PlaceOfBirth("Smiljan"));

// evaluates to "Smiljan"
String city = parser.parseExpression("placeOfBirth?.city") // <1>
		.getValue(context, tesla, String.class);

tesla.setPlaceOfBirth(null);

// evaluates to null - does not throw NullPointerException
city = parser.parseExpression("placeOfBirth?.city") // <2>
		.getValue(context, tesla, String.class);
```

1. Use safe navigation operator on non-null `placeOfBirth` property
1. Use safe navigation operator on null `placeOfBirth` property

#### Kotlin

```kotlin
val parser = SpelExpressionParser()
val context = SimpleEvaluationContext.forReadOnlyDataBinding().build()

val tesla = Inventor("Nikola Tesla", "Serbian")
tesla.setPlaceOfBirth(PlaceOfBirth("Smiljan"))

// evaluates to "Smiljan"
var city = parser.parseExpression("placeOfBirth?.city") // <1>
		.getValue(context, tesla, String::class.java)

tesla.setPlaceOfBirth(null)

// evaluates to null - does not throw NullPointerException
city = parser.parseExpression("placeOfBirth?.city") // <2>
		.getValue(context, tesla, String::class.java)
```

1. Use safe navigation operator on non-null `placeOfBirth` property
1. Use safe navigation operator on null `placeOfBirth` property

> [!NOTE]
> The safe navigation operator also applies to method invocations on an object.
>
> For example, the expression `#calculator?.max(4, 2)` evaluates to `null` if the
> `#calculator` variable has not been configured in the context. Otherwise, the
> `max(int, int)` method will be invoked on the `#calculator`.

<a id="expressions-operator-safe-navigation-indexing"></a>

## Safe Index Access

Since Spring Framework 6.2, the Spring Expression Language supports safe navigation for
indexing into the following types of structures.

- [arrays and collections](properties-arrays.md#expressions-indexing-arrays-and-collections)
- [strings](properties-arrays.md#expressions-indexing-strings)
- [maps](properties-arrays.md#expressions-indexing-maps)
- [objects](properties-arrays.md#expressions-indexing-objects)
- [custom](properties-arrays.md#expressions-indexing-custom)

The following example shows how to use the safe navigation operator for indexing into
a list (`?.[]`).

#### Java

```java
ExpressionParser parser = new SpelExpressionParser();
IEEE society = new IEEE();
EvaluationContext context = new StandardEvaluationContext(society);

// evaluates to Inventor("Nikola Tesla")
Inventor inventor = parser.parseExpression("members?.[0]") // <1>
		.getValue(context, Inventor.class);

society.members = null;

// evaluates to null - does not throw an exception
inventor = parser.parseExpression("members?.[0]") // <2>
		.getValue(context, Inventor.class);
```

1. Use null-safe index operator on a non-null `members` list
1. Use null-safe index operator on a null `members` list

#### Kotlin

```kotlin
val parser = SpelExpressionParser()
val society = IEEE()
val context = StandardEvaluationContext(society)

// evaluates to Inventor("Nikola Tesla")
var inventor = parser.parseExpression("members?.[0]") // <1>
		.getValue(context, Inventor::class.java)

society.members = null

// evaluates to null - does not throw an exception
inventor = parser.parseExpression("members?.[0]") // <2>
		.getValue(context, Inventor::class.java)
```

1. Use null-safe index operator on a non-null `members` list
1. Use null-safe index operator on a null `members` list

<a id="expressions-operator-safe-navigation-selection-and-projection"></a>

## Safe Collection Selection and Projection

The Spring Expression Language supports safe navigation for
[collection selection](collection-selection.md) and
[collection projection](collection-projection.md) via
the following operators.

- null-safe selection: `?.?`
- null-safe select first: `?.^`
- null-safe select last: `?.$`
- null-safe projection: `?.!`

The following example shows how to use the safe navigation operator for collection
selection (`?.?`).

#### Java

```java
ExpressionParser parser = new SpelExpressionParser();
IEEE society = new IEEE();
StandardEvaluationContext context = new StandardEvaluationContext(society);
String expression = "members?.?[nationality == 'Serbian']"; // <1>

// evaluates to [Inventor("Nikola Tesla")]
List<Inventor> list = (List<Inventor>) parser.parseExpression(expression)
		.getValue(context);

society.members = null;

// evaluates to null - does not throw a NullPointerException
list = (List<Inventor>) parser.parseExpression(expression)
		.getValue(context);
```

1. Use null-safe selection operator on potentially null `members` list

#### Kotlin

```kotlin
val parser = SpelExpressionParser()
val society = IEEE()
val context = StandardEvaluationContext(society)
val expression = "members?.?[nationality == 'Serbian']" // <1>

// evaluates to [Inventor("Nikola Tesla")]
var list = parser.parseExpression(expression)
		.getValue(context) as List<Inventor>

society.members = null

// evaluates to null - does not throw a NullPointerException
list = parser.parseExpression(expression)
		.getValue(context) as List<Inventor>
```

1. Use null-safe selection operator on potentially null `members` list

The following example shows how to use the "null-safe select first" operator for
collections (`?.^`).

#### Java

```java
ExpressionParser parser = new SpelExpressionParser();
IEEE society = new IEEE();
StandardEvaluationContext context = new StandardEvaluationContext(society);
String expression =
	"members?.^[nationality == 'Serbian' || nationality == 'Idvor']"; // <1>

// evaluates to Inventor("Nikola Tesla")
Inventor inventor = parser.parseExpression(expression)
		.getValue(context, Inventor.class);

society.members = null;

// evaluates to null - does not throw a NullPointerException
inventor = parser.parseExpression(expression)
		.getValue(context, Inventor.class);
```

1. Use "null-safe select first" operator on potentially null `members` list

#### Kotlin

```kotlin
val parser = SpelExpressionParser()
val society = IEEE()
val context = StandardEvaluationContext(society)
val expression =
	"members?.^[nationality == 'Serbian' || nationality == 'Idvor']" // <1>

// evaluates to Inventor("Nikola Tesla")
var inventor = parser.parseExpression(expression)
		.getValue(context, Inventor::class.java)

society.members = null

// evaluates to null - does not throw a NullPointerException
inventor = parser.parseExpression(expression)
		.getValue(context, Inventor::class.java)
```

1. Use "null-safe select first" operator on potentially null `members` list

The following example shows how to use the "null-safe select last" operator for
collections (`?.$`).

#### Java

```java
ExpressionParser parser = new SpelExpressionParser();
IEEE society = new IEEE();
StandardEvaluationContext context = new StandardEvaluationContext(society);
String expression =
	"members?.$[nationality == 'Serbian' || nationality == 'Idvor']"; // <1>

// evaluates to Inventor("Pupin")
Inventor inventor = parser.parseExpression(expression)
		.getValue(context, Inventor.class);

society.members = null;

// evaluates to null - does not throw a NullPointerException
inventor = parser.parseExpression(expression)
		.getValue(context, Inventor.class);
```

1. Use "null-safe select last" operator on potentially null `members` list

#### Kotlin

```kotlin
val parser = SpelExpressionParser()
val society = IEEE()
val context = StandardEvaluationContext(society)
val expression =
	"members?.$[nationality == 'Serbian' || nationality == 'Idvor']" // <1>

// evaluates to Inventor("Pupin")
var inventor = parser.parseExpression(expression)
		.getValue(context, Inventor::class.java)

society.members = null

// evaluates to null - does not throw a NullPointerException
inventor = parser.parseExpression(expression)
		.getValue(context, Inventor::class.java)
```

1. Use "null-safe select last" operator on potentially null `members` list

The following example shows how to use the safe navigation operator for collection
projection (`?.!`).

#### Java

```java
ExpressionParser parser = new SpelExpressionParser();
IEEE society = new IEEE();
StandardEvaluationContext context = new StandardEvaluationContext(society);

// evaluates to ["Smiljan", "Idvor"]
List placesOfBirth = parser.parseExpression("members?.![placeOfBirth.city]") // <1>
		.getValue(context, List.class);

society.members = null;

// evaluates to null - does not throw a NullPointerException
placesOfBirth = parser.parseExpression("members?.![placeOfBirth.city]") // <2>
		.getValue(context, List.class);
```

1. Use null-safe projection operator on non-null `members` list
1. Use null-safe projection operator on null `members` list

#### Kotlin

```kotlin
val parser = SpelExpressionParser()
val society = IEEE()
val context = StandardEvaluationContext(society)

// evaluates to ["Smiljan", "Idvor"]
var placesOfBirth = parser.parseExpression("members?.![placeOfBirth.city]") // <1>
		.getValue(context, List::class.java)

society.members = null

// evaluates to null - does not throw a NullPointerException
placesOfBirth = parser.parseExpression("members?.![placeOfBirth.city]") // <2>
		.getValue(context, List::class.java)
```

1. Use null-safe projection operator on non-null `members` list
1. Use null-safe projection operator on null `members` list

<a id="expressions-operator-safe-navigation-optional"></a>

## Null-safe Operations on `Optional`

As of Spring Framework 7.0, null-safe operations are supported on instances of
`java.util.Optional` with transparent unwrapping semantics.

Specifically, when a null-safe operator is applied to an *empty* `Optional`, it will be
treated as if the `Optional` were `null`, and the subsequent operation will evaluate to
`null`. However, if a null-safe operator is applied to a non-empty `Optional`, the
subsequent operation will be applied to the object contained in the `Optional`, thereby
effectively unwrapping the `Optional`.

For example, if `user` is of type `Optional<User>`, the expression `user?.name` will
evaluate to `null` if `user` is either `null` or an *empty* `Optional` and will otherwise
evaluate to the `name` of the `user`, effectively `user.get().getName()` or
`user.get().name` for property or field access, respectively.

> [!NOTE]
> Invocations of methods defined in the `Optional` API are still supported on an *empty*
> `Optional`. For example, if `name` is of type `Optional<String>`, the expression
> `name?.orElse('Unknown')` will evaluate to `"Unknown"` if `name` is an empty `Optional`
> and will otherwise evaluate to the `String` contained in the `Optional` if `name` is a
> non-empty `Optional`, effectively `name.get()`.

Similarly, if `names` is of type `Optional<List<String>>`, the expression
`names?.?⁠[#this.length > 5]` will evaluate to `null` if `names` is `null` or an *empty*
`Optional` and will otherwise evaluate to a sequence containing the names whose lengths
are greater than 5, effectively
`names.get().stream().filter(s → s.length() > 5).toList()`.

The same semantics apply to all of the null-safe operators mentioned previously in this
chapter.

For further details and examples, consult the javadoc for the following operators.

- [`PropertyOrFieldReference`](https://docs.spring.io/spring-framework/docs/7.0.8/javadoc-api/org/springframework/expression/spel/ast/PropertyOrFieldReference.html)
- [`MethodReference`](https://docs.spring.io/spring-framework/docs/7.0.8/javadoc-api/org/springframework/expression/spel/ast/MethodReference.html)
- [`Indexer`](https://docs.spring.io/spring-framework/docs/7.0.8/javadoc-api/org/springframework/expression/spel/ast/Indexer.html)
- [`Selection`](https://docs.spring.io/spring-framework/docs/7.0.8/javadoc-api/org/springframework/expression/spel/ast/Selection.html)
- [`Projection`](https://docs.spring.io/spring-framework/docs/7.0.8/javadoc-api/org/springframework/expression/spel/ast/Projection.html)

<a id="expressions-operator-safe-navigation-compound-expressions"></a>

## Null-safe Operations in Compound Expressions

As mentioned at the beginning of this section, when the safe navigation operator
evaluates to `null` for a particular null-safe operation within a compound expression,
the remainder of the compound expression will still be evaluated. This means that the
safe navigation operator must be applied throughout a compound expression in order to
avoid any unwanted `NullPointerException`.

Given the expression `#person?.address.city`, if `#person` is `null` the safe navigation
operator (`?.`) ensures that no exception will be thrown when attempting to access the
`address` property of `#person`. However, since `#person?.address` evaluates to `null`, a
`NullPointerException` will be thrown when attempting to access the `city` property of
`null`. To address that, you can apply null-safe navigation throughout the compound
expression as in `#person?.address?.city`. That expression will safely evaluate to `null`
if either `#person` or `#person?.address` evaluates to `null`.

The following example demonstrates how to use the "null-safe select first" operator
(`?.^`) on a collection combined with null-safe property access (`?.`) within a compound
expression. If `members` is `null`, the result of the "null-safe select first" operator
(`members?.^[nationality == 'Serbian']`) evaluates to `null`, and the additional use of
the safe navigation operator (`?.name`) ensures that the entire compound expression
evaluates to `null` instead of throwing an exception.

#### Java

```java
ExpressionParser parser = new SpelExpressionParser();
IEEE society = new IEEE();
StandardEvaluationContext context = new StandardEvaluationContext(society);
String expression = "members?.^[nationality == 'Serbian']?.name"; // <1>

// evaluates to "Nikola Tesla"
String name = parser.parseExpression(expression)
		.getValue(context, String.class);

society.members = null;

// evaluates to null - does not throw a NullPointerException
name = parser.parseExpression(expression)
		.getValue(context, String.class);
```

1. Use "null-safe select first" and null-safe property access operators within compound expression.

#### Kotlin

```kotlin
val parser = SpelExpressionParser()
val society = IEEE()
val context = StandardEvaluationContext(society)
val expression = "members?.^[nationality == 'Serbian']?.name" // <1>

// evaluates to "Nikola Tesla"
String name = parser.parseExpression(expression)
		.getValue(context, String::class.java)

society.members = null

// evaluates to null - does not throw a NullPointerException
name = parser.parseExpression(expression)
		.getValue(context, String::class.java)
```

1. Use "null-safe select first" and null-safe property access operators within compound expression.
