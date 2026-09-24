---
title: "CDI Integration"
source: "ROOT:elasticsearch/repositories/cdi-integration.adoc"
---

<a id="elasticsearch.cdi"></a>

# CDI Integration

The Spring Data Elasticsearch repositories can also be set up using CDI functionality.

```java
class ElasticsearchTemplateProducer {

  @Produces
  @ApplicationScoped
  public ElasticsearchOperations createElasticsearchTemplate() {
    // ...                               <1>
  }
}

class ProductService {

  private ProductRepository repository;  <2>
  public Page<Product> findAvailableBookByName(String name, Pageable pageable) {
    return repository.findByAvailableTrueAndNameStartingWith(name, pageable);
  }
  @Inject
  public void setRepository(ProductRepository repository) {
    this.repository = repository;
  }
}
```

1. Create a component by using the same calls as are used in the [Elasticsearch Operations](../template.md) chapter.
1. Let the CDI framework inject the Repository into your class.
