---
title: "Migration Guides"
source: "ROOT:upgrading.adoc"
---

<a id="redis.upgrading"></a>

# Migration Guides

This section contains details about migration steps, deprecations, and removals.

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
