---
title: "Qdrant"
source: "ROOT:api/vectordbs/qdrant.adoc"
---

# Qdrant

This section walks you through setting up the Qdrant `VectorStore` to store document embeddings and perform similarity searches.

[Qdrant](https://www.qdrant.tech/) is an open-source, high-performance vector search engine/database. It uses HNSW (Hierarchical Navigable Small World) algorithm for efficient k-NN search operations and provides advanced filtering capabilities for metadata-based queries.

<a id="_prerequisites"></a>

## Prerequisites

- Qdrant Instance: Set up a Qdrant instance by following the [installation instructions](https://qdrant.tech/documentation/guides/installation/) in the Qdrant documentation.
- If required, an API key for the [EmbeddingModel](../embeddings.md#available-implementations) to generate the embeddings stored by the `QdrantVectorStore`.

> [!NOTE]
> It is recommended that the Qdrant collection is [created](https://qdrant.tech/documentation/concepts/collections/#create-a-collection) in advance with the appropriate dimensions and configurations.
> If the collection is not created, the `QdrantVectorStore` will attempt to create one using the `Cosine` similarity and the dimension of the configured `EmbeddingModel`.

<a id="_auto_configuration"></a>

## Auto-configuration

> [!NOTE]
> There has been a significant change in the Spring AI auto-configuration, starter modules' artifact names.
> Please refer to the [upgrade notes](https://docs.spring.io/spring-ai/reference/upgrade-notes.html) for more information.

Spring AI provides Spring Boot auto-configuration for the Qdrant Vector Store.
To enable it, add the following dependency to your project’s Maven `pom.xml` file:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-vector-store-qdrant</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-vector-store-qdrant'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

Please have a look at the list of [configuration parameters](#qdrant-vectorstore-properties) for the vector store to learn about the default values and configuration options.

> [!TIP]
> Refer to the [Artifact Repositories](../../getting-started.md#artifact-repositories) section to add Maven Central and/or Snapshot Repositories to your build file.

The vector store implementation can initialize the requisite schema for you, but you must opt-in by specifying the `initializeSchema` boolean in the builder or by setting `…​initialize-schema=true` in the `application.properties` file.

> [!NOTE]
> this is a breaking change! In earlier versions of Spring AI, this schema initialization happened by default.

Additionally, you will need a configured `EmbeddingModel` bean. Refer to the [EmbeddingModel](../embeddings.md#available-implementations) section for more information.

Now you can auto-wire the `QdrantVectorStore` as a vector store in your application.

```java
@Autowired VectorStore vectorStore;

// ...

List<Document> documents = List.of(
    new Document("Spring AI rocks!! Spring AI rocks!! Spring AI rocks!! Spring AI rocks!! Spring AI rocks!!", Map.of("meta1", "meta1")),
    new Document("The World is Big and Salvation Lurks Around the Corner"),
    new Document("You walk forward facing the past and you turn back toward the future.", Map.of("meta2", "meta2")));

// Add the documents to Qdrant
vectorStore.add(documents);

// Retrieve documents similar to a query
List<Document> results = vectorStore.similaritySearch(SearchRequest.builder().query("Spring").topK(5).build());
```

<a id="qdrant-vectorstore-properties"></a>

### Configuration Properties

To connect to Qdrant and use the `QdrantVectorStore`, you need to provide access details for your instance.
A simple configuration can be provided via Spring Boot’s `application.yml`:

```yaml
spring:
  ai:
    vectorstore:
      qdrant:
        host: <qdrant host>
        port: <qdrant grpc port>
        api-key: <qdrant api key>
        collection-name: <collection name>
        use-tls: false
        initialize-schema: true
```

Properties starting with `spring.ai.vectorstore.qdrant.*` are used to configure the `QdrantVectorStore`:

| Property | Description | Default Value |
| --- | --- | --- |
| `spring.ai.vectorstore.qdrant.host` | The host of the Qdrant server | `localhost` |
| `spring.ai.vectorstore.qdrant.port` | The gRPC port of the Qdrant server | `6334` |
| `spring.ai.vectorstore.qdrant.api-key` | The API key to use for authentication | - |
| `spring.ai.vectorstore.qdrant.collection-name` | The name of the collection to use | `vector_store` |
| `spring.ai.vectorstore.qdrant.use-tls` | Whether to use TLS(HTTPS) | `false` |
| `spring.ai.vectorstore.qdrant.initialize-schema` | Whether to initialize the schema | `false` |

<a id="_manual_configuration"></a>

## Manual Configuration

Instead of using the Spring Boot auto-configuration, you can manually configure the Qdrant vector store. For this you need to add the `spring-ai-qdrant-store` to your project:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-qdrant-store</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-qdrant-store'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

Create a Qdrant client bean:

```java
@Bean
public QdrantClient qdrantClient() {
    QdrantGrpcClient.Builder grpcClientBuilder =
        QdrantGrpcClient.newBuilder(
            "<QDRANT_HOSTNAME>",
            <QDRANT_GRPC_PORT>,
            <IS_TLS>);
    grpcClientBuilder.withApiKey("<QDRANT_API_KEY>");

    return new QdrantClient(grpcClientBuilder.build());
}
```

Then create the `QdrantVectorStore` bean using the builder pattern:

```java
@Bean
public VectorStore vectorStore(QdrantClient qdrantClient, EmbeddingModel embeddingModel) {
    return QdrantVectorStore.builder(qdrantClient, embeddingModel)
        .collectionName("custom-collection")     // Optional: defaults to "vector_store"
        .initializeSchema(true)                  // Optional: defaults to false
        .batchingStrategy(new TokenCountBatchingStrategy()) // Optional: defaults to TokenCountBatchingStrategy
        .build();
}

// This can be any EmbeddingModel implementation
@Bean
public EmbeddingModel embeddingModel() {
    return new OpenAiEmbeddingModel(new OpenAiApi(System.getenv("OPENAI_API_KEY")));
}
```

<a id="_metadata_filtering"></a>

## Metadata Filtering

You can leverage the generic, portable [metadata filters](../vectordbs.md#metadata-filters) with Qdrant store as well.

For example, you can use either the text expression language:

```java
vectorStore.similaritySearch(
    SearchRequest.builder()
        .query("The World")
        .topK(TOP_K)
        .similarityThreshold(SIMILARITY_THRESHOLD)
        .filterExpression("author in ['john', 'jill'] && article_type == 'blog'").build());
```

or programmatically using the `Filter.Expression` DSL:

```java
FilterExpressionBuilder b = new FilterExpressionBuilder();

vectorStore.similaritySearch(SearchRequest.builder()
    .query("The World")
    .topK(TOP_K)
    .similarityThreshold(SIMILARITY_THRESHOLD)
    .filterExpression(b.and(
        b.in("author", "john", "jill"),
        b.eq("article_type", "blog")).build()).build());
```

> [!NOTE]
> These (portable) filter expressions get automatically converted into the proprietary Qdrant [filter expressions](https://qdrant.tech/documentation/concepts/filtering/).

<a id="_accessing_the_native_client"></a>

## Accessing the Native Client

The Qdrant Vector Store implementation provides access to the underlying native Qdrant client (`QdrantClient`) through the `getNativeClient()` method:

```java
QdrantVectorStore vectorStore = context.getBean(QdrantVectorStore.class);
Optional<QdrantClient> nativeClient = vectorStore.getNativeClient();

if (nativeClient.isPresent()) {
    QdrantClient client = nativeClient.get();
    // Use the native client for Qdrant-specific operations
}
```

The native client gives you access to Qdrant-specific features and operations that might not be exposed through the `VectorStore` interface.
