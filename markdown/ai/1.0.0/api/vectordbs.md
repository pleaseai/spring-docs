---
title: "Vector Databases"
source: "ROOT:api/vectordbs.adoc"
---

<a id="vector-databases"></a>

# Vector Databases

A vector database is a specialized type of database that plays an essential role in AI applications.

In vector databases, queries differ from traditional relational databases.
Instead of exact matches, they perform similarity searches.
When given a vector as a query, a vector database returns vectors that are “similar” to the query vector.
Further details on how this similarity is calculated at a high-level is provided in a [Vector Similarity](vectordbs/understand-vectordbs.md#vectordbs-similarity).

Vector databases are used to integrate your data with AI models.
The first step in their usage is to load your data into a vector database.
Then, when a user query is to be sent to the AI model, a set of similar documents is first retrieved.
These documents then serve as the context for the user’s question and are sent to the AI model, along with the user’s query.
This technique is known as [Retrieval Augmented Generation (RAG)](../concepts.md#concept-rag).

The following sections describe the Spring AI interface for using multiple vector database implementations and some high-level sample usage.

The last section is intended to demystify the underlying approach of similarity searching in vector databases.

<a id="api-overview"></a>

## API Overview

This section serves as a guide to the `VectorStore` interface and its associated classes within the Spring AI framework.

Spring AI offers an abstracted API for interacting with vector databases through the `VectorStore` interface.

Here is the `VectorStore` interface definition:

```java
public interface VectorStore extends DocumentWriter {

    default String getName() {
		return this.getClass().getSimpleName();
	}

    void add(List<Document> documents);

    void delete(List<String> idList);

    void delete(Filter.Expression filterExpression);

    default void delete(String filterExpression) { ... };

    List<Document> similaritySearch(String query);

    List<Document> similaritySearch(SearchRequest request);

    default <T> Optional<T> getNativeClient() {
		return Optional.empty();
	}
}
```

and the related `SearchRequest` builder:

```java
public class SearchRequest {

	public static final double SIMILARITY_THRESHOLD_ACCEPT_ALL = 0.0;

	public static final int DEFAULT_TOP_K = 4;

	private String query = "";

	private int topK = DEFAULT_TOP_K;

	private double similarityThreshold = SIMILARITY_THRESHOLD_ACCEPT_ALL;

	@Nullable
	private Filter.Expression filterExpression;

    public static Builder from(SearchRequest originalSearchRequest) {
		return builder().query(originalSearchRequest.getQuery())
			.topK(originalSearchRequest.getTopK())
			.similarityThreshold(originalSearchRequest.getSimilarityThreshold())
			.filterExpression(originalSearchRequest.getFilterExpression());
	}

	public static class Builder {

		private final SearchRequest searchRequest = new SearchRequest();

		public Builder query(String query) {
			Assert.notNull(query, "Query can not be null.");
			this.searchRequest.query = query;
			return this;
		}

		public Builder topK(int topK) {
			Assert.isTrue(topK >= 0, "TopK should be positive.");
			this.searchRequest.topK = topK;
			return this;
		}

		public Builder similarityThreshold(double threshold) {
			Assert.isTrue(threshold >= 0 && threshold <= 1, "Similarity threshold must be in [0,1] range.");
			this.searchRequest.similarityThreshold = threshold;
			return this;
		}

		public Builder similarityThresholdAll() {
			this.searchRequest.similarityThreshold = 0.0;
			return this;
		}

		public Builder filterExpression(@Nullable Filter.Expression expression) {
			this.searchRequest.filterExpression = expression;
			return this;
		}

		public Builder filterExpression(@Nullable String textExpression) {
			this.searchRequest.filterExpression = (textExpression != null)
					? new FilterExpressionTextParser().parse(textExpression) : null;
			return this;
		}

		public SearchRequest build() {
			return this.searchRequest;
		}

	}

	public String getQuery() {...}
	public int getTopK() {...}
	public double getSimilarityThreshold() {...}
	public Filter.Expression getFilterExpression() {...}
}

```

To insert data into the vector database, encapsulate it within a `Document` object.
The `Document` class encapsulates content from a data source, such as a PDF or Word document, and includes text represented as a string.
It also contains metadata in the form of key-value pairs, including details such as the filename.

Upon insertion into the vector database, the text content is transformed into a numerical array, or a `float[]`, known as vector embeddings, using an embedding model. Embedding models, such as [Word2Vec](https://en.wikipedia.org/wiki/Word2vec), [GLoVE](<https://en.wikipedia.org/wiki/GloVe_(machine_learning)>), and [BERT](<https://en.wikipedia.org/wiki/BERT_(language_model)>), or OpenAI’s `text-embedding-ada-002`, are used to convert words, sentences, or paragraphs into these vector embeddings.

The vector database’s role is to store and facilitate similarity searches for these embeddings. It does not generate the embeddings itself. For creating vector embeddings, the `EmbeddingModel` should be utilized.

The `similaritySearch` methods in the interface allow for retrieving documents similar to a given query string. These methods can be fine-tuned by using the following parameters:

- `k`: An integer that specifies the maximum number of similar documents to return. This is often referred to as a 'top K' search, or 'K nearest neighbors' (KNN).
- `threshold`: A double value ranging from 0 to 1, where values closer to 1 indicate higher similarity. By default, if you set a threshold of 0.75, for instance, only documents with a similarity above this value are returned.
- `Filter.Expression`: A class used for passing a fluent DSL (Domain-Specific Language) expression that functions similarly to a 'where' clause in SQL, but it applies exclusively to the metadata key-value pairs of a `Document`.
- `filterExpression`: An external DSL based on ANTLR4 that accepts filter expressions as strings. For example, with metadata keys like country, year, and `isActive`, you could use an expression such as: `country == 'UK' && year >= 2020 && isActive == true.`

Find more information on the `Filter.Expression` in the [Metadata Filters](#metadata-filters) section.

<a id="_schema_initialization"></a>

## Schema Initialization

Some vector stores require their backend schema to be initialized before usage.
It will not be initialized for you by default.
You must opt-in, by passing a `boolean` for the appropriate constructor argument or, if using Spring Boot, setting the appropriate `initialize-schema` property to `true` in `application.properties` or `application.yml`.
Check the documentation for the vector store you are using for the specific property name.

<a id="_batching_strategy"></a>

## Batching Strategy

When working with vector stores, it’s often necessary to embed large numbers of documents.
While it might seem straightforward to make a single call to embed all documents at once, this approach can lead to issues.
Embedding models process text as tokens and have a maximum token limit, often referred to as the context window size.
This limit restricts the amount of text that can be processed in a single embedding request.
Attempting to embed too many tokens in one call can result in errors or truncated embeddings.

To address this token limit, Spring AI implements a batching strategy.
This approach breaks down large sets of documents into smaller batches that fit within the embedding model’s maximum context window.
Batching not only solves the token limit issue but can also lead to improved performance and more efficient use of API rate limits.

Spring AI provides this functionality through the `BatchingStrategy` interface, which allows for processing documents in sub-batches based on their token counts.

The core `BatchingStrategy` interface is defined as follows:

```java
public interface BatchingStrategy {
    List<List<Document>> batch(List<Document> documents);
}
```

This interface defines a single method, `batch`, which takes a list of documents and returns a list of document batches.

<a id="_default_implementation"></a>

### Default Implementation

Spring AI provides a default implementation called `TokenCountBatchingStrategy`.
This strategy batches documents based on their token counts, ensuring that each batch does not exceed a calculated maximum input token count.

Key features of `TokenCountBatchingStrategy`:

1. Uses [OpenAI’s max input token count](https://platform.openai.com/docs/guides/embeddings/embedding-models) (8191) as the default upper limit.
1. Incorporates a reserve percentage (default 10%) to provide a buffer for potential overhead.
1. Calculates the actual max input token count as: `actualMaxInputTokenCount = originalMaxInputTokenCount * (1 - RESERVE_PERCENTAGE)`

The strategy estimates the token count for each document, groups them into batches without exceeding the max input token count, and throws an exception if a single document exceeds this limit.

You can also customize the `TokenCountBatchingStrategy` to better suit your specific requirements. This can be done by creating a new instance with custom parameters in a Spring Boot `@Configuration` class.

Here’s an example of how to create a custom `TokenCountBatchingStrategy` bean:

```java
@Configuration
public class EmbeddingConfig {
    @Bean
    public BatchingStrategy customTokenCountBatchingStrategy() {
        return new TokenCountBatchingStrategy(
            EncodingType.CL100K_BASE,  // Specify the encoding type
            8000,                      // Set the maximum input token count
            0.1                        // Set the reserve percentage
        );
    }
}
```

In this configuration:

1. `EncodingType.CL100K_BASE`: Specifies the encoding type used for tokenization. This encoding type is used by the `JTokkitTokenCountEstimator` to accurately estimate token counts.
1. `8000`: Sets the maximum input token count. This value should be less than or equal to the maximum context window size of your embedding model.
1. `0.1`: Sets the reserve percentage. The percentage of tokens to reserve from the max input token count. This creates a buffer for potential token count increases during processing.

By default, this constructor uses `Document.DEFAULT_CONTENT_FORMATTER` for content formatting and `MetadataMode.NONE` for metadata handling. If you need to customize these parameters, you can use the full constructor with additional parameters.

Once defined, this custom `TokenCountBatchingStrategy` bean will be automatically used by the `EmbeddingModel` implementations in your application, replacing the default strategy.

The `TokenCountBatchingStrategy` internally uses a `TokenCountEstimator` (specifically, `JTokkitTokenCountEstimator`) to calculate token counts for efficient batching. This ensures accurate token estimation based on the specified encoding type.

Additionally, `TokenCountBatchingStrategy` provides flexibility by allowing you to pass in your own implementation of the `TokenCountEstimator` interface. This feature enables you to use custom token counting strategies tailored to your specific needs. For example:

```java
TokenCountEstimator customEstimator = new YourCustomTokenCountEstimator();
TokenCountBatchingStrategy strategy = new TokenCountBatchingStrategy(
		this.customEstimator,
    8000,  // maxInputTokenCount
    0.1,   // reservePercentage
    Document.DEFAULT_CONTENT_FORMATTER,
    MetadataMode.NONE
);
```

<a id="_working_with_auto_truncation"></a>

### Working with Auto-Truncation

Some embedding models, such as Vertex AI text embedding, support an `auto_truncate` feature. When enabled, the model silently truncates text inputs that exceed the maximum size and continues processing; when disabled, it throws an explicit error for inputs that are too large.

When using auto-truncation with the batching strategy, you must configure your batching strategy with a much higher input token count than the model’s actual maximum. This prevents the batching strategy from raising exceptions for large documents, allowing the embedding model to handle truncation internally.

<a id="_configuration_for_auto_truncation"></a>

#### Configuration for Auto-Truncation

When enabling auto-truncation, set your batching strategy’s maximum input token count much higher than the model’s actual limit. This prevents the batching strategy from raising exceptions for large documents, allowing the embedding model to handle truncation internally.

Here’s an example configuration for using Vertex AI with auto-truncation and custom `BatchingStrategy` and then using them in the PgVectorStore:

```java
@Configuration
public class AutoTruncationEmbeddingConfig {

    @Bean
    public VertexAiTextEmbeddingModel vertexAiEmbeddingModel(
            VertexAiEmbeddingConnectionDetails connectionDetails) {

        VertexAiTextEmbeddingOptions options = VertexAiTextEmbeddingOptions.builder()
                .model(VertexAiTextEmbeddingOptions.DEFAULT_MODEL_NAME)
                .autoTruncate(true)  // Enable auto-truncation
                .build();

        return new VertexAiTextEmbeddingModel(connectionDetails, options);
    }

    @Bean
    public BatchingStrategy batchingStrategy() {
        // Only use a high token limit if auto-truncation is enabled in your embedding model.
        // Set a much higher token count than the model actually supports
        // (e.g., 132,900 when Vertex AI supports only up to 20,000)
        return new TokenCountBatchingStrategy(
                EncodingType.CL100K_BASE,
                132900,  // Artificially high limit
                0.1      // 10% reserve
        );
    }

    @Bean
    public VectorStore vectorStore(JdbcTemplate jdbcTemplate, EmbeddingModel embeddingModel, BatchingStrategy batchingStrategy) {
        return PgVectorStore.builder(jdbcTemplate, embeddingModel)
            // other properties omitted here
            .build();
    }
}
```

In this configuration:

1. The embedding model has auto-truncation enabled, allowing it to handle oversized inputs gracefully.
1. The batching strategy uses an artificially high token limit (132,900) that’s much larger than the actual model limit (20,000).
1. The vector store uses the configured embedding model and the custom `BatchingStrategy` bean.

<a id="_why_this_works"></a>

#### Why This Works

This approach works because:

1. The `TokenCountBatchingStrategy` checks if any single document exceeds the configured maximum and throws an `IllegalArgumentException` if it does.
1. By setting a very high limit in the batching strategy, we ensure that this check never fails.
1. Documents or batches exceeding the model’s limit are silently truncated and processed by the embedding model’s auto-truncation feature.

<a id="_best_practices"></a>

#### Best Practices

When using auto-truncation:

- Set the batching strategy’s max input token count to be at least 5-10x larger than the model’s actual limit to avoid premature exceptions from the batching strategy.
- Monitor your logs for truncation warnings from the embedding model (note: not all models log truncation events).
- Consider the implications of silent truncation on your embedding quality.
- Test with sample documents to ensure truncated embeddings still meet your requirements.
- Document this configuration for future maintainers, as it is non-standard.

> [!CAUTION]
> While auto-truncation prevents errors, it can result in incomplete embeddings. Important information at the end of long documents may be lost. If your application requires all content to be embedded, split documents into smaller chunks before embedding.

<a id="_spring_boot_auto_configuration"></a>

#### Spring Boot Auto-Configuration

If you’re using Spring Boot auto-configuration, you must provide a custom `BatchingStrategy` bean to override the default one that comes with Spring AI:

```java
@Bean
public BatchingStrategy customBatchingStrategy() {
    // This bean will override the default BatchingStrategy
    return new TokenCountBatchingStrategy(
            EncodingType.CL100K_BASE,
            132900,  // Much higher than model's actual limit
            0.1
    );
}
```

The presence of this bean in your application context will automatically replace the default batching strategy used by all vector stores.

<a id="_custom_implementation"></a>

### Custom Implementation

While `TokenCountBatchingStrategy` provides a robust default implementation, you can customize the batching strategy to fit your specific needs.
This can be done through Spring Boot’s auto-configuration.

To customize the batching strategy, define a `BatchingStrategy` bean in your Spring Boot application:

```java
@Configuration
public class EmbeddingConfig {
    @Bean
    public BatchingStrategy customBatchingStrategy() {
        return new CustomBatchingStrategy();
    }
}
```

This custom `BatchingStrategy` will then be automatically used by the `EmbeddingModel` implementations in your application.

> [!NOTE]
> Vector stores supported by Spring AI are configured to use the default `TokenCountBatchingStrategy`.
> SAP Hana vector store is not currently configured for batching.

<a id="_vectorstore_implementations"></a>

## VectorStore Implementations

These are the available implementations of the `VectorStore` interface:

- [Azure Vector Search](vectordbs/azure.md) - The [Azure](https://learn.microsoft.com/en-us/azure/search/vector-search-overview) vector store.
- [Apache Cassandra](vectordbs/apache-cassandra.md) - The [Apache Cassandra](https://cassandra.apache.org/doc/latest/cassandra/vector-search/overview.html) vector store.
- [Chroma Vector Store](vectordbs/chroma.md) - The [Chroma](https://www.trychroma.com/) vector store.
- [Elasticsearch Vector Store](vectordbs/elasticsearch.md) - The [Elasticsearch](https://www.elastic.co/) vector store.
- [GemFire Vector Store](vectordbs/gemfire.md) - The [GemFire](https://tanzu.vmware.com/content/blog/vmware-gemfire-vector-database-extension) vector store.
- [MariaDB Vector Store](vectordbs/mariadb.md) - The [MariaDB](https://mariadb.com/) vector store.
- [Milvus Vector Store](vectordbs/milvus.md) - The [Milvus](https://milvus.io/) vector store.
- [MongoDB Atlas Vector Store](vectordbs/mongodb.md) - The [MongoDB Atlas](https://www.mongodb.com/atlas/database) vector store.
- [Neo4j Vector Store](vectordbs/neo4j.md) - The [Neo4j](https://neo4j.com/) vector store.
- [OpenSearch Vector Store](vectordbs/opensearch.md) - The [OpenSearch](https://opensearch.org/platform/search/vector-database.html) vector store.
- [Oracle Vector Store](vectordbs/oracle.md) - The [Oracle Database](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/overview-ai-vector-search.html) vector store.
- [PgVector Store](vectordbs/pgvector.md) - The [PostgreSQL/PGVector](https://github.com/pgvector/pgvector) vector store.
- [Pinecone Vector Store](vectordbs/pinecone.md) - [PineCone](https://www.pinecone.io/) vector store.
- [Qdrant Vector Store](vectordbs/qdrant.md) - [Qdrant](https://www.qdrant.tech/) vector store.
- [Redis Vector Store](vectordbs/redis.md) - The [Redis](https://redis.io/) vector store.
- [SAP Hana Vector Store](vectordbs/hana.md) - The [SAP HANA](https://news.sap.com/2024/04/sap-hana-cloud-vector-engine-ai-with-business-context/) vector store.
- [Typesense Vector Store](vectordbs/typesense.md) - The [Typesense](https://typesense.org/docs/0.24.0/api/vector-search.html) vector store.
- [Weaviate Vector Store](vectordbs/weaviate.md) - The [Weaviate](https://weaviate.io/) vector store.
- [SimpleVectorStore](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-vector-store/src/main/java/org/springframework/ai/vectorstore/SimpleVectorStore.java) - A simple implementation of persistent vector storage, good for educational purposes.

More implementations may be supported in future releases.

If you have a vector database that needs to be supported by Spring AI, open an issue on GitHub or, even better, submit a pull request with an implementation.

Information on each of the `VectorStore` implementations can be found in the subsections of this chapter.

<a id="_example_usage"></a>

## Example Usage

To compute the embeddings for a vector database, you need to pick an embedding model that matches the higher-level AI model being used.

For example, with OpenAI’s ChatGPT, we use the `OpenAiEmbeddingModel` and a model named `text-embedding-ada-002`.

The Spring Boot starter’s auto-configuration for OpenAI makes an implementation of `EmbeddingModel` available in the Spring application context for dependency injection.

The general usage of loading data into a vector store is something you would do in a batch-like job, by first loading data into Spring AI’s `Document` class and then calling the `save` method.

Given a `String` reference to a source file that represents a JSON file with data we want to load into the vector database, we use Spring AI’s `JsonReader` to load specific fields in the JSON, which splits them up into small pieces and then passes those small pieces to the vector store implementation.
The `VectorStore` implementation computes the embeddings and stores the JSON and the embedding in the vector database:

```java
  @Autowired
  VectorStore vectorStore;

  void load(String sourceFile) {
            JsonReader jsonReader = new JsonReader(new FileSystemResource(sourceFile),
                    "price", "name", "shortDescription", "description", "tags");
            List<Document> documents = jsonReader.get();
            this.vectorStore.add(documents);
  }
```

Later, when a user question is passed into the AI model, a similarity search is done to retrieve similar documents, which are then "'stuffed'" into the prompt as context for the user’s question.

```java
   String question = <question from user>
   List<Document> similarDocuments = store.similaritySearch(this.question);
```

Additional options can be passed into the `similaritySearch` method to define how many documents to retrieve and a threshold of the similarity search.

<a id="metadata-filters"></a>

## Metadata Filters

This section describes various filters that you can use against the results of a query.

<a id="_filter_string"></a>

### Filter String

You can pass in an SQL-like filter expressions as a `String` to one of the `similaritySearch` overloads.

Consider the following examples:

- `"country == 'BG'"`
- `"genre == 'drama' && year >= 2020"`
- `"genre in ['comedy', 'documentary', 'drama']"`

<a id="_filter_expression"></a>

### Filter.Expression

You can create an instance of `Filter.Expression` with a `FilterExpressionBuilder` that exposes a fluent API.
A simple example is as follows:

```java
FilterExpressionBuilder b = new FilterExpressionBuilder();
Expression expression = this.b.eq("country", "BG").build();
```

You can build up sophisticated expressions by using the following operators:

```text
EQUALS: '=='
MINUS : '-'
PLUS: '+'
GT: '>'
GE: '>='
LT: '<'
LE: '<='
NE: '!='
```

You can combine expressions by using the following operators:

```text
AND: 'AND' | 'and' | '&&';
OR: 'OR' | 'or' | '||';
```

Considering the following example:

```java
Expression exp = b.and(b.eq("genre", "drama"), b.gte("year", 2020)).build();
```

You can also use the following operators:

```text
IN: 'IN' | 'in';
NIN: 'NIN' | 'nin';
NOT: 'NOT' | 'not';
```

Consider the following example:

```java
Expression exp = b.and(b.in("genre", "drama", "documentary"), b.not(b.lt("year", 2020))).build();
```

<a id="_deleting_documents_from_vector_store"></a>

## Deleting Documents from Vector Store

The Vector Store interface provides multiple methods for deleting documents, allowing you to remove data either by specific document IDs or using filter expressions.

<a id="_delete_by_document_ids"></a>

### Delete by Document IDs

The simplest way to delete documents is by providing a list of document IDs:

```java
void delete(List<String> idList);
```

This method removes all documents whose IDs match those in the provided list.
If any ID in the list doesn’t exist in the store, it will be ignored.

#### Example usage

```java
// Create and add document
Document document = new Document("The World is Big",
    Map.of("country", "Netherlands"));
vectorStore.add(List.of(document));

// Delete document by ID
vectorStore.delete(List.of(document.getId()));
```

<a id="_delete_by_filter_expression"></a>

### Delete by Filter Expression

For more complex deletion criteria, you can use filter expressions:

```java
void delete(Filter.Expression filterExpression);
```

This method accepts a `Filter.Expression` object that defines the criteria for which documents should be deleted.
It’s particularly useful when you need to delete documents based on their metadata properties.

#### Example usage

```java
// Create test documents with different metadata
Document bgDocument = new Document("The World is Big",
    Map.of("country", "Bulgaria"));
Document nlDocument = new Document("The World is Big",
    Map.of("country", "Netherlands"));

// Add documents to the store
vectorStore.add(List.of(bgDocument, nlDocument));

// Delete documents from Bulgaria using filter expression
Filter.Expression filterExpression = new Filter.Expression(
    Filter.ExpressionType.EQ,
    new Filter.Key("country"),
    new Filter.Value("Bulgaria")
);
vectorStore.delete(filterExpression);

// Verify deletion with search
SearchRequest request = SearchRequest.builder()
    .query("World")
    .filterExpression("country == 'Bulgaria'")
    .build();
List<Document> results = vectorStore.similaritySearch(request);
// results will be empty as Bulgarian document was deleted
```

<a id="_delete_by_string_filter_expression"></a>

### Delete by String Filter Expression

For convenience, you can also delete documents using a string-based filter expression:

```java
void delete(String filterExpression);
```

This method converts the provided string filter into a `Filter.Expression` object internally.
It’s useful when you have filter criteria in string format.

#### Example usage

```java
// Create and add documents
Document bgDocument = new Document("The World is Big",
    Map.of("country", "Bulgaria"));
Document nlDocument = new Document("The World is Big",
    Map.of("country", "Netherlands"));
vectorStore.add(List.of(bgDocument, nlDocument));

// Delete Bulgarian documents using string filter
vectorStore.delete("country == 'Bulgaria'");

// Verify remaining documents
SearchRequest request = SearchRequest.builder()
    .query("World")
    .topK(5)
    .build();
List<Document> results = vectorStore.similaritySearch(request);
// results will only contain the Netherlands document
```

<a id="_error_handling_when_calling_the_delete_api"></a>

### Error Handling When Calling the Delete API

All deletion methods may throw exceptions in case of errors:

The best practice is to wrap delete operations in try-catch blocks:

#### Example usage

```java
try {
    vectorStore.delete("country == 'Bulgaria'");
}
catch (Exception  e) {
    logger.error("Invalid filter expression", e);
}
```

<a id="_document_versioning_use_case"></a>

### Document Versioning Use Case

A common scenario is managing document versions where you need to upload a new version of a document while removing the old version. Here’s how to handle this using filter expressions:

#### Example usage

```java
// Create initial document (v1) with version metadata
Document documentV1 = new Document(
    "AI and Machine Learning Best Practices",
    Map.of(
        "docId", "AIML-001",
        "version", "1.0",
        "lastUpdated", "2024-01-01"
    )
);

// Add v1 to the vector store
vectorStore.add(List.of(documentV1));

// Create updated version (v2) of the same document
Document documentV2 = new Document(
    "AI and Machine Learning Best Practices - Updated",
    Map.of(
        "docId", "AIML-001",
        "version", "2.0",
        "lastUpdated", "2024-02-01"
    )
);

// First, delete the old version using filter expression
Filter.Expression deleteOldVersion = new Filter.Expression(
    Filter.ExpressionType.AND,
    Arrays.asList(
        new Filter.Expression(
            Filter.ExpressionType.EQ,
            new Filter.Key("docId"),
            new Filter.Value("AIML-001")
        ),
        new Filter.Expression(
            Filter.ExpressionType.EQ,
            new Filter.Key("version"),
            new Filter.Value("1.0")
        )
    )
);
vectorStore.delete(deleteOldVersion);

// Add the new version
vectorStore.add(List.of(documentV2));

// Verify only v2 exists
SearchRequest request = SearchRequest.builder()
    .query("AI and Machine Learning")
    .filterExpression("docId == 'AIML-001'")
    .build();
List<Document> results = vectorStore.similaritySearch(request);
// results will contain only v2 of the document
```

You can also accomplish the same using the string filter expression:

#### Example usage

```java
// Delete old version using string filter
vectorStore.delete("docId == 'AIML-001' AND version == '1.0'");

// Add new version
vectorStore.add(List.of(documentV2));
```

<a id="_performance_considerations_while_deleting_documents"></a>

### Performance Considerations While Deleting Documents

- Deleting by ID list is generally faster when you know exactly which documents to remove.
- Filter-based deletion may require scanning the index to find matching documents; however, this is vector store implementation-specific.
- Large deletion operations should be batched to avoid overwhelming the system.
- Consider using filter expressions when deleting based on document properties rather than collecting IDs first.

<a id="_understanding_vectors"></a>

## Understanding Vectors

[Understanding Vectors](vectordbs/understand-vectordbs.md)
