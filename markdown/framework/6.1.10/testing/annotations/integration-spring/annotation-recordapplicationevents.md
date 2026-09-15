---
title: "`@RecordApplicationEvents`"
source: "ROOT:testing/annotations/integration-spring/annotation-recordapplicationevents.adoc"
---

<a id="spring-testing-annotation-recordapplicationevents"></a>

# `@RecordApplicationEvents`

`@RecordApplicationEvents` is a class-level annotation that is used to instruct the
*Spring TestContext Framework* to record all application events that are published in the
`ApplicationContext` during the execution of a single test.

The recorded events can be accessed via the `ApplicationEvents` API within tests.

See [Application Events](../../testcontext-framework/application-events.md) and the
[`@RecordApplicationEvents`
javadoc](https://docs.spring.io/spring-framework/docs/6.1.10/javadoc-api/org/springframework/test/context/event/RecordApplicationEvents.html) for an example and further details.
