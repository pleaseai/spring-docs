---
title: "Getting Started"
source: "ROOT:redis/getting-started.adoc"
---

<a id="redis.getting-started"></a>

# Getting Started

An easy way to bootstrap setting up a working environment is to create a Spring-based project via [start.spring.io](https://start.spring.io/#!type=maven-project&dependencies=data-redis) or create a Spring project in [Spring Tools](https://spring.io/tools).

<a id="redis.examples-repo"></a>

## Examples Repository

The GitHub [spring-data-examples repository](https://github.com/spring-projects/spring-data-examples) hosts several examples that you can download and play around with to get a feel for how the library works.

<a id="redis.hello-world"></a>

## Hello World

First, you need to set up a running Redis server.
Spring Data Redis requires Redis 2.6 or above and Spring Data Redis integrates with [Lettuce](https://github.com/lettuce-io/lettuce-core) and [Jedis](https://github.com/redis/jedis), two popular open-source Java libraries for Redis.

Now you can create a simple Java application that stores and reads a value to and from Redis.

Create the main application to run, as the following example shows:

#### Imperative

```java
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

public class RedisApplication {

	private static final Log LOG = LogFactory.getLog(RedisApplication.class);

	public static void main(String[] args) {

		LettuceConnectionFactory connectionFactory = new LettuceConnectionFactory();
		connectionFactory.afterPropertiesSet();

		RedisTemplate<String, String> template = new RedisTemplate<>();
		template.setConnectionFactory(connectionFactory);
		template.setDefaultSerializer(StringRedisSerializer.UTF_8);
		template.afterPropertiesSet();

		template.opsForValue().set("foo", "bar");

		LOG.info("Value at foo:" + template.opsForValue().get("foo"));

		connectionFactory.destroy();
	}
}
```

#### Reactive

```java
import reactor.core.publisher.Mono;

import java.time.Duration;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializationContext;

public class ReactiveRedisApplication {

	private static final Log LOG = LogFactory.getLog(ReactiveRedisApplication.class);

	public static void main(String[] args) {

		LettuceConnectionFactory connectionFactory = new LettuceConnectionFactory();
		connectionFactory.afterPropertiesSet();

		ReactiveRedisTemplate<String, String> template = new ReactiveRedisTemplate<>(connectionFactory,
				RedisSerializationContext.string());

		Mono<Boolean> set = template.opsForValue().set("foo", "bar");
		set.block(Duration.ofSeconds(10));

		LOG.info("Value at foo:" + template.opsForValue().get("foo").block(Duration.ofSeconds(10)));

		connectionFactory.destroy();
	}
}
```

Even in this simple example, there are a few notable things to point out:

- You can create an instance of [`RedisTemplate`](https://docs.spring.io/spring-data/redis/docs/3.4.9/api/org/springframework/data/redis/core/RedisTemplate.html) (or [`ReactiveRedisTemplate`](https://docs.spring.io/spring-data/redis/docs/3.4.9/api/org/springframework/data/redis/core/ReactiveRedisTemplate.html)for reactive usage) with a [`RedisConnectionFactory`](https://docs.spring.io/spring-data/redis/docs/3.4.9/api/org/springframework/data/redis/connection/RedisConnectionFactory.html). Connection factories are an abstraction on top of the supported drivers.
- There’s no single way to use Redis as it comes with support for a wide range of data structures such as plain keys ("strings"), lists, sets, sorted sets, streams, hashes and so on.
