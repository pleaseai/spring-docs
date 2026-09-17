---
title: "GemFire Vector Store"
source: "ROOT:api/vectordbs/gemfire.adoc"
---

# GemFire Vector Store

This section walks you through setting up the `GemFireVectorStore` to store document embeddings and perform similarity searches.

[GemFire](https://tanzu.vmware.com/gemfire) is a distributed, in-memory, key-value store performing read and write operations at blazingly fast speeds. It offers highly available parallel message queues, continuous availability, and an event-driven architecture you can scale dynamically without downtime. As your data size requirements increase to support high-performance, real-time apps, GemFire can easily scale linearly.

[GemFire VectorDB](https://docs.vmware.com/en/VMware-GemFire-VectorDB/1.0/gemfire-vectordb/overview.html) extends GemFire’s capabilities, serving as a versatile vector database that efficiently stores, retrieves, and performs vector similarity searches.

<a id="_prerequisites"></a>

## Prerequisites

1. A GemFire cluster with the GemFire VectorDB extension enabled

   - [Install GemFire VectorDB extension](https://docs.vmware.com/en/VMware-GemFire-VectorDB/1.0/gemfire-vectordb/install.html)
1. An `EmbeddingModel` bean to compute the document embeddings. Refer to the [EmbeddingModel](../embeddings.md#available-implementations) section for more information.
An option that runs locally on your machine is [ONNX](../embeddings/onnx.md) and the all-MiniLM-L6-v2 Sentence Transformers.

<a id="_auto_configuration"></a>

## Auto-configuration

> [!NOTE]
> There has been a significant change in the Spring AI auto-configuration, starter modules' artifact names.
> Please refer to the [upgrade notes](https://docs.spring.io/spring-ai/reference/upgrade-notes.html) for more information.

Add the GemFire VectorStore Spring Boot starter to you project’s Maven build file `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-vector-store-gemfire</artifactId>
</dependency>
```

or to your Gradle `build.gradle` file

```xml
dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-vector-store-gemfire'
}
```

<a id="_configuration_properties"></a>

### Configuration properties

You can use the following properties in your Spring Boot configuration to further configure the `GemFireVectorStore`.

| Property | Default value |
| --- | --- |
| `spring.ai.vectorstore.gemfire.host` | localhost |
| `spring.ai.vectorstore.gemfire.port` | 8080 |
| `spring.ai.vectorstore.gemfire.initialize-schema` | `false` |
| `spring.ai.vectorstore.gemfire.index-name` | spring-ai-gemfire-store |
| `spring.ai.vectorstore.gemfire.beam-width` | 100 |
| `spring.ai.vectorstore.gemfire.max-connections` | 16 |
| `spring.ai.vectorstore.gemfire.vector-similarity-function` | COSINE |
| `spring.ai.vectorstore.gemfire.fields` | \[\] |
| `spring.ai.vectorstore.gemfire.buckets` | 0 |

<a id="_manual_configuration"></a>

## Manual Configuration

To use just the `GemFireVectorStore`, without Spring Boot’s Auto-configuration add the following dependency to your project’s Maven `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-gemfire-store</artifactId>
</dependency>
```

For Gradle users, add the following to your `build.gradle` file under the dependencies block to use just the `GemFireVectorStore`:

```
dependencies {
    implementation 'org.springframework.ai:spring-ai-gemfire-store'
}
```

<a id="_usage"></a>

## Usage

Here is a sample that creates an instance of the `GemfireVectorStore` instead of using AutoConfiguration

```java
@Bean
public GemFireVectorStore vectorStore(EmbeddingModel embeddingModel) {
    return GemFireVectorStore.builder(embeddingModel)
        .host("localhost")
        .port(7071)
        .indexName("my-vector-index")
        .initializeSchema(true)
        .build();
}
```

> [!NOTE]
> The GemFire VectorStore does not yet support [metadata filters](../vectordbs.md#metadata-filters).

> [!NOTE]
> The default configuration connects to a GemFire cluster at `localhost:8080`

- In your application, create a few documents:

```java
List<Document> documents = List.of(
   new Document("Spring AI rocks!! Spring AI rocks!! Spring AI rocks!! Spring AI rocks!! Spring AI rocks!!", Map.of("country", "UK", "year", 2020)),
   new Document("The World is Big and Salvation Lurks Around the Corner", Map.of()),
   new Document("You walk forward facing the past and you turn back toward the future.", Map.of("country", "NL", "year", 2023)));
```

- Add the documents to the vector store:

```java
vectorStore.add(documents);
```

- And to retrieve documents using similarity search:

```java
List<Document> results = vectorStore.similaritySearch(
   SearchRequest.builder().query("Spring").topK(5).build());
```

You should retrieve the document containing the text "Spring AI rocks!!".

You can also limit the number of results using a similarity threshold:

```java
List<Document> results = vectorStore.similaritySearch(
   SearchRequest.builder().query("Spring").topK(5)
      .similarityThreshold(0.5d).build());
```
