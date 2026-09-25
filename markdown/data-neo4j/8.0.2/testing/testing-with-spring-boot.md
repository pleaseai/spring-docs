---
title: "With Spring Boot and `@DataNeo4jTest`"
source: "ROOT:testing/testing-with-spring-boot.adoc"
---

<a id="dataneo4jtest"></a>

# With Spring Boot and `@DataNeo4jTest`

Spring Boot offers `@DataNeo4jTest` through `org.springframework.boot:spring-boot-starter-test`.
The latter brings in `org.springframework.boot:spring-boot-test-autoconfigure` which contains the annotation and the
required infrastructure code.

#### Include Spring Boot Starter Test in a Maven build

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

#### Include Spring Boot Starter Test in a Gradle build

```groovy
dependencies {
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

`@DataNeo4jTest` is a Spring Boot [test slice](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-testing).
The test slice provides all the necessary infrastructure for tests using Neo4j: a transaction manager, a client, a template and declared repositories, in their imperative or reactive variants,
depending on reactive dependencies present or not.
The test slice already includes `@ExtendWith(SpringExtension.class)` so that it runs automatically with JUnit 5 (JUnit Jupiter).

`@DataNeo4jTest` provides both imperative and reactive infrastructure by default and also adds an implicit `@Transactional` as well.
`@Transactional` in Spring tests however always means imperative transactional, as declarative transactions needs the
return type of a method to decide whether the imperative `PlatformTransactionManager` or the reactive `ReactiveTransactionManager` is needed.

To assert the correct transactional behaviour for reactive repositories or services, you will need to inject a `TransactionalOperator`
into the test or wrap your domain logic in services that use annotated  methods exposing a return type that makes it possible
for the infrastructure to select the correct transaction manager.

The test slice does not bring in an embedded database or any other connection setting.
It is up to you to use an appropriate connection.

We recommend one of two options: either use the [Neo4j Testcontainers module](https://www.testcontainers.org/modules/databases/neo4j/)
or the Neo4j test harness.
While Testcontainers is a known project with modules for a lot of different services, Neo4j test harness is rather unknown.
It is an embedded instance that is especially useful when testing stored procedures as described in [Testing your Neo4j-based Java application](https://medium.com/neo4j/testing-your-neo4j-based-java-application-34bef487cc3c).
The test harness can however be used to test an application as well.
As it brings up a database inside the same JVM as your application, performance and timings may not resemble your production setup.

For your convenience we provide three possible scenarios, Neo4j test harness 3.5 and 4.x/5.x as well as Testcontainers Neo4j.
We provide different examples for 3.5 and 4.x/5.x as the test harness changed between those versions.
Also, 4.0 requires JDK 11.

<a id="dataneo4jtest-harness35"></a>

## `@DataNeo4jTest` with Neo4j test harness 3.5

You need the following dependencies to run [Using Neo4j 3.5 test harness](#dataneo4jtest-harness35-example):

#### Neo4j 3.5 test harness dependencies

```xml
<dependency>
    <groupId>org.neo4j.test</groupId>
    <artifactId>neo4j-harness</artifactId>
    <version>3.5.33</version>
    <scope>test</scope>
</dependency>
```

The dependencies for the enterprise version of Neo4j 3.5 are available under the `com.neo4j.test:neo4j-harness-enterprise` and
an appropriate repository configuration.

<a id="dataneo4jtest-harness35-example"></a>

#### Using Neo4j 3.5 test harness

```java
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.neo4j.harness.ServerControls;
import org.neo4j.harness.TestServerBuilders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.neo4j.DataNeo4jTest;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@DataNeo4jTest
class MovieRepositoryTest {

	private static ServerControls embeddedDatabaseServer;

	@BeforeAll
	static void initializeNeo4j() {

		embeddedDatabaseServer = TestServerBuilders.newInProcessBuilder() // <.>
			.newServer();
	}

	@AfterAll
	static void stopNeo4j() {

		embeddedDatabaseServer.close(); // <.>
	}

	@DynamicPropertySource  // <.>
	static void neo4jProperties(DynamicPropertyRegistry registry) {

		registry.add("spring.neo4j.uri", embeddedDatabaseServer::boltURI);
		registry.add("spring.neo4j.authentication.username", () -> "neo4j");
		registry.add("spring.neo4j.authentication.password", () -> null);
	}

	@Test
	public void findSomethingShouldWork(@Autowired Neo4jClient client) {

		Optional<Long> result = client.query("MATCH (n) RETURN COUNT(n)")
			.fetchAs(Long.class)
			.one();
		assertThat(result).hasValue(0L);
	}
}
```

1. Entrypoint to create an embedded Neo4j
1. This is a Spring Boot annotation that allows for dynamically registered
application properties. We overwrite the corresponding Neo4j settings.
1. Shutdown Neo4j after all tests.

<a id="dataneo4jtest-harness40"></a>

## `@DataNeo4jTest` with Neo4j test harness 4.x/5.x

You need the following dependencies to run [Using Neo4j 4.x/5.x test harness](#dataneo4jtest-harness40-example):

#### Neo4j 4.x test harness dependencies

```xml
<dependency>
    <groupId>org.neo4j.test</groupId>
    <artifactId>neo4j-harness</artifactId>
    <version>4.4.25</version>
    <scope>test</scope>
    <exclusions>
        <exclusion>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-nop</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

