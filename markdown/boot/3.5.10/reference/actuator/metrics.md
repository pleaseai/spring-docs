---
title: "Metrics"
source: "reference:actuator/metrics.adoc"
---

<a id="actuator.metrics"></a>

# Metrics

Spring Boot Actuator provides dependency management and auto-configuration for [Micrometer](https://micrometer.io), an application metrics facade that supports [numerous monitoring systems](https://docs.micrometer.io/micrometer/reference/1.15), including:

- [AppOptics](#actuator.metrics.export.appoptics)
- [Atlas](#actuator.metrics.export.atlas)
- [Datadog](#actuator.metrics.export.datadog)
- [Dynatrace](#actuator.metrics.export.dynatrace)
- [Elastic](#actuator.metrics.export.elastic)
- [Ganglia](#actuator.metrics.export.ganglia)
- [Graphite](#actuator.metrics.export.graphite)
- [Humio](#actuator.metrics.export.humio)
- [Influx](#actuator.metrics.export.influx)
- [JMX](#actuator.metrics.export.jmx)
- [KairosDB](#actuator.metrics.export.kairos)
- [New Relic](#actuator.metrics.export.newrelic)
- [OTLP](#actuator.metrics.export.otlp)
- [Prometheus](#actuator.metrics.export.prometheus)
- [Simple](#actuator.metrics.export.simple) (in-memory)
- [Stackdriver](#actuator.metrics.export.stackdriver)
- [StatsD](#actuator.metrics.export.statsd)
- [Wavefront](#actuator.metrics.export.wavefront)

> [!TIP]
> To learn more about Micrometer’s capabilities, see its [reference documentation](https://docs.micrometer.io/micrometer/reference/1.15), in particular the [concepts section](https://docs.micrometer.io/micrometer/reference/1.15/concepts).

<a id="actuator.metrics.getting-started"></a>

## Getting Started

Spring Boot auto-configures a composite [`MeterRegistry`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/MeterRegistry.html) and adds a registry to the composite for each of the supported implementations that it finds on the classpath.
Having a dependency on `micrometer-registry-{system}` in your runtime classpath is enough for Spring Boot to configure the registry.

Most registries share common features.
For instance, you can disable a particular registry even if the Micrometer registry implementation is on the classpath.
The following example disables Datadog:

#### Properties

```properties
management.datadog.metrics.export.enabled=false
```

#### YAML

```yaml
management:
  datadog:
    metrics:
      export:
        enabled: false
```

You can also disable all registries unless stated otherwise by the registry-specific property, as the following example shows:

#### Properties

```properties
management.defaults.metrics.export.enabled=false
```

#### YAML

```yaml
management:
  defaults:
    metrics:
      export:
        enabled: false
```

Spring Boot also adds any auto-configured registries to the global static composite registry on the [`Metrics`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/Metrics.html) class, unless you explicitly tell it not to:

#### Properties

```properties
management.metrics.use-global-registry=false
```

#### YAML

```yaml
management:
  metrics:
    use-global-registry: false
```

You can register any number of [`MeterRegistryCustomizer`](https://docs.spring.io/spring-boot/3.5.10/api/java/org/springframework/boot/actuate/autoconfigure/metrics/MeterRegistryCustomizer.html) beans to further configure the registry, such as applying common tags, before any meters are registered with the registry:

#### Java

```java
import io.micrometer.core.instrument.MeterRegistry;

import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyMeterRegistryConfiguration {

	@Bean
	public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
		return (registry) -> registry.config().commonTags("region", "us-east-1");
	}

}
```

#### Kotlin

```kotlin
import io.micrometer.core.instrument.MeterRegistry
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyMeterRegistryConfiguration {

	@Bean
	fun metricsCommonTags(): MeterRegistryCustomizer<MeterRegistry> {
		return MeterRegistryCustomizer { registry ->
			registry.config().commonTags("region", "us-east-1")
		}
	}

}

```

You can apply customizations to particular registry implementations by being more specific about the generic type:

#### Java

```java
import io.micrometer.core.instrument.Meter;
import io.micrometer.core.instrument.config.NamingConvention;
import io.micrometer.graphite.GraphiteMeterRegistry;

import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyMeterRegistryConfiguration {

	@Bean
	public MeterRegistryCustomizer<GraphiteMeterRegistry> graphiteMetricsNamingConvention() {
		return (registry) -> registry.config().namingConvention(this::name);
	}

	private String name(String name, Meter.Type type, String baseUnit) {
		return ...
	}

}
```

#### Kotlin

```kotlin
import io.micrometer.core.instrument.Meter
import io.micrometer.core.instrument.config.NamingConvention
import io.micrometer.graphite.GraphiteMeterRegistry
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyMeterRegistryConfiguration {

	@Bean
	fun graphiteMetricsNamingConvention(): MeterRegistryCustomizer<GraphiteMeterRegistry> {
		return MeterRegistryCustomizer { registry: GraphiteMeterRegistry ->
			registry.config().namingConvention(this::name)
		}
	}

	private fun name(name: String, type: Meter.Type, baseUnit: String?): String {
		return  ...
	}

}

```

Spring Boot also [configures built-in instrumentation](#actuator.metrics.supported) that you can control through configuration or dedicated annotation markers.

<a id="actuator.metrics.export"></a>

## Supported Monitoring Systems

This section briefly describes each of the supported monitoring systems.

<a id="actuator.metrics.export.appoptics"></a>

### AppOptics

By default, the AppOptics registry periodically pushes metrics to `api.appoptics.com/v1/measurements`.
To export metrics to SaaS [AppOptics](https://docs.micrometer.io/micrometer/reference/1.15/implementations/appOptics), your API token must be provided:

#### Properties

```properties
management.appoptics.metrics.export.api-token=YOUR_TOKEN
```

#### YAML

```yaml
management:
  appoptics:
    metrics:
      export:
        api-token: "YOUR_TOKEN"
```

<a id="actuator.metrics.export.atlas"></a>

### Atlas

By default, metrics are exported to [Atlas](https://docs.micrometer.io/micrometer/reference/1.15/implementations/atlas) running on your local machine.
You can provide the location of the [Atlas server](https://github.com/Netflix/atlas):

#### Properties

```properties
management.atlas.metrics.export.uri=https://atlas.example.com:7101/api/v1/publish
```

#### YAML

```yaml
management:
  atlas:
    metrics:
      export:
        uri: "https://atlas.example.com:7101/api/v1/publish"
```

<a id="actuator.metrics.export.datadog"></a>

### Datadog

A Datadog registry periodically pushes metrics to [datadoghq](https://www.datadoghq.com).
To export metrics to [Datadog](https://docs.micrometer.io/micrometer/reference/1.15/implementations/datadog), you must provide your API key:

#### Properties

```properties
management.datadog.metrics.export.api-key=YOUR_KEY
```

#### YAML

```yaml
management:
  datadog:
    metrics:
      export:
        api-key: "YOUR_KEY"
```

If you additionally provide an application key (optional), then metadata such as meter descriptions, types, and base units will also be exported:

#### Properties

```properties
management.datadog.metrics.export.api-key=YOUR_API_KEY
management.datadog.metrics.export.application-key=YOUR_APPLICATION_KEY
```

#### YAML

```yaml
management:
  datadog:
    metrics:
      export:
        api-key: "YOUR_API_KEY"
        application-key: "YOUR_APPLICATION_KEY"
```

By default, metrics are sent to the Datadog US [site](https://docs.datadoghq.com/getting_started/site) (`api.datadoghq.com`).
If your Datadog project is hosted on one of the other sites, or you need to send metrics through a proxy, configure the URI accordingly:

#### Properties

```properties
management.datadog.metrics.export.uri=https://api.datadoghq.eu
```

#### YAML

```yaml
management:
  datadog:
    metrics:
      export:
        uri: "https://api.datadoghq.eu"
```

You can also change the interval at which metrics are sent to Datadog:

#### Properties

```properties
management.datadog.metrics.export.step=30s
```

#### YAML

```yaml
management:
  datadog:
    metrics:
      export:
        step: "30s"
```

<a id="actuator.metrics.export.dynatrace"></a>

### Dynatrace

Dynatrace offers two metrics ingest APIs, both of which are implemented for [Micrometer](https://docs.micrometer.io/micrometer/reference/1.15/implementations/dynatrace).
You can find the Dynatrace documentation on Micrometer metrics ingest [here](https://docs.dynatrace.com/docs/shortlink/micrometer-metrics-ingest).
Configuration properties in the `v1` namespace apply only when exporting to the [Timeseries v1 API](https://docs.dynatrace.com/docs/shortlink/api-metrics).
Configuration properties in the `v2` namespace apply only when exporting to the [Metrics v2 API](https://docs.dynatrace.com/docs/shortlink/api-metrics-v2-post-datapoints).
Note that this integration can export only to either the `v1` or `v2` version of the API at a time, with `v2` being preferred.
If the `device-id` (required for v1 but not used in v2) is set in the `v1` namespace, metrics are exported to the `v1` endpoint.
Otherwise, `v2` is assumed.

<a id="actuator.metrics.export.dynatrace.v2-api"></a>

#### v2 API

You can use the v2 API in two ways.

<a id="actuator.metrics.export.dynatrace.v2-api.auto-config"></a>

##### Auto-configuration

Dynatrace auto-configuration is available for hosts that are monitored by the OneAgent or by the Dynatrace Operator for Kubernetes.

**Local OneAgent:** If a OneAgent is running on the host, metrics are automatically exported to the [local OneAgent ingest endpoint](https://docs.dynatrace.com/docs/shortlink/local-api).
The ingest endpoint forwards the metrics to the Dynatrace backend.

**Dynatrace Kubernetes Operator:** When running in Kubernetes with the Dynatrace Operator installed, the registry will automatically pick up your endpoint URI and API token from the operator instead.

This is the default behavior and requires no special setup beyond a dependency on `io.micrometer:micrometer-registry-dynatrace`.

<a id="actuator.metrics.export.dynatrace.v2-api.manual-config"></a>

##### Manual Configuration

If no auto-configuration is available, the endpoint of the [Metrics v2 API](https://docs.dynatrace.com/docs/shortlink/api-metrics-v2-post-datapoints) and an API token are required.
The [API token](https://docs.dynatrace.com/docs/shortlink/api-authentication) must have the “Ingest metrics” (`metrics.ingest`) permission set.
We recommend limiting the scope of the token to this one permission.
You must ensure that the endpoint URI contains the path (for example, `/api/v2/metrics/ingest`):

The URL of the Metrics API v2 ingest endpoint is different according to your deployment option:

- SaaS: `https://{your-environment-id}.live.dynatrace.com/api/v2/metrics/ingest`
- Managed deployments: `https://{your-domain}/e/{your-environment-id}/api/v2/metrics/ingest`

The example below configures metrics export using the `example` environment id:

#### Properties

```properties
management.dynatrace.metrics.export.uri=https://example.live.dynatrace.com/api/v2/metrics/ingest
management.dynatrace.metrics.export.api-token=YOUR_TOKEN
```

#### YAML

```yaml
management:
  dynatrace:
    metrics:
      export:
        uri: "https://example.live.dynatrace.com/api/v2/metrics/ingest"
        api-token: "YOUR_TOKEN"
```

When using the Dynatrace v2 API, the following optional features are available (more details can be found in the [Dynatrace documentation](https://docs.dynatrace.com/docs/shortlink/micrometer-metrics-ingest#dt-configuration-properties)):

- Metric key prefix: Sets a prefix that is prepended to all exported metric keys.
- Enrich with Dynatrace metadata: If a OneAgent or Dynatrace operator is running, enrich metrics with additional metadata (for example, about the host, process, or pod).
- Default dimensions: Specify key-value pairs that are added to all exported metrics.
If tags with the same key are specified with Micrometer, they overwrite the default dimensions.
- Use Dynatrace Summary instruments: In some cases the Micrometer Dynatrace registry created metrics that were rejected.
In Micrometer 1.9.x, this was fixed by introducing Dynatrace-specific summary instruments.
Setting this toggle to `false` forces Micrometer to fall back to the behavior that was the default before 1.9.x.
It should only be used when encountering problems while migrating from Micrometer 1.8.x to 1.9.x.
- Export meter metadata: Starting from Micrometer 1.12.0, the Dynatrace exporter will also export meter metadata, such as unit and description by default.
Use the `export-meter-metadata` toggle to turn this feature off.

It is possible to not specify a URI and API token, as shown in the following example.
In this scenario, the automatically configured endpoint is used:

#### Properties

```properties
management.dynatrace.metrics.export.v2.metric-key-prefix=your.key.prefix
management.dynatrace.metrics.export.v2.enrich-with-dynatrace-metadata=true
management.dynatrace.metrics.export.v2.default-dimensions.key1=value1
management.dynatrace.metrics.export.v2.default-dimensions.key2=value2
management.dynatrace.metrics.export.v2.use-dynatrace-summary-instruments=true
management.dynatrace.metrics.export.v2.export-meter-metadata=true
```

#### YAML

```yaml
management:
  dynatrace:
    metrics:
      export:
        # Specify uri and api-token here if not using the local OneAgent endpoint.
        v2:
          metric-key-prefix: "your.key.prefix"
          enrich-with-dynatrace-metadata: true
          default-dimensions:
            key1: "value1"
            key2: "value2"
          use-dynatrace-summary-instruments: true # (default: true)
          export-meter-metadata: true             # (default: true)
```

<a id="actuator.metrics.export.dynatrace.v1-api"></a>

#### v1 API (Legacy)

The Dynatrace v1 API metrics registry pushes metrics to the configured URI periodically by using the [Timeseries v1 API](https://docs.dynatrace.com/docs/shortlink/api-metrics).
For backwards-compatibility with existing setups, when `device-id` is set (required for v1, but not used in v2), metrics are exported to the Timeseries v1 endpoint.
To export metrics to [Dynatrace](https://docs.micrometer.io/micrometer/reference/1.15/implementations/dynatrace), your API token, device ID, and URI must be provided:

#### Properties

```properties
management.dynatrace.metrics.export.uri=https://{your-environment-id}.live.dynatrace.com
management.dynatrace.metrics.export.api-token=YOUR_TOKEN
management.dynatrace.metrics.export.v1.device-id=YOUR_DEVICE_ID
```

#### YAML

```yaml
management:
  dynatrace:
    metrics:
      export:
        uri: "https://{your-environment-id}.live.dynatrace.com"
        api-token: "YOUR_TOKEN"
        v1:
          device-id: "YOUR_DEVICE_ID"
```

For the v1 API, you must specify the base environment URI without a path, as the v1 endpoint path is added automatically.

<a id="actuator.metrics.export.dynatrace.version-independent-settings"></a>

#### Version-independent Settings

In addition to the API endpoint and token, you can also change the interval at which metrics are sent to Dynatrace.
The default export interval is `60s`.
The following example sets the export interval to 30 seconds:

#### Properties

```properties
management.dynatrace.metrics.export.step=30s
```

#### YAML

```yaml
management:
  dynatrace:
    metrics:
      export:
        step: "30s"
```

You can find more information on how to set up the Dynatrace exporter for Micrometer in the [Micrometer documentation](https://docs.micrometer.io/micrometer/reference/1.15/implementations/dynatrace) and the [Dynatrace documentation](https://docs.dynatrace.com/docs/shortlink/micrometer-metrics-ingest).

<a id="actuator.metrics.export.elastic"></a>

### Elastic

By default, metrics are exported to [Elastic](https://docs.micrometer.io/micrometer/reference/1.15/implementations/elastic) running on your local machine.
You can provide the location of the Elastic server to use by using the following property:

#### Properties

```properties
management.elastic.metrics.export.host=https://elastic.example.com:8086
```

#### YAML

```yaml
management:
  elastic:
    metrics:
      export:
        host: "https://elastic.example.com:8086"
```

<a id="actuator.metrics.export.ganglia"></a>

### Ganglia

By default, metrics are exported to [Ganglia](https://docs.micrometer.io/micrometer/reference/1.15/implementations/ganglia) running on your local machine.
You can provide the [Ganglia server](http://ganglia.sourceforge.net) host and port, as the following example shows:

#### Properties

```properties
management.ganglia.metrics.export.host=ganglia.example.com
management.ganglia.metrics.export.port=9649
```

#### YAML

```yaml
management:
  ganglia:
    metrics:
      export:
        host: "ganglia.example.com"
        port: 9649
```

<a id="actuator.metrics.export.graphite"></a>

### Graphite

By default, metrics are exported to [Graphite](https://docs.micrometer.io/micrometer/reference/1.15/implementations/graphite) running on your local machine.
You can provide the [Graphite server](https://graphiteapp.org) host and port, as the following example shows:

#### Properties

```properties
management.graphite.metrics.export.host=graphite.example.com
management.graphite.metrics.export.port=9004
```

#### YAML

```yaml
management:
  graphite:
    metrics:
      export:
         host: "graphite.example.com"
         port: 9004
```

Micrometer provides a default [`HierarchicalNameMapper`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/util/HierarchicalNameMapper.html) that governs how a dimensional meter ID is [mapped to flat hierarchical names](https://docs.micrometer.io/micrometer/reference/1.15/implementations/graphite#_hierarchical_name_mapping).

> [!TIP]
> To take control over this behavior, define your [`GraphiteMeterRegistry`](https://javadoc.io/doc/io.micrometer/micrometer-registry-graphite/1.15.8/io/micrometer/graphite/GraphiteMeterRegistry.html) and supply your own [`HierarchicalNameMapper`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/util/HierarchicalNameMapper.html).
> Auto-configured [`GraphiteConfig`](https://javadoc.io/doc/io.micrometer/micrometer-registry-graphite/1.15.8/io/micrometer/graphite/GraphiteConfig.html) and [`Clock`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/Clock.html) beans are provided unless you define your own:
>
> #### Java
>
> ```java
> import io.micrometer.core.instrument.Clock;
> import io.micrometer.core.instrument.Meter;
> import io.micrometer.core.instrument.config.NamingConvention;
> import io.micrometer.core.instrument.util.HierarchicalNameMapper;
> import io.micrometer.graphite.GraphiteConfig;
> import io.micrometer.graphite.GraphiteMeterRegistry;
>
> import org.springframework.context.annotation.Bean;
> import org.springframework.context.annotation.Configuration;
>
> @Configuration(proxyBeanMethods = false)
> public class MyGraphiteConfiguration {
>
> 	@Bean
> 	public GraphiteMeterRegistry graphiteMeterRegistry(GraphiteConfig config, Clock clock) {
> 		return new GraphiteMeterRegistry(config, clock, this::toHierarchicalName);
> 	}
>
> 	private String toHierarchicalName(Meter.Id id, NamingConvention convention) {
> 		return ...
> 	}
>
> }
> ```
>
> #### Kotlin
>
> ```kotlin
> import io.micrometer.core.instrument.Clock
> import io.micrometer.core.instrument.Meter
> import io.micrometer.core.instrument.config.NamingConvention
> import io.micrometer.core.instrument.util.HierarchicalNameMapper
> import io.micrometer.graphite.GraphiteConfig
> import io.micrometer.graphite.GraphiteMeterRegistry
> import org.springframework.context.annotation.Bean
> import org.springframework.context.annotation.Configuration
>
> @Configuration(proxyBeanMethods = false)
> class MyGraphiteConfiguration {
>
> 	@Bean
> 	fun graphiteMeterRegistry(config: GraphiteConfig, clock: Clock): GraphiteMeterRegistry {
> 		return GraphiteMeterRegistry(config, clock, this::toHierarchicalName)
> 	}
> 	private fun toHierarchicalName(id: Meter.Id, convention: NamingConvention): String {
> 		return  ...
> 	}
>
> }
>
> ```

<a id="actuator.metrics.export.humio"></a>

### Humio

By default, the Humio registry periodically pushes metrics to [cloud.humio.com](https://cloud.humio.com).
To export metrics to SaaS [Humio](https://docs.micrometer.io/micrometer/reference/1.15/implementations/humio), you must provide your API token:

#### Properties

```properties
management.humio.metrics.export.api-token=YOUR_TOKEN
```

#### YAML

```yaml
management:
  humio:
    metrics:
      export:
        api-token: "YOUR_TOKEN"
```

You should also configure one or more tags to identify the data source to which metrics are pushed:

#### Properties

```properties
management.humio.metrics.export.tags.alpha=a
management.humio.metrics.export.tags.bravo=b
```

#### YAML

```yaml
management:
  humio:
    metrics:
      export:
        tags:
          alpha: "a"
          bravo: "b"
```

<a id="actuator.metrics.export.influx"></a>

### Influx

By default, metrics are exported to an [Influx](https://docs.micrometer.io/micrometer/reference/1.15/implementations/influx) v1 instance running on your local machine with the default configuration.
To export metrics to InfluxDB v2, configure the `org`, `bucket`, and authentication `token` for writing metrics.
You can provide the location of the [Influx server](https://www.influxdata.com) to use by using:

#### Properties

```properties
management.influx.metrics.export.uri=https://influx.example.com:8086
```

#### YAML

```yaml
management:
  influx:
    metrics:
      export:
        uri: "https://influx.example.com:8086"
```

<a id="actuator.metrics.export.jmx"></a>

### JMX

Micrometer provides a hierarchical mapping to [JMX](https://docs.micrometer.io/micrometer/reference/1.15/implementations/jmx), primarily as a cheap and portable way to view metrics locally.
By default, metrics are exported to the `metrics` JMX domain.
You can provide the domain to use by using:

#### Properties

```properties
management.jmx.metrics.export.domain=com.example.app.metrics
```

#### YAML

```yaml
management:
  jmx:
    metrics:
      export:
        domain: "com.example.app.metrics"
```

Micrometer provides a default [`HierarchicalNameMapper`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/util/HierarchicalNameMapper.html) that governs how a dimensional meter ID is [mapped to flat hierarchical names](https://docs.micrometer.io/micrometer/reference/1.15/implementations/jmx#_hierarchical_name_mapping).

> [!TIP]
> To take control over this behavior, define your [`JmxMeterRegistry`](https://javadoc.io/doc/io.micrometer/micrometer-registry-jmx/1.15.8/io/micrometer/jmx/JmxMeterRegistry.html) and supply your own [`HierarchicalNameMapper`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/util/HierarchicalNameMapper.html).
> Auto-configured [`JmxConfig`](https://javadoc.io/doc/io.micrometer/micrometer-registry-jmx/1.15.8/io/micrometer/jmx/JmxConfig.html) and [`Clock`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/Clock.html) beans are provided unless you define your own:
>
> #### Java
>
> ```java
> import io.micrometer.core.instrument.Clock;
> import io.micrometer.core.instrument.Meter;
> import io.micrometer.core.instrument.config.NamingConvention;
> import io.micrometer.core.instrument.util.HierarchicalNameMapper;
> import io.micrometer.jmx.JmxConfig;
> import io.micrometer.jmx.JmxMeterRegistry;
>
> import org.springframework.context.annotation.Bean;
> import org.springframework.context.annotation.Configuration;
>
> @Configuration(proxyBeanMethods = false)
> public class MyJmxConfiguration {
>
> 	@Bean
> 	public JmxMeterRegistry jmxMeterRegistry(JmxConfig config, Clock clock) {
> 		return new JmxMeterRegistry(config, clock, this::toHierarchicalName);
> 	}
>
> 	private String toHierarchicalName(Meter.Id id, NamingConvention convention) {
> 		return ...
> 	}
>
> }
> ```
>
> #### Kotlin
>
> ```kotlin
> import io.micrometer.core.instrument.Clock
> import io.micrometer.core.instrument.Meter
> import io.micrometer.core.instrument.config.NamingConvention
> import io.micrometer.core.instrument.util.HierarchicalNameMapper
> import io.micrometer.jmx.JmxConfig
> import io.micrometer.jmx.JmxMeterRegistry
> import org.springframework.context.annotation.Bean
> import org.springframework.context.annotation.Configuration
>
> @Configuration(proxyBeanMethods = false)
> class MyJmxConfiguration {
>
> 	@Bean
> 	fun jmxMeterRegistry(config: JmxConfig, clock: Clock): JmxMeterRegistry {
> 		return JmxMeterRegistry(config, clock, this::toHierarchicalName)
> 	}
>
> 	private fun toHierarchicalName(id: Meter.Id, convention: NamingConvention): String {
> 		return  ...
> 	}
>
> }
>
> ```

<a id="actuator.metrics.export.kairos"></a>

### KairosDB

By default, metrics are exported to [KairosDB](https://docs.micrometer.io/micrometer/reference/1.15/implementations/kairos) running on your local machine.
You can provide the location of the [KairosDB server](https://kairosdb.github.io/) to use by using:

#### Properties

```properties
management.kairos.metrics.export.uri=https://kairosdb.example.com:8080/api/v1/datapoints
```

#### YAML

```yaml
management:
  kairos:
    metrics:
      export:
        uri: "https://kairosdb.example.com:8080/api/v1/datapoints"
```

<a id="actuator.metrics.export.newrelic"></a>

### New Relic

A New Relic registry periodically pushes metrics to [New Relic](https://docs.micrometer.io/micrometer/reference/1.15/implementations/new-relic).
To export metrics to [New Relic](https://newrelic.com), you must provide your API key and account ID:

#### Properties

```properties
management.newrelic.metrics.export.api-key=YOUR_KEY
management.newrelic.metrics.export.account-id=YOUR_ACCOUNT_ID
```

#### YAML

```yaml
management:
  newrelic:
    metrics:
      export:
        api-key: "YOUR_KEY"
        account-id: "YOUR_ACCOUNT_ID"
```

You can also change the interval at which metrics are sent to New Relic:

#### Properties

```properties
management.newrelic.metrics.export.step=30s
```

#### YAML

```yaml
management:
  newrelic:
    metrics:
      export:
        step: "30s"
```

By default, metrics are published through REST calls, but you can also use the Java Agent API if you have it on the classpath:

#### Properties

```properties
management.newrelic.metrics.export.client-provider-type=insights-agent
```

#### YAML

```yaml
management:
  newrelic:
    metrics:
      export:
        client-provider-type: "insights-agent"
```

Finally, you can take full control by defining your own [`NewRelicClientProvider`](https://javadoc.io/doc/io.micrometer/micrometer-registry-new-relic/1.15.8/io/micrometer/newrelic/NewRelicClientProvider.html) bean.

<a id="actuator.metrics.export.otlp"></a>

### OTLP

By default, metrics are exported over the [OpenTelemetry protocol (OTLP)](https://docs.micrometer.io/micrometer/reference/1.15/implementations/otlp) to a consumer running on your local machine.
To export to another location, provide the location of the [OTLP metrics endpoint](https://opentelemetry.io/) using `management.otlp.metrics.export.url`:

#### Properties

```properties
management.otlp.metrics.export.url=https://otlp.example.com:4318/v1/metrics
```

#### YAML

```yaml
management:
  otlp:
    metrics:
      export:
        url: "https://otlp.example.com:4318/v1/metrics"
```

Custom headers, for example for authentication, can also be provided using `management.otlp.metrics.export.headers.*` properties.

If an `OtlpMetricsSender` bean is available, it will be configured on the `OtlpMeterRegistry` that Spring Boot auto-configures.

<a id="actuator.metrics.export.prometheus"></a>

### Prometheus

[Prometheus](https://docs.micrometer.io/micrometer/reference/1.15/implementations/prometheus) expects to scrape or poll individual application instances for metrics.
Spring Boot provides an actuator endpoint at `/actuator/prometheus` to present a [Prometheus scrape](https://prometheus.io) with the appropriate format.

> [!TIP]
> By default, the endpoint is not available and must be exposed. See [exposing endpoints](endpoints.md#actuator.endpoints.exposing) for more details.

The following example `scrape_config` adds to `prometheus.yml`:

```yaml
scrape_configs:
- job_name: "spring"
  metrics_path: "/actuator/prometheus"
  static_configs:
  - targets: ["HOST:PORT"]
```

[Prometheus Exemplars](https://prometheus.io/docs/prometheus/latest/feature_flags/#exemplars-storage) are also supported.
To enable this feature, a [`SpanContext`](https://javadoc.io/doc/io.prometheus/prometheus-metrics-tracer-common/1.3.10/io/prometheus/metrics/tracer/common/SpanContext.html) bean should be present.
If you’re using the deprecated Prometheus simpleclient support and want to enable that feature, a [`SpanContextSupplier`](https://javadoc.io/doc/io.prometheus/simpleclient_tracer_common/0.16.0/io/prometheus/client/exemplars/tracer/common/SpanContextSupplier.html) bean should be present.
If you use [Micrometer Tracing](https://docs.micrometer.io/tracing/reference/1.5), this will be auto-configured for you, but you can always create your own if you want.
Please check the [Prometheus Docs](https://prometheus.io/docs/prometheus/latest/feature_flags/#exemplars-storage), since this feature needs to be explicitly enabled on Prometheus' side, and it is only supported using the [OpenMetrics](https://github.com/OpenObservability/OpenMetrics/blob/v1.0.0/specification/OpenMetrics.md#exemplars) format.

For ephemeral or batch jobs that may not exist long enough to be scraped, you can use [Prometheus Pushgateway](https://github.com/prometheus/pushgateway) support to expose the metrics to Prometheus.

To enable Prometheus Pushgateway support, add the following dependency to your project:

```xml
<dependency>
	<groupId>io.prometheus</groupId>
	<artifactId>prometheus-metrics-exporter-pushgateway</artifactId>
</dependency>
```

When the Prometheus Pushgateway dependency is present on the classpath and the `management.prometheus.metrics.export.pushgateway.enabled` property is set to `true`, a [`PrometheusPushGatewayManager`](https://docs.spring.io/spring-boot/3.5.10/api/java/org/springframework/boot/actuate/metrics/export/prometheus/PrometheusPushGatewayManager.html) bean is auto-configured.
This manages the pushing of metrics to a Prometheus Pushgateway.

You can tune the [`PrometheusPushGatewayManager`](https://docs.spring.io/spring-boot/3.5.10/api/java/org/springframework/boot/actuate/metrics/export/prometheus/PrometheusPushGatewayManager.html) by using properties under `management.prometheus.metrics.export.pushgateway`.
For advanced configuration, you can also provide your own [`PrometheusPushGatewayManager`](https://docs.spring.io/spring-boot/3.5.10/api/java/org/springframework/boot/actuate/metrics/export/prometheus/PrometheusPushGatewayManager.html) bean.

<a id="actuator.metrics.export.simple"></a>

### Simple

Micrometer ships with a simple, in-memory backend that is automatically used as a fallback if no other registry is configured.
This lets you see what metrics are collected in the [metrics endpoint](#actuator.metrics.endpoint).

The in-memory backend disables itself as soon as you use any other available backend.
You can also disable it explicitly:

#### Properties

```properties
management.simple.metrics.export.enabled=false
```

#### YAML

```yaml
management:
  simple:
    metrics:
      export:
        enabled: false
```

<a id="actuator.metrics.export.stackdriver"></a>

### Stackdriver

The Stackdriver registry periodically pushes metrics to [Stackdriver](https://cloud.google.com/stackdriver/).
To export metrics to SaaS [Stackdriver](https://docs.micrometer.io/micrometer/reference/1.15/implementations/stackdriver), you must provide your Google Cloud project ID:

#### Properties

```properties
management.stackdriver.metrics.export.project-id=my-project
```

#### YAML

```yaml
management:
  stackdriver:
    metrics:
      export:
        project-id: "my-project"
```

You can also change the interval at which metrics are sent to Stackdriver:

#### Properties

```properties
management.stackdriver.metrics.export.step=30s
```

#### YAML

```yaml
management:
  stackdriver:
    metrics:
      export:
        step: "30s"
```

<a id="actuator.metrics.export.statsd"></a>

### StatsD

The StatsD registry eagerly pushes metrics over UDP to a StatsD agent.
By default, metrics are exported to a [StatsD](https://docs.micrometer.io/micrometer/reference/1.15/implementations/statsD) agent running on your local machine.
You can provide the StatsD agent host, port, and protocol to use by using:

#### Properties

```properties
management.statsd.metrics.export.host=statsd.example.com
management.statsd.metrics.export.port=9125
management.statsd.metrics.export.protocol=udp
```

#### YAML

```yaml
management:
  statsd:
    metrics:
      export:
        host: "statsd.example.com"
        port: 9125
        protocol: "udp"
```

You can also change the StatsD line protocol to use (it defaults to Datadog):

#### Properties

```properties
management.statsd.metrics.export.flavor=etsy
```

#### YAML

```yaml
management:
  statsd:
    metrics:
      export:
        flavor: "etsy"
```

<a id="actuator.metrics.export.wavefront"></a>

### Wavefront

The Wavefront registry periodically pushes metrics to [Wavefront](https://docs.micrometer.io/micrometer/reference/1.15/implementations/wavefront).
If you are exporting metrics to [Wavefront](https://www.wavefront.com/) directly, you must provide your API token:

#### Properties

```properties
management.wavefront.api-token=YOUR_API_TOKEN
```

#### YAML

```yaml
management:
  wavefront:
    api-token: "YOUR_API_TOKEN"
```

Alternatively, you can use a Wavefront sidecar or an internal proxy in your environment to forward metrics data to the Wavefront API host:

#### Properties

```properties
management.wavefront.uri=proxy://localhost:2878
```

#### YAML

```yaml
management:
  wavefront:
    uri: "proxy://localhost:2878"
```

> [!NOTE]
> If you publish metrics to a Wavefront proxy (as described in [the Wavefront documentation](https://docs.wavefront.com/proxies_installing.html)), the host must be in the `proxy://HOST:PORT` format.

You can also change the interval at which metrics are sent to Wavefront:

#### Properties

```properties
management.wavefront.metrics.export.step=30s
```

#### YAML

```yaml
management:
  wavefront:
    metrics:
      export:
        step: "30s"
```

<a id="actuator.metrics.supported"></a>

## Supported Metrics and Meters

Spring Boot provides automatic meter registration for a wide variety of technologies.
In most situations, the defaults provide sensible metrics that can be published to any of the supported monitoring systems.

<a id="actuator.metrics.supported.jvm"></a>

### JVM Metrics

Auto-configuration enables JVM Metrics by using core Micrometer classes.
JVM metrics are published under the `jvm.` meter name.

The following JVM metrics are provided:

- Various memory and buffer pool details
- Statistics related to garbage collection
- Thread utilization
- [Virtual threads statistics](https://docs.micrometer.io/micrometer/reference/reference/jvm.html#_java_21_metrics) (for this, `io.micrometer:micrometer-java21` has to be on the classpath)
- The number of classes loaded and unloaded
- JVM version information
- JIT compilation time

<a id="actuator.metrics.supported.system"></a>

### System Metrics

Auto-configuration enables system metrics by using core Micrometer classes.
System metrics are published under the `system.`, `process.`, and `disk.` meter names.

The following system metrics are provided:

- CPU metrics
- File descriptor metrics
- Uptime metrics (both the amount of time the application has been running and a fixed gauge of the absolute start time)
- Disk space available

<a id="actuator.metrics.supported.application-startup"></a>

### Application Startup Metrics

Auto-configuration exposes application startup time metrics:

- `application.started.time`: time taken to start the application.
- `application.ready.time`: time taken for the application to be ready to service requests.

Metrics are tagged by the fully qualified name of the application class.

<a id="actuator.metrics.supported.logger"></a>

### Logger Metrics

Auto-configuration enables the event metrics for both Logback and Log4J2.
The details are published under the `log4j2.events.` or `logback.events.` meter names.

<a id="actuator.metrics.supported.tasks"></a>

### Task Execution and Scheduling Metrics

Auto-configuration enables the instrumentation of all available [`ThreadPoolTaskExecutor`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/scheduling/concurrent/ThreadPoolTaskExecutor.html) and [`ThreadPoolTaskScheduler`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/scheduling/concurrent/ThreadPoolTaskScheduler.html) beans, as long as the underling [`ThreadPoolExecutor`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html) is available.
Metrics are tagged by the name of the executor, which is derived from the bean name.

<a id="actuator.metrics.supported.jms"></a>

### JMS Metrics

Auto-configuration enables the instrumentation of all available [`JmsTemplate`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/jms/core/JmsTemplate.html) beans and [`@JmsListener`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/jms/annotation/JmsListener.html) annotated methods.
This will produce `"jms.message.publish"` and `"jms.message.process"` metrics respectively.
See the [Spring Framework reference documentation for more information on produced observations](https://docs.spring.io/spring-framework/reference/6.2/integration/observability.html#observability.jms).

<a id="actuator.metrics.supported.spring-mvc"></a>

### Spring MVC Metrics

Auto-configuration enables the instrumentation of all requests handled by Spring MVC controllers and functional handlers.
By default, metrics are generated with the name, `http.server.requests`.
You can customize the name by setting the `management.observations.http.server.requests.name` property.

See the [Spring Framework reference documentation for more information on produced observations](https://docs.spring.io/spring-framework/reference/6.2/integration/observability.html#observability.http-server.servlet).

To add to the default tags, provide a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) that extends [`DefaultServerRequestObservationConvention`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/server/observation/DefaultServerRequestObservationConvention.html) from the `org.springframework.http.server.observation` package.
To replace the default tags, provide a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) that implements [`ServerRequestObservationConvention`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/server/observation/ServerRequestObservationConvention.html).

> [!TIP]
> In some cases, exceptions handled in web controllers are not recorded as request metrics tags.
> Applications can opt in and record exceptions by [setting handled exceptions as request attributes](../web/servlet.md#web.servlet.spring-mvc.error-handling).

By default, all requests are handled.
To customize the filter, provide a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) that implements `FilterRegistrationBean<ServerHttpObservationFilter>`.

<a id="actuator.metrics.supported.spring-webflux"></a>

### Spring WebFlux Metrics

Auto-configuration enables the instrumentation of all requests handled by Spring WebFlux controllers and functional handlers.
By default, metrics are generated with the name, `http.server.requests`.
You can customize the name by setting the `management.observations.http.server.requests.name` property.

See the [Spring Framework reference documentation for more information on produced observations](https://docs.spring.io/spring-framework/reference/6.2/integration/observability.html#observability.http-server.reactive).

To add to the default tags, provide a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) that extends [`DefaultServerRequestObservationConvention`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/server/reactive/observation/DefaultServerRequestObservationConvention.html) from the `org.springframework.http.server.reactive.observation` package.
To replace the default tags, provide a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) that implements [`ServerRequestObservationConvention`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/server/reactive/observation/ServerRequestObservationConvention.html).

> [!TIP]
> In some cases, exceptions handled in controllers and handler functions are not recorded as request metrics tags.
> Applications can opt in and record exceptions by [setting handled exceptions as request attributes](../web/reactive.md#web.reactive.webflux.error-handling).

<a id="actuator.metrics.supported.jersey"></a>

### Jersey Server Metrics

Auto-configuration enables the instrumentation of all requests handled by the Jersey JAX-RS implementation.
By default, metrics are generated with the name, `http.server.requests`.
You can customize the name by setting the `management.observations.http.server.requests.name` property.

By default, Jersey server metrics are tagged with the following information:

| Tag | Description |
| --- | --- |
| `exception` | The simple class name of any exception that was thrown while handling the request. |
| `method` | The request’s method (for example, `GET` or `POST`) |
| `outcome` | The request’s outcome, based on the status code of the response. 1xx is `INFORMATIONAL`, 2xx is `SUCCESS`, 3xx is `REDIRECTION`, 4xx is `CLIENT_ERROR`, and 5xx is `SERVER_ERROR` |
| `status` | The response’s HTTP status code (for example, `200` or `500`) |
| `uri` | The request’s URI template prior to variable substitution, if possible (for example, `/api/person/{id}`) |

To customize the tags, provide a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) that implements [`JerseyObservationConvention`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/binder/jersey/server/JerseyObservationConvention.html).

<a id="actuator.metrics.supported.ssl"></a>

### SSL Bundle Metrics

Spring Boot Actuator publishes expiry metrics about SSL bundles.
The metric `ssl.chain.expiry` gauges the expiry date of each certificate chain in seconds.
This number will be negative if the chain has already expired.
This metric is tagged with the following information:

| Tag | Description |
| --- | --- |
| `bundle` | The name of the bundle which contains the certificate chain |
| `certificate` | The serial number (in hex format) of the certificate which is the soonest to expire in the chain |
| `chain` | The name of the certificate chain. |

<a id="actuator.metrics.supported.http-clients"></a>

### HTTP Client Metrics

Spring Boot Actuator manages the instrumentation of [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/client/RestTemplate.html), [`WebClient`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html) and [`RestClient`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/client/RestClient.html).
For that, you have to inject the auto-configured builder and use it to create instances:

- [`RestTemplateBuilder`](https://docs.spring.io/spring-boot/3.5.10/api/java/org/springframework/boot/web/client/RestTemplateBuilder.html) for [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/client/RestTemplate.html)
- [`WebClient.Builder`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.Builder.html) for [`WebClient`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html)
- [`RestClient.Builder`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/client/RestClient.Builder.html) for [`RestClient`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/client/RestClient.html)

You can also manually apply the customizers responsible for this instrumentation, namely [`ObservationRestTemplateCustomizer`](https://docs.spring.io/spring-boot/3.5.10/api/java/org/springframework/boot/actuate/metrics/web/client/ObservationRestTemplateCustomizer.html), [`ObservationWebClientCustomizer`](https://docs.spring.io/spring-boot/3.5.10/api/java/org/springframework/boot/actuate/metrics/web/reactive/client/ObservationWebClientCustomizer.html) and [`ObservationRestClientCustomizer`](https://docs.spring.io/spring-boot/3.5.10/api/java/org/springframework/boot/actuate/metrics/web/client/ObservationRestClientCustomizer.html).

By default, metrics are generated with the name, `http.client.requests`.
You can customize the name by setting the `management.observations.http.client.requests.name` property.

See the [Spring Framework reference documentation for more information on produced observations](https://docs.spring.io/spring-framework/reference/6.2/integration/observability.html#observability.http-client).

To customize the tags when using [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/client/RestTemplate.html) or [`RestClient`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/client/RestClient.html), provide a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) that implements [`ClientRequestObservationConvention`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/client/observation/ClientRequestObservationConvention.html) from the `org.springframework.http.client.observation` package.
To customize the tags when using [`WebClient`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html), provide a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) that implements [`ClientRequestObservationConvention`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/reactive/function/client/ClientRequestObservationConvention.html) from the `org.springframework.web.reactive.function.client` package.

<a id="actuator.metrics.supported.tomcat"></a>

### Tomcat Metrics

Auto-configuration enables the instrumentation of Tomcat only when an MBean [`Registry`](https://tomcat.apache.org/tomcat-10.1-doc/api/org/apache/tomcat/util/modeler/Registry.html) is enabled.
By default, the MBean registry is disabled, but you can enable it by setting `server.tomcat.mbeanregistry.enabled` to `true`.

Tomcat metrics are published under the `tomcat.` meter name.

<a id="actuator.metrics.supported.cache"></a>

### Cache Metrics

Auto-configuration enables the instrumentation of all available [`Cache`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/cache/Cache.html) instances on startup, with metrics prefixed with `cache`.
Cache instrumentation is standardized for a basic set of metrics.
Additional, cache-specific metrics are also available.

The following cache libraries are supported:

- Cache2k
- Caffeine
- Hazelcast
- Any compliant JCache (JSR-107) implementation
- Redis

> [!WARNING]
> Metrics should be enabled for the auto-configuration to pick them up.
> Refer to the documentation of the cache library you are using for more details.

Metrics are tagged by the name of the cache and by the name of the [`CacheManager`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/cache/CacheManager.html), which is derived from the bean name.

> [!NOTE]
> Only caches that are configured on startup are bound to the registry.
> For caches not defined in the cache’s configuration, such as caches created on the fly or programmatically after the startup phase, an explicit registration is required.
> A [`CacheMetricsRegistrar`](https://docs.spring.io/spring-boot/3.5.10/api/java/org/springframework/boot/actuate/metrics/cache/CacheMetricsRegistrar.html) bean is made available to make that process easier.

<a id="actuator.metrics.supported.spring-batch"></a>

### Spring Batch Metrics

See the [Spring Batch reference documentation](https://docs.spring.io/spring-batch/reference/5.2/monitoring-and-metrics.html).

<a id="actuator.metrics.supported.spring-graphql"></a>

### Spring GraphQL Metrics

See the [Spring GraphQL reference documentation](https://docs.spring.io/spring-graphql/reference/1.4/observability.html).

<a id="actuator.metrics.supported.jdbc"></a>

### DataSource Metrics

Auto-configuration enables the instrumentation of all available [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) objects with metrics prefixed with `jdbc.connections`.
Data source instrumentation results in gauges that represent the currently active, idle, maximum allowed, and minimum allowed connections in the pool.

Metrics are also tagged by the name of the [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) computed based on the bean name.

> [!TIP]
> By default, Spring Boot provides metadata for all supported data sources.
> You can add additional [`DataSourcePoolMetadataProvider`](https://docs.spring.io/spring-boot/3.5.10/api/java/org/springframework/boot/jdbc/metadata/DataSourcePoolMetadataProvider.html) beans if your favorite data source is not supported.
> See [`DataSourcePoolMetadataProvidersConfiguration`](https://docs.spring.io/spring-boot/3.5.10/api/java/org/springframework/boot/autoconfigure/jdbc/metadata/DataSourcePoolMetadataProvidersConfiguration.html) for examples.

Also, Hikari-specific metrics are exposed with a `hikaricp` prefix.
Each metric is tagged by the name of the pool (you can control it with `spring.datasource.name`).

<a id="actuator.metrics.supported.hibernate"></a>

### Hibernate Metrics

If `org.hibernate.orm:hibernate-micrometer` is on the classpath, all available Hibernate [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.1/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html) instances that have statistics enabled are instrumented with a metric named `hibernate`.

Metrics are also tagged by the name of the [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.1/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html), which is derived from the bean name.

To enable statistics, the standard JPA property `hibernate.generate_statistics` must be set to `true`.
You can enable that on the auto-configured [`EntityManagerFactory`](https://jakarta.ee/specifications/persistence/3.1/apidocs/jakarta.persistence/jakarta/persistence/EntityManagerFactory.html):

#### Properties

```properties
spring.jpa.properties[hibernate.generate_statistics]=true
```

#### YAML

```yaml
spring:
  jpa:
    properties:
      "[hibernate.generate_statistics]": true
```

<a id="actuator.metrics.supported.spring-data-repository"></a>

### Spring Data Repository Metrics

Auto-configuration enables the instrumentation of all Spring Data [`Repository`](https://docs.spring.io/spring-data/commons/docs/3.5.x/api/org/springframework/data/repository/Repository.html) method invocations.
By default, metrics are generated with the name, `spring.data.repository.invocations`.
You can customize the name by setting the `management.metrics.data.repository.metric-name` property.

The [`@Timed`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/annotation/Timed.html) annotation from the `io.micrometer.core.annotation` package is supported on [`Repository`](https://docs.spring.io/spring-data/commons/docs/3.5.x/api/org/springframework/data/repository/Repository.html) interfaces and methods.
If you do not want to record metrics for all [`Repository`](https://docs.spring.io/spring-data/commons/docs/3.5.x/api/org/springframework/data/repository/Repository.html) invocations, you can set `management.metrics.data.repository.autotime.enabled` to `false` and exclusively use [`@Timed`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/annotation/Timed.html) annotations instead.

> [!NOTE]
> A [`@Timed`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/annotation/Timed.html) annotation with `longTask = true` enables a long task timer for the method.
> Long task timers require a separate metric name and can be stacked with a short task timer.

By default, repository invocation related metrics are tagged with the following information:

| Tag | Description |
| --- | --- |
| `repository` | The simple class name of the source [`Repository`](https://docs.spring.io/spring-data/commons/docs/3.5.x/api/org/springframework/data/repository/Repository.html). |
| `method` | The name of the [`Repository`](https://docs.spring.io/spring-data/commons/docs/3.5.x/api/org/springframework/data/repository/Repository.html) method that was invoked. |
| `state` | The result state (`SUCCESS`, `ERROR`, `CANCELED`, or `RUNNING`). |
| `exception` | The simple class name of any exception that was thrown from the invocation. |

To replace the default tags, provide a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) that implements [`RepositoryTagsProvider`](https://docs.spring.io/spring-boot/3.5.10/api/java/org/springframework/boot/actuate/metrics/data/RepositoryTagsProvider.html).

<a id="actuator.metrics.supported.rabbitmq"></a>

### RabbitMQ Metrics

Auto-configuration enables the instrumentation of all available RabbitMQ connection factories with a metric named `rabbitmq`.

<a id="actuator.metrics.supported.spring-integration"></a>

### Spring Integration Metrics

Spring Integration automatically provides [Micrometer support](https://docs.spring.io/spring-integration/reference/6.5/metrics.html#micrometer-integration) whenever a [`MeterRegistry`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/MeterRegistry.html) bean is available.
Metrics are published under the `spring.integration.` meter name.

<a id="actuator.metrics.supported.kafka"></a>

### Kafka Metrics

Auto-configuration registers a [`MicrometerConsumerListener`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/core/MicrometerConsumerListener.html) and [`MicrometerProducerListener`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/core/MicrometerProducerListener.html) for the auto-configured consumer factory and producer factory, respectively.
It also registers a [`KafkaStreamsMicrometerListener`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/streams/KafkaStreamsMicrometerListener.html) for [`StreamsBuilderFactoryBean`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/config/StreamsBuilderFactoryBean.html).
For more detail, see the [Micrometer Native Metrics](https://docs.spring.io/spring-kafka/reference/3.3/kafka/micrometer.html#micrometer-native) section of the Spring Kafka documentation.

<a id="actuator.metrics.supported.mongodb"></a>

### MongoDB Metrics

This section briefly describes the available metrics for MongoDB.

<a id="actuator.metrics.supported.mongodb.command"></a>

#### MongoDB Command Metrics

Auto-configuration registers a [`MongoMetricsCommandListener`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/binder/mongodb/MongoMetricsCommandListener.html) with the auto-configured [`MongoClient`](https://mongodb.github.io/mongo-java-driver/5.5/apidocs/mongodb-driver-sync/com/mongodb/client/MongoClient.html).

A timer metric named `mongodb.driver.commands` is created for each command issued to the underlying MongoDB driver.
Each metric is tagged with the following information by default:

| Tag | Description |
| --- | --- |
| `command` | The name of the command issued. |
| `cluster.id` | The identifier of the cluster to which the command was sent. |
| `server.address` | The address of the server to which the command was sent. |
| `status` | The outcome of the command (`SUCCESS` or `FAILED`). |

To replace the default metric tags, define a [`MongoCommandTagsProvider`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/binder/mongodb/MongoCommandTagsProvider.html) bean, as the following example shows:

#### Java

```java
import io.micrometer.core.instrument.binder.mongodb.MongoCommandTagsProvider;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyCommandTagsProviderConfiguration {

	@Bean
	public MongoCommandTagsProvider customCommandTagsProvider() {
		return new CustomCommandTagsProvider();
	}

}
```

#### Kotlin

```kotlin
import io.micrometer.core.instrument.binder.mongodb.MongoCommandTagsProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyCommandTagsProviderConfiguration {

	@Bean
	fun customCommandTagsProvider(): MongoCommandTagsProvider? {
		return CustomCommandTagsProvider()
	}

}

```

To disable the auto-configured command metrics, set the following property:

#### Properties

```properties
management.metrics.mongo.command.enabled=false
```

#### YAML

```yaml
management:
  metrics:
    mongo:
      command:
        enabled: false
```

<a id="actuator.metrics.supported.mongodb.connection-pool"></a>

#### MongoDB Connection Pool Metrics

Auto-configuration registers a [`MongoMetricsConnectionPoolListener`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/binder/mongodb/MongoMetricsConnectionPoolListener.html) with the auto-configured [`MongoClient`](https://mongodb.github.io/mongo-java-driver/5.5/apidocs/mongodb-driver-sync/com/mongodb/client/MongoClient.html).

The following gauge metrics are created for the connection pool:

- `mongodb.driver.pool.size` reports the current size of the connection pool, including idle and in-use members.
- `mongodb.driver.pool.checkedout` reports the count of connections that are currently in use.
- `mongodb.driver.pool.waitqueuesize` reports the current size of the wait queue for a connection from the pool.

Each metric is tagged with the following information by default:

| Tag | Description |
| --- | --- |
| `cluster.id` | The identifier of the cluster to which the connection pool corresponds. |
| `server.address` | The address of the server to which the connection pool corresponds. |

To replace the default metric tags, define a [`MongoConnectionPoolTagsProvider`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/binder/mongodb/MongoConnectionPoolTagsProvider.html) bean:

#### Java

```java
import io.micrometer.core.instrument.binder.mongodb.MongoConnectionPoolTagsProvider;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyConnectionPoolTagsProviderConfiguration {

	@Bean
	public MongoConnectionPoolTagsProvider customConnectionPoolTagsProvider() {
		return new CustomConnectionPoolTagsProvider();
	}

}
```

#### Kotlin

```kotlin
import io.micrometer.core.instrument.binder.mongodb.MongoConnectionPoolTagsProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyConnectionPoolTagsProviderConfiguration {

	@Bean
	fun customConnectionPoolTagsProvider(): MongoConnectionPoolTagsProvider {
		return CustomConnectionPoolTagsProvider()
	}

}

```

To disable the auto-configured connection pool metrics, set the following property:

#### Properties

```properties
management.metrics.mongo.connectionpool.enabled=false
```

#### YAML

```yaml
management:
  metrics:
    mongo:
      connectionpool:
        enabled: false
```

<a id="actuator.metrics.supported.jetty"></a>

### Jetty Metrics

Auto-configuration binds metrics for Jetty’s [`ThreadPool`](https://javadoc.jetty.org/jetty-12/org/eclipse/jetty/util/thread/ThreadPool.html) by using Micrometer’s [`JettyServerThreadPoolMetrics`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/binder/jetty/JettyServerThreadPoolMetrics.html).
Metrics for Jetty’s [`Connector`](https://javadoc.jetty.org/jetty-12/org/eclipse/jetty/server/Connector.html) instances are bound by using Micrometer’s [`JettyConnectionMetrics`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/binder/jetty/JettyConnectionMetrics.html) and, when `server.ssl.enabled` is set to `true`, Micrometer’s [`JettySslHandshakeMetrics`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/binder/jetty/JettySslHandshakeMetrics.html).

<a id="actuator.metrics.supported.redis"></a>

### Redis Metrics

Auto-configuration registers a [`MicrometerCommandLatencyRecorder`](https://javadoc.io/doc/io.lettuce/lettuce-core/6.6.0.RELEASE/io/lettuce/core/metrics/MicrometerCommandLatencyRecorder.html) for the auto-configured [`LettuceConnectionFactory`](https://docs.spring.io/spring-data/redis/docs/3.5.x/api/org/springframework/data/redis/connection/lettuce/LettuceConnectionFactory.html).
For more detail, see the [Observability section](https://redis.github.io/lettuce/advanced-usage/#observability) of the Lettuce documentation.

<a id="actuator.metrics.registering-custom"></a>

## Registering Custom Metrics

To register custom metrics, inject [`MeterRegistry`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/MeterRegistry.html) into your component:

#### Java

```java
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;

import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final Dictionary dictionary;

	public MyBean(MeterRegistry registry) {
		this.dictionary = Dictionary.load();
		registry.gauge("dictionary.size", Tags.empty(), this.dictionary.getWords().size());
	}

}
```

#### Kotlin

```kotlin
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.Tags
import org.springframework.stereotype.Component

@Component
class MyBean(registry: MeterRegistry) {

	private val dictionary: Dictionary

	init {
		dictionary = Dictionary.load()
		registry.gauge("dictionary.size", Tags.empty(), dictionary.words.size)
	}

}

```

If your metrics depend on other beans, we recommend that you use a [`MeterBinder`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/binder/MeterBinder.html) to register them:

#### Java

```java
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.binder.MeterBinder;

import org.springframework.context.annotation.Bean;

public class MyMeterBinderConfiguration {

	@Bean
	public MeterBinder queueSize(Queue queue) {
		return (registry) -> Gauge.builder("queueSize", queue::size).register(registry);
	}

}
```

#### Kotlin

```kotlin
import io.micrometer.core.instrument.Gauge
import io.micrometer.core.instrument.binder.MeterBinder
import org.springframework.context.annotation.Bean

class MyMeterBinderConfiguration {

	@Bean
	fun queueSize(queue: Queue): MeterBinder {
		return MeterBinder { registry ->
			Gauge.builder("queueSize", queue::size).register(registry)
		}
	}

}

```

Using a [`MeterBinder`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/binder/MeterBinder.html) ensures that the correct dependency relationships are set up and that the bean is available when the metric’s value is retrieved.
A [`MeterBinder`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/binder/MeterBinder.html) implementation can also be useful if you find that you repeatedly instrument a suite of metrics across components or applications.

> [!NOTE]
> By default, metrics from all [`MeterBinder`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/binder/MeterBinder.html) beans are automatically bound to the Spring-managed [`MeterRegistry`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/MeterRegistry.html).

<a id="actuator.metrics.customizing"></a>

## Customizing Individual Metrics

If you need to apply customizations to specific [`Meter`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/Meter.html) instances, you can use the [`MeterFilter`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/config/MeterFilter.html) interface.

For example, if you want to rename the `mytag.region` tag to `mytag.area` for all meter IDs beginning with `com.example`, you can do the following:

#### Java

```java
import io.micrometer.core.instrument.config.MeterFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyMetricsFilterConfiguration {

	@Bean
	public MeterFilter renameRegionTagMeterFilter() {
		return MeterFilter.renameTag("com.example", "mytag.region", "mytag.area");
	}

}
```

#### Kotlin

```kotlin
import io.micrometer.core.instrument.config.MeterFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyMetricsFilterConfiguration {

	@Bean
	fun renameRegionTagMeterFilter(): MeterFilter {
		return MeterFilter.renameTag("com.example", "mytag.region", "mytag.area")
	}

}

```

> [!NOTE]
> By default, all [`MeterFilter`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/config/MeterFilter.html) beans are automatically bound to the Spring-managed [`MeterRegistry`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/MeterRegistry.html).
> Make sure to register your metrics by using the Spring-managed [`MeterRegistry`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/MeterRegistry.html) and not any of the static methods on [`Metrics`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/Metrics.html).
> These use the global registry that is not Spring-managed.

<a id="actuator.metrics.customizing.common-tags"></a>

### Common Tags

Common tags are generally used for dimensional drill-down on the operating environment, such as host, instance, region, stack, and others.
Commons tags are applied to all meters and can be configured, as the following example shows:

#### Properties

```properties
management.metrics.tags.region=us-east-1
management.metrics.tags.stack=prod
```

#### YAML

```yaml
management:
  metrics:
    tags:
      region: "us-east-1"
      stack: "prod"
```

The preceding example adds `region` and `stack` tags to all meters with a value of `us-east-1` and `prod`, respectively.

> [!NOTE]
> The order of common tags is important if you use Graphite.
> As the order of common tags cannot be guaranteed by using this approach, Graphite users are advised to define a custom [`MeterFilter`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/config/MeterFilter.html) instead.

<a id="actuator.metrics.customizing.per-meter-properties"></a>

### Per-meter Properties

In addition to [`MeterFilter`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/config/MeterFilter.html) beans, you can apply a limited set of customization on a per-meter basis using properties.
Per-meter customizations are applied, using Spring Boot’s [`PropertiesMeterFilter`](https://docs.spring.io/spring-boot/3.5.10/api/java/org/springframework/boot/actuate/autoconfigure/metrics/PropertiesMeterFilter.html), to any meter IDs that start with the given name.
The following example filters out any meters that have an ID starting with `example.remote`.

#### Properties

```properties
management.metrics.enable.example.remote=false
```

#### YAML

```yaml
management:
  metrics:
    enable:
      example:
        remote: false
```

The following properties allow per-meter customization:

| Property | Description |
| --- | --- |
| `management.metrics.enable` | Whether to accept meters with certain IDs. Meters that are not accepted are filtered from the [`MeterRegistry`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/MeterRegistry.html). |
| `management.metrics.distribution.percentiles-histogram` | Whether to publish a histogram suitable for computing aggregable (across dimension) percentile approximations. |
| `management.metrics.distribution.minimum-expected-value`, `management.metrics.distribution.maximum-expected-value` | Publish fewer histogram buckets by clamping the range of expected values. |
| `management.metrics.distribution.percentiles` | Publish percentile values computed in your application |
| `management.metrics.distribution.expiry`, `management.metrics.distribution.buffer-length` | Give greater weight to recent samples by accumulating them in ring buffers which rotate after a configurable expiry, with a configurable buffer length. |
| `management.metrics.distribution.slo` | Publish a cumulative histogram with buckets defined by your service-level objectives. |

For more details on the concepts behind `percentiles-histogram`, `percentiles`, and `slo`, see the [Histograms and percentiles](https://docs.micrometer.io/micrometer/reference/1.15/concepts/histogram-quantiles.html) section of the Micrometer documentation.

<a id="actuator.metrics.endpoint"></a>

## Metrics Endpoint

Spring Boot provides a `metrics` endpoint that you can use diagnostically to examine the metrics collected by an application.
The endpoint is not available by default and must be exposed.
See [exposing endpoints](endpoints.md#actuator.endpoints.exposing) for more details.

Navigating to `/actuator/metrics` displays a list of available meter names.
You can drill down to view information about a particular meter by providing its name as a selector — for example, `/actuator/metrics/jvm.memory.max`.

> [!TIP]
> The name you use here should match the name used in the code, not the name after it has been naming-convention normalized for a monitoring system to which it is shipped.
> In other words, if `jvm.memory.max` appears as `jvm_memory_max` in Prometheus because of its snake case naming convention, you should still use `jvm.memory.max` as the selector when inspecting the meter in the `metrics` endpoint.

You can also add any number of `tag=KEY:VALUE` query parameters to the end of the URL to dimensionally drill down on a meter — for example, `/actuator/metrics/jvm.memory.max?tag=area:nonheap`.

> [!TIP]
> The reported measurements are the *sum* of the statistics of all meters that match the meter name and any tags that have been applied.
> In the preceding example, the returned `Value` statistic is the sum of the maximum memory footprints of the “Code Cache”, “Compressed Class Space”, and “Metaspace” areas of the heap.
> If you wanted to see only the maximum size for the “Metaspace”, you could add an additional `tag=id:Metaspace` — that is, `/actuator/metrics/jvm.memory.max?tag=area:nonheap&tag=id:Metaspace`.

<a id="actuator.metrics.micrometer-observation"></a>

## Integration with Micrometer Observation

A [`DefaultMeterObservationHandler`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.15.8/io/micrometer/core/instrument/observation/DefaultMeterObservationHandler.html) is automatically registered on the [`ObservationRegistry`](https://javadoc.io/doc/io.micrometer/micrometer-observation/1.15.8/io/micrometer/observation/ObservationRegistry.html), which creates metrics for every completed observation.
