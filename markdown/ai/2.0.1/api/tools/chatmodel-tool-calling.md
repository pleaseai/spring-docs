---
title: "ChatModel Tool Calling"
source: "ROOT:api/tools/chatmodel-tool-calling.adoc"
---

<a id="chatmodel-tool-calling"></a>

# ChatModel Tool Calling

`ChatModel` is the low-level request/response interface to a chat provider. It accepts tool definitions, sends them to the model, and returns the model’s response. Tool calls in that response are **not** executed automatically — that’s the caller’s responsibility.

For most applications, [`ChatClient`](../tools.md) is the recommended entry point: it handles the tool-calling loop via [`ToolCallingAdvisor`](tool-calling-advisor.md), composes with memory and observability advisors, and supports auto-configuration extension points. This page is for users who deliberately want the lower-level path.

<a id="when-to-use"></a>

## When to Use `ChatModel` Directly

`ChatModel` is the right choice when:

- You don’t want the advisor chain (no memory advisor, no observability advisor, no `ToolCallingAdvisor`).
- You’re integrating tool calling into a custom orchestrator (a domain-specific workflow engine, a non-Spring agent framework) that owns its own loop.
- You’re building infrastructure on top of Spring AI — for example, a custom `ChatClient` implementation, or a library that exposes its own higher-level API.

For everything else — chat applications, RAG, agentic workflows, tool-heavy assistants — use `ChatClient`.

<a id="no-internal-tool-execution"></a>

## No Internal Tool Execution

