---
title: "Spring Batch"
source: "reference:io/spring-batch.adoc"
---

<a id="io.spring-batch"></a>

# Spring Batch

Spring Boot offers several conveniences for working with [Spring Batch](https://spring.io/projects/spring-batch), including running a Job on startup.

If Spring Batch is available on your classpath, it is initialized through the [`@EnableBatchProcessing`](https://docs.spring.io/spring-batch/docs/6.0.x/api/org/springframework/batch/core/configuration/annotation/EnableBatchProcessing.html) annotation.

When building a batch application, the following stores can be auto-configured:

- In-memory
- JDBC

Each store has specific additional settings.
For instance, it is possible to customize the tables prefix for the JDBC store, as shown in the following example:

#### Properties

```properties
spring.batch.jdbc.table-prefix=CUSTOM_
```

#### YAML

```yaml
spring:
  batch:
    jdbc:
      table-prefix: "CUSTOM_"
```

You can take control over Spring Batch’s configuration using [`@EnableBatchProcessing`](https://docs.spring.io/spring-batch/docs/6.0.x/api/org/springframework/batch/core/configuration/annotation/EnableBatchProcessing.html).
This will cause the auto-configuration to back off.
Spring Batch can then be configured using the `@Enable*JobRepository` annotation’s attributes rather than the previously described configuration properties.

<a id="io.spring-batch.running-jobs-on-startup"></a>

## Running Spring Batch Jobs on Startup

When Spring Boot auto-configures Spring Batch, and if a single [`Job`](https://docs.spring.io/spring-batch/docs/6.0.x/api/org/springframework/batch/core/Job.html) bean is found in the application context, it is executed on startup (see [`JobLauncherApplicationRunner`](https://docs.spring.io/spring-boot/4.0.0/api/java/org/springframework/boot/batch/autoconfigure/JobLauncherApplicationRunner.html) for details).
If multiple [`Job`](https://docs.spring.io/spring-batch/docs/6.0.x/api/org/springframework/batch/core/Job.html) beans are found, the job that should be executed must be specified using `spring.batch.job.name`.

You can disable running a [`Job`](https://docs.spring.io/spring-batch/docs/6.0.x/api/org/springframework/batch/core/Job.html) found in the application context, as shown in the following example:

#### Properties

```properties
spring.batch.job.enabled=false
```

#### YAML

```yaml
spring:
  batch:
    job:
      enabled: false
```

See [`BatchAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v4.0.0/module/spring-boot-batch/src/main/java/org/springframework/boot/batch/autoconfigure/BatchAutoConfiguration.java) and  [`BatchJdbcAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v4.0.0/module/spring-boot-batch-jdbc/src/main/java/org/springframework/boot/batch/jdbc/autoconfigure/BatchJdbcAutoConfiguration.java) for more details.
