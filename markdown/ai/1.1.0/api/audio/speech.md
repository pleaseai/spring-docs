---
title: "Text-To-Speech (TTS) API"
source: "ROOT:api/audio/speech.adoc"
---

<a id="Speech"></a>

# Text-To-Speech (TTS) API

Spring AI provides a unified API for Text-To-Speech (TTS) through the `TextToSpeechModel` and `StreamingTextToSpeechModel` interfaces. This allows you to write portable code that works across different TTS providers.

<a id="_supported_providers"></a>

## Supported Providers

- [OpenAI’s Speech API](speech/openai-speech.md)
- [Eleven Labs Text-To-Speech API](speech/elevenlabs-speech.md)

<a id="_common_interface"></a>

## Common Interface

All TTS providers implement the following shared interfaces:

<a id="_texttospeechmodel"></a>

### TextToSpeechModel

The `TextToSpeechModel` interface provides methods for converting text to speech:

```java
public interface TextToSpeechModel extends Model<TextToSpeechPrompt, TextToSpeechResponse>, StreamingTextToSpeechModel {

    /**
     * Converts text to speech with default options.
     */
    default byte[] call(String text) {
        // Default implementation
    }

    /**
     * Converts text to speech with custom options.
     */
    TextToSpeechResponse call(TextToSpeechPrompt prompt);

    /**
     * Returns the default options for this model.
     */
    default TextToSpeechOptions getDefaultOptions() {
        // Default implementation
    }
}
```

<a id="_streamingtexttospeechmodel"></a>

### StreamingTextToSpeechModel

The `StreamingTextToSpeechModel` interface provides methods for streaming audio in real-time:

```java
@FunctionalInterface
public interface StreamingTextToSpeechModel extends StreamingModel<TextToSpeechPrompt, TextToSpeechResponse> {

    /**
     * Streams text-to-speech responses with metadata.
     */
    Flux<TextToSpeechResponse> stream(TextToSpeechPrompt prompt);

    /**
     * Streams audio bytes for the given text.
     */
    default Flux<byte[]> stream(String text) {
        // Default implementation
    }
}
```

<a id="_texttospeechprompt"></a>

### TextToSpeechPrompt

The `TextToSpeechPrompt` class encapsulates the input text and options:

```java
TextToSpeechPrompt prompt = new TextToSpeechPrompt(
    "Hello, this is a text-to-speech example.",
    options
);
```

<a id="_texttospeechresponse"></a>

### TextToSpeechResponse

The `TextToSpeechResponse` class contains the generated audio and metadata:

```java
TextToSpeechResponse response = model.call(prompt);
byte[] audioBytes = response.getResult().getOutput();
TextToSpeechResponseMetadata metadata = response.getMetadata();
```

<a id="_writing_provider_agnostic_code"></a>

## Writing Provider-Agnostic Code

One of the key benefits of the shared TTS interfaces is the ability to write code that works with any TTS provider without modification. The actual provider (OpenAI, ElevenLabs, etc.) is determined by your Spring Boot configuration, allowing you to switch providers without changing application code.

<a id="_basic_service_example"></a>

### Basic Service Example

The shared interfaces allow you to write code that works with any TTS provider:

```java
@Service
public class NarrationService {

    private final TextToSpeechModel textToSpeechModel;

    public NarrationService(TextToSpeechModel textToSpeechModel) {
        this.textToSpeechModel = textToSpeechModel;
    }

    public byte[] narrate(String text) {
        // Works with any TTS provider
        return textToSpeechModel.call(text);
    }

    public byte[] narrateWithOptions(String text, TextToSpeechOptions options) {
        TextToSpeechPrompt prompt = new TextToSpeechPrompt(text, options);
        TextToSpeechResponse response = textToSpeechModel.call(prompt);
        return response.getResult().getOutput();
    }
}
```

This service works seamlessly with OpenAI, ElevenLabs, or any other TTS provider, with the actual implementation determined by your Spring Boot configuration.

<a id="_advanced_example_multi_provider_support"></a>

### Advanced Example: Multi-Provider Support

You can build applications that support multiple TTS providers simultaneously:

```java
@Service
public class MultiProviderNarrationService {

    private final Map<String, TextToSpeechModel> providers;

    public MultiProviderNarrationService(List<TextToSpeechModel> models) {
        // Spring will inject all available TextToSpeechModel beans
        this.providers = models.stream()
            .collect(Collectors.toMap(
                model -> model.getClass().getSimpleName(),
                model -> model
            ));
    }

    public byte[] narrateWithProvider(String text, String providerName) {
        TextToSpeechModel model = providers.get(providerName);
        if (model == null) {
            throw new IllegalArgumentException("Unknown provider: " + providerName);
        }
        return model.call(text);
    }

    public Set<String> getAvailableProviders() {
        return providers.keySet();
    }
}
```

<a id="_streaming_audio_example"></a>

### Streaming Audio Example

The shared interfaces also support streaming for real-time audio generation:

