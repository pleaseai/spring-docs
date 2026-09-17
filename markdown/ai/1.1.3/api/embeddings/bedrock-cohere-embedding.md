---
title: "Cohere Embeddings"
source: "ROOT:api/embeddings/bedrock-cohere-embedding.adoc"
---

# Cohere Embeddings

Provides Bedrock Cohere Embedding model.
Integrate generative AI capabilities into essential apps and workflows that improve business outcomes.

The [AWS Bedrock Cohere Model Page](https://aws.amazon.com/bedrock/cohere-command-embed/) and [Amazon Bedrock User Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html) contains detailed information on how to use the AWS hosted model.

<a id="_prerequisites"></a>

## Prerequisites

Refer to the [Spring AI documentation on Amazon Bedrock](../bedrock.md) for setting up API access.

<a id="_add_repositories_and_bom"></a>

### Add Repositories and BOM

Spring AI artifacts are published in Maven Central and Spring Snapshot repositories.
Refer to the [Artifact Repositories](../../getting-started.md#artifact-repositories) section to add these repositories to your build system.

To help with dependency management, Spring AI provides a BOM (bill of materials) to ensure that a consistent version of Spring AI is used throughout the entire project. Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build system.

<a id="_auto_configuration"></a>

## Auto-configuration

> [!NOTE]
> There has been a significant change in the Spring AI auto-configuration, starter modules' artifact names.
> Please refer to the [upgrade notes](https://docs.spring.io/spring-ai/reference/upgrade-notes.html) for more information.

Add the `spring-ai-starter-model-bedrock` dependency to your project’s Maven `pom.xml` file:

```xml
<dependency>
  <groupId>org.springframework.ai</groupId>
  <artifactId>spring-ai-starter-model-bedrock</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```gradle
dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-model-bedrock'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

<a id="_enable_cohere_embedding_support"></a>

### Enable Cohere Embedding Support

By default, the Cohere embedding model is disabled.
To enable it, set the `spring.ai.model.embedding` property to `bedrock-cohere` in your application configuration:

```properties
spring.ai.model.embedding=bedrock-cohere
```

Alternatively, you can use Spring Expression Language (SpEL) to reference an environment variable:

```yaml
# In application.yml
spring:
  ai:
    model:
      embedding: ${AI_MODEL_EMBEDDING}
```

```bash
# In your environment or .env file
export AI_MODEL_EMBEDDING=bedrock-cohere
```

You can also set this property using Java system properties when starting your application:

```shell
java -Dspring.ai.model.embedding=bedrock-cohere -jar your-application.jar
```

<a id="_embedding_properties"></a>

### Embedding Properties

The prefix `spring.ai.bedrock.aws` is the property prefix to configure the connection to AWS Bedrock.

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.bedrock.aws.region | AWS region to use. | us-east-1 |
| spring.ai.bedrock.aws.access-key | AWS access key. | - |
| spring.ai.bedrock.aws.secret-key | AWS secret key. | - |

> [!NOTE]
> Enabling and disabling of the embedding auto-configurations are now configured via top level properties with the prefix `spring.ai.model.embedding`.
>
> To enable, spring.ai.model.embedding=bedrock-cohere (It is enabled by default)
>
> To disable, spring.ai.model.embedding=none (or any value which doesn’t match bedrock-cohere)
>
> This change is done to allow configuration of multiple models.

The prefix `spring.ai.bedrock.cohere.embedding` (defined in `BedrockCohereEmbeddingProperties`) is the property prefix that configures the embedding model implementation for Cohere.

|  |  |  |
| --- | --- | --- |
| Property | Description | Default |
| spring.ai.model.embedding | Enable or disable support for Cohere | bedrock-cohere |
| spring.ai.bedrock.cohere.embedding.enabled (Removed and no longer valid) | Enable or disable support for Cohere | false |
| spring.ai.bedrock.cohere.embedding.model | The model id to use. See the [CohereEmbeddingModel](https://github.com/spring-projects/spring-ai/blob/056b95a00efa5b014a1f488329fbd07a46c02378/models/spring-ai-bedrock/src/main/java/org/springframework/ai/bedrock/cohere/api/CohereEmbeddingBedrockApi.java#L150) for the supported models. | cohere.embed-multilingual-v3 |
| spring.ai.bedrock.cohere.embedding.options.input-type | Prepends special tokens to differentiate each type from one another. You should not mix different types together, except when mixing types for search and retrieval. In this case, embed your corpus with the search\_document type and embedded queries with type search\_query type. | SEARCH\_DOCUMENT |
| spring.ai.bedrock.cohere.embedding.options.truncate | Specifies how the API handles inputs longer than the maximum token length. If you specify LEFT or RIGHT, the model discards the input until the remaining input is exactly the maximum input token length for the model. | NONE |

> [!NOTE]
> When accessing Cohere via Amazon Bedrock, the functionality of truncating is not available.  This is an issue with Amazon Bedrock.   The Spring AI class `BedrockCohereEmbeddingModel` will truncate to 2048 character length, which is the maximum supported by the model.

Look at the [CohereEmbeddingModel](https://github.com/spring-projects/spring-ai/blob/056b95a00efa5b014a1f488329fbd07a46c02378/models/spring-ai-bedrock/src/main/java/org/springframework/ai/bedrock/cohere/api/CohereEmbeddingBedrockApi.java#L150) for other model IDs.
Supported values are: `cohere.embed-multilingual-v3` and `cohere.embed-english-v3`.
Model ID values can also be found in the [AWS Bedrock documentation for base model IDs](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids-arns.html).

> [!TIP]
> All properties prefixed with `spring.ai.bedrock.cohere.embedding.options` can be overridden at runtime by adding a request specific [Runtime Options](#embedding-options) to the `EmbeddingRequest` call.

<a id="embedding-options"></a>

## Runtime Options

The [BedrockCohereEmbeddingOptions.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-bedrock/src/main/java/org/springframework/ai/bedrock/cohere/BedrockCohereEmbeddingOptions.java) provides model configurations, such as `input-type` or `truncate`.

On start-up, the default options can be configured with the `BedrockCohereEmbeddingModel(api, options)` constructor or the `spring.ai.bedrock.cohere.embedding.options.*` properties.

At runtime you can override the default options by adding new, request-specific, options to the `EmbeddingRequest` call.
For example to override the default input type for a specific request:

```java
EmbeddingResponse embeddingResponse = embeddingModel.call(
    new EmbeddingRequest(List.of("Hello World", "World is big and salvation is near"),
        BedrockCohereEmbeddingOptions.builder()
        .inputType(InputType.SEARCH_DOCUMENT)
        .build()));
```

<a id="_sample_controller"></a>

## Sample Controller

[Create](https://start.spring.io/) a new Spring Boot project and add the `spring-ai-starter-model-bedrock` to your pom (or gradle) dependencies.

Add a `application.properties` file, under the `src/main/resources` directory, to enable and configure the Cohere Embedding model:

```
spring.ai.bedrock.aws.region=eu-central-1
spring.ai.bedrock.aws.access-key=${AWS_ACCESS_KEY_ID}
spring.ai.bedrock.aws.secret-key=${AWS_SECRET_ACCESS_KEY}

spring.ai.model.embedding=bedrock-cohere
spring.ai.bedrock.cohere.embedding.options.input-type=search-document
```

> [!TIP]
> replace the `regions`, `access-key` and `secret-key` with your AWS credentials.

This will create a `BedrockCohereEmbeddingModel` implementation that you can inject into your class.
Here is an example of a simple `@Controller` class that uses the chat model for text generations.

```java
@RestController
public class EmbeddingController {

    private final EmbeddingModel embeddingModel;

    @Autowired
    public EmbeddingController(EmbeddingModel embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    @GetMapping("/ai/embedding")
    public Map embed(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        EmbeddingResponse embeddingResponse = this.embeddingModel.embedForResponse(List.of(message));
        return Map.of("embedding", embeddingResponse);
    }
}
```

<a id="_manual_configuration"></a>

## Manual Configuration

The [BedrockCohereEmbeddingModel](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-bedrock/src/main/java/org/springframework/ai/bedrock/cohere/BedrockCohereEmbeddingModel.java) implements the `EmbeddingModel` and uses the [Low-level CohereEmbeddingBedrockApi Client](#low-level-api) to connect to the Bedrock Cohere service.

Add the `spring-ai-bedrock` dependency to your project’s Maven `pom.xml` file:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-bedrock</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```gradle
dependencies {
    implementation 'org.springframework.ai:spring-ai-bedrock'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

Next, create an [BedrockCohereEmbeddingModel](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-bedrock/src/main/java/org/springframework/ai/bedrock/cohere/BedrockCohereEmbeddingModel.java) and use it for text embeddings:

```java
var cohereEmbeddingApi =new CohereEmbeddingBedrockApi(
		CohereEmbeddingModel.COHERE_EMBED_MULTILINGUAL_V1.id(),
		EnvironmentVariableCredentialsProvider.create(), Region.US_EAST_1.id(), new ObjectMapper());
var embeddingModel = new BedrockCohereEmbeddingModel(this.cohereEmbeddingApi);

EmbeddingResponse embeddingResponse = this.embeddingModel
	.embedForResponse(List.of("Hello World", "World is big and salvation is near"));
```

<a id="low-level-api"></a>

## Low-level CohereEmbeddingBedrockApi Client

The [CohereEmbeddingBedrockApi](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-bedrock/src/main/java/org/springframework/ai/bedrock/cohere/api/CohereEmbeddingBedrockApi.java) provides is lightweight Java client on top of AWS Bedrock [Cohere Command models](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-cohere-command.html).

Following class diagram illustrates the CohereEmbeddingBedrockApi interface and building blocks:

![bedrock cohere embedding low level api](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.3/spring-ai-docs/src/main/antora/modules/ROOT/images/bedrock/bedrock-cohere-embedding-low-level-api.jpg)

The CohereEmbeddingBedrockApi supports the `cohere.embed-english-v3` and `cohere.embed-multilingual-v3` models for single and batch embedding computation.

Here is a simple snippet how to use the api programmatically:

```java
CohereEmbeddingBedrockApi api = new CohereEmbeddingBedrockApi(
		CohereEmbeddingModel.COHERE_EMBED_MULTILINGUAL_V1.id(),
		EnvironmentVariableCredentialsProvider.create(),
		Region.US_EAST_1.id(), new ObjectMapper());

CohereEmbeddingRequest request = new CohereEmbeddingRequest(
		List.of("I like to eat apples", "I like to eat oranges"),
		CohereEmbeddingRequest.InputType.search_document,
		CohereEmbeddingRequest.Truncate.NONE);

CohereEmbeddingResponse response = this.api.embedding(this.request);
```
