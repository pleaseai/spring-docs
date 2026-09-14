---
title: "JSON"
source: "reference:features/json.adoc"
---

<a id="features.json"></a>

# JSON

Spring Boot provides integration with three JSON mapping libraries:

- Gson
- Jackson
- JSON-B

Jackson is the preferred and default library.

<a id="features.json.jackson"></a>

## Jackson

Auto-configuration for Jackson is provided and Jackson is part of `spring-boot-starter-json`.
When Jackson is on the classpath an [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.1/com/fasterxml/jackson/databind/ObjectMapper.html) bean is automatically configured.
Several configuration properties are provided for [customizing the configuration of the [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.1/com/fasterxml/jackson/databind/ObjectMapper.html)](../../how-to/spring-mvc.md#howto.spring-mvc.customize-jackson-objectmapper).

<a id="features.json.jackson.custom-serializers-and-deserializers"></a>

### Custom Serializers and Deserializers

If you use Jackson to serialize and deserialize JSON data, you might want to write your own [`JsonSerializer`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.1/com/fasterxml/jackson/databind/JsonSerializer.html) and [`JsonDeserializer`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.1/com/fasterxml/jackson/databind/JsonDeserializer.html) classes.
Custom serializers are usually [registered with Jackson through a module](https://github.com/FasterXML/jackson-docs/wiki/JacksonHowToCustomSerializers), but Spring Boot provides an alternative [`@JsonComponent`](https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/jackson/JsonComponent.html) annotation that makes it easier to directly register Spring Beans.

You can use the [`@JsonComponent`](https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/jackson/JsonComponent.html) annotation directly on [`JsonSerializer`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.1/com/fasterxml/jackson/databind/JsonSerializer.html), [`JsonDeserializer`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.1/com/fasterxml/jackson/databind/JsonDeserializer.html) or [`KeyDeserializer`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.1/com/fasterxml/jackson/databind/KeyDeserializer.html) implementations.
You can also use it on classes that contain serializers/deserializers as inner classes, as shown in the following example:

#### Java

```java
import java.io.IOException;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.ObjectCodec;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import org.springframework.boot.jackson.JsonComponent;

@JsonComponent
public class MyJsonComponent {

	public static class Serializer extends JsonSerializer<MyObject> {

		@Override
		public void serialize(MyObject value, JsonGenerator jgen, SerializerProvider serializers) throws IOException {
			jgen.writeStartObject();
			jgen.writeStringField("name", value.getName());
			jgen.writeNumberField("age", value.getAge());
			jgen.writeEndObject();
		}

	}

	public static class Deserializer extends JsonDeserializer<MyObject> {

		@Override
		public MyObject deserialize(JsonParser jsonParser, DeserializationContext ctxt) throws IOException {
			ObjectCodec codec = jsonParser.getCodec();
			JsonNode tree = codec.readTree(jsonParser);
			String name = tree.get("name").textValue();
			int age = tree.get("age").intValue();
			return new MyObject(name, age);
		}

	}

}
```

#### Kotlin

```kotlin
import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.core.JsonProcessingException
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.JsonSerializer
import com.fasterxml.jackson.databind.SerializerProvider
import org.springframework.boot.jackson.JsonComponent
import java.io.IOException

@JsonComponent
class MyJsonComponent {

	class Serializer : JsonSerializer<MyObject>() {
		@Throws(IOException::class)
		override fun serialize(value: MyObject, jgen: JsonGenerator, serializers: SerializerProvider) {
			jgen.writeStartObject()
			jgen.writeStringField("name", value.name)
			jgen.writeNumberField("age", value.age)
			jgen.writeEndObject()
		}
	}

	class Deserializer : JsonDeserializer<MyObject>() {
		@Throws(IOException::class, JsonProcessingException::class)
		override fun deserialize(jsonParser: JsonParser, ctxt: DeserializationContext): MyObject {
			val codec = jsonParser.codec
			val tree = codec.readTree<JsonNode>(jsonParser)
			val name = tree["name"].textValue()
			val age = tree["age"].intValue()
			return MyObject(name, age)
		}
	}

}
```

All [`@JsonComponent`](https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/jackson/JsonComponent.html) beans in the [`ApplicationContext`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ApplicationContext.html) are automatically registered with Jackson.
Because [`@JsonComponent`](https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/jackson/JsonComponent.html) is meta-annotated with [`@Component`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/stereotype/Component.html), the usual component-scanning rules apply.

Spring Boot also provides [`JsonObjectSerializer`](https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/jackson/JsonObjectSerializer.html) and [`JsonObjectDeserializer`](https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/jackson/JsonObjectDeserializer.html) base classes that provide useful alternatives to the standard Jackson versions when serializing objects.
See [`JsonObjectSerializer`](https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/jackson/JsonObjectSerializer.html) and [`JsonObjectDeserializer`](https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/jackson/JsonObjectDeserializer.html) in the API documentation for details.

The example above can be rewritten to use [`JsonObjectSerializer`](https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/jackson/JsonObjectSerializer.html)/`JsonObjectDeserializer` as follows:

#### Java

```java
import java.io.IOException;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.ObjectCodec;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.SerializerProvider;

import org.springframework.boot.jackson.JsonComponent;
import org.springframework.boot.jackson.JsonObjectDeserializer;
import org.springframework.boot.jackson.JsonObjectSerializer;

@JsonComponent
public class MyJsonComponent {

	public static class Serializer extends JsonObjectSerializer<MyObject> {

		@Override
		protected void serializeObject(MyObject value, JsonGenerator jgen, SerializerProvider provider)
				throws IOException {
			jgen.writeStringField("name", value.getName());
			jgen.writeNumberField("age", value.getAge());
		}

	}

	public static class Deserializer extends JsonObjectDeserializer<MyObject> {

		@Override
		protected MyObject deserializeObject(JsonParser jsonParser, DeserializationContext context, ObjectCodec codec,
				JsonNode tree) throws IOException {
			String name = nullSafeValue(tree.get("name"), String.class);
			int age = nullSafeValue(tree.get("age"), Integer.class);
			return new MyObject(name, age);
		}

	}

}
```

#### Kotlin

```kotlin
import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.core.ObjectCodec
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.SerializerProvider
import org.springframework.boot.jackson.JsonComponent
import org.springframework.boot.jackson.JsonObjectDeserializer
import org.springframework.boot.jackson.JsonObjectSerializer
import java.io.IOException

@JsonComponent
class MyJsonComponent {

	class Serializer : JsonObjectSerializer<MyObject>() {
		@Throws(IOException::class)
		override fun serializeObject(value: MyObject, jgen: JsonGenerator, provider: SerializerProvider) {
			jgen.writeStringField("name", value.name)
			jgen.writeNumberField("age", value.age)
		}
	}

	class Deserializer : JsonObjectDeserializer<MyObject>() {
		@Throws(IOException::class)
		override fun deserializeObject(jsonParser: JsonParser, context: DeserializationContext,
				codec: ObjectCodec, tree: JsonNode): MyObject {
			val name = nullSafeValue(tree["name"], String::class.java)
			val age = nullSafeValue(tree["age"], Int::class.java)
			return MyObject(name, age)
		}
	}

}
```

<a id="features.json.jackson.mixins"></a>

### Mixins

Jackson has support for mixins that can be used to mix additional annotations into those already declared on a target class.
Spring Boot’s Jackson auto-configuration will scan your application’s packages for classes annotated with [`@JsonMixin`](https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/jackson/JsonMixin.html) and register them with the auto-configured [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.1/com/fasterxml/jackson/databind/ObjectMapper.html).
The registration is performed by Spring Boot’s [`JsonMixinModule`](https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/jackson/JsonMixinModule.html).

<a id="features.json.gson"></a>

## Gson

Auto-configuration for Gson is provided.
When Gson is on the classpath a [`Gson`](https://javadoc.io/doc/com.google.code.gson/gson/2.11.0/com/google/gson/Gson.html) bean is automatically configured.
Several `spring.gson.*` configuration properties are provided for customizing the configuration.
To take more control, one or more [`GsonBuilderCustomizer`](https://docs.spring.io/spring-boot/3.4.0/api/java/org/springframework/boot/autoconfigure/gson/GsonBuilderCustomizer.html) beans can be used.

<a id="features.json.json-b"></a>

## JSON-B

Auto-configuration for JSON-B is provided.
When the JSON-B API and an implementation are on the classpath a [`Jsonb`](https://jakarta.ee/specifications/jsonb/3.0/apidocs/jakarta/json/bind/Jsonb.html) bean will be automatically configured.
The preferred JSON-B implementation is Eclipse Yasson for which dependency management is provided.
