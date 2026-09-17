---
title: "Azure AI Service"
source: "ROOT:api/vectordbs/azure.adoc"
---

# Azure AI Service

This section will walk you through setting up the `AzureVectorStore` to store document embeddings and perform similarity searches using the Azure AI Search Service.

[Azure AI Search](https://azure.microsoft.com/en-us/products/ai-services/ai-search/) is a versatile cloud-hosted cloud information retrieval system that is part of Microsoft’s larger AI platform. Among other features, it allows users to query information using vector-based storage and retrieval.

<a id="_prerequisites"></a>

## Prerequisites

1. Azure Subscription: You will need an [Azure subscription](https://azure.microsoft.com/en-us/free/) to use any Azure service.
1. Azure AI Search Service: Create an [AI Search service](https://portal.azure.com/#create/Microsoft.Search). Once the service is created, obtain the admin apiKey from the `Keys` section under `Settings` and retrieve the endpoint from the `Url` field under the `Overview` section.
1. (Optional) Azure OpenAI Service: Create an Azure [OpenAI service](https://portal.azure.com/#create/Microsoft.AIServicesOpenAI). **NOTE:** You may have to fill out a separate form to gain access to Azure Open AI services. Once the service is created, obtain the endpoint and apiKey from the `Keys and Endpoint` section under `Resource Management`.

<a id="_configuration"></a>

## Configuration

On startup, the `AzureVectorStore` can  attempt to create a new index within your AI Search service instance if you’ve opted in by setting the relevant `initialize-schema` `boolean` property to `true` in the constructor or, if using Spring Boot, setting `…​initialize-schema=true`  in your `application.properties` file.

> [!NOTE]
> this is a breaking change! In earlier versions of Spring AI, this schema initialization happened by default.

Alternatively, you can create the index manually.

To set up an AzureVectorStore, you will need the settings retrieved from the prerequisites above along with your index name:

- Azure AI Search Endpoint
- Azure AI Search Key
- (optional) Azure OpenAI API Endpoint
- (optional) Azure OpenAI API Key

You can provide these values as OS environment variables.

```bash
export AZURE_AI_SEARCH_API_KEY=<My AI Search API Key>
export AZURE_AI_SEARCH_ENDPOINT=<My AI Search Index>
export OPENAI_API_KEY=<My Azure AI API Key> (Optional)
```

> [!NOTE]
> You can replace Azure Open AI implementation with any valid OpenAI implementation that supports the Embeddings interface. For example, you could use Spring AI’s Open AI or `TransformersEmbedding` implementations for embeddings instead of the Azure implementation.

<a id="_dependencies"></a>

## Dependencies

> [!NOTE]
> There has been a significant change in the Spring AI auto-configuration, starter modules' artifact names.
> Please refer to the [upgrade notes](https://docs.spring.io/spring-ai/reference/upgrade-notes.html) for more information.

Add these dependencies to your project:

<a id="_1_select_an_embeddings_interface_implementation_you_can_choose_between"></a>

### 1. Select an Embeddings interface implementation. You can choose between:

#### OpenAI Embedding

```xml
<dependency>
   <groupId>org.springframework.ai</groupId>
   <artifactId>spring-ai-starter-model-openai</artifactId>
</dependency>
```

#### Azure AI Embedding

```xml
<dependency>
 <groupId>org.springframework.ai</groupId>
 <artifactId>spring-ai-starter-model-azure-openai</artifactId>
</dependency>
```

#### Local Sentence Transformers Embedding

```xml
<dependency>
 <groupId>org.springframework.ai</groupId>
 <artifactId>spring-ai-starter-model-transformers</artifactId>
</dependency>
```

<a id="_2_azure_ai_search_vector_store"></a>

### 2. Azure (AI Search) Vector Store

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-azure-store</artifactId>
</dependency>
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

<a id="_configuration_properties"></a>

## Configuration Properties

You can use the following properties in your Spring Boot configuration to customize the Azure vector store.

| Property | Default value |
| --- | --- |
| `spring.ai.vectorstore.azure.url` |  |
| `spring.ai.vectorstore.azure.api-key` |  |
| `spring.ai.vectorstore.azure.useKeylessAuth` | false |
| `spring.ai.vectorstore.azure.initialize-schema` | false |
| `spring.ai.vectorstore.azure.index-name` | spring\_ai\_azure\_vector\_store |
| `spring.ai.vectorstore.azure.default-top-k` | 4 |
| `spring.ai.vectorstore.azure.default-similarity-threshold` | 0.0 |
| `spring.ai.vectorstore.azure.embedding-property` | embedding |
| `spring.ai.vectorstore.azure.index-name` | spring-ai-document-index |

<a id="_sample_code"></a>

## Sample Code

To configure an Azure `SearchIndexClient` in your application, you can use the following code:

```java
@Bean
public SearchIndexClient searchIndexClient() {
  return new SearchIndexClientBuilder().endpoint(System.getenv("AZURE_AI_SEARCH_ENDPOINT"))
    .credential(new AzureKeyCredential(System.getenv("AZURE_AI_SEARCH_API_KEY")))
    .buildClient();
}
```

To create a vector store, you can use the following code by injecting the `SearchIndexClient` bean created in the above sample along with an `EmbeddingModel` provided by the Spring AI library that implements the desired Embeddings interface.

```java
@Bean
public VectorStore vectorStore(SearchIndexClient searchIndexClient, EmbeddingModel embeddingModel) {

  return AzureVectorStore.builder(searchIndexClient, embeddingModel)
    .initializeSchema(true)
    // Define the metadata fields to be used
    // in the similarity search filters.
    .filterMetadataFields(List.of(MetadataField.text("country"), MetadataField.int64("year"),
            MetadataField.date("activationDate")))
    .defaultTopK(5)
    .defaultSimilarityThreshold(0.7)
    .indexName("spring-ai-document-index")
    .build();
}
```

> [!NOTE]
> You must list explicitly all metadata field names and types for any metadata key used in the filter expression. The list above registers filterable metadata fields: `country` of type `TEXT`, `year` of type `INT64`, and `active` of type `BOOLEAN`.
>
> If the filterable metadata fields are expanded with new entries, you have to (re)upload/update the documents with this metadata.

In your main code, create some documents:

```java
List<Document> documents = List.of(
	new Document("Spring AI rocks!! Spring AI rocks!! Spring AI rocks!! Spring AI rocks!! Spring AI rocks!!", Map.of("country", "BG", "year", 2020)),
	new Document("The World is Big and Salvation Lurks Around the Corner"),
	new Document("You walk forward facing the past and you turn back toward the future.", Map.of("country", "NL", "year", 2023)));
```

Add the documents to your vector store:

```java
vectorStore.add(documents);
```

And finally, retrieve documents similar to a query:

```java
List<Document> results = vectorStore.similaritySearch(
    SearchRequest.builder()
      .query("Spring")
      .topK(5).build());
```

If all goes well, you should retrieve the document containing the text "Spring AI rocks!!".

<a id="_metadata_filtering"></a>

### Metadata filtering

You can leverage the generic, portable [metadata filters](https://docs.spring.io/spring-ai/reference/api/vectordbs.html#_metadata_filters) with AzureVectorStore as well.

For example, you can use either the text expression language:

```java
vectorStore.similaritySearch(
   SearchRequest.builder()
      .query("The World")
      .topK(TOP_K)
      .similarityThreshold(SIMILARITY_THRESHOLD)
      .filterExpression("country in ['UK', 'NL'] && year >= 2020").build());
```

or programmatically using the expression DSL:

```java
FilterExpressionBuilder b = new FilterExpressionBuilder();

vectorStore.similaritySearch(
    SearchRequest.builder()
      .query("The World")
      .topK(TOP_K)
      .similarityThreshold(SIMILARITY_THRESHOLD)
      .filterExpression(b.and(
         b.in("country", "UK", "NL"),
         b.gte("year", 2020)).build()).build());
```

The portable filter expressions get automatically converted into the proprietary Azure Search [OData filters](https://learn.microsoft.com/en-us/azure/search/search-query-odata-filter). For example, the following portable filter expression:

```sql
country in ['UK', 'NL'] && year >= 2020
```

is converted into the following Azure OData [filter expression](https://learn.microsoft.com/en-us/azure/search/search-query-odata-filter):

```graphql
$filter search.in(meta_country, 'UK,NL', ',') and meta_year ge 2020
```

<a id="_accessing_the_native_client"></a>

## Accessing the Native Client

The Azure Vector Store implementation provides access to the underlying native Azure Search client (`SearchClient`) through the `getNativeClient()` method:

```java
AzureVectorStore vectorStore = context.getBean(AzureVectorStore.class);
Optional<SearchClient> nativeClient = vectorStore.getNativeClient();

if (nativeClient.isPresent()) {
    SearchClient client = nativeClient.get();
    // Use the native client for Azure Search-specific operations
}
```

The native client gives you access to Azure Search-specific features and operations that might not be exposed through the `VectorStore` interface.
