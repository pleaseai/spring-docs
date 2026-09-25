---
title: "Configuring CORS"
source: "ROOT:customizing/configuring-cors.adoc"
---

<a id="customizing-sdr.configuring-cors"></a>

# Configuring CORS

For security reasons, browsers prohibit AJAX calls to resources residing outside the current origin. When working with client-side HTTP requests issued by a browser, you want to enable specific HTTP resources to be accessible.

Spring Data REST, as of 2.6, supports [Cross-Origin Resource Sharing](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) (CORS) through [Spring’s CORS](https://docs.spring.io/spring-framework/reference/6.2/web.html#mvc-cors) support.

<a id="customizing-sdr.configuring-cors.config"></a>

## Repository Interface CORS Configuration

You can add a `@CrossOrigin` annotation to your repository interfaces to enable CORS for the whole repository. By default, `@CrossOrigin` allows all origins and HTTP methods. The following example shows a cross-origin repository interface definition:

```java
@CrossOrigin
interface PersonRepository extends CrudRepository<Person, Long> {}
```

In the preceding example, CORS support is enabled for the whole `PersonRepository`. `@CrossOrigin` provides attributes to configure CORS support, as the following example shows:

```java
@CrossOrigin(origins = "http://domain2.example",
  methods = { RequestMethod.GET, RequestMethod.POST, RequestMethod.DELETE },
  maxAge = 3600)
interface PersonRepository extends CrudRepository<Person, Long> {}
```

The preceding example enables CORS support for the whole `PersonRepository` by providing one origin, restricted to the `GET`, `POST`, and `DELETE` methods and with a max age of 3600 seconds.

<a id="customizing-sdr.configuring-cors.controller-config"></a>

## Repository REST Controller Method CORS Configuration

Spring Data REST fully supports [Spring Web MVC’s controller method configuration](https://docs.spring.io/spring-framework/reference/6.2/web.html#mvc-cors-controller) on custom REST controllers that share repository base paths, as the following example shows:

```java
@RepositoryRestController
public class PersonController {

  @CrossOrigin(maxAge = 3600)
  @RequestMapping(path = "/people/xml/{id}", method = RequestMethod.GET, produces = MediaType.APPLICATION_XML_VALUE)
  public Person retrieve(@PathVariable Long id) {
    // …
  }
}
```

> [!NOTE]
> Controllers annotated with `@RepositoryRestController` inherit `@CrossOrigin` configuration from their associated repositories.

<a id="customizing-sdr.configuring-cors.global-config"></a>

## Global CORS Configuration

In addition to fine-grained, annotation-based configuration, you probably want to define some global CORS configuration as well. This is similar to Spring Web MVC’S CORS configuration but can be declared within Spring Data REST and combined with fine-grained `@CrossOrigin` configuration. By default, all origins and `GET`, `HEAD`, and `POST` methods are allowed.

> [!NOTE]
> Existing Spring Web MVC CORS configuration is not applied to Spring Data REST.

The following example sets an allowed origin, adds the PUT and DELETE HTTP methods, adds and exposes some headers, and sets a maximum age of an hour:

```java
@Component
public class SpringDataRestCustomization implements RepositoryRestConfigurer {

  @Override
  public void configureRepositoryRestConfiguration(RepositoryRestConfiguration config, CorsRegistry cors) {

    cors.addMapping("/person/**")
      .allowedOrigins("http://domain2.example")
      .allowedMethods("PUT", "DELETE")
      .allowedHeaders("header1", "header2", "header3")
      .exposedHeaders("header1", "header2")
      .allowCredentials(false).maxAge(3600);
  }
}
```
