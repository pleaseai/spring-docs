---
title: "Supporting Other Build Systems"
source: "build-tool-plugin:other-build-systems.adoc"
---

<a id="build-tool-plugins.other-build-systems"></a>

# Supporting Other Build Systems

If you want to use a build tool other than Maven, Gradle, or Ant, you likely need to develop your own plugin.
Executable jars need to follow a specific format and certain entries need to be written in an uncompressed form (see the “[executable jar format](../specification/executable-jar/index.md)” section in the appendix for details).

The Spring Boot Maven and Gradle plugins both make use of `spring-boot-loader-tools` to actually generate jars.
If you need to, you may use this library directly.

<a id="build-tool-plugins.other-build-systems.repackaging-archives"></a>

## Repackaging Archives

To repackage an existing archive so that it becomes a self-contained executable archive, use `org.springframework.boot.loader.tools.Repackager`.
The `Repackager` class takes a single constructor argument that refers to an existing jar or war archive.
Use one of the two available `repackage()` methods to either replace the original file or write to a new destination.
Various settings can also be configured on the repackager before it is run.

<a id="build-tool-plugins.other-build-systems.nested-libraries"></a>

## Nested Libraries

When repackaging an archive, you can include references to dependency files by using the `org.springframework.boot.loader.tools.Libraries` interface.
We do not provide any concrete implementations of `Libraries` here as they are usually build-system-specific.

If your archive already includes libraries, you can use `Libraries.NONE`.

<a id="build-tool-plugins.other-build-systems.finding-main-class"></a>

## Finding a Main Class

If you do not use `Repackager.setMainClass()` to specify a main class, the repackager uses [ASM](https://asm.ow2.io/) to read class files and tries to find a suitable class with a `public static void main(String[] args)` method.
An exception is thrown if more than one candidate is found.

<a id="build-tool-plugins.other-build-systems.example-repackage-implementation"></a>

## Example Repackage Implementation

The following example shows a typical repackage implementation:

#### Java

```java
import java.io.File;
import java.io.IOException;
import java.util.List;

import org.springframework.boot.loader.tools.Library;
import org.springframework.boot.loader.tools.LibraryCallback;
import org.springframework.boot.loader.tools.LibraryScope;
import org.springframework.boot.loader.tools.Repackager;

public class MyBuildTool {

	public void build() throws IOException {
		File sourceJarFile = ...
		Repackager repackager = new Repackager(sourceJarFile);
		repackager.setBackupSource(false);
		repackager.repackage(this::getLibraries);
	}

	private void getLibraries(LibraryCallback callback) throws IOException {
		// Build system specific implementation, callback for each dependency
		for (File nestedJar : getCompileScopeJars()) {
			callback.library(new Library(nestedJar, LibraryScope.COMPILE));
		}
		// ...
	}

	private List<File> getCompileScopeJars() {
		return ...
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.loader.tools.Library
import org.springframework.boot.loader.tools.LibraryCallback
import org.springframework.boot.loader.tools.LibraryScope
import org.springframework.boot.loader.tools.Repackager
import java.io.File
import java.io.IOException

class MyBuildTool {

	@Throws(IOException::class)
	fun build() {
		val sourceJarFile: File? =  ...
		val repackager = Repackager(sourceJarFile)
		repackager.setBackupSource(false)
		repackager.repackage { callback: LibraryCallback -> getLibraries(callback) }
	}

	@Throws(IOException::class)
	private fun getLibraries(callback: LibraryCallback) {
		// Build system specific implementation, callback for each dependency
		for (nestedJar in getCompileScopeJars()!!) {
			callback.library(Library(nestedJar, LibraryScope.COMPILE))
		}
		// ...
	}

	private fun getCompileScopeJars(): List<File?>? {
		return  ...
	}

}
```