```java
@Service
public class StreamingNarrationService {

    private final TextToSpeechModel textToSpeechModel;

    public StreamingNarrationService(TextToSpeechModel textToSpeechModel) {
        this.textToSpeechModel = textToSpeechModel;
    }

    public Flux<byte[]> streamNarration(String text) {
        // TextToSpeechModel extends StreamingTextToSpeechModel
        return textToSpeechModel.stream(text);
    }

    public Flux<TextToSpeechResponse> streamWithMetadata(String text, TextToSpeechOptions options) {
        TextToSpeechPrompt prompt = new TextToSpeechPrompt(text, options);
        return textToSpeechModel.stream(prompt);
    }
}
```

<a id="_rest_controller_example"></a>

### REST Controller Example

Building a REST API with provider-agnostic TTS:

```java
@RestController
@RequestMapping("/api/tts")
public class TextToSpeechController {

    private final TextToSpeechModel textToSpeechModel;

    public TextToSpeechController(TextToSpeechModel textToSpeechModel) {
        this.textToSpeechModel = textToSpeechModel;
    }

    @PostMapping(value = "/synthesize", produces = "audio/mpeg")
    public ResponseEntity<byte[]> synthesize(@RequestBody SynthesisRequest request) {
        byte[] audio = textToSpeechModel.call(request.text());
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("audio/mpeg"))
            .header("Content-Disposition", "attachment; filename=\"speech.mp3\"")
            .body(audio);
    }

    @GetMapping(value = "/stream", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public Flux<byte[]> streamSynthesis(@RequestParam String text) {
        return textToSpeechModel.stream(text);
    }

    record SynthesisRequest(String text) {}
}
```

<a id="_configuration_based_provider_selection"></a>

### Configuration-Based Provider Selection

Switch between providers using Spring profiles or properties:

```yaml
# application-openai.yml
spring:
  ai:
    model:
      audio:
        speech: openai
    openai:
      api-key: ${OPENAI_API_KEY}
      audio:
        speech:
          options:
            model: gpt-4o-mini-tts
            voice: alloy

# application-elevenlabs.yml
spring:
  ai:
    model:
      audio:
        speech: elevenlabs
    elevenlabs:
      api-key: ${ELEVENLABS_API_KEY}
      tts:
        options:
          model-id: eleven_turbo_v2_5
          voice-id: your_voice_id
```

Then activate the desired provider:

```bash
# Use OpenAI
java -jar app.jar --spring.profiles.active=openai

# Use ElevenLabs
java -jar app.jar --spring.profiles.active=elevenlabs
```

<a id="_using_portable_options"></a>

### Using Portable Options

For maximum portability, use only the common `TextToSpeechOptions` interface methods:

```java
@Service
public class PortableNarrationService {

    private final TextToSpeechModel textToSpeechModel;

    public PortableNarrationService(TextToSpeechModel textToSpeechModel) {
        this.textToSpeechModel = textToSpeechModel;
    }

    public byte[] createPortableNarration(String text) {
        // Use provider's default options for maximum portability
        TextToSpeechOptions defaultOptions = textToSpeechModel.getDefaultOptions();
        TextToSpeechPrompt prompt = new TextToSpeechPrompt(text, defaultOptions);
        TextToSpeechResponse response = textToSpeechModel.call(prompt);
        return response.getResult().getOutput();
    }
}
```

<a id="_working_with_provider_specific_features"></a>

### Working with Provider-Specific Features

When you need provider-specific features, you can still use them while maintaining a portable codebase:

```java
@Service
public class FlexibleNarrationService {

    private final TextToSpeechModel textToSpeechModel;

    public FlexibleNarrationService(TextToSpeechModel textToSpeechModel) {
        this.textToSpeechModel = textToSpeechModel;
    }

    public byte[] narrate(String text, TextToSpeechOptions baseOptions) {
        TextToSpeechOptions options = baseOptions;

        // Apply provider-specific optimizations if available
        if (textToSpeechModel instanceof OpenAiAudioSpeechModel) {
            options = OpenAiAudioSpeechOptions.builder()
                .from(baseOptions)
                .model("gpt-4o-tts")  // OpenAI-specific: use high-quality model
                .speed(1.0)
                .build();
        } else if (textToSpeechModel instanceof ElevenLabsTextToSpeechModel) {
            // ElevenLabs-specific options could go here
        }

        TextToSpeechPrompt prompt = new TextToSpeechPrompt(text, options);
        TextToSpeechResponse response = textToSpeechModel.call(prompt);
        return response.getResult().getOutput();
    }
}
```

<a id="_best_practices_for_portable_code"></a>

### Best Practices for Portable Code

1. **Depend on Interfaces**: Always inject `TextToSpeechModel` rather than concrete implementations
1. **Use Common Options**: Stick to `TextToSpeechOptions` interface methods for maximum portability
1. **Handle Metadata Gracefully**: Different providers return different metadata; handle it generically
1. **Test with Multiple Providers**: Ensure your code works with at least two TTS providers
1. **Document Provider Assumptions**: If you rely on specific provider behavior, document it clearly

<a id="_provider_specific_features"></a>

## Provider-Specific Features

While the shared interfaces provide portability, each provider also offers specific features through provider-specific options classes (e.g., `OpenAiAudioSpeechOptions`, `ElevenLabsSpeechOptions`). These classes implement the `TextToSpeechOptions` interface while adding provider-specific capabilities.
