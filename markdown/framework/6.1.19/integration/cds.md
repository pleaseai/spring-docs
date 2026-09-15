---
title: "CDS"
source: "ROOT:integration/cds.adoc"
---

<a id="cds"></a>

# CDS

Class Data Sharing (CDS) is a [JVM feature](https://docs.oracle.com/en/java/javase/17/vm/class-data-sharing.html)
that can help reduce the startup time and memory footprint of Java applications.

To use this feature, a CDS archive should be created for the particular classpath of the
application. The Spring Framework provides a hook-point to ease the creation of the
archive. Once the archive is available, users should opt in to use it via a JVM flag.

<a id="_creating_the_cds_archive"></a>

## Creating the CDS Archive

A CDS archive for an application can be created when the application exits. The Spring
Framework provides a mode of operation where the process can exit automatically once the
`ApplicationContext` has refreshed. In this mode, all non-lazy initialized singletons
have been instantiated, and `InitializingBean#afterPropertiesSet` callbacks have been
invoked; but the lifecycle has not started, and the `ContextRefreshedEvent` has not yet
been published.

To create the archive, two additional JVM flags must be specified:

- `-XX:ArchiveClassesAtExit=application.jsa`: creates the CDS archive on exit
- `-Dspring.context.exit=onRefresh`: starts and then immediately exits your Spring
application as described above

To create a CDS archive, your JDK/JRE must have a base image. If you add the flags above to
your startup script, you may get a warning that looks like this:

```shell
-XX:ArchiveClassesAtExit is unsupported when base CDS archive is not loaded. Run with -Xlog:cds for more info.
```

The base CDS archive is usually provided out-of-the-box, but can also be created if needed by issuing the following
command:

```shell
$ java -Xshare:dump
```

<a id="_using_the_archive"></a>

## Using the Archive

Once the archive is available, add `-XX:SharedArchiveFile=application.jsa` to your startup
script to use it, assuming an `application.jsa` file in the working directory.

To check if the CDS cache is effective, you can use (for testing purposes only, not in production) `-Xshare:on` which
prints an error message and exits if CDS can’t be enabled.

To figure out how effective the cache is, you can enable class loading logs by adding
an extra attribute: `-Xlog:class+load:file=cds.log`. This creates a `cds.log` with every
attempt to load a class and its source. Classes that are loaded from the cache should have
a "shared objects file" source, as shown in the following example:

```shell
[0.064s][info][class,load] org.springframework.core.env.EnvironmentCapable source: shared objects file (top)
[0.064s][info][class,load] org.springframework.beans.factory.BeanFactory source: shared objects file (top)
[0.064s][info][class,load] org.springframework.beans.factory.ListableBeanFactory source: shared objects file (top)
[0.064s][info][class,load] org.springframework.beans.factory.HierarchicalBeanFactory source: shared objects file (top)
[0.065s][info][class,load] org.springframework.context.MessageSource source: shared objects file (top)
```

If CDS can’t be enabled or if you have a large number of classes that are not loaded from the cache, make sure that
the following conditions are fulfilled when creating and using the archive:

- The very same JVM must be used.
- The classpath must be specified as a list of JARs, and avoid the usage of directories and `*` wildcard characters.
- The timestamps of the JARs must be preserved.
- When using the archive, the classpath must be the same than the one used to create the archive, in the same order.
Additional JARs or directories can be specified **at the end** (but won’t be cached).
