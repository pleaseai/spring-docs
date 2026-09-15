---
title: "MockMvc and HtmlUnit"
source: "ROOT:testing/spring-mvc-test-framework/server-htmlunit/mah.adoc"
---

<a id="spring-mvc-test-server-htmlunit-mah"></a>

# MockMvc and HtmlUnit

This section describes how to integrate MockMvc and HtmlUnit. Use this option if you want
to use the raw HtmlUnit libraries.

<a id="spring-mvc-test-server-htmlunit-mah-setup"></a>

## MockMvc and HtmlUnit Setup

First, make sure that you have included a test dependency on
`net.sourceforge.htmlunit:htmlunit`. In order to use HtmlUnit with Apache HttpComponents
4.5+, you need to use HtmlUnit 2.18 or higher.

We can easily create an HtmlUnit `WebClient` that integrates with MockMvc by using the
`MockMvcWebClientBuilder`, as follows:

#### Java

```java
WebClient webClient;

@BeforeEach
void setup(WebApplicationContext context) {
	webClient = MockMvcWebClientBuilder
			.webAppContextSetup(context)
			.build();
}
```

#### Kotlin

```kotlin
lateinit var webClient: WebClient

@BeforeEach
fun setup(context: WebApplicationContext) {
	webClient = MockMvcWebClientBuilder
			.webAppContextSetup(context)
			.build()
}
```

