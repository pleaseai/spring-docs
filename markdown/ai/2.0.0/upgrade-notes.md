---
title: "Upgrade Notes"
source: "ROOT:upgrade-notes.adoc"
---

<a id="upgrade-notes"></a>

# Upgrade Notes

<a id="upgrading-to-2-0-0"></a>

## Upgrading to 2.0.0

This section covers all breaking changes and migration steps when upgrading from Spring AI 1.1.x to 2.0.0.

<a id="_advisors"></a>

### Advisors

<a id="_spring_ai_advisors_vector_store_renamed_to_spring_ai_vector_store_advisor"></a>

#### `spring-ai-advisors-vector-store` renamed to `spring-ai-vector-store-advisor`

The `spring-ai-advisors-vector-store` module has been renamed to `spring-ai-vector-store-advisor` to better align with the naming conventions of other Spring AI modules.

<a id="_toolsearchtoolcallingadvisor_moved_to_spring_ai_tool_search_advisor"></a>

#### `ToolSearchToolCallingAdvisor` moved to `spring-ai-tool-search-advisor`

The `ToolSearchToolCallingAdvisor` class has been moved to a dedicated module and package:

- **Artifact:** `spring-ai-tool-search-advisor` (previously bundled in `spring-ai-tool-search-tool`)
- **Package:** `org.springframework.ai.chat.client.advisor.toolsearch` (previously `org.springframework.ai.tool.toolsearch.advisor`)

Update your dependency and import statements accordingly:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-tool-search-advisor</artifactId>
</dependency>
```

<a id="_new_toolsearchtoolcallingadvisor_auto_configuration_and_starter"></a>

#### New: `ToolSearchToolCallingAdvisor` Auto-Configuration and Starter

A Spring Boot auto-configuration (`spring-ai-autoconfigure-tool-search-advisor`) and matching starter (`spring-ai-starter-tool-search-advisor`) are now available.
When enabled, `ToolSearchToolCallingAdvisor` replaces the default `ToolCallingAdvisor` in the auto-configured `ChatClient`, limiting the tool definitions sent to the LLM per call to only the most relevant ones (via keyword or semantic search).

Opt in by adding the starter and setting the property:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-tool-search-advisor</artifactId>
</dependency>
```

```properties
spring.ai.chat.client.tool-search-advisor.enabled=true

# Choose the index type: regex (default), lucene, or vector
spring.ai.chat.client.tool-search-advisor.tool-index-type=regex
```

The `regex` index requires no additional dependencies.
The `lucene` index requires `org.apache.lucene:lucene-core` on the classpath.
The `vector` index requires a `VectorStore` bean (`spring-ai-vector-store` on the classpath).

<a id="_changed_advisor_default_chat_memory_precedence_order_default_value"></a>

#### Changed: `Advisor.DEFAULT_CHAT_MEMORY_PRECEDENCE_ORDER` default value

`Advisor.DEFAULT_CHAT_MEMORY_PRECEDENCE_ORDER` changed from `Ordered.HIGHEST_PRECEDENCE + 1000` to `Ordered.HIGHEST_PRECEDENCE + 200`, placing memory advisors at their default order *outside* the `ToolCallingAdvisor` (`HIGHEST_PRECEDENCE + 300`).

The `ToolCallingAdvisor` now manages conversation history internally across tool-call iterations by default. The memory advisor only stores the final user/assistant exchange, never writing tool-call messages to the `ChatMemoryRepository`. This is the correct default because most repository implementations do not support those message types.

If you need memory *inside* the loop (e.g. with `InMemoryChatMemoryRepository`), explicitly set the advisor order above `ToolCallingAdvisor.DEFAULT_ORDER` and call `.disableInternalConversationHistory()`:

```java
var toolCallingAdvisor = ToolCallingAdvisor.builder()
    .disableInternalConversationHistory()
    .build();
var chatMemoryAdvisor = MessageChatMemoryAdvisor.builder(chatMemory)
    .advisorOrder(Ordered.HIGHEST_PRECEDENCE + 400)
    .build();
```

