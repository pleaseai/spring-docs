---
title: "Spring Data Neo4j Extensions"
source: "ROOT:repositories/sdn-extension.adoc"
---

<a id="sdn-mixins"></a>

# Spring Data Neo4j Extensions

<a id="_available_extensions_for_spring_data_neo4j_repositories"></a>

## Available extensions for Spring Data Neo4j repositories

Spring Data Neo4j offers a couple of extensions or "mixins" that can be added to repositories. What is a mixin? According to
[Wikipedia](https://en.wikipedia.org/wiki/Mixin) mixins are a language concept that allows a programmer to inject some code
into a class. Mixin programming is a style of software development, in which units of functionality are created in a class
and then mixed in with other classes.

Java does not support that concept on the language level, but we do emulate it via a couple of interfaces and a runtime
that adds appropriate implementations and interceptors for.

Mixins added by default are `QueryByExampleExecutor` and `ReactiveQueryByExampleExecutor` respectively. Those interfaces are
explained in detail in [Query by Example](../query-by-example.md#query-by-example).

Additional mixins provided are:

- `QuerydslPredicateExecutor`
- `CypherdslConditionExecutor`
- `CypherdslStatementExecutor`
- `ReactiveQuerydslPredicateExecutor`
- `ReactiveCypherdslConditionExecutor`
- `ReactiveCypherdslStatementExecutor`

<a id="sdn-mixins.dynamic-conditions"></a>

### Add dynamic conditions to generated queries

Both the `QuerydslPredicateExecutor` and `CypherdslConditionExecutor` provide the same concept: SDN generates a query, you
provide "predicates" (Query DSL) or "conditions" (Cypher DSL) that will be added. We recommend the Cypher DSL, as this is
what SDN uses natively. You might even want to consider using the
[annotation processor](https://neo4j.github.io/cypher-dsl#thespringdataneo4j6annotationprocessor) that generates
a static meta model for you.

How does that work? Declare your repository as described above and add **one**  of the following interfaces:

```java
interface QueryDSLPersonRepository extends Neo4jRepository<Person, Long>, // <.>
        QuerydslPredicateExecutor<Person> {

    // <.>

}

static class DtoPersonProjection {

    private final String firstName;

    DtoPersonProjection(String firstName) {
        this.firstName = firstName;
    }

    String getFirstName() {
        return this.firstName;
    }

}
```

1. Standard repository declaration
1. The Query DSL mixin

**OR**

```java
interface PersonRepository extends Neo4jRepository<Person, Long>, // <.>
        CypherdslConditionExecutor<Person> {

    // <.>

}
```

1. Standard repository declaration
1. The Cypher DSL mixin

Exemplary usage is shown with the Cypher DSL condition executor:

```java
Node person = Cypher.node("Person").named("person"); // <.>
Property firstName = person.property("firstName"); // <.>
Property lastName = person.property("lastName");

assertThat(repository.findAll(
        this.firstName.eq(Cypher.anonParameter("Helge"))
            .or(this.lastName.eq(Cypher.parameter("someName", "B."))), // <.>
        this.lastName.descending() // <.>
)).extracting(Person::getFirstName).containsExactly("Helge", "Bela");
```

1. Define a named `Node` object, targeting the root of the query
1. Derive some properties from it
1. Create an `or` condition. An anonymous parameter is used for the first name, a named parameter for
the last name. This is how you define parameters in those fragments and one of the advantages over the Query-DSL
mixin which can’t do that.
Literals can be expressed with `Cypher.literalOf`.
1. Define a `SortItem` from one of the properties

The code looks pretty similar for the Query-DSL mixin. Reasons for the Query-DSL mixin can be familiarity of the API and
that it works with other stores, too. Reasons against it are the fact that you need an additional library on the class path,
it’s missing support for traversing relationships and the above-mentioned fact that it doesn’t support parameters in its
predicates (it technically does, but there are no API methods to actually pass them to the query being executed).

<a id="sdn-mixins.using-cypher-dsl-statements"></a>

### Using (dynamic) Cypher-DSL statements for entities and projections

Adding the corresponding mixin is not different from using the [condition excecutor](#sdn-mixins.dynamic-conditions):

```java
interface PersonRepository extends Neo4jRepository<Person, Long>, CypherdslStatementExecutor<Person> {

}
```

Please use the `ReactiveCypherdslStatementExecutor` when extending the `ReactiveNeo4jRepository`.

The `CypherdslStatementExecutor` comes with several overloads for `findOne` and `findAll`. They all take a Cypher-DSL
statement respectively an ongoing definition of that as a first parameter and in case of the projecting methods, a type.

If a query requires parameters, they must be defined via the Cypher-DSL itself and also populated by it, as the following listing shows:

```java
static Statement whoHasFirstNameWithAddress(String name) { // <.>
    Node p = Cypher.node("Person").named("p"); // <.>
    Node a = Cypher.anyNode("a");
    Relationship r = p.relationshipTo(a, "LIVES_AT");
    return Cypher.match(r)
        .where(p.property("firstName").isEqualTo(Cypher.anonParameter(name))) // <.>
        .returning(p.getRequiredSymbolicName(), Cypher.collect(r), Cypher.collect(a))
        .build();
}

@Test
void fineOneShouldWork(@Autowired PersonRepository repository) {

    Optional<Person> result = repository.findOne(whoHasFirstNameWithAddress("Helge")); // <.>

    assertThat(result).hasValueSatisfying(namesOnly -> {
        assertThat(namesOnly.getFirstName()).isEqualTo("Helge");
        assertThat(namesOnly.getLastName()).isEqualTo("Schneider");
        assertThat(namesOnly.getAddress()).extracting(Person.Address::getCity).isEqualTo("Mülheim an der Ruhr");
    });
}

@Test
void fineOneProjectedShouldWork(@Autowired PersonRepository repository) {

    Optional<NamesOnly> result = repository.findOne(whoHasFirstNameWithAddress("Helge"), NamesOnly.class // <.>
    );

    assertThat(result).hasValueSatisfying(namesOnly -> {
        assertThat(namesOnly.getFirstName()).isEqualTo("Helge");
        assertThat(namesOnly.getLastName()).isEqualTo("Schneider");
        assertThat(namesOnly.getFullName()).isEqualTo("Helge Schneider");
    });
}
```

1. The dynamic query is build in a type safe way in a helper method
1. We already saw this in [here](#sdn-mixins.dynamic-conditions), where we also defined some variables holding the model
1. We define an anonymous parameter, filled by the actual value of `name`, which was passed to the method
1. The statement returned from the helper method is used to find an entity
1. Or a projection.

The `findAll` methods works similar.
The imperative Cypher-DSL statement executor also provides an overload returning paged results.
