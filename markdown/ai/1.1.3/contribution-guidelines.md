---
title: "Contribution Guidelines"
source: "ROOT:contribution-guidelines.adoc"
---

<a id="contribution-guidelines"></a>

# Contribution Guidelines

<a id="_code_formatting_and_javadoc"></a>

## Code Formatting and Javadoc

Before submitting a PR, please run the following commands to ensure proper formatting and Javadoc processing

```
./mvnw spring-javaformat:apply javadoc:javadoc -Pjavadoc
```

The `-Pjavadoc` is a profile that enables Javadoc processing so as to avoid a long build time when developing.

<a id="_contributing_a_new_ai_model_implementation"></a>

## Contributing a New AI Model Implementation

This section outlines the steps for contributing a new AI model implementation.
AI models vary significantly, with diverse inputs and outputs — from chat models that
translate text input into text output, to text-to-image models that generate images
from text descriptions.
Complex models may even handle multiple types of input and output, such as combining text,
images, and videos to produce mixed media output.

To contribute a new model, adhere to the following steps:

1. **Create a Low-Level Client API Class**: If no existing Java client suits the AI model,
you’ll need to develop a low-level client API class. This often involves utilizing the
`RestClient` class from the Spring Framework, similar to the `OpenAiApi` class.
1. **Create a Model implementation**
Ensure your client conforms to the [Generic Model API](https://docs.spring.io/spring-ai/reference/api/generic-model.html).
Use existing request and response classes if your model’s inputs and outputs are supported.
If not, create new classes for the Generic Model API and establish a new Java package.
When logging Personally Identifiable Information (PII), mark it with [`PII_MARKER`](https://github.com/spring-projects/spring-ai/tree/main/spring-ai-core/src/main/java/org/springframework/ai/util/LoggingMarkers.java) Slf4j marker.
1. **Implement Auto-Configuration and a Spring Boot Starter**: This step involves creating the
necessary auto-configuration and Spring Boot Starter to easily instantiate the new model with
Spring Boot applications.
1. **Write Tests**: All new classes should be accompanied by comprehensive tests.
Existing tests can serve as a useful reference for structuring and implementing your tests.
1. **Document Your Contribution**: Ensure your documentation follows the existing format,
For an example of the suggested structure and formatting, refer to the
[Open AI Chat documentation](https://docs.spring.io/spring-ai/reference/api/chat/openai-chat.html).

By following these guidelines, we can greatly expand the framework’s range of supported models
while following a common implementation and documentation pattern.
