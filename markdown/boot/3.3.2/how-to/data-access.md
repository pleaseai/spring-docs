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

To configure your own `DataSource`, define a `@Bean` of that type in your configuration.
Spring Boot reuses your `DataSource` anywhere one is required, including database initialization.
If you need to externalize some settings, you can bind your `DataSource` to the environment (see [reference:features/external-config.adoc#features.external-config.typesafe-configuration-properties.third-party-configuration](../reference/features/external-config.md#features.external-config.typesafe-configuration-properties.third-party-configuration)).

The following example shows how to define a data source in a bean:

#### Java

```java
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyDataSourceConfiguration {

	@Bean
	@ConfigurationProperties(prefix = "app.datasource")
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
	@ConfigurationProperties(prefix = "app.datasource")
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

Assuming that `SomeDataSource` has regular JavaBean properties for the URL, the username, and the pool size, these settings are bound automatically before the `DataSource` is made available to other components.

Spring Boot also provides a utility builder class, called `DataSourceBuilder`, that can be used to create one of the standard data sources (if it is on the classpath).
The builder can detect which one to use based on what is available on the classpath.
It also auto-detects the driver based on the JDBC URL.

The following example shows how to create a data source by using a `DataSourceBuilder`:

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

To run an app with that `DataSource`, all you need is the connection information.
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

However, there is a catch.
Because the actual type of the connection pool is not exposed, no keys are generated in the metadata for your custom `DataSource` and no completion is available in your IDE (because the `DataSource` interface exposes no properties).
Also, if you happen to have Hikari on the classpath, this basic setup does not work, because Hikari has no `url` property (but does have a `jdbcUrl` property).
In that case, you must rewrite your configuration as follows:

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

You can fix that by forcing the connection pool to use and return a dedicated implementation rather than `DataSource`.
You cannot change the implementation at runtime, but the list of options will be explicit.

The following example shows how to create a `HikariDataSource` with `DataSourceBuilder`:

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

You can even go further by leveraging what `DataSourceProperties` does for you — that is, by providing a default embedded database with a sensible username and password if no URL is provided.
You can easily initialize a `DataSourceBuilder` from the state of any `DataSourceProperties` object, so you could also inject the DataSource that Spring Boot creates automatically.
However, that would split your configuration into two namespaces: `url`, `username`, `password`, `type`, and `driver` on `spring.datasource` and the rest on your custom namespace (`app.datasource`).
To avoid that, you can redefine a custom `DataSourceProperties` on your custom namespace, as shown in the following example:

#### Java

```java
import com.zaxxer.hikari.HikariDataSource;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
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
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties
import org.springframework.boot.context.properties.ConfigurationProperties
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

This setup puts you *in sync* with what Spring Boot does for you by default, except that a dedicated connection pool is chosen (in code) and its settings are exposed in the `app.datasource.configuration` sub namespace.
Because `DataSourceProperties` is taking care of the `url`/`jdbcUrl` translation for you, you can configure it as follows:

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

> [!TIP]
> Spring Boot will expose Hikari-specific settings to `spring.datasource.hikari`.
> This example uses a more generic `configuration` sub namespace as the example does not support multiple datasource implementations.

> [!NOTE]
> Because your custom configuration chooses to go with Hikari, `app.datasource.type` has no effect.
> In practice, the builder is initialized with whatever value you might set there and then overridden by the call to `.type()`.

See [reference:data/sql.adoc#data.sql.datasource](../reference/data/sql.md#data.sql.datasource) in the “Spring Boot Features” section and the [`DataSourceAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.3.2/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/jdbc/DataSourceAutoConfiguration.java) class for more details.

<a id="howto.data-access.configure-two-datasources"></a>

## Configure Two DataSources

If you need to configure multiple data sources, you can apply the same tricks that were described in the previous section.
You must, however, mark one of the `DataSource` instances as `@Primary`, because various auto-configurations down the road expect to be able to get one by type.

If you create your own `DataSource`, the auto-configuration backs off.
In the following example, we provide the *exact* same feature set as the auto-configuration provides on the primary data source:

#### Java

```java
import com.zaxxer.hikari.HikariDataSource;
import org.apache.commons.dbcp2.BasicDataSource;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration(proxyBeanMethods = false)
public class MyDataSourcesConfiguration {

	@Bean
	@Primary
	@ConfigurationProperties("app.datasource.first")
	public DataSourceProperties firstDataSourceProperties() {
		return new DataSourceProperties();
	}

	@Bean
	@Primary
	@ConfigurationProperties("app.datasource.first.configuration")
	public HikariDataSource firstDataSource(DataSourceProperties firstDataSourceProperties) {
		return firstDataSourceProperties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
	}

	@Bean
	@ConfigurationProperties("app.datasource.second")
	public BasicDataSource secondDataSource() {
		return DataSourceBuilder.create().type(BasicDataSource.class).build();
	}

}
```

#### Kotlin

```kotlin
import com.zaxxer.hikari.HikariDataSource
import org.apache.commons.dbcp2.BasicDataSource
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.jdbc.DataSourceBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary

@Configuration(proxyBeanMethods = false)
class MyDataSourcesConfiguration {

	@Bean
	@Primary
	@ConfigurationProperties("app.datasource.first")
	fun firstDataSourceProperties(): DataSourceProperties {
		return DataSourceProperties()
	}

	@Bean
	@Primary
	@ConfigurationProperties("app.datasource.first.configuration")
	fun firstDataSource(firstDataSourceProperties: DataSourceProperties): HikariDataSource {
		return firstDataSourceProperties.initializeDataSourceBuilder().type(HikariDataSource::class.java).build()
	}

	@Bean
	@ConfigurationProperties("app.datasource.second")
	fun secondDataSource(): BasicDataSource {
		return DataSourceBuilder.create().type(BasicDataSource::class.java).build()
	}

}
```

> [!TIP]
> `firstDataSourceProperties` has to be flagged as `@Primary` so that the database initializer feature uses your copy (if you use the initializer).

Both data sources are also bound for advanced customizations.
For instance, you could configure them as follows:

#### Properties

```properties
app.datasource.first.url=jdbc:mysql://localhost/first
app.datasource.first.username=dbuser
app.datasource.first.password=dbpass
app.datasource.first.configuration.maximum-pool-size=30
app.datasource.second.url=jdbc:mysql://localhost/second
app.datasource.second.username=dbuser
app.datasource.second.password=dbpass
app.datasource.second.max-total=30
```

#### YAML

```yaml
app:
  datasource:
    first:
      url: "jdbc:mysql://localhost/first"
      username: "dbuser"
      password: "dbpass"
      configuration:
        maximum-pool-size: 30

    second:
      url: "jdbc:mysql://localhost/second"
      username: "dbuser"
      password: "dbpass"
      max-total: 30
```

You can apply the same concept to the secondary `DataSource` as well, as shown in the following example:

#### Java

```java
import com.zaxxer.hikari.HikariDataSource;
import org.apache.commons.dbcp2.BasicDataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration(proxyBeanMethods = false)
public class MyCompleteDataSourcesConfiguration {

	@Bean
	@Primary
	@ConfigurationProperties("app.datasource.first")
	public DataSourceProperties firstDataSourceProperties() {
		return new DataSourceProperties();
	}

	@Bean
	@Primary
	@ConfigurationProperties("app.datasource.first.configuration")
	public HikariDataSource firstDataSource(DataSourceProperties firstDataSourceProperties) {
		return firstDataSourceProperties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
	}

	@Bean
	@ConfigurationProperties("app.datasource.second")
	public DataSourceProperties secondDataSourceProperties() {
		return new DataSourceProperties();
	}

	@Bean
	@ConfigurationProperties("app.datasource.second.configuration")
	public BasicDataSource secondDataSource(
			@Qualifier("secondDataSourceProperties") DataSourceProperties secondDataSourceProperties) {
		return secondDataSourceProperties.initializeDataSourceBuilder().type(BasicDataSource.class).build();
	}

}
```

#### Kotlin

```kotlin
import com.zaxxer.hikari.HikariDataSource
import org.apache.commons.dbcp2.BasicDataSource
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary

@Configuration(proxyBeanMethods = false)
class MyCompleteDataSourcesConfiguration {

	@Bean
	@Primary
	@ConfigurationProperties("app.datasource.first")
	fun firstDataSourceProperties(): DataSourceProperties {
		return DataSourceProperties()
	}

	@Bean
	@Primary
	@ConfigurationProperties("app.datasource.first.configuration")
	fun firstDataSource(firstDataSourceProperties: DataSourceProperties): HikariDataSource {
		return firstDataSourceProperties.initializeDataSourceBuilder().type(HikariDataSource::class.java).build()
	}

	@Bean
	@ConfigurationProperties("app.datasource.second")
	fun secondDataSourceProperties(): DataSourceProperties {
		return DataSourceProperties()
	}

	@Bean
	@ConfigurationProperties("app.datasource.second.configuration")
	fun secondDataSource(secondDataSourceProperties: DataSourceProperties): BasicDataSource {
		return secondDataSourceProperties.initializeDataSourceBuilder().type(BasicDataSource::class.java).build()
	}

}
```

The preceding example configures two data sources on custom namespaces with the same logic as Spring Boot would use in auto-configuration.
Note that each `configuration` sub namespace provides advanced settings based on the chosen implementation.

<a id="howto.data-access.spring-data-repositories"></a>

## Use Spring Data Repositories

Spring Data can create implementations of `@Repository` interfaces of various flavors.
Spring Boot handles all of that for you, as long as those `@Repository` annotations are included in one of the [auto-configuration packages](../reference/using/auto-configuration.md#using.auto-configuration.packages), typically the package (or a sub-package) of your main application class that is annotated with `@SpringBootApplication` or `@EnableAutoConfiguration`.

For many applications, all you need is to put the right Spring Data dependencies on your classpath.
There is a `spring-boot-starter-data-jpa` for JPA, `spring-boot-starter-data-mongodb` for Mongodb, and various other starters for supported technologies.
To get started, create some repository interfaces to handle your `@Entity` objects.

Spring Boot determines the location of your `@Repository` definitions by scanning the [auto-configuration packages](../reference/using/auto-configuration.md#using.auto-configuration.packages).
For more control, use the `@Enable…Repositories` annotations from Spring Data.

For more about Spring Data, see the [Spring Data project page](https://spring.io/projects/spring-data).

<a id="howto.data-access.separate-entity-definitions-from-spring-configuration"></a>

## Separate @Entity Definitions from Spring Configuration

Spring Boot determines the location of your `@Entity` definitions by scanning the [auto-configuration packages](../reference/using/auto-configuration.md#using.auto-configuration.packages).
For more control, use the `@EntityScan` annotation, as shown in the following example:

#### Java

```java
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
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
import org.springframework.boot.autoconfigure.domain.EntityScan
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

It is possible to filter the `@Entity` definitions using a `ManagedClassNameFilter` bean.
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
		return (className) -> className.startsWith("com.example.app.customer");
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
			className.startsWith("com.example.app.customer")
		}
	}
}
```

<a id="howto.data-access.jpa-properties"></a>

## Configure JPA Properties

Spring Data JPA already provides some vendor-independent configuration options (such as those for SQL logging), and Spring Boot exposes those options and a few more for Hibernate as external configuration properties.
Some of them are automatically detected according to the context so you should not have to set them.

The `spring.jpa.hibernate.ddl-auto` is a special case, because, depending on runtime conditions, it has different defaults.
If an embedded database is used and no schema manager (such as Liquibase or Flyway) is handling the `DataSource`, it defaults to `create-drop`.
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

In addition, all properties in `spring.jpa.properties.*` are passed through as normal JPA properties (with the prefix stripped) when the local `EntityManagerFactory` is created.

> [!WARNING]
> You need to ensure that names defined under `spring.jpa.properties.*` exactly match those expected by your JPA provider.
> Spring Boot will not attempt any kind of relaxed binding for these entries.
>
> For example, if you want to configure Hibernate’s batch size you must use `spring.jpa.properties.hibernate.jdbc.batch_size`.
> If you use other forms, such as `batchSize` or `batch-size`, Hibernate will not apply the setting.

> [!TIP]
> If you need to apply advanced customization to Hibernate properties, consider registering a `HibernatePropertiesCustomizer` bean that will be invoked prior to creating the `EntityManagerFactory`.
> This takes precedence over anything that is applied by the auto-configuration.

<a id="howto.data-access.configure-hibernate-naming-strategy"></a>

## Configure Hibernate Naming Strategy

Hibernate uses [two different naming strategies](https://docs.jboss.org/hibernate/orm/6.5/userguide/html_single/Hibernate_User_Guide.html#naming) to map names from the object model to the corresponding database names.
The fully qualified class name of the physical and the implicit strategy implementations can be configured by setting the `spring.jpa.hibernate.naming.physical-strategy` and `spring.jpa.hibernate.naming.implicit-strategy` properties, respectively.
Alternatively, if `ImplicitNamingStrategy` or `PhysicalNamingStrategy` beans are available in the application context, Hibernate will be automatically configured to use them.

By default, Spring Boot configures the physical naming strategy with `CamelCaseToUnderscoresNamingStrategy`.
Using this strategy, all dots are replaced by underscores and camel casing is replaced by underscores as well.
Additionally, by default, all table names are generated in lower case.
For example, a `TelephoneNumber` entity is mapped to the `telephone_number` table.
If your schema requires mixed-case identifiers, define a custom `CamelCaseToUnderscoresNamingStrategy` bean, as shown in the following example:

#### Java

```java
import org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy;
import org.hibernate.engine.jdbc.env.spi.JdbcEnvironment;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyHibernateConfiguration {

	@Bean
	public CamelCaseToUnderscoresNamingStrategy caseSensitivePhysicalNamingStrategy() {
		return new CamelCaseToUnderscoresNamingStrategy() {

			@Override
			protected boolean isCaseInsensitive(JdbcEnvironment jdbcEnvironment) {
				return false;
			}

		};
	}

}
```

#### Kotlin

```kotlin
import org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy
import org.hibernate.engine.jdbc.env.spi.JdbcEnvironment
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyHibernateConfiguration {

	@Bean
	fun caseSensitivePhysicalNamingStrategy(): CamelCaseToUnderscoresNamingStrategy {
		return object : CamelCaseToUnderscoresNamingStrategy() {
			override fun isCaseInsensitive(jdbcEnvironment: JdbcEnvironment): Boolean {
				return false
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

See [`HibernateJpaAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.3.2/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/orm/jpa/HibernateJpaAutoConfiguration.java) and [`JpaBaseConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.3.2/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/orm/jpa/JpaBaseConfiguration.java) for more details.

<a id="howto.data-access.configure-hibernate-second-level-caching"></a>

## Configure Hibernate Second-Level Caching

Hibernate [second-level cache](https://docs.jboss.org/hibernate/orm/6.5/userguide/html_single/Hibernate_User_Guide.html#caching) can be configured for a range of cache providers.
Rather than configuring Hibernate to lookup the cache provider again, it is better to provide the one that is available in the context whenever possible.

To do this with JCache, first make sure that `org.hibernate.orm:hibernate-jcache` is available on the classpath.
Then, add a `HibernatePropertiesCustomizer` bean as shown in the following example:

#### Java

```java
import org.hibernate.cache.jcache.ConfigSettings;

import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
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
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer
import org.springframework.cache.jcache.JCacheCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyHibernateSecondLevelCacheConfiguration {

	@Bean
	fun hibernateSecondLevelCacheCustomizer(cacheManager: JCacheCacheManager): HibernatePropertiesCustomizer {
		return HibernatePropertiesCustomizer { properties ->
			properties[ConfigSettings.CACHE_MANAGER] = cacheManager.cacheManager
		}
	}

}
```

This customizer will configure Hibernate to use the same `CacheManager` as the one that the application uses.
It is also possible to use separate `CacheManager` instances.
For details, see [the Hibernate user guide](https://docs.jboss.org/hibernate/orm/6.5/userguide/html_single/Hibernate_User_Guide.html#caching-provider-jcache).

<a id="howto.data-access.dependency-injection-in-hibernate-components"></a>

## Use Dependency Injection in Hibernate Components

By default, Spring Boot registers a `BeanContainer` implementation that uses the `BeanFactory` so that converters and entity listeners can use regular dependency injection.

You can disable or tune this behavior by registering a `HibernatePropertiesCustomizer` that removes or changes the `hibernate.resource.beans.container` property.

<a id="howto.data-access.use-custom-entity-manager"></a>

## Use a Custom EntityManagerFactory

To take full control of the configuration of the `EntityManagerFactory`, you need to add a `@Bean` named ‘entityManagerFactory’.
Spring Boot auto-configuration switches off its entity manager in the presence of a bean of that type.

<a id="howto.data-access.use-multiple-entity-managers"></a>

## Using Multiple EntityManagerFactories

If you need to use JPA against multiple data sources, you likely need one `EntityManagerFactory` per data source.
The `LocalContainerEntityManagerFactoryBean` from Spring ORM allows you to configure an `EntityManagerFactory` for your needs.
You can also reuse `JpaProperties` to bind settings for each `EntityManagerFactory`, as shown in the following example:

#### Java

```java
import javax.sql.DataSource;

import org.springframework.boot.autoconfigure.orm.jpa.JpaProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.JpaVendorAdapter;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;

@Configuration(proxyBeanMethods = false)
public class MyEntityManagerFactoryConfiguration {

	@Bean
	@ConfigurationProperties("app.jpa.first")
	public JpaProperties firstJpaProperties() {
		return new JpaProperties();
	}

	@Bean
	public LocalContainerEntityManagerFactoryBean firstEntityManagerFactory(DataSource firstDataSource,
			JpaProperties firstJpaProperties) {
		EntityManagerFactoryBuilder builder = createEntityManagerFactoryBuilder(firstJpaProperties);
		return builder.dataSource(firstDataSource).packages(Order.class).persistenceUnit("firstDs").build();
	}

	private EntityManagerFactoryBuilder createEntityManagerFactoryBuilder(JpaProperties jpaProperties) {
		JpaVendorAdapter jpaVendorAdapter = createJpaVendorAdapter(jpaProperties);
		return new EntityManagerFactoryBuilder(jpaVendorAdapter, jpaProperties.getProperties(), null);
	}

	private JpaVendorAdapter createJpaVendorAdapter(JpaProperties jpaProperties) {
		// ... map JPA properties as needed
		return new HibernateJpaVendorAdapter();
	}

}
```

#### Kotlin

```kotlin
import javax.sql.DataSource

import org.springframework.boot.autoconfigure.orm.jpa.JpaProperties
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.orm.jpa.JpaVendorAdapter
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter

@Configuration(proxyBeanMethods = false)
class MyEntityManagerFactoryConfiguration {

	@Bean
	@ConfigurationProperties("app.jpa.first")
	fun firstJpaProperties(): JpaProperties {
		return JpaProperties()
	}

	@Bean
	fun firstEntityManagerFactory(
		firstDataSource: DataSource?,
		firstJpaProperties: JpaProperties
	): LocalContainerEntityManagerFactoryBean {
		val builder = createEntityManagerFactoryBuilder(firstJpaProperties)
		return builder.dataSource(firstDataSource).packages(Order::class.java).persistenceUnit("firstDs").build()
	}

	private fun createEntityManagerFactoryBuilder(jpaProperties: JpaProperties): EntityManagerFactoryBuilder {
		val jpaVendorAdapter = createJpaVendorAdapter(jpaProperties)
		return EntityManagerFactoryBuilder(jpaVendorAdapter, jpaProperties.properties, null)
	}

	private fun createJpaVendorAdapter(jpaProperties: JpaProperties): JpaVendorAdapter {
		// ... map JPA properties as needed
		return HibernateJpaVendorAdapter()
	}

}
```

The example above creates an `EntityManagerFactory` using a `DataSource` bean named `firstDataSource`.
It scans entities located in the same package as `Order`.
It is possible to map additional JPA properties using the `app.first.jpa` namespace.

> [!NOTE]
> When you create a bean for `LocalContainerEntityManagerFactoryBean` yourself, any customization that was applied during the creation of the auto-configured `LocalContainerEntityManagerFactoryBean` is lost.
> For example, in the case of Hibernate, any properties under the `spring.jpa.hibernate` prefix will not be automatically applied to your `LocalContainerEntityManagerFactoryBean`.
> If you were relying on these properties for configuring things like the naming strategy or the DDL mode, you will need to explicitly configure that when creating the `LocalContainerEntityManagerFactoryBean` bean.

You should provide a similar configuration for any additional data sources for which you need JPA access.
To complete the picture, you need to configure a `JpaTransactionManager` for each `EntityManagerFactory` as well.
Alternatively, you might be able to use a JTA transaction manager that spans both.

If you use Spring Data, you need to configure `@EnableJpaRepositories` accordingly, as shown in the following examples:

#### Java

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration(proxyBeanMethods = false)
@EnableJpaRepositories(basePackageClasses = Order.class, entityManagerFactoryRef = "firstEntityManagerFactory")
public class OrderConfiguration {

}
```

#### Kotlin

```kotlin
import org.springframework.context.annotation.Configuration
import org.springframework.data.jpa.repository.config.EnableJpaRepositories

@Configuration(proxyBeanMethods = false)
@EnableJpaRepositories(basePackageClasses = [Order::class], entityManagerFactoryRef = "firstEntityManagerFactory")
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
If you prefer to use a traditional `persistence.xml`, you need to define your own `@Bean` of type `LocalEntityManagerFactoryBean` (with an ID of ‘entityManagerFactory’) and set the persistence unit name there.

See [`JpaBaseConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.3.2/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/orm/jpa/JpaBaseConfiguration.java) for the default settings.

<a id="howto.data-access.use-spring-data-jpa-and-mongo-repositories"></a>

## Use Spring Data JPA and Mongo Repositories

Spring Data JPA and Spring Data Mongo can both automatically create `Repository` implementations for you.
If they are both present on the classpath, you might have to do some extra configuration to tell Spring Boot which repositories to create.
The most explicit way to do that is to use the standard Spring Data `@EnableJpaRepositories` and `@EnableMongoRepositories` annotations and provide the location of your `Repository` interfaces.

There are also flags (`spring.data.*.repositories.enabled` and `spring.data.*.repositories.type`) that you can use to switch the auto-configured repositories on and off in external configuration.
Doing so is useful, for instance, in case you want to switch off the Mongo repositories and still use the auto-configured `MongoTemplate`.

The same obstacle and the same features exist for other auto-configured Spring Data repository types (Elasticsearch, Redis, and others).
To work with them, change the names of the annotations and flags accordingly.

<a id="howto.data-access.customize-spring-data-web-support"></a>

## Customize Spring Data’s Web Support

Spring Data provides web support that simplifies the use of Spring Data repositories in a web application.
Spring Boot provides properties in the `spring.data.web` namespace for customizing its configuration.
Note that if you are using Spring Data REST, you must use the properties in the `spring.data.rest` namespace instead.

<a id="howto.data-access.exposing-spring-data-repositories-as-rest"></a>

## Expose Spring Data Repositories as REST Endpoint

Spring Data REST can expose the `Repository` implementations as REST endpoints for you,
provided Spring MVC has been enabled for the application.

Spring Boot exposes a set of useful properties (from the `spring.data.rest` namespace) that customize the [`RepositoryRestConfiguration`](https://docs.spring.io/spring-data/rest/docs/4.3.2/api/org/springframework/data/rest/core/config/RepositoryRestConfiguration.html).
If you need to provide additional customization, you should use a [`RepositoryRestConfigurer`](https://docs.spring.io/spring-data/rest/docs/4.3.2/api/org/springframework/data/rest/webmvc/config/RepositoryRestConfigurer.html) bean.

> [!NOTE]
> If you do not specify any order on your custom `RepositoryRestConfigurer`, it runs after the one Spring Boot uses internally.
> If you need to specify an order, make sure it is higher than 0.

<a id="howto.data-access.configure-a-component-that-is-used-by-jpa"></a>

## Configure a Component that is Used by JPA

If you want to configure a component that JPA uses, then you need to ensure that the component is initialized before JPA.
When the component is auto-configured, Spring Boot takes care of this for you.
For example, when Flyway is auto-configured, Hibernate is configured to depend on Flyway so that Flyway has a chance to initialize the database before Hibernate tries to use it.

If you are configuring a component yourself, you can use an `EntityManagerFactoryDependsOnPostProcessor` subclass as a convenient way of setting up the necessary dependencies.
For example, if you use Hibernate Search with Elasticsearch as its index manager, any `EntityManagerFactory` beans must be configured to depend on the `elasticsearchClient` bean, as shown in the following example:

#### Java

```java
import jakarta.persistence.EntityManagerFactory;

import org.springframework.boot.autoconfigure.orm.jpa.EntityManagerFactoryDependsOnPostProcessor;
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
import org.springframework.boot.autoconfigure.orm.jpa.EntityManagerFactoryDependsOnPostProcessor
import org.springframework.stereotype.Component

@Component
class ElasticsearchEntityManagerFactoryDependsOnPostProcessor :
	EntityManagerFactoryDependsOnPostProcessor("elasticsearchClient")
```

<a id="howto.data-access.configure-jooq-with-multiple-datasources"></a>

## Configure jOOQ with Two DataSources

If you need to use jOOQ with multiple data sources, you should create your own `DSLContext` for each one.
See [`JooqAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.3.2/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/jooq/JooqAutoConfiguration.java) for more details.

> [!TIP]
> In particular, `JooqExceptionTranslator` and `SpringTransactionProvider` can be reused to provide similar features to what the auto-configuration does with a single `DataSource`.
