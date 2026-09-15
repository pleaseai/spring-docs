---
title: "Jackson JSON"
source: "ROOT:web/webmvc/mvc-controller/ann-methods/jackson.adoc"
---

<a id="mvc-ann-jackson"></a>

# Jackson JSON

Spring offers support for the Jackson JSON library.

<a id="mvc-ann-jsonview"></a>

## JSON Views

[See equivalent in the Reactive stack](../../../webflux/controller/ann-methods/jackson.md#webflux-ann-jsonview)

Spring MVC provides built-in support for
[Jackson’s Serialization Views](https://www.baeldung.com/jackson-json-view-annotation),
which allow rendering only a subset of all fields in an `Object`. To use it with
`@ResponseBody` or `ResponseEntity` controller methods, you can use Jackson’s
`@JsonView` annotation to activate a serialization view class, as the following example shows:

#### Java

```java
@RestController
public class UserController {

	@GetMapping("/user")
	@JsonView(User.WithoutPasswordView.class)
	public User getUser() {
		return new User("eric", "7!jd#h23");
	}
}

public class User {

	public interface WithoutPasswordView {};
	public interface WithPasswordView extends WithoutPasswordView {};

	private String username;
	private String password;

	public User() {
	}

	public User(String username, String password) {
		this.username = username;
		this.password = password;
	}

	@JsonView(WithoutPasswordView.class)
	public String getUsername() {
		return this.username;
	}

	@JsonView(WithPasswordView.class)
	public String getPassword() {
		return this.password;
	}
}
```

#### Kotlin

```kotlin
@RestController
class UserController {

	@GetMapping("/user")
	@JsonView(User.WithoutPasswordView::class)
	fun getUser() = User("eric", "7!jd#h23")
}

class User(
		@JsonView(WithoutPasswordView::class) val username: String,
		@JsonView(WithPasswordView::class) val password: String) {

	interface WithoutPasswordView
	interface WithPasswordView : WithoutPasswordView
}
```

> [!NOTE]
> `@JsonView` allows an array of view classes, but you can specify only one per
> controller method. If you need to activate multiple views, you can use a composite interface.

If you want to do the above programmatically, instead of declaring an `@JsonView` annotation,
wrap the return value with `MappingJacksonValue` and use it to supply the serialization view:

#### Java

```java
@RestController
public class UserController {

	@GetMapping("/user")
	public MappingJacksonValue getUser() {
		User user = new User("eric", "7!jd#h23");
		MappingJacksonValue value = new MappingJacksonValue(user);
		value.setSerializationView(User.WithoutPasswordView.class);
		return value;
	}
}
```

#### Kotlin

```kotlin
@RestController
class UserController {

	@GetMapping("/user")
	fun getUser(): MappingJacksonValue {
		val value = MappingJacksonValue(User("eric", "7!jd#h23"))
		value.serializationView = User.WithoutPasswordView::class.java
		return value
	}
}
```

For controllers that rely on view resolution, you can add the serialization view class
to the model, as the following example shows:

#### Java

```java
@Controller
public class UserController extends AbstractController {

	@GetMapping("/user")
	public String getUser(Model model) {
		model.addAttribute("user", new User("eric", "7!jd#h23"));
		model.addAttribute(JsonView.class.getName(), User.WithoutPasswordView.class);
		return "userView";
	}
}
```

#### Kotlin

```kotlin
@Controller
class UserController : AbstractController() {

	@GetMapping("/user")
	fun getUser(model: Model): String {
		model["user"] = User("eric", "7!jd#h23")
		model[JsonView::class.qualifiedName] = User.WithoutPasswordView::class.java
		return "userView"
	}
}
```
