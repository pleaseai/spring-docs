---
title: "Multipart Content"
source: "ROOT:web/webflux/controller/ann-methods/multipart-forms.adoc"
---

<a id="webflux-multipart-forms"></a>

# Multipart Content

[See equivalent in the Servlet stack](../../../webmvc/mvc-controller/ann-methods/multipart-forms.md)

As explained in [Multipart Data](../../reactive-spring.md#webflux-multipart), `ServerWebExchange` provides access to multipart
content. The best way to handle a file upload form (for example, from a browser) in a controller
is through data binding to a [command object](modelattrib-method-args.md),
as the following example shows:

#### Java

```java
class MyForm {

	private String name;

	private MultipartFile file;

	// ...

}

@Controller
public class FileUploadController {

	@PostMapping("/form")
	public String handleFormUpload(MyForm form, BindingResult errors) {
		// ...
	}

}
```

#### Kotlin

```kotlin
class MyForm(
		val name: String,
		val file: MultipartFile)

@Controller
class FileUploadController {

	@PostMapping("/form")
	fun handleFormUpload(form: MyForm, errors: BindingResult): String {
		// ...
	}

}
```

You can also submit multipart requests from non-browser clients in a RESTful service
scenario. The following example uses a file along with JSON:

```
POST /someUrl
Content-Type: multipart/mixed

--edt7Tfrdusa7r3lNQc79vXuhIIMlatb7PQg7Vp
Content-Disposition: form-data; name="meta-data"
Content-Type: application/json; charset=UTF-8
Content-Transfer-Encoding: 8bit

{
	"name": "value"
}
--edt7Tfrdusa7r3lNQc79vXuhIIMlatb7PQg7Vp
Content-Disposition: form-data; name="file-data"; filename="file.properties"
Content-Type: text/xml
Content-Transfer-Encoding: 8bit
... File Data ...
```

You can access individual parts with `@RequestPart`, as the following example shows:

#### Java

```java
@PostMapping("/")
public String handle(@RequestPart("meta-data") Part metadata, // <1>
		@RequestPart("file-data") FilePart file) { // <2>
	// ...
}
```

1. Using `@RequestPart` to get the metadata.
1. Using `@RequestPart` to get the file.

#### Kotlin

```kotlin
@PostMapping("/")
fun handle(@RequestPart("meta-data") Part metadata, // <1>
		@RequestPart("file-data") FilePart file): String { // <2>
	// ...
}
```

1. Using `@RequestPart` to get the metadata.
1. Using `@RequestPart` to get the file.

To deserialize the raw part content (for example, to JSON — similar to `@RequestBody`),
you can declare a concrete target `Object`, instead of `Part`, as the following example shows:

#### Java

```java
@PostMapping("/")
public String handle(@RequestPart("meta-data") MetaData metadata) { // <1>
	// ...
}
```

1. Using `@RequestPart` to get the metadata.

#### Kotlin

```kotlin
@PostMapping("/")
fun handle(@RequestPart("meta-data") metadata: MetaData): String { // <1>
	// ...
}
```

1. Using `@RequestPart` to get the metadata.

You can use `@RequestPart` in combination with `jakarta.validation.Valid` or Spring’s
`@Validated` annotation, which causes Standard Bean Validation to be applied. Validation
errors lead to a `WebExchangeBindException` that results in a 400 (BAD\_REQUEST) response.
The exception contains a `BindingResult` with the error details and can also be handled
in the controller method by declaring the argument with an async wrapper and then using
error related operators:

#### Java

```java
@PostMapping("/")
public String handle(@Valid @RequestPart("meta-data") Mono<MetaData> metadata) {
	// use one of the onError* operators...
}
```

#### Kotlin

```kotlin
@PostMapping("/")
fun handle(@Valid @RequestPart("meta-data") metadata: MetaData): String {
	// ...
}
```

If method validation applies because other parameters have `@Constraint` annotations,
then `HandlerMethodValidationException` is raised instead. See the section on
[Validation](../ann-validation.md).

To access all multipart data as a `MultiValueMap`, you can use `@RequestBody`,
as the following example shows:

#### Java

```java
@PostMapping("/")
public String handle(@RequestBody Mono<MultiValueMap<String, Part>> parts) { // <1>
	// ...
}
```

1. Using `@RequestBody`.

#### Kotlin

```kotlin
@PostMapping("/")
fun handle(@RequestBody parts: MultiValueMap<String, Part>): String { // <1>
	// ...
}
```

1. Using `@RequestBody`.

<a id="partevent"></a>

## `PartEvent`

To access multipart data sequentially, in a streaming fashion, you can use `@RequestBody` with
`Flux<PartEvent>` (or `Flow<PartEvent>` in Kotlin).
Each part in a multipart HTTP message will produce at
least one `PartEvent` containing both headers and a buffer with the contents of the part.

- Form fields will produce a **single** `FormPartEvent`, containing the value of the field.
- File uploads will produce **one or more** `FilePartEvent` objects, containing the filename used
when uploading. If the file is large enough to be split across multiple buffers, the first
`FilePartEvent` will be followed by subsequent events.

For example:

#### Java

```java
@PostMapping("/")
public void handle(@RequestBody Flux<PartEvent> allPartsEvents) { <1>
    allPartsEvents.windowUntil(PartEvent::isLast) <2>
            .concatMap(p -> p.switchOnFirst((signal, partEvents) -> { <3>
                if (signal.hasValue()) {
                    PartEvent event = signal.get();
                    if (event instanceof FormPartEvent formEvent) { <4>
                        String value = formEvent.value();
                        // handle form field
                    }
                    else if (event instanceof FilePartEvent fileEvent) { <5>
                        String filename = fileEvent.filename();
                        Flux<DataBuffer> contents = partEvents.map(PartEvent::content); <6>
                        // handle file upload
                    }
                    else {
                        return Mono.error(new RuntimeException("Unexpected event: " + event));
                    }
                }
                else {
                    return partEvents; // either complete or error signal
                }
            }));
}
```

1. Using `@RequestBody`.
1. The final `PartEvent` for a particular part will have `isLast()` set to `true`, and can be
followed by additional events belonging to subsequent parts.
This makes the `isLast` property suitable as a predicate for the `Flux::windowUntil` operator, to
split events from all parts into windows that each belong to a single part.
1. The `Flux::switchOnFirst` operator allows you to see whether you are handling a form field or
file upload.
1. Handling the form field.
1. Handling the file upload.
1. The body contents must be completely consumed, relayed, or released to avoid memory leaks.

#### Kotlin

```kotlin
	@PostMapping("/")
	fun handle(@RequestBody allPartsEvents: Flux<PartEvent>) = { // <1>
      allPartsEvents.windowUntil(PartEvent::isLast) <2>
          .concatMap {
              it.switchOnFirst { signal, partEvents -> <3>
                  if (signal.hasValue()) {
                      val event = signal.get()
                      if (event is FormPartEvent) { <4>
                          val value: String = event.value();
                          // handle form field
                      } else if (event is FilePartEvent) { <5>
                          val filename: String = event.filename();
                          val contents: Flux<DataBuffer> = partEvents.map(PartEvent::content); <6>
                          // handle file upload
                      } else {
                          return Mono.error(RuntimeException("Unexpected event: " + event));
                      }
                  } else {
                      return partEvents; // either complete or error signal
                  }
              }
          }
}
```

1. Using `@RequestBody`.
1. The final `PartEvent` for a particular part will have `isLast()` set to `true`, and can be
followed by additional events belonging to subsequent parts.
This makes the `isLast` property suitable as a predicate for the `Flux::windowUntil` operator, to
split events from all parts into windows that each belong to a single part.
1. The `Flux::switchOnFirst` operator allows you to see whether you are handling a form field or
file upload.
1. Handling the form field.
1. Handling the file upload.
1. The body contents must be completely consumed, relayed, or released to avoid memory leaks.

Received part events can also be relayed to another service by using the `WebClient`.
See [Multipart Data](../../../webflux-webclient/client-body.md#webflux-client-body-multipart).
