---
title: "Observability"
source: "reference:actuator/observability.adoc"
---

<a id="actuator.observability"></a>

# Observability

Observability is the ability to observe the internal state of a running system from the outside.
It consists of the three pillars: logging, metrics and traces.

For metrics and traces, Spring Boot uses [Micrometer Observation](https://docs.micrometer.io/micrometer/reference/1.16/observation).
To create your own observations (which will lead to metrics and traces), you can inject an [`ObservationRegistry`](https://javadoc.io/doc/io.micrometer/micrometer-observation/1.16.4/io/micrometer/observation/ObservationRegistry.html).

#### Java

```java
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;

import org.springframework.stereotype.Component;

@Component
public class MyCustomObservation {

	private final ObservationRegistry observationRegistry;

	public MyCustomObservation(ObservationRegistry observationRegistry) {
		this.observationRegistry = observationRegistry;
	}

	public void doSomething() {
		Observation.createNotStarted("doSomething", this.observationRegistry)
			.lowCardinalityKeyValue("locale", "en-US")
			.highCardinalityKeyValue("userId", "42")
			.observe(() -> {
				// Execute business logic here
			});
	}

}
```

#### Kotlin

```kotlin
import io.micrometer.observation.Observation
import io.micrometer.observation.ObservationRegistry;

import org.springframework.stereotype.Component

@Component
class MyCustomObservation(private val observationRegistry: ObservationRegistry) {

	fun doSomething() {
		Observation.createNotStarted("doSomething", observationRegistry)
			.lowCardinalityKeyValue("locale", "en-US")
			.highCardinalityKeyValue("userId", "42")
			.observe {
				// Execute business logic here
			}
	}

}
```

> [!NOTE]
> Low cardinality tags will be added to metrics and traces, while high cardinality tags will only be added to traces.

Beans of type [`ObservationPredicate`](https://javadoc.io/doc/io.micrometer/micrometer-observation/1.16.4/io/micrometer/observation/ObservationPredicate.html), [`GlobalObservationConvention`](https://javadoc.io/doc/io.micrometer/micrometer-observation/1.16.4/io/micrometer/observation/GlobalObservationConvention.html), [`ObservationFilter`](https://javadoc.io/doc/io.micrometer/micrometer-observation/1.16.4/io/micrometer/observation/ObservationFilter.html) and [`ObservationHandler`](https://javadoc.io/doc/io.micrometer/micrometer-observation/1.16.4/io/micrometer/observation/ObservationHandler.html) will be automatically registered on the [`ObservationRegistry`](https://javadoc.io/doc/io.micrometer/micrometer-observation/1.16.4/io/micrometer/observation/ObservationRegistry.html).
You can additionally register any number of [`ObservationRegistryCustomizer`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/micrometer/observation/autoconfigure/ObservationRegistryCustomizer.html) beans to further configure the registry.

> [!TIP]
> Observability for JDBC can be configured using a separate project.
> The [Datasource Micrometer project](https://github.com/jdbc-observations/datasource-micrometer) provides a Spring Boot starter which automatically creates observations when JDBC operations are invoked.
> Read more about it [in the reference documentation](https://jdbc-observations.github.io/datasource-micrometer/docs/current/docs/html/).

> [!TIP]
> Observability for R2DBC is built into Spring Boot.
> To enable it, add the `io.r2dbc:r2dbc-proxy` dependency to your project.

<a id="actuator.observability.context-propagation"></a>

## Context Propagation

Observability support relies on the [Context Propagation library](https://github.com/micrometer-metrics/context-propagation) for forwarding the current observation across threads and reactive pipelines.
By default, [`ThreadLocal`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/ThreadLocal.html) values are not automatically reinstated in reactive operators.
This behavior is controlled with the `spring.reactor.context-propagation` property, which can be set to `auto` to enable automatic propagation.

If you’re working with [`@Async`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/scheduling/annotation/Async.html) methods or use an [`AsyncTaskExecutor`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/core/task/AsyncTaskExecutor.html), you have to register the [`ContextPropagatingTaskDecorator`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/core/task/support/ContextPropagatingTaskDecorator.html) on the executor, otherwise the observability context is lost when switching threads.
This can be done using this configuration:

#### Java

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.support.ContextPropagatingTaskDecorator;

@Configuration(proxyBeanMethods = false)
class ContextPropagationConfiguration {

	@Bean
	ContextPropagatingTaskDecorator contextPropagatingTaskDecorator() {
		return new ContextPropagatingTaskDecorator();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.task.support.ContextPropagatingTaskDecorator

@Configuration(proxyBeanMethods = false)
class ContextPropagationConfiguration {

	@Bean
	fun contextPropagatingTaskDecorator(): ContextPropagatingTaskDecorator {
		return ContextPropagatingTaskDecorator()
	}

}
```

For more details about observations please see the [Micrometer Observation documentation](https://docs.micrometer.io/micrometer/reference/1.16/observation).

<a id="actuator.observability.common-tags"></a>

## Common Tags

Common tags are generally used for dimensional drill-down on the operating environment, such as host, instance, region, stack, and others.
Common tags are applied to all observations as low cardinality tags and can be configured, as the following example shows:

#### Properties

```properties
management.observations.key-values.region=us-east-1
management.observations.key-values.stack=prod
```

#### YAML

```yaml
management:
  observations:
    key-values:
      region: "us-east-1"
      stack: "prod"
```

The preceding example adds `region` and `stack` tags to all observations with a value of `us-east-1` and `prod`, respectively.

<a id="actuator.observability.preventing-observations"></a>

## Preventing Observations

If you’d like to prevent some observations from being reported, you can use the `management.observations.enable` properties:

#### Properties

```properties
management.observations.enable.denied.prefix=false
management.observations.enable.another.denied.prefix=false
```

#### YAML

```yaml
management:
  observations:
    enable:
      denied:
        prefix: false
      another:
        denied:
          prefix: false
```

The preceding example will prevent all observations with a name starting with `denied.prefix` or `another.denied.prefix`.

> [!TIP]
> If you want to prevent Spring Security from reporting observations, set the property `management.observations.enable.spring.security` to `false`.

If you need greater control over the prevention of observations, you can register beans of type [`ObservationPredicate`](https://javadoc.io/doc/io.micrometer/micrometer-observation/1.16.4/io/micrometer/observation/ObservationPredicate.html).
Observations are only reported if all the [`ObservationPredicate`](https://javadoc.io/doc/io.micrometer/micrometer-observation/1.16.4/io/micrometer/observation/ObservationPredicate.html) beans return `true` for that observation.

#### Java

```java
import io.micrometer.observation.Observation.Context;
import io.micrometer.observation.ObservationPredicate;

import org.springframework.stereotype.Component;

@Component
class MyObservationPredicate implements ObservationPredicate {

	@Override
	public boolean test(String name, Context context) {
		return !name.contains("denied");
	}

}
```

#### Kotlin

```kotlin
import io.micrometer.observation.Observation.Context
import io.micrometer.observation.ObservationPredicate
import org.springframework.stereotype.Component

@Component
class MyObservationPredicate : ObservationPredicate {

	override fun test(name: String, context: Context): Boolean {
		return !name.contains("denied")
	}

}
```

The preceding example will prevent all observations whose name contains "denied".

<a id="actuator.observability.annotations"></a>

## Micrometer Observation Annotations support

To enable scanning of observability annotations like [`@Observed`](https://javadoc.io/doc/io.micrometer/micrometer-observation/1.16.4/io/micrometer/observation/annotation/Observed.html), [`@Timed`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.16.4/io/micrometer/core/annotation/Timed.html), [`@Counted`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.16.4/io/micrometer/core/annotation/Counted.html), [`@MeterTag`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.16.4/io/micrometer/core/aop/MeterTag.html) and [`@NewSpan`](https://javadoc.io/doc/io.micrometer/micrometer-tracing/1.6.4/io/micrometer/tracing/annotation/NewSpan.html), set the `management.observations.annotations.enabled` property to `true`.
A dependency on `org.aspectj:aspectjweaver`, which is part of `spring-boot-starter-aspectj`, is also required.
This feature is supported by Micrometer directly.
Please refer to the [Micrometer](https://docs.micrometer.io/micrometer/reference/1.16/concepts/timers.html#_the_timed_annotation), [Micrometer Observation](https://docs.micrometer.io/micrometer/reference/1.16/observation/components.html#micrometer-observation-annotations) and [Micrometer Tracing](https://docs.micrometer.io/tracing/reference/1.6/api.html#_aspect_oriented_programming) reference docs.

> [!NOTE]
> When you annotate methods or classes which are already instrumented (for example, [Spring Data repositories](metrics.md#actuator.metrics.supported.spring-data-repository) or [Spring MVC controllers](metrics.md#actuator.metrics.supported.spring-mvc)), you will get duplicate observations.
> In that case you can either disable the automatic instrumentation using [properties](#actuator.observability.preventing-observations) or an [`ObservationPredicate`](https://javadoc.io/doc/io.micrometer/micrometer-observation/1.16.4/io/micrometer/observation/ObservationPredicate.html) and rely on your annotations, or you can remove your annotations.

<a id="actuator.observability.opentelemetry"></a>

## OpenTelemetry Support

> [!NOTE]
> There are several ways to support [OpenTelemetry](https://opentelemetry.io/) in your application.
> You can use the [OpenTelemetry Java Agent](https://opentelemetry.io/docs/zero-code/java/agent/) or the [OpenTelemetry Spring Boot Starter](https://opentelemetry.io/docs/zero-code/java/spring-boot-starter/),
> which are supported by the OTel community; the metrics and traces use the semantic conventions defined by OTel libraries.
> This documentation describes OpenTelemetry as officially supported by the Spring team, using Micrometer and the OTLP exporter;
> the metrics and traces use the semantic conventions described in the Spring projects documentation, such as [Spring Framework](https://docs.spring.io/spring-framework/reference/7.0/integration/observability.html).

Spring Boot’s actuator module includes basic support for OpenTelemetry.

It provides a bean of type [`OpenTelemetry`](https://javadoc.io/doc/io.opentelemetry/opentelemetry-api/1.55.0/io/opentelemetry/api/OpenTelemetry.html), and if there are beans of type [`SdkTracerProvider`](https://javadoc.io/doc/io.opentelemetry/opentelemetry-sdk-trace/1.55.0/io/opentelemetry/sdk/trace/SdkTracerProvider.html), [`ContextPropagators`](https://javadoc.io/doc/io.opentelemetry/opentelemetry-context/1.55.0/io/opentelemetry/context/propagation/ContextPropagators.html), [`SdkLoggerProvider`](https://javadoc.io/doc/io.opentelemetry/opentelemetry-sdk-logs/1.55.0/io/opentelemetry/sdk/logs/SdkLoggerProvider.html) or [`SdkMeterProvider`](https://javadoc.io/doc/io.opentelemetry/opentelemetry-sdk-metrics/1.55.0/io/opentelemetry/sdk/metrics/SdkMeterProvider.html) in the application context, they automatically get registered.
Additionally, it provides a [`Resource`](https://javadoc.io/doc/io.opentelemetry/opentelemetry-sdk-common/1.55.0/io/opentelemetry/sdk/resources/Resource.html) bean.
The attributes of the auto-configured [`Resource`](https://javadoc.io/doc/io.opentelemetry/opentelemetry-sdk-common/1.55.0/io/opentelemetry/sdk/resources/Resource.html) can be configured via the `management.opentelemetry.resource-attributes` configuration property.
Auto-configured attributes will be merged with attributes from the `OTEL_RESOURCE_ATTRIBUTES` and `OTEL_SERVICE_NAME` environment variables, with attributes configured through the configuration property taking precedence over those from the environment variables.

If you have defined your own [`Resource`](https://javadoc.io/doc/io.opentelemetry/opentelemetry-sdk-common/1.55.0/io/opentelemetry/sdk/resources/Resource.html) bean, this will no longer be the case.

> [!NOTE]
> Spring Boot does not provide automatic exporting of OpenTelemetry metrics or logs.
> Exporting OpenTelemetry traces is only auto-configured when used together with [Micrometer Tracing](tracing.md).

<a id="actuator.observability.opentelemetry.environment-variables"></a>

### Environment variables

Spring Boot supports the following environment variables to configure the OpenTelemetry resource:

- [`OTEL_RESOURCE_ATTRIBUTES`](https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/#general-sdk-configuration)
- [`OTEL_SERVICE_NAME`](https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/#general-sdk-configuration)

> [!NOTE]
> The `OTEL_RESOURCE_ATTRIBUTES` environment variable consists of a list of key-value pairs.
> For example: `key1=value1,key2=value2,key3=spring%20boot`.
> All attribute values are treated as strings, and any characters outside the baggage-octet range must be **percent-encoded**.

Micrometer also supports the following environment variables to configure the metrics export over OTLP:

- [`OTEL_EXPORTER_OTLP_ENDPOINT`](https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/#otel_exporter_otlp_endpoint)
- [`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`](https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/#otel_exporter_otlp_metrics_endpoint)
- [`OTEL_EXPORTER_OTLP_HEADERS`](https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/#otel_exporter_otlp_headers)
- [`OTEL_EXPORTER_OTLP_METRICS_HEADERS`](https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/#otel_exporter_otlp_metrics_headers)

Other environment variables as described in [the OpenTelemetry documentation](https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/) are not supported.

If you want all environment variables specified by OpenTelemetry’s SDK to be effective, you have to supply your own `OpenTelemetry` bean.

> [!WARNING]
> Doing this will switch off Spring Boot’s OpenTelemetry auto-configuration and may break the built-in observability functionality.

First, add a dependency to `io.opentelemetry:opentelemetry-sdk-extension-autoconfigure` to get [OpenTelemetry’s zero-code SDK autoconfigure module](https://opentelemetry.io/docs/languages/java/configuration/#zero-code-sdk-autoconfigure), then add this configuration:

```java
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.sdk.autoconfigure.AutoConfiguredOpenTelemetrySdk;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class AutoConfiguredOpenTelemetrySdkConfiguration {

	@Bean
	OpenTelemetry autoConfiguredOpenTelemetrySdk() {
		return AutoConfiguredOpenTelemetrySdk.initialize().getOpenTelemetrySdk();
	}

}
```

<a id="actuator.observability.opentelemetry.logging"></a>

### Logging

The [`OpenTelemetryLoggingAutoConfiguration`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/opentelemetry/autoconfigure/logging/OpenTelemetryLoggingAutoConfiguration.html) configures OpenTelemetry’s [`SdkLoggerProvider`](https://javadoc.io/doc/io.opentelemetry/opentelemetry-sdk-logs/1.55.0/io/opentelemetry/sdk/logs/SdkLoggerProvider.html).
Exporting logs via OTLP is supported through the [`OtlpLoggingAutoConfiguration`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/opentelemetry/autoconfigure/logging/otlp/OtlpLoggingAutoConfiguration.html), which enables OTLP log exporting over HTTP or gRPC.

However, while there is a `SdkLoggerProvider` bean, Spring Boot doesn’t support bridging logs to this bean out of the box.
This can be done with 3rd-party log bridges, as described in the [Logging with OpenTelemetry](loggers.md#actuator.loggers.opentelemetry) section.

<a id="actuator.observability.opentelemetry.metrics"></a>

### Metrics

The choice of metrics in the Spring portfolio is Micrometer, which means that metrics are not collected and exported through the OpenTelemetry’s [`SdkMeterProvider`](https://javadoc.io/doc/io.opentelemetry/opentelemetry-sdk-metrics/1.55.0/io/opentelemetry/sdk/metrics/SdkMeterProvider.html).
Spring Boot doesn’t provide a `SdkMeterProvider` bean.

However, Micrometer metrics can be exported via OTLP to any OpenTelemetry capable backend using the [`OtlpMeterRegistry`](https://javadoc.io/doc/io.micrometer/micrometer-registry-otlp/1.16.4/io/micrometer/registry/otlp/OtlpMeterRegistry.html), as described in the [Metrics with OTLP](metrics.md#actuator.metrics.export.otlp) section.

> [!NOTE]
> Micrometer’s OTLP registry doesn’t use the `Resource` bean, but setting `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_SERVICE_NAME` or `management.opentelemetry.resource-attributes` works.

<a id="actuator.observability.opentelemetry.metrics.api-and-sdk"></a>

#### Metrics via the OpenTelemetry API and SDK

If you or a dependency you include make use of OpenTelemetry’s [`MeterProvider`](https://javadoc.io/doc/io.opentelemetry/opentelemetry-api/1.55.0/io/opentelemetry/api/metrics/MeterProvider.html), those metrics are not exported.

We strongly recommend that you report your metrics with Micrometer.
If a dependency you include uses OpenTelemetry’s `MeterProvider`, you can include this configuration in your application to configure a `MeterProvider` bean, which you then have to wire into your dependency:

```java
import java.time.Duration;

import io.opentelemetry.exporter.otlp.http.metrics.OtlpHttpMetricExporter;
import io.opentelemetry.sdk.metrics.SdkMeterProvider;
import io.opentelemetry.sdk.metrics.export.MetricExporter;
import io.opentelemetry.sdk.metrics.export.MetricReader;
import io.opentelemetry.sdk.metrics.export.PeriodicMetricReader;
import io.opentelemetry.sdk.resources.Resource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class OpenTelemetryMetricsConfiguration {

	@Bean
	OtlpHttpMetricExporter metricExporter() {
		String endpoint = "http://localhost:4318/v1/metrics";
		return OtlpHttpMetricExporter.builder().setEndpoint(endpoint).build();
	}

	@Bean
	PeriodicMetricReader metricReader(MetricExporter exporter) {
		Duration interval = Duration.ofMinutes(1);
		return PeriodicMetricReader.builder(exporter).setInterval(interval).build();
	}

	@Bean
	SdkMeterProvider meterProvider(Resource resource, MetricReader metricReader) {
		return SdkMeterProvider.builder().registerMetricReader(metricReader).setResource(resource).build();
	}

}
```

This configuration also enables metrics export via OTLP over HTTP.

<a id="actuator.observability.opentelemetry.tracing"></a>

### Tracing

If Micrometer tracing is used, the [`OpenTelemetryTracingAutoConfiguration`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/micrometer/tracing/opentelemetry/autoconfigure/OpenTelemetryTracingAutoConfiguration.html) configures OpenTelemetry’s [`SdkTracerProvider`](https://javadoc.io/doc/io.opentelemetry/opentelemetry-sdk-trace/1.55.0/io/opentelemetry/sdk/trace/SdkTracerProvider.html).
Exporting traces through OTLP is enabled by the [`OtlpTracingAutoConfiguration`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/micrometer/tracing/opentelemetry/autoconfigure/otlp/OtlpTracingAutoConfiguration.html), which supports exporting traces with OTLP over HTTP or gRPC.

We strongly recommend using the Micrometer Observation or Tracing API instead of using the OpenTelemetry API directly.
