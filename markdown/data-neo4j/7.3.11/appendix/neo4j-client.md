---
title: "Neo4jClient"
source: "ROOT:appendix/neo4j-client.adoc"
---

<a id="neo4j-client"></a>

# Neo4jClient

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

## Imperative or reactive?

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

## Getting an instance of the client

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

## Usage

<a id="neo4j-client-selecting-the-target-database"></a>

### Selecting the target database

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

### Specifying queries

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

### Retrieving results

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

### Mapping parameters

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

### Working with result objects

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

#### Using domain-aware mapping functions

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

### Interacting directly with the driver while using managed transactions

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
