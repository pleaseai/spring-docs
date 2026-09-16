---
title: "Proxy Server Configuration"
source: "ROOT:servlet/appendix/proxy-server.adoc"
---

<a id="appendix-proxy-server"></a>

# Proxy Server Configuration

When using a proxy server it is important to ensure that you have configured your application properly.
For example, many applications will have a load balancer that responds to request for [example.com/](https://example.com/) by forwarding the request to an application server at [192.168.1:8080](https://192.168.1:8080)
Without proper configuration, the application server will not know that the load balancer exists and treat the request as though [192.168.1:8080](https://192.168.1:8080) was requested by the client.

To fix this you can use [RFC 7239](https://tools.ietf.org/html/rfc7239) to specify that a load balancer is being used.
To make the application aware of this, you need to either configure your application server aware of the X-Forwarded headers.
For example Tomcat uses the [RemoteIpValve](https://tomcat.apache.org/tomcat-10.1-doc/api/org/apache/catalina/valves/RemoteIpValve.html) and Jetty uses [ForwardedRequestCustomizer](https://eclipse.dev/jetty/javadoc/jetty-11/org/eclipse/jetty/server/ForwardedRequestCustomizer.html).
Alternatively, Spring 4.3+ users can leverage [ForwardedHeaderFilter](https://github.com/spring-projects/spring-framework/blob/v4.3.3.RELEASE/spring-web/src/main/java/org/springframework/web/filter/ForwardedHeaderFilter.java).

Spring Boot users may use the `server.use-forward-headers` property to configure the application.
See the [Spring Boot documentation](https://docs.spring.io/spring-boot/4.1.0/how-to/webserver.html#howto.webserver.use-behind-a-proxy-server) for further details.
