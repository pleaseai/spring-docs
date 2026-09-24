---
title: "Join-Type implementation"
source: "ROOT:elasticsearch/join-types.adoc"
---

<a id="elasticsearch.jointype"></a>

# Join-Type implementation

Spring Data Elasticsearch supports the [Join data type](https://www.elastic.co/guide/en/elasticsearch/reference/current/parent-join.html) for creating the corresponding index mappings and for storing the relevant information.

<a id="elasticsearch.jointype.setting-up"></a>

## Setting up the data

For an entity to be used in a parent child join relationship, it must have a property of type `JoinField` which must be annotated.
Let’s assume a `Statement` entity where a statement may be a *question*, an *answer*, a *comment* or a *vote* (a *Builder* is also shown in this example, it’s not necessary, but later used in the sample code):

```java
@Document(indexName = "statements")
@Routing("routing")                                                                       <.>
public class Statement {
    @Id
    private String id;

    @Field(type = FieldType.Text)
    private String text;

    @Field(type = FieldType.Keyword)
    private String routing;

    @JoinTypeRelations(
        relations =
            {
                @JoinTypeRelation(parent = "question", children = {"answer", "comment"}), <.>
                @JoinTypeRelation(parent = "answer", children = "vote")                   <.>
            }
    )
    private JoinField<String> relation;                                                   <.>

    private Statement() {
    }

    public static StatementBuilder builder() {
        return new StatementBuilder();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRouting() {
        return routing;
    }

    public void setRouting(Routing routing) {
        this.routing = routing;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public JoinField<String> getRelation() {
        return relation;
    }

    public void setRelation(JoinField<String> relation) {
        this.relation = relation;
    }

    public static final class StatementBuilder {
        private String id;
        private String text;
        private String routing;
        private JoinField<String> relation;

        private StatementBuilder() {
        }

        public StatementBuilder withId(String id) {
            this.id = id;
            return this;
        }

        public StatementBuilder withRouting(String routing) {
            this.routing = routing;
            return this;
        }

        public StatementBuilder withText(String text) {
            this.text = text;
            return this;
        }

        public StatementBuilder withRelation(JoinField<String> relation) {
            this.relation = relation;
            return this;
        }

        public Statement build() {
            Statement statement = new Statement();
            statement.setId(id);
            statement.setRouting(routing);
            statement.setText(text);
            statement.setRelation(relation);
            return statement;
        }
    }
}
```

1. for routing related info see [Routing values](routing.md)
1. a question can have answers and comments
1. an answer can have votes
1. the `JoinField` property is used to combine the name (*question*, *answer*, *comment* or *vote*) of the relation with the parent id.
The generic type must be the same as the `@Id` annotated property.

Spring Data Elasticsearch will build the following mapping for this class:

```json
{
  "statements": {
    "mappings": {
      "properties": {
        "_class": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "routing": {
          "type": "keyword"
        },
        "relation": {
          "type": "join",
          "eager_global_ordinals": true,
          "relations": {
            "question": [
              "answer",
              "comment"
            ],
            "answer": "vote"
          }
        },
        "text": {
          "type": "text"
        }
      }
    }
  }
}
```

<a id="elasticsearch.jointype.storing"></a>

## Storing data

Given a repository for this class the following code inserts a question, two answers, a comment and a vote:

```java
void init() {
    repository.deleteAll();

    Statement savedWeather = repository.save(
        Statement.builder()
            .withText("How is the weather?")
            .withRelation(new JoinField<>("question"))                          <1>
            .build());

    Statement sunnyAnswer = repository.save(
        Statement.builder()
            .withText("sunny")
            .withRelation(new JoinField<>("answer", savedWeather.getId()))      <2>
            .build());

    repository.save(
        Statement.builder()
            .withText("rainy")
            .withRelation(new JoinField<>("answer", savedWeather.getId()))      <3>
            .build());

    repository.save(
        Statement.builder()
            .withText("I don't like the rain")
            .withRelation(new JoinField<>("comment", savedWeather.getId()))     <4>
            .build());

    repository.save(
        Statement.builder()
            .withText("+1 for the sun")
            ,withRouting(savedWeather.getId())
            .withRelation(new JoinField<>("vote", sunnyAnswer.getId()))         <5>
            .build());
}
```

1. create a question statement
1. the first answer to the question
1. the second answer
1. a comment to the question
1. a vote for the first answer, this needs to have the routing set to the weather document, see [Routing values](routing.md).

<a id="elasticsearch.jointype.retrieving"></a>

## Retrieving data

Currently native queries must be used to query the data, so there is no support from standard repository methods. [repositories/custom-implementations.adoc](../repositories/custom-implementations.md) can be used instead.

The following code shows as an example how to retrieve all entries that have a *vote* (which must be *answers*, because only answers can have a vote) using an `ElasticsearchOperations` instance:

```java
SearchHits<Statement> hasVotes() {

	Query query = NativeQuery.builder()
		.withQuery(co.elastic.clients.elasticsearch._types.query_dsl.Query.of(qb -> qb
			.hasChild(hc -> hc
				.queryName("vote")
				.query(matchAllQueryAsQuery())
				.scoreMode(ChildScoreMode.None)
			)))
		.build();

	return operations.search(query, Statement.class);
}
```
