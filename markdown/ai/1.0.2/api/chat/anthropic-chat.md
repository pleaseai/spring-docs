---
title: "Anthropic Chat"
source: "ROOT:api/chat/anthropic-chat.adoc"
---

# Anthropic Chat

[Anthropic Claude](https://www.anthropic.com/) is a family of foundational AI models that can be used in a variety of applications.
For developers and businesses, you can leverage the API access and build directly on top of [Anthropic’s AI infrastructure](https://www.anthropic.com/api).

Spring AI supports the Anthropic [Messaging API](https://docs.anthropic.com/claude/reference/messages_post) for sync and streaming text generations.

> [!TIP]
> Anthropic’s Claude models are also available through Amazon Bedrock Converse.
> Spring AI provides dedicated [Amazon Bedrock Converse Anthropic](bedrock-converse.md) client implementations as well.

<a id="_prerequisites"></a>

## Prerequisites

You will need to create an API key on the Anthropic portal.

Create an account at [Anthropic API dashboard](https://console.anthropic.com/dashboard) and generate the API key on the [Get API Keys](https://console.anthropic.com/settings/keys) page.

The Spring AI project defines a configuration property named `spring.ai.anthropic.api-key` that you should set to the value of the `API Key` obtained from anthropic.com.

You can set this configuration property in your `application.properties` file:

```properties
spring.ai.anthropic.api-key=<your-anthropic-api-key>
```

For enhanced security when handling sensitive information like API keys, you can use Spring Expression Language (SpEL) to reference a custom environment variable:

```yaml
# In application.yml
spring:
  ai:
    anthropic:
      api-key: ${ANTHROPIC_API_KEY}
```

```bash
# In your environment or .env file
export ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

You can also get this configuration programmatically in your application code:

```java
// Retrieve API key from a secure source or environment variable
String apiKey = System.getenv("ANTHROPIC_API_KEY");
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

Spring AI provides Spring Boot auto-configuration for the Anthropic Chat Client.
To enable it add the following dependency to your project’s Maven `pom.xml` or Gradle `build.gradle` file:

#### Maven

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-anthropic</artifactId>
</dependency>
```

#### Gradle

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-model-anthropic'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

<a id="_chat_properties"></a>

### Chat Properties

<a id="_retry_properties"></a>

#### Retry Properties

The prefix `spring.ai.retry` is used as the property prefix that lets you configure the retry mechanism for the Anthropic chat model.

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.retry.max-attempts | Maximum number of retry attempts. | 10 |
| spring.ai.retry.backoff.initial-interval | Initial sleep duration for the exponential backoff policy. | 2 sec. |
| spring.ai.retry.backoff.multiplier | Backoff interval multiplier. | 5 |
| spring.ai.retry.backoff.max-interval | Maximum backoff duration. | 3 min. |
| spring.ai.retry.on-client-errors | If false, throw a NonTransientAiException, and do not attempt retry for `4xx` client error codes | false |
| spring.ai.retry.exclude-on-http-codes | List of HTTP status codes that should NOT trigger a retry (e.g. to throw NonTransientAiException). | empty |
| spring.ai.retry.on-http-codes | List of HTTP status codes that should trigger a retry (e.g. to throw TransientAiException). | empty |

> [!NOTE]
> currently the retry policies are not applicable for the streaming API.

<a id="_connection_properties"></a>

#### Connection Properties

The prefix `spring.ai.anthropic` is used as the property prefix that lets you connect to Anthropic.

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.anthropic.base-url | The URL to connect to | [api.anthropic.com](https://api.anthropic.com) |
| spring.ai.anthropic.completions-path | The path to append to the base URL. | `/v1/chat/completions` |
| spring.ai.anthropic.version | Anthropic API version | 2023-06-01 |
| spring.ai.anthropic.api-key | The API Key | - |
| spring.ai.anthropic.beta-version | Enables new/experimental features. If set to `max-tokens-3-5-sonnet-2024-07-15` the output tokens limit is increased from `4096` to `8192` tokens (for claude-3-5-sonnet only). | `tools-2024-04-04` |

<a id="_configuration_properties"></a>

#### Configuration Properties

> [!NOTE]
> Enabling and disabling of the chat auto-configurations are now configured via top level properties with the prefix `spring.ai.model.chat`.
>
> To enable, spring.ai.model.chat=anthropic (It is enabled by default)
>
> To disable, spring.ai.model.chat=none (or any value which doesn’t match anthropic)
>
> This change is done to allow configuration of multiple models.

The prefix `spring.ai.anthropic.chat` is the property prefix that lets you configure the chat model implementation for Anthropic.

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.anthropic.chat.enabled (Removed and no longer valid) | Enable Anthropic chat model. | true |
| spring.ai.model.chat | Enable Anthropic chat model. | anthropic |
| spring.ai.anthropic.chat.options.model | This is the Anthropic Chat model to use. Supports: `claude-opus-4-0`, `claude-sonnet-4-0`, `claude-3-7-sonnet-latest`, `claude-3-5-sonnet-latest`, `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`, `claude-3-7-sonnet-latest`, `claude-sonnet-4-20250514`, `claude-opus-4-1-20250805` | `claude-opus-4-20250514` |
| spring.ai.anthropic.chat.options.temperature | The sampling temperature to use that controls the apparent creativity of generated completions. Higher values will make output more random while lower values will make results more focused and deterministic. It is not recommended to modify temperature and top\_p for the same completions request as the interaction of these two settings is difficult to predict. | 0.8 |
| spring.ai.anthropic.chat.options.max-tokens | The maximum number of tokens to generate in the chat completion. The total length of input tokens and generated tokens is limited by the model’s context length. | 500 |
| spring.ai.anthropic.chat.options.stop-sequence | Custom text sequences that will cause the model to stop generating. Our models will normally stop when they have naturally completed their turn, which will result in a response stop\_reason of "end\_turn". If you want the model to stop generating when it encounters custom strings of text, you can use the stop\_sequences parameter. If the model encounters one of the custom sequences, the response stop\_reason value will be "stop\_sequence" and the response stop\_sequence value will contain the matched stop sequence. | - |
| spring.ai.anthropic.chat.options.top-p | Use nucleus sampling. In nucleus sampling, we compute the cumulative distribution over all the options for each subsequent token in decreasing probability order and cut it off once it reaches a particular probability specified by top\_p. You should either alter temperature or top\_p, but not both. Recommended for advanced use cases only. You usually only need to use temperature. | - |
| spring.ai.anthropic.chat.options.top-k | Only sample from the top K options for each subsequent token. Used to remove "long tail" low probability responses. Learn more technical details here. Recommended for advanced use cases only. You usually only need to use temperature. | - |
| spring.ai.anthropic.chat.options.toolNames | List of tools, identified by their names, to enable for tool calling in a single prompt requests. Tools with those names must exist in the toolCallbacks registry. | - |
| spring.ai.anthropic.chat.options.toolCallbacks | Tool Callbacks to register with the ChatModel. | - |
| spring.ai.anthropic.chat.options.internal-tool-execution-enabled | If false, the Spring AI will not handle the tool calls internally, but will proxy them to the client. Then it is the client’s responsibility to handle the tool calls, dispatch them to the appropriate function, and return the results. If true (the default), the Spring AI will handle the function calls internally. Applicable only for chat models with function calling support | true |
| (**deprecated** - replaced by `toolNames`) spring.ai.anthropic.chat.options.functions | List of functions, identified by their names, to enable for function calling in a single prompt requests. Functions with those names must exist in the functionCallbacks registry. | - |
| (**deprecated** - replaced by `toolCallbacks`) spring.ai.anthropic.chat.options.functionCallbacks | Tool Function Callbacks to register with the ChatModel. | - |
| (**deprecated** - replaced by a negated `internal-tool-execution-enabled`) spring.ai.anthropic.chat.options.proxy-tool-calls | If true, the Spring AI will not handle the function calls internally, but will proxy them to the client. Then is the client’s responsibility to handle the function calls, dispatch them to the appropriate function, and return the results. If false (the default), the Spring AI will handle the function calls internally. Applicable only for chat models with function calling support | false |
| spring.ai.anthropic.chat.options.http-headers | Optional HTTP headers to be added to the chat completion request. | - |

> [!TIP]
> For the latest list of model aliases and their descriptions, see the [official Anthropic model aliases documentation](https://docs.anthropic.com/en/docs/about-claude/models/overview#model-aliases).

> [!TIP]
> All properties prefixed with `spring.ai.anthropic.chat.options` can be overridden at runtime by adding a request specific [Runtime Options](#chat-options) to the `Prompt` call.

<a id="chat-options"></a>

## Runtime Options

The [AnthropicChatOptions.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-anthropic/src/main/java/org/springframework/ai/anthropic/AnthropicChatOptions.java) provides model configurations, such as the model to use, the temperature, the max token count, etc.

On start-up, the default options can be configured with the `AnthropicChatModel(api, options)` constructor or the `spring.ai.anthropic.chat.options.*` properties.

At run-time you can override the default options by adding new, request specific, options to the `Prompt` call.
For example to override the default model and temperature for a specific request:

```java
ChatResponse response = chatModel.call(
    new Prompt(
        "Generate the names of 5 famous pirates.",
        AnthropicChatOptions.builder()
            .model("claude-3-7-sonnet-latest")
            .temperature(0.4)
        .build()
    ));
```

> [!TIP]
> In addition to the model specific [AnthropicChatOptions](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-anthropic/src/main/java/org/springframework/ai/anthropic/AnthropicChatOptions.java) you can use a portable [ChatOptions](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/chat/prompt/ChatOptions.java) instance, created with the [ChatOptions#builder()](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/chat/prompt/DefaultChatOptionsBuilder.java).

<a id="_thinking"></a>

## Thinking

Anthropic Claude models support a "thinking" feature that allows the model to show its reasoning process before providing a final answer. This feature enables more transparent and detailed problem-solving, particularly for complex questions that require step-by-step reasoning.

> [!NOTE]
> **Supported Models**
>
> The thinking feature is supported by the following Claude models:
>
> - Claude 4 models (`claude-opus-4-20250514`, `claude-sonnet-4-20250514`)
> - Claude 3.7 Sonnet (`claude-3-7-sonnet-20250219`)
>
> **Model capabilities:**
>
> - **Claude 3.7 Sonnet**: Returns full thinking output. Behavior is consistent but does not support summarized or interleaved thinking.
> - **Claude 4 models**: Support summarized thinking, interleaved thinking, and enhanced tool integration.
>
> API request structure is the same across all supported models, but output behavior varies.

<a id="_thinking_configuration"></a>

### Thinking Configuration

To enable thinking on any supported Claude model, include the following configuration in your request:

<a id="_required_configuration"></a>

#### Required Configuration

1. **Add the `thinking` object**:

   - `"type": "enabled"`
   - `budget_tokens`: Token limit for reasoning (recommend starting at 1024)
1. **Token budget rules**:

   - `budget_tokens` must typically be less than `max_tokens`
   - Claude may use fewer tokens than allocated
   - Larger budgets increase depth of reasoning but may impact latency
   - When using tool use with interleaved thinking (Claude 4 only), this constraint is relaxed, but not yet supported in Spring AI.

<a id="_key_considerations"></a>

#### Key Considerations

- **Claude 3.7** returns full thinking content in the response
- **Claude 4** returns a **summarized** version of the model’s internal reasoning to reduce latency and protect sensitive content
- **Thinking tokens are billable** as part of output tokens (even if not all are visible in response)
- **Interleaved Thinking** is only available on Claude 4 models and requires the beta header `interleaved-thinking-2025-05-14`

<a id="_tool_integration_and_interleaved_thinking"></a>

#### Tool Integration and Interleaved Thinking

Claude 4 models support interleaved thinking with tool use, allowing the model to reason between tool calls.

> [!NOTE]
> The current Spring AI implementation supports basic thinking and tool use separately, but does not yet support interleaved thinking with tool use (where thinking continues across multiple tool calls).

For details on interleaved thinking with tool use, see the [Anthropic documentation](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking#extended-thinking-with-tool-use).

<a id="_non_streaming_example"></a>

### Non-streaming Example

Here’s how to enable thinking in a non-streaming request using the ChatClient API:

```java
ChatClient chatClient = ChatClient.create(chatModel);

// For Claude 3.7 Sonnet - explicit thinking configuration required
ChatResponse response = chatClient.prompt()
    .options(AnthropicChatOptions.builder()
        .model("claude-3-7-sonnet-latest")
        .temperature(1.0)  // Temperature should be set to 1 when thinking is enabled
        .maxTokens(8192)
        .thinking(AnthropicApi.ThinkingType.ENABLED, 2048)  // Must be ≥1024 && < max_tokens
        .build())
    .user("Are there an infinite number of prime numbers such that n mod 4 == 3?")
    .call()
    .chatResponse();

// For Claude 4 models - thinking is enabled by default
ChatResponse response4 = chatClient.prompt()
    .options(AnthropicChatOptions.builder()
        .model("claude-opus-4-0")
        .maxTokens(8192)
        // No explicit thinking configuration needed
        .build())
    .user("Are there an infinite number of prime numbers such that n mod 4 == 3?")
    .call()
    .chatResponse();

// Process the response which may contain thinking content
for (Generation generation : response.getResults()) {
    AssistantMessage message = generation.getOutput();
    if (message.getText() != null) {
        // Regular text response
        System.out.println("Text response: " + message.getText());
    }
    else if (message.getMetadata().containsKey("signature")) {
        // Thinking content
        System.out.println("Thinking: " + message.getMetadata().get("thinking"));
        System.out.println("Signature: " + message.getMetadata().get("signature"));
    }
}
```

<a id="_streaming_example"></a>

### Streaming Example

You can also use thinking with streaming responses:

```java
ChatClient chatClient = ChatClient.create(chatModel);

// For Claude 3.7 Sonnet - explicit thinking configuration
Flux<ChatResponse> responseFlux = chatClient.prompt()
    .options(AnthropicChatOptions.builder()
        .model("claude-3-7-sonnet-latest")
        .temperature(1.0)
        .maxTokens(8192)
        .thinking(AnthropicApi.ThinkingType.ENABLED, 2048)
        .build())
    .user("Are there an infinite number of prime numbers such that n mod 4 == 3?")
    .stream();

// For Claude 4 models - thinking is enabled by default
Flux<ChatResponse> responseFlux4 = chatClient.prompt()
    .options(AnthropicChatOptions.builder()
        .model("claude-opus-4-0")
        .maxTokens(8192)
        // No explicit thinking configuration needed
        .build())
    .user("Are there an infinite number of prime numbers such that n mod 4 == 3?")
    .stream();

// For streaming, you might want to collect just the text responses
String textContent = responseFlux.collectList()
    .block()
    .stream()
    .map(ChatResponse::getResults)
    .flatMap(List::stream)
    .map(Generation::getOutput)
    .map(AssistantMessage::getText)
    .filter(text -> text != null && !text.isBlank())
    .collect(Collectors.joining());
```

<a id="_tool_use_integration"></a>

### Tool Use Integration

Claude 4 models integrate thinking and tool use capabilities:

- **Claude 3.7 Sonnet**: Supports both thinking and tool use, but they operate separately and require more explicit configuration
- **Claude 4 models**: Natively interleave thinking and tool use, providing deeper reasoning during tool interactions

<a id="_benefits_of_using_thinking"></a>

### Benefits of Using Thinking

The thinking feature provides several benefits:

1. **Transparency**: See the model’s reasoning process and how it arrived at its conclusion
1. **Debugging**: Identify where the model might be making logical errors
1. **Education**: Use the step-by-step reasoning as a teaching tool
1. **Complex Problem Solving**: Better results on math, logic, and reasoning tasks

Note that enabling thinking requires a higher token budget, as the thinking process itself consumes tokens from your allocation.

<a id="_toolfunction_calling"></a>

## Tool/Function Calling

You can register custom Java Tools with the `AnthropicChatModel` and have the Anthropic Claude model intelligently choose to output a JSON object containing arguments to call one or many of the registered functions.
This is a powerful technique to connect the LLM capabilities with external tools and APIs.
Read more about [Tool Calling](../tools.md).

<a id="_multimodal"></a>

## Multimodal

Multimodality refers to a model’s ability to simultaneously understand and process information from various sources, including text, pdf, images, data formats.

<a id="_images"></a>

### Images

Currently, Anthropic Claude 3 supports the `base64` source type for `images`, and the `image/jpeg`, `image/png`, `image/gif`, and `image/webp` media types.
Check the [Vision guide](https://docs.anthropic.com/claude/docs/vision) for more information.
Anthropic Claude 3.5 Sonnet also supports the `pdf` source type for `application/pdf` files.

Spring AI’s `Message` interface supports multimodal AI models by introducing the Media type.
This type contains data and information about media attachments in messages, using Spring’s `org.springframework.util.MimeType` and a `java.lang.Object` for the raw media data.

Below is a simple code example extracted from [AnthropicChatModelIT.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-anthropic/src/test/java/org/springframework/ai/anthropic/AnthropicChatModelIT.java), demonstrating the combination of user text with an image.

```java
var imageData = new ClassPathResource("/multimodal.test.png");

var userMessage = new UserMessage("Explain what do you see on this picture?",
        List.of(new Media(MimeTypeUtils.IMAGE_PNG, this.imageData)));

ChatResponse response = chatModel.call(new Prompt(List.of(this.userMessage)));

logger.info(response.getResult().getOutput().getContent());
```

It takes as an input the `multimodal.test.png` image:

![Multimodal Test Image](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.0.2/spring-ai-docs/src/main/antora/modules/ROOT/images/multimodal.test.png)

along with the text message "Explain what do you see on this picture?", and generates a response something like:

```
The image shows a close-up view of a wire fruit basket containing several pieces of fruit.
...
```

<a id="_pdf"></a>

### PDF

Starting with Sonnet 3.5 [PDF support (beta)](https://docs.anthropic.com/en/docs/build-with-claude/pdf-support) is provided.
Use the `application/pdf` media type to attach a PDF file to the message:

```java
var pdfData = new ClassPathResource("/spring-ai-reference-overview.pdf");

var userMessage = new UserMessage(
        "You are a very professional document summarization specialist. Please summarize the given document.",
        List.of(new Media(new MimeType("application", "pdf"), pdfData)));

var response = this.chatModel.call(new Prompt(List.of(userMessage)));
```

<a id="_sample_controller"></a>

## Sample Controller

[Create](https://start.spring.io/) a new Spring Boot project and add the `spring-ai-starter-model-anthropic` to your pom (or gradle) dependencies.

Add a `application.properties` file, under the `src/main/resources` directory, to enable and configure the Anthropic chat model:

```application.properties
spring.ai.anthropic.api-key=YOUR_API_KEY
spring.ai.anthropic.chat.options.model=claude-3-5-sonnet-latest
spring.ai.anthropic.chat.options.temperature=0.7
spring.ai.anthropic.chat.options.max-tokens=450
```

> [!TIP]
> Replace the `api-key` with your Anthropic credentials.

This will create a `AnthropicChatModel` implementation that you can inject into your class.
Here is an example of a simple `@Controller` class that uses the chat model for text generations.

```java
@RestController
public class ChatController {

    private final AnthropicChatModel chatModel;

    @Autowired
    public ChatController(AnthropicChatModel chatModel) {
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

<a id="_manual_configuration"></a>

## Manual Configuration

The [AnthropicChatModel](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-anthropic/src/main/java/org/springframework/ai/anthropic/AnthropicChatModel.java) implements the `ChatModel` and `StreamingChatModel` and uses the [Low-level AnthropicApi Client](#low-level-api) to connect to the Anthropic service.

Add the `spring-ai-anthropic` dependency to your project’s Maven `pom.xml` file:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-anthropic</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-anthropic'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

Next, create a `AnthropicChatModel` and use it for text generations:

```java
var anthropicApi = new AnthropicApi(System.getenv("ANTHROPIC_API_KEY"));
var anthropicChatOptions = AnthropicChatOptions.builder()
            .model("claude-3-7-sonnet-20250219")
            .temperature(0.4)
            .maxTokens(200)
        .build()
var chatModel = AnthropicChatModel.builder().anthropicApi(anthropicApi)
                .defaultOptions(anthropicChatOptions).build();

ChatResponse response = this.chatModel.call(
    new Prompt("Generate the names of 5 famous pirates."));

// Or with streaming responses
Flux<ChatResponse> response = this.chatModel.stream(
    new Prompt("Generate the names of 5 famous pirates."));
```

The `AnthropicChatOptions` provides the configuration information for the chat requests.
The `AnthropicChatOptions.Builder` is fluent options builder.

<a id="low-level-api"></a>

## Low-level AnthropicApi Client

The [AnthropicApi](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-anthropic/src/main/java/org/springframework/ai/anthropic/api/AnthropicApi.java) provides is lightweight Java client for [Anthropic Message API](https://docs.anthropic.com/claude/reference/messages_post).

Following class diagram illustrates the `AnthropicApi` chat interfaces and building blocks:

![AnthropicApi Chat API Diagram](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.0.2/spring-ai-docs/src/main/antora/modules/ROOT/images/anthropic-claude3-class-diagram.jpg)

![AnthropicApi Event Model](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.0.2/spring-ai-docs/src/main/antora/modules/ROOT/images/anthropic-claude3-events-model.jpg)

Here is a simple snippet how to use the api programmatically:

```java
AnthropicApi anthropicApi =
    new AnthropicApi(System.getenv("ANTHROPIC_API_KEY"));

AnthropicMessage chatCompletionMessage = new AnthropicMessage(
        List.of(new ContentBlock("Tell me a Joke?")), Role.USER);

// Sync request
ResponseEntity<ChatCompletionResponse> response = this.anthropicApi
    .chatCompletionEntity(new ChatCompletionRequest(AnthropicApi.ChatModel.CLAUDE_3_OPUS.getValue(),
            List.of(this.chatCompletionMessage), null, 100, 0.8, false));

// Streaming request
Flux<StreamResponse> response = this.anthropicApi
    .chatCompletionStream(new ChatCompletionRequest(AnthropicApi.ChatModel.CLAUDE_3_OPUS.getValue(),
            List.of(this.chatCompletionMessage), null, 100, 0.8, true));
```

Follow the [AnthropicApi.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-anthropic/src/main/java/org/springframework/ai/anthropic/api/AnthropicApi.java)'s JavaDoc for further information.

<a id="_low_level_api_examples"></a>

### Low-level API Examples

- The [AnthropicApiIT.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-anthropic/src/test/java/org/springframework/ai/anthropic/chat/api/AnthropicApiIT.java) test provides some general examples how to use the lightweight library.
