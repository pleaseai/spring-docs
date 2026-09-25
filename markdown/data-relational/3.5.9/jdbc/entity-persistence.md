---
title: "Persisting Entities"
source: "ROOT:jdbc/entity-persistence.adoc"
---

<a id="jdbc.entity-persistence"></a>

# Persisting Entities

Saving an aggregate can be performed with the `CrudRepository.save(…)` method.
If the aggregate is new, this results in an insert for the aggregate root, followed by insert statements for all directly or indirectly referenced entities.

If the aggregate root is not new, all referenced entities get deleted, the aggregate root gets updated, and all referenced entities get inserted again.
Note that whether an instance is new is part of the instance’s state.

> [!NOTE]
> This approach has some obvious downsides.
> If only few of the referenced entities have been actually changed, the deletion and insertion is wasteful.
> While this process could and probably will be improved, there are certain limitations to what Spring Data JDBC can offer.
> It does not know the previous state of an aggregate.
> So any update process always has to take whatever it finds in the database and make sure it converts it to whatever is the state of the entity passed to the save method.

See also [Entity State Detection](../repositories/core-concepts.md#is-new-state-detection) for further details.

<a id="jdbc.loading-aggregates"></a>

## Loading Aggregates

Spring Data JDBC offers two ways how it can load aggregates:

1. The traditional and before version 3.2 the only way is really simple:
Each query loads the aggregate roots, independently if the query is based on a `CrudRepository` method, a derived query or an annotated query.
If the aggregate root references other entities those are loaded with separate statements.
1. Spring Data JDBC 3.2 allows the use of *Single Query Loading*.
With this an arbitrary number of aggregates can be fully loaded with a single SQL query.
This should be significantly more efficient, especially for complex aggregates, consisting of many entities.

   Currently, Single Query Loading is restricted in different ways:

   1. The aggregate must not have nested collections, this includes `Map`.
   The plan is to remove this constraint in the future.
   1. The aggregate must not use `AggregateReference` or embedded entities.
   The plan is to remove this constraint in the future.
   1. The database dialect must support it. Of the dialects provided by Spring Data JDBC all but H2 and HSQL support this.
   H2 and HSQL don’t support analytic functions (aka windowing functions).
   1. It only works for the find methods in `CrudRepository`, not for derived queries and not for annotated queries.
   The plan is to remove this constraint in the future.
   1. Single Query Loading needs to be enabled in the `JdbcMappingContext`, by calling `setSingleQueryLoadingEnabled(true)`.

If any condition is not fulfilled Spring Data JDBC falls back to the default approach of loading aggregates.

> [!NOTE]
> Single Query Loading is to be considered experimental.
> We appreciate feedback on how it works for you.

> [!NOTE]
> While Single Query Loading can be abbreviated as SQL, but we highly discourage doing so since confusion with Structured Query Language is almost guaranteed.

<a id="entity-persistence.id-generation"></a>

## ID Generation

Spring Data uses identifier properties to identify entities.
That is, looking these up or creating statements targeting a particular row.
The ID of an entity must be annotated with Spring Data’s [`@Id`](https://docs.spring.io/spring-data/commons/reference/3.5/api/java/org/springframework/data/annotation/Id.html) annotation.

When your database has an auto-increment column for the ID column, the generated value gets set in the entity after inserting it into the database.

If you annotate the identifier property additionally with `@Sequence` a database sequence will be used to obtain values for the id if the underlying `Dialect` supports sequences.

Otherwise, Spring Data does not attempt to insert values of identifier columns when the entity is new and the identifier value defaults to its initial value.
That is `0` for primitive types and `null` if the identifier property uses a numeric wrapper type such as `Long`.

[Entity State Detection](../repositories/core-concepts.md#is-new-state-detection) explains in detail the strategies to detect whether an entity is new or whether it is expected to exist in your database.

One important constraint is that, after saving an entity, the entity must not be new anymore.
Note that whether an entity is new is part of the entity’s state.
With auto-increment columns, this happens automatically, because the ID gets set by Spring Data with the value from the ID column.

<a id="jdbc.template"></a>

## Template API

As an alternative to repositories Spring Data JDBC offers the [`JdbcAggregateTemplate`](https://docs.spring.io/spring-data/relational/docs/3.5.9/api/org/springframework/data/jdbc/core/JdbcAggregateTemplate.html) as a more direct means to load and persist entities in a relational database.
To a large extent, repositories use `JdbcAggregateTemplate` to implement their features.

This section highlights only the most interesting parts of the `JdbcAggregateTemplate`.
For a more complete overview, see the JavaDoc of `JdbcAggregateTemplate`.

<a id="_accessing_the_jdbcaggregatetemplate"></a>

### Accessing the JdbcAggregateTemplate

`JdbcAggregateTemplate` is intended to be used as a Spring bean.
If you have set up your application to include Spring Data JDBC, you can configure a dependency on `JdbcAggregateTemplate` in any Spring bean, and the Spring Framework injects a properly configured instance.

This includes fragments you use to implement custom methods for your Spring Data Repositories, letting you to use `JdbcAggregateTemplate` to customize and extend your repositories.

<a id="_persisting"></a>

### Persisting

`JdbcAggregateTemplate` offers three types of methods for persisting entities: `save`, `insert`, and `update`.
Each comes in two flavors:
Operating on single aggregates, named exactly as mentioned above, and with an `All` suffix operation on an `Iterable`.

`save` does the same as the method of same name in a repository.

`insert` and `update` skip the test if the entity is new and assume a new or existing aggregate as indicated by their names.

<a id="_querying"></a>

### Querying

`JdbcAggregateTemplate` offers a considerable array of methods for querying aggregates and about collections of aggregates.
There is one type of method that requires special attention.
That’s the methods taking a `Query` as an argument.
They allow the execution of programmatically constructed queries, as follows:

```java
template.findOne(query(where("name").is("Gandalf")), Person.class);
```

The [`Query`](https://docs.spring.io/spring-data/relational/docs/3.5.9/api/org/springframework/data/relational/core/query/Query.html) returned by the `query` method defines the list of columns to select, a where clause (through a CriteriaDefinition), and specification of limit and offset clauses.
For details of the `Query` class, see its JavaDoc.

The [`Criteria`](https://docs.spring.io/spring-data/relational/docs/3.5.9/api/org/springframework/data/relational/core/query/Criteria.html) class, of which `where` is a static member, provides implementations of org.springframework.data.relational.core.query.CriteriaDefinition\[\], which represent the where-clause of the query.

<a id="jdbc.criteria"></a>

### Methods for the Criteria Class

The `Criteria` class provides the following methods, all of which correspond to SQL operators:

- `Criteria` **and** `(String column)`: Adds a chained `Criteria` with the specified `property` to the current `Criteria` and returns the newly created one.
- `Criteria` **or** `(String column)`: Adds a chained `Criteria` with the specified `property` to the current `Criteria` and returns the newly created one.
- `Criteria` **greaterThan** `(Object o)`: Creates a criterion by using the `>` operator.
- `Criteria` **greaterThanOrEquals** `(Object o)`: Creates a criterion by using the `>=` operator.
- `Criteria` **in** `(Object…​ o)`: Creates a criterion by using the `IN` operator for a varargs argument.
- `Criteria` **in** `(Collection<?> collection)`: Creates a criterion by using the `IN` operator using a collection.
- `Criteria` **is** `(Object o)`: Creates a criterion by using column matching (`property = value`).
- `Criteria` **isNull** `()`: Creates a criterion by using the `IS NULL` operator.
- `Criteria` **isNotNull** `()`: Creates a criterion by using the `IS NOT NULL` operator.
- `Criteria` **lessThan** `(Object o)`: Creates a criterion by using the `<` operator.
- `Criteria` **lessThanOrEquals** `(Object o)`: Creates a criterion by using the `⇐` operator.
- `Criteria` **like** `(Object o)`: Creates a criterion by using the `LIKE` operator without escape character processing.
- `Criteria` **not** `(Object o)`: Creates a criterion by using the `!=` operator.
- `Criteria` **notIn** `(Object…​ o)`: Creates a criterion by using the `NOT IN` operator for a varargs argument.
- `Criteria` **notIn** `(Collection<?> collection)`: Creates a criterion by using the `NOT IN` operator using a collection.

<a id="jdbc.entity-persistence.optimistic-locking"></a>

## Optimistic Locking

Spring Data supports optimistic locking by means of a numeric attribute that is annotated with
[`@Version`](https://docs.spring.io/spring-data/commons/reference/3.5/api/java/org/springframework/data/annotation/Version.html) on the aggregate root.
Whenever Spring Data saves an aggregate with such a version attribute two things happen:

- The update statement for the aggregate root will contain a where clause checking that the version stored in the database is actually unchanged.
- If this isn’t the case an `OptimisticLockingFailureException` will be thrown.

Also, the version attribute gets increased both in the entity and in the database so a concurrent action will notice the change and throw an `OptimisticLockingFailureException` if applicable as described above.

This process also applies to inserting new aggregates, where a `null` or `0` version indicates a new instance and the increased instance afterwards marks the instance as not new anymore, making this work rather nicely with cases where the id is generated during object construction for example when UUIDs are used.

During deletes the version check also applies but no version is increased.
