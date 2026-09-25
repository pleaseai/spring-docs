---
title: "Appendix"
source: "ROOT:appendix/index.adoc"
---

<a id="sdn-appendix"></a>

# Appendix

<a id="neo4j-client"></a>

## Neo4jClient

Spring Data Neo4j comes with a Neo4j Client, providing a thin layer on top of Neo4j’s Java driver.

While the [plain Java driver](https://github.com/neo4j/neo4j-java-driver) is a very versatile tool providing an asynchronous API in addition to the imperative and reactive versions, it doesn’t integrate with Spring application level transactions.

SDN uses the driver through the concept of an idiomatic client as directly as possible.

The client has the following main goals

1. Integrate into Springs transaction management, for both imperative and reactive scenarios
1. Participate in JTA-Transactions if necessary
1. Provide a consistent API for both imperative and reactive scenarios
1. Don’t add any mapping overhead

SDN relies on all those features and uses them to fulfill its entity mapping features.

Have a look at the [SDN building blocks](../introduction-and-preface/building-blocks.md#sdn-building-blocks) for where both the imperative and reactive Neo4 clients are positioned in our stack.

The Neo4j Client comes in two flavors:

- `org.springframework.data.neo4j.core.Neo4jClient`
- `org.springframework.data.neo4j.core.ReactiveNeo4jClient`

While both versions provide an API using the same vocabulary and syntax, they are not API compatible.
Both versions feature the same, fluent API to specify queries, bind parameters and extract results.

<a id="neo4j-client.imperative.reactive"></a>

### Imperative or reactive?

Interactions with a Neo4j Client usually ends with a call to

- `fetch().one()`
- `fetch().first()`
- `fetch().all()`
- `run()`

The imperative version will interact at this moment with the database and get the requested results or summary, wrapped in an `Optional<>` or a `Collection`.

The reactive version will in contrast return a publisher of the requested type.
Interaction with the database and retrieval of the results will not happen until the publisher is subscribed to.
The publisher can only be subscribed once.

<a id="neo4j-client.instance"></a>

### Getting an instance of the client

As with most things in SDN, both clients depend on a configured driver instance.

<a id="neo4j-client-create-imperative-client"></a>

#### Creating an instance of the imperative Neo4j client

```java
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;

import org.springframework.data.neo4j.core.Neo4jClient;

public class Demo {

    public static void main(String...args) {

        Driver driver = GraphDatabase
            .driver("neo4j://localhost:7687", AuthTokens.basic("neo4j", "secret"));

        Neo4jClient client = Neo4jClient.create(driver);
    }
}
```

The driver can only open a reactive session against a 4.0 database and will fail with an exception on any lower version.

<a id="neo4j-client-create-reactive-client"></a>

#### Creating an instance of the reactive Neo4j client

```java
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;

import org.springframework.data.neo4j.core.ReactiveNeo4jClient;

public class Demo {

    public static void main(String...args) {

        Driver driver = GraphDatabase
            .driver("neo4j://localhost:7687", AuthTokens.basic("neo4j", "secret"));

        ReactiveNeo4jClient client = ReactiveNeo4jClient.create(driver);
    }
}
```

> [!NOTE]
> Make sure you use the same driver instance for the client as you used for providing a `Neo4jTransactionManager` or `ReactiveNeo4jTransactionManager`
> in case you have enabled transactions.
> The client won’t be able to synchronize transactions if you use another instance of a driver.

Our Spring Boot starter provide a ready to use bean of the Neo4j Client that fits the environment (imperative or reactive) and you usually don’t have to configure your own instance.

<a id="neo4j-client.usage"></a>

### Usage

<a id="neo4j-client-selecting-the-target-database"></a>

#### Selecting the target database

The Neo4j client is well prepared to be used with the multidatabase features of Neo4j 4.0. The client uses the default database unless you specify otherwise.
The fluent API of the client allows to specify the target database exactly once, after the declaration of the query to execute.
[Selecting the target database](#neo4j-client-reactive-selecting-the-target-database) demonstrates it with the reactive client:

<a id="neo4j-client-reactive-selecting-the-target-database"></a>

#### Selecting the target database

```java
Flux<Map<String, Object>> allActors = client
	.query("MATCH (p:Person) RETURN p")
	.in("neo4j") // <.>
	.fetch()
	.all();
```

1. Select the target database in which the query is to be executed.

<a id="neo4j-client.specifying.queryies"></a>

#### Specifying queries

The interaction with the clients starts with a query.
A query can be defined by a plain `String` or a `Supplier<String>`.
The supplier will be evaluated as late as possible and can be provided by any query builder.

<a id="neo4j-client-specifying-queries.example"></a>

#### Specifying a query

```java
Mono<Map<String, Object>> firstActor = client
	.query(() -> "MATCH (p:Person) RETURN p")
	.fetch()
	.first();
```

<a id="neo4j-client.retrieving.results"></a>

#### Retrieving results

As the previous listings shows, the interaction with the client always ends with a call to `fetch` and how many results shall be received.
Both reactive and imperative client offer

**`one()`**

Expect exactly one result from the query

**`first()`**

Expect results and return the first record

**`all()`**

Retrieve all records returned

The imperative client returns `Optional<T>` and `Collection<T>` respectively, while the reactive client returns `Mono<T>` and `Flux<T>`, the later one being executed only if subscribed to.

If you don’t expect any results from your query, then use `run()` after specifying the query.

<a id="neo4j-client-reactive-get-result-summaries"></a>

#### Retrieving result summaries in a reactive way

```java
Mono<ResultSummary> summary = reactiveClient
    .query("MATCH (m:Movie) where m.title = 'Aeon Flux' DETACH DELETE m")
    .run();

summary
    .map(ResultSummary::counters)
    .subscribe(counters ->
        System.out.println(counters.nodesDeleted() + " nodes have been deleted")
    ); // <.>
```

1. The actual query is triggered here by subscribing to the publisher.

Please take a moment to compare both listings and understand the difference when the actual query is triggered.

<a id="neo4j-client-imperative-get-result-summaries"></a>

#### Retrieving result summaries in an imperative way

```java
ResultSummary resultSummary = imperativeClient
	.query("MATCH (m:Movie) where m.title = 'Aeon Flux' DETACH DELETE m")
	.run(); // <.>

SummaryCounters counters = resultSummary.counters();
System.out.println(counters.nodesDeleted() + " nodes have been deleted")
```

1. Here the query is immediately triggered.

<a id="neo4j-client.mapping.parameters"></a>

#### Mapping parameters

Queries can contain named parameters (`$someName`) and the Neo4j client makes it easy to bind values to them.

> [!NOTE]
> The client doesn’t check whether all parameters are bound or whether there are too many values.
> That is left to the driver.
> However, the client prevents you from using a parameter name twice.

You can either bind simple types that the Java driver understands without conversion or complex classes.
For complex classes you need to provide a binder function as shown in [this listing](#neo4j-client-binder).
Please have a look at the [drivers manual](https://neo4j.com/docs/driver-manual/current/cypher-workflow/#driver-type-mapping), to see which simple types are supported.

<a id="neo4j-client-mapping-simple-types"></a>

#### Mapping simple types

```java
Map<String, Object> parameters = new HashMap<>();
parameters.put("name", "Li.*");

Flux<Map<String, Object>> directorAndMovies = client
	.query(
		"MATCH (p:Person) - [:DIRECTED] -> (m:Movie {title: $title}), (p) - [:WROTE] -> (om:Movie) " +
			"WHERE p.name =~ $name " +
			"  AND p.born < $someDate.year " +
			"RETURN p, om"
	)
	.bind("The Matrix").to("title") // <.>
	.bind(LocalDate.of(1979, 9, 21)).to("someDate")
	.bindAll(parameters) // <.>
	.fetch()
	.all();
```

1. There’s a fluent API for binding simple types.
1. Alternatively parameters can be bound via a map of named parameters.

SDN does a lot of complex mapping and it uses the same API that you can use from the client.

You can provide a `Function<T, Map<String, Object>>` for any given domain object like an owner of bicycles in [Example of a domain type](#neo4j-client-domain-example)
to the Neo4j Client to map those domain objects to parameters the driver can understand.

<a id="neo4j-client-domain-example"></a>

#### Example of a domain type

```java
public class Director {

    private final String name;

    private final List<Movie> movies;

    Director(String name, List<Movie> movies) {
        this.name = name;
        this.movies = new ArrayList<>(movies);
    }

    public String getName() {
        return name;
    }

    public List<Movie> getMovies() {
        return Collections.unmodifiableList(movies);
    }
}

public class Movie {

    private final String title;

    public Movie(String title) {
        this.title = title;
    }

    public String getTitle() {
        return title;
    }
}
```

The mapping function has to fill in all named parameters that might occur in the query like [Using a mapping function for binding domain objects](#neo4j-client-binder) shows:

<a id="neo4j-client-binder"></a>

#### Using a mapping function for binding domain objects

```java
Director joseph = new Director("Joseph Kosinski",
        Arrays.asList(new Movie("Tron Legacy"), new Movie("Top Gun: Maverick")));

Mono<ResultSummary> summary = client
    .query(""
        + "MERGE (p:Person {name: $name}) "
        + "WITH p UNWIND $movies as movie "
        + "MERGE (m:Movie {title: movie}) "
        + "MERGE (p) - [o:DIRECTED] -> (m) "
    )
    .bind(joseph).with(director -> { // <.>
        Map<String, Object> mappedValues = new HashMap<>();
        List<String> movies = director.getMovies().stream()
            .map(Movie::getTitle).collect(Collectors.toList());
        mappedValues.put("name", director.getName());
        mappedValues.put("movies", movies);
        return mappedValues;
    })
    .run();
```

1. The `with` method allows for specifying the binder function.

<a id="neo4j-client.result-objects"></a>

#### Working with result objects

Both clients return collections or publishers of maps (`Map<String, Object>`).
Those maps correspond exactly with the records that a query might have produced.

In addition, you can plug in your own `BiFunction<TypeSystem, Record, T>` through `fetchAs` to reproduce your domain object.

<a id="neo4j-client-reader"></a>

#### Using a mapping function for reading domain objects

```java
Mono<Director> lily = client
    .query(""
        + " MATCH (p:Person {name: $name}) - [:DIRECTED] -> (m:Movie)"
        + "RETURN p, collect(m) as movies")
    .bind("Lilly Wachowski").to("name")
    .fetchAs(Director.class).mappedBy((TypeSystem t, Record record) -> {
        List<Movie> movies = record.get("movies")
            .asList(v -> new Movie((v.get("title").asString())));
        return new Director(record.get("name").asString(), movies);
    })
    .one();
```

`TypeSystem` gives access to the types the underlying Java driver used to fill the record.

<a id="neo4j-client.result-objects.mapping-functions"></a>

##### Using domain-aware mapping functions

If you know that the result of the query will contain nodes that have entity definitions in your application,
you can use the injectable `MappingContext` to retrieve their mapping functions and apply them during the mapping.

<a id="neo4j-client-reader.mapping-function"></a>

#### Using an existing mapping function

```java
BiFunction<TypeSystem, MapAccessor, Movie> mappingFunction = neo4jMappingContext.getRequiredMappingFunctionFor(Movie.class);
Mono<Director> lily = client
    .query(""
        + " MATCH (p:Person {name: $name}) - [:DIRECTED] -> (m:Movie)"
        + "RETURN p, collect(m) as movies")
    .bind("Lilly Wachowski").to("name")
    .fetchAs(Director.class).mappedBy((TypeSystem t, Record record) -> {
        List<Movie> movies = record.get("movies")
            .asList(movie -> mappingFunction.apply(t, movie));
        return new Director(record.get("name").asString(), movies);
    })
    .one();
```

<a id="neo4j-client.interacting.driver.directly"></a>

#### Interacting directly with the driver while using managed transactions

In case you don’t want or don’t like the opinionated "client" approach of the `Neo4jClient` or the `ReactiveNeo4jClient`, you can have the client delegate all interactions with the database to your code.
The interaction after the delegation is slightly different with the imperative and reactive versions of the client.

The imperative version takes in a `Function<StatementRunner, Optional<T>>` as a callback.
Returning an empty optional is ok.

<a id="neo4j-client-imperative-delegating"></a>

#### Delegate database interaction to an imperative `StatementRunner`

```java
Optional<Long> result = client
    .delegateTo((StatementRunner runner) -> {
        // Do as many interactions as you want
        long numberOfNodes = runner.run("MATCH (n) RETURN count(n) as cnt")
            .single().get("cnt").asLong();
        return Optional.of(numberOfNodes);
    })
    // .in("aDatabase") // <.>
    .run();
```

1. The database selection as described in [Selecting the target database](#neo4j-client-selecting-the-target-database) is optional.

The reactive version receives a `RxStatementRunner`.

<a id="neo4j-client-reactive-delegating"></a>

#### Delegate database interaction to a reactive `RxStatementRunner`

```java
Mono<Integer> result = client
    .delegateTo((RxStatementRunner runner) ->
        Mono.from(runner.run("MATCH (n:Unused) DELETE n").summary())
            .map(ResultSummary::counters)
            .map(SummaryCounters::nodesDeleted))
    // .in("aDatabase") // <.>
    .run();
```

1. Optional selection of the target database.

Note that in both [Delegate database interaction to an imperative `StatementRunner`](#neo4j-client-imperative-delegating) and [Delegate database interaction to a reactive `RxStatementRunner`](#neo4j-client-reactive-delegating) the types of the runner have only been stated to provide more clarity to reader of this manual.

<a id="query-creation"></a>

## Query creation

This chapter is about the technical creation of queries when using SDN’s abstraction layers.
There will be some simplifications because we do not discuss every possible case but stick with the general idea behind it.

<a id="query-creation.save"></a>

### Save

Beside the `find/load` operations the `save` operation is one of the most used when working with data.
A save operation call in general issues multiple statements against the database to ensure that the resulting graph model matches the given Java model.

1. A union statement will get created that either creates a node, if the node’s identifier cannot be found, or updates the node’s property if the node itself exists.

   (`OPTIONAL MATCH (hlp:Person) WHERE id(hlp) = $__id__ WITH hlp WHERE hlp IS NULL CREATE (n:Person) SET n = $__properties__ RETURN id(n) UNION MATCH (n) WHERE id(n) = $__id__ SET n = $__properties__ RETURN id(n)`)
1. If the entity is **not** new all relationships of the first found type at the domain model will get removed from the database.

   (`MATCH (startNode)-[rel:Has]→(:Hobby) WHERE id(startNode) = $fromId DELETE rel`)
1. The related entity will get created in the same way as the root entity.

   (`OPTIONAL MATCH (hlp:Hobby) WHERE id(hlp) = $__id__ WITH hlp WHERE hlp IS NULL CREATE (n:Hobby) SET n = $__properties__ RETURN id(n) UNION MATCH (n) WHERE id(n) = $__id__ SET n = $__properties__ RETURN id(n)`)
1. The relationship itself will get created

   (`MATCH (startNode) WHERE id(startNode) = $fromId MATCH (endNode) WHERE id(endNode) = 631 MERGE (startNode)-[:Has]→(endNode)`)
1. If the related entity also has relationships to other entities, the same procedure as in 2. will get started.
1. For the next defined relationship on the root entity start with 2. but replace *first* with *next*.

> [!WARNING]
> As you can see SDN does its best to keep your graph model in sync with the Java world.
> This is one of the reasons why we really advise you to not load, manipulate and save sub-graphs as this might cause relationships to get removed from the database.

<a id="query-creation.save.multiple-entities"></a>

#### Multiple entities

The `save` operation is overloaded with the functionality for accepting multiple entities of the same type.
If you are working with generated id values or make use of optimistic locking, every entity will result in a separate `CREATE` call.

In other cases SDN will create a parameter list with the entity information and provide it with a `MERGE` call.

`UNWIND $__entities__ AS entity MERGE (n:Person {customId: entity.$__id__}) SET n = entity.__properties__ RETURN collect(n.customId) AS $__ids__`

and the parameters look like

`:params {__entities__: [{__id__: 'aa', __properties__: {name: "PersonName", theId: "aa"}}, {__id__ 'bb', __properties__: {name: "AnotherPersonName", theId: "bb"}}]}`

<a id="query-creation.load"></a>

### Load

The `load` documentation will not only show you how the *MATCH* part of the query looks like but also how the data gets returned.

The simplest kind of load operation is a `findById` call.
It will match all nodes with the label of the type you queried for and does a filter on the id value.

`MATCH (n:Person) WHERE id(n) = 1364`

If there is a custom id provided SDN will use the property you have defined as the id.

`MATCH (n:Person) WHERE n.customId = 'anId'`

The data to return is defined as a [map projection](https://neo4j.com/docs/cypher-manual/current/syntax/maps/#cypher-map-projection).

`RETURN n{.first_name, .personNumber, __internalNeo4jId__: id(n), __nodeLabels__: labels(n)}`

As you can see there are two special fields in there: The `__internalNeo4jId__` and the `__nodeLabels__`.
Both are critical when it comes to mapping the data to Java objects.
The value of the `__internalNeo4jId__` is either `id(n)` or the provided custom id but in the mapping process one known field to refer to has to exist.
The `__nodeLabels__` ensures that all defined labels on this node can be found and mapped.
This is needed for situations when inheritance is used and you query not for the concrete classes or have relationships defined that only define a super-type.

Talking about relationships: If you have defined relationships in your entity, they will get added to the returned map as [pattern comprehensions](https://neo4j.com/docs/cypher-manual/4.0/syntax/lists/#cypher-pattern-comprehension).
The above return part will then look like:

`RETURN n{.first_name, …​, Person_Has_Hobby: [(n)-[:Has]→(n_hobbies:Hobby)|n_hobbies{__internalNeo4jId__: id(n_hobbies), .name, nodeLabels: labels(n_hobbies)}]}`

The map projection and pattern comprehension used by SDN ensures that only the properties and relationships you have defined are getting queried.

In cases where you have self-referencing nodes or creating schemas that potentially lead to cycles in the data that gets returned,
SDN falls back to a cascading / data-driven query creation.
Starting with an initial query that looks for the specific node and considering the conditions,
it steps through the resulting nodes and, if their relationships are also mapped, would create further queries on the fly.
This query creation and execution loop will continue until no query finds new relationships or nodes.
The way of the creation can be seen analogue to the save/update process.

<a id="custom-queries"></a>

## Custom queries

Spring Data Neo4j, like all the other Spring Data modules, allows you to specify custom queries in you repositories.
Those come in handy if you cannot express the finder logic via derived query functions.

Because Spring Data Neo4j works heavily record-oriented under the hood, it is important to keep this in mind and not build up a result set with multiple records for the same "root node".

> [!TIP]
> Please have a look in the FAQ as well to learn about alternative forms of using custom queries from repositories, especially
> how to use custom queries with custom mappings: [Custom queries and custom mappings](../faq.md#faq.custom-queries-and-custom-mappings).

<a id="custom-queries.for-relationships"></a>

### Queries with relationships

<a id="custom-queries.for-relationships.cartesian-product"></a>

#### Beware of the cartesian product

Assuming you have a query like `MATCH (m:Movie{title: 'The Matrix'})←[r:ACTED_IN]-(p:Person) return m,r,p` that results into something like this:

#### Multiple records (shortened)

```
+------------------------------------------------------------------------------------------+
| m        | r                                    | p                                      |
+------------------------------------------------------------------------------------------+
| (:Movie) | [:ACTED_IN {roles: ["Emil"]}]        | (:Person {name: "Emil Eifrem"})        |
| (:Movie) | [:ACTED_IN {roles: ["Agent Smith"]}] | (:Person {name: "Hugo Weaving})        |
| (:Movie) | [:ACTED_IN {roles: ["Morpheus"]}]    | (:Person {name: "Laurence Fishburne"}) |
| (:Movie) | [:ACTED_IN {roles: ["Trinity"]}]     | (:Person {name: "Carrie-Anne Moss"})   |
| (:Movie) | [:ACTED_IN {roles: ["Neo"]}]         | (:Person {name: "Keanu Reeves"})       |
+------------------------------------------------------------------------------------------+
```

The result from the mapping would be most likely unusable.
If this would get mapped into a list, it will contain duplicates for the `Movie` but this movie will only have one relationship.

<a id="custom-queries.for-relationships.one.record"></a>

#### Getting one record per root node

To get the right object(s) back, it is required to *collect* the relationships and related nodes in the query: `MATCH (m:Movie{title: 'The Matrix'})←[r:ACTED_IN]-(p:Person) return m,collect(r),collect(p)`

#### Single record (shortened)

```
+------------------------------------------------------------------------+
| m        | collect(r)                     | collect(p)                 |
+------------------------------------------------------------------------+
| (:Movie) | [[:ACTED_IN], [:ACTED_IN], ...]| [(:Person), (:Person),...] |
+------------------------------------------------------------------------+
```

With this result as a single record it is possible for Spring Data Neo4j to add all related nodes correctly to the root node.

<a id="custom-queries.for-relationships.long-paths"></a>

#### Reaching deeper into the graph

The example above assumes that you are only trying to fetch the first level of related nodes.
This is sometimes not enough and there are maybe nodes deeper in the graph that should also be part of the mapped instance.
There are two ways to achieve this: Database-side or client-side reduction.

For this the example from above should also contain `Movies` on the `Persons` that get returned with the initial `Movie`.

#### Example for 'The Matrix' and 'Keanu Reeves'

![image$movie graph deep](https://raw.githubusercontent.com/spring-projects/spring-data-neo4j/7.2.0/src/main/antora/modules/ROOT/assets/images/image$movie-graph-deep.png)

<a id="custom-queries.for-relationships.long-paths.database"></a>

##### Database-side reduction

Keeping in mind that Spring Data Neo4j can only properly process record based, the result for one entity instance needs to be in one record.
Using [Cypher’s path](https://neo4j.com/docs/cypher-manual/current/syntax/patterns/#cypher-pattern-path-variables) capabilities is a valid option to fetch all branches in the graph.

#### Naive path-based approach

```cypher
MATCH p=(m:Movie{title: 'The Matrix'})<-[:ACTED_IN]-(:Person)-[:ACTED_IN*..0]->(:Movie)
RETURN p;
```

This will result in multiple paths that are not merged within one record.
It is possible to call `collect(p)` but Spring Data Neo4j does not understand the concept of paths in the mapping process.
Thus, nodes and relationships needs to get extracted for the result.

#### Extracting nodes and relationships

```cypher
MATCH p=(m:Movie{title: 'The Matrix'})<-[:ACTED_IN]-(:Person)-[:ACTED_IN*..0]->(:Movie)
RETURN m, nodes(p), relationships(p);
```

Because there are multiple paths that lead from 'The Matrix' to another movie, the result still won’t be a single record.
This is where [Cypher’s reduce function](https://neo4j.com/docs/cypher-manual/current/functions/list/#functions-reduce) comes into play.

#### Reducing nodes and relationships

```cypher
MATCH p=(m:Movie{title: 'The Matrix'})<-[:ACTED_IN]-(:Person)-[:ACTED_IN*..0]->(:Movie)
WITH collect(p) as paths, m
WITH m,
reduce(a=[], node in reduce(b=[], c in [aa in paths | nodes(aa)] | b + c) | case when node in a then a else a + node end) as nodes,
reduce(d=[], relationship in reduce(e=[], f in [dd in paths | relationships(dd)] | e + f) | case when relationship in d then d else d + relationship end) as relationships
RETURN m, relationships, nodes;
```

The `reduce` function allows us to flatten the nodes and relationships from various paths.
As a result we will get a tuple similar to [Getting one record per root node](#custom-queries.for-relationships.one.record) but with a mixture of relationship types or nodes in the collections.

<a id="custom-queries.for-relationships.long-paths.client"></a>

##### Client-side reduction

If the reduction should happen on the client-side, Spring Data Neo4j enables you to map also lists of lists of relationships or nodes.
Still, the requirement applies that the returned record should contain all information to hydrate the resulting entity instance correctly.

#### Collect nodes and relationships from path

```cypher
MATCH p=(m:Movie{title: 'The Matrix'})<-[:ACTED_IN]-(:Person)-[:ACTED_IN*..0]->(:Movie)
RETURN m, collect(nodes(p)), collect(relationships(p));
```

The additional `collect` statement creates lists in the format:

```
[[rel1, rel2], [rel3, rel4]]
```

Those lists will now get converted during the mapping process into a flat list.

> [!NOTE]
> Deciding if you want to go with client-side or database-side reduction depends on the amount of data that will get generated.
> All the paths needs to get created in the database’s memory first when the `reduce` function is used.
> On the other hand a large amount of data that needs to get merged on the client-side results in a higher memory usage there.

<a id="custom-query.paths"></a>

### Using paths to populate and return a list of entities

Given are a graph that looks like this:

<a id="custom-query.paths.g"></a>

#### graph with outgoing relationships

![image$custom query.paths](https://raw.githubusercontent.com/spring-projects/spring-data-neo4j/7.2.0/src/main/antora/modules/ROOT/assets/images/image$custom-query.paths.png)

and a domain model as shown in the [mapping](#custom-query.paths.dm) (Constructors and accessors have been omitted for brevity):

<a id="custom-query.paths.dm"></a>

#### Domain model for a [graph with outgoing relationships](#custom-query.paths.g).

```java
@Node
public class SomeEntity {

    @Id
    private final Long number;

    private String name;

    @Relationship(type = "SOME_RELATION_TO", direction = Relationship.Direction.OUTGOING)
    private Set<SomeRelation> someRelationsOut = new HashSet<>();
}

@RelationshipProperties
public class SomeRelation {

    @RelationshipId
    private Long id;

    private String someData;

    @TargetNode
    private SomeEntity targetPerson;
}
```

As you see, the relationships are only outgoing. Generated finder methods (including `findById`) will always try to match
a root node to be mapped. From there on onwards, all related objects will be mapped. In queries that should return only one object,
that root object is returned. In queries that return many objects, all matching objects are returned. Out- and incoming relationships
from those objects returned are of course populated.

Assume the following Cypher query:

```cypher
MATCH p = (leaf:SomeEntity {number: $a})-[:SOME_RELATION_TO*]-(:SomeEntity)
RETURN leaf, collect(nodes(p)), collect(relationships(p))
```

It follows the recommendation from [Getting one record per root node](#custom-queries.for-relationships.one.record) and it works great for the leaf node
you want to match here. However: That is only the case in all scenarios that return 0 or 1 mapped objects.
While that query will populate all relationships like before, it won’t return all 4 objects.

This can be changed by returning the whole path:

```cypher
MATCH p = (leaf:SomeEntity {number: $a})-[:SOME_RELATION_TO*]-(:SomeEntity)
RETURN p
```

Here we do want to use the fact that the path `p` actually returns 3 rows with paths to all 4 nodes. All 4 nodes will be
populated, linked together and returned.

<a id="custom-queries.parameters"></a>

### Parameters in custom queries

You do this exactly the same way as in a standard Cypher query issued in the Neo4j Browser or the Cypher-Shell,
with the `$` syntax (from Neo4j 4.0 on upwards, the old `${foo}` syntax for Cypher parameters has been removed from the database).

#### ARepository.java

```java
public interface ARepository extends Neo4jRepository<AnAggregateRoot, String> {

	@Query("MATCH (a:AnAggregateRoot {name: $name}) RETURN a") // <.>
	Optional<AnAggregateRoot> findByCustomQuery(String name);
}
```

1. Here we are referring to the parameter by its name.
You can also use `$0` etc. instead.

> [!NOTE]
> You need to compile your Java 8+ project with `-parameters` to make named parameters work without further annotations.
> The Spring Boot Maven and Gradle plugins do this automatically for you.
> If this is not feasible for any reason, you can either add
> `@Param`  and specify the name explicitly or use the parameters index.

Mapped entities (everything with a `@Node`) passed as parameter to a function that is annotated with
a custom query will be turned into a nested map.
The following example represents the structure as Neo4j parameters.

Given are a `Movie`, `Vertex` and `Actor` classes annotated as shown in [the movie model](#movie-model):

<a id="movie-model"></a>

#### "Standard" movies model

```java
@Node
public final class Movie {

    @Id
    private final String title;

    @Property("tagline")
    private final String description;

    @Relationship(value = "ACTED_IN", direction = Direction.INCOMING)
    private final List<Actor> actors;

    @Relationship(value = "DIRECTED", direction = Direction.INCOMING)
    private final List<Person> directors;
}

@Node
public final class Person {

    @Id @GeneratedValue
    private final Long id;

    private final String name;

    private Integer born;

    @Relationship("REVIEWED")
    private List<Movie> reviewed = new ArrayList<>();
}

@RelationshipProperties
public final class Actor {

	@RelationshipId
	private final Long id;

    @TargetNode
    private final Person person;

    private final List<String> roles;
}

interface MovieRepository extends Neo4jRepository<Movie, String> {

    @Query("MATCH (m:Movie {title: $movie.__id__})\n"
           + "MATCH (m) <- [r:DIRECTED|REVIEWED|ACTED_IN] - (p:Person)\n"
           + "return m, collect(r), collect(p)")
    Movie findByMovie(@Param("movie") Movie movie);
}
```

Passing an instance of `Movie` to the repository method above, will generate the following Neo4j map parameter:

```json
{
  "movie": {
    "__labels__": [
      "Movie"
    ],
    "__id__": "The Da Vinci Code",
    "__properties__": {
      "ACTED_IN": [
        {
          "__properties__": {
            "roles": [
              "Sophie Neveu"
            ]
          },
          "__target__": {
            "__labels__": [
              "Person"
            ],
            "__id__": 402,
            "__properties__": {
              "name": "Audrey Tautou",
              "born": 1976
            }
          }
        },
        {
          "__properties__": {
            "roles": [
              "Sir Leight Teabing"
            ]
          },
          "__target__": {
            "__labels__": [
              "Person"
            ],
            "__id__": 401,
            "__properties__": {
              "name": "Ian McKellen",
              "born": 1939
            }
          }
        },
        {
          "__properties__": {
            "roles": [
              "Dr. Robert Langdon"
            ]
          },
          "__target__": {
            "__labels__": [
              "Person"
            ],
            "__id__": 360,
            "__properties__": {
              "name": "Tom Hanks",
              "born": 1956
            }
          }
        },
        {
          "__properties__": {
            "roles": [
              "Silas"
            ]
          },
          "__target__": {
            "__labels__": [
              "Person"
            ],
            "__id__": 403,
            "__properties__": {
              "name": "Paul Bettany",
              "born": 1971
            }
          }
        }
      ],
      "DIRECTED": [
        {
          "__labels__": [
            "Person"
          ],
          "__id__": 404,
          "__properties__": {
            "name": "Ron Howard",
            "born": 1954
          }
        }
      ],
      "tagline": "Break The Codes",
      "released": 2006
    }
  }
}
```

A node is represented by a map. The map will always contain `id`  which is the mapped id property.
Under `labels` all labels, static and dynamic, will be available.
All properties - and type of relationships - appear in those maps as they would appear in the graph when the entity would
have been written by SDN.
Values will have the correct Cypher type and won’t need further conversion.

> [!TIP]
> All relationships are lists of maps. Dynamic relationships will be resolved accordingly.
>      One-to-one relationships will also be serialized as singleton lists. So to access a one-to-one mapping
>      between people, you would write this das `$person.__properties__.BEST_FRIEND[0].__target__.__id__`.

If an entity has a relationship with the same type to different types of others nodes, they will all appear in the same list.
If you need such a mapping and also have the need to work with those custom parameters, you have to unroll it accordingly.
One way to do this are correlated subqueries (Neo4j 4.1+ required).

<a id="custom-queries.spel"></a>

### Spring Expression Language in custom queries

[Spring Expression Language (SpEL)](https://docs.spring.io/spring-framework/reference/6.1/core/expressions.html) can be used in custom queries inside `:#{}`.
The colon here refers to a parameter and such an expression should be used where parameters make sense.
However, when using our [literal extension](#literal-extension) you can use SpEL expression in places where standard Cypher
won’t allow parameters (such as for labels or relationship types).
This is the standard Spring Data way of defining a block of text inside a query that undergoes SpEL evaluation.

The following example basically defines the same query as above, but uses a `WHERE` clause to avoid even more curly braces:

<a id="custom-queries-with-spel-parameter-example"></a>

#### ARepository.java

```java
public interface ARepository extends Neo4jRepository<AnAggregateRoot, String> {

	@Query("MATCH (a:AnAggregateRoot) WHERE a.name = :#{#pt1 + #pt2} RETURN a")
	Optional<AnAggregateRoot> findByCustomQueryWithSpEL(String pt1, String pt2);
}
```

The SpEL blocked starts with `:#{` and then refers to the given `String` parameters by name (`#pt1`).
Don’t confuse this with the above Cypher syntax!
The SpEL expression concatenates both parameters into one single value that is eventually passed on to the [appendix/neo4j-client.adoc#neo4j-client](neo4j-client.md#neo4j-client).
The SpEL block ends with `}`.

SpEL also solves two additional problems. We provide two extensions that allow to pass in a `Sort` object into custom queries.
Remember [faq.adoc#custom-queries-with-page-and-slice-examples](../faq.md#custom-queries-with-page-and-slice-examples) from [custom queries](../faq.md#faq.custom-queries-with-page-and-slice)?
With the `orderBy` extension you can pass in a `Pageable` with a dynamic sort to a custom query:

<a id="custom-queries.spel.source"></a>

#### orderBy-Extension

```java
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;

public interface MyPersonRepository extends Neo4jRepository<Person, Long> {

    @Query(""
        + "MATCH (n:Person) WHERE n.name = $name RETURN n "
        + ":#{orderBy(#pageable)} SKIP $skip LIMIT $limit" // <.>
    )
    Slice<Person> findSliceByName(String name, Pageable pageable);

    @Query(""
        + "MATCH (n:Person) WHERE n.name = $name RETURN n :#{orderBy(#sort)}" // <.>
    )
    List<Person> findAllByName(String name, Sort sort);
}
```

1. A `Pageable` has always the name `pageable` inside the SpEL context.
1. A `Sort` has always the name `sort` inside the SpEL context.

<a id="spel-extensions"></a>

#### Spring Expression Language extensions

<a id="literal-extension"></a>

##### Literal extension

The `literal` extension can be used to make things like labels or relationship-types "dynamic" in custom queries.
Neither labels nor relationship types can be parameterized in Cypher, so they must be given literal.

#### literal-Extension

```java
interface BaseClassRepository extends Neo4jRepository<Inheritance.BaseClass, Long> {

    @Query("MATCH (n:`:#{literal(#label)}`) RETURN n") // <.>
    List<Inheritance.BaseClass> findByLabel(String label);
}
```

1. The `literal` extension will be replaced with the literal value of the evaluated parameter.

Here, the `literal` value has been used to match dynamically on a Label.
If you pass in `SomeLabel` as a parameter to the method, `MATCH (n:SomeLabel) RETURN n`
will be generated. Ticks have been added to correctly escape values. SDN won’t do this
for you as this is probably not what you want in all cases.

<a id="list-extensions"></a>

##### List extensions

For more than one value there are `allOf` and `anyOf` in place that would render
either a `&` or `|` concatenated list of all values.

#### List extensions

```java
interface BaseClassRepository extends Neo4jRepository<Inheritance.BaseClass, Long> {

    @Query("MATCH (n:`:#{allOf(#label)}`) RETURN n")
    List<Inheritance.BaseClass> findByLabels(List<String> labels);

    @Query("MATCH (n:`:#{anyOf(#label)}`) RETURN n")
    List<Inheritance.BaseClass> findByLabels(List<String> labels);
}
```

<a id="_referring_to_labels"></a>

#### Referring to Labels

You already know how to map a Node to a domain object:

#### A Node with many labels

```java
@Node(primaryLabel = "Bike", labels = {"Gravel", "Easy Trail"})
public class BikeNode {
    @Id String id;

    String name;
}
```

This node has a couple of labels, and it would be rather error prone to repeat them all the time in custom queries: You might
forget one or make a typo. We offer the following expression to mitigate this: `#{#staticLabels}`. Notice that this one does
*not* start with a colon! You use it on repository methods annotated with `@Query`:

#### `#{#staticLabels}` in action

```java
public interface BikeRepository extends Neo4jRepository<Bike, String> {

    @Query("MATCH (n:#{#staticLabels}) WHERE n.id = $nameOrId OR n.name = $nameOrId RETURN n")
    Optional<Bike> findByNameOrId(@Param("nameOrId") String nameOrId);
}
```

This query will resolve to

```cypher
MATCH (n:`Bike`:`Gravel`:`Easy Trail`) WHERE n.id = $nameOrId OR n.name = $nameOrId RETURN n
```

Notice how we used standard parameter for the `nameOrId`: In most cases there is no need to complicate things here by
adding a SpEL expression.

<a id="spatial-types"></a>

## Spatial types

Spring Data Neo4j supports the following spatial types

<a id="spatial-types.conversion"></a>

### Supported conversions

- Spring Data common’s `Point` (**must** be a WGS 84-2D/SRID 4326 point in the database)
- `GeographicPoint2d` (WGS84 2D/SRID 4326)
- `GeographicPoint3d` (WGS84 3D/SRID 4979)
- `CartesianPoint2d` (Cartesian 2D/SRID 7203)
- `CartesianPoint3d` (Cartesian 3D/SRID 9157)

<a id="spatial-types.derived-finder"></a>

### Derived finder keywords

If you are using the native Neo4j Java driver `org.neo4j.driver.types.Point` type,
you can make use of the following keywords and parameter types in derived finder methods.

Query inside an area:

- `findBy[…​]Within(org.springframework.data.geo.Circle circle)`
- `findBy[…​]Within(org.springframework.data.geo.Box box)`
- `findBy[…​]Within(org.springframework.data.neo4j.repository.query.BoundingBox boundingBox)`

> [!NOTE]
> You could also use a `org.springframework.data.geo.Polygon` but would need to pass it into a `BoundingBox` by calling `BoundingBox#of`.

Query near a certain point:

- `findBy[…​]Near(org.neo4j.driver.types.Point point)` - returns result sorted by distance to the given point ascending
- `findBy[…​]Near(Point point, org.springframework.data.geo.Distance max)`
- `findBy[…​]Near(Point point, org.springframework.data.domain.Range<Distance> between)`
- `findBy[…​]Near(Range<Distance> between, Point p)`

<a id="logging"></a>

## Logging

Spring Data Neo4j provides multiple loggers for [Cypher notifications](https://neo4j.com/docs/status-codes/current/notifications/all-notifications/), starting with version 7.1.5.
The logger `org.springframework.data.neo4j.cypher` includes all statements that were invoked by Spring Data Neo4j and all notifications sent from the server.
To exclude or elevate some categories, the following loggers are in place:

- `org.springframework.data.neo4j.cypher.performance`
- `org.springframework.data.neo4j.cypher.hint`
- `org.springframework.data.neo4j.cypher.unrecognized`
- `org.springframework.data.neo4j.cypher.unsupported`
- `org.springframework.data.neo4j.cypher.deprecation`
- `org.springframework.data.neo4j.cypher.generic`

<a id="Migrating"></a>

## Migrating from SDN+OGM to SDN

<a id="migrating.known-issues"></a>

### Known issues with past SDN+OGM migrations

SDN+OGM has had quite a history over the years and we understand that migrating big application systems is neither fun nor something that provides immediate profit.
The main issues we observed when migrating from older versions of Spring Data Neo4j to newer ones are roughly in order the following:

**Having skipped more than one major upgrade**

While Neo4j-OGM can be used stand-alone, Spring Data Neo4j cannot.
It depends to large extend on the Spring Data and therefore, on the Spring Framework itself, which eventually affects large parts of your application.
Depending on how the application has been structured, that is, how much the any of the framework part leaked into your business code, the more you have to adapt your application.
It gets worse when you have more than one Spring Data module in your application, if you accessed a relational database in the same service layer as your graph database.
Updating two object mapping frameworks is not fun.

**Relying on an embedded database configured through Spring Data itself**

The embedded database in a SDN+OGM project is configured by Neo4j-OGM.
Say you want to upgrade from Neo4j 3.0 to 3.5, you can’t without upgrading your whole application.
Why is that?
As you chose to embed a database into your application, you tied yourself into the modules that configure this embedded database.
To have another, embedded database version, you have to upgrade the module that configured it, because the old one does not support the new database.
As there is always a Spring Data version corresponding to Neo4j-OGM, you would have to upgrade that as well.
Spring Data however depends on Spring Framework and then the arguments from the first bullet apply.

**Being unsure about which building blocks to include**

It’s not easy to get the terms right.
We wrote the building blocks of an SDN+OGM setting [here](https://michael-simons.github.io/neo4j-examples-and-tips/what_are_the_building_blocks_of_sdn_and_ogm.html).
It may be so that all of them have been added by coincidence and you’re dealing with a lot of conflicting dependencies.

> [!TIP]
> Backed by those observations, we recommend to make sure you’re using only the Bolt or http transport in your current application before switching from SDN+OGM to SDN.
> Thus, your application and the access layer of your application is to a large extent independent of the database’s version.
> From that state, consider moving from SDN+OGM to SDN.

<a id="migrating.preparation"></a>

### Prepare the migration from SDN+OGM Lovelace or SDN+OGM Moore to SDN

> [!NOTE]
> The *Lovelace* release train corresponds to SDN 5.1.x and OGM 3.1.x, while the *Moore* is SDN 5.2.x and OGM 3.2.x.

First, you must make sure that your application runs against Neo4j in server mode over the Bolt protocol, which means work in two of three cases:

<a id="migrating.embedded"></a>

#### You’re on embedded

You have added `org.neo4j:neo4j-ogm-embedded-driver` and `org.neo4j:neo4j` to you project and starting the database via OGM facilities.
This is no longer supported and you have to set up a standard Neo4j server (both standalone and cluster are supported).

The above dependencies have to be removed.

Migrating from the embedded solution is probably the toughest migration, as you need to set up a server, too.
It is however the one that gives you much value in itself:
In the future, you will be able to upgrade the database itself without having to consider your application framework, and your data access framework as well.

<a id="migrating.http"></a>

#### You’re using the HTTP transport

You have added `org.neo4j:neo4j-ogm-http-driver` and configured an url like `user:password@localhost:7474`.
The dependency has to be replaced with `org.neo4j:neo4j-ogm-bolt-driver` and you need to configure a Bolt url like `bolt://localhost:7687` or use the new `neo4j://` scheme, which takes care of routing, too.

<a id="migrating.bolt"></a>

#### You’re already using Bolt indirectly

A default SDN+OGM project uses `org.neo4j:neo4j-ogm-bolt-driver` and thus indirectly, the pure Java Driver.
You can keep your existing URL.

<a id="migrating.migrating"></a>

### Migrating

Once you have made sure, that your SDN+OGM application works over Bolt as expected, you can start migrating to SDN.

- Remove all `org.neo4j:neo4j-ogm-*` dependencies
- Configuring SDN through a `org.neo4j.ogm.config.Configuration` bean is not supported, instead of, all configuration of the driver goes through our new Java driver starter.
You will especially have to adapt the properties for the url and authentication, see [Old and new properties compared](#migrating-auth)

> [!TIP]
> You cannot configure SDN through XML.
> In case you did this with your SDN+OGM application, make sure you learn about annotation-driven or functional configuration of Spring Applications.
> The easiest choice these days is Spring Boot.
> With our starter in place, all the necessary bits apart from the connection URL and the authentication is already configured for you.

<a id="migrating-auth"></a>

#### Old and new properties compared

```properties
# Old
spring.data.neo4j.embedded.enabled=false # No longer supported
spring.data.neo4j.uri=bolt://localhost:7687
spring.data.neo4j.username=neo4j
spring.data.neo4j.password=secret

# New
spring.neo4j.uri=bolt://localhost:7687
spring.neo4j.authentication.username=neo4j
spring.neo4j.authentication.password=secret
```

> [!WARNING]
> Those new properties might change in the future again when SDN and the driver eventually fully replace the old setup.

And finally, add the new dependency, see [Getting started](../getting-started.md) for both Gradle and Maven.

You’re then ready to replace annotations:

| Old | New |
| --- | --- |
| `org.neo4j.ogm.annotation.NodeEntity` | `org.springframework.data.neo4j.core.schema.Node` |
| `org.neo4j.ogm.annotation.GeneratedValue` | `org.springframework.data.neo4j.core.schema.GeneratedValue` |
| `org.neo4j.ogm.annotation.Id` | `org.springframework.data.neo4j.core.schema.Id` |
| `org.neo4j.ogm.annotation.Property` | `org.springframework.data.neo4j.core.schema.Property` |
| `org.neo4j.ogm.annotation.Relationship` | `org.springframework.data.neo4j.core.schema.Relationship` |
| `org.springframework.data.neo4j.annotation.EnableBookmarkManagement` | No replacement, not needed |
| `org.springframework.data.neo4j.annotation.UseBookmark` | No replacement, not needed |
| `org.springframework.data.neo4j.annotation.QueryResult` | Use [projections](../repositories/projections.md); arbitrary result mapping not supported anymore |

> [!NOTE]
> Several Neo4j-OGM annotations have not yet a corresponding annotation in SDN, some will never have.
> We will add to the list above as we support additional features.

<a id="migrating.bookmarks"></a>

#### Bookmark management

Both `@EnableBookmarkManagement` and `@UseBookmark` as well as the `org.springframework.data.neo4j.bookmark.BookmarkManager`
interface and its only implementation `org.springframework.data.neo4j.bookmark.CaffeineBookmarkManager` are gone and are not needed anymore.

SDN uses bookmarks for all transactions, without configuration.
You can remove the bean declaration of `CaffeineBookmarkManager` as well as the dependency to `com.github.ben-manes.caffeine:caffeine`.

If you absolutely must, you can disable the automatic bookmark management by following [these instructions](../faq.md#faq.bookmarks.noop).

<a id="migrating.autoindex"></a>

#### Automatic creation of constraints and indexes

SDN 5.3 and prior provided the "Automatic index manager" from Neo4j-OGM.

`@Index`, `@CompositeIndex` and `@Required` have been removed without replacement.
Why?
We think that creating the schema - even for a schemaless database - is not part of the domain modelling.
You could argue that an SDN model is the schema, but than we would answer that we even prefer a [Command-query separation](https://en.wikipedia.org/wiki/Command–query_separation),
meaning that we would rather define separate read and write models.
Those come in very handy for writing "boring" things and reading graph-shaped answers.

Apart from that, some of those annotations respectively their values are tied to specific Neo4j editions or versions, which makes them
hard to maintain.

The best argument however is going to production: While all tools that generate a schema are indeed helpful during development, even more so with databases that enforces a strict scheme,
they tend to be not so nice in production: How do you handle different versions of your application running at the same time?
Version A asserting the indexes that have been created by a newer version B?

We think it’s better to take control about this upfront and recommend using controlled database migrations, based on a tool like [Liquigraph](https://www.liquigraph.org) or [Neo4j migrations](https://github.com/michael-simons/neo4j-migrations).
The latter has been seen in use with SDN inside the JHipster project.
Both projects have in common that they store the current version of the schema within the database and make sure that a schema matches expectations before things are being updated.

Migrating off from previous Neo4j-OGM annotations affects `@Index`, `@CompositeIndex` and `@Required` and an example for those is given here in [A class making use of Neo4j-OGM automatic index manager](#indexed.class):

<a id="indexed.class"></a>

#### A class making use of Neo4j-OGM automatic index manager

```java
import org.neo4j.ogm.annotation.CompositeIndex;
import org.neo4j.ogm.annotation.GeneratedValue;
import org.neo4j.ogm.annotation.Id;
import org.neo4j.ogm.annotation.Index;
import org.neo4j.ogm.annotation.Required;

@CompositeIndex(properties = {"tagline", "released"})
public class Movie {

    @Id @GeneratedValue Long id;

    @Index(unique = true)
    private String title;

    private String description;

    private String tagline;

    @Required
    private Integer released;
}
```

It’s annotations are equivalent to the following scheme in Cypher (as of Neo4j 4.2):

#### Example Cypher based migration

```cypher
CREATE CONSTRAINT movies_unique_title ON (m:Movie) ASSERT m.title IS UNIQUE;
CREATE CONSTRAINT movies_released_exists ON (m:Movie) ASSERT EXISTS (m.released);
CREATE INDEX movies_tagline_released_idx FOR (m:Movie) ON (m.tagline, m.released);
```

Using `@Index` without `unique = true` is equivalent to `CREATE INDEX movie_title_index FOR (m:Movie) ON (m.title)`.
Note that a unique index already implies an index.

<a id="building-SDN"></a>

## Building Spring Data Neo4j

<a id="building-SDN.requirements"></a>

### Requirements

- JDK 17+ (Can be [OpenJDK](https://openjdk.java.net) or [Oracle JDK](https://www.oracle.com/technetwork/java/index.html))
- Maven 3.8.5 (We provide the Maven wrapper, see `mvnw` respectively `mvnw.cmd` in the project root; the wrapper downloads the appropriate Maven version automatically)
- A Neo4j 5.+ database, either

  - running locally
  - or indirectly via [Testcontainers](https://www.testcontainers.org) and [Docker](https://www.docker.com)

<a id="building-SDN.jdk.version"></a>

#### About the JDK version

Choosing JDK 17 is a decision influenced by various aspects

- SDN is a Spring Data project.
Spring Data commons baseline is JDK 17 and so is Spring Framework’s baseline.
Thus, it is only natural to keep the JDK 17 baseline.

<a id="building-SDN.running-the-build"></a>

### Running the build

The following sections are alternatives and roughly sorted by increased effort.

All builds require a local copy of the project:

<a id="checkout-SDN"></a>

#### Clone SDN

```console
$ git clone git@github.com:spring-projects/spring-data-neo4j.git
```

Before you proceed, verify your locally installed JDK version.
The output should be similar:

<a id="verify-jdk"></a>

#### Verify your JDK

```console
$ java -version
java version "18.0.1" 2022-04-19
Java(TM) SE Runtime Environment (build 18.0.1+10-24)
Java HotSpot(TM) 64-Bit Server VM (build 18.0.1+10-24, mixed mode, sharing)
```

<a id="building-SDN.docker"></a>

#### With Docker installed

<a id="building-SDN.docker.default-image"></a>

##### Using the default image

If you don’t have [Docker](<https://en.wikipedia.org/wiki/Docker_(software)>) installed, head over to [Docker Desktop](https://www.docker.com/products/docker-desktop).
In short, Docker is a tool that helps you running lightweight software images using OS-level virtualization in so-called containers.

Our build uses [Testcontainers Neo4j](https://www.testcontainers.org/modules/databases/neo4j/) to bring up a database instance.

<a id="build-default-bash"></a>

#### Build with default settings on Linux / macOS

```console
$ ./mvnw clean verify
```

On a Windows machine, use

<a id="build-default-windows"></a>

#### Build with default settings on Windows

```console
$ mvnw.cmd clean verify
```

The output should be similar.

<a id="building-SDN.docker.another-image"></a>

##### Using another image

The image version to use can be configured through an environmental variable like this:

<a id="build-other-image"></a>

#### Build using a different Neo4j Docker image

```console
$ SDN_NEO4J_VERSION=5.3.0-enterprise SDN_NEO4J_ACCEPT_COMMERCIAL_EDITION=yes ./mvnw clean verify
```

Here we are using 5.3.0 enterprise and also accept the license agreement.

Consult your operating system or shell manual on how to define environment variables if specifying them inline does not work for you.

<a id="building-SDN.local-database"></a>

#### Against a locally running database

> [!WARNING]
> Running against a locally running database **will** erase its complete content.

Building against a locally running database is faster, as it does not restart a container each time.
We do this a lot during our development.

You can get a copy of Neo4j at our [download center](https://neo4j.com/download-center/#enterprise) free of charge.

Please download the version applicable to your operating system and follow the instructions to start it.
A required step is to open a browser and go to [localhost:7474](http://localhost:7474) after you started the database and change the default password from `neo4j` to something of your liking.

After that, you can run a complete build by specifying the local `bolt` URL:

<a id="build-using-locally-running-database"></a>

#### Build using a locally running database

```console
$ SDN_NEO4J_URL=bolt://localhost:7687 SDN_NEO4J_PASSWORD=verysecret ./mvnw clean verify
```

<a id="building-SDN.environment-variables"></a>

### Summary of environment variables controlling the build

| Name | Default value | Meaning |
| --- | --- | --- |
| `SDN_NEO4J_VERSION` | 5.3.0 | Version of the Neo4j docker image to use, see [Neo4j Docker Official Images](https://hub.docker.com/_/neo4j) |
| `SDN_NEO4J_ACCEPT_COMMERCIAL_EDITION` | no | Some tests may require the enterprise edition of Neo4j. We build and test against the enterprise edition internally, but we won’t force you to accept the license if you don’t want to. |
| `SDN_NEO4J_URL` | not set | Setting this environment allows connecting to a locally running Neo4j instance. We use this a lot during development. |
| `SDN_NEO4J_PASSWORD` | not set | Password for the `neo4j` user of the instance configured with `SDN_NEO4J_URL`. |

> [!NOTE]
> You need to set both `SDN_NEO4J_URL` and `SDN_NEO4J_PASSWORD` to use a local instance.

<a id="building-SDN.checkstyle-and-co"></a>

### Checkstyle and friends

There is no quality gate in place at the moment to ensure that the code/test ratio stays as is, but please consider adding tests to your contributions.

We have some rather mild checkstyle rules in place, enforcing more or less default Java formatting rules.
Your build will break on formatting errors or something like unused imports.
