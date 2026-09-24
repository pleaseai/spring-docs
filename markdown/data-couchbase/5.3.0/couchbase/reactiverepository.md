---
title: "Reactive Couchbase repository"
source: "ROOT:couchbase/reactiverepository.adoc"
---

<a id="couchbase.reactiverepository"></a>

# Reactive Couchbase repository

<a id="couchbase.reactiverepository.intro"></a>

## Introduction

This chapter describes the reactive repository support for couchbase.
This builds on the core repository support explained in [Couchbase repositories](repository.md).
So make sure you’ve got a sound understanding of the basic concepts explained there.

<a id="couchbase.reactiverepository.libraries"></a>

## Reactive Composition Libraries

The Couchbase Java SDK 3.x moved from RxJava to Reactor, so it blends in very nicely with the reactive spring ecosystem.

Reactive Couchbase repositories provide project Reactor wrapper types and can be used by simply extending from one of the library-specific repository interfaces:

- ReactiveCrudRepository
- ReactiveSortingRepository

<a id="couchbase.reactiverepository.usage"></a>

## Usage

Let’s create a simple entity to start with:

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

A corresponding repository implementation may look like this:

```
public interface ReactivePersonRepository extends ReactiveSortingRepository<Person, Long> {

  Flux<Person> findByFirstname(String firstname);

  Flux<Person> findByFirstname(Publisher<String> firstname);

  Flux<Person> findByFirstnameOrderByLastname(String firstname, Pageable pageable);

  Mono<Person> findByFirstnameAndLastname(String firstname, String lastname);
}
```

For JavaConfig use the `@EnableReactiveCouchbaseRepositories` annotation.
The annotation carries the very same attributes like the namespace element.
If no base package is configured the infrastructure will scan the package of the annotated configuration class.

Also note that if you are using it in a spring boot setup you likely can omit the annotation since it is autoconfigured for you.

```java
@Configuration
@EnableReactiveCouchbaseRepositories
class ApplicationConfig extends AbstractCouchbaseConfiguration {
	// ... (see configuration for details)
}
```

As our domain repository extends `ReactiveSortingRepository` it provides you with CRUD operations as well as methods for sorted access to the entities.
Working with the repository instance is just a matter of dependency injecting it into a client.

```java
public class PersonRepositoryTests {

    @Autowired
    ReactivePersonRepository repository;

    @Test
    public void sortsElementsCorrectly() {
      Flux<Person> persons = repository.findAll(Sort.by(new Order(ASC, "lastname")));
      assertNotNull(perons);
    }
}
```

<a id="couchbase.reactiverepository.querying"></a>

## Repositories and Querying

Spring Data’s Reactive Couchbase comes with full querying support already provided by the blocking [Repositories and Querying](repository.md#couchbase.repository.querying)
