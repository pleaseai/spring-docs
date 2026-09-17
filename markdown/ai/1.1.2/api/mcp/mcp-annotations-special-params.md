---
title: "MCP Annotations Special Parameters"
source: "ROOT:api/mcp/mcp-annotations-special-params.adoc"
---

# MCP Annotations Special Parameters

The MCP Annotations support several special parameter types that provide additional context and functionality to annotated methods.
These parameters are automatically injected by the framework and are excluded from JSON schema generation.

<a id="_special_parameter_types"></a>

## Special Parameter Types

<a id="_mcpmeta"></a>

### McpMeta

The `McpMeta` class provides access to metadata from MCP requests, notifications, and results.

<a id="_overview"></a>

#### Overview

- Automatically injected when used as a method parameter
- Excluded from parameter count limits and JSON schema generation
- Provides convenient access to metadata through the `get(String key)` method
- If no metadata is present in the request, an empty `McpMeta` object is injected

<a id="_usage_in_tools"></a>

#### Usage in Tools

```java
@McpTool(name = "contextual-tool", description = "Tool with metadata access")
public String processWithContext(
        @McpToolParam(description = "Input data", required = true) String data,
        McpMeta meta) {

    // Access metadata from the request
    String userId = (String) meta.get("userId");
    String sessionId = (String) meta.get("sessionId");
    String userRole = (String) meta.get("userRole");

    // Use metadata to customize behavior
    if ("admin".equals(userRole)) {
        return processAsAdmin(data, userId);
    } else {
        return processAsUser(data, userId);
    }
}
```

<a id="_usage_in_resources"></a>

#### Usage in Resources

```java
@McpResource(uri = "secure-data://{id}", name = "Secure Data")
public ReadResourceResult getSecureData(String id, McpMeta meta) {

    String requestingUser = (String) meta.get("requestingUser");
    String accessLevel = (String) meta.get("accessLevel");

    // Check access permissions using metadata
    if (!"admin".equals(accessLevel)) {
        return new ReadResourceResult(List.of(
            new TextResourceContents("secure-data://" + id,
                "text/plain", "Access denied")
        ));
    }

    String data = loadSecureData(id);
    return new ReadResourceResult(List.of(
        new TextResourceContents("secure-data://" + id,
            "text/plain", data)
    ));
}
```

<a id="_usage_in_prompts"></a>

#### Usage in Prompts

```java
@McpPrompt(name = "localized-prompt", description = "Localized prompt generation")
public GetPromptResult localizedPrompt(
        @McpArg(name = "topic", required = true) String topic,
        McpMeta meta) {

    String language = (String) meta.get("language");
    String region = (String) meta.get("region");

    // Generate localized content based on metadata
    String message = generateLocalizedMessage(topic, language, region);

    return new GetPromptResult("Localized Prompt",
        List.of(new PromptMessage(Role.ASSISTANT, new TextContent(message)))
    );
}
```

<a id="_mcpprogresstoken"></a>

### @McpProgressToken

The `@McpProgressToken` annotation marks a parameter to receive progress tokens from MCP requests.

<a id="_overview_2"></a>

#### Overview

- Parameter type should be `String`
- Automatically receives the progress token value from the request
- Excluded from the generated JSON schema
- If no progress token is present, `null` is injected
- Used for tracking long-running operations

<a id="_usage_in_tools_2"></a>

#### Usage in Tools

```java
@McpTool(name = "long-operation", description = "Long-running operation with progress")
public String performLongOperation(
        @McpProgressToken String progressToken,
        @McpToolParam(description = "Operation name", required = true) String operation,
        @McpToolParam(description = "Duration in seconds", required = true) int duration,
        McpSyncServerExchange exchange) {

    if (progressToken != null) {
        // Send initial progress
        exchange.progressNotification(new ProgressNotification(
            progressToken, 0.0, 1.0, "Starting " + operation));

        // Simulate work with progress updates
        for (int i = 1; i <= duration; i++) {
            Thread.sleep(1000);
            double progress = (double) i / duration;

            exchange.progressNotification(new ProgressNotification(
                progressToken, progress, 1.0,
                String.format("Processing... %d%%", (int)(progress * 100))));
        }
    }

    return "Operation " + operation + " completed";
}
```

<a id="_usage_in_resources_2"></a>

#### Usage in Resources

```java
@McpResource(uri = "large-file://{path}", name = "Large File Resource")
public ReadResourceResult getLargeFile(
        @McpProgressToken String progressToken,
        String path,
        McpSyncServerExchange exchange) {

    File file = new File(path);
    long fileSize = file.length();

    if (progressToken != null) {
        // Track file reading progress
        exchange.progressNotification(new ProgressNotification(
            progressToken, 0.0, fileSize, "Reading file"));
    }

    String content = readFileWithProgress(file, progressToken, exchange);

    if (progressToken != null) {
        exchange.progressNotification(new ProgressNotification(
            progressToken, fileSize, fileSize, "File read complete"));
    }

    return new ReadResourceResult(List.of(
        new TextResourceContents("large-file://" + path, "text/plain", content)
    ));
}
```

