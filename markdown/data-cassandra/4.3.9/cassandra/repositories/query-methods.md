---
title: "Cassandra-specific Query Methods"
source: "ROOT:cassandra/repositories/query-methods.adoc"
---

<a id="cassandra.repositories.queries"></a>

# Cassandra-specific Query Methods

> [!NOTE]
> This chapter explains Cassandra-specific query methods.
> This documentation uses imperative types.
> By using reactive return types, the same semantics apply to reactive repositories as well.

Most of the data access operations you usually trigger on a repository result in a query being executed against the Apache Cassandra database.
Defining such a query is a matter of declaring a method on the repository interface.
The following example shows a number of such method declarations:

#### Imperative

```java
interface PersonRepository extends CrudRepository<Person, String> {

    List<Person> findByLastname(String lastname);                           <1>

    Slice<Person> findByFirstname(String firstname, Pageable pageRequest);  <2>

    Window<Person> findByFirstname(String firstname, CassandraScrollPosition pos, Limit limit);  <3>

    List<Person> findByFirstname(String firstname, QueryOptions opts);      <4>

    List<Person> findByFirstname(String firstname, Sort sort);              <5>

    List<Person> findByFirstname(String firstname, Limit limit);            <6>

    Person findByShippingAddress(Address address);                          <7>

    Person findFirstByShippingAddress(Address address);                     <8>

    Stream<Person> findAllBy();                                             <9>

    @AllowFiltering
    List<Person> findAllByAge(int age);                                     <10>
}
```

1. The method shows a query for all people with the given `lastname`.
The query is derived from parsing the method name for constraints, which can be concatenated with `And`.
Thus, the method name results in a query expression of `SELECT * FROM person WHERE lastname = 'lastname'`.
1. Applies pagination to a query.
You can equip your method signature with a `Pageable` parameter and let the method return a `Slice` instance, and we automatically page the query accordingly.
1. Applies scrolling to a query.
Scrolling wraps Cassandra’s `PagingState` into `CassandraScrollPosition` and allows dynamic limiting.
You can also use `findTop…` for a static limit.
1. Passing a `QueryOptions` object applies the query options to the resulting query before its execution.
1. Applies dynamic sorting to a query.
You can add a `Sort` parameter to your method signature, and Spring Data automatically applies ordering to the query.
1. Applies dynamic result limiting to a query.
Query results can be limited using `SELECT … LIMIT`.
1. Shows that you can query based on properties that are not a primitive type by using `Converter` instances registered in `CustomConversions`.
Throws `IncorrectResultSizeDataAccessException` if more than one match is found.
1. Uses the `First` keyword to restrict the query to only the first result.
Unlike the preceding method, this method does not throw an exception if more than one match is found.
1. Uses a Java 8 `Stream` to read and convert individual elements while iterating the stream.
1. Shows a query method annotated with `@AllowFiltering`, to allow server-side filtering.

#### Reactive

```java
interface ReactivePersonRepository extends ReactiveSortingRepository<Person, Long> {

  Flux<Person> findByFirstname(String firstname);                                <1>

  Flux<Person> findByFirstname(Publisher<String> firstname);                     <2>

  Mono<Person> findByFirstnameAndLastname(String firstname, String lastname);    <3>

  Mono<Person> findFirstByFirstname(String firstname);                           <4>

  @AllowFiltering
  Flux<Person> findByAge(int age);                                               <5>
}
```

1. A query for all people with the given `firstname`.
The query is derived by parsing the method name for constraints, which can be concatenated with `And` and `Or`.
Thus, the method name results in a query expression of `SELECT * FROM person WHERE firstname = :firstname`.
1. A query for all people with the given `firstname` once the `firstname` is emitted from the given `Publisher`.
1. Find a single entity for the given criteria.
Completes with `IncorrectResultSizeDataAccessException` on non-unique results.
1. Unlike the preceding query, the first entity is always emitted even if the query yields more result rows.
1. A query method annotated with `@AllowFiltering`, which allows server-side filtering.

