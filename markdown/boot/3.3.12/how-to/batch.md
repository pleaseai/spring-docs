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

By default, batch applications require a [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) to store job details.
Spring Batch expects a single [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) by default.
To have it use a [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) other than the application’s main [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html), declare a [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) bean, annotating its [`@Bean`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Bean.html) method with [`@BatchDataSource`](https://docs.spring.io/spring-boot/3.3.12/api/java/org/springframework/boot/autoconfigure/batch/BatchDataSource.html).
If you do so and want two data sources, remember to mark the other one [`@Primary`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Primary.html).
To take greater control, add [`@EnableBatchProcessing`](https://docs.spring.io/spring-batch/docs/5.1.x/api/org/springframework/batch/core/configuration/annotation/EnableBatchProcessing.html) to one of your [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Configuration.html) classes or extend [`DefaultBatchConfiguration`](https://docs.spring.io/spring-batch/docs/5.1.x/api/org/springframework/batch/core/configuration/support/DefaultBatchConfiguration.html).
See the API documentation of [`@EnableBatchProcessing`](https://docs.spring.io/spring-batch/docs/5.1.x/api/org/springframework/batch/core/configuration/annotation/EnableBatchProcessing.html)
and [`DefaultBatchConfiguration`](https://docs.spring.io/spring-batch/docs/5.1.x/api/org/springframework/batch/core/configuration/support/DefaultBatchConfiguration.html) for more details.

For more info about Spring Batch, see the [Spring Batch project page](https://spring.io/projects/spring-batch).

<a id="howto.batch.specifying-a-transaction-manager"></a>

## Specifying a Batch Transaction Manager

Similar to [Specifying a Batch Data Source](#howto.batch.specifying-a-data-source), you can define a [`PlatformTransactionManager`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/transaction/PlatformTransactionManager.html) for use in the batch processing by marking it as [`@BatchTransactionManager`](https://docs.spring.io/spring-boot/3.3.12/api/java/org/springframework/boot/autoconfigure/batch/BatchTransactionManager.html).
If you do so and want two transaction managers, remember to mark the other one as [`@Primary`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/annotation/Primary.html).

<a id="howto.batch.running-jobs-on-startup"></a>

## Running Spring Batch Jobs on Startup

Spring Batch auto-configuration is enabled by adding `spring-boot-starter-batch` to your application’s classpath.

If a single [`Job`](https://docs.spring.io/spring-batch/docs/5.1.x/api/org/springframework/batch/core/Job.html) bean is found in the application context, it is executed on startup (see [`JobLauncherApplicationRunner`](https://docs.spring.io/spring-boot/3.3.12/api/java/org/springframework/boot/autoconfigure/batch/JobLauncherApplicationRunner.html) for details).
If multiple [`Job`](https://docs.spring.io/spring-batch/docs/5.1.x/api/org/springframework/batch/core/Job.html) beans are found, the job that should be executed must be specified using `spring.batch.job.name`.

To disable running a [`Job`](https://docs.spring.io/spring-batch/docs/5.1.x/api/org/springframework/batch/core/Job.html) found in the application context, set the `spring.batch.job.enabled` to `false`.

See [`BatchAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.3.12/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/batch/BatchAutoConfiguration.java) for more details.

<a id="howto.batch.running-from-the-command-line"></a>

## Running From the Command Line

Spring Boot converts any command line argument starting with `--` to a property to add to the [`Environment`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/core/env/Environment.html), see [accessing command line properties](../reference/features/external-config.md#features.external-config.command-line-args).
This should not be used to pass arguments to batch jobs.
To specify batch arguments on the command line, use the regular format (that is without `--`), as shown in the following example:

```shell
$ java -jar myapp.jar someParameter=someValue anotherParameter=anotherValue
```

If you specify a property of the [`Environment`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/core/env/Environment.html) on the command line, it is ignored by the job.
Consider the following command:

```shell
$ java -jar myapp.jar --server.port=7070 someParameter=someValue
```

This provides only one argument to the batch job: `someParameter=someValue`.

<a id="howto.batch.restarting-a-failed-job"></a>

## Restarting a Stopped or Failed Job

To restart a failed [`Job`](https://docs.spring.io/spring-batch/docs/5.1.x/api/org/springframework/batch/core/Job.html), all parameters (identifying and non-identifying) must be re-specified on the command line.
Non-identifying parameters are **not** copied from the previous execution.
This allows them to be modified or removed.

> [!NOTE]
> When you’re using a custom [`JobParametersIncrementer`](https://docs.spring.io/spring-batch/docs/5.1.x/api/org/springframework/batch/core/JobParametersIncrementer.html), you have to gather all parameters managed by the incrementer to restart a failed execution.

<a id="howto.batch.storing-job-repository"></a>

## Storing the Job Repository

Spring Batch requires a data store for the [`Job`](https://docs.spring.io/spring-batch/docs/5.1.x/api/org/springframework/batch/core/Job.html) repository.
If you use Spring Boot, you must use an actual database.
Note that it can be an in-memory database, see [Configuring a Job Repository](https://docs.spring.io/spring-batch/reference/5.1/job.html#configuringJobRepository).