> [!NOTE]
> This is a simple example of using `MockMvcWebClientBuilder`. For advanced usage,
> see [Advanced `MockMvcWebClientBuilder`](#spring-mvc-test-server-htmlunit-mah-advanced-builder).

This ensures that any URL that references `localhost` as the server is directed to our
`MockMvc` instance without the need for a real HTTP connection. Any other URL is
requested by using a network connection, as normal. This lets us easily test the use of
CDNs.

<a id="spring-mvc-test-server-htmlunit-mah-usage"></a>

## MockMvc and HtmlUnit Usage

Now we can use HtmlUnit as we normally would but without the need to deploy our
application to a Servlet container. For example, we can request the view to create a
message with the following:

#### Java

```java
HtmlPage createMsgFormPage = webClient.getPage("http://localhost/messages/form");
```

#### Kotlin

```kotlin
val createMsgFormPage = webClient.getPage("http://localhost/messages/form")
```

> [!NOTE]
> The default context path is `""`. Alternatively, we can specify the context path,
> as described in [Advanced `MockMvcWebClientBuilder`](#spring-mvc-test-server-htmlunit-mah-advanced-builder).

Once we have a reference to the `HtmlPage`, we can then fill out the form and submit it
to create a message, as the following example shows:

#### Java

```java
HtmlForm form = createMsgFormPage.getHtmlElementById("messageForm");
HtmlTextInput summaryInput = createMsgFormPage.getHtmlElementById("summary");
summaryInput.setValueAttribute("Spring Rocks");
HtmlTextArea textInput = createMsgFormPage.getHtmlElementById("text");
textInput.setText("In case you didn't know, Spring Rocks!");
HtmlSubmitInput submit = form.getOneHtmlElementByAttribute("input", "type", "submit");
HtmlPage newMessagePage = submit.click();
```

#### Kotlin

```kotlin
val form = createMsgFormPage.getHtmlElementById("messageForm")
val summaryInput = createMsgFormPage.getHtmlElementById("summary")
summaryInput.setValueAttribute("Spring Rocks")
val textInput = createMsgFormPage.getHtmlElementById("text")
textInput.setText("In case you didn't know, Spring Rocks!")
val submit = form.getOneHtmlElementByAttribute("input", "type", "submit")
val newMessagePage = submit.click()
```

Finally, we can verify that a new message was created successfully. The following
assertions use the [AssertJ](https://assertj.github.io/doc/) library:

#### Java

```java
assertThat(newMessagePage.getUrl().toString()).endsWith("/messages/123");
String id = newMessagePage.getHtmlElementById("id").getTextContent();
assertThat(id).isEqualTo("123");
String summary = newMessagePage.getHtmlElementById("summary").getTextContent();
assertThat(summary).isEqualTo("Spring Rocks");
String text = newMessagePage.getHtmlElementById("text").getTextContent();
assertThat(text).isEqualTo("In case you didn't know, Spring Rocks!");
```

#### Kotlin

```kotlin
assertThat(newMessagePage.getUrl().toString()).endsWith("/messages/123")
val id = newMessagePage.getHtmlElementById("id").getTextContent()
assertThat(id).isEqualTo("123")
val summary = newMessagePage.getHtmlElementById("summary").getTextContent()
assertThat(summary).isEqualTo("Spring Rocks")
val text = newMessagePage.getHtmlElementById("text").getTextContent()
assertThat(text).isEqualTo("In case you didn't know, Spring Rocks!")
```

The preceding code improves on our
[MockMvc test](why.md#spring-mvc-test-server-htmlunit-mock-mvc-test) in a number of ways.
First, we no longer have to explicitly verify our form and then create a request that
looks like the form. Instead, we request the form, fill it out, and submit it, thereby
significantly reducing the overhead.

Another important factor is that [HtmlUnit
uses the Mozilla Rhino engine](https://htmlunit.sourceforge.io/javascript.html) to evaluate JavaScript. This means that we can also test
the behavior of JavaScript within our pages.

See the [HtmlUnit documentation](https://htmlunit.sourceforge.io/gettingStarted.html) for
additional information about using HtmlUnit.

<a id="spring-mvc-test-server-htmlunit-mah-advanced-builder"></a>

## Advanced `MockMvcWebClientBuilder`

In the examples so far, we have used `MockMvcWebClientBuilder` in the simplest way
possible, by building a `WebClient` based on the `WebApplicationContext` loaded for us by
the Spring TestContext Framework. This approach is repeated in the following example:

#### Java

```java
WebClient webClient;

@BeforeEach
void setup(WebApplicationContext context) {
	webClient = MockMvcWebClientBuilder
			.webAppContextSetup(context)
			.build();
}
```

#### Kotlin

```kotlin
lateinit var webClient: WebClient

@BeforeEach
fun setup(context: WebApplicationContext) {
	webClient = MockMvcWebClientBuilder
			.webAppContextSetup(context)
			.build()
}
```

We can also specify additional configuration options, as the following example shows:

#### Java

```java
WebClient webClient;

@BeforeEach
void setup() {
	webClient = MockMvcWebClientBuilder
		// demonstrates applying a MockMvcConfigurer (Spring Security)
		.webAppContextSetup(context, springSecurity())
		// for illustration only - defaults to ""
		.contextPath("")
		// By default MockMvc is used for localhost only;
		// the following will use MockMvc for example.com and example.org as well
		.useMockMvcForHosts("example.com","example.org")
		.build();
}
```

#### Kotlin

```kotlin
lateinit var webClient: WebClient

@BeforeEach
fun setup() {
	webClient = MockMvcWebClientBuilder
		// demonstrates applying a MockMvcConfigurer (Spring Security)
		.webAppContextSetup(context, springSecurity())
		// for illustration only - defaults to ""
		.contextPath("")
		// By default MockMvc is used for localhost only;
		// the following will use MockMvc for example.com and example.org as well
		.useMockMvcForHosts("example.com","example.org")
		.build()
}
```

As an alternative, we can perform the exact same setup by configuring the `MockMvc`
instance separately and supplying it to the `MockMvcWebClientBuilder`, as follows:

#### Java

```java
MockMvc mockMvc = MockMvcBuilders
		.webAppContextSetup(context)
		.apply(springSecurity())
		.build();

webClient = MockMvcWebClientBuilder
		.mockMvcSetup(mockMvc)
		// for illustration only - defaults to ""
		.contextPath("")
		// By default MockMvc is used for localhost only;
		// the following will use MockMvc for example.com and example.org as well
		.useMockMvcForHosts("example.com","example.org")
		.build();
```

#### Kotlin

```kotlin
// Not possible in Kotlin until https://youtrack.jetbrains.com/issue/KT-22208 is fixed
```

This is more verbose, but, by building the `WebClient` with a `MockMvc` instance, we have
the full power of MockMvc at our fingertips.

> [!TIP]
> For additional information on creating a `MockMvc` instance, see
> [Setup Choices](../server-setup-options.md).