> [!NOTE]
> Querying non-primary key properties requires secondary indexes.

The following table shows short examples of the keywords that you can use in query methods:

| Keyword | Sample | Logical result |
| --- | --- | --- |
| `After` | `findByBirthdateAfter(Date date)` | `birthdate > date` |
| `GreaterThan` | `findByAgeGreaterThan(int age)` | `age > age` |
| `GreaterThanEqual` | `findByAgeGreaterThanEqual(int age)` | `age >= age` |
| `Before` | `findByBirthdateBefore(Date date)` | `birthdate < date` |
| `LessThan` | `findByAgeLessThan(int age)` | `age < age` |
| `LessThanEqual` | `findByAgeLessThanEqual(int age)` | `age ⇐ age` |
| `Between` | `findByAgeBetween(int from, int to)` and `findByAgeBetween(Range<Integer> range)` | `age > from AND age < to` and lower / upper bounds (`>` / `>=` & `<` / `⇐`) according to `Range` |
| `In` | `findByAgeIn(Collection ages)` | `age IN (ages…​)` |
| `Like`, `StartingWith`, `EndingWith` | `findByFirstnameLike(String name)` | `firstname LIKE (name as like expression)` |
| `Containing` on String | `findByFirstnameContaining(String name)` | `firstname LIKE (name as like expression)` |
| `Containing` on Collection | `findByAddressesContaining(Address address)` | `addresses CONTAINING address` |
| `(No keyword)` | `findByFirstname(String name)` | `firstname = name` |
| `IsTrue`, `True` | `findByActiveIsTrue()` | `active = true` |
| `IsFalse`,  `False` | `findByActiveIsFalse()` | `active = false` |

<a id="cassandra.repositories.queries.delete"></a>

## Repository Delete Queries

The keywords in the preceding table can be used in conjunction with `delete…By` to create queries that delete matching documents.

#### Imperative

```java
interface PersonRepository extends Repository<Person, String> {

  void deleteWithoutResultByLastname(String lastname);

  boolean deleteByLastname(String lastname);
}
```

#### Reactive

```java
interface PersonRepository extends Repository<Person, String> {

  Mono<Void> deleteWithoutResultByLastname(String lastname);

  Mono<Boolean> deleteByLastname(String lastname);
}
```

Delete queries return whether the query was applied or terminate without returning a value using `void`.

<a id="cassandra.repositories.queries.options"></a>

### Query Options

You can specify query options for query methods by passing a `QueryOptions` object.
The options apply to the query before the actual query execution.
`QueryOptions` is treated as a non-query parameter and is not considered to be a query parameter value.
Query options apply to derived and string `@Query` repository methods.

To statically set the consistency level, use the `@Consistency` annotation on query methods.
The declared consistency level is applied to the query each time it is executed.
The following example sets the consistency level to `ConsistencyLevel.LOCAL_ONE`:

#### Imperative

```java
interface PersonRepository extends CrudRepository<Person, String> {

    @Consistency(ConsistencyLevel.LOCAL_ONE)
    List<Person> findByLastname(String lastname);

    List<Person> findByFirstname(String firstname, QueryOptions options);
}
```

#### Reactive

```java
interface PersonRepository extends ReactiveCrudRepository<Person, String> {

    @Consistency(ConsistencyLevel.LOCAL_ONE)
    Flux<Person> findByLastname(String lastname);

    Flux<Person> findByFirstname(String firstname, QueryOptions options);
}
```

The DataStax Cassandra documentation includes [a good discussion of the available consistency levels](https://docs.datastax.com/en/cassandra-oss/3.0/cassandra/dml/dmlConfigConsistency.html).

> [!NOTE]
> You can control fetch size, consistency level, and retry policy defaults by configuring the following parameters on the CQL API instances: `CqlTemplate`, `AsyncCqlTemplate`, and `ReactiveCqlTemplate`.
> Defaults apply if the particular query option is not set.
