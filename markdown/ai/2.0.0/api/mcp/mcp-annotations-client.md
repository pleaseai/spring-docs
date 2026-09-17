---
title: "MCP Client Annotations"
source: "ROOT:api/mcp/mcp-annotations-client.adoc"
---

# MCP Client Annotations

The MCP Client Annotations provide a declarative way to implement MCP client handlers using Java annotations.
These annotations simplify the handling of server notifications and client-side operations.

> [!IMPORTANT]
> **All MCP client annotations MUST include a `clients` parameter** to associate the handler with a specific MCP client connection. The `clients` must match the connection name configured in your application properties.

<a id="_client_annotations"></a>

## Client Annotations

<a id="_mcplogging"></a>

### @McpLogging

The `@McpLogging` annotation handles logging message notifications from MCP servers.

<a id="_basic_usage"></a>

#### Basic Usage

```java
@Component
public class LoggingHandler {

    @McpLogging(clients = "my-mcp-server")
    public void handleLoggingMessage(LoggingMessageNotification notification) {
        System.out.println("Received log: " + notification.level() +
                          " - " + notification.data());
    }
}
```

<a id="_with_individual_parameters"></a>

#### With Individual Parameters

```java
@McpLogging(clients = "my-mcp-server")
public void handleLoggingWithParams(LoggingLevel level, String logger, String data) {
    System.out.println(String.format("[%s] %s: %s", level, logger, data));
}
```

<a id="_mcpsampling"></a>

### @McpSampling

The `@McpSampling` annotation handles sampling requests from MCP servers for LLM completions.

<a id="_synchronous_implementation"></a>

#### Synchronous Implementation

```java
@Component
public class SamplingHandler {

    @McpSampling(clients = "llm-server")
    public CreateMessageResult handleSamplingRequest(CreateMessageRequest request) {
        // Process the request and generate a response
        String response = generateLLMResponse(request);

        return CreateMessageResult.builder(Role.ASSISTANT, response, "gpt-4")
            .build();
    }
}
```

<a id="_asynchronous_implementation"></a>

#### Asynchronous Implementation

```java
@Component
public class AsyncSamplingHandler {

    @McpSampling(clients = "llm-server")
    public Mono<CreateMessageResult> handleAsyncSampling(CreateMessageRequest request) {
        return Mono.fromCallable(() -> {
            String response = generateLLMResponse(request);

            return CreateMessageResult.builder(Role.ASSISTANT, response, "gpt-4")
                .build();
        }).subscribeOn(Schedulers.boundedElastic());
    }
}
```

<a id="_mcpelicitation"></a>

### @McpElicitation

The `@McpElicitation` annotation handles elicitation requests to gather additional information from users.

<a id="_basic_usage_2"></a>

#### Basic Usage

```java
@Component
public class ElicitationHandler {

    @McpElicitation(clients = "interactive-server")
    public ElicitResult handleElicitationRequest(ElicitRequest request) {
        // Present the request to the user and gather input
        Map<String, Object> userData = presentFormToUser(request.requestedSchema());

        if (userData != null) {
            return new ElicitResult(ElicitResult.Action.ACCEPT, userData);
        } else {
            return new ElicitResult(ElicitResult.Action.DECLINE, null);
        }
    }
}
```

<a id="_with_user_interaction"></a>

#### With User Interaction

```java
@McpElicitation(clients = "interactive-server")
public ElicitResult handleInteractiveElicitation(ElicitRequest request) {
    Map<String, Object> schema = request.requestedSchema();
    Map<String, Object> userData = new HashMap<>();

    // Check what information is being requested
    if (schema != null && schema.containsKey("properties")) {
        Map<String, Object> properties = (Map<String, Object>) schema.get("properties");

        // Gather user input based on schema
        if (properties.containsKey("name")) {
            userData.put("name", promptUser("Enter your name:"));
        }
        if (properties.containsKey("email")) {
            userData.put("email", promptUser("Enter your email:"));
        }
        if (properties.containsKey("preferences")) {
            userData.put("preferences", gatherPreferences());
        }
    }

    return new ElicitResult(ElicitResult.Action.ACCEPT, userData);
}
```

<a id="_async_elicitation"></a>

#### Async Elicitation

