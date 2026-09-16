---
title: "Getting Started with WebFlux Applications"
source: "ROOT:reactive/getting-started.adoc"
---

<a id="getting-started"></a>

# Getting Started with WebFlux Applications

This section covers the minimum setup for how to use Spring Security with Spring Boot in a reactive application.

> [!NOTE]
> The completed application can be found [in our samples repository](https://github.com/spring-projects/spring-security-samples/tree/6.2.x/reactive/webflux/java/hello-security).
> For your convenience, you can download a minimal Reactive Spring Boot + Spring Security application by [clicking here](https://start.spring.io/starter.zip?type=maven-project&language=java&packaging=jar&jvmVersion=1.8&groupId=example&artifactId=hello-security&name=hello-security&description=Hello%20Security&packageName=example.hello-security&dependencies=webflux,security).

<a id="dependencies"></a>

## Updating Dependencies

You can add Spring Security to your Spring Boot project by adding `spring-boot-starter-security`.

#### Maven

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

#### Gradle

```groovy
    implementation 'org.springframework.boot:spring-boot-starter-security'
```

<a id="servlet-hello-starting"></a>

## Starting Hello Spring Security Boot

You can now [run the Spring Boot application](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#using-boot-running-with-the-maven-plugin) by using the Maven Plugin’s `run` goal.
The following example shows how to do so (and the beginning of the output from doing so):

#### Maven

```bash
$ ./mvnw spring-boot:run
...
INFO 23689 --- [  restartedMain] .s.s.UserDetailsServiceAutoConfiguration :

Using generated security password: 8e557245-73e2-4286-969a-ff57fe326336

...
```

#### Gradle

```bash
$ ./gradlew bootRun
...
INFO 23689 --- [  restartedMain] .s.s.UserDetailsServiceAutoConfiguration :

Using generated security password: 8e557245-73e2-4286-969a-ff57fe326336

...
```

<a id="authenticating"></a>

## Authenticating

You can access the application at [localhost:8080/](http://localhost:8080/) which will redirect the browser to the default log in page. You can provide the default username of `user` with the randomly generated password that is logged to the console. The browser is then taken to the orginally requested page.

To log out you can visit [localhost:8080/logout](http://localhost:8080/logout) and then confirming you wish to log out.

<a id="auto-configuration"></a>

## Spring Boot Auto Configuration

Spring Boot automatically adds Spring Security which requires all requests be authenticated. It also generates a user with a randomly generated password that is logged to the console which can be used to authenticate using form or basic authentication.
