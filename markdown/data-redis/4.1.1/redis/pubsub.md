---
title: "Pub/Sub Messaging"
source: "ROOT:redis/pubsub.adoc"
---

<a id="pubsub"></a>

# Pub/Sub Messaging

Spring Data provides dedicated messaging integration for Redis, similar in spirit to the JMS support in Spring Framework.

Redis messaging can be roughly divided into two areas of functionality:

- [Publication or sending messages](pubsub-sending.md)
- [Subscription or receiving messages](pubsub-receiving.md)

This is an example of the pattern often referred to as Publish/Subscribe (Pub/Sub).
On the sending side, you can publish messages through the low-level `RedisConnection` contract, through
[`RedisOperations`](https://docs.spring.io/spring-data/redis/docs/4.1.1/api/org/springframework/data/redis/core/RedisOperations.html) (typically backed by [`RedisTemplate`](https://docs.spring.io/spring-data/redis/docs/4.1.1/api/org/springframework/data/redis/core/RedisTemplate.html)), or through the message-oriented
[`RedisMessageSendingTemplate`](https://docs.spring.io/spring-data/redis/docs/4.1.1/api/org/springframework/data/redis/messaging/RedisMessageSendingTemplate.html).
For asynchronous reception similar to Java EE’s message-driven bean style, Spring Data provides a dedicated message listener container that is used to create Message-Driven POJOs (MDPs) and, for synchronous reception, the `RedisConnection` contract.

The `org.springframework.data.redis.connection` and `org.springframework.data.redis.listener` packages provide the core functionality for Redis messaging.

The `org.springframework.data.redis.annotation` package provides the necessary infrastructure to support annotation-driven listener endpoints by using `@RedisListener`.

The `org.springframework.data.redis.config` package provides the parser implementation for the `redis` namespace as well as the Java config support to configure listener endpoints.
