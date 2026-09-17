---
title: "Redis"
source: "ROOT:api/vectordbs/redis.adoc"
---

# Redis

This section walks you through setting up `RedisVectorStore` to store document embeddings and perform similarity searches.

[Redis](https://redis.io) is an open source (BSD licensed), in-memory data structure store used as a database, cache, message broker, and streaming engine. Redis provides data structures such as strings, hashes, lists, sets, sorted sets with range queries, bitmaps, hyperloglogs, geospatial indexes, and streams.

[Redis Search and Query](https://redis.io/docs/interact/search-and-query/) extends the core features of Redis OSS and allows you to use Redis as a vector database:

- Store vectors and the associated metadata within hashes or JSON documents
- Retrieve vectors
- Perform vector searches

<a id="_prerequisites"></a>

## Prerequisites

1. A Redis Stack instance

   - [Redis Cloud](https://app.redislabs.com/#/) (recommended)
   - [Docker](https://hub.docker.com/r/redis/redis-stack) image *redis/redis-stack:latest*
1. `EmbeddingModel` instance to compute the document embeddings. Several options are available:

   - If required, an API key for the [EmbeddingModel](../embeddings.md#available-implementations) to generate the embeddings stored by the `RedisVectorStore`.

<a id="_auto_configuration"></a>

## Auto-configuration

> [!NOTE]
> There has been a significant change in the Spring AI auto-configuration, starter modules' artifact names.
> Please refer to the [upgrade notes](https://docs.spring.io/spring-ai/reference/upgrade-notes.html) for more information.

Spring AI provides Spring Boot auto-configuration for the Redis Vector Store.
To enable it, add the following dependency to your project’s Maven `pom.xml` file:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-vector-store-redis</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-vector-store-redis'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

> [!TIP]
> Refer to the [Artifact Repositories](../../getting-started.md#artifact-repositories) section to add Maven Central and/or Snapshot Repositories to your build file.

The vector store implementation can initialize the requisite schema for you, but you must opt-in by specifying the `initializeSchema` boolean in the appropriate constructor or by setting `…​initialize-schema=true` in the `application.properties` file.

> [!NOTE]
> this is a breaking change! In earlier versions of Spring AI, this schema initialization happened by default.

Please have a look at the list of [configuration parameters](#redisvector-properties) for the vector store to learn about the default values and configuration options.

Additionally, you will need a configured `EmbeddingModel` bean. Refer to the [EmbeddingModel](../embeddings.md#available-implementations) section for more information.

Now you can auto-wire the `RedisVectorStore` as a vector store in your application.

```java
@Autowired VectorStore vectorStore;

// ...

List <Document> documents = List.of(
    new Document("Spring AI rocks!! Spring AI rocks!! Spring AI rocks!! Spring AI rocks!! Spring AI rocks!!", Map.of("meta1", "meta1")),
    new Document("The World is Big and Salvation Lurks Around the Corner"),
    new Document("You walk forward facing the past and you turn back toward the future.", Map.of("meta2", "meta2")));

// Add the documents to Redis
vectorStore.add(documents);

// Retrieve documents similar to a query
List<Document> results = this.vectorStore.similaritySearch(SearchRequest.builder().query("Spring").topK(5).build());
```

<a id="redisvector-properties"></a>

### Configuration Properties

To connect to Redis and use the `RedisVectorStore`, you need to provide access details for your instance.
A simple configuration can be provided via Spring Boot’s `application.yml`,

```yaml
spring:
  data:
    redis:
      url: <redis instance url>
  ai:
    vectorstore:
      redis:
        initialize-schema: true
        index-name: custom-index
        prefix: custom-prefix
```

For redis connection configuration, alternatively, a simple configuration can be provided via Spring Boot’s *application.properties*.

```properties
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.username=default
spring.data.redis.password=

```

Properties starting with `spring.ai.vectorstore.redis.*` are used to configure the `RedisVectorStore`:

| Property | Description | Default Value |
| --- | --- | --- |
| `spring.ai.vectorstore.redis.initialize-schema` | Whether to initialize the required schema | `false` |
| `spring.ai.vectorstore.redis.index-name` | The name of the index to store the vectors | `spring-ai-index` |
| `spring.ai.vectorstore.redis.prefix` | The prefix for Redis keys | `embedding:` |

<a id="_metadata_filtering"></a>

## Metadata Filtering

You can leverage the generic, portable [metadata filters](../vectordbs.md#metadata-filters) with Redis as well.

For example, you can use either the text expression language:

```java
vectorStore.similaritySearch(SearchRequest.builder()
        .query("The World")
        .topK(TOP_K)
        .similarityThreshold(SIMILARITY_THRESHOLD)
        .filterExpression("country in ['UK', 'NL'] && year >= 2020").build());
```

or programmatically using the `Filter.Expression` DSL:

```java
FilterExpressionBuilder b = new FilterExpressionBuilder();

vectorStore.similaritySearch(SearchRequest.builder()
        .query("The World")
        .topK(TOP_K)
        .similarityThreshold(SIMILARITY_THRESHOLD)
        .filterExpression(b.and(
                b.in("country", "UK", "NL"),
                b.gte("year", 2020)).build()).build());
```

> [!NOTE]
> Those (portable) filter expressions get automatically converted into [Redis search queries](https://redis.io/docs/interact/search-and-query/query/).

For example, this portable filter expression:

```sql
country in ['UK', 'NL'] && year >= 2020
```

is converted into the proprietary Redis filter format:

```text
@country:{UK | NL} @year:[2020 inf]
```

<a id="_manual_configuration"></a>

## Manual Configuration

Instead of using the Spring Boot auto-configuration, you can manually configure the Redis vector store. For this you need to add the `spring-ai-redis-store` to your project:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-redis-store</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-redis-store'
}
```

Create a `JedisPooled` bean:

```java
@Bean
public JedisPooled jedisPooled() {
    return new JedisPooled("<host>", 6379);
}
```

Then create the `RedisVectorStore` bean using the builder pattern:

```java
@Bean
public VectorStore vectorStore(JedisPooled jedisPooled, EmbeddingModel embeddingModel) {
    return RedisVectorStore.builder(jedisPooled, embeddingModel)
        .indexName("custom-index")                // Optional: defaults to "spring-ai-index"
        .prefix("custom-prefix")                  // Optional: defaults to "embedding:"
        .metadataFields(                         // Optional: define metadata fields for filtering
            MetadataField.tag("country"),
            MetadataField.numeric("year"))
        .initializeSchema(true)                   // Optional: defaults to false
        .batchingStrategy(new TokenCountBatchingStrategy()) // Optional: defaults to TokenCountBatchingStrategy
        .build();
}

// This can be any EmbeddingModel implementation
@Bean
public EmbeddingModel embeddingModel() {
    return new OpenAiEmbeddingModel(new OpenAiApi(System.getenv("OPENAI_API_KEY")));
}
```

> [!NOTE]
> You must list explicitly all metadata field names and types (`TAG`, `TEXT`, or `NUMERIC`) for any metadata field used in filter expressions.
> The `metadataFields` above registers filterable metadata fields: `country` of type `TAG`, `year` of type `NUMERIC`.

<a id="_accessing_the_native_client"></a>

## Accessing the Native Client

The Redis Vector Store implementation provides access to the underlying native Redis client (`JedisPooled`) through the `getNativeClient()` method:

```java
RedisVectorStore vectorStore = context.getBean(RedisVectorStore.class);
Optional<JedisPooled> nativeClient = vectorStore.getNativeClient();

if (nativeClient.isPresent()) {
    JedisPooled jedis = nativeClient.get();
    // Use the native client for Redis-specific operations
}
```

The native client gives you access to Redis-specific features and operations that might not be exposed through the `VectorStore` interface.
