---
title: "Getting Started"
source: "ROOT:mongodb/getting-started.adoc"
---

<a id="mongodb-getting-started"></a>

# Getting Started

An easy way to bootstrap setting up a working environment is to create a Spring-based project via [start.spring.io](https://start.spring.io/#!type=maven-project&dependencies=data-mongodb) or create a Spring project in [Spring Tools](https://spring.io/tools).

<a id="mongo.examples-repo"></a>

## Examples Repository

The GitHub [spring-data-examples repository](https://github.com/spring-projects/spring-data-examples) hosts several examples that you can download and play around with to get a feel for how the library works.

<a id="mongodb.hello-world"></a>

## Hello World

First, you need to set up a running MongoDB server. Refer to the [MongoDB Quick Start guide](https://docs.mongodb.org/manual/core/introduction/) for an explanation on how to startup a MongoDB instance.
Once installed, starting MongoDB is typically a matter of running the following command: `/bin/mongod`

Then you can create a `Person` class to persist:

```java

public class Person {

	private String id;
	private String name;
	private int age;

	public Person(String name, int age) {
		this.name = name;
		this.age = age;
	}

	public String getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public int getAge() {
		return age;
	}

	@Override
	public String toString() {
		return "Person [id=" + id + ", name=" + name + ", age=" + age + "]";
	}
}
```

You also need a main application to run:

#### Imperative

```java

import static org.springframework.data.mongodb.core.query.Criteria.*;

import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.mongodb.client.MongoClients;

public class MongoApplication {

	public static void main(String[] args) throws Exception {

		MongoOperations mongoOps = new MongoTemplate(MongoClients.create(), "database");
		mongoOps.insert(new Person("Joe", 34));

		System.out.println(mongoOps.query(Person.class).matching(where("name").is("Joe")).firstValue());

		mongoOps.dropCollection("person");
	}
}
```

#### Reactive

```java

import static org.springframework.data.mongodb.core.query.Criteria.*;

import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;

import com.mongodb.reactivestreams.client.MongoClients;

public class ReactiveMongoApplication {

	public static void main(String[] args) throws Exception {

		ReactiveMongoOperations mongoOps = new ReactiveMongoTemplate(MongoClients.create(), "database");

		mongoOps.insert(new Person("Joe", 34))
			.then(mongoOps.query(Person.class).matching(where("name").is("Joe")).first())
			.doOnNext(System.out::println)
			.block();

		mongoOps.dropCollection("person").block();
	}
}
```

When you run the main program, the preceding examples produce the following output:

```
10:01:32,265 DEBUG o.s.data.mongodb.core.MongoTemplate - insert Document containing fields: [_class, age, name] in collection: Person
10:01:32,765 DEBUG o.s.data.mongodb.core.MongoTemplate - findOne using query: { "name" : "Joe"} in db.collection: database.Person
Person [id=4ddbba3c0be56b7e1b210166, name=Joe, age=34]
10:01:32,984 DEBUG o.s.data.mongodb.core.MongoTemplate - Dropped collection [database.person]
```

Even in this simple example, there are few things to notice:

- You can instantiate the central helper class of Spring Mongo, [`MongoTemplate`](template-api.md), by using the standard or reactive `MongoClient` object and the name of the database to use.
- The mapper works against standard POJO objects without the need for any additional metadata (though you can optionally provide that information. See [here](mapping/mapping.md)).
- Conventions are used for handling the `id` field, converting it to be an `ObjectId` when stored in the database.
- Mapping conventions can use field access. Notice that the `Person` class has only getters.
- If the constructor argument names match the field names of the stored document, they are used to instantiate the object
