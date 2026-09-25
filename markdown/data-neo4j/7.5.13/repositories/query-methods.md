---
title: "Query Methods"
source: "ROOT:repositories/query-methods.adoc"
---

<a id="repositories.query-methods"></a>

# Query Methods

Standard CRUD functionality repositories usually have queries on the underlying datastore.
With Spring Data, declaring those queries becomes a four-step process:

1. Declare an interface extending Repository or one of its subinterfaces and type it to the domain class and ID type that it should handle, as shown in the following example:

   ```java
   interface PersonRepository extends Repository<Person, Long> { … }
   ```
1. Declare query methods on the interface.

   ```java
   interface PersonRepository extends Repository<Person, Long> {
     List<Person> findByLastname(String lastname);
   }
   ```
1. Set up Spring to create proxy instances for those interfaces, either with [JavaConfig](create-instances.md#repositories.create-instances.java-config) or with [XML configuration](create-instances.md).

   #### Java

   ```java
   import org.springframework.data.….repository.config.EnableNeo4jRepositories;

   @EnableNeo4jRepositories
   class Config { … }
   ```

   #### XML

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <beans xmlns="http://www.springframework.org/schema/beans"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xmlns:jpa="http://www.springframework.org/schema/data/jpa"
      xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/data/jpa
        https://www.springframework.org/schema/data/jpa/spring-jpa.xsd">

      <repositories base-package="com.acme.repositories"/>

   </beans>
   ```

   The JPA namespace is used in this example.
   If you use the repository abstraction for any other store, you need to change this to the appropriate namespace declaration of your store module.
   In other words, you should exchange `jpa` in favor of, for example, `mongodb`.

   Note that the JavaConfig variant does not configure a package explicitly, because the package of the annotated class is used by default.
   To customize the package to scan, use one of the `basePackage…` attributes of the data-store-specific repository’s `@EnableNeo4jRepositories`-annotation.
1. Inject the repository instance and use it, as shown in the following example:

   ```java
   class SomeClient {

     private final PersonRepository repository;

     SomeClient(PersonRepository repository) {
       this.repository = repository;
     }

     void doSomething() {
       List<Person> persons = repository.findByLastname("Matthews");
     }
   }
   ```

The sections that follow explain each step in detail:

- [Defining Repository Interfaces](definition.md)
- [Defining Query Methods](query-methods-details.md)
- [Creating Repository Instances](create-instances.md)
- [Custom Implementations for Spring Data Repositories](custom-implementations.md)
