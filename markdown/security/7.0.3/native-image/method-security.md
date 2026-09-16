---
title: "Method Security in GraalVM Native Image"
source: "ROOT:native-image/method-security.adoc"
---

<a id="native-image-method-security"></a>

# Method Security in GraalVM Native Image

Although [Method Security](../servlet/authorization/method-security.md) is supported in GraalVM Native Image, there are some use cases that need additional hints provided by the application.

<a id="_using_preauthorize_and_postauthorize_annotations"></a>

## Using `@PreAuthorize` and `@PostAuthorize` Annotations

Using `@PreAuthorize` and `@PostAuthorize` annotations require additional hints if you have a custom implementation of `UserDetails` or `Authentication` classes.

Let’s take an example where you have a custom implementation of `UserDetails` class as follows and that implementation is returned by your `UserDetailsService`:

#### Custom Implementation of UserDetails

```java
public class CustomUserDetails implements UserDetails {

    private final String username;

    private final String password;

    private final Collection<? extends GrantedAuthority> authorities;

    public boolean isAdmin() {
        return this.authorities.contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    // constructors, getters and setters
}
```

And you want to use the `isAdmin()` method inside a `@PreAuthorize` annotation as follows:

#### Using isAdmin() to secure a method

```java
@PreAuthorize("principal?.isAdmin()")
public String hello() {
    return "Hello!";
}
```

> [!NOTE]
> Remember that you need to [add `@EnableMethodSecurity` annotation](../servlet/authorization/method-security.md#jc-enable-method-security) to your configuration class to enable method security annotations.

If you [run the native image](https://docs.spring.io/spring-boot/docs/current/reference/html/native-image.html#native-image.developing-your-first-application) of your application with the above configuration, you will get an error similar to the following when trying to invoke the `hello()` method:

```
failed: java.lang.IllegalArgumentException: Failed to evaluate expression 'principal?.isAdmin()' with root cause
org.springframework.expression.spel.SpelEvaluationException: EL1004E: Method call: Method isAdmin() cannot be found on type com.mypackage.CustomUserDetails
```

Which means that the `isAdmin()` method cannot be found on the `CustomUserDetails` class.
This is because Spring Security uses reflection to invoke the `isAdmin()` method and GraalVM Native Image does not support reflection by default.

To fix this issue, you need to give hints to GraalVM Native Image to allow reflection on the `CustomUserDetails#isAdmin()` method.
We can do that by providing a [custom hint](https://docs.spring.io/spring-boot/docs/current/reference/html/native-image.html#native-image.advanced.custom-hints).
In this example we are going to use [the `@RegisterReflectionForBinding` annotation](https://docs.spring.io/spring-framework/reference/7.0.4/core.html#core.aot.hints.register-reflection-for-binding).

> [!NOTE]
> You might need to register all your classes that you want to use in your `@PreAuthorize` and `@PostAuthorize` annotations.

#### Using @RegisterReflectionForBinding

```java
@Configuration
@RegisterReflectionForBinding(CustomUserDetails.class)
public class MyConfiguration {
    //...
}
```

And that’s it, now you can run the native image of your application and it should work as expected.
