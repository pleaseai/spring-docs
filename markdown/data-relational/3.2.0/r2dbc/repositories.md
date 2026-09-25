---
title: "R2DBC Repositories"
source: "ROOT:r2dbc/repositories.adoc"
---

<a id="r2dbc.repositories"></a>

# R2DBC Repositories

<a id="r2dbc.repositories.intro"></a>

This chapter points out the specialties for repository support for R2DBC.
This builds on the core repository support explained in [Working with Spring Data Repositories](../repositories/introduction.md).
Before reading this chapter, you should have a sound understanding of the basic concepts explained there.

<a id="r2dbc.repositories.usage"></a>

## Usage

To access domain entities stored in a relational database, you can use our sophisticated repository support that eases implementation quite significantly.
To do so, create an interface for your repository.
Consider the following `Person` class:

#### Sample Person entity

```java
public class Person {

  @Id
  private Long id;
  private String firstname;
  private String lastname;

  // … getters and setters omitted
}
```

The following example shows a repository interface for the preceding `Person` class:

#### Basic repository interface to persist Person entities

```java
public interface PersonRepository extends ReactiveCrudRepository<Person, Long> {

  // additional custom query methods go here
}
```

To configure R2DBC repositories, you can use the `@EnableR2dbcRepositories` annotation.
If no base package is configured, the infrastructure scans the package of the annotated configuration class.
The following example shows how to use Java configuration for a repository:

#### Java configuration for repositories

```java
@Configuration
@EnableR2dbcRepositories
class ApplicationConfig extends AbstractR2dbcConfiguration {

  @Override
  public ConnectionFactory connectionFactory() {
    return …
  }
}
```

Because our domain repository extends `ReactiveCrudRepository`, it provides you with reactive CRUD operations to access the entities.
On top of `ReactiveCrudRepository`, there is also `ReactiveSortingRepository`, which adds additional sorting functionality similar to that of `PagingAndSortingRepository`.
Working with the repository instance is merely a matter of dependency injecting it into a client.
Consequently, you can retrieve all `Person` objects with the following code:

#### Paging access to Person entities

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration
class PersonRepositoryTests {

  @Autowired
  PersonRepository repository;

  @Test
  void readsAllEntitiesCorrectly() {

    repository.findAll()
      .as(StepVerifier::create)
      .expectNextCount(1)
      .verifyComplete();
  }

  @Test
  void readsEntitiesByNameCorrectly() {

    repository.findByFirstname("Hello World")
      .as(StepVerifier::create)
      .expectNextCount(1)
      .verifyComplete();
  }
}
```

The preceding example creates an application context with Spring’s unit test support, which performs annotation-based dependency injection into test cases.
Inside the test method, we use the repository to query the database.
We use `StepVerifier` as a test aid to verify our expectations against the results.

<a id="projections.resultmapping"></a>

### Result Mapping

A query method returning an Interface- or DTO projection is backed by results produced by the actual query.
Interface projections generally rely on mapping results onto the domain type first to consider potential `@Column` type mappings and the actual projection proxy uses a potentially partially materialized entity to expose projection data.

Result mapping for DTO projections depends on the actual query type.
Derived queries use the domain type to map results, and Spring Data creates DTO instances solely from properties available on the domain type.
Declaring properties in your DTO that are not available on the domain type is not supported.

String-based queries use a different approach since the actual query, specifically the field projection, and result type declaration are close together.
DTO projections used with query methods annotated with `@Query` map query results directly into the DTO type.
Field mappings on the domain type are not considered.
Using the DTO type directly, your query method can benefit from a more dynamic projection that isn’t restricted to the domain model.

<a id="r2dbc.multiple-databases"></a>

## Working with multiple Databases

When working with multiple, potentially different databases, your application will require a different approach to configuration.
The provided `AbstractR2dbcConfiguration` support class assumes a single `ConnectionFactory` from which the `Dialect` gets derived.
That being said, you need to define a few beans yourself to configure Spring Data R2DBC to work with multiple databases.

R2DBC repositories require `R2dbcEntityOperations` to implement repositories.
A simple configuration to scan for repositories without using `AbstractR2dbcConfiguration` looks like:

```java
@Configuration
@EnableR2dbcRepositories(basePackages = "com.acme.mysql", entityOperationsRef = "mysqlR2dbcEntityOperations")
static class MySQLConfiguration {

    @Bean
    @Qualifier("mysql")
    public ConnectionFactory mysqlConnectionFactory() {
        return …
    }

    @Bean
    public R2dbcEntityOperations mysqlR2dbcEntityOperations(@Qualifier("mysql") ConnectionFactory connectionFactory) {

        DatabaseClient databaseClient = DatabaseClient.create(connectionFactory);

        return new R2dbcEntityTemplate(databaseClient, MySqlDialect.INSTANCE);
    }
}
```

Note that `@EnableR2dbcRepositories` allows configuration either through `databaseClientRef` or `entityOperationsRef`.
Using various `DatabaseClient` beans is useful when connecting to multiple databases of the same type.
When using different database systems that differ in their dialect, use `@EnableR2dbcRepositories`(entityOperationsRef = …)` instead.
