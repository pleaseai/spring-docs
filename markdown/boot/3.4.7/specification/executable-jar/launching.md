---
title: "Launching Executable Jars"
source: "specification:executable-jar/launching.adoc"
---

<a id="appendix.executable-jar.launching"></a>

# Launching Executable Jars

The [`Launcher`](https://docs.spring.io/spring-boot/3.4.7/api/java/org/springframework/boot/loader/launch/Launcher.html) class is a special bootstrap class that is used as an executable jar’s main entry point.
It is the actual `Main-Class` in your jar file, and it is used to setup an appropriate [`ClassLoader`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/ClassLoader.html) and ultimately call your `main()` method.

There are three launcher subclasses ([`JarLauncher`](https://docs.spring.io/spring-boot/3.4.7/api/java/org/springframework/boot/loader/launch/JarLauncher.html), [`WarLauncher`](https://docs.spring.io/spring-boot/3.4.7/api/java/org/springframework/boot/loader/launch/WarLauncher.html), and [`PropertiesLauncher`](https://docs.spring.io/spring-boot/3.4.7/api/java/org/springframework/boot/loader/launch/PropertiesLauncher.html)).
Their purpose is to load resources (`.class` files and so on) from nested jar files or war files in directories (as opposed to those explicitly on the classpath).
In the case of [`JarLauncher`](https://docs.spring.io/spring-boot/3.4.7/api/java/org/springframework/boot/loader/launch/JarLauncher.html) and [`WarLauncher`](https://docs.spring.io/spring-boot/3.4.7/api/java/org/springframework/boot/loader/launch/WarLauncher.html), the nested paths are fixed.
[`JarLauncher`](https://docs.spring.io/spring-boot/3.4.7/api/java/org/springframework/boot/loader/launch/JarLauncher.html) looks in `BOOT-INF/lib/`, and [`WarLauncher`](https://docs.spring.io/spring-boot/3.4.7/api/java/org/springframework/boot/loader/launch/WarLauncher.html) looks in `WEB-INF/lib/` and `WEB-INF/lib-provided/`.
You can add extra jars in those locations if you want more.

The [`PropertiesLauncher`](https://docs.spring.io/spring-boot/3.4.7/api/java/org/springframework/boot/loader/launch/PropertiesLauncher.html) looks in `BOOT-INF/lib/` in your application archive by default.
You can add additional locations by setting an environment variable called `LOADER_PATH` or `loader.path` in `loader.properties` (which is a comma-separated list of directories, archives, or directories within archives).

<a id="appendix.executable-jar.launching.manifest"></a>

## Launcher Manifest

You need to specify an appropriate [`Launcher`](https://docs.spring.io/spring-boot/3.4.7/api/java/org/springframework/boot/loader/launch/Launcher.html) as the `Main-Class` attribute of `META-INF/MANIFEST.MF`.
The actual class that you want to launch (that is, the class that contains a `main` method) should be specified in the `Start-Class` attribute.

The following example shows a typical `MANIFEST.MF` for an executable jar file:

```manifest
Main-Class: org.springframework.boot.loader.launch.JarLauncher
Start-Class: com.mycompany.project.MyApplication
```

For a war file, it would be as follows:

```manifest
Main-Class: org.springframework.boot.loader.launch.WarLauncher
Start-Class: com.mycompany.project.MyApplication
```

> [!NOTE]
> You need not specify `Class-Path` entries in your manifest file.
> The classpath is deduced from the nested jars.
