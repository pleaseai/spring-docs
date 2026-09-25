---
title: "Connection Modes"
source: "ROOT:redis/connection-modes.adoc"
---

<a id="configuration"></a>

# Connection Modes

Redis can be operated in various setups.
Each mode of operation requires specific configuration that is explained in the following sections.

<a id="redis:standalone"></a>

## Redis Standalone

The easiest way to get started is by using Redis Standalone with a single Redis server,

Configure [`LettuceConnectionFactory`](https://docs.spring.io/spring-data/redis/docs/3.4.2/api/org/springframework/data/redis/connection/lettuce/LettuceConnectionFactory.html) or [`JedisConnectionFactory`](https://docs.spring.io/spring-data/redis/docs/3.4.2/api/org/springframework/data/redis/connection/jedis/JedisConnectionFactory.html), as shown in the following example:

```java
@Configuration
class RedisStandaloneConfiguration {

  /**
   * Lettuce
   */
  @Bean
  public RedisConnectionFactory lettuceConnectionFactory() {
    return new LettuceConnectionFactory(new RedisStandaloneConfiguration("server", 6379));
  }

  /**
   * Jedis
   */
  @Bean
  public RedisConnectionFactory jedisConnectionFactory() {
    return new JedisConnectionFactory(new RedisStandaloneConfiguration("server", 6379));
  }
}
```

<a id="redis:write-to-master-read-from-replica"></a>

## Write to Master, Read from Replica

The Redis Master/Replica setup — without automatic failover (for automatic failover see: [Sentinel](#redis:sentinel)) — not only allows data to be safely stored at more nodes.
It also allows, by using [Lettuce](drivers.md#redis:connectors:lettuce), reading data from replicas while pushing writes to the master.
You can set the read/write strategy to be used by using `LettuceClientConfiguration`, as shown in the following example:

```java
@Configuration
class WriteToMasterReadFromReplicaConfiguration {

  @Bean
  public LettuceConnectionFactory redisConnectionFactory() {

    LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
      .readFrom(REPLICA_PREFERRED)
      .build();

    RedisStandaloneConfiguration serverConfig = new RedisStandaloneConfiguration("server", 6379);

    return new LettuceConnectionFactory(serverConfig, clientConfig);
  }
}
```

> [!TIP]
> For environments reporting non-public addresses through the `INFO` command (for example, when using AWS), use [`RedisStaticMasterReplicaConfiguration`](https://docs.spring.io/spring-data/redis/docs/3.4.2/api/org/springframework/data/redis/connection/RedisStaticMasterReplicaConfiguration.html) instead of [`RedisStandaloneConfiguration`](https://docs.spring.io/spring-data/redis/docs/3.4.2/api/org/springframework/data/redis/connection/RedisStandaloneConfiguration.html). Please note that `RedisStaticMasterReplicaConfiguration` does not support Pub/Sub because of missing Pub/Sub message propagation across individual servers.

<a id="redis:sentinel"></a>

## Redis Sentinel

For dealing with high-availability Redis, Spring Data Redis has support for [Redis Sentinel](https://redis.io/topics/sentinel), using [`RedisSentinelConfiguration`](https://docs.spring.io/spring-data/redis/docs/3.4.2/api/org/springframework/data/redis/connection/RedisSentinelConfiguration.html), as shown in the following example:

```java
/**
 * Lettuce
 */
@Bean
public RedisConnectionFactory lettuceConnectionFactory() {
  RedisSentinelConfiguration sentinelConfig = new RedisSentinelConfiguration()
  .master("mymaster")
  .sentinel("127.0.0.1", 26379)
  .sentinel("127.0.0.1", 26380);
  return new LettuceConnectionFactory(sentinelConfig);
}

/**
 * Jedis
 */
@Bean
public RedisConnectionFactory jedisConnectionFactory() {
  RedisSentinelConfiguration sentinelConfig = new RedisSentinelConfiguration()
  .master("mymaster")
  .sentinel("127.0.0.1", 26379)
  .sentinel("127.0.0.1", 26380);
  return new JedisConnectionFactory(sentinelConfig);
}
```

> [!TIP]
> `RedisSentinelConfiguration` can also be defined through `RedisSentinelConfiguration.of(PropertySource)`, which lets you pick up the following properties:
>
> - `spring.redis.sentinel.master`: name of the master node.
> - `spring.redis.sentinel.nodes`: Comma delimited list of host:port pairs.
> - `spring.redis.sentinel.username`: The username to apply when authenticating with Redis Sentinel (requires Redis 6)
> - `spring.redis.sentinel.password`: The password to apply when authenticating with Redis Sentinel
> - `spring.redis.sentinel.dataNode.username`: The username to apply when authenticating with Redis Data Node
> - `spring.redis.sentinel.dataNode.password`: The password to apply when authenticating with Redis Data Node
> - `spring.redis.sentinel.dataNode.database`: The database index to apply when authenticating with Redis Data Node

Sometimes, direct interaction with one of the Sentinels is required. Using `RedisConnectionFactory.getSentinelConnection()` or `RedisConnection.getSentinelCommands()` gives you access to the first active Sentinel configured.

<a id="cluster.enable"></a>

## Redis Cluster

[Cluster support](cluster.md) is based on the same building blocks as non-clustered communication. [`RedisClusterConnection`](https://docs.spring.io/spring-data/redis/docs/3.4.2/api/org/springframework/data/redis/connection/RedisClusterConnection.html), an extension to `RedisConnection`, handles the communication with the Redis Cluster and translates errors into the Spring DAO exception hierarchy.
`RedisClusterConnection` instances are created with the `RedisConnectionFactory`, which has to be set up with the associated [`RedisClusterConfiguration`](https://docs.spring.io/spring-data/redis/docs/3.4.2/api/org/springframework/data/redis/connection/RedisClusterConfiguration.html), as shown in the following example:

```java
@Component
@ConfigurationProperties(prefix = "spring.redis.cluster")
public class ClusterConfigurationProperties {

    /*
     * spring.redis.cluster.nodes[0] = 127.0.0.1:7379
     * spring.redis.cluster.nodes[1] = 127.0.0.1:7380
     * ...
     */
    List<String> nodes;

    /**
     * Get initial collection of known cluster nodes in format {@code host:port}.
     *
     * @return
     */
    public List<String> getNodes() {
        return nodes;
    }

    public void setNodes(List<String> nodes) {
        this.nodes = nodes;
    }
}

@Configuration
public class AppConfig {

    /**
     * Type safe representation of application.properties
     */
    @Autowired ClusterConfigurationProperties clusterProperties;

    public @Bean RedisConnectionFactory connectionFactory() {

        return new LettuceConnectionFactory(
            new RedisClusterConfiguration(clusterProperties.getNodes()));
    }
}
```

> [!TIP]
> `RedisClusterConfiguration` can also be defined through `RedisClusterConfiguration.of(PropertySource)`, which lets you pick up the following properties:
>
> - `spring.redis.cluster.nodes`: Comma-delimited list of host:port pairs.
> - `spring.redis.cluster.max-redirects`: Number of allowed cluster redirections.

> [!NOTE]
> The initial configuration points driver libraries to an initial set of cluster nodes. Changes resulting from live cluster reconfiguration are kept only in the native driver and are not written back to the configuration.
