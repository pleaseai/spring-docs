---
title: "Generating Your Own Metadata by Using the Annotation Processor"
source: "specification:configuration-metadata/annotation-processor.adoc"
---

<a id="appendix.configuration-metadata.annotation-processor"></a>

# Generating Your Own Metadata by Using the Annotation Processor

You can easily generate your own configuration metadata file from items annotated with [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/4.0.6/api/java/org/springframework/boot/context/properties/ConfigurationProperties.html) by using the `spring-boot-configuration-processor` jar.
The jar includes a Java annotation processor which is invoked as your project is compiled.

<a id="appendix.configuration-metadata.annotation-processor.configuring"></a>

## Configuring the Annotation Processor

When building with Maven, configure the compiler plugin (3.12.0 or later) to add `spring-boot-configuration-processor` to the annotation processor paths:

```xml
<project>
	<build>
		<plugins>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-compiler-plugin</artifactId>
				<configuration>
					<annotationProcessorPaths>
						<path>
							<groupId>org.springframework.boot</groupId>
							<artifactId>spring-boot-configuration-processor</artifactId>
						</path>
					</annotationProcessorPaths>
				</configuration>
			</plugin>
		</plugins>
	</build>
</project>
```

With Gradle, a dependency should be declared in the `annotationProcessor` configuration, as shown in the following example:

```gradle
dependencies {
	annotationProcessor "org.springframework.boot:spring-boot-configuration-processor"
}
```

If you are using an `additional-spring-configuration-metadata.json` file, the `compileJava` task should be configured to depend on the `processResources` task, as shown in the following example:

```gradle
tasks.named('compileJava') {
	inputs.files(tasks.named('processResources'))
}
```

This dependency ensures that the additional metadata is available when the annotation processor runs during compilation.

> [!NOTE]
> If you are using AspectJ in your project, you need to make sure that the annotation processor runs only once.
> There are several ways to do this.
> With Maven, you can configure the `maven-apt-plugin` explicitly and add the dependency to the annotation processor only there.
> You could also let the AspectJ plugin run all the processing and disable annotation processing in the `maven-compiler-plugin` configuration, as follows:
>
> ```xml
> <plugin>
> 	<groupId>org.apache.maven.plugins</groupId>
> 	<artifactId>maven-compiler-plugin</artifactId>
> 	<configuration>
> 		<proc>none</proc>
> 	</configuration>
> </plugin>
> ```

> [!NOTE]
> If you are using Lombok in your project, you need to make sure that its annotation processor runs before `spring-boot-configuration-processor`.
> To do so with Maven, list the annotation processors in the required order using the `annotationProcessors` attribute of the Maven compiler plugin.
> With Gradle, declare the dependencies in the `annotationProcessor` configuration in the required order.

<a id="appendix.configuration-metadata.annotation-processor.automatic-metadata-generation"></a>

## Automatic Metadata Generation

