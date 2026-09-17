---
title: "Hugging Face Chat"
source: "ROOT:api/chat/huggingface.adoc"
---

# Hugging Face Chat

Hugging Face Text Generation Inference (TGI) is a specialized deployment solution for serving Large Language Models (LLMs) in the cloud, making them accessible via an API. TGI provides optimized performance for text generation tasks through features like continuous batching, token streaming, and efficient memory management.

> [!IMPORTANT]
> Text Generation Inference requires models to be compatible with its architecture-specific optimizations. While many popular LLMs are supported, not all models on Hugging Face Hub can be deployed using TGI. If you need to deploy other types of models, consider using standard Hugging Face Inference Endpoints instead.

> [!TIP]
> For a complete and up-to-date list of supported models and architectures, see the [Text Generation Inference supported models documentation](https://huggingface.co/docs/text-generation-inference/en/supported_models).

<a id="_prerequisites"></a>

## Prerequisites

You will need to create an Inference Endpoint on Hugging Face and create an API token to access the endpoint.
Further details can be found [here](https://huggingface.co/docs/inference-endpoints/index).

The Spring AI project defines two configuration properties:

1. `spring.ai.huggingface.chat.api-key`: Set this to the value of the API token obtained from Hugging Face.
1. `spring.ai.huggingface.chat.url`: Set this to the inference endpoint URL obtained when provisioning your model in Hugging Face.

You can find your inference endpoint URL on the Inference Endpoint’s UI [here](https://ui.endpoints.huggingface.co/).

You can set these configuration properties in your `application.properties` file:

```properties
spring.ai.huggingface.chat.api-key=<your-huggingface-api-key>
spring.ai.huggingface.chat.url=<your-inference-endpoint-url>
```

For enhanced security when handling sensitive information like API keys, you can use Spring Expression Language (SpEL) to reference custom environment variables:

```yaml
# In application.yml
spring:
  ai:
    huggingface:
      chat:
        api-key: ${HUGGINGFACE_API_KEY}
        url: ${HUGGINGFACE_ENDPOINT_URL}
```

```bash
# In your environment or .env file
export HUGGINGFACE_API_KEY=<your-huggingface-api-key>
export HUGGINGFACE_ENDPOINT_URL=<your-inference-endpoint-url>
```

You can also set these configurations programmatically in your application code:

```java
// Retrieve API key and endpoint URL from secure sources or environment variables
String apiKey = System.getenv("HUGGINGFACE_API_KEY");
String endpointUrl = System.getenv("HUGGINGFACE_ENDPOINT_URL");
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

Spring AI provides Spring Boot auto-configuration for the Hugging Face Chat Client.
To enable it add the following dependency to your project’s Maven `pom.xml` file:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-huggingface</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-model-huggingface'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

<a id="_chat_properties"></a>

### Chat Properties

> [!NOTE]
> Enabling and disabling of the chat auto-configurations are now configured via top level properties with the prefix `spring.ai.model.chat`.
>
> To enable, spring.ai.model.chat=huggingface (It is enabled by default)
>
> To disable, spring.ai.model.chat=none (or any value which doesn’t match huggingface)
>
> This change is done to allow configuration of multiple models.

The prefix `spring.ai.huggingface` is the property prefix that lets you configure the chat model implementation for Hugging Face.

|  |  |  |
| --- | --- | --- |
| Property | Description | Default |
| spring.ai.huggingface.chat.api-key | API Key to authenticate with the Inference Endpoint. | - |
| spring.ai.huggingface.chat.url | URL of the Inference Endpoint to connect to | - |
| spring.ai.huggingface.chat.enabled (Removed and no longer valid) | Enable Hugging Face chat model. | true |
| spring.ai.model.chat | Enable Hugging Face chat model. | huggingface |

<a id="_sample_controller_auto_configuration"></a>

## Sample Controller (Auto-configuration)

[Create](https://start.spring.io/) a new Spring Boot project and add the `spring-ai-starter-model-huggingface` to your pom (or gradle) dependencies.

Add an `application.properties` file, under the `src/main/resources` directory, to enable and configure the Hugging Face chat model:

```application.properties
spring.ai.huggingface.chat.api-key=YOUR_API_KEY
spring.ai.huggingface.chat.url=YOUR_INFERENCE_ENDPOINT_URL
```

> [!TIP]
> replace the `api-key` and `url` with your Hugging Face values.

This will create a `HuggingfaceChatModel` implementation that you can inject into your class.
Here is an example of a simple `@Controller` class that uses the chat model for text generations.

```java
@RestController
public class ChatController {

    private final HuggingfaceChatModel chatModel;

    @Autowired
    public ChatController(HuggingfaceChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/ai/generate")
    public Map generate(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        return Map.of("generation", this.chatModel.call(message));
    }
}
```

<a id="_manual_configuration"></a>

## Manual Configuration

The [HuggingfaceChatModel](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-huggingface/src/main/java/org/springframework/ai/huggingface/HuggingfaceChatModel.java) implements the `ChatModel` interface and uses the [\[low-level-api\]](#low-level-api) to connect to the Hugging Face inference endpoints.

Add the `spring-ai-huggingface` dependency to your project’s Maven `pom.xml` file:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-huggingface</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-huggingface'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

Next, create a `HuggingfaceChatModel` and use it for text generations:

```java
HuggingfaceChatModel chatModel = new HuggingfaceChatModel(apiKey, url);

ChatResponse response = this.chatModel.call(
    new Prompt("Generate the names of 5 famous pirates."));

System.out.println(response.getResult().getOutput().getText());
```
