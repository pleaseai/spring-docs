---
title: "WebTestClient Security Setup"
source: "ROOT:reactive/test/web/setup.adoc"
---

# WebTestClient Security Setup

The basic setup looks like this:

#### Java

```java
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;
import static org.springframework.web.reactive.function.client.ExchangeFilterFunctions.basicAuthentication;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = HelloWebfluxMethodApplication.class)
public class HelloWebfluxMethodApplicationTests {
	@Autowired
	ApplicationContext context;

	WebTestClient rest;

	@BeforeEach
	public void setup() {
		this.rest = WebTestClient
			.bindToApplicationContext(this.context)
			// add Spring Security test Support
			.apply(springSecurity())
			.configureClient()
			.filter(basicAuthentication("user", "password"))
			.build();
	}
	// ...
}
```

#### Kotlin

```kotlin
import org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity
import org.springframework.web.reactive.function.client.ExchangeFilterFunctions.basicAuthentication

@ExtendWith(SpringExtension::class)
@ContextConfiguration(classes = [HelloWebfluxMethodApplication::class])
class HelloWebfluxMethodApplicationTests {
    @Autowired
    lateinit var context: ApplicationContext

    lateinit var rest: WebTestClient

    @BeforeEach
    fun setup() {
        this.rest = WebTestClient
            .bindToApplicationContext(this.context)
            // add Spring Security test Support
            .apply(springSecurity())
            .configureClient()
            .filter(basicAuthentication("user", "password"))
            .build()
    }
    // ...
}
```