```java
@McpElicitation(clients = "interactive-server")
public Mono<ElicitResult> handleAsyncElicitation(ElicitRequest request) {
    return Mono.fromCallable(() -> {
        // Async user interaction
        Map<String, Object> userData = asyncGatherUserInput(request);
        return new ElicitResult(ElicitResult.Action.ACCEPT, userData);
    }).timeout(Duration.ofSeconds(30))
      .onErrorReturn(new ElicitResult(ElicitResult.Action.CANCEL, null));
}
```

<a id="_mcpprogress"></a>

### @McpProgress

The `@McpProgress` annotation handles progress notifications for long-running operations.

<a id="_basic_usage_3"></a>

#### Basic Usage

```java
@Component
public class ProgressHandler {

    @McpProgress(clients = "my-mcp-server")
    public void handleProgressNotification(ProgressNotification notification) {
        double percentage = notification.progress() * 100;
        System.out.println(String.format("Progress: %.2f%% - %s",
            percentage, notification.message()));
    }
}
```

<a id="_with_individual_parameters_2"></a>

#### With Individual Parameters

```java
@McpProgress(clients = "my-mcp-server")
public void handleProgressWithDetails(
        String progressToken,
        double progress,
        Double total,
        String message) {

    if (total != null) {
        System.out.println(String.format("[%s] %.0f/%.0f - %s",
            progressToken, progress, total, message));
    } else {
        System.out.println(String.format("[%s] %.2f%% - %s",
            progressToken, progress * 100, message));
    }

    // Update UI progress bar
    updateProgressBar(progressToken, progress);
}
```

<a id="_client_specific_progress"></a>

#### Client-Specific Progress

```java
@McpProgress(clients = "long-running-server")
public void handleLongRunningProgress(ProgressNotification notification) {
    // Track progress for specific server
    progressTracker.update("long-running-server", notification);

    // Send notifications if needed
    if (notification.progress() >= 1.0) {
        notifyCompletion(notification.progressToken());
    }
}
```

<a id="_mcptoollistchanged"></a>

### @McpToolListChanged

The `@McpToolListChanged` annotation handles notifications when the server’s tool list changes.

<a id="_basic_usage_4"></a>

#### Basic Usage

```java
@Component
public class ToolListChangedHandler {

    @McpToolListChanged(clients = "tool-server")
    public void handleToolListChanged(List<McpSchema.Tool> updatedTools) {
        System.out.println("Tool list updated: " + updatedTools.size() + " tools available");

        // Update local tool registry
        toolRegistry.updateTools(updatedTools);

        // Log new tools
        for (McpSchema.Tool tool : updatedTools) {
            System.out.println("  - " + tool.name() + ": " + tool.description());
        }
    }
}
```

<a id="_async_handling"></a>

#### Async Handling

```java
@McpToolListChanged(clients = "tool-server")
public Mono<Void> handleAsyncToolListChanged(List<McpSchema.Tool> updatedTools) {
    return Mono.fromRunnable(() -> {
        // Process tool list update asynchronously
        processToolListUpdate(updatedTools);

        // Notify interested components
        eventBus.publish(new ToolListUpdatedEvent(updatedTools));
    }).then();
}
```

<a id="_client_specific_tool_updates"></a>

#### Client-Specific Tool Updates

```java
@McpToolListChanged(clients = "dynamic-server")
public void handleDynamicServerToolUpdate(List<McpSchema.Tool> updatedTools) {
    // Handle tools from a specific server that frequently changes its tools
    dynamicToolManager.updateServerTools("dynamic-server", updatedTools);

    // Re-evaluate tool availability
    reevaluateToolCapabilities();
}
```

<a id="_mcpresourcelistchanged"></a>

### @McpResourceListChanged

The `@McpResourceListChanged` annotation handles notifications when the server’s resource list changes.

<a id="_basic_usage_5"></a>

#### Basic Usage

```java
@Component
public class ResourceListChangedHandler {

    @McpResourceListChanged(clients = "resource-server")
    public void handleResourceListChanged(List<McpSchema.Resource> updatedResources) {
        System.out.println("Resources updated: " + updatedResources.size());

        // Update resource cache
        resourceCache.clear();
        for (McpSchema.Resource resource : updatedResources) {
            resourceCache.register(resource);
        }
    }
}
```

<a id="_with_resource_analysis"></a>

#### With Resource Analysis

