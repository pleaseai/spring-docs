---
title: "Batch Applications"
source: "how-to:batch.adoc"
---

<a id="howto.batch"></a>

# Batch Applications

A number of questions often arise when people use Spring Batch from within a Spring Boot application.
This section addresses those questions.

<a id="howto.batch.specifying-a-data-source"></a>

## Specifying a Batch Data Source

Batch applications that store job details in an SQL database require a [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) bean.
A single [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) bean is required by default.
To have Spring Batch use a [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) other than the application’s main [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html), declare a [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) bean, annotating its [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) method with [`@BatchDataSource`](https://docs.spring.io/spring-boot/4.0.7/api/java/org/springframework/boot/batch/jdbc/autoconfigure/BatchDataSource.html).
If you do so and want two data sources (for example by retaining the main auto-configured [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html)), set the `defaultCandidate` attribute of the [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) annotation to `false`.

<a id="howto.batch.specifying-a-transaction-manager"></a>

## Specifying a Batch Transaction Manager

Similar to [Specifying a Batch Data Source](#howto.batch.specifying-a-data-source), you can define a [`PlatformTransactionManager`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/transaction/PlatformTransactionManager.html) for use in batch processing by annotating its [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) method with [`@BatchTransactionManager`](https://docs.spring.io/spring-boot/4.0.7/api/java/org/springframework/boot/batch/autoconfigure/BatchTransactionManager.html).
If you do so and want two transaction managers (for example by retaining the auto-configured [`PlatformTransactionManager`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/transaction/PlatformTransactionManager.html)), set the `defaultCandidate` attribute of the [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) annotation to `false`.

<a id="howto.batch.specifying-a-task-executor"></a>

## Specifying a Batch Task Executor

Similar to [Specifying a Batch Data Source](#howto.batch.specifying-a-data-source), you can define a [`TaskExecutor`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/core/task/TaskExecutor.html) for use in batch processing by annotating its [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) method with [`@BatchTaskExecutor`](https://docs.spring.io/spring-boot/4.0.7/api/java/org/springframework/boot/batch/autoconfigure/BatchTaskExecutor.html).
If you do so and want two task executors (for example by retaining the auto-configured [`TaskExecutor`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/core/task/TaskExecutor.html)), set the `defaultCandidate` attribute of the [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) annotation to `false`.

<a id="howto.batch.running-from-the-command-line"></a>

## Running From the Command Line

Spring Boot converts any command line argument starting with `--` to a property to add to the [`Environment`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/core/env/Environment.html), see [accessing command line properties](../reference/features/external-config.md#features.external-config.command-line-args).
This should not be used to pass arguments to batch jobs.
To specify batch arguments on the command line, use the regular format (that is without `--`), as shown in the following example:

```shell
$ java -jar myapp.jar someParameter=someValue anotherParameter=anotherValue
```

If you specify a property of the [`Environment`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/core/env/Environment.html) on the command line, it is ignored by the job.
Consider the following command:

```shell
$ java -jar myapp.jar --server.port=7070 someParameter=someValue
```

This provides only one argument to the batch job: `someParameter=someValue`.

<a id="howto.batch.restarting-a-failed-job"></a>

## Restarting a Stopped or Failed Job

To restart a failed [`Job`](https://docs.spring.io/spring-batch/docs/6.0.x/api/org/springframework/batch/core/job/Job.html), all parameters (identifying and non-identifying) must be re-specified on the command line.
Non-identifying parameters are **not** copied from the previous execution.
This allows them to be modified or removed.

> [!NOTE]
> When you’re using a custom [`JobParametersIncrementer`](https://docs.spring.io/spring-batch/docs/6.0.x/api/org/springframework/batch/core/job/parameters/JobParametersIncrementer.html), you have to gather all parameters managed by the incrementer to restart a failed execution.
