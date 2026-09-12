---
title: "Class Data Sharing"
source: "reference:packaging/class-data-sharing.adoc"
---

<a id="packaging.class-data-sharing"></a>

# Class Data Sharing

Class Data Sharing (CDS) is a [JVM feature](https://docs.oracle.com/en/java/javase/17/vm/class-data-sharing.html) that can help reduce the startup time and memory footprint of Java applications.

To use it, you should first perform a training run on your application in extracted form:

```shell
$ java -Djarmode=tools -jar my-app.jar extract --destination application
$ cd application
$ java -XX:ArchiveClassesAtExit=application.jsa -Dspring.context.exit=onRefresh -jar my-app.jar
```

This creates an `application.jsa` file that can be reused as long as the application is not updated.

To use the cache, you need to add an extra parameter when starting the application:

```shell
$ java -XX:SharedArchiveFile=application.jsa -jar my-app.jar
```

> [!NOTE]
> For more details about CDS, refer to the [CDS how-to guide](../../how-to/class-data-sharing.md) and the [Spring Framework reference documentation](https://docs.spring.io/spring-framework/reference/6.1/integration/cds.html).