The dependencies for the enterprise version of Neo4j 4.x/5.x are available under the `com.neo4j.test:neo4j-harness-enterprise` and
an appropriate repository configuration.

<a id="dataneo4jtest-harness40-example"></a>

#### Using Neo4j 4.x/5.x test harness

```java
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.neo4j.harness.Neo4j;
import org.neo4j.harness.Neo4jBuilders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.neo4j.DataNeo4jTest;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@DataNeo4jTest
class MovieRepositoryTest {

	private static Neo4j embeddedDatabaseServer;

	@BeforeAll
	static void initializeNeo4j() {

		embeddedDatabaseServer = Neo4jBuilders.newInProcessBuilder() // <.>
			.withDisabledServer() // <.>
			.build();
	}

	@DynamicPropertySource // <.>
	static void neo4jProperties(DynamicPropertyRegistry registry) {

		registry.add("spring.neo4j.uri", embeddedDatabaseServer::boltURI);
		registry.add("spring.neo4j.authentication.username", () -> "neo4j");
		registry.add("spring.neo4j.authentication.password", () -> null);
	}

	@AfterAll
	static void stopNeo4j() {

		embeddedDatabaseServer.close(); // <.>
	}

	@Test
	public void findSomethingShouldWork(@Autowired Neo4jClient client) {

		Optional<Long> result = client.query("MATCH (n) RETURN COUNT(n)")
			.fetchAs(Long.class)
			.one();
		assertThat(result).hasValue(0L);
	}
}
```

1. Entrypoint to create an embedded Neo4j
1. Disable the unneeded Neo4j HTTP server
1. This is a Spring Boot annotation that allows for dynamically registered
application properties. We overwrite the corresponding Neo4j settings.
1. Shut down Neo4j after all tests.

<a id="dataneo4jtest-testcontainers"></a>

## `@DataNeo4jTest` with Testcontainers Neo4j

The principal of configuring the connection is of course still the same with Testcontainers as shown in [Using Test containers](#dataneo4jtest-testcontainers-example).
You need the following dependencies:

```xml
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>testcontainers-neo4j</artifactId>
    <version>${testcontainers.version}</version>
    <scope>test</scope>
</dependency>
```

And a complete test:

<a id="dataneo4jtest-testcontainers-example"></a>

#### Using Test containers

```java
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.neo4j.DataNeo4jTest;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.neo4j.Neo4jContainer;

@DataNeo4jTest
class MovieRepositoryTCTest {

	private static Neo4jContainer neo4jContainer;

	@BeforeAll
	static void initializeNeo4j() {

		neo4jContainer = new Neo4jContainer()
			.withAdminPassword("somePassword");
		neo4jContainer.start();
	}

	@AfterAll
	static void stopNeo4j() {

		neo4jContainer.close();
	}

	@DynamicPropertySource
	static void neo4jProperties(DynamicPropertyRegistry registry) {

		registry.add("spring.neo4j.uri", neo4jContainer::getBoltUrl);
		registry.add("spring.neo4j.authentication.username", () -> "neo4j");
		registry.add("spring.neo4j.authentication.password", neo4jContainer::getAdminPassword);
	}

	@Test
	public void findSomethingShouldWork(@Autowired Neo4jClient client) {

		Optional<Long> result = client.query("MATCH (n) RETURN COUNT(n)")
			.fetchAs(Long.class)
			.one();
		assertThat(result).hasValue(0L);
	}
}
```

<a id="dataneo4jtest-dynamicpropertysource-alternatives"></a>

## Alternatives to a `@DynamicPropertySource`

There are some scenarios in which the above annotation does not fit your use case.
One of those might be that you want to have 100% control over how the driver is initialized.
With a test container running, you could do this with a nested, static configuration class like this:

```java
@TestConfiguration(proxyBeanMethods = false)
static class TestNeo4jConfig {

    @Bean
    Driver driver() {
        return GraphDatabase.driver(
        		neo4jContainer.getBoltUrl(),
        		AuthTokens.basic("neo4j", neo4jContainer.getAdminPassword())
        );
    }
}
```

If you want to use the properties but cannot use a `@DynamicPropertySource`, you would use an initializer:

#### Alternative injection of dynamic properties

```java
@ContextConfiguration(initializers = PriorToBoot226Test.Initializer.class)
@DataNeo4jTest
class PriorToBoot226Test {

    private static Neo4jContainer neo4jContainer;

    @BeforeAll
    static void initializeNeo4j() {

        neo4jContainer = new Neo4jContainer()
            .withAdminPassword("somePassword");
        neo4jContainer.start();
    }

    @AfterAll
    static void stopNeo4j() {

        neo4jContainer.close();
    }

    static class Initializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        public void initialize(ConfigurableApplicationContext configurableApplicationContext) {
            TestPropertyValues.of(
                "spring.neo4j.uri=" + neo4jContainer.getBoltUrl(),
                "spring.neo4j.authentication.username=neo4j",
                "spring.neo4j.authentication.password=" + neo4jContainer.getAdminPassword()
            ).applyTo(configurableApplicationContext.getEnvironment());
        }
    }
}
```
