---
title: "Elasticsearch Clients"
source: "ROOT:elasticsearch/clients.adoc"
---

<a id="elasticsearch.clients"></a>

# Elasticsearch Clients

This chapter illustrates configuration and usage of supported Elasticsearch client implementations.

Spring Data Elasticsearch operates upon an Elasticsearch client (provided by Elasticsearch client libraries) that is connected to a single Elasticsearch node or a cluster.
Although the Elasticsearch Client can be used directly to work with the cluster, applications using Spring Data Elasticsearch normally use the higher level abstractions of [Elasticsearch Operations](template.md) and [Elasticsearch Repositories](repositories/elasticsearch-repositories.md).

<a id="elasticsearch.clients.rest5client"></a>

## Imperative Rest5Client

To use the imperative (non-reactive) Rest5Client - the default client provided by the Elasticsearch Java client library from version 9 on -, a configuration bean must be configured like this:

```java
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;

@Configuration
public class MyClientConfig extends ElasticsearchConfiguration {

	@Override
	public ClientConfiguration clientConfiguration() {
		return ClientConfiguration.builder()           <.>
			.connectedTo("localhost:9200")
			.build();
	}
}
```

1. for a detailed description of the builder methods see [Client Configuration](#elasticsearch.clients.configuration)

The [`ElasticsearchConfiguration`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/client/elc/ElasticsearchConfiguration.html) class allows further configuration by overriding for example the `jsonpMapper()` or `transportOptions()` methods.

The following beans can then be injected in other Spring components:

```java
import org.springframework.beans.factory.annotation.Autowired;

@Autowired
ElasticsearchOperations operations;      <.>

@Autowired
ElasticsearchClient elasticsearchClient; <.>

@Autowired
Rest5Client rest5Client;                 <.>

@Autowired
JsonpMapper jsonpMapper;                 <.>
```

1. an implementation of [`ElasticsearchOperations`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/core/ElasticsearchOperations.html)
1. the `co.elastic.clients.elasticsearch.ElasticsearchClient` that is used.
1. the low level `Rest5Client` from the Elasticsearch libraries
1. the `JsonpMapper` user by the Elasticsearch `Transport`

Basically one should just use the [`ElasticsearchOperations`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/core/ElasticsearchOperations.html) to interact with the Elasticsearch cluster.
When using repositories, this instance is used under the hood as well.

<a id="elasticsearch.clients.restclient"></a>

## Deprecated Imperative RestClient

To use the imperative (non-reactive) RestClient - deprecated since version 6 - , the following dependency needs to be added, adapt the correct version. The exclusion is needed in a Spring Boot application:

```xml
        <dependency>
            <groupId>org.elasticsearch.client</groupId>
            <artifactId>elasticsearch-rest-client</artifactId>
            <version>${elasticsearch-client.version}</version>
            <exclusions>
                <exclusion>
                    <groupId>commons-logging</groupId>
                    <artifactId>commons-logging</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

```

The configuration bean must then be configured like this:

```java
import org.springframework.data.elasticsearch.client.elc.ElasticsearchLegacyRestClientConfiguration;

@Configuration
public class MyClientConfig extends ElasticsearchLegacyRestClientConfiguration {

	@Override
	public ClientConfiguration clientConfiguration() {
		return ClientConfiguration.builder()           <.>
			.connectedTo("localhost:9200")
			.build();
	}
}
```

1. for a detailed description of the builder methods see [Client Configuration](#elasticsearch.clients.configuration)

The [`ElasticsearchConfiguration`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/client/elc/ElasticsearchConfiguration.html) class allows further configuration by overriding for example the `jsonpMapper()` or `transportOptions()` methods.

The following beans can then be injected in other Spring components:

```java
import org.springframework.beans.factory.annotation.Autowired;

@Autowired
ElasticsearchOperations operations;      <.>

@Autowired
ElasticsearchClient elasticsearchClient; <.>

@Autowired
RestClient restClient;                   <.>

@Autowired
JsonpMapper jsonpMapper;                 <.>
```

1. an implementation of [`ElasticsearchOperations`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/core/ElasticsearchOperations.html)
1. the `co.elastic.clients.elasticsearch.ElasticsearchClient` that is used.
1. the low level `RestClient` from the Elasticsearch libraries
1. the `JsonpMapper` user by the Elasticsearch `Transport`

Basically one should just use the [`ElasticsearchOperations`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/core/ElasticsearchOperations.html) to interact with the Elasticsearch cluster.
When using repositories, this instance is used under the hood as well.

<a id="elasticsearch.clients.reactiverest5client"></a>

## Reactive Rest5Client

When working with the reactive stack, the configuration must be derived from a different class:

```java
import org.springframework.data.elasticsearch.client.elc.ReactiveElasticsearchConfiguration;

@Configuration
public class MyClientConfig extends ReactiveElasticsearchConfiguration {

	@Override
	public ClientConfiguration clientConfiguration() {
		return ClientConfiguration.builder()           <.>
			.connectedTo("localhost:9200")
			.build();
	}
}
```

1. for a detailed description of the builder methods see [Client Configuration](#elasticsearch.clients.configuration)

The [`ReactiveElasticsearchConfiguration`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/client/elc/ReactiveElasticsearchConfiguration.html) class allows further configuration by overriding for example the `jsonpMapper()` or `transportOptions()` methods.

The following beans can then be injected in other Spring components:

```java
import org.springframework.beans.factory.annotation.Autowired;

@Autowired
ReactiveElasticsearchOperations operations;      <.>

@Autowired
ReactiveElasticsearchClient elasticsearchClient; <.>

@Autowired
Rest5Client rest5Client;                           <.>

@Autowired
JsonpMapper jsonpMapper;                         <.>
```

the following can be injected:

1. an implementation of [`ReactiveElasticsearchOperations`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/core/ReactiveElasticsearchOperations.html)
1. the `org.springframework.data.elasticsearch.client.elc.ReactiveElasticsearchClient` that is used.
This is a reactive implementation based on the Elasticsearch client implementation.
1. the low level `RestClient` from the Elasticsearch libraries
1. the `JsonpMapper` user by the Elasticsearch `Transport`

Basically one should just use the [`ReactiveElasticsearchOperations`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/core/ReactiveElasticsearchOperations.html) to interact with the Elasticsearch cluster.
When using repositories, this instance is used under the hood as well.

<a id="elasticsearch.clients.reactiverestclient"></a>

## Deprecated Reactive RestClient

See the section above for the imperative code to use the deprecated RestClient for the necessary dependencies to include.

When working with the reactive stack, the configuration must be derived from a different class:

```java
import org.springframework.data.elasticsearch.client.elc.ReactiveElasticsearchLegacyRestClientConfiguration;

@Configuration
public class MyClientConfig extends ReactiveElasticsearchLegacyRestClientConfiguration {

	@Override
	public ClientConfiguration clientConfiguration() {
		return ClientConfiguration.builder()           <.>
			.connectedTo("localhost:9200")
			.build();
	}
}
```

1. for a detailed description of the builder methods see [Client Configuration](#elasticsearch.clients.configuration)

The [`ReactiveElasticsearchConfiguration`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/client/elc/ReactiveElasticsearchConfiguration.html) class allows further configuration by overriding for example the `jsonpMapper()` or `transportOptions()` methods.

The following beans can then be injected in other Spring components:

```java
import org.springframework.beans.factory.annotation.Autowired;

@Autowired
ReactiveElasticsearchOperations operations;      <.>

@Autowired
ReactiveElasticsearchClient elasticsearchClient; <.>

@Autowired
RestClient restClient;                           <.>

@Autowired
JsonpMapper jsonpMapper;                         <.>
```

the following can be injected:

1. an implementation of [`ReactiveElasticsearchOperations`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/core/ReactiveElasticsearchOperations.html)
1. the `org.springframework.data.elasticsearch.client.elc.ReactiveElasticsearchClient` that is used.
This is a reactive implementation based on the Elasticsearch client implementation.
1. the low level `RestClient` from the Elasticsearch libraries
1. the `JsonpMapper` user by the Elasticsearch `Transport`

Basically one should just use the [`ReactiveElasticsearchOperations`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/core/ReactiveElasticsearchOperations.html) to interact with the Elasticsearch cluster.
When using repositories, this instance is used under the hood as well.

<a id="elasticsearch.clients.configuration"></a>

## Client Configuration

Client behaviour can be changed via the [`ClientConfiguration`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/client/ClientConfiguration.html) that allows to set options for SSL, connect and socket timeouts, headers and other parameters.

```java
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.support.HttpHeaders;

import static org.springframework.data.elasticsearch.client.elc.ElasticsearchClients.*;

HttpHeaders httpHeaders = new HttpHeaders();
httpHeaders.add("some-header", "on every request")                      <.>

ClientConfiguration clientConfiguration = ClientConfiguration.builder()
  .connectedTo("localhost:9200", "localhost:9291")                      <.>
  .usingSsl()                                                           <.>
  .withProxy("localhost:8888")                                          <.>
  .withPathPrefix("ela")                                                <.>
  .withConnectTimeout(Duration.ofSeconds(5))                            <.>
  .withSocketTimeout(Duration.ofSeconds(3))                             <.>
  .withDefaultHeaders(defaultHeaders)                                   <.>
  .withBasicAuth(username, password)                                    <.>
  .withHeaders(() -> {                                                  <.>
    HttpHeaders headers = new HttpHeaders();
    headers.add("currentTime", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
    return headers;
  })
  .withClientConfigurer(                                                <.>
    ElasticsearchHttpClientConfigurationCallback.from(clientBuilder -> {
  	  // ...
      return clientBuilder;
  	}))
  . // ... other options
  .build();

```

1. Define default headers, if they need to be customized
1. Use the builder to provide cluster addresses, set default `HttpHeaders` or enable SSL.
1. Optionally enable SSL.There exist overloads of this function that can take a `SSLContext` or as an alternative the fingerprint of the certificate as it is output by Elasticsearch on startup (since version 8).
1. Optionally set a proxy.
1. Optionally set a path prefix, mostly used when different clusters a behind some reverse proxy.
1. Set the connection timeout.
1. Set the socket timeout.
1. Optionally set headers.
1. Add basic authentication.
1. A `Supplier<HttpHeaders>` function can be specified which is called every time before a request is sent to Elasticsearch - here, as an example, the current time is written in a header.
1. a function to configure the created client (see [Client configuration callbacks](#elasticsearch.clients.configuration.callbacks)), can be added multiple times.

> [!IMPORTANT]
> Adding a Header supplier as shown in above example allows to inject headers that may change over the time, like authentication JWT tokens.
> If this is used in the reactive setup, the supplier function **must not** block!

<a id="elasticsearch.clients.configuration.callbacks"></a>

### Client configuration callbacks

The [`ClientConfiguration`](https://docs.spring.io/spring-data/elasticsearch/docs/6.0.1/api/org/springframework/data/elasticsearch/client/ClientConfiguration.html) class offers the most common parameters to configure the client.
In the case this is not enough, the user can add callback functions by using the `withClientConfigurer(ClientConfigurationCallback<?>)` method.

The following callbacks are provided:

<a id="elasticsearch.clients.configuration.callbacks.rest5"></a>

#### Configuration of the low level Elasticsearch `Rest5Client`:

This callback provides a `org.elasticsearch.client.RestClientBuilder` that can be used to configure the Elasticsearch
`Rest5Client`:

```java
ClientConfiguration.builder()
    .connectedTo("localhost:9200", "localhost:9291")
    .withClientConfigurer(Rest5Clients.ElasticsearchRest5ClientConfigurationCallback.from(restClientBuilder -> {
        // configure the Elasticsearch Rest5Client
        return restClientBuilder;
    }))
    .build();
```

<a id="elasticsearch.clients.configuration.callbacks.rest"></a>

#### Configuration of the deprecated low level Elasticsearch `RestClient`:

This callback provides a `org.elasticsearch.client.RestClientBuilder` that can be used to configure the Elasticsearch
`RestClient`:

```java
ClientConfiguration.builder()
    .connectedTo("localhost:9200", "localhost:9291")
    .withClientConfigurer(RestClients.ElasticsearchRestClientConfigurationCallback.from(restClientBuilder -> {
        // configure the Elasticsearch RestClient
        return restClientBuilder;
    }))
    .build();
```

<a id="elasticsearch.clients.configurationcallbacks.httpasync5"></a>

#### Configuration of the HttpAsyncClient used by the low level Elasticsearch `Rest5Client`:

This callback provides a `org.apache.hc.client5.http.impl.async.HttpAsyncClientBuilder` to configure the HttpClient that is
used by the `Rest5Client`.

```java
ClientConfiguration.builder()
    .connectedTo("localhost:9200", "localhost:9291")
    .withClientConfigurer(Rest5Clients.ElasticsearchHttpClientConfigurationCallback.from(httpAsyncClientBuilder -> {
        // configure the HttpAsyncClient
        return httpAsyncClientBuilder;
    }))
    .build();
```

<a id="elasticsearch.clients.configurationcallbacks.httpasync"></a>

#### Configuration of the HttpAsyncClient used by the deprecated low level Elasticsearch `RestClient`:

This callback provides a `org.apache.http.impl.nio.client.HttpAsyncClientBuilder` to configure the HttpClient that is
used by the `RestClient`.

```java
ClientConfiguration.builder()
    .connectedTo("localhost:9200", "localhost:9291")
    .withClientConfigurer(RestClients.ElasticsearchHttpClientConfigurationCallback.from(httpAsyncClientBuilder -> {
        // configure the HttpAsyncClient
        return httpAsyncClientBuilder;
    }))
    .build();
```

<a id="elasticsearch.clients.configurationcallbacks.connectionconfig"></a>

#### Configuration of the ConnectionConfig used by the low level Elasticsearch `Rest5Client`:

This callback provides a `org.apache.hc.client5.http.config.ConnectionConfig` to configure the connection that is
used by the `Rest5Client`.

```java
ClientConfiguration.builder()
    .connectedTo("localhost:9200", "localhost:9291")
    .withClientConfigurer(Rest5Clients.ElasticsearchConnectionConfigurationCallback.from(connectionConfigBuilder -> {
        // configure the connection
        return connectionConfigBuilder;
    }))
    .build();
```

<a id="elasticsearch.clients.configurationcallbacks.connectioncmanager"></a>

#### Configuration of the ConnectionManager used by the low level Elasticsearch `Rest5Client`:

This callback provides a `org.apache.hc.client5.http.impl.nio.PoolingAsyncClientConnectionManagerBuilder` to configure the connection manager that is
used by the `Rest5Client`.

```java
ClientConfiguration.builder()
    .connectedTo("localhost:9200", "localhost:9291")
    .withClientConfigurer(Rest5Clients.ElasticsearchConnectionManagerCallback.from(connectionManagerBuilder -> {
        // configure the connection manager
        return connectionManagerBuilder;
    }))
    .build();
```

<a id="elasticsearch.clients.configurationcallbacks.requestconfig"></a>

#### Configuration of the RequestConfig used by the low level Elasticsearch `Rest5Client`:

This callback provides a `org.apache.hc.client5.http.config.RequestConfig` to configure the RequestConfig that is
used by the `Rest5Client`.

```java
ClientConfiguration.builder()
    .connectedTo("localhost:9200", "localhost:9291")
    .withClientConfigurer(Rest5Clients.ElasticsearchRequestConfigCallback.from(requestConfigBuilder -> {
        // configure the request config
        return requestConfigBuilder;
    }))
    .build();
```

<a id="elasticsearch.clients.logging"></a>

## Client Logging

To see what is actually sent to and received from the server `Request` / `Response` logging on the transport level needs to be turned on as outlined in the snippet below.
This can be enabled in the Elasticsearch client by setting the level of the `co.elastic.clients.transport.rest5_client.low_level.Request` package to "trace" (see
[www.elastic.co/docs/reference/elasticsearch/clients/java/transport/rest5-client/usage/logging](https://www.elastic.co/docs/reference/elasticsearch/clients/java/transport/rest5-client/usage/logging))

#### XML

```xml
<logger name="co.elastic.clients.transport.rest5_client.low_level.Request" level="trace"/>
```

#### yml

```yml
logging.level:
  co.elastic.clients.transport.rest5_client.low_level.Request: trace
```

#### ini

```ini
logging.level.co.elastic.clients.transport.rest5_client.low_level.Request=trace
```
