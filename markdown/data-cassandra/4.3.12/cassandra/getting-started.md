---
title: "Getting Started"
source: "ROOT:cassandra/getting-started.adoc"
---

<a id="cassandra.getting-started"></a>

# Getting Started

Spring Data for Apache Cassandra requires Apache Cassandra 2.1 or later and Datastax Java Driver 4.0 or later.
An easy way to quickly set up and bootstrap a working environment is to create a Spring-based project in [Spring Tools](https://spring.io/tools) or use [start.spring.io](https://start.spring.io/#!type=maven-project&dependencies=data-cassandra).

<a id="cassandra.examples-repo"></a>

## Examples Repository

To get a feel for how the library works, you can download and play around with
[several examples](https://github.com/spring-projects/spring-data-examples).

<a id="cassandra.hello-world"></a>

## Hello World

First, you need to set up a running Apache Cassandra server.
See the
[Apache Cassandra Quick Start Guide](https://cassandra.apache.org/doc/latest/getting_started/index.html)
for an explanation on how to start Apache Cassandra.
Once installed, starting Cassandra is typically a matter of executing the following command: `CASSANDRA_HOME/bin/cassandra -f`.

To create a Spring project in STS, go to File → New → Spring Template Project → Simple Spring Utility Project and press Yes when prompted.
Then enter a project and a package name, such as `org.spring.data.cassandra.example`.

Then you can add the following dependency declaration to your pom.xml file’s `dependencies` section.

```xml
<dependencies>

  <dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-cassandra</artifactId>
    <version>4.3.12</version>
  </dependency>

</dependencies>
```

Also, you should change the version of Spring in the pom.xml file to be as follows:

```xml
<spring.version>6.1.20</spring.version>
```

If using a milestone release instead of a GA release, you also need to add the location of the Spring Milestone repository for Maven to your pom.xml file so that it is at the same level of your `<dependencies/>` element, as follows:

```xml
<repositories>
  <repository>
    <id>spring-milestone</id>
    <name>Spring Maven MILESTONE Repository</name>
    <url>https://repo.spring.io/milestone</url>
  </repository>
</repositories>
```

The repository is also [browseable here](https://repo.spring.io/milestone/org/springframework/data/).

You can also browse all Spring repositories [here](https://repo.spring.io/webapp/#/home).

Now you can create a simple Java application that stores and reads a domain object to and from Cassandra.

To do so, first create a simple domain object class to persist, as the following example shows:

```java

import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

@Table
public class Person {

	@PrimaryKey private final String id;

	private final String name;
	private final int age;

	public Person(String id, String name, int age) {
		this.id = id;
		this.name = name;
		this.age = age;
	}

	public String getId() {
		return id;
	}

	private String getName() {
		return name;
	}

	private int getAge() {
		return age;
	}

	@Override
	public String toString() {
		return String.format("{ @type = %1$s, id = %2$s, name = %3$s, age = %4$d }", getClass().getName(), getId(),
				getName(), getAge());
	}
}
```

Next, create the main application to run, as the following example shows:

#### Imperative

```java

import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.data.cassandra.core.CassandraOperations;
import org.springframework.data.cassandra.core.CassandraTemplate;
import org.springframework.data.cassandra.core.query.Criteria;
import org.springframework.data.cassandra.core.query.Query;

import com.datastax.oss.driver.api.core.CqlSession;

public class CassandraApplication {

	private static final Log LOG = LogFactory.getLog(CassandraApplication.class);

	private static Person newPerson(String name, int age) {
		return new Person(UUID.randomUUID().toString(), name, age);
	}

	public static void main(String[] args) {

		CqlSession cqlSession = CqlSession.builder().withKeyspace("mykeyspace").build();

		CassandraOperations template = new CassandraTemplate(cqlSession);

		Person jonDoe = template.insert(newPerson("Jon Doe", 40));

		LOG.info(template.selectOne(Query.query(Criteria.where("id").is(jonDoe.getId())), Person.class).getId());

		template.truncate(Person.class);
		cqlSession.close();
	}

}
```

#### Reactive

```java

import reactor.core.publisher.Mono;

import java.util.UUID;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.data.cassandra.core.ReactiveCassandraOperations;
import org.springframework.data.cassandra.core.ReactiveCassandraTemplate;
import org.springframework.data.cassandra.core.cql.session.DefaultBridgedReactiveSession;
import org.springframework.data.cassandra.core.query.Criteria;
import org.springframework.data.cassandra.core.query.Query;

import com.datastax.oss.driver.api.core.CqlSession;

public class ReactiveCassandraApplication {

	private static final Log LOG = LogFactory.getLog(ReactiveCassandraApplication.class);

	private static Person newPerson(String name, int age) {
		return new Person(UUID.randomUUID().toString(), name, age);
	}

	public static void main(String[] args) {

		CqlSession cqlSession = CqlSession.builder().withKeyspace("mykeyspace").build();

		 ReactiveCassandraOperations template = new ReactiveCassandraTemplate(new DefaultBridgedReactiveSession(cqlSession));

    Mono<Person> jonDoe = template.insert(newPerson("Jon Doe", 40));

    jonDoe.flatMap(it -> template.selectOne(Query.query(Criteria.where("id").is(it.getId())), Person.class))
				.doOnNext(it -> LOG.info(it.toString()))
        .then(template.truncate(Person.class))
        .block();

		cqlSession.close();
	}

}
```

Even in this simple example, there are a few notable things to point out:

- You can create an instance of [`CassandraTemplate`](https://docs.spring.io/spring-data/cassandra/docs/4.3.12/api/org/springframework/data/cassandra/core/CassandraTemplate.html) (or [`ReactiveCassandraTemplate`](https://docs.spring.io/spring-data/cassandra/docs/4.3.12/api/org/springframework/data/cassandra/core/ReactiveCassandraTemplate.html) for reactive usage) with a Cassandra `CqlSession`.
- You must annotate your POJO as a Cassandra `@Table` entity and also annotate the `@PrimaryKey`.
Optionally, you can override these mapping names to match your Cassandra database table and column names.
- You can either use raw CQL or the Driver `QueryBuilder` API to construct your queries.
