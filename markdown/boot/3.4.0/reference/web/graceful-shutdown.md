---
title: "Graceful Shutdown"
source: "reference:web/graceful-shutdown.adoc"
---

<a id="web.graceful-shutdown"></a>

# Graceful Shutdown

Graceful shutdown is enabled by default with all four embedded web servers (Jetty, Reactor Netty, Tomcat, and Undertow) and with both reactive and servlet-based web applications.
It occurs as part of closing the application context and is performed in the earliest phase of stopping [`SmartLifecycle`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/SmartLifecycle.html) beans.
This stop processing uses a timeout which provides a grace period during which existing requests will be allowed to complete but no new requests will be permitted.

To configure the timeout period, configure the `spring.lifecycle.timeout-per-shutdown-phase` property, as shown in the following example:

#### Properties

```properties
spring.lifecycle.timeout-per-shutdown-phase=20s
```

#### YAML

```yaml
spring:
  lifecycle:
    timeout-per-shutdown-phase: "20s"
```

> [!IMPORTANT]
> Shutdown in your IDE may be immediate rather than graceful if it does not send a proper `SIGTERM` signal.
> See the documentation of your IDE for more details.

<a id="web.graceful-shutdown.rejecting-requests-during-the-grace-period"></a>

## Rejecting Requests During the Grace Period

The exact way in which new requests are not permitted varies depending on the web server that is being used.
Implementations may stop accepting requests at the network layer, or they may return a response with a specific HTTP status code or HTTP header.
The use of persistent connections can also change the way that requests stop being accepted.

> [!TIP]
> To learn more about the specific method used with your web server, see the `shutDownGracefully` API documentation for [`TomcatWebServer.shutDownGracefully(GracefulShutdownCallback)`](<https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/web/embedded/tomcat/TomcatWebServer.html#shutDownGracefully(org.springframework.boot.web.server.GracefulShutdownCallback)>), [`NettyWebServer.shutDownGracefully(GracefulShutdownCallback)`](<https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/web/embedded/netty/NettyWebServer.html#shutDownGracefully(org.springframework.boot.web.server.GracefulShutdownCallback)>), [`JettyWebServer.shutDownGracefully(GracefulShutdownCallback)`](<https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/web/embedded/jetty/JettyWebServer.html#shutDownGracefully(org.springframework.boot.web.server.GracefulShutdownCallback)>) or [`UndertowWebServer.shutDownGracefully(GracefulShutdownCallback)`](<https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/web/embedded/undertow/UndertowWebServer.html#shutDownGracefully(org.springframework.boot.web.server.GracefulShutdownCallback)>).

Jetty, Reactor Netty, and Tomcat will stop accepting new requests at the network layer.
Undertow will accept new connections but respond immediately with a service unavailable (503) response.

<a id="web.graceful-shutdown.disabling-graceful-shutdown"></a>

## Disabling Graceful Shutdown

To disable graceful shutdown, configure the `server.shutdown` property, as shown in the following example:

#### Properties

```properties
server.shutdown=immediate
```

#### YAML

```yaml
server:
  shutdown: "immediate"
```
