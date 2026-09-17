---
title: "Upgrade Notes"
source: "ROOT:upgrade-notes.adoc"
---

<a id="upgrade-notes"></a>

# Upgrade Notes

<a id="upgrading-to-1-1-3"></a>

## Upgrading to 1.1.3

<a id="_breaking_changes"></a>

### Breaking Changes

<a id="_mongodb_chat_memory_message_ordering_fixed"></a>

#### MongoDB Chat Memory Message Ordering Fixed

The `MongoChatMemoryRepository` has been fixed to return messages in the order they were sent (oldest-to-newest), matching all other chat memory repository implementations. Previously, it incorrectly returned messages in reverse order (newest-to-oldest), which broke conversation flow for LLMs.

<a id="_impact"></a>

##### Impact

If your application was using `MongoChatMemoryRepository` and working around the incorrect ordering (e.g., by reversing messages after retrieval), you will need to remove that workaround.

<a id="_migration"></a>

##### Migration

Remove any code that reverses the message order after retrieving from MongoDB chat memory:

```java
// BEFORE (with workaround for bug):
List<Message> messages = chatMemoryRepository.findByConversationId(conversationId);
Collections.reverse(messages); // Remove this workaround

// AFTER (correct ordering):
List<Message> messages = chatMemoryRepository.findByConversationId(conversationId);
// Messages are now correctly ordered in the order they were sent
```

All chat memory repositories now consistently return messages in the order they were sent (oldest-to-newest), which is the expected format for LLM conversation history.

<a id="upgrading-to-1-1-0-RC1"></a>

## Upgrading to 1.1.0-RC1

<a id="_breaking_changes_2"></a>

### Breaking Changes

<a id="_text_to_speech_tts_api_migration"></a>

#### Text-to-Speech (TTS) API Migration

The OpenAI Text-to-Speech implementation has been migrated from provider-specific classes to shared interfaces. This enables writing portable code that works across multiple TTS providers (OpenAI, ElevenLabs, and future providers).

<a id="_removed_classes"></a>

##### Removed Classes

The following deprecated classes have been removed from the `org.springframework.ai.openai.audio.speech` package:

- `SpeechModel` → Use `TextToSpeechModel` (from `org.springframework.ai.audio.tts`)
- `StreamingSpeechModel` → Use `StreamingTextToSpeechModel` (from `org.springframework.ai.audio.tts`)
- `SpeechPrompt` → Use `TextToSpeechPrompt` (from `org.springframework.ai.audio.tts`)
- `SpeechResponse` → Use `TextToSpeechResponse` (from `org.springframework.ai.audio.tts`)
- `SpeechMessage` → Use `TextToSpeechMessage` (from `org.springframework.ai.audio.tts`)
- `Speech` (in `org.springframework.ai.openai.audio.speech`) → Use `Speech` (from `org.springframework.ai.audio.tts`)

Additionally, the `speed` parameter type changed from `Float` to `Double` across all OpenAI TTS components for consistency with other TTS providers.

<a id="_migration_steps"></a>

##### Migration Steps

1. **Update Imports**: Replace all imports from `org.springframework.ai.openai.audio.speech.` with `org.springframework.ai.audio.tts.`
1. **Update Type References**: Replace all occurrences of the old class names with the new ones:

   ```text
   Find:    SpeechModel
   Replace: TextToSpeechModel

   Find:    StreamingSpeechModel
   Replace: StreamingTextToSpeechModel

   Find:    SpeechPrompt
   Replace: TextToSpeechPrompt

   Find:    SpeechResponse
   Replace: TextToSpeechResponse

   Find:    SpeechMessage
   Replace: TextToSpeechMessage
   ```
1. **Update Speed Parameter**: Change from `Float` to `Double`:

   ```text
   Find:    .speed(1.0f)
   Replace: .speed(1.0)

   Find:    Float speed
   Replace: Double speed
   ```
1. **Update Dependency Injection**: If you inject `SpeechModel`, update to `TextToSpeechModel`:

   ```java
   // Before
   public MyService(SpeechModel speechModel) { ... }

   // After
   public MyService(TextToSpeechModel textToSpeechModel) { ... }
   ```

<a id="_benefits"></a>

##### Benefits

- **Portability**: Write code once, switch between OpenAI, ElevenLabs, or other TTS providers easily
- **Consistency**: Same patterns as ChatModel and other Spring AI abstractions
- **Type Safety**: Improved type hierarchy with proper interface implementations
- **Future-Proof**: New TTS providers will automatically work with your existing code

<a id="_additional_resources"></a>

##### Additional Resources

For a comprehensive migration guide with detailed code examples, see:

