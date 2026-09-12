---
title: "NoSQL"
source: "how-to:nosql.adoc"
---

<a id="howto.nosql"></a>

# NoSQL

Spring Boot offers a number of starters that support NoSQL technologies.
This section answers questions that arise from using NoSQL with Spring Boot.

<a id="howto.nosql.jedis-instead-of-lettuce"></a>

## Use Jedis Instead of Lettuce

By default, the Spring Boot starter (`spring-boot-starter-data-redis`) uses [Lettuce](https://github.com/lettuce-io/lettuce-core/).
You need to exclude that dependency and include the [Jedis](https://github.com/xetorthio/jedis/) one instead.
Spring Boot manages both of these dependencies, allowing you to switch to Jedis without specifying a version.

The following example shows how to accomplish this in Maven:

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-data-redis</artifactId>
	<exclusions>
		<exclusion>
			<groupId>io.lettuce</groupId>
			<artifactId>lettuce-core</artifactId>
		</exclusion>
	</exclusions>
</dependency>
<dependency>
	<groupId>redis.clients</groupId>
	<artifactId>jedis</artifactId>
</dependency>
```

The following example shows how to accomplish this in Gradle:

```gradle
dependencies {
	implementation('org.springframework.boot:spring-boot-starter-data-redis') {
	    exclude group: 'io.lettuce', module: 'lettuce-core'
	}
	implementation 'redis.clients:jedis'
	// ...
}
```
