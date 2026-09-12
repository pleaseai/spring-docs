---
title: "Database Initialization"
source: "how-to:data-initialization.adoc"
---

<a id="howto.data-initialization"></a>

# Database Initialization

An SQL database can be initialized in different ways depending on what your stack is.
Of course, you can also do it manually, provided the database is a separate process.
It is recommended to use a single mechanism for schema generation.

<a id="howto.data-initialization.using-hibernate"></a>

## Initialize a Database Using Hibernate

You can set `spring.jpa.hibernate.ddl-auto` to control Hibernate’s database initialization.
Supported values are `none`, `validate`, `update`, `create`, and `create-drop`.
Spring Boot chooses a default value for you based on whether you are using an embedded database.
An embedded database is identified by looking at the [`Connection`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/java/sql/Connection.html) type and JDBC url.
`hsqldb`, `h2`, or `derby` are embedded databases and others are not.
If an embedded database is identified and no schema manager (Flyway or Liquibase) has been detected, `ddl-auto` defaults to `create-drop`.
In all other cases, it defaults to `none`.

Be careful when switching from in-memory to a ‘real’ database that you do not make assumptions about the existence of the tables and data in the new platform.
You either have to set `ddl-auto` explicitly or use one of the other mechanisms to initialize the database.

> [!NOTE]
> You can output the schema creation by enabling the `org.hibernate.SQL` logger.
> This is done for you automatically if you enable the [debug mode](../reference/features/logging.md#features.logging.console-output).

In addition, a file named `import.sql` in the root of the classpath is executed on startup if Hibernate creates the schema from scratch (that is, if the `ddl-auto` property is set to `create` or `create-drop`).
This can be useful for demos and for testing if you are careful but is probably not something you want to be on the classpath in production.
It is a Hibernate feature (and has nothing to do with Spring).

<a id="howto.data-initialization.using-basic-sql-scripts"></a>

## Initialize a Database Using Basic SQL Scripts

Spring Boot can automatically create the schema (DDL scripts) of your JDBC [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) or R2DBC [`ConnectionFactory`](https://r2dbc.io/spec/1.0.0.RELEASE/api/io/r2dbc/spi/ConnectionFactory.html) and initialize its data (DML scripts).

By default, it loads schema scripts from `optional:classpath*:schema.sql` and data scripts from `optional:classpath*:data.sql`.
The locations of these schema and data scripts can be customized using `spring.sql.init.schema-locations` and `spring.sql.init.data-locations` respectively.
The `optional:` prefix means that the application will start even when the files do not exist.
To have the application fail to start when the files are absent, remove the `optional:` prefix.

In addition, Spring Boot processes the `optional:classpath*:schema-${platform}.sql` and `optional:classpath*:data-${platform}.sql` files (if present), where `${platform}` is the value of `spring.sql.init.platform`.
This allows you to switch to database-specific scripts if necessary.
For example, you might choose to set it to the vendor name of the database (`hsqldb`, `h2`, `oracle`, `mysql`, `postgresql`, and so on).

By default, SQL database initialization is only performed when using an embedded in-memory database.
To always initialize an SQL database, irrespective of its type, set `spring.sql.init.mode` to `always`.
Similarly, to disable initialization, set `spring.sql.init.mode` to `never`.
By default, Spring Boot enables the fail-fast feature of its script-based database initializer.
This means that, if the scripts cause exceptions, the application fails to start.
You can tune that behavior by setting `spring.sql.init.continue-on-error`.

Script-based [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) initialization is performed, by default, before any JPA [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.1/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html) beans are created.
`schema.sql` can be used to create the schema for JPA-managed entities and `data.sql` can be used to populate it.
While we do not recommend using multiple data source initialization technologies, if you want script-based [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) initialization to be able to build upon the schema creation performed by Hibernate, set `spring.jpa.defer-datasource-initialization` to `true`.
This will defer data source initialization until after any [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.1/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html) beans have been created and initialized.
`schema.sql` can then be used to make additions to any schema creation performed by Hibernate and `data.sql` can be used to populate it.

> [!NOTE]
> The initialization scripts support `--` for single line comments and `/* */` for block comments.
> Other comment formats are not supported.

If you are using a [higher-level database migration tool](#howto.data-initialization.migration-tool), like Flyway or Liquibase, you should use them alone to create and initialize the schema.
Using the basic `schema.sql` and `data.sql` scripts alongside Flyway or Liquibase is not recommended and support will be removed in a future release.

If you need to initialize test data using a higher-level database migration tool, please see the sections about [Flyway](#howto.data-initialization.migration-tool.flyway-tests) and [Liquibase](#howto.data-initialization.migration-tool.liquibase-tests).

<a id="howto.data-initialization.batch"></a>

## Initialize a Spring Batch Database

If you use Spring Batch, it comes pre-packaged with SQL initialization scripts for most popular database platforms.
Spring Boot can detect your database type and execute those scripts on startup.
If you use an embedded database, this happens by default.
You can also enable it for any database type, as shown in the following example:

#### Properties

```properties
spring.batch.jdbc.initialize-schema=always
```

#### YAML

```yaml
spring:
  batch:
    jdbc:
      initialize-schema: "always"
```

You can also switch off the initialization explicitly by setting `spring.batch.jdbc.initialize-schema` to `never`.

<a id="howto.data-initialization.migration-tool"></a>

## Use a Higher-level Database Migration Tool

Spring Boot supports two higher-level migration tools: [Flyway](https://flywaydb.org/) and [Liquibase](https://www.liquibase.org/).

<a id="howto.data-initialization.migration-tool.flyway"></a>

### Execute Flyway Database Migrations on Startup

To automatically run Flyway database migrations on startup, add the appropriate Flyway module to your classpath.
In-memory and file-based databases are supported by `org.flywaydb:flyway-core`.
Otherwise, a database-specific module is required.
For example, use `org.flywaydb:flyway-database-postgresql` with PostgreSQL and `org.flywaydb:flyway-mysql` with MySQL.
See [the Flyway Documentation](https://documentation.red-gate.com/fd/supported-databases-and-versions-143754067.html) for further details.

Typically, migrations are scripts in the form `V<VERSION>__<NAME>.sql` (with `<VERSION>` an underscore-separated version, such as ‘1’ or ‘2\_1’).
By default, they are in a directory called `classpath:db/migration`, but you can modify that location by setting `spring.flyway.locations`.
This is a comma-separated list of one or more `classpath:` or `filesystem:` locations.
For example, the following configuration would search for scripts in both the default classpath location and the `/opt/migration` directory:

#### Properties

```properties
spring.flyway.locations=classpath:db/migration,filesystem:/opt/migration
```

#### YAML

```yaml
spring:
  flyway:
    locations: "classpath:db/migration,filesystem:/opt/migration"
```

You can also add a special `{vendor}` placeholder to use vendor-specific scripts.
Assume the following:

#### Properties

```properties
spring.flyway.locations=classpath:db/migration/{vendor}
```

#### YAML

```yaml
spring:
  flyway:
    locations: "classpath:db/migration/{vendor}"
```

Rather than using `db/migration`, the preceding configuration sets the directory to use according to the type of the database (such as `db/migration/mysql` for MySQL).
The list of supported databases is available in [`DatabaseDriver`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/jdbc/DatabaseDriver.html).

Migrations can also be written in Java.
Flyway will be auto-configured with any beans that implement [`JavaMigration`](https://javadoc.io/doc/org.flywaydb/flyway-core/10.20.1/org/flywaydb/core/api/migration/JavaMigration.html).

[`FlywayProperties`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/autoconfigure/flyway/FlywayProperties.html) provides most of Flyway’s settings and a small set of additional properties that can be used to disable the migrations or switch off the location checking.
If you need more control over the configuration, consider registering a [`FlywayConfigurationCustomizer`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/autoconfigure/flyway/FlywayConfigurationCustomizer.html) bean.

Spring Boot calls `Flyway.migrate()` to perform the database migration.
If you would like more control, provide a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) that implements [`FlywayMigrationStrategy`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/autoconfigure/flyway/FlywayMigrationStrategy.html).

Flyway supports SQL and Java [callbacks](https://documentation.red-gate.com/fd/callbacks-275218509.html).
To use SQL-based callbacks, place the callback scripts in the `classpath:db/migration` directory.
To use Java-based callbacks, create one or more beans that implement [`Callback`](https://javadoc.io/doc/org.flywaydb/flyway-core/10.20.1/org/flywaydb/core/api/callback/Callback.html).
Any such beans are automatically registered with [`Flyway`](https://javadoc.io/doc/org.flywaydb/flyway-core/10.20.1/org/flywaydb/core/Flyway.html).
They can be ordered by using [`@Order`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/annotation/Order.html) or by implementing [`Ordered`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/Ordered.html).

By default, Flyway autowires the (`@Primary`) [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) in your context and uses that for migrations.
If you like to use a different [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html), you can create one and mark its [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) as [`@FlywayDataSource`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/autoconfigure/flyway/FlywayDataSource.html).
If you do so and want two data sources (for example by retaining the main auto-configured [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html)), remember to set the `defaultCandidate` attribute of the [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) annotation to `false`.
Alternatively, you can use Flyway’s native [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) by setting `spring.flyway.[url,user,password]` in external properties.
Setting either `spring.flyway.url` or `spring.flyway.user` is sufficient to cause Flyway to use its own [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html).
If any of the three properties has not been set, the value of its equivalent `spring.datasource` property will be used.

You can also use Flyway to provide data for specific scenarios.
For example, you can place test-specific migrations in `src/test/resources` and they are run only when your application starts for testing.
Also, you can use profile-specific configuration to customize `spring.flyway.locations` so that certain migrations run only when a particular profile is active.
For example, in `application-dev.properties`, you might specify the following setting:

#### Properties

```properties
spring.flyway.locations=classpath:/db/migration,classpath:/dev/db/migration
```

#### YAML

```yaml
spring:
  flyway:
    locations: "classpath:/db/migration,classpath:/dev/db/migration"
```

With that setup, migrations in `dev/db/migration` run only when the `dev` profile is active.

<a id="howto.data-initialization.migration-tool.liquibase"></a>

### Execute Liquibase Database Migrations on Startup

To automatically run Liquibase database migrations on startup, add the `org.liquibase:liquibase-core` to your classpath.

> [!NOTE]
> When you add the `org.liquibase:liquibase-core` to your classpath, database migrations run by default for both during application startup and before your tests run.
> This behavior can be customized by using the `spring.liquibase.enabled` property, setting different values in the `main` and `test` configurations.
> It is not possible to use two different ways to initialize the database (for example Liquibase for application startup, JPA for test runs).

By default, the master change log is read from `db/changelog/db.changelog-master.yaml`, but you can change the location by setting `spring.liquibase.change-log`.
In addition to YAML, Liquibase also supports JSON, XML, and SQL change log formats.

By default, Liquibase autowires the (`@Primary`) [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) in your context and uses that for migrations.
If you need to use a different [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html), you can create one and mark its [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) as [`@LiquibaseDataSource`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/autoconfigure/liquibase/LiquibaseDataSource.html).
If you do so and want two data sources (for example by retaining the main auto-configured [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html)), remember to set the `defaultCandidate` attribute of the [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) annotation to `false`.
Alternatively, you can use Liquibase’s native [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) by setting `spring.liquibase.[driver-class-name,url,user,password]` in external properties.
Setting either `spring.liquibase.url` or `spring.liquibase.user` is sufficient to cause Liquibase to use its own [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html).
If any of the three properties has not been set, the value of its equivalent `spring.datasource` property will be used.

See [`LiquibaseProperties`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/autoconfigure/liquibase/LiquibaseProperties.html) for details about available settings such as contexts, the default schema, and others.

You can also use a `Customizer<Liquibase>` bean if you want to customize the [`Liquibase`](https://javadoc.io/doc/org.liquibase/liquibase-core/4.29.2/liquibase/Liquibase.html) instance before it is being used.

<a id="howto.data-initialization.migration-tool.flyway-tests"></a>

### Use Flyway for Test-only Migrations

If you want to create Flyway migrations which populate your test database, place them in `src/test/resources/db/migration`.
A file named, for example, `src/test/resources/db/migration/V9999__test-data.sql` will be executed after your production migrations and only if you’re running the tests.
You can use this file to create the needed test data.
This file will not be packaged in your uber jar or your container.

<a id="howto.data-initialization.migration-tool.liquibase-tests"></a>

### Use Liquibase for Test-only Migrations

If you want to create Liquibase migrations which populate your test database, you have to create a test changelog which also includes the production changelog.

First, you need to configure Liquibase to use a different changelog when running the tests.
One way to do this is to create a Spring Boot `test` profile and put the Liquibase properties in there.
For that, create a file named `src/test/resources/application-test.properties` and put the following property in there:

#### Properties

```properties
spring.liquibase.change-log=classpath:/db/changelog/db.changelog-test.yaml
```

#### YAML

```yaml
spring:
  liquibase:
    change-log: "classpath:/db/changelog/db.changelog-test.yaml"
```

This configures Liquibase to use a different changelog when running in the `test` profile.

Now create the changelog file at `src/test/resources/db/changelog/db.changelog-test.yaml`:

```yaml
databaseChangeLog:
  - include:
      file: classpath:/db/changelog/db.changelog-master.yaml
  - changeSet:
      runOrder: "last"
      id: "test"
      changes:
        # Insert your changes here
```

This changelog will be used when the tests are run and it will not be packaged in your uber jar or your container.
It includes the production changelog and then declares a new changeset, whose `runOrder: last` setting specifies that it runs after all the production changesets have been run.
You can now use for example the [insert changeset](https://docs.liquibase.com/change-types/insert.html) to insert data or the [sql changeset](https://docs.liquibase.com/change-types/sql.html) to execute SQL directly.

The last thing to do is to configure Spring Boot to activate the `test` profile when running tests.
To do this, you can add the `@ActiveProfiles("test")` annotation to your [`@SpringBootTest`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/test/context/SpringBootTest.html) annotated test classes.

<a id="howto.data-initialization.dependencies"></a>

## Depend Upon an Initialized Database

Database initialization is performed while the application is starting up as part of application context refresh.
To allow an initialized database to be accessed during startup, beans that act as database initializers and beans that require that database to have been initialized are detected automatically.
Beans whose initialization depends upon the database having been initialized are configured to depend upon those that initialize it.
If, during startup, your application tries to access the database and it has not been initialized, you can configure additional detection of beans that initialize the database and require the database to have been initialized.

<a id="howto.data-initialization.dependencies.initializer-detection"></a>

### Detect a Database Initializer

Spring Boot will automatically detect beans of the following types that initialize an SQL database:

- [`DataSourceScriptDatabaseInitializer`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/jdbc/init/DataSourceScriptDatabaseInitializer.html)
- [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.1/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html)
- [`Flyway`](https://javadoc.io/doc/org.flywaydb/flyway-core/10.20.1/org/flywaydb/core/Flyway.html)
- [`FlywayMigrationInitializer`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/autoconfigure/flyway/FlywayMigrationInitializer.html)
- [`R2dbcScriptDatabaseInitializer`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/r2dbc/init/R2dbcScriptDatabaseInitializer.html)
- [`SpringLiquibase`](https://javadoc.io/doc/org.liquibase/liquibase-core/4.29.2/liquibase/integration/spring/SpringLiquibase.html)

If you are using a third-party starter for a database initialization library, it may provide a detector such that beans of other types are also detected automatically.
To have other beans be detected, register an implementation of [`DatabaseInitializerDetector`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/sql/init/dependency/DatabaseInitializerDetector.html) in `META-INF/spring.factories`.

<a id="howto.data-initialization.dependencies.depends-on-initialization-detection"></a>

### Detect a Bean That Depends On Database Initialization

Spring Boot will automatically detect beans of the following types that depends upon database initialization:

- [`AbstractEntityManagerFactoryBean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/orm/jpa/AbstractEntityManagerFactoryBean.html) (unless `spring.jpa.defer-datasource-initialization` is set to `true`)
- [`DSLContext`](https://www.jooq.org/javadoc/3.19.26/org/jooq/DSLContext.html) (jOOQ)
- [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.1/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html) (unless `spring.jpa.defer-datasource-initialization` is set to `true`)
- [`JdbcClient`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/jdbc/core/simple/JdbcClient.html)
- [`JdbcOperations`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/jdbc/core/JdbcOperations.html)
- [`NamedParameterJdbcOperations`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/jdbc/core/namedparam/NamedParameterJdbcOperations.html)

If you are using a third-party starter data access library, it may provide a detector such that beans of other types are also detected automatically.
To have other beans be detected, register an implementation of [`DependsOnDatabaseInitializationDetector`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/sql/init/dependency/DependsOnDatabaseInitializationDetector.html) in `META-INF/spring.factories`.
Alternatively, annotate the bean’s class or its [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) method with [`@DependsOnDatabaseInitialization`](https://docs.spring.io/spring-boot/3.4.10/api/java/org/springframework/boot/sql/init/dependency/DependsOnDatabaseInitialization.html).
