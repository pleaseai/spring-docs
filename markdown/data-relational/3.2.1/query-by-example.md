---
title: "Query by Example"
source: "ROOT:query-by-example.adoc"
---

<a id="query-by-example"></a>

# Query by Example

<a id="query-by-example.introduction"></a>

## Introduction

This chapter provides an introduction to Query by Example and explains how to use it.

Query by Example (QBE) is a user-friendly querying technique with a simple interface.
It allows dynamic query creation and does not require you to write queries that contain field names.
In fact, Query by Example does not require you to write queries by using store-specific query languages at all.

<a id="query-by-example.usage"></a>

## Usage

The Query by Example API consists of four parts:

- Probe: The actual example of a domain object with populated fields.
- `ExampleMatcher`: The `ExampleMatcher` carries details on how to match particular fields.
It can be reused across multiple Examples.
- `Example`: An `Example` consists of the probe and the `ExampleMatcher`.
It is used to create the query.
- `FetchableFluentQuery`: A `FetchableFluentQuery` offers a fluent API, that allows further customization of a query derived from an `Example`.
Using the fluent API lets you to specify ordering projection and result processing for your query.

Query by Example is well suited for several use cases:

- Querying your data store with a set of static or dynamic constraints.
- Frequent refactoring of the domain objects without worrying about breaking existing queries.
- Working independently from the underlying data store API.

Query by Example also has several limitations:

- No support for nested or grouped property constraints, such as `firstname = ?0 or (firstname = ?1 and lastname = ?2)`.
- Only supports starts/contains/ends/regex matching for strings and exact matching for other property types.

Before getting started with Query by Example, you need to have a domain object.
To get started, create an interface for your repository, as shown in the following example:

#### Sample Person object

```java
public class Person {

  @Id
  private String id;
  private String firstname;
  private String lastname;
  private Address address;

  // … getters and setters omitted
}
```

The preceding example shows a simple domain object.
You can use it to create an `Example`.
By default, fields having `null` values are ignored, and strings are matched by using the store specific defaults.

