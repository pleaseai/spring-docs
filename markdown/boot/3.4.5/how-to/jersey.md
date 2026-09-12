---
title: "Jersey"
source: "how-to:jersey.adoc"
---

<a id="howto.jersey"></a>

# Jersey

<a id="howto.jersey.spring-security"></a>

## Secure Jersey Endpoints with Spring Security

Spring Security can be used to secure a Jersey-based web application in much the same way as it can be used to secure a Spring MVC-based web application.
However, if you want to use Spring Security’s method-level security with Jersey, you must configure Jersey to use `setStatus(int)` rather `sendError(int)`.
This prevents Jersey from committing the response before Spring Security has had an opportunity to report an authentication or authorization failure to the client.

The `jersey.config.server.response.setStatusOverSendError` property must be set to `true` on the application’s [`ResourceConfig`](https://javadoc.io/doc/org.glassfish.jersey.core/jersey-server/3.1.10/org/glassfish/jersey/server/ResourceConfig.html) bean, as shown in the following example:

```java
import java.util.Collections;

import org.glassfish.jersey.server.ResourceConfig;

import org.springframework.stereotype.Component;

@Component
public class JerseySetStatusOverSendErrorConfig extends ResourceConfig {

	public JerseySetStatusOverSendErrorConfig() {
		register(Endpoint.class);
		setProperties(Collections.singletonMap("jersey.config.server.response.setStatusOverSendError", true));
	}

}
```

<a id="howto.jersey.alongside-another-web-framework"></a>

## Use Jersey Alongside Another Web Framework

To use Jersey alongside another web framework, such as Spring MVC, it should be configured so that it will allow the other framework to handle requests that it cannot handle.
First, configure Jersey to use a filter rather than a servlet by configuring the `spring.jersey.type` application property with a value of `filter`.
Second, configure your [`ResourceConfig`](https://javadoc.io/doc/org.glassfish.jersey.core/jersey-server/3.1.10/org/glassfish/jersey/server/ResourceConfig.html) to forward requests that would have resulted in a 404, as shown in the following example.

```java
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.servlet.ServletProperties;

import org.springframework.stereotype.Component;

@Component
public class JerseyConfig extends ResourceConfig {

	public JerseyConfig() {
		register(Endpoint.class);
		property(ServletProperties.FILTER_FORWARD_ON_404, true);
	}

}
```