`ChatModel` does not execute tool calls. `ChatModel.call(prompt)` and `ChatModel.stream(prompt)` return the model’s raw response, including any tool call requests, without executing them. Executing the requested tools and re-calling the model is the caller’s responsibility — see [Driving the Loop Manually](#driving-the-loop-manually).

> [!NOTE]
> If you are coming from Spring AI 1.x, where each `ChatModel` ran its own internal tool-execution loop, see [Upgrading Tool Calling from 1.x to 2.0](../../upgrade-notes.md#tool-calling-1x-to-2x) for what changed and how to migrate.

<a id="passing-tools"></a>

## Passing Tools to `ChatModel`

Tools are passed via `ToolCallingChatOptions.toolCallbacks(…​)`. The options accept a `List<ToolCallback>` or a `ToolCallback[]`. Use `ToolCallbacks.from(…​)` to convert `@Tool`-annotated objects into callbacks.

<a id="per-request-tools"></a>

### Per-Request Tools

```java
ChatModel chatModel = ...
ToolCallback[] tools = ToolCallbacks.from(new DateTimeTools());

ChatOptions chatOptions = ToolCallingChatOptions.builder()
    .toolCallbacks(tools)
    .build();

Prompt prompt = new Prompt("What day is tomorrow?", chatOptions);
ChatResponse response = chatModel.call(prompt);
```

This sends the tool definitions to the model. If the model decides to call a tool, the response contains the call request; you execute it yourself (see [Driving the Loop Manually](#driving-the-loop-manually)).

<a id="default-tools"></a>

### Default Tools (Configured on the Model)

Some `ChatModel` builders accept default options. Tools set in the default options apply to every request unless overridden:

```java
ToolCallback[] dateTimeTools = ToolCallbacks.from(new DateTimeTools());

ChatModel chatModel = OllamaChatModel.builder()
    .ollamaApi(OllamaApi.builder().build())
    .options(ToolCallingChatOptions.builder()
        .toolCallbacks(dateTimeTools)
        .build())
    .build();
```

> [!WARNING]
> Default tools are sent to the model on every request issued through this `ChatModel` instance. This is convenient for tools that should always be available, but it can also be dangerous — risk-tier and destructive tools should typically be added per request, not as defaults.

<a id="override-semantics"></a>

### Override Semantics

When tools are set both in the `ChatModel’s default options and in the per-request options, **the per-request tool list replaces the defaults entirely**:

```java
ChatModel chatModel = OllamaChatModel.builder()
    .options(ToolCallingChatOptions.builder()
        .toolCallbacks(defaultTools)  // 5 default tools
        .build())
    .build();

ChatOptions runtimeOptions = ToolCallingChatOptions.builder()
    .toolCallbacks(otherTool)          // 1 tool
    .build();

ChatResponse response = chatModel.call(new Prompt("...", runtimeOptions));
// The model sees ONLY otherTool — defaultTools were replaced, not appended.
```

To use defaults plus an extra tool on a single request, include the defaults explicitly in the runtime options:

```java
List<ToolCallback> combined = new ArrayList<>(Arrays.asList(defaultTools));
combined.add(otherTool);

ChatOptions runtimeOptions = ToolCallingChatOptions.builder()
    .toolCallbacks(combined)
    .build();
```

> [!NOTE]
> This override behavior is specific to the `ChatModel` API. When using `ChatClient`, per-call `.tools(…​)` **appends** to `.defaultTools(…​)` — the two layers compose naturally. See [Passing Tools to ChatClient](../tools.md#passing-tools).

<a id="driving-the-loop-manually"></a>

## Driving the Loop Manually

When the model returns a response with tool calls, you execute the tools and call the model again with the results. This is the loop that `ToolCallingAdvisor` runs automatically for `ChatClient`. With `ChatModel`, you write it yourself.

<a id="blocking-loop"></a>

### Blocking

```java
ChatModel chatModel = ...
ToolCallingManager toolCallingManager = ToolCallingManager.builder().build();

ToolCallback[] tools = ToolCallbacks.from(new WeatherTools());
ChatOptions chatOptions = ToolCallingChatOptions.builder()
    .toolCallbacks(tools)
    .build();

Prompt prompt = new Prompt("What is the weather in Amsterdam and Paris?", chatOptions);
ChatResponse response = chatModel.call(prompt);

while (response.hasToolCalls()) {
    ToolExecutionResult result = toolCallingManager.executeToolCalls(prompt, response);

    if (result.returnDirect()) {
        // Tool's returnDirect=true — break out without sending back to the model
        return result.conversationHistory();
    }

    prompt = new Prompt(result.conversationHistory(), chatOptions);
    response = chatModel.call(prompt);
}

String finalAnswer = response.getResult().getOutput().getText();
```

Key components:

- `ToolCallingManager` — executes tool calls. The default `DefaultToolCallingManager` is auto-configured by Spring Boot. Build one manually with `ToolCallingManager.builder().build()` when you’re not using auto-configuration.
- `response.hasToolCalls()` — `true` if the model requested at least one tool.
- `toolCallingManager.executeToolCalls(prompt, response)` — looks up each requested tool, executes it, and returns a `ToolExecutionResult` containing the updated conversation history.
- `result.returnDirect()` — `true` if **all** the called tools have `returnDirect = true`. See [Return Direct](#return-direct).
- `result.conversationHistory()` — the original messages plus the assistant’s tool-call request and the tool responses. Use this as the next prompt’s messages.

<a id="streaming-loop"></a>

### Streaming

The streaming variant aggregates each iteration’s chunks via `ChatClientMessageAggregator` before checking for tool calls. You can forward the raw chunk stream to a downstream subscriber (e.g. an SSE endpoint) while aggregating:

```java
ChatModel chatModel = ...
ToolCallingManager toolCallingManager = ToolCallingManager.builder().build();

ToolCallback[] tools = ToolCallbacks.from(new WeatherTools());
ChatOptions chatOptions = ToolCallingChatOptions.builder()
    .toolCallbacks(tools)
    .build();

Prompt prompt = new Prompt("What is the weather in Amsterdam and Paris?", chatOptions);

while (true) {
    AtomicReference<ChatResponse> aggregated = new AtomicReference<>();

    new MessageAggregator().aggregate(
        chatModel.stream(prompt).doOnNext(chunk -> forwardToSse(chunk)),
        aggregated::set
    ).blockLast();

    ChatResponse response = aggregated.get();
    if (!response.hasToolCalls()) {
        break;
    }

    ToolExecutionResult result = toolCallingManager.executeToolCalls(prompt, response);
    if (result.returnDirect()) {
        break;
    }
    prompt = new Prompt(result.conversationHistory(), chatOptions);
}
```

For `ChatClient`-driven streaming with full advisor composition, see [ToolCallingAdvisor: User-Controlled Streaming](tool-calling-advisor.md#user-controlled-streaming).

<a id="tool-context"></a>

## Tool Context

Tool context — non-model data passed to tool methods — works the same way with `ChatModel` as with `ChatClient`. Set it via `ToolCallingChatOptions`:

```java
ChatOptions chatOptions = ToolCallingChatOptions.builder()
    .toolCallbacks(ToolCallbacks.from(new CustomerTools()))
    .toolContext(Map.of("tenantId", "acme"))
    .build();

Prompt prompt = new Prompt("Tell me about customer 42", chatOptions);
chatModel.call(prompt);
```

When both default and runtime `toolContext` are set, the resulting context is the **merge** of the two (unlike `toolCallbacks`, which is replaced) — runtime entries take precedence over defaults for matching keys.

See [Tool Context](../tools.md#tool-context) for the tool-side API.

<a id="return-direct"></a>

## Return Direct

`returnDirect` flags are honored by `ToolCallingManager.executeToolCalls(…​)`. After execution, check `ToolExecutionResult.returnDirect()`:

```java
ToolExecutionResult result = toolCallingManager.executeToolCalls(prompt, response);

if (result.returnDirect()) {
    // Skip the next model call — return the tool result to the caller
    return result.conversationHistory();
}
```

If the model requested multiple tool calls in a single iteration, `returnDirect()` is `true` only if **all** the called tools have `returnDirect = true`. See [Return Direct](../tools.md#return-direct) for declaring the flag on a tool.

<a id="see-also"></a>

## See Also

- [Tool Calling](../tools.md) — the recommended `ChatClient`-based path
- [`ToolCallingAdvisor`](tool-calling-advisor.md) — the advisor that runs the loop for `ChatClient`
- [User-Controlled Streaming with ChatClient](tool-calling-advisor.md#user-controlled-streaming) — analogous pattern with the advisor chain still in place
- [Upgrading Tool Calling from 1.x to 2.0](../../upgrade-notes.md#tool-calling-1x-to-2x)
