---
title: "Collection Support"
source: "ROOT:couchbase/collections.adoc"
---

<a id="couchbase.collections"></a>

# Collection Support

Couchbase supports [Scopes and Collections](https://docs.couchbase.com/server/current/learn/data/scopes-and-collections.html). This section documents on how to use it with Spring Data Couchbase.

The [try-cb-spring](https://github.com/couchbaselabs/try-cb-spring) sample application is a working example of using Scopes and Collections in Spring Data Couchbase.

The 2021 Couchbase Connect presentation on Collections in Spring Data can be found at [Presentation Only](https://www.youtube.com/watch?v=MrplTeEFItk) and [Presentation with Slide Deck](https://web.cvent.com/hub/events/1dce8283-986d-4de9-8368-94c98f60df01/sessions/9ee89a85-833c-4e0c-81b0-807864fa351b?goBackHref=%2Fevents%2F1dce8283-986d-4de9-8368-94c98f60df01%2Fsessions&goBackName=Add%2FView+Sessions&goBackTab=all)

<a id="requirements"></a>

## Requirements

- Couchbase Server 7.0 or above.
- Spring Data Couchbase 4.3.1 or above.

<a id="getting-started-configuration"></a>

## Getting Started & Configuration

<a id="scope-and-collection-specification"></a>

### Scope and Collection Specification

There are several mechanisms of specifying scopes and collections, and these may be combined, or one mechanism may override another.
First some definitions for scopes and collections. An unspecified scope indicates that the default scope is to be used, likewise, an
unspecified collection indicates that the default collection is to be used.
There are only three combinations of scopes and collections that are valid. (1) the default scope and the default collection; (2) the default
scope and a non-default collection; and (3) a non-default scope and a non-default collection. It is not possible to have a non-default
scope and a default collection as non-default scopes do not contain a default collections, neither can one be created.

A scope can be specified in the configuration:

```java
@Configuration
static class Config extends AbstractCouchbaseConfiguration {

    // Usual Setup
    @Override public String getConnectionString() { /* ... */ }

    // optionally specify the scope in the Configuration
    @Override
    protected String getScopeName() {
        return "myScope"; // or a variable etc.;
    }

}
```

Scopes and Collections can be specified as annotations on entity classes and repositories:

```java
@Document
@Scope("travel")
@Collection("airport")
public class Airport {...
```

```java
@Scope("travel")
@Collection("airport")
public interface AirportRepository extends CouchbaseRepository<Airport, String> ...
```

Scopes and Collections can be specified on templates using the inScope(scopeName) and inCollection(collectionName) fluent APIs:

```java
List<Airport> airports = template.findByQuery(Airport.class).inScope("archived").all()
```

Scopes and Collections can be specified on repositories that extend DynamicProxyable using the withScope(scopeName) and withCollection(collectionName) APIs:

```java
public interface AirportRepository extends CouchbaseRepository<Airport, String>, DynamicProxyable<AirportRepository>{...}
...
List<Airport> airports = airportRepository.withScope("archived").findByName(iata);
```

1. inScope()/inCollection() of the template fluent api
1. withScope()/withCollection() of the template/repository object
1. annotation of the repository method
1. annotation of the repository interface
1. annotation of the entity object
1. getScope() of the configuration