<a id="_mcpsyncrequestcontext_mcpasyncrequestcontext"></a>

### McpSyncRequestContext / McpAsyncRequestContext

Request context objects provide unified access to MCP request information and server-side operations.

<a id="_overview_3"></a>

#### Overview

- Provides unified interface for both stateful and stateless operations
- Automatically injected when used as a parameter
- Excluded from JSON schema generation
- Enables advanced features like logging, progress notifications, sampling, and elicitation
- Works with both stateful (server exchange) and stateless (transport context) modes

<a id="_mcpsyncrequestcontext_features"></a>

#### McpSyncRequestContext Features

```java
public record UserInfo(String name, String email, int age) {}

@McpTool(name = "advanced-tool", description = "Tool with full server capabilities")
public String advancedTool(
        McpSyncRequestContext context,
        @McpToolParam(description = "Input", required = true) String input) {

    // Send logging notification
    context.info("Processing: " + input);

    // Ping the client
    context.ping();

    // Send progress updates
    context.progress(50); // 50% complete

    // Check if elicitation is supported before using it
    if (context.elicitEnabled()) {
        // Request additional information from user
        StructuredElicitResult<UserInfo> elicitResult = context.elicit(
            e -> e.message("Need additional information"),
            UserInfo.class
        );

        if (elicitResult.action() == ElicitResult.Action.ACCEPT) {
            UserInfo userInfo = elicitResult.structuredContent();
            // Use the user information
        }
    }

    // Check if sampling is supported before using it
    if (context.sampleEnabled()) {
        // Request LLM sampling
        CreateMessageResult samplingResult = context.sample(
            s -> s.message("Process: " + input)
                .modelPreferences(pref -> pref.modelHints("gpt-4"))
        );
    }

    return "Processed with advanced features";
}
```

<a id="_mcpasyncrequestcontext_features"></a>

#### McpAsyncRequestContext Features

```java
public record UserInfo(String name, String email, int age) {}

@McpTool(name = "async-advanced-tool", description = "Async tool with server capabilities")
public Mono<String> asyncAdvancedTool(
        McpAsyncRequestContext context,
        @McpToolParam(description = "Input", required = true) String input) {

    return context.info("Async processing: " + input)
        .then(context.progress(25))
        .then(context.ping())
        .flatMap(v -> {
            // Perform elicitation if supported
            if (context.elicitEnabled()) {
                return context.elicitation(UserInfo.class)
                    .map(userInfo -> "Processing for user: " + userInfo.name());
            }
            return Mono.just("Processing...");
        })
        .flatMap(msg -> {
            // Perform sampling if supported
            if (context.sampleEnabled()) {
                return context.sampling("Process: " + input)
                    .map(result -> "Completed: " + result);
            }
            return Mono.just("Completed: " + msg);
        });
}
```

<a id="_mcptransportcontext"></a>

### McpTransportContext

Lightweight context for stateless operations.

<a id="_overview_4"></a>

#### Overview

- Provides minimal context without full server exchange
- Used in stateless implementations
- Automatically injected when used as a parameter
- Excluded from JSON schema generation

<a id="_usage_example"></a>

#### Usage Example

```java
@McpTool(name = "stateless-tool", description = "Stateless tool with context")
public String statelessTool(
        McpTransportContext context,
        @McpToolParam(description = "Input", required = true) String input) {

    // Limited context access
    // Useful for transport-level operations

    return "Processed in stateless mode: " + input;
}

@McpResource(uri = "stateless://{id}", name = "Stateless Resource")
public ReadResourceResult statelessResource(
        McpTransportContext context,
        String id) {

    // Access transport context if needed
    String data = loadData(id);

    return new ReadResourceResult(List.of(
        new TextResourceContents("stateless://" + id, "text/plain", data)
    ));
}
```

<a id="_calltoolrequest"></a>

### CallToolRequest

Special parameter for tools that need access to the full request with dynamic schema.

<a id="_overview_5"></a>

#### Overview

- Provides access to the complete tool request
- Enables dynamic schema handling at runtime
- Automatically injected and excluded from schema generation
- Useful for flexible tools that adapt to different input schemas

<a id="_usage_examples"></a>

#### Usage Examples

```java
@McpTool(name = "dynamic-tool", description = "Tool with dynamic schema support")
public CallToolResult processDynamicSchema(CallToolRequest request) {
    Map<String, Object> args = request.arguments();

    // Process based on whatever schema was provided at runtime
    StringBuilder result = new StringBuilder("Processed:\n");

    for (Map.Entry<String, Object> entry : args.entrySet()) {
        result.append("  ").append(entry.getKey())
              .append(": ").append(entry.getValue()).append("\n");
    }

    return CallToolResult.builder()
        .addTextContent(result.toString())
        .build();
}
```

<a id="_mixed_parameters"></a>

#### Mixed Parameters

