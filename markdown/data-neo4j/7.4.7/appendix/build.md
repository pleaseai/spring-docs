---
title: "Building Spring Data Neo4j"
source: "ROOT:appendix/build.adoc"
---

<a id="building-SDN"></a>

# Building Spring Data Neo4j

<a id="building-SDN.requirements"></a>

## Requirements

- JDK 17+ (Can be [OpenJDK](https://openjdk.java.net) or [Oracle JDK](https://www.oracle.com/technetwork/java/index.html))
- Maven 3.8.5 (We provide the Maven wrapper, see `mvnw` respectively `mvnw.cmd` in the project root; the wrapper downloads the appropriate Maven version automatically)
- A Neo4j 5.+ database, either

  - running locally
  - or indirectly via [Testcontainers](https://www.testcontainers.org) and [Docker](https://www.docker.com)

<a id="building-SDN.jdk.version"></a>

### About the JDK version

Choosing JDK 17 is a decision influenced by various aspects

- SDN is a Spring Data project.
Spring Data commons baseline is JDK 17 and so is Spring Framework’s baseline.
Thus, it is only natural to keep the JDK 17 baseline.

<a id="building-SDN.running-the-build"></a>

## Running the build

The following sections are alternatives and roughly sorted by increased effort.

All builds require a local copy of the project:

<a id="checkout-SDN"></a>

#### Clone SDN

```console
$ git clone git@github.com:spring-projects/spring-data-neo4j.git
```

Before you proceed, verify your locally installed JDK version.
The output should be similar:

<a id="verify-jdk"></a>

#### Verify your JDK

```console
$ java -version
java version "18.0.1" 2022-04-19
Java(TM) SE Runtime Environment (build 18.0.1+10-24)
Java HotSpot(TM) 64-Bit Server VM (build 18.0.1+10-24, mixed mode, sharing)
```

<a id="building-SDN.docker"></a>

### With Docker installed

<a id="building-SDN.docker.default-image"></a>

#### Using the default image

If you don’t have [Docker](<https://en.wikipedia.org/wiki/Docker_(software)>) installed, head over to [Docker Desktop](https://www.docker.com/products/docker-desktop).
In short, Docker is a tool that helps you running lightweight software images using OS-level virtualization in so-called containers.

Our build uses [Testcontainers Neo4j](https://www.testcontainers.org/modules/databases/neo4j/) to bring up a database instance.

<a id="build-default-bash"></a>

#### Build with default settings on Linux / macOS

```console
$ ./mvnw clean verify
```

On a Windows machine, use

<a id="build-default-windows"></a>

#### Build with default settings on Windows

```console
$ mvnw.cmd clean verify
```

The output should be similar.

<a id="building-SDN.docker.another-image"></a>

#### Using another image

The image version to use can be configured through an environmental variable like this:

<a id="build-other-image"></a>

#### Build using a different Neo4j Docker image

```console
$ SDN_NEO4J_VERSION=5.3.0-enterprise SDN_NEO4J_ACCEPT_COMMERCIAL_EDITION=yes ./mvnw clean verify
```

Here we are using 5.3.0 enterprise and also accept the license agreement.

Consult your operating system or shell manual on how to define environment variables if specifying them inline does not work for you.

<a id="building-SDN.local-database"></a>

### Against a locally running database

> [!WARNING]
> Running against a locally running database **will** erase its complete content.

Building against a locally running database is faster, as it does not restart a container each time.
We do this a lot during our development.

You can get a copy of Neo4j at our [download center](https://neo4j.com/download-center/#enterprise) free of charge.

Please download the version applicable to your operating system and follow the instructions to start it.
A required step is to open a browser and go to [localhost:7474](http://localhost:7474) after you started the database and change the default password from `neo4j` to something of your liking.

After that, you can run a complete build by specifying the local `bolt` URL:

<a id="build-using-locally-running-database"></a>

#### Build using a locally running database

```console
$ SDN_NEO4J_URL=bolt://localhost:7687 SDN_NEO4J_PASSWORD=verysecret ./mvnw clean verify
```

<a id="building-SDN.environment-variables"></a>

## Summary of environment variables controlling the build

| Name | Default value | Meaning |
| --- | --- | --- |
| `SDN_NEO4J_VERSION` | 5.3.0 | Version of the Neo4j docker image to use, see [Neo4j Docker Official Images](https://hub.docker.com/_/neo4j) |
| `SDN_NEO4J_ACCEPT_COMMERCIAL_EDITION` | no | Some tests may require the enterprise edition of Neo4j. We build and test against the enterprise edition internally, but we won’t force you to accept the license if you don’t want to. |
| `SDN_NEO4J_URL` | not set | Setting this environment allows connecting to a locally running Neo4j instance. We use this a lot during development. |
| `SDN_NEO4J_PASSWORD` | not set | Password for the `neo4j` user of the instance configured with `SDN_NEO4J_URL`. |

> [!NOTE]
> You need to set both `SDN_NEO4J_URL` and `SDN_NEO4J_PASSWORD` to use a local instance.

<a id="building-SDN.checkstyle-and-co"></a>

## Checkstyle and friends

There is no quality gate in place at the moment to ensure that the code/test ratio stays as is, but please consider adding tests to your contributions.

We have some rather mild checkstyle rules in place, enforcing more or less default Java formatting rules.
Your build will break on formatting errors or something like unused imports.
