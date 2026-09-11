---
title: "Build Systems"
source: "reference:using/build-systems.adoc"
---

<a id="using.build-systems"></a>

# Build Systems

It is strongly recommended that you choose a build system that supports [dependency management](#using.build-systems.dependency-management) and that can consume artifacts published to the Maven Central repository.
We would recommend that you choose Maven or Gradle.
It is possible to get Spring Boot to work with other build systems (Ant, for example), but they are not particularly well supported.

<a id="using.build-systems.dependency-management"></a>

## Dependency Management

Each release of Spring Boot provides a curated list of dependencies that it supports.
In practice, you do not need to provide a version for any of these dependencies in your build configuration, as Spring Boot manages that for you.
When you upgrade Spring Boot itself, these dependencies are upgraded as well in a consistent way.

> [!NOTE]
> You can still specify a version and override Spring Boot’s recommendations if you need to do so.

The curated list contains all the Spring modules that you can use with Spring Boot as well as a refined list of third party libraries.
The list is available as a standard Bills of Materials (`spring-boot-dependencies`) that can be used with both [Maven](#using.build-systems.maven) and [Gradle](#using.build-systems.gradle).

> [!WARNING]
> Each release of Spring Boot is associated with a base version of the Spring Framework.
> We **highly** recommend that you do not specify its version.

<a id="using.build-systems.maven"></a>

## Maven

To learn about using Spring Boot with Maven, see the documentation for Spring Boot’s Maven plugin:

- [Reference](https://docs.spring.io/spring-boot/4.1.1/maven-plugin/index.html)
- [API](https://docs.spring.io/spring-boot/4.1.1/maven-plugin/api/java/index.html)

<a id="using.build-systems.gradle"></a>

## Gradle

To learn about using Spring Boot with Gradle, see the documentation for Spring Boot’s Gradle plugin:

- [Reference](https://docs.spring.io/spring-boot/4.1.1/gradle-plugin/index.html)
- [API](https://docs.spring.io/spring-boot/4.1.1/gradle-plugin/api/java/index.html)

<a id="using.build-systems.ant"></a>

## Ant

It is possible to build a Spring Boot project using Apache Ant+Ivy.
The `spring-boot-antlib` “AntLib” module is also available to help Ant create executable jars.

To declare dependencies, a typical `ivy.xml` file looks something like the following example:

```xml
<ivy-module version="2.0">
	<info organisation="org.springframework.boot" module="spring-boot-sample-ant" />
	<configurations>
		<conf name="compile" description="everything needed to compile this module" />
		<conf name="runtime" extends="compile" description="everything needed to run this module" />
	</configurations>
	<dependencies>
		<dependency org="org.springframework.boot" name="spring-boot-starter"
			rev="${spring-boot.version}" conf="compile" />
	</dependencies>
</ivy-module>
```

A typical `build.xml` looks like the following example:

```xml
<project
	xmlns:ivy="antlib:org.apache.ivy.ant"
	xmlns:spring-boot="antlib:org.springframework.boot.ant"
	name="myapp" default="build">

	<property name="spring-boot.version" value="{version-spring-boot}" />

	<target name="resolve" description="--> retrieve dependencies with ivy">
		<ivy:retrieve pattern="lib/[conf]/[artifact]-[type]-[revision].[ext]" />
	</target>

	<target name="classpaths" depends="resolve">
		<path id="compile.classpath">
			<fileset dir="lib/compile" includes="*.jar" />
		</path>
	</target>

	<target name="init" depends="classpaths">
		<mkdir dir="build/classes" />
	</target>

	<target name="compile" depends="init" description="compile">
		<javac srcdir="src/main/java" destdir="build/classes" classpathref="compile.classpath" />
	</target>

	<target name="build" depends="compile">
		<spring-boot:exejar destfile="build/myapp.jar" classes="build/classes">
			<spring-boot:lib>
				<fileset dir="lib/runtime" />
			</spring-boot:lib>
		</spring-boot:exejar>
	</target>
</project>
```

> [!TIP]
> If you do not want to use the `spring-boot-antlib` module, see the [how-to:build.adoc#howto.build.build-an-executable-archive-with-ant-without-using-spring-boot-antlib](../../how-to/build.md#howto.build.build-an-executable-archive-with-ant-without-using-spring-boot-antlib) section of “How-to Guides”.

<a id="using.build-systems.starters"></a>

## Starters

Starters are a set of convenient dependency descriptors that you can include in your application.
You get a one-stop shop for all the Spring and related technologies that you need without having to hunt through sample code and copy-paste loads of dependency descriptors.
For example, if you want to get started using Spring and JPA for database access, include the `spring-boot-starter-data-jpa` dependency in your project.

The starters contain a lot of the dependencies that you need to get a project up and running quickly and with a consistent, supported set of managed transitive dependencies.

#### What is in a name

> All **official** starters follow a similar naming pattern; `spring-boot-starter-*`, where `*` is a particular type of application.
> This naming structure is intended to help when you need to find a starter.
> The Maven integration in many IDEs lets you search dependencies by name.
> For example, with the appropriate Eclipse or Spring Tools plugin installed, you can press `ctrl-space` in the POM editor and type “spring-boot-starter” for a complete list.
>
> As explained in the [features/developing-auto-configuration.adoc#features.developing-auto-configuration.custom-starter](../features/developing-auto-configuration.md#features.developing-auto-configuration.custom-starter) section, third party starters should not start with `spring-boot`, as it is reserved for official Spring Boot artifacts.
> Rather, a third-party starter typically starts with the name of the project.
> For example, a third-party starter project called `thirdpartyproject` would typically be named `thirdpartyproject-spring-boot-starter`.

The following application starters are provided by Spring Boot under the `org.springframework.boot` group:

| Name | Description |
| --- | --- |
| <a id="spring-boot-starter"></a>`spring-boot-starter` | Core starter, including auto-configuration support, logging and YAML |
| <a id="spring-boot-starter-activemq"></a>`spring-boot-starter-activemq` | Starter for using Apache ActiveMQ and JMS |
| <a id="spring-boot-starter-activemq-test"></a>`spring-boot-starter-activemq-test` | Starter for testing using Apache ActiveMQ and JMS |
| <a id="spring-boot-starter-actuator-test"></a>`spring-boot-starter-actuator-test` | Starter for testing Spring Boot’s Actuator which provides production ready features to help you monitor and manage your application |
| <a id="spring-boot-starter-amqp"></a>`spring-boot-starter-amqp` | Starter for using Spring AMQP and Rabbit MQ |
| <a id="spring-boot-starter-amqp-test"></a>`spring-boot-starter-amqp-test` | Starter for testing Spring AMQP and Rabbit MQ |
| <a id="spring-boot-starter-artemis"></a>`spring-boot-starter-artemis` | Starter for using Apache Artemis and JMS |
| <a id="spring-boot-starter-artemis-test"></a>`spring-boot-starter-artemis-test` | Starter for testing Apache Artemis and JMS |
| <a id="spring-boot-starter-aspectj"></a>`spring-boot-starter-aspectj` | Starter for using aspect-oriented programming with AspectJ |
| <a id="spring-boot-starter-aspectj-test"></a>`spring-boot-starter-aspectj-test` | Starter for testing aspect-oriented programming with AspectJ |
| <a id="spring-boot-starter-batch"></a>`spring-boot-starter-batch` | Starter for using Spring Batch |
| <a id="spring-boot-starter-batch-data-mongodb"></a>`spring-boot-starter-batch-data-mongodb` | Starter for using Spring Batch with Data MongoDB |
| <a id="spring-boot-starter-batch-data-mongodb-test"></a>`spring-boot-starter-batch-data-mongodb-test` | Starter for testing using Spring Batch with Data MongoDB |
| <a id="spring-boot-starter-batch-jdbc"></a>`spring-boot-starter-batch-jdbc` | Starter for using Spring Batch with JDBC |
| <a id="spring-boot-starter-batch-jdbc-test"></a>`spring-boot-starter-batch-jdbc-test` | Starter for testing using Spring Batch with JDBC |
| <a id="spring-boot-starter-batch-test"></a>`spring-boot-starter-batch-test` | Starter for testing using Spring Batch |
| <a id="spring-boot-starter-cache"></a>`spring-boot-starter-cache` | Starter for using Spring’s caching support |
| <a id="spring-boot-starter-cache-test"></a>`spring-boot-starter-cache-test` | Starter for testing Spring’s caching support |
| <a id="spring-boot-starter-cassandra"></a>`spring-boot-starter-cassandra` | Starter for using Cassandra distributed database |
| <a id="spring-boot-starter-cassandra-test"></a>`spring-boot-starter-cassandra-test` | Starter for testing Cassandra distributed database |
| <a id="spring-boot-starter-classic"></a>`spring-boot-starter-classic` | Core classic starter, including full auto-configuration support, logging and YAML |
| <a id="spring-boot-starter-cloudfoundry"></a>`spring-boot-starter-cloudfoundry` | Starter for using Cloud Foundry |
| <a id="spring-boot-starter-cloudfoundry-test"></a>`spring-boot-starter-cloudfoundry-test` | Starter for testing Cloud Foundry |
| <a id="spring-boot-starter-couchbase"></a>`spring-boot-starter-couchbase` | Starter for using Couchbase document-oriented database |
| <a id="spring-boot-starter-couchbase-test"></a>`spring-boot-starter-couchbase-test` | Starter for testing Couchbase document-oriented database |
| <a id="spring-boot-starter-data-cassandra"></a>`spring-boot-starter-data-cassandra` | Starter for using Cassandra distributed database and Spring Data Cassandra |
| <a id="spring-boot-starter-data-cassandra-reactive"></a>`spring-boot-starter-data-cassandra-reactive` | Starter for using Cassandra distributed database and Spring Data Cassandra Reactive |
| <a id="spring-boot-starter-data-cassandra-reactive-test"></a>`spring-boot-starter-data-cassandra-reactive-test` | Starter for testing Cassandra distributed database and Spring Data Cassandra Reactive |
| <a id="spring-boot-starter-data-cassandra-test"></a>`spring-boot-starter-data-cassandra-test` | Starter for testing Cassandra distributed database and Spring Data Cassandra |
| <a id="spring-boot-starter-data-couchbase"></a>`spring-boot-starter-data-couchbase` | Starter for using Couchbase document-oriented database and Spring Data Couchbase |
| <a id="spring-boot-starter-data-couchbase-reactive"></a>`spring-boot-starter-data-couchbase-reactive` | Starter for using Couchbase document-oriented database and Spring Data Couchbase Reactive |
| <a id="spring-boot-starter-data-couchbase-reactive-test"></a>`spring-boot-starter-data-couchbase-reactive-test` | Starter for testing Couchbase document-oriented database and Spring Data Couchbase Reactive |
| <a id="spring-boot-starter-data-couchbase-test"></a>`spring-boot-starter-data-couchbase-test` | Starter for testing Couchbase document-oriented database and Spring Data Couchbase |
| <a id="spring-boot-starter-data-elasticsearch"></a>`spring-boot-starter-data-elasticsearch` | Starter for using Elasticsearch search and analytics engine and Spring Data Elasticsearch |
| <a id="spring-boot-starter-data-elasticsearch-test"></a>`spring-boot-starter-data-elasticsearch-test` | Starter for testing Elasticsearch search and analytics engine and Spring Data Elasticsearch |
| <a id="spring-boot-starter-data-jdbc"></a>`spring-boot-starter-data-jdbc` | Starter for using Spring Data JDBC |
| <a id="spring-boot-starter-data-jdbc-test"></a>`spring-boot-starter-data-jdbc-test` | Starter for testing Spring Data JDBC |
| <a id="spring-boot-starter-data-jpa"></a>`spring-boot-starter-data-jpa` | Starter for using Spring Data JPA with Hibernate |
| <a id="spring-boot-starter-data-jpa-test"></a>`spring-boot-starter-data-jpa-test` | Starter for testing Spring Data JPA with Hibernate |
| <a id="spring-boot-starter-data-ldap"></a>`spring-boot-starter-data-ldap` | Starter for using Spring Data LDAP |
| <a id="spring-boot-starter-data-ldap-test"></a>`spring-boot-starter-data-ldap-test` | Starter for testing Spring Data LDAP |
| <a id="spring-boot-starter-data-mongodb"></a>`spring-boot-starter-data-mongodb` | Starter for using MongoDB document-oriented database and Spring Data MongoDB |
| <a id="spring-boot-starter-data-mongodb-reactive"></a>`spring-boot-starter-data-mongodb-reactive` | Starter for using MongoDB document-oriented database and Spring Data MongoDB Reactive |
| <a id="spring-boot-starter-data-mongodb-reactive-test"></a>`spring-boot-starter-data-mongodb-reactive-test` | Starter for using MongoDB document-oriented database and Spring Data MongoDB Reactive |
| <a id="spring-boot-starter-data-mongodb-test"></a>`spring-boot-starter-data-mongodb-test` | Starter for testing MongoDB document-oriented database and Spring Data MongoDB |
| <a id="spring-boot-starter-data-neo4j"></a>`spring-boot-starter-data-neo4j` | Starter for using Neo4j graph database and Spring Data Neo4j |
| <a id="spring-boot-starter-data-neo4j-test"></a>`spring-boot-starter-data-neo4j-test` | Starter for testing Neo4j graph database and Spring Data Neo4j |
| <a id="spring-boot-starter-data-r2dbc"></a>`spring-boot-starter-data-r2dbc` | Starter for using Spring Data R2DBC |
| <a id="spring-boot-starter-data-r2dbc-test"></a>`spring-boot-starter-data-r2dbc-test` | Starter for testing Spring Data R2DBC |
| <a id="spring-boot-starter-data-redis"></a>`spring-boot-starter-data-redis` | Starter for using Redis key-value data store with Spring Data Redis and the Lettuce client |
| <a id="spring-boot-starter-data-redis-reactive"></a>`spring-boot-starter-data-redis-reactive` | Starter for using Redis key-value data store with Spring Data Redis reactive and the Lettuce client |
| <a id="spring-boot-starter-data-redis-reactive-test"></a>`spring-boot-starter-data-redis-reactive-test` | Starter for testing Redis key-value data store with Spring Data Redis reactive and the Lettuce client |
| <a id="spring-boot-starter-data-redis-test"></a>`spring-boot-starter-data-redis-test` | Starter for testing Redis key-value data store with Spring Data Redis and the Lettuce client |
| <a id="spring-boot-starter-data-rest"></a>`spring-boot-starter-data-rest` | Starter for using Spring Data repositories exposed over REST using Spring Data REST and Spring MVC |
| <a id="spring-boot-starter-data-rest-test"></a>`spring-boot-starter-data-rest-test` | Starter for testing Spring Data repositories exposed over REST using Spring Data REST and Spring MVC |
| <a id="spring-boot-starter-elasticsearch"></a>`spring-boot-starter-elasticsearch` | Starter for using Elasticsearch search and analytics engine |
| <a id="spring-boot-starter-elasticsearch-test"></a>`spring-boot-starter-elasticsearch-test` | Starter for testing Elasticsearch search and analytics engine |
| <a id="spring-boot-starter-flyway"></a>`spring-boot-starter-flyway` | Starter for using Flyway database migrations |
| <a id="spring-boot-starter-flyway-test"></a>`spring-boot-starter-flyway-test` | Starter for testing Flyway database migrations |
| <a id="spring-boot-starter-freemarker"></a>`spring-boot-starter-freemarker` | Starter for using FreeMarker |
| <a id="spring-boot-starter-freemarker-test"></a>`spring-boot-starter-freemarker-test` | Starter for testing FreeMarker |
| <a id="spring-boot-starter-graphql"></a>`spring-boot-starter-graphql` | Starter using Spring GraphQL |
| <a id="spring-boot-starter-graphql-test"></a>`spring-boot-starter-graphql-test` | Starter for testing Spring GraphQL |
| <a id="spring-boot-starter-groovy-templates"></a>`spring-boot-starter-groovy-templates` | Starter for using Groovy Templates |
| <a id="spring-boot-starter-groovy-templates-test"></a>`spring-boot-starter-groovy-templates-test` | Starter for testing Groovy Templates |
| <a id="spring-boot-starter-grpc-client"></a>`spring-boot-starter-grpc-client` | Starter for using Spring gRPC client |
| <a id="spring-boot-starter-grpc-client-test"></a>`spring-boot-starter-grpc-client-test` | Starter for testing gRPC client |
| <a id="spring-boot-starter-grpc-server"></a>`spring-boot-starter-grpc-server` | Starter for using Spring gRPC server |
| <a id="spring-boot-starter-grpc-server-test"></a>`spring-boot-starter-grpc-server-test` | Starter for testing gRPC server |
| <a id="spring-boot-starter-gson"></a>`spring-boot-starter-gson` | Starter for using GSON |
| <a id="spring-boot-starter-gson-test"></a>`spring-boot-starter-gson-test` | Starter for testing GSON |
| <a id="spring-boot-starter-hateoas"></a>`spring-boot-starter-hateoas` | Starter for using Spring HATEOS to build hypermedia-based RESTful Spring MVC web applications |
| <a id="spring-boot-starter-hateoas-test"></a>`spring-boot-starter-hateoas-test` | Starter for testing Spring HATEOS to build hypermedia-based RESTful Spring MVC web applications |
| <a id="spring-boot-starter-hazelcast"></a>`spring-boot-starter-hazelcast` | Starter for using Hazelcast |
| <a id="spring-boot-starter-hazelcast-test"></a>`spring-boot-starter-hazelcast-test` | Starter for testing Hazelcast |
| <a id="spring-boot-starter-integration"></a>`spring-boot-starter-integration` | Starter for using Spring Integration |
| <a id="spring-boot-starter-integration-test"></a>`spring-boot-starter-integration-test` | Starter for testing Spring Integration |
| <a id="spring-boot-starter-jackson"></a>`spring-boot-starter-jackson` | Starter for using Jackson |
| <a id="spring-boot-starter-jackson-test"></a>`spring-boot-starter-jackson-test` | Starter for testing Jackson |
| <a id="spring-boot-starter-jdbc"></a>`spring-boot-starter-jdbc` | Starter for using JDBC with the HikariCP connection pool |
| <a id="spring-boot-starter-jdbc-test"></a>`spring-boot-starter-jdbc-test` | Starter for testing JDBC with the HikariCP connection pool |
| <a id="spring-boot-starter-jersey"></a>`spring-boot-starter-jersey` | Starter for using JAX-RS and Jersey |
| <a id="spring-boot-starter-jersey-test"></a>`spring-boot-starter-jersey-test` | Starter for testing JAX-RS and Jersey |
| <a id="spring-boot-starter-jetty"></a>`spring-boot-starter-jetty` | Starter for using Jetty as the embedded servlet container |
| <a id="spring-boot-starter-jms"></a>`spring-boot-starter-jms` | Starter for using JMS |
| <a id="spring-boot-starter-jms-test"></a>`spring-boot-starter-jms-test` | Starter for testing JMS |
| <a id="spring-boot-starter-jooq"></a>`spring-boot-starter-jooq` | Starter for using jOOQ to access SQL databases with JDBC |
| <a id="spring-boot-starter-jooq-test"></a>`spring-boot-starter-jooq-test` | Starter for testing jOOQ to access SQL databases with JDBC |
| <a id="spring-boot-starter-json"></a>`spring-boot-starter-json` | Starter for reading and writing JSON |
| <a id="spring-boot-starter-jsonb"></a>`spring-boot-starter-jsonb` | Starter for using JSON-B |
| <a id="spring-boot-starter-jsonb-test"></a>`spring-boot-starter-jsonb-test` | Starter for testing JSON-B |
| <a id="spring-boot-starter-kafka"></a>`spring-boot-starter-kafka` | Starter for using Apache Kafka |
| <a id="spring-boot-starter-kafka-test"></a>`spring-boot-starter-kafka-test` | Starter for testing Apache Kafka |
| <a id="spring-boot-starter-kotlinx-serialization-json"></a>`spring-boot-starter-kotlinx-serialization-json` | Starter for using Kotlinx Serialization JSON |
| <a id="spring-boot-starter-kotlinx-serialization-json-test"></a>`spring-boot-starter-kotlinx-serialization-json-test` | Starter for testing Kotlinx Serialization JSON |
| <a id="spring-boot-starter-ldap"></a>`spring-boot-starter-ldap` | Starter for using LDAP |
| <a id="spring-boot-starter-ldap-test"></a>`spring-boot-starter-ldap-test` | Starter for testing LDAP |
| <a id="spring-boot-starter-liquibase"></a>`spring-boot-starter-liquibase` | Starter for using Liquibase database migrations |
| <a id="spring-boot-starter-liquibase-test"></a>`spring-boot-starter-liquibase-test` | Starter for testing Liquibase database migrations |
| <a id="spring-boot-starter-mail"></a>`spring-boot-starter-mail` | Starter for using Java Mail and Spring Framework’s email sending support |
| <a id="spring-boot-starter-mail-test"></a>`spring-boot-starter-mail-test` | Starter for testing Java Mail and Spring Framework’s email sending support |
| <a id="spring-boot-starter-micrometer-metrics"></a>`spring-boot-starter-micrometer-metrics` | Starter for using Micrometer Metrics |
| <a id="spring-boot-starter-micrometer-metrics-test"></a>`spring-boot-starter-micrometer-metrics-test` | Starter for testing Micrometer Metrics |
| <a id="spring-boot-starter-mongodb"></a>`spring-boot-starter-mongodb` | Starter for using MongoDB document-oriented database |
| <a id="spring-boot-starter-mongodb-test"></a>`spring-boot-starter-mongodb-test` | Starter for testing MongoDB document-oriented database |
| <a id="spring-boot-starter-mustache"></a>`spring-boot-starter-mustache` | Starter for using Mustache |
| <a id="spring-boot-starter-mustache-test"></a>`spring-boot-starter-mustache-test` | Starter for testing Mustache |
| <a id="spring-boot-starter-neo4j"></a>`spring-boot-starter-neo4j` | Starter for using Neo4j graph database |
| <a id="spring-boot-starter-neo4j-test"></a>`spring-boot-starter-neo4j-test` | Starter for testing Neo4j graph database |
| <a id="spring-boot-starter-oauth2-authorization-server"></a>`spring-boot-starter-oauth2-authorization-server` | Starter for using Spring Authorization Server features (deprecated in favor of [`spring-boot-starter-security-oauth2-authorization-server`](#spring-boot-starter-security-oauth2-authorization-server)) |
| <a id="spring-boot-starter-oauth2-client"></a>`spring-boot-starter-oauth2-client` | Starter for using Spring Security’s OAuth2/OpenID Connect client features (deprecated in favor of [`spring-boot-starter-security-oauth2-client`](#spring-boot-starter-security-oauth2-client)) |
| <a id="spring-boot-starter-oauth2-resource-server"></a>`spring-boot-starter-oauth2-resource-server` | Starter for using Spring Security’s OAuth2 resource server features (deprecated in favor of [`spring-boot-starter-security-oauth2-resource-server`](#spring-boot-starter-security-oauth2-resource-server)) |
| <a id="spring-boot-starter-opentelemetry"></a>`spring-boot-starter-opentelemetry` | Starter for using OpenTelemetry |
| <a id="spring-boot-starter-opentelemetry-test"></a>`spring-boot-starter-opentelemetry-test` | Starter for testing OpenTelemetry |
| <a id="spring-boot-starter-pulsar"></a>`spring-boot-starter-pulsar` | Starter for using Spring for Apache Pulsar |
| <a id="spring-boot-starter-pulsar-test"></a>`spring-boot-starter-pulsar-test` | Starter for testing Spring for Apache Pulsar |
| <a id="spring-boot-starter-quartz"></a>`spring-boot-starter-quartz` | Starter for using the Quartz scheduler |
| <a id="spring-boot-starter-quartz-test"></a>`spring-boot-starter-quartz-test` | Starter for testing the Quartz scheduler |
| <a id="spring-boot-starter-r2dbc"></a>`spring-boot-starter-r2dbc` | Starter for using R2DBC |
| <a id="spring-boot-starter-r2dbc-test"></a>`spring-boot-starter-r2dbc-test` | Starter for testing R2DBC |
| <a id="spring-boot-starter-reactor-netty"></a>`spring-boot-starter-reactor-netty` | Starter for Reactor Netty |
| <a id="spring-boot-starter-restclient"></a>`spring-boot-starter-restclient` | Starter using Spring’s blocking HTTP clients (RestClient, RestTemplate and HTTP Service Clients) |
| <a id="spring-boot-starter-restclient-test"></a>`spring-boot-starter-restclient-test` | Starter for testing Spring’s blocking HTTP clients (RestClient, RestTemplate and HTTP Service Clients) |
| <a id="spring-boot-starter-rsocket"></a>`spring-boot-starter-rsocket` | Starter for using RSocket |
| <a id="spring-boot-starter-rsocket-test"></a>`spring-boot-starter-rsocket-test` | Starter for testing RSocket |
| <a id="spring-boot-starter-security"></a>`spring-boot-starter-security` | Starter for using Spring Security |
| <a id="spring-boot-starter-security-oauth2-authorization-server"></a>`spring-boot-starter-security-oauth2-authorization-server` | Starter for using Spring Authorization Server features |
| <a id="spring-boot-starter-security-oauth2-authorization-server-test"></a>`spring-boot-starter-security-oauth2-authorization-server-test` | Starter for testing Spring Authorization Server features |
| <a id="spring-boot-starter-security-oauth2-client"></a>`spring-boot-starter-security-oauth2-client` | Starter for using Spring Security’s OAuth2/OpenID Connect client features |
| <a id="spring-boot-starter-security-oauth2-client-test"></a>`spring-boot-starter-security-oauth2-client-test` | Starter for testing Spring Security’s OAuth2/OpenID Connect client features |
| <a id="spring-boot-starter-security-oauth2-resource-server"></a>`spring-boot-starter-security-oauth2-resource-server` | Starter for using Spring Security’s OAuth2 resource server features |
| <a id="spring-boot-starter-security-oauth2-resource-server-test"></a>`spring-boot-starter-security-oauth2-resource-server-test` | Starter for testing Spring Security’s OAuth2 resource server features |
| <a id="spring-boot-starter-security-saml2"></a>`spring-boot-starter-security-saml2` | Starter for using Spring Security with SAML2 |
| <a id="spring-boot-starter-security-saml2-test"></a>`spring-boot-starter-security-saml2-test` | Starter for testing Spring Security with SAML2 |
| <a id="spring-boot-starter-security-test"></a>`spring-boot-starter-security-test` | Starter for testing Spring Security |
| <a id="spring-boot-starter-sendgrid"></a>`spring-boot-starter-sendgrid` | Starter for using Spring Session with Sendgrid |
| <a id="spring-boot-starter-sendgrid-test"></a>`spring-boot-starter-sendgrid-test` | Starter for testing Spring Session with Sendgrid |
| <a id="spring-boot-starter-session-data-redis"></a>`spring-boot-starter-session-data-redis` | Starter for using Spring Session with Spring Data Redis |
| <a id="spring-boot-starter-session-data-redis-test"></a>`spring-boot-starter-session-data-redis-test` | Starter for testing Spring Session with Spring Data Redis |
| <a id="spring-boot-starter-session-jdbc"></a>`spring-boot-starter-session-jdbc` | Starter for using Spring Session with JDBC |
| <a id="spring-boot-starter-session-jdbc-test"></a>`spring-boot-starter-session-jdbc-test` | Starter for testing Spring Session with JDBC |
| <a id="spring-boot-starter-test"></a>`spring-boot-starter-test` | Starter for testing Spring Boot applications with libraries including JUnit Jupiter, Hamcrest and Mockito |
| <a id="spring-boot-starter-test-classic"></a>`spring-boot-starter-test-classic` | Classic starter for testing Spring Boot applications with libraries including JUnit Jupiter, Hamcrest and Mockito |
| <a id="spring-boot-starter-thymeleaf"></a>`spring-boot-starter-thymeleaf` | Starter for using Thymeleaf |
| <a id="spring-boot-starter-thymeleaf-test"></a>`spring-boot-starter-thymeleaf-test` | Starter for testing Thymeleaf |
| <a id="spring-boot-starter-tomcat"></a>`spring-boot-starter-tomcat` | Starter for using Tomcat as the embedded servlet container |
| <a id="spring-boot-starter-validation"></a>`spring-boot-starter-validation` | Starter for using Java Bean Validation with Hibernate Validator |
| <a id="spring-boot-starter-validation-test"></a>`spring-boot-starter-validation-test` | Starter for testing Java Bean Validation with Hibernate Validator |
| <a id="spring-boot-starter-web"></a>`spring-boot-starter-web` | Starter for building web, including RESTful, applications using Spring MVC. Uses Tomcat as the default embedded container (deprecated in favor of [`spring-boot-starter-webmvc`](#spring-boot-starter-webmvc)) |
| <a id="spring-boot-starter-web-server-test"></a>`spring-boot-starter-web-server-test` | Starter for testing Spring Web Server |
| <a id="spring-boot-starter-web-services"></a>`spring-boot-starter-web-services` | Starter for using Spring Web Services (deprecated in favor of [`spring-boot-starter-webservices`](#spring-boot-starter-webservices)) |
| <a id="spring-boot-starter-webclient"></a>`spring-boot-starter-webclient` | Starter using Spring’s reactive HTTP clients (WebClient and HTTP Service Clients) |
| <a id="spring-boot-starter-webclient-test"></a>`spring-boot-starter-webclient-test` | Starter for testing Spring’s reactive HTTP clients (WebClient and HTTP Service Clients) |
| <a id="spring-boot-starter-webflux"></a>`spring-boot-starter-webflux` | Starter for using WebFlux and Reactor Netty |
| <a id="spring-boot-starter-webflux-test"></a>`spring-boot-starter-webflux-test` | Starter for testing WebFlux and Reactor Netty |
| <a id="spring-boot-starter-webmvc"></a>`spring-boot-starter-webmvc` | Starter for using Spring MVC and Tomcat |
| <a id="spring-boot-starter-webmvc-test"></a>`spring-boot-starter-webmvc-test` | Starter for testing Spring MVC and Tomcat |
| <a id="spring-boot-starter-webservices"></a>`spring-boot-starter-webservices` | Starter for using Spring Web Services |
| <a id="spring-boot-starter-webservices-test"></a>`spring-boot-starter-webservices-test` | Starter for testing Spring Web Services |
| <a id="spring-boot-starter-websocket"></a>`spring-boot-starter-websocket` | Starter for using Spring MVC WebSocket support |
| <a id="spring-boot-starter-websocket-test"></a>`spring-boot-starter-websocket-test` | Starter for testing Spring MVC WebSocket support |
| <a id="spring-boot-starter-zipkin"></a>`spring-boot-starter-zipkin` | Starter for using Zipkin |
| <a id="spring-boot-starter-zipkin-test"></a>`spring-boot-starter-zipkin-test` | Starter for testing Zipkin |

In addition to the application starters, the following starters can be used to add [production ready](../../how-to/actuator.md) features:

| Name | Description |
| --- | --- |
| <a id="spring-boot-starter-actuator"></a>`spring-boot-starter-actuator` | Starter for using Spring Boot’s Actuator which provides production ready features to help you monitor and manage your application |

Finally, Spring Boot also includes the following starters that can be used if you want to exclude or swap specific technical facets:

| Name | Description |
| --- | --- |
| <a id="spring-boot-starter-jetty-runtime"></a>`spring-boot-starter-jetty-runtime` | Starter for the Jetty runtime |
| <a id="spring-boot-starter-log4j2"></a>`spring-boot-starter-log4j2` | Starter for using Log4j2 |
| <a id="spring-boot-starter-logback"></a>`spring-boot-starter-logback` | Starter for logging using Logback |
| <a id="spring-boot-starter-logging"></a>`spring-boot-starter-logging` | Starter for logging default logging |
| <a id="spring-boot-starter-restdocs"></a>`spring-boot-starter-restdocs` | Starter for using Spring REST Docs |
| <a id="spring-boot-starter-tomcat-runtime"></a>`spring-boot-starter-tomcat-runtime` | Starter for the Tomcat runtime |

To learn how to swap technical facets, please see the how-to documentation for [swapping web server](../../how-to/webserver.md#howto.webserver.use-another) and [logging system](../../how-to/logging.md#howto.logging.log4j).

> [!TIP]
> For a list of additional community contributed starters, see the [README file](https://github.com/spring-projects/spring-boot/tree/main/starter/README.adoc) in the `spring-boot-starters` module on GitHub.
