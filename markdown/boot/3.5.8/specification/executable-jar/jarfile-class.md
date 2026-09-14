---
title: "Spring Boot’s “NestedJarFile” Class"
source: "specification:executable-jar/jarfile-class.adoc"
---

<a id="appendix.executable-jar.jarfile-class"></a>

# Spring Boot’s “NestedJarFile” Class

The core class used to support loading nested jars is [`NestedJarFile`](https://docs.spring.io/spring-boot/3.5.8/api/java/org/springframework/boot/loader/jar/NestedJarFile.html).
It lets you load jar content from nested child jar data.
When first loaded, the location of each [`JarEntry`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/jar/JarEntry.html) is mapped to a physical file offset of the outer jar, as shown in the following example:

```
myapp.jar
+-------------------+-------------------------+
| /BOOT-INF/classes | /BOOT-INF/lib/mylib.jar |
|+-----------------+||+-----------+----------+|
||     A.class      |||  B.class  |  C.class ||
|+-----------------+||+-----------+----------+|
+-------------------+-------------------------+
 ^                    ^           ^
 0063                 3452        3980
```

The preceding example shows how `A.class` can be found in `/BOOT-INF/classes` in `myapp.jar` at position `0063`.
`B.class` from the nested jar can actually be found in `myapp.jar` at position `3452`, and `C.class` is at position `3980`.

Armed with this information, we can load specific nested entries by seeking to the appropriate part of the outer jar.
We do not need to unpack the archive, and we do not need to read all entry data into memory.

<a id="appendix.executable-jar.jarfile-class.compatibility"></a>

## Compatibility With the Standard Java “JarFile”

Spring Boot Loader strives to remain compatible with existing code and libraries.
[`NestedJarFile`](https://docs.spring.io/spring-boot/3.5.8/api/java/org/springframework/boot/loader/jar/NestedJarFile.html) extends from [`JarFile`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/jar/JarFile.html) and should work as a drop-in replacement.

Nested JAR URLs of the form `jar:nested:/path/myjar.jar/!BOOT-INF/lib/mylib.jar!/B.class` are supported and open a connection compatible with [`JarURLConnection`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/net/JarURLConnection.html).
These can be used with Java’s [`URLClassLoader`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/net/URLClassLoader.html).
