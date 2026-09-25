---
title: "Migration Guides"
source: "ROOT:upgrading.adoc"
---

<a id="redis.upgrading"></a>

# Migration Guides

This section contains details about migration steps, deprecations, and removals.

<a id="upgrading.3-to-4"></a>

## Upgrading from 3.x to 4.x

Upgrade to the latest Spring Data Redis 3.5.x release and replace APIs deprecated for removal before moving to 4.0.

<a id="upgrading.3-to-4.jackson"></a>

### Jackson 3

Spring Data Redis 4.0 uses Jackson 3 as its primary JSON library.
The Jackson 2 APIs listed below are deprecated for removal.

`RedisSerializer.json()` now uses Jackson 3 from the `tools.jackson` package.
It requires `tools.jackson.core:jackson-databind` and a recent version of `com.fasterxml.jackson.core:jackson-annotations`.
Refer to the [Jackson 3 migration guide](https://github.com/FasterXML/jackson/blob/main/jackson3/MIGRATING_TO_JACKSON_3.md) for information on updating your application code.

The following table lists Jackson 3 replacements:

| Purpose | Jackson 2 API | Jackson 3 API |
| --- | --- | --- |
| Generic JSON serializer | `GenericJackson2JsonRedisSerializer` | `GenericJacksonJsonRedisSerializer` |
| Typed JSON serializer | `Jackson2JsonRedisSerializer` | `JacksonJsonRedisSerializer` |
| Hash mapper | `Jackson2HashMapper` | `JacksonHashMapper` |
| Custom reader and writer contracts | `Jackson2ObjectReader` and `Jackson2ObjectWriter` | `JacksonObjectReader` and `JacksonObjectWriter` |

> [!NOTE]
> `GenericJackson2JsonRedisSerializer` enabled default typing by default without requiring a `PolymorphicTypeValidator`.
> `GenericJacksonJsonRedisSerializer` does not enable default typing by default.
> If you require default typing, enable it through the `GenericJacksonJsonRedisSerializer` builder (`GenericJacksonJsonRedisSerializer.builder().enableDefaultTyping(…)`).

If you continue using Jackson 2 during migration, replace `JacksonObjectReader` with `Jackson2ObjectReader` and `JacksonObjectWriter` with `Jackson2ObjectWriter` in constructors and builders.

Previously, `RedisSerializer.json()` used `GenericJackson2JsonRedisSerializer`.
The Jackson 3 serializer can produce JSON output that differs from Jackson 2 output.
Continue using `GenericJackson2JsonRedisSerializer` to read existing values until those values have been migrated:

```java
RedisSerializer<Object> serializer = new GenericJackson2JsonRedisSerializer();
```

Use `jackson2CompatibilityMode()` to read and write hashes compatible with `Jackson2HashMapper`:

```java
JacksonHashMapper mapper = JacksonHashMapper.builder()
        .jackson2CompatibilityMode()
        .build();
```

Select `flatten()` or `hierarchical()` on the builder to match the existing hash representation.

<a id="upgrading.3-to-4.cache"></a>

### Redis Cache

`RedisCacheWriter` has been extended with `evict(…)` and `clear(…)` methods to support asynchronous cache eviction and clearing.

If the configured `RedisConnectionFactory` implements `ReactiveRedisConnectionFactory`, the default `RedisCacheWriter`
uses asynchronous behavior for `put(…)`, `evict(…)`, and `clear(…)`.
These operations may complete after the calling method returns.
Calls to `Cache.evictIfPresent(…)` or `Cache.invalidate(…)` enforce synchronous behavior by waiting for the operation to complete before returning.
To use synchronous behavior for all operations, call `immediateWrites()` on the `RedisCacheWriter` builder:

```java
RedisCacheWriter cacheWriter = RedisCacheWriter.create(connectionFactory,
        configurer -> configurer.immediateWrites());
```

| 3.x API | 4.x replacement |
| --- | --- |
| `RedisCacheConfiguration.getTtl()` | `RedisCacheConfiguration.getTtlFunction().getTimeToLive(key, value)` |
| `RedisCacheManager(RedisCacheWriter, RedisCacheConfiguration, Map, boolean)` | `RedisCacheManager(RedisCacheWriter, RedisCacheConfiguration, boolean, Map)` |

<a id="upgrading.3-to-4.string-redis-template"></a>

### StringRedisTemplate Connection Callbacks

`StringRedisTemplate` no longer exposes connections passed to callbacks as `StringRedisConnection`.
Use `StringRedisTemplate` operations instead:

```java
String value = stringRedisTemplate.opsForValue().get("key");
```

For remaining callbacks, use the binary `RedisConnection` API.

<a id="upgrading.3-to-4.lettuce-observability"></a>

### Lettuce Observability

Spring Data Redis 4.0 removes its Lettuce observability adapter in favor of Lettuce’s native Micrometer integration.
Use Lettuce’s `io.lettuce.core.tracing.LettuceObservationContext` instead of the removed `org.springframework.data.redis.connection.lettuce.observability.LettuceObservationContext`.
`RedisObservation` has no public replacement.
Replace `MicrometerTracingAdapter` with Lettuce’s `io.lettuce.core.tracing.MicrometerTracing`:

```java
MicrometerTracing tracing = new MicrometerTracing(observationRegistry, "Redis");

ClientResources clientResources = ClientResources.builder()
        .tracing(tracing)
        .build();
```

Configure the resulting `ClientResources` instance on `LettuceClientConfiguration`.
For advanced configuration options, see Lettuce’s [Micrometer Tracing documentation](https://redis.github.io/lettuce/advanced-usage/observability/#micrometer-tracing).

<a id="upgrading.3-to-4.nullability"></a>

### JSpecify Nullability

Spring Data Redis 4.0 uses [JSpecify](https://jspecify.dev/) nullability annotations to indicate API nullness.
Most packages are null-marked by default.
Certain packages and interfaces cannot declare a non-null default because return values depend on the connection state.
Methods invoked during a transaction or while pipelining return `null` until the transaction is executed or the pipeline is closed.
Affected types use `@NullUnmarked`, with `@NonNull` applied to arguments and return values that retain a non-null contract.

`RedisSerializer.serialize(Object)` must now return a non-null byte array.
Custom `RedisSerializer` implementations can use an empty byte array for a `null` value.
`RedisSerializer.deserialize(byte[])` can still return `null`.
See the Spring Framework documentation on [null-safety](https://docs.spring.io/spring-framework/reference/core/null-safety.html) for details.

<a id="upgrading.3-to-4.changed-api"></a>

### Other Removed and Changed APIs

| 3.x API | 4.x replacement or action |
| --- | --- |
| `new RedisClusterConfiguration(PropertySource)` | `RedisClusterConfiguration.of(PropertySource)` |
| `new RedisSentinelConfiguration(PropertySource)` | `RedisSentinelConfiguration.of(PropertySource)` |
| `BoundSetOperations.diff(…)` | `BoundSetOperations.difference(…)` |
| `BoundZSetOperations`, `ZSetOperations`, and `RedisZSet` overloads accepting `RedisZSetCommands.Range` | Use the overloads accepting `org.springframework.data.domain.Range<String>`. |
| `RedisPersistentEntity.hasExplictTimeToLiveProperty()` | `RedisPersistentEntity.hasExplicitTimeToLiveProperty()` |
| `Converters.toBoolean(Long)` returning `Boolean` | Recompile callers. The method now returns primitive `boolean`. |
| `Converters.toTimeMillis(…)` returning `Long` | Recompile callers. The methods now return primitive `long`. |
| `LettuceConverters.toBytesList(Collection<byte[]>)` | Use the input collection directly, or convert it to a `List` if required. |
| `ByteUtils.extractBytes(ByteBuffer)` | `ByteUtils.getBytes(ByteBuffer)` |
| `RedisAssertions` | Use `org.springframework.util.Assert` or an explicit check. |

| 3.x API | 4.x replacement or action |
| --- | --- |
| `new ScanIteration(long, Collection)` and `ScanIteration.getCursorId()` | Use `new ScanIteration(Cursor.CursorId, Collection)` and `ScanIteration.getId()`. |
| `ScanCursor.doOpen(long)` and `ScanCursor.isFinished(long)` | Override the variants accepting `Cursor.CursorId`. |
| `RedisPartTreeQuery` constructor accepting `QueryMethodEvaluationContextProvider` | Use the constructor accepting `ValueExpressionDelegate`. |
| `JedisClusterTopologyProvider.shouldUseCachedValue()` | Override `shouldUseCachedValue(JedisClusterTopology)`. |

<a id="upgrading.2-to-3"></a>

## Upgrading from 2.x to 3.x

<a id="upgrading.2-to-3.types"></a>

### Re-/moved Types

| Type | Replacement |
| --- | --- |
| o.s.d.redis.Version | o.s.d.util.Version |
| o.s.d.redis.VersionParser | - |
| o.s.d.redis.connection.RedisZSetCommands.Aggregate | o.s.d.redis.connection.zset.Aggregate |
| o.s.d.redis.connection.RedisZSetCommands.Tuple | o.s.d.redis.connection.zset.Tuple |
| o.s.d.redis.connection.RedisZSetCommands.Weights | o.s.d.redis.connection.zset.Weights |
| o.s.d.redis.connection.RedisZSetCommands.Range | o.s.d.domain.Range |
| o.s.d.redis.connection.RedisZSetCommands.Limit | o.s.d.redis.connection.Limit.java |
| o.s.d.redis.connection.jedis.JedisUtils | - |
| o.s.d.redis.connection.jedis.JedisVersionUtil | - |
| o.s.d.redis.core.convert.CustomConversions | o.s.d.convert.CustomConversions |

<a id="changed-methods-and-types"></a>

### Changed Methods and Types

| Type | Method | Replacement |
| --- | --- | --- |
| o.s.d.redis.core.Cursor | open | - |
| o.s.d.redis.core.RedisTemplate | execute | doWithKeys |
| o.s.d.redis.stream.StreamMessageListenerContainer | isAutoAck | isAutoAcknowledge |
| o.s.d.redis.stream.StreamMessageListenerContainer | autoAck | autoAcknowledge |

| Type | Method | Replacement |
| --- | --- | --- |
| o.s.d.redis.connection.ClusterCommandExecutionFailureException | getCauses | getSuppressed |
| o.s.d.redis.connection.RedisConnection | bgWriteAof | bgReWriteAof |
| o.s.d.redis.connection.RedisConnection | slaveOf | replicaOf |
| o.s.d.redis.connection.RedisConnection | slaveOfNoOne | replicaOfNoOne |
| o.s.d.redis.connection.ReactiveClusterCommands | clusterGetSlaves | clusterGetReplicas |
| o.s.d.redis.connection.ReactiveClusterCommands | clusterGetMasterSlaveMap | clusterGetMasterReplicaMap |
| o.s.d.redis.connection.ReactiveKeyCommands | getNewName | getNewKey |
| o.s.d.redis.connection.RedisClusterNode.Flag | SLAVE | REPLICA |
| o.s.d.redis.connection.RedisClusterNode.Builder | slaveOf | replicaOf |
| o.s.d.redis.connection.RedisNode | isSlave | isReplica |
| o.s.d.redis.connection.RedisSentinelCommands | slaves | replicas |
| o.s.d.redis.connection.RedisServer | getNumberSlaves | getNumberReplicas |
| o.s.d.redis.connection.RedisServerCommands | slaveOf | replicaOf |
| o.s.d.redis.core.ClusterOperations | getSlaves | getReplicas |
| o.s.d.redis.core.RedisOperations | slaveOf | replicaOf |

| Type | Method | Replacement |
| --- | --- | --- |
| o.s.d.redis.core.GeoOperations & BoundGeoOperations | geoAdd | add |
| o.s.d.redis.core.GeoOperations & BoundGeoOperations | geoDist | distance |
| o.s.d.redis.core.GeoOperations & BoundGeoOperations | geoHash | hash |
| o.s.d.redis.core.GeoOperations & BoundGeoOperations | geoPos | position |
| o.s.d.redis.core.GeoOperations & BoundGeoOperations | geoRadius | radius |
| o.s.d.redis.core.GeoOperations & BoundGeoOperations | geoRadiusByMember | radius |
| o.s.d.redis.core.GeoOperations & BoundGeoOperations | geoRemove | remove |

| Type | Method | Replacement |
| --- | --- | --- |
| o.s.d.redis.cache.RedisCacheConfiguration | prefixKeysWith | prefixCacheNameWith |
| o.s.d.redis.cache.RedisCacheConfiguration | getKeyPrefix | getKeyPrefixFor |

<a id="upgrading.2-to-3.jedis"></a>

### Jedis

Please read the Jedis [upgrading guide](https://github.com/redis/jedis/blob/v4.0.0/docs/3to4.md) which covers important driver changes.

| Type | Method | Replacement |
| --- | --- | --- |
| o.s.d.redis.connection.jedis.JedisConnectionFactory | getShardInfo | *can be obtained via JedisClientConfiguration* |
| o.s.d.redis.connection.jedis.JedisConnectionFactory | setShardInfo | *can be set via JedisClientConfiguration* |
| o.s.d.redis.connection.jedis.JedisConnectionFactory | createCluster | *now requires a `Connection` instead of `Jedis` instance* |
| o.s.d.redis.connection.jedis.JedisConverters |  | has package visibility now |
| o.s.d.redis.connection.jedis.JedisConverters | tuplesToTuples | - |
| o.s.d.redis.connection.jedis.JedisConverters | tuplesToTuples | - |
| o.s.d.redis.connection.jedis.JedisConverters | stringListToByteList | - |
| o.s.d.redis.connection.jedis.JedisConverters | stringSetToByteSet | - |
| o.s.d.redis.connection.jedis.JedisConverters | stringMapToByteMap | - |
| o.s.d.redis.connection.jedis.JedisConverters | tupleSetToTupleSet | - |
| o.s.d.redis.connection.jedis.JedisConverters | toTupleSet | - |
| o.s.d.redis.connection.jedis.JedisConverters | toDataAccessException | o.s.d.redis.connection.jedis.JedisExceptionConverter#convert |

<a id="upgrading.2-to-3.jedis.transactions"></a>

### Transactions / Pipelining

Pipelining and Transactions are now mutually exclusive.
The usage of server or connection commands in pipeline/transactions mode is no longer possible.

<a id="upgrading.2-to-3.lettuce"></a>

### Lettuce

<a id="upgrading.2-to-3.lettuce.pool"></a>

#### Lettuce Pool

`LettucePool` and its implementation `DefaultLettucePool` have been removed without replacement.
Please refer to the [driver documentation](https://lettuce.io/core/release/reference/index.html#_connection_pooling) for driver native pooling capabilities.
Methods accepting pooling parameters have been updated.
This effects methods on `LettuceConnectionFactory` and `LettuceConnection`.

<a id="upgrading.2-to-3.lettuce.authentication"></a>

#### Lettuce Authentication

`AuthenticatingRedisClient` has been removed without replacement.
Please refer to the [driver documentation](https://lettuce.io/core/release/reference/index.html#basic.redisuri) for `RedisURI` to set authentication data.
