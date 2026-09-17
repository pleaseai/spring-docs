---
title: "MiniMax Chat"
source: "ROOT:api/embeddings/minimax-embeddings.adoc"
---

# MiniMax Chat

Spring AI supports the various AI language models from MiniMax. You can interact with MiniMax language models and create a multilingual conversational assistant based on MiniMax models.

<a id="_prerequisites"></a>

## Prerequisites

You will need to create an API with MiniMax to access MiniMax language models.

Create an account at [MiniMax registration page](https://www.minimaxi.com/login) and generate the token on the [API Keys page](https://www.minimaxi.com/user-center/basic-information/interface-key).

The Spring AI project defines a configuration property named `spring.ai.minimax.api-key` that you should set to the value of the `API Key` obtained from the API Keys page.

You can set this configuration property in your `application.properties` file:

```properties
spring.ai.minimax.api-key=<your-minimax-api-key>
```

For enhanced security when handling sensitive information like API keys, you can use Spring Expression Language (SpEL) to reference an environment variable:

```yaml
# In application.yml
spring:
  ai:
    minimax:
      api-key: ${MINIMAX_API_KEY}
```

```bash
# In your environment or .env file
export MINIMAX_API_KEY=<your-minimax-api-key>
```

You can also set this configuration programmatically in your application code:

```java
// Retrieve API key from a secure source or environment variable
String apiKey = System.getenv("MINIMAX_API_KEY");
```

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

Spring AI provides Spring Boot auto-configuration for the Azure MiniMax Embedding Model.
To enable it add the following dependency to your project’s Maven `pom.xml` file:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-minimax</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-model-minimax'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

<a id="_embedding_properties"></a>

### Embedding Properties

<a id="_retry_properties"></a>

#### Retry Properties

The prefix `spring.ai.retry` is used as the property prefix that lets you configure the retry mechanism for the MiniMax Embedding model.

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.retry.max-attempts | Maximum number of retry attempts. | 10 |
| spring.ai.retry.backoff.initial-interval | Initial sleep duration for the exponential backoff policy. | 2 sec. |
| spring.ai.retry.backoff.multiplier | Backoff interval multiplier. | 5 |
| spring.ai.retry.backoff.max-interval | Maximum backoff duration. | 3 min. |
| spring.ai.retry.on-client-errors | If false, throw a NonTransientAiException, and do not attempt retry for `4xx` client error codes | false |
| spring.ai.retry.exclude-on-http-codes | List of HTTP status codes that should not trigger a retry (e.g. to throw NonTransientAiException). | empty |
| spring.ai.retry.on-http-codes | List of HTTP status codes that should trigger a retry (e.g. to throw TransientAiException). | empty |

<a id="_connection_properties"></a>

#### Connection Properties

The prefix `spring.ai.minimax` is used as the property prefix that lets you connect to MiniMax.

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.minimax.base-url | The URL to connect to | [api.minimax.chat](https://api.minimax.chat) |
| spring.ai.minimax.api-key | The API Key | - |

<a id="_configuration_properties"></a>

#### Configuration Properties

> [!NOTE]
> Enabling and disabling of the embedding auto-configurations are now configured via top level properties with the prefix `spring.ai.model.embedding`.
>
> To enable, spring.ai.model.embedding=minimax (It is enabled by default)
>
> To disable, spring.ai.model.embedding=none (or any value which doesn’t match minimax)
>
> This change is done to allow configuration of multiple models.

The prefix `spring.ai.minimax.embedding` is property prefix that configures the `EmbeddingModel` implementation for MiniMax.

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.minimax.embedding.enabled (Removed and no longer valid) | Enable MiniMax embedding model. | true |
| spring.ai.model.embedding | Enable MiniMax embedding model. | minimax |
| spring.ai.minimax.embedding.base-url | Optional overrides the spring.ai.minimax.base-url to provide embedding specific url | - |
| spring.ai.minimax.embedding.api-key | Optional overrides the spring.ai.minimax.api-key to provide embedding specific api-key | - |
| spring.ai.minimax.embedding.options.model | The model to use | embo-01 |

> [!NOTE]
> You can override the common `spring.ai.minimax.base-url` and `spring.ai.minimax.api-key` for the `ChatModel` and `EmbeddingModel` implementations.
> The `spring.ai.minimax.embedding.base-url` and `spring.ai.minimax.embedding.api-key` properties if set take precedence over the common properties.
> Similarly, the `spring.ai.minimax.chat.base-url` and `spring.ai.minimax.chat.api-key` properties if set take precedence over the common properties.
> This is useful if you want to use different MiniMax accounts for different models and different model endpoints.

> [!TIP]
> All properties prefixed with `spring.ai.minimax.embedding.options` can be overridden at runtime by adding a request specific [Runtime Options](#embedding-options) to the `EmbeddingRequest` call.

<a id="embedding-options"></a>

## Runtime Options

The [MiniMaxEmbeddingOptions.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-minimax/src/main/java/org/springframework/ai/minimax/MiniMaxEmbeddingOptions.java) provides the MiniMax configurations, such as the model to use and etc.

The default options can be configured using the `spring.ai.minimax.embedding.options` properties as well.

At start-time use the `MiniMaxEmbeddingModel` constructor to set the  default options used for all embedding requests.
At run-time you can override the default options, using a `MiniMaxEmbeddingOptions` instance as part of your `EmbeddingRequest`.

For example to override the default model name for a specific request:

```java
EmbeddingResponse embeddingResponse = embeddingModel.call(
    new EmbeddingRequest(List.of("Hello World", "World is big and salvation is near"),
        MiniMaxEmbeddingOptions.builder()
            .model("Different-Embedding-Model-Deployment-Name")
        .build()));
```

<a id="_sample_controller"></a>

## Sample Controller

This will create a `EmbeddingModel` implementation that you can inject into your class.
Here is an example of a simple `@Controller` class that uses the `EmbeddingC` implementation.

```application.properties
spring.ai.minimax.api-key=YOUR_API_KEY
spring.ai.minimax.embedding.options.model=embo-01
```

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

If you are not using Spring Boot, you can manually configure the MiniMax Embedding Model.
For this add the `spring-ai-minimax` dependency to your project’s Maven `pom.xml` file:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-minimax</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-minimax'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

> [!NOTE]
> The `spring-ai-minimax` dependency provides access also to the `MiniMaxChatModel`.
> For more information about the `MiniMaxChatModel refer to the [MiniMax Chat Client](../chat/minimax-chat.html) section.

Next, create an `MiniMaxEmbeddingModel` instance and use it to compute the similarity between two input texts:

```java
var miniMaxApi = new MiniMaxApi(System.getenv("MINIMAX_API_KEY"));

var embeddingModel = new MiniMaxEmbeddingModel(minimaxApi, MetadataMode.EMBED,
MiniMaxEmbeddingOptions.builder().model("embo-01").build());

EmbeddingResponse embeddingResponse = this.embeddingModel
	.embedForResponse(List.of("Hello World", "World is big and salvation is near"));
```

The `MiniMaxEmbeddingOptions` provides the configuration information for the embedding requests.
The options class offers a `builder()` for easy options creation.
