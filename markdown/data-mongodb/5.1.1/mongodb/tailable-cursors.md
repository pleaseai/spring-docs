---
title: "Tailable Cursors"
source: "ROOT:mongodb/tailable-cursors.adoc"
---

<a id="tailable-cursors"></a>

# Tailable Cursors

By default, MongoDB automatically closes a cursor when the client exhausts all results supplied by the cursor.
Closing a cursor on exhaustion turns a stream into a finite stream. For [capped collections](https://docs.mongodb.com/manual/core/capped-collections/),
you can use a [Tailable Cursor](https://docs.mongodb.com/manual/core/tailable-cursors/) that remains open after the client
consumed all initially returned data.

> [!TIP]
> Capped collections can be created with `MongoOperations.createCollection`. To do so, provide the required `CollectionOptions.empty().capped()…​`.

Tailable cursors can be consumed with both, the imperative and the reactive MongoDB API. It is highly recommended to use the
reactive variant, as it is less resource-intensive. However, if you cannot use the reactive API, you can still use a messaging
concept that is already prevalent in the Spring ecosystem.

<a id="tailable-cursors.sync"></a>

## Tailable Cursors with `MessageListener`

Listening to a capped collection using a Sync Driver creates a long running, blocking task that needs to be delegated to
a separate component. In this case, we need to first create a `MessageListenerContainer`, which will be the main entry point
for running the specific `SubscriptionRequest`. Spring Data MongoDB already ships with a default implementation that
operates on `MongoTemplate` and is capable of creating and running `Task` instances for a `TailableCursorRequest`.

The following example shows how to use tailable cursors with `MessageListener` instances:

```java
MessageListenerContainer container = new DefaultMessageListenerContainer(template);
container.start();                                                                  <1>

MessageListener<Document, User> listener = System.out::println;                     <2>

TailableCursorRequest request = TailableCursorRequest.builder()
  .collection("orders")                                                             <3>
  .filter(query(where("value").lt(100)))                                            <4>
  .publishTo(listener)                                                              <5>
  .build();

container.register(request, User.class);                                            <6>

// ...

container.stop();                                                                   <7>
```

1. Starting the container initializes the resources and starts `Task` instances for already registered `SubscriptionRequest` instances. Requests added after startup are ran immediately.
1. Define the listener called when a `Message` is received. The `Message#getBody()` is converted to the requested domain type. Use `Document` to receive raw results without conversion.
1. Set the collection to listen to.
1. Provide an optional filter for documents to receive.
1. Set the message listener to publish incoming `Message`s to.
1. Register the request. The returned `Subscription` can be used to check the current `Task` state and cancel it to free resources.
1. Do not forget to stop the container once you are sure you no longer need it. Doing so stops all running `Task` instances within the container.

<a id="tailable-cursors.reactive"></a>

## Reactive Tailable Cursors

Using tailable cursors with a reactive data types allows construction of infinite streams. A tailable cursor remains open until it is closed externally. It emits data as new documents arrive in a capped collection.

Tailable cursors may become dead, or invalid, if either the query returns no match or the cursor returns the document at the “end” of the collection and the application then deletes that document. The following example shows how to create and use an infinite stream query:

```java
Flux<Person> stream = template.tail(query(where("name").is("Joe")), Person.class);

Disposable subscription = stream.doOnNext(person -> System.out.println(person)).subscribe();

// …

// Later: Dispose the subscription to close the stream
subscription.dispose();
```

Spring Data MongoDB Reactive repositories support infinite streams by annotating a query method with `@Tailable`. This works for methods that return `Flux` and other reactive types capable of emitting multiple elements, as the following example shows:

```java
public interface PersonRepository extends ReactiveMongoRepository<Person, String> {

  @Tailable
  Flux<Person> findByFirstname(String firstname);

}

Flux<Person> stream = repository.findByFirstname("Joe");

Disposable subscription = stream.doOnNext(System.out::println).subscribe();

// …

// Later: Dispose the subscription to close the stream
subscription.dispose();
```
