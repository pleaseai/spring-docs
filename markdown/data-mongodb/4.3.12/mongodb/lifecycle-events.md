---
title: "Lifecycle Events"
source: "ROOT:mongodb/lifecycle-events.adoc"
---

<a id="mongodb.mapping-usage.events"></a>

# Lifecycle Events

The MongoDB mapping framework includes several `org.springframework.context.ApplicationEvent` events that your application can respond to by registering special beans in the `ApplicationContext`.
Being based on Spring’s `ApplicationContext` event infrastructure enables other products, such as Spring Integration, to easily receive these events, as they are a well known eventing mechanism in Spring-based applications.

Entity lifecycle events can be costly and you may notice a change in the performance profile when loading large result sets.
You can disable lifecycle events on the [Template API](<https://docs.spring.io/spring-data/mongodb/docs/4.3.12/api/org/springframework/data/mongodb/core/MongoTemplate.html#setEntityLifecycleEventsEnabled(boolean)>).

To intercept an object before it goes through the conversion process (which turns your domain object into a `org.bson.Document`), you can register a subclass of `AbstractMongoEventListener` that overrides the `onBeforeConvert` method.
When the event is dispatched, your listener is called and passed the domain object before it goes into the converter.
The following example shows how to do so:

```java
public class BeforeConvertListener extends AbstractMongoEventListener<Person> {
  @Override
  public void onBeforeConvert(BeforeConvertEvent<Person> event) {
    ... does some auditing manipulation, set timestamps, whatever ...
  }
}
```

To intercept an object before it goes into the database, you can register a subclass of [`AbstractMongoEventListener`](https://docs.spring.io/spring-data/mongodb/docs/4.3.12/api/org/springframework/data/mongodb/core/mapping/event/AbstractMongoEventListener.html) that overrides the `onBeforeSave` method. When the event is dispatched, your listener is called and passed the domain object and the converted `com.mongodb.Document`. The following example shows how to do so:

```java
public class BeforeSaveListener extends AbstractMongoEventListener<Person> {
  @Override
  public void onBeforeSave(BeforeSaveEvent<Person> event) {
    … change values, delete them, whatever …
  }
}
```

Declaring these beans in your Spring ApplicationContext causes them to be invoked whenever the event is dispatched.

- `onBeforeConvert`: Called in `MongoTemplate` `insert`, `insertList`, and `save` operations before the object is converted to a `Document` by a `MongoConverter`.
- `onBeforeSave`: Called in `MongoTemplate` `insert`, `insertList`, and `save` operations **before** inserting or saving the `Document` in the database.
- `onAfterSave`: Called in `MongoTemplate` `insert`, `insertList`, and `save` operations **after** inserting or saving the `Document` in the database.
- `onAfterLoad`: Called in `MongoTemplate` `find`, `findAndRemove`, `findOne`, and `getCollection` methods after the `Document` has been retrieved from the database.
- `onAfterConvert`: Called in `MongoTemplate` `find`, `findAndRemove`, `findOne`, and `getCollection` methods after the `Document` has been retrieved from the database was converted to a POJO.

> [!NOTE]
> Lifecycle events are only emitted for root level types.
> Complex types used as properties within a document root are not subject to event publication unless they are document references annotated with `@DBRef`.

> [!WARNING]
> Lifecycle events depend on an `ApplicationEventMulticaster`, which in case of the `SimpleApplicationEventMulticaster` can be configured with a `TaskExecutor`, and therefore gives no guarantees when an Event is processed.

<a id="entity-callbacks"></a>

## Entity Callbacks

The Spring Data infrastructure provides hooks for modifying an entity before and after certain methods are invoked.
Those so called `EntityCallback` instances provide a convenient way to check and potentially modify an entity in a callback fashioned style.

An `EntityCallback` looks pretty much like a specialized `ApplicationListener`.
Some Spring Data modules publish store specific events (such as `BeforeSaveEvent`) that allow modifying the given entity. In some cases, such as when working with immutable types, these events can cause trouble.
Also, event publishing relies on `ApplicationEventMulticaster`. If configuring that with an asynchronous `TaskExecutor` it can lead to unpredictable outcomes, as event processing can be forked onto a Thread.

Entity callbacks provide integration points with both synchronous and reactive APIs to guarantee in-order execution at well-defined checkpoints within the processing chain, returning a potentially modified entity or an reactive wrapper type.

Entity callbacks are typically separated by API type. This separation means that a synchronous API considers only synchronous entity callbacks and a reactive implementation considers only reactive entity callbacks.

> [!NOTE]
> The Entity Callback API has been introduced with Spring Data Commons 2.2. It is the recommended way of applying entity modifications.
> Existing store specific `ApplicationEvents` are still published **before** the invoking potentially registered `EntityCallback` instances.

<a id="entity-callbacks.implement"></a>

### Implementing Entity Callbacks

An `EntityCallback` is directly associated with its domain type through its generic type argument.
Each Spring Data module typically ships with a set of predefined `EntityCallback` interfaces covering the entity lifecycle.

#### Anatomy of an `EntityCallback`

```java
@FunctionalInterface
public interface BeforeSaveCallback<T> extends EntityCallback<T> {

	/**
	 * Entity callback method invoked before a domain object is saved.
	 * Can return either the same or a modified instance.
	 *
	 * @return the domain object to be persisted.
	 */
	// <1>
	T onBeforeSave(T entity, // <2>
		String collection); // <3>
}
```

1. `BeforeSaveCallback` specific method to be called before an entity is saved. Returns a potentially modified instance.
1. The entity right before persisting.
1. A number of store specific arguments like the *collection* the entity is persisted to.

#### Anatomy of a reactive `EntityCallback`

```java
@FunctionalInterface
public interface ReactiveBeforeSaveCallback<T> extends EntityCallback<T> {

	/**
	 * Entity callback method invoked on subscription, before a domain object is saved.
	 * The returned Publisher can emit either the same or a modified instance.
	 *
	 * @return Publisher emitting the domain object to be persisted.
	 */
	// <1>
	Publisher<T> onBeforeSave(T entity, // <2>
		String collection); // <3>
}
```

1. `BeforeSaveCallback` specific method to be called on subscription, before an entity is saved. Emits a potentially modifed instance.
1. The entity right before persisting.
1. A number of store specific arguments like the *collection* the entity is persisted to.

> [!NOTE]
> Optional entity callback parameters are defined by the implementing Spring Data module and inferred from call site of `EntityCallback.callback()`.

Implement the interface suiting your application needs like shown in the example below:

#### Example `BeforeSaveCallback`

```java
class DefaultingEntityCallback implements BeforeSaveCallback<Person>, Ordered {      <2>

	@Override
	public Object onBeforeSave(Person entity, String collection) {                   <1>

		if(collection == "user") {
		    return // ...
		}

		return // ...
	}

	@Override
	public int getOrder() {
		return 100;                                                                  <2>
	}
}
```

1. Callback implementation according to your requirements.
1. Potentially order the entity callback if multiple ones for the same domain type exist. Ordering follows lowest precedence.

<a id="entity-callbacks.register"></a>

### Registering Entity Callbacks

`EntityCallback` beans are picked up by the store specific implementations in case they are registered in the `ApplicationContext`.
Most template APIs already implement `ApplicationContextAware` and therefore have access to the `ApplicationContext`

The following example explains a collection of valid entity callback registrations:

#### Example `EntityCallback` Bean registration

```java
@Order(1)                                                           <1>
@Component
class First implements BeforeSaveCallback<Person> {

	@Override
	public Person onBeforeSave(Person person) {
		return // ...
	}
}

@Component
class DefaultingEntityCallback implements BeforeSaveCallback<Person>,
                                                           Ordered { <2>

	@Override
	public Object onBeforeSave(Person entity, String collection) {
		// ...
	}

	@Override
	public int getOrder() {
		return 100;                                                  <2>
	}
}

@Configuration
public class EntityCallbackConfiguration {

    @Bean
    BeforeSaveCallback<Person> unorderedLambdaReceiverCallback() {   <3>
        return (BeforeSaveCallback<Person>) it -> // ...
    }
}

@Component
class UserCallbacks implements BeforeConvertCallback<User>,
                                        BeforeSaveCallback<User> {   <4>

	@Override
	public Person onBeforeConvert(User user) {
		return // ...
	}

	@Override
	public Person onBeforeSave(User user) {
		return // ...
	}
}
```

1. `BeforeSaveCallback` receiving its order from the `@Order` annotation.
1. `BeforeSaveCallback` receiving its order via the `Ordered` interface implementation.
1. `BeforeSaveCallback` using a lambda expression. Unordered by default and invoked last. Note that callbacks implemented by a lambda expression do not expose typing information hence invoking these with a non-assignable entity affects the callback throughput. Use a `class` or `enum` to enable type filtering for the callback bean.
1. Combine multiple entity callback interfaces in a single implementation class.

<a id="mongo.entity-callbacks"></a>

## Store specific EntityCallbacks

Spring Data MongoDB uses the `EntityCallback` API for its auditing support and reacts on the following callbacks.

| Callback | Method | Description | Order |
| --- | --- | --- | --- |
| `ReactiveBeforeConvertCallback` `BeforeConvertCallback` | `onBeforeConvert(T entity, String collection)` | Invoked before a domain object is converted to `org.bson.Document`. | `Ordered.LOWEST_PRECEDENCE` |
| `ReactiveAfterConvertCallback` `AfterConvertCallback` | `onAfterConvert(T entity, org.bson.Document target, String collection)` | Invoked after a domain object is loaded. Can modify the domain object after reading it from a `org.bson.Document`. | `Ordered.LOWEST_PRECEDENCE` |
| `ReactiveAuditingEntityCallback` `AuditingEntityCallback` | `onBeforeConvert(Object entity, String collection)` | Marks an auditable entity *created* or *modified* | 100 |
| `ReactiveBeforeSaveCallback` `BeforeSaveCallback` | `onBeforeSave(T entity, org.bson.Document target, String collection)` | Invoked before a domain object is saved. Can modify the target, to be persisted, `Document` containing all mapped entity information. | `Ordered.LOWEST_PRECEDENCE` |
| `ReactiveAfterSaveCallback` `AfterSaveCallback` | `onAfterSave(T entity, org.bson.Document target, String collection)` | Invoked before a domain object is saved. Can modify the domain object, to be returned after save, `Document` containing all mapped entity information. | `Ordered.LOWEST_PRECEDENCE` |
