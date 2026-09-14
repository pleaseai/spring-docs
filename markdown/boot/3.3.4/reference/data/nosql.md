---
title: "Working with NoSQL Technologies"
source: "reference:data/nosql.adoc"
---

<a id="data.nosql"></a>

# Working with NoSQL Technologies

Spring Data provides additional projects that help you access a variety of NoSQL technologies, including:

- [Cassandra](https://spring.io/projects/spring-data-cassandra)
- [Couchbase](https://spring.io/projects/spring-data-couchbase)
- [Elasticsearch](https://spring.io/projects/spring-data-elasticsearch)
- [GemFire](https://spring.io/projects/spring-data-gemfire) or [Geode](https://spring.io/projects/spring-data-geode)
- [LDAP](https://spring.io/projects/spring-data-ldap)
- [MongoDB](https://spring.io/projects/spring-data-mongodb)
- [Neo4J](https://spring.io/projects/spring-data-neo4j)
- [Redis](https://spring.io/projects/spring-data-redis)

Of these, Spring Boot provides auto-configuration for Cassandra, Couchbase, Elasticsearch, LDAP, MongoDB, Neo4J and Redis.
Additionally, [Spring Boot for Apache Geode](https://github.com/spring-projects/spring-boot-data-geode) provides [auto-configuration for Apache Geode](https://docs.spring.io/spring-boot-data-geode-build/2.0.x/reference/html5#geode-repositories).
You can make use of the other projects, but you must configure them yourself.
See the appropriate reference documentation at [spring.io/projects/spring-data](https://spring.io/projects/spring-data).

Spring Boot also provides auto-configuration for the InfluxDB client but it is deprecated in favor of [the new InfluxDB Java client](https://github.com/influxdata/influxdb-client-java) that provides its own Spring Boot integration.

<a id="data.nosql.redis"></a>

## Redis

[Redis](https://redis.io/) is a cache, message broker, and richly-featured key-value store.
Spring Boot offers basic auto-configuration for the [Lettuce](https://github.com/lettuce-io/lettuce-core/) and [Jedis](https://github.com/xetorthio/jedis/) client libraries and the abstractions on top of them provided by [Spring Data Redis](https://github.com/spring-projects/spring-data-redis).

There is a `spring-boot-starter-data-redis` starter for collecting the dependencies in a convenient way.
By default, it uses [Lettuce](https://github.com/lettuce-io/lettuce-core/).
That starter handles both traditional and reactive applications.

> [!TIP]
> We also provide a `spring-boot-starter-data-redis-reactive` starter for consistency with the other stores with reactive support.

<a id="data.nosql.redis.connecting"></a>

### Connecting to Redis

You can inject an auto-configured `RedisConnectionFactory`, `StringRedisTemplate`, or vanilla `RedisTemplate` instance as you would any other Spring Bean.
The following listing shows an example of such a bean:

#### Java

```java
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final StringRedisTemplate template;

	public MyBean(StringRedisTemplate template) {
		this.template = template;
	}
	public Boolean someMethod() {
		return this.template.hasKey("spring");
	}
}
```

#### Kotlin

```kotlin
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Component

@Component
class MyBean(private val template: StringRedisTemplate) {
	fun someMethod(): Boolean {
		return template.hasKey("spring")
	}
}
```

By default, the instance tries to connect to a Redis server at `localhost:6379`.
You can specify custom connection details using `spring.data.redis.*` properties, as shown in the following example:

#### Properties

```properties
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.database=0
spring.data.redis.username=user
spring.data.redis.password=secret
```

#### YAML

```yaml
spring:
  data:
    redis:
      host: "localhost"
      port: 6379
      database: 0
      username: "user"
      password: "secret"
```

You can also specify the url of the Redis server directly.
When setting the url, the host, port, username and password properties are ignored.
This is shown in the following example:

#### Properties

```properties
spring.data.redis.url=redis://user:secret@localhost:6379
spring.data.redis.database=0
```

#### YAML

```yaml
spring:
  data:
    redis:
      url: "redis://user:secret@localhost:6379"
      database: 0
```

> [!TIP]
> You can also register an arbitrary number of beans that implement `LettuceClientConfigurationBuilderCustomizer` for more advanced customizations.
> `ClientResources` can also be customized using `ClientResourcesBuilderCustomizer`.
> If you use Jedis, `JedisClientConfigurationBuilderCustomizer` is also available.
> Alternatively, you can register a bean of type `RedisStandaloneConfiguration`, `RedisSentinelConfiguration`, or `RedisClusterConfiguration` to take full control over the configuration.

If you add your own `@Bean` of any of the auto-configured types, it replaces the default (except in the case of `RedisTemplate`, when the exclusion is based on the bean name, `redisTemplate`, not its type).

By default, a pooled connection factory is auto-configured if `commons-pool2` is on the classpath.

The auto-configured `RedisConnectionFactory` can be configured to use SSL for communication with the server by setting the properties as shown in this example:

#### Properties

```properties
spring.data.redis.ssl.enabled=true
```

#### YAML

```yaml
spring:
  data:
    redis:
      ssl:
        enabled: true
```

Custom SSL trust material can be configured in an [SSL bundle](../features/ssl.md) and applied to the `RedisConnectionFactory` as shown in this example:

#### Properties

```properties
spring.data.redis.ssl.bundle=example
```

#### YAML

```yaml
spring:
  data:
    redis:
      ssl:
        bundle: "example"
```

<a id="data.nosql.mongodb"></a>

## MongoDB

[MongoDB](https://www.mongodb.com/) is an open-source NoSQL document database that uses a JSON-like schema instead of traditional table-based relational data.
Spring Boot offers several conveniences for working with MongoDB, including the `spring-boot-starter-data-mongodb` and `spring-boot-starter-data-mongodb-reactive` starters.

<a id="data.nosql.mongodb.connecting"></a>

### Connecting to a MongoDB Database

To access MongoDB databases, you can inject an auto-configured `org.springframework.data.mongodb.MongoDatabaseFactory`.
By default, the instance tries to connect to a MongoDB server at `mongodb://localhost/test`.
The following example shows how to connect to a MongoDB database:

#### Java

```java
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final MongoDatabaseFactory mongo;

	public MyBean(MongoDatabaseFactory mongo) {
		this.mongo = mongo;
	}
	public MongoCollection<Document> someMethod() {
		MongoDatabase db = this.mongo.getMongoDatabase();
		return db.getCollection("users");
	}
}
```

#### Kotlin

```kotlin
import com.mongodb.client.MongoCollection
import org.bson.Document
import org.springframework.data.mongodb.MongoDatabaseFactory
import org.springframework.stereotype.Component

@Component
class MyBean(private val mongo: MongoDatabaseFactory) {
	fun someMethod(): MongoCollection<Document> {
		val db = mongo.mongoDatabase
		return db.getCollection("users")
	}
}
```

If you have defined your own `MongoClient`, it will be used to auto-configure a suitable `MongoDatabaseFactory`.

The auto-configured `MongoClient` is created using a `MongoClientSettings` bean.
If you have defined your own `MongoClientSettings`, it will be used without modification and the `spring.data.mongodb` properties will be ignored.
Otherwise a `MongoClientSettings` will be auto-configured and will have the `spring.data.mongodb` properties applied to it.
In either case, you can declare one or more `MongoClientSettingsBuilderCustomizer` beans to fine-tune the `MongoClientSettings` configuration.
Each will be called in order with the `MongoClientSettings.Builder` that is used to build the `MongoClientSettings`.

You can set the `spring.data.mongodb.uri` property to change the URL and configure additional settings such as the *replica set*, as shown in the following example:

#### Properties

```properties
spring.data.mongodb.uri=mongodb://user:secret@mongoserver1.example.com:27017,mongoserver2.example.com:23456/test
```

#### YAML

```yaml
spring:
  data:
    mongodb:
      uri: "mongodb://user:secret@mongoserver1.example.com:27017,mongoserver2.example.com:23456/test"
```

Alternatively, you can specify connection details using discrete properties.
For example, you might declare the following settings in your `application.properties`:

#### Properties

```properties
spring.data.mongodb.host=mongoserver1.example.com
spring.data.mongodb.port=27017
spring.data.mongodb.additional-hosts[0]=mongoserver2.example.com:23456
spring.data.mongodb.database=test
spring.data.mongodb.username=user
spring.data.mongodb.password=secret
```

#### YAML

```yaml
spring:
  data:
    mongodb:
      host: "mongoserver1.example.com"
      port: 27017
      additional-hosts:
      - "mongoserver2.example.com:23456"
      database: "test"
      username: "user"
      password: "secret"
```

The auto-configured `MongoClient` can be configured to use SSL for communication with the server by setting the properties as shown in this example:

#### Properties

```properties
spring.data.mongodb.uri=mongodb://user:secret@mongoserver1.example.com:27017,mongoserver2.example.com:23456/test
spring.data.mongodb.ssl.enabled=true
```

#### YAML

```yaml
spring:
  data:
    mongodb:
      uri: "mongodb://user:secret@mongoserver1.example.com:27017,mongoserver2.example.com:23456/test"
      ssl:
        enabled: true
```

Custom SSL trust material can be configured in an [SSL bundle](../features/ssl.md) and applied to the `MongoClient` as shown in this example:

#### Properties

```properties
spring.data.mongodb.uri=mongodb://user:secret@mongoserver1.example.com:27017,mongoserver2.example.com:23456/test
spring.data.mongodb.ssl.bundle=example
```

#### YAML

```yaml
spring:
  data:
    mongodb:
      uri: "mongodb://user:secret@mongoserver1.example.com:27017,mongoserver2.example.com:23456/test"
      ssl:
        bundle: "example"
```

> [!TIP]
> If `spring.data.mongodb.port` is not specified, the default of `27017` is used.
> You could delete this line from the example shown earlier.
>
> You can also specify the port as part of the host address by using the `host:port` syntax.
> This format should be used if you need to change the port of an `additional-hosts` entry.

> [!TIP]
> If you do not use Spring Data MongoDB, you can inject a `MongoClient` bean instead of using `MongoDatabaseFactory`.
> If you want to take complete control of establishing the MongoDB connection, you can also declare your own `MongoDatabaseFactory` or `MongoClient` bean.

> [!NOTE]
> If you are using the reactive driver, Netty is required for SSL.
> The auto-configuration configures this factory automatically if Netty is available and the factory to use has not been customized already.

<a id="data.nosql.mongodb.template"></a>

### MongoTemplate

[Spring Data MongoDB](https://spring.io/projects/spring-data-mongodb) provides a [`MongoTemplate`](https://docs.spring.io/spring-data/mongodb/docs/{version-spring-data-mongodb-javadoc}/api/org/springframework/data/mongodb/core/MongoTemplate.html) class that is very similar in its design to Spring’s `JdbcTemplate`.
As with `JdbcTemplate`, Spring Boot auto-configures a bean for you to inject the template, as follows:

#### Java

```java
import com.mongodb.client.MongoCollection;
import org.bson.Document;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final MongoTemplate mongoTemplate;

	public MyBean(MongoTemplate mongoTemplate) {
		this.mongoTemplate = mongoTemplate;
	}
	public MongoCollection<Document> someMethod() {
		return this.mongoTemplate.getCollection("users");
	}
}
```

#### Kotlin

```kotlin
import com.mongodb.client.MongoCollection
import org.bson.Document
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.stereotype.Component

@Component
class MyBean(private val mongoTemplate: MongoTemplate) {
	fun someMethod(): MongoCollection<Document> {
		return mongoTemplate.getCollection("users")
	}
}
```

See the [`MongoOperations`](https://docs.spring.io/spring-data/mongodb/docs/{version-spring-data-mongodb-javadoc}/api/org/springframework/data/mongodb/core/MongoOperations.html) API documentation for complete details.

<a id="data.nosql.mongodb.repositories"></a>

### Spring Data MongoDB Repositories

Spring Data includes repository support for MongoDB.
As with the JPA repositories discussed earlier, the basic principle is that queries are constructed automatically, based on method names.

In fact, both Spring Data JPA and Spring Data MongoDB share the same common infrastructure.
You could take the JPA example from earlier and, assuming that `City` is now a MongoDB data class rather than a JPA `@Entity`, it works in the same way, as shown in the following example:

#### Java

```java
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.Repository;

public interface CityRepository extends Repository<City, Long> {

	Page<City> findAll(Pageable pageable);

	City findByNameAndStateAllIgnoringCase(String name, String state);

}
```

#### Kotlin

```kotlin
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.Repository

interface CityRepository :
	Repository<City?, Long?> {
	fun findAll(pageable: Pageable?): Page<City?>?
	fun findByNameAndStateAllIgnoringCase(name: String?, state: String?): City?
}
```

Repositories and documents are found through scanning.
By default, the [auto-configuration packages](../using/auto-configuration.md#using.auto-configuration.packages) are scanned.
You can customize the locations to look for repositories and documents by using `@EnableMongoRepositories` and `@EntityScan` respectively.

> [!TIP]
> For complete details of Spring Data MongoDB, including its rich object mapping technologies, see its [reference documentation](https://docs.spring.io/spring-data/mongodb/reference/{version-spring-data-mongodb-docs}).

<a id="data.nosql.neo4j"></a>

## Neo4j

[Neo4j](https://neo4j.com/) is an open-source NoSQL graph database that uses a rich data model of nodes connected by first class relationships, which is better suited for connected big data than traditional RDBMS approaches.
Spring Boot offers several conveniences for working with Neo4j, including the `spring-boot-starter-data-neo4j` starter.

<a id="data.nosql.neo4j.connecting"></a>

### Connecting to a Neo4j Database

To access a Neo4j server, you can inject an auto-configured `org.neo4j.driver.Driver`.
By default, the instance tries to connect to a Neo4j server at `localhost:7687` using the Bolt protocol.
The following example shows how to inject a Neo4j `Driver` that gives you access, amongst other things, to a `Session`:

#### Java

```java
import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.neo4j.driver.Values;

import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final Driver driver;

	public MyBean(Driver driver) {
		this.driver = driver;
	}
	public String someMethod(String message) {
		try (Session session = this.driver.session()) {
			return session.executeWrite(
					(transaction) -> transaction
						.run("CREATE (a:Greeting) SET a.message = $message RETURN a.message + ', from node ' + id(a)",
								Values.parameters("message", message))
						.single()
						.get(0)
						.asString());
		}
	}
}
```

#### Kotlin

```kotlin
import org.neo4j.driver.*
import org.springframework.stereotype.Component

@Component
class MyBean(private val driver: Driver) {

	fun someMethod(message: String?): String {
		driver.session().use { session ->
			return@someMethod session.executeWrite { transaction: TransactionContext ->
				transaction
					.run(
						"CREATE (a:Greeting) SET a.message = \$message RETURN a.message + ', from node ' + id(a)",
						Values.parameters("message", message)
					)
					.single()[0].asString()
			}
		}
	}

}
```

You can configure various aspects of the driver using `spring.neo4j.*` properties.
The following example shows how to configure the uri and credentials to use:

#### Properties

```properties
spring.neo4j.uri=bolt://my-server:7687
spring.neo4j.authentication.username=neo4j
spring.neo4j.authentication.password=secret
```

#### YAML

```yaml
spring:
  neo4j:
    uri: "bolt://my-server:7687"
    authentication:
      username: "neo4j"
      password: "secret"
```

The auto-configured `Driver` is created using `ConfigBuilder`.
To fine-tune its configuration, declare one or more `ConfigBuilderCustomizer` beans.
Each will be called in order with the `ConfigBuilder` that is used to build the `Driver`.

<a id="data.nosql.neo4j.repositories"></a>

### Spring Data Neo4j Repositories

Spring Data includes repository support for Neo4j.
For complete details of Spring Data Neo4j, see the [reference documentation](https://docs.spring.io/spring-data/neo4j/reference/{version-spring-data-neo4j-docs}).

Spring Data Neo4j shares the common infrastructure with Spring Data JPA as many other Spring Data modules do.
You could take the JPA example from earlier and define `City` as Spring Data Neo4j `@Node` rather than JPA `@Entity` and the repository abstraction works in the same way, as shown in the following example:

#### Java

```java
import java.util.Optional;

import org.springframework.data.neo4j.repository.Neo4jRepository;

public interface CityRepository extends Neo4jRepository<City, Long> {

	Optional<City> findOneByNameAndState(String name, String state);

}
```

#### Kotlin

```kotlin
import org.springframework.data.neo4j.repository.Neo4jRepository
import java.util.Optional

interface CityRepository : Neo4jRepository<City?, Long?> {

	fun findOneByNameAndState(name: String?, state: String?): Optional<City?>?

}
```

The `spring-boot-starter-data-neo4j` starter enables the repository support as well as transaction management.
Spring Boot supports both classic and reactive Neo4j repositories, using the `Neo4jTemplate` or `ReactiveNeo4jTemplate` beans.
When Project Reactor is available on the classpath, the reactive style is also auto-configured.

Repositories and entities are found through scanning.
By default, the [auto-configuration packages](../using/auto-configuration.md#using.auto-configuration.packages) are scanned.
You can customize the locations to look for repositories and entities by using `@EnableNeo4jRepositories` and `@EntityScan` respectively.

> [!NOTE]
> In an application using the reactive style, a `ReactiveTransactionManager` is not auto-configured.
> To enable transaction management, the following bean must be defined in your configuration:
>
> #### Java
>
> ```java
> import org.neo4j.driver.Driver;
>
> import org.springframework.context.annotation.Bean;
> import org.springframework.context.annotation.Configuration;
> import org.springframework.data.neo4j.core.ReactiveDatabaseSelectionProvider;
> import org.springframework.data.neo4j.core.transaction.ReactiveNeo4jTransactionManager;
>
> @Configuration(proxyBeanMethods = false)
> public class MyNeo4jConfiguration {
>
> 	@Bean
> 	public ReactiveNeo4jTransactionManager reactiveTransactionManager(Driver driver,
> 			ReactiveDatabaseSelectionProvider databaseNameProvider) {
> 		return new ReactiveNeo4jTransactionManager(driver, databaseNameProvider);
> 	}
>
> }
> ```
>
> #### Kotlin
>
> ```kotlin
> import org.neo4j.driver.Driver
> import org.springframework.context.annotation.Bean
> import org.springframework.context.annotation.Configuration
> import org.springframework.data.neo4j.core.ReactiveDatabaseSelectionProvider
> import org.springframework.data.neo4j.core.transaction.ReactiveNeo4jTransactionManager
>
> @Configuration(proxyBeanMethods = false)
> class MyNeo4jConfiguration {
>
> 	@Bean
> 	fun reactiveTransactionManager(driver: Driver,
> 			databaseNameProvider: ReactiveDatabaseSelectionProvider): ReactiveNeo4jTransactionManager {
> 		return ReactiveNeo4jTransactionManager(driver, databaseNameProvider)
> 	}
> }
> ```

<a id="data.nosql.elasticsearch"></a>

## Elasticsearch

[Elasticsearch](https://www.elastic.co/products/elasticsearch) is an open source, distributed, RESTful search and analytics engine.
Spring Boot offers basic auto-configuration for Elasticsearch clients.

Spring Boot supports several clients:

- The official low-level REST client
- The official Java API client
- The `ReactiveElasticsearchClient` provided by Spring Data Elasticsearch

Spring Boot provides a dedicated starter, `spring-boot-starter-data-elasticsearch`.

<a id="data.nosql.elasticsearch.connecting-using-rest"></a>

### Connecting to Elasticsearch Using REST clients

Elasticsearch ships two different REST clients that you can use to query a cluster: the [low-level client](https://www.elastic.co/guide/en/elasticsearch/client/java-api-client/current/java-rest-low.html) from the `org.elasticsearch.client:elasticsearch-rest-client` module and the [Java API client](https://www.elastic.co/guide/en/elasticsearch/client/java-api-client/current/index.html) from the `co.elastic.clients:elasticsearch-java` module.
Additionally, Spring Boot provides support for a reactive client from the `org.springframework.data:spring-data-elasticsearch` module.
By default, the clients will target `localhost:9200`.
You can use `spring.elasticsearch.*` properties to further tune how the clients are configured, as shown in the following example:

#### Properties

```properties
spring.elasticsearch.uris=https://search.example.com:9200
spring.elasticsearch.socket-timeout=10s
spring.elasticsearch.username=user
spring.elasticsearch.password=secret
```

#### YAML

```yaml
spring:
  elasticsearch:
    uris: "https://search.example.com:9200"
    socket-timeout: "10s"
    username: "user"
    password: "secret"
```

<a id="data.nosql.elasticsearch.connecting-using-rest.restclient"></a>

#### Connecting to Elasticsearch Using RestClient

If you have `elasticsearch-rest-client` on the classpath, Spring Boot will auto-configure and register a `RestClient` bean.
In addition to the properties described previously, to fine-tune the `RestClient` you can register an arbitrary number of beans that implement `RestClientBuilderCustomizer` for more advanced customizations.
To take full control over the clients' configuration, define a `RestClientBuilder` bean.

Additionally, if `elasticsearch-rest-client-sniffer` is on the classpath, a `Sniffer` is auto-configured to automatically discover nodes from a running Elasticsearch cluster and set them on the `RestClient` bean.
You can further tune how `Sniffer` is configured, as shown in the following example:

#### Properties

```properties
spring.elasticsearch.restclient.sniffer.interval=10m
spring.elasticsearch.restclient.sniffer.delay-after-failure=30s
```

#### YAML

```yaml
spring:
  elasticsearch:
    restclient:
      sniffer:
        interval: "10m"
        delay-after-failure: "30s"
```

<a id="data.nosql.elasticsearch.connecting-using-rest.javaapiclient"></a>

#### Connecting to Elasticsearch Using ElasticsearchClient

If you have `co.elastic.clients:elasticsearch-java` on the classpath, Spring Boot will auto-configure and register an `ElasticsearchClient` bean.

The `ElasticsearchClient` uses a transport that depends upon the previously described `RestClient`.
Therefore, the properties described previously can be used to configure the `ElasticsearchClient`.
Furthermore, you can define a `RestClientOptions` bean to take further control of the behavior of the transport.

<a id="data.nosql.elasticsearch.connecting-using-rest.reactiveclient"></a>

#### Connecting to Elasticsearch using ReactiveElasticsearchClient

[Spring Data Elasticsearch](https://spring.io/projects/spring-data-elasticsearch) ships `ReactiveElasticsearchClient` for querying Elasticsearch instances in a reactive fashion.
If you have Spring Data Elasticsearch and Reactor on the classpath, Spring Boot will auto-configure and register a `ReactiveElasticsearchClient`.

The `ReactiveElasticsearchclient` uses a transport that depends upon the previously described `RestClient`.
Therefore, the properties described previously can be used to configure the `ReactiveElasticsearchClient`.
Furthermore, you can define a `RestClientOptions` bean to take further control of the behavior of the transport.

<a id="data.nosql.elasticsearch.connecting-using-spring-data"></a>

### Connecting to Elasticsearch by Using Spring Data

To connect to Elasticsearch, an `ElasticsearchClient` bean must be defined,
auto-configured by Spring Boot or manually provided by the application (see previous sections).
With this configuration in place, an
`ElasticsearchTemplate` can be injected like any other Spring bean,
as shown in the following example:

#### Java

```java
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final ElasticsearchTemplate template;

	public MyBean(ElasticsearchTemplate template) {
		this.template = template;
	}
	public boolean someMethod(String id) {
		return this.template.exists(id, User.class);
	}
}
```

#### Kotlin

```kotlin
import org.springframework.stereotype.Component

@Component
class MyBean(private val template: org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate ) {
	fun someMethod(id: String): Boolean {
		return template.exists(id, User::class.java)
	}
}
```

In the presence of `spring-data-elasticsearch` and Reactor, Spring Boot can also auto-configure a [`ReactiveElasticsearchClient`](#data.nosql.elasticsearch.connecting-using-rest.reactiveclient) and a `ReactiveElasticsearchTemplate` as beans.
They are the reactive equivalent of the other REST clients.

<a id="data.nosql.elasticsearch.repositories"></a>

### Spring Data Elasticsearch Repositories

Spring Data includes repository support for Elasticsearch.
As with the JPA repositories discussed earlier, the basic principle is that queries are constructed for you automatically based on method names.

In fact, both Spring Data JPA and Spring Data Elasticsearch share the same common infrastructure.
You could take the JPA example from earlier and, assuming that `City` is now an Elasticsearch `@Document` class rather than a JPA `@Entity`, it works in the same way.

Repositories and documents are found through scanning.
By default, the [auto-configuration packages](../using/auto-configuration.md#using.auto-configuration.packages) are scanned.
You can customize the locations to look for repositories and documents by using `@EnableElasticsearchRepositories` and `@EntityScan` respectively.

> [!TIP]
> For complete details of Spring Data Elasticsearch, see the [reference documentation](https://docs.spring.io/spring-data/elasticsearch/reference/{version-spring-data-elasticsearch-docs}).

Spring Boot supports both classic and reactive Elasticsearch repositories, using the `ElasticsearchRestTemplate` or `ReactiveElasticsearchTemplate` beans.
Most likely those beans are auto-configured by Spring Boot given the required dependencies are present.

If you wish to use your own template for backing the Elasticsearch repositories, you can add your own `ElasticsearchRestTemplate` or `ElasticsearchOperations` `@Bean`, as long as it is named `"elasticsearchTemplate"`.
Same applies to `ReactiveElasticsearchTemplate` and `ReactiveElasticsearchOperations`, with the bean name `"reactiveElasticsearchTemplate"`.

You can choose to disable the repositories support with the following property:

#### Properties

```properties
spring.data.elasticsearch.repositories.enabled=false
```

#### YAML

```yaml
spring:
  data:
    elasticsearch:
      repositories:
        enabled: false
```

<a id="data.nosql.cassandra"></a>

## Cassandra

[Cassandra](https://cassandra.apache.org/) is an open source, distributed database management system designed to handle large amounts of data across many commodity servers.
Spring Boot offers auto-configuration for Cassandra and the abstractions on top of it provided by [Spring Data Cassandra](https://spring.io/projects/spring-data-cassandra).
There is a `spring-boot-starter-data-cassandra` starter for collecting the dependencies in a convenient way.

<a id="data.nosql.cassandra.connecting"></a>

### Connecting to Cassandra

You can inject an auto-configured `CassandraTemplate` or a Cassandra `CqlSession` instance as you would with any other Spring Bean.
The `spring.cassandra.*` properties can be used to customize the connection.
Generally, you provide `keyspace-name` and `contact-points` as well the local datacenter name, as shown in the following example:

#### Properties

```properties
spring.cassandra.keyspace-name=mykeyspace
spring.cassandra.contact-points=cassandrahost1:9042,cassandrahost2:9042
spring.cassandra.local-datacenter=datacenter1
```

#### YAML

```yaml
spring:
  cassandra:
    keyspace-name: "mykeyspace"
    contact-points: "cassandrahost1:9042,cassandrahost2:9042"
    local-datacenter: "datacenter1"
```

If the port is the same for all your contact points you can use a shortcut and only specify the host names, as shown in the following example:

#### Properties

```properties
spring.cassandra.keyspace-name=mykeyspace
spring.cassandra.contact-points=cassandrahost1,cassandrahost2
spring.cassandra.local-datacenter=datacenter1
```

#### YAML

```yaml
spring:
  cassandra:
    keyspace-name: "mykeyspace"
    contact-points: "cassandrahost1,cassandrahost2"
    local-datacenter: "datacenter1"
```

> [!TIP]
> Those two examples are identical as the port default to `9042`.
> If you need to configure the port, use `spring.cassandra.port`.

The auto-configured `CqlSession` can be configured to use SSL for communication with the server by setting the properties as shown in this example:

#### Properties

```properties
spring.cassandra.keyspace-name=mykeyspace
spring.cassandra.contact-points=cassandrahost1,cassandrahost2
spring.cassandra.local-datacenter=datacenter1
spring.cassandra.ssl.enabled=true
```

#### YAML

```yaml
spring:
  cassandra:
    keyspace-name: "mykeyspace"
    contact-points: "cassandrahost1,cassandrahost2"
    local-datacenter: "datacenter1"
    ssl:
      enabled: true
```

Custom SSL trust material can be configured in an [SSL bundle](../features/ssl.md) and applied to the `CqlSession` as shown in this example:

#### Properties

```properties
spring.cassandra.keyspace-name=mykeyspace
spring.cassandra.contact-points=cassandrahost1,cassandrahost2
spring.cassandra.local-datacenter=datacenter1
spring.cassandra.ssl.bundle=example
```

#### YAML

```yaml
spring:
  cassandra:
    keyspace-name: "mykeyspace"
    contact-points: "cassandrahost1,cassandrahost2"
    local-datacenter: "datacenter1"
    ssl:
      bundle: "example"
```

> [!NOTE]
> The Cassandra driver has its own configuration infrastructure that loads an `application.conf` at the root of the classpath.
>
> Spring Boot does not look for such a file by default but can load one using `spring.cassandra.config`.
> If a property is both present in `spring.cassandra.*` and the configuration file, the value in `spring.cassandra.*` takes precedence.
>
> For more advanced driver customizations, you can register an arbitrary number of beans that implement `DriverConfigLoaderBuilderCustomizer`.
> The `CqlSession` can be customized with a bean of type `CqlSessionBuilderCustomizer`.

> [!NOTE]
> If you use `CqlSessionBuilder` to create multiple `CqlSession` beans, keep in mind the builder is mutable so make sure to inject a fresh copy for each session.

The following code listing shows how to inject a Cassandra bean:

#### Java

```java
import org.springframework.data.cassandra.core.CassandraTemplate;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final CassandraTemplate template;

	public MyBean(CassandraTemplate template) {
		this.template = template;
	}
	public long someMethod() {
		return this.template.count(User.class);
	}
}
```

#### Kotlin

```kotlin
import org.springframework.data.cassandra.core.CassandraTemplate
import org.springframework.stereotype.Component

@Component
class MyBean(private val template: CassandraTemplate) {
	fun someMethod(): Long {
		return template.count(User::class.java)
	}
}
```

If you add your own `@Bean` of type `CassandraTemplate`, it replaces the default.

<a id="data.nosql.cassandra.repositories"></a>

### Spring Data Cassandra Repositories

Spring Data includes basic repository support for Cassandra.
Currently, this is more limited than the JPA repositories discussed earlier and needs `@Query` annotated finder methods.

Repositories and entities are found through scanning.
By default, the [auto-configuration packages](../using/auto-configuration.md#using.auto-configuration.packages) are scanned.
You can customize the locations to look for repositories and entities by using `@EnableCassandraRepositories` and `@EntityScan` respectively.

> [!TIP]
> For complete details of Spring Data Cassandra, see the [reference documentation](https://docs.spring.io/spring-data/cassandra/docs/).

<a id="data.nosql.couchbase"></a>

## Couchbase

[Couchbase](https://www.couchbase.com/) is an open-source, distributed, multi-model NoSQL document-oriented database that is optimized for interactive applications.
Spring Boot offers auto-configuration for Couchbase and the abstractions on top of it provided by [Spring Data Couchbase](https://github.com/spring-projects/spring-data-couchbase).
There are `spring-boot-starter-data-couchbase` and `spring-boot-starter-data-couchbase-reactive` starters for collecting the dependencies in a convenient way.

<a id="data.nosql.couchbase.connecting"></a>

### Connecting to Couchbase

You can get a `Cluster` by adding the Couchbase SDK and some configuration.
The `spring.couchbase.*` properties can be used to customize the connection.
Generally, you provide the [connection string](https://github.com/couchbaselabs/sdk-rfcs/blob/master/rfc/0011-connection-string.md), username, and password, as shown in the following example:

#### Properties

```properties
spring.couchbase.connection-string=couchbase://192.168.1.123
spring.couchbase.username=user
spring.couchbase.password=secret
```

#### YAML

```yaml
spring:
  couchbase:
    connection-string: "couchbase://192.168.1.123"
    username: "user"
    password: "secret"
```

It is also possible to customize some of the `ClusterEnvironment` settings.
For instance, the following configuration changes the timeout to open a new `Bucket` and enables SSL support with a reference to a configured [SSL bundle](../features/ssl.md):

#### Properties

```properties
spring.couchbase.env.timeouts.connect=3s
spring.couchbase.env.ssl.bundle=example
```

#### YAML

```yaml
spring:
  couchbase:
    env:
      timeouts:
        connect: "3s"
      ssl:
        bundle: "example"
```

> [!TIP]
> Check the `spring.couchbase.env.*` properties for more details.
> To take more control, one or more `ClusterEnvironmentBuilderCustomizer` beans can be used.

<a id="data.nosql.couchbase.repositories"></a>

### Spring Data Couchbase Repositories

Spring Data includes repository support for Couchbase.

Repositories and documents are found through scanning.
By default, the [auto-configuration packages](../using/auto-configuration.md#using.auto-configuration.packages) are scanned.
You can customize the locations to look for repositories and documents by using `@EnableCouchbaseRepositories` and `@EntityScan` respectively.

For complete details of Spring Data Couchbase, see the [reference documentation](https://docs.spring.io/spring-data/couchbase/reference/{version-spring-data-couchbase-docs}).

You can inject an auto-configured `CouchbaseTemplate` instance as you would with any other Spring Bean, provided a `CouchbaseClientFactory` bean is available.
This happens when a `Cluster` is available, as described above, and a bucket name has been specified:

#### Properties

```properties
spring.data.couchbase.bucket-name=my-bucket
```

#### YAML

```yaml
spring:
  data:
    couchbase:
      bucket-name: "my-bucket"
```

The following examples shows how to inject a `CouchbaseTemplate` bean:

#### Java

```java
import org.springframework.data.couchbase.core.CouchbaseTemplate;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final CouchbaseTemplate template;

	public MyBean(CouchbaseTemplate template) {
		this.template = template;
	}
	public String someMethod() {
		return this.template.getBucketName();
	}
}
```

#### Kotlin

```kotlin
import org.springframework.data.couchbase.core.CouchbaseTemplate
import org.springframework.stereotype.Component

@Component
class MyBean(private val template: CouchbaseTemplate) {
	fun someMethod(): String {
		return template.bucketName
	}
}
```

There are a few beans that you can define in your own configuration to override those provided by the auto-configuration:

- A `CouchbaseMappingContext` `@Bean` with a name of `couchbaseMappingContext`.
- A `CustomConversions` `@Bean` with a name of `couchbaseCustomConversions`.
- A `CouchbaseTemplate` `@Bean` with a name of `couchbaseTemplate`.

To avoid hard-coding those names in your own config, you can reuse `BeanNames` provided by Spring Data Couchbase.
For instance, you can customize the converters to use, as follows:

#### Java

```java
import org.assertj.core.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.couchbase.config.BeanNames;
import org.springframework.data.couchbase.core.convert.CouchbaseCustomConversions;

@Configuration(proxyBeanMethods = false)
public class MyCouchbaseConfiguration {

	@Bean(BeanNames.COUCHBASE_CUSTOM_CONVERSIONS)
	public CouchbaseCustomConversions myCustomConversions() {
		return new CouchbaseCustomConversions(Arrays.asList(new MyConverter()));
	}

}
```

#### Kotlin

```kotlin
import org.assertj.core.util.Arrays
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.couchbase.config.BeanNames
import org.springframework.data.couchbase.core.convert.CouchbaseCustomConversions

@Configuration(proxyBeanMethods = false)
class MyCouchbaseConfiguration {

	@Bean(BeanNames.COUCHBASE_CUSTOM_CONVERSIONS)
	fun myCustomConversions(): CouchbaseCustomConversions {
		return CouchbaseCustomConversions(Arrays.asList(MyConverter()))
	}

}
```

<a id="data.nosql.ldap"></a>

## LDAP

[LDAP](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol) (Lightweight Directory Access Protocol) is an open, vendor-neutral, industry standard application protocol for accessing and maintaining distributed directory information services over an IP network.
Spring Boot offers auto-configuration for any compliant LDAP server as well as support for the embedded in-memory LDAP server from [UnboundID](https://ldap.com/unboundid-ldap-sdk-for-java/).

LDAP abstractions are provided by [Spring Data LDAP](https://github.com/spring-projects/spring-data-ldap).
There is a `spring-boot-starter-data-ldap` starter for collecting the dependencies in a convenient way.

<a id="data.nosql.ldap.connecting"></a>

### Connecting to an LDAP Server

To connect to an LDAP server, make sure you declare a dependency on the `spring-boot-starter-data-ldap` starter or `spring-ldap-core` and then declare the URLs of your server in your application.properties, as shown in the following example:

#### Properties

```properties
spring.ldap.urls=ldap://myserver:1235
spring.ldap.username=admin
spring.ldap.password=secret
```

#### YAML

```yaml
spring:
  ldap:
    urls: "ldap://myserver:1235"
    username: "admin"
    password: "secret"
```

If you need to customize connection settings, you can use the `spring.ldap.base` and `spring.ldap.base-environment` properties.

An `LdapContextSource` is auto-configured based on these settings.
If a `DirContextAuthenticationStrategy` bean is available, it is associated to the auto-configured `LdapContextSource`.
If you need to customize it, for instance to use a `PooledContextSource`, you can still inject the auto-configured `LdapContextSource`.
Make sure to flag your customized `ContextSource` as `@Primary` so that the auto-configured `LdapTemplate` uses it.

<a id="data.nosql.ldap.repositories"></a>

### Spring Data LDAP Repositories

Spring Data includes repository support for LDAP.

Repositories and documents are found through scanning.
By default, the [auto-configuration packages](../using/auto-configuration.md#using.auto-configuration.packages) are scanned.
You can customize the locations to look for repositories and documents by using `@EnableLdapRepositories` and `@EntityScan` respectively.

For complete details of Spring Data LDAP, see the [reference documentation](https://docs.spring.io/spring-data/ldap/docs/1.0.x/reference/html/).

You can also inject an auto-configured `LdapTemplate` instance as you would with any other Spring Bean, as shown in the following example:

#### Java

```java
import java.util.List;

import org.springframework.ldap.core.LdapTemplate;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final LdapTemplate template;

	public MyBean(LdapTemplate template) {
		this.template = template;
	}
	public List<User> someMethod() {
		return this.template.findAll(User.class);
	}
}
```

#### Kotlin

```kotlin
import org.springframework.ldap.core.LdapTemplate
import org.springframework.stereotype.Component

@Component
class MyBean(private val template: LdapTemplate) {
	fun someMethod(): List<User> {
		return template.findAll(User::class.java)
	}
}
```

<a id="data.nosql.ldap.embedded"></a>

### Embedded In-memory LDAP Server

For testing purposes, Spring Boot supports auto-configuration of an in-memory LDAP server from [UnboundID](https://ldap.com/unboundid-ldap-sdk-for-java/).
To configure the server, add a dependency to `com.unboundid:unboundid-ldapsdk` and declare a `spring.ldap.embedded.base-dn` property, as follows:

#### Properties

```properties
spring.ldap.embedded.base-dn=dc=spring,dc=io
```

#### YAML

```yaml
spring:
  ldap:
    embedded:
      base-dn: "dc=spring,dc=io"
```

> [!NOTE]
> It is possible to define multiple base-dn values, however, since distinguished names usually contain commas, they must be defined using the correct notation.
>
> In yaml files, you can use the yaml list notation. In properties files, you must include the index as part of the property name:
>
> #### Properties
>
> ```properties
> spring.ldap.embedded.base-dn[0]=dc=spring,dc=io
> spring.ldap.embedded.base-dn[1]=dc=vmware,dc=com
> ```
>
> #### YAML
>
> ```yaml
> spring.ldap.embedded.base-dn:
> - "dc=spring,dc=io"
> - "dc=vmware,dc=com"
> ```

By default, the server starts on a random port and triggers the regular LDAP support.
There is no need to specify a `spring.ldap.urls` property.

If there is a `schema.ldif` file on your classpath, it is used to initialize the server.
If you want to load the initialization script from a different resource, you can also use the `spring.ldap.embedded.ldif` property.

By default, a standard schema is used to validate `LDIF` files.
You can turn off validation altogether by setting the `spring.ldap.embedded.validation.enabled` property.
If you have custom attributes, you can use `spring.ldap.embedded.validation.schema` to define your custom attribute types or object classes.

<a id="data.nosql.influxdb"></a>

## InfluxDB

> [!WARNING]
> Auto-configuration for InfluxDB is deprecated and scheduled for removal in Spring Boot 3.4 in favor of [the new InfluxDB Java client](https://github.com/influxdata/influxdb-client-java) that provides its own Spring Boot integration.

[InfluxDB](https://www.influxdata.com/) is an open-source time series database optimized for fast, high-availability storage and retrieval of time series data in fields such as operations monitoring, application metrics, Internet-of-Things sensor data, and real-time analytics.

<a id="data.nosql.influxdb.connecting"></a>

### Connecting to InfluxDB

Spring Boot auto-configures an `InfluxDB` instance, provided the `influxdb-java` client is on the classpath and the URL of the database is set using `spring.influx.url`.

If the connection to InfluxDB requires a user and password, you can set the `spring.influx.user` and `spring.influx.password` properties accordingly.

InfluxDB relies on OkHttp.
If you need to tune the http client `InfluxDB` uses behind the scenes, you can register an `InfluxDbOkHttpClientBuilderProvider` bean.

If you need more control over the configuration, consider registering an `InfluxDbCustomizer` bean.
