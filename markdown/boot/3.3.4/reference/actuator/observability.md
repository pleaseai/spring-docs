---
title: "Observability"
source: "reference:actuator/observability.adoc"
---

<a id="actuator.observability"></a>

# Observability

Observability is the ability to observe the internal state of a running system from the outside.
It consists of the three pillars: logging, metrics and traces.

For metrics and traces, Spring Boot uses [Micrometer Observation](https://docs.micrometer.io/micrometer/reference/1.13/observation).
To create your own observations (which will lead to metrics and traces), you can inject an `ObservationRegistry`.

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

> [!NOTE]
> Low cardinality tags will be added to metrics and traces, while high cardinality tags will only be added to traces.

Beans of type `ObservationPredicate`, `GlobalObservationConvention`, `ObservationFilter` and `ObservationHandler` will be automatically registered on the `ObservationRegistry`.
You can additionally register any number of `ObservationRegistryCustomizer` beans to further configure the registry.

Observability support relies on the [Context Propagation library](https://github.com/micrometer-metrics/context-propagation) for forwarding the current observation across threads and reactive pipelines.
By default, `ThreadLocal` values are not automatically reinstated in reactive operators.
This behavior is controlled with the `spring.reactor.context-propagation` property, which can be set to `auto` to enable automatic propagation.

For more details about observations please see the [Micrometer Observation documentation](https://docs.micrometer.io/micrometer/reference/1.13/observation).

> [!TIP]
> Observability for JDBC can be configured using a separate project.
> The [Datasource Micrometer project](https://github.com/jdbc-observations/datasource-micrometer) provides a Spring Boot starter which automatically creates observations when JDBC operations are invoked.
> Read more about it [in the reference documentation](https://jdbc-observations.github.io/datasource-micrometer/docs/current/docs/html/).

> [!TIP]
> Observability for R2DBC is built into Spring Boot.
> To enable it, add the `io.r2dbc:r2dbc-proxy` dependency to your project.

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

If you need greater control over the prevention of observations, you can register beans of type `ObservationPredicate`.
Observations are only reported if all the `ObservationPredicate` beans return `true` for that observation.

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

The preceding example will prevent all observations whose name contains "denied".

<a id="actuator.observability.opentelemetry"></a>

## OpenTelemetry Support

> [!NOTE]
> There are several ways to support [OpenTelemetry](https://opentelemetry.io/) in your application.
> You can use the [OpenTelemetry Java Agent](https://opentelemetry.io/docs/zero-code/java/agent/) or the [OpenTelemetry Spring Boot Starter](https://opentelemetry.io/docs/zero-code/java/spring-boot-starter/),
> which are supported by the OTel community; the metrics and traces use the semantic conventions defined by OTel libraries.
> This documentation describes OpenTelemetry as officially supported by the Spring team, using Micrometer and the OTLP exporter;
> the metrics and traces use the semantic conventions described in the Spring projects documentation, such as [Spring Framework](https://docs.spring.io/spring-framework/reference/6.1/integration/observability.html).

Spring Boot’s actuator module includes basic support for OpenTelemetry.

It provides a bean of type `OpenTelemetry`, and if there are beans of type `SdkTracerProvider`, `ContextPropagators`, `SdkLoggerProvider` or `SdkMeterProvider` in the application context, they automatically get registered.
Additionally, it provides a `Resource` bean.
The attributes of the auto-configured `Resource` can be configured via the `management.opentelemetry.resource-attributes` configuration property.
If you have defined your own `Resource` bean, this will no longer be the case.

> [!NOTE]
> Spring Boot does not provide auto-configuration for OpenTelemetry metrics or logging.
> OpenTelemetry tracing is only auto-configured when used together with [Micrometer Tracing](tracing.md).

The next sections will provide more details about logging, metrics and traces.

<a id="actuator.observability.annotations"></a>

## Micrometer Observation Annotations support

To enable scanning of metrics and tracing annotations like `@Timed`, `@Counted`, `@MeterTag` and `@NewSpan` annotations, you will need to set the `management.observations.annotations.enabled` property to `true`.
This feature is supported Micrometer directly. Please refer to the [Micrometer](https://docs.micrometer.io/micrometer/reference/1.13/concepts#_the_timed_annotation) and [Micrometer Tracing](https://docs.micrometer.io/tracing/reference/1.3/api.html#_aspect_oriented_programming) reference docs.
