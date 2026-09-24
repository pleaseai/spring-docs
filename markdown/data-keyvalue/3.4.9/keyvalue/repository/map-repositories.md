---
title: "Map Repositories"
source: "ROOT:keyvalue/repository/map-repositories.adoc"
---

<a id="key-value.repositories.map"></a>

# Map Repositories

Map repositories reside on top of the `KeyValueTemplate`.
Using the default `PredicateQueryCreator` allows deriving query and sort expressions from the given method name, as the following example shows:

```java
@Configuration
@EnableMapRepositories
class KeyValueConfig {

}

interface PersonRepository implements CrudRepository<Person, String> {
    List<Person> findByLastname(String lastname);
}
```

<a id="_configuring_the_queryengine"></a>

## Configuring the QueryEngine

It is possible to change the `QueryEngine` and use a custom one instead of the default.
The `EnableMapRepositories` annotation allows to configure the by supplying a `QueryEngineFactory` as well as the `QueryCreator` via according attributes.
Please mind that the `QueryEngine` needs to be able to process queries created by the configured `QueryCreator`.