The processor picks up both classes and methods that are annotated with [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/4.0.6/api/java/org/springframework/boot/context/properties/ConfigurationProperties.html). It also picks classes that are annotated with [`@ConfigurationPropertiesSource`](https://docs.spring.io/spring-boot/4.0.6/api/java/org/springframework/boot/context/properties/ConfigurationPropertiesSource.html)

> [!NOTE]
> Custom annotations that are meta-annotated with either of those annotations are not supported.

If the class has a single parameterized constructor, one property is created per constructor parameter, unless the constructor is annotated with [`@Autowired`](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/beans/factory/annotation/Autowired.html).
If the class has a constructor explicitly annotated with [`@ConstructorBinding`](https://docs.spring.io/spring-boot/4.0.6/api/java/org/springframework/boot/context/properties/bind/ConstructorBinding.html), one property is created per constructor parameter for that constructor.
Otherwise, properties are discovered through the presence of standard getters and setters with special handling for collection and map types (that is detected even if only a getter is present).
The annotation processor also supports the use of the [`@Data`](https://projectlombok.org/api/lombok/Data.html), [`@Value`](https://projectlombok.org/api/lombok/Value.html), [`@Getter`](https://projectlombok.org/api/lombok/Getter.html), and [`@Setter`](https://projectlombok.org/api/lombok/Setter.html) lombok annotations.

Consider the following example:

#### Java

```java
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("my.server")
public class MyServerProperties {

	/**
	 * Name of the server.
	 */
	private String name;

	/**
	 * IP address to listen to.
	 */
	private String ip = "127.0.0.1";

	/**
	 * Port to listener to.
	 */
	private int port = 9797;
	public String getName() {
		return this.name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getIp() {
		return this.ip;
	}

	public void setIp(String ip) {
		this.ip = ip;
	}

	public int getPort() {
		return this.port;
	}

	public void setPort(int port) {
		this.port = port;
	}
}
```

#### Kotlin

```kotlin
import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("my.server")
class MyServerProperties(

	/**
	 * Name of the server.
	 */
	var name: String,

	/**
	 * IP address to listen to.
	 */
	var ip: String = "127.0.0.1",

	/**
	 * Port to listen to.
	 */
	var port: Int = 9797)

```

This exposes three properties where `my.server.name` has no default and `my.server.ip` and `my.server.port` defaults to `"127.0.0.1"` and `9797` respectively.
The Javadoc on fields is used to populate the `description` attribute.
For instance, the description of `my.server.ip` is "IP address to listen to.".

The `description` attribute can only be populated when the type is available as source code that is being compiled.
It will not be populated when the type is only available as a compiled class from a dependency.
For such cases, you can [source the metadata](#appendix.configuration-metadata.annotation-processor.automatic-metadata-generation.source) or [provide manual entries](#appendix.configuration-metadata.annotation-processor.adding-additional-metadata).

> [!NOTE]
> You should only use plain text with [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/4.0.6/api/java/org/springframework/boot/context/properties/ConfigurationProperties.html) field Javadoc, since they are not processed before being added to the JSON.

If you use [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/4.0.6/api/java/org/springframework/boot/context/properties/ConfigurationProperties.html) with record class then record components' descriptions should be provided via class-level Javadoc tag `@param` (there are no explicit instance fields in record classes to put regular field-level Javadocs on).

The annotation processor applies a number of heuristics to extract the default value from the source model.
Default values can only be extracted when the type is available as source code that is being compiled.
They will not be extracted when the type is only available as a compiled class from a dependency.
Furthermore, default values have to be provided statically.
In particular, do not refer to a constant defined in another class.
Also, the annotation processor cannot auto-detect default values for `Collections`s.

For cases where the default value could not be detected, [manual metadata](#appendix.configuration-metadata.annotation-processor.adding-additional-metadata) should be provided.
Consider the following example:

#### Java

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("my.messaging")
public class MyMessagingProperties {

	private List<String> addresses = new ArrayList<>(Arrays.asList("a", "b"));

	private ContainerType containerType = ContainerType.SIMPLE;
	public List<String> getAddresses() {
		return this.addresses;
	}

	public void setAddresses(List<String> addresses) {
		this.addresses = addresses;
	}

	public ContainerType getContainerType() {
		return this.containerType;
	}

	public void setContainerType(ContainerType containerType) {
		this.containerType = containerType;
	}
	public enum ContainerType {

		SIMPLE, DIRECT

	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.context.properties.ConfigurationProperties
import java.util.Arrays

@ConfigurationProperties("my.messaging")
class MyMessagingProperties(

	val addresses: List<String> = ArrayList(Arrays.asList("a", "b")),

	var containerType: ContainerType = ContainerType.SIMPLE) {

	enum class ContainerType {
		SIMPLE, DIRECT
	}
}

```

In order to document default values for properties in the class above, you could add the following content to [the manual metadata of the module](#appendix.configuration-metadata.annotation-processor.adding-additional-metadata):

```json
{"properties": [
	{
		"name": "my.messaging.addresses",
		"defaultValue": ["a", "b"]
	},
	{
		"name": "my.messaging.container-type",
		"defaultValue": "simple"
	}
]}
```

> [!NOTE]
> Only the `name` of the property is required to document additional metadata for existing properties.

<a id="appendix.configuration-metadata.annotation-processor.automatic-metadata-generation.nested-properties"></a>

### Nested Properties

The annotation processor automatically considers inner classes as nested properties.
Rather than documenting the `ip` and `port` at the root of the namespace, we could create a sub-namespace for it.
Consider the updated example:

#### Java

```java
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("my.server")
public class MyServerProperties {

	private String name;

	private Host host;
	public String getName() {
		return this.name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Host getHost() {
		return this.host;
	}

	public void setHost(Host host) {
		this.host = host;
	}
	public static class Host {

		private String ip;

		private int port;
		public String getIp() {
			return this.ip;
		}

		public void setIp(String ip) {
			this.ip = ip;
		}

		public int getPort() {
			return this.port;
		}

		public void setPort(int port) {
			this.port = port;
		}
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("my.server")
class MyServerProperties(
	var name: String,
	var host: Host) {

	class Host(val ip: String, val port: Int = 0)

}

```

The preceding example produces metadata information for `my.server.name`, `my.server.host.ip`, and `my.server.host.port` properties.
You can use the [`@NestedConfigurationProperty`](https://docs.spring.io/spring-boot/4.0.6/api/java/org/springframework/boot/context/properties/NestedConfigurationProperty.html) annotation on a field or a getter method to indicate that a regular (non-inner) class should be treated as if it were nested.

> [!TIP]
> This has no effect on collections and maps, as those types are automatically identified, and a single metadata property is generated for each of them.

<a id="appendix.configuration-metadata.annotation-processor.automatic-metadata-generation.source"></a>

### Configuration Properties Source

If a type located in another module is used in a [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/4.0.6/api/java/org/springframework/boot/context/properties/ConfigurationProperties.html)-annotated type, some metadata elements cannot be discovered automatically.
Reusing the example above, if `Host` is located in another module, full metadata is not available as the annotation processor does not have access to the source of `Host`.

To handle this use case, add the annotation processor in the module that contains the `Host` type and annotate it with [`@ConfigurationPropertiesSource`](https://docs.spring.io/spring-boot/4.0.6/api/java/org/springframework/boot/context/properties/ConfigurationPropertiesSource.html):

#### Java

```java
import org.springframework.boot.context.properties.ConfigurationPropertiesSource;

@ConfigurationPropertiesSource
public class Host {

	/**
	 * IP address to listen to.
	 */
	private String ip = "127.0.0.1";

	/**
	 * Port to listener to.
	 */
	private int port = 9797;
	public String getIp() {
		return this.ip;
	}

	public void setIp(String ip) {
		this.ip = ip;
	}

	public int getPort() {
		return this.port;
	}

	public void setPort(int port) {
		this.port = port;
	}
}
```

#### Kotlin

```kotlin
import org.springframework.boot.context.properties.ConfigurationPropertiesSource

@ConfigurationPropertiesSource
class Host {

	/**
	 * IP address to listen to.
	 */
	var ip: String = "127.0.0.1"

	/**
	 * Port to listener to.
	 */
	var port = 9797

}
```

This generates the metadata for `Host` in `META-INF/spring/configuration-metadata/com.example.Host.json` and is reused automatically by the annotation processor when it handles such type.

You can also annotate a parent class located in another module that a [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/4.0.6/api/java/org/springframework/boot/context/properties/ConfigurationProperties.html)-annotated type extends from.

> [!TIP]
> If you need to reuse metadata for a type that you do not control, create a file named with the pattern above and it will be used as long as it is available on the classpath.

<a id="appendix.configuration-metadata.annotation-processor.adding-additional-metadata"></a>

## Adding Additional Metadata

Spring Boot’s configuration file handling is quite flexible, and it is often the case that properties may exist that are not bound to a [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/4.0.6/api/java/org/springframework/boot/context/properties/ConfigurationProperties.html) bean.
You may also need to tune some attributes of an existing key or to ignore the key altogether.
To support such cases and let you provide custom "hints", the annotation processor automatically merges items from `META-INF/additional-spring-configuration-metadata.json` into the main metadata file.

When generating source metadata for a type, you can also craft custom metadata for that type, for example `com.example.SomeType`, in `META-INF/spring/configuration/metadata/com.example.SomeType.json`.

If you refer to a property that has been detected automatically, the description, default value, and deprecation information are overridden, if specified.
If the manual property declaration is not identified in the current module, it is added as a new property.

The format of the additional metadata file is exactly the same as the regular `spring-configuration-metadata.json`.
The items contained in the “ignored.properties” section are removed from the “properties” section of the generated  `spring-configuration-metadata.json` file.

The additional properties file is optional.
If you do not have any additional properties, do not add the file.
