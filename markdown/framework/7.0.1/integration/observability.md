---
title: "Observability Support"
source: "ROOT:integration/observability.adoc"
---

<a id="observability"></a>

# Observability Support

Micrometer defines an [Observation concept that enables both Metrics and Traces](https://docs.micrometer.io/micrometer/reference/observation.html) in applications.
Metrics support offers a way to create timers, gauges, or counters for collecting statistics about the runtime behavior of your application.
Metrics can help you to track error rates, usage patterns, performance, and more.
Traces provide a holistic view of an entire system, crossing application boundaries; you can zoom in on particular user requests and follow their entire completion across applications.

Spring Framework instruments various parts of its own codebase to publish observations if an `ObservationRegistry` is configured.
You can learn more about [configuring the observability infrastructure in Spring Boot](https://docs.spring.io/spring-boot/reference/actuator/observability.html).

<a id="observability.list"></a>

## List of produced Observations

Spring Framework instruments various features for observability.
As outlined [at the beginning of this section](#), observations can generate timer Metrics and/or Traces depending on the configuration.

| Observation name | Description |
| --- | --- |
| [`"http.client.requests"`](#observability.http-client) | Time spent for HTTP client exchanges |
| [`"http.server.requests"`](#observability.http-server) | Processing time for HTTP server exchanges at the Framework level |
| [`"jms.message.publish"`](#observability.jms.publish) | Time spent sending a JMS message to a destination by a message producer. |
| [`"jms.message.process"`](#observability.jms.process) | Processing time for a JMS message that was previously received by a message consumer. |
| [`"tasks.scheduled.execution"`](#observability.tasks-scheduled) | Processing time for an execution of a `@Scheduled` task |

> [!NOTE]
> Observations use Micrometer’s official naming convention, but Metrics names will be automatically converted
> [to the format preferred by the monitoring system backend](https://docs.micrometer.io/micrometer/reference/concepts/naming.html)
> (Prometheus, Atlas, Graphite, InfluxDB…​).

<a id="observability.concepts"></a>

## Micrometer Observation concepts

If you are not familiar with Micrometer Observation, here’s a quick summary of the concepts you should know about.

- `Observation` is the actual recording of something happening in your application. This is processed by `ObservationHandler` implementations to produce metrics or traces.
- Each observation has a corresponding `ObservationContext` implementation; this type holds all the relevant information for extracting metadata for it.
In the case of an HTTP server observation, the context implementation could hold the HTTP request, the HTTP response, any exception thrown during processing, and so forth.
- Each `Observation` holds `KeyValues` metadata. In the case of an HTTP server observation, this could be the HTTP request method, the HTTP response status, and so forth.
This metadata is contributed by `ObservationConvention` implementations which should declare the type of `ObservationContext` they support.
- `KeyValues` are said to be "low cardinality" if there is a low, bounded number of possible values for the `KeyValue` tuple (HTTP method is a good example).
Low cardinality values are contributed to metrics only.
Conversely, "high cardinality" values are unbounded (for example, HTTP request URIs) and are only contributed to traces.
- An `ObservationDocumentation` documents all observations in a particular domain, listing the expected key names and their meaning.

<a id="observability.config"></a>

## Configuring Observations

Global configuration options are available at the `ObservationRegistry#observationConfig()` level.
Each instrumented component will provide two extension points:

- setting the `ObservationRegistry`; if not set, observations will not be recorded and will be no-ops
- providing a custom `ObservationConvention` to change the default observation name and extracted `KeyValues`

<a id="observability.config.conventions"></a>

### Using custom Observation conventions

Let’s take the example of the Spring MVC "http.server.requests" metrics instrumentation with the `ServerHttpObservationFilter`.
This observation uses a `ServerRequestObservationConvention` with a `ServerRequestObservationContext`; custom conventions can be configured on the Servlet filter.
If you would like to customize the metadata produced with the observation, you can extend the `DefaultServerRequestObservationConvention` for your requirements:

```java
import io.micrometer.common.KeyValue;
import io.micrometer.common.KeyValues;

import org.springframework.http.server.observation.DefaultServerRequestObservationConvention;
import org.springframework.http.server.observation.ServerRequestObservationContext;

public class ExtendedServerRequestObservationConvention extends DefaultServerRequestObservationConvention {

	@Override
	public KeyValues getLowCardinalityKeyValues(ServerRequestObservationContext context) {
		// here, we just want to have an additional KeyValue to the observation, keeping the default values
		return super.getLowCardinalityKeyValues(context).and(custom(context));
	}

	private KeyValue custom(ServerRequestObservationContext context) {
		return KeyValue.of("custom.method", context.getCarrier().getMethod());
	}

}
```

If you want full control, you can implement the entire convention contract for the observation you’re interested in:

```java
import java.util.Locale;

import io.micrometer.common.KeyValue;
import io.micrometer.common.KeyValues;

import org.springframework.http.server.observation.ServerHttpObservationDocumentation;
import org.springframework.http.server.observation.ServerRequestObservationContext;
import org.springframework.http.server.observation.ServerRequestObservationConvention;

public class CustomServerRequestObservationConvention implements ServerRequestObservationConvention {

	@Override
	public String getName() {
		// will be used as the metric name
		return "http.server.requests";
	}

	@Override
	public String getContextualName(ServerRequestObservationContext context) {
		// will be used for the trace name
		return "http " + context.getCarrier().getMethod().toLowerCase(Locale.ROOT);
	}

	@Override
	public KeyValues getLowCardinalityKeyValues(ServerRequestObservationContext context) {
		return KeyValues.of(method(context), status(context), exception(context));
	}
	@Override
	public KeyValues getHighCardinalityKeyValues(ServerRequestObservationContext context) {
		return KeyValues.of(httpUrl(context));
	}

	private KeyValue method(ServerRequestObservationContext context) {
		// You should reuse as much as possible the corresponding ObservationDocumentation for key names
		return KeyValue.of(ServerHttpObservationDocumentation.LowCardinalityKeyNames.METHOD, context.getCarrier().getMethod());
	}
	private KeyValue status(ServerRequestObservationContext context) {
		return KeyValue.of(ServerHttpObservationDocumentation.LowCardinalityKeyNames.STATUS, String.valueOf(context.getResponse().getStatus()));
	}

	private KeyValue exception(ServerRequestObservationContext context) {
		String exception = (context.getError() != null ? context.getError().getClass().getSimpleName() : KeyValue.NONE_VALUE);
		return KeyValue.of(ServerHttpObservationDocumentation.LowCardinalityKeyNames.EXCEPTION, exception);
	}

	private KeyValue httpUrl(ServerRequestObservationContext context) {
		return KeyValue.of(ServerHttpObservationDocumentation.HighCardinalityKeyNames.HTTP_URL, context.getCarrier().getRequestURI());
	}
}
```

You can also achieve similar goals using a custom `ObservationFilter` – adding or removing key values for an observation.
Filters do not replace the default convention and are used as a post-processing component.

```java
import io.micrometer.common.KeyValue;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationFilter;

import org.springframework.http.server.observation.ServerRequestObservationContext;

public class ServerRequestObservationFilter implements ObservationFilter {

	@Override
	public Observation.Context map(Observation.Context context) {
		if (context instanceof ServerRequestObservationContext serverContext) {
			context.setName("custom.observation.name");
			context.addLowCardinalityKeyValue(KeyValue.of("project", "spring"));
			String customAttribute = (String) serverContext.getCarrier().getAttribute("customAttribute");
			context.addLowCardinalityKeyValue(KeyValue.of("custom.attribute", customAttribute));
		}
		return context;
	}
}
```

You can configure `ObservationFilter` instances on the `ObservationRegistry`.

<a id="observability.tasks-scheduled"></a>

## @Scheduled tasks instrumentation

An Observation is created for [each execution of an `@Scheduled` task](scheduling.md#scheduling-enable-annotation-support).
Applications need to configure the `ObservationRegistry` on the `ScheduledTaskRegistrar` to enable the recording of observations.
This can be done by declaring a `SchedulingConfigurer` bean that sets the observation registry:

```java
import io.micrometer.observation.ObservationRegistry;

import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;

public class ObservationSchedulingConfigurer implements SchedulingConfigurer {

	private final ObservationRegistry observationRegistry;

	public ObservationSchedulingConfigurer(ObservationRegistry observationRegistry) {
		this.observationRegistry = observationRegistry;
	}

	@Override
	public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
		taskRegistrar.setObservationRegistry(this.observationRegistry);
	}

}
```

It uses the `org.springframework.scheduling.support.DefaultScheduledTaskObservationConvention` by default, backed by the `ScheduledTaskObservationContext`.
You can configure a custom implementation on the `ObservationRegistry` directly.
During the execution of the scheduled method, the current observation is restored in the `ThreadLocal` context or the Reactor context (if the scheduled method returns a `Mono` or `Flux` type).

By default, the following `KeyValues` are created:

|  |  |
| --- | --- |
| Name | Description |
| `code.function` *(required)* | Name of the Java `Method` that is scheduled for execution. |
| `code.namespace` *(required)* | Canonical name of the class of the bean instance that holds the scheduled method, or `"ANONYMOUS"` for anonymous classes. |
| `error` *(required)* | Class name of the exception thrown during the execution, or `"none"` if no exception happened. |
| `exception` *(deprecated)* | Duplicates the `error` key and might be removed in the future. |
| `outcome` *(required)* | Outcome of the method execution. Can be `"SUCCESS"`, `"ERROR"` or `"UNKNOWN"` (if for example the operation was cancelled during execution). |

<a id="observability.jms"></a>

## JMS messaging instrumentation

Spring Framework uses the Jakarta JMS instrumentation provided by Micrometer if the `io.micrometer:micrometer-jakarta9` dependency is on the classpath.
The `io.micrometer.jakarta9.instrument.jms.JmsInstrumentation` instruments `jakarta.jms.Session` and records the relevant observations.

This instrumentation will create 2 types of observations:

- `"jms.message.publish"` when a JMS message is sent to the broker, typically with `JmsTemplate`.
- `"jms.message.process"` when a JMS message is processed by the application, typically with a `MessageListener` or a `@JmsListener` annotated method.

> [!NOTE]
> Currently there is no instrumentation for `"jms.message.receive"` observations as there is little value in measuring the time spent waiting for the receipt of a message.
> Such an integration would typically instrument `MessageConsumer#receive` method calls. But once those return, the processing time is not measured and the trace scope cannot be propagated to the application.

By default, both observations share the same set of possible `KeyValues`:

|  |  |
| --- | --- |
| Name | Description |
| `error` | Class name of the exception thrown during the messaging operation (or "none"). |
| `exception` *(deprecated)* | Duplicates the `error` key and might be removed in the future. |
| `messaging.destination.temporary` *(required)* | Whether the destination is a `TemporaryQueue` or `TemporaryTopic` (values: `"true"` or `"false"`). |
| `messaging.operation` *(required)* | Name of the JMS operation being performed (values: `"publish"` or `"process"`). |

|  |  |
| --- | --- |
| Name | Description |
| `messaging.message.conversation_id` | The correlation ID of the JMS message. |
| `messaging.destination.name` | The name of the destination the current message was sent to. |
| `messaging.message.id` | Value used by the messaging system as an identifier for the message. |

<a id="observability.jms.publish"></a>

### JMS message Publication instrumentation

`"jms.message.publish"` observations are recorded when a JMS message is sent to the broker.
They measure the time spent sending the message and propagate the tracing information with outgoing JMS message headers.

You will need to configure the `ObservationRegistry` on the `JmsTemplate` to enable observations:

```java
import io.micrometer.observation.ObservationRegistry;
import jakarta.jms.ConnectionFactory;

import org.springframework.jms.core.JmsMessagingTemplate;
import org.springframework.jms.core.JmsTemplate;

public class JmsTemplatePublish {

	private final JmsTemplate jmsTemplate;

	private final JmsMessagingTemplate jmsMessagingTemplate;

	public JmsTemplatePublish(ObservationRegistry observationRegistry, ConnectionFactory connectionFactory) {
		this.jmsTemplate = new JmsTemplate(connectionFactory);
		// configure the observation registry
		this.jmsTemplate.setObservationRegistry(observationRegistry);

		// For JmsMessagingTemplate, instantiate it with a JMS template that has a configured registry
		this.jmsMessagingTemplate = new JmsMessagingTemplate(this.jmsTemplate);
	}

	public void sendMessages() {
		this.jmsTemplate.convertAndSend("spring.observation.test", "test message");
	}

}
```

It uses the `io.micrometer.jakarta9.instrument.jms.DefaultJmsPublishObservationConvention` by default, backed by the `io.micrometer.jakarta9.instrument.jms.JmsPublishObservationContext`.

Similar observations are recorded with `@JmsListener` annotated methods when response messages are returned from the listener method.

<a id="observability.jms.process"></a>

### JMS message Processing instrumentation

`"jms.message.process"` observations are recorded when a JMS message is processed by the application.
They measure the time spent processing the message and propagate the tracing context with incoming JMS message headers.

Most applications will use the [`@JmsListener` annotated methods](jms/annotated.md#jms-annotated) mechanism to process incoming messages.
You will need to ensure that the `ObservationRegistry` is configured on the dedicated `JmsListenerContainerFactory`:

```java
import io.micrometer.observation.ObservationRegistry;
import jakarta.jms.ConnectionFactory;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.annotation.EnableJms;
import org.springframework.jms.config.DefaultJmsListenerContainerFactory;

@Configuration
@EnableJms
public class JmsConfiguration {

	@Bean
	public DefaultJmsListenerContainerFactory jmsListenerContainerFactory(ConnectionFactory connectionFactory, ObservationRegistry observationRegistry) {
		DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();
		factory.setConnectionFactory(connectionFactory);
		factory.setObservationRegistry(observationRegistry);
		return factory;
	}

}
```

A [default container factory is required to enable the annotation support](jms/annotated.md#jms-annotated-support),
but note that `@JmsListener` annotations can refer to specific container factory beans for specific purposes.
In all cases, Observations are only recorded if the observation registry is configured on the container factory.

Similar observations are recorded with `JmsTemplate` when messages are processed by a `MessageListener`.
Such listeners are set on a `MessageConsumer` within a session callback (see `JmsTemplate.execute(SessionCallback<T>)`).

This observation uses the `io.micrometer.jakarta9.instrument.jms.DefaultJmsProcessObservationConvention` by default, backed by the `io.micrometer.jakarta9.instrument.jms.JmsProcessObservationContext`.

<a id="observability.http-server"></a>

## HTTP Server instrumentation

HTTP server exchange observations are created with the name `"http.server.requests"` for Servlet and Reactive applications,
or `"http.server.request.duration"` if using the OpenTelemetry convention.

<a id="observability.http-server.servlet"></a>

### Servlet applications

Applications need to configure the `org.springframework.web.filter.ServerHttpObservationFilter` Servlet filter in their application.

This will only record an observation as an error if the `Exception` has not been handled by the web framework and has bubbled up to the Servlet filter.
Typically, all exceptions handled by Spring MVC’s `@ExceptionHandler` and [`ProblemDetail` support](../web/webmvc/mvc-ann-rest-exceptions.md) will not be recorded with the observation.
You can, at any point during request processing, set the error field on the `ObservationContext` yourself:

```java
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.filter.ServerHttpObservationFilter;

@Controller
public class UserController {

	@ExceptionHandler(MissingUserException.class)
	ResponseEntity<Void> handleMissingUser(HttpServletRequest request, MissingUserException exception) {
		// We want to record this exception with the observation
		ServerHttpObservationFilter.findObservationContext(request)
				.ifPresent(context -> context.setError(exception));
		return ResponseEntity.notFound().build();
	}
	static class MissingUserException extends RuntimeException {
	}
}
```

> [!NOTE]
> Because the instrumentation is done at the Servlet Filter level, the observation scope only covers the filters ordered after this one as well as the handling of the request.
> Typically, Servlet container error handling is performed at a lower level and won’t have any active observation or span.
> For this use case, a container-specific implementation is required, such as a `org.apache.catalina.Valve` for Tomcat; this is outside the scope of this project.

<a id="observability.http-server.servlet.default"></a>

#### Default Semantic Convention

It uses the `org.springframework.http.server.observation.DefaultServerRequestObservationConvention` by default, backed by the `ServerRequestObservationContext`.

By default, the following `KeyValues` are created:

|  |  |
| --- | --- |
| Name | Description |
| `error` *(required)* | Class name of the exception thrown during the exchange, or `"none"` if no exception happened. |
| `exception` *(deprecated)* | Duplicates the `error` key and might be removed in the future. |
| `method` *(required)* | Name of the HTTP request method or `"none"` if not a well-known method. |
| `outcome` *(required)* | Outcome of the HTTP server exchange. |
| `status` *(required)* | HTTP response raw status code, or `"UNKNOWN"` if no response was created. |
| `uri` *(required)* | URI pattern for the matching handler if available, falling back to `REDIRECTION` for 3xx responses, `NOT_FOUND` for 404 responses, `root` for requests with no path info, and `UNKNOWN` for all other requests. |

|  |  |
| --- | --- |
| Name | Description |
| `http.url` *(required)* | HTTP request URI. |

<a id="observability.http-server.servlet.otel"></a>

#### OpenTelemetry Semantic Convention

An OpenTelemetry variant is available with `org.springframework.http.server.observation.OpenTelemetryServerRequestObservationConvention`, backed by the `ServerRequestObservationContext`.

This variant complies with the [OpenTelemetry Semantic Conventions for HTTP Metrics (v1.36.0)](https://github.com/open-telemetry/semantic-conventions/blob/v1.36.0/docs/http/http-metrics.md)
and the [OpenTelemetry Semantic Conventions for HTTP Spans (v1.36.0)](https://github.com/open-telemetry/semantic-conventions/blob/v1.36.0/docs/http/http-spans.md).

<a id="observability.http-server.reactive"></a>

### Reactive applications

Applications need to configure the `WebHttpHandlerBuilder` with a `MeterRegistry` to enable server instrumentation.
This can be done on the `WebHttpHandlerBuilder`, as follows:

```java
import io.micrometer.observation.ObservationRegistry;

import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.reactive.HttpHandler;
import org.springframework.web.server.adapter.WebHttpHandlerBuilder;

@Configuration(proxyBeanMethods = false)
public class HttpHandlerConfiguration {

	private final ApplicationContext applicationContext;

	public HttpHandlerConfiguration(ApplicationContext applicationContext) {
		this.applicationContext = applicationContext;
	}

	@Bean
	public HttpHandler httpHandler(ObservationRegistry registry) {
		return WebHttpHandlerBuilder.applicationContext(this.applicationContext)
				.observationRegistry(registry)
				.build();
	}
}
```

It uses the `org.springframework.http.server.reactive.observation.DefaultServerRequestObservationConvention` by default, backed by the `ServerRequestObservationContext`.

This will only record an observation as an error if the `Exception` has not been handled by an application Controller.
Typically, all exceptions handled by Spring WebFlux’s `@ExceptionHandler` and [`ProblemDetail` support](../web/webflux/ann-rest-exceptions.md) will not be recorded with the observation.
You can, at any point during request processing, set the error field on the `ObservationContext` yourself:

```java
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.observation.ServerRequestObservationContext;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ServerWebExchange;

@Controller
public class UserController {

	@ExceptionHandler(MissingUserException.class)
	ResponseEntity<Void> handleMissingUser(ServerWebExchange exchange, MissingUserException exception) {
		// We want to record this exception with the observation
		ServerRequestObservationContext.findCurrent(exchange.getAttributes())
				.ifPresent(context -> context.setError(exception));
		return ResponseEntity.notFound().build();
	}
	static class MissingUserException extends RuntimeException {
	}
}
```

By default, the following `KeyValues` are created:

|  |  |
| --- | --- |
| Name | Description |
| `error` *(required)* | Class name of the exception thrown during the exchange, or `"none"` if no exception happened. |
| `exception` *(deprecated)* | Duplicates the `error` key and might be removed in the future. |
| `method` *(required)* | Name of the HTTP request method or `"none"` if not a well-known method. |
| `outcome` *(required)* | Outcome of the HTTP server exchange. |
| `status` *(required)* | HTTP response raw status code, or `"UNKNOWN"` if no response was created. |
| `uri` *(required)* | URI pattern for the matching handler if available, falling back to `REDIRECTION` for 3xx responses, `NOT_FOUND` for 404 responses, `root` for requests with no path info, and `UNKNOWN` for all other requests. |

|  |  |
| --- | --- |
| Name | Description |
| `http.url` *(required)* | HTTP request URI. |

<a id="observability.http-client"></a>

## HTTP Client Instrumentation

HTTP client exchange observations are created with the name `"http.client.requests"` for blocking and reactive clients.
This observation measures the entire HTTP request/response exchange, from connection establishment up to body deserialization.
Unlike their server counterparts, the instrumentation is implemented directly in the client so the only required step is to configure an `ObservationRegistry` on the client.

<a id="observability.http-client.resttemplate"></a>

### RestTemplate

Applications must configure an `ObservationRegistry` on `RestTemplate` instances to enable the instrumentation; without that, observations are "no-ops".
Spring Boot will auto-configure `RestTemplateBuilder` beans with the observation registry already set.

Instrumentation uses the `org.springframework.http.client.observation.ClientRequestObservationConvention` by default, backed by the `ClientRequestObservationContext`.

|  |  |
| --- | --- |
| Name | Description |
| `method` *(required)* | Name of the HTTP request method or `"none"` if not a well-known method. |
| `uri` *(required)* | URI template used for HTTP request, or `"none"` if none was provided. The protocol, host and port part of the URI are not considered. |
| `client.name` *(required)* | Client name derived from the request URI host. |
| `status` *(required)* | HTTP response raw status code, or `"IO_ERROR"` in case of `IOException`, or `"CLIENT_ERROR"` if no response was received. |
| `outcome` *(required)* | Outcome of the HTTP client exchange. |
| `error` *(required)* | Class name of the exception thrown during the exchange, or `"none"` if no exception happened. |
| `exception` *(deprecated)* | Duplicates the `error` key and might be removed in the future. |

|  |  |
| --- | --- |
| Name | Description |
| `http.url` *(required)* | HTTP request URI. |

<a id="observability.http-client.restclient"></a>

### RestClient

Applications must configure an `ObservationRegistry` on the `RestClient.Builder` to enable the instrumentation; without that, observations are "no-ops".

Instrumentation uses the `org.springframework.http.client.observation.ClientRequestObservationConvention` by default, backed by the `ClientRequestObservationContext`.

|  |  |
| --- | --- |
| Name | Description |
| `method` *(required)* | Name of the HTTP request method or `"none"` if the request could not be created. |
| `uri` *(required)* | URI template used for HTTP request, or `"none"` if none was provided. The protocol, host and port part of the URI are not considered. |
| `client.name` *(required)* | Client name derived from the request URI host. |
| `status` *(required)* | HTTP response raw status code, or `"IO_ERROR"` in case of `IOException`, or `"CLIENT_ERROR"` if no response was received. |
| `outcome` *(required)* | Outcome of the HTTP client exchange. |
| `error` *(required)* | Class name of the exception thrown during the exchange, or `"none"` if no exception happened. |
| `exception` *(deprecated)* | Duplicates the `error` key and might be removed in the future. |

|  |  |
| --- | --- |
| Name | Description |
| `http.url` *(required)* | HTTP request URI. |

<a id="observability.http-client.webclient"></a>

### WebClient

Applications must configure an `ObservationRegistry` on the `WebClient.Builder` to enable the instrumentation; without that, observations are "no-ops".
Spring Boot will auto-configure `WebClient.Builder` beans with the observation registry already set.

Instrumentation uses the `org.springframework.web.reactive.function.client.ClientRequestObservationConvention` by default, backed by the `ClientRequestObservationContext`.

|  |  |
| --- | --- |
| Name | Description |
| `method` *(required)* | Name of the HTTP request method or `"none"` if not a well-known method. |
| `uri` *(required)* | URI template used for HTTP request, or `"none"` if none was provided. The protocol, host and port part of the URI are not considered. |
| `client.name` *(required)* | Client name derived from the request URI host. |
| `status` *(required)* | HTTP response raw status code, or `"IO_ERROR"` in case of `IOException`, or `"CLIENT_ERROR"` if no response was received. |
| `outcome` *(required)* | Outcome of the HTTP client exchange. |
| `error` *(required)* | Class name of the exception thrown during the exchange, or `"none"` if no exception happened. |
| `exception` *(deprecated)* | Duplicates the `error` key and might be removed in the future. |

|  |  |
| --- | --- |
| Name | Description |
| `http.url` *(required)* | HTTP request URI. |

<a id="observability.application-events"></a>

## Application Events and `@EventListener`

Spring Framework does not contribute Observations for [`@EventListener` calls](../core/beans/context-introduction.md#context-functionality-events-annotation),
as they don’t have the right semantics for such instrumentation.
By default, event publication and processing are done synchronously and on the same thread.
This means that during the execution of that task, the ThreadLocals and logging context will be the same as the event publisher.

If the application globally configures a custom `ApplicationEventMulticaster` with a strategy that schedules event processing on different threads, this is no longer true.
All `@EventListener` methods will be processed on a different thread, outside the main event publication thread.
In these cases, the [Micrometer Context Propagation library](https://docs.micrometer.io/context-propagation/reference/) can help propagate such values and better correlate the processing of the events.
The application can configure the chosen `TaskExecutor` to use a `ContextPropagatingTaskDecorator` that decorates tasks and propagates context.
For this to work, the `io.micrometer:context-propagation` library must be present on the classpath:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.SimpleApplicationEventMulticaster;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.core.task.support.ContextPropagatingTaskDecorator;

@Configuration
public class ApplicationEventsConfiguration {

	@Bean(name = "applicationEventMulticaster")
	public SimpleApplicationEventMulticaster simpleApplicationEventMulticaster() {
		SimpleApplicationEventMulticaster eventMulticaster = new SimpleApplicationEventMulticaster();
		SimpleAsyncTaskExecutor taskExecutor = new SimpleAsyncTaskExecutor();
		// decorate task execution with a decorator that supports context propagation
		taskExecutor.setTaskDecorator(new ContextPropagatingTaskDecorator());
		eventMulticaster.setTaskExecutor(taskExecutor);
		return eventMulticaster;
	}

}
```

Similarly, if that asynchronous choice is made locally for each `@EventListener` annotated method, by adding `@Async` to it,
you can choose a `TaskExecutor` that propagates context by referring to it by its qualifier.
Given the following `TaskExecutor` bean definition, configured with the dedicated task decorator:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.support.ContextPropagatingTaskDecorator;

@Configuration
public class EventAsyncExecutionConfiguration {

	@Bean(name = "propagatingContextExecutor")
	public TaskExecutor propagatingContextExecutor() {
		SimpleAsyncTaskExecutor taskExecutor = new SimpleAsyncTaskExecutor();
		// decorate task execution with a decorator that supports context propagation
		taskExecutor.setTaskDecorator(new ContextPropagatingTaskDecorator());
		return taskExecutor;
	}

}
```

Annotating event listeners with `@Async` and the relevant qualifier will achieve similar context propagation results:

```java
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class EmailNotificationListener {

	private final Log logger = LogFactory.getLog(EmailNotificationListener.class);

	@EventListener(EmailReceivedEvent.class)
	@Async("propagatingContextExecutor")
	public void emailReceived(EmailReceivedEvent event) {
		// asynchronously process the received event
		// this logging statement will contain the expected MDC entries from the propagated context
		logger.info("email has been received");
	}

}
```
