---
title: "CDI Integration"
source: "ROOT:redis/redis-repositories/cdi-integration.adoc"
---

<a id="redis.repositories.cdi-integration"></a>

# CDI Integration

Instances of the repository interfaces are usually created by a container, for which Spring is the most natural choice when working with Spring Data.
Spring offers sophisticated for creating bean instances.
Spring Data Redis ships with a custom CDI extension that lets you use the repository abstraction in CDI environments.
The extension is part of the JAR, so, to activate it, drop the Spring Data Redis JAR into your classpath.

You can then set up the infrastructure by implementing a CDI Producer for the [`RedisConnectionFactory`](https://docs.spring.io/spring-data/redis/docs/3.3.5/api/org/springframework/data/redis/connection/RedisConnectionFactory.html) and [`RedisOperations`](https://docs.spring.io/spring-data/redis/docs/3.3.5/api/org/springframework/data/redis/core/RedisOperations.html), as shown in the following example:

```java
class RedisOperationsProducer {
  @Produces
  RedisConnectionFactory redisConnectionFactory() {

    LettuceConnectionFactory connectionFactory = new LettuceConnectionFactory(new RedisStandaloneConfiguration());
    connectionFactory.afterPropertiesSet();
	connectionFactory.start();

    return connectionFactory;
  }

  void disposeRedisConnectionFactory(@Disposes RedisConnectionFactory redisConnectionFactory) throws Exception {

    if (redisConnectionFactory instanceof DisposableBean) {
      ((DisposableBean) redisConnectionFactory).destroy();
    }
  }

  @Produces
  @ApplicationScoped
  RedisOperations<byte[], byte[]> redisOperationsProducer(RedisConnectionFactory redisConnectionFactory) {

    RedisTemplate<byte[], byte[]> template = new RedisTemplate<byte[], byte[]>();
    template.setConnectionFactory(redisConnectionFactory);
    template.afterPropertiesSet();

    return template;
  }

}
```

The necessary setup can vary, depending on your JavaEE environment.

The Spring Data Redis CDI extension picks up all available repositories as CDI beans and creates a proxy for a Spring Data repository whenever a bean of a repository type is requested by the container.
Thus, obtaining an instance of a Spring Data repository is a matter of declaring an `@Injected` property, as shown in the following example:

```java
class RepositoryClient {

  @Inject
  PersonRepository repository;

  public void businessMethod() {
    List<Person> people = repository.findAll();
  }
}
```

A Redis Repository requires [`RedisKeyValueAdapter`](https://docs.spring.io/spring-data/redis/docs/3.3.5/api/org/springframework/data/redis/core/RedisKeyValueAdapter.html) and [`RedisKeyValueTemplate`](https://docs.spring.io/spring-data/redis/docs/3.3.5/api/org/springframework/data/redis/core/RedisKeyValueTemplate.html) instances.
These beans are created and managed by the Spring Data CDI extension if no provided beans are found.
You can, however, supply your own beans to configure the specific properties of [`RedisKeyValueAdapter`](https://docs.spring.io/spring-data/redis/docs/3.3.5/api/org/springframework/data/redis/core/RedisKeyValueAdapter.html) and [`RedisKeyValueTemplate`](https://docs.spring.io/spring-data/redis/docs/3.3.5/api/org/springframework/data/redis/core/RedisKeyValueTemplate.html).