- [OpenAI TTS Migration Guide](api/audio/speech/openai-speech.md#_migration_guide)
- [Writing Provider-Agnostic TTS Code](api/audio/speech.md#_writing_provider_agnostic_code)

<a id="upgrading-to-1-0-0-snapshot"></a>

## Upgrading to 1.0.0-SNAPSHOT

<a id="_overview"></a>

### Overview

The 1.0.0-SNAPSHOT version includes significant changes to artifact IDs, package names, and module structure. This section provides guidance specific to using the SNAPSHOT version.

<a id="_add_snapshot_repositories"></a>

### Add Snapshot Repositories

To use the 1.0.0-SNAPSHOT version, you need to add the snapshot repositories to your build file.
For detailed instructions, refer to the [Snapshots - Add Snapshot Repositories](getting-started.md#snapshots-add-snapshot-repositories) section in the Getting Started guide.

<a id="_update_dependency_management"></a>

### Update Dependency Management

Update your Spring AI BOM version to `1.0.0-SNAPSHOT` in your build configuration.
For detailed instructions on configuring dependency management, refer to the [Dependency Management](getting-started.md#dependency-management) section in the Getting Started guide.

<a id="_artifact_id_package_and_module_changes"></a>

### Artifact ID, Package, and Module Changes

The 1.0.0-SNAPSHOT includes changes to artifact IDs, package names, and module structure.

For details, refer to:
- [Common Artifact ID Changes](#common-artifact-id-changes)
- [Common Package Changes](#common-package-changes)
- [Common Module Structure](#common-module-structure)

<a id="upgrading-to-1-0-0-RC1"></a>

## Upgrading to 1.0.0-RC1

You can automate the upgrade process to 1.0.0-RC1 using an OpenRewrite recipe.
This recipe helps apply many of the necessary code changes for this version.
Find the recipe and usage instructions at [Arconia Spring AI Migrations](https://github.com/arconia-io/arconia-migrations/blob/main/docs/spring-ai.md).

<a id="_breaking_changes_3"></a>

### Breaking Changes

<a id="_chat_client_and_advisors"></a>

#### Chat Client and Advisors

The main changes that impact end user code are:

- In `VectorStoreChatMemoryAdvisor`:

  - The constant `CHAT_MEMORY_RETRIEVE_SIZE_KEY` has been renamed to `TOP_K`.
  - The constant `DEFAULT_CHAT_MEMORY_RESPONSE_SIZE` (value: 100) has been renamed to `DEFAULT_TOP_K` with a new default value of 20.
- The constant `CHAT_MEMORY_CONVERSATION_ID_KEY` has been renamed to `CONVERSATION_ID` and moved from `AbstractChatMemoryAdvisor` to the `ChatMemory` interface. Update your imports to use `org.springframework.ai.chat.memory.ChatMemory.CONVERSATION_ID`.

<a id="_self_contained_templates_in_advisors"></a>

##### Self-contained Templates in Advisors

The built-in advisors that perform prompt augmentation have been updated to use self-contained templates. The goal is for each advisor to be able to perform templating operations without affecting nor being affected by templating and prompt decisions in other advisors.

**If you were providing custom templates for the following advisors, you’ll need to update them to ensure all expected placeholders are included.**

- The `QuestionAnswerAdvisor` expects a template with the following placeholders (see [more details](api/retrieval-augmented-generation.md#_questionansweradvisor)):

  - a `query` placeholder to receive the user question.
  - a `question_answer_context` placeholder to receive the retrieved context.
- The `PromptChatMemoryAdvisor` expects a template with the following placeholders (see [more details](api/chat-memory.md#_promptchatmemoryadvisor)):

  - an `instructions` placeholder to receive the original system message.
  - a `memory` placeholder to receive the retrieved conversation memory.
- The `VectorStoreChatMemoryAdvisor` expects a template with the following placeholders (see [more details](api/chat-memory.md#_vectorstorechatmemoryadvisor)):

  - an `instructions` placeholder to receive the original system message.
  - a `long_term_memory` placeholder to receive the retrieved conversation memory.

<a id="_observability"></a>

#### Observability

- Refactored content observation to use logging instead of tracing ([ca843e8](https://github.com/spring-projects/spring-ai/commit/ca843e85887aa1da6300c77550c379c103500897))

  - Replaced content observation filters with logging handlers
  - Renamed configuration properties to better reflect their purpose:

    - `include-prompt` → `log-prompt`
    - `include-completion` → `log-completion`
    - `include-query-response` → `log-query-response`
  - Added `TracingAwareLoggingObservationHandler` for trace-aware logging
  - Replaced `micrometer-tracing-bridge-otel` with `micrometer-tracing`
  - Removed event-based tracing in favor of direct logging
  - Removed direct dependency on the OTel SDK
  - Renamed `includePrompt` to `logPrompt` in observation properties (in `ChatClientBuilderProperties`, `ChatObservationProperties`, and `ImageObservationProperties`)

<a id="_chat_memory_repository_module_and_autoconfiguration_renaming"></a>

#### Chat Memory Repository Module and Autoconfiguration Renaming

We’ve standardized the naming pattern for chat memory components by adding the repository suffix throughout the codebase. This change affects Cassandra, JDBC, and Neo4j implementations, impacting artifact IDs, Java package names, and class names for clarity.

<a id="_artifact_ids"></a>

#### Artifact IDs

All memory-related artifacts now follow a consistent pattern:

- `spring-ai-model-chat-memory-` → `spring-ai-model-chat-memory-repository-`
- `spring-ai-autoconfigure-model-chat-memory-` → `spring-ai-autoconfigure-model-chat-memory-repository-`
- `spring-ai-starter-model-chat-memory-` → `spring-ai-starter-model-chat-memory-repository-`

<a id="_java_packages"></a>

#### Java Packages

- Package paths now include `.repository.` segment
- Example: `org.springframework.ai.chat.memory.jdbc` → `org.springframework.ai.chat.memory.repository.jdbc`

<a id="_configuration_classes"></a>

#### Configuration Classes

- Main autoconfiguration classes now use the `Repository` suffix
- Example: `JdbcChatMemoryAutoConfiguration` → `JdbcChatMemoryRepositoryAutoConfiguration`

<a id="_properties"></a>

#### Properties

- Configuration properties renamed from `spring.ai.chat.memory.<storage>…​` to `spring.ai.chat.memory.repository.<storage>…​`

**Migration Required:**
- Update your Maven/Gradle dependencies to use the new artifact IDs.
- Update any imports, class references, or configuration that used the old package or class names.

<a id="_message_aggregator_refactoring"></a>

#### Message Aggregator Refactoring

<a id="_changes"></a>

##### Changes

- `MessageAggregator` class has been moved from `org.springframework.ai.chat.model` package in the `spring-ai-client-chat` module to the `spring-ai-model` module (same package name)
- The `aggregateChatClientResponse` method has been removed from `MessageAggregator` and moved to a new class `ChatClientMessageAggregator` in the `org.springframework.ai.chat.client` package

<a id="_migration_guide"></a>

##### Migration Guide

If you were directly using the `aggregateChatClientResponse` method from `MessageAggregator`, you need to use the new `ChatClientMessageAggregator` class instead:

```java
// Before
new MessageAggregator().aggregateChatClientResponse(chatClientResponses, aggregationHandler);

// After
new ChatClientMessageAggregator().aggregateChatClientResponse(chatClientResponses, aggregationHandler);
```

Don’t forget to add the appropriate import:

```java
import org.springframework.ai.chat.client.ChatClientMessageAggregator;
```

<a id="_watson"></a>

#### Watson

The Watson AI model was removed as it was based on the older text generation that is considered outdated as there is a new chat generation model available.
Hopefully Watson will reappear in a future version of Spring AI

<a id="_moonshot_and_qianfan"></a>

#### MoonShot and QianFan

Moonshot and Qianfan have been removed since they are not accessible from outside China.  These have been moved to the Spring AI Community repository.

<a id="_removed_vector_store"></a>

#### Removed Vector Store

- Removed HanaDB vector store autoconfiguration ([f3b4624](https://github.com/spring-projects/spring-ai/commit/f3b46244942c5072c2e2fa89e62cde71c61bbf25))

<a id="_memory_management"></a>

#### Memory Management

- Removed CassandraChatMemory implementation ([11e3c8f](https://github.com/spring-projects/spring-ai/commit/11e3c8f9a6636d77f203968b83625d3e5694c408))
- Simplified chat memory advisor hierarchy and removed deprecated API ([848a3fd](https://github.com/spring-projects/spring-ai/commit/848a3fd31fadd07c9ba77f6dc30425389d095e9a))
- Removed deprecations in JdbcChatMemory ([356a68f](https://github.com/spring-projects/spring-ai/commit/356a68f15eea07a040bd27c66442472fc55e6475))
- Refactored chat memory repository artifacts for clarity ([2d517ee](https://github.com/spring-projects/spring-ai/commit/2d517eec5cd7ce5f88149b876ed57a06ad353e11))
- Refactored chat memory repository autoconfigurations and Spring Boot starters for clarity ([f6dba1b](https://github.com/spring-projects/spring-ai/commit/f6dba1bf083d847cdc07888ba62746683e3d61bb))

<a id="_message_and_template_apis"></a>

#### Message and Template APIs

- Removed deprecated UserMessage constructors ([06edee4](https://github.com/spring-projects/spring-ai/commit/06edee406978d172a1f87f4c7b255282f9d55e4c))
- Removed deprecated PromptTemplate constructors ([722c77e](https://github.com/spring-projects/spring-ai/commit/722c77e812f3f3ea40cf2258056fcf1578b15c62))
- Removed deprecated methods from Media ([228ef10](https://github.com/spring-projects/spring-ai/commit/228ef10bfbfe279d7d09f2a7ba166db873372118))
- Refactored StTemplateRenderer: renamed supportStFunctions to validateStFunctions ([0e15197](https://github.com/spring-projects/spring-ai/commit/0e15197298c0848b78a746f3d740191e6a6aee7a))
- Removed left over TemplateRender interface after moving it ([52675d8](https://github.com/spring-projects/spring-ai/commit/52675d854ccecbc702cec24c4f070520eca64938))

<a id="_additional_client_api_changes"></a>

#### Additional Client API Changes

- Removed deprecations in ChatClient and Advisors ([4fe74d8](https://github.com/spring-projects/spring-ai/commit/4fe74d886e26d52abf6f2f5545264d422a0be4b2))
- Removed deprecations from OllamaApi and AnthropicApi ([46be898](https://github.com/spring-projects/spring-ai/commit/46be8987d6bc385bf74b9296aa4308c7a8658d2f))

<a id="_package_structure_changes"></a>

#### Package Structure Changes

- Removed inter-package dependency cycles in spring-ai-model ([ebfa5b9](https://github.com/spring-projects/spring-ai/commit/ebfa5b9b2cc2ab0d20e25dc6128c4b1c9c327f89))
- Moved MessageAggregator to spring-ai-model module ([54e5c07](https://github.com/spring-projects/spring-ai/commit/54e5c07428909ceec248e3bbd71e2df4b0812e49))

<a id="_dependencies"></a>

#### Dependencies

- Removed unused json-path dependency in spring-ai-openai ([9de13d1](https://github.com/spring-projects/spring-ai/commit/9de13d1b2fdb67219dc7afbf319ade789784f2b9))

<a id="_behavior_changes"></a>

### Behavior Changes

<a id="_azure_openai"></a>

#### Azure OpenAI

- Added Entra ID identity management for Azure OpenAI with clean autoconfiguration ([3dc86d3](https://github.com/spring-projects/spring-ai/commit/3dc86d33ce90ebd68ec3997a0eb4704ab7774e99))

<a id="_general_cleanup"></a>

### General Cleanup

- Removed all code deprecations ([76bee8c](https://github.com/spring-projects/spring-ai/commit/76bee8ceb2854839f93a6c52876f50bb24219355)) and ([b6ce7f3](https://github.com/spring-projects/spring-ai/commit/b6ce7f3e4a7aafe6b9031043f63813dde6e73605))

<a id="upgrading-to-1-0-0-m8"></a>

## Upgrading to 1.0.0-M8

You can automate the upgrade process to 1.0.0-M8 using an OpenRewrite recipe.
This recipe helps apply many of the necessary code changes for this version.
Find the recipe and usage instructions at [Arconia Spring AI Migrations](https://github.com/arconia-io/arconia-migrations/blob/main/docs/spring-ai.md).

<a id="_breaking_changes_4"></a>

### Breaking Changes

When upgrading from Spring AI 1.0 M7 to 1.0 M8, users who previously registered tool callbacks are encountering breaking changes that cause tool calling functionality to silently fail. This is specifically impacting code that used the deprecated `tools()` method.

<a id="_example"></a>

#### Example

Here’s an example of code that worked in M7 but no longer functions as expected in M8:

```java
// This worked in M7 but silently fails in M8
ChatClient chatClient = new OpenAiChatClient(api)
    .tools(List.of(
        new Tool("get_current_weather", "Get the current weather in a given location",
            new ToolSpecification.ToolParameter("location", "The city and state, e.g. San Francisco, CA", true))
    ))
    .toolCallbacks(List.of(
        new ToolCallback("get_current_weather", (toolName, params) -> {
            // Weather retrieval logic
            return Map.of("temperature", 72, "unit", "fahrenheit", "description", "Sunny");
        })
    ));
```

<a id="_solution"></a>

#### Solution

The solution is to use the `toolSpecifications()` method instead of the deprecated `tools()` method:

```java
// This works in M8
ChatClient chatClient = new OpenAiChatClient(api)
    .toolSpecifications(List.of(
        new Tool("get_current_weather", "Get the current weather in a given location",
            new ToolSpecification.ToolParameter("location", "The city and state, e.g. San Francisco, CA", true))
    ))
    .toolCallbacks(List.of(
        new ToolCallback("get_current_weather", (toolName, params) -> {
            // Weather retrieval logic
            return Map.of("temperature", 72, "unit", "fahrenheit", "description", "Sunny");
        })
    ));
```

<a id="_removed_implementations_and_apis"></a>

### Removed Implementations and APIs

<a id="_memory_management_2"></a>

#### Memory Management

- Removed CassandraChatMemory implementation ([11e3c8f](https://github.com/spring-projects/spring-ai/commit/11e3c8f9a6636d77f203968b83625d3e5694c408))
- Simplified chat memory advisor hierarchy and removed deprecated API ([848a3fd](https://github.com/spring-projects/spring-ai/commit/848a3fd31fadd07c9ba77f6dc30425389d095e9a))
- Removed deprecations in JdbcChatMemory ([356a68f](https://github.com/spring-projects/spring-ai/commit/356a68f15eea07a040bd27c66442472fc55e6475))
- Refactored chat memory repository artifacts for clarity ([2d517ee](https://github.com/spring-projects/spring-ai/commit/2d517eec5cd7ce5f88149b876ed57a06ad353e11))
- Refactored chat memory repository autoconfigurations and Spring Boot starters for clarity ([f6dba1b](https://github.com/spring-projects/spring-ai/commit/f6dba1bf083d847cdc07888ba62746683e3d61bb))

<a id="_client_apis"></a>

#### Client APIs

- Removed deprecations in ChatClient and Advisors ([4fe74d8](https://github.com/spring-projects/spring-ai/commit/4fe74d886e26d52abf6f2f5545264d422a0be4b2))
- Breaking changes to chatclient tool calling ([5b7849d](https://github.com/spring-projects/spring-ai/commit/5b7849de088b3c93c7ec894fcaddc85a611a8572))
- Removed deprecations from OllamaApi and AnthropicApi ([46be898](https://github.com/spring-projects/spring-ai/commit/46be8987d6bc385bf74b9296aa4308c7a8658d2f))

<a id="_message_and_template_apis_2"></a>

#### Message and Template APIs

- Removed deprecated UserMessage constructors ([06edee4](https://github.com/spring-projects/spring-ai/commit/06edee406978d172a1f87f4c7b255282f9d55e4c))
- Removed deprecated PromptTemplate constructors ([722c77e](https://github.com/spring-projects/spring-ai/commit/722c77e812f3f3ea40cf2258056fcf1578b15c62))
- Removed deprecated methods from Media ([228ef10](https://github.com/spring-projects/spring-ai/commit/228ef10bfbfe279d7d09f2a7ba166db873372118))
- Refactored StTemplateRenderer: renamed supportStFunctions to validateStFunctions ([0e15197](https://github.com/spring-projects/spring-ai/commit/0e15197298c0848b78a746f3d740191e6a6aee7a))
- Removed left over TemplateRender interface after moving it ([52675d8](https://github.com/spring-projects/spring-ai/commit/52675d854ccecbc702cec24c4f070520eca64938))

<a id="_model_implementations"></a>

#### Model Implementations

- Removed Watson text generation model ([9e71b16](https://github.com/spring-projects/spring-ai/commit/9e71b163e315199fe7b46495d87a0828a807b88f))
- Removed Qianfan code ([bfcaad7](https://github.com/spring-projects/spring-ai/commit/bfcaad7b5495c5927a62b44169e8713e044c2497))
- Removed HanaDB vector store autoconfiguration ([f3b4624](https://github.com/spring-projects/spring-ai/commit/f3b46244942c5072c2e2fa89e62cde71c61bbf25))
- Removed deepseek options from OpenAiApi ([59b36d1](https://github.com/spring-projects/spring-ai/commit/59b36d14dab72d76f2f3d49ce9385a69faaabbba))

<a id="_package_structure_changes_2"></a>

#### Package Structure Changes

- Removed inter-package dependency cycles in spring-ai-model ([ebfa5b9](https://github.com/spring-projects/spring-ai/commit/ebfa5b9b2cc2ab0d20e25dc6128c4b1c9c327f89))
- Moved MessageAggregator to spring-ai-model module ([54e5c07](https://github.com/spring-projects/spring-ai/commit/54e5c07428909ceec248e3bbd71e2df4b0812e49))

<a id="_dependencies_2"></a>

#### Dependencies

- Removed unused json-path dependency in spring-ai-openai ([9de13d1](https://github.com/spring-projects/spring-ai/commit/9de13d1b2fdb67219dc7afbf319ade789784f2b9))

<a id="_behavior_changes_2"></a>

### Behavior Changes

<a id="_observability_2"></a>

#### Observability

- Refactored content observation to use logging instead of tracing ([ca843e8](https://github.com/spring-projects/spring-ai/commit/ca843e85887aa1da6300c77550c379c103500897))

  - Replaced content observation filters with logging handlers
  - Renamed configuration properties to better reflect their purpose:

    - `include-prompt` → `log-prompt`
    - `include-completion` → `log-completion`
    - `include-query-response` → `log-query-response`
  - Added `TracingAwareLoggingObservationHandler` for trace-aware logging
  - Replaced `micrometer-tracing-bridge-otel` with `micrometer-tracing`
  - Removed event-based tracing in favor of direct logging
  - Removed direct dependency on the OTel SDK
  - Renamed `includePrompt` to `logPrompt` in observation properties (in `ChatClientBuilderProperties`, `ChatObservationProperties`, and `ImageObservationProperties`)

<a id="_azure_openai_2"></a>

#### Azure OpenAI

- Added Entra ID identity management for Azure OpenAI with clean autoconfiguration ([3dc86d3](https://github.com/spring-projects/spring-ai/commit/3dc86d33ce90ebd68ec3997a0eb4704ab7774e99))

<a id="_general_cleanup_2"></a>

### General Cleanup

- Removed all deprecations from 1.0.0-M8 ([76bee8c](https://github.com/spring-projects/spring-ai/commit/76bee8ceb2854839f93a6c52876f50bb24219355))
- General deprecation cleanup ([b6ce7f3](https://github.com/spring-projects/spring-ai/commit/b6ce7f3e4a7aafe6b9031043f63813dde6e73605))

<a id="upgrading-to-1-0-0-m7"></a>

## Upgrading to 1.0.0-M7

<a id="_overview_of_changes"></a>

### Overview of Changes

Spring AI 1.0.0-M7 is the last milestone release before the RC1 and GA releases. It introduces several important changes to artifact IDs, package names, and module structure that will be maintained in the final release.

<a id="_artifact_id_package_and_module_changes_2"></a>

### Artifact ID, Package, and Module Changes

The 1.0.0-M7 includes the same structural changes as 1.0.0-SNAPSHOT.

For details, refer to:
- [Common Artifact ID Changes](#common-artifact-id-changes)
- [Common Package Changes](#common-package-changes)
- [Common Module Structure](#common-module-structure)

<a id="_mcp_java_sdk_upgrade_to_0_9_0"></a>

### MCP Java SDK Upgrade to 0.9.0

Spring AI 1.0.0-M7 now uses MCP Java SDK version 0.9.0, which includes significant changes from previous versions. If you’re using MCP in your applications, you’ll need to update your code to accommodate these changes.

Key changes include:

<a id="_interface_renaming"></a>

#### Interface Renaming

- `ClientMcpTransport` → `McpClientTransport`
- `ServerMcpTransport` → `McpServerTransport`
- `DefaultMcpSession` → `McpClientSession` or `McpServerSession`
- All `*Registration` classes → `*Specification` classes

<a id="_server_creation_changes"></a>

#### Server Creation Changes

- Use `McpServerTransportProvider` instead of `ServerMcpTransport`

```java
// Before
ServerMcpTransport transport = new WebFluxSseServerTransport(objectMapper, "/mcp/message");
var server = McpServer.sync(transport)
    .serverInfo("my-server", "1.0.0")
    .build();

// After
McpServerTransportProvider transportProvider = new WebFluxSseServerTransportProvider(objectMapper, "/mcp/message");
var server = McpServer.sync(transportProvider)
    .serverInfo("my-server", "1.0.0")
    .build();
```

<a id="_handler_signature_changes"></a>

#### Handler Signature Changes

All handlers now receive an `exchange` parameter as their first argument:

```java
// Before
.tool(calculatorTool, args -> new CallToolResult("Result: " + calculate(args)))

// After
.tool(calculatorTool, (exchange, args) -> new CallToolResult("Result: " + calculate(args)))
```

<a id="_client_interaction_via_exchange"></a>

#### Client Interaction via Exchange

Methods previously available on the server are now accessed through the exchange object:

```java
// Before
ClientCapabilities capabilities = server.getClientCapabilities();
CreateMessageResult result = server.createMessage(new CreateMessageRequest(...));

// After
ClientCapabilities capabilities = exchange.getClientCapabilities();
CreateMessageResult result = exchange.createMessage(new CreateMessageRequest(...));
```

<a id="_roots_change_handlers"></a>

#### Roots Change Handlers

```java
// Before
.rootsChangeConsumers(List.of(
    roots -> System.out.println("Roots changed: " + roots)
))

// After
.rootsChangeHandlers(List.of(
    (exchange, roots) -> System.out.println("Roots changed: " + roots)
))
```

For a complete guide to migrating MCP code, refer to the [MCP Migration Guide](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-docs/src/main/antora/modules/ROOT/pages/mcp-migration.adoc).

<a id="_enablingdisabling_model_auto_configuration"></a>

### Enabling/Disabling Model Auto-Configuration

The previous configuration properties for enabling/disabling model auto-configuration have been removed:

- `spring.ai.<provider>.chat.enabled`
- `spring.ai.<provider>.embedding.enabled`
- `spring.ai.<provider>.image.enabled`
- `spring.ai.<provider>.moderation.enabled`

By default, if a model provider (e.g., OpenAI, Ollama) is found on the classpath, its corresponding auto-configuration for relevant model types (chat, embedding, etc.) is enabled. If multiple providers for the same model type are present (e.g., both `spring-ai-openai-spring-boot-starter` and `spring-ai-ollama-spring-boot-starter`), you can use the following properties to select **which** provider’s auto-configuration should be active, effectively disabling the others for that specific model type.

To disable auto-configuration for a specific model type entirely, even if only one provider is present, set the corresponding property to a value that does not match any provider on the classpath (e.g., `none` or `disabled`).

You can refer to the [`SpringAIModels`](https://github.com/spring-projects/spring-ai/blob/main/spring-ai-model/src/main/java/org/springframework/ai/model/SpringAIModels.java) enumeration for a list of well-known provider values.

- `spring.ai.model.audio.speech=<model-provider|none>`
- `spring.ai.model.audio.transcription=<model-provider|none>`
- `spring.ai.model.chat=<model-provider|none>`
- `spring.ai.model.embedding=<model-provider|none>`
- `spring.ai.model.embedding.multimodal=<model-provider|none>`
- `spring.ai.model.embedding.text=<model-provider|none>`
- `spring.ai.model.image=<model-provider|none>`
- `spring.ai.model.moderation=<model-provider|none>`

<a id="_automating_upgrading_using_ai"></a>

### Automating upgrading using AI

You can automate the upgrade process to 1.0.0-M7 using the Claude Code CLI tool with a provided prompt:

1. Download the [Claude Code CLI tool](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview)
1. Copy the prompt from the [update-to-m7.txt](https://github.com/spring-projects/spring-ai/blob/main/src/prompts/update-to-m7.txt) file
1. Paste the prompt into the Claude Code CLI
1. The AI will analyze your project and make the necessary changes

> [!NOTE]
> The automated upgrade prompt currently handles artifact ID changes, package relocations, and module structure changes, but does not yet include automatic changes for upgrading to MCP 0.9.0. If you’re using MCP, you’ll need to manually update your code following the guidance in the [MCP Java SDK Upgrade](#mcp-java-sdk-upgrade-to-0-9-0) section.

<a id="common-sections"></a>

## Common Changes Across Versions

<a id="common-artifact-id-changes"></a>

### Artifact ID Changes

The naming pattern for Spring AI starter artifacts has changed.
You’ll need to update your dependencies according to the following patterns:

- Model starters: `spring-ai-{model}-spring-boot-starter` → `spring-ai-starter-model-{model}`
- Vector Store starters: `spring-ai-{store}-store-spring-boot-starter` → `spring-ai-starter-vector-store-{store}`
- MCP starters: `spring-ai-mcp-{type}-spring-boot-starter` → `spring-ai-starter-mcp-{type}`

<a id="_examples"></a>

#### Examples

#### Maven

```xml
<!-- BEFORE -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
</dependency>

<!-- AFTER -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-openai</artifactId>
</dependency>
```

#### Gradle

```groovy
// BEFORE
implementation 'org.springframework.ai:spring-ai-openai-spring-boot-starter'
implementation 'org.springframework.ai:spring-ai-redis-store-spring-boot-starter'

// AFTER
implementation 'org.springframework.ai:spring-ai-starter-model-openai'
implementation 'org.springframework.ai:spring-ai-starter-vector-store-redis'
```

<a id="_changes_to_spring_ai_autoconfiguration_artifacts"></a>

#### Changes to Spring AI Autoconfiguration Artifacts

The Spring AI autoconfiguration has changed from a single monolithic artifact to individual autoconfiguration artifacts per model, vector store, and other components.
This change was made to minimize the impact of different versions of dependent libraries conflicting, such as Google Protocol Buffers, Google RPC, and others.
By separating autoconfiguration into component-specific artifacts, you can avoid pulling in unnecessary dependencies and reduce the risk of version conflicts in your application.

The original monolithic artifact is no longer available:

```xml
<!-- NO LONGER AVAILABLE -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-spring-boot-autoconfigure</artifactId>
    <version>${project.version}</version>
</dependency>
```

Instead, each component now has its own autoconfiguration artifact following these patterns:

- Model autoconfiguration: `spring-ai-autoconfigure-model-{model}`
- Vector Store autoconfiguration: `spring-ai-autoconfigure-vector-store-{store}`
- MCP autoconfiguration: `spring-ai-autoconfigure-mcp-{type}`

<a id="_examples_of_new_autoconfiguration_artifacts"></a>

#### Examples of New Autoconfiguration Artifacts

#### Models

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-autoconfigure-model-openai</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-autoconfigure-model-anthropic</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-autoconfigure-model-vertex-ai</artifactId>
</dependency>
```

#### Vector Stores

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-autoconfigure-vector-store-redis</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-autoconfigure-vector-store-pgvector</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-autoconfigure-vector-store-chroma</artifactId>
</dependency>
```

#### MCP

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-autoconfigure-mcp-client</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-autoconfigure-mcp-server</artifactId>
</dependency>
```

> [!NOTE]
> In most cases, you won’t need to explicitly add these autoconfiguration dependencies.
> They are included transitively when using the corresponding starter dependencies.

<a id="common-package-changes"></a>

### Package Name Changes

Your IDE should assist with refactoring to the new package locations.

- `KeywordMetadataEnricher` and `SummaryMetadataEnricher` have moved from `org.springframework.ai.transformer` to `org.springframework.ai.chat.transformer`.
- `Content`, `MediaContent`, and `Media` have moved from `org.springframework.ai.model` to `org.springframework.ai.content`.

<a id="common-module-structure"></a>

### Module Structure

The project has undergone significant changes to its module and artifact structure. Previously, `spring-ai-core` contained all central interfaces, but this has now been split into specialized domain modules to reduce unnecessary dependencies in your applications.

![Spring AI Dependencies](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.5/spring-ai-docs/src/main/antora/modules/ROOT/images/spring-ai-dependencies.png)

<a id="_spring_ai_commons"></a>

#### spring-ai-commons

Base module with no dependencies on other Spring AI modules. Contains:
- Core domain models (`Document`, `TextSplitter`)
- JSON utilities and resource handling
- Structured logging and observability support

<a id="_spring_ai_model"></a>

#### spring-ai-model

Provides AI capability abstractions:
- Interfaces like `ChatModel`, `EmbeddingModel`, and `ImageModel`
- Message types and prompt templates
- Function-calling framework (`ToolDefinition`, `ToolCallback`)
- Content filtering and observation support

<a id="_spring_ai_vector_store"></a>

#### spring-ai-vector-store

Unified vector database abstraction:
- `VectorStore` interface for similarity search
- Advanced filtering with SQL-like expressions
- `SimpleVectorStore` for in-memory usage
- Batching support for embeddings

<a id="_spring_ai_client_chat"></a>

#### spring-ai-client-chat

High-level conversational AI APIs:
- `ChatClient` interface
- Conversation persistence via `ChatMemory`
- Response conversion with `OutputConverter`
- Advisor-based interception
- Synchronous and reactive streaming support

<a id="_spring_ai_advisors_vector_store"></a>

#### spring-ai-advisors-vector-store

Bridges chat with vector stores for RAG:
- `QuestionAnswerAdvisor`: injects context into prompts
- `VectorStoreChatMemoryAdvisor`: stores/retrieves conversation history

<a id="_spring_ai_model_chat_memory_cassandra"></a>

#### spring-ai-model-chat-memory-cassandra

Apache Cassandra persistence for `ChatMemory`:
- `CassandraChatMemory` implementation
- Type-safe CQL with Cassandra’s QueryBuilder
==== spring-ai-model-chat-memory-neo4j

Neo4j graph database persistence for chat conversations.

<a id="_spring_ai_rag"></a>

#### spring-ai-rag

Comprehensive framework for Retrieval Augmented Generation:
- Modular architecture for RAG pipelines
- `RetrievalAugmentationAdvisor` as main entry point
- Functional programming principles with composable components

<a id="_dependency_structure"></a>

### Dependency Structure

The dependency hierarchy can be summarized as:

- `spring-ai-commons` (foundation)
- `spring-ai-model` (depends on commons)
- `spring-ai-vector-store` and `spring-ai-client-chat` (both depend on model)
- `spring-ai-advisors-vector-store` and `spring-ai-rag` (depend on both client-chat and vector-store)
- `spring-ai-model-chat-memory-*` modules (depend on client-chat)

<a id="common-toolcontext-changes"></a>

### ToolContext Changes

The `ToolContext` class has been enhanced to support both explicit and implicit tool resolution. Tools can now be:

1. **Explicitly Included**: Tools that are explicitly requested in the prompt and included in the call to the model.
1. **Implicitly Available**: Tools that are made available for runtime dynamic resolution, but never included in any call to the model unless explicitly requested.

Starting with 1.0.0-M7, tools are only included in the call to the model if they are explicitly requested in the prompt or explicitly included in the call.

Additionally, the `ToolContext` class has now been marked as final and cannot be extended anymore. It was never supposed to be subclassed. You can add all the contextual data you need when instantiating a `ToolContext`, in the form of a `Map<String, Object>`. For more information, check the \[documentation\]([docs.spring.io/spring-ai/reference/api/tools.html#\_tool\_context](https://docs.spring.io/spring-ai/reference/api/tools.html#_tool_context)).

<a id="upgrading-to-1-0-0-m6"></a>

## Upgrading to 1.0.0-M6

<a id="_changes_to_usage_interface_and_defaultusage_implementation"></a>

### Changes to Usage Interface and DefaultUsage Implementation

The `Usage` interface and its default implementation `DefaultUsage` have undergone the following changes:

1. Method Rename:

   - `getGenerationTokens()` is now `getCompletionTokens()`
1. Type Changes:

   - All token count fields in `DefaultUsage` changed from `Long` to `Integer`:

     - `promptTokens`
     - `completionTokens` (formerly `generationTokens`)
     - `totalTokens`

<a id="_required_actions"></a>

#### Required Actions

- Replace all calls to `getGenerationTokens()` with `getCompletionTokens()`
- Update `DefaultUsage` constructor calls:

```
// Old (M5)
new DefaultUsage(Long promptTokens, Long generationTokens, Long totalTokens)

// New (M6)
new DefaultUsage(Integer promptTokens, Integer completionTokens, Integer totalTokens)
```

> [!NOTE]
> For more information on handling Usage, refer [here](api/usage-handling.md)

<a id="_json_serdeser_changes"></a>

#### JSON Ser/Deser changes

While M6 maintains backward compatibility for JSON deserialization of the `generationTokens` field, this field will be removed in M7. Any persisted JSON documents using the old field name should be updated to use `completionTokens`.

Example of the new JSON format:

```json
{
  "promptTokens": 100,
  "completionTokens": 50,
  "totalTokens": 150
}
```

<a id="_changes_to_usage_of_functioncallingoptions_for_tool_calling"></a>

### Changes to usage of FunctionCallingOptions for tool calling

Each `ChatModel` instance, at construction time, accepts an optional `ChatOptions` or `FunctionCallingOptions` instance
that can be used to configure default tools used for calling the model.

Before 1.0.0-M6:

- any tool passed via the `functions()` method of the default `FunctionCallingOptions` instance was included in
each call to the model from that `ChatModel` instance, possibly overwritten by runtime options.
- any tool passed via the `functionCallbacks()` method of the default `FunctionCallingOptions` instance was only
made available for runtime dynamic resolution (see [Tool Resolution](api/tools.md#_tool_resolution)), but never
included in any call to the model unless explicitly requested.

Starting 1.0.0-M6:

- any tool passed via the `functions()` method or the `functionCallbacks()` of the default `FunctionCallingOptions`
instance is now handled in the same way: it is included in each call to the model from that `ChatModel` instance,
possibly overwritten by runtime options. With that, there is consistency in the way tools are included in calls
to the model and prevents any confusion due to a difference in behavior between `functionCallbacks()` and all the other options.

If you want to make a tool available for runtime dynamic resolution and include it in a chat request to the model only
when explicitly requested, you can use one of the strategies described in [Tool Resolution](api/tools.md#_tool_resolution).

> [!NOTE]
> 1.0.0-M6 introduced new APIs for handling tool calling. Backward compatibility is maintained for the old APIs across
> all scenarios, except the one described above. The old APIs are still available, but they are deprecated
> and will be removed in 1.0.0-M7.

<a id="_removal_of_deprecated_amazon_bedrock_chat_models"></a>

### Removal of deprecated Amazon Bedrock chat models

Starting 1.0.0-M6, Spring AI transitioned to using Amazon Bedrock’s Converse API for all Chat conversation implementations in Spring AI.
All the Amazon Bedrock Chat models are removed except the Embedding models for Cohere and Titan.

> [!NOTE]
> Refer to [Bedrock Converse](api/chat/bedrock-converse.md) documentation for using the chat models.

<a id="_changes_to_use_spring_boot_3_4_2_for_dependency_management"></a>

### Changes to use Spring Boot 3.4.2 for dependency management

Spring AI updates to use Spring Boot 3.4.2 for the dependency management. You can refer [here](https://github.com/spring-projects/spring-boot/blob/v3.4.2/spring-boot-project/spring-boot-dependencies/build.gradle) for the dependencies managed by Spring Boot 3.4.2

<a id="_required_actions_2"></a>

#### Required Actions

- If you are upgrading to Spring Boot 3.4.2, please make sure to refer to [this](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.4-Release-Notes#upgrading-from-spring-boot-33) documentation for the changes required to configure the REST Client. Notably, if you don’t have an HTTP client library on the classpath, this will likely result in the use of `JdkClientHttpRequestFactory` where `SimpleClientHttpRequestFactory` would have been used previously. To switch to use `SimpleClientHttpRequestFactory`, you need to set `spring.http.client.factory=simple`.
- If you are using a different version of Spring Boot (say Spring Boot 3.3.x) and need a specific version of a dependency, you can override it in your build configuration.

<a id="_vector_store_api_changes"></a>

### Vector Store API changes

In version 1.0.0-M6, the `delete` method in the `VectorStore` interface has been modified to be a void operation instead of returning an `Optional<Boolean>`.
If your code previously checked the return value of the delete operation, you’ll need to remove this check.
The operation now throws an exception if the deletion fails, providing more direct error handling.

<a id="_before_1_0_0_m6"></a>

#### Before 1.0.0-M6:

```java
Optional<Boolean> result = vectorStore.delete(ids);
if (result.isPresent() && result.get()) {
    // handle successful deletion
}
```

<a id="_in_1_0_0_m6_and_later"></a>

#### In 1.0.0-M6 and later:

```java
vectorStore.delete(ids);
// deletion successful if no exception is thrown
```

<a id="_upgrading_to_1_0_0_m5"></a>

## Upgrading to 1.0.0.M5

- Vector Builders have been refactored for consistency.
- Current VectorStore implementation constructors have been deprecated, use the builder pattern.
- VectorStore implementation packages have been moved into unique package names, avoiding conflicts across artifact.  For example `org.springframework.ai.vectorstore` to `org.springframework.ai.pgvector.vectorstore`.

<a id="_upgrading_to_1_0_0_rc3"></a>

## Upgrading to 1.0.0.RC3

- The type of the portable chat options (`frequencyPenalty`, `presencePenalty`, `temperature`, `topP`) has been changed from `Float` to `Double`.

<a id="_upgrading_to_1_0_0_m2"></a>

## Upgrading to 1.0.0.M2

- The configuration prefix for the Chroma Vector Store has been changes from `spring.ai.vectorstore.chroma.store` to `spring.ai.vectorstore.chroma` in order to align with the naming conventions of other vector stores.
- The default value of the `initialize-schema` property on vector stores capable of initializing a schema is now set to `false`.
This implies that the applications now need to explicitly opt-in for schema initialization on supported vector stores, if the schema is expected to be created at application startup.
Not all vector stores support this property.
See the corresponding vector store documentation for more details.
The following are the vector stores that currently don’t support the `initialize-schema` property.

  1. Hana
  1. Pinecone
  1. Weaviate
- In Bedrock Jurassic 2, the chat options `countPenalty`, `frequencyPenalty`, and `presencePenalty`
have been renamed to `countPenaltyOptions`, `frequencyPenaltyOptions`, and `presencePenaltyOptions`.
Furthermore, the type of the chat option `stopSequences` have been changed from `String[]` to `List<String>`.
- In Azure OpenAI, the type of the chat options `frequencyPenalty` and `presencePenalty`
has been changed from `Double` to `Float`, consistently with all the other implementations.

<a id="_upgrading_to_1_0_0_m1"></a>

## Upgrading to 1.0.0.M1

On our march to release 1.0.0 M1 we have made several breaking changes.  Apologies, it is for the best!

<a id="_chatclient_changes"></a>

### ChatClient changes

A major change was made that took the 'old' `ChatClient` and moved the functionality into `ChatModel`.  The 'new' `ChatClient` now takes an instance of `ChatModel`. This was done to support a fluent API for creating and executing prompts in a style similar to other client classes in the Spring ecosystem, such as `RestClient`, `WebClient`, and `JdbcClient`.  Refer to the \[JavaDoc\]([docs.spring.io/spring-ai/docs/api](https://docs.spring.io/spring-ai/docs/api)) for more information on the Fluent API, proper reference documentation is coming shortly.

We renamed the 'old' `ModelClient` to `Model` and renamed implementing classes, for example `ImageClient` was renamed to `ImageModel`.  The `Model` implementation represents the portability layer that converts between the Spring AI API and the underlying AI Model API.

A new package `model` that contains interfaces and base classes to support creating AI Model Clients for any input/output data type combination. At the moment, the chat and image model packages implement this. We will be updating the embedding package to this new model soon.

A new "portable options" design pattern. We wanted to provide as much portability in the `ModelCall` as possible across different chat based AI Models. There is a common set of generation options and then those that are specific to a model provider. A sort of "duck typing" approach is used. `ModelOptions` in the model package is a marker interface indicating implementations of this class will provide the options for a model. See `ImageOptions`, a subinterface that defines portable options across all text→image `ImageModel` implementations. Then `StabilityAiImageOptions` and `OpenAiImageOptions` provide the options specific to each model provider. All options classes are created via a fluent API builder, all can be passed into the portable `ImageModel` API. These option data types are used in autoconfiguration/configuration properties for the `ImageModel` implementations.

<a id="_artifact_name_changes"></a>

### Artifact name changes

Renamed POM artifact names:
- spring-ai-qdrant → spring-ai-qdrant-store
- spring-ai-cassandra → spring-ai-cassandra-store
- spring-ai-pinecone → spring-ai-pinecone-store
- spring-ai-redis → spring-ai-redis-store
- spring-ai-qdrant → spring-ai-qdrant-store
- spring-ai-gemfire → spring-ai-gemfire-store
- spring-ai-azure-vector-store-spring-boot-starter → spring-ai-azure-store-spring-boot-starter
- spring-ai-redis-spring-boot-starter → spring-ai-starter-vector-store-redis

<a id="_upgrading_to_0_8_1"></a>

## Upgrading to 0.8.1

Former `spring-ai-vertex-ai` has been renamed to `spring-ai-vertex-ai-palm2` and `spring-ai-vertex-ai-spring-boot-starter` has been renamed to `spring-ai-vertex-ai-palm2-spring-boot-starter`.

So, you need to change the dependency from

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-vertex-ai</artifactId>
</dependency>
```

To

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-vertex-ai-palm2</artifactId>
</dependency>
```

and the related Boot starter for the Palm2 model has changed from

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-vertex-ai-spring-boot-starter</artifactId>
</dependency>
```

to

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-vertex-ai-palm2-spring-boot-starter</artifactId>
</dependency>
```

- Renamed Classes (01.03.2024)

  - VertexAiApi → VertexAiPalm2Api
  - VertexAiClientChat → VertexAiPalm2ChatClient
  - VertexAiEmbeddingClient → VertexAiPalm2EmbeddingClient
  - VertexAiChatOptions → VertexAiPalm2ChatOptions

<a id="_upgrading_to_0_8_0"></a>

## Upgrading to 0.8.0

<a id="_january_24_2024_update"></a>

### January 24, 2024 Update

- Moving the `prompt` and `messages` and `metadata` packages to subpackages of `org.springframework.ai.chat`
- New functionality is **text to image** clients. Classes are `OpenAiImageModel` and `StabilityAiImageModel`. See the integration tests for usage, docs are coming soon.
- A new package `model` that contains interfaces and base classes to support creating AI Model Clients for any input/output data type combination. At the moment, the chat and image model packages implement this. We will be updating the embedding package to this new model soon.
- A new "portable options" design pattern. We wanted to provide as much portability in the `ModelCall` as possible across different chat based AI Models. There is a common set of generation options and then those that are specific to a model provider. A sort of "duck typing" approach is used. `ModelOptions` in the model package is a marker interface indicating implementations of this class will provide the options for a model. See `ImageOptions`, a subinterface that defines portable options across all text→image `ImageModel` implementations. Then `StabilityAiImageOptions` and `OpenAiImageOptions` provide the options specific to each model provider. All options classes are created via a fluent API builder, all can be passed into the portable `ImageModel` API. These option data types are used in autoconfiguration/configuration properties for the `ImageModel` implementations.

<a id="_january_13_2024_update"></a>

### January 13, 2024 Update

The following OpenAi Autoconfiguration chat properties have changed

- from `spring.ai.openai.model` to `spring.ai.openai.chat.options.model`.
- from `spring.ai.openai.temperature` to `spring.ai.openai.chat.options.temperature`.

Find updated documentation about the OpenAi properties: [docs.spring.io/spring-ai/reference/api/chat/openai-chat.html](https://docs.spring.io/spring-ai/reference/api/chat/openai-chat.html)

<a id="_december_27_2023_update"></a>

### December 27, 2023 Update

Merge SimplePersistentVectorStore and InMemoryVectorStore into SimpleVectorStore
\* Replace InMemoryVectorStore with SimpleVectorStore

<a id="_december_20_2023_update"></a>

### December 20, 2023 Update

Refactor the Ollama client and related classes and package names

- Replace the org.springframework.ai.ollama.client.OllamaClient by org.springframework.ai.ollama.OllamaModelCall.
- The OllamaChatClient method signatures have changed.
- Rename the org.springframework.ai.autoconfigure.ollama.OllamaProperties into org.springframework.ai.model.ollama.autoconfigure.OllamaChatProperties and change the suffix to: `spring.ai.ollama.chat`. Some of the properties have changed as well.

<a id="_december_19_2023_update"></a>

### December 19, 2023 Update

Renaming of AiClient and related classes and package names

- Rename AiClient to ChatClient
- Rename AiResponse to ChatResponse
- Rename AiStreamClient to StreamingChatClient
- Rename package org.sf.ai.client to org.sf.ai.chat

Rename artifact ID of

- `transformers-embedding` to `spring-ai-transformers`

Moved Maven modules from top-level directory and `embedding-clients` subdirectory to all be under a single `models` directory.

<a id="_december_1_2023"></a>

### December 1, 2023

We are transitioning the project’s Group ID:

- **FROM**: `org.springframework.experimental.ai`
- **TO**: `org.springframework.ai`

Artifacts will still be hosted in the snapshot repository as shown below.

The main branch will move to the version `0.8.0-SNAPSHOT`.
It will be unstable for a week or two.
Please use the 0.7.1-SNAPSHOT if you don’t want to be on the bleeding edge.

You can access `0.7.1-SNAPSHOT` artifacts as before and still access [0.7.1-SNAPSHOT Documentation](https://markpollack.github.io/spring-ai-0.7.1/).

<a id="_0_7_1_snapshot_dependencies"></a>

### 0.7.1-SNAPSHOT Dependencies

- Azure OpenAI

  ```xml
  <dependency>
      <groupId>org.springframework.experimental.ai</groupId>
      <artifactId>spring-ai-azure-openai-spring-boot-starter</artifactId>
      <version>0.7.1-SNAPSHOT</version>
  </dependency>
  ```
- OpenAI

  ```xml
  <dependency>
      <groupId>org.springframework.experimental.ai</groupId>
      <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
      <version>0.7.1-SNAPSHOT</version>
  </dependency>
  ```
