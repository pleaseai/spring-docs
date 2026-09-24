---
title: "Elasticsearch Repositories"
source: "ROOT:elasticsearch/repositories/elasticsearch-repositories.adoc"
---

<a id="elasticsearch.repositories"></a>

# Elasticsearch Repositories

This chapter includes details of the Elasticsearch repository implementation.

```java
@Document(indexName="books")
class Book {
    @Id
    private String id;

    @Field(type = FieldType.text)
    private String name;

    @Field(type = FieldType.text)
    private String summary;

    @Field(type = FieldType.Integer)
    private Integer price;

	// getter/setter ...
}
```

<a id="elasticsearch.repositories.autocreation"></a>

## Automatic creation of indices with the corresponding mapping

The `@Document` annotation has an argument `createIndex`.
If this argument is set to true - which is the default value - Spring Data Elasticsearch will during bootstrapping the repository support on application startup check if the index defined by the `@Document` annotation exists.

If it does not exist, the index will be created and the mappings derived from the entity’s annotations (see [Elasticsearch Object Mapping](../object-mapping.md)) will be written to the newly created index.
Details of the index that will be created can be set by using the `@Setting` annotation, refer to [Index settings](../misc.md#elasticsearc.misc.index.settings) for further information.

<a id="elasticsearch.repositories.annotations"></a>

## Annotations for repository methods

<a id="elasticsearch.repositories.annotations.highlight"></a>

### @Highlight

The `@Highlight` annotation on a repository method defines for which fields of the returned entity highlighting should be included.To search for some text in a `Book` 's name or summary and have the found data highlighted, the following repository method can be used:

```java
interface BookRepository extends Repository<Book, String> {

    @Highlight(fields = {
        @HighlightField(name = "name"),
        @HighlightField(name = "summary")
    })
    SearchHits<Book> findByNameOrSummary(String text, String summary);
}
```

It is possible to define multiple fields to be highlighted like above, and both the `@Highlight` and the `@HighlightField` annotation can further be customized with a `@HighlightParameters` annotation. Check the Javadocs for the possible configuration options.

In the search results the highlight data can be retrieved from the `SearchHit` class.

<a id="elasticsearch.repositories.annotations.sourcefilters"></a>

### @SourceFilters

Sometimes the user does not need to have all the properties of an entity returned from a search but only a subset.
Elasticsearch provides source filtering to reduce the amount of data that is transferred across the network to the
application.

When working with `Query` implementations and the `ElasticsearchOperations` this is easily possible by setting a
source filter on the query.

When using repository methods there is the `@SourceFilters` annotation:

```java
interface BookRepository extends Repository<Book, String> {

    @SourceFilters(includes = "name")
    SearchHits<Book> findByName(String text);
}
```

In this example, all the properties of the returned `Book` objects would be `null` except the name.

<a id="elasticsearch.annotation"></a>

## Annotation based configuration

The Spring Data Elasticsearch repositories support can be activated using an annotation through JavaConfig.

```java
@Configuration
@EnableElasticsearchRepositories(                             <1>
  basePackages = "org.springframework.data.elasticsearch.repositories"
  )
static class Config {

  @Bean
  public ElasticsearchOperations elasticsearchTemplate() {    <2>
      // ...
  }
}

class ProductService {

  private ProductRepository repository;                       <3>

  public ProductService(ProductRepository repository) {
    this.repository = repository;
  }

  public Page<Product> findAvailableBookByName(String name, Pageable pageable) {
    return repository.findByAvailableTrueAndNameStartingWith(name, pageable);
  }
}
```

1. The `EnableElasticsearchRepositories` annotation activates the Repository support.
If no base package is configured, it will use the one of the configuration class it is put on.
1. Provide a Bean named `elasticsearchTemplate` of type `ElasticsearchOperations` by using one of the configurations shown in the [Elasticsearch Operations](../template.md) chapter.
1. Let Spring inject the Repository bean into your class.

<a id="elasticsearch.namespace"></a>

## Spring Namespace

The Spring Data Elasticsearch module contains a custom namespace allowing definition of repository beans as well as elements for instantiating a `ElasticsearchServer` .

Using the `repositories` element looks up Spring Data repositories as described in [repositories/create-instances.adoc](../../repositories/create-instances.md).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:elasticsearch="http://www.springframework.org/schema/data/elasticsearch"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       https://www.springframework.org/schema/beans/spring-beans-3.1.xsd
       http://www.springframework.org/schema/data/elasticsearch
       https://www.springframework.org/schema/data/elasticsearch/spring-elasticsearch-1.0.xsd">

  <elasticsearch:repositories base-package="com.acme.repositories" />

</beans>
```

Using the `Transport Client` or `Rest Client` element registers an instance of `Elasticsearch Server` in the context.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:elasticsearch="http://www.springframework.org/schema/data/elasticsearch"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       https://www.springframework.org/schema/beans/spring-beans-3.1.xsd
       http://www.springframework.org/schema/data/elasticsearch
       https://www.springframework.org/schema/data/elasticsearch/spring-elasticsearch-1.0.xsd">

  <elasticsearch:transport-client id="client" cluster-nodes="localhost:9300,someip:9300" />

</beans>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:elasticsearch="http://www.springframework.org/schema/data/elasticsearch"
       xsi:schemaLocation="http://www.springframework.org/schema/data/elasticsearch
       https://www.springframework.org/schema/data/elasticsearch/spring-elasticsearch.xsd
       http://www.springframework.org/schema/beans
       https://www.springframework.org/schema/beans/spring-beans.xsd">

  <elasticsearch:rest-client id="restClient" hosts="http://localhost:9200">

</beans>
```
