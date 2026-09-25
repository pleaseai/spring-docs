---
title: "Introducing Neo4j"
source: "ROOT:introduction-and-preface/preface-neo4j.adoc"
---

<a id="preface.neo4j"></a>

# Introducing Neo4j

A graph database is a storage engine that specializes in storing and retrieving vast networks of information.
It efficiently stores data as nodes with relationships to other or even the same nodes, thus allowing high-performance retrieval and querying of those structures.
Properties can be added to both nodes and relationships.
Nodes can be labelled by zero or more labels, relationships are always directed and named.

Graph databases are well suited for storing most kinds of domain models.
In almost all domains, there are certain things connected to other things.
In most other modeling approaches, the relationships between things are reduced to a single link without identity and attributes.
Graph databases allow to keep the rich relationships that originate from the domain equally well-represented in the database without resorting to also modeling the relationships as "things".
There is very little "impedance mismatch" when putting real-life domains into a graph database.

[Neo4j](https://neo4j.com/) is an open source NoSQL graph database.
It is a fully transactional database (ACID) that stores data structured as graphs consisting of nodes, connected by relationships.
Inspired by the structure of the real world, it allows for high query performance on complex data, while remaining intuitive and simple for the developer.

The starting point for learning about Neo4j is [neo4j.com](https://neo4j.com/).
Here is a list of useful resources:

- The [Neo4j documentation](https://neo4j.com/docs/) introduces Neo4j and contains links to getting started guides, reference documentation and tutorials.
- The [online sandbox](https://neo4j.com/sandbox/) provides a convenient way to interact with a Neo4j instance in combination with the online [tutorial](https://neo4j.com/developer/get-started/).
- Neo4j [Java Bolt Driver](https://neo4j.com/developer/java/)
- Several [books](https://neo4j.com/books/) available for purchase and [videos](https://www.youtube.com/neo4j) to watch.
