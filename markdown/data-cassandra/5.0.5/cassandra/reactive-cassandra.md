---
title: "Reactive Infrastructure"
source: "ROOT:cassandra/reactive-cassandra.adoc"
---

<a id="cassandra.reactive"></a>

# Reactive Infrastructure

The reactive Cassandra support contains a wide range of features:

- Spring configuration support using Java-based `@Configuration` classes.
- `ReactiveCqlTemplate` helper class that increases productivity by properly handling common Cassandra data access operations.
- `ReactiveCassandraTemplate` helper class that increases productivity by using `ReactiveCassandraOperations` in a reactive manner.
It includes integrated object mapping between tables and POJOs.
- Exception translation into Spring’s portable [Data Access Exception Hierarchy](https://docs.spring.io/spring-framework/reference/7.0/data-access/dao.html#dao-exceptions).
- Feature rich object mapping integrated with Spring’s [Conversion Service](https://docs.spring.io/spring-framework/reference/7.0/core/validation/convert.html).
- Java-based Query, Criteria, and Update DSLs.
- Automatic implementation of `Repository` interfaces, including support for custom finder methods.

For most data-oriented tasks, you can use the `ReactiveCassandraTemplate` or the repository support, which use the rich object mapping functionality. `ReactiveCqlTemplate` is commonly used to increment counters or perform ad-hoc CRUD operations. `ReactiveCqlTemplate` also provides callback methods that make it easy to get low-level API objects, such as `com.datastax.oss.driver.api.core.CqlSession`, which let you communicate directly with Cassandra.
Spring Data for Apache Cassandra uses consistent naming conventions on objects in various APIs to those found in the DataStax Java Driver so that they are immediately familiar and so that you can map your existing knowledge onto the Spring APIs.

Reactive usage is broken up into two phases: Composition and Execution.

Calling repository methods lets you compose a reactive sequence by obtaining `Publisher` instances and applying operators.
No I/O happens until you subscribe.
Passing the reactive sequence to a reactive execution infrastructure, such as [Spring WebFlux](https://docs.spring.io/spring-framework/reference/7.0/web/webflux.html)
or [Vert.x](https://vertx.io/docs/vertx-reactive-streams/java/)), subscribes to the publisher and initiate the actual execution.
See [the Project reactor documentation](https://projectreactor.io/docs/core/release/reference/#reactive.subscribe) for more detail.

<a id="cassandra.reactive.repositories.libraries"></a>

## Reactive Composition Libraries

The reactive space offers various reactive composition libraries.
The most common libraries are
[RxJava](https://github.com/ReactiveX/RxJava) and [Project Reactor](https://projectreactor.io/).

Spring Data for Apache Cassandra is built on top of the [DataStax Cassandra Driver](https://github.com/datastax/java-driver).
The driver is not reactive but the asynchronous capabilities allow us to adopt and expose the `Publisher` APIs to provide maximum interoperability by relying on the [Reactive Streams](https://www.reactive-streams.org/) initiative.
Static APIs, such as `ReactiveCassandraOperations`, are provided by using Project Reactor’s `Flux` and `Mono` types.
Project Reactor offers various adapters to convert reactive wrapper types (`Flux` to `Observable` and back), but conversion can easily clutter your code.
