---
title: "Map Repositories"
source: "ROOT:keyvalue/repository/map-repositories.adoc"
---

<a id="key-value.repositories.map"></a>

# Map Repositories

Map repositories reside on top of the `KeyValueTemplate`.
Using the default `SpelQueryCreator` allows deriving query and sort expressions from the given method name, as the following example shows:

```java
@Configuration
@EnableMapRepositories
class KeyValueConfig {

}

interface PersonRepository implements CrudRepository<Person, String> {
    List<Person> findByLastname(String lastname);
}
```
