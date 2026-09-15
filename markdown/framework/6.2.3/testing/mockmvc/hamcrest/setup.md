---
title: "Configuring MockMvc"
source: "ROOT:testing/mockmvc/hamcrest/setup.adoc"
---

<a id="mockmvc-setup"></a>

# Configuring MockMvc

MockMvc can be setup in one of two ways. One is to point directly to the controllers you
want to test and programmatically configure Spring MVC infrastructure. The second is to
point to Spring configuration with Spring MVC and controller infrastructure in it.

> [!TIP]
> For a comparison of those two modes, check [Setup Options](../setup-options.md).

To set up MockMvc for testing a specific controller, use the following:

#### Java

```java
class MyWebTests {

	MockMvc mockMvc;

	@BeforeEach
	void setup() {
		this.mockMvc = MockMvcBuilders.standaloneSetup(new AccountController()).build();
	}

	// ...

}
```

#### Kotlin

```kotlin
class MyWebTests {

	lateinit var mockMvc : MockMvc

	@BeforeEach
	fun setup() {
		mockMvc = MockMvcBuilders.standaloneSetup(AccountController()).build()
	}

	// ...

}
```

Or you can also use this setup when testing through the
[WebTestClient](../../webtestclient.md#webtestclient-controller-config) which delegates to the same builder
as shown above.

To set up MockMvc through Spring configuration, use the following:

#### Java

```java
@SpringJUnitWebConfig(locations = "my-servlet-context.xml")
class MyWebTests {

	MockMvc mockMvc;

	@BeforeEach
	void setup(WebApplicationContext wac) {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(wac).build();
	}

	// ...

}
```

#### Kotlin

```kotlin
@SpringJUnitWebConfig(locations = ["my-servlet-context.xml"])
class MyWebTests {

	lateinit var mockMvc: MockMvc

	@BeforeEach
	fun setup(wac: WebApplicationContext) {
		mockMvc = MockMvcBuilders.webAppContextSetup(wac).build()
	}

	// ...

}
```

Or you can also use this setup when testing through the
[WebTestClient](../../webtestclient.md#webtestclient-context-config) which delegates to the same builder
as shown above.
