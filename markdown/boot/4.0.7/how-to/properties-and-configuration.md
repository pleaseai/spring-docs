---
title: "Properties and Configuration"
source: "how-to:properties-and-configuration.adoc"
---

<a id="howto.properties-and-configuration"></a>

# Properties and Configuration

This section includes topics about setting and reading properties and configuration settings and their interaction with Spring Boot applications.

<a id="howto.properties-and-configuration.expand-properties"></a>

## Automatically Expand Properties at Build Time

Rather than hardcoding some properties that are also specified in your project’s build configuration, you can automatically expand them by instead using the existing build configuration.
This is possible in both Maven and Gradle.

<a id="howto.properties-and-configuration.expand-properties.maven"></a>

### Automatic Property Expansion Using Maven

You can automatically expand properties in the Maven project by using resource filtering.
If you use the `spring-boot-starter-parent`, you can then refer to your Maven ‘project properties’ with `@..@` placeholders, as shown in the following example:

#### Properties

```properties
app.encoding=@project.build.sourceEncoding@
app.java.version=@java.version@
```

#### YAML

```yaml
app:
  encoding: "@project.build.sourceEncoding@"
  java:
    version: "@java.version@"
```

> [!NOTE]
> Only production configuration is filtered that way (in other words, no filtering is applied on `src/test/resources`).

