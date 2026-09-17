---
title: "Embedded Web Servers"
source: "how-to:webserver.adoc"
---

<a id="howto.webserver"></a>

# Embedded Web Servers

Each Spring Boot web application includes an embedded web server.
This feature leads to a number of how-to questions, including how to change the embedded server and how to configure the embedded server.
This section answers those questions.

<a id="howto.webserver.use-another"></a>

## Use Another Web Server

Many Spring Boot starters include default embedded containers.

- For servlet stack applications, the `spring-boot-starter-web` includes Tomcat by including `spring-boot-starter-tomcat`, but you can use `spring-boot-starter-jetty` instead.
- For reactive stack applications, the `spring-boot-starter-webflux` includes  Reactor Netty by including `spring-boot-starter-reactor-netty`, but you can use `spring-boot-starter-tomcat` or `spring-boot-starter-jetty` instead.

When switching to a different HTTP server, you need to swap the default dependencies for those that you need instead.
To help with this process, Spring Boot provides a separate starter for each of the supported HTTP servers.

The following example shows how to exclude Tomcat and include Jetty for Spring MVC:

#### Maven

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-webmvc</artifactId>
	<exclusions>
		<!-- Exclude the Tomcat dependency -->
		<exclusion>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-tomcat</artifactId>
		</exclusion>
	</exclusions>
</dependency>
<!-- Use Jetty instead -->
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```

#### Gradle

```gradle
dependencies {
	implementation('org.springframework.boot:spring-boot-starter-webmvc') {
		// Exclude the Tomcat dependency
		exclude group: 'org.springframework.boot', module: 'spring-boot-starter-tomcat'
	}
	// Use Jetty instead
	implementation "org.springframework.boot:spring-boot-starter-jetty"
}
```

If you are creating a war file, you can use a similar approach, but you must indicate provided dependencies:

#### Maven

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-webmvc</artifactId>
	<exclusions>
		<!-- Exclude the Tomcat dependency -->
		<exclusion>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-tomcat</artifactId>
		</exclusion>
	</exclusions>
</dependency>
<!-- Use Jetty instead -->
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-jetty</artifactId>
	<scope>provided</scope>
</dependency>
```

#### Gradle

```gradle
dependencies {
	implementation('org.springframework.boot:spring-boot-starter-webmvc') {
		// Exclude the Tomcat dependency
		exclude group: 'org.springframework.boot', module: 'spring-boot-starter-tomcat'
	}
	// Use Jetty instead
	implementation "org.springframework.boot:spring-boot-starter-jetty"
	providedRuntime "org.springframework.boot:spring-boot-starter-jetty-runtime"
}
```

<a id="howto.webserver.disable"></a>

## Disabling the Web Server

If your classpath contains the necessary bits to start a web server, Spring Boot will automatically start it.
To disable this behavior configure the [`WebApplicationType`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/WebApplicationType.html) in your `application.properties`, as shown in the following example:

#### Properties

```properties
spring.main.web-application-type=none
```

#### YAML

```yaml
spring:
  main:
    web-application-type: "none"
```

<a id="howto.webserver.change-port"></a>

## Change the HTTP Port

In a standalone application, the main HTTP port defaults to `8080` but can be set with `server.port` (for example, in `application.properties` or as a System property).
Thanks to relaxed binding of [`Environment`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/core/env/Environment.html) values, you can also use `SERVER_PORT` (for example, as an OS environment variable).

To switch off the HTTP endpoints completely but still create a [`WebApplicationContext`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/web/context/WebApplicationContext.html), use `server.port=-1` (doing so is sometimes useful for testing).

