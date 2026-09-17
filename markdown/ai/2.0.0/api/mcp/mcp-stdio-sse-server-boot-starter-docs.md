---
title: "STDIO and SSE MCP Servers"
source: "ROOT:api/mcp/mcp-stdio-sse-server-boot-starter-docs.adoc"
---

# STDIO and SSE MCP Servers

<a id="_stdio_and_sse_mcp_servers"></a>

## STDIO and SSE MCP Servers

The STDIO and SSE MCP Servers support multiple transport mechanisms, each with its dedicated starter.

> [!TIP]
> Use the [STDIO clients](mcp-client-boot-starter-docs.md#_stdio_transport_properties)  or [SSE clients](mcp-client-boot-starter-docs.md#_sse_transport_properties) to connect to the STDIO and SSE servers.

<a id="_stdio_mcp_server"></a>

### STDIO MCP Server

Full MCP Server feature support with `STDIO` server transport.

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server</artifactId>
</dependency>
```

- Suitable for command-line and desktop tools
- No additional web dependencies required
- Configuration of basic server components
- Handling of tool, resource, and prompt specifications
- Management of server capabilities and change notifications
- Support for both sync and async server implementations

<a id="_sse_webmvc_server"></a>

### SSE WebMVC Server

Full MCP Server feature support with `SSE` (Server-Sent Events) server transport based on Spring MVC and an optional `STDIO` transport.

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server-webmvc</artifactId>
</dependency>
```

- HTTP-based transport using Spring MVC (`WebMvcSseServerTransportProvider`)
- Automatically configured SSE endpoints
- Optional `STDIO` transport (enabled by setting `spring.ai.mcp.server.stdio=true`)
- Includes `spring-boot-starter-web` and `org.springframework.ai:mcp-spring-webmvc` dependencies

<a id="_sse_webflux_server"></a>

### SSE WebFlux Server

Full MCP Server feature support with `SSE` (Server-Sent Events) server transport based on Spring WebFlux and an optional `STDIO` transport.

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server-webflux</artifactId>
</dependency>
```

The starter activates the `McpWebFluxServerAutoConfiguration` and `McpServerAutoConfiguration` auto-configurations to provide:

- Reactive transport using Spring WebFlux (`WebFluxSseServerTransportProvider`)
- Automatically configured reactive SSE endpoints
- Optional `STDIO` transport (enabled by setting `spring.ai.mcp.server.stdio=true`)
- Includes `spring-boot-starter-webflux` and `org.springframework.ai:mcp-spring-webflux` dependencies

> [!NOTE]
> Due to Spring Boot’s default behavior, when both `org.springframework.web.servlet.DispatcherServlet` and `org.springframework.web.reactive.DispatcherHandler` are present on the classpath, Spring Boot will prioritize `DispatcherServlet`. As a result, if your project uses `spring-boot-starter-web`, it is recommended to use `spring-ai-starter-mcp-server-webmvc` instead of `spring-ai-starter-mcp-server-webflux`.

<a id="_configuration_properties"></a>

## Configuration Properties

<a id="_common_properties"></a>

### Common Properties

All Common properties are prefixed with `spring.ai.mcp.server`:

| Property | Description | Default |
| --- | --- | --- |
| `enabled` | Enable/disable the MCP server | `true` |
| `tool-callback-converter` | Enable/disable the conversion of Spring AI ToolCallbacks into MCP Tool specs | `true` |
| `stdio` | Enable/disable STDIO transport | `false` |
| `name` | Server name for identification | `mcp-server` |
| `version` | Server version | `1.0.0` |
| `instructions` | Optional instructions to provide guidance to the client on how to interact with this server | `null` |
| `type` | Server type (SYNC/ASYNC) | `SYNC` |
| `capabilities.resource` | Enable/disable resource capabilities | `true` |
| `capabilities.tool` | Enable/disable tool capabilities | `true` |
| `capabilities.prompt` | Enable/disable prompt capabilities | `true` |
| `capabilities.completion` | Enable/disable completion capabilities | `true` |
| `resource-change-notification` | Enable resource change notifications | `true` |
| `prompt-change-notification` | Enable prompt change notifications | `true` |
| `tool-change-notification` | Enable tool change notifications | `true` |
| `expose-mcp-client-tools` | Whether to re-expose downstream MCP tools (provided by MCP clients) as tools in this MCP server | `false` |
| `tool-response-mime-type` | Optional response MIME type per tool name. For example, `spring.ai.mcp.server.tool-response-mime-type.generateImage=image/png` will associate the `image/png` MIME type with the `generateImage()` tool name | `-` |
| `request-timeout` | Duration to wait for server responses before timing out requests. Applies to all requests made through the client, including tool calls, resource access, and prompt operations | `20 seconds` |

<a id="_mcp_annotations_properties"></a>

### MCP Annotations Properties

MCP Server Annotations provide a declarative way to implement MCP server handlers using Java annotations.

The server mcp-annotations properties are prefixed with `spring.ai.mcp.server.annotation-scanner`:

| Property | Description | Default Value |
| --- | --- | --- |
| `enabled` | Enable/disable the MCP server annotations auto-scanning | `true` |

<a id="_sse_properties"></a>

### SSE Properties

All SSE properties are prefixed with `spring.ai.mcp.server`:

| Property | Description | Default |
| --- | --- | --- |
| `sse-message-endpoint` | Custom SSE message endpoint path for web transport to be used by the client to send messages | `/mcp/message` |
| `sse-endpoint` | Custom SSE endpoint path for web transport | `/sse` |
| `base-url` | Optional URL prefix. For example, `base-url=/api/v1` means that the client should access the SSE endpoint at `/api/v1` + `sse-endpoint` and the message endpoint is `/api/v1` + `sse-message-endpoint` | `-` |
| `keep-alive-interval` | Connection keep-alive interval | `null` (disabled) |

> [!NOTE]
> For backward compatibility reasons, the SSE properties do not have additional suffix (like `.sse`).

<a id="_features_and_capabilities"></a>

## Features and Capabilities

The MCP Server Boot Starter allows servers to expose tools, resources, and prompts to clients.
It automatically converts custom capability handlers registered as Spring beans to sync/async specifications based on the server type:

<a id="_tools"></a>

### [Tools](https://spec.modelcontextprotocol.io/specification/2024-11-05/server/tools/)

Allows servers to expose tools that can be invoked by language models. The MCP Server Boot Starter provides:

- Change notification support
- [Spring AI Tools](../tools.md) are automatically converted to sync/async specifications based on the server type
- Automatic tool specification through Spring beans:

```java
@Bean
public ToolCallbackProvider myTools(...) {
    List<ToolCallback> tools = ...
    return ToolCallbackProvider.from(tools);
}
```

or using the low-level API:

```java
@Bean
public List<McpServerFeatures.SyncToolSpecification> myTools(...) {
    List<McpServerFeatures.SyncToolSpecification> tools = ...
    return tools;
}
```

The auto-configuration will automatically detect and register all tool callbacks from:

- Individual `ToolCallback` beans
- Lists of `ToolCallback` beans
- `ToolCallbackProvider` beans

Tools are de-duplicated by name, with the first occurrence of each tool name being used.

> [!TIP]
> You can disable the automatic detection and registration of all tool callbacks by setting the `tool-callback-converter` to `false`.

<a id="_tool_context_support"></a>

#### Tool Context Support

The [ToolContext](../tools.md#_tool_context) is supported, allowing contextual information to be passed to tool calls. It contains an `McpSyncServerExchange` instance under the `exchange` key, accessible via `McpToolUtils.getMcpExchange(toolContext)`. See this [example](https://github.com/spring-projects/spring-ai-examples/blob/3fab8483b8deddc241b1e16b8b049616604b7767/model-context-protocol/sampling/mcp-weather-webmvc-server/src/main/java/org/springframework/ai/mcp/sample/server/WeatherService.java#L59-L126) demonstrating `exchange.loggingNotification(…​)` and `exchange.createMessage(…​)`.

<a id="_resources"></a>

### [Resources](https://spec.modelcontextprotocol.io/specification/2024-11-05/server/resources/)

Provides a standardized way for servers to expose resources to clients.

- Static and dynamic resource specifications
- Optional change notifications
- Support for resource templates
- Automatic conversion between sync/async resource specifications
- Automatic resource specification through Spring beans:

```java
@Bean
public List<McpServerFeatures.SyncResourceSpecification> myResources(...) {
    var systemInfoResource = new McpSchema.Resource(...);
    var resourceSpecification = new McpServerFeatures.SyncResourceSpecification(systemInfoResource, (exchange, request) -> {
        try {
            var systemInfo = Map.of(...);
            String jsonContent = new JsonMapper().writeValueAsString(systemInfo);
            return new McpSchema.ReadResourceResult(
                    List.of(new McpSchema.TextResourceContents(request.uri(), "application/json", jsonContent)));
        }
        catch (Exception e) {
            throw new RuntimeException("Failed to generate system info", e);
        }
    });

    return List.of(resourceSpecification);
}
```

<a id="_prompts"></a>

### [Prompts](https://spec.modelcontextprotocol.io/specification/2024-11-05/server/prompts/)

Provides a standardized way for servers to expose prompt templates to clients.

- Change notification support
- Template versioning
- Automatic conversion between sync/async prompt specifications
- Automatic prompt specification through Spring beans:

```java
@Bean
public List<McpServerFeatures.SyncPromptSpecification> myPrompts() {
    var prompt = new McpSchema.Prompt("greeting", "A friendly greeting prompt",
        List.of(new McpSchema.PromptArgument("name", "The name to greet", true)));

    var promptSpecification = new McpServerFeatures.SyncPromptSpecification(prompt, (exchange, getPromptRequest) -> {
        String nameArgument = (String) getPromptRequest.arguments().get("name");
        if (nameArgument == null) { nameArgument = "friend"; }
        var userMessage = new PromptMessage(Role.USER, TextContent.builder("Hello " + nameArgument + "! How can I assist you today?").build());
        return GetPromptResult.builder(List.of(userMessage)).description("A personalized greeting message").build();
    });

    return List.of(promptSpecification);
}
```

<a id="_completions"></a>

### [Completions](https://spec.modelcontextprotocol.io/specification/2024-11-05/server/completions/)

Provides a standardized way for servers to expose completion capabilities to clients.

- Support for both sync and async completion specifications
- Automatic registration through Spring beans:

```java
@Bean
public List<McpServerFeatures.SyncCompletionSpecification> myCompletions() {
    var completion = new McpServerFeatures.SyncCompletionSpecification(
        new McpSchema.PromptReference(
					"ref/prompt", "code-completion", "Provides code completion suggestions"),
        (exchange, request) -> {
            // Implementation that returns completion suggestions
            return new McpSchema.CompleteResult(List.of("python", "pytorch", "pyside"), 10, true);
        }
    );

    return List.of(completion);
}
```

<a id="_logging"></a>

### [Logging](https://modelcontextprotocol.io/specification/2025-03-26/server/utilities/logging/)

Provides a standardized way for servers to send structured log messages to clients.
From within the tool, resource, prompt or completion call handler use the provided `McpSyncServerExchange`/`McpAsyncServerExchange` `exchange` object to send logging messages:

```java
(exchange, request) -> {
        exchange.loggingNotification(LoggingMessageNotification.builder(LoggingLevel.INFO, "This is a test log message")
            .logger("test-logger")
            .build());
}
```

On the MCP client you can register [logging consumers](mcp-client-boot-starter-docs.md#_customization_types) to handle these messages:

```java
mcpClientSpec.loggingConsumer((McpSchema.LoggingMessageNotification log) -> {
    // Handle log messages
});
```

<a id="_progress"></a>

### [Progress](https://modelcontextprotocol.io/specification/2025-03-26/basic/utilities/progress)

Provides a standardized way for servers to send progress updates to clients.
From within the tool, resource, prompt or completion call handler use the provided `McpSyncServerExchange`/`McpAsyncServerExchange` `exchange` object to send progress notifications:

```java
(exchange, request) -> {
        exchange.progressNotification(ProgressNotification.builder("test-progress-token", 0.25)
            .total(1.0)
            .message("tool call in progress")
            .build());
}
```

The Mcp Client can receive progress notifications and update its UI accordingly.
For this it needs to register a progress consumer.

```java
mcpClientSpec.progressConsumer((McpSchema.ProgressNotification progress) -> {
    // Handle progress notifications
});
```

<a id="_root_list_changes"></a>

### [Root List Changes](https://spec.modelcontextprotocol.io/specification/2024-11-05/client/roots/#root-list-changes)

When roots change, clients that support `listChanged` send a root change notification.

- Support for monitoring root changes
- Automatic conversion to async consumers for reactive applications
- Optional registration through Spring beans

```java
@Bean
public BiConsumer<McpSyncServerExchange, List<McpSchema.Root>> rootsChangeHandler() {
    return (exchange, roots) -> {
        logger.info("Registering root resources: {}", roots);
    };
}
```

<a id="_ping"></a>

### [Ping](https://modelcontextprotocol.io/specification/2025-03-26/basic/utilities/ping/)

Ping mechanism for the server to verify that its clients are still alive.
From within the tool, resource, prompt or completion call handler use the provided `McpSyncServerExchange`/`McpAsyncServerExchange` `exchange` object to send ping messages:

```java
(exchange, request) -> {
        exchange.ping();
}
```

<a id="_keep_alive"></a>

### Keep Alive

Server can optionally, periodically issue pings to connected clients to verify connection health.

By default, keep-alive is disabled.
To enable keep-alive, set the `keep-alive-interval` property in your configuration:

```yaml
spring:
  ai:
    mcp:
      server:
        keep-alive-interval: 30s
```

<a id="_usage_examples"></a>

## Usage Examples

<a id="_standard_stdio_server_configuration"></a>

### Standard STDIO Server Configuration

```yaml
# Using spring-ai-starter-mcp-server
spring:
  ai:
    mcp:
      server:
        name: stdio-mcp-server
        version: 1.0.0
        type: SYNC
```

<a id="_webmvc_server_configuration"></a>

### WebMVC Server Configuration

```yaml
# Using spring-ai-starter-mcp-server-webmvc
spring:
  ai:
    mcp:
      server:
        name: webmvc-mcp-server
        version: 1.0.0
        type: SYNC
        instructions: "This server provides weather information tools and resources"
        capabilities:
          tool: true
          resource: true
          prompt: true
          completion: true
        # sse properties
        sse-message-endpoint: /mcp/messages
        keep-alive-interval: 30s
```

<a id="_webflux_server_configuration"></a>

### WebFlux Server Configuration

```yaml
# Using spring-ai-starter-mcp-server-webflux
spring:
  ai:
    mcp:
      server:
        name: webflux-mcp-server
        version: 1.0.0
        type: ASYNC  # Recommended for reactive applications
        instructions: "This reactive server provides weather information tools and resources"
        capabilities:
          tool: true
          resource: true
          prompt: true
          completion: true
        # sse properties
        sse-message-endpoint: /mcp/messages
        keep-alive-interval: 30s
```

<a id="_creating_a_spring_boot_application_with_mcp_server"></a>

### Creating a Spring Boot Application with MCP Server

```java
@Service
public class WeatherService {

    @Tool(description = "Get weather information by city name")
    public String getWeather(String cityName) {
        // Implementation
    }
}

@SpringBootApplication
public class McpServerApplication {

    private static final Logger logger = LoggerFactory.getLogger(McpServerApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(McpServerApplication.class, args);
    }

	@Bean
	public ToolCallbackProvider weatherTools(WeatherService weatherService) {
		return MethodToolCallbackProvider.builder().toolObjects(weatherService).build();
	}
}
```

The auto-configuration will automatically register the tool callbacks as MCP tools.
You can have multiple beans producing ToolCallbacks, and the auto-configuration will merge them.

<a id="_example_applications"></a>

## Example Applications

- [Weather Server (WebFlux)](https://github.com/spring-projects/spring-ai-examples/tree/main/model-context-protocol/weather/starter-webflux-server) - Spring AI MCP Server Boot Starter with WebFlux transport
- [Weather Server (STDIO)](https://github.com/spring-projects/spring-ai-examples/tree/main/model-context-protocol/weather/starter-stdio-server) - Spring AI MCP Server Boot Starter with STDIO transport
- [Weather Server Manual Configuration](https://github.com/spring-projects/spring-ai-examples/tree/main/model-context-protocol/weather/manual-webflux-server) - Spring AI MCP Server Boot Starter that doesn’t use auto-configuration but uses the Java SDK to configure the server manually
