---
title: "Task Execution and Scheduling"
source: "reference:features/task-execution-and-scheduling.adoc"
---

<a id="features.task-execution-and-scheduling"></a>

# Task Execution and Scheduling

In the absence of an [`Executor`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/Executor.html) bean in the context, Spring Boot auto-configures an [`AsyncTaskExecutor`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/task/AsyncTaskExecutor.html).
When virtual threads are enabled (using Java 21+ and `spring.threads.virtual.enabled` set to `true`) this will be a [`SimpleAsyncTaskExecutor`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/task/SimpleAsyncTaskExecutor.html) that uses virtual threads.
Otherwise, it will be a [`ThreadPoolTaskExecutor`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/scheduling/concurrent/ThreadPoolTaskExecutor.html) with sensible defaults.
In either case, the auto-configured executor will be automatically used for:

- asynchronous task execution (`@EnableAsync`)
- Spring for GraphQL’s asynchronous handling of [`Callable`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/Callable.html) return values from controller methods
- Spring MVC’s asynchronous request processing
- Spring WebFlux’s blocking execution support

> [!TIP]
> If you have defined a custom [`Executor`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/Executor.html) in the context, both regular task execution (that is [`@EnableAsync`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/scheduling/annotation/EnableAsync.html)) and Spring for GraphQL will use it.
> However, the Spring MVC and Spring WebFlux support will only use it if it is an [`AsyncTaskExecutor`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/task/AsyncTaskExecutor.html) implementation (named `applicationTaskExecutor`).
> Depending on your target arrangement, you could change your [`Executor`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/Executor.html) into an [`AsyncTaskExecutor`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/task/AsyncTaskExecutor.html) or define both an [`AsyncTaskExecutor`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/task/AsyncTaskExecutor.html) and an [`AsyncConfigurer`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/scheduling/annotation/AsyncConfigurer.html) wrapping your custom [`Executor`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/Executor.html).
>
> The auto-configured [`ThreadPoolTaskExecutorBuilder`](https://docs.spring.io/spring-boot/3.4.13/api/java/org/springframework/boot/task/ThreadPoolTaskExecutorBuilder.html) allows you to easily create instances that reproduce what the auto-configuration does by default.

> [!NOTE]
> If multiple [`Executor`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/Executor.html) beans are defined, regular task execution fallbacks to a bean named `taskExecutor`.
> GraphQL, Spring MVC and Spring WebFlux support fallback to a bean named `applicationTaskExecutor`.

When a [`ThreadPoolTaskExecutor`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/scheduling/concurrent/ThreadPoolTaskExecutor.html) is auto-configured, the thread pool uses 8 core threads that can grow and shrink according to the load.
Those default settings can be fine-tuned using the `spring.task.execution` namespace, as shown in the following example:

#### Properties

```properties
spring.task.execution.pool.max-size=16
spring.task.execution.pool.queue-capacity=100
spring.task.execution.pool.keep-alive=10s
```

#### YAML

```yaml
spring:
  task:
    execution:
      pool:
        max-size: 16
        queue-capacity: 100
        keep-alive: "10s"
```

This changes the thread pool to use a bounded queue so that when the queue is full (100 tasks), the thread pool increases to maximum 16 threads.
Shrinking of the pool is more aggressive as threads are reclaimed when they are idle for 10 seconds (rather than 60 seconds by default).

A scheduler can also be auto-configured if it needs to be associated with scheduled task execution (using [`@EnableScheduling`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/scheduling/annotation/EnableScheduling.html) for instance).

If virtual threads are enabled (using Java 21+ and `spring.threads.virtual.enabled` set to `true`) this will be a [`SimpleAsyncTaskScheduler`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/scheduling/concurrent/SimpleAsyncTaskScheduler.html) that uses virtual threads.
This [`SimpleAsyncTaskScheduler`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/scheduling/concurrent/SimpleAsyncTaskScheduler.html) will ignore any pooling related properties.

If virtual threads are not enabled, it will be a [`ThreadPoolTaskScheduler`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/scheduling/concurrent/ThreadPoolTaskScheduler.html) with sensible defaults.
The [`ThreadPoolTaskScheduler`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/scheduling/concurrent/ThreadPoolTaskScheduler.html) uses one thread by default and its settings can be fine-tuned using the `spring.task.scheduling` namespace, as shown in the following example:

#### Properties

```properties
spring.task.scheduling.thread-name-prefix=scheduling-
spring.task.scheduling.pool.size=2
```

#### YAML

```yaml
spring:
  task:
    scheduling:
      thread-name-prefix: "scheduling-"
      pool:
        size: 2
```

A [`ThreadPoolTaskExecutorBuilder`](https://docs.spring.io/spring-boot/3.4.13/api/java/org/springframework/boot/task/ThreadPoolTaskExecutorBuilder.html) bean, a [`SimpleAsyncTaskExecutorBuilder`](https://docs.spring.io/spring-boot/3.4.13/api/java/org/springframework/boot/task/SimpleAsyncTaskExecutorBuilder.html) bean, a [`ThreadPoolTaskSchedulerBuilder`](https://docs.spring.io/spring-boot/3.4.13/api/java/org/springframework/boot/task/ThreadPoolTaskSchedulerBuilder.html) bean and a [`SimpleAsyncTaskSchedulerBuilder`](https://docs.spring.io/spring-boot/3.4.13/api/java/org/springframework/boot/task/SimpleAsyncTaskSchedulerBuilder.html) are made available in the context if a custom executor or scheduler needs to be created.
The [`SimpleAsyncTaskExecutorBuilder`](https://docs.spring.io/spring-boot/3.4.13/api/java/org/springframework/boot/task/SimpleAsyncTaskExecutorBuilder.html) and [`SimpleAsyncTaskSchedulerBuilder`](https://docs.spring.io/spring-boot/3.4.13/api/java/org/springframework/boot/task/SimpleAsyncTaskSchedulerBuilder.html) beans are auto-configured to use virtual threads if they are enabled (using Java 21+ and `spring.threads.virtual.enabled` set to `true`).
