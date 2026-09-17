---
title: "Perplexity Chat"
source: "ROOT:api/chat/perplexity-chat.adoc"
---

# Perplexity Chat

[Perplexity AI](https://perplexity.ai/) provides a unique AI service that integrates its language models with real-time search capabilities. It offers a variety of models and supports streaming responses for conversational AI.

Spring AI integrates with Perplexity AI by reusing the existing [OpenAI](openai-chat.md) client. To get started, you’ll need to obtain a [Perplexity API Key](https://docs.perplexity.ai/guides/getting-started), configure the base URL, and select one of the supported [models](https://docs.perplexity.ai/guides/model-cards).

![spring ai perplexity integration](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.0.4/spring-ai-docs/src/main/antora/modules/ROOT/images/spring-ai-perplexity-integration.jpg)

> [!NOTE]
> The Perplexity API is not fully compatible with the OpenAI API.
> Perplexity combines realtime web search results with its language model responses.
> Unlike OpenAI, Perplexity does not expose `toolCalls` - `function call` mechanisms.
> Additionally, currently Perplexity doesn’t support multimodal messages.

Check the [PerplexityWithOpenAiChatModelIT.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/test/java/org/springframework/ai/openai/chat/proxy/PerplexityWithOpenAiChatModelIT.java) tests for examples of using Perplexity with Spring AI.

<a id="_prerequisites"></a>

## Prerequisites

- **Create an API Key**:
Visit [here](https://docs.perplexity.ai/guides/getting-started) to create an API Key.
Configure it using the `spring.ai.openai.api-key` property in your Spring AI project.
- **Set the Perplexity Base URL**:
Set the `spring.ai.openai.base-url` property to `https://api.perplexity.ai`.
- **Select a Perplexity Model**:
Use the `spring.ai.openai.chat.model=<model name>` property to specify the model.
Refer to [Supported Models](https://docs.perplexity.ai/guides/model-cards) for available options.
- **Set the chat completions path**:
Set the `spring.ai.openai.chat.completions-path` to `/chat/completions`.
Refer to [chat completions api](https://docs.perplexity.ai/api-reference/chat-completions) for more details.

You can set these configuration properties in your `application.properties` file:

```properties
spring.ai.openai.api-key=<your-perplexity-api-key>
spring.ai.openai.base-url=https://api.perplexity.ai
spring.ai.openai.chat.model=llama-3.1-sonar-small-128k-online
spring.ai.openai.chat.completions-path=/chat/completions
```

For enhanced security when handling sensitive information like API keys, you can use Spring Expression Language (SpEL) to reference custom environment variables:

```yaml
# In application.yml
spring:
  ai:
    openai:
      api-key: ${PERPLEXITY_API_KEY}
      base-url: ${PERPLEXITY_BASE_URL}
      chat:
        model: ${PERPLEXITY_MODEL}
        completions-path: ${PERPLEXITY_COMPLETIONS_PATH}
```

```bash
# In your environment or .env file
export PERPLEXITY_API_KEY=<your-perplexity-api-key>
export PERPLEXITY_BASE_URL=https://api.perplexity.ai
export PERPLEXITY_MODEL=llama-3.1-sonar-small-128k-online
export PERPLEXITY_COMPLETIONS_PATH=/chat/completions
```

You can also set these configurations programmatically in your application code:

```java
// Retrieve configuration from secure sources or environment variables
String apiKey = System.getenv("PERPLEXITY_API_KEY");
String baseUrl = System.getenv("PERPLEXITY_BASE_URL");
String model = System.getenv("PERPLEXITY_MODEL");
String completionsPath = System.getenv("PERPLEXITY_COMPLETIONS_PATH");
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

Spring AI provides Spring Boot auto-configuration for the OpenAI Chat Client.
To enable it add the following dependency to your project’s Maven `pom.xml` or Gradle `build.gradle` build files:

#### Maven

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-openai</artifactId>
</dependency>
```

#### Gradle

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-model-openai'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

<a id="_chat_properties"></a>

### Chat Properties

<a id="_retry_properties"></a>

#### Retry Properties

The prefix `spring.ai.retry` is used as the property prefix that lets you configure the retry mechanism for the OpenAI chat model.

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

The prefix `spring.ai.openai` is used as the property prefix that lets you connect to OpenAI.

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.openai.base-url | The URL to connect to. Must be set to `https://api.perplexity.ai` | - |
| spring.ai.openai.chat.api-key | Your Perplexity API Key | - |

<a id="_configuration_properties"></a>

#### Configuration Properties

> [!NOTE]
> Enabling and disabling of the chat auto-configurations are now configured via top level properties with the prefix `spring.ai.model.chat`.
>
> To enable, spring.ai.model.chat=openai (It is enabled by default)
>
> To disable, spring.ai.model.chat=none (or any value which doesn’t match openai)
>
> This change is done to allow configuration of multiple models.

The prefix `spring.ai.openai.chat` is the property prefix that lets you configure the chat model implementation for OpenAI.

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.model.chat | Enable OpenAI chat model. | openai |
| spring.ai.openai.chat.model | One of the supported [Perplexity models](https://docs.perplexity.ai/guides/model-cards). Example: `llama-3.1-sonar-small-128k-online`. | - |
| spring.ai.openai.chat.base-url | Optional overrides the spring.ai.openai.base-url to provide chat specific url. Must be set to `https://api.perplexity.ai` | - |
| spring.ai.openai.chat.completions-path | Must be set to `/chat/completions` | `/v1/chat/completions` |
| spring.ai.openai.chat.options.temperature | The amount of randomness in the response, valued between 0 inclusive and 2 exclusive. Higher values are more random, and lower values are more deterministic. Required range: `0 < x < 2`. | 0.2 |
| spring.ai.openai.chat.options.frequencyPenalty | A multiplicative penalty greater than 0. Values greater than 1.0 penalize new tokens based on their existing frequency in the text so far, decreasing the model’s likelihood to repeat the same line verbatim. A value of 1.0 means no penalty. Incompatible with presence\_penalty. Required range: `x > 0`. | 1 |
| spring.ai.openai.chat.options.maxTokens | The maximum number of completion tokens returned by the API. The total number of tokens requested in max\_tokens plus the number of prompt tokens sent in messages must not exceed the context window token limit of model requested. If left unspecified, then the model will generate tokens until either it reaches its stop token or the end of its context window. | - |
| spring.ai.openai.chat.options.presencePenalty | A value between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model’s likelihood to talk about new topics. Incompatible with `frequency_penalty`. Required range: `-2 < x < 2` | 0 |
| spring.ai.openai.chat.options.topP | The nucleus sampling threshold, valued between 0 and 1 inclusive. For each subsequent token, the model considers the results of the tokens with top\_p probability mass. We recommend either altering top\_k or top\_p, but not both. Required range: `0 < x < 1` | 0.9 |
| spring.ai.openai.chat.options.stream-usage | (For streaming only) Set to add an additional chunk with token usage statistics for the entire request. The `choices` field for this chunk is an empty array and all other chunks will also include a usage field, but with a null value. | false |

> [!TIP]
> All properties prefixed with `spring.ai.openai.chat.options` can be overridden at runtime by adding a request specific [Runtime Options](#chat-options) to the `Prompt` call.

<a id="chat-options"></a>

## Runtime Options

The [OpenAiChatOptions.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/main/java/org/springframework/ai/openai/OpenAiChatOptions.java) provides model configurations, such as the model to use, the temperature, the frequency penalty, etc.

On start-up, the default options can be configured with the `OpenAiChatModel(api, options)` constructor or the `spring.ai.openai.chat.options.*` properties.

At run-time you can override the default options by adding new, request specific, options to the `Prompt` call.
For example to override the default model and temperature for a specific request:

```java
ChatResponse response = chatModel.call(
    new Prompt(
        "Generate the names of 5 famous pirates.",
        OpenAiChatOptions.builder()
            .model("llama-3.1-sonar-large-128k-online")
            .temperature(0.4)
        .build()
    ));
```

> [!TIP]
> In addition to the model specific [OpenAiChatOptions](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/main/java/org/springframework/ai/openai/OpenAiChatOptions.java) you can use a portable [ChatOptions](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/chat/prompt/ChatOptions.java) instance, created with the [ChatOptions#builder()](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/chat/prompt/DefaultChatOptionsBuilder.java).

<a id="_function_calling"></a>

## Function Calling

> [!NOTE]
> Perplexity does not support explicit function calling. Instead, it integrates search results directly into responses.

<a id="_multimodal"></a>

## Multimodal

> [!NOTE]
> Currently, the Perplexity API doesn’t support media content.

<a id="_sample_controller"></a>

## Sample Controller

[Create](https://start.spring.io/) a new Spring Boot project and add the `spring-ai-starter-model-openai` to your pom (or gradle) dependencies.

Add a `application.properties` file, under the `src/main/resources` directory, to enable and configure the OpenAi chat model:

```application.properties
spring.ai.openai.api-key=<PERPLEXITY_API_KEY>
spring.ai.openai.base-url=https://api.perplexity.ai
spring.ai.openai.chat.completions-path=/chat/completions
spring.ai.openai.chat.options.model=llama-3.1-sonar-small-128k-online
spring.ai.openai.chat.options.temperature=0.7

# The Perplexity API doesn't support embeddings, so we need to disable it.
spring.ai.openai.embedding.enabled=false
```

> [!TIP]
> replace the `api-key` with your Perplexity Api key.

This will create a `OpenAiChatModel` implementation that you can inject into your class.
Here is an example of a simple `@Controller` class that uses the chat model for text generations.

```java
@RestController
public class ChatController {

    private final OpenAiChatModel chatModel;

    @Autowired
    public ChatController(OpenAiChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/ai/generate")
    public Map generate(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        return Map.of("generation", this.chatModel.call(message));
    }

    @GetMapping("/ai/generateStream")
	public Flux<ChatResponse> generateStream(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        Prompt prompt = new Prompt(new UserMessage(message));
        return this.chatModel.stream(prompt);
    }
}
```

<a id="_supported_models"></a>

## Supported Models

Perplexity supports several models optimized for search-enhanced conversational AI. Refer to [Supported Models](https://docs.perplexity.ai/guides/model-cards) for details.

<a id="_references"></a>

## References

- [Documentation Home](https://docs.perplexity.ai/home)
- [API Reference](https://docs.perplexity.ai/api-reference/chat-completions)
- [Getting Started](https://docs.perplexity.ai/guides/getting-started)
- [Rate Limits](https://docs.perplexity.ai/guides/rate-limits)
