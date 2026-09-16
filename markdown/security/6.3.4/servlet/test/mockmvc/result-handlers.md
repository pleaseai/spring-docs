---
title: "SecurityMockMvcResultHandlers"
source: "ROOT:servlet/test/mockmvc/result-handlers.adoc"
---

# SecurityMockMvcResultHandlers

Spring Security provides a few `ResultHandler`s implementations.
In order to use Spring Security’s `ResultHandler`s implementations ensure the following static import is used:

```java
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultHandlers.*;
```

<a id="_exporting_the_securitycontext"></a>

## Exporting the SecurityContext

Often times we want to query a repository to see if some `MockMvc` request actually persisted in the database.
In some cases our repository query uses the [Spring Data Integration](../../../features/integrations/data.md) to filter the results based on current user’s username or any other property.
Let’s see an example:

A repository interface:

```java
private interface MessageRepository extends JpaRepository<Message, Long> {
	@Query("SELECT m.content FROM Message m WHERE m.sentBy = ?#{ principal?.name }")
	List<String> findAllUserMessages();
}
```

Our test scenario:

```java
mvc
	.perform(post("/message")
		.content("New Message")
		.contentType(MediaType.TEXT_PLAIN)
	)
	.andExpect(status().isOk());

List<String> userMessages = messageRepository.findAllUserMessages();
assertThat(userMessages).hasSize(1);
```

This test won’t pass because after our request finishes, the `SecurityContextHolder` will be cleared out by the filter chain.
We can then export the `TestSecurityContextHolder` to our `SecurityContextHolder` and use it as we want:

```java
mvc
	.perform(post("/message")
		.content("New Message")
		.contentType(MediaType.TEXT_PLAIN)
	)
	.andDo(exportTestSecurityContext())
	.andExpect(status().isOk());

List<String> userMessages = messageRepository.findAllUserMessages();
assertThat(userMessages).hasSize(1);
```

> [!NOTE]
> Remember to clear the `SecurityContextHolder` between your tests, or it may leak amongst them
