---
title: "OpenAI Transcriptions"
source: "ROOT:api/audio/transcriptions/openai-transcriptions.adoc"
---

# OpenAI Transcriptions

<a id="_openai_transcriptions"></a>

## OpenAI Transcriptions

Spring AI supports [OpenAI’s Transcription model](https://platform.openai.com/docs/api-reference/audio/createTranscription).

<a id="_prerequisites"></a>

## Prerequisites

You will need to create an API key with OpenAI to access ChatGPT models.
Create an account at [OpenAI signup page](https://platform.openai.com/signup) and generate the token on the [API Keys page](https://platform.openai.com/account/api-keys).
The Spring AI project defines a configuration property named `spring.ai.openai.api-key` that you should set to the value of the `API Key` obtained from openai.com.
Exporting an environment variable is one way to set that configuration property:

<a id="_auto_configuration"></a>

## Auto-configuration

> [!NOTE]
> There has been a significant change in the Spring AI auto-configuration, starter modules' artifact names.
> Please refer to the [upgrade notes](https://docs.spring.io/spring-ai/reference/upgrade-notes.html) for more information.

Spring AI provides Spring Boot auto-configuration for the OpenAI Transcription Client.
To enable it add the following dependency to your project’s Maven `pom.xml` file:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-openai</artifactId>
</dependency>
```

or to your Gradle `build.gradle` build file.

```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-model-openai'
}
```

> [!TIP]
> Refer to the [Dependency Management](../../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

<a id="_transcription_properties"></a>

### Transcription Properties

<a id="_connection_properties"></a>

#### Connection Properties

The prefix `spring.ai.openai` is used as the property prefix that lets you connect to OpenAI.

|  |  |  |
| --- | --- | --- |
| Property | Description | Default |
| spring.ai.openai.base-url | The URL to connect to | [api.openai.com](https://api.openai.com) |
| spring.ai.openai.api-key | The API Key | - |
| spring.ai.openai.organization-id | Optionally you can specify which organization  used for an API request. | - |
| spring.ai.openai.project-id | Optionally, you can specify which project is used for an API request. | - |

> [!TIP]
> For users that belong to multiple organizations (or are accessing their projects through their legacy user API key), optionally, you can specify which organization and project is used for an API request.
> Usage from these API requests will count as usage for the specified organization and project.

<a id="_configuration_properties"></a>

#### Configuration Properties

> [!NOTE]
> Enabling and disabling of the audio transcription auto-configurations are now configured via top level properties with the prefix `spring.ai.model.audio.transcription`.
>
> To enable, spring.ai.model.audio.transcription=openai (It is enabled by default)
>
> To disable, spring.ai.model.audio.transcription=none (or any value which doesn’t match openai)
>
> This change is done to allow configuration of multiple models.

The prefix `spring.ai.openai.audio.transcription` is used as the property prefix that lets you configure the retry mechanism for the OpenAI transcription model.

| Property | Description | Default |
| --- | --- | --- |
| spring.ai.model.audio.transcription | Enable OpenAI Audio Transcription Model | openai |
| spring.ai.openai.audio.transcription.base-url | The URL to connect to | [api.openai.com](https://api.openai.com) |
| spring.ai.openai.audio.transcription.api-key | The API Key | - |
| spring.ai.openai.audio.transcription.organization-id | Optionally you can specify which organization  used for an API request. | - |
| spring.ai.openai.audio.transcription.project-id | Optionally, you can specify which project is used for an API request. | - |
| spring.ai.openai.audio.transcription.options.model | ID of the model to use. Only whisper-1 (which is powered by our open source Whisper V2 model) is currently available. | whisper-1 |
| spring.ai.openai.audio.transcription.options.response-format | The format of the transcript output, in one of these options: json, text, srt, verbose\_json, or vtt. | json |
| spring.ai.openai.audio.transcription.options.prompt | An optional text to guide the model’s style or continue a previous audio segment. The prompt should match the audio language. |  |
| spring.ai.openai.audio.transcription.options.language | The language of the input audio. Supplying the input language in ISO-639-1 format will improve accuracy and latency. |  |
| spring.ai.openai.audio.transcription.options.temperature | The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use log probability to automatically increase the temperature until certain thresholds are hit. | 0 |
| spring.ai.openai.audio.transcription.options.timestamp\_granularities | The timestamp granularities to populate for this transcription. response\_format must be set verbose\_json to use timestamp granularities. Either or both of these options are supported: word, or segment. Note: There is no additional latency for segment timestamps, but generating word timestamps incurs additional latency. | segment |

> [!NOTE]
> You can override the common `spring.ai.openai.base-url`, `spring.ai.openai.api-key`, `spring.ai.openai.organization-id` and `spring.ai.openai.project-id` properties.
> The `spring.ai.openai.audio.transcription.base-url`, `spring.ai.openai.audio.transcription.api-key`, `spring.ai.openai.audio.transcription.organization-id` and `spring.ai.openai.audio.transcription.project-id` properties if set take precedence over the common properties.
> This is useful if you want to use different OpenAI accounts for different models and different model endpoints.

> [!TIP]
> All properties prefixed with `spring.ai.openai.transcription.options` can be overridden at runtime.

<a id="transcription-options"></a>

## Runtime Options

The `OpenAiAudioTranscriptionOptions` class provides the options to use when making a transcription.
On start-up, the options specified by `spring.ai.openai.audio.transcription` are used but you can override these at runtime.

For example:

```java
OpenAiAudioApi.TranscriptResponseFormat responseFormat = OpenAiAudioApi.TranscriptResponseFormat.VTT;

OpenAiAudioTranscriptionOptions transcriptionOptions = OpenAiAudioTranscriptionOptions.builder()
    .language("en")
    .prompt("Ask not this, but ask that")
    .temperature(0f)
    .responseFormat(this.responseFormat)
    .build();
AudioTranscriptionPrompt transcriptionRequest = new AudioTranscriptionPrompt(audioFile, this.transcriptionOptions);
AudioTranscriptionResponse response = openAiTranscriptionModel.call(this.transcriptionRequest);
```

<a id="_manual_configuration"></a>

## Manual Configuration

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
> Refer to the [Dependency Management](../../../getting-started.md#dependency-management) section to add the Spring AI BOM to your build file.

Next, create a `OpenAiAudioTranscriptionModel`

```java
var openAiAudioApi = new OpenAiAudioApi(System.getenv("OPENAI_API_KEY"));

var openAiAudioTranscriptionModel = new OpenAiAudioTranscriptionModel(this.openAiAudioApi);

var transcriptionOptions = OpenAiAudioTranscriptionOptions.builder()
    .responseFormat(TranscriptResponseFormat.TEXT)
    .temperature(0f)
    .build();

var audioFile = new FileSystemResource("/path/to/your/resource/speech/jfk.flac");

AudioTranscriptionPrompt transcriptionRequest = new AudioTranscriptionPrompt(this.audioFile, this.transcriptionOptions);
AudioTranscriptionResponse response = openAiTranscriptionModel.call(this.transcriptionRequest);
```

<a id="_example_code"></a>

## Example Code

- The [OpenAiTranscriptionModelIT.java](https://github.com/spring-projects/spring-ai/blob/main/models/spring-ai-openai/src/test/java/org/springframework/ai/openai/audio/transcription/OpenAiTranscriptionModelIT.java) test provides some general examples how to use the library.
