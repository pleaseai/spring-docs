---
title: "Reactive Elasticsearch Operations"
source: "ROOT:elasticsearch/reactive-template.adoc"
---

<a id="elasticsearch.reactive.operations"></a>

# Reactive Elasticsearch Operations

`ReactiveElasticsearchOperations` is the gateway to executing high level commands against an Elasticsearch cluster using the `ReactiveElasticsearchClient`.

The `ReactiveElasticsearchTemplate` is the default implementation of `ReactiveElasticsearchOperations`.

To get started the `ReactiveElasticsearchOperations` needs to know about the actual client to work with.
Please see [Reactive Rest Client](clients.md#elasticsearch.clients.reactiverestclient) for details on the client and how to configure it.

<a id="elasticsearch.reactive.operations.usage"></a>

## Reactive Operations Usage

`ReactiveElasticsearchOperations` lets you save, find and delete your domain objects and map those objects to documents stored in Elasticsearch.

Consider the following:

```java
@Document(indexName = "marvel")
public class Person {

  private @Id String id;
  private String name;
  private int age;
  // Getter/Setter omitted...
}
```

```java
ReactiveElasticsearchOperations operations;

// ...

operations.save(new Person("Bruce Banner", 42))                    <.>
  .doOnNext(System.out::println)
  .flatMap(person -> operations.get(person.id, Person.class))      <.>
  .doOnNext(System.out::println)
  .flatMap(person -> operations.delete(person))                    <.>
  .doOnNext(System.out::println)
  .flatMap(id -> operations.count(Person.class))                   <.>
  .doOnNext(System.out::println)
  .subscribe();                                                    <.>
```

The above outputs the following sequence on the console.

```text
> Person(id=QjWCWWcBXiLAnp77ksfR, name=Bruce Banner, age=42)
> Person(id=QjWCWWcBXiLAnp77ksfR, name=Bruce Banner, age=42)
> QjWCWWcBXiLAnp77ksfR
> 0
```

1. Insert a new `Person` document into the *marvel* index . The `id` is generated on server side and set into the instance returned.
1. Lookup the `Person` with matching `id` in the *marvel* index.
1. Delete the `Person` with matching `id`, extracted from the given instance, in the *marvel* index.
1. Count the total number of documents in the *marvel* index.
1. Don’t forget to *subscribe()*.
