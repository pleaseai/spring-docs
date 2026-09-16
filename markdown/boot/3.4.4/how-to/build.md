---
title: "Build"
source: "how-to:build.adoc"
---

<a id="howto.build"></a>

# Build

Spring Boot includes build plugins for Maven and Gradle.
This section answers common questions about these plugins.

<a id="howto.build.generate-info"></a>

## Generate Build Information

Both the Maven plugin and the Gradle plugin allow generating build information containing the coordinates, name, and version of the project.
The plugins can also be configured to add additional properties through configuration.
When such a file is present, Spring Boot auto-configures a [`BuildProperties`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/info/BuildProperties.html) bean.

To generate build information with Maven, add an execution for the `build-info` goal, as shown in the following example:

```xml
<build>
	<plugins>
		<plugin>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-maven-plugin</artifactId>
			<version>3.4.4</version>
			<executions>
				<execution>
					<goals>
						<goal>build-info</goal>
					</goals>
				</execution>
			</executions>
		</plugin>
	</plugins>
</build>
```

> [!TIP]
> See the [Spring Boot Maven Plugin documentation](https://docs.spring.io/spring-boot/3.4.4/maven-plugin/build-info.html) for more details.

The following example does the same with Gradle:

```gradle
springBoot {
	buildInfo()
}
```

> [!TIP]
> See the [Spring Boot Gradle Plugin documentation](https://docs.spring.io/spring-boot/3.4.4/gradle-plugin/integrating-with-actuator.html) for more details.

<a id="howto.build.generate-git-info"></a>

## Generate Git Information

Both Maven and Gradle allow generating a `git.properties` file containing information about the state of your `git` source code repository when the project was built.

For Maven users, the `spring-boot-starter-parent` POM includes a pre-configured plugin to generate a `git.properties` file.
To use it, add the following declaration for the [`Git Commit Id Plugin`](https://github.com/git-commit-id/git-commit-id-maven-plugin) to your POM:

```xml
<build>
	<plugins>
		<plugin>
			<groupId>io.github.git-commit-id</groupId>
			<artifactId>git-commit-id-maven-plugin</artifactId>
		</plugin>
	</plugins>
</build>
```

Gradle users can achieve the same result by using the [`gradle-git-properties`](https://plugins.gradle.org/plugin/com.gorylenko.gradle-git-properties) plugin, as shown in the following example:

```gradle
plugins {
	id "com.gorylenko.gradle-git-properties" version "2.4.1"
}
```

Both the Maven and Gradle plugins allow the properties that are included in `git.properties` to be configured.

> [!TIP]
> The commit time in `git.properties` is expected to match the following format: `yyyy-MM-dd’T’HH:mm:ssZ`.
> This is the default format for both plugins listed above.
> Using this format lets the time be parsed into a [`Date`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Date.html) and its format, when serialized to JSON, to be controlled by Jackson’s date serialization configuration settings.

<a id="howto.build.generate-cyclonedx-sbom"></a>

## Generate a CycloneDX SBOM

Both Maven and Gradle allow generating a CycloneDX SBOM at project build time.

For Maven users, the `spring-boot-starter-parent` POM includes a pre-configured plugin to generate the SBOM.
To use it, add the following declaration for the [`cyclonedx-maven-plugin`](https://github.com/CycloneDX/cyclonedx-maven-plugin) to your POM:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.cyclonedx</groupId>
            <artifactId>cyclonedx-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

Gradle users can achieve the same result by using the [`cyclonedx-gradle-plugin`](https://github.com/CycloneDX/cyclonedx-gradle-plugin) plugin, as shown in the following example:

```gradle
plugins {
    id 'org.cyclonedx.bom' version '1.10.0'
}
```

<a id="howto.build.customize-dependency-versions"></a>

## Customize Dependency Versions

The `spring-boot-dependencies` POM manages the versions of common dependencies.
The Spring Boot plugins for Maven and Gradle allow these managed dependency versions to be customized using build properties.

> [!WARNING]
> Each Spring Boot release is designed and tested against this specific set of third-party dependencies.
> Overriding versions may cause compatibility issues.

To override dependency versions with Maven, see [maven-plugin:using.adoc](https://docs.spring.io/spring-boot/3.4.4/maven-plugin/using.html) in the Maven plugin’s documentation.

To override dependency versions in Gradle, see [gradle-plugin:managing-dependencies.adoc#managing-dependencies.dependency-management-plugin.customizing](https://docs.spring.io/spring-boot/3.4.4/gradle-plugin/managing-dependencies.html#managing-dependencies.dependency-management-plugin.customizing) in the Gradle plugin’s documentation.

<a id="howto.build.create-an-executable-jar-with-maven"></a>

## Create an Executable JAR with Maven

The `spring-boot-maven-plugin` can be used to create an executable “fat” JAR.
If you use the `spring-boot-starter-parent` POM, you can declare the plugin and your jars are repackaged as follows:

```xml
<build>
	<plugins>
		<plugin>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-maven-plugin</artifactId>
		</plugin>
	</plugins>
</build>
```

If you do not use the parent POM, you can still use the plugin.
However, you must additionally add an `<executions>` section, as follows:

```xml
<build>
	<plugins>
		<plugin>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-maven-plugin</artifactId>
			<version>3.4.4</version>
			<executions>
				<execution>
					<goals>
						<goal>repackage</goal>
					</goals>
				</execution>
			</executions>
		</plugin>
	</plugins>
</build>
```

See the [plugin documentation](https://docs.spring.io/spring-boot/3.4.4/maven-plugin/packaging.html#packaging.repackage-goal) for full usage details.

<a id="howto.build.use-a-spring-boot-application-as-dependency"></a>

## Use a Spring Boot Application as a Dependency

Like a war file, a Spring Boot application is not intended to be used as a dependency.
If your application contains classes that you want to share with other projects, the recommended approach is to move that code into a separate module.
The separate module can then be depended upon by your application and other projects.

If you cannot rearrange your code as recommended above, Spring Boot’s Maven and Gradle plugins must be configured to produce a separate artifact that is suitable for use as a dependency.
The executable archive cannot be used as a dependency as the [executable jar format](../specification/executable-jar/nested-jars.md#appendix.executable-jar.nested-jars.jar-structure) packages application classes in `BOOT-INF/classes`.
This means that they cannot be found when the executable jar is used as a dependency.

To produce the two artifacts, one that can be used as a dependency and one that is executable, a classifier must be specified.
This classifier is applied to the name of the executable archive, leaving the default archive for use as a dependency.

To configure a classifier of `exec` in Maven, you can use the following configuration:

```xml
<build>
	<plugins>
		<plugin>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-maven-plugin</artifactId>
			<configuration>
				<classifier>exec</classifier>
			</configuration>
		</plugin>
	</plugins>
</build>
```

<a id="howto.build.extract-specific-libraries-when-an-executable-jar-runs"></a>

## Extract Specific Libraries When an Executable Jar Runs

Most nested libraries in an executable jar do not need to be unpacked in order to run.
However, certain libraries can have problems.
For example, JRuby includes its own nested jar support, which assumes that the `jruby-complete.jar` is always directly available as a file in its own right.

To deal with any problematic libraries, you can flag that specific nested jars should be automatically unpacked when the executable jar first runs.
Such nested jars are written beneath the temporary directory identified by the `java.io.tmpdir` system property.

> [!WARNING]
> Care should be taken to ensure that your operating system is configured so that it will not delete the jars that have been unpacked to the temporary directory while the application is still running.

For example, to indicate that JRuby should be flagged for unpacking by using the Maven Plugin, you would add the following configuration:

```xml
<build>
	<plugins>
		<plugin>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-maven-plugin</artifactId>
			<configuration>
				<requiresUnpack>
					<dependency>
						<groupId>org.jruby</groupId>
						<artifactId>jruby-complete</artifactId>
					</dependency>
				</requiresUnpack>
			</configuration>
		</plugin>
	</plugins>
</build>
```

<a id="howto.build.create-a-nonexecutable-jar"></a>

## Create a Non-executable JAR with Exclusions

Often, if you have an executable and a non-executable jar as two separate build products, the executable version has additional configuration files that are not needed in a library jar.
For example, the `application.yaml` configuration file might be excluded from the non-executable JAR.

In Maven, the executable jar must be the main artifact and you can add a classified jar for the library, as follows:

```xml
<build>
	<plugins>
		<plugin>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-maven-plugin</artifactId>
		</plugin>
		<plugin>
			<artifactId>maven-jar-plugin</artifactId>
			<executions>
				<execution>
					<id>lib</id>
					<phase>package</phase>
					<goals>
						<goal>jar</goal>
					</goals>
					<configuration>
						<classifier>lib</classifier>
						<excludes>
							<exclude>application.yaml</exclude>
						</excludes>
					</configuration>
				</execution>
			</executions>
		</plugin>
	</plugins>
</build>
```

<a id="howto.build.remote-debug-maven"></a>

## Remote Debug a Spring Boot Application Started with Maven

To attach a remote debugger to a Spring Boot application that was started with Maven, you can use the `jvmArguments` property of the [maven plugin](https://docs.spring.io/spring-boot/3.4.4/maven-plugin/index.html).

See [this example](https://docs.spring.io/spring-boot/3.4.4/maven-plugin/run.html#run.examples.debug) for more details.

<a id="howto.build.build-an-executable-archive-with-ant-without-using-spring-boot-antlib"></a>

## Build an Executable Archive From Ant without Using spring-boot-antlib

To build with Ant, you need to grab dependencies, compile, and then create a jar or war archive.
To make it executable, you can either use the `spring-boot-antlib` module or you can follow these instructions:

1. If you are building a jar, package the application’s classes and resources in a nested `BOOT-INF/classes` directory.
If you are building a war, package the application’s classes in a nested `WEB-INF/classes` directory as usual.
1. Add the runtime dependencies in a nested `BOOT-INF/lib` directory for a jar or `WEB-INF/lib` for a war.
Remember **not** to compress the entries in the archive.
1. Add the `provided` (embedded container) dependencies in a nested `BOOT-INF/lib` directory for a jar or `WEB-INF/lib-provided` for a war.
Remember **not** to compress the entries in the archive.
1. Add the `spring-boot-loader` classes at the root of the archive (so that the `Main-Class` is available).
1. Use the appropriate launcher (such as [`JarLauncher`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/loader/launch/JarLauncher.html) for a jar file) as a `Main-Class` attribute in the manifest and specify the other properties it needs as manifest entries — principally, by setting a `Start-Class` property.

The following example shows how to build an executable archive with Ant:

```xml
<target name="build" depends="compile">
	<jar destfile="target/${ant.project.name}-${spring-boot.version}.jar" compress="false">
		<mappedresources>
			<fileset dir="target/classes" />
			<globmapper from="*" to="BOOT-INF/classes/*"/>
		</mappedresources>
		<mappedresources>
			<fileset dir="src/main/resources" erroronmissingdir="false"/>
			<globmapper from="*" to="BOOT-INF/classes/*"/>
		</mappedresources>
		<mappedresources>
			<fileset dir="${lib.dir}/runtime" />
			<globmapper from="*" to="BOOT-INF/lib/*"/>
		</mappedresources>
		<zipfileset src="${lib.dir}/loader/spring-boot-loader-jar-${spring-boot.version}.jar" />
		<manifest>
			<attribute name="Main-Class" value="org.springframework.boot.loader.launch.JarLauncher" />
			<attribute name="Start-Class" value="${start-class}" />
		</manifest>
	</jar>
</target>
```
