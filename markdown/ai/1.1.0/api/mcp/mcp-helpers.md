---
title: "MCP Utilities"
source: "ROOT:api/mcp/mcp-helpers.adoc"
---

# MCP Utilities

The MCP utilities provide foundational support for integrating Model Context Protocol with Spring AI applications.
These utilities enable seamless communication between Spring AI’s tool system and MCP servers, supporting both synchronous and asynchronous operations.
They are typically used for programmatic MCP Client and Server configuration and interaction.
For a more streamlined configuration, consider using the boot starters.

<a id="_toolcallback_utility"></a>

## ToolCallback Utility

<a id="_tool_callback_adapter"></a>

### Tool Callback Adapter

Adapts MCP tools to Spring AI’s tool interface with both synchronous and asynchronous execution support.

#### Sync

```java
McpSyncClient mcpClient = // obtain MCP client
Tool mcpTool = // obtain MCP tool definition
ToolCallback callback = new SyncMcpToolCallback(mcpClient, mcpTool);

// Use the tool through Spring AI's interfaces
ToolDefinition definition = callback.getToolDefinition();
String result = callback.call("{\"param\": \"value\"}");
```

#### Async

```java
McpAsyncClient mcpClient = // obtain MCP client
Tool mcpTool = // obtain MCP tool definition
ToolCallback callback = new AsyncMcpToolCallback(mcpClient, mcpTool);

// Use the tool through Spring AI's interfaces
ToolDefinition definition = callback.getToolDefinition();
String result = callback.call("{\"param\": \"value\"}");
```

<a id="_tool_callback_providers"></a>

### Tool Callback Providers

Discovers and provides MCP tools from MCP clients.

#### Sync

```java
McpSyncClient mcpClient = // obtain MCP client
ToolCallbackProvider provider = new SyncMcpToolCallbackProvider(mcpClient);

// Get all available tools
ToolCallback[] tools = provider.getToolCallbacks();
```

For multiple clients:

```java
List<McpSyncClient> clients = // obtain list of clients
List<ToolCallback> callbacks = SyncMcpToolCallbackProvider.syncToolCallbacks(clients);
```

For dynamic selection of a subset of clients

```java
@Autowired
private List<McpSyncClient> mcpSyncClients;

public ToolCallbackProvider buildProvider(Set<String> allowedServerNames) {
    // Filter by server.name().
    List<McpSyncClient> selected = mcpSyncClients.stream()
        .filter(c -> allowedServerNames.contains(c.getServerInfo().name()))
        .toList();

    return new SyncMcpToolCallbackProvider(selected);
}

```

#### Async

```java
McpAsyncClient mcpClient = // obtain MCP client
ToolCallbackProvider provider = new AsyncMcpToolCallbackProvider(mcpClient);

// Get all available tools
ToolCallback[] tools = provider.getToolCallbacks();
```

For multiple clients:

```java
List<McpAsyncClient> clients = // obtain list of clients
Flux<ToolCallback> callbacks = AsyncMcpToolCallbackProvider.asyncToolCallbacks(clients);
```

<a id="_mcptoolutils"></a>

## McpToolUtils

<a id="_toolcallbacks_to_toolspecifications"></a>

### ToolCallbacks to ToolSpecifications

Converting Spring AI tool callbacks to MCP tool specifications:

#### Sync

```java
List<ToolCallback> toolCallbacks = // obtain tool callbacks
List<SyncToolSpecifications> syncToolSpecs = McpToolUtils.toSyncToolSpecifications(toolCallbacks);
```

then you can use the `McpServer.SyncSpecification` to register the tool specifications:

```java
McpServer.SyncSpecification syncSpec = ...
syncSpec.tools(syncToolSpecs);
```

#### Async

```java
List<ToolCallback> toolCallbacks = // obtain tool callbacks
List<AsyncToolSpecification> asyncToolSpecifications = McpToolUtils.toAsyncToolSpecifications(toolCallbacks);
```

then you can use the `McpServer.AsyncSpecification` to register the tool specifications:

```java
McpServer.AsyncSpecification asyncSpec = ...
asyncSpec.tools(asyncToolSpecifications);
```

<a id="_mcp_clients_to_toolcallbacks"></a>

### MCP Clients to ToolCallbacks

Getting tool callbacks from MCP clients

#### Sync

```java
List<McpSyncClient> syncClients = // obtain sync clients
List<ToolCallback> syncCallbacks = McpToolUtils.getToolCallbacksFromSyncClients(syncClients);
```

#### Async

```java
List<McpAsyncClient> asyncClients = // obtain async clients
List<ToolCallback> asyncCallbacks = McpToolUtils.getToolCallbacksFromAsyncClients(asyncClients);
```

<a id="_native_image_support"></a>

## Native Image Support

The `McpHints` class provides GraalVM native image hints for MCP schema classes.
This class automatically registers all necessary reflection hints for MCP schema classes when building native images.
