---
title: "Lifecycle Events"
source: "ROOT:jdbc/events.adoc"
---

<a id="jdbc.events"></a>

# Lifecycle Events

Spring Data JDBC publishes lifecycle events to `ApplicationListener` objects, typically beans in the application context.
Events are notifications about a certain lifecycle phase.
In contrast to entity callbacks, events are intended for notification.
Transactional listeners will receive events when the transaction completes.
Events and callbacks get only triggered for aggregate roots.
If you want to process non-root entities, you need to do that through a listener for the containing aggregate root.

Entity lifecycle events can be costly, and you may notice a change in the performance profile when loading large result sets.
You can disable lifecycle events on [Template API](<https://docs.spring.io/spring-data/relational/docs/3.5.11/api/org/springframework/data/jdbc/core/JdbcAggregateTemplate.html#setEntityLifecycleEventsEnabled(boolean)>).

For example, the following listener gets invoked before an aggregate gets saved:

```java
@Bean
ApplicationListener<BeforeSaveEvent<Object>> loggingSaves() {

    return event -> {

        Object entity = event.getEntity();
        LOG.info("{} is getting saved.", entity);
    };
}
```

If you want to handle events only for a specific domain type you may derive your listener from `AbstractRelationalEventListener` and overwrite one or more of the `onXXX` methods, where `XXX` stands for an event type.
Callback methods will only get invoked for events related to the domain type and their subtypes, therefore you don’t require further casting.

```java
class PersonLoadListener extends AbstractRelationalEventListener<Person> {

    @Override
    protected void onAfterLoad(AfterLoadEvent<Person> personLoad) {
		LOG.info(personLoad.getEntity());
    }
}
```

The following table describes the available events. For more details about the exact relation between process steps see the [description of available callbacks](#jdbc.entity-callbacks) which map 1:1 to events.

| Event | When It Is Published |
| --- | --- |
| [`BeforeDeleteEvent`](https://docs.spring.io/spring-data/relational/docs/3.5.11/api/org/springframework/data/relational/core/mapping/event/BeforeDeleteEvent.html) | Before an aggregate root gets deleted. |
| [`AfterDeleteEvent`](https://docs.spring.io/spring-data/relational/docs/3.5.11/api/org/springframework/data/relational/core/mapping/event/AfterDeleteEvent.html) | After an aggregate root gets deleted. |
| [`BeforeConvertEvent`](https://docs.spring.io/spring-data/relational/docs/3.5.11/api/org/springframework/data/relational/core/mapping/event/BeforeConvertEvent.html) | Before an aggregate root gets converted into a plan for executing SQL statements, but after the decision was made if the aggregate is new or not, i.e. if an update or an insert is in order. |
| [`BeforeSaveEvent`](https://docs.spring.io/spring-data/relational/docs/3.5.11/api/org/springframework/data/relational/core/mapping/event/BeforeSaveEvent.html) | Before an aggregate root gets saved (that is, inserted or updated but after the decision about whether if it gets inserted or updated was made). |
| [`AfterSaveEvent`](https://docs.spring.io/spring-data/relational/docs/3.5.11/api/org/springframework/data/relational/core/mapping/event/AfterSaveEvent.html) | After an aggregate root gets saved (that is, inserted or updated). |
| [`AfterConvertEvent`](https://docs.spring.io/spring-data/relational/docs/3.5.11/api/org/springframework/data/relational/core/mapping/event/AfterConvertEvent.html) | After an aggregate root gets created from a database `ResultSet` and all its properties get set. |

> [!WARNING]
> Lifecycle events depend on an `ApplicationEventMulticaster`, which in case of the `SimpleApplicationEventMulticaster` can be configured with a `TaskExecutor`, and therefore gives no guarantees when an Event is processed.

<a id="jdbc.entity-callbacks"></a>

## Store-specific EntityCallbacks

Spring Data JDBC uses the [`EntityCallback` API](../commons/entity-callbacks.md) for its auditing support and reacts on the callbacks listed in the following table.

| Process | `EntityCallback` / Process Step | Comment |
| --- | --- | --- |
| Delete | [`BeforeDeleteCallback`](https://docs.spring.io/spring-data/relational/docs/3.5.11/api/org/springframework/data/relational/core/mapping/event/BeforeDeleteCallback.html) | Before the actual deletion. |
| The aggregate root and all the entities of that aggregate get removed from the database. |  |  |
| [`AfterDeleteCallback`](https://docs.spring.io/spring-data/relational/docs/3.5.11/api/org/springframework/data/relational/core/mapping/event/AfterDeleteCallback.html) | After an aggregate gets deleted. |  |
| Save | Determine if an insert or an update of the aggregate is to be performed dependent on if it is new or not. |  |
| [`BeforeConvertCallback`](https://docs.spring.io/spring-data/relational/docs/3.5.11/api/org/springframework/data/relational/core/mapping/event/BeforeConvertCallback.html) | This is the correct callback if you want to set an id programmatically. In the previous step new aggregates got detected as such and an Id generated in this step would be used in the following step. |  |
| Convert the aggregate to an aggregate change, it is a sequence of SQL statements to be executed against the database. In this step the decision is made if an Id is provided by the aggregate or if the Id is still empty and is expected to be generated by the database. |  |  |
| [`BeforeSaveCallback`](https://docs.spring.io/spring-data/relational/docs/3.5.11/api/org/springframework/data/relational/core/mapping/event/BeforeSaveCallback.html) | Changes made to the aggregate root may get considered, but the decision if an id value will be sent to the database is already made in the previous step. Do not use this for creating Ids for new aggregates. Use `BeforeConvertCallback` instead. |  |
| The SQL statements determined above get executed against the database. |  |  |
| [`AfterSaveCallback`](https://docs.spring.io/spring-data/relational/docs/3.5.11/api/org/springframework/data/relational/core/mapping/event/AfterSaveCallback.html) | After an aggregate root gets saved (that is, inserted or updated). |  |
| Load | Load the aggregate using 1 or more SQL queries. Construct the aggregate from the resultset. |  |
| [`AfterConvertCallback`](https://docs.spring.io/spring-data/relational/docs/3.5.11/api/org/springframework/data/relational/core/mapping/event/AfterConvertCallback.html) |  |  |

We encourage the use of callbacks over events since they support the use of immutable classes and therefore are more powerful and versatile than events.

The delete and save related callbacks do not get invoked for derived query methods or annotated queries.
In general Spring Data JDBC does not have an efficient way to determine what aggregates are affected by these operations and therefore can’t provide callbacks or events.
