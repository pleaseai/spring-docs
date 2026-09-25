---
title: "Dependencies"
source: "ROOT:dependencies.adoc"
---

<a id="dependencies"></a>

# Dependencies

Due to the different inception dates of individual Spring Data modules, most of them carry different major and minor version numbers. The easiest way to find compatible ones is to rely on the Spring Data Release Train BOM that we ship with the compatible versions defined. In a Maven project, you would declare this dependency in the `<dependencyManagement />` section of your POM as follows:

#### Using the Spring Data release train BOM

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.data</groupId>
      <artifactId>spring-data-bom</artifactId>
      <version>2023.1.5</version>
      <scope>import</scope>
      <type>pom</type>
    </dependency>
  </dependencies>
</dependencyManagement>
```

<a id="dependencies.train-version"></a>

The current release train version is `2023.1.5`. The train version uses [calver](https://calver.org/) with the pattern `YYYY.MINOR.MICRO`.
The version name follows `${calver}` for GA releases and service releases and the following pattern for all other versions: `${calver}-${modifier}`, where `modifier` can be one of the following:

- `SNAPSHOT`: Current snapshots
- `M1`, `M2`, and so on: Milestones
- `RC1`, `RC2`, and so on: Release candidates

You can find a working example of using the BOMs in our [Spring Data examples repository](https://github.com/spring-projects/spring-data-examples/tree/main/bom). With that in place, you can declare the Spring Data modules you would like to use without a version in the `<dependencies />` block, as follows:

#### Declaring a dependency to a Spring Data module such as JPA

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-jpa</artifactId>
  </dependency>
<dependencies>
```

<a id="dependencies.spring-boot"></a>

## Dependency Management with Spring Boot

Spring Boot selects a recent version of the Spring Data modules for you. If you still want to upgrade to a newer version,
set the `spring-data-bom.version` property to the [train version and iteration](#dependencies.train-version)
you would like to use.

See Spring Boot’s [documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/dependency-versions.html#appendix.dependency-versions.properties)
(search for "Spring Data Bom") for more details.

<a id="dependencies.spring-framework"></a>

## Spring Framework

The current version of Spring Data modules require Spring Framework 6.1.6 or better. The modules might also work with an older bugfix version of that minor version. However, using the most recent version within that generation is highly recommended.
