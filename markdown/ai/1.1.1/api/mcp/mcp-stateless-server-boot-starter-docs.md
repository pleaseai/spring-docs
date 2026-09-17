---
title: "Stateless Streamable-HTTP MCP Servers"
source: "ROOT:api/mcp/mcp-stateless-server-boot-starter-docs.adoc"
---

# Stateless Streamable-HTTP MCP Servers

<a id="_stateless_streamable_http_mcp_servers"></a>

## Stateless Streamable-HTTP MCP Servers

Stateless Streamable-HTTP MCP servers are designed for simplified deployments where session state is not maintained between requests.
These servers are ideal for microservices architectures and cloud-native deployments.

> [!TIP]
> Set the `spring.ai.mcp.server.protocol=STATELESS` property

> [!TIP]
> Use the [Streamable-HTTP clients](mcp-client-boot-starter-docs.md#_streamable_http_transport_properties) to connect to the stateless servers.

> [!NOTE]
> The stateless servers don’t support message requests to the MCP client (e.g., elicitation, sampling, ping).

<a id="_stateless_webmvc_server"></a>

### Stateless WebMVC Server

Use the `spring-ai-starter-mcp-server-webmvc` dependency:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server-webmvc</artifactId>
</dependency>
```

and set the `spring.ai.mcp.server.protocol` property to `STATELESS`.

```
spring.ai.mcp.server.protocol=STATELESS
```

- Stateless operation with Spring MVC transport
- No session state management
- Simplified deployment model
- Optimized for cloud-native environments

<a id="_stateless_webflux_server"></a>

### Stateless WebFlux Server

Use the `spring-ai-starter-mcp-server-webflux` dependency:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server-webflux</artifactId>
</dependency>
```

and set the `spring.ai.mcp.server.protocol` property to `STATELESS`.

- Reactive stateless operation with WebFlux transport
- No session state management
- Non-blocking request processing
- Optimized for high-throughput scenarios

<a id="_configuration_properties"></a>

## Configuration Properties

<a id="_common_properties"></a>

### Common Properties

All Common properties are prefixed with `spring.ai.mcp.server`:

| Property | Description | Default |
| --- | --- | --- |
| `enabled` | Enable/disable the stateless MCP server | `true` |
| `protocol` | MCP server protocol | Must be set to `STATELESS` to enable the stateless server |
| `tool-callback-converter` | Enable/disable the conversion of Spring AI ToolCallbacks into MCP Tool specs | `true` |
| `name` | Server name for identification | `mcp-server` |
| `version` | Server version | `1.0.0` |
| `instructions` | Optional instructions for client interaction | `null` |
| `type` | Server type (SYNC/ASYNC) | `SYNC` |
| `capabilities.resource` | Enable/disable resource capabilities | `true` |
| `capabilities.tool` | Enable/disable tool capabilities | `true` |
| `capabilities.prompt` | Enable/disable prompt capabilities | `true` |
| `capabilities.completion` | Enable/disable completion capabilities | `true` |
| `tool-response-mime-type` | Response MIME type per tool name | `-` |
| `request-timeout` | Request timeout duration | `20 seconds` |

<a id="_mcp_annotations_properties"></a>

### MCP Annotations Properties

MCP Server Annotations provide a declarative way to implement MCP server handlers using Java annotations.

The server mcp-annotations properties are prefixed with `spring.ai.mcp.server.annotation-scanner`:

| Property | Description | Default Value |
| --- | --- | --- |
| `enabled` | Enable/disable the MCP server annotations auto-scanning | `true` |

<a id="_stateless_connection_properties"></a>

### Stateless Connection Properties

All connection properties are prefixed with `spring.ai.mcp.server.stateless`:

| Property | Description | Default |
| --- | --- | --- |
| `mcp-endpoint` | Custom MCP endpoint path | `/mcp` |
| `disallow-delete` | Disallow delete operations | `false` |

<a id="_features_and_capabilities"></a>

## Features and Capabilities

The MCP Server Boot Starter allows servers to expose tools, resources, and prompts to clients.
It automatically converts custom capability handlers registered as Spring beans to sync/async specifications based on the server type:

<a id="_tools"></a>

### [Tools](https://modelcontextprotocol.io/specification/2025-03-26/server/tools)

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
public List<McpStatelessServerFeatures.SyncToolSpecification> myTools(...) {
    List<McpStatelessServerFeatures.SyncToolSpecification> tools = ...
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

> [!NOTE]
> Tool Context Support is not applicable for stateless servers.

<a id="_resources"></a>

### [Resources](https://modelcontextprotocol.io/specification/2025-03-26/server/resources/)

Provides a standardized way for servers to expose resources to clients.

- Static and dynamic resource specifications
- Optional change notifications
- Support for resource templates
- Automatic conversion between sync/async resource specifications
- Automatic resource specification through Spring beans:

```java
@Bean
public List<McpStatelessServerFeatures.SyncResourceSpecification> myResources(...) {
    var systemInfoResource = new McpSchema.Resource(...);
    var resourceSpecification = new McpStatelessServerFeatures.SyncResourceSpecification(systemInfoResource, (context, request) -> {
        try {
            var systemInfo = Map.of(...);
            String jsonContent = new ObjectMapper().writeValueAsString(systemInfo);
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

### [Prompts](https://modelcontextprotocol.io/specification/2025-03-26/server/prompts/)

Provides a standardized way for servers to expose prompt templates to clients.

- Change notification support
- Template versioning
- Automatic conversion between sync/async prompt specifications
- Automatic prompt specification through Spring beans:

```java
@Bean
public List<McpStatelessServerFeatures.SyncPromptSpecification> myPrompts() {
    var prompt = new McpSchema.Prompt("greeting", "A friendly greeting prompt",
        List.of(new McpSchema.PromptArgument("name", "The name to greet", true)));

    var promptSpecification = new McpStatelessServerFeatures.SyncPromptSpecification(prompt, (context, getPromptRequest) -> {
        String nameArgument = (String) getPromptRequest.arguments().get("name");
        if (nameArgument == null) { nameArgument = "friend"; }
        var userMessage = new PromptMessage(Role.USER, new TextContent("Hello " + nameArgument + "! How can I assist you today?"));
        return new GetPromptResult("A personalized greeting message", List.of(userMessage));
    });

    return List.of(promptSpecification);
}
```

<a id="_completion"></a>

### [Completion](https://modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/)

Provides a standardized way for servers to expose completion capabilities to clients.

- Support for both sync and async completion specifications
- Automatic registration through Spring beans:

```java
@Bean
public List<McpStatelessServerFeatures.SyncCompletionSpecification> myCompletions() {
    var completion = new McpStatelessServerFeatures.SyncCompletionSpecification(
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

<a id="_usage_examples"></a>

## Usage Examples

<a id="_stateless_server_configuration"></a>

### Stateless Server Configuration

```yaml
spring:
  ai:
    mcp:
      server:
        protocol: STATELESS
        name: stateless-mcp-server
        version: 1.0.0
        type: ASYNC
        instructions: "This stateless server is optimized for cloud deployments"
        streamable-http:
          mcp-endpoint: /api/mcp
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
