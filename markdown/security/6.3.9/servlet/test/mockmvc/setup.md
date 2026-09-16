---
title: "Setting Up MockMvc and Spring Security"
source: "ROOT:servlet/test/mockmvc/setup.adoc"
---

<a id="test-mockmvc-setup"></a>

# Setting Up MockMvc and Spring Security

> [!NOTE]
> Spring Security’s testing support requires spring-test-4.1.3.RELEASE or greater.

To use Spring Security with Spring MVC Test, add the Spring Security `FilterChainProxy` as a `Filter`.
You also need to add Spring Security’s `TestSecurityContextHolderPostProcessor` to support [Running as a User in Spring MVC Test with Annotations](#test-mockmvc-withmockuser).
To do so, use Spring Security’s `SecurityMockMvcConfigurers.springSecurity()`:

#### Java

```java
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.*;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = SecurityConfig.class)
@WebAppConfiguration
public class CsrfShowcaseTests {

	@Autowired
	private WebApplicationContext context;

	private MockMvc mvc;

	@BeforeEach
	public void setup() {
		mvc = MockMvcBuilders
				.webAppContextSetup(context)
				.apply(springSecurity()) // <1>
				.build();
	}
	// ...
}
```

#### Kotlin

```kotlin
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = [SecurityConfig::class])
@WebAppConfiguration
class CsrfShowcaseTests {

    @Autowired
    private lateinit var context: WebApplicationContext

    private var mvc: MockMvc? = null

    @BeforeEach
    fun setup() {
        mvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply<DefaultMockMvcBuilder>(springSecurity()) // <1>
            .build()
    }
    // ...
}
```

1. `SecurityMockMvcConfigurers.springSecurity()` will perform all of the initial setup we need to integrate Spring Security with Spring MVC Test
