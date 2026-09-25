---
title: "Hash Mapping"
source: "ROOT:redis/hash-mappers.adoc"
---

<a id="redis.hashmappers.root"></a>

# Hash Mapping

Data can be stored by using various data structures within Redis. `Jackson2JsonRedisSerializer` can convert objects in [JSON](https://en.wikipedia.org/wiki/JSON) format. Ideally, JSON can be stored as a value by using plain keys. You can achieve a more sophisticated mapping of structured objects by using Redis hashes. Spring Data Redis offers various strategies for mapping data to hashes (depending on the use case):

- Direct mapping, by using `HashOperations` and a [serializer](../redis.md#redis:serializer)
- Using [Redis Repositories](../repositories.md)
- Using `HashMapper` and `HashOperations`

<a id="redis.hashmappers.mappers"></a>

## Hash Mappers

Hash mappers are converters of map objects to a `Map<K, V>` and back. `HashMapper` is intended for using with Redis Hashes.

Multiple implementations are available:

- `BeanUtilsHashMapper` using Spring’s [BeanUtils](https://docs.spring.io/spring-framework/docs/6.1.4/javadoc-api/org/springframework/beans/BeanUtils.html).
- `ObjectHashMapper` using [Object-to-Hash Mapping](redis-repositories/mapping.md).
- [`Jackson2HashMapper`](#redis.hashmappers.jackson2) using [FasterXML Jackson](https://github.com/FasterXML/jackson).

The following example shows one way to implement hash mapping:

```java
public class Person {
  String firstname;
  String lastname;

  // …
}

public class HashMapping {

  @Resource(name = "redisTemplate")
  HashOperations<String, byte[], byte[]> hashOperations;

  HashMapper<Object, byte[], byte[]> mapper = new ObjectHashMapper();

  public void writeHash(String key, Person person) {

    Map<byte[], byte[]> mappedHash = mapper.toHash(person);
    hashOperations.putAll(key, mappedHash);
  }

  public Person loadHash(String key) {

    Map<byte[], byte[]> loadedHash = hashOperations.entries("key");
    return (Person) mapper.fromHash(loadedHash);
  }
}
```

<a id="redis.hashmappers.jackson2"></a>

### Jackson2HashMapper

`Jackson2HashMapper` provides Redis Hash mapping for domain objects by using [FasterXML Jackson](https://github.com/FasterXML/jackson).
`Jackson2HashMapper` can map top-level properties as Hash field names and, optionally, flatten the structure.
Simple types map to simple values. Complex types (nested objects, collections, maps, and so on) are represented as nested JSON.

Flattening creates individual hash entries for all nested properties and resolves complex types into simple types, as far as possible.

Consider the following class and the data structure it contains:

```java
public class Person {
  String firstname;
  String lastname;
  Address address;
  Date date;
  LocalDateTime localDateTime;
}

public class Address {
  String city;
  String country;
}
```

The following table shows how the data in the preceding class would appear in normal mapping:

| Hash Field | Value |
| --- | --- |
| firstname | `Jon` |
| lastname | `Snow` |
| address | `{ "city" : "Castle Black", "country" : "The North" }` |
| date | `1561543964015` |
| localDateTime | `2018-01-02T12:13:14` |

The following table shows how the data in the preceding class would appear in flat mapping:

| Hash Field | Value |
| --- | --- |
| firstname | `Jon` |
| lastname | `Snow` |
| address.city | `Castle Black` |
| address.country | `The North` |
| date | `1561543964015` |
| localDateTime | `2018-01-02T12:13:14` |

> [!NOTE]
> Flattening requires all property names to not interfere with the JSON path. Using dots or brackets in map keys or as property names is not supported when you use flattening. The resulting hash cannot be mapped back into an Object.

> [!NOTE]
> `java.util.Date` and `java.util.Calendar` are represented with milliseconds. JSR-310 Date/Time types are serialized to their `toString` form if  `jackson-datatype-jsr310` is on the class path.
