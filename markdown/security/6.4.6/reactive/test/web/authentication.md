---
title: "Testing Authentication"
source: "ROOT:reactive/test/web/authentication.adoc"
---

# Testing Authentication

After [applying the Spring Security support to `WebTestClient`](setup.md), we can use either annotations or `mutateWith` support — for example:

#### Java

```java
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockUser;

@Test
public void messageWhenNotAuthenticated() throws Exception {
	this.rest
		.get()
		.uri("/message")
		.exchange()
		.expectStatus().isUnauthorized();
}

// --- WithMockUser ---

@Test
@WithMockUser
public void messageWhenWithMockUserThenForbidden() throws Exception {
	this.rest
		.get()
		.uri("/message")
		.exchange()
		.expectStatus().isEqualTo(HttpStatus.FORBIDDEN);
}

@Test
@WithMockUser(roles = "ADMIN")
public void messageWhenWithMockAdminThenOk() throws Exception {
	this.rest
		.get()
		.uri("/message")
		.exchange()
		.expectStatus().isOk()
		.expectBody(String.class).isEqualTo("Hello World!");
}

// --- mutateWith mockUser ---

@Test
public void messageWhenMutateWithMockUserThenForbidden() throws Exception {
	this.rest
		.mutateWith(mockUser())
		.get()
		.uri("/message")
		.exchange()
		.expectStatus().isEqualTo(HttpStatus.FORBIDDEN);
}

@Test
public void messageWhenMutateWithMockAdminThenOk() throws Exception {
	this.rest
		.mutateWith(mockUser().roles("ADMIN"))
		.get()
		.uri("/message")
		.exchange()
		.expectStatus().isOk()
		.expectBody(String.class).isEqualTo("Hello World!");
}
```

#### Kotlin

```kotlin
import org.springframework.test.web.reactive.server.expectBody
import org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockUser

//...

@Test
@WithMockUser
fun messageWhenWithMockUserThenForbidden() {
    this.rest.get().uri("/message")
        .exchange()
        .expectStatus().isEqualTo(HttpStatus.FORBIDDEN)
}

@Test
@WithMockUser(roles = ["ADMIN"])
fun messageWhenWithMockAdminThenOk() {
    this.rest.get().uri("/message")
        .exchange()
        .expectStatus().isOk
        .expectBody<String>().isEqualTo("Hello World!")

}

// --- mutateWith mockUser ---

@Test
fun messageWhenMutateWithMockUserThenForbidden() {
    this.rest
        .mutateWith(mockUser())
        .get().uri("/message")
        .exchange()
        .expectStatus().isEqualTo(HttpStatus.FORBIDDEN)
}

@Test
fun messageWhenMutateWithMockAdminThenOk() {
    this.rest
        .mutateWith(mockUser().roles("ADMIN"))
        .get().uri("/message")
        .exchange()
        .expectStatus().isOk
        .expectBody<String>().isEqualTo("Hello World!")
}
```

In addition to `mockUser()`, Spring Security ships with several other convenience mutators for things like [CSRF](csrf.md) and [OAuth 2.0](oauth2.md).