```java
@McpTool(name = "hybrid-tool", description = "Tool with typed and dynamic parameters")
public String processHybrid(
        @McpToolParam(description = "Operation", required = true) String operation,
        @McpToolParam(description = "Priority", required = false) Integer priority,
        CallToolRequest request) {

    // Use typed parameters for known fields
    String result = "Operation: " + operation;
    if (priority != null) {
        result += " (Priority: " + priority + ")";
    }

    // Access additional dynamic arguments
    Map<String, Object> allArgs = request.arguments();

    // Remove known parameters to get only additional ones
    Map<String, Object> additionalArgs = new HashMap<>(allArgs);
    additionalArgs.remove("operation");
    additionalArgs.remove("priority");

    if (!additionalArgs.isEmpty()) {
        result += " with " + additionalArgs.size() + " additional parameters";
    }

    return result;
}
```

<a id="_with_progress_token"></a>

#### With Progress Token

```java
@McpTool(name = "flexible-with-progress", description = "Flexible tool with progress")
public CallToolResult flexibleWithProgress(
        @McpProgressToken String progressToken,
        CallToolRequest request,
        McpSyncServerExchange exchange) {

    Map<String, Object> args = request.arguments();

    if (progressToken != null) {
        exchange.progressNotification(new ProgressNotification(
            progressToken, 0.0, 1.0, "Processing dynamic request"));
    }

    // Process dynamic arguments
    String result = processDynamicArgs(args);

    if (progressToken != null) {
        exchange.progressNotification(new ProgressNotification(
            progressToken, 1.0, 1.0, "Complete"));
    }

    return CallToolResult.builder()
        .addTextContent(result)
        .build();
}
```

<a id="_parameter_injection_rules"></a>

## Parameter Injection Rules

<a id="_automatic_injection"></a>

### Automatic Injection

The following parameters are automatically injected by the framework:

1. `McpMeta` - Metadata from the request
1. `@McpProgressToken String` - Progress token if available
1. `McpSyncServerExchange` / `McpAsyncServerExchange` - Server exchange context
1. `McpTransportContext` - Transport context for stateless operations
1. `CallToolRequest` - Full tool request for dynamic schema

<a id="_schema_generation"></a>

### Schema Generation

Special parameters are excluded from JSON schema generation:

- They don’t appear in the tool’s input schema
- They don’t count towards parameter limits
- They’re not visible to MCP clients

<a id="_null_handling"></a>

### Null Handling

- `McpMeta` - Never null, empty object if no metadata
- `@McpProgressToken` - Can be null if no token provided
- Server exchanges - Never null when properly configured
- `CallToolRequest` - Never null for tool methods

<a id="_best_practices"></a>

## Best Practices

<a id="_use_mcpmeta_for_context"></a>

### Use McpMeta for Context

```java
@McpTool(name = "context-aware", description = "Context-aware tool")
public String contextAware(
        @McpToolParam(description = "Data", required = true) String data,
        McpMeta meta) {

    // Always check for null values in metadata
    String userId = (String) meta.get("userId");
    if (userId == null) {
        userId = "anonymous";
    }

    return processForUser(data, userId);
}
```

<a id="_progress_token_null_checks"></a>

### Progress Token Null Checks

```java
@McpTool(name = "safe-progress", description = "Safe progress handling")
public String safeProgress(
        @McpProgressToken String progressToken,
        @McpToolParam(description = "Task", required = true) String task,
        McpSyncServerExchange exchange) {

    // Always check if progress token is available
    if (progressToken != null) {
        exchange.progressNotification(new ProgressNotification(
            progressToken, 0.0, 1.0, "Starting"));
    }

    // Perform work...

    if (progressToken != null) {
        exchange.progressNotification(new ProgressNotification(
            progressToken, 1.0, 1.0, "Complete"));
    }

    return "Task completed";
}
```

<a id="_choose_the_right_context"></a>

### Choose the Right Context

- Use `McpSyncRequestContext` / `McpAsyncRequestContext` for unified access to request context, supporting both stateful and stateless operations with convenient helper methods
- Use `McpTransportContext` for simple stateless operations when you only need transport-level context
- Omit context parameters entirely for the simplest cases

<a id="_capability_checking"></a>

### Capability Checking

Always check capability support before using client features:

```java
@McpTool(name = "capability-aware", description = "Tool that checks capabilities")
public String capabilityAware(
        McpSyncRequestContext context,
        @McpToolParam(description = "Data", required = true) String data) {

    // Check if elicitation is supported before using it
    if (context.elicitEnabled()) {
        // Safe to use elicitation
        var result = context.elicit(UserInfo.class);
        // Process result...
    }

    // Check if sampling is supported before using it
    if (context.sampleEnabled()) {
        // Safe to use sampling
        var samplingResult = context.sample("Process: " + data);
        // Process result...
    }

    // Note: Stateless servers do not support bidirectional operations
    // (roots, elicitation, sampling) and will return false for these checks

    return "Processed with capability awareness";
}
```

<a id="_additional_resources"></a>

## Additional Resources

- [MCP Annotations Overview](mcp-annotations-overview.md)
- [Server Annotations](mcp-annotations-server.md)
- [Client Annotations](mcp-annotations-client.md)
- [Examples](mcp-annotations-examples.md)
