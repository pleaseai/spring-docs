---
title: "Further Resources"
source: "ROOT:testing/resources.adoc"
---

<a id="testing-resources"></a>

# Further Resources

**[JUnit](https://www.junit.org/) **

"A programmer-friendly testing framework for Java and the JVM". Used by the Spring
Framework in its test suite and supported in the
[Spring TestContext Framework](testcontext-framework.md).

**[TestNG](https://testng.org/) **

A testing framework inspired by JUnit with added support for test groups, data-driven
testing, distributed testing, and other features. Supported in the
[Spring TestContext Framework](testcontext-framework.md).

**[AssertJ](https://assertj.github.io/doc) **

"Fluent assertions for Java", including support for Java 8 lambdas, streams, and
numerous other features. Supported in Spring’s
[MockMvc testing support](mockmvc/assertj.md).

**[Mock Objects](https://en.wikipedia.org/wiki/Mock_Object) **

Article in Wikipedia.

**[Mockito](https://site.mockito.org) **

Java mock library based on the [Test Spy](http://xunitpatterns.com/Test%20Spy.html)
pattern. Used by the Spring Framework in its test suite.

**[EasyMock](https://easymock.org/) **

Java library "that provides Mock Objects for interfaces (and objects through the class
extension) by generating them on the fly using Java’s proxy mechanism."

**[JMock](https://jmock.org/) **

Library that supports test-driven development of Java code with mock objects.

**[DbUnit](https://www.dbunit.org/) **

JUnit extension (also usable with Ant and Maven) that is targeted at database-driven
projects and, among other things, puts your database into a known state between test
runs.

**[Testcontainers](https://www.testcontainers.org) **

Java library that supports JUnit tests, providing lightweight, throwaway instances of
common databases, Selenium web browsers, or anything else that can run in a Docker
container.

**[The Grinder](https://sourceforge.net/projects/grinder/) **

Java load testing framework.

**[SpringMockK](https://github.com/Ninja-Squad/springmockk) **

Support for Spring Boot integration tests written in Kotlin using
[MockK](https://mockk.io/) instead of Mockito.
