---
title: "Actuator"
source: "how-to:actuator.adoc"
---

<a id="howto.actuator"></a>

# Actuator

Spring Boot includes the Spring Boot Actuator.
This section answers questions that often arise from its use.

<a id="howto.actuator.change-http-port-or-address"></a>

## Change the HTTP Port or Address of the Actuator Endpoints

In a standalone application, the Actuator HTTP port defaults to the same as the main HTTP port.
To make the application listen on a different port, set the external property: `management.server.port`.
To listen on a completely different network address (such as when you have an internal network for management and an external one for user applications), you can also set `management.server.address` to a valid IP address to which the server is able to bind.

For more detail, see the [`ManagementServerProperties`](https://docs.spring.io/spring-boot/3.3.13/api/java/org/springframework/boot/actuate/autoconfigure/web/server/ManagementServerProperties.html) source code and [Customizing the Management Server Port](../reference/actuator/monitoring.md#actuator.monitoring.customizing-management-server-port) in the “Production-Ready Features” section.

<a id="howto.actuator.customizing-sanitization"></a>

## Customizing Sanitization

To take control over the sanitization, define a [`SanitizingFunction`](https://docs.spring.io/spring-boot/3.3.13/api/java/org/springframework/boot/actuate/endpoint/SanitizingFunction.html) bean.
The [`SanitizableData`](https://docs.spring.io/spring-boot/3.3.13/api/java/org/springframework/boot/actuate/endpoint/SanitizableData.html) with which the function is called provides access to the key and value as well as the [`PropertySource`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/core/env/PropertySource.html) from which they came.
This allows you to, for example, sanitize every value that comes from a particular property source.
Each [`SanitizingFunction`](https://docs.spring.io/spring-boot/3.3.13/api/java/org/springframework/boot/actuate/endpoint/SanitizingFunction.html) is called in order until a function changes the value of the sanitizable data.

<a id="howto.actuator.map-health-indicators-to-metrics"></a>

## Map Health Indicators to Micrometer Metrics

Spring Boot health indicators return a [`Status`](https://docs.spring.io/spring-boot/3.3.13/api/java/org/springframework/boot/actuate/health/Status.html) type to indicate the overall system health.
If you want to monitor or alert on levels of health for a particular application, you can export these statuses as metrics with Micrometer.
By default, the status codes “UP”, “DOWN”, “OUT\_OF\_SERVICE” and “UNKNOWN” are used by Spring Boot.
To export these, you will need to convert these states to some set of numbers so that they can be used with a Micrometer [`Gauge`](https://javadoc.io/doc/io.micrometer/micrometer-core/1.13.15/io/micrometer/core/instrument/Gauge.html).

The following example shows one way to write such an exporter:

#### Java

```java
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;

import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.health.Status;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyHealthMetricsExportConfiguration {

	public MyHealthMetricsExportConfiguration(MeterRegistry registry, HealthEndpoint healthEndpoint) {
		// This example presumes common tags (such as the app) are applied elsewhere
		Gauge.builder("health", healthEndpoint, this::getStatusCode).strongReference(true).register(registry);
	}

	private int getStatusCode(HealthEndpoint health) {
		Status status = health.health().getStatus();
		if (Status.UP.equals(status)) {
			return 3;
		}
		if (Status.OUT_OF_SERVICE.equals(status)) {
			return 2;
		}
		if (Status.DOWN.equals(status)) {
			return 1;
		}
		return 0;
	}

}
```

#### Kotlin

```kotlin
import io.micrometer.core.instrument.Gauge
import io.micrometer.core.instrument.MeterRegistry
import org.springframework.boot.actuate.health.HealthEndpoint
import org.springframework.boot.actuate.health.Status
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyHealthMetricsExportConfiguration(registry: MeterRegistry, healthEndpoint: HealthEndpoint) {

	init {
		// This example presumes common tags (such as the app) are applied elsewhere
		Gauge.builder("health", healthEndpoint) { health ->
			getStatusCode(health).toDouble()
		}.strongReference(true).register(registry)
	}

	private fun getStatusCode(health: HealthEndpoint) = when (health.health().status) {
		Status.UP -> 3
		Status.OUT_OF_SERVICE -> 2
		Status.DOWN -> 1
		else -> 0
	}

}

```
