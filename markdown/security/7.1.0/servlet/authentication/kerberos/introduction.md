---
title: "Introduction"
source: "ROOT:servlet/authentication/kerberos/introduction.adoc"
---

<a id="introduction"></a>

# Introduction

Spring Security Kerberos 7.1.0 is built and tested with JDK 17,
Spring Security 7.1.0 and Spring Framework 7.0.8.

The dependency coordinates changed with Spring Security 7:

#### Maven

#### pom.xml

```xml
<dependencies>
	<!-- ... other dependency elements ... -->
	<dependency>
		<groupId>org.springframework.security</groupId>
		<artifactId>spring-security-kerberos-core</artifactId>
	</dependency>
	<dependency>
		<groupId>org.springframework.security</groupId>
		<artifactId>spring-security-kerberos-web</artifactId>
	</dependency>
</dependencies>
```

#### Gradle

#### build.gradle

```groovy
dependencies {
	implementation "org.springframework.security:spring-security-kerberos-core"
	implementation "org.springframework.security:spring-security-kerberos-web"
}
```
