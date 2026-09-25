---
title: "Requirements"
source: "ROOT:preface.adoc"
---

<a id="requirements"></a>

# Requirements

The Spring Data MongoDB 4.x binaries require JDK level 17 and above and [Spring Framework](https://spring.io/docs) 6.2.17 and above.

In terms of database and driver, you need at least version 4.x of [MongoDB](https://www.mongodb.org/) and a compatible MongoDB Java Driver (5.5.x).

<a id="compatibility.matrix"></a>

## Compatibility Matrix

> [!TIP]
> Please visit [OSS Support](https://spring.io/projects/spring-data-mongodb#support) for detailed Spring Data support timelines.
>
> For the MongoDB Server Support Policy please refer to the [MongoDB Software Lifecycle Schedule](https://www.mongodb.com/legal/support-policy/lifecycles).

The following compatibility matrix summarizes Spring Data versions and their required minimum MongoDB client version.
Database versions show server generations that pass the Spring Data test suite, older server versions might have difficulties dealing with new/changed commands.
You may use newer server versions unless your application uses functionality that is affected by [changes in the MongoDB server](#compatibility.changes).
See also the [official MongoDB driver compatibility matrix](https://www.mongodb.com/docs/drivers/java/sync/current/compatibility/) for driver- and server version compatibility.

| Spring Data Release Train | Spring Data MongoDB | Minimum Driver Version | Tested Database Versions |
| --- | --- | --- | --- |
| 2025.0 | 4.5.x | 5.5.x | 6.x to 8.x |
| 2024.1 | 4.4.x | 5.2.x | 4.4.x to 8.x |
| 2024.0 | 4.3.x | 4.11.x & 5.x | 4.4.x to 7.x |
| 2023.1 | 4.2.x | 4.9.x | 4.4.x to 7.x |
| 2023.0 | 4.1.x | 4.9.x | 4.4.x to 6.x |

<a id="compatibility.changes-4.4"></a>

### Relevant Changes in MongoDB 4.4

- Fields list must not contain text search score property when no `$text` criteria present. See also [`$text` operator](https://docs.mongodb.com/manual/reference/operator/query/text/)
- Sort must not be an empty document when running map reduce.

<a id="compatibility.changes-4.2"></a>

### Relevant Changes in MongoDB 4.2

- Removal of `geoNear` command. See also [Removal of `geoNear`](https://docs.mongodb.com/manual/release-notes/4.2-compatibility/#remove-support-for-the-geonear-command)
- Removal of `eval` command. See also [Removal of `eval`](https://docs.mongodb.com/manual/release-notes/4.2-compatibility/#remove-support-for-the-eval-command)
