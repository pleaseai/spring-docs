---
title: "RSS and Atom"
source: "ROOT:web/webmvc-view/mvc-feeds.adoc"
---

<a id="mvc-view-feeds"></a>

# RSS and Atom

Both `AbstractAtomFeedView` and `AbstractRssFeedView` inherit from the
`AbstractFeedView` base class and are used to provide Atom and RSS Feed views, respectively. They
are based on [ROME](https://rometools.github.io/rome/) project and are located in the
package `org.springframework.web.servlet.view.feed`.

`AbstractAtomFeedView` requires you to implement the `buildFeedEntries()` method and
optionally override the `buildFeedMetadata()` method (the default implementation is
empty). The following example shows how to do so:

#### Java

```java
public class SampleContentAtomView extends AbstractAtomFeedView {

	@Override
	protected void buildFeedMetadata(Map<String, Object> model,
			Feed feed, HttpServletRequest request) {
		// implementation omitted
	}

	@Override
	protected List<Entry> buildFeedEntries(Map<String, Object> model,
			HttpServletRequest request, HttpServletResponse response) throws Exception {
		// implementation omitted
	}
}
```

#### Kotlin

```kotlin
class SampleContentAtomView : AbstractAtomFeedView() {

	override fun buildFeedMetadata(model: Map<String, Any>,
			feed: Feed, request: HttpServletRequest) {
		// implementation omitted
	}

	override fun buildFeedEntries(model: Map<String, Any>,
			request: HttpServletRequest, response: HttpServletResponse): List<Entry> {
		// implementation omitted
	}
}
```

Similar requirements apply for implementing `AbstractRssFeedView`, as the following example shows:

#### Java

```java
public class SampleContentRssView extends AbstractRssFeedView {

	@Override
	protected void buildFeedMetadata(Map<String, Object> model,
			Channel feed, HttpServletRequest request) {
		// implementation omitted
	}

	@Override
	protected List<Item> buildFeedItems(Map<String, Object> model,
			HttpServletRequest request, HttpServletResponse response) throws Exception {
		// implementation omitted
	}
}
```

#### Kotlin

```kotlin
class SampleContentRssView : AbstractRssFeedView() {

	override fun buildFeedMetadata(model: Map<String, Any>,
								feed: Channel, request: HttpServletRequest) {
		// implementation omitted
	}

	override fun buildFeedItems(model: Map<String, Any>,
			request: HttpServletRequest, response: HttpServletResponse): List<Item> {
		// implementation omitted
	}
}
```

The `buildFeedItems()` and `buildFeedEntries()` methods pass in the HTTP request, in case
you need to access the Locale. The HTTP response is passed in only for the setting of
cookies or other HTTP headers. The feed is automatically written to the response
object after the method returns.

For an example of creating an Atom view, see Alef Arendsen’s Spring Team Blog
[entry](https://spring.io/blog/2009/03/16/adding-an-atom-view-to-an-application-using-spring-s-rest-support).
