---
title: "Redis-specific Query Methods"
source: "ROOT:redis/redis-repositories/queries.adoc"
---

<a id="redis.repositories.queries"></a>

# Redis-specific Query Methods

Query methods allow automatic derivation of simple finder queries from the method name, as shown in the following example:

```java
public interface PersonRepository extends CrudRepository<Person, String> {

  List<Person> findByFirstname(String firstname);
}
```

> [!NOTE]
> Please make sure properties used in finder methods are set up for indexing.

> [!NOTE]
> Query methods for Redis repositories support only queries for entities and collections of entities with paging.

Using derived query methods might not always be sufficient to model the queries to run. `RedisCallback` offers more control over the actual matching of index structures or even custom indexes.
To do so, provide a `RedisCallback` that returns a single or `Iterable` set of `id` values, as shown in the following example:

```java
String user = //...

List<RedisSession> sessionsByUser = template.find(new RedisCallback<Set<byte[]>>() {

  public Set<byte[]> doInRedis(RedisConnection connection) throws DataAccessException {
    return connection
      .sMembers("sessions:securityContext.authentication.principal.username:" + user);
  }}, RedisSession.class);
```

The following table provides an overview of the keywords supported for Redis and what a method containing that keyword essentially translates to:

| Keyword | Sample | Redis snippet |
| --- | --- | --- |
| `And` | `findByLastnameAndFirstname` | `SINTER …:firstname:rand …:lastname:al’thor` |
| `Or` | `findByLastnameOrFirstname` | `SUNION …:firstname:rand …:lastname:al’thor` |
| `Is, Equals` | `findByFirstname`, `findByFirstnameIs`, `findByFirstnameEquals` | `SINTER …:firstname:rand` |
| `IsTrue` | `FindByAliveIsTrue` | `SINTER …:alive:1` |
| `IsFalse` | `findByAliveIsFalse` | `SINTER …:alive:0` |
| `Top,First` | `findFirst10ByFirstname`,`findTop5ByFirstname` |  |

<a id="redis.repositories.queries.sort"></a>

## Sorting Query Method results

Redis repositories allow various approaches to define sorting order.
Redis itself does not support in-flight sorting when retrieving hashes or sets.
Therefore, Redis repository query methods construct a `Comparator` that is applied to the result before returning results as `List`.
Let’s take a look at the following example:

```java
interface PersonRepository extends RedisRepository<Person, String> {

  List<Person> findByFirstnameOrderByAgeDesc(String firstname); <1>

  List<Person> findByFirstname(String firstname, Sort sort);   <2>
}
```

1. Static sorting derived from method name.
1. Dynamic sorting using a method argument.
