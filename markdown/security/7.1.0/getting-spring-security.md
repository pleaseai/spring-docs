---
title: "Getting Spring Security"
source: "ROOT:getting-spring-security.adoc"
---

<a id="getting-gradle"></a>

# Getting Spring Security

This section describes how to get the Spring Security binaries.
See [Source Code](community.md#community-source) for how to obtain the source code.

<a id="_release_numbering"></a>

## Release Numbering

Spring Security versions are formatted as MAJOR.MINOR.PATCH such that:

- MAJOR versions may contain breaking changes.
Typically, these are done to provide improved security to match modern security practices.
- MINOR versions contain enhancements but are considered passive updates.
- PATCH level should be perfectly compatible, forwards and backwards, with the possible exception of changes that fix bugs.

<a id="maven"></a>

## Usage

As most open source projects, Spring Security deploys its dependencies as Maven artifacts, which makes them compatible with both Maven and Gradle. The following sections demonstrate how to integrate Spring Security with these build tools, with examples for Spring Boot and standalone usage.

<a id="getting-gradle-boot"></a>

### Spring Boot

Spring Boot provides a `spring-boot-starter-security` starter that aggregates Spring Security-related dependencies.
The simplest and preferred way to use the starter is to use [Spring Initializr](https://docs.spring.io/initializr/docs/current/reference/html/) by using an IDE integration in ([Eclipse](https://joshlong.com/jl/blogPost/tech_tip_geting_started_with_spring_boot.html) or [IntelliJ](https://www.jetbrains.com/help/idea/spring-boot.html#d1489567e2), [NetBeans](https://github.com/AlexFalappa/nb-springboot/wiki/Quick-Tour)) or through [start.spring.io](https://start.spring.io).
Alternatively, you can manually add the starter, as the following example shows:

#### Maven

#### pom.xml

```xml
<dependencies>
	<!-- ... other dependency elements ... -->
	<dependency>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-security</artifactId>
	</dependency>
</dependencies>
```

#### Gradle

#### build.gradle

```groovy
dependencies {
	implementation "org.springframework.boot:spring-boot-starter-security"
}
```

Since Spring Boot provides a Maven BOM to manage dependency versions, you do not need to specify a version.
If you wish to override the Spring Security version, you can do so with a build property as shown below:

#### Maven

#### pom.xml

```xml
<properties>
	<!-- ... -->
	<spring-security.version>7.1.0</spring-security.version>
</properties>
```

#### Gradle

#### build.gradle

```groovy
ext['spring-security.version']='7.1.0'
```

Since Spring Security makes breaking changes only in major releases, you can safely use a newer version of Spring Security with Spring Boot.
However, at times, you may need to update the version of Spring Framework as well.
You can do so by adding a build property like so:

#### Maven

#### pom.xml

```xml
<properties>
	<!-- ... -->
	<spring.version>7.0.8</spring.version>
</properties>
```

#### Gradle

#### build.gradle

```groovy
ext['spring.version']='7.0.8'
```

If you use additional features (such as LDAP, OAuth 2, and others), you need to also include the appropriate [Project Modules and Dependencies](modules.md#modules).

<a id="getting-maven-no-boot"></a>

### Standalone Usage (Without Spring Boot)

When you use Spring Security without Spring Boot, the preferred way is to use Spring Security’s BOM to ensure that a consistent version of Spring Security is used throughout the entire project.

#### Maven

#### pom.xml

```xml
<dependencyManagement>
	<dependencies>
		<!-- ... other dependency elements ... -->
		<dependency>
			<groupId>org.springframework.security</groupId>
			<artifactId>spring-security-bom</artifactId>
			<version>{spring-security-version}</version>
			<type>pom</type>
			<scope>import</scope>
		</dependency>
	</dependencies>
</dependencyManagement>
```

#### Gradle

#### build.gradle

```groovy
plugins {
	id "io.spring.dependency-management" version "1.0.6.RELEASE"
}

dependencyManagement {
	imports {
		mavenBom 'org.springframework.security:spring-security-bom:7.1.0'
	}
}
```

> [!TIP]
> Spring provides a [`Dependency Management Plugin`](https://github.com/spring-gradle-plugins/dependency-management-plugin) for Gradle

A minimal Spring Security Maven set of dependencies typically looks like the following example:

#### Maven

#### pom.xml

```xml
<dependencies>
	<!-- ... other dependency elements ... -->
	<dependency>
		<groupId>org.springframework.security</groupId>
		<artifactId>spring-security-web</artifactId>
	</dependency>
	<dependency>
		<groupId>org.springframework.security</groupId>
		<artifactId>spring-security-config</artifactId>
	</dependency>
</dependencies>
```

#### Gradle

#### build.gradle

```groovy
dependencies {
	implementation "org.springframework.security:spring-security-web"
	implementation "org.springframework.security:spring-security-config"
}
```

If you use additional features (such as LDAP, OAuth 2, and others), you need to also include the appropriate [Project Modules and Dependencies](modules.md#modules).

Spring Security builds against Spring Framework 7.0.8 but should generally work with any newer version of Spring Framework 5.x.
Many users are likely to run afoul of the fact that Spring Security’s transitive dependencies resolve Spring Framework 7.0.8, which can cause strange classpath problems.
The easiest way to resolve this is to use the `spring-framework-bom` within the `<dependencyManagement>` section of your `pom.xml` or your `dependencyManagement` section of your `build.gradle`.

#### Maven

#### pom.xml

```xml
<dependencyManagement>
	<dependencies>
		<!-- ... other dependency elements ... -->
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-framework-bom</artifactId>
			<version>7.0.8</version>
			<type>pom</type>
			<scope>import</scope>
		</dependency>
	</dependencies>
</dependencyManagement>
```

#### Gradle

#### build.gradle

```groovy
plugins {
	id "io.spring.dependency-management" version "1.0.6.RELEASE"
}

dependencyManagement {
	imports {
		mavenBom 'org.springframework:spring-framework-bom:7.0.8'
	}
}
```

> [!TIP]
> Spring provides a [`Dependency Management Plugin`](https://github.com/spring-gradle-plugins/dependency-management-plugin) for Gradle

The preceding example ensures that all the transitive dependencies of Spring Security use the Spring 7.0.8 modules.

> [!NOTE]
> This approach uses Maven’s “bill of materials” (BOM) concept and is only available in Maven 2.0.9+.
> For additional details about how dependencies are resolved, see [Maven’s Introduction to the Dependency Mechanism documentation](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html).

<a id="maven-repositories"></a>

### Maven Repositories

All [GA releases](https://github.com/spring-projects/spring-security/wiki/Release-Schedule-Guidelines) are deployed to Maven Central, so you need not declare additional Maven repositories in your build configuration.

For Gradle using the `mavenCentral()` repository is sufficient for GA releases.

#### build.gradle

```groovy
repositories {
	mavenCentral()
}
```

If you use a SNAPSHOT version, you need to ensure that you have the Spring Snapshot repository defined:

#### Maven

#### pom.xml

```xml
<repositories>
	<!-- ... possibly other repository elements ... -->
	<repository>
		<id>spring-snapshot</id>
		<name>Spring Snapshot Repository</name>
		<url>https://repo.spring.io/snapshot</url>
	</repository>
</repositories>
```

#### Gradle

#### build.gradle

```groovy
repositories {
	maven { url 'https://repo.spring.io/snapshot' }
}
```

If you use a milestone or release candidate version, you need to ensure that you have the Spring Milestone repository defined, as the following example shows:

#### Maven

#### pom.xml

```xml
<repositories>
	<!-- ... possibly other repository elements ... -->
	<repository>
		<id>spring-milestone</id>
		<name>Spring Milestone Repository</name>
		<url>https://repo.spring.io/milestone</url>
	</repository>
</repositories>
```

#### Gradle

#### build.gradle

```groovy
repositories {
	maven { url 'https://repo.spring.io/milestone' }
}
```
