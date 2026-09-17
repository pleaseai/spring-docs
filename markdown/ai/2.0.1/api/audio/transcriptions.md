---
title: "Transcription API"
source: "ROOT:api/audio/transcriptions.adoc"
---

<a id="Transcription"></a>

# Transcription API

Spring AI provides a unified API for Speech-to-Text transcription through the `TranscriptionModel` interface. This allows you to write portable code that works across different transcription providers.

<a id="_supported_providers"></a>

## Supported Providers

- [OpenAI’s Whisper API](transcriptions/openai-transcriptions.md)

<a id="_common_interface"></a>

## Common Interface

All transcription providers implement the following shared interface:

<a id="_transcriptionmodel"></a>

### TranscriptionModel

The `TranscriptionModel` interface provides methods for converting audio to text:

```java
public interface TranscriptionModel extends Model<AudioTranscriptionPrompt, AudioTranscriptionResponse> {

    /**
     * Transcribes the audio from the given prompt.
     */
    AudioTranscriptionResponse call(AudioTranscriptionPrompt transcriptionPrompt);

    /**
     * A convenience method for transcribing an audio resource.
     */
    default String transcribe(Resource resource) {
        AudioTranscriptionPrompt prompt = new AudioTranscriptionPrompt(resource);
        return this.call(prompt).getResult().getOutput();
    }

    /**
     * A convenience method for transcribing an audio resource with options.
     */
    default String transcribe(Resource resource, AudioTranscriptionOptions options) {
        AudioTranscriptionPrompt prompt = new AudioTranscriptionPrompt(resource, options);
        return this.call(prompt).getResult().getOutput();
    }
}
```

<a id="_audiotranscriptionprompt"></a>

### AudioTranscriptionPrompt

The `AudioTranscriptionPrompt` class encapsulates the input audio and options:

```java
Resource audioFile = new FileSystemResource("/path/to/audio.mp3");
AudioTranscriptionPrompt prompt = new AudioTranscriptionPrompt(
    audioFile,
    options
);
```

<a id="_audiotranscriptionresponse"></a>

### AudioTranscriptionResponse

The `AudioTranscriptionResponse` class contains the transcribed text and metadata:

```java
AudioTranscriptionResponse response = model.call(prompt);
String transcribedText = response.getResult().getOutput();
AudioTranscriptionResponseMetadata metadata = response.getMetadata();
```

<a id="_writing_provider_agnostic_code"></a>

## Writing Provider-Agnostic Code

One of the key benefits of the shared transcription interface is the ability to write code that works with any transcription provider without modification. The actual provider (OpenAI for example) is determined by your Spring Boot configuration, allowing you to switch providers without changing application code.

<a id="_basic_service_example"></a>

### Basic Service Example

The shared interface allows you to write code that works with any transcription provider:

```java
@Service
public class TranscriptionService {

    private final TranscriptionModel transcriptionModel;

    public TranscriptionService(TranscriptionModel transcriptionModel) {
        this.transcriptionModel = transcriptionModel;
    }

    public String transcribeAudio(Resource audioFile) {
        return transcriptionModel.transcribe(audioFile);
    }

    public String transcribeWithOptions(Resource audioFile, AudioTranscriptionOptions options) {
        AudioTranscriptionPrompt prompt = new AudioTranscriptionPrompt(audioFile, options);
        AudioTranscriptionResponse response = transcriptionModel.call(prompt);
        return response.getResult().getOutput();
    }
}
```

This service works seamlessly with OpenAI or any other transcription provider, with the actual implementation determined by your Spring Boot configuration.

<a id="_provider_specific_features"></a>

## Provider-Specific Features

While the shared interface provides portability, each provider also offers specific features through provider-specific options classes (e.g., `OpenAiAudioTranscriptionOptions`). These classes implement the `AudioTranscriptionOptions` interface while adding provider-specific capabilities.

For detailed information about provider-specific features, see the individual provider documentation pages.
