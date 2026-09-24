---
title: "Migration Guide from 4.x to 4.3"
source: "ROOT:migration-guide/migration-guide-4.0-to-4.3.adoc"
---

<a id="cassandra.migration.4.x-to-4.3"></a>

# Migration Guide from 4.x to 4.3

Spring Data for Apache Cassandra 4.3 has migrated the `com.datastax.oss` groupId to `org.apache.cassandra`.

<a id="driver-group-id"></a>

## Migration of the Datastax driver into Apache

With the migration of the Datastax driver into the Apache foundation, you need to update coordinates of the driver in your code. Consider the following example showing a potential previous state of a Maven project configuration:

```xml
<dependency>
	<groupId>com.datastax.oss</groupId>
	<artifactId>java-driver-core</artifactId>
</dependency>

<dependency>
	<groupId>com.datastax.oss</groupId>
	<artifactId>java-driver-query-builder</artifactId>
</dependency>
```

With upgrading the groupId from `com.datastax.oss` to `org.apache.cassandra` your project configuration would look like:

```xml
<dependency>
	<groupId>org.apache.cassandra</groupId>
	<artifactId>java-driver-core</artifactId>
</dependency>

<dependency>
	<groupId>org.apache.cassandra</groupId>
	<artifactId>java-driver-query-builder</artifactId>
</dependency>
```
