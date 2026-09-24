---
title: "CDI Integration"
source: "ROOT:cassandra/repositories/cdi-integration.adoc"
---

<a id="cassandra.repositories.misc.cdi-integration"></a>

# CDI Integration

Instances of the repository interfaces are usually created by a container, and the Spring container is the most natural choice when working with Spring Data.
Spring Data for Apache Cassandra ships with a custom CDI extension that allows using the repository abstraction in CDI environments.
The extension is part of the JAR.To activate it, drop the Spring Data for Apache Cassandra JAR into your classpath.
You can now set up the infrastructure by implementing a CDI Producer for the
`CassandraTemplate`, as the following examlpe shows:

```java
class CassandraTemplateProducer {

	@Produces
	@Singleton
	public CqlSession createSession() {
		return CqlSession.builder().withKeyspace("my-keyspace").build();
	}

	@Produces
	@ApplicationScoped
	public CassandraOperations createCassandraOperations(CqlSession session) {

		CassandraMappingContext mappingContext = new CassandraMappingContext();
		mappingContext.afterPropertiesSet();

		MappingCassandraConverter cassandraConverter = new MappingCassandraConverter(mappingContext);
		cassandraConverter.setUserTypeResolver(new SimpleUserTypeResolver(session));
		cassandraConverter.afterPropertiesSet();

		return new CassandraAdminTemplate(session, cassandraConverter);
	}

	public void close(@Disposes CqlSession session) {
		session.close();
	}
}
```

The Spring Data for Apache Cassandra CDI extension picks up `CassandraOperations` as a CDI bean and creates a proxy for a Spring Data repository whenever a bean of a repository type is requested by the container.
Thus, obtaining an instance of a Spring Data repository is a matter of declaring an injected property, as the following example shows:

```java
class RepositoryClient {

	@Inject PersonRepository repository;

	public void businessMethod() {
		List<Person> people = repository.findAll();
	}
}

```