```java
@McpResourceListChanged(clients = "resource-server")
public void analyzeResourceChanges(List<McpSchema.Resource> updatedResources) {
    // Analyze what changed
    Set<String> newUris = updatedResources.stream()
        .map(McpSchema.Resource::uri)
        .collect(Collectors.toSet());

    Set<String> removedUris = previousUris.stream()
        .filter(uri -> !newUris.contains(uri))
        .collect(Collectors.toSet());

    if (!removedUris.isEmpty()) {
        handleRemovedResources(removedUris);
    }

    // Update tracking
    previousUris = newUris;
}
```

<a id="_mcppromptlistchanged"></a>

### @McpPromptListChanged

The `@McpPromptListChanged` annotation handles notifications when the server’s prompt list changes.

<a id="_basic_usage_6"></a>

#### Basic Usage

```java
@Component
public class PromptListChangedHandler {

    @McpPromptListChanged(clients = "prompt-server")
    public void handlePromptListChanged(List<McpSchema.Prompt> updatedPrompts) {
        System.out.println("Prompts updated: " + updatedPrompts.size());

        // Update prompt catalog
        promptCatalog.updatePrompts(updatedPrompts);

        // Refresh UI if needed
        if (uiController != null) {
            uiController.refreshPromptList(updatedPrompts);
        }
    }
}
```

<a id="_async_processing"></a>

#### Async Processing

```java
@McpPromptListChanged(clients = "prompt-server")
public Mono<Void> handleAsyncPromptUpdate(List<McpSchema.Prompt> updatedPrompts) {
    return Flux.fromIterable(updatedPrompts)
        .flatMap(prompt -> validatePrompt(prompt))
        .collectList()
        .doOnNext(validPrompts -> {
            promptRepository.saveAll(validPrompts);
        })
        .then();
}
```

<a id="_spring_boot_integration"></a>

## Spring Boot Integration

With Spring Boot auto-configuration, client handlers are automatically detected and registered:

```java
@SpringBootApplication
public class McpClientApplication {
    public static void main(String[] args) {
        SpringApplication.run(McpClientApplication.class, args);
    }
}

@Component
public class MyClientHandlers {

    @McpLogging(clients = "my-server")
    public void handleLogs(LoggingMessageNotification notification) {
        // Handle logs
    }

    @McpSampling(clients = "my-server")
    public CreateMessageResult handleSampling(CreateMessageRequest request) {
        // Handle sampling
    }

    @McpProgress(clients = "my-server")
    public void handleProgress(ProgressNotification notification) {
        // Handle progress
    }
}
```

The auto-configuration will:

1. Scan for beans with MCP client annotations
1. Create appropriate specifications
1. Register them with the MCP client
1. Support both sync and async implementations
1. Handle multiple clients with client-specific handlers

<a id="_configuration_properties"></a>

## Configuration Properties

Configure the client annotation scanner and client connections:

```yaml
spring:
  ai:
    mcp:
      client:
        type: SYNC  # or ASYNC
        annotation-scanner:
          enabled: true
        # Configure client connections - the connection names become clients values
        sse:
          connections:
            my-server:  # This becomes the clients
              url: http://localhost:8080
            tool-server:  # Another clients
              url: http://localhost:8081
        stdio:
          connections:
            local-server:  # This becomes the clients
              command: /path/to/mcp-server
              args:
                - --mode=production
```

> [!IMPORTANT]
> The `clients` parameter in annotations must match the connection names defined in your configuration. In the example above, valid `clients` values would be: `"my-server"`, `"tool-server"`, and `"local-server"`.

<a id="_usage_with_mcp_client"></a>

## Usage with MCP Client

The annotated handlers are automatically integrated with the MCP client:

```java
@Autowired
private List<McpSyncClient> mcpClients;

// The clients will automatically use your annotated handlers based on clients
// No manual registration needed - handlers are matched to clients by name
```

For each MCP client connection, handlers with matching `clients` will be automatically registered and invoked when the corresponding events occur.

<a id="_additional_resources"></a>

## Additional Resources

- [MCP Annotations Overview](mcp-annotations-overview.md)
- [Server Annotations](mcp-annotations-server.md)
- [Special Parameters](mcp-annotations-special-params.md)
- [MCP Client Boot Starter](mcp-client-boot-starter-docs.md)
