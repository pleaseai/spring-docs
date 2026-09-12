---
title: "Installing Spring Boot"
source: "ROOT:installing.adoc"
---

<a id="getting-started.installing"></a>

# Installing Spring Boot

Spring Boot can be used with “classic” Java development tools or installed as a command line tool.
Either way, you need [Java SDK v17](https://www.java.com) or higher.
Before you begin, you should check your current Java installation by using the following command:

```shell
$ java -version
```

If you are new to Java development or if you want to experiment with Spring Boot, you might want to try the [Spring Boot CLI](#getting-started.installing.cli) (Command Line Interface) first.
Otherwise, read on for “classic” installation instructions.

<a id="getting-started.installing.java"></a>

## Installation Instructions for the Java Developer

You can use Spring Boot in the same way as any standard Java library.
To do so, include the appropriate `spring-boot-*.jar` files on your classpath.
Spring Boot does not require any special tools integration, so you can use any IDE or text editor.
Also, there is nothing special about a Spring Boot application, so you can run and debug a Spring Boot application as you would any other Java program.

Although you *could* copy Spring Boot jars, we generally recommend that you use a build tool that supports dependency management (such as Maven or Gradle).

<a id="getting-started.installing.java.maven"></a>

### Maven Installation

Spring Boot is compatible with Apache Maven 3.6.3 or later.
If you do not already have Maven installed, you can follow the instructions at [maven.apache.org](https://maven.apache.org).

> [!TIP]
> On many operating systems, Maven can be installed with a package manager.
> If you use OSX Homebrew, try `brew install maven`.
> Ubuntu users can run `sudo apt-get install maven`.
> Windows users with [Chocolatey](https://chocolatey.org/) can run `choco install maven` from an elevated (administrator) prompt.

Spring Boot dependencies use the `org.springframework.boot` group id.
Typically, your Maven POM file inherits from the `spring-boot-starter-parent` project and declares dependencies to one or more [starters](reference/using/build-systems.md#using.build-systems.starters).
Spring Boot also provides an optional [Maven plugin](https://docs.spring.io/spring-boot/3.5.11/maven-plugin/index.html) to create executable jars.

More details on getting started with Spring Boot and Maven can be found in the [maven-plugin:getting-started.adoc](https://docs.spring.io/spring-boot/3.5.11/maven-plugin/getting-started.html) section of the Maven plugin’s reference guide.

<a id="getting-started.installing.java.gradle"></a>

### Gradle Installation

Spring Boot is compatible with Gradle 7.x (7.6.4 or later) or 8.x (8.4 or later).
If you do not already have Gradle installed, you can follow the instructions at [gradle.org](https://gradle.org).

Spring Boot dependencies can be declared by using the `org.springframework.boot` `group`.
Typically, your project declares dependencies to one or more [starters](reference/using/build-systems.md#using.build-systems.starters).
Spring Boot provides a useful [Gradle plugin](https://docs.spring.io/spring-boot/3.5.11/gradle-plugin/index.html) that can be used to simplify dependency declarations and to create executable jars.

#### Gradle Wrapper

> The Gradle Wrapper provides a nice way of “obtaining” Gradle when you need to build a project.
> It is a small script and library that you commit alongside your code to bootstrap the build process.
> See [docs.gradle.org/current/userguide/gradle\_wrapper.html](https://docs.gradle.org/current/userguide/gradle_wrapper.html) for details.

More details on getting started with Spring Boot and Gradle can be found in the [gradle-plugin:getting-started.adoc](https://docs.spring.io/spring-boot/3.5.11/gradle-plugin/getting-started.html) section of the Gradle plugin’s reference guide.

<a id="getting-started.installing.cli"></a>

## Installing the Spring Boot CLI

The Spring Boot CLI (Command Line Interface) is a command line tool that you can use to quickly prototype with Spring.

You do not need to use the CLI to work with Spring Boot, but it is a quick way to get a Spring application off the ground without an IDE.

<a id="getting-started.installing.cli.manual-installation"></a>

### Manual Installation

You can download the Spring CLI distribution from one of the following locations:

- [spring-boot-cli-3.5.11-bin.zip](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-cli/3.5.11/spring-boot-cli-3.5.11-bin.zip)
- [spring-boot-cli-3.5.11-bin.tar.gz](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-cli/3.5.11/spring-boot-cli-3.5.11-bin.tar.gz)

Once downloaded, follow the [INSTALL.txt](https://raw.githubusercontent.com/spring-projects/spring-boot/v3.5.11/spring-boot-project/spring-boot-tools/spring-boot-cli/src/main/content/INSTALL.txt) instructions from the unpacked archive.
In summary, there is a `spring` script (`spring.bat` for Windows) in a `bin/` directory in the `.zip` file.
Alternatively, you can use `java -jar` with the `.jar` file (the script helps you to be sure that the classpath is set correctly).

<a id="getting-started.installing.cli.sdkman"></a>

### Installation with SDKMAN!

SDKMAN! (The Software Development Kit Manager) can be used for managing multiple versions of various binary SDKs, including Groovy and the Spring Boot CLI.
Get SDKMAN! from [sdkman.io](https://sdkman.io) and install Spring Boot by using the following commands:

```shell
$ sdk install springboot
$ spring --version
Spring CLI v{version-spring-boot}
```

If you develop features for the CLI and want access to the version you built, use the following commands:

```shell
$ sdk install springboot dev /path/to/spring-boot/spring-boot-cli/target/spring-boot-cli-{version-spring-boot}-bin/spring-{version-spring-boot}/
$ sdk default springboot dev
$ spring --version
Spring CLI v{version-spring-boot}
```

The preceding instructions install a local instance of `spring` called the `dev` instance.
It points at your target build location, so every time you rebuild Spring Boot, `spring` is up-to-date.

You can see it by running the following command:

```shell
$ sdk ls springboot

================================================================================
Available Springboot Versions
================================================================================
> + dev
* {version-spring-boot}

================================================================================
+ - local version
* - installed
> - currently in use
================================================================================
```

<a id="getting-started.installing.cli.homebrew"></a>

### OSX Homebrew Installation

If you are on a Mac and use [Homebrew](https://brew.sh/), you can install the Spring Boot CLI by using the following commands:

```shell
$ brew tap spring-io/tap
$ brew install spring-boot
```

Homebrew installs `spring` to `/usr/local/bin`.

> [!NOTE]
> If you do not see the formula, your installation of brew might be out-of-date.
> In that case, run `brew update` and try again.

<a id="getting-started.installing.cli.macports"></a>

### MacPorts Installation

If you are on a Mac and use [MacPorts](https://www.macports.org/), you can install the Spring Boot CLI by using the following command:

```shell
$ sudo port install spring-boot-cli
```

<a id="getting-started.installing.cli.completion"></a>

### Command-line Completion

The Spring Boot CLI includes scripts that provide command completion for the [BASH](https://en.wikipedia.org/wiki/Bash_%28Unix_shell%29) and [zsh](https://en.wikipedia.org/wiki/Z_shell) shells.
You can `source` the script named `spring` (`_spring` for zsh) or put it in your personal or system-wide bash completion initialization.
On a Debian system, the system-wide scripts are in `<installation location>/shell-completion/<bash|zsh>` and all scripts in that directory are executed when a new shell starts.
For example, to run the script manually if you have installed by using SDKMAN!, use the following commands:

```shell
$ . ~/.sdkman/candidates/springboot/current/shell-completion/bash/spring
$ spring <HIT TAB HERE>
  encodepassword  help  init  shell  version
```

> [!NOTE]
> If you install the Spring Boot CLI by using Homebrew or MacPorts, the command-line completion scripts are automatically registered with your shell.

<a id="getting-started.installing.cli.scoop"></a>

### Windows Scoop Installation

If you are on a Windows and use [Scoop](https://scoop.sh/), you can install the Spring Boot CLI by using the following commands:

```shell
$ scoop bucket add extras
$ scoop install springboot
```

Scoop installs `spring` to `~/scoop/apps/springboot/current/bin`.

> [!NOTE]
> If you do not see the app manifest, your installation of scoop might be out-of-date.
> In that case, run `scoop update` and try again.
