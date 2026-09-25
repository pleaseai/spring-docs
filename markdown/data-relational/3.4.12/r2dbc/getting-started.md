---
title: "Getting Started"
source: "ROOT:r2dbc/getting-started.adoc"
---

<a id="r2dbc.getting-started"></a>

# Getting Started

An easy way to bootstrap setting up a working environment is to create a Spring-based project in [Spring Tools](https://spring.io/tools) or from [Spring Initializr](https://start.spring.io).

First, you need to set up a running database server.
Refer to your vendor documentation on how to configure your database for R2DBC access.

<a id="requirements"></a>

## Requirements

Spring Data R2DBC requires [Spring Framework](https://docs.spring.io/spring-framework/reference/6.2) 6.2.13 and above.

In terms of databases, Spring Data R2DBC requires a [driver](#r2dbc.drivers) to abstract common SQL functionality over vendor-specific flavours.
Spring Data R2DBC includes direct support for the following databases:

- [H2](https://github.com/r2dbc/r2dbc-h2) (`io.r2dbc:r2dbc-h2`)
- [MariaDB](https://github.com/mariadb-corporation/mariadb-connector-r2dbc) (`org.mariadb:r2dbc-mariadb`)
- [Microsoft SQL Server](https://github.com/r2dbc/r2dbc-mssql) (`io.r2dbc:r2dbc-mssql`)
- [MySQL](https://github.com/asyncer-io/r2dbc-mysql) (`io.asyncer:r2dbc-mysql`)
- [jasync-sql MySQL](https://github.com/jasync-sql/jasync-sql) (`com.github.jasync-sql:jasync-r2dbc-mysql`)
- [Postgres](https://github.com/r2dbc/r2dbc-postgresql) (`org.postgresql:r2dbc-postgresql`)
- [Oracle](https://github.com/oracle/oracle-r2dbc) (`com.oracle.database.r2dbc:oracle-r2dbc`)

If you use a different database then your application won’t start up.
The [dialect](#r2dbc.dialects) section contains further detail on how to proceed in such case.

<a id="r2dbc.hello-world"></a>

## Hello World

To create a Spring project in STS:

1. Go to File → New → Spring Template Project → Simple Spring Utility Project, and press Yes when prompted.
Then enter a project and a package name, such as `org.spring.r2dbc.example`.
1. Add the following to the `pom.xml` files `dependencies` element:
1. Add the following to the pom.xml files `dependencies` element:

   ```xml
   <dependencies>

     <!-- other dependency elements omitted -->

     <dependency>
       <groupId>org.springframework.data</groupId>
       <artifactId>spring-data-r2dbc</artifactId>
       <version>3.4.12</version>
     </dependency>

     <!-- a R2DBC driver -->
     <dependency>
       <groupId>io.r2dbc</groupId>
       <artifactId>r2dbc-h2</artifactId>
       <version>x.y.z</version>
     </dependency>

   </dependencies>
   ```
1. Change the version of Spring in the pom.xml to be

   ```xml
   <spring.version>6.2.13</spring.version>
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

You may also want to set the logging level to `DEBUG` to see some additional information.
To do so, edit the `application.properties` file to have the following content:

```
logging.level.org.springframework.r2dbc=DEBUG
```

Then you can, for example, create a `Person` class to persist, as follows:

```java
public class Person {

	private final String id;
	private final String name;
	private final int age;

	public Person(String id, String name, int age) {
		this.id = id;
		this.name = name;
		this.age = age;
	}

	public String getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public int getAge() {
		return age;
	}

	@Override
	public String toString() {
		return "Person [id=" + id + ", name=" + name + ", age=" + age + "]";
	}
}
```

Next, you need to create a table structure in your database, as follows:

```sql
CREATE TABLE person
  (id VARCHAR(255) PRIMARY KEY,
   name VARCHAR(255),
   age INT);
```

You also need a main application to run, as follows:

```java

import io.r2dbc.spi.ConnectionFactories;
import io.r2dbc.spi.ConnectionFactory;
import reactor.test.StepVerifier;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;

public class R2dbcApp {

  private static final Log log = LogFactory.getLog(R2dbcApp.class);

  public static void main(String[] args) {

    ConnectionFactory connectionFactory = ConnectionFactories.get("r2dbc:h2:mem:///test?options=DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE");

    R2dbcEntityTemplate template = new R2dbcEntityTemplate(connectionFactory);

    template.getDatabaseClient().sql("CREATE TABLE person" +
        "(id VARCHAR(255) PRIMARY KEY," +
        "name VARCHAR(255)," +
        "age INT)")
      .fetch()
      .rowsUpdated()
      .as(StepVerifier::create)
      .expectNextCount(1)
      .verifyComplete();

    template.insert(Person.class)
      .using(new Person("joe", "Joe", 34))
      .as(StepVerifier::create)
      .expectNextCount(1)
      .verifyComplete();

    template.select(Person.class)
      .first()
      .doOnNext(it -> log.info(it))
      .as(StepVerifier::create)
      .expectNextCount(1)
      .verifyComplete();
  }
}
```

When you run the main program, the preceding examples produce output similar to the following:

```
2018-11-28 10:47:03,893 DEBUG amework.core.r2dbc.DefaultDatabaseClient: 310 - Executing SQL statement [CREATE TABLE person
  (id VARCHAR(255) PRIMARY KEY,
   name VARCHAR(255),
   age INT)]
2018-11-28 10:47:04,074 DEBUG amework.core.r2dbc.DefaultDatabaseClient: 908 - Executing SQL statement [INSERT INTO person (id, name, age) VALUES($1, $2, $3)]
2018-11-28 10:47:04,092 DEBUG amework.core.r2dbc.DefaultDatabaseClient: 575 - Executing SQL statement [SELECT id, name, age FROM person]
2018-11-28 10:47:04,436  INFO        org.spring.r2dbc.example.R2dbcApp:  43 - Person [id='joe', name='Joe', age=34]
```

Even in this simple example, there are few things to notice:

- You can create an instance of the central helper class in Spring Data R2DBC (`R2dbcEntityTemplate`) by using a standard `io.r2dbc.spi.ConnectionFactory` object.
- The mapper works against standard POJO objects without the need for any additional metadata (though you can, optionally, provide that information — see [here](mapping.md).).
- Mapping conventions can use field access.Notice that the `Person` class has only getters.
- If the constructor argument names match the column names of the stored row, they are used to instantiate the object.

<a id="r2dbc.examples-repo"></a>

## Examples Repository

There is a [GitHub repository with several examples](https://github.com/spring-projects/spring-data-examples) that you can download and play around with to get a feel for how the library works.

<a id="r2dbc.connecting"></a>

## Connecting to a Relational Database with Spring

One of the first tasks when using relational databases and Spring is to create a `io.r2dbc.spi.ConnectionFactory` object by using the IoC container.
Make sure to use a [supported database and driver](#requirements).

<a id="r2dbc.connectionfactory"></a>

## Registering a `ConnectionFactory` Instance using Java Configuration

The following example shows an example of using Java-based bean metadata to register an instance of `io.r2dbc.spi.ConnectionFactory`:

#### Registering a `io.r2dbc.spi.ConnectionFactory` object using Java Configuration

```java
@Configuration
public class ApplicationConfiguration extends AbstractR2dbcConfiguration {

  @Override
  @Bean
  public ConnectionFactory connectionFactory() {
    return …
  }
}
```

This approach lets you use the standard `io.r2dbc.spi.ConnectionFactory` instance, with the container using Spring’s `AbstractR2dbcConfiguration`.As compared to registering a `ConnectionFactory` instance directly, the configuration support has the added advantage of also providing the container with an `ExceptionTranslator` implementation that translates R2DBC exceptions to exceptions in Spring’s portable `DataAccessException` hierarchy for data access classes annotated with the `@Repository` annotation.This hierarchy and the use of `@Repository` is described in [Spring’s DAO support features](https://docs.spring.io/spring-framework/reference/6.2/data-access.html).

`AbstractR2dbcConfiguration` also registers `DatabaseClient`, which is required for database interaction and for Repository implementation.

<a id="r2dbc.dialects"></a>

## Dialects

Spring Data R2DBC uses a `Dialect` to encapsulate behavior that is specific to a database or its driver.
Spring Data R2DBC reacts to database specifics by inspecting the `ConnectionFactory` and selects the appropriate database dialect accordingly.
If you use a database for which no dialect is available, then your application won’t start up.
In that case, you’ll have to ask your vendor to provide a `Dialect` implementation.
Alternatively, you can implement your own `Dialect`.

> [!TIP]
> Dialects are resolved by org.springframework.data.r2dbc./dialect/DialectResolver.html\[`DialectResolver`,role=apiref\] from a `ConnectionFactory`, typically by inspecting `ConnectionFactoryMetadata`.
> + You can let Spring auto-discover your `R2dbcDialect` by registering a class that implements `org.springframework.data.r2dbc.dialect.DialectResolver$R2dbcDialectProvider` through `META-INF/spring.factories`.
> `DialectResolver` discovers dialect provider implementations from the class path using Spring’s `SpringFactoriesLoader`.
> To do so:
>
> 1. Implement your own `Dialect`.
> 1. Implement a `R2dbcDialectProvider` returning the `Dialect`.
> 1. Register the provider by creating a `spring.factories`  resource under `META-INF` and perform the registration by adding a line
>
> `org.springframework.data.r2dbc.dialect.DialectResolver$R2dbcDialectProvider=<fully qualified name of your R2dbcDialectProvider>`