For more details, see [Customizing Embedded Servlet Containers](../reference/web/servlet.md#web.servlet.embedded-container.customizing) in the ‘Spring Boot Features’ section, or the [`ServerProperties`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/server/autoconfigure/ServerProperties.html) class.

<a id="howto.webserver.use-random-port"></a>

## Use a Random Unassigned HTTP Port

To scan for a free port (using OS natives to prevent clashes) use `server.port=0`.

<a id="howto.webserver.discover-port"></a>

## Discover the HTTP Port at Runtime

You can access the port the server is running on from log output or from the [`WebServerApplicationContext`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/server/context/WebServerApplicationContext.html) through its [`WebServer`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/server/WebServer.html).
The best way to get that and be sure it has been initialized is to add a [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) of type `ApplicationListener<WebServerInitializedEvent>` and pull the container out of the event when it is published.

Tests that use `@SpringBootTest(webEnvironment=WebEnvironment.RANDOM_PORT)` can also inject the actual port into a field by using the [`@LocalServerPort`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/test/web/server/LocalServerPort.html) annotation, as shown in the following example:

#### Java

```java
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class MyWebIntegrationTests {

	@LocalServerPort
	int port;

	// ...

}
```

#### Kotlin

```kotlin
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment
import org.springframework.boot.test.web.server.LocalServerPort

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class MyWebIntegrationTests {

	@LocalServerPort
	var port = 0

	// ...

}

```

> [!NOTE]
> [`@LocalServerPort`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/test/web/server/LocalServerPort.html) is a meta-annotation for `@Value("${local.server.port}")`.
> Do not try to inject the port in a regular application.
> As we just saw, the value is set only after the container has been initialized.
> Contrary to a test, application code callbacks are processed early (before the value is actually available).

<a id="howto.webserver.build-uri-test-web-server"></a>

## Build URI Against the Test Web Server

Tests that start a [`WebServer`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/server/WebServer.html) such as  `@SpringBootTest(webEnvironment=WebEnvironment.RANDOM_PORT)` can get information about
the running server using [`LocalTestWebServer`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/test/http/server/LocalTestWebServer.html), as shown in the following example:

#### Java

```java
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.http.server.LocalTestWebServer;
import org.springframework.context.ApplicationContext;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class MyWebIntegrationTests {

	@Autowired
	ApplicationContext context;

	// ...

	@Test
	void test() {
		String urlToTest = LocalTestWebServer.obtain(this.context).uri("/test");
	}

}
```

#### Kotlin

```kotlin
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment
import org.springframework.boot.test.http.server.LocalTestWebServer
import org.springframework.context.ApplicationContext

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class MyWebIntegrationTests(@Autowired val context: ApplicationContext) {

	// ...

	@Test
	fun test() {
		val urlToTest = LocalTestWebServer.obtain(this.context).uri("/test")
	}

}

```

[`LocalTestWebServer`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/test/http/server/LocalTestWebServer.html) provides access to a suitable [`UriBuilderFactory`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/web/util/UriBuilderFactory.html).
It can also be customized to build such an instance on a sub-path of your application.

<a id="howto.webserver.enable-response-compression"></a>

## Enable HTTP Response Compression

HTTP response compression is supported by Jetty, Tomcat and Reactor Netty.
It can be enabled in `application.properties`, as follows:

#### Properties

```properties
server.compression.enabled=true
```

#### YAML

```yaml
server:
  compression:
    enabled: true
```

By default, responses must be at least 2048 bytes in length for compression to be performed.
You can configure this behavior by setting the `server.compression.min-response-size` property.

By default, responses are compressed only if their content type is one of the following:

- `text/html`
- `text/xml`
- `text/plain`
- `text/css`
- `text/javascript`
- `application/javascript`
- `application/json`
- `application/xml`

You can configure this behavior by setting the `server.compression.mime-types` property.

<a id="howto.webserver.configure-ssl"></a>

## Configure SSL

SSL can be configured declaratively by setting the various `server.ssl.*` properties, typically in `application.properties` or `application.yaml`.
See [`Ssl`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/server/Ssl.html) for details of all of the supported properties.

The following example shows setting SSL properties using a Java KeyStore file:

#### Properties

```properties
server.port=8443
server.ssl.key-store=classpath:keystore.jks
server.ssl.key-store-password=secret
server.ssl.key-password=another-secret
```

#### YAML

```yaml
server:
  port: 8443
  ssl:
    key-store: "classpath:keystore.jks"
    key-store-password: "secret"
    key-password: "another-secret"
```

Using configuration such as the preceding example means the application no longer supports a plain HTTP connector at port 8080.
Spring Boot does not support the configuration of both an HTTP connector and an HTTPS connector through `application.properties`.
If you want to have both, you need to configure one of them programmatically.
We recommend using `application.properties` to configure HTTPS, as the HTTP connector is the easier of the two to configure programmatically.

<a id="howto.webserver.configure-ssl.pem-files"></a>

### Using PEM-encoded files

You can use PEM-encoded files instead of Java KeyStore files.
You should use PKCS#8 key files wherever possible.
PEM-encoded PKCS#8 key files start with a `-----BEGIN PRIVATE KEY-----` or `-----BEGIN ENCRYPTED PRIVATE KEY-----` header.

If you have files in other formats, e.g., PKCS#1 (`-----BEGIN RSA PRIVATE KEY-----`) or SEC 1 (`-----BEGIN EC PRIVATE KEY-----`), you can convert them to PKCS#8 using OpenSSL:

```shell
openssl pkcs8 -topk8 -nocrypt -in <input file> -out <output file>
```

The following example shows setting SSL properties using PEM-encoded certificate and private key files:

#### Properties

```properties
server.port=8443
server.ssl.certificate=classpath:my-cert.crt
server.ssl.certificate-private-key=classpath:my-cert.key
server.ssl.trust-certificate=classpath:ca-cert.crt
```

#### YAML

```yaml
server:
  port: 8443
  ssl:
    certificate: "classpath:my-cert.crt"
    certificate-private-key: "classpath:my-cert.key"
    trust-certificate: "classpath:ca-cert.crt"
```

<a id="howto.webserver.configure-ssl.bundles"></a>

### Using SSL Bundles

Alternatively, the SSL trust material can be configured in an [SSL bundle](../reference/features/ssl.md) and applied to the web server as shown in this example:

#### Properties

```properties
server.port=8443
server.ssl.bundle=example
```

#### YAML

```yaml
server:
  port: 8443
  ssl:
    bundle: "example"
```

> [!NOTE]
> The `server.ssl.bundle` property can not be combined with the discrete Java KeyStore or PEM property options under `server.ssl`.
>
> The `server.ssl.ciphers`, `server.ssl.enabled-protocols`, `server.ssl.protocol` properties are also ignored when using a bundle.
> These properties should instead be defined using `spring.ssl.bundle.<type>.<name>.options` properties.

<a id="howto.webserver.configure-ssl.sni"></a>

### Configure Server Name Indication

Tomcat, and Netty can be configured to use unique SSL trust material for individual host names to support Server Name Indication (SNI).
SNI configuration is not supported with Jetty, but Jetty can [automatically set up SNI](https://eclipse.dev/jetty/documentation/jetty-12/operations-guide/index.html#og-protocols-ssl-sni) if multiple certificates are provided to it.

Assuming [SSL bundles](../reference/features/ssl.md) named `web`, `web-alt1`, and `web-alt2` have been configured, the following configuration can be used to assign each bundle to a host name served by the embedded web server:

#### Properties

```properties
server.port=8443
server.ssl.bundle=web
server.ssl.server-name-bundles[0].server-name=alt1.example.com
server.ssl.server-name-bundles[0].bundle=web-alt1
server.ssl.server-name-bundles[1].server-name=alt2.example.com
server.ssl.server-name-bundles[1].bundle=web-alt2
```

#### YAML

```yaml
server:
  port: 8443
  ssl:
    bundle: "web"
    server-name-bundles:
      - server-name: "alt1.example.com"
        bundle: "web-alt1"
      - server-name: "alt2.example.com"
        bundle: "web-alt2"
```

The bundle specified with `server.ssl.bundle` will be used for the default host, and for any client that does support SNI.
This default bundle must be configured if any `server.ssl.server-name-bundles` are configured.

<a id="howto.webserver.configure-http2"></a>

## Configure HTTP/2

You can enable HTTP/2 support in your Spring Boot application with the `server.http2.enabled` configuration property.
Both `h2` (HTTP/2 over TLS) and `h2c` (HTTP/2 over TCP) are supported.
To use `h2`, SSL must also be enabled.
When SSL is not enabled, `h2c` will be used.
You may, for example, want to use `h2c` when your application is [running behind a proxy server](#howto.webserver.use-behind-a-proxy-server) that is performing TLS termination.

<a id="howto.webserver.configure-http2.tomcat"></a>

### HTTP/2 With Tomcat

Spring Boot ships by default with Tomcat 11.0.x which supports `h2c` and `h2` out of the box.
Alternatively, you can use `libtcnative` for `h2` support if the library and its dependencies are installed on the host operating system.

The library directory must be made available, if not already, to the JVM library path.
You can do so with a JVM argument such as `-Djava.library.path=/usr/local/opt/tomcat-native/lib`.
More on this in the [official Tomcat documentation](https://tomcat.apache.org/tomcat-11.0-doc/apr.html).

<a id="howto.webserver.configure-http2.jetty"></a>

### HTTP/2 With Jetty

For HTTP/2 support, Jetty requires the additional `org.eclipse.jetty.http2:jetty-http2-server` dependency.
To use `h2c` no other dependencies are required.
To use `h2`, you also need to choose one of the following dependencies, depending on your deployment:

- `org.eclipse.jetty:jetty-alpn-java-server` to use the JDK built-in support
- `org.eclipse.jetty:jetty-alpn-conscrypt-server` and the [Conscrypt library](https://www.conscrypt.org/)

<a id="howto.webserver.configure-http2.netty"></a>

### HTTP/2 With Reactor Netty

The `spring-boot-webflux-starter` is using by default Reactor Netty as a server.
Reactor Netty supports `h2c` and `h2` out of the box.
For optimal runtime performance, this server also supports `h2` with native libraries.
To enable that, your application needs to have an additional dependency.

Spring Boot manages the version for the `io.netty:netty-tcnative-boringssl-static` "uber jar", containing native libraries for all platforms.
Developers can choose to import only the required dependencies using a classifier (see [the Netty official documentation](https://netty.io/wiki/forked-tomcat-native.html)).

<a id="howto.webserver.configure"></a>

## Configure the Web Server

Generally, you should first consider using one of the many available configuration keys and customize your web server by adding new entries in your `application.properties` or `application.yaml` file.
See [properties-and-configuration.adoc#howto.properties-and-configuration.discover-build-in-options-for-external-properties](properties-and-configuration.md#howto.properties-and-configuration.discover-build-in-options-for-external-properties)).
The `server.*` namespace is quite useful here, and it includes namespaces like `server.tomcat.*`, `server.jetty.*` and others, for server-specific features.
See the list of [appendix:application-properties/index.adoc](../appendix/application-properties/index.md).

The previous sections covered already many common use cases, such as compression, SSL or HTTP/2.
However, if a configuration key does not exist for your use case, you should then look at [`WebServerFactoryCustomizer`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/server/WebServerFactoryCustomizer.html).
You can declare such a component and get access to the server factory relevant to your choice: you should select the variant for the chosen Server (Tomcat, Jetty, Reactor Netty) and the chosen web stack (servlet or reactive).

The example below is for Tomcat with the `spring-boot-starter-web` (servlet stack):

#### Java

```java
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.stereotype.Component;

@Component
public class MyTomcatWebServerCustomizer implements WebServerFactoryCustomizer<TomcatServletWebServerFactory> {

	@Override
	public void customize(TomcatServletWebServerFactory factory) {
		// customize the factory here
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory
import org.springframework.boot.web.server.WebServerFactoryCustomizer
import org.springframework.stereotype.Component

@Component
class MyTomcatWebServerCustomizer : WebServerFactoryCustomizer<TomcatServletWebServerFactory> {

	override fun customize(factory: TomcatServletWebServerFactory) {
		// customize the factory here
	}

}

```

> [!NOTE]
> Spring Boot uses that infrastructure internally to auto-configure the server.
> Auto-configured [`WebServerFactoryCustomizer`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/server/WebServerFactoryCustomizer.html) beans have an order of `0` and will be processed before any user-defined customizers, unless it has an explicit order that states otherwise.

Once you have got access to a [`WebServerFactory`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/server/WebServerFactory.html) using the customizer, you can use it to configure specific parts, like connectors, server resources, or the server itself - all using server-specific APIs.

In addition Spring Boot provides:

<a id="howto-configure-webserver-customizers"></a>

| Server | Servlet stack | Reactive stack |
| --- | --- | --- |
| Tomcat | [`TomcatServletWebServerFactory`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/tomcat/servlet/TomcatServletWebServerFactory.html) | [`TomcatReactiveWebServerFactory`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/tomcat/reactive/TomcatReactiveWebServerFactory.html) |
| Jetty | [`JettyServletWebServerFactory`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/jetty/servlet/JettyServletWebServerFactory.html) | [`JettyReactiveWebServerFactory`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/jetty/reactive/JettyReactiveWebServerFactory.html) |
| Reactor | N/A | [`NettyReactiveWebServerFactory`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/reactor/netty/NettyReactiveWebServerFactory.html) |

As a last resort, you can also declare your own [`WebServerFactory`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/server/WebServerFactory.html) bean, which will override the one provided by Spring Boot.
When you do so, auto-configured customizers are still applied on your custom factory, so use that option carefully.

<a id="howto.webserver.add-servlet-filter-listener"></a>

## Add a Servlet, Filter, or Listener to an Application

In a servlet stack application, that is with the `spring-boot-starter-web`, there are two ways to add [`Servlet`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/Servlet.html), [`Filter`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/Filter.html), [`ServletContextListener`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/ServletContextListener.html), and the other listeners supported by the Servlet API to your application:

- [Add a Servlet, Filter, or Listener by Using a Spring Bean](#howto.webserver.add-servlet-filter-listener.spring-bean)
- [Add Servlets, Filters, and Listeners by Using Classpath Scanning](#howto.webserver.add-servlet-filter-listener.using-scanning)

<a id="howto.webserver.add-servlet-filter-listener.spring-bean"></a>

### Add a Servlet, Filter, or Listener by Using a Spring Bean

To add a [`Servlet`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/Servlet.html), [`Filter`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/Filter.html), or servlet `*Listener` by using a Spring bean, you must provide a [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html) definition for it.
Doing so can be very useful when you want to inject configuration or dependencies.
However, you must be very careful that they do not cause eager initialization of too many other beans, because they have to be installed in the container very early in the application lifecycle.
(For example, it is not a good idea to have them depend on your [`DataSource`](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/javax/sql/DataSource.html) or JPA configuration.)
You can work around such restrictions by initializing the beans lazily when first used instead of on initialization.

In the case of filters and servlets, you can also add mappings and init parameters by adding a [`FilterRegistrationBean`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/servlet/FilterRegistrationBean.html) or a [`ServletRegistrationBean`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/servlet/ServletRegistrationBean.html) instead of or in addition to the underlying component.
You can also use [`@ServletRegistration`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/servlet/ServletRegistration.html) and [`@FilterRegistration`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/servlet/FilterRegistration.html) as an annotation-based alternative to [`ServletRegistrationBean`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/servlet/ServletRegistrationBean.html) and [`FilterRegistrationBean`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/servlet/FilterRegistrationBean.html).

> [!NOTE]
> If no `dispatcherType` is specified on a filter registration, `REQUEST` is used.
> This aligns with the servlet specification’s default dispatcher type.

Like any other Spring bean, you can define the order of servlet filter beans; please make sure to check the [reference:web/servlet.adoc#web.servlet.embedded-container.servlets-filters-listeners.beans](../reference/web/servlet.md#web.servlet.embedded-container.servlets-filters-listeners.beans) section.

<a id="howto.webserver.add-servlet-filter-listener.spring-bean.disable"></a>

#### Disable Registration of a Servlet or Filter

As [described earlier](#howto.webserver.add-servlet-filter-listener.spring-bean), any [`Servlet`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/Servlet.html) or [`Filter`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/Filter.html) beans are registered with the servlet container automatically.
To disable registration of a particular [`Filter`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/Filter.html) or [`Servlet`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/Servlet.html) bean, create a registration bean for it and mark it as disabled, as shown in the following example:

#### Java

```java
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyFilterConfiguration {

	@Bean
	public FilterRegistrationBean<MyFilter> registration(MyFilter filter) {
		FilterRegistrationBean<MyFilter> registration = new FilterRegistrationBean<>(filter);
		registration.setEnabled(false);
		return registration;
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyFilterConfiguration {

	@Bean
	fun registration(filter: MyFilter): FilterRegistrationBean<MyFilter> {
		val registration = FilterRegistrationBean(filter)
		registration.isEnabled = false
		return registration
	}

}

```

<a id="howto.webserver.add-servlet-filter-listener.using-scanning"></a>

### Add Servlets, Filters, and Listeners by Using Classpath Scanning

[`@WebServlet`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/annotation/WebServlet.html), [`@WebFilter`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/annotation/WebFilter.html), and [`@WebListener`](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/annotation/WebListener.html) annotated classes can be automatically registered with an embedded servlet container by annotating a [`@Configuration`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Configuration.html) class with [`@ServletComponentScan`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/server/servlet/context/ServletComponentScan.html) and specifying the package(s) containing the components that you want to register.
By default, [`@ServletComponentScan`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/server/servlet/context/ServletComponentScan.html) scans from the package of the annotated class.

<a id="howto.webserver.configure-access-logs"></a>

## Configure Access Logging

Access logs can be configured for Tomcat and Jetty through their respective namespaces.

For instance, the following settings log access on Tomcat with a [custom pattern](https://tomcat.apache.org/tomcat-11.0-doc/config/valve.html#Access_Logging).

#### Properties

```properties
server.tomcat.basedir=my-tomcat
server.tomcat.accesslog.enabled=true
server.tomcat.accesslog.pattern=%t %a %r %s (%D microseconds)
```

#### YAML

```yaml
server:
  tomcat:
    basedir: "my-tomcat"
    accesslog:
      enabled: true
      pattern: "%t %a %r %s (%D microseconds)"
```

> [!NOTE]
> The default location for logs is a `logs` directory relative to the Tomcat base directory.
> By default, the `logs` directory is a temporary directory, so you may want to fix Tomcat’s base directory or use an absolute path for the logs.
> In the preceding example, the logs are available in `my-tomcat/logs` relative to the working directory of the application.

Finally, access logging for Jetty can also be configured as follows:

#### Properties

```properties
server.jetty.accesslog.enabled=true
server.jetty.accesslog.filename=/var/log/jetty-access.log
```

#### YAML

```yaml
server:
  jetty:
    accesslog:
      enabled: true
      filename: "/var/log/jetty-access.log"
```

By default, logs are redirected to [`System.err`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/System.html#err).
For more details, see the Jetty documentation.

<a id="howto.webserver.use-behind-a-proxy-server"></a>

## Running Behind a Front-end Proxy Server

If your application is running behind a proxy, a load-balancer or in the cloud, the request information (like the host, port, scheme…​) might change along the way.
Your application may be running on `10.10.10.10:8080`, but HTTP clients should only see `example.org`.

[RFC7239 "Forwarded Headers"](https://tools.ietf.org/html/rfc7239) defines the `Forwarded` HTTP header; proxies can use this header to provide information about the original request.
You can configure your application to read those headers and automatically use that information when creating links and sending them to clients in HTTP 302 responses, JSON documents or HTML pages.
There are also non-standard headers, like `X-Forwarded-Host`, `X-Forwarded-Port`, `X-Forwarded-Proto`, `X-Forwarded-Ssl`, and `X-Forwarded-Prefix`.

If the proxy adds the commonly used `X-Forwarded-For` and `X-Forwarded-Proto` headers, setting `server.forward-headers-strategy` to `NATIVE` is enough to support those.
With this option, the Web servers themselves natively support this feature; you can check their specific documentation to learn about specific behavior.

If this is not enough, Spring Framework provides a [ForwardedHeaderFilter](https://docs.spring.io/spring-framework/reference/7.0/web/webmvc/filters.html#filters-forwarded-headers) for the servlet stack and a [ForwardedHeaderTransformer](https://docs.spring.io/spring-framework/reference/7.0/web/webflux/reactive-spring.html#webflux-forwarded-headers) for the reactive stack.
You can use them in your application by setting `server.forward-headers-strategy` to `FRAMEWORK`.

> [!TIP]
> If you are using Tomcat and terminating SSL at the proxy, `server.tomcat.redirect-context-root` should be set to `false`.
> This allows the `X-Forwarded-Proto` header to be honored before any redirects are performed.

> [!NOTE]
> If your application runs [in a supported Cloud Platform](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/cloud/CloudPlatform.html#enum-constant-summary), the `server.forward-headers-strategy` property defaults to `NATIVE`.
> In all other instances, it defaults to `NONE`.

<a id="howto.webserver.use-behind-a-proxy-server.tomcat"></a>

### Customize Tomcat’s Proxy Configuration

If you use Tomcat, you can additionally configure the names of the headers used to carry “forwarded” information, as shown in the following example:

#### Properties

```properties
server.tomcat.remoteip.remote-ip-header=x-your-remote-ip-header
server.tomcat.remoteip.protocol-header=x-your-protocol-header
```

#### YAML

```yaml
server:
  tomcat:
    remoteip:
      remote-ip-header: "x-your-remote-ip-header"
      protocol-header: "x-your-protocol-header"
```

Tomcat is also configured with a regular expression that matches internal proxies that are to be trusted.
See the [`server.tomcat.remoteip.internal-proxies` entry in the appendix](../appendix/application-properties/index.md#application-properties.server.server.tomcat.remoteip.internal-proxies) for its default value.
You can customize the valve’s configuration by adding an entry to `application.properties`, as shown in the following example:

#### Properties

```properties
server.tomcat.remoteip.internal-proxies=192\.168\.\d{1,3}\.\d{1,3}
```

#### YAML

```yaml
server:
  tomcat:
    remoteip:
      internal-proxies: "192\\.168\\.\\d{1,3}\\.\\d{1,3}"
```

> [!NOTE]
> You can trust all proxies by setting the `internal-proxies` to empty (but do not do so in production).

You can take complete control of the configuration of Tomcat’s [`RemoteIpValve`](https://tomcat.apache.org/tomcat-11.0-doc/api/org/apache/catalina/valves/RemoteIpValve.html) by switching the automatic one off (to do so, set `server.forward-headers-strategy=NONE`) and adding a new valve instance using a [`WebServerFactoryCustomizer`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/web/server/WebServerFactoryCustomizer.html) bean.

<a id="howto.webserver.enable-multiple-connectors-in-tomcat"></a>

## Enable Multiple Connectors with Tomcat

You can add an [`Connector`](https://tomcat.apache.org/tomcat-11.0-doc/api/org/apache/catalina/connector/Connector.html) to the [`TomcatServletWebServerFactory`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/tomcat/servlet/TomcatServletWebServerFactory.html), which can allow multiple connectors, including HTTP and HTTPS connectors, as shown in the following example:

#### Java

```java
import org.apache.catalina.connector.Connector;

import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyTomcatConfiguration {

	@Bean
	public WebServerFactoryCustomizer<TomcatServletWebServerFactory> connectorCustomizer() {
		return (tomcat) -> tomcat.addAdditionalConnectors(createConnector());
	}

	private Connector createConnector() {
		Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
		connector.setPort(8081);
		return connector;
	}

}
```

#### Kotlin

```kotlin
import org.apache.catalina.connector.Connector
import org.springframework.boot.web.server.WebServerFactoryCustomizer
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyTomcatConfiguration {

	@Bean
	fun connectorCustomizer(): WebServerFactoryCustomizer<TomcatServletWebServerFactory> {
		return WebServerFactoryCustomizer { tomcat: TomcatServletWebServerFactory ->
			tomcat.addAdditionalConnectors(createConnector())
		}
	}

	private fun createConnector(): Connector {
		val connector = Connector("org.apache.coyote.http11.Http11NioProtocol")
		connector.port = 8081
		return connector
	}

}

```

<a id="howto.webserver.enable-tomcat-mbean-registry"></a>

## Enable Tomcat’s MBean Registry

Embedded Tomcat’s MBean registry is disabled by default.
This minimizes Tomcat’s memory footprint.
If you want to use Tomcat’s MBeans, for example so that they can be used by Micrometer to expose metrics, you must use the `server.tomcat.mbeanregistry.enabled` property to do so, as shown in the following example:

#### Properties

```properties
server.tomcat.mbeanregistry.enabled=true
```

#### YAML

```yaml
server:
  tomcat:
    mbeanregistry:
      enabled: true
```

<a id="howto.webserver.create-websocket-endpoints-using-serverendpoint"></a>

## Create WebSocket Endpoints Using @ServerEndpoint

If you want to use [`@ServerEndpoint`](https://jakarta.ee/specifications/websocket/2.2/apidocs/server/jakarta/websocket/server/ServerEndpoint.html) in a Spring Boot application that used an embedded container, you must declare a single [`ServerEndpointExporter`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/web/socket/server/standard/ServerEndpointExporter.html) [`@Bean`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/annotation/Bean.html), as shown in the following example:

#### Java

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;

@Configuration(proxyBeanMethods = false)
public class MyWebSocketConfiguration {

	@Bean
	public ServerEndpointExporter serverEndpointExporter() {
		return new ServerEndpointExporter();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.server.standard.ServerEndpointExporter

@Configuration(proxyBeanMethods = false)
class MyWebSocketConfiguration {

	@Bean
	fun serverEndpointExporter(): ServerEndpointExporter {
		return ServerEndpointExporter()
	}

}

```

The bean shown in the preceding example registers any [`@ServerEndpoint`](https://jakarta.ee/specifications/websocket/2.2/apidocs/server/jakarta/websocket/server/ServerEndpoint.html) annotated beans with the underlying WebSocket container.
When deployed to a standalone servlet container, this role is performed by a servlet container initializer, and the [`ServerEndpointExporter`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/web/socket/server/standard/ServerEndpointExporter.html) bean is not required.
