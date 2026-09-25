---
title: "MongoDB-specific Data Manipulation Methods"
source: "ROOT:mongodb/repositories/modifying-methods.adoc"
---

<a id="mongodb.repositories.queries"></a>

# MongoDB-specific Data Manipulation Methods

Next to the [query methods](query-methods.md) it is possible to update data with specialized methods.

<a id="mongodb.repositories.queries.update"></a>

## Update Methods

You can also use the keywords in the preceding table to create queries that identify matching documents for running updates on them.
The actual update action is defined by the `@Update` annotation on the method itself, as the following listing shows.
Note that the naming schema for derived queries starts with `find`.
Using `update` (as in `updateAllByLastname(…​)`) is allowed only in combination with `@Query`.

The update is applied to **all** matching documents and it is **not** possible to limit the scope by passing in a `Page` or by using any of the [limiting keywords](#repositories.limit-query-result).
The return type can be either `void` or a *numeric* type, such as `long`, to hold the number of modified documents.

```java
public interface PersonRepository extends CrudRepository<Person, String> {

    @Update("{ '$inc' : { 'visits' : 1 } }")
    long findAndIncrementVisitsByLastname(String lastname); <1>

    @Update("{ '$inc' : { 'visits' : ?1 } }")
    void findAndIncrementVisitsByLastname(String lastname, int increment); <2>

    @Update("{ '$inc' : { 'visits' : ?#{[1]} } }")
    long findAndIncrementVisitsUsingSpELByLastname(String lastname, int increment); <3>

    @Update(pipeline = {"{ '$set' : { 'visits' : { '$add' : [ '$visits', ?1 ] } } }"})
    void findAndIncrementVisitsViaPipelineByLastname(String lastname, int increment); <4>

    @Update("{ '$push' : { 'shippingAddresses' : ?1 } }")
    long findAndPushShippingAddressByEmail(String email, Address address); <5>

    @Query("{ 'lastname' : ?0 }")
    @Update("{ '$inc' : { 'visits' : ?1 } }")
    void updateAllByLastname(String lastname, int increment); <6>
}
```

1. The filter query for the update is derived from the method name.
The update is “as is” and does not bind any parameters.
1. The actual increment value is defined by the `increment` method argument that is bound to the `?1` placeholder.
1. Use the Spring Expression Language (SpEL) for parameter binding.
1. Use the `pipeline` attribute to issue [aggregation pipeline updates](../template-crud-operations.md#mongo-template.aggregation-update).
1. The update may contain complex objects.
1. Combine a [string based query](repositories.md#mongodb.repositories.queries.json-based) with an update.

> [!WARNING]
> Repository updates do not emit persistence nor mapping lifecycle events.

<a id="mongodb.repositories.queries.delete"></a>

## Delete Methods

The keywords in the preceding table can be used in conjunction with `delete…By` or `remove…By` to create queries that delete matching documents.

#### Imperative

```java
public interface PersonRepository extends MongoRepository<Person, String> {

    List <Person> deleteByLastname(String lastname);      <1>

    Long deletePersonByLastname(String lastname);         <2>

    @Nullable
    Person deleteSingleByLastname(String lastname);       <3>

    Optional<Person> deleteByBirthdate(Date birthdate);   <4>
}
```

1. Using a return type of `List` retrieves and returns all matching documents before actually deleting them.
1. A numeric return type directly removes the matching documents, returning the total number of documents removed.
1. A single domain type result retrieves and removes the first matching document.
1. Same as in 3 but wrapped in an `Optional` type.

#### Reactive

```java
public interface PersonRepository extends ReactiveMongoRepository<Person, String> {

    Flux<Person> deleteByLastname(String lastname);      <1>

    Mono<Long> deletePersonByLastname(String lastname);         <2>

    Mono<Person> deleteSingleByLastname(String lastname);       <3>
}
```

1. Using a return type of `Flux` retrieves and returns all matching documents before actually deleting them.
1. A numeric return type directly removes the matching documents, returning the total number of documents removed.
1. A single domain type result retrieves and removes the first matching document.
