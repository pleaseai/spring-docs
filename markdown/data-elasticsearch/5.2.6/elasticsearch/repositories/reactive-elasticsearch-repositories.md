---
title: "Reactive Elasticsearch Repositories"
source: "ROOT:elasticsearch/repositories/reactive-elasticsearch-repositories.adoc"
---

<a id="elasticsearch.reactive.repositories"></a>

# Reactive Elasticsearch Repositories

Reactive Elasticsearch repository support builds on the core repository support explained in [repositories.adoc](../../repositories.md) utilizing operations provided via [elasticsearch/reactive-template.adoc](../reactive-template.md) executed by a [Reactive REST Client](../clients.md#elasticsearch.clients.reactiverestclient).

Spring Data Elasticsearch reactive repository support uses [Project Reactor](https://projectreactor.io/) as its reactive composition library of choice.

There are 3 main interfaces to be used:

- `ReactiveRepository`
- `ReactiveCrudRepository`
- `ReactiveSortingRepository`

<a id="elasticsearch.reactive.repositories.usage"></a>

## Usage

To access domain objects stored in a Elasticsearch using a `Repository`, just create an interface for it.
Before you can actually go on and do that you will need an entity.

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

> [!NOTE]
> Please note that the `id` property needs to be of type `String`.

```
interface ReactivePersonRepository extends ReactiveSortingRepository<Person, String> {

  Flux<Person> findByFirstname(String firstname);                                   <1>

  Flux<Person> findByFirstname(Publisher<String> firstname);                        <2>

  Flux<Person> findByFirstnameOrderByLastname(String firstname);                    <3>

  Flux<Person> findByFirstname(String firstname, Sort sort);                        <4>

  Flux<Person> findByFirstname(String firstname, Pageable page);                    <5>

  Mono<Person> findByFirstnameAndLastname(String firstname, String lastname);       <6>

  Mono<Person> findFirstByLastname(String lastname);                                <7>

  @Query("{ \"bool\" : { \"must\" : { \"term\" : { \"lastname\" : \"?0\" } } } }")
  Flux<Person> findByLastname(String lastname);                                     <8>

  Mono<Long> countByFirstname(String firstname)                                     <9>

  Mono<Boolean> existsByFirstname(String firstname)                                 <10>

  Mono<Long> deleteByFirstname(String firstname)                                    <11>
}
```

1. The method shows a query for all people with the given `lastname`.
1. Finder method awaiting input from `Publisher` to bind parameter value for `firstname`.
1. Finder method ordering matching documents by `lastname`.
1. Finder method ordering matching documents by the expression defined via the `Sort` parameter.
1. Use `Pageable` to pass offset and sorting parameters to the database.
1. Finder method concating criteria using `And` / `Or` keywords.
1. Find the first matching entity.
1. The method shows a query for all people with the given `lastname` looked up by running the annotated `@Query` with given
parameters.
1. Count all entities with matching `firstname`.
1. Check if at least one entity with matching `firstname` exists.
1. Delete all entities with matching `firstname`.

<a id="elasticsearch.reactive.repositories.configuration"></a>

## Configuration

For Java configuration, use the `@EnableReactiveElasticsearchRepositories` annotation. If no base package is configured,
the infrastructure scans the package of the annotated configuration class.

The following listing shows how to use Java configuration for a repository:

```java
@Configuration
@EnableReactiveElasticsearchRepositories
public class Config extends AbstractReactiveElasticsearchConfiguration {

  @Override
  public ReactiveElasticsearchClient reactiveElasticsearchClient() {
    return ReactiveRestClients.create(ClientConfiguration.localhost());
  }
}
```

Because the repository from the previous example extends `ReactiveSortingRepository`, all CRUD operations are available
as well as methods for sorted access to the entities. Working with the repository instance is a matter of dependency
injecting it into a client, as the following example shows:

```java
public class PersonRepositoryTests {

  @Autowired ReactivePersonRepository repository;

  @Test
  public void sortsElementsCorrectly() {

    Flux<Person> persons = repository.findAll(Sort.by(new Order(ASC, "lastname")));

    // ...
  }
}
```
