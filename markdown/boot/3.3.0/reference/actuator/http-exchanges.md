---
title: "Recording HTTP Exchanges"
source: "reference:actuator/http-exchanges.adoc"
---

<a id="actuator.http-exchanges"></a>

# Recording HTTP Exchanges

You can enable recording of HTTP exchanges by providing a bean of type `HttpExchangeRepository` in your application’s configuration.
For convenience, Spring Boot offers `InMemoryHttpExchangeRepository`, which, by default, stores the last 100 request-response exchanges.
`InMemoryHttpExchangeRepository` is limited compared to tracing solutions, and we recommend using it only for development environments.
For production environments, we recommend using a production-ready tracing or observability solution, such as Zipkin or OpenTelemetry.
Alternatively, you can create your own `HttpExchangeRepository`.

You can use the `httpexchanges` endpoint to obtain information about the request-response exchanges that are stored in the `HttpExchangeRepository`.

<a id="actuator.http-exchanges.custom"></a>

## Custom HTTP Exchange Recording

To customize the items that are included in each recorded exchange, use the `management.httpexchanges.recording.include` configuration property.

To disable recoding entirely, set `management.httpexchanges.recording.enabled` to `false`.
