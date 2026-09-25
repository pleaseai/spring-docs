---
title: "Query creation"
source: "ROOT:appendix/query-creation.adoc"
---

<a id="query-creation"></a>

# Query creation

This chapter is about the technical creation of queries when using SDN’s abstraction layers.
There will be some simplifications because we do not discuss every possible case but stick with the general idea behind it.

<a id="query-creation.save"></a>

## Save

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

### Multiple entities

The `save` operation is overloaded with the functionality for accepting multiple entities of the same type.
If you are working with generated id values or make use of optimistic locking, every entity will result in a separate `CREATE` call.

In other cases SDN will create a parameter list with the entity information and provide it with a `MERGE` call.

`UNWIND $__entities__ AS entity MERGE (n:Person {customId: entity.$__id__}) SET n = entity.__properties__ RETURN collect(n.customId) AS $__ids__`

and the parameters look like

`:params {__entities__: [{__id__: 'aa', __properties__: {name: "PersonName", theId: "aa"}}, {__id__ 'bb', __properties__: {name: "AnotherPersonName", theId: "bb"}}]}`

<a id="query-creation.load"></a>

## Load

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

`RETURN n{.first_name, …​, Person_Has_Hobby: [(n)-[:Has]→(n_hobbies:Hobby)|n_hobbies{__internalNeo4jId__: id(n_hobbies), .name, __nodeLabels__: labels(n_hobbies)}]}`

The map projection and pattern comprehension used by SDN ensures that only the properties and relationships you have defined are getting queried.

In cases where you have self-referencing nodes or creating schemas that potentially lead to cycles in the data that gets returned,
SDN falls back to a cascading / data-driven query creation.
Starting with an initial query that looks for the specific node and considering the conditions,
it steps through the resulting nodes and, if their relationships are also mapped, would create further queries on the fly.
This query creation and execution loop will continue until no query finds new relationships or nodes.
The way of the creation can be seen analogue to the save/update process.
