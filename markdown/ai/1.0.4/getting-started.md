---
title: "Getting Started"
source: "ROOT:getting-started.adoc"
---

<a id="getting-started"></a>

# Getting Started

This section offers jumping off points for how to get started using Spring AI.

You should follow the steps in each of the following sections according to your needs.

> [!NOTE]
> Spring AI supports Spring Boot 3.4.x and 3.5.x.

<a id="spring-initializr"></a>

## Spring Initializr

Head on over to [start.spring.io](https://start.spring.io/) and select the AI Models and Vector Stores that you want to use in your new applications.

<a id="artifact-repositories"></a>

## Artifact Repositories

<a id="_milestones_use_maven_central"></a>

### Milestones - Use Maven Central

As of 1.0.0-M6, releases are available in Maven Central.
No changes to your build file are required.

<a id="_snapshots_add_snapshot_repositories"></a>

### Snapshots - Add Snapshot Repositories

To use the Snapshot (and pre 1.0.0-M6 milestone) versions, you need to add the following snapshot repositories in your build file.

Add the following repository definitions to your Maven or Gradle build file:

#### Maven

```xml
<repositories>
  <repository>
    <id>spring-snapshots</id>
    <name>Spring Snapshots</name>
    <url>https://repo.spring.io/snapshot</url>
    <releases>
      <enabled>false</enabled>
    </releases>
  </repository>
  <repository>
    <name>Central Portal Snapshots</name>
    <id>central-portal-snapshots</id>
    <url>https://central.sonatype.com/repository/maven-snapshots/</url>
    <releases>
      <enabled>false</enabled>
    </releases>
    <snapshots>
      <enabled>true</enabled>
    </snapshots>
  </repository>
</repositories>
```

#### Gradle

```groovy
repositories {
  mavenCentral()
  maven { url 'https://repo.spring.io/milestone' }
  maven { url 'https://repo.spring.io/snapshot' }
  maven {
    name = 'Central Portal Snapshots'
    url = 'https://central.sonatype.com/repository/maven-snapshots/'
  }
}
```

**NOTE:** When using Maven with Spring AI snapshots, pay attention to your Maven mirror configuration. If you have configured a mirror in your `settings.xml` like this:

```xml
<mirror>
    <id>my-mirror</id>
    <mirrorOf>*</mirrorOf>
    <url>https://my-company-repository.com/maven</url>
</mirror>
```

The wildcard `*` will redirect all repository requests to your mirror, preventing access to Spring snapshot repositories. To fix this, modify the `mirrorOf` configuration to exclude Spring repositories:

```xml
<mirror>
    <id>my-mirror</id>
    <mirrorOf>*,!spring-snapshots,!central-portal-snapshots</mirrorOf>
    <url>https://my-company-repository.com/maven</url>
</mirror>
```

This configuration allows Maven to access Spring snapshot repositories directly while still using your mirror for other dependencies.

<a id="dependency-management"></a>

## Dependency Management

The Spring AI Bill of Materials (BOM) declares the recommended versions of all the dependencies used by a given release of Spring AI.
This is a BOM-only version and it just contains dependency management and no plugin declarations or direct references to Spring or Spring Boot.
You can use the Spring Boot parent POM, or use the BOM from Spring Boot (`spring-boot-dependencies`) to manage Spring Boot versions.

Add the BOM to your project:

#### Maven

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-bom</artifactId>
            <version>1.0.0-SNAPSHOT</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

#### Gradle

```groovy
dependencies {
  implementation platform("org.springframework.ai:spring-ai-bom:1.0.0-SNAPSHOT")
  // Replace the following with the starter dependencies of specific modules you wish to use
  implementation 'org.springframework.ai:spring-ai-openai'
}
```

Gradle users can also use the Spring AI BOM by leveraging Gradle (5.0+) native support for declaring dependency constraints using a Maven BOM. This is implemented by adding a 'platform' dependency handler method to the dependencies section of your Gradle build script.

<a id="add-dependencies"></a>

## Add dependencies for specific components

Each of the following sections in the documentation shows which dependencies you need to add to your project build system.

- [Chat Models](api/chatmodel.md)
- [Embeddings Models](api/embeddings.md)
- [Image Generation Models](api/imageclient.md)
- [Transcription Models](api/audio/transcriptions.md)
- [Text-To-Speech (TTS) Models](api/audio/speech.md)
- [Vector Databases](api/vectordbs.md)

<a id="_spring_ai_samples"></a>

## Spring AI samples

Please refer to [this page](https://github.com/spring-ai-community/awesome-spring-ai) for more resources and samples related to Spring AI.
