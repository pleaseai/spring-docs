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

For more detail, see the [`ManagementServerProperties`](https://docs.spring.io/spring-boot/3.3.1/api/java/org/springframework/boot/actuate/autoconfigure/web/server/ManagementServerProperties.html) source code and “[Customizing the Management Server Port](../reference/actuator/monitoring.md#actuator.monitoring.customizing-management-server-port)” in the “Production-ready features” section.

<a id="howto.actuator.customize-whitelabel-error-page"></a>

## Customize the ‘whitelabel’ Error Page

Spring Boot installs a ‘whitelabel’ error page that you see in a browser client if you encounter a server error (machine clients consuming JSON and other media types should see a sensible response with the right error code).

> [!NOTE]
> Set `server.error.whitelabel.enabled=false` to switch the default error page off.
> Doing so restores the default of the servlet container that you are using.
> Note that Spring Boot still tries to resolve the error view, so you should probably add your own error page rather than disabling it completely.

Overriding the error page with your own depends on the templating technology that you use.
For example, if you use Thymeleaf, you can add an `error.html` template.
If you use FreeMarker, you can add an `error.ftlh` template.
In general, you need a `View` that resolves with a name of `error` or a `@Controller` that handles the `/error` path.
Unless you replaced some of the default configuration, you should find a `BeanNameViewResolver` in your `ApplicationContext`, so a `@Bean` named `error` would be one way of doing that.
See [`ErrorMvcAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.3.1/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/web/servlet/error/ErrorMvcAutoConfiguration.java) for more options.

See also the section on “[Error Handling](../reference/web/servlet.md#web.servlet.spring-mvc.error-handling)” for details of how to register handlers in the servlet container.

<a id="howto.actuator.customizing-sanitization"></a>

## Customizing Sanitization

To take control over the sanitization, define a `SanitizingFunction` bean.
The `SanitizableData` with which the function is called provides access to the key and value as well as the `PropertySource` from which they came.
This allows you to, for example, sanitize every value that comes from a particular property source.
Each `SanitizingFunction` is called in order until a function changes the value of the sanitizable data.

<a id="howto.actuator.map-health-indicators-to-metrics"></a>

## Map Health Indicators to Micrometer Metrics

Spring Boot health indicators return a `Status` type to indicate the overall system health.
If you want to monitor or alert on levels of health for a particular application, you can export these statuses as metrics with Micrometer.
By default, the status codes “UP”, “DOWN”, “OUT\_OF\_SERVICE” and “UNKNOWN” are used by Spring Boot.
To export these, you will need to convert these states to some set of numbers so that they can be used with a Micrometer `Gauge`.

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
