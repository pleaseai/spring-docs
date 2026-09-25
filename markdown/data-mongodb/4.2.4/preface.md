---
title: "Requirements"
source: "ROOT:preface.adoc"
---

<a id="requirements"></a>

# Requirements

The Spring Data MongoDB 4.x binaries require JDK level 17 and above and [Spring Framework](https://spring.io/docs) 6.1.5 and above.

In terms of database and driver, you need at least version 4.x of [MongoDB](https://www.mongodb.org/) and a compatible MongoDB Java Driver (4.x or 5.x).

<a id="compatibility.matrix"></a>

## Compatibility Matrix

The following compatibility matrix summarizes Spring Data versions to MongoDB driver/database versions.
Database versions show the highest supported server version that pass the Spring Data test suite.
You can use newer server versions unless your application uses functionality that is affected by [changes in the MongoDB server](#compatibility.changes).
See also the [official MongoDB driver compatibility matrix](https://www.mongodb.com/docs/drivers/java/sync/current/compatibility/) for driver- and server version compatibility.

| Spring Data Release Train | Spring Data MongoDB | Driver Version | Server Version |
| --- | --- | --- | --- |
| 2023.1 | 4.1.x | 4.9.x | 7.0.x |
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

### Relevant Changes in MongoDB 4.4

- Fields list must not contain text search score property when no `$text` criteria present. See also [`$text` operator](https://docs.mongodb.com/manual/reference/operator/query/text/)
- Sort must not be an empty document when running map reduce.

<a id="compatibility.changes-4.2"></a>

### Relevant Changes in MongoDB 4.2

- Removal of `geoNear` command. See also [Removal of `geoNear`](https://docs.mongodb.com/manual/release-notes/4.2-compatibility/#remove-support-for-the-geonear-command)
- Removal of `eval` command. See also [Removal of `eval`](https://docs.mongodb.com/manual/release-notes/4.2-compatibility/#remove-support-for-the-eval-command)
