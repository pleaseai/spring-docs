---
title: "Executable Jar Restrictions"
source: "specification:executable-jar/restrictions.adoc"
---

<a id="appendix.executable-jar.restrictions"></a>

# Executable Jar Restrictions

You need to consider the following restrictions when working with a Spring Boot Loader packaged application:

<a id="appendix.executable-jar-zip-entry-compression"></a>

- Zip entry compression:
The [`ZipEntry`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/zip/ZipEntry.html) for a nested jar must be saved by using the [`ZipEntry.STORED`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/zip/ZipEntry.html#STORED) method.
This is required so that we can seek directly to individual content within the nested jar.
The content of the nested jar file itself can still be compressed, as can any other entry in the outer jar.

<a id="appendix.executable-jar-system-classloader"></a>

- System classLoader:
Launched applications should use `Thread.getContextClassLoader()` when loading classes (most libraries and frameworks do so by default).
Trying to load nested jar classes with `ClassLoader.getSystemClassLoader()` fails.
`java.util.Logging` always uses the system classloader.
For this reason, you should consider a different logging implementation.
