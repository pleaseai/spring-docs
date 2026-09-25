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
Each query loads the aggregate roots, independently if the query is based on a `CrudRepository` method, a derived query or a annotated query.
If the aggregate root references other entities those are loaded with separate statements.
1. Spring Data JDBC 3.2 allows the use of *Single Query Loading*.
With this an arbitrary number of aggregates can be fully loaded with a single SQL query.
This should be significantly more efficient, especially for complex aggregates, consisting of many entities.

   Currently, Single Query Loading is restricted in different ways:

   1. The aggregate must not have nested collections, this includes `Map`.
   The plan is to remove this constraint in the future.
   1. The aggregate must not use `AggregateReference` or embedded entities.
   The plan is to remove this constraint in the future.
   1. The database dialect must support it.Of the dialects provided by Spring Data JDBC all but H2 and HSQL support this.
   H2 and HSQL don’t support analytic functions (aka windowing functions).
   1. It only works for the find methods in `CrudRepository`, not for derived queries and not for annotated queries.
   The plan is to remove this constraint in the future.
   1. Single Query Loading needs to be enabled in the `JdbcMappingContext`, by calling `setSingleQueryLoadingEnabled(true)`

If any condition is not fulfilled Spring Data JDBC falls back to the default approach of loading aggregates.

> [!NOTE]
> Single Query Loading is to be considered experimental.
> We appreciate feedback on how it works for you.

> [!NOTE]
> While Single Query Loading can be abbreviated as SQL, but we highly discourage doing so since confusion with Structured Query Language is almost guaranteed.

<a id="entity-persistence.id-generation"></a>

## ID Generation

Spring Data uses the identifer property to identify entities.
The ID of an entity must be annotated with Spring Data’s [`@Id`](https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/annotation/Id.html) annotation.

When your database has an auto-increment column for the ID column, the generated value gets set in the entity after inserting it into the database.

Spring Data does not attempt to insert values of identifier columns when the entity is new and the identifier value defaults to its initial value.
That is `0` for primitive types and `null` if the identifier property uses a numeric wrapper type such as `Long`.

[Entity State Detection](../repositories/core-concepts.md#is-new-state-detection) explains in detail the strategies to detect whether an entity is new or whether it is expected to exist in your database.

One important constraint is that, after saving an entity, the entity must not be new anymore.
Note that whether an entity is new is part of the entity’s state.
With auto-increment columns, this happens automatically, because the ID gets set by Spring Data with the value from the ID column.

<a id="jdbc.entity-persistence.optimistic-locking"></a>

## Optimistic Locking

Spring Data supports optimistic locking by means of a numeric attribute that is annotated with
[`@Version`](https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/annotation/Version.html) on the aggregate root.
Whenever Spring Data saves an aggregate with such a version attribute two things happen:

- The update statement for the aggregate root will contain a where clause checking that the version stored in the database is actually unchanged.
- If this isn’t the case an `OptimisticLockingFailureException` will be thrown.

Also, the version attribute gets increased both in the entity and in the database so a concurrent action will notice the change and throw an `OptimisticLockingFailureException` if applicable as described above.

This process also applies to inserting new aggregates, where a `null` or `0` version indicates a new instance and the increased instance afterwards marks the instance as not new anymore, making this work rather nicely with cases where the id is generated during object construction for example when UUIDs are used.

During deletes the version check also applies but no version is increased.
