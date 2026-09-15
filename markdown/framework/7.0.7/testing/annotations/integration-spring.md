---
title: "Spring Testing Annotations"
source: "ROOT:testing/annotations/integration-spring.adoc"
---

<a id="integration-testing-annotations-spring"></a>

# Spring Testing Annotations

The Spring Framework provides the following set of Spring-specific annotations that you
can use in your unit and integration tests in conjunction with the TestContext framework.
See the corresponding javadoc for further information, including default attribute
values, attribute aliases, and other details.

Spring’s testing annotations include the following:

- [`@BootstrapWith`](integration-spring/annotation-bootstrapwith.md)
- [`@ContextConfiguration`](integration-spring/annotation-contextconfiguration.md)
- [`@WebAppConfiguration`](integration-spring/annotation-webappconfiguration.md)
- [`@ContextHierarchy`](integration-spring/annotation-contexthierarchy.md)
- [`@ContextCustomizerFactories`](integration-spring/annotation-contextcustomizerfactories.md)
- [`@ActiveProfiles`](integration-spring/annotation-activeprofiles.md)
- [`@TestPropertySource`](integration-spring/annotation-testpropertysource.md)
- [`@DynamicPropertySource`](integration-spring/annotation-dynamicpropertysource.md)
- [`@TestBean`](integration-spring/annotation-testbean.md)
- [`@MockitoBean` and `@MockitoSpyBean`](integration-spring/annotation-mockitobean.md)
- [`@DirtiesContext`](integration-spring/annotation-dirtiescontext.md)
- [`@TestExecutionListeners`](integration-spring/annotation-testexecutionlisteners.md)
- [`@RecordApplicationEvents`](integration-spring/annotation-recordapplicationevents.md)
- [`@Commit`](integration-spring/annotation-commit.md)
- [`@Rollback`](integration-spring/annotation-rollback.md)
- [`@BeforeTransaction`](integration-spring/annotation-beforetransaction.md)
- [`@AfterTransaction`](integration-spring/annotation-aftertransaction.md)
- [`@Sql`](integration-spring/annotation-sql.md)
- [`@SqlConfig`](integration-spring/annotation-sqlconfig.md)
- [`@SqlMergeMode`](integration-spring/annotation-sqlmergemode.md)
- [`@SqlGroup`](integration-spring/annotation-sqlgroup.md)
- [`@DisabledInAotMode`](integration-spring/annotation-disabledinaotmode.md)