> [!TIP]
> If you enable the `addResources` flag, the `spring-boot:run` goal can add `src/main/resources` directly to the classpath (for hot reloading purposes).
> Doing so circumvents the resource filtering and this feature.
> Instead, you can use the `exec:java` goal or customize the plugin’s configuration.
> See the [plugin usage page](https://docs.spring.io/spring-boot/4.0.7/maven-plugin/using.html) for more details.

If you do not use the starter parent, you need to include the following  element inside the `<build/>` element of your `pom.xml`:

```xml
<resources>
	<resource>
		<directory>src/main/resources</directory>
		<filtering>true</filtering>
	</resource>
</resources>
```

You also need to include the following element inside `<plugins/>`:

```xml
<plugin>
	<groupId>org.apache.maven.plugins</groupId>
	<artifactId>maven-resources-plugin</artifactId>
	<version>2.7</version>
	<configuration>
		<delimiters>
			<delimiter>@</delimiter>
		</delimiters>
		<useDefaultDelimiters>false</useDefaultDelimiters>
	</configuration>
</plugin>
```

> [!NOTE]
> The `useDefaultDelimiters` property is important if you use standard Spring placeholders (such as `${placeholder}`) in your configuration.
> If that property is not set to `false`, these may be expanded by the build.

<a id="howto.properties-and-configuration.expand-properties.gradle"></a>

### Automatic Property Expansion Using Gradle

You can automatically expand properties from the Gradle project by configuring the Java plugin’s `processResources` task to do so, as shown in the following example:

```gradle
tasks.named('processResources') {
	expand(project.properties)
}
```

You can then refer to your Gradle project’s properties by using placeholders, as shown in the following example:

#### Properties

```properties
app.name=${name}
app.description=${description}
```

#### YAML

```yaml
app:
  name: "${name}"
  description: "${description}"
```

> [!NOTE]
> Gradle’s `expand` method uses Groovy’s `SimpleTemplateEngine`, which transforms `${..}` tokens.
> The `${..}` style conflicts with Spring’s own property placeholder mechanism.
> To use Spring property placeholders together with automatic expansion, escape the Spring property placeholders as follows: `\${..}`.

<a id="howto.properties-and-configuration.externalize-configuration"></a>

## Externalize the Configuration of SpringApplication

A [`SpringApplication`](https://docs.spring.io/spring-boot/4.0.7/api/java/org/springframework/boot/SpringApplication.html) has bean property setters, so you can use its Java API as you create the application to modify its behavior.
Alternatively, you can externalize the configuration by setting properties in `spring.main.*`.
For example, in `application.properties`, you might have the following settings:

#### Properties

```properties
spring.main.web-application-type=none
spring.main.banner-mode=off
```

#### YAML

```yaml
spring:
  main:
    web-application-type: "none"
    banner-mode: "off"
```

Then the Spring Boot banner is not printed on startup, and the application is not starting an embedded web server.

Properties defined in external configuration override and replace the values specified with the Java API, with the notable exception of the primary sources.
Primary sources are those provided to the [`SpringApplication`](https://docs.spring.io/spring-boot/4.0.7/api/java/org/springframework/boot/SpringApplication.html) constructor:

#### Java

```java
import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyApplication {

	public static void main(String[] args) {
		SpringApplication application = new SpringApplication(MyApplication.class);
		application.setBannerMode(Banner.Mode.OFF);
		application.run(args);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.Banner
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication

@SpringBootApplication
object MyApplication {

	@JvmStatic
	fun main(args: Array<String>) {
		val application = SpringApplication(MyApplication::class.java)
		application.setBannerMode(Banner.Mode.OFF)
		application.run(*args)
	}

}

```

Or to `sources(…​)` method of a [`SpringApplicationBuilder`](https://docs.spring.io/spring-boot/4.0.7/api/java/org/springframework/boot/builder/SpringApplicationBuilder.html):

#### Java

```java
import org.springframework.boot.Banner;
import org.springframework.boot.builder.SpringApplicationBuilder;

public class MyApplication {

	public static void main(String[] args) {
		new SpringApplicationBuilder()
			.bannerMode(Banner.Mode.OFF)
			.sources(MyApplication.class)
			.run(args);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.Banner
import org.springframework.boot.builder.SpringApplicationBuilder

object MyApplication {

	@JvmStatic
	fun main(args: Array<String>) {
		SpringApplicationBuilder()
			.bannerMode(Banner.Mode.OFF)
			.sources(MyApplication::class.java)
			.run(*args)
	}

}

```

Given the examples above, if we have the following configuration:

#### Properties

```properties
spring.main.sources=com.example.MyDatabaseConfig,com.example.MyJmsConfig
spring.main.banner-mode=console
```

#### YAML

```yaml
spring:
  main:
    sources: "com.example.MyDatabaseConfig,com.example.MyJmsConfig"
    banner-mode: "console"
```

The actual application will show the banner (as overridden by configuration) and use three sources for the [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/context/ApplicationContext.html).
The application sources are:

1. `MyApplication` (from the code)
1. `MyDatabaseConfig` (from the external config)
1. `MyJmsConfig`(from the external config)

<a id="howto.properties-and-configuration.external-properties-location"></a>

## Change the Location of External Properties of an Application

By default, properties from different sources are added to the Spring [`Environment`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/core/env/Environment.html) in a defined order (see [reference:features/external-config.adoc](../reference/features/external-config.md) in the “Spring Boot Features” section for the exact order).

You can also provide the following System properties (or environment variables) to change the behavior:

- `spring.config.name` (`SPRING_CONFIG_NAME`): Defaults to `application` as the root of the file name.
- `spring.config.location` (`SPRING_CONFIG_LOCATION`): The file to load (such as a classpath resource or a URL).
A separate [`Environment`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/core/env/Environment.html) property source is set up for this document and it can be overridden by system properties, environment variables, or the command line.

No matter what you set in the environment, Spring Boot always loads `application.properties` as described above.
By default, if YAML is used, then files with the ‘.yaml’ and ‘.yml’ extensions are also added to the list.

> [!TIP]
> If you want detailed information about the files that are being loaded you can [set the logging level](../reference/features/logging.md#features.logging.log-levels) of `org.springframework.boot.context.config` to `trace`.

<a id="howto.properties-and-configuration.short-command-line-arguments"></a>

## Use ‘Short’ Command Line Arguments

Some people like to use (for example) `--port=9000` instead of `--server.port=9000` to set configuration properties on the command line.
You can enable this behavior by using placeholders in `application.properties`, as shown in the following example:

#### Properties

```properties
server.port=${port:8080}
```

#### YAML

```yaml
server:
  port: "${port:8080}"
```

> [!TIP]
> If you inherit from the `spring-boot-starter-parent` POM, the default filter token of the `maven-resources-plugins` has been changed from `${*}` to `@` (that is, `@maven.token@` instead of `${maven.token}`) to prevent conflicts with Spring-style placeholders.
> If you have enabled Maven filtering for the `application.properties` directly, you may want to also change the default filter token to use [other delimiters](https://maven.apache.org/plugins/maven-resources-plugin/resources-mojo.html#delimiters).

> [!NOTE]
> In this specific case, the port binding works in a PaaS environment such as Heroku or Cloud Foundry.
> On those two platforms, the `PORT` environment variable is set automatically and Spring can bind to capitalized synonyms for [`Environment`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/core/env/Environment.html) properties.

<a id="howto.properties-and-configuration.yaml"></a>

## Use YAML for External Properties

YAML is a superset of JSON and, as such, is a convenient syntax for storing external properties in a hierarchical format, as shown in the following example:

```yaml
spring:
  application:
    name: "cruncher"
  datasource:
    driver-class-name: "com.mysql.jdbc.Driver"
    url: "jdbc:mysql://localhost/test"
server:
  port: 9000
```

Create a file called `application.yaml` and put it in the root of your classpath.
Then add `snakeyaml` to your dependencies (Maven coordinates `org.yaml:snakeyaml`, already included if you use the `spring-boot-starter`).
A YAML file is parsed to a Java `Map<String,Object>` (like a JSON object), and Spring Boot flattens the map so that it is one level deep and has period-separated keys, as many people are used to with [`Properties`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Properties.html) files in Java.

The preceding example YAML corresponds to the following `application.properties` file:

```properties
spring.application.name=cruncher
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
spring.datasource.url=jdbc:mysql://localhost/test
server.port=9000
```

See [reference:features/external-config.adoc#features.external-config.yaml](../reference/features/external-config.md#features.external-config.yaml) in the “Spring Boot Features” section for more information about YAML.

<a id="howto.properties-and-configuration.set-active-spring-profiles"></a>

## Set the Active Spring Profiles

The Spring [`Environment`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/core/env/Environment.html) has an API for this, but you would normally set a System property (`spring.profiles.active`) or an OS environment variable (`SPRING_PROFILES_ACTIVE`).
Also, you can launch your application with a `-D` argument (remember to put it before the main class or jar archive), as follows:

```shell
$ java -jar -Dspring.profiles.active=production demo-0.0.1-SNAPSHOT.jar
```

In Spring Boot, you can also set the active profile in `application.properties`, as shown in the following example:

#### Properties

```properties
spring.profiles.active=production
```

#### YAML

```yaml
spring:
  profiles:
    active: "production"
```

A value set this way is replaced by the System property or environment variable setting but not by the `SpringApplicationBuilder.profiles()` method.
Thus, the latter Java API can be used to augment the profiles without changing the defaults.

See [reference:features/profiles.adoc](../reference/features/profiles.md) in the “Spring Boot Features” section for more information.

<a id="howto.properties-and-configuration.set-default-spring-profile-name"></a>

## Set the Default Profile Name

The default profile is a profile that is enabled if no profile is active.
By default, the name of the default profile is `default`, but it could be changed using a System property (`spring.profiles.default`) or an OS environment variable (`SPRING_PROFILES_DEFAULT`).

In Spring Boot, you can also set the default profile name in `application.properties`, as shown in the following example:

#### Properties

```properties
spring.profiles.default=dev
```

#### YAML

```yaml
spring:
  profiles:
    default: "dev"
```

See [reference:features/profiles.adoc](../reference/features/profiles.md) in the “Spring Boot Features” section for more information.

<a id="howto.properties-and-configuration.change-configuration-depending-on-the-environment"></a>

## Change Configuration Depending on the Environment

Spring Boot supports multi-document YAML and Properties files (see [reference:features/external-config.adoc#features.external-config.files.multi-document](../reference/features/external-config.md#features.external-config.files.multi-document) for details) which can be activated conditionally based on the active profiles.

If a document contains a `spring.config.activate.on-profile` key, then the profiles value (a comma-separated list of profiles or a profile expression) is fed into the Spring `Environment.acceptsProfiles()` method.
If the profile expression matches, then that document is included in the final merge (otherwise, it is not), as shown in the following example:

#### Properties

```properties
server.port=9000
#---
spring.config.activate.on-profile=development
server.port=9001
#---
spring.config.activate.on-profile=production
server.port=0
```

#### YAML

```yaml
server:
  port: 9000
---
spring:
  config:
    activate:
      on-profile: "development"
server:
  port: 9001
---
spring:
  config:
    activate:
      on-profile: "production"
server:
  port: 0
```

In the preceding example, the default port is 9000.
However, if the Spring profile called ‘development’ is active, then the port is 9001.
If ‘production’ is active, then the port is 0.

> [!NOTE]
> The documents are merged in the order in which they are encountered.
> Later values override earlier values.

<a id="howto.properties-and-configuration.discover-build-in-options-for-external-properties"></a>

## Discover Built-in Options for External Properties

Spring Boot binds external properties from `application.properties` (or YAML files and other places) into an application at runtime.
There is not (and technically cannot be) an exhaustive list of all supported properties in a single location, because contributions can come from additional jar files on your classpath.

A running application with the Actuator features has a `configprops` endpoint that shows all the bound and bindable properties available through [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/4.0.7/api/java/org/springframework/boot/context/properties/ConfigurationProperties.html).

The appendix includes an [`application.properties`](../appendix/application-properties/index.md) example with a list of the most common properties supported by Spring Boot.
The definitive list comes from searching the source code for [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/4.0.7/api/java/org/springframework/boot/context/properties/ConfigurationProperties.html) and [`@Value`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/beans/factory/annotation/Value.html) annotations as well as the occasional use of [`Binder`](https://docs.spring.io/spring-boot/4.0.7/api/java/org/springframework/boot/context/properties/bind/Binder.html).
For more about the exact ordering of loading properties, see [reference:features/external-config.adoc](../reference/features/external-config.md).
