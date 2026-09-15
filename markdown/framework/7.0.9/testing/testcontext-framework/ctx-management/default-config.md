---
title: "Default Context Configuration"
source: "ROOT:testing/testcontext-framework/ctx-management/default-config.adoc"
---

<a id="testcontext-ctx-management-default-config"></a>

# Default Context Configuration

As explained in the sections on
[component classes](javaconfig.md),
[XML resources](xml.md), and
[Groovy scripts](groovy.md), the
TestContext framework will attempt to locate *default* context configuration if you do
not explicitly specify `@Configuration` classes, XML configuration files, or Groovy
scripts from which the test’s `ApplicationContext` should be loaded.

However, due to a bug in the detection algorithm, default context configuration for a
superclass or enclosing class is currently ignored if the type hierarchy or enclosing
class hierarchy (for `@Nested` test classes) does not declare `@ContextConfiguration`.

Beginning with Spring Framework 7.1, the TestContext framework will reliably detect
**all** *default* context configuration within a type hierarchy or enclosing class
hierarchy above a given test class in such scenarios. Consequently, test suites may
encounter issues after the upgrade to 7.1. For example, if a static nested
`@Configuration` class in a superclass or enclosing class is ignored due to the
aforementioned bug, after the bug has been fixed in 7.1 that `@Configuration` class will
no longer be ignored, which may lead to unexpected beans in the resulting
`ApplicationContext` our outright failures in tests.

In the interim, the TestContext framework logs a warning whenever it encounters *default*
context configuration that is currently ignored — for example, a `@Configuration` class
or XML configuration file. The remainder of this section provides guidance on how to
address such issues if you encounter warnings in your test suite.

> [!TIP]
> Annotating the affected subclass or `@Nested` class with `@ContextConfiguration` allows
> you to take matters into your own hands and specify which classes in the hierarchy are
> actually intended to contribute context configuration.

If you do not want static nested `@Configuration` classes to be processed, you can:

- Remove the `@Configuration` declaration.
- Apply `@ContextConfiguration` only where you actually want such classes to be processed.
- Move the static nested `@Configuration` classes to standalone top-level classes so that
they cannot be accidentally interpreted as *default* configuration classes.

Similarly, if you encounter issues with *default* XML configuration files or Groovy
scripts being detected and you do not want them to be processed, you can:

- Apply `@ContextConfiguration` only where you actually want such resources to be
processed.
- Rename the resource files to something that does not match the default naming
convention (such as `*-context.xml` for XML configuration) so that they cannot be
accidentally interpreted as *default* configuration files.
- Move the affected resource files to a different package or filesystem location within
your project.
