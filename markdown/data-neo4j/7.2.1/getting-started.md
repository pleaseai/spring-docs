---
title: "Getting started"
source: "ROOT:getting-started.adoc"
---

<a id="getting-started"></a>

# Getting started

We provide a Spring Boot starter for SDN.
Please include the starter module via your dependency management and configure the bolt URL to use, for example `spring.neo4j.uri=bolt://localhost:7687`.
The starter assumes that the server has disabled authentication.
As the SDN starter depends on the starter for the Java Driver, all things regarding configuration said there, apply here as well.
For a reference of the available properties, use your IDEs autocompletion in the `spring.neo4j` namespace.

SDN supports

- The well known and understood imperative programming model (much like Spring Data JDBC or JPA)
- Reactive programming based on [Reactive Streams](https://www.reactive-streams.org), including full support for [reactive transactions](https://spring.io/blog/2019/05/16/reactive-transactions-with-spring).

Those are all included in the same binary.
The reactive programming model requires a 4+ Neo4j server on the database side and reactive Spring on the other hand.

<a id="prepare-the-database"></a>

## Prepare the database

For this example, we stay within the [movie graph](https://neo4j.com/developer/movie-database/), as it comes for free with every Neo4j instance.

If you don’t have a running database but Docker installed, please run:

<a id="start-docker-neo4j"></a>

#### Start a local Neo4j instance inside Docker.

```console
docker run --publish=7474:7474 --publish=7687:7687 -e 'NEO4J_AUTH=neo4j/secret' neo4j:5
```

You can now access [http://localhost:7474](http://localhost:7474/browser/?cmd=play&arg=movies).
The above command sets the password of the server to `secret`.
Note the command ready to run in the prompt (`:play movies`).
Execute it to fill your database with some test data.

<a id="create-spring-boot-project"></a>

## Create a new Spring Boot project

The easiest way to set up a Spring Boot project is [start.spring.io](https://start.spring.io#!type=maven-project&dependencies=webflux,data-neo4j)
(which is integrated in the major IDEs as well, in case you don’t want to use the website).

Select the "Spring Web Starter" to get all the dependencies needed for creating a Spring based web application.
The Spring Initializr will take care of creating a valid project structure for you, with all the files and settings in place for the selected build tool.

<a id="create-spring-boot-project-using-maven"></a>

### Using Maven

You can issue a *curl* request against the Spring Initializer to create a basic Maven project:

<a id="generate-maven-project"></a>

#### Create a basic Maven project with the Spring Initializr

```bash
curl https://start.spring.io/starter.tgz \
  -d dependencies=webflux,data-neo4j  \
  -d bootVersion=3.2.0 \
  -d baseDir=Neo4jSpringBootExample \
  -d name=Neo4j%20SpringBoot%20Example | tar -xzvf -
```

This will create a new folder `Neo4jSpringBootExample`.
As this starter is not yet on the initializer, you will have to add the following dependency manually to your `pom.xml`:

<a id="dependencies-maven"></a>

#### Inclusion of the spring-data-neo4j-spring-boot-starter in a Maven project

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-data-neo4j</artifactId>
</dependency>
```

You would also add the dependency manually in case of an existing project.

<a id="create-spring-boot-project-using-gradle"></a>

### Using Gradle

The idea is the same, just generate a Gradle project:

<a id="generate-gradle-project"></a>

#### Create a basic Gradle project with the Spring Initializr

```bash
curl https://start.spring.io/starter.tgz \
  -d dependencies=webflux,data-neo4j \
  -d type=gradle-project \
  -d bootVersion=3.2.0 \
  -d baseDir=Neo4jSpringBootExampleGradle \
  -d name=Neo4j%20SpringBoot%20Example | tar -xzvf -
```

The dependency for Gradle looks like this and must be added to `build.gradle`:

#### Inclusion of the spring-data-neo4j-spring-boot-starter in a Gradle project

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-neo4j'
}
```

You would also add the dependency manually in case of an existing project.

<a id="configure-spring-boot-project"></a>

## Configure the project

Now open any of those projects in your favorite IDE.
Find `application.properties` and configure your Neo4j credentials:

```properties
spring.neo4j.uri=bolt://localhost:7687
spring.neo4j.authentication.username=neo4j
spring.neo4j.authentication.password=verysecret
```

This is the bare minimum of what you need to connect to a Neo4j instance.

> [!NOTE]
> It is not necessary to add any programmatic configuration of the driver when you use this starter.
> SDN repositories will be automatically enabled by this starter.

<a id="configure-cypher-dsl-dialect"></a>

### Configure Neo4j Cypher-DSL

Depending on the Neo4j version you are running your application with,
it is advised to configure the dialect Neo4j Cypher-DSL runs with.
The default dialect that is used is targeting Neo4j 4.4. as the LTS version of Neo4j.
This can be changed by defining a Cypher-DSL `Configuration` bean.

#### Make Cypher-DSL use the Neo4j 5 dialect

```java
@Bean
Configuration cypherDslConfiguration() {
	return Configuration.newConfig()
                .withDialect(Dialect.NEO4J_5).build();
}
```

> [!NOTE]
> Although Spring Data Neo4j tries it best to be compatible with also the combination of Neo4j 5 and a default dialect,
> it is always recommend to explicitly define the dialect.
> E.g. it will lead to more optimized queries and make use of `elementId()` for newer Neo4j versions.

<a id="running-on-the-module-path"></a>

## Running on the Module-Path

Spring Data Neo4j can run on the module path. It’s automatic module name is `spring.data.neo4j`.
It does not provide a module itself due to restrictions in the current Spring Data build setup.
Hence, it uses an automatic but stable module name. However, it does depend on
a modularized library (the [Cypher-DSL](https://github.com/neo4j-contrib/cypher-dsl)). Without a `module-info.java` due to
the restriction mentioned above, we cannot express the requirement for that library on your behalf.

Therefore, the minimal required `module-info.java` in your project for running Spring Data Neo4j 6.1+ on the module path
is the following:

#### A `module-info.java` in a project supposed to use Spring Data Neo4j on the module path

```java
module your.module {

	requires org.neo4j.cypherdsl.core;

	requires spring.data.commons;
	requires spring.data.neo4j;

	opens your.domain to spring.core; // <.>

	exports your.domain; // <.>
}
```

1. Spring Data Neo4j uses Spring Data Commons and its reflective capabilities, so
you would need to open up your domain packages to `spring.core` at least.
1. We assume here that `your.domain` contains also repositories: Those must be exported to be accessible by
`spring.beans`, `spring.context` and `spring.data.commons`. If you don’t want to export them to the world,
you can restrict them to those modules.

<a id="create-domain-spring-boot-project"></a>

## Create your domain

Our domain layer should accomplish two things:

- Map your graph to objects
- Provide access to those

<a id="example-node-spring-boot-project"></a>

### Example Node-Entity

SDN fully supports unmodifiable entities, for both Java and `data` classes in Kotlin.
Therefore, we will focus on immutable entities here, [MovieEntity.java](#movie-entity) shows a such an entity.

> [!NOTE]
> SDN supports all data types the Neo4j Java Driver supports, see [Map Neo4j types to native language types](https://neo4j.com/docs/driver-manual/current/cypher-workflow/#driver-type-mapping) inside the chapter "The Cypher type system".
> Future versions will support additional converters.

<a id="movie-entity"></a>

#### MovieEntity.java

```java

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Property;
import org.springframework.data.neo4j.core.schema.Relationship;
import org.springframework.data.neo4j.core.schema.Relationship.Direction;

@Node("Movie") // <.>
public class MovieEntity {

	@Id // <.>
	private final String title;

	@Property("tagline") // <.>
	private final String description;

	@Relationship(type = "ACTED_IN", direction = Direction.INCOMING) // <.>
	private List<Roles> actorsAndRoles;

	@Relationship(type = "DIRECTED", direction = Direction.INCOMING)
	private List<PersonEntity> directors = new ArrayList<>();

	public MovieEntity(String title, String description) { // <.>
		this.title = title;
		this.description = description;
	}

	// Getters omitted for brevity
}
```

1. `@Node` is used to mark this class as a managed entity.
It also is used to configure the Neo4j label.
The label defaults to the name of the class, if you’re just using plain `@Node`.
1. Each entity has to have an id.
The movie class shown here uses the attribute `title` as a unique business key.
If you don’t have such a unique key, you can use the combination of `@Id` and `@GeneratedValue`
to configure SDN to use Neo4j’s internal id.
We also provide generators for UUIDs.
1. This shows `@Property` as a way to use a different name for the field than for the graph property.
1. This defines a relationship to a class of type `PersonEntity` and the relationship type `ACTED_IN`
1. This is the constructor to be used by your application code.

As a general remark: immutable entities using internally generated ids are a bit contradictory, as SDN needs a way to set the field with the value generated by the database.

If you don’t find a good business key or don’t want to use a generator for IDs, here’s the same entity using the internally generated id together with a regular constructor and a so called *wither*-Method, that is used by SDN:

<a id="movie-entity-with-wither"></a>

#### MovieEntity.java

```java
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Property;

import org.springframework.data.annotation.PersistenceConstructor;

@Node("Movie")
public class MovieEntity {

	@Id @GeneratedValue
	private Long id;

	private final String title;

	@Property("tagline")
	private final String description;

	public MovieEntity(String title, String description) { // <.>
		this.id = null;
		this.title = title;
		this.description = description;
	}

	public MovieEntity withId(Long id) { // <.>
		if (this.id.equals(id)) {
			return this;
		} else {
			MovieEntity newObject = new MovieEntity(this.title, this.description);
			newObject.id = id;
			return newObject;
		}
	}
}
```

1. This is the constructor to be used by your application code.
It sets the id to null, as the field containing the internal id should never be manipulated.
1. This is a so-called *wither* for the `id`-attribute.
It creates a new entity and sets the field accordingly, without modifying the original entity, thus making it immutable.

You can of course use SDN with [Kotlin](https://kotlinlang.org/) and model your domain with Kotlin’s data classes.
[Project Lombok](https://projectlombok.org/) is an alternative if you want or need to stay purely within Java.

<a id="spring-data-repositories-spring-boot-project"></a>

### Declaring Spring Data repositories

You basically have two options here:
you can work in a store-agnostic fashion with SDN and make your domain specific extend one of

- `org.springframework.data.repository.Repository`
- `org.springframework.data.repository.CrudRepository`
- `org.springframework.data.repository.reactive.ReactiveCrudRepository`
- `org.springframework.data.repository.reactive.ReactiveSortingRepository`

Choose imperative and reactive accordingly.

> [!WARNING]
> While technically not prohibited, it is not recommended mixing imperative and reactive database access in the same application.
> We won’t support you with scenarios like this.

The other option is to settle on a store specific implementation and gain all the methods we support out of the box.
The advantage of this approach is also its biggest disadvantage: once out, all those methods will be part of your API.
Most of the time it’s harder to take something away, than to add stuff afterwards.
Furthermore, using store specifics leaks your store into your domain.
From a performance point of view, there is no penalty.

A reactive repository fitting to any of the movie entities above looks like this:

<a id="movie-repository"></a>

#### MovieRepository.java

```java

import reactor.core.publisher.Mono;

import org.springframework.data.neo4j.repository.ReactiveNeo4jRepository;

public interface MovieRepository extends ReactiveNeo4jRepository<MovieEntity, String> {

	Mono<MovieEntity> findOneByTitle(String title);
}
```

> [!TIP]
> Testing reactive code is done with a `reactor.test.StepVerifier`.
> Have a look at the corresponding [documentation of Project Reactor](https://projectreactor.io/docs/core/release/reference/#testing) or see our example code.
