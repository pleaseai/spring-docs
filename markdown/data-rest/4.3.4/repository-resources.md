---
title: "Repository resources"
source: "ROOT:repository-resources.adoc"
---

<a id="repository-resources"></a>

# Repository resources

<a id="repository-resources.fundamentals"></a>

## Fundamentals

The core functionality of Spring Data REST is to export resources for Spring Data repositories. Thus, the core artifact to look at and potentially customize the way the exporting works is the repository interface. Consider the following repository interface:

```
public interface OrderRepository extends CrudRepository<Order, Long> { }
```

For this repository, Spring Data REST exposes a collection resource at `/orders`. The path is derived from the uncapitalized, pluralized, simple class name of the domain class being managed. It also exposes an item resource for each of the items managed by the repository under the URI template `/orders/{id}`.

By default, the HTTP methods to interact with these resources map to the according methods of `CrudRepository`. Read more on that in the sections on [collection resources](#repository-resources.collection-resource) and [item resources](#repository-resources.item-resource).

<a id="repository-resources.methods"></a>

### Repository methods exposure

Which HTTP resources are exposed for a certain repository is mostly driven by the structure of the repository.
In other words, the resource exposure will follow which methods you have exposed on the repository.
If you extend `CrudRepository` you usually expose all methods required to expose all HTTP resources we can register by default.
Each of the resources listed below will define which of the methods need to be present so that a particular HTTP method can be exposed for each of the resources.
That means, that repositories that are not exposing those methods — either by not declaring them at all or explicitly using `@RestResource(exported = false)` — won’t expose those HTTP methods on those resources.

For details on how to tweak the default method exposure or dedicated HTTP methods individually see [Customizing supported HTTP methods](customizing-sdr.md#customizing-sdr.http-methods).

<a id="repository-resources.default-status-codes"></a>

### Default Status Codes

For the resources exposed, we use a set of default status codes:

- `200 OK`: For plain `GET` requests.
- `201 Created`: For `POST` and `PUT` requests that create new resources.
- `204 No Content`: For `PUT`, `PATCH`, and `DELETE` requests when the configuration is set to not return response bodies for resource updates (`RepositoryRestConfiguration.setReturnBodyOnUpdate(…)`).
If the configuration value is set to include responses for `PUT`, `200 OK` is returned for updates, and `201 Created` is returned for resource created through `PUT`.

If the configuration values (`RepositoryRestConfiguration.returnBodyOnUpdate(…)` and `RepositoryRestConfiguration.returnBodyCreate(…)`) are explicitly set to `null` — which they are by default --, the presence of the HTTP Accept header is used to determine the response code.
Read more on this in the detailed description of [collection](#repository-resources.collection-resource.supported-methods.post) and [item resources](#repository-resources.item-resource.supported-methods.put).

<a id="repository-resources.resource-discoverability"></a>

### Resource Discoverability

A core principle of [HATEOAS](https://github.com/spring-guides/understanding/tree/master/hateoas) is that resources should be discoverable through the publication of links that point to the available resources. There are a few competing de-facto standards of how to represent links in JSON. By default, Spring Data REST uses [HAL](https://tools.ietf.org/html/draft-kelly-json-hal) to render responses. HAL defines the links to be contained in a property of the returned document.

Resource discovery starts at the top level of the application. By issuing a request to the root URL under which the Spring Data REST application is deployed, the client can extract, from the returned JSON object, a set of links that represent the next level of resources that are available to the client.

For example, to discover what resources are available at the root of the application, issue an HTTP `GET` to the root URL, as follows:

```
curl -v http://localhost:8080/

< HTTP/1.1 200 OK
< Content-Type: application/hal+json

{ "_links" : {
    "orders" : {
      "href" : "http://localhost:8080/orders"
    },
    "profile" : {
      "href" : "http://localhost:8080/api/alps"
    }
  }
}
```

The property of the result document is an object that consists of keys representing the relation type, with nested link objects as specified in HAL.

> [!NOTE]
> For more details about the `profile` link, see [Application-Level Profile Semantics (ALPS)](metadata.md#metadata.alps).

<a id="repository-resources.collection-resource"></a>

## The Collection Resource

Spring Data REST exposes a collection resource named after the uncapitalized, pluralized version of the domain class the exported repository is handling. Both the name of the resource and the path can be customized by using `@RepositoryRestResource` on the repository interface.

<a id="repository-resources.collection-resource.supported-methods"></a>

### Supported HTTP Methods

Collections resources support both `GET` and `POST`. All other HTTP methods cause a `405 Method Not Allowed`.

<a id="repository-resources.collection-resource.supported-methods.get"></a>

#### `GET`

Returns all entities the repository servers through its `findAll(…)` method.
If the repository is a paging repository we include the pagination links if necessary and additional page metadata.

<a id="_methods_used_for_invocation"></a>

##### Methods used for invocation

The following methods are used if present (descending order):

- `findAll(Pageable)`
- `findAll(Sort)`
- `findAll()`

For more information on the default exposure of methods, see [Repository methods exposure](#repository-resources.methods).

<a id="parameters"></a>

##### Parameters

If the repository has pagination capabilities, the resource takes the following parameters:

- `page`: The page number to access (0 indexed, defaults to 0).
- `size`: The page size requested (defaults to 20).
- `sort`: A collection of sort directives in the format `($propertyname,)+[asc|desc]`?.

<a id="_custom_status_codes"></a>

##### Custom Status Codes

The `GET` method has only one custom status code:

- `405 Method Not Allowed`: If the `findAll(…)` methods were not exported (through `@RestResource(exported = false)`) or are not present in the repository.

<a id="supported-media-types"></a>

##### Supported Media Types

The `GET` method supports the following media types:

- `application/hal+json`
- `application/json`

<a id="related-resources"></a>

##### Related Resources

The `GET` method supports a single link for discovering related resources:

- `search`: A [search resource](#repository-resources.search-resource) is exposed if the backing repository exposes query methods.

<a id="repository-resources.collection-resource.supported-methods.head"></a>

#### `HEAD`

The `HEAD` method returns whether the collection resource is available. It has no status codes, media types, or related resources.

<a id="_methods_used_for_invocation_2"></a>

##### Methods used for invocation

The following methods are used if present (descending order):

- `findAll(Pageable)`
- `findAll(Sort)`
- `findAll()`

For more information on the default exposure of methods, see [Repository methods exposure](#repository-resources.methods).

<a id="repository-resources.collection-resource.supported-methods.post"></a>

#### `POST`

The `POST` method creates a new entity from the given request body.
By default, whether the response contains a body is controlled by the `Accept` header sent with the request.
If one is sent, a response body is created.
If not, the response body is empty and a representation of the resource created can be obtained by following link contained in the `Location` response header.
This behavior can be overridden by configuring `RepositoryRestConfiguration.setReturnBodyOnCreate(…)` accordingly.

<a id="_methods_used_for_invocation_3"></a>

##### Methods used for invocation

The following methods are used if present (descending order):

- `save(…)`

For more information on the default exposure of methods, see [Repository methods exposure](#repository-resources.methods).

<a id="_custom_status_codes_2"></a>

##### Custom Status Codes

The `POST` method has only one custom status code:

- `405 Method Not Allowed`: If the `save(…)` methods were not exported (through `@RestResource(exported = false)`) or are not present in the repository at all.

<a id="_supported_media_types"></a>

##### Supported Media Types

The `POST` method supports the following media types:

- application/hal+json
- application/json

<a id="repository-resources.item-resource"></a>

## The Item Resource

Spring Data REST exposes a resource for individual collection items as sub-resources of the collection resource.

<a id="repository-resources.item-resource.supported-methods"></a>

### Supported HTTP Methods

Item resources generally support `GET`, `PUT`, `PATCH`, and `DELETE`, unless explicit configuration prevents that (see “[The Association Resource](#repository-resources.association-resource)” for details).

<a id="repository-resources.item-resource.supported-methods.get"></a>

#### GET

The `GET` method returns a single entity.

<a id="_methods_used_for_invocation_4"></a>

##### Methods used for invocation

The following methods are used if present (descending order):

- `findById(…)`

For more information on the default exposure of methods, see [Repository methods exposure](#repository-resources.methods).

<a id="_custom_status_codes_3"></a>

##### Custom Status Codes

The `GET` method has only one custom status code:

- `405 Method Not Allowed`: If the `findOne(…)` methods were not exported (through `@RestResource(exported = false)`) or are not present in the repository.

<a id="_supported_media_types_2"></a>

##### Supported Media Types

The `GET` method supports the following media types:

- application/hal+json
- application/json

<a id="_related_resources"></a>

##### Related Resources

For every association of the domain type, we expose links named after the association property. You can customize this behavior by using `@RestResource` on the property. The related resources are of the [association resource](#repository-resources.association-resource) type.

<a id="repository-resources.item-resource.supported-methods.head"></a>

#### `HEAD`

The `HEAD` method returns whether the item resource is available. It has no status codes, media types, or related resources.

<a id="_methods_used_for_invocation_5"></a>

##### Methods used for invocation

The following methods are used if present (descending order):

- `findById(…)`

For more information on the default exposure of methods, see [Repository methods exposure](#repository-resources.methods).

<a id="repository-resources.item-resource.supported-methods.put"></a>

#### `PUT`

The `PUT` method replaces the state of the target resource with the supplied request body.
By default, whether the response contains a body is controlled by the `Accept` header sent with the request.
If the request header is present, a response body and a status code of `200 OK` is returned.
If no header is present, the response body is empty and a successful request returns a status of `204 No Content`.
This behavior can be overridden by configuring `RepositoryRestConfiguration.setReturnBodyOnUpdate(…)` accordingly.

<a id="_methods_used_for_invocation_6"></a>

##### Methods used for invocation

The following methods are used if present (descending order):

- `save(…)`

For more information on the default exposure of methods, see [Repository methods exposure](#repository-resources.methods).

<a id="_custom_status_codes_4"></a>

##### Custom Status Codes

The `PUT` method has only one custom status code:

- `405 Method Not Allowed`: If the `save(…)` methods were not exported (through `@RestResource(exported = false)`) or is not present in the repository at all.

<a id="_supported_media_types_3"></a>

##### Supported Media Types

The `PUT` method supports the following media types:

- application/hal+json
- application/json

<a id="repository-resources.item-resource.supported-methods-patch"></a>

#### `PATCH`

The `PATCH` method is similar to the `PUT` method but partially updates the resources state.

<a id="_methods_used_for_invocation_7"></a>

##### Methods used for invocation

The following methods are used if present (descending order):

- `save(…)`

For more information on the default exposure of methods, see [Repository methods exposure](#repository-resources.methods).

<a id="_custom_status_codes_5"></a>

##### Custom Status Codes

The `PATCH` method has only one custom status code:

- `405 Method Not Allowed`: If the `save(…)` methods were not exported (through `@RestResource(exported = false)`) or are not present in the repository.

<a id="_supported_media_types_4"></a>

##### Supported Media Types

The `PATCH` method supports the following media types:

- application/hal+json
- application/json
- [application/patch+json](https://tools.ietf.org/html/rfc6902)
- [application/merge-patch+json](https://tools.ietf.org/html/rfc7386)

<a id="repository-resources.item-resource.supported-methods.delete"></a>

#### `DELETE`

The `DELETE` method deletes the resource exposed.
By default, whether the response contains a body is controlled by the `Accept` header sent with the request.
If the request header is present, a response body and a status code of `200 OK` is returned.
If no header is present, the response body is empty and a successful request returns a status of `204 No Content`.
This behavior can be overridden by configuring `RepositoryRestConfiguration.setReturnBodyOnDelete(…)` accordingly.

<a id="_methods_used_for_invocation_8"></a>

##### Methods used for invocation

The following methods are used if present (descending order):

- `delete(T)`
- `delete(ID)`
- `delete(Iterable)`

For more information on the default exposure of methods, see [Repository methods exposure](#repository-resources.methods).

<a id="_custom_status_codes_6"></a>

##### Custom Status Codes

The `DELETE` method has only one custom status code:

- `405 Method Not Allowed`: If the `delete(…)` methods were not exported (through `@RestResource(exported = false)`) or are not present in the repository.

<a id="repository-resources.association-resource"></a>

## The Association Resource

Spring Data REST exposes sub-resources of every item resource for each of the associations the item resource has. The name and path of the resource defaults to the name of the association property and can be customized by using `@RestResource` on the association property.

<a id="repository-resources.association-resource.supported-methods"></a>

### Supported HTTP Methods

The association resource supports the following media types:

- GET
- PUT
- POST
- DELETE

<a id="repository-resources.association-resource.supported-methods.get"></a>

#### `GET`

The `GET` method returns the state of the association resource.

<a id="_supported_media_types_5"></a>

##### Supported Media Types

The `GET` method supports the following media types:

- application/hal+json
- application/json

<a id="repository-resources.association-resource.supported-methods.put"></a>

#### `PUT`

The `PUT` method binds the resource pointed to by the given URI(s) to the association resource (see Supported Media Types).

<a id="_custom_status_codes_7"></a>

##### Custom Status Codes

The `PUT` method has only one custom status code:

- `400 Bad Request`: When multiple URIs were given for a to-one-association.

<a id="_supported_media_types_6"></a>

##### Supported Media Types

The `PUT` method supports only one media type:

- text/uri-list: URIs pointing to the resource to bind to the association.

<a id="repository-resources.association-resource.supported-methods.post"></a>

#### `POST`

The `POST` method is supported only for collection associations. It adds a new element to the collection.

<a id="_supported_media_types_7"></a>

##### Supported Media Types

The `POST` method supports only one media type:

- text/uri-list: URIs pointing to the resource to add to the association.

<a id="repository-resources.association-resource.supported-methods.delete"></a>

#### `DELETE`

The `DELETE` method unbinds the association.

<a id="custom-status-codes"></a>

##### Custom Status Codes

The `POST` method has only one custom status code:

- `405 Method Not Allowed`: When the association is non-optional.

<a id="repository-resources.search-resource"></a>

## The Search Resource

The search resource returns links for all query methods exposed by a repository. The path and name of the query method resources can be modified using `@RestResource` on the method declaration.

<a id="repository-resources.search-resource.supported-methods"></a>

### Supported HTTP Methods

As the search resource is a read-only resource, it supports only the `GET` method.

<a id="repository-resources.search-resource.supported-methods.get"></a>

#### `GET`

The `GET` method returns a list of links pointing to the individual query method resources.

<a id="_supported_media_types_8"></a>

##### Supported Media Types

The `GET` method supports the following media types:

- application/hal+json
- application/json

<a id="_related_resources_2"></a>

##### Related Resources

For every query method declared in the repository, we expose a [query method resource](#repository-resources.query-method-resource). If the resource supports pagination, the URI pointing to it is a URI template containing the pagination parameters.

<a id="repository-resources.search-resource.supported-methods.head"></a>

#### `HEAD`

The `HEAD` method returns whether the search resource is available. A 404 return code indicates no query method resources are available.

<a id="repository-resources.query-method-resource"></a>

## The Query Method Resource

The query method resource runs the exposed query through an individual query method on the repository interface.

<a id="repository-resources.query-resource.supported-method"></a>

### Supported HTTP Methods

As the query method resource is a read-only resource, it supports `GET` only.

<a id="repository-resources.query-resource.supported-method.get"></a>

#### `GET`

The `GET` method returns the result of the query.

<a id="_parameters"></a>

##### Parameters

If the query method has pagination capabilities (indicated in the URI template pointing to the resource) the resource takes the following parameters:

- `page`: The page number to access (0 indexed, defaults to 0).
- `size`: The page size requested (defaults to 20).
- `sort`: A collection of sort directives in the format `($propertyname,)+[asc|desc]`?.

<a id="_supported_media_types_9"></a>

##### Supported Media Types

The `GET` method supports the following media types:

- `application/hal+json`
- `application/json`

<a id="repository-resources.query-resource.supported-method.head"></a>

#### `HEAD`

The `HEAD` method returns whether a query method resource is available.
