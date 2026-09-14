---
title: "Build Systems"
source: "reference:using/build-systems.adoc"
---

<a id="using.build-systems"></a>

# Build Systems

It is strongly recommended that you choose a build system that supports [dependency management](#using.build-systems.dependency-management) and that can consume artifacts published to the Maven Central repository.
We would recommend that you choose Maven or Gradle.
It is possible to get Spring Boot to work with other build systems (Ant, for example), but they are not particularly well supported.

<a id="using.build-systems.dependency-management"></a>

## Dependency Management

Each release of Spring Boot provides a curated list of dependencies that it supports.
In practice, you do not need to provide a version for any of these dependencies in your build configuration, as Spring Boot manages that for you.
When you upgrade Spring Boot itself, these dependencies are upgraded as well in a consistent way.

> [!NOTE]
> You can still specify a version and override Spring Boot’s recommendations if you need to do so.

The curated list contains all the Spring modules that you can use with Spring Boot as well as a refined list of third party libraries.
The list is available as a standard Bills of Materials (`spring-boot-dependencies`) that can be used with both [Maven](#using.build-systems.maven) and [Gradle](#using.build-systems.gradle).

> [!WARNING]
> Each release of Spring Boot is associated with a base version of the Spring Framework.
> We **highly** recommend that you do not specify its version.

<a id="using.build-systems.maven"></a>

## Maven

To learn about using Spring Boot with Maven, see the documentation for Spring Boot’s Maven plugin:

- [Reference](https://docs.spring.io/spring-boot/3.3.10/maven-plugin/index.html)
- [API](https://docs.spring.io/spring-boot/3.3.10/maven-plugin/api/java/index.html)

<a id="using.build-systems.gradle"></a>

## Gradle

To learn about using Spring Boot with Gradle, see the documentation for Spring Boot’s Gradle plugin:

- [Reference](https://docs.spring.io/spring-boot/3.3.10/gradle-plugin/index.html)
- [API](https://docs.spring.io/spring-boot/3.3.10/gradle-plugin/api/java/index.html)

<a id="using.build-systems.ant"></a>

## Ant

It is possible to build a Spring Boot project using Apache Ant+Ivy.
The `spring-boot-antlib` “AntLib” module is also available to help Ant create executable jars.

To declare dependencies, a typical `ivy.xml` file looks something like the following example:

```xml
<ivy-module version="2.0">
	<info organisation="org.springframework.boot" module="spring-boot-sample-ant" />
	<configurations>
		<conf name="compile" description="everything needed to compile this module" />
		<conf name="runtime" extends="compile" description="everything needed to run this module" />
	</configurations>
	<dependencies>
		<dependency org="org.springframework.boot" name="spring-boot-starter"
			rev="${spring-boot.version}" conf="compile" />
	</dependencies>
</ivy-module>
```

A typical `build.xml` looks like the following example:

```xml
<project
	xmlns:ivy="antlib:org.apache.ivy.ant"
	xmlns:spring-boot="antlib:org.springframework.boot.ant"
	name="myapp" default="build">

	<property name="spring-boot.version" value="{version-spring-boot}" />

	<target name="resolve" description="--> retrieve dependencies with ivy">
		<ivy:retrieve pattern="lib/[conf]/[artifact]-[type]-[revision].[ext]" />
	</target>

	<target name="classpaths" depends="resolve">
		<path id="compile.classpath">
			<fileset dir="lib/compile" includes="*.jar" />
		</path>
	</target>

	<target name="init" depends="classpaths">
		<mkdir dir="build/classes" />
	</target>

	<target name="compile" depends="init" description="compile">
		<javac srcdir="src/main/java" destdir="build/classes" classpathref="compile.classpath" />
	</target>

	<target name="build" depends="compile">
		<spring-boot:exejar destfile="build/myapp.jar" classes="build/classes">
			<spring-boot:lib>
				<fileset dir="lib/runtime" />
			</spring-boot:lib>
		</spring-boot:exejar>
	</target>
</project>
```

> [!TIP]
> If you do not want to use the `spring-boot-antlib` module, see the [how-to:build.adoc#howto.build.build-an-executable-archive-with-ant-without-using-spring-boot-antlib](../../how-to/build.md#howto.build.build-an-executable-archive-with-ant-without-using-spring-boot-antlib) section of “How-to Guides”.

<a id="using.build-systems.starters"></a>

## Starters

Starters are a set of convenient dependency descriptors that you can include in your application.
You get a one-stop shop for all the Spring and related technologies that you need without having to hunt through sample code and copy-paste loads of dependency descriptors.
For example, if you want to get started using Spring and JPA for database access, include the `spring-boot-starter-data-jpa` dependency in your project.

The starters contain a lot of the dependencies that you need to get a project up and running quickly and with a consistent, supported set of managed transitive dependencies.

#### What is in a name

> All **official** starters follow a similar naming pattern; `spring-boot-starter-*`, where `*` is a particular type of application.
> This naming structure is intended to help when you need to find a starter.
> The Maven integration in many IDEs lets you search dependencies by name.
> For example, with the appropriate Eclipse or Spring Tools plugin installed, you can press `ctrl-space` in the POM editor and type “spring-boot-starter” for a complete list.
>
> As explained in the [features/developing-auto-configuration.adoc#features.developing-auto-configuration.custom-starter](../features/developing-auto-configuration.md#features.developing-auto-configuration.custom-starter) section, third party starters should not start with `spring-boot`, as it is reserved for official Spring Boot artifacts.
> Rather, a third-party starter typically starts with the name of the project.
> For example, a third-party starter project called `thirdpartyproject` would typically be named `thirdpartyproject-spring-boot-starter`.

The following application starters are provided by Spring Boot under the `org.springframework.boot` group:

Unresolved include directive in modules/reference/pages/using/build-systems.adoc - include::ROOT:partial$starters/application-starters.adoc\[\]

In addition to the application starters, the following starters can be used to add [production ready](../../how-to/actuator.md) features:

Unresolved include directive in modules/reference/pages/using/build-systems.adoc - include::ROOT:partial$starters/production-starters.adoc\[\]

Finally, Spring Boot also includes the following starters that can be used if you want to exclude or swap specific technical facets:

Unresolved include directive in modules/reference/pages/using/build-systems.adoc - include::ROOT:partial$starters/technical-starters.adoc\[\]

To learn how to swap technical facets, please see the how-to documentation for [swapping web server](../../how-to/webserver.md#howto.webserver.use-another) and [logging system](../../how-to/logging.md#howto.logging.log4j).

> [!TIP]
> For a list of additional community contributed starters, see the [README file](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot-starters/README.adoc) in the `spring-boot-starters` module on GitHub.
