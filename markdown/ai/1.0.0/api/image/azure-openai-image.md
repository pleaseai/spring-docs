---
title: "Azure OpenAI Image Generation"
source: "ROOT:api/image/azure-openai-image.adoc"
---

# Azure OpenAI Image Generation

Spring AI supports DALL-E, the Image generation model from Azure OpenAI.

<a id="_prerequisites"></a>

## Prerequisites

Obtain your Azure OpenAI `endpoint` and `api-key` from the Azure OpenAI Service section on the [Azure Portal](https://portal.azure.com).

Spring AI defines two configuration properties:

1. `spring.ai.azure.openai.api-key`: Set this to the value of the `API Key` obtained from Azure.
1. `spring.ai.azure.openai.endpoint`: Set this to the endpoint URL obtained when provisioning your model in Azure.

You can set these configuration properties in your `application.properties` file:

```properties
spring.ai.azure.openai.api-key=<your-azure-openai-api-key>
spring.ai.azure.openai.endpoint=<your-azure-openai-endpoint>
```

For enhanced security when handling sensitive information like API keys, you can use Spring Expression Language (SpEL) to reference custom environment variables:

```yaml
# In application.yml
spring:
  ai:
    azure:
      openai:
        api-key: ${AZURE_OPENAI_API_KEY}
        endpoint: ${AZURE_OPENAI_ENDPOINT}
```

```bash
# In your environment or .env file
export AZURE_OPENAI_API_KEY=<your-azure-openai-api-key>
export AZURE_OPENAI_ENDPOINT=<your-azure-openai-endpoint>
```

You can also set these configurations programmatically in your application code:

```java
// Retrieve API key and endpoint from secure sources or environment variables
String apiKey = System.getenv("AZURE_OPENAI_API_KEY");
String endpoint = System.getenv("AZURE_OPENAI_ENDPOINT");
```

<a id="_deployment_name"></a>

### Deployment Name

To use run Azure AI applications, create an Azure AI Deployment through the \[Azure AI Portal\]([oai.azure.com/portal](https://oai.azure.com/portal)).

In Azure, each client must specify a `Deployment Name` to connect to the Azure OpenAI service.

It’s essential to understand that the `Deployment Name` is different from the model you choose to deploy

For instance, a deployment named 'MyImgAiDeployment' could be configured to use either the `Dalle3`  model or the `Dalle2` model.

For now, to keep things simple, you can create a deployment using the following settings:

Deployment Name: `MyImgAiDeployment`
Model Name: `Dalle3`

This Azure configuration will align with the default configurations of the Spring Boot Azure AI Starter and its Autoconfiguration feature.

If you use a different Deployment Name, update the configuration property accordingly:

```
spring.ai.azure.openai.image.options.deployment-name=<my deployment name>
```

The different deployment structures of Azure OpenAI and OpenAI leads to a property in the Azure OpenAI client library named `deploymentOrModelName`.
This is because in OpenAI there is no `Deployment Name`, only a `Model Name`.

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

Spring AI provides Spring Boot auto-configuration for the Azure OpenAI Chat Client.
To enable it add the following dependency to your project’s Maven `pom.xml` file:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-azure-openai</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-model-azure-openai'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

<a id="_image_generation_properties"></a>

### Image Generation Properties

> [!NOTE]
> Enabling and disabling of the image auto-configurations are now configured via top level properties with the prefix `spring.ai.model.image`.
>
> To enable, spring.ai.model.image=azure-openai (It is enabled by default)
>
> To disable, spring.ai.model.image=none (or any value which doesn’t match azure-openai)
>
> This change is done to allow configuration of multiple models.

The prefix `spring.ai.openai.image` is the property prefix that lets you configure the `ImageModel` implementation for OpenAI.

|  |  |  |
| --- | --- | --- |
| Property | Description | Default |
| spring.ai.azure.openai.image.enabled (Removed and no longer valid) | Enable OpenAI image model. | true |
| spring.ai.model.image | Enable OpenAI image model. | azure-openai |
| spring.ai.azure.openai.image.options.n | The number of images to generate. Must be between 1 and 10. For dall-e-3, only n=1 is supported. | - |
| spring.ai.azure.openai.image.options.model | The model to use for image generation. | AzureOpenAiImageOptions.DEFAULT\_IMAGE\_MODEL |
| spring.ai.azure.openai.image.options.quality | The quality of the image that will be generated. HD creates images with finer details and greater consistency across the image. This parameter is only supported for dall-e-3. | - |
| spring.ai.azure.openai.image.options.response\_format | The format in which the generated images are returned. Must be one of URL or b64\_json. | - |
| `spring.ai.openai.image.options.size` | The size of the generated images. Must be one of 256x256, 512x512, or 1024x1024 for dall-e-2. Must be one of 1024x1024, 1792x1024, or 1024x1792 for dall-e-3 models. | - |
| `spring.ai.openai.image.options.size_width` | The width of the generated images. Must be one of 256, 512, or 1024 for dall-e-2. | - |
| `spring.ai.openai.image.options.size_height` | The height of the generated images. Must be one of 256, 512, or 1024 for dall-e-2. | - |
| `spring.ai.openai.image.options.style` | The style of the generated images. Must be one of vivid or natural. Vivid causes the model to lean towards generating hyper-real and dramatic images. Natural causes the model to produce more natural, less hyper-real looking images. This parameter is only supported for dall-e-3. | - |
| `spring.ai.openai.image.options.user` | A unique identifier representing your end-user, which can help Azure OpenAI to monitor and detect abuse. | - |

<a id="_connection_properties"></a>

#### Connection Properties

The prefix `spring.ai.openai` is used as the property prefix that lets you connect to Azure OpenAI.

|  |  |  |
| --- | --- | --- |
| Property | Description | Default |
| spring.ai.azure.openai.endpoint | The URL to connect to | [my-dalle3.openai.azure.com/](https://my-dalle3.openai.azure.com/) |
| spring.ai.azure.openai.apiKey | The API Key | - |

<a id="image-options"></a>

## Runtime Options

The [OpenAiImageOptions.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/main/java/org/springframework/ai/openai/OpenAiImageOptions.java) provides model configurations, such as the model to use, the quality, the size, etc.

On start-up, the default options can be configured with the `AzureOpenAiImageModel(OpenAiImageApi openAiImageApi)` constructor and the `withDefaultOptions(OpenAiImageOptions defaultOptions)` method.  Alternatively, use the `spring.ai.azure.openai.image.options.*` properties described previously.

At runtime you can override the default options by adding new, request specific, options to the `ImagePrompt` call.
For example to override the OpenAI specific options such as quality and the number of images to create, use the following code example:

```java
ImageResponse response = azureOpenaiImageModel.call(
        new ImagePrompt("A light cream colored mini golden doodle",
        OpenAiImageOptions.builder()
                .quality("hd")
                .N(4)
                .height(1024)
                .width(1024).build())

);
```

> [!TIP]
> In addition to the model specific [AzureOpenAiImageOptions](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-azure-openai/src/main/java/org/springframework/ai/azure/openai/AzureOpenAiImageOptions.java) you can use a portable [ImageOptions](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/image/ImageOptions.java) instance, created with the [ImageOptionsBuilder#builder()](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/image/ImageOptionsBuilder.java).
