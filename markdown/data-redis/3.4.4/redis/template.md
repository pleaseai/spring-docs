---
title: "Working with Objects through `RedisTemplate`"
source: "ROOT:redis/template.adoc"
---

<a id="redis:template"></a>

# Working with Objects through `RedisTemplate`

Most users are likely to use [`RedisTemplate`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/RedisTemplate.html) and its corresponding package, `org.springframework.data.redis.core` or its reactive variant [`ReactiveRedisTemplate`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/ReactiveRedisTemplate.html).
The template is, in fact, the central class of the Redis module, due to its rich feature set.
The template offers a high-level abstraction for Redis interactions.
While `[Reactive]RedisConnection` offers low-level methods that accept and return binary values (`byte` arrays), the template takes care of serialization and connection management, freeing the user from dealing with such details.

The [`RedisTemplate`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/RedisTemplate.html) class implements the [`RedisOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/RedisOperations.html)  interface and its reactive variant [`ReactiveRedisTemplate`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/ReactiveRedisTemplate.html) implements [`ReactiveRedisOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/ReactiveRedisOperations.html).

> [!NOTE]
> The preferred way to reference operations on a `[Reactive]RedisTemplate` instance is through the
> `[Reactive]RedisOperations` interface.

Moreover, the template provides operations views (following the grouping from the Redis command [reference](https://redis.io/commands)) that offer rich, generified interfaces for working against a certain type or certain key (through the `KeyBound` interfaces) as described in the following table:

#### Imperative

| Interface | Description |
| --- | --- |
| *Key Type Operations* |  |
| [`GeoOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/GeoOperations.html) | Redis geospatial operations, such as `GEOADD`, `GEORADIUS`,…​ |
| [`HashOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/HashOperations.html) | Redis hash operations |
| [`HyperLogLogOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/HyperLogLogOperations.html) | Redis HyperLogLog operations, such as `PFADD`, `PFCOUNT`,…​ |
| [`ListOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/ListOperations.html) | Redis list operations |
| [`SetOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/SetOperations.html) | Redis set operations |
| [`ValueOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/ValueOperations.html) | Redis string (or value) operations |
| [`ZSetOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/ZSetOperations.html) | Redis zset (or sorted set) operations |
| *Key Bound Operations* |  |
| [`BoundGeoOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/BoundGeoOperations.html) | Redis key bound geospatial operations |
| [`BoundHashOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/BoundHashOperations.html) | Redis hash key bound operations |
| [`BoundKeyOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/BoundKeyOperations.html) | Redis key bound operations |
| [`BoundListOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/BoundListOperations.html) | Redis list key bound operations |
| [`BoundSetOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/BoundSetOperations.html) | Redis set key bound operations |
| [`BoundValueOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/BoundValueOperations.html) | Redis string (or value) key bound operations |
| [`BoundZSetOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/BoundZSetOperations.html) | Redis zset (or sorted set) key bound operations |

#### Reactive

| Interface | Description |
| --- | --- |
| *Key Type Operations* |  |
| [`ReactiveGeoOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/ReactiveGeoOperations.html) | Redis geospatial operations such as `GEOADD`, `GEORADIUS`, and others) |
| [`ReactiveHashOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/ReactiveHashOperations.html) | Redis hash operations |
| [`ReactiveHyperLogLogOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/ReactiveHyperLogLogOperations.html) | Redis HyperLogLog operations such as (`PFADD`, `PFCOUNT`, and others) |
| [`ReactiveListOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/ReactiveListOperations.html) | Redis list operations |
| [`ReactiveSetOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/ReactiveSetOperations.html) | Redis set operations |
| [`ReactiveValueOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/ReactiveValueOperations.html) | Redis string (or value) operations |
| [`ReactiveZSetOperations`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/ReactiveZSetOperations.html) | Redis zset (or sorted set) operations |

Once configured, the template is thread-safe and can be reused across multiple instances.

`RedisTemplate` uses a Java-based serializer for most of its operations.
This means that any object written or read by the template is serialized and deserialized through Java.

You can change the serialization mechanism on the template, and the Redis module offers several implementations, which are available in the `org.springframework.data.redis.serializer` package.
See [Serializers](#redis:serializer) for more information.
You can also set any of the serializers to null and use RedisTemplate with raw byte arrays by setting the `enableDefaultSerializer` property to `false`.
Note that the template requires all keys to be non-null.
However, values can be null as long as the underlying serializer accepts them.
Read the Javadoc of each serializer for more information.

For cases where you need a certain template view, declare the view as a dependency and inject the template.
The container automatically performs the conversion, eliminating the `opsFor[X]` calls, as shown in the following example:

#### Java Imperative

```java
@Configuration
class MyConfig {

  @Bean
  LettuceConnectionFactory connectionFactory() {
    return new LettuceConnectionFactory();
  }

  @Bean
  RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {

    RedisTemplate<String, String> template = new RedisTemplate<>();
    template.setConnectionFactory(connectionFactory);
    return template;
  }
}
```

#### Java Reactive

```java
@Configuration
class MyConfig {

  @Bean
  LettuceConnectionFactory connectionFactory() {
    return new LettuceConnectionFactory();
  }

  @Bean
  ReactiveRedisTemplate<String, String> ReactiveRedisTemplate(ReactiveRedisConnectionFactory connectionFactory) {
    return new ReactiveRedisTemplate<>(connectionFactory, RedisSerializationContext.string());
  }
}
```

#### XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:p="http://www.springframework.org/schema/p"
  xsi:schemaLocation="http://www.springframework.org/schema/beans https://www.springframework.org/schema/beans/spring-beans.xsd">

  <bean id="redisConnectionFactory" class="org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory"/>
  <!-- redis template definition -->
  <bean id="redisTemplate" class="org.springframework.data.redis.core.RedisTemplate" p:connection-factory-ref="redisConnectionFactory"/>
  ...

</beans>
```

#### Imperative

```java
public class Example {

  // inject the actual operations
  @Autowired
  private RedisOperations<String, String> operations;

  // inject the template as ListOperations
  @Resource(name="redisTemplate")
  private ListOperations<String, String> listOps;

  public void addLink(String userId, URL url) {
    listOps.leftPush(userId, url.toExternalForm());
  }
}
```

#### Reactive

```java
public class Example {

  // inject the actual template
  @Autowired
  private ReactiveRedisOperations<String, String> operations;

  public Mono<Long> addLink(String userId, URL url) {
    return operations.opsForList().leftPush(userId, url.toExternalForm());
  }
}
```

<a id="redis:string"></a>

## String-focused Convenience Classes

Since it is quite common for the keys and values stored in Redis to be `java.lang.String`, the Redis modules provides two extensions to `RedisConnection` and `RedisTemplate`, respectively the `StringRedisConnection` (and its `DefaultStringRedisConnection` implementation) and `StringRedisTemplate` as a convenient one-stop solution for intensive String operations.
In addition to being bound to `String` keys, the template and the connection use the `StringRedisSerializer` underneath, which means the stored keys and values are human-readable (assuming the same encoding is used both in Redis and your code).
The following listings show an example:

#### Java Imperative

```java
@Configuration
class RedisConfiguration {

  @Bean
  LettuceConnectionFactory redisConnectionFactory() {
    return new LettuceConnectionFactory();
  }

  @Bean
  StringRedisTemplate stringRedisTemplate(RedisConnectionFactory redisConnectionFactory) {

    StringRedisTemplate template = new StringRedisTemplate();
    template.setConnectionFactory(redisConnectionFactory);
    return template;
  }
}
```

#### Java Reactive

```java
@Configuration
class RedisConfiguration {

  @Bean
  LettuceConnectionFactory redisConnectionFactory() {
    return new LettuceConnectionFactory();
  }

  @Bean
  ReactiveStringRedisTemplate reactiveRedisTemplate(ReactiveRedisConnectionFactory factory) {
    return new ReactiveStringRedisTemplate<>(factory);
  }
}
```

#### XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:p="http://www.springframework.org/schema/p"
  xsi:schemaLocation="http://www.springframework.org/schema/beans https://www.springframework.org/schema/beans/spring-beans.xsd">

  <bean id="redisConnectionFactory" class="org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory"/>

  <bean id="stringRedisTemplate" class="org.springframework.data.redis.core.StringRedisTemplate" p:connection-factory-ref="redisConnectionFactory"/>

</beans>
```

#### Imperative

```java
public class Example {

  @Autowired
  private StringRedisTemplate redisTemplate;

  public void addLink(String userId, URL url) {
    redisTemplate.opsForList().leftPush(userId, url.toExternalForm());
  }
}
```

#### Reactive

```java
public class Example {

  @Autowired
  private ReactiveStringRedisTemplate redisTemplate;

  public Mono<Long> addLink(String userId, URL url) {
    return redisTemplate.opsForList().leftPush(userId, url.toExternalForm());
  }
}
```

As with the other Spring templates, `RedisTemplate` and `StringRedisTemplate` let you talk directly to Redis through the `RedisCallback` interface.
This feature gives complete control to you, as it talks directly to the `RedisConnection`.
Note that the callback receives an instance of `StringRedisConnection` when a `StringRedisTemplate` is used.
The following example shows how to use the `RedisCallback` interface:

```java
public void useCallback() {

  redisOperations.execute(new RedisCallback<Object>() {
    public Object doInRedis(RedisConnection connection) throws DataAccessException {
      Long size = connection.dbSize();
      // Can cast to StringRedisConnection if using a StringRedisTemplate
      ((StringRedisConnection)connection).set("key", "value");
    }
   });
}
```

<a id="redis:serializer"></a>

## Serializers

From the framework perspective, the data stored in Redis is only bytes.
While Redis itself supports various types, for the most part, these refer to the way the data is stored rather than what it represents.
It is up to the user to decide whether the information gets translated into strings or any other objects.

In Spring Data, the conversion between the user (custom) types and raw data (and vice-versa) is handled by Spring Data Redis in the `org.springframework.data.redis.serializer` package.

This package contains two types of serializers that, as the name implies, take care of the serialization process:

- Two-way serializers based on [`RedisSerializer`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/serializer/RedisSerializer.html).
- Element readers and writers that use `RedisElementReader` and `RedisElementWriter`.

The main difference between these variants is that `RedisSerializer` primarily serializes to `byte[]` while readers and writers use `ByteBuffer`.

Multiple implementations are available (including two that have been already mentioned in this documentation):

- [`JdkSerializationRedisSerializer`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/serializer/JdkSerializationRedisSerializer.html), which is used by default for [`RedisCache`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/cache/RedisCache.html) and [`RedisTemplate`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/RedisTemplate.html).
- the `StringRedisSerializer`.

However, one can use `OxmSerializer` for Object/XML mapping through Spring [OXM](https://docs.spring.io/spring-framework/reference/6.2/data-access.html#oxm) support or [`Jackson2JsonRedisSerializer`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/serializer/Jackson2JsonRedisSerializer.html) or [`GenericJackson2JsonRedisSerializer`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/serializer/GenericJackson2JsonRedisSerializer.html) for storing data in [JSON](https://en.wikipedia.org/wiki/JSON) format.

Do note that the storage format is not limited only to values.
It can be used for keys, values, or hashes without any restrictions.

> [!WARNING]
> By default, [`RedisCache`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/cache/RedisCache.html) and [`RedisTemplate`](https://docs.spring.io/spring-data/redis/docs/3.4.4/api/org/springframework/data/redis/core/RedisTemplate.html) are configured to use Java native serialization.
> Java native serialization is known for allowing the running of remote code caused by payloads that exploit vulnerable libraries and classes injecting unverified bytecode.
> Manipulated input could lead to unwanted code being run in the application during the deserialization step.
> As a consequence, do not use serialization in untrusted environments.
> In general, we strongly recommend any other message format (such as JSON) instead.
>
> If you are concerned about security vulnerabilities due to Java serialization, consider the general-purpose serialization filter mechanism at the core JVM level:
>
> - [Filter Incoming Serialization Data](https://docs.oracle.com/en/java/javase/17/core/serialization-filtering1.html).
> - [JEP 290](https://openjdk.org/jeps/290).
> - [OWASP: Deserialization of untrusted data](https://owasp.org/www-community/vulnerabilities/Deserialization_of_untrusted_data).
