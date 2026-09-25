---
title: "Getting started"
source: "ROOT:introduction/getting-started.adoc"
---

<a id="install-chapter"></a>

# Getting started

Spring Data REST is itself a Spring MVC application and is designed in such a way that it should integrate with your existing Spring MVC applications with little effort. An existing (or future) layer of services can run alongside Spring Data REST with only minor additional work.

<a id="getting-started.boot"></a>

## Adding Spring Data REST to a Spring Boot Project

The simplest way to get to started is to build a Spring Boot application because Spring Boot has a starter for Spring Data REST and uses auto-configuration. The following example shows how to use Gradle to include Spring Data Rest in a Spring Boot project:

```groovy
dependencies {
  ...
  compile("org.springframework.boot:spring-boot-starter-data-rest")
  ...
}
```

The following example shows how to use Maven to include Spring Data Rest in a Spring Boot project:

```xml
<dependencies>
  ...
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-rest</artifactId>
  </dependency>
  ...
</dependencies>
```

> [!NOTE]
> You need not supply the version number if you use the [Spring Boot Gradle plugin](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#build-tool-plugins-gradle-plugin) or the [Spring Boot Maven plugin](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#build-tool-plugins-maven-plugin).

When you use Spring Boot, Spring Data REST gets configured automatically.

<a id="getting-started.gradle"></a>

## Adding Spring Data REST to a Gradle project

To add Spring Data REST to a Gradle-based project, add the `spring-data-rest-webmvc` artifact to your compile-time dependencies, as follows:

```groovy
dependencies {
  … other project dependencies
  compile("org.springframework.data:spring-data-rest-webmvc:4.4.4")
}
```

<a id="getting-started.maven"></a>

## Adding Spring Data REST to a Maven project

To add Spring Data REST to a Maven-based project, add the `spring-data-rest-webmvc` artifact to your compile-time dependencies, as follows:

```xml
<dependency>
  <groupId>org.springframework.data</groupId>
  <artifactId>spring-data-rest-webmvc</artifactId>
  <version>4.4.4</version>
</dependency>
```

<a id="getting-started.configuration"></a>

## Configuring Spring Data REST

To install Spring Data REST alongside your existing Spring MVC application, you need to include the appropriate MVC configuration.
Spring Data REST configuration is defined in a class called `RepositoryRestMvcConfiguration` and you can import that class into your application’s configuration.

> [!IMPORTANT]
> This step is unnecessary if you use Spring Boot’s auto-configuration. Spring Boot automatically enables Spring Data REST when you include **spring-boot-starter-data-rest** and, in your list of dependencies, your app is flagged with either `@SpringBootApplication` or `@EnableAutoConfiguration`.

To customize the configuration, register a `RepositoryRestConfigurer` and implement or override the `configure…`-methods relevant to your use case.

Make sure you also configure Spring Data repositories for the store you use. For details on that, see the reference documentation for the [corresponding Spring Data module](https://projects.spring.io/spring-data/).

<a id="getting-started.basic-settings"></a>

## Basic Settings for Spring Data REST

This section covers the basic settings that you can manipulate when you configure a Spring Data REST application, including:

- [Setting the Repository Detection Strategy](#getting-started.setting-repository-detection-strategy)
- [Changing the Base URI](#getting-started.changing-base-uri)
- [Changing Other Spring Data REST Properties](#getting-started.changing-other-properties)

<a id="getting-started.setting-repository-detection-strategy"></a>

### Setting the Repository Detection Strategy

Spring Data REST uses a `RepositoryDetectionStrategy` to determine whether a repository is exported as a REST resource. The `RepositoryDiscoveryStrategies` enumeration includes the following values:

|  |  |
| --- | --- |
| Name | Description |
| `DEFAULT` | Exposes all public repository interfaces but considers the `exported` flag of `@(Repository)RestResource`. |
| `ALL` | Exposes all repositories independently of type visibility and annotations. |
| `ANNOTATED` | Only repositories annotated with `@(Repository)RestResource` are exposed, unless their `exported` flag is set to `false`. |
| `VISIBILITY` | Only public repositories annotated are exposed. |

<a id="getting-started.changing-base-uri"></a>

### Changing the Base URI

By default, Spring Data REST serves up REST resources at the root URI, '/'. There are multiple ways to change the base path.

With Spring Boot 1.2 and later versions, you can do change the base URI by setting a single property in `application.properties`, as follows:

```properties
spring.data.rest.basePath=/api
```

With Spring Boot 1.1 or earlier, or if you are not using Spring Boot, you can do the following:

```java
@Configuration
class CustomRestMvcConfiguration {

  @Bean
  public RepositoryRestConfigurer repositoryRestConfigurer() {

    return new RepositoryRestConfigurer() {

      @Override
      public void configureRepositoryRestConfiguration(RepositoryRestConfiguration config, CorsRegistry cors) {
        config.setBasePath("/api");
      }
    };
  }
}
```

Alternatively, you can register a custom implementation of `RepositoryRestConfigurer` as a Spring bean and make sure it gets picked up by component scanning, as follows:

```java
@Component
public class CustomizedRestMvcConfiguration extends RepositoryRestConfigurer {

  @Override
  public void configureRepositoryRestConfiguration(RepositoryRestConfiguration config, CorsRegistry cors) {
    config.setBasePath("/api");
  }
}
```

Both of the preceding approaches change the base path to `/api`.

<a id="getting-started.changing-other-properties"></a>

### Changing Other Spring Data REST Properties

You can alter the following properties:

|  |  |
| --- | --- |
| Property | Description |
| `basePath` | the root URI for Spring Data REST |
| `defaultPageSize` | change the default for the number of items served in a single page |
| `maxPageSize` | change the maximum number of items in a single page |
| `pageParamName` | change the name of the query parameter for selecting pages |
| `limitParamName` | change the name of the query parameter for the number of items to show in a page |
| `sortParamName` | change the name of the query parameter for sorting |
| `defaultMediaType` | change the default media type to use when none is specified |
| `returnBodyOnCreate` | change whether a body should be returned when creating a new entity |
| `returnBodyOnUpdate` | change whether a body should be returned when updating an entity |

<a id="getting-started.bootstrap"></a>

## Starting the Application

At this point, you must also configure your key data store.

Spring Data REST officially supports:

- [Spring Data JPA](https://projects.spring.io/spring-data-jpa/)
- [Spring Data MongoDB](https://projects.spring.io/spring-data-mongodb/)
- [Spring Data Neo4j](https://projects.spring.io/spring-data-neo4j/)
- [Spring Data GemFire](https://projects.spring.io/spring-data-gemfire/)
- [Spring Data Cassandra](https://projects.spring.io/spring-data-cassandra/)

The following Getting Started guides can help you get up and running quickly:

- [Spring Data JPA](https://spring.io/guides/gs/accessing-data-rest/)
- [Spring Data MongoDB](https://spring.io/guides/gs/accessing-mongodb-data-rest/)
- [Spring Data Neo4j](https://spring.io/guides/gs/accessing-neo4j-data-rest/)
- [Spring Data GemFire](https://spring.io/guides/gs/accessing-gemfire-data-rest/)

These linked guides introduce how to add dependencies for the related data store, configure domain objects, and define repositories.

You can run your application as either a Spring Boot app (with the links shown earlier) or configure it as a classic Spring MVC app.

> [!NOTE]
> In general, Spring Data REST does not add functionality to a given data store. This means that, by definition, it should work with any Spring Data project that supports the repository programming model. The data stores listed above are the ones for which we have written integration tests to verify that Spring Data REST works with them.

From this point, you can  [customize Spring Data REST](../customizing-sdr.md) with various options.
