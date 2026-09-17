---
title: "Dynamic Tool Discovery with Tool Search Tool"
source: "ROOT:guides/dynamic-tool-search.adoc"
---

# Dynamic Tool Discovery with Tool Search Tool

As AI agents connect to more services—Slack, GitHub, Jira, MCP servers—tool libraries grow rapidly. A typical multi-server setup can easily have 50+ tools consuming significant tokens before any conversation starts. Worse, tool selection accuracy degrades when models face 30+ similarly-named tools.

The **Tool Search Tool** pattern, [pioneered by Anthropic](https://www.anthropic.com/engineering/advanced-tool-use), addresses this: instead of loading all tool definitions upfront, the model discovers tools on-demand. It receives only a search tool initially, queries for capabilities when needed, and gets relevant tool definitions expanded into context.

Spring AI’s implementation achieves **34-64% token reduction** across OpenAI, Anthropic, and Gemini models while maintaining full access to hundreds of tools.

<a id="_introduction"></a>

## Introduction

The [Tool Search Tool](https://github.com/spring-ai-community/spring-ai-tool-search-tool) project extends Spring AI’s [Recursive Advisors](../api/advisors-recursive.md) to implement dynamic tool discovery that works across **any LLM provider** supported by Spring AI.

**Key benefits:**

- **Token savings** - Only discovered tool definitions are sent to the LLM
- **Improved accuracy** - Models select tools more reliably from smaller, relevant sets
- **Scalability** - Manage hundreds of tools without context bloat
- **Portability** - Works with OpenAI, Anthropic, Gemini, Ollama, Azure OpenAI, and more

<a id="_blog_post"></a>

## Blog Post

📖 **Full Tutorial:** [Smart Tool Selection: Achieving 34-64% Token Savings with Spring AI’s Dynamic Tool Discovery](https://spring.io/blog/2025/12/11/spring-ai-tool-search-tools-tzolov)

The blog post covers the complete implementation details, performance benchmarks, and advanced use cases.

<a id="_quick_start"></a>

## Quick Start

<a id="_dependencies"></a>

### Dependencies

Add the Tool Search Tool dependency to your project:

#### Maven

```xml
<dependency>
    <groupId>org.springaicommunity</groupId>
    <artifactId>tool-search-tool</artifactId>
    <version>2.0.0</version>
</dependency>

<!-- Choose a search strategy -->
<dependency>
    <groupId>org.springaicommunity</groupId>
    <artifactId>tool-searcher-lucene</artifactId>
    <version>2.0.0</version>
</dependency>
```

#### Gradle

```gradle
dependencies {
    implementation 'org.springaicommunity:tool-search-tool:2.0.0'

    // Choose a search strategy
    implementation 'org.springaicommunity:tool-searcher-lucene:2.0.0'
}
```

> [!NOTE]
> Version [v1.0.x](https://github.com/spring-ai-community/spring-ai-tool-search-tool/tree/1.0.x) is Spring AI 1.1.x / Spring Boot 3 compatible. Version [v2.0.x](https://github.com/spring-ai-community/spring-ai-tool-search-tool) is Spring AI 2.x / Spring Boot 4 compatible.

<a id="_basic_usage"></a>

### Basic Usage

```java
@SpringBootApplication
public class Application {

    @Bean
    CommandLineRunner demo(ChatClient.Builder builder, ToolSearcher toolSearcher) {
        return args -> {
            var advisor = ToolSearchToolCallAdvisor.builder()
                .toolSearcher(toolSearcher)
                .build();

            ChatClient chatClient = builder
                .defaultTools(new MyTools())  // 100s of tools registered but NOT sent to LLM initially
                .defaultAdvisors(advisor)     // Activate Tool Search Tool
                .build();

            var answer = chatClient.prompt("""
                Help me plan what to wear today in Amsterdam.
                Please suggest clothing shops that are open right now.
                """).call().content();

            System.out.println(answer);
        };
    }

    static class MyTools {
        @Tool(description = "Get the weather for a given location at a given time")
        public String weather(String location,
            @ToolParam(description = "YYYY-MM-DDTHH:mm") String atTime) {
            // implementation
        }

        @Tool(description = "Get clothing shop names for a given location at a given time")
        public List<String> clothing(String location,
                @ToolParam(description = "YYYY-MM-DDTHH:mm") String openAtTime) {
            // implementation
        }

        @Tool(description = "Current date and time for a given location")
        public String currentTime(String location) {
            // implementation
        }

        // ... potentially hundreds more tools
    }
}
```

<a id="_how_it_works"></a>

## How It Works

The `ToolSearchToolCallAdvisor` extends Spring AI’s `ToolCallAdvisor` to implement dynamic tool discovery:

![Tool Search Tool Flow](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.8/spring-ai-docs/src/main/antora/modules/ROOT/images/https://raw.githubusercontent.com/spring-io/spring-io-static/refs/heads/main/blog/tzolov/20251208/spring-ai-tool-search-tool-calling-flow.png)

1. **Indexing**: At conversation start, all registered tools are indexed in the `ToolSearcher` (but NOT sent to the LLM)
1. **Initial Request**: Only the **Tool Search Tool** definition is sent to the LLM
1. **Discovery Call**: When the LLM needs capabilities, it calls the search tool with a query
1. **Search & Expand**: The `ToolSearcher` finds matching tools and their definitions are added to the next request
1. **Tool Invocation**: The LLM now sees both the search tool and discovered tool definitions
1. **Tool Execution**: Discovered tools are executed and results returned
1. **Response**: The LLM generates the final answer

<a id="_search_strategies"></a>

## Search Strategies

The `ToolSearcher` interface supports multiple search implementations:

| Strategy | Implementation | Best For |
| --- | --- | --- |
| **Semantic** | `VectorToolSearcher` | Natural language queries, fuzzy matching |
| **Keyword** | `LuceneToolSearcher` | Exact term matching, known tool names |
| **Regex** | `RegexToolSearcher` | Tool name patterns (`get_*_data`) |

See [tool-searchers](https://github.com/spring-ai-community/spring-ai-tool-search-tool/tree/main/tool-searchers) for all available implementations.

<a id="_performance"></a>

## Performance

Preliminary benchmarks with 28 tools show significant token savings:

| Model | With Tool Search | Without | Savings |
| --- | --- | --- | --- |
| Gemini | 2,165 tokens | 5,375 tokens | **60%** |
| OpenAI | 4,706 tokens | 7,175 tokens | **34%** |
| Anthropic | 6,273 tokens | 17,342 tokens | **64%** |

<a id="_when_to_use"></a>

## When to Use

| Tool Search Tool Approach | Traditional Approach |
| --- | --- |
| 20+ tools in your system | Small tool library (<20 tools) |
| Tool definitions consuming >5K tokens | All tools frequently used in every session |
| Building MCP-powered systems with multiple servers | Very compact tool definitions |
| Experiencing tool selection accuracy issues |  |

<a id="_example_projects"></a>

## Example Projects

- [Tool Search Tool Demo](https://github.com/spring-ai-community/spring-ai-tool-search-tool/tree/main/examples/tool-search-tool-demo) - Complete working example
- [Pre-Select Tool Demo](https://github.com/spring-ai-community/spring-ai-tool-search-tool/tree/main/examples/pre-select-tool-demo) - Deterministic tool selection without LLM involvement

<a id="_community_resources"></a>

## Community Resources

- [Tool Search Tool Repository](https://github.com/spring-ai-community/spring-ai-tool-search-tool)
- [Awesome Spring AI](https://github.com/spring-ai-community/awesome-spring-ai) - Community examples and resources

<a id="_related_documentation"></a>

## Related Documentation

- [Tool Calling](../api/tools.md)
- [Recursive Advisors](../api/advisors-recursive.md)
- [ChatClient](../api/chatclient.md)

<a id="_references"></a>

## References

- [Anthropic Advanced Tool Use](https://www.anthropic.com/engineering/advanced-tool-use) - Original pattern description
- [Spring AI Recursive Advisors Blog](https://spring.io/blog/2025/11/04/spring-ai-recursive-advisors) - Foundation for tool search implementation
