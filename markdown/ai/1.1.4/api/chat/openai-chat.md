---
title: "OpenAI Chat"
source: "ROOT:api/chat/openai-chat.adoc"
---

# OpenAI Chat

Spring AI supports the various AI language models from OpenAI, the company behind ChatGPT, which has been instrumental in sparking interest in AI-driven text generation thanks to its creation of industry-leading text generation models and embeddings.

<a id="_prerequisites"></a>

## Prerequisites

You will need to create an API with OpenAI to access ChatGPT models.

Create an account at [OpenAI signup page](https://platform.openai.com/signup) and generate the token on the [API Keys page](https://platform.openai.com/account/api-keys).

The Spring AI project defines a configuration property named `spring.ai.openai.api-key` that you should set to the value of the `API Key` obtained from openai.com.

You can set this configuration property in your `application.properties` file:

```properties
spring.ai.openai.api-key=<your-openai-api-key>
```

For enhanced security when handling sensitive information like API keys, you can use Spring Expression Language (SpEL) to reference a custom environment variable:

```yaml
# In application.yml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
```

```bash
# In your environment or .env file
export OPENAI_API_KEY=<your-openai-api-key>
```

You can also set this configuration programmatically in your application code:

```java
// Retrieve API key from a secure source or environment variable
String apiKey = System.getenv("OPENAI_API_KEY");
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
| spring.ai.openai.base-url | The URL to connect to | [api.openai.com](https://api.openai.com) |
| spring.ai.openai.api-key | The API Key | - |
| spring.ai.openai.organization-id | Optionally, you can specify which organization to use for an API request. | - |
| spring.ai.openai.project-id | Optionally, you can specify which project to use for an API request. | - |

> [!TIP]
> For users that belong to multiple organizations (or are accessing their projects through their legacy user API key), you can optionally specify which organization and project is used for an API request.
> Usage from these API requests will count as usage for the specified organization and project.

<a id="_user_agent_header"></a>

#### User-Agent Header

Spring AI automatically sends a `User-Agent: spring-ai` header with all requests to OpenAI.
This helps OpenAI identify requests originating from Spring AI for analytics and support purposes.
This header is sent automatically and requires no configuration from Spring AI users.

If you are an API provider building an OpenAI-compatible service, you can track Spring AI usage by reading the `User-Agent` HTTP header from incoming requests on your server.

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
| spring.ai.openai.chat.enabled (Removed and no longer valid) | Enable OpenAI chat model. | true |
| spring.ai.model.chat | Enable OpenAI chat model. | openai |
| spring.ai.openai.chat.base-url | Optional override for the `spring.ai.openai.base-url` property to provide a chat-specific URL. | - |
| spring.ai.openai.chat.completions-path | The path to append to the base URL. | `/v1/chat/completions` |
| spring.ai.openai.chat.api-key | Optional override for the `spring.ai.openai.api-key` to provide a chat-specific API Key. | - |
| spring.ai.openai.chat.organization-id | Optionally, you can specify which organization to use for an API request. | - |
| spring.ai.openai.chat.project-id | Optionally, you can specify which project to use for an API request. | - |
| spring.ai.openai.chat.options.model | Name of the OpenAI chat model to use. You can select between models such as: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`, and more. See the [models](https://platform.openai.com/docs/models) page for more information. | `gpt-4o-mini` |
| spring.ai.openai.chat.options.temperature | The sampling temperature to use that controls the apparent creativity of generated completions. Higher values will make output more random while lower values will make results more focused and deterministic. It is not recommended to modify `temperature` and `top_p` for the same completions request as the interaction of these two settings is difficult to predict. | 0.8 |
| spring.ai.openai.chat.options.frequencyPenalty | Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model’s likelihood to repeat the same line verbatim. | 0.0f |
| spring.ai.openai.chat.options.logitBias | Modify the likelihood of specified tokens appearing in the completion. | - |
| spring.ai.openai.chat.options.maxTokens | The maximum number of tokens to generate in the chat completion. The total length of input tokens and generated tokens is limited by the model’s context length. **Use for non-reasoning models** (e.g., gpt-4o, gpt-3.5-turbo). **Cannot be used with reasoning models** (e.g., o1, o3, o4-mini series). **Mutually exclusive with maxCompletionTokens** - setting both will result in an API error. | - |
| spring.ai.openai.chat.options.maxCompletionTokens | An upper bound for the number of tokens that can be generated for a completion, including visible output tokens and reasoning tokens. **Required for reasoning models** (e.g., o1, o3, o4-mini series). **Cannot be used with non-reasoning models** (e.g., gpt-4o, gpt-3.5-turbo). **Mutually exclusive with maxTokens** - setting both will result in an API error. | - |
| spring.ai.openai.chat.options.n | How many chat completion choices to generate for each input message. Note that you will be charged based on the number of generated tokens across all of the choices. Keep `n` as 1 to minimize costs. | 1 |
| spring.ai.openai.chat.options.store | Whether to store the output of this chat completion request for use in our model | false |
| spring.ai.openai.chat.options.metadata | Developer-defined tags and values used for filtering completions in the chat completion dashboard | empty map |
| spring.ai.openai.chat.options.output-modalities | Output types that you would like the model to generate for this request. Most models are capable of generating text, which is the default. The `gpt-4o-audio-preview` model can also be used to generate audio. To request that this model generate both text and audio responses, you can use: `text`, `audio`. Not supported for streaming. | - |
| spring.ai.openai.chat.options.output-audio | Audio parameters for the audio generation. Required when audio output is requested with `output-modalities`: `audio`. Requires the `gpt-4o-audio-preview` model and is is not supported for streaming completions. | - |
| spring.ai.openai.chat.options.presencePenalty | Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model’s likelihood to talk about new topics. | - |
| spring.ai.openai.chat.options.responseFormat.type | Compatible with `GPT-4o`, `GPT-4o mini`, `GPT-4 Turbo` and all `GPT-3.5 Turbo` models newer than `gpt-3.5-turbo-1106`. The `JSON_OBJECT` type enables JSON mode, which guarantees the message the model generates is valid JSON. The `JSON_SCHEMA` type enables [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) which guarantees the model will match your supplied JSON schema. The JSON\_SCHEMA type requires setting the `responseFormat.schema` property as well. | - |
| spring.ai.openai.chat.options.responseFormat.name | Response format schema name. Applicable only for `responseFormat.type=JSON_SCHEMA` | custom\_schema |
| spring.ai.openai.chat.options.responseFormat.schema | Response format JSON schema. Applicable only for `responseFormat.type=JSON_SCHEMA` | - |
| spring.ai.openai.chat.options.responseFormat.strict | Response format JSON schema adherence strictness. Applicable only for `responseFormat.type=JSON_SCHEMA` | - |
| spring.ai.openai.chat.options.seed | This feature is in Beta. If specified, our system will make a best effort to sample deterministically, such that repeated requests with the same seed and parameters should return the same result. | - |
| spring.ai.openai.chat.options.stop | Up to 4 sequences where the API will stop generating further tokens. | - |
| spring.ai.openai.chat.options.topP | An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with `top_p` probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered. We generally recommend altering this or `temperature` but not both. | - |
| spring.ai.openai.chat.options.tools | A list of tools the model may call. Currently, only functions are supported as a tool. Use this to provide a list of functions the model may generate JSON inputs for. | - |
| spring.ai.openai.chat.options.toolChoice | Controls which (if any) function is called by the model. `none` means the model will not call a function and instead generates a message. `auto` means the model can pick between generating a message or calling a function. Specifying a particular function via `{"type: "function", "function": {"name": "my_function"}}` forces the model to call that function. `none` is the default when no functions are present. `auto` is the default if functions are present. | - |
| spring.ai.openai.chat.options.user | A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. | - |
| spring.ai.openai.chat.options.stream-usage | (For streaming only) Set to add an additional chunk with token usage statistics for the entire request. The `choices` field for this chunk is an empty array and all other chunks will also include a usage field, but with a null value. | false |
| spring.ai.openai.chat.options.parallel-tool-calls | Whether to enable [parallel function calling](https://platform.openai.com/docs/guides/function-calling/parallel-function-calling) during tool use. | true |
| spring.ai.openai.chat.options.prompt-cache-key | A cache key used by OpenAI to optimize cache hit rates for similar requests. Improves latency and reduces costs. Replaces the deprecated `user` field for caching purposes. [Learn more](https://platform.openai.com/docs/guides/prompt-caching). | - |
| spring.ai.openai.chat.options.safety-identifier | A stable identifier to help OpenAI detect users violating usage policies. Should be a hashed value (e.g., hashed username or email). Replaces the deprecated `user` field for safety tracking. [Learn more](https://platform.openai.com/docs/guides/safety-best-practices#safety-identifiers). | - |
| spring.ai.openai.chat.options.http-headers | Optional HTTP headers to be added to the chat completion request. To override the `api-key` you need to use an `Authorization` header key, and you have to prefix the key value with the `Bearer` prefix. | - |
| spring.ai.openai.chat.options.tool-names | List of tools, identified by their names, to enable for function calling in a single prompt request. Tools with those names must exist in the ToolCallback registry. | - |
| spring.ai.openai.chat.options.tool-callbacks | Tool Callbacks to register with the ChatModel. | - |
| spring.ai.openai.chat.options.internal-tool-execution-enabled | If false, the Spring AI will not handle the tool calls internally, but will proxy them to the client. Then it is the client’s responsibility to handle the tool calls, dispatch them to the appropriate function, and return the results. If true (the default), the Spring AI will handle the function calls internally. Applicable only for chat models with function calling support | true |
| spring.ai.openai.chat.options.service-tier | Specifies the [processing type](https://platform.openai.com/docs/api-reference/responses/create#responses_create-service_tier) used for serving the request. | - |
| spring.ai.openai.chat.options.extra-body | Additional parameters to include in the request. Accepts any key-value pairs that are flattened to the top level of the JSON request. Intended for use with OpenAI-compatible servers (vLLM, Ollama, etc.) that support parameters beyond the standard OpenAI API. The official OpenAI API ignores unknown parameters. See [Using Extra Parameters with OpenAI-Compatible Servers](#openai-compatible-servers) for details. | - |

> [!NOTE]
> When using GPT-5 models such as `gpt-5`, `gpt-5-mini`, and `gpt-5-nano`, the `temperature` parameter is not supported.
> These models are optimized for reasoning and do not use temperature.
> Specifying a temperature value will result in an error.
> In contrast, conversational models like `gpt-5-chat` do support the `temperature` parameter.

> [!NOTE]
> You can override the common `spring.ai.openai.base-url` and `spring.ai.openai.api-key` for the `ChatModel` and `EmbeddingModel` implementations.
> The `spring.ai.openai.chat.base-url` and `spring.ai.openai.chat.api-key` properties, if set, take precedence over the common properties.
> This is useful if you want to use different OpenAI accounts for different models and different model endpoints.

> [!TIP]
> All properties prefixed with `spring.ai.openai.chat.options` can be overridden at runtime by adding request-specific [Runtime Options](#chat-options) to the `Prompt` call.

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
        OpenAiChatOptions.builder()
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
        OpenAiChatOptions.builder()
            .model("o1-preview")
            .maxCompletionTokens(1000)  // Use maxCompletionTokens for reasoning models
        .build()
    ));
```

**Builder Pattern Validation:**
The OpenAI ChatOptions builder automatically enforces mutual exclusivity with a "last-set-wins" approach:

```java
// This will automatically clear maxTokens and use maxCompletionTokens
OpenAiChatOptions options = OpenAiChatOptions.builder()
    .maxTokens(100)           // Set first
    .maxCompletionTokens(200) // This clears maxTokens and logs a warning
    .build();

// Result: maxTokens = null, maxCompletionTokens = 200
```

<a id="chat-options"></a>

## Runtime Options

The [OpenAiChatOptions.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/main/java/org/springframework/ai/openai/OpenAiChatOptions.java) class provides model configurations such as the model to use, the temperature, the frequency penalty, etc.

On start-up, the default options can be configured with the `OpenAiChatModel(api, options)` constructor or the `spring.ai.openai.chat.options.*` properties.

At run-time, you can override the default options by adding new, request-specific options to the `Prompt` call.
For example, to override the default model and temperature for a specific request:

```java
ChatResponse response = chatModel.call(
    new Prompt(
        "Generate the names of 5 famous pirates.",
        OpenAiChatOptions.builder()
            .model("gpt-4o")
            .temperature(0.4)
        .build()
    ));
```

> [!TIP]
> In addition to the model specific [OpenAiChatOptions](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/main/java/org/springframework/ai/openai/OpenAiChatOptions.java) you can use a portable [ChatOptions](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/chat/prompt/ChatOptions.java) instance, created with [ChatOptions#builder()](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/chat/prompt/DefaultChatOptionsBuilder.java).

<a id="_function_calling"></a>

## Function Calling

You can register custom Java functions with the `OpenAiChatModel` and have the OpenAI model intelligently choose to output a JSON object containing arguments to call one or many of the registered functions.
This is a powerful technique to connect the LLM capabilities with external tools and APIs.
Read more about [Tool Calling](../tools.md).

<a id="_multimodal"></a>

## Multimodal

Multimodality refers to a model’s ability to simultaneously understand and process information from various sources, including text, images, audio, and other data formats.
OpenAI supports text, vision, and audio input modalities.

<a id="_vision"></a>

### Vision

OpenAI models that offer vision multimodal support include `gpt-4`, `gpt-4o`, and `gpt-4o-mini`.
Refer to the [Vision](https://platform.openai.com/docs/guides/vision) guide for more information.

The OpenAI [User Message API](https://platform.openai.com/docs/api-reference/chat/create#chat-create-messages) can incorporate a list of base64-encoded images or image urls with the message.
Spring AI’s [Message](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/chat/messages/Message.java) interface facilitates multimodal AI models by introducing the [Media](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-commons/src/main/java/org/springframework/ai/content/Media.java) type.
This type encompasses data and details regarding media attachments in messages, utilizing Spring’s `org.springframework.util.MimeType` and a `org.springframework.core.io.Resource` for the raw media data.

Below is a code example excerpted from [OpenAiChatModelIT.java](https://github.com/spring-projects/spring-ai/blob/c9a3e66f90187ce7eae7eb78c462ec622685de6c/models/spring-ai-openai/src/test/java/org/springframework/ai/openai/chat/OpenAiChatModelIT.java#L293), illustrating the fusion of user text with an image using the `gpt-4o` model.

```java
var imageResource = new ClassPathResource("/multimodal.test.png");

var userMessage = new UserMessage("Explain what do you see on this picture?",
        new Media(MimeTypeUtils.IMAGE_PNG, this.imageResource));

ChatResponse response = chatModel.call(new Prompt(this.userMessage,
        OpenAiChatOptions.builder().model(OpenAiApi.ChatModel.GPT_4_O.getValue()).build()));
```

> [!TIP]
> GPT\_4\_VISION\_PREVIEW will continue to be available only to existing users of this model starting June 17, 2024. If you are not an existing user, please use the GPT\_4\_O or GPT\_4\_TURBO models. More details [here](https://platform.openai.com/docs/deprecations/2024-06-06-gpt-4-32k-and-vision-preview-models)

or the image URL equivalent using the `gpt-4o` model:

```java
var userMessage = new UserMessage("Explain what do you see on this picture?",
        new Media(MimeTypeUtils.IMAGE_PNG,
                URI.create("https://docs.spring.io/spring-ai/reference/_images/multimodal.test.png")));

ChatResponse response = chatModel.call(new Prompt(this.userMessage,
        OpenAiChatOptions.builder().model(OpenAiApi.ChatModel.GPT_4_O.getValue()).build()));
```

> [!TIP]
> You can pass multiple images as well.

The example shows a model taking as an input the `multimodal.test.png` image:

![Multimodal Test Image](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.4/spring-ai-docs/src/main/antora/modules/ROOT/images/multimodal.test.png)

along with the text message "Explain what do you see on this picture?", and generating a response like this:

```
This is an image of a fruit bowl with a simple design. The bowl is made of metal with curved wire edges that
create an open structure, allowing the fruit to be visible from all angles. Inside the bowl, there are two
yellow bananas resting on top of what appears to be a red apple. The bananas are slightly overripe, as
indicated by the brown spots on their peels. The bowl has a metal ring at the top, likely to serve as a handle
for carrying. The bowl is placed on a flat surface with a neutral-colored background that provides a clear
view of the fruit inside.
```

<a id="_audio"></a>

### Audio

OpenAI models that offer input audio multimodal support include `gpt-4o-audio-preview`.
Refer to the [Audio](https://platform.openai.com/docs/guides/audio) guide for more information.

The OpenAI [User Message API](https://platform.openai.com/docs/api-reference/chat/create#chat-create-messages) can incorporate a list of base64-encoded audio files with the message.
Spring AI’s [Message](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/chat/messages/Message.java) interface facilitates multimodal AI models by introducing the [Media](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-commons/src/main/java/org/springframework/ai/content/Media.java) type.
This type encompasses data and details regarding media attachments in messages, utilizing Spring’s `org.springframework.util.MimeType` and a `org.springframework.core.io.Resource` for the raw media data.
Currently, OpenAI support only the following media types: `audio/mp3` and `audio/wav`.

Below is a code example excerpted from [OpenAiChatModelIT.java](https://github.com/spring-projects/spring-ai/blob/c9a3e66f90187ce7eae7eb78c462ec622685de6c/models/spring-ai-openai/src/test/java/org/springframework/ai/openai/chat/OpenAiChatModelIT.java#L442), illustrating the fusion of user text with an audio file using the `gpt-4o-audio-preview` model.

```java
var audioResource = new ClassPathResource("speech1.mp3");

var userMessage = new UserMessage("What is this recording about?",
        List.of(new Media(MimeTypeUtils.parseMimeType("audio/mp3"), audioResource)));

ChatResponse response = chatModel.call(new Prompt(List.of(userMessage),
        OpenAiChatOptions.builder().model(OpenAiApi.ChatModel.GPT_4_O_AUDIO_PREVIEW).build()));
```

> [!TIP]
> You can pass multiple audio files as well.

<a id="_output_audio"></a>

### Output Audio

OpenAI models that offer input audio multimodal support include `gpt-4o-audio-preview`.
Refer to the [Audio](https://platform.openai.com/docs/guides/audio) guide for more information.

The OpenAI [Assistant Message API](https://platform.openai.com/docs/api-reference/chat/create#chat-create-messages) can contain a list of base64-encoded audio files with the message.
Spring AI’s [Message](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/chat/messages/Message.java) interface facilitates multimodal AI models by introducing the [Media](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-commons/src/main/java/org/springframework/ai/content/Media.java) type.
This type encompasses data and details regarding media attachments in messages, utilizing Spring’s `org.springframework.util.MimeType` and a `org.springframework.core.io.Resource` for the raw media data.
Currently, OpenAI support only the following audio types: `audio/mp3` and `audio/wav`.

Below is a code example, illustrating the response of user text along with an audio byte array, using the `gpt-4o-audio-preview` model:

```java
var userMessage = new UserMessage("Tell me joke about Spring Framework");

ChatResponse response = chatModel.call(new Prompt(List.of(userMessage),
        OpenAiChatOptions.builder()
            .model(OpenAiApi.ChatModel.GPT_4_O_AUDIO_PREVIEW)
            .outputModalities(List.of("text", "audio"))
            .outputAudio(new AudioParameters(Voice.ALLOY, AudioResponseFormat.WAV))
            .build()));

String text = response.getResult().getOutput().getText(); // audio transcript

byte[] waveAudio = response.getResult().getOutput().getMedia().get(0).getDataAsByteArray(); // audio data
```

You have to specify an `audio` modality in the `OpenAiChatOptions` to generate audio output.
The `AudioParameters` class provides the voice and audio format for the audio output.

<a id="_structured_outputs"></a>

## Structured Outputs

OpenAI provides custom [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) APIs that ensure your model generates responses conforming strictly to your provided `JSON Schema`.
In addition to the existing Spring AI model-agnostic [Structured Output Converter](../structured-output-converter.md), these APIs offer enhanced control and precision.

> [!NOTE]
> Currently, OpenAI supports a [subset of the JSON Schema language](https://platform.openai.com/docs/guides/structured-outputs/supported-schemas) format.

<a id="_configuration"></a>

### Configuration

Spring AI allows you to configure your response format either programmatically using the `OpenAiChatOptions` builder or through application properties.

<a id="_using_the_chat_options_builder"></a>

#### Using the Chat Options Builder

You can set the response format programmatically with the `OpenAiChatOptions` builder as shown below:

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

Prompt prompt = new Prompt("how can I solve 8x + 7 = -23",
        OpenAiChatOptions.builder()
            .model(ChatModel.GPT_4_O_MINI)
            .responseFormat(new ResponseFormat(ResponseFormat.Type.JSON_SCHEMA, this.jsonSchema))
            .build());

ChatResponse response = this.openAiChatModel.call(this.prompt);
```

> [!NOTE]
> Adhere to the OpenAI [subset of the JSON Schema language](https://platform.openai.com/docs/guides/structured-outputs/supported-schemas) format.

<a id="_integrating_with_beanoutputconverter_utilities"></a>

#### Integrating with BeanOutputConverter Utilities

You can leverage existing [BeanOutputConverter](../structured-output-converter.md#_bean_output_converter) utilities to automatically generate the JSON Schema from your domain objects and later convert the structured response into domain-specific instances:

#### Java

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

var jsonSchema = this.outputConverter.getJsonSchema();

Prompt prompt = new Prompt("how can I solve 8x + 7 = -23",
        OpenAiChatOptions.builder()
            .model(ChatModel.GPT_4_O_MINI)
            .responseFormat(new ResponseFormat(ResponseFormat.Type.JSON_SCHEMA, this.jsonSchema))
            .build());

ChatResponse response = this.openAiChatModel.call(this.prompt);
String content = this.response.getResult().getOutput().getText();

MathReasoning mathReasoning = this.outputConverter.convert(this.content);
```

#### Kotlin

```kotlin
data class MathReasoning(
	val steps: Steps,
	@get:JsonProperty(value = "final_answer") val finalAnswer: String) {

	data class Steps(val items: Array<Items>) {

		data class Items(
			val explanation: String,
			val output: String)
	}
}

val outputConverter = BeanOutputConverter(MathReasoning::class.java)

val jsonSchema = outputConverter.jsonSchema;

val prompt = Prompt("how can I solve 8x + 7 = -23",
	OpenAiChatOptions.builder()
		.model(ChatModel.GPT_4_O_MINI)
		.responseFormat(ResponseFormat(ResponseFormat.Type.JSON_SCHEMA, jsonSchema))
		.build())

val response = openAiChatModel.call(prompt)
val content = response.getResult().getOutput().getText()

val mathReasoning = outputConverter.convert(content)
```

> [!NOTE]
> Although this is optional for JSON Schema, OpenAI [mandates](https://platform.openai.com/docs/guides/structured-outputs/all-fields-must-be-required#all-fields-must-be-required) required fields for the structured response to function correctly. Kotlin reflection is used to infer which property are required or not based on the nullability of types and default values of parameters, so for most use case `@get:JsonProperty(required = true)` is not needed. `@get:JsonProperty(value = "custom_name")` can be useful to customize the property name. Make sure to generate the annotation on the related getters with this `@get:` syntax, see [related documentation](https://kotlinlang.org/docs/annotations.html#annotation-use-site-targets).

<a id="_configuring_via_application_properties"></a>

#### Configuring via Application Properties

Alternatively, when using the OpenAI auto-configuration, you can configure the desired response format through the following application properties:

```application.properties
spring.ai.openai.api-key=YOUR_API_KEY
spring.ai.openai.chat.options.model=gpt-4o-mini

spring.ai.openai.chat.options.response-format.type=JSON_SCHEMA
spring.ai.openai.chat.options.response-format.name=MySchemaName
spring.ai.openai.chat.options.response-format.schema={"type":"object","properties":{"steps":{"type":"array","items":{"type":"object","properties":{"explanation":{"type":"string"},"output":{"type":"string"}},"required":["explanation","output"],"additionalProperties":false}},"final_answer":{"type":"string"}},"required":["steps","final_answer"],"additionalProperties":false}
spring.ai.openai.chat.options.response-format.strict=true
```

<a id="_sample_controller"></a>

## Sample Controller

[Create](https://start.spring.io/) a new Spring Boot project and add the `spring-ai-starter-model-openai` to your pom (or gradle) dependencies.

Add an `application.properties` file under the `src/main/resources` directory to enable and configure the OpenAi chat model:

```application.properties
spring.ai.openai.api-key=YOUR_API_KEY
spring.ai.openai.chat.options.model=gpt-4o
spring.ai.openai.chat.options.temperature=0.7
```

> [!TIP]
> Replace the `api-key` with your OpenAI credentials.

This will create an `OpenAiChatModel` implementation that you can inject into your classes.
Here is an example of a simple `@RestController` class that uses the chat model for text generations.

```java
@RestController
public class ChatController {

    private final OpenAiChatModel chatModel;

    @Autowired
    public ChatController(OpenAiChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/ai/generate")
    public Map<String,String> generate(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
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

The [OpenAiChatModel](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/main/java/org/springframework/ai/openai/OpenAiChatModel.java) implements the `ChatModel` and `StreamingChatModel` and uses the [Low-level OpenAiApi Client](#low-level-api) to connect to the OpenAI service.

Add the `spring-ai-openai` dependency to your project’s Maven `pom.xml` file:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-openai'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

Next, create an `OpenAiChatModel` and use it for text generations:

```java
var openAiApi = OpenAiApi.builder()
            .apiKey(System.getenv("OPENAI_API_KEY"))
            .build();
var openAiChatOptions = OpenAiChatOptions.builder()
            .model("gpt-3.5-turbo")
            .temperature(0.4)
            .maxTokens(200)
            .build();
var chatModel = new OpenAiChatModel(this.openAiApi, this.openAiChatOptions);

ChatResponse response = this.chatModel.call(
    new Prompt("Generate the names of 5 famous pirates."));

// Or with streaming responses
Flux<ChatResponse> response = this.chatModel.stream(
    new Prompt("Generate the names of 5 famous pirates."));
```

The `OpenAiChatOptions` provides the configuration information for the chat requests.
The `OpenAiApi.Builder` and `OpenAiChatOptions.Builder` are fluent options-builders for API client and chat config respectively.

<a id="low-level-api"></a>

## Low-level OpenAiApi Client

The [OpenAiApi](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/main/java/org/springframework/ai/openai/api/OpenAiApi.java) provides is lightweight Java client for OpenAI Chat API [OpenAI Chat API](https://platform.openai.com/docs/api-reference/chat).

Following class diagram illustrates the `OpenAiApi` chat interfaces and building blocks:

![OpenAiApi Chat API Diagram](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.4/spring-ai-docs/src/main/antora/modules/ROOT/images/openai-chat-api.jpg)

Here is a simple snippet showing how to use the API programmatically:

```java
OpenAiApi openAiApi = OpenAiApi.builder()
            .apiKey(System.getenv("OPENAI_API_KEY"))
            .build();

ChatCompletionMessage chatCompletionMessage =
    new ChatCompletionMessage("Hello world", Role.USER);

// Sync request
ResponseEntity<ChatCompletion> response = this.openAiApi.chatCompletionEntity(
    new ChatCompletionRequest(List.of(this.chatCompletionMessage), "gpt-3.5-turbo", 0.8, false));

// Streaming request
Flux<ChatCompletionChunk> streamResponse = this.openAiApi.chatCompletionStream(
        new ChatCompletionRequest(List.of(this.chatCompletionMessage), "gpt-3.5-turbo", 0.8, true));
```

Follow the [OpenAiApi.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/main/java/org/springframework/ai/openai/api/OpenAiApi.java)'s JavaDoc for further information.

<a id="_low_level_api_examples"></a>

### Low-level API Examples

- The [OpenAiApiIT.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/test/java/org/springframework/ai/openai/api/OpenAiApiIT.java) tests provide some general examples of how to use the lightweight library.
- The [OpenAiApiToolFunctionCallIT.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/test/java/org/springframework/ai/openai/api/tool/OpenAiApiToolFunctionCallIT.java) tests show how to use the low-level API to call tool functions.
Based on the [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling/parallel-function-calling) tutorial.

<a id="low-level-file-api"></a>

## Low-level OpenAiFileApi Client

The [OpenAiFileApi](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/main/java/org/springframework/ai/openai/api/OpenAiFileApi.java) provides a lightweight Java client for the OpenAI Files API, enabling file management operations such as uploading, listing, retrieving, deleting files, and accessing file contents. [OpenAI File API](https://platform.openai.com/docs/api-reference/files)

Here is a simple snippet showing how to use the API programmatically:

```java
OpenAiFileApi openAiFileApi = OpenAiFileApi.builder()
			.apiKey(new SimpleApiKey(System.getenv("OPENAI_API_KEY")))
			.build();

// Upload a file
byte[] fileBytes = Files.readAllBytes(Paths.get("evals.jsonl"));
OpenAiFileApi.UploadFileRequest uploadRequest = OpenAiFileApi.UploadFileRequest.builder()
			.file(fileBytes)
			.fileName("evals-data.jsonl")
			.purpose(OpenAiFileApi.Purpose.EVALS)
			.build();
ResponseEntity<OpenAiFileApi.FileObject> uploadResponse = openAiFileApi.uploadFile(uploadRequest);

// List files
OpenAiFileApi.ListFileRequest listRequest = OpenAiFileApi.ListFileRequest.builder()
			.purpose(OpenAiFileApi.Purpose.EVALS)
			.build();
ResponseEntity<OpenAiFileApi.FileObjectResponse> listResponse = openAiFileApi.listFiles(listRequest);

// Retrieve file information
ResponseEntity<OpenAiFileApi.FileObject> fileInfo = openAiFileApi.retrieveFile("file-id");

// Delete a file
ResponseEntity<OpenAiFileApi.DeleteFileResponse> deleteResponse = openAiFileApi.deleteFile("file-id");

// Retrieve file content
ResponseEntity<String> fileContent = openAiFileApi.retrieveFileContent("file-id");
```

<a id="_low_level_file_api_examples"></a>

### Low-level File API Examples

- The [OpenAiFileApiIT.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/test/java/org/springframework/ai/openai/api/OpenAiFileApiIT.java) tests provide some general examples of how to use the lightweight file api library.

<a id="_api_key_management"></a>

## API Key Management

Spring AI provides flexible API key management through the `ApiKey` interface and its implementations. The default implementation, `SimpleApiKey`, is suitable for most use cases, but you can also create custom implementations for more complex scenarios.

<a id="_default_configuration"></a>

### Default Configuration

By default, Spring Boot auto-configuration will create an API key bean using the `spring.ai.openai.api-key` property:

```properties
spring.ai.openai.api-key=your-api-key-here
```

<a id="_custom_api_key_configuration"></a>

### Custom API Key Configuration

You can create a custom instance of `OpenAiApi` with your own `ApiKey` implementation using the builder pattern:

```java
ApiKey customApiKey = new ApiKey() {
    @Override
    public String getValue() {
        // Custom logic to retrieve API key
        return "your-api-key-here";
    }
};

OpenAiApi openAiApi = OpenAiApi.builder()
    .apiKey(customApiKey)
    .build();

// Create a chat model with the custom OpenAiApi instance
OpenAiChatModel chatModel = OpenAiChatModel.builder()
    .openAiApi(openAiApi)
    .build();
// Build the ChatClient using the custom chat model
ChatClient openAiChatClient = ChatClient.builder(chatModel).build();
```

This is useful when you need to:

- Retrieve the API key from a secure key store
- Rotate API keys dynamically
- Implement custom API key selection logic

<a id="openai-compatible-servers"></a>

## Using Extra Parameters with OpenAI-Compatible Servers

OpenAI-compatible inference servers like vLLM, Ollama, and others often support additional parameters beyond those defined in OpenAI’s standard API.
For example, these servers may accept parameters such as `top_k`, `repetition_penalty`, or other sampling controls that the official OpenAI API does not recognize.

The `extraBody` option allows you to pass arbitrary parameters to these servers.
Any key-value pairs provided in `extraBody` are included at the top level of the JSON request, enabling you to leverage server-specific features while using Spring AI’s OpenAI client.

> [!IMPORTANT]
> The `extraBody` parameter is intended for use with OpenAI-compatible servers, not the official OpenAI API.
> While the official OpenAI API will ignore unknown parameters, they serve no purpose there.
> Always consult your specific server’s documentation to determine which parameters are supported.

<a id="_configuration_with_properties"></a>

### Configuration with Properties

You can configure extra parameters using Spring Boot properties.
Each property under `spring.ai.openai.chat.options.extra-body` becomes a top-level parameter in the request:

```properties
spring.ai.openai.base-url=http://localhost:8000
spring.ai.openai.chat.options.model=meta-llama/Llama-3-8B-Instruct
spring.ai.openai.chat.options.temperature=0.7
spring.ai.openai.chat.options.extra-body.top_k=50
spring.ai.openai.chat.options.extra-body.repetition_penalty=1.1
```

This configuration would produce a JSON request like:

```json
{
  "model": "meta-llama/Llama-3-8B-Instruct",
  "temperature": 0.7,
  "top_k": 50,
  "repetition_penalty": 1.1,
  "messages": [...]
}
```

<a id="_runtime_configuration_with_builder"></a>

### Runtime Configuration with Builder

You can also specify extra parameters at runtime using the options builder:

```java
ChatResponse response = chatModel.call(
    new Prompt(
        "Tell me a creative story",
        OpenAiChatOptions.builder()
            .model("meta-llama/Llama-3-8B-Instruct")
            .temperature(0.7)
            .extraBody(Map.of(
                "top_k", 50,
                "repetition_penalty", 1.1,
                "frequency_penalty", 0.5
            ))
            .build()
    ));
```

<a id="_example_vllm_server"></a>

### Example: vLLM Server

When running vLLM with a Llama model, you might want to use sampling parameters specific to vLLM:

```properties
spring.ai.openai.base-url=http://localhost:8000
spring.ai.openai.chat.options.model=meta-llama/Llama-3-70B-Instruct
spring.ai.openai.chat.options.extra-body.top_k=40
spring.ai.openai.chat.options.extra-body.top_p=0.95
spring.ai.openai.chat.options.extra-body.repetition_penalty=1.05
spring.ai.openai.chat.options.extra-body.min_p=0.05
```

Refer to the [vLLM documentation](https://docs.vllm.ai/en/latest/) for a complete list of supported sampling parameters.

<a id="_example_ollama_server"></a>

### Example: Ollama Server

When using Ollama through the OpenAI-compatible endpoint, you can pass Ollama-specific parameters:

```java
OpenAiChatOptions options = OpenAiChatOptions.builder()
    .model("llama3.2")
    .extraBody(Map.of(
        "num_predict", 100,
        "top_k", 40,
        "repeat_penalty", 1.1
    ))
    .build();

ChatResponse response = chatModel.call(new Prompt("Generate text", options));
```

Consult the [Ollama API documentation](https://github.com/ollama/ollama/blob/main/docs/api.md) for available parameters.

> [!NOTE]
> The `extraBody` parameter accepts any `Map<String, Object>`, allowing you to pass whatever parameters your target server supports.
> Spring AI does not validate these parameters—they are passed directly to the server.
> This design provides maximum flexibility for working with diverse OpenAI-compatible implementations.

<a id="_reasoning_content_from_reasoning_models"></a>

### Reasoning Content from Reasoning Models

Some OpenAI-compatible servers that support reasoning models (such as DeepSeek R1, vLLM with reasoning parsers) expose the model’s internal chain of thought via a `reasoning_content` field in their API responses.
This field contains the step-by-step reasoning process the model used to arrive at its final answer.

Spring AI maps this field from the JSON response to the `reasoningContent` key in the AssistantMessage metadata.

> [!IMPORTANT]
> **Important distinction about `reasoning_content` availability:**
>
> - **OpenAI-compatible servers** (DeepSeek, vLLM): Expose `reasoning_content` in Chat Completions API responses ✅
> - **Official OpenAI models** (GPT-5, o1, o3): Do **NOT** expose reasoning text in Chat Completions API responses ❌
>
> Official OpenAI reasoning models hide the chain-of-thought content when using the Chat Completions API.
> They only expose `reasoning_tokens` count in usage statistics.
> To access actual reasoning text from official OpenAI models, you must use OpenAI’s Responses API (a separate endpoint not currently supported by this client).
>
> **Fallback behavior:** When `reasoning_content` is not provided by the server (e.g., official OpenAI Chat Completions), the `reasoningContent` metadata field will be an empty string.

<a id="_accessing_reasoning_content"></a>

#### Accessing Reasoning Content

When using a compatible server, you can access the reasoning content from the response metadata.

**Using ChatModel directly:**

```java
// Configure to use DeepSeek R1 or vLLM with a reasoning model
ChatResponse response = chatModel.call(
    new Prompt("Which number is larger: 9.11 or 9.8?")
);

// Get the assistant message
AssistantMessage message = response.getResult().getOutput();

// Access the reasoning content from metadata
String reasoning = message.getMetadata().get("reasoningContent");
if (reasoning != null && !reasoning.isEmpty()) {
    System.out.println("Model's reasoning process:");
    System.out.println(reasoning);
}

// The final answer is in the regular content
System.out.println("\nFinal answer:");
System.out.println(message.getContent());
```

**Using ChatClient:**

```java
ChatClient chatClient = ChatClient.create(chatModel);

String result = chatClient.prompt()
    .user("Which number is larger: 9.11 or 9.8?")
    .call()
    .chatResponse()
    .getResult()
    .getOutput()
    .getContent();

// To access reasoning content with ChatClient, retrieve the full response
ChatResponse response = chatClient.prompt()
    .user("Which number is larger: 9.11 or 9.8?")
    .call()
    .chatResponse();

AssistantMessage message = response.getResult().getOutput();
String reasoning = message.getMetadata().get("reasoningContent");
```

<a id="_streaming_reasoning_content"></a>

#### Streaming Reasoning Content

When using streaming responses, reasoning content is accumulated across chunks just like regular message content:

```java
Flux<ChatResponse> responseFlux = chatModel.stream(
    new Prompt("Solve this logic puzzle...")
);

StringBuilder reasoning = new StringBuilder();
StringBuilder answer = new StringBuilder();

responseFlux.subscribe(chunk -> {
    AssistantMessage message = chunk.getResult().getOutput();

    // Accumulate reasoning if present
    String reasoningChunk = message.getMetadata().get("reasoningContent");
    if (reasoningChunk != null) {
        reasoning.append(reasoningChunk);
    }

    // Accumulate the final answer
    if (message.getContent() != null) {
        answer.append(message.getContent());
    }
});
```

<a id="_example_deepseek_r1"></a>

#### Example: DeepSeek R1

DeepSeek R1 is a reasoning model that exposes its internal reasoning process:

```properties
spring.ai.openai.api-key=${DEEPSEEK_API_KEY}
spring.ai.openai.base-url=https://api.deepseek.com
spring.ai.openai.chat.options.model=deepseek-reasoner
```

When you make requests to DeepSeek R1, responses will include both the reasoning content (the model’s thought process) and the final answer.

Refer to the [DeepSeek API documentation](https://api-docs.deepseek.com/guides/reasoning_model) for more details on reasoning models.

<a id="_example_vllm_with_reasoning_parser"></a>

#### Example: vLLM with Reasoning Parser

vLLM supports reasoning models when configured with a reasoning parser:

```bash
vllm serve deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B \
    --enable-reasoning \
    --reasoning-parser deepseek_r1
```

```properties
spring.ai.openai.base-url=http://localhost:8000
spring.ai.openai.chat.options.model=deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B
```

Consult the [vLLM reasoning outputs documentation](https://docs.vllm.ai/en/latest/features/reasoning_outputs.html) for supported reasoning models and parsers.

> [!NOTE]
> The availability of `reasoning_content` depends entirely on the inference server you’re using.
> Not all OpenAI-compatible servers expose reasoning content, even when using reasoning-capable models.
> Always refer to your server’s API documentation to understand what fields are available in responses.
