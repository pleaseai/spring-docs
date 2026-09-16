---
title: "Testing Method Security"
source: "ROOT:reactive/test/method.adoc"
---

<a id="test-erms"></a>

# Testing Method Security

For example, we can test our example from [EnableReactiveMethodSecurity](../authorization/method.md#jc-erms) by using the same setup and annotations that we used in [Testing Method Security](../../servlet/test/method.md#test-method).
The following minimal sample shows what we can do:

#### Java

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = HelloWebfluxMethodApplication.class)
public class HelloWorldMessageServiceTests {
	@Autowired
	HelloWorldMessageService messages;

	@Test
	public void messagesWhenNotAuthenticatedThenDenied() {
		StepVerifier.create(this.messages.findMessage())
			.expectError(AccessDeniedException.class)
			.verify();
	}

	@Test
	@WithMockUser
	public void messagesWhenUserThenDenied() {
		StepVerifier.create(this.messages.findMessage())
			.expectError(AccessDeniedException.class)
			.verify();
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	public void messagesWhenAdminThenOk() {
		StepVerifier.create(this.messages.findMessage())
			.expectNext("Hello World!")
			.verifyComplete();
	}
}
```

#### Kotlin

```kotlin
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = [HelloWebfluxMethodApplication::class])
class HelloWorldMessageServiceTests {
    @Autowired
    lateinit var messages: HelloWorldMessageService

    @Test
    fun messagesWhenNotAuthenticatedThenDenied() {
        StepVerifier.create(messages.findMessage())
            .expectError(AccessDeniedException::class.java)
            .verify()
    }

    @Test
    @WithMockUser
    fun messagesWhenUserThenDenied() {
        StepVerifier.create(messages.findMessage())
            .expectError(AccessDeniedException::class.java)
            .verify()
    }

    @Test
    @WithMockUser(roles = ["ADMIN"])
    fun messagesWhenAdminThenOk() {
        StepVerifier.create(messages.findMessage())
            .expectNext("Hello World!")
            .verifyComplete()
    }
}
```
