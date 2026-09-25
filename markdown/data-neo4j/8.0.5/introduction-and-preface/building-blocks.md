---
title: "Building blocks of Spring Data Neo4j"
source: "ROOT:introduction-and-preface/building-blocks.adoc"
---

<a id="building-blocks"></a>

# Building blocks of Spring Data Neo4j

<a id="_overview"></a>

## Overview

SDN consists of composable building blocks.
It builds on top of the [Neo4j Java Driver](https://github.com/neo4j/neo4j-java-driver).
The instance of the Java driver is provided through Spring Boot’s automatic configuration itself.
All configuration options of the driver are accessible in the namespace `spring.neo4j`.
The driver bean provides imperative, asynchronous and reactive methods to interact with Neo4j.

You can use all transaction methods the driver provides on that bean such as [auto-commit transactions](https://neo4j.com/docs/driver-manual/4.0/terminology/#term-auto-commit),
[transaction functions](https://neo4j.com/docs/driver-manual/4.0/terminology/#term-transaction-function) and unmanaged transactions.
Be aware that those transactions are not tight to an ongoing Spring transaction.

Integration with Spring Data and Spring’s platform or reactive transaction manager starts at the [Neo4j Client](../appendix/neo4j-client.md#neo4j-client).
The client is part of SDN is configured through a separate starter, `spring-boot-starter-data-neo4j`.
The configuration namespace of that starter is `spring.data.neo4j`.

The client is mapping agnostic.
It doesn’t know about your domain classes, and you are responsible for mapping a result to an object suiting your needs.

The next higher level of abstraction is the Neo4j Template.
It is aware of your domain, and you can use it to query arbitrary domain objects.
The template comes in handy in scenarios with a large number of domain classes or custom queries for which you don’t want to create an additional repository abstraction each.

The highest level of abstraction is a Spring Data repository.

All abstractions of SDN come in both imperative and reactive fashions.
It is not recommended mixing both programming styles in the same application.
The reactive infrastructure requires a Neo4j 4.0+ database.

<a id="sdn-building-blocks"></a>

#### SDN building blocks

![image$sdn buildingblocks](https://raw.githubusercontent.com/spring-projects/spring-data-neo4j/8.0.5/src/main/antora/modules/ROOT/assets/images/image$sdn-buildingblocks.png)

The template mechanism is similar to the templates of others stores.
Find some more information about it in [our FAQ](../faq.md#template-support).
The Neo4j Client as such is unique to SDN.
You will find its documentation in the [appendix](../appendix/neo4j-client.md#neo4j-client).

<a id="sdn-packages"></a>

## On the package level

| Package | Description |
| --- | --- |
| `org.springframework.data.neo4j.config` | \* can be used for application specific, annotated configuration classes. The abstract \* base classes are helpful if you don’t rely on Spring Boot’s autoconfiguration. The |
| `org.springframework.data.neo4j.core` | \* imperative or reactive client that can execute queries. Packages marked as `@API(status * = API.Status.STABLE)` are safe to be used. The core package provides access to both the |
| `org.springframework.data.neo4j.core.convert` |  |
| `org.springframework.data.neo4j.core.support` | \* helpful in your domain, for example a predicate indicating that some transaction may be |
| `org.springframework.data.neo4j.core.transaction` | \* transaction into Spring managed transactions. Exposes both the imperative and reactive \* `TransactionManager` as `Neo4jTransactionManager` and |
| `org.springframework.data.neo4j.repository` |  |
| `org.springframework.data.neo4j.repository.config` | \* especially dedicated annotations to enable imperative and reactive Spring Data Neo4j |
| `org.springframework.data.neo4j.repository.support` | \* building custom imperative and reactive Spring Data Neo4j repository base classes. The |
