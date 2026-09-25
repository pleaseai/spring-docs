---
title: "Change Streams"
source: "ROOT:mongodb/change-streams.adoc"
---

<a id="change-streams"></a>

# Change Streams

As of MongoDB 3.6, [Change Streams](https://docs.mongodb.com/manual/changeStreams/) let applications get notified about changes without having to tail the oplog.

> [!NOTE]
> Change Stream support is only possible for replica sets or for a sharded cluster.

Change Streams can be consumed with both, the imperative and the reactive MongoDB Java driver. It is highly recommended to use the reactive variant, as it is less resource-intensive. However, if you cannot use the reactive API, you can still obtain change events by using the messaging concept that is already prevalent in the Spring ecosystem.

It is possible to watch both on a collection as well as database level, whereas the database level variant publishes
changes from all collections within the database. When subscribing to a database change stream, make sure to use a
 suitable type for the event type as conversion might not apply correctly across different entity types.
In doubt, use `Document`.

<a id="change-streams-with-messagelistener"></a>

## Change Streams with `MessageListener`

Listening to a [Change Stream by using a Sync Driver](https://docs.mongodb.com/manual/tutorial/change-streams-example/) creates a long running, blocking task that needs to be delegated to a separate component.
In this case, we need to first create a [`MessageListenerContainer`](https://docs.spring.io/spring-data/mongodb/docs/5.0.7/api/org/springframework/data/mongodb/core/messaging/MessageListenerContainer.html) which will be the main entry point for running the specific `SubscriptionRequest` tasks.
Spring Data MongoDB already ships with a default implementation that operates on `MongoTemplate` and is capable of creating and running `Task` instances for a [`ChangeStreamRequest`](https://docs.spring.io/spring-data/mongodb/docs/5.0.7/api/org/springframework/data/mongodb/core/messaging/ChangeStreamRequest.html).

The following example shows how to use Change Streams with `MessageListener` instances:

```java
MessageListenerContainer container = new DefaultMessageListenerContainer(template);
container.start();                                                                                              <1>

MessageListener<ChangeStreamDocument<Document>, User> listener = System.out::println;                           <2>
ChangeStreamRequestOptions options = new ChangeStreamRequestOptions("db", "user", ChangeStreamOptions.empty()); <3>

Subscription subscription = container.register(new ChangeStreamRequest<>(listener, options), User.class);       <4>

// ...

container.stop();                                                                                               <5>
```

1. Starting the container initializes the resources and starts `Task` instances for already registered `SubscriptionRequest` instances. Requests added after startup are ran immediately.
1. Define the listener called when a `Message` is received. The `Message#getBody()` is converted to the requested domain type. Use `Document` to receive raw results without conversion.
1. Set the collection to listen to and provide additional options through `ChangeStreamOptions`.
1. Register the request. The returned `Subscription` can be used to check the current `Task` state and cancel it to free resources.
1. Do not forget to stop the container once you are sure you no longer need it. Doing so stops all running `Task` instances within the container.

`DefaultMessageListenerContainer` implements `SmartLifecycle` and will by default be automatically started when registered as a bean in the Application Context.

> [!NOTE]
> Errors while processing are passed on to an `org.springframework.util.ErrorHandler`. If not stated otherwise a log appending `ErrorHandler` gets applied by default.
>
> Please use `register(request, body, errorHandler)` to provide additional functionality.

<a id="reactive-change-streams"></a>

## Reactive Change Streams

Subscribing to Change Streams with the reactive API is a more natural approach to work with streams. Still, the essential building blocks, such as `ChangeStreamOptions`, remain the same. The following example shows how to use Change Streams emitting `ChangeStreamEvent`s:

```java
Flux<ChangeStreamEvent<User>> flux = reactiveTemplate.changeStream(User.class) <1>
    .watchCollection("people")
    .filter(where("age").gte(38))                                              <2>
    .listen();                                                                 <3>
```

1. The event target type the underlying document should be converted to. Leave this out to receive raw results without conversion.
1. Use an aggregation pipeline or just a query `Criteria` to filter events.
1. Obtain a `Flux` of change stream events. The `ChangeStreamEvent#getBody()` is converted to the requested domain type from (2).

<a id="resuming-change-streams"></a>

## Resuming Change Streams

Change Streams can be resumed and resume emitting events where you left. To resume the stream, you need to supply either a resume
token or the last known server time (in UTC). Use [`ChangeStreamOptions`](https://docs.spring.io/spring-data/mongodb/docs/5.0.7/api/org/springframework/data/mongodb/core/ChangeStreamOptions.html) to set the value accordingly.

The following example shows how to set the resume offset using server time:

```java
Flux<ChangeStreamEvent<User>> resumed = template.changeStream(User.class)
    .watchCollection("people")
    .resumeAt(Instant.now().minusSeconds(1)) <1>
    .listen();
```

1. You may obtain the server time of an `ChangeStreamEvent` through the `getTimestamp` method or use the `resumeToken`
exposed through `getResumeToken`.

> [!TIP]
> In some cases an `Instant` might not be a precise enough measure when resuming a Change Stream. Use a MongoDB native
> [BsonTimestamp](https://docs.mongodb.com/manual/reference/bson-types/#timestamps) for that purpose.
