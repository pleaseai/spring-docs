---
title: "Configuration"
source: "ROOT:mongodb/template-config.adoc"
---

<a id="mongo-template.instantiating"></a>

# Configuration

You can use the following configuration to create and register an instance of `MongoTemplate`, as the following example shows:

#### Imperative

```java
@Configuration
class ApplicationConfiguration {

  @Bean
  MongoClient mongoClient() {
      return MongoClients.create("mongodb://localhost:27017");
  }

  @Bean
  MongoOperations mongoTemplate(MongoClient mongoClient) {
      return new MongoTemplate(mongoClient, "geospatial");
  }
}
```

#### Reactive

```java
@Configuration
class ReactiveApplicationConfiguration {

  @Bean
  MongoClient mongoClient() {
      return MongoClients.create("mongodb://localhost:27017");
  }

  @Bean
  ReactiveMongoOperations mongoTemplate(MongoClient mongoClient) {
      return new ReactiveMongoTemplate(mongoClient, "geospatial");
  }
}
```

#### XML

```xml
<mongo:mongo-client host="localhost" port="27017" />

<bean id="mongoTemplate" class="org.springframework.data.mongodb.core.MongoTemplate">
  <constructor-arg ref="mongoClient" />
  <constructor-arg name="databaseName" value="geospatial" />
</bean>
```

There are several overloaded constructors of [`MongoTemplate`](https://docs.spring.io/spring-data/mongodb/docs/4.5.2/api/org/springframework/data/mongodb/core/MongoTemplate.html) and [`ReactiveMongoTemplate`](https://docs.spring.io/spring-data/mongodb/docs/4.5.2/api/org/springframework/data/mongodb/core/ReactiveMongoTemplate.html):

- `MongoTemplate(MongoClient mongo, String databaseName)`: Takes the `MongoClient` object and the default database name to operate against.
- `MongoTemplate(MongoDatabaseFactory mongoDbFactory)`: Takes a MongoDbFactory object that encapsulated the `MongoClient` object, database name, and username and password.
- `MongoTemplate(MongoDatabaseFactory mongoDbFactory, MongoConverter mongoConverter)`: Adds a `MongoConverter` to use for mapping.

Other optional properties that you might like to set when creating a `MongoTemplate` / `ReactiveMongoTemplate` are the default `WriteResultCheckingPolicy`, `WriteConcern`, `ReadPreference` and others listed below.

<a id="mongo-template.read-preference"></a>

## Default Read Preference

The default read preference applied to read operations if no other preference was defined via the [Query](template-query-operations.md#mongo.query.read-preference).

<a id="mongo-template.writeresultchecking"></a>

## WriteResultChecking Policy

When in development, it is handy to either log or throw an exception if the `com.mongodb.WriteResult` returned from any MongoDB operation contains an error. It is quite common to forget to do this during development and then end up with an application that looks like it runs successfully when, in fact, the database was not modified according to your expectations. You can set the `WriteResultChecking` property of `MongoTemplate` to one of the following values: `EXCEPTION` or `NONE`, to either throw an `Exception` or do nothing, respectively. The default is to use a `WriteResultChecking` value of `NONE`.

<a id="mongo-template.writeconcern"></a>

## Default WriteConcern

If it has not yet been specified through the driver at a higher level (such as `com.mongodb.client.MongoClient`), you can set the `com.mongodb.WriteConcern` property that the `MongoTemplate` uses for write operations. If the `WriteConcern` property is not set, it defaults to the one set in the MongoDB driver’s DB or Collection setting.

<a id="mongo-template.writeconcernresolver"></a>

## WriteConcernResolver

For more advanced cases where you want to set different `WriteConcern` values on a per-operation basis (for remove, update, insert, and save operations), a strategy interface called `WriteConcernResolver` can be configured on `MongoTemplate`. Since `MongoTemplate` is used to persist POJOs, the `WriteConcernResolver` lets you create a policy that can map a specific POJO class to a `WriteConcern` value. The following listing shows the  `WriteConcernResolver` interface:

```java
public interface WriteConcernResolver {
  WriteConcern resolve(MongoAction action);
}
```

You can use the `MongoAction` argument to determine the `WriteConcern` value or use the value of the Template itself as a default.
`MongoAction` contains the collection name being written to, the `java.lang.Class` of the POJO, the converted `Document`, the operation (`REMOVE`, `UPDATE`, `INSERT`, `INSERT_LIST`, or `SAVE`), and a few other pieces of contextual information.
The following example shows two sets of classes getting different `WriteConcern` settings:

```java
public class MyAppWriteConcernResolver implements WriteConcernResolver {

  @Override
  public WriteConcern resolve(MongoAction action) {
    if (action.getEntityType().getSimpleName().contains("Audit")) {
      return WriteConcern.ACKNOWLEDGED;
    } else if (action.getEntityType().getSimpleName().contains("Metadata")) {
      return WriteConcern.JOURNALED;
    }
    return action.getDefaultWriteConcern();
  }
}
```

<a id="mongo-template.entity-lifecycle-events"></a>

## Publish entity lifecycle events

The template publishes [lifecycle events](lifecycle-events.md#mongodb.mapping-usage.events).
In case there are no listeners present, this feature can be disabled.

```java
@Bean
MongoOperations mongoTemplate(MongoClient mongoClient) {
    MongoTemplate template = new MongoTemplate(mongoClient, "geospatial");
	template.setEntityLifecycleEventsEnabled(false);
	// ...
}
```

<a id="mongo-template.entity-callbacks-config"></a>

## Configure EntityCallbacks

Nest to lifecycle events the template invokes [EntityCallbacks](lifecycle-events.md#mongo.entity-callbacks) which can be (if not auto configured) set via the template API.

#### Imperative

```java
@Bean
MongoOperations mongoTemplate(MongoClient mongoClient) {
    MongoTemplate template = new MongoTemplate(mongoClient, "...");
	template.setEntityCallbacks(EntityCallbacks.create(...));
	// ...
}
```

#### Reactive

```java
@Bean
ReactiveMongoOperations mongoTemplate(MongoClient mongoClient) {
    ReactiveMongoTemplate template = new ReactiveMongoTemplate(mongoClient, "...");
	template.setEntityCallbacks(ReactiveEntityCallbacks.create(...));
	// ...
}
```

<a id="mongo-template.count-documents-config"></a>

## Document count configuration

By setting `MongoTemplate#useEstimatedCount(…​)` to `true` *MongoTemplate#count(…​)* operations, that use an empty filter query, will be delegated to `estimatedCount`, as long as there is no transaction active and the template is not bound to a [session](client-session-transactions.md).
Please refer to the [Counting Documents](template-document-count.md#mongo.query.count) section for more information.
