---
title: "Upgrading Spring Boot"
source: "ROOT:upgrading.adoc"
---

<a id="upgrading"></a>

# Upgrading Spring Boot

Instructions for how to upgrade from earlier versions of Spring Boot are provided on the project [wiki](https://github.com/spring-projects/spring-boot/wiki).
Follow the links in the [release notes](https://github.com/spring-projects/spring-boot/wiki#release-notes) section to find the version that you want to upgrade to.

Upgrading instructions are always the first item in the release notes.
If you are more than one release behind, please make sure that you also review the release notes of the versions that you jumped.

<a id="upgrading.from-1x"></a>

## Upgrading From 1.x

If you are upgrading from the `1.x` release of Spring Boot, check the [migration guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.0-Migration-Guide) on the project wiki that provides detailed upgrade instructions to upgrade to Spring Boot 2.x.
Check also the [release notes](https://github.com/spring-projects/spring-boot/wiki) for a list of “new and noteworthy” features for each release.

<a id="upgrading.from-2x"></a>

## Upgrading From 2.x

If you are upgrading from the `2.x` release of Spring Boot, check the [migration guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide) on the project wiki that provides detailed upgrade instructions.
Check also the [release notes](https://github.com/spring-projects/spring-boot/wiki) for a list of “new and noteworthy” features for each release.

<a id="upgrading.to-feature"></a>

## Upgrading to a New Feature Release

When upgrading to a new feature release, some properties may have been renamed or removed.
Spring Boot provides a way to analyze your application’s environment and print diagnostics at startup, but also temporarily migrate properties at runtime for you.
To enable that feature, add the following dependency to your project:

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-properties-migrator</artifactId>
	<scope>runtime</scope>
</dependency>
```

> [!WARNING]
> Properties that are added late to the environment, such as when using [`@PropertySource`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/PropertySource.html), will not be taken into account.

> [!NOTE]
> Once you finish the migration, please make sure to remove this module from your project’s dependencies.

<a id="upgrading.cli"></a>

## Upgrading the Spring Boot CLI

To upgrade an existing CLI installation, use the appropriate package manager command (for example, `brew upgrade`).
If you manually installed the CLI, follow the [standard instructions](installing.md#getting-started.installing.cli.manual-installation), remembering to update your `PATH` environment variable to remove any older references.
