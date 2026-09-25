---
title: "Events"
source: "ROOT:events.adoc"
---

<a id="events"></a>

# Events

The REST exporter emits eight different events throughout the process of working with an entity:

- [`BeforeCreateEvent`](https://docs.spring.io/spring-data/rest/docs/4.5.3/api/org/springframework/data/rest/core/event/BeforeCreateEvent.html)
- [`AfterCreateEvent`](https://docs.spring.io/spring-data/rest/docs/4.5.3/api/org/springframework/data/rest/core/event/AfterCreateEvent.html)
- [`BeforeSaveEvent`](https://docs.spring.io/spring-data/rest/docs/4.5.3/api/org/springframework/data/rest/core/event/BeforeSaveEvent.html)
- [`AfterSaveEvent`](https://docs.spring.io/spring-data/rest/docs/4.5.3/api/org/springframework/data/rest/core/event/AfterSaveEvent.html)
- [`BeforeLinkSaveEvent`](https://docs.spring.io/spring-data/rest/docs/4.5.3/api/org/springframework/data/rest/core/event/BeforeLinkSaveEvent.html)
- [`AfterLinkSaveEvent`](https://docs.spring.io/spring-data/rest/docs/4.5.3/api/org/springframework/data/rest/core/event/AfterLinkSaveEvent.html)
- [`BeforeDeleteEvent`](https://docs.spring.io/spring-data/rest/docs/4.5.3/api/org/springframework/data/rest/core/event/BeforeDeleteEvent.html)
- [`AfterDeleteEvent`](https://docs.spring.io/spring-data/rest/docs/4.5.3/api/org/springframework/data/rest/core/event/AfterDeleteEvent.html)

<a id="events.application-listener"></a>

## Writing an `ApplicationListener`

You can subclass an abstract class that listens for these kinds of events and calls the appropriate method based on the event type. To do so, override the methods for the events in question, as follows:

```java
public class BeforeSaveEventListener extends AbstractRepositoryEventListener {

  @Override
  public void onBeforeSave(Object entity) {
    ... logic to handle inspecting the entity before the Repository saves it
  }

  @Override
  public void onAfterDelete(Object entity) {
    ... send a message that this entity has been deleted
  }
}
```

One thing to note with this approach, however, is that it makes no distinction based on the type of the entity. You have to inspect that yourself.

<a id="events.annotated-handler"></a>

## Writing an Annotated Handler

Another approach is to use an annotated handler, which filters events based on domain type.

To declare a handler, create a POJO and put the `@RepositoryEventHandler` annotation on it. This tells the `BeanPostProcessor` that this class needs to be inspected for handler methods.

Once the `BeanPostProcessor`  finds a bean with this annotation, it iterates over the exposed methods and looks for annotations that correspond to the event in question. For example, to handle `BeforeSaveEvent` instances in an annotated POJO for different kinds of domain types, you could define your class as follows:

```java
@RepositoryEventHandler <1>
public class PersonEventHandler {

  @HandleBeforeSave
  public void handlePersonSave(Person p) {
    // … you can now deal with Person in a type-safe way
  }

  @HandleBeforeSave
  public void handleProfileSave(Profile p) {
    // … you can now deal with Profile in a type-safe way
  }
}
```

1. It’s possible to narrow the types to which this handler applies by using (for example) `@RepositoryEventHandler(Person.class)`.

The domain type whose events you are interested in is determined from the type of the first parameter of the annotated methods.

To register your event handler, either mark the class with one of Spring’s `@Component` stereotypes (so that it can be picked up by `@SpringBootApplication` or `@ComponentScan`) or declare an instance of your annotated bean in your `ApplicationContext`. Then the `BeanPostProcessor` that is created in `RepositoryRestMvcConfiguration` inspects the bean for handlers and wires them to the correct events. The following example shows how to create an event handler for the `Person` class:

```java
@Configuration
public class RepositoryConfiguration {

  @Bean
  PersonEventHandler personEventHandler() {
    return new PersonEventHandler();
  }
}
```

> [!NOTE]
> Spring Data REST events are customized [Spring application events](https://docs.spring.io/spring-framework/reference/6.2/core.html#context-functionality-events). By default, Spring events are synchronous, unless they get republished across a boundary (such as issuing a WebSocket event or crossing into a thread).
