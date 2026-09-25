---
title: "Preface"
source: "ROOT:preface.adoc"
---

<a id="preface"></a>

# Preface

The Spring Data MongoDB project applies core Spring concepts to the development of solutions that use the MongoDB document style data store. We provide a “template” as a high-level abstraction for storing and querying documents. You may notice similarities to the JDBC support provided by the Spring Framework.

This document is the reference guide for Spring Data - MongoDB Support. It explains MongoDB module concepts and semantics and syntax for various store namespaces.

This section provides some basic introduction to Spring and Document databases. The rest of the document refers only to Spring Data MongoDB features and assumes the user is familiar with MongoDB and Spring concepts.

<a id="get-started:first-steps:spring"></a>

## Learning Spring

Spring Data uses Spring framework’s [core](https://docs.spring.io/spring-framework/reference/6.1/core.html) functionality, including:

- [IoC](https://docs.spring.io/spring-framework/reference/6.1/core.html#beans) container
- [type conversion system](https://docs.spring.io/spring-framework/reference/6.1/core.html#validation)
- [expression language](https://docs.spring.io/spring-framework/reference/6.1/core.html#expressions)
- [JMX integration](https://docs.spring.io/spring-framework/reference/6.1/integration.html#jmx)
- [DAO exception hierarchy](https://docs.spring.io/spring-framework/reference/6.1/data-access.html#dao-exceptions).

While you need not know the Spring APIs, understanding the concepts behind them is important. At a minimum, the idea behind Inversion of Control (IoC) should be familiar, and you should be familiar with whatever IoC container you choose to use.

The core functionality of the MongoDB support can be used directly, with no need to invoke the IoC services of the Spring Container. This is much like `JdbcTemplate`, which can be used "'standalone'" without any other services of the Spring container. To leverage all the features of Spring Data MongoDB, such as the repository support, you need to configure some parts of the library to use Spring.

To learn more about Spring, you can refer to the comprehensive documentation that explains the Spring Framework in detail. There are a lot of articles, blog entries, and books on the subject. See the Spring framework [home page](https://spring.io/docs) for more information.

<a id="get-started:first-steps:nosql"></a>

## Learning NoSQL and Document databases

NoSQL stores have taken the storage world by storm. It is a vast domain with a plethora of solutions, terms, and patterns (to make things worse, even the term itself has multiple [meanings](https://www.google.com/search?q=nosoql+acronym)). While some of the principles are common, you must be familiar with MongoDB to some degree. The best way to get acquainted is to read the documentation and follow the examples. It usually does not take more then 5-10 minutes to go through them and, especially if you are coming from an RDMBS-only background, these exercises can be an eye opener.

The starting point for learning about MongoDB is [www.mongodb.org](https://www.mongodb.org/). Here is a list of other useful resources:

- The [manual](https://docs.mongodb.org/manual/) introduces MongoDB and contains links to getting started guides, reference documentation, and tutorials.
- Visit [MongoDB University](https://learn.mongodb.com/) for free training material and online courses.
- MongoDB [Java Language Center](https://docs.mongodb.org/ecosystem/drivers/java/).
- Several [books](https://www.mongodb.org/books) you can purchase.
- Karl Seguin’s online book: [The Little MongoDB Book](https://openmymind.net/mongodb.pdf).

<a id="requirements"></a>

## Requirements

The Spring Data MongoDB 4.x binaries require JDK level 17 and above and [Spring Framework](https://spring.io/docs) 6.1.2 and above.

In terms of document stores, you need at least version 3.6 of [MongoDB](https://www.mongodb.org/), though we recommend a more recent version.

<a id="compatibility.matrix"></a>

### Compatibility Matrix

The following compatibility matrix summarizes Spring Data versions to MongoDB driver/database versions.
Database versions show the highest supported server version that pass the Spring Data test suite.
You can use newer server versions unless your application uses functionality that is affected by [changes in the MongoDB server](#compatibility.changes).
See also the [official MongoDB driver compatibility matrix](https://www.mongodb.com/docs/drivers/java/sync/current/compatibility/) for driver- and server version compatibility.

| Spring Data Release Train | Spring Data MongoDB | Driver Version | Server Version |
| --- | --- | --- | --- |
| 2023.0 | 4.1.x | 4.9.x | 6.0.x |
| 2022.0 | 4.0.x | 4.7.x | 6.0.x |
| 2021.2 | 3.4.x | 4.6.x | 5.0.x |
| 2021.1 | 3.3.x | 4.4.x | 5.0.x |
| 2021.0 | 3.2.x | 4.1.x | 4.4.x |
| 2020.0 | 3.1.x | 4.1.x | 4.4.x |
| Neumann | 3.0.x | 4.0.x | 4.4.x |
| Moore | 2.2.x | 3.11.x/Reactive Streams 1.12.x | 4.2.x |
| Lovelace | 2.1.x | 3.8.x/Reactive Streams 1.9.x | 4.0.x |

<a id="compatibility.changes-4.4"></a>

#### Relevant Changes in MongoDB 4.4

- Fields list must not contain text search score property when no `$text` criteria present. See also [`$text` operator](https://docs.mongodb.com/manual/reference/operator/query/text/)
- Sort must not be an empty document when running map reduce.

<a id="compatibility.changes-4.2"></a>

#### Relevant Changes in MongoDB 4.2

- Removal of `geoNear` command. See also [Removal of `geoNear`](https://docs.mongodb.com/manual/release-notes/4.2-compatibility/#remove-support-for-the-geonear-command)
- Removal of `eval` command. See also [Removal of `eval`](https://docs.mongodb.com/manual/release-notes/4.2-compatibility/#remove-support-for-the-eval-command)

<a id="get-started:help"></a>

## Additional Help Resources

Learning a new framework is not always straightforward.
In this section, we try to provide what we think is an easy-to-follow guide for starting with the Spring Data MongoDB module.
However, if you encounter issues or you need advice, feel free to use one of the following links:

<a id="get-started:help:community"></a>

**Community Forum **

Spring Data on [Stack Overflow](https://stackoverflow.com/questions/tagged/spring-data) is a tag for all Spring Data (not just Document) users to share information and help each other.
Note that registration is needed only for posting.

<a id="get-started:help:professional"></a>

**Professional Support **

Professional, from-the-source support, with guaranteed response time, is available from [Pivotal Software, Inc.](https://pivotal.io/), the company behind Spring Data and Spring.

<a id="get-started:up-to-date"></a>

## Following Development

For information on the Spring Data Mongo source code repository, nightly builds, and snapshot artifacts, see the Spring Data Mongo [homepage](https://spring.io/projects/spring-data-mongodb/). You can help make Spring Data best serve the needs of the Spring community by interacting with developers through the Community on [Stack Overflow](https://stackoverflow.com/questions/tagged/spring-data). To follow developer activity, look for the mailing list information on the Spring Data Mongo [homepage](https://spring.io/projects/spring-data-mongodb/). If you encounter a bug or want to suggest an improvement, please create a ticket on the Spring Data [issue tracker](https://github.com/spring-projects/spring-data-mongodb/issues). To stay up to date with the latest news and announcements in the Spring eco system, subscribe to the Spring Community [Portal](https://spring.io). You can also follow the Spring [blog](https://spring.io/blog) or the project team on Twitter ([SpringData](https://twitter.com/SpringData)).
