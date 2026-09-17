---
title: "Data Access"
source: "how-to:data-access.adoc"
---

<a id="howto.data-access"></a>

# Data Access

Spring Boot includes a number of starters for working with data sources.
This section answers questions related to doing so.

<a id="howto.data-access.configure-custom-datasource"></a>

## Configure a Custom DataSource

To configure your own [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html), define a [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) of that type in your configuration.
Spring Boot reuses your [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) anywhere one is required, including database initialization.
If you need to externalize some settings, you can bind your [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) to the environment (see [reference:features/external-config.adoc#features.external-config.typesafe-configuration-properties.third-party-configuration](../reference/features/external-config.md#features.external-config.typesafe-configuration-properties.third-party-configuration)).

The following example shows how to define a data source in a bean:

#### Java

```java
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyDataSourceConfiguration {

	@Bean
	@ConfigurationProperties("app.datasource")
	public SomeDataSource dataSource() {
		return new SomeDataSource();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyDataSourceConfiguration {

	@Bean
	@ConfigurationProperties("app.datasource")
	fun dataSource(): SomeDataSource {
		return SomeDataSource()
	}

}

```

The following example shows how to define a data source by setting its properties:

#### Properties

```properties
app.datasource.url=jdbc:h2:mem:mydb
app.datasource.username=sa
app.datasource.pool-size=30
```

#### YAML

```yaml
app:
  datasource:
    url: "jdbc:h2:mem:mydb"
    username: "sa"
    pool-size: 30
```

Assuming that `SomeDataSource` has regular JavaBean properties for the URL, the username, and the pool size, these settings are bound automatically before the [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) is made available to other components.

Spring Boot also provides a utility builder class, called [`DataSourceBuilder`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jdbc/DataSourceBuilder.html), that can be used to create one of the standard data sources (if it is on the classpath).
The builder can detect which one to use based on what is available on the classpath.
It also auto-detects the driver based on the JDBC URL.

The following example shows how to create a data source by using a [`DataSourceBuilder`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jdbc/DataSourceBuilder.html):

#### Java

```java
import javax.sql.DataSource;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyDataSourceConfiguration {

	@Bean
	@ConfigurationProperties("app.datasource")
	public DataSource dataSource() {
		return DataSourceBuilder.create().build();
	}

}
```

#### Kotlin

```kotlin
import javax.sql.DataSource

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.jdbc.DataSourceBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyDataSourceConfiguration {

	@Bean
	@ConfigurationProperties("app.datasource")
	fun dataSource(): DataSource {
		return DataSourceBuilder.create().build()
	}

}

```

To run an app with that [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html), all you need is the connection information.
Pool-specific settings can also be provided.
Check the implementation that is going to be used at runtime for more details.

The following example shows how to define a JDBC data source by setting properties:

#### Properties

```properties
app.datasource.url=jdbc:mysql://localhost/test
app.datasource.username=dbuser
app.datasource.password=dbpass
app.datasource.pool-size=30
```

#### YAML

```yaml
app:
  datasource:
    url: "jdbc:mysql://localhost/test"
    username: "dbuser"
    password: "dbpass"
    pool-size: 30
```

However, there is a catch due to the method’s [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) return type.
This hides the actual type of the connection pool so no configuration property metadata is generated for your custom [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) and no auto-completion is available in your IDE.
To address this problem, use the builder’s `type(Class)` method to specify the type of [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) to be built and update the method’s return type.
For example, the following shows how to create a [`HikariDataSource`](https://javadoc.io/doc/com.zaxxer/HikariCP/7.0.2/com.zaxxer.hikari/com/zaxxer/hikari/HikariDataSource.html) with [`DataSourceBuilder`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jdbc/DataSourceBuilder.html):

#### Java

```java
import com.zaxxer.hikari.HikariDataSource;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyDataSourceConfiguration {

	@Bean
	@ConfigurationProperties("app.datasource")
	public HikariDataSource dataSource() {
		return DataSourceBuilder.create().type(HikariDataSource.class).build();
	}

}
```

#### Kotlin

```kotlin
import com.zaxxer.hikari.HikariDataSource
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.jdbc.DataSourceBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyDataSourceConfiguration {

	@Bean
	@ConfigurationProperties("app.datasource")
	fun dataSource(): HikariDataSource {
		return DataSourceBuilder.create().type(HikariDataSource::class.java).build()
	}

}

```

Unfortunately, this basic setup does not work because Hikari has no `url` property.
Instead, it has a `jdbc-url` property which means that you must rewrite your configuration as follows:

#### Properties

```properties
app.datasource.jdbc-url=jdbc:mysql://localhost/test
app.datasource.username=dbuser
app.datasource.password=dbpass
app.datasource.pool-size=30
```

#### YAML

```yaml
app:
  datasource:
    jdbc-url: "jdbc:mysql://localhost/test"
    username: "dbuser"
    password: "dbpass"
    pool-size: 30
```

To address this problem, make use of [`DataSourceProperties`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jdbc/autoconfigure/DataSourceProperties.html) which will handle the `url` to `jdbc-url` translation for you.
You can initialize a [`DataSourceBuilder`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jdbc/DataSourceBuilder.html) from the state of any [`DataSourceProperties`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jdbc/autoconfigure/DataSourceProperties.html) object using its `initializeDataSourceBuilder()` method.
You could inject the [`DataSourceProperties`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jdbc/autoconfigure/DataSourceProperties.html) that Spring Boot creates automatically, however, that would split your configuration across `spring.datasource.*` and `app.datasource.*`.
To avoid this, define a custom [`DataSourceProperties`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jdbc/autoconfigure/DataSourceProperties.html) with a custom configuration properties prefix, as shown in the following example:

#### Java

```java
import com.zaxxer.hikari.HikariDataSource;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.autoconfigure.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration(proxyBeanMethods = false)
public class MyDataSourceConfiguration {

	@Bean
	@Primary
	@ConfigurationProperties("app.datasource")
	public DataSourceProperties dataSourceProperties() {
		return new DataSourceProperties();
	}

	@Bean
	@ConfigurationProperties("app.datasource.configuration")
	public HikariDataSource dataSource(DataSourceProperties properties) {
		return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
	}

}
```

#### Kotlin

```kotlin
import com.zaxxer.hikari.HikariDataSource
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.jdbc.autoconfigure.DataSourceProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary

@Configuration(proxyBeanMethods = false)
class MyDataSourceConfiguration {

	@Bean
	@Primary
	@ConfigurationProperties("app.datasource")
	fun dataSourceProperties(): DataSourceProperties {
		return DataSourceProperties()
	}

	@Bean
	@ConfigurationProperties("app.datasource.configuration")
	fun dataSource(properties: DataSourceProperties): HikariDataSource {
		return properties.initializeDataSourceBuilder().type(HikariDataSource::class.java).build()
	}

}

```

This setup is equivalent to what Spring Boot does for you by default, except that the pool’s type is specified in code and its settings are exposed as `app.datasource.configuration.*` properties.
[`DataSourceProperties`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jdbc/autoconfigure/DataSourceProperties.html) takes care of the `url` to `jdbc-url` translation, so you can configure it as follows:

#### Properties

```properties
app.datasource.url=jdbc:mysql://localhost/test
app.datasource.username=dbuser
app.datasource.password=dbpass
app.datasource.configuration.maximum-pool-size=30
```

#### YAML

```yaml
app:
  datasource:
    url: "jdbc:mysql://localhost/test"
    username: "dbuser"
    password: "dbpass"
    configuration:
      maximum-pool-size: 30
```

Note that, as the custom configuration specifies in code that Hikari should be used, `app.datasource.type` will have no effect.

As described in [reference:data/sql.adoc#data.sql.datasource.connection-pool](../reference/data/sql.md#data.sql.datasource.connection-pool), [`DataSourceBuilder`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jdbc/DataSourceBuilder.html) supports several different connection pools.
To use a pool other than Hikari, add it to the classpath, use the `type(Class)` method to specify the pool class to use, and update the [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) method’s return type to match.
This will also provide you with configuration property metadata for the specific connection pool that you’ve chosen.

> [!TIP]
> Spring Boot will expose Hikari-specific settings to `spring.datasource.hikari`.
> This example uses a more generic `configuration` sub namespace as the example does not support multiple datasource implementations.

See [reference:data/sql.adoc#data.sql.datasource](../reference/data/sql.md#data.sql.datasource) and the [`DataSourceAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v4.0.2/module/spring-boot-jdbc/src/main/java/org/springframework/boot/jdbc/autoconfigure/DataSourceAutoConfiguration.java) class for more details.

<a id="howto.data-access.configure-two-datasources"></a>

## Configure Two DataSources

To define an additional [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html), an approach that’s similar to the previous section can be used.
A key difference is that the [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) must be declared with `defaultCandidate=false`.
This prevents the auto-configured [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) from backing off.

> [!NOTE]
> The [Spring Framework reference documentation](https://docs.spring.io/spring-framework/reference/7.0/core/beans/dependencies/factory-autowire.html#beans-factory-autowire-candidate) describes this feature in more details.

To allow the additional [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) to be injected where it’s needed, also annotate it with [`@Qualifier`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/beans/factory/annotation/Qualifier.html) as shown in the following example:

#### Java

```java
import com.zaxxer.hikari.HikariDataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyAdditionalDataSourceConfiguration {

	@Qualifier("second")
	@Bean(defaultCandidate = false)
	@ConfigurationProperties("app.datasource")
	public HikariDataSource secondDataSource() {
		return DataSourceBuilder.create().type(HikariDataSource.class).build();
	}

}
```

#### Kotlin

```kotlin
import com.zaxxer.hikari.HikariDataSource

import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.jdbc.DataSourceBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyAdditionalDataSourceConfiguration {

	@Qualifier("second")
	@Bean(defaultCandidate = false)
	@ConfigurationProperties("app.datasource")
	fun secondDataSource(): HikariDataSource {
		return DataSourceBuilder.create().type(HikariDataSource::class.java).build()
	}

}

```

To consume the additional [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html), annotate the injection point with the same [`@Qualifier`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/beans/factory/annotation/Qualifier.html).

The auto-configured and additional data sources can be configured as follows:

#### Properties

```properties
spring.datasource.url=jdbc:mysql://localhost/first
spring.datasource.username=dbuser
spring.datasource.password=dbpass
spring.datasource.configuration.maximum-pool-size=30
app.datasource.url=jdbc:mysql://localhost/second
app.datasource.username=dbuser
app.datasource.password=dbpass
app.datasource.max-total=30
```

#### YAML

```yaml
spring:
  datasource:
    url: "jdbc:mysql://localhost/first"
    username: "dbuser"
    password: "dbpass"
    configuration:
      maximum-pool-size: 30
app:
  datasource:
    url: "jdbc:mysql://localhost/second"
    username: "dbuser"
    password: "dbpass"
    max-total: 30
```

More advanced, implementation-specific, configuration of the auto-configured [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) is available through the `spring.datasource.configuration.*` properties.
You can apply the same concept to the additional [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) as well, as shown in the following example:

#### Java

```java
import com.zaxxer.hikari.HikariDataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.autoconfigure.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyCompleteAdditionalDataSourceConfiguration {

	@Qualifier("second")
	@Bean(defaultCandidate = false)
	@ConfigurationProperties("app.datasource")
	public DataSourceProperties secondDataSourceProperties() {
		return new DataSourceProperties();
	}

	@Qualifier("second")
	@Bean(defaultCandidate = false)
	@ConfigurationProperties("app.datasource.configuration")
	public HikariDataSource secondDataSource(@Qualifier("second") DataSourceProperties dataSourceProperties) {
		return dataSourceProperties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
	}

}
```

#### Kotlin

```kotlin
import com.zaxxer.hikari.HikariDataSource

import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.jdbc.autoconfigure.DataSourceProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyCompleteAdditionalDataSourceConfiguration {

	@Qualifier("second")
	@Bean(defaultCandidate = false)
	@ConfigurationProperties("app.datasource")
	fun secondDataSourceProperties(): DataSourceProperties {
		return DataSourceProperties()
	}

	@Qualifier("second")
	@Bean(defaultCandidate = false)
	@ConfigurationProperties("app.datasource.configuration")
	fun secondDataSource(@Qualifier("second") dataSourceProperties: DataSourceProperties): HikariDataSource {
		return dataSourceProperties.initializeDataSourceBuilder().type(HikariDataSource::class.java).build()
	}

}

```

The preceding example configures the additional data source with the same logic as Spring Boot would use in auto-configuration.
Note that the `app.datasource.configuration.*` properties provide advanced settings based on the chosen implementation.

As with [configuring a single custom [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html)](#howto.data-access.configure-custom-datasource), the type of one or both of the [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) beans can be customized using the `type(Class)` method on [`DataSourceBuilder`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jdbc/DataSourceBuilder.html).
See [reference:data/sql.adoc#data.sql.datasource.connection-pool](../reference/data/sql.md#data.sql.datasource.connection-pool) for details of the supported types.

<a id="howto.data-access.spring-data-repositories"></a>

## Use Spring Data Repositories

Spring Data can create implementations of [`Repository`](https://docs.spring.io/spring-data/commons/docs/4.0.x/api/org/springframework/data/repository/Repository.html) interfaces of various flavors.
Spring Boot handles all of that for you, as long as those [`Repository`](https://docs.spring.io/spring-data/commons/docs/4.0.x/api/org/springframework/data/repository/Repository.html) implementations are included in one of the [auto-configuration packages](../reference/using/auto-configuration.md#using.auto-configuration.packages), typically the package (or a sub-package) of your main application class that is annotated with [`@SpringBootApplication`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/autoconfigure/SpringBootApplication.html) or [`@EnableAutoConfiguration`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/autoconfigure/EnableAutoConfiguration.html).

For many applications, all you need is to put the right Spring Data dependencies on your classpath.
There is a `spring-boot-starter-data-jpa` for JPA, `spring-boot-starter-data-mongodb` for Mongodb, and various other starters for supported technologies.
To get started, create some repository interfaces to handle your [`@Entity`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/Entity.html) objects.

Spring Boot determines the location of your [`Repository`](https://docs.spring.io/spring-data/commons/docs/4.0.x/api/org/springframework/data/repository/Repository.html) implementations by scanning the [auto-configuration packages](../reference/using/auto-configuration.md#using.auto-configuration.packages).
For more control, use the `@Enable…Repositories` annotations from Spring Data.

For more about Spring Data, see the [Spring Data project page](https://spring.io/projects/spring-data).

<a id="howto.data-access.separate-entity-definitions-from-spring-configuration"></a>

## Separate @Entity Definitions from Spring Configuration

Spring Boot determines the location of your [`@Entity`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/Entity.html) definitions by scanning the [auto-configuration packages](../reference/using/auto-configuration.md#using.auto-configuration.packages).
For more control, use the [`@EntityScan`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/persistence/autoconfigure/EntityScan.html) annotation, as shown in the following example:

#### Java

```java
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@EnableAutoConfiguration
@EntityScan(basePackageClasses = City.class)
public class MyApplication {

	// ...

}
```

#### Kotlin

```kotlin
import org.springframework.boot.autoconfigure.EnableAutoConfiguration
import org.springframework.boot.persistence.autoconfigure.EntityScan
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
@EnableAutoConfiguration
@EntityScan(basePackageClasses = [City::class])
class MyApplication {

	// ...

}

```

<a id="howto.data-access.filter-scanned-entity-definitions"></a>

## Filter Scanned @Entity Definitions

It is possible to filter the [`@Entity`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/Entity.html) definitions using a [`ManagedClassNameFilter`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/orm/jpa/persistenceunit/ManagedClassNameFilter.html) bean.
This can be useful in tests when only a sub-set of the available entities should be considered.
In the following example, only entities from the `com.example.app.customer` package are included:

#### Java

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.persistenceunit.ManagedClassNameFilter;

@Configuration(proxyBeanMethods = false)
public class MyEntityScanConfiguration {

	@Bean
	public ManagedClassNameFilter entityScanFilter() {
		return (className) -> className.startsWith("com.example.app.customer.");
	}

}
```

#### Kotlin

```kotlin
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.orm.jpa.persistenceunit.ManagedClassNameFilter

@Configuration(proxyBeanMethods = false)
class MyEntityScanConfiguration {

	@Bean
	fun entityScanFilter() : ManagedClassNameFilter {
		return ManagedClassNameFilter { className ->
			className.startsWith("com.example.app.customer.")
		}
	}
}

```

<a id="howto.data-access.jpa-properties"></a>

## Configure JPA Properties

Spring Data JPA already provides some vendor-independent configuration options (such as those for SQL logging), and Spring Boot exposes those options and a few more for Hibernate as external configuration properties.
Some of them are automatically detected according to the context so you should not have to set them.

The `spring.jpa.hibernate.ddl-auto` is a special case, because, depending on runtime conditions, it has different defaults.
If an embedded database is used and no schema manager (such as Liquibase or Flyway) is handling the [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html), it defaults to `create-drop`.
In all other cases, it defaults to `none`.

The dialect to use is detected by the JPA provider.
If you prefer to set the dialect yourself, set the `spring.jpa.database-platform` property.

The most common options to set are shown in the following example:

#### Properties

```properties
spring.jpa.hibernate.naming.physical-strategy=com.example.MyPhysicalNamingStrategy
spring.jpa.show-sql=true
```

#### YAML

```yaml
spring:
  jpa:
    hibernate:
      naming:
        physical-strategy: "com.example.MyPhysicalNamingStrategy"
    show-sql: true
```

In addition, all properties in `spring.jpa.properties.*` are passed through as normal JPA properties (with the prefix stripped) when the local [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html) is created.

> [!WARNING]
> You need to ensure that names defined under `spring.jpa.properties.*` exactly match those expected by your JPA provider.
> Spring Boot will not attempt any kind of relaxed binding for these entries.
>
> For example, if you want to configure Hibernate’s batch size you must use `spring.jpa.properties.hibernate.jdbc.batch_size`.
> If you use other forms, such as `batchSize` or `batch-size`, Hibernate will not apply the setting.

> [!TIP]
> If you need to apply advanced customization to Hibernate properties, consider registering a [`HibernatePropertiesCustomizer`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/hibernate/autoconfigure/HibernatePropertiesCustomizer.html) bean that will be invoked prior to creating the [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html).
> This takes precedence over anything that is applied by the auto-configuration.

<a id="howto.data-access.configure-hibernate-naming-strategy"></a>

## Configure Hibernate Naming Strategy

Hibernate uses [two different naming strategies](https://docs.jboss.org/hibernate/orm/7.2/userguide/html_single/Hibernate_User_Guide.html#naming) to map names from the object model to the corresponding database names.
The fully qualified class name of the physical and the implicit strategy implementations can be configured by setting the `spring.jpa.hibernate.naming.physical-strategy` and `spring.jpa.hibernate.naming.implicit-strategy` properties, respectively.
Alternatively, if [`ImplicitNamingStrategy`](https://docs.jboss.org/hibernate/orm/7.2/javadocs/org/hibernate/boot/model/naming/ImplicitNamingStrategy.html) or [`PhysicalNamingStrategy`](https://docs.jboss.org/hibernate/orm/7.2/javadocs/org/hibernate/boot/model/naming/PhysicalNamingStrategy.html) beans are available in the application context, Hibernate will be automatically configured to use them.

By default, Spring Boot configures the physical naming strategy with [`CamelCaseToUnderscoresNamingStrategy`](https://docs.jboss.org/hibernate/orm/7.2/javadocs/org/hibernate/boot/model/naming/CamelCaseToUnderscoresNamingStrategy.html).
Using this strategy, all dots are replaced by underscores and camel casing is replaced by underscores as well.
Additionally, by default, all table names are generated in lower case.
For example, a `TelephoneNumber` entity is mapped to the `telephone_number` table.
If your schema requires mixed-case identifiers, define a custom [`CamelCaseToUnderscoresNamingStrategy`](https://docs.jboss.org/hibernate/orm/7.2/javadocs/org/hibernate/boot/model/naming/CamelCaseToUnderscoresNamingStrategy.html) bean, as shown in the following example:

#### Java

```java
import org.hibernate.boot.model.naming.Identifier;
import org.hibernate.boot.model.naming.PhysicalNamingStrategySnakeCaseImpl;
import org.hibernate.engine.jdbc.env.spi.JdbcEnvironment;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyHibernateConfiguration {

	@Bean
	public PhysicalNamingStrategySnakeCaseImpl caseSensitivePhysicalNamingStrategy() {
		return new PhysicalNamingStrategySnakeCaseImpl() {

			@Override
			public Identifier toPhysicalColumnName(Identifier logicalName, JdbcEnvironment jdbcEnvironment) {
				return logicalName;
			}

		};
	}

}
```

#### Kotlin

```kotlin
import org.hibernate.boot.model.naming.Identifier
import org.hibernate.boot.model.naming.PhysicalNamingStrategySnakeCaseImpl
import org.hibernate.engine.jdbc.env.spi.JdbcEnvironment
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyHibernateConfiguration {

	@Bean
	fun caseSensitivePhysicalNamingStrategy(): PhysicalNamingStrategySnakeCaseImpl {
		return object : PhysicalNamingStrategySnakeCaseImpl() {
			override fun toPhysicalColumnName(logicalName: Identifier, jdbcEnvironment: JdbcEnvironment): Identifier {
				return logicalName
			}
		}
	}

}

```

If you prefer to use Hibernate’s default instead, set the following property:

#### Properties

```properties
spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
```

#### YAML

```yaml
spring:
  jpa:
    hibernate:
      naming:
        physical-strategy: org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
```

Alternatively, you can configure the following bean:

#### Java

```java
import org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class MyHibernateConfiguration {

	@Bean
	PhysicalNamingStrategyStandardImpl caseSensitivePhysicalNamingStrategy() {
		return new PhysicalNamingStrategyStandardImpl();
	}

}
```

#### Kotlin

```kotlin
import org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
internal class MyHibernateConfiguration {

	@Bean
	fun caseSensitivePhysicalNamingStrategy(): PhysicalNamingStrategyStandardImpl {
		return PhysicalNamingStrategyStandardImpl()
	}

}

```

See [`HibernateJpaAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v4.0.2/module/spring-boot-hibernate/src/main/java/org/springframework/boot/hibernate/autoconfigure/HibernateJpaAutoConfiguration.java) and [`JpaBaseConfiguration`](https://github.com/spring-projects/spring-boot/tree/v4.0.2/module/spring-boot-jpa/src/main/java/org/springframework/boot/jpa/autoconfigure/JpaBaseConfiguration.java) for more details.

<a id="howto.data-access.configure-hibernate-second-level-caching"></a>

## Configure Hibernate Second-Level Caching

Hibernate [second-level cache](https://docs.jboss.org/hibernate/orm/7.2/userguide/html_single/Hibernate_User_Guide.html#caching) can be configured for a range of cache providers.
Rather than configuring Hibernate to lookup the cache provider again, it is better to provide the one that is available in the context whenever possible.

To do this with JCache, first make sure that `org.hibernate.orm:hibernate-jcache` is available on the classpath.
Then, add a [`HibernatePropertiesCustomizer`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/hibernate/autoconfigure/HibernatePropertiesCustomizer.html) bean as shown in the following example:

#### Java

```java
import org.hibernate.cache.jcache.ConfigSettings;

import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.cache.jcache.JCacheCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyHibernateSecondLevelCacheConfiguration {

	@Bean
	public HibernatePropertiesCustomizer hibernateSecondLevelCacheCustomizer(JCacheCacheManager cacheManager) {
		return (properties) -> properties.put(ConfigSettings.CACHE_MANAGER, cacheManager.getCacheManager());
	}

}
```

#### Kotlin

```kotlin
import org.hibernate.cache.jcache.ConfigSettings
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer
import org.springframework.cache.jcache.JCacheCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyHibernateSecondLevelCacheConfiguration {

	@Bean
	fun hibernateSecondLevelCacheCustomizer(cacheManager: JCacheCacheManager): HibernatePropertiesCustomizer {
		return HibernatePropertiesCustomizer { properties ->
			val cacheManager = cacheManager.cacheManager
			if (cacheManager != null) {
				properties[ConfigSettings.CACHE_MANAGER] = cacheManager
			}
		}
	}

}

```

This customizer will configure Hibernate to use the same [`CacheManager`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/cache/CacheManager.html) as the one that the application uses.
It is also possible to use separate [`CacheManager`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/cache/CacheManager.html) instances.
For details, see [the Hibernate user guide](https://docs.jboss.org/hibernate/orm/7.2/userguide/html_single/Hibernate_User_Guide.html#caching-provider-jcache).

<a id="howto.data-access.dependency-injection-in-hibernate-components"></a>

## Use Dependency Injection in Hibernate Components

By default, Spring Boot registers a [`BeanContainer`](https://docs.jboss.org/hibernate/orm/7.2/javadocs/org/hibernate/resource/beans/container/spi/BeanContainer.html) implementation that uses the [`BeanFactory`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/beans/factory/BeanFactory.html) so that converters and entity listeners can use regular dependency injection.

You can disable or tune this behavior by registering a [`HibernatePropertiesCustomizer`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/hibernate/autoconfigure/HibernatePropertiesCustomizer.html) that removes or changes the `hibernate.resource.beans.container` property.

<a id="howto.data-access.use-custom-entity-manager"></a>

## Use a Custom EntityManagerFactory

To take full control of the configuration of the [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html), you need to add a [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) named ‘entityManagerFactory’.
Spring Boot auto-configuration switches off its entity manager in the presence of a bean of that type.

> [!NOTE]
> When you create a bean for [`LocalContainerEntityManagerFactoryBean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/orm/jpa/LocalContainerEntityManagerFactoryBean.html) yourself, any customization that was applied during the creation of the auto-configured [`LocalContainerEntityManagerFactoryBean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/orm/jpa/LocalContainerEntityManagerFactoryBean.html) is lost.
> Make sure to use the auto-configured [`EntityManagerFactoryBuilder`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jpa/EntityManagerFactoryBuilder.html) to retain JPA and vendor properties.
> This is particularly important if you were relying on `spring.jpa.*` properties for configuring things like the naming strategy or the DDL mode.

<a id="howto.data-access.use-multiple-entity-managers"></a>

## Using Multiple EntityManagerFactories

If you need to use JPA against multiple datasources, you likely need one [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html) per datasource.
The [`LocalContainerEntityManagerFactoryBean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/orm/jpa/LocalContainerEntityManagerFactoryBean.html) from Spring ORM allows you to configure an [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html) for your needs.
You can also reuse [`JpaProperties`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jpa/autoconfigure/JpaProperties.html) to bind settings for a second [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html).
Building upon [the example for configuring a second [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html)](#howto.data-access.configure-two-datasources), a second [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html) can be defined as shown in the following example:

#### Java

```java
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Function;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jpa.EntityManagerFactoryBuilder;
import org.springframework.boot.jpa.autoconfigure.JpaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.JpaVendorAdapter;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;

@Configuration(proxyBeanMethods = false)
public class MyAdditionalEntityManagerFactoryConfiguration {

	@Qualifier("second")
	@Bean(defaultCandidate = false)
	@ConfigurationProperties("app.jpa")
	public JpaProperties secondJpaProperties() {
		return new JpaProperties();
	}

	@Qualifier("second")
	@Bean(defaultCandidate = false)
	public LocalContainerEntityManagerFactoryBean secondEntityManagerFactory(@Qualifier("second") DataSource dataSource,
			@Qualifier("second") JpaProperties jpaProperties) {
		EntityManagerFactoryBuilder builder = createEntityManagerFactoryBuilder(jpaProperties);
		return builder.dataSource(dataSource).packages(Order.class).persistenceUnit("second").build();
	}

	private EntityManagerFactoryBuilder createEntityManagerFactoryBuilder(JpaProperties jpaProperties) {
		JpaVendorAdapter jpaVendorAdapter = createJpaVendorAdapter(jpaProperties);
		Function<DataSource, Map<String, ?>> jpaPropertiesFactory = (dataSource) -> createJpaProperties(dataSource,
				jpaProperties.getProperties());
		return new EntityManagerFactoryBuilder(jpaVendorAdapter, jpaPropertiesFactory, null);
	}

	private JpaVendorAdapter createJpaVendorAdapter(JpaProperties jpaProperties) {
		// ... map JPA properties as needed
		return new HibernateJpaVendorAdapter();
	}

	private Map<String, ?> createJpaProperties(DataSource dataSource, Map<String, ?> existingProperties) {
		Map<String, ?> jpaProperties = new LinkedHashMap<>(existingProperties);
		// ... map JPA properties that require the DataSource (e.g. DDL flags)
		return jpaProperties;
	}

}
```

#### Kotlin

```kotlin
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.jpa.EntityManagerFactoryBuilder
import org.springframework.boot.jpa.autoconfigure.JpaProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.orm.jpa.JpaVendorAdapter
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter
import javax.sql.DataSource

@Configuration(proxyBeanMethods = false)
class MyAdditionalEntityManagerFactoryConfiguration {

	@Qualifier("second")
	@Bean(defaultCandidate = false)
	@ConfigurationProperties("app.jpa")
	fun secondJpaProperties(): JpaProperties {
		return JpaProperties()
	}

	@Qualifier("second")
	@Bean(defaultCandidate = false)
	fun secondEntityManagerFactory(
		@Qualifier("second") dataSource: DataSource,
		@Qualifier("second") jpaProperties: JpaProperties
	): LocalContainerEntityManagerFactoryBean {
		val builder = createEntityManagerFactoryBuilder(jpaProperties)
		return builder.dataSource(dataSource).packages(Order::class.java).persistenceUnit("second").build()
	}

	private fun createEntityManagerFactoryBuilder(jpaProperties: JpaProperties): EntityManagerFactoryBuilder {
		val jpaVendorAdapter = createJpaVendorAdapter(jpaProperties)
		val jpaPropertiesFactory = { dataSource: DataSource ->
				createJpaProperties(dataSource, jpaProperties.properties) }
		return EntityManagerFactoryBuilder(jpaVendorAdapter, jpaPropertiesFactory, null)
	}

	private fun createJpaVendorAdapter(jpaProperties: JpaProperties): JpaVendorAdapter {
		// ... map JPA properties as needed
		return HibernateJpaVendorAdapter()
	}

	private fun createJpaProperties(dataSource: DataSource, existingProperties: Map<String, *>): Map<String, *> {
		val jpaProperties: Map<String, *> = LinkedHashMap(existingProperties)
		// ... map JPA properties that require the DataSource (e.g. DDL flags)
		return jpaProperties
	}

}

```

The example above creates an [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html) using the [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) bean qualified with `@Qualifier("second")`.
It scans entities located in the same package as `Order`.
It is possible to map additional JPA properties using the `app.jpa` namespace.
The use of `@Bean(defaultCandidate=false)` allows the `secondJpaProperties` and `secondEntityManagerFactory` beans to be defined without interfering with auto-configured beans of the same type.

> [!NOTE]
> The [Spring Framework reference documentation](https://docs.spring.io/spring-framework/reference/7.0/core/beans/dependencies/factory-autowire.html#beans-factory-autowire-candidate) describes this feature in more details.

You should provide a similar configuration for any more additional data sources for which you need JPA access.
To complete the picture, you need to configure a [`JpaTransactionManager`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/orm/jpa/JpaTransactionManager.html) for each [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html) as well.
Alternatively, you might be able to use a JTA transaction manager that spans both.

If you use Spring Data, you need to configure [`@EnableJpaRepositories`](https://docs.spring.io/spring-data/jpa/docs/4.0.x/api/org/springframework/data/jpa/repository/config/EnableJpaRepositories.html) accordingly, as shown in the following examples:

#### Java

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration(proxyBeanMethods = false)
@EnableJpaRepositories(basePackageClasses = Order.class, entityManagerFactoryRef = "entityManagerFactory")
public class OrderConfiguration {

}
```

#### Kotlin

```kotlin
import org.springframework.context.annotation.Configuration
import org.springframework.data.jpa.repository.config.EnableJpaRepositories

@Configuration(proxyBeanMethods = false)
@EnableJpaRepositories(basePackageClasses = [Order::class], entityManagerFactoryRef = "entityManagerFactory")
class OrderConfiguration

```

#### Java

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration(proxyBeanMethods = false)
@EnableJpaRepositories(basePackageClasses = Customer.class, entityManagerFactoryRef = "secondEntityManagerFactory")
public class CustomerConfiguration {

}
```

#### Kotlin

```kotlin
import org.springframework.context.annotation.Configuration
import org.springframework.data.jpa.repository.config.EnableJpaRepositories

@Configuration(proxyBeanMethods = false)
@EnableJpaRepositories(basePackageClasses = [Customer::class], entityManagerFactoryRef = "secondEntityManagerFactory")
class CustomerConfiguration

```

<a id="howto.data-access.use-traditional-persistence-xml"></a>

## Use a Traditional persistence.xml File

Spring Boot will not search for or use a `META-INF/persistence.xml` by default.
If you prefer to use a traditional `persistence.xml`, you need to define your own [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) of type [`LocalEntityManagerFactoryBean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/orm/jpa/LocalEntityManagerFactoryBean.html) (with an ID of ‘entityManagerFactory’) and set the persistence unit name there.

See [`JpaBaseConfiguration`](https://github.com/spring-projects/spring-boot/tree/v4.0.2/module/spring-boot-jpa/src/main/java/org/springframework/boot/jpa/autoconfigure/JpaBaseConfiguration.java) for the default settings.

<a id="howto.data-access.use-spring-data-jpa-and-mongo-repositories"></a>

## Use Spring Data JPA and Mongo Repositories

Spring Data JPA and Spring Data Mongo can both automatically create [`Repository`](https://docs.spring.io/spring-data/commons/docs/4.0.x/api/org/springframework/data/repository/Repository.html) implementations for you.
If they are both present on the classpath, you might have to do some extra configuration to tell Spring Boot which repositories to create.
The most explicit way to do that is to use the standard Spring Data [`@EnableJpaRepositories`](https://docs.spring.io/spring-data/jpa/docs/4.0.x/api/org/springframework/data/jpa/repository/config/EnableJpaRepositories.html) and [`@EnableMongoRepositories`](https://docs.spring.io/spring-data/mongodb/docs/5.0.x/api/org/springframework/data/mongodb/repository/config/EnableMongoRepositories.html) annotations and provide the location of your [`Repository`](https://docs.spring.io/spring-data/commons/docs/4.0.x/api/org/springframework/data/repository/Repository.html) interfaces.

There are also flags (`spring.data.*.repositories.enabled` and `spring.data.*.repositories.type`) that you can use to switch the auto-configured repositories on and off in external configuration.
Doing so is useful, for instance, in case you want to switch off the Mongo repositories and still use the auto-configured [`MongoTemplate`](https://docs.spring.io/spring-data/mongodb/docs/5.0.x/api/org/springframework/data/mongodb/core/MongoTemplate.html).

The same obstacle and the same features exist for other auto-configured Spring Data repository types (Elasticsearch, Redis, and others).
To work with them, change the names of the annotations and flags accordingly.

<a id="howto.data-access.customize-spring-data-web-support"></a>

## Customize Spring Data’s Web Support

Spring Data provides web support that simplifies the use of Spring Data repositories in a web application.
Spring Boot provides properties in the `spring.data.web` namespace for customizing its configuration.
Note that if you are using Spring Data REST, you must use the properties in the `spring.data.rest` namespace instead.

<a id="howto.data-access.exposing-spring-data-repositories-as-rest"></a>

## Expose Spring Data Repositories as REST Endpoint

Spring Data REST can expose the [`Repository`](https://docs.spring.io/spring-data/commons/docs/4.0.x/api/org/springframework/data/repository/Repository.html) implementations as REST endpoints for you,
provided Spring MVC has been enabled for the application.

Spring Boot exposes a set of useful properties (from the `spring.data.rest` namespace) that customize the [`RepositoryRestConfiguration`](https://docs.spring.io/spring-data/rest/docs/5.0.x/api/org/springframework/data/rest/core/config/RepositoryRestConfiguration.html).
If you need to provide additional customization, you should use a [`RepositoryRestConfigurer`](https://docs.spring.io/spring-data/rest/docs/5.0.x/api/org/springframework/data/rest/webmvc/config/RepositoryRestConfigurer.html) bean.

> [!NOTE]
> If you do not specify any order on your custom [`RepositoryRestConfigurer`](https://docs.spring.io/spring-data/rest/docs/5.0.x/api/org/springframework/data/rest/webmvc/config/RepositoryRestConfigurer.html), it runs after the one Spring Boot uses internally.
> If you need to specify an order, make sure it is higher than 0.

<a id="howto.data-access.configure-a-component-that-is-used-by-jpa"></a>

## Configure a Component that is Used by JPA

If you want to configure a component that JPA uses, then you need to ensure that the component is initialized before JPA.
When the component is auto-configured, Spring Boot takes care of this for you.
For example, when Flyway is auto-configured, Hibernate is configured to depend on Flyway so that Flyway has a chance to initialize the database before Hibernate tries to use it.

If you are configuring a component yourself, you can use an [`EntityManagerFactoryDependsOnPostProcessor`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jpa/autoconfigure/EntityManagerFactoryDependsOnPostProcessor.html) subclass as a convenient way of setting up the necessary dependencies.
For example, if you use Hibernate Search with Elasticsearch as its index manager, any [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html) beans must be configured to depend on the `elasticsearchClient` bean, as shown in the following example:

#### Java

```java
import jakarta.persistence.EntityManagerFactory;

import org.springframework.boot.jpa.autoconfigure.EntityManagerFactoryDependsOnPostProcessor;
import org.springframework.stereotype.Component;

/**
 * {@link EntityManagerFactoryDependsOnPostProcessor} that ensures that
 * {@link EntityManagerFactory} beans depend on the {@code elasticsearchClient} bean.
 */
@Component
public class ElasticsearchEntityManagerFactoryDependsOnPostProcessor
		extends EntityManagerFactoryDependsOnPostProcessor {

	public ElasticsearchEntityManagerFactoryDependsOnPostProcessor() {
		super("elasticsearchClient");
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.jpa.autoconfigure.EntityManagerFactoryDependsOnPostProcessor
import org.springframework.stereotype.Component

@Component
class ElasticsearchEntityManagerFactoryDependsOnPostProcessor :
	EntityManagerFactoryDependsOnPostProcessor("elasticsearchClient")

```

<a id="howto.data-access.configure-jooq-with-multiple-datasources"></a>

## Configure jOOQ with Two DataSources

If you need to use jOOQ with multiple data sources, you should create your own [`DSLContext`](https://www.jooq.org/javadoc/3.19.29/org/jooq/DSLContext.html) for each one.
See [`JooqAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v4.0.2/module/spring-boot-jooq/src/main/java/org/springframework/boot/jooq/autoconfigure/JooqAutoConfiguration.java) for more details.

> [!TIP]
> In particular, [`ExceptionTranslatorExecuteListener`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jooq/autoconfigure/ExceptionTranslatorExecuteListener.html) and [`SpringTransactionProvider`](https://docs.spring.io/spring-boot/4.0.2/api/java/org/springframework/boot/jooq/autoconfigure/SpringTransactionProvider.html) can be reused to provide similar features to what the auto-configuration does with a single [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html).
