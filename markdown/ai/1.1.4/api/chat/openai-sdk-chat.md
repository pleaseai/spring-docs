---
title: "OpenAI SDK Chat (Official)"
source: "ROOT:api/chat/openai-sdk-chat.adoc"
---

# OpenAI SDK Chat (Official)

Spring AI supports OpenAI’s language models through the OpenAI Java SDK, providing a robust and officially-maintained integration with OpenAI’s services including Microsoft Foundry and GitHub Models.

> [!NOTE]
> This implementation uses the official [OpenAI Java SDK](https://github.com/openai/openai-java) from OpenAI. For the alternative Spring AI implementation, see [OpenAI Chat](openai-chat.md).

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

Spring AI provides Spring Boot auto-configuration for the OpenAI SDK Chat Client.
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

<a id="_microsoft_foundry_azure_openai_properties"></a>

#### Microsoft Foundry (Azure OpenAI) Properties

The OpenAI SDK implementation provides native support for Microsoft Foundry (Azure OpenAI) with automatic configuration:

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

<a id="_chat_model_properties"></a>

#### Chat Model Properties

The prefix `spring.ai.openai-sdk.chat` is the property prefix for configuring the chat model implementation:

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.openai-sdk.chat.options.model | Name of the OpenAI chat model to use. You can select between models such as: `gpt-5-mini`, `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `o1`, `o3-mini`, and more. See the [models](https://platform.openai.com/docs/models) page for more information. | `gpt-5-mini` |
| spring.ai.openai-sdk.chat.options.temperature | The sampling temperature to use that controls the apparent creativity of generated completions. Higher values will make output more random while lower values will make results more focused and deterministic. It is not recommended to modify `temperature` and `top_p` for the same completions request as the interaction of these two settings is difficult to predict. | 1.0 |
| spring.ai.openai-sdk.chat.options.frequency-penalty | Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model’s likelihood to repeat the same line verbatim. | 0.0 |
| spring.ai.openai-sdk.chat.options.logit-bias | Modify the likelihood of specified tokens appearing in the completion. | - |
| spring.ai.openai-sdk.chat.options.logprobs | Whether to return log probabilities of the output tokens. | false |
| spring.ai.openai-sdk.chat.options.top-logprobs | An integer between 0 and 5 specifying the number of most likely tokens to return at each token position. Requires `logprobs` to be true. | - |
| spring.ai.openai-sdk.chat.options.max-tokens | The maximum number of tokens to generate. **Use for non-reasoning models** (e.g., gpt-4o, gpt-3.5-turbo). **Cannot be used with reasoning models** (e.g., o1, o3, o4-mini series). **Mutually exclusive with maxCompletionTokens**. | - |
| spring.ai.openai-sdk.chat.options.max-completion-tokens | An upper bound for the number of tokens that can be generated for a completion, including visible output tokens and reasoning tokens. **Required for reasoning models** (e.g., o1, o3, o4-mini series). **Cannot be used with non-reasoning models**. **Mutually exclusive with maxTokens**. | - |
| spring.ai.openai-sdk.chat.options.n | How many chat completion choices to generate for each input message. | 1 |
| spring.ai.openai-sdk.chat.options.output-modalities | List of output modalities. Can include "text" and "audio". | - |
| spring.ai.openai-sdk.chat.options.output-audio | Parameters for audio output. Use `AudioParameters` with voice (ALLOY, ASH, BALLAD, CORAL, ECHO, FABLE, ONYX, NOVA, SAGE, SHIMMER) and format (MP3, FLAC, OPUS, PCM16, WAV, AAC). | - |
| spring.ai.openai-sdk.chat.options.presence-penalty | Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far. | 0.0 |
| spring.ai.openai-sdk.chat.options.response-format.type | Response format type: `TEXT`, `JSON_OBJECT`, or `JSON_SCHEMA`. | TEXT |
| spring.ai.openai-sdk.chat.options.response-format.json-schema | JSON schema for structured outputs when type is `JSON_SCHEMA`. | - |
| spring.ai.openai-sdk.chat.options.seed | If specified, the system will make a best effort to sample deterministically for reproducible results. | - |
| spring.ai.openai-sdk.chat.options.stop | Up to 4 sequences where the API will stop generating further tokens. | - |
| spring.ai.openai-sdk.chat.options.top-p | An alternative to sampling with temperature, called nucleus sampling. | - |
| spring.ai.openai-sdk.chat.options.user | A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. | - |
| spring.ai.openai-sdk.chat.options.parallel-tool-calls | Whether to enable parallel function calling during tool use. | true |
| spring.ai.openai-sdk.chat.options.reasoning-effort | Constrains effort on reasoning for reasoning models: `low`, `medium`, or `high`. | - |
| spring.ai.openai-sdk.chat.options.verbosity | Controls the verbosity of the model’s response. | - |
| spring.ai.openai-sdk.chat.options.store | Whether to store the output of this chat completion request for use in OpenAI’s model distillation or evals products. | false |
| spring.ai.openai-sdk.chat.options.metadata | Developer-defined tags and values used for filtering completions in the dashboard. | - |
| spring.ai.openai-sdk.chat.options.service-tier | Specifies the latency tier to use: `auto`, `default`, `flex`, or `priority`. | - |
| spring.ai.openai-sdk.chat.options.stream-options.include-usage | Whether to include usage statistics in streaming responses. | false |
| spring.ai.openai-sdk.chat.options.stream-options.include-obfuscation | Whether to include obfuscation in streaming responses. | false |
| spring.ai.openai-sdk.chat.options.tool-choice | Controls which (if any) function is called by the model. | - |
| spring.ai.openai-sdk.chat.options.internal-tool-execution-enabled | If false, Spring AI will proxy tool calls to the client for manual handling. If true (default), Spring AI handles function calls internally. | true |

> [!NOTE]
> When using GPT-5 models such as `gpt-5`, `gpt-5-mini`, and `gpt-5-nano`, the `temperature` parameter is not supported.
> These models are optimized for reasoning and do not use temperature.
> Specifying a temperature value will result in an error.
> In contrast, conversational models like `gpt-5-chat` do support the `temperature` parameter.

> [!TIP]
> All properties prefixed with `spring.ai.openai-sdk.chat.options` can be overridden at runtime by adding request-specific [Runtime Options](#chat-options) to the `Prompt` call.

<a id="_token_limit_parameters_model_specific_usage"></a>

### Token Limit Parameters: Model-Specific Usage

OpenAI provides two mutually exclusive parameters for controlling token generation limits:

| Parameter | Use Case | Compatible Models |
| --- | --- | --- |
| `maxTokens` | Non-reasoning models | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo |
| `maxCompletionTokens` | Reasoning models | o1, o1-mini, o1-preview, o3, o4-mini series |

> [!IMPORTANT]
> These parameters are **mutually exclusive**. Setting both will result in an API error from OpenAI.

<a id="_usage_examples"></a>

#### Usage Examples

**For non-reasoning models (gpt-4o, gpt-3.5-turbo):**

```java
ChatResponse response = chatModel.call(
    new Prompt(
        "Explain quantum computing in simple terms.",
        OpenAiSdkChatOptions.builder()
            .model("gpt-4o")
            .maxTokens(150)  // Use maxTokens for non-reasoning models
        .build()
    ));
```

**For reasoning models (o1, o3 series):**

```java
ChatResponse response = chatModel.call(
    new Prompt(
        "Solve this complex math problem step by step: ...",
        OpenAiSdkChatOptions.builder()
            .model("o1-preview")
            .maxCompletionTokens(1000)  // Use maxCompletionTokens for reasoning models
        .build()
    ));
```

<a id="chat-options"></a>

## Runtime Options

The [OpenAiSdkChatOptions.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai-sdk/src/main/java/org/springframework/ai/openaisdk/OpenAiSdkChatOptions.java) class provides model configurations such as the model to use, the temperature, the frequency penalty, etc.

On start-up, the default options can be configured with the `OpenAiSdkChatModel(options)` constructor or the `spring.ai.openai-sdk.chat.options.*` properties.

At run-time, you can override the default options by adding new, request-specific options to the `Prompt` call.
For example, to override the default model and temperature for a specific request:

```java
ChatResponse response = chatModel.call(
    new Prompt(
        "Generate the names of 5 famous pirates.",
        OpenAiSdkChatOptions.builder()
            .model("gpt-4o")
            .temperature(0.4)
        .build()
    ));
```

> [!TIP]
> In addition to the model specific [OpenAiSdkChatOptions](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai-sdk/src/main/java/org/springframework/ai/openaisdk/OpenAiSdkChatOptions.java) you can use a portable [ChatOptions](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/chat/prompt/ChatOptions.java) instance, created with [ChatOptions#builder()](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/chat/prompt/DefaultChatOptionsBuilder.java).

<a id="_tool_calling"></a>

## Tool Calling

You can register custom Java functions or methods with the `OpenAiSdkChatModel` and have the OpenAI model intelligently choose to output a JSON object containing arguments to call one or many of the registered functions/tools.
This is a powerful technique to connect the LLM capabilities with external tools and APIs.
Read more about [Tool Calling](../tools.md).

Example usage:

```java
var chatOptions = OpenAiSdkChatOptions.builder()
    .toolCallbacks(List.of(
        FunctionToolCallback.builder("getCurrentWeather", new WeatherService())
            .description("Get the weather in location")
            .inputType(WeatherService.Request.class)
            .build()))
    .build();

ChatResponse response = chatModel.call(
    new Prompt("What's the weather like in San Francisco?", chatOptions));
```

<a id="_multimodal"></a>

## Multimodal

Multimodality refers to a model’s ability to simultaneously understand and process information from various sources, including text, images, audio, and other data formats.

<a id="_vision"></a>

### Vision

OpenAI models that offer vision multimodal support include `gpt-4`, `gpt-4o`, and `gpt-4o-mini`.
Refer to the [Vision](https://platform.openai.com/docs/guides/vision) guide for more information.

Spring AI’s [Message](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/chat/messages/Message.java) interface facilitates multimodal AI models by introducing the [Media](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-commons/src/main/java/org/springframework/ai/content/Media.java) type.

Below is a code example illustrating the fusion of user text with an image:

```java
var imageResource = new ClassPathResource("/multimodal.test.png");

var userMessage = new UserMessage(
    "Explain what do you see on this picture?",
    List.of(new Media(MimeTypeUtils.IMAGE_PNG, imageResource)));

ChatResponse response = chatModel.call(
    new Prompt(userMessage,
        OpenAiSdkChatOptions.builder()
            .model("gpt-4o")
            .build()));
```

Or using an image URL:

```java
var userMessage = new UserMessage(
    "Explain what do you see on this picture?",
    List.of(Media.builder()
        .mimeType(MimeTypeUtils.IMAGE_PNG)
        .data(URI.create("https://docs.spring.io/spring-ai/reference/_images/multimodal.test.png"))
        .build()));

ChatResponse response = chatModel.call(new Prompt(userMessage));
```

> [!TIP]
> You can pass multiple images as well.

<a id="_audio"></a>

### Audio

OpenAI models that offer audio input support include `gpt-4o-audio-preview`.
Refer to the [Audio](https://platform.openai.com/docs/guides/audio) guide for more information.

Spring AI supports base64-encoded audio files with the message.
Currently, OpenAI supports the following media types: `audio/mp3` and `audio/wav`.

Example of audio input:

```java
var audioResource = new ClassPathResource("speech1.mp3");

var userMessage = new UserMessage(
    "What is this recording about?",
    List.of(new Media(MimeTypeUtils.parseMimeType("audio/mp3"), audioResource)));

ChatResponse response = chatModel.call(
    new Prompt(userMessage,
        OpenAiSdkChatOptions.builder()
            .model("gpt-4o-audio-preview")
            .build()));
```

<a id="_output_audio"></a>

### Output Audio

The `gpt-4o-audio-preview` model can generate audio responses.

Example of generating audio output:

```java
var userMessage = new UserMessage("Tell me a joke about Spring Framework");

ChatResponse response = chatModel.call(
    new Prompt(userMessage,
        OpenAiSdkChatOptions.builder()
            .model("gpt-4o-audio-preview")
            .outputModalities(List.of("text", "audio"))
            .outputAudio(new AudioParameters(Voice.ALLOY, AudioResponseFormat.WAV))
            .build()));

String text = response.getResult().getOutput().getText(); // audio transcript
byte[] waveAudio = response.getResult().getOutput().getMedia().get(0).getDataAsByteArray(); // audio data
```

<a id="_structured_outputs"></a>

## Structured Outputs

OpenAI provides custom [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) APIs that ensure your model generates responses conforming strictly to your provided `JSON Schema`.

<a id="_configuration"></a>

### Configuration

You can set the response format programmatically with the `OpenAiSdkChatOptions` builder:

```java
String jsonSchema = """
    {
        "type": "object",
        "properties": {
            "steps": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "explanation": { "type": "string" },
                        "output": { "type": "string" }
                    },
                    "required": ["explanation", "output"],
                    "additionalProperties": false
                }
            },
            "final_answer": { "type": "string" }
        },
        "required": ["steps", "final_answer"],
        "additionalProperties": false
    }
    """;

Prompt prompt = new Prompt(
    "how can I solve 8x + 7 = -23",
    OpenAiSdkChatOptions.builder()
        .model("gpt-4o-mini")
        .responseFormat(ResponseFormat.builder()
            .type(ResponseFormat.Type.JSON_SCHEMA)
            .jsonSchema(jsonSchema)
            .build())
        .build());

ChatResponse response = chatModel.call(prompt);
```

<a id="_integrating_with_beanoutputconverter"></a>

### Integrating with BeanOutputConverter

You can leverage existing [BeanOutputConverter](../structured-output-converter.md#_bean_output_converter) utilities:

```java
record MathReasoning(
    @JsonProperty(required = true, value = "steps") Steps steps,
    @JsonProperty(required = true, value = "final_answer") String finalAnswer) {

    record Steps(
        @JsonProperty(required = true, value = "items") Items[] items) {

        record Items(
            @JsonProperty(required = true, value = "explanation") String explanation,
            @JsonProperty(required = true, value = "output") String output) {
        }
    }
}

var outputConverter = new BeanOutputConverter<>(MathReasoning.class);
String jsonSchema = outputConverter.getJsonSchema();

Prompt prompt = new Prompt(
    "how can I solve 8x + 7 = -23",
    OpenAiSdkChatOptions.builder()
        .model("gpt-4o-mini")
        .responseFormat(ResponseFormat.builder()
            .type(ResponseFormat.Type.JSON_SCHEMA)
            .jsonSchema(jsonSchema)
            .build())
        .build());

ChatResponse response = chatModel.call(prompt);
MathReasoning mathReasoning = outputConverter.convert(
    response.getResult().getOutput().getText());
```

<a id="_sample_controller"></a>

## Sample Controller

[Create](https://start.spring.io/) a new Spring Boot project and add the `spring-ai-openai-sdk` to your pom (or gradle) dependencies.

Add an `application.properties` file under the `src/main/resources` directory to configure the OpenAI SDK chat model:

```application.properties
spring.ai.openai-sdk.api-key=YOUR_API_KEY
spring.ai.openai-sdk.chat.options.model=gpt-5-mini
spring.ai.openai-sdk.chat.options.temperature=0.7
```

> [!TIP]
> Replace the `api-key` with your OpenAI credentials.

This will create an `OpenAiSdkChatModel` implementation that you can inject into your classes.
Here is an example of a simple `@RestController` class that uses the chat model for text generations.

```java
@RestController
public class ChatController {

    private final OpenAiSdkChatModel chatModel;

    @Autowired
    public ChatController(OpenAiSdkChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/ai/generate")
    public Map<String,String> generate(
            @RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        return Map.of("generation", chatModel.call(message));
    }

    @GetMapping("/ai/generateStream")
    public Flux<ChatResponse> generateStream(
            @RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        Prompt prompt = new Prompt(new UserMessage(message));
        return chatModel.stream(prompt);
    }
}
```

<a id="_manual_configuration"></a>

## Manual Configuration

The [OpenAiSdkChatModel](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai-sdk/src/main/java/org/springframework/ai/openaisdk/OpenAiSdkChatModel.java) implements the `ChatModel` and uses the official OpenAI Java SDK to connect to the OpenAI service.

Add the `spring-ai-openai-sdk` dependency to your project’s Maven `pom.xml` file:

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

Next, create an `OpenAiSdkChatModel` and use it for text generations:

```java
var chatOptions = OpenAiSdkChatOptions.builder()
    .model("gpt-4o")
    .temperature(0.7)
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .build();

var chatModel = OpenAiSdkChatModel.builder()
    .options(chatOptions)
    .build();

ChatResponse response = chatModel.call(
    new Prompt("Generate the names of 5 famous pirates."));

// Or with streaming responses
Flux<ChatResponse> response = chatModel.stream(
    new Prompt("Generate the names of 5 famous pirates."));
```

<a id="_microsoft_foundry_configuration"></a>

### Microsoft Foundry Configuration

For Microsoft Foundry :

```java
var chatOptions = OpenAiSdkChatOptions.builder()
    .baseUrl("https://your-resource.openai.azure.com")
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .deploymentName("gpt-4")
    .azureOpenAIServiceVersion(AzureOpenAIServiceVersion.V2024_10_01_PREVIEW)
    .azure(true)  // Enables Microsoft Foundry mode
    .build();

var chatModel = OpenAiSdkChatModel.builder()
    .options(chatOptions)
    .build();
```

> [!TIP]
> Microsoft Foundry supports passwordless authentication. Add the `com.azure:azure-identity` dependency to your project. If you don’t provide an API key, the implementation will automatically attempt to use Azure credentials from your environment.

<a id="_github_models_configuration"></a>

### GitHub Models Configuration

For GitHub Models:

```java
var chatOptions = OpenAiSdkChatOptions.builder()
    .baseUrl("https://models.inference.ai.azure.com")
    .apiKey(System.getenv("GITHUB_TOKEN"))
    .model("gpt-4o")
    .githubModels(true)
    .build();

var chatModel = OpenAiSdkChatModel.builder()
    .options(chatOptions)
    .build();
```

<a id="_key_differences_from_spring_ai_openai"></a>

## Key Differences from Spring AI OpenAI

This implementation differs from the [Spring AI OpenAI](openai-chat.md) implementation in several ways:

| Aspect | Official OpenAI SDK | Existing OpenAI |
| --- | --- | --- |
| **HTTP Client** | OkHttp (via official SDK) | Spring RestClient/WebClient |
| **API Updates** | Automatic via SDK updates | Manual maintenance |
| **Azure Support** | Native with passwordless auth | Manual URL construction |
| **GitHub Models** | Native support | Not supported |
| **Audio/Moderation** | Not yet supported | Fully supported |
| **Retry Logic** | SDK-managed (exponential backoff) | Spring Retry (customizable) |
| **Dependencies** | Official OpenAI SDK | Spring WebFlux |

**When to use OpenAI SDK:**

- You’re starting a new project
- You primarily use Microsoft Foundry or GitHub Models
- You want automatic API updates from OpenAI
- You don’t need audio transcription or moderation features
- You prefer official SDK support

**When to use Spring AI OpenAI:**

- You have an existing project using it
- You need audio transcription or moderation features
- You require fine-grained HTTP control
- You want native Spring reactive support
- You need custom retry strategies

<a id="_observability"></a>

## Observability

The OpenAI SDK implementation supports Spring AI’s observability features through Micrometer.
All chat model operations are instrumented for monitoring and tracing.

<a id="_limitations"></a>

## Limitations

The following features are not yet supported in the OpenAI SDK implementation:

- Audio speech generation (TTS)
- Audio transcription
- Moderation API
- File API operations

These features are available in the [Spring AI OpenAI](openai-chat.md) implementation.

<a id="_additional_resources"></a>

## Additional Resources

- [Official OpenAI Java SDK](https://github.com/openai/openai-java)
- [OpenAI Chat API Documentation](https://platform.openai.com/docs/api-reference/chat)
- [OpenAI Models](https://platform.openai.com/docs/models)
- [Microsoft Foundry Documentation](https://learn.microsoft.com/en-us/azure/ai-foundry/)
- [GitHub Models](https://github.com/marketplace/models)
