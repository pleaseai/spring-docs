---
title: "Loggers"
source: "reference:actuator/loggers.adoc"
---

<a id="actuator.loggers"></a>

# Loggers

Spring Boot Actuator includes the ability to view and configure the log levels of your application at runtime.
You can view either the entire list or an individual logger’s configuration, which is made up of both the explicitly configured logging level as well as the effective logging level given to it by the logging framework.
These levels can be one of:

- `TRACE`
- `DEBUG`
- `INFO`
- `WARN`
- `ERROR`
- `FATAL`
- `OFF`
- `null`

`null` indicates that there is no explicit configuration.

<a id="actuator.loggers.configure"></a>

## Configure a Logger

To configure a given logger, `POST` a partial entity to the resource’s URI, as the following example shows:

```json
{
	"configuredLevel": "DEBUG"
}
```

> [!TIP]
> To “reset” the specific level of the logger (and use the default configuration instead), you can pass a value of `null` as the `configuredLevel`.

<a id="actuator.loggers.opentelemetry"></a>

## OpenTelemetry

By default, logging via OpenTelemetry is not configured.
You have to provide the location of the OpenTelemetry logs endpoint to configure it:

#### Properties

```properties
management.otlp.logging.endpoint=https://otlp.example.com:4318/v1/logs
```

#### YAML

```yaml
management:
  otlp:
    logging:
      endpoint: "https://otlp.example.com:4318/v1/logs"
```

> [!NOTE]
> The OpenTelemetry Logback appender and Log4j appender are not part of Spring Boot.
> For more details, see the [OpenTelemetry Logback appender](https://github.com/open-telemetry/opentelemetry-java-instrumentation/tree/main/instrumentation/logback/logback-appender-1.0/library) or the [OpenTelemetry Log4j2 appender](https://github.com/open-telemetry/opentelemetry-java-instrumentation/tree/main/instrumentation/log4j/log4j-appender-2.17/library) in the [OpenTelemetry Java instrumentation GitHub repository](https://github.com/open-telemetry/opentelemetry-java-instrumentation).

> [!TIP]
> You have to configure the appender in your `logback-spring.xml` or `log4j2-spring.xml` configuration to get OpenTelemetry logging working.

The `OpenTelemetryAppender` for both Logback and Log4j requires access to an [`OpenTelemetry`](https://javadoc.io/doc/io.opentelemetry/opentelemetry-api/1.49.0/io/opentelemetry/api/OpenTelemetry.html) instance to function properly.
This instance must be set programmatically during application startup, which can be done like this:

```java
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.instrumentation.logback.appender.v1_0.OpenTelemetryAppender;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Component;

@Component
class OpenTelemetryAppenderInitializer implements InitializingBean {

	private final OpenTelemetry openTelemetry;

	OpenTelemetryAppenderInitializer(OpenTelemetry openTelemetry) {
		this.openTelemetry = openTelemetry;
	}

	@Override
	public void afterPropertiesSet() {
		OpenTelemetryAppender.install(this.openTelemetry);
	}

}
```
