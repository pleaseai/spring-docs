---
title: "HtmlUnit Integration"
source: "ROOT:testing/mockmvc/htmlunit.adoc"
---

<a id="mockmvc-server-htmlunit"></a>

# HtmlUnit Integration

Spring provides integration between [MockMvc](overview.md) and
[HtmlUnit](https://htmlunit.sourceforge.io/). This simplifies performing end-to-end testing
when using HTML-based views. This integration lets you:

- Easily test HTML pages by using tools such as
[HtmlUnit](https://htmlunit.sourceforge.io/),
[WebDriver](https://www.seleniumhq.org), and
[Geb](https://www.gebish.org/manual/current/#spock-junit-testng) without the need to
deploy to a Servlet container.
- Test JavaScript within pages.
- Optionally, test using mock services to speed up testing.
- Share logic between in-container end-to-end tests and out-of-container integration tests.

> [!NOTE]
> MockMvc works with templating technologies that do not rely on a Servlet Container
> (for example, Thymeleaf, FreeMarker, and others), but it does not work with JSPs, since
> they rely on the Servlet container.