> [!TIP]
> The [spring-ai-session](https://github.com/spring-ai-community/spring-ai-session) community project provides a session-aware memory implementation that fully supports tool-call messages and can be safely used inside the tool-call loop with any backend. It is planned to replace `ChatMemory` in Spring AI 2.1. See the [spring-ai-session documentation](https://spring-ai-community.github.io/spring-ai-session/latest-snapshot/) for details.

<a id="_tool_calling"></a>

### Tool Calling

<a id="_removed_internaltoolexecutionenabled_from_toolcallingchatoptions"></a>

#### Removed: `internalToolExecutionEnabled` from `ToolCallingChatOptions`

The `internalToolExecutionEnabled` option has been removed from `ToolCallingChatOptions` and all provider-specific `ChatOptions` classes (e.g. `OpenAiChatOptions`, `AnthropicChatOptions`). The corresponding Spring Boot configuration property `spring.ai.<provider>.chat.internal-tool-execution-enabled` has also been removed.

<a id="_impact"></a>

##### Impact

Code that sets `.internalToolExecutionEnabled(false)` to opt into user-controlled tool execution will no longer compile.
Code that sets `.internalToolExecutionEnabled(true)` (explicitly enabling the internal loop) will no longer compile, and the behaviour it implied no longer exists — per-model internal tool execution has been removed from all `ChatModel` implementations.

<a id="_migration"></a>

##### Migration

Remove all calls to `.internalToolExecutionEnabled(…​)`. The recommended approaches are:

- **`ToolCallingAdvisor` via `ChatClient`** (recommended) — auto-registered when tools are present; no flag needed.
- **User-controlled loop via `ChatModel` directly** — simply invoke `ChatModel` without `ToolCallingAdvisor`. Tool calls will not be executed automatically; check `chatResponse.hasToolCalls()` yourself and drive the loop with `ToolCallingManager`.

```java
// Before
ChatOptions options = ToolCallingChatOptions.builder()
    .toolCallbacks(ToolCallbacks.from(new MyTools()))
    .internalToolExecutionEnabled(false)   // <-- remove this line
    .build();

// After
ChatOptions options = ToolCallingChatOptions.builder()
    .toolCallbacks(ToolCallbacks.from(new MyTools()))
    .build();
```

<a id="_removed_toolexecutioneligibilitypredicate_and_defaulttoolexecutioneligibilitypredicate"></a>

#### Removed: `ToolExecutionEligibilityPredicate` and `DefaultToolExecutionEligibilityPredicate`

`ToolExecutionEligibilityPredicate` (previously deprecated since 2.0.0) and its default implementation `DefaultToolExecutionEligibilityPredicate` have been removed. These interfaces combined an options-based policy check (`internalToolExecutionEnabled`) with a response check (`hasToolCalls()`). Since the options-based flag is gone, there is no replacement at the `ChatModel` level.

<a id="_migration_2"></a>

##### Migration

If you implemented `ToolExecutionEligibilityPredicate` to customize when tool execution fires, migrate to `ToolExecutionEligibilityChecker` (see below) and supply it to `ToolCallingAdvisor`.

<a id="_new_toolexecutioneligibilitychecker_in_toolcallingadvisor"></a>

#### New: `ToolExecutionEligibilityChecker` in `ToolCallingAdvisor`

`ToolExecutionEligibilityChecker` (`Function<ChatResponse, Boolean>`) can now be set on `ToolCallingAdvisor.Builder` to customize when the tool-call loop iterates. The default is `chatResponse → chatResponse != null && chatResponse.hasToolCalls()`.

This is the extension point for provider-specific stop-reason logic (e.g. checking a finish reason in addition to tool-call presence):

```java
ToolCallingAdvisor advisor = ToolCallingAdvisor.builder()
    .toolExecutionEligibilityChecker(response ->
        response != null && response.hasToolCalls()
            && !"stop".equals(response.getResult().getMetadata().getFinishReason()))
    .build();
```

Spring Boot users can provide a `ToolExecutionEligibilityChecker` bean; it will be picked up automatically by the auto-configured `ToolCallingAdvisor.Builder`:

```java
@Bean
ToolExecutionEligibilityChecker myChecker() {
    return response -> response != null && response.hasToolCalls();
}
```

<a id="_new_spring_ai_chat_client_tool_calling_enabled_property"></a>

#### New: `spring.ai.chat.client.tool-calling.enabled` Property

A new `spring.ai.chat.client.tool-calling.enabled` property (default `true`) controls whether the `ToolCallingAdvisor` is auto-registered by the auto-configured `ChatClient`.
Set it to `false` to disable automatic tool execution for all calls — tools are still sent to the AI model as definitions, but tool call responses are not executed automatically.

```properties
spring.ai.chat.client.tool-calling.enabled=false
```

This is a global alternative to using `AdvisorParams.toolCallingAdvisorAutoRegister(false)` on every individual call.

<a id="_removed_streamtoolcallresponses_from_advisor_builders_and_auto_configuration"></a>

#### Removed: `streamToolCallResponses` from Advisor Builders and Auto-Configuration

The `streamToolCallResponses` option has been removed from `ToolCallingAdvisor.Builder`, `ToolCallAdvisor.Builder`, and `ToolSearchToolCallingAdvisor.Builder`, as well as from their corresponding Spring Boot auto-configuration properties:

- `spring.ai.chat.client.tool-calling.stream-tool-call-responses`
- `spring.ai.chat.client.tool-search-advisor.stream-tool-call-responses`

<a id="_why"></a>

##### Why

When `streamToolCallResponses=true`, intermediate tool-call request chunks were streamed downstream but the paired `ToolResponseMessage` (sent back to the LLM) was not.
Any downstream memory advisor that recorded those chunks would receive a tool-call request without the corresponding tool response, producing a corrupted conversation history.
The design flaw cannot be fixed without introducing a breaking change to `ChatClientResponse`, so the option has been removed entirely.

<a id="_impact_2"></a>

##### Impact

- Any code that calls `.streamToolCallResponses(true)` or `.streamToolCallResponses(false)` on an advisor builder will fail to compile.
- Any `application.properties` or `application.yml` entry for the removed properties is silently ignored.

<a id="_migration_3"></a>

##### Migration

Remove all calls to `.streamToolCallResponses(…​)` from your builder chains:

```java
// Before
var advisor = ToolCallingAdvisor.builder()
    .streamToolCallResponses(true)   // <-- remove this line
    .build();

// After
var advisor = ToolCallingAdvisor.builder().build();
```

To gain visibility into each iteration of the tool-calling loop — the use case that `streamToolCallResponses=true` was intended to address — opt out of the auto-registered advisor and drive the loop manually using `AdvisorParams.toolCallingAdvisorAutoRegister(false)`:

```java
ToolCallingManager toolCallingManager = ToolCallingManager.builder().build();
ToolCallback[] tools = ToolCallbacks.from(new WeatherTools());
ChatOptions chatOptions = ToolCallingChatOptions.builder()
    .toolCallbacks(tools)
    .build();

String question = "What is the weather in Amsterdam and Paris?";
Prompt prompt = new Prompt(List.of(new UserMessage(question)), chatOptions);

ChatClientResponse response = chatClient.prompt()
    .user(question)
    .options(chatOptions)
    .advisors(AdvisorParams.toolCallingAdvisorAutoRegister(false))
    .call()
    .chatClientResponse();

while (response.chatResponse() != null && response.chatResponse().hasToolCalls()) {
    // inspect or forward the tool-call chunk here before executing
    ToolExecutionResult result = toolCallingManager.executeToolCalls(prompt, response.chatResponse());
    prompt = new Prompt(result.conversationHistory(), chatOptions);
    response = chatClient.prompt()
        .messages(result.conversationHistory())
        .options(chatOptions)
        .advisors(AdvisorParams.toolCallingAdvisorAutoRegister(false))
        .call()
        .chatClientResponse();
}
// forward or process the final answer here
```

For a complete example including the streaming path, see [User-Controlled Tool Execution — With ChatClient](api/tools.md#_user_controlled_tool_execution).

<a id="_jdbc_chat_memory_sequence_id_column"></a>

### JDBC Chat Memory `sequence_id` Column

The `JdbcChatMemoryRepository` schema adds a `sequence_id BIGINT` column that determines message ordering within a conversation. Previously, ordering relied on the `timestamp` column, but `TIMESTAMP` precision differs across databases — on MySQL and MariaDB the default precision is one second, so messages saved within the same second were returned in a non-deterministic order. A dedicated integer sequence orders identically across every supported database.

The `timestamp` column is retained. It now stores the message creation time and is exposed in the message metadata under the `JdbcChatMemoryRepository.CONVERSATION_TS` key (a `java.time.Instant`), so applications can display when a message was created. The timestamp is preserved across saves: re-saving a conversation keeps each existing message’s original creation time.

<a id="_impact_3"></a>

#### Impact

- The `SPRING_AI_CHAT_MEMORY` table gains a `sequence_id` column (`BIGINT`, or `NUMBER(19)` on Oracle and `INTEGER` on SQLite) and a `SPRING_AI_CHAT_MEMORY_CONVERSATION_ID_SEQUENCE_ID_IDX` index. The `timestamp` column and its index are unchanged.
- Existing tables created by Spring AI 1.x require the new column before they will work, since messages are now ordered by `sequence_id`.
- Messages read from the repository now carry their creation timestamp in metadata. Because the metadata differs, a retrieved message is no longer equal (`Message.equals`) to an otherwise-identical message constructed in code. Code that compares messages by value, or relies on message identity in sets or maps, should account for this.

<a id="_migration_4"></a>

#### Migration

The change is additive: add the new column and backfill it from the existing per-conversation order. No data is lost and the `timestamp` column is untouched. For PostgreSQL:

```sql
ALTER TABLE SPRING_AI_CHAT_MEMORY ADD COLUMN sequence_id BIGINT;

WITH ordered AS (
    SELECT ctid, ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY "timestamp") - 1 AS seq
    FROM SPRING_AI_CHAT_MEMORY
)
UPDATE SPRING_AI_CHAT_MEMORY t
SET sequence_id = o.seq
FROM ordered o
WHERE t.ctid = o.ctid;

ALTER TABLE SPRING_AI_CHAT_MEMORY ALTER COLUMN sequence_id SET NOT NULL;

CREATE INDEX SPRING_AI_CHAT_MEMORY_CONVERSATION_ID_SEQUENCE_ID_IDX
ON SPRING_AI_CHAT_MEMORY(conversation_id, sequence_id);
```

Adapt the identifier quoting and the row-identity expression (`ctid` above) to your database. The `ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY <timestamp>)` pattern reproduces the existing per-conversation order on every supported engine. Alternatively, since chat memory holds recent conversation context rather than permanent history, you can drop and recreate the table from the updated `schema-<platform>.sql` script.

<a id="_options_immutability_and_default_values"></a>

### Options Immutability and Default Values

<a id="_strict_immutability_for_options"></a>

#### Strict Immutability for Options

Options classes (like `ChatOptions`, `EmbeddingOptions`, etc.) are now strictly immutable.
Collections within options (like `toolCallbacks`, `stopSequences`, `customHeaders`) are now stored as unmodifiable collections.
Additionally, nullable collections are now used instead of empty ones to better represent the absence of a value.

<a id="_impact_4"></a>

##### Impact

- `ChatOptions#copy()` and `*Options#fromOptions(*Options)` methods have been removed because options are now strictly immutable.
- Modifying collections returned by options getters will throw an `UnsupportedOperationException`.

<a id="_migration_5"></a>

##### Migration

To create a modified copy of an options instance, use the `mutate()` method instead of `copy()` or `fromOptions()`:

```java
// Before
OllamaChatOptions options = originalOptions.copy();
options.setFoo("...");

// After
OllamaChatOptions options = originalOptions.mutate()
        .foo("...")
        .build();
```

<a id="_default_values_moved_to_options_constructors"></a>

#### Default Values Moved to Options Constructors

Default values for options (like default model names, temperatures, etc.) have been moved from the `Model` implementations and `*Properties` configuration classes to the options constructors themselves.
Default configuration properties in `*Properties` classes have been removed as they are no longer needed and should be consistent with the options-level defaults.

<a id="_impact_5"></a>

##### Impact

- `ChatModel#getDefaultOptions()` is deprecated in favor of `ChatModel#getOptions()`.
- Default values are no longer duplicated in `*Properties` classes.

<a id="_migration_6"></a>

##### Migration

Use `getOptions()` instead of `getDefaultOptions()` when retrieving the default options for a model:

```java
// Before
ChatOptions options = chatModel.getDefaultOptions();

// After
ChatOptions options = chatModel.getOptions();
```

<a id="_configuration_properties_flattening"></a>

#### Configuration Properties Flattening

Building on the chat configuration changes described above, the configuration properties for all other models (Embedding, Image, Audio, Moderation, OCR, etc.) no longer use the `.options` prefix.
For example, the former `spring.ai.openai.embedding.options.model` is now `spring.ai.openai.embedding.model`.
Deprecated configuration properties are provided for the `.options` variants to ensure a smoother migration experience.

<a id="_impact_6"></a>

##### Impact

- The `getOptions()` method in `*Properties` classes is deprecated.
- The nested `Options` classes within `*Properties` are deprecated.
- The `toOptions()` method has been moved from the nested `Options` class to the root `*Properties` class.

<a id="_migration_7"></a>

##### Migration

Update your `application.properties` or `application.yml` to remove the `.options` segment from the property keys.

```properties
# Before
spring.ai.openai.embedding.options.model=text-embedding-3-small

# After
spring.ai.openai.embedding.model=text-embedding-3-small
```

In Java code, use the root properties class directly to access options or call `toOptions()`:

```java
// Before
String model = properties.getOptions().getModel();
OpenAiEmbeddingOptions options = properties.getOptions().toOptions();

// After
String model = properties.getModel();
OpenAiEmbeddingOptions options = properties.toOptions();
```

<a id="_renamed_n_to_n_in_options_builders"></a>

#### Renamed `N()` to `n()` in Options Builders

The `N()` builder method in various `*Options` and configuration properties classes has been renamed to `n()` to align with Java naming conventions.

<a id="_impact_7"></a>

##### Impact

- Any Java code calling `.N(value)` on these builders will fail to compile.

<a id="_migration_8"></a>

##### Migration

Update your code to call `.n(value)` instead.

```java
// Before
OpenAiChatOptions.builder().N(1).build();

// After
OpenAiChatOptions.builder().n(1).build();
```

<a id="_ollama"></a>

### Ollama

<a id="_renamed_spring_ai_ollama_chat_think_option_to_spring_ai_ollama_chat_think"></a>

#### Renamed: `spring.ai.ollama.chat.think-option` to `spring.ai.ollama.chat.think`

The `spring.ai.ollama.chat.think-option` configuration property has been renamed to `spring.ai.ollama.chat.think`.

Update your `application.properties` or `application.yml` accordingly:

```properties
# Before
spring.ai.ollama.chat.think-option=true

# After
spring.ai.ollama.chat.think=true
```

<a id="_minimax_dedicated_support_superseded_by_anthropic_support"></a>

### Minimax dedicated support superseded by Anthropic support

Minimax dedicated support has been removed in favor of using Anthropic support as recommended by [Minimax themselves](https://platform.minimax.io/docs/api-reference/text-anthropic-api).
Please use the Spring AI Anthropic support instead, configuring it with the `https://api.minimax.io/anthropic` base URL and MiniMax models.
Embeddings are no longer supported.

<a id="_json_utilities_refactoring"></a>

### JSON Utilities Refactoring

<a id="_new_jsonhelper_and_updated_jacksonutils"></a>

#### New: `JsonHelper` and Updated `JacksonUtils`

A new `JsonHelper` class has been introduced in `spring-ai-commons` as the canonical way to perform JSON serialization and deserialization.
It is instantiable and accepts a custom `JsonMapper`, making it straightforward to customize JSON behavior per use case.
`JacksonUtils` gains a new `getDefaultJsonMapper()` static method that returns a shared, pre-configured `JsonMapper` instance.

`JsonHelper` centralizes JSON operations previously spread across `JsonParser`, `ModelOptionsUtils`, and `McpJsonParser`.
The default constructor uses the shared mapper from `JacksonUtils.getDefaultJsonMapper()`.
Inject a custom `JsonMapper` if you need different serialization settings:

```java
// Default — uses the shared JsonMapper from JacksonUtils
JsonHelper jsonHelper = new JsonHelper();

// Custom — supply your own JsonMapper
JsonMapper myMapper = JsonMapper.builder()
    .addModule(new JavaTimeModule())
    .build();
JsonHelper customHelper = new JsonHelper(myMapper);
```

<a id="_deprecated_jsonparser"></a>

#### Deprecated: `JsonParser`

`JsonParser` (in `org.springframework.ai.util.json`) is deprecated for removal. All methods now delegate to `JsonHelper`.

<a id="_impact_8"></a>

##### Impact

Code that calls `JsonParser` methods will see deprecation warnings at compile time.

<a id="_migration_9"></a>

##### Migration

| Before | After |
| --- | --- |
| `JsonParser.getJsonMapper()` | `JacksonUtils.getDefaultJsonMapper()` |
| `JsonParser.fromJson(json, MyType.class)` | `jsonHelper.fromJson(json, MyType.class)` |
| `JsonParser.fromJson(json, type)` | `jsonHelper.fromJson(json, type)` |
| `JsonParser.toJson(object)` | `jsonHelper.toJson(object)` |
| `JsonParser.toTypedObject(value, type)` | `jsonHelper.convertToTypedObject(value, type)` |

<a id="_removed_json_methods_from_modeloptionsutils"></a>

#### Removed: JSON Methods from `ModelOptionsUtils`

The following members of `ModelOptionsUtils` have been removed, since model options no longer depend on Jackson directly.

| Removed member | Replacement |
| --- | --- |
| `ModelOptionsUtils.JSON_MAPPER` | `JacksonUtils.getDefaultJsonMapper()` |
| `ModelOptionsUtils.jsonToMap(String)` | `jsonHelper.fromJsonToMap(json)` |
| `ModelOptionsUtils.jsonToObject(String, Class<T>)` | `jsonHelper.fromJson(json, type)` |
| `ModelOptionsUtils.toJsonString(Object)` | `jsonHelper.toJson(object)` |
| `ModelOptionsUtils.toJsonStringPrettyPrinter(Object)` | `JacksonUtils.getDefaultJsonMapper().writerWithDefaultPrettyPrinter().writeValueAsString(object)` |
| `ModelOptionsUtils.getJsonSchema(Type, boolean)` | `JsonSchemaUtils.getJsonSchema(type, toUpperCase)` |
| `ModelOptionsUtils.getJsonSchema(Type)` | `JsonSchemaUtils.getJsonSchema(type)` |
| `ModelOptionsUtils.toUpperCaseTypeValues(ObjectNode)` | `JsonSchemaUtils.toUpperCaseTypeValues(node)` |

<a id="_impact_9"></a>

##### Impact

Code that references the removed fields or methods will fail to compile.

<a id="_migration_10"></a>

##### Migration

```java
// Before
import org.springframework.ai.model.ModelOptionsUtils;

Map<String, Object> map = ModelOptionsUtils.jsonToMap(jsonString);
String json = ModelOptionsUtils.toJsonString(myObject);
JsonMapper mapper = ModelOptionsUtils.JSON_MAPPER;

// After
import org.springframework.ai.util.JsonHelper;
import org.springframework.ai.util.JacksonUtils;

private static final JsonHelper jsonHelper = new JsonHelper();

Map<String, Object> map = jsonHelper.fromJsonToMap(jsonString);
String json = jsonHelper.toJson(myObject);
JsonMapper mapper = JacksonUtils.getDefaultJsonMapper();
```

<a id="_removed_mcpjsonparser"></a>

#### Removed: `McpJsonParser`

`McpJsonParser` (in `org.springframework.ai.mcp.annotation.method.tool.utils`) has been deleted.
Its functionality is now covered by `JsonHelper`.

<a id="_migration_11"></a>

##### Migration

| Before | After |
| --- | --- |
| `McpJsonParser.toMap(object)` | `jsonHelper.convertToMap(object)` |
| `McpJsonParser.fromMap(map, MyType.class)` | `jsonHelper.convertFromMap(map, MyType.class)` |
| `McpJsonParser.fromMap(map, typeReference)` | `jsonHelper.convertFromMap(map, parameterizedTypeReference)` |

<a id="_mcp_elicitation_api_typereference_replaced_by_parameterizedtypereference"></a>

### MCP Elicitation API: `TypeReference` Replaced by `ParameterizedTypeReference`

The `elicit(…​)` overloads that previously accepted `tools.jackson.core.type.TypeReference<T>` in `McpAsyncRequestContext` and `McpSyncRequestContext` now accept `org.springframework.core.ParameterizedTypeReference<T>`.

<a id="_impact_10"></a>

#### Impact

Any code that calls these methods with a Jackson `TypeReference` will fail to compile.

Affected method signatures:

- `McpAsyncRequestContext.elicit(TypeReference<T>)`
- `McpAsyncRequestContext.elicit(Consumer<ElicitationSpec>, TypeReference<T>)`
- `McpSyncRequestContext.elicit(TypeReference<T>)`
- `McpSyncRequestContext.elicit(Consumer<ElicitationSpec>, TypeReference<T>)`

<a id="_migration_12"></a>

#### Migration

Replace the Jackson `TypeReference` anonymous class with a Spring `ParameterizedTypeReference` anonymous class:

```java
// Before
import tools.jackson.core.type.TypeReference;

Mono<StructuredElicitResult<Map<String, Object>>> result =
    context.elicit(e -> e.message("Please fill in the form"),
        new TypeReference<Map<String, Object>>() {});

// After
import org.springframework.core.ParameterizedTypeReference;

Mono<StructuredElicitResult<Map<String, Object>>> result =
    context.elicit(e -> e.message("Please fill in the form"),
        new ParameterizedTypeReference<Map<String, Object>>() {});
```

The same change applies to `McpSyncRequestContext`:

```java
// Before
StructuredElicitResult<Person> result =
    context.elicit(e -> e.message("Provide your details"),
        new TypeReference<Person>() {});

// After
StructuredElicitResult<Person> result =
    context.elicit(e -> e.message("Provide your details"),
        new ParameterizedTypeReference<Person>() {});
```

<a id="_google_genai_embedding_googlegenaiembeddingconnectiondetails_package_change"></a>

### Google GenAI Embedding: `GoogleGenAiEmbeddingConnectionDetails` Package Change

`GoogleGenAiEmbeddingConnectionDetails` has been moved from `org.springframework.ai.google.genai`
to `org.springframework.ai.google.genai.embedding`.

<a id="_impact_11"></a>

#### Impact

Any code that directly imports `GoogleGenAiEmbeddingConnectionDetails` will fail to compile.

<a id="_migration_13"></a>

#### Migration

Update the import statement:

```java
// Before
import org.springframework.ai.google.genai.GoogleGenAiEmbeddingConnectionDetails;

// After
import org.springframework.ai.google.genai.embedding.GoogleGenAiEmbeddingConnectionDetails;
```

<a id="_chatclient_tool_calling"></a>

### ChatClient Tool Calling

<a id="_automatic_toolcallingadvisor_registration"></a>

#### Automatic `ToolCallingAdvisor` Registration

`ChatClient` now always auto-registers a `ToolCallingAdvisor` in the advisor chain (unless explicitly disabled), so tool calls requested by the model are handled automatically regardless of whether tools were configured statically or injected by another advisor at runtime.

<a id="_impact_12"></a>

##### Impact

Existing code that already adds a `ToolCallingAdvisor` explicitly will have the advisor present in the chain twice — once from the explicit add and once from auto-registration.

<a id="_migration_14"></a>

##### Migration

Remove the explicit `ToolCallingAdvisor` from the chain and let auto-registration handle it. If you need a custom configuration, either supply a pre-configured `ToolCallingAdvisor.Builder` at `ChatClient` construction time (see the [Customizing the Default ToolCallingAdvisor](api/chatclient.md#_customizing_the_default_toolcallingadvisor) section), or disable auto-registration and register the advisor manually:

```java
// Before — manual registration
chatClient.prompt("What's the weather?")
    .tools(weatherTool)
    .advisors(ToolCallingAdvisor.builder().build())
    .call().content();

// After — auto-registration handles it; no explicit advisor needed
chatClient.prompt("What's the weather?")
    .tools(weatherTool)
    .call().content();

// Or, to keep full control, disable auto-registration explicitly
chatClient.prompt("What's the weather?")
    .tools(weatherTool)
    .advisors(
        AdvisorParams.toolCallingAdvisorAutoRegister(false),
        ToolCallingAdvisor.builder().build()
    )
    .call().content();
```

<a id="_new_tooladvisor_marker_interface"></a>

#### New: `ToolAdvisor` Marker Interface

A `ToolAdvisor` marker interface has been added. `ToolCallingAdvisor` implements it. `DefaultChatClient` checks for this marker to decide whether to auto-register a `ToolCallingAdvisor` — if any advisor in the chain already implements `ToolAdvisor`, auto-registration is skipped.

Custom advisors that own the tool-call lifecycle should implement `ToolAdvisor` to prevent a duplicate `ToolCallingAdvisor` from being added automatically.

<a id="_new_memoryadvisor_marker_interface"></a>

#### New: `MemoryAdvisor` Marker Interface

A `MemoryAdvisor` marker interface has been added. `BaseChatMemoryAdvisor` now extends it. `DefaultChatClient` uses this marker to detect downstream memory advisors and disable the `ToolCallingAdvisor’s internal conversation history when one is present.

Custom memory advisors that do not extend `BaseChatMemoryAdvisor` but should integrate with the tool-call auto-registration logic should implement `MemoryAdvisor`.

<a id="_new_chatclient_builder_overload_for_custom_toolcallingadvisor_configuration"></a>

#### New: `ChatClient.builder()` Overload for Custom `ToolCallingAdvisor` Configuration

A new 5-argument `ChatClient.builder()` static method and a matching `DefaultChatClientBuilder` constructor accept a `ToolCallingAdvisor.Builder<?>` to configure the advisor used during auto-registration:

```java
ChatClient chatClient = ChatClient
    .builder(chatModel, observationRegistry, null, null,
            ToolCallingAdvisor.builder().toolCallingManager(myToolCallingManager))
    .build();
```

Spring Boot users should prefer one of the following instead:

- Set `spring.ai.chat.client.tool-calling.advisor-order` to control the advisor’s position in the chain.
- Declare a `ToolCallingAdvisor.Builder<?>` bean to fully replace the auto-configured builder (suppressed via `@ConditionalOnMissingBean`).

<a id="_removed_toolspec_consumer_api_on_chatclient"></a>

#### Removed: `ToolSpec` Consumer API on `ChatClient`

The `tools(Consumer<ToolSpec>)` / `defaultTools(Consumer<ToolSpec>)` API and the `ChatClient.ToolSpec` interface have been removed. The `tools(Object…​)` / `defaultTools(Object…​)` methods now directly accept `ToolCallback`, `ToolCallbackProvider`, `@Tool`-annotated POJO instances, and collections or arrays of any of these types. Context is set separately via the dedicated `toolContext()` / `defaultToolContext()` methods.

<a id="_migration_15"></a>

##### Migration

```java
// Before
chatClient.prompt()
    .tools(t -> t.callbacks(myCallback).context("tenantId", "acme"))
    .call().content();

// After
chatClient.prompt()
    .tools(myCallback)
    .toolContext(Map.of("tenantId", "acme"))
    .call().content();
```

The individual `toolCallbacks()` methods on `ChatClientRequestSpec` and `defaultToolCallbacks()` on `ChatClient.Builder` are deprecated in favour of `tools(Object…​)` / `defaultTools(Object…​)`.

<a id="_changed_methodtoolcallbackprovider_throws_illegalargumentexception_instead_of_illegalstateexception"></a>

#### Changed: `MethodToolCallbackProvider` throws `IllegalArgumentException` instead of `IllegalStateException`

`MethodToolCallbackProvider` now throws `IllegalArgumentException` (instead of `IllegalStateException`) in two cases:

- When a tool object has no `@Tool`-annotated methods.
- When multiple tool objects produce callbacks with duplicate names.

<a id="_impact_13"></a>

##### Impact

Code that catches `IllegalStateException` from `MethodToolCallbackProvider` (directly or via `ToolCallbacks.from()`) must be updated.

```java
// Before
try {
    ToolCallbacks.from(myObject);
}
catch (IllegalStateException e) { ... }

// After
try {
    ToolCallbacks.from(myObject);
}
catch (IllegalArgumentException e) { ... }
```

<a id="_removed_spring_bean_tool_resolution_springbeantoolcallbackresolver"></a>

#### Removed: Spring Bean Tool Resolution (`SpringBeanToolCallbackResolver`)

`SpringBeanToolCallbackResolver` and the pattern of declaring bare `Function` / `Supplier` / `Consumer` beans and referencing them by name via `toolNames()` have been removed. The `toolNames()` method has been removed from all chat options classes and from `ChatClient`.

<a id="_migration_16"></a>

##### Migration

Declare `ToolCallback` beans directly instead of raw functional beans:

```java
// Before — bare Function bean resolved by name at runtime
@Bean
@Description("Get the weather in location")
Function<WeatherRequest, WeatherResponse> currentWeather() {
    return weatherService::getWeather;
}

// After — explicit ToolCallback bean
@Bean
ToolCallback currentWeather() {
    return FunctionToolCallback.builder("currentWeather", weatherService::getWeather)
        .description("Get the weather in location")
        .inputType(WeatherRequest.class)
        .build();
}
```

Then register the bean directly with `tools()`:

```java
chatClient.prompt("What's the weather like in Copenhagen?")
    .tools(currentWeather)
    .call().content();
```

Alternatively, use `@Tool`-annotated methods for the declarative approach (see [Tools API](api/tools.md)).

<a id="_cloud_bindings"></a>

### Cloud Bindings

The `spring-ai-spring-cloud-bindings` module that provided integration for [github.com/spring-cloud/spring-cloud-bindings](https://github.com/spring-cloud/spring-cloud-bindings) has been removed.

<a id="_beanoutputconverter_json_schema_generation"></a>

### BeanOutputConverter JSON Schema Generation

`BeanOutputConverter` now delegates JSON Schema generation to `JsonSchemaGenerator`, aligning structured output conversion with the JSON Schema behavior used for tool calling.

<a id="_impact_14"></a>

#### Impact

- Kotlin properties that are optional in their primary constructor (nullable or declared with a default value) are no longer included in the JSON Schema `required` array.
- Properties annotated with `@JsonProperty(required = false)`, including `@JsonProperty` declarations where `required` is not specified, are no longer treated as required.
- Generated schemas now include OpenAPI-style `format` hints for primitive types (e.g., `int32` for `int`, `int64` for `long`, `date-time` for `LocalDateTime`), matching the format conventions used for tool calling.
- The `BeanOutputConverter.postProcessSchema(JsonNode)` extension point has been removed. Custom subclasses overriding this method will fail to compile.

<a id="_migration_17"></a>

#### Migration

To customize JSON Schema generation, override `BeanOutputConverter.generateSchema()` instead. Subclasses can post-process the default schema by delegating to `super.generateSchema()`.

```java
// Before
class CustomConverter extends BeanOutputConverter<MyType> {

    CustomConverter() {
        super(MyType.class);
    }

    @Override
    protected void postProcessSchema(JsonNode schema) {
        // mutate schema
    }
}

// After
class CustomConverter extends BeanOutputConverter<MyType> {

    CustomConverter() {
        super(MyType.class);
    }

    @Override
    protected String generateSchema() {
        String schema = super.generateSchema();
        // post-process schema
        return schema;
    }
}
```

<a id="_azure_cosmos_db_support"></a>

### Azure Cosmos DB Support

The Azure Cosmos DB vector store (`spring-ai-azure-cosmos-db-store`) and chat memory repository (`spring-ai-model-chat-memory-repository-cosmos-db`) modules, along with their corresponding auto-configurations and starters, have been removed from the Spring AI project.

Azure Cosmos DB support is now available as an external module maintained by the Azure Cosmos DB team.
See [azurecosmosdb.github.io/spring-ai/docs/index.html](https://azurecosmosdb.github.io/spring-ai/docs/index.html) for documentation and dependency coordinates.

<a id="_mcp_sdk_breaking_changes_required_fields"></a>

### MCP SDK Breaking Changes: Required Fields

The MCP SDK enforces previously optional fields as mandatory at construction time via `Assert.notNull()` in compact record constructors.

<a id="_breaking_createmessageresult_model_now_required"></a>

#### Breaking: `CreateMessageResult` — `model` now required

```java
// Before
CreateMessageResult.builder()
    .content(new TextContent(response))
    .build();

// After
CreateMessageResult.builder(Role.ASSISTANT, response, modelHint)
    .build();
```

<a id="_breaking_createmessagerequest_maxtokens_now_required"></a>

#### Breaking: `CreateMessageRequest` — `maxTokens` now required

```java
// Before
CreateMessageRequest.builder()
    .messages(messages)
    .build();

// After
CreateMessageRequest.builder(messages, 500)
    .build();
```

<a id="_deprecated_builder_apis"></a>

#### Deprecated Builder APIs

The following no-arg constructors and `builder()` methods are deprecated in favour of factory methods that require mandatory arguments upfront:

| Deprecated | Replacement |
| --- | --- |
| `new TextContent(text)` | `TextContent.builder(text).build()` |
| `new ReadResourceResult(contents)` | `ReadResourceResult.builder(contents).build()` |
| `new GetPromptResult(description, messages)` | `GetPromptResult.builder(messages).description(description).build()` |
| `new ProgressNotification(token, progress, total, message)` | `ProgressNotification.builder(token, progress).total(total).message(message).build()` |
| `LoggingMessageNotification.builder()` | `LoggingMessageNotification.builder(level, data)` |
| `ElicitRequest.builder()` | `ElicitRequest.builder(message, requestedSchema)` |
| `CallToolRequest.builder()` | `CallToolRequest.builder(name)` |

<a id="_observability"></a>

### Observability

<a id="_tool_calling_2"></a>

#### Tool Calling

The observations produced for tool calling operations have changed as follows:

- the span name is `execute_tool <tool-name>` instead of `tool_call <tool-name>`.
- the metric/span attribute `gen_ai.operation.name` has value `execute_tool` instead of `framework`.
- a new `spring.ai.tool.type` metric/span attribute has been introduced to capture the tool type (e.g. `function`).
- a new `spring.ai.tool.call.id` span attribute has been introduced to capture the tool call ID, as identified by the chat model.

<a id="_removed_modules"></a>

### Removed Modules

<a id="_spring_ai_hanadb_store_module_removal"></a>

#### `spring-ai-hanadb-store` module removal

The `spring-ai-hanadb-store` module has been **removed** from Spring AI.

<a id="_chat_memory_advisors_conversation_id_is_now_required"></a>

### Chat Memory Advisors: Conversation ID Is Now Required

The conversation ID is no longer optional for the built-in memory advisors (`MessageChatMemoryAdvisor` and `VectorStoreChatMemoryAdvisor`).
Every call through these advisors must supply `ChatMemory.CONVERSATION_ID` via the advisor context.
If the value is absent or `null`, the advisor throws an `IllegalArgumentException` immediately.

<a id="_removed_chatmemory_default_conversation_id"></a>

#### Removed: `ChatMemory.DEFAULT_CONVERSATION_ID`

The constant `ChatMemory.DEFAULT_CONVERSATION_ID` (value `"default"`) has been removed from the `ChatMemory` interface.

<a id="_impact_15"></a>

##### Impact

Code that references this constant will fail to compile.

<a id="_migration_18"></a>

##### Migration

Replace any reference to `ChatMemory.DEFAULT_CONVERSATION_ID` with an explicit conversation ID string or a value derived from your session/user context.

```java
// Before
String conversationId = ChatMemory.DEFAULT_CONVERSATION_ID;

// After
String conversationId = "my-conversation-id";
```

<a id="_removed_conversationid_builder_method_on_memory_advisors"></a>

#### Removed: `.conversationId()` Builder Method on Memory Advisors

The `.conversationId(String)` builder method has been removed from `MessageChatMemoryAdvisor.Builder` and `VectorStoreChatMemoryAdvisor.Builder`.
Setting a default conversation ID at construction time is no longer supported.

<a id="_impact_16"></a>

##### Impact

Code that calls `.conversationId()` on any of these builders will fail to compile.

<a id="_migration_19"></a>

##### Migration

Remove the `.conversationId()` builder call and always supply the conversation ID at call time via the advisor context using `ChatMemory.CONVERSATION_ID`:

```java
// Before
ChatClient chatClient = ChatClient.builder(chatModel)
    .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory)
        .conversationId("my-session")
        .build())
    .build();

chatClient.prompt()
    .user("Hello!")
    .call()
    .content();

// After
ChatClient chatClient = ChatClient.builder(chatModel)
    .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
    .build();

chatClient.prompt()
    .user("Hello!")
    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, "my-session"))
    .call()
    .content();
```

<a id="_changed_basechatmemoryadvisor_getconversationid_signature"></a>

#### Changed: `BaseChatMemoryAdvisor.getConversationId()` Signature

The default method `BaseChatMemoryAdvisor.getConversationId(Map, String)` has been replaced by `getConversationId(Map)`.

<a id="_impact_17"></a>

##### Impact

Custom advisor implementations that override or call the two-argument form will fail to compile.

<a id="_migration_20"></a>

##### Migration

Update overrides and call sites to the single-argument form. Ensure the context always contains `ChatMemory.CONVERSATION_ID` before calling the method.

```java
// Before
String conversationId = getConversationId(context, this.defaultConversationId);

// After
String conversationId = getConversationId(context); // throws if CONVERSATION_ID is absent
```

<a id="_removed_promptchatmemoryadvisor"></a>

### Removed: `PromptChatMemoryAdvisor`

`PromptChatMemoryAdvisor` has been removed. Use `MessageChatMemoryAdvisor` as a replacement.

<a id="_impact_18"></a>

#### Impact

Code that imports or references `PromptChatMemoryAdvisor` will fail to compile.

<a id="_migration_21"></a>

#### Migration

Replace `PromptChatMemoryAdvisor` with `MessageChatMemoryAdvisor`. The builder API is identical.
Instead of injecting memory as plain text into the system prompt, `MessageChatMemoryAdvisor` includes the conversation history directly as chat messages in the prompt.

```java
// Before
ChatClient chatClient = ChatClient.builder(chatModel)
    .defaultAdvisors(PromptChatMemoryAdvisor.builder(chatMemory).build())
    .build();

// After
ChatClient chatClient = ChatClient.builder(chatModel)
    .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
    .build();
```

<a id="_chatclient_options_now_require_a_builder"></a>

### ChatClient Options Now Require a Builder

When using `ChatClient`, the `.options()` / `.defaultOptions()` methods now accept a `ChatOptions.Builder` (or any provider-specific builder subtype) rather than a fully built `ChatOptions` instance.
This change is enforced at compile time by the method’s generic type constraint `<B extends ChatOptions.Builder<?>>`.

The options builder is merged with the model’s default options before the first advisor is called, so only the fields you explicitly set override the defaults.

```java
// Before — passing a built ChatOptions instance (no longer compiles with ChatClient)
ChatOptions opts = AnthropicChatOptions.builder()
    .maxTokens(100)
    .temperature(0.7)
    .build();
String response = chatClient.prompt("Tell me a joke")
    .options(opts)
    .call().content();

// After — pass the builder directly
String response = chatClient.prompt("Tell me a joke")
    .options(AnthropicChatOptions.builder()
        .maxTokens(100)
        .temperature(0.7))
    .call().content();
```

> [!NOTE]
> This restriction applies to `ChatClient` only. When calling `ChatModel.call(Prompt)` directly, the prompt must carry a fully built `ChatOptions` instance of the concrete type expected by the model (*e.g.* `AnthropicChatOptions` for `AnthropicChatModel`). The `ChatModel` does **not** merge options: if `Prompt.getOptions()` is non-null it is used as-is; if it is `null`, the model’s own default options are used instead. No partial merging occurs at the `ChatModel` level.

<a id="_buildrequestprompt_removed_from_public_api"></a>

#### `buildRequestPrompt` Removed from Public API

The `buildRequestPrompt` method is no longer part of the public API.
It was previously exposed by mistake and has been restored to its private or package-private visibility.

<a id="_openai_java_sdk_transition"></a>

### OpenAI Java SDK Transition

Spring AI now uses the official `openai-java` SDK under the hood for all OpenAI models (Chat, Embeddings, Image, Audio Speech, Audio Transcription, and Moderation) in the `spring-ai-openai` module.

The transition should be seamless, and **no major breaking changes are expected** for existing users of the `spring-ai-openai` module.
All properties (with the `spring.ai.openai.*` prefix), builders, and options remain fully intact. The existing `extraBody` configuration parameter transparently maps to the underlying `additionalBodyProperties` in the `openai-java` SDK.

<a id="_spring_ai_azure_openai_module_removal"></a>

#### `spring-ai-azure-openai` module removal

The `spring-ai-azure-openai` module (and its associated Spring Boot starter `spring-ai-starter-model-azure-openai` and auto-configuration `spring-ai-autoconfigure-model-azure-openai`) have been **removed** from Spring AI.

Existing users should use the `spring-ai-openai` module (and related starter and auto-configuration) instead and adapt class names (by removing the `Azure` prefix for example) and configuration properties accordingly.

<a id="_spring_ai_openai_sdk_module_removal"></a>

#### `spring-ai-openai-sdk` module removal

The `spring-ai-openai-sdk` module (and its associated Spring Boot starter `spring-ai-starter-model-openai-sdk` and auto-configuration `spring-ai-autoconfigure-model-openai-sdk`) have been **removed** from Spring AI.

Existing users should use the `spring-ai-openai` module (and related starter and auto-configuration) instead and adapt class names accordingly (by removing the `Sdk` suffix for example) and configuration properties accordingly.

<a id="_spring_ai_oci_genai_module_removal"></a>

#### `spring-ai-oci-genai` module removal

The related modules can now be found at [github.com/oracle/spring-cloud-oracle/tree/main/spring-ai-oracle](https://github.com/oracle/spring-cloud-oracle/tree/main/spring-ai-oracle).

<a id="_mcp_java_sdk_upgraded_to_2_0_0"></a>

### MCP Java SDK Upgraded to 2.0.0

Spring AI 2.0.0 upgrades the MCP Java SDK from `1.1.x` to `2.0.0`. This release introduces several breaking changes at the SDK level that may affect applications that interact with MCP types directly.

<a id="_server_side_tool_input_validation_enabled_by_default"></a>

#### Server-Side Tool Input Validation Enabled by Default

MCP servers now validate incoming tool arguments against the tool’s JSON schema before invoking the tool handler.
Failed validation produces a `CallToolResult` with `isError=true` and a descriptive error message.

<a id="_impact_19"></a>

##### Impact

Existing MCP servers that previously accepted loosely-typed or missing tool arguments may now return validation errors to clients that send non-conforming arguments.

<a id="_migration_22"></a>

##### Migration

Ensure that your tool definitions carry accurate JSON schemas and that all clients send conforming arguments.
To disable validation and restore the pre-2.0 behavior, set `validateToolInputs(false)` on the server builder:

```java
McpServer.sync(transportProvider)
    .validateToolInputs(false)
    .tool(myTool, handler)
    .build();
```

> [!NOTE]
> When using `@McpTool` annotations, Spring AI generates JSON schemas from method parameters automatically. These schemas are compatible with the built-in validator and require no extra action.

<a id="_tool_inputschema_changed_from_jsonschema_to_mapstring_object"></a>

#### `Tool.inputSchema` Changed from `JsonSchema` to `Map<String, Object>`

`McpSchema.Tool.inputSchema()` (and `outputSchema()`) now returns `Map<String, Object>` instead of the former `JsonSchema` record.
This allows arbitrary JSON Schema dialect keywords (`$ref`, `unevaluatedProperties`, vendor extensions) to round-trip without being trimmed.

<a id="_impact_20"></a>

##### Impact

Code that uses `tool.inputSchema()` as a `JsonSchema` object will fail to compile.

<a id="_migration_23"></a>

##### Migration

Switch to `Map<String, Object>`:

```java
// Before
McpSchema.JsonSchema schema = tool.inputSchema();

// After
Map<String, Object> schema = tool.inputSchema();
```

When constructing tools via `McpSchema.Tool.Builder`, the deprecated `inputSchema(JsonSchema)` helper is still available for backwards compatibility, but prefer `inputSchema(Map)` or `inputSchema(McpJsonMapper, String)`.

> [!NOTE]
> Applications that use `@McpTool` annotations or Spring AI’s `SyncMcpToolProvider` / `AsyncMcpToolProvider` are not affected — Spring AI handles schema generation internally.

<a id="_builder_customizerequest_removed_from_http_client_transports"></a>

#### `Builder.customizeRequest()` Removed from HTTP Client Transports

The deprecated `Builder.customizeRequest()` method has been removed from `HttpClientSseClientTransport.Builder` and `HttpClientStreamableHttpTransport.Builder`.

<a id="_impact_21"></a>

##### Impact

Any code calling `.customizeRequest()` directly on these builder types will fail to compile.

<a id="_migration_24"></a>

##### Migration

Replace `customizeRequest()` with `httpRequestCustomizer()` (sync) or `asyncHttpRequestCustomizer()` (async):

```java
// Before
HttpClientSseClientTransport.builder(baseUrl)
    .customizeRequest(req -> req.header("Authorization", "Bearer token"))
    .build();

// After
HttpClientSseClientTransport.builder(baseUrl)
    .httpRequestCustomizer(req -> req.header("Authorization", "Bearer token"))
    .build();
```

> [!NOTE]
> If you already migrated to the `McpClientCustomizer<B>` API, no further action is required.

<a id="_sealed_mcp_schema_interfaces_removed"></a>

#### Sealed MCP Schema Interfaces Removed

The following interfaces are no longer `sealed`:
`McpSchema.JSONRPCMessage`, `McpSchema.Request`, `McpSchema.Result`, `McpSchema.Notification`,
`McpSchema.ResourceContents`, `McpSchema.CompleteReference`, and `McpSchema.Content`.

<a id="_impact_22"></a>

##### Impact

Exhaustive `switch` expressions over these types that relied on the sealed hierarchy for completeness no longer compile without a `default` branch.

<a id="_migration_25"></a>

##### Migration

Add a `default` branch to any exhaustive `switch` over these types:

```java
// Before (no default needed when McpSchema.Content was sealed)
String text = switch (content) {
    case McpSchema.TextContent tc   -> tc.text();
    case McpSchema.ImageContent ic  -> "[image]";
    case McpSchema.EmbeddedResource er -> "[resource]";
};

// After
String text = switch (content) {
    case McpSchema.TextContent tc   -> tc.text();
    case McpSchema.ImageContent ic  -> "[image]";
    case McpSchema.EmbeddedResource er -> "[resource]";
    default -> throw new IllegalArgumentException("Unknown content type: " + content);
};
```

> [!NOTE]
> This change is unlikely to affect most Spring AI users who interact with MCP through annotations or Spring AI’s higher-level abstractions.

<a id="_unified_cache_usage_metrics_on_usage"></a>

### Unified Cache Usage Metrics on `Usage`

The `org.springframework.ai.chat.metadata.Usage` interface gains two default methods, `getCacheReadInputTokens()` and `getCacheWriteInputTokens()`. Both return `null` when the provider doesn’t report a value.

Anthropic, Bedrock Converse, OpenAI, and Google GenAI populate them: Anthropic and Bedrock in both directions, OpenAI and Google for cache reads only.

Code that cast to native types or read provider-specific metadata keys for these numbers can switch to the interface methods. See [Prompt Cache Usage Metrics](api/usage-handling.md#_prompt_cache_usage_metrics) for examples.

<a id="_anthropic_module"></a>

### Anthropic Module

`spring-ai-anthropic` is now built on `com.anthropic:anthropic-java` instead of the hand-rolled `RestClient` / `WebClient` implementation.

For most applications the change is transparent. The Maven artifact, the `spring.ai.anthropic.*` configuration, and the `AnthropicChatModel` / `AnthropicChatOptions` / `ChatClient` API are preserved, and code that goes through `ChatClient` or `ChatModel.call(Prompt)` does not need updates.

Code that imported from `org.springframework.ai.anthropic.api`, constructed `AnthropicChatModel` with an `AnthropicApi` argument, or depended on the old `maxTokens` default does need attention.

<a id="_impact_23"></a>

#### Impact

- `org.springframework.ai.anthropic.api.AnthropicApi` and all its nested record types (`ChatCompletionRequest`, `ContentBlock`, `Tool`, `ToolChoice*`, streaming event records) are gone. Code referencing these will not compile.
- The public `AnthropicChatModel(AnthropicApi, AnthropicChatOptions, …​)` constructor is gone. Use `AnthropicChatModel.builder()`.
- `AnthropicChatOptions#maxTokens` defaults to `4096` instead of `500`. Responses that hit the old cap will now run longer, with correspondingly higher token usage.
- `AnthropicCacheOptions`, `AnthropicCacheStrategy`, `AnthropicCacheTtl`, `CacheBreakpointTracker`, and `CacheEligibilityResolver` moved out of `api` (and `api.utils`) into the root `org.springframework.ai.anthropic` package.
- `AnthropicCacheType`, `StreamHelper`, and `metadata.AnthropicRateLimit` were removed; the equivalent SDK types (`CacheControlEphemeral`, `AsyncStreamResponse<RawMessageStreamEvent>`, `RateLimitException`) are used directly.
- `CitationDocument` was renamed to `AnthropicCitationDocument`.
- `com.anthropic:anthropic-java` brings `com.squareup.okhttp3:okhttp` onto the classpath transitively.

<a id="_migration_26"></a>

#### Migration

Update imports for the moved cache and citation classes:

| Before | After |
| --- | --- |
| `org.springframework.ai.anthropic.api.AnthropicCacheOptions` | `org.springframework.ai.anthropic.AnthropicCacheOptions` |
| `org.springframework.ai.anthropic.api.AnthropicCacheStrategy` | `org.springframework.ai.anthropic.AnthropicCacheStrategy` |
| `org.springframework.ai.anthropic.api.AnthropicCacheTtl` | `org.springframework.ai.anthropic.AnthropicCacheTtl` |
| `org.springframework.ai.anthropic.api.utils.CacheBreakpointTracker` | `org.springframework.ai.anthropic.CacheBreakpointTracker` |
| `org.springframework.ai.anthropic.api.utils.CacheEligibilityResolver` | `org.springframework.ai.anthropic.CacheEligibilityResolver` |
| `org.springframework.ai.anthropic.api.CitationDocument` | `org.springframework.ai.anthropic.AnthropicCitationDocument` |

`AnthropicCacheStrategy` (`NONE`, `TOOLS_ONLY`, `SYSTEM_ONLY`, `SYSTEM_AND_TOOLS`, `CONVERSATION_HISTORY`) and `AnthropicCacheTtl` (`FIVE_MINUTES`, `ONE_HOUR`) keep the same enum values.

Replace direct constructor usage with the builder:

```java
// Before
AnthropicApi anthropicApi = new AnthropicApi(apiKey);
AnthropicChatModel chatModel = new AnthropicChatModel(anthropicApi, options);

// After
AnthropicChatModel chatModel = AnthropicChatModel.builder()
    .apiKey(apiKey)
    .defaultOptions(options)
    .build();
```

If you relied on the `500`-token default to bound costs, set it explicitly:

```java
AnthropicChatOptions.builder()
    .maxTokens(500)
    // ...
    .build();
```

[Migrating the Anthropic Module to the Official Java SDK](api/chat/anthropic-migration.md) covers the rest: direct SDK access, streaming behavior, prompt caching, citations, and removed types.

<a id="_new_chat_options"></a>

#### New Chat Options

`spring-ai-anthropic` also gains four new chat options. The full reference for each is in [Anthropic Chat](api/chat/anthropic-chat.md); the highlights:

| Option | What it adds |
| --- | --- |
| Thinking display | `Display.SUMMARIZED` and `Display.OMITTED` on the `thinkingEnabled` / `thinkingAdaptive` builders, so Claude can use a thinking budget without surfacing the full reasoning. |
| Service tier | `AnthropicServiceTier.AUTO` / `STANDARD_ONLY` for Anthropic’s priority capacity tier. Property `spring.ai.anthropic.chat.service-tier`. |
| Built-in web search | `AnthropicWebSearchTool` lets Claude search the web during a request. Properties under `spring.ai.anthropic.chat.web-search-tool.*`. |
| Inference geo | `inferenceGeo("us")` or `inferenceGeo("eu")` for data-residency routing. Property `spring.ai.anthropic.chat.inference-geo`. |

> [!NOTE]
> If you are upgrading from `1.1.x` (or `1.0.x`), see [Migrating the Anthropic Module to the Official Java SDK](api/chat/anthropic-migration.md) for the full `RestClient` → SDK transition guide.

<a id="_mcp_annotations_migrated_into_spring_ai"></a>

### MCP Annotations Migrated into Spring AI

The `org.springaicommunity:mcp-annotations` external library has been removed as a dependency of the `mcp-annotations` module.
Its classes are now part of Spring AI itself under a new package structure.

<a id="_impact_24"></a>

#### Impact

- All MCP annotation and provider classes have new fully-qualified names.
- The `org.springaicommunity:mcp-annotations` artifact is no longer provided transitively by Spring AI.
- Any code importing from `org.springaicommunity.mcp.*` will fail to compile.

<a id="_package_rename"></a>

#### Package Rename

| Old Package | New Package |
| --- | --- |
| `org.springaicommunity.mcp.annotation.*` | `org.springframework.ai.mcp.annotation.*` |
| `org.springaicommunity.mcp.method.*` | `org.springframework.ai.mcp.annotation.method.*` |
| `org.springaicommunity.mcp.provider.*` | `org.springframework.ai.mcp.annotation.provider.*` |

<a id="_migration_27"></a>

#### Migration

Update all imports in your application code:

```java
// Before
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpPrompt;
import org.springaicommunity.mcp.annotation.McpResource;
import org.springaicommunity.mcp.annotation.McpSampling;
import org.springaicommunity.mcp.provider.tool.SyncMcpToolProvider;
import org.springaicommunity.mcp.provider.prompt.AsyncMcpPromptProvider;

// After
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpPrompt;
import org.springframework.ai.mcp.annotation.McpResource;
import org.springframework.ai.mcp.annotation.McpSampling;
import org.springframework.ai.mcp.annotation.provider.tool.SyncMcpToolProvider;
import org.springframework.ai.mcp.annotation.provider.prompt.AsyncMcpPromptProvider;
```

If you declared `org.springaicommunity:mcp-annotations` as a direct Maven or Gradle dependency, remove it — the classes are now provided by Spring AI’s `spring-ai-mcp-annotations` module.

<a id="_automated_migration_with_openrewrite"></a>

#### Automated Migration with OpenRewrite

You can automate all import and dependency changes using the provided OpenRewrite recipe.

Apply the [`migrate-to-2-0-0-M3.yaml`](https://github.com/spring-projects/spring-ai/blob/main/src/rewrite/migrate-to-2-0-0-M3.yaml) recipe from the command line:

```shell
mvn org.openrewrite.maven:rewrite-maven-plugin:6.32.0:run \
  -Drewrite.configLocation=https://raw.githubusercontent.com/spring-projects/spring-ai/refs/heads/main/src/rewrite/migrate-to-2-0-0-M3.yaml \
  -Drewrite.activeRecipes=org.springframework.ai.migration.M3MigrateMcpAnnotations \
  -Dmaven.compiler.failOnError=false
```

The recipe performs two changes automatically:

1. **Removes** the `org.springaicommunity:mcp-annotations` Maven dependency.
1. **Rewrites** all `import` statements across `.java` files to point to the new `org.springframework.ai.mcp.annotation.*` packages.

To run all M3 migrations at once, use the umbrella recipe — see [\[run-all-m3-migrations\]](#run-all-m3-migrations).

<a id="_mcp_spring_transport_modules_moved_to_spring_ai"></a>

### MCP Spring Transport Modules Moved to Spring AI

The `mcp-spring-webflux` and `mcp-spring-webmvc` transport modules are no longer shipped by the MCP Java SDK. Starting with Spring AI 2.0, they are part of the Spring AI project itself.

<a id="_impact_25"></a>

#### Impact

- The Maven group ID for both artifacts has changed.
- Java package names for all Spring-specific transport classes have changed.
- The MCP Java SDK version requirement has been bumped from `0.18.x` to `1.0.x`.

<a id="_maven_dependency_group_id_change"></a>

#### Maven Dependency Group ID Change

#### Before

```xml
<dependency>
    <groupId>io.modelcontextprotocol.sdk</groupId>
    <artifactId>mcp-spring-webflux</artifactId>
</dependency>

<dependency>
    <groupId>io.modelcontextprotocol.sdk</groupId>
    <artifactId>mcp-spring-webmvc</artifactId>
</dependency>
```

#### After

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>mcp-spring-webflux</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>mcp-spring-webmvc</artifactId>
</dependency>
```

> [!NOTE]
> When using the `spring-ai-bom` or a Spring AI MCP starter (`spring-ai-starter-mcp-server-webflux`, `spring-ai-starter-mcp-server-webmvc`, `spring-ai-starter-mcp-client-webflux`), **no explicit version is needed** — the BOM manages it automatically.

<a id="_java_package_relocation"></a>

#### Java Package Relocation

All Spring-specific transport classes have moved to `org.springframework.ai` packages.

| Class | Old package | New package |
| --- | --- | --- |
| `WebFluxSseServerTransportProvider` | `io.modelcontextprotocol.server.transport` | `org.springframework.ai.mcp.server.webflux.transport` |
| `WebFluxStreamableServerTransportProvider` | `io.modelcontextprotocol.server.transport` | `org.springframework.ai.mcp.server.webflux.transport` |
| `WebFluxStatelessServerTransport` | `io.modelcontextprotocol.server.transport` | `org.springframework.ai.mcp.server.webflux.transport` |
| `WebMvcSseServerTransportProvider` | `io.modelcontextprotocol.server.transport` | `org.springframework.ai.mcp.server.webmvc.transport` |
| `WebMvcStreamableServerTransportProvider` | `io.modelcontextprotocol.server.transport` | `org.springframework.ai.mcp.server.webmvc.transport` |
| `WebMvcStatelessServerTransport` | `io.modelcontextprotocol.server.transport` | `org.springframework.ai.mcp.server.webmvc.transport` |

| Class | Old package | New package |
| --- | --- | --- |
| `WebFluxSseClientTransport` | `io.modelcontextprotocol.client.transport` | `org.springframework.ai.mcp.client.webflux.transport` |
| `WebClientStreamableHttpTransport` | `io.modelcontextprotocol.client.transport` | `org.springframework.ai.mcp.client.webflux.transport` |

<a id="_migration_28"></a>

#### Migration

Update your Java imports:

```java
// Before
import io.modelcontextprotocol.server.transport.WebFluxSseServerTransportProvider;
import io.modelcontextprotocol.server.transport.WebMvcSseServerTransportProvider;
import io.modelcontextprotocol.client.transport.WebFluxSseClientTransport;
import io.modelcontextprotocol.client.transport.WebClientStreamableHttpTransport;

// After
import org.springframework.ai.mcp.server.webflux.transport.WebFluxSseServerTransportProvider;
import org.springframework.ai.mcp.server.webmvc.transport.WebMvcSseServerTransportProvider;
import org.springframework.ai.mcp.client.webflux.transport.WebFluxSseClientTransport;
import org.springframework.ai.mcp.client.webflux.transport.WebClientStreamableHttpTransport;
```

> [!NOTE]
> If you rely exclusively on Spring Boot auto-configuration via the Spring AI starters, **no Java code changes are required**. Only update your `pom.xml`/`build.gradle` dependency coordinates as described above.

For the full MCP transport migration reference, see [Upgrading to Spring AI 2.0](api/mcp/mcp-overview.md#_upgrading_to_spring_ai_2_0).

<a id="_automated_migration_with_openrewrite_2"></a>

#### Automated Migration with OpenRewrite

You can automate all Maven dependency and Java import changes using the provided OpenRewrite recipe:

```shell
mvn org.openrewrite.maven:rewrite-maven-plugin:6.32.0:run \
  -Drewrite.configLocation=https://raw.githubusercontent.com/spring-projects/spring-ai/refs/heads/main/src/rewrite/migrate-to-2-0-0-M3.yaml \
  -Drewrite.activeRecipes=org.springframework.ai.migration.M3MigrateMcpSpringTransports \
  -Dmaven.compiler.failOnError=false
```

> [!IMPORTANT]
> If your project declares `io.modelcontextprotocol.sdk:mcp-spring-webflux` or `mcp-spring-webmvc` **without** an explicit `<version>` (version managed via a BOM), Maven will refuse to parse the `pom.xml` and the recipe will never run.
> Pre-patch those files first, then run OpenRewrite:

```shell
# Step 1 – patch the groupIds directly so Maven can load the modules
find . -name "pom.xml" -print0 \
  | xargs -0 perl -i -0pe \
    's{<groupId>io\.modelcontextprotocol\.sdk</groupId>(\s+)<artifactId>mcp-spring-webflux</artifactId>}{<groupId>org.springframework.ai</groupId>$1<artifactId>mcp-spring-webflux</artifactId>}g;
     s{<groupId>io\.modelcontextprotocol\.sdk</groupId>(\s+)<artifactId>mcp-spring-webmvc</artifactId>}{<groupId>org.springframework.ai</groupId>$1<artifactId>mcp-spring-webmvc</artifactId>}g'

# Step 2 – run OpenRewrite to migrate Java imports and remaining POM changes
mvn org.openrewrite.maven:rewrite-maven-plugin:6.32.0:run \
  -Drewrite.configLocation=https://raw.githubusercontent.com/spring-projects/spring-ai/refs/heads/main/src/rewrite/migrate-to-2-0-0-M3.yaml \
  -Drewrite.activeRecipes=org.springframework.ai.migration.M3MigrateMcpSpringTransports \
  -Dmaven.compiler.failOnError=false
```

To run all M3 migrations at once, use the umbrella recipe — see [\[run-all-m3-migrations\]](#run-all-m3-migrations).

<a id="_mcp_client_customizer_api_consolidated"></a>

### MCP Client Customizer API Consolidated

`McpAsyncClientCustomizer` and `McpSyncClientCustomizer` have been removed and replaced by a single generic interface `McpClientCustomizer<B>`.

<a id="_impact_26"></a>

#### Impact

- `McpAsyncClientCustomizer` no longer exists — compile error for any implementing bean.
- `McpSyncClientCustomizer` no longer exists — compile error for any implementing bean.
- `McpSyncClientConfigurer` and `McpAsyncClientConfigurer` constructors now accept `List<McpClientCustomizer<…​>>` instead of the old type-specific lists.
- In the HttpClient-based transport auto-configurations (`SseHttpClientTransportAutoConfiguration`, `StreamableHttpHttpClientTransportAutoConfiguration`), the SDK-level `McpSyncHttpClientRequestCustomizer` and `McpAsyncHttpClientRequestCustomizer` beans are **no longer applied**. Transport-level customization now goes through `McpClientCustomizer<HttpClientSseClientTransport.Builder>` and `McpClientCustomizer<HttpClientStreamableHttpTransport.Builder>` respectively.

<a id="_migration_29"></a>

#### Migration

Replace your customizer beans with the new generic interface, parameterized by the spec or builder type you need:

```java
// Before
@Bean
public McpSyncClientCustomizer mySyncCustomizer() {
    return (name, spec) -> spec.requestTimeout(Duration.ofSeconds(30));
}

@Bean
public McpAsyncClientCustomizer myAsyncCustomizer() {
    return (name, spec) -> spec.requestTimeout(Duration.ofSeconds(30));
}

// After
@Bean
public McpClientCustomizer<McpClient.SyncSpec> mySyncCustomizer() {
    return (name, spec) -> spec.requestTimeout(Duration.ofSeconds(30));
}

@Bean
public McpClientCustomizer<McpClient.AsyncSpec> myAsyncCustomizer() {
    return (name, spec) -> spec.requestTimeout(Duration.ofSeconds(30));
}
```

For HttpClient transport customization (previously done via `McpSyncHttpClientRequestCustomizer` / `McpAsyncHttpClientRequestCustomizer`):

```java
// Before
@Bean
public McpSyncHttpClientRequestCustomizer myRequestCustomizer() {
    return requestBuilder -> requestBuilder.header("Authorization", "Bearer token");
}

// After
@Bean
public McpClientCustomizer<HttpClientSseClientTransport.Builder> mySseTransportCustomizer() {
    return (name, builder) -> builder.httpRequestCustomizer(
        req -> req.header("Authorization", "Bearer token")
    );
}
```

<a id="_automated_migration_with_openrewrite_3"></a>

#### Automated Migration with OpenRewrite

You can automate the import and type changes using the provided OpenRewrite recipe:

```shell
mvn org.openrewrite.maven:rewrite-maven-plugin:6.32.0:run \
  -Drewrite.configLocation=https://raw.githubusercontent.com/spring-projects/spring-ai/refs/heads/main/src/rewrite/migrate-to-2-0-0-M3.yaml \
  -Drewrite.activeRecipes=org.springframework.ai.migration.M3MigrateMcpClientCustomizer \
  -Dmaven.compiler.failOnError=false
```

The recipe performs the following changes automatically:

1. **Replaces** the `McpAsyncClientCustomizer` and `McpSyncClientCustomizer` imports with `McpClientCustomizer` and adds the required `import io.modelcontextprotocol.client.McpClient;`.
1. **Rewrites** `implements McpAsyncClientCustomizer` to `implements McpClientCustomizer<McpClient.AsyncSpec>`.
1. **Rewrites** `implements McpSyncClientCustomizer` to `implements McpClientCustomizer<McpClient.SyncSpec>`.
1. **Rewrites** all remaining usages (return types, variable declarations, parameter types).

> [!NOTE]
> `McpSyncHttpClientRequestCustomizer` and `McpAsyncHttpClientRequestCustomizer` beans are no longer applied by the transport auto-configurations. Their migration to `McpClientCustomizer<TransportBuilder>` requires a manual step — the target builder type depends on which transport you are configuring (SSE vs. Streamable HTTP).

To run all M3 migrations at once, use the umbrella recipe — see [\[run-all-m3-migrations\]](#run-all-m3-migrations).

<a id="_mcp_webmvc_transport_headers_normalized_to_lowercase"></a>

### MCP WebMvc Transport Headers Normalized to Lowercase

In `WebMvcSseServerTransportProvider`, `WebMvcStatelessServerTransport`, and `WebMvcStreamableServerTransportProvider`, the `Map<String, List<String>>` passed to `securityValidator.validateHeaders(headers)` now has all header names normalized to **lowercase**.

Previously, header names were passed with their original HTTP case (e.g. `"Authorization"`, `"Content-Type"`). They are now always lowercase (e.g. `"authorization"`, `"content-type"`).

<a id="_impact_27"></a>

#### Impact

Custom `ServerTransportSecurityValidator` implementations that look up headers by their mixed-case names will silently fail to find them.

<a id="_migration_30"></a>

#### Migration

Update all header name lookups in your `ServerTransportSecurityValidator` to use lowercase keys:

```java
// Before
public void validateHeaders(Map<String, List<String>> headers) {
    List<String> authHeader = headers.get("Authorization");
    // ...
}

// After
public void validateHeaders(Map<String, List<String>> headers) {
    List<String> authHeader = headers.get("authorization");
    // ...
}
```

<a id="_conversation_history_removed_from_toolcontext"></a>

### Conversation History Removed from ToolContext

Conversation history is no longer automatically added to `ToolContext`. The `TOOL_CALL_HISTORY` constant and `getToolCallHistory()` method have been removed from the `ToolContext` class.

<a id="_impact_28"></a>

#### Impact

- `ToolContext.TOOL_CALL_HISTORY` constant no longer exists
- `ToolContext.getToolCallHistory()` method no longer exists
- Conversation history is no longer automatically populated in `ToolContext`

<a id="_why_this_change"></a>

#### Why This Change?

1. **Memory Efficiency**: Prevents unbounded memory growth in long conversations
1. **Separation of Concerns**: Tools should operate on their parameters, not manage conversation state
1. **Architecture Alignment**: Conversation context belongs at the advisor level, not in tool execution

<a id="_migration_31"></a>

#### Migration

If your application needs conversation history management, use `ToolCallingAdvisor`:

#### Managing Conversation History with ToolCallingAdvisor

```java
ChatClient chatClient = ChatClient.builder()
    .defaultAdvisors(
        ToolCallingAdvisor.builder()
            .conversationHistoryEnabled(true)  // Full history (default)
            .build()
    )
    .build();
```

**How ToolCallingAdvisor Works:**

The `ToolCallingAdvisor` manages conversation history at the advisor level:

- **conversationHistoryEnabled=true** (default): Full conversation history is maintained and sent to the LLM between tool call iterations, allowing the LLM to synthesize results with full context
- **conversationHistoryEnabled=false**: Only the most recent tool response is sent to the LLM (useful when ChatMemory advisor manages history separately)

**Key Point:** The conversation history is used by the **LLM** to understand context and formulate responses, not by the **tools** themselves. Tools receive only their input parameters and any custom context you explicitly provide.

**Custom Context in Tools:**

`ToolContext` remains available for passing custom, application-specific data to tools:

#### Passing Custom Context to Tools

```java
ChatResponse response = chatClient.prompt()
    .user("What's the weather in SF?")
    .toolContext(Map.of("userId", "user123", "apiKey", "secret"))
    .call()
    .chatResponse();
```

**Example Flow:**

1. User asks: "What’s the weather in SF and LA?"
1. LLM requests tool calls: `getWeather(SF)` and `getWeather(LA)`
1. Tools execute with only their parameters (no conversation history)
1. ToolCallingAdvisor collects tool results and conversation history
1. LLM receives conversation context from advisor and synthesizes: "The weather in SF is 72°F and in LA is 85°F"

The LLM sees the full conversation through the advisor chain, not through ToolContext.

<a id="_the_access_level_of_model_internal_methods_changed_to_private"></a>

#### The access level of model internal methods changed to private

- All `internalCall` and `internalStream` methods in model classes have been changed to `private`.

<a id="_impact_29"></a>

##### Impact

- Direct calls `xxxModel.internalCall` or `xxxModel.internalStream` method, will fail to compile.

<a id="_migration_32"></a>

##### Migration

- Replace all calls to `xxxModel.internalCall` with `xxxModel.call`.
- Replace all calls to `xxxModel.internalStream` with `xxxModel.stream`.

  ```java
  // Before
  ChatResponse response = model.internalCall(prompt, previousChatResponse);
  Flux<ChatResponse> responseFlux = model.internalStream(prompt, previousChatResponse);

  // After
  ChatResponse response = model.call(prompt);
  Flux<ChatResponse> responseFlux = model.stream(prompt);
  ```

<a id="_opensearch_dependencies_upgraded"></a>

### OpenSearch Dependencies Upgraded

The OpenSearch vector store dependencies have been upgraded to newer versions:

- **OpenSearch Java Client**: `2.23.0` → `3.6.0`
- **OpenSearch Testcontainers**: `2.0.1` → `4.1.0`

<a id="_background"></a>

#### Background

This upgrade was necessary for compatibility with Spring Boot 4.1.x, which uses HttpClient5 (`org.apache.httpcomponents.client5:httpclient5`) version 5.6. This version of HttpClient has a gzip content formatter breaking change that required the OpenSearch Java Client upgrade. See [OpenSearch Java PR #1851](https://github.com/opensearch-project/opensearch-java/pull/1851) for details.

<a id="_impact_30"></a>

#### Impact

The OpenSearch Java Client 3.x introduces breaking API changes that affect custom code interacting directly with the native OpenSearch client.

<a id="_migration_33"></a>

#### Migration

If you’re using the OpenSearch vector store through Spring AI’s `VectorStore` interface, no action is required. The upgrade is transparent.

**Testcontainers class renamed**: `OpensearchContainer` → `OpenSearchContainer` (proper camelCase)

Spring AI’s internal implementation has been updated to handle these changes automatically.

<a id="_abstractfilterexpressionconverter_dosinglevalue_is_now_abstract"></a>

### AbstractFilterExpressionConverter: doSingleValue is now abstract

In `AbstractFilterExpressionConverter` (used by vector store filter expression converters), the method `doSingleValue(Object value, StringBuilder context)` has been changed from a concrete method to an abstract method. Custom vector store implementations that extend `AbstractFilterExpressionConverter` must now implement this method explicitly.

<a id="_impact_31"></a>

#### Impact

- Any custom `FilterExpressionConverter` that extends `AbstractFilterExpressionConverter` and did not override `doSingleValue()` will fail to compile.
- Implementations must convert a single filter value (String, Number, Boolean, Date, etc.) into the target format and append it to the provided `StringBuilder` context.

<a id="_migration_34"></a>

#### Migration

Implement `doSingleValue(Object value, StringBuilder context)` in your custom converter. You can use the provided static helper methods:

- **JSON-based filters** (e.g. PostgreSQL JSONPath, Neo4j Cypher, Weaviate): use `emitJsonValue(Object value, StringBuilder context)` to serialize values with proper quoting and escaping.
- **Lucene-based filters** (e.g. Elasticsearch, OpenSearch, GemFire): use `emitLuceneString(String value, StringBuilder context)` for string values, and handle other types (numbers, booleans, dates) according to your store’s query syntax.
- **Other formats**: implement your own logic and append the result to `context`.

> [!NOTE]
> The framework normalizes values (e.g. ISO date strings converted to `Date`) before invoking `doSingleValue`, so your implementation receives already-normalized values. The static helper `normalizeDateString(Object)` is available if you need the same normalization when building expressions outside of the standard flow.

<a id="_mongodb_chat_memory_message_ordering_fixed"></a>

### MongoDB Chat Memory Message Ordering Fixed

The `MongoChatMemoryRepository` has been fixed to return messages in the order they were sent (oldest-to-newest), matching all other chat memory repository implementations. Previously, it incorrectly returned messages in reverse order (newest-to-oldest), which broke conversation flow for LLMs.

<a id="_impact_32"></a>

#### Impact

If your application was using `MongoChatMemoryRepository` and working around the incorrect ordering (e.g., by reversing messages after retrieval), you will need to remove that workaround.

<a id="_migration_35"></a>

##### Migration

Remove any code that reverses the message order after retrieving from MongoDB chat memory:

```java
// BEFORE (with workaround for bug):
List<Message> messages = chatMemoryRepository.findByConversationId(conversationId);
Collections.reverse(messages); // Remove this workaround

// AFTER (correct ordering):
List<Message> messages = chatMemoryRepository.findByConversationId(conversationId);
// Messages are now correctly ordered chronologically
```

All chat memory repositories now consistently return messages in the order they were sent (oldest-to-newest), which is the expected format for LLM conversation history.

<a id="_development_time_services"></a>

### Development-time Services

- Docker Compose and Testcontainers support for MongoDB Atlas is now provided natively by the Spring Boot MongoDB module. The migration should be transparent and not require any code change. Regarding dependencies, you don’t need to import `org.springframework.ai:spring-ai-spring-boot-testcontainers` anymore. A dependency on `org.springframework.boot:spring-boot-testcontainers` is sufficient.

<a id="_default_temperature_configuration_removed"></a>

### Default Temperature Configuration Removed

Spring AI no longer provides default temperature values for chat model autoconfiguration properties. Previously, Spring AI set a default temperature of `0.7` for most chat models. This default has been removed to allow each AI provider’s native default temperature to be used.

<a id="_impact_33"></a>

#### Impact

If your application did not explicitly configure a temperature value and relied on Spring AI’s default of `0.7`, you may notice different behavior after upgrading. The actual default will now be determined by each AI provider’s API, which may vary:

- Some providers default to `1.0`
- Some providers default to `0.7`
- Some providers have model-specific defaults

<a id="_migration_36"></a>

#### Migration

If you want to maintain the previous behavior, explicitly set the temperature in your configuration:

```properties
# Example for OpenAI
spring.ai.openai.chat.temperature=0.7

# Example for Anthropic
spring.ai.anthropic.chat.temperature=0.7

# Example for Azure OpenAI
spring.ai.azure.openai.chat.temperature=0.7
```

Or programmatically when building requests:

```java
ChatResponse response = chatModel.call(
    new Prompt("Your prompt here",
        OpenAiChatOptions.builder()
            .temperature(0.7)
            .build()));
```

<a id="upgrading-to-1-1-0-RC1"></a>

## Upgrading to 1.1.0-RC1

<a id="_breaking_changes"></a>

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
For detailed instructions, refer to the [Snapshots - Add Snapshot Repositories](getting-started.md#_snapshots_add_snapshot_repositories) section in the Getting Started guide.

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

<a id="_breaking_changes_2"></a>

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
- The `VectorStoreChatMemoryAdvisor` expects a template with the following placeholders (see [more details](api/chat-memory.md#_vectorstorechatmemoryadvisor)):

  - an `instructions` placeholder to receive the original system message.
  - a `long_term_memory` placeholder to receive the retrieved conversation memory.

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

<a id="_breaking_changes_3"></a>

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

<a id="_observability_3"></a>

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
> The automated upgrade prompt currently handles artifact ID changes, package relocations, and module structure changes, but does not yet include automatic changes for upgrading to MCP 0.9.0. If you’re using MCP, you’ll need to manually update your code following the guidance in the [MCP Java SDK Upgrade](#_mcp_java_sdk_upgrade_to_0_9_0) section.

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

![Spring AI Dependencies](https://raw.githubusercontent.com/spring-projects/spring-ai/v2.0.0/spring-ai-docs/src/main/antora/modules/ROOT/images/spring-ai-dependencies.png)

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

<a id="_spring_ai_vector_store_advisor"></a>

#### spring-ai-vector-store-advisor

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
- `spring-ai-vector-store-advisor` and `spring-ai-rag` (depend on both client-chat and vector-store)
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

- from `spring.ai.openai.model` to `spring.ai.openai.chat.model`.
- from `spring.ai.openai.temperature` to `spring.ai.openai.chat.temperature`.

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
