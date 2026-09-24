---
title: "Connecting to Cassandra with Spring"
source: "ROOT:cassandra/configuration.adoc"
---

<a id="cassandra.connectors"></a>

# Connecting to Cassandra with Spring

One of the first tasks when using Apache Cassandra with Spring is to create a `com.datastax.oss.driver.api.core.CqlSession` object by using the Spring IoC container.
You can do so either by using Java-based bean metadata or by using XML-based bean metadata.
These are discussed in the following sections.

> [!NOTE]
> For those not familiar with how to configure the Spring container using Java-based bean metadata instead of XML-based metadata, see the high-level introduction in the reference docs
> [here](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/new-in-3.0.html#new-java-configuration)
> as well as the detailed documentation [here](https://docs.spring.io/spring-framework/reference/6.1core.html#beans-java-instantiating-container).

<a id="cassandra.cassandra-java-config"></a>

## Registering a Session Instance by using Java-based Metadata

The following example shows how to use Java-based bean metadata to register an instance of a `com.datastax.oss.driver.api.core.CqlSession`:

```java
@Configuration
public class AppConfig {

	/*
	 * Use the standard Cassandra driver API to create a com.datastax.oss.driver.api.core.CqlSession instance.
	 */
	public @Bean CqlSession session() {
		return CqlSession.builder().withKeyspace("mykeyspace").build();
	}
}
```

This approach lets you use the standard `com.datastax.oss.driver.api.core.CqlSession` API that you may already know.

An alternative is to register an instance of `com.datastax.oss.driver.api.core.CqlSession` with the container by using Spring’s `CqlSessionFactoryBean`.
As compared to instantiating a `com.datastax.oss.driver.api.core.CqlSession` instance directly, the `FactoryBean` approach has the added advantage of also providing the container with an `ExceptionTranslator` implementation that translates Cassandra exceptions to exceptions in Spring’s portable `DataAccessException` hierarchy.
This hierarchy and the use of
`@Repository` is described in [Spring’s DAO support features](https://docs.spring.io/spring-framework/reference/6.1data-access.html).

The following example shows Java-based factory class usage:

```java
@Configuration
public class FactoryBeanAppConfig {

	/*
	 * Factory bean that creates the com.datastax.oss.driver.api.core.CqlSession instance
	 */
	@Bean
	public CqlSessionFactoryBean session() {

		CqlSessionFactoryBean session = new CqlSessionFactoryBean();
		session.setContactPoints("localhost");
		session.setKeyspaceName("mykeyspace");

		return session;
	}
}
```

Using `CassandraTemplate` with object mapping and repository support requires a `CassandraTemplate`,
`CassandraMappingContext`, `CassandraConverter`, and enabling repository support.

The following example shows how to register components to configure object mapping and repository support:

```java
@Configuration
@EnableCassandraRepositories(basePackages = { "org.springframework.data.cassandra.example" })
public class CassandraConfig {

	@Bean
	public CqlSessionFactoryBean session() {

		CqlSessionFactoryBean session = new CqlSessionFactoryBean();
		session.setContactPoints("localhost");
		session.setKeyspaceName("mykeyspace");

		return session;
	}

	@Bean
	public SessionFactoryFactoryBean sessionFactory(CqlSession session, CassandraConverter converter) {

		SessionFactoryFactoryBean sessionFactory = new SessionFactoryFactoryBean();
		sessionFactory.setSession(session);
		sessionFactory.setConverter(converter);
		sessionFactory.setSchemaAction(SchemaAction.NONE);

		return sessionFactory;
	}

	@Bean
	public CassandraMappingContext mappingContext() {
		return new CassandraMappingContext();
	}

	@Bean
	public CassandraConverter converter(CqlSession cqlSession, CassandraMappingContext mappingContext) {

		MappingCassandraConverter cassandraConverter = new MappingCassandraConverter(mappingContext);
		cassandraConverter.setUserTypeResolver(new SimpleUserTypeResolver(cqlSession));

		return cassandraConverter;
	}

	@Bean
	public CassandraOperations cassandraTemplate(SessionFactory sessionFactory, CassandraConverter converter) {
		return new CassandraTemplate(sessionFactory, converter);
	}
}
```

Creating configuration classes that register Spring Data for Apache Cassandra components can be an exhausting challenge, so Spring Data for Apache Cassandra comes with a pre-built configuration support class.
Classes that extend from
`AbstractCassandraConfiguration` register beans for Spring Data for Apache Cassandra use.
`AbstractCassandraConfiguration` lets you provide various configuration options, such as initial entities, default query options, pooling options, socket options, and many more. `AbstractCassandraConfiguration` also supports you with schema generation based on initial entities, if any are provided.
Extending from
`AbstractCassandraConfiguration` requires you to at least provide the keyspace name by implementing the `getKeyspaceName` method.
The following example shows how to register beans by using `AbstractCassandraConfiguration`:

```java
@Configuration
public class CassandraConfiguration extends AbstractCassandraConfiguration {

	/*
	 * Provide a contact point to the configuration.
	 */
	@Override
	public String getContactPoints() {
		return "localhost";
	}

	/*
	 * Provide a keyspace name to the configuration.
	 */
	@Override
	public String getKeyspaceName() {
		return "mykeyspace";
	}
}
```

`Abstract…Configuration` classes wire all the necessary beans for using Cassandra from your application.
The configuration assumes a single `CqlSession` and wires it through `SessionFactory` into the related components such as `CqlTemplate`.
If you want to customize the creation of the `CqlSession`, then you can provide a `SessionBuilderConfigurer` function to customize `CqlSessionBuilder`.
This is useful to provide e.g. a Cloud Connection Bundle for Astra.

```java
@Configuration
public class CustomizedCassandraConfiguration extends AbstractCassandraConfiguration {

	/*
	 * Customize the CqlSession through CqlSessionBuilder.
	 */
	@Override
	protected SessionBuilderConfigurer getSessionBuilderConfigurer() {

		Path connectBundlePath = …;

		return builder -> builder
				.withCloudSecureConnectBundle(Path.of(connectBundlePath));
	}

	/*
	 * Provide a keyspace name to the configuration.
	 */
	@Override
	public String getKeyspaceName() {
		return "mykeyspace";
	}

}
```

<a id="cassandra-connectors.xmlconfig"></a>

## XML Configuration

This section describes how to configure Spring Data Cassandra with XML.

> [!WARNING]
> While we still support Namespace Configuration, we generally recommend using [Java-based Configuration](#cassandra.cassandra-java-config).

<a id="cassandra-connectors.xmlconfig.ext_properties"></a>

### Externalizing Connection Properties

To externalize connection properties, you should first create a properties file that contains the information needed to connect to Cassandra. `contactpoints` and `keyspace` are the required fields.

The following example shows our properties file, called `cassandra.properties`:

```
cassandra.contactpoints=10.1.55.80:9042,10.1.55.81:9042
cassandra.keyspace=showcase
```

In the next two examples, we use Spring to load these properties into the Spring context.

<a id="registering-a-session-instance-by-using-xml-based-metadata"></a>

### Registering a Session Instance by using XML-based Metadata

While you can use Spring’s traditional `<beans/>` XML namespace to register an instance of
`com.datastax.oss.driver.api.core.CqlSession` with the container, the XML can be quite verbose, because it is general purpose.
XML namespaces are a better alternative to configuring commonly used objects, such as the `CqlSession` instance.
The `cassandra` namespace let you create a `CqlSession` instance.

The following example shows how to configure the `cassandra` namespace:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:cassandra="http://www.springframework.org/schema/data/cassandra"
  xsi:schemaLocation="
    http://www.springframework.org/schema/data/cassandra
    https://www.springframework.org/schema/data/cassandra/spring-cassandra.xsd
    http://www.springframework.org/schema/beans
    https://www.springframework.org/schema/beans/spring-beans.xsd">

  <!-- Default bean name is 'cassandraSession' -->
  <cassandra:session contact-points="localhost" port="9042">
    <cassandra:keyspace action="CREATE_DROP" name="mykeyspace" />
  </cassandra:session>

  <cassandra:session-factory>
    <cassandra:script
            location="classpath:/org/springframework/data/cassandra/config/schema.cql"/>
  </cassandra:session-factory>
</beans>
```

The XML configuration elements for more advanced Cassandra configuration are shown below.
These elements all use default bean names to keep the configuration code clean and readable.

While the preceding example shows how easy it is to configure Spring to connect to Cassandra, there are many other options.
Basically, any option available with the DataStax Java Driver is also available in the Spring Data for Apache Cassandra configuration.
This includes but is not limited to authentication, load-balancing policies, retry policies, and pooling options.
All of the Spring Data for Apache Cassandra method names and XML elements are named exactly (or as close as possible) like the configuration options on the driver so that mapping any existing driver configuration should be straight forward.
The following example shows how to configure Spring Data components by using XML

```xml

<!-- Loads the properties into the Spring Context and uses them to fill
in placeholders in the bean definitions -->
<context:property-placeholder location="classpath:cassandra.properties" />

<!-- REQUIRED: The Cassandra Session -->
<cassandra:session contact-points="${cassandra.contactpoints}" keyspace-name="${cassandra.keyspace}" />

<!-- REQUIRED: The default Cassandra mapping context used by `CassandraConverter` -->
<cassandra:mapping>
  <cassandra:user-type-resolver keyspace-name="${cassandra.keyspace}" />
</cassandra:mapping>

<!-- REQUIRED: The default Cassandra converter used by `CassandraTemplate` -->
<cassandra:converter />

<!-- REQUIRED: The Cassandra template is the foundation of all Spring
Data Cassandra -->
<cassandra:template id="cassandraTemplate" />

<!-- OPTIONAL: If you use Spring Data for Apache Cassandra repositories, add
your base packages to scan here -->
<cassandra:repositories base-package="org.spring.cassandra.example.repo" />

```
