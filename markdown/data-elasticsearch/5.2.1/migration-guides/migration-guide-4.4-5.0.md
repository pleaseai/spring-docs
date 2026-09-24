---
title: "Upgrading from 4.4.x to 5.0.x"
source: "ROOT:migration-guides/migration-guide-4.4-5.0.adoc"
---

<a id="elasticsearch-migration-guide-4.4-5.0"></a>

# Upgrading from 4.4.x to 5.0.x

This section describes breaking changes from version 4.4.x to 5.0.x and how removed features can be replaced by new introduced features.

<a id="elasticsearch-migration-guide-4.4-4.5.deprecations"></a>

## Deprecations

<a id="custom-trace-level-logging"></a>

### Custom trace level logging

Logging by setting the property `logging.level.org.springframework.data.elasticsearch.client.WIRE=trace` is deprecated now, the Elasticsearch `RestClient` provides a better solution that can be activated by setting the logging level of the `tracer` package to "trace".

<a id="elasticsearch-migration-guide-4.4-4.5.deprecations.package"></a>

### `org.springframework.data.elasticsearch.client.erhlc` package

See [Package changes](#elasticsearch-migration-guide-4.4-5.0.breaking-changes-packages), all classes in this package have been deprecated, as the default client implementations to use are the ones based on the new Java Client from Elasticsearch, see [New Elasticsearch client](#elasticsearch-migration-guide-4.4-5.0.new-clients)

<a id="elasticsearch-migration-guide-4.4-4.5.deprecations.code"></a>

### Removal of deprecated code

`DateFormat.none` and `DateFormat.custom` had been deprecated since version 4.2 and have been removed.

The properties of `@Document` that were deprecated since 4.2 have been removed.
Use the `@Settings` annotation for these.

`@DynamicMapping` and `@DynamicMappingValue` have been removed.
Use `@Document.dynamic` or `@Field.dynamic` instead.

<a id="elasticsearch-migration-guide-4.4-5.0.breaking-changes"></a>

## Breaking Changes

<a id="elasticsearch-migration-guide-4.4-5.0.breaking-changes.deprecated-calls"></a>

### Removal of deprecated calls

<a id="elasticsearch-migration-guide-4.4-5.0.breaking-changes.deprecated-calls.1"></a>

#### suggest calls in operations interfaces have been removed

Both `SearchOperations` and `ReactiveSearchOperations` had deprecated calls that were using Elasticsearch classes as parameters.
These now have been removed and so the dependency on Elasticsearch classes in these APIs has been cleaned.

<a id="elasticsearch-migration-guide-4.4-5.0.breaking-changes-packages"></a>

### Package changes

All the classes that are using or depend on the deprecated Elasticsearch `RestHighLevelClient` have been moved to the package `org.springframework.data.elasticsearch.client.erhlc`.
By this change we now have a clear separation of code using the old deprecated Elasticsearch libraries, code using the new Elasticsearch client and code that is independent of the client implementation.
Also the reactive implementation that was provided up to now has been moved here, as this implementation contains code that was copied and adapted from Elasticsearch libraries.

If you are using `ElasticsearchRestTemplate` directly and not the `ElasticsearchOperations` interface you’ll need to adjust your imports as well.

When working with the `NativeSearchQuery` class, you’ll need to switch to the `NativeQuery` class, which can take a
`Query` instance comign from the new Elasticsearch client libraries.
You’ll find plenty of examples in the test code.

<a id="elasticsearch-migration-guide-4.4-5.0.breaking-changes-records"></a>

### Conversion to Java 17 records

The following classes have been converted to `Record`, you might need to adjust the use of getter methods from
`getProp()` to `prop()`:

- `org.springframework.data.elasticsearch.core.AbstractReactiveElasticsearchTemplate.IndexResponseMetaData`
- `org.springframework.data.elasticsearch.core.ActiveShardCount`
- `org.springframework.data.elasticsearch.support.Version`
- `org.springframework.data.elasticsearch.support.ScoreDoc`
- `org.springframework.data.elasticsearch.core.query.ScriptData`
- `org.springframework.data.elasticsearch.core.query.SeqNoPrimaryTerm`

<a id="elasticsearch-migration-guide-4.4-5.0.breaking-changes-http-headers"></a>

### New HttpHeaders class

Until version 4.4 the client configuration used the `HttpHeaders` class from the `org.springframework:spring-web`
project.
This introduces a dependency on that artifact.
Users that do not use spring-web then face an error as this class cannot be found.

In version 5.0 we introduce our own `HttpHeaders` to configure the clients.

So if you are using headers in the client configuration, you need to replace `org.springframework.http.HttpHeaders`
with `org.springframework.data.elasticsearch.support.HttpHeaders`.

Hint: You can pass a `org.springframework.http
.HttpHeaders` to the `addAll()` method of `org.springframework.data.elasticsearch.support.HttpHeaders`.

<a id="elasticsearch-migration-guide-4.4-5.0.new-clients"></a>

## New Elasticsearch client

Spring Data Elasticsearch now uses the new `ElasticsearchClient` and has deprecated the use of the previous `RestHighLevelClient`.

<a id="elasticsearch-migration-guide-4.4-5.0.new-clients.imperative"></a>

### Imperative style configuration

To configure Spring Data Elasticsearch to use the new client, it is necessary to create a configuration bean that derives from `org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration`:

```java
@Configuration
public class NewRestClientConfig extends ElasticsearchConfiguration {

	@Override
	public ClientConfiguration clientConfiguration() {
		return ClientConfiguration.builder() //
			.connectedTo("localhost:9200") //
			.build();
	}
}
```

The configuration is done in the same way as with the old client, but it is not necessary anymore to create more than the configuration bean.
With this configuration, the following beans will be available in the Spring application context:

- a `RestClient` bean, that is the configured low level `RestClient` that is used by the Elasticsearch client
- an `ElasticsearchClient` bean, this is the new client that uses the `RestClient`
- an `ElasticsearchOperations` bean, available with the bean names *elasticsearchOperations* and *elasticsearchTemplate*, this uses the `ElasticsearchClient`

<a id="elasticsearch-migration-guide-4.4-5.0.new-clients.reactive"></a>

### Reactive style configuration

To use the new client in a reactive environment the only difference is the class from which to derive the configuration:

```java
@Configuration
public class NewRestClientConfig extends ReactiveElasticsearchConfiguration {

	@Override
	public ClientConfiguration clientConfiguration() {
		return ClientConfiguration.builder() //
			.connectedTo("localhost:9200") //
			.build();
	}
}
```

With this configuration, the following beans will be available in the Spring application context:

- a `RestClient` bean, that is the configured low level `RestClient` that is used by the Elasticsearch client
- an `ReactiveElasticsearchClient` bean, this is the new reactive client that uses the `RestClient`
- an `ReactiveElasticsearchOperations` bean, available with the bean names *reactiveElasticsearchOperations* and *reactiveElasticsearchTemplate*, this uses the `ReactiveElasticsearchClient`

<a id="elasticsearch-migration-guide-4.4-5.0.old-client"></a>

### Still want to use the old client?

The old deprecated `RestHighLevelClient` can still be used, but you will need to add the dependency explicitly to your application as Spring Data Elasticsearch does not pull it in automatically anymore:

```xml
<!-- include the RHLC, specify version explicitly	-->
<dependency>
	<groupId>org.elasticsearch.client</groupId>
	<artifactId>elasticsearch-rest-high-level-client</artifactId>
	<version>7.17.5</version>
	<exclusions>
		<exclusion>
			<groupId>commons-logging</groupId>
			<artifactId>commons-logging</artifactId>
		</exclusion>
	</exclusions>
</dependency>
```

Make sure to specify the version 7.17.6 explicitly, otherwise maven will resolve to 8.5.0, and this does not exist.
