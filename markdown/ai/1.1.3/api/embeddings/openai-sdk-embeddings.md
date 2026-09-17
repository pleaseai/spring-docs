---
title: "OpenAI SDK Embeddings (Official)"
source: "ROOT:api/embeddings/openai-sdk-embeddings.adoc"
---

# OpenAI SDK Embeddings (Official)

Spring AI supports OpenAI’s text embeddings models through the OpenAI Java SDK, providing a robust and officially-maintained integration with OpenAI’s services including Microsoft Foundry and GitHub Models.

> [!NOTE]
> This implementation uses the official [OpenAI Java SDK](https://github.com/openai/openai-java) from OpenAI. For the alternative Spring AI implementation, see [OpenAI Embeddings](openai-embeddings.md).

OpenAI’s text embeddings measure the relatedness of text strings.
An embedding is a vector (list) of floating point numbers. The distance between two vectors measures their relatedness. Small distances suggest high relatedness and large distances suggest low relatedness.

The OpenAI SDK module automatically detects the service provider (OpenAI, Microsoft Foundry, or GitHub Models) based on the base URL you provide.

<a id="_authentication"></a>

## Authentication

Authentication is done using a base URL and an API Key. The implementation provides flexible configuration options through Spring Boot properties or environment variables.

<a id="_using_openai"></a>

### Using OpenAI

If you are using OpenAI directly, create an account at [OpenAI signup page](https://platform.openai.com/signup) and generate an API key on the [API Keys page](https://platform.openai.com/account/api-keys).

The base URL doesn’t need to be set as it defaults to `api.openai.com/v1`:

```properties
spring.ai.openai-sdk.api-key=<your-openai-api-key>
# base-url is optional, defaults to https://api.openai.com/v1
```

Or using environment variables:

```bash
export OPENAI_API_KEY=<your-openai-api-key>
# OPENAI_BASE_URL is optional, defaults to https://api.openai.com/v1
```

<a id="_using_microsoft_foundry"></a>

### Using Microsoft Foundry

Microsoft Foundry is automatically detected when using a Microsoft Foundry URL. You can configure it using properties:

```properties
spring.ai.openai-sdk.base-url=https://<your-deployment-url>.openai.azure.com
spring.ai.openai-sdk.api-key=<your-api-key>
spring.ai.openai-sdk.microsoft-deployment-name=<your-deployment-name>
```

Or using environment variables:

```bash
export OPENAI_BASE_URL=https://<your-deployment-url>.openai.azure.com
export OPENAI_API_KEY=<your-api-key>
```

**Passwordless Authentication (Recommended for Azure):**

Microsoft Foundry supports passwordless authentication without providing an API key, which is more secure when running on Azure.

To enable passwordless authentication, add the `com.azure:azure-identity` dependency:

```xml
<dependency>
    <groupId>com.azure</groupId>
    <artifactId>azure-identity</artifactId>
</dependency>
```

Then configure without an API key:

```properties
spring.ai.openai-sdk.base-url=https://<your-deployment-url>.openai.azure.com
spring.ai.openai-sdk.microsoft-deployment-name=<your-deployment-name>
# No api-key needed - will use Azure credentials from environment
```

<a id="_using_github_models"></a>

### Using GitHub Models

GitHub Models is automatically detected when using the GitHub Models base URL. You’ll need to create a GitHub Personal Access Token (PAT) with the `models:read` scope.

```properties
spring.ai.openai-sdk.base-url=https://models.inference.ai.azure.com
spring.ai.openai-sdk.api-key=github_pat_XXXXXXXXXXX
```

Or using environment variables:

```bash
export OPENAI_BASE_URL=https://models.inference.ai.azure.com
export OPENAI_API_KEY=github_pat_XXXXXXXXXXX
```

> [!TIP]
> For enhanced security when handling sensitive information like API keys, you can use Spring Expression Language (SpEL) in your properties:

```properties
spring.ai.openai-sdk.api-key=${OPENAI_API_KEY}
```

<a id="_add_repositories_and_bom"></a>

### Add Repositories and BOM

Spring AI artifacts are published in Maven Central and Spring Snapshot repositories.
Refer to the [Artifact Repositories](../../getting-started.md#artifact-repositories) section to add these repositories to your build system.

To help with dependency management, Spring AI provides a BOM (bill of materials) to ensure that a consistent version of Spring AI is used throughout the entire project. Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build system.

<a id="_auto_configuration"></a>

## Auto-configuration

Spring AI provides Spring Boot auto-configuration for the OpenAI SDK Embedding Model.
To enable it add the following dependency to your project’s Maven `pom.xml` or Gradle `build.gradle` build files:

#### Maven

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-openai-sdk</artifactId>
</dependency>
```

#### Gradle

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-model-openai-sdk'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

<a id="_configuration_properties"></a>

### Configuration Properties

<a id="_connection_properties"></a>

#### Connection Properties

The prefix `spring.ai.openai-sdk` is used as the property prefix that lets you configure the OpenAI SDK client.

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.openai-sdk.base-url | The URL to connect to. Auto-detects from `OPENAI_BASE_URL` environment variable if not set. | [api.openai.com/v1](https://api.openai.com/v1) |
| spring.ai.openai-sdk.api-key | The API Key. Auto-detects from `OPENAI_API_KEY` environment variable if not set. | - |
| spring.ai.openai-sdk.organization-id | Optionally specify which organization to use for API requests. | - |
| spring.ai.openai-sdk.timeout | Request timeout duration. | - |
| spring.ai.openai-sdk.max-retries | Maximum number of retry attempts for failed requests. | - |
| spring.ai.openai-sdk.proxy | Proxy settings for OpenAI client (Java `Proxy` object). | - |
| spring.ai.openai-sdk.custom-headers | Custom HTTP headers to include in requests. Map of header name to header value. | - |

<a id="_microsoft_foundry_properties"></a>

#### Microsoft Foundry Properties

The OpenAI SDK implementation provides native support for Microsoft Foundry with automatic configuration:

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.openai-sdk.microsoft-foundry | Enable Microsoft Foundry mode. Auto-detected if base URL contains `openai.azure.com`, `cognitiveservices.azure.com`, or `.openai.microsoftFoundry.com`. | false |
| spring.ai.openai-sdk.microsoft-deployment-name | Microsoft Foundry deployment name. If not specified, the model name will be used. Also accessible via alias `deployment-name`. | - |
| spring.ai.openai-sdk.microsoft-foundry-service-version | Microsoft Foundry API service version. | - |
| spring.ai.openai-sdk.credential | Credential object for passwordless authentication (requires `com.azure:azure-identity` dependency). | - |

> [!TIP]
> Microsoft Foundry supports passwordless authentication. Add the `com.azure:azure-identity` dependency and the implementation will automatically attempt to use Azure credentials from the environment when no API key is provided.

<a id="_github_models_properties"></a>

#### GitHub Models Properties

Native support for GitHub Models is available:

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.openai-sdk.github-models | Enable GitHub Models mode. Auto-detected if base URL contains `models.github.ai` or `models.inference.ai.azure.com`. | false |

> [!TIP]
> GitHub Models requires a Personal Access Token with the `models:read` scope. Set it via the `OPENAI_API_KEY` environment variable or the `spring.ai.openai-sdk.api-key` property.

<a id="_embedding_model_properties"></a>

#### Embedding Model Properties

The prefix `spring.ai.openai-sdk.embedding` is the property prefix for configuring the embedding model implementation:

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.openai-sdk.embedding.metadata-mode | Document content extraction mode. | EMBED |
| spring.ai.openai-sdk.embedding.options.model | The model to use. You can select between models such as: `text-embedding-ada-002`, `text-embedding-3-small`, `text-embedding-3-large`. See the [models](https://platform.openai.com/docs/models) page for more information. | `text-embedding-ada-002` |
| spring.ai.openai-sdk.embedding.options.user | A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. | - |
| spring.ai.openai-sdk.embedding.options.dimensions | The number of dimensions the resulting output embeddings should have. Only supported in `text-embedding-3` and later models. | - |

> [!TIP]
> All properties prefixed with `spring.ai.openai-sdk.embedding.options` can be overridden at runtime by adding request-specific [Runtime Options](#embedding-options) to the `EmbeddingRequest` call.

<a id="embedding-options"></a>

## Runtime Options

The [OpenAiSdkEmbeddingOptions.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai-sdk/src/main/java/org/springframework/ai/openaisdk/OpenAiSdkEmbeddingOptions.java) provides the OpenAI configurations, such as the model to use, dimensions, and user identifier.

The default options can be configured using the `spring.ai.openai-sdk.embedding.options` properties as well.

At start-time use the `OpenAiSdkEmbeddingModel` constructor to set the default options used for all embedding requests.
At run-time you can override the default options, using a `OpenAiSdkEmbeddingOptions` instance as part of your `EmbeddingRequest`.

For example to override the default model name for a specific request:

```java
EmbeddingResponse embeddingResponse = embeddingModel.call(
    new EmbeddingRequest(List.of("Hello World", "World is big and salvation is near"),
        OpenAiSdkEmbeddingOptions.builder()
            .model("text-embedding-3-large")
            .dimensions(1024)
        .build()));
```

> [!TIP]
> In addition to the model specific [OpenAiSdkEmbeddingOptions](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai-sdk/src/main/java/org/springframework/ai/openaisdk/OpenAiSdkEmbeddingOptions.java) you can use a portable [EmbeddingOptions](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/embedding/EmbeddingOptions.java) instance, created with the builder.

<a id="_sample_controller"></a>

## Sample Controller

[Create](https://start.spring.io/) a new Spring Boot project and add the `spring-ai-openai-sdk` to your pom (or gradle) dependencies.

Add an `application.properties` file under the `src/main/resources` directory to configure the OpenAI SDK embedding model:

```application.properties
spring.ai.openai-sdk.api-key=YOUR_API_KEY
spring.ai.openai-sdk.embedding.options.model=text-embedding-ada-002
```

> [!TIP]
> Replace the `api-key` with your OpenAI credentials.

This will create an `OpenAiSdkEmbeddingModel` implementation that you can inject into your classes.
Here is an example of a simple `@RestController` class that uses the embedding model.

```java
@RestController
public class EmbeddingController {

    private final EmbeddingModel embeddingModel;

    @Autowired
    public EmbeddingController(EmbeddingModel embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    @GetMapping("/ai/embedding")
    public Map<String, Object> embed(
            @RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        EmbeddingResponse embeddingResponse = this.embeddingModel.embedForResponse(List.of(message));
        return Map.of("embedding", embeddingResponse);
    }
}
```

<a id="_manual_configuration"></a>

## Manual Configuration

The [OpenAiSdkEmbeddingModel](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai-sdk/src/main/java/org/springframework/ai/openaisdk/OpenAiSdkEmbeddingModel.java) implements the `EmbeddingModel` and uses the official OpenAI Java SDK to connect to the OpenAI service.

If you are not using Spring Boot auto-configuration, you can manually configure the OpenAI SDK Embedding Model.
For this add the `spring-ai-openai-sdk` dependency to your project’s Maven `pom.xml` file:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-sdk</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file:

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-openai-sdk'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

> [!NOTE]
> The `spring-ai-openai-sdk` dependency provides access also to the `OpenAiSdkChatModel` and `OpenAiSdkImageModel`.
> For more information about the `OpenAiSdkChatModel` refer to the [OpenAI SDK Chat](../chat/openai-sdk-chat.md) section.

Next, create an `OpenAiSdkEmbeddingModel` instance and use it to compute the similarity between two input texts:

```java
var embeddingOptions = OpenAiSdkEmbeddingOptions.builder()
    .model("text-embedding-ada-002")
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .build();

var embeddingModel = new OpenAiSdkEmbeddingModel(embeddingOptions);

EmbeddingResponse embeddingResponse = embeddingModel
    .embedForResponse(List.of("Hello World", "World is big and salvation is near"));
```

The `OpenAiSdkEmbeddingOptions` provides the configuration information for the embedding requests.
The options class offers a `builder()` for easy options creation.

<a id="_microsoft_foundry_configuration"></a>

### Microsoft Foundry Configuration

For Microsoft Foundry:

```java
var embeddingOptions = OpenAiSdkEmbeddingOptions.builder()
    .baseUrl("https://your-resource.openai.azure.com")
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .deploymentName("text-embedding-ada-002")
    .azureOpenAIServiceVersion(AzureOpenAIServiceVersion.V2024_10_01_PREVIEW)
    .azure(true)  // Enables Microsoft Foundry mode
    .build();

var embeddingModel = new OpenAiSdkEmbeddingModel(embeddingOptions);
```

> [!TIP]
> Microsoft Foundry supports passwordless authentication. Add the `com.azure:azure-identity` dependency to your project. If you don’t provide an API key, the implementation will automatically attempt to use Azure credentials from your environment.

<a id="_github_models_configuration"></a>

### GitHub Models Configuration

For GitHub Models:

```java
var embeddingOptions = OpenAiSdkEmbeddingOptions.builder()
    .baseUrl("https://models.inference.ai.azure.com")
    .apiKey(System.getenv("GITHUB_TOKEN"))
    .model("text-embedding-3-large")
    .githubModels(true)
    .build();

var embeddingModel = new OpenAiSdkEmbeddingModel(embeddingOptions);
```

<a id="_observability"></a>

## Observability

The OpenAI SDK implementation supports Spring AI’s observability features through Micrometer.
All embedding model operations are instrumented for monitoring and tracing.

<a id="_additional_resources"></a>

## Additional Resources

- [Official OpenAI Java SDK](https://github.com/openai/openai-java)
- [OpenAI Embeddings API Documentation](https://platform.openai.com/docs/api-reference/embeddings)
- [OpenAI Models](https://platform.openai.com/docs/models)
- [Microsoft Foundry Documentation](https://learn.microsoft.com/en-us/azure/ai-foundry/)
- [GitHub Models](https://github.com/marketplace/models)
