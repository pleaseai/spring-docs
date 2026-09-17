---
title: "Image Model API"
source: "ROOT:api/imageclient.adoc"
---

<a id="ImageModel"></a>

# Image Model API

The `Spring Image Model API` is designed to be a simple and portable interface for interacting with various [AI Models](../concepts.md#_models) specialized in image generation, allowing developers to switch between different image-related models with minimal code changes.
This design aligns with Spring’s philosophy of modularity and interchangeability, ensuring developers can quickly adapt their applications to different AI capabilities related to image processing.

Additionally, with the support of companion classes like `ImagePrompt` for input encapsulation and `ImageResponse` for output handling, the Image Model API unifies the communication with AI Models dedicated to image generation.
It manages the complexity of request preparation and response parsing, offering a direct and simplified API interaction for image-generation functionalities.

The Spring Image Model API is built on top of the Spring AI `Generic Model API`, providing image-specific abstractions and implementations.

<a id="_api_overview"></a>

## API Overview

This section provides a guide to the Spring Image Model API interface and associated classes.

<a id="_image_model"></a>

## Image Model

Here is the [ImageModel](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/image/ImageModel.java) interface definition:

```java
@FunctionalInterface
public interface ImageModel extends Model<ImagePrompt, ImageResponse> {

	ImageResponse call(ImagePrompt request);

}
```

<a id="_imageprompt"></a>

### ImagePrompt

The [ImagePrompt](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/image/ImagePrompt.java) is a `ModelRequest` that encapsulates a list of [ImageMessage](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/image/ImageMessage.java) objects and optional model request options.
The following listing shows a truncated version of the `ImagePrompt` class, excluding constructors and other utility methods:

```java
public class ImagePrompt implements ModelRequest<List<ImageMessage>> {

    private final List<ImageMessage> messages;

	private ImageOptions imageModelOptions;

    @Override
	public List<ImageMessage> getInstructions() {...}

	@Override
	public ImageOptions getOptions() {...}

    // constructors and utility methods omitted
}
```

<a id="_imagemessage"></a>

#### ImageMessage

The `ImageMessage` class encapsulates the text to use and the weight that the text should have in influencing the generated image.  For models that support weights, they can be positive or negative.

```java
public class ImageMessage {

	private String text;

	private Float weight;

    public String getText() {...}

	public Float getWeight() {...}

   // constructors and utility methods omitted
}
```

<a id="_imageoptions"></a>

#### ImageOptions

Represents the options that can be passed to the Image generation model. The `ImageOptions` interface extends the `ModelOptions` interface and is used to define few portable options that can be passed to the AI model.

The `ImageOptions` interface is defined as follows:

```java
public interface ImageOptions extends ModelOptions {

	Integer getN();

	String getModel();

	Integer getWidth();

	Integer getHeight();

	String getResponseFormat(); // openai - url or base64 : stability ai byte[] or base64

}
```

Additionally, every model specific ImageModel implementation can have its own options that can be passed to the AI model. For example, the OpenAI Image Generation model has its own options like `quality`, `style`, etc.

This is a powerful feature that allows developers to use model specific options when starting the application and then override them at runtime using the `ImagePrompt`.

<a id="_imageresponse"></a>

### ImageResponse

The structure of the `ImageResponse` class is as follows:

```java
public class ImageResponse implements ModelResponse<ImageGeneration> {

	private final ImageResponseMetadata imageResponseMetadata;

	private final List<ImageGeneration> imageGenerations;

	@Override
	public ImageGeneration getResult() {
		// get the first result
	}

	@Override
	public List<ImageGeneration> getResults() {...}

	@Override
	public ImageResponseMetadata getMetadata() {...}

    // other methods omitted

}
```

The [ImageResponse](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/image/ImageResponse.java) class holds the AI Model’s output, with each `ImageGeneration` instance containing one of potentially multiple outputs resulting from a single prompt.

The `ImageResponse` class also carries a `ImageResponseMetadata` object holding metadata about the AI Model’s response.

<a id="_imagegeneration"></a>

### ImageGeneration

Finally, the [ImageGeneration](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/image/ImageGeneration.java) class extends from the `ModelResult` to represent the output response and related metadata about this result:

```java
public class ImageGeneration implements ModelResult<Image> {

	private ImageGenerationMetadata imageGenerationMetadata;

	private Image image;

    @Override
	public Image getOutput() {...}

	@Override
	public ImageGenerationMetadata getMetadata() {...}

    // other methods omitted

}
```

<a id="_available_implementations"></a>

## Available Implementations

`ImageModel` implementations are provided for the following Model providers:

- [OpenAI Image Generation](image/openai-image.md)
- [Azure OpenAI Image Generation](image/azure-openai-image.md)
- [QianFan Image Generation](image/qianfan-image.md)
- [StabilityAI Image Generation](image/stabilityai-image.md)
- [ZhiPuAI Image Generation](image/zhipuai-image.md)

<a id="_api_docs"></a>

## API Docs

You can find the Javadoc [here](https://docs.spring.io/spring-ai/docs/current-SNAPSHOT/).

<a id="_feedback_and_contributions"></a>

## Feedback and Contributions

The project’s [GitHub discussions](https://github.com/spring-projects/spring-ai/discussions) is a great place to send feedback.