> [!NOTE]
> Inclusion of properties into a Query by Example criteria is based on nullability.
> Properties using primitive types (`int`, `double`, …) are always included unless  the [`ExampleMatcher` ignores the property path](#query-by-example.matchers).

Examples can be built by either using the `of` factory method or by using [`ExampleMatcher`](#query-by-example.matchers). `Example` is immutable.
The following listing shows a simple Example:

```java
Person person = new Person();                         <1>
person.setFirstname("Dave");                          <2>

Example<Person> example = Example.of(person);         <3>
```

1. Create a new instance of the domain object.
1. Set the properties to query.
1. Create the `Example`.

You can run the example queries by using repositories.
To do so, let your repository interface extend `QueryByExampleExecutor<T>`.
The following listing shows an excerpt from the `QueryByExampleExecutor` interface:

#### The `QueryByExampleExecutor`

```java
public interface QueryByExampleExecutor<T> {

  <S extends T> S findOne(Example<S> example);

  <S extends T> Iterable<S> findAll(Example<S> example);

  // … more functionality omitted.
}
```

<a id="query-by-example.matchers"></a>

## Example Matchers

Examples are not limited to default settings.
You can specify your own defaults for string matching, null handling, and property-specific settings by using the `ExampleMatcher`, as shown in the following example:

```java
Person person = new Person();                          <1>
person.setFirstname("Dave");                           <2>

ExampleMatcher matcher = ExampleMatcher.matching()     <3>
  .withIgnorePaths("lastname")                         <4>
  .withIncludeNullValues()                             <5>
  .withStringMatcher(StringMatcher.ENDING);            <6>

Example<Person> example = Example.of(person, matcher); <7>

```

1. Create a new instance of the domain object.
1. Set properties.
1. Create an `ExampleMatcher` to expect all values to match.
It is usable at this stage even without further configuration.
1. Construct a new `ExampleMatcher` to ignore the `lastname` property path.
1. Construct a new `ExampleMatcher` to ignore the `lastname` property path and to include null values.
1. Construct a new `ExampleMatcher` to ignore the `lastname` property path, to include null values, and to perform suffix string matching.
1. Create a new `Example` based on the domain object and the configured `ExampleMatcher`.

By default, the `ExampleMatcher` expects all values set on the probe to match.
If you want to get results matching any of the predicates defined implicitly, use `ExampleMatcher.matchingAny()`.

You can specify behavior for individual properties (such as "firstname" and "lastname" or, for nested properties, "address.city").
You can tune it with matching options and case sensitivity, as shown in the following example:

#### Configuring matcher options

```java
ExampleMatcher matcher = ExampleMatcher.matching()
  .withMatcher("firstname", endsWith())
  .withMatcher("lastname", startsWith().ignoreCase());
}
```

Another way to configure matcher options is to use lambdas (introduced in Java 8).
This approach creates a callback that asks the implementor to modify the matcher.
You need not return the matcher, because configuration options are held within the matcher instance.
The following example shows a matcher that uses lambdas:

#### Configuring matcher options with lambdas

```java
ExampleMatcher matcher = ExampleMatcher.matching()
  .withMatcher("firstname", match -> match.endsWith())
  .withMatcher("firstname", match -> match.startsWith());
}
```

Queries created by `Example` use a merged view of the configuration.
Default matching settings can be set at the `ExampleMatcher` level, while individual settings can be applied to particular property paths.
Settings that are set on `ExampleMatcher` are inherited by property path settings unless they are defined explicitly.
Settings on a property patch have higher precedence than default settings.
The following table describes the scope of the various `ExampleMatcher` settings:

| Setting | Scope |
| --- | --- |
| Null-handling | `ExampleMatcher` |
| String matching | `ExampleMatcher` and property path |
| Ignoring properties | Property path |
| Case sensitivity | `ExampleMatcher` and property path |
| Value transformation | Property path |

<a id="query-by-example.fluent"></a>

## Fluent API

`QueryByExampleExecutor` offers one more method, which we did not mention so far: `<S extends T, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction)`.
As with other methods, it executes a query derived from an `Example`.
However, with the second argument, you can control aspects of that execution that you cannot dynamically control otherwise.
You do so by invoking the various methods of the `FetchableFluentQuery` in the second argument.
`sortBy` lets you specify an ordering for your result.
`as` lets you specify the type to which you want the result to be transformed.
`project` limits the queried attributes.
`first`, `firstValue`, `one`, `oneValue`, `all`, `page`, `stream`, `count`, and `exists` define what kind of result you get and how the query behaves when more than the expected number of results are available.

#### Use the fluent API to get the last of potentially many results, ordered by lastname.

```java
Optional<Person> match = repository.findBy(example,
    q -> q
        .sortBy(Sort.by("lastname").descending())
        .first()
);
```

Here’s an example:

```java
Employee employee = new Employee(); // <1>
employee.name= "Frodo";

Example<Employee> example = Example.of(employee); // <2>

repository.findAll(example); // <3>

// do whatever with the result
```

1. Create a domain object with the criteria (`null` fields will be ignored).
1. Using the domain object, create an `Example`.
1. Through the repository, execute query (use `findOne` for a single item).

This illustrates how to craft a simple probe using a domain object.
In this case, it will query based on the `Employee` object’s `name` field being equal to `Frodo`.
`null` fields are ignored.

```java
Employee employee = new Employee();
employee.name = "Baggins";
employee.role = "ring bearer";

ExampleMatcher matcher = matching() // <1>
		.withMatcher("name", endsWith()) // <2>
		.withIncludeNullValues() // <3>
		.withIgnorePaths("role"); // <4>
Example<Employee> example = Example.of(employee, matcher); // <5>

repository.findAll(example);

// do whatever with the result
```

1. Create a custom `ExampleMatcher` that matches on ALL fields (use `matchingAny()` to match on **ANY** fields)
1. For the `name` field, use a wildcard that matches against the end of the field
1. Match columns against `null` (don’t forget that `NULL` doesn’t equal `NULL` in relational databases).
1. Ignore the `role` field when forming the query.
1. Plug the custom `ExampleMatcher` into the probe.

It’s also possible to apply a `withTransform()` against any property, allowing you to transform a property before forming the query.
For example, you can apply a `toUpperCase()` to a `String` -based property before the query is created.

Query By Example really shines when you don’t know all the fields needed in a query in advance.
If you were building a filter on a web page where the user can pick the fields, Query By Example is a great way to flexibly capture that into an efficient query.
