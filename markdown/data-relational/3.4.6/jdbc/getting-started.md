---
title: "Getting Started"
source: "ROOT:jdbc/getting-started.adoc"
---

<a id="jdbc.getting-started"></a>

# Getting Started

An easy way to bootstrap setting up a working environment is to create a Spring-based project in [Spring Tools](https://spring.io/tools) or from [Spring Initializr](https://start.spring.io).

First, you need to set up a running database server.
Refer to your vendor documentation on how to configure your database for JDBC access.

<a id="requirements"></a>

## Requirements

Spring Data JDBC requires [Spring Framework](https://docs.spring.io/spring-framework/reference/6.2) 6.2.7 and above.

In terms of databases, Spring Data JDBC requires a [dialect](#jdbc.dialects) to abstract common SQL functionality over vendor-specific flavours.
Spring Data JDBC includes direct support for the following databases:

- DB2
- H2
- HSQLDB
- MariaDB
- Microsoft SQL Server
- MySQL
- Oracle
- Postgres

If you use a different database then your application won’t start up.
The [dialect](#jdbc.dialects) section contains further detail on how to proceed in such case.

<a id="jdbc.hello-world"></a>

## Hello World

To create a Spring project in STS:

1. Go to File → New → Spring Template Project → Simple Spring Utility Project, and press Yes when prompted.
Then enter a project and a package name, such as `org.spring.jdbc.example`.
1. Add the following to the `pom.xml` files `dependencies` element:

   ```xml
   <dependencies>

     <!-- other dependency elements omitted -->

     <dependency>
       <groupId>org.springframework.data</groupId>
       <artifactId>spring-data-jdbc</artifactId>
       <version>3.4.6</version>
     </dependency>

   </dependencies>
   ```
1. Change the version of Spring in the pom.xml to be

   ```xml
   <spring.version>6.2.7</spring.version>
   ```
1. Add the following location of the Spring Milestone repository for Maven to your `pom.xml` such that it is at the same level as your `<dependencies/>` element:

   ```xml
   <repositories>
     <repository>
       <id>spring-milestone</id>
       <name>Spring Maven MILESTONE Repository</name>
       <url>https://repo.spring.io/milestone</url>
     </repository>
   </repositories>
   ```

The repository is also [browseable here](https://repo.spring.io/milestone/org/springframework/data/).

<a id="jdbc.logging"></a>

### Logging

Spring Data JDBC does little to no logging on its own.
Instead, the mechanics of `JdbcTemplate` to issue SQL statements provide logging.
Thus, if you want to inspect what SQL statements are run, activate logging for Spring’s [`NamedParameterJdbcTemplate`](https://docs.spring.io/spring-framework/reference/6.2/data-access.html#jdbc-JdbcTemplate) or [MyBatis](https://www.mybatis.org/mybatis-3/logging.html).

You may also want to set the logging level to `DEBUG` to see some additional information.
To do so, edit the `application.properties` file to have the following content:

```
logging.level.org.springframework.jdbc=DEBUG
```

<a id="jdbc.examples-repo"></a>

## Examples Repository

There is a [GitHub repository with several examples](https://github.com/spring-projects/spring-data-examples) that you can download and play around with to get a feel for how the library works.

<a id="jdbc.java-config"></a>

## Configuration

The Spring Data JDBC repositories support can be activated by an annotation through Java configuration, as the following example shows:

#### Spring Data JDBC repositories using Java configuration

```java
@Configuration
@EnableJdbcRepositories                                                                // <1>
class ApplicationConfig extends AbstractJdbcConfiguration {                            // <2>

    @Bean
    DataSource dataSource() {                                                         // <3>

        EmbeddedDatabaseBuilder builder = new EmbeddedDatabaseBuilder();
        return builder.setType(EmbeddedDatabaseType.HSQL).build();
    }

    @Bean
    NamedParameterJdbcOperations namedParameterJdbcOperations(DataSource dataSource) { // <4>
        return new NamedParameterJdbcTemplate(dataSource);
    }

    @Bean
    TransactionManager transactionManager(DataSource dataSource) {                     // <5>
        return new DataSourceTransactionManager(dataSource);
    }
}
```

1. `@EnableJdbcRepositories` creates implementations for interfaces derived from `Repository`
1. [`AbstractJdbcConfiguration`](https://docs.spring.io/spring-data/relational/docs/3.4.6/api/org/springframework/data/jdbc/repository/config/AbstractJdbcConfiguration.html) provides various default beans required by Spring Data JDBC
1. Creates a `DataSource` connecting to a database.
This is required by the following two bean methods.
1. Creates the `NamedParameterJdbcOperations` used by Spring Data JDBC to access the database.
1. Spring Data JDBC utilizes the transaction management provided by Spring JDBC.

The configuration class in the preceding example sets up an embedded HSQL database by using the `EmbeddedDatabaseBuilder` API of `spring-jdbc`.
The `DataSource` is then used to set up `NamedParameterJdbcOperations` and a `TransactionManager`.
We finally activate Spring Data JDBC repositories by using the `@EnableJdbcRepositories`.
If no base package is configured, it uses the package in which the configuration class resides.
Extending [`AbstractJdbcConfiguration`](https://docs.spring.io/spring-data/relational/docs/3.4.6/api/org/springframework/data/jdbc/repository/config/AbstractJdbcConfiguration.html) ensures various beans get registered.
Overwriting its methods can be used to customize the setup (see below).

This configuration can be further simplified by using Spring Boot.
With Spring Boot a `DataSource` is sufficient once the starter `spring-boot-starter-data-jdbc` is included in the dependencies.
Everything else is done by Spring Boot.

There are a couple of things one might want to customize in this setup.

<a id="jdbc.dialects"></a>

## Dialects

Spring Data JDBC uses implementations of the interface `Dialect` to encapsulate behavior that is specific to a database or its JDBC driver.
By default, the [`AbstractJdbcConfiguration`](https://docs.spring.io/spring-data/relational/docs/3.4.6/api/org/springframework/data/jdbc/repository/config/AbstractJdbcConfiguration.html) attempts to determine the dialect from the database configuration by obtaining a connection and registering the correct `Dialect`.
You override `AbstractJdbcConfiguration.jdbcDialect(NamedParameterJdbcOperations)` to customize dialect selection.

If you use a database for which no dialect is available, then your application won’t start up.
In that case, you’ll have to ask your vendor to provide a `Dialect` implementation.
Alternatively, you can implement your own `Dialect`.

> [!TIP]
> Dialects are resolved by [`DialectResolver`](https://docs.spring.io/spring-data/relational/docs/3.4.6/api/org/springframework/data/jdbc/repository/config/DialectResolver.html) from a `JdbcOperations` instance, typically by inspecting `Connection.getMetaData()`.
> + You can let Spring auto-discover your [`JdbcDialect`](https://docs.spring.io/spring-data/relational/docs/3.4.6/api/org/springframework/data/jdbc/core/dialect/JdbcDialect.html) by registering a class that implements `org.springframework.data.jdbc.repository.config.DialectResolver$JdbcDialectProvider` through `META-INF/spring.factories`.
> `DialectResolver` discovers dialect provider implementations from the class path using Spring’s `SpringFactoriesLoader`.
> To do so:
>
> 1. Implement your own `Dialect`.
> 1. Implement a `JdbcDialectProvider` returning the `Dialect`.
> 1. Register the provider by creating a `spring.factories`  resource under `META-INF` and perform the registration by adding a line
>
> `org.springframework.data.jdbc.repository.config.DialectResolver$JdbcDialectProvider=<fully qualified name of your JdbcDialectProvider>`
