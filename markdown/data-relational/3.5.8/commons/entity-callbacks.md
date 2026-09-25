---
title: "Entity Callbacks"
source: "ROOT:commons/entity-callbacks.adoc"
---

<a id="entity-callbacks"></a>

# Entity Callbacks

The Spring Data infrastructure provides hooks for modifying an entity before and after certain methods are invoked.
Those so called `EntityCallback` instances provide a convenient way to check and potentially modify an entity in a callback fashioned style.

An `EntityCallback` looks pretty much like a specialized `ApplicationListener`.
Some Spring Data modules publish store specific events (such as `BeforeSaveEvent`) that allow modifying the given entity. In some cases, such as when working with immutable types, these events can cause trouble.
Also, event publishing relies on `ApplicationEventMulticaster`. If configuring that with an asynchronous `TaskExecutor` it can lead to unpredictable outcomes, as event processing can be forked onto a Thread.

Entity callbacks provide integration points with both synchronous and reactive APIs to guarantee in-order execution at well-defined checkpoints within the processing chain, returning a potentially modified entity or a reactive wrapper type.

Entity callbacks are typically separated by API type. This separation means that a synchronous API considers only synchronous entity callbacks and a reactive implementation considers only reactive entity callbacks.

> [!NOTE]
> The Entity Callback API has been introduced with Spring Data Commons 2.2. It is the recommended way of applying entity modifications.
> Existing store specific `ApplicationEvents` are still published **before** the invoking potentially registered `EntityCallback` instances.

<a id="entity-callbacks.implement"></a>

## Implementing Entity Callbacks

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

1. `BeforeSaveCallback` specific method to be called on subscription, before an entity is saved. Emits a potentially modified instance.
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

## Registering Entity Callbacks

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
