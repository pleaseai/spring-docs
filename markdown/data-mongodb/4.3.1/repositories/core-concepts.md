---
title: "Core concepts"
source: "ROOT:repositories/core-concepts.adoc"
---

<a id="repositories.core-concepts"></a>

# Core concepts

The central interface in the Spring Data repository abstraction is `Repository`.
It takes the domain class to manage as well as the identifier type of the domain class as type arguments.
This interface acts primarily as a marker interface to capture the types to work with and to help you to discover interfaces that extend this one.
The [`CrudRepository`](https://docs.spring.io/spring-data/commons/docs/3.3.1/api//org/springframework/data/repository/CrudRepository.html) and [`ListCrudRepository`](https://docs.spring.io/spring-data/commons/docs/3.3.1/api//org/springframework/data/repository/ListCrudRepository.html) interfaces provide sophisticated CRUD functionality for the entity class that is being managed.

<a id="repositories.repository"></a>

#### `CrudRepository` Interface

```java
public interface CrudRepository<T, ID> extends Repository<T, ID> {

  <S extends T> S save(S entity);      <1>

  Optional<T> findById(ID primaryKey); <2>

  Iterable<T> findAll();               <3>

  long count();                        <4>

  void delete(T entity);               <5>

  boolean existsById(ID primaryKey);   <6>

  // … more functionality omitted.
}
```

1. Saves the given entity.
1. Returns the entity identified by the given ID.
1. Returns all entities.
1. Returns the number of entities.
1. Deletes the given entity.
1. Indicates whether an entity with the given ID exists.

The methods declared in this interface are commonly referred to as CRUD methods.
`ListCrudRepository` offers equivalent methods, but they return `List` where the `CrudRepository` methods return an `Iterable`.

> [!NOTE]
> We also provide persistence technology-specific abstractions, such as `JpaRepository` or `MongoRepository`.
> Those interfaces extend `CrudRepository` and expose the capabilities of the underlying persistence technology in addition to the rather generic persistence technology-agnostic interfaces such as `CrudRepository`.

Additional to the `CrudRepository`, there are [`PagingAndSortingRepository`](https://docs.spring.io/spring-data/commons/docs/3.3.1/api//org/springframework/data/repository/PagingAndSortingRepository.html) and [`ListPagingAndSortingRepository`](https://docs.spring.io/spring-data/commons/docs/3.3.1/api//org/springframework/data/repository/ListPagingAndSortingRepository.html) which add additional methods to ease paginated access to entities:

#### `PagingAndSortingRepository` interface

```java
public interface PagingAndSortingRepository<T, ID>  {

  Iterable<T> findAll(Sort sort);

  Page<T> findAll(Pageable pageable);
}
```

> [!NOTE]
> Extension interfaces are subject to be supported by the actual store module.
> While this documentation explains the general scheme, make sure that your store module supports the interfaces that you want to use.

To access the second page of `User` by a page size of 20, you could do something like the following:

```java
PagingAndSortingRepository<User, Long> repository = // … get access to a bean
Page<User> users = repository.findAll(PageRequest.of(1, 20));
```

`ListPagingAndSortingRepository` offers equivalent methods, but returns a `List` where the `PagingAndSortingRepository` methods return an `Iterable`.

In addition to query methods, query derivation for both count and delete queries is available.
The following list shows the interface definition for a derived count query:

#### Derived Count Query

```java
interface UserRepository extends CrudRepository<User, Long> {

  long countByLastname(String lastname);
}
```

The following listing shows the interface definition for a derived delete query:

#### Derived Delete Query

```java
interface UserRepository extends CrudRepository<User, Long> {

  long deleteByLastname(String lastname);

  List<User> removeByLastname(String lastname);
}
```

<a id="is-new-state-detection"></a>

## Entity State Detection Strategies

The following table describes the strategies that Spring Data offers for detecting whether an entity is new:

|  |  |
| --- | --- |
| `@Id`-Property inspection (the default) | By default, Spring Data inspects the identifier property of the given entity. If the identifier property is `null` or `0` in case of primitive types, then the entity is assumed to be new. Otherwise, it is assumed to not be new. |
| `@Version`-Property inspection | If a property annotated with `@Version` is present and `null`, or in case of a version property of primitive type `0` the entity is considered new. If the version property is present but has a different value, the entity is considered to not be new. If no version property is present Spring Data falls back to inspection of the identifier property. |
| Implementing `Persistable` | If an entity implements `Persistable`, Spring Data delegates the new detection to the `isNew(…)` method of the entity. See the [Javadoc](https://docs.spring.io/spring-data/commons/docs/3.3.1/api//index.html?org/springframework/data/domain/Persistable.html) for details. *Note: Properties of `Persistable` will get detected and persisted if you use `AccessType.PROPERTY`. To avoid that, use `@Transient`.* |
| Providing a custom `EntityInformation` implementation | You can customize the `EntityInformation` abstraction used in the repository base implementation by creating a subclass of the module specific repository factory and overriding the `getEntityInformation(…)` method. You then have to register the custom implementation of module specific repository factory as a Spring bean. Note that this should rarely be necessary. |

> [!NOTE]
> Cassandra provides no means to generate identifiers upon inserting data.
> As consequence, entities must be associated with identifier values.
> Spring Data defaults to identifier inspection to determine whether an entity is new.
> If you want to use [auditing](../mongodb/auditing.md) make sure to either use [Optimistic Locking](../mongodb/template-crud-operations.md#mongo-template.optimistic-locking) or implement `Persistable` for proper entity state detection.
