---
title: "Receiving a Message"
source: "ROOT:integration/jms/receiving.adoc"
---

<a id="jms-receiving"></a>

# Receiving a Message

This describes how to receive messages with JMS in Spring.

<a id="jms-receiving-sync"></a>

## Synchronous Receipt

While JMS is typically associated with asynchronous processing, you can consume messages
synchronously. The `receive(..)` methods on `JmsTemplate` and `JmsClient` provide this
functionality. During a synchronous receive, the calling thread blocks until a message
becomes available. This can be a dangerous operation, since the calling thread can
potentially be blocked indefinitely. The `receiveTimeout` property specifies how long
the receiver should wait before giving up waiting for a message.

<a id="jms-receiving-async"></a>

## Asynchronous Receipt: Message-Driven POJOs

> [!NOTE]
> Spring also supports annotated-listener endpoints through the use of the `@JmsListener`
> annotation and provides open infrastructure to register endpoints programmatically.
> This is, by far, the most convenient way to set up an asynchronous receiver.
> See [Enable Listener Endpoint Annotations](annotated.md#jms-annotated-support) for more details.

In a fashion similar to a Message-Driven Bean (MDB) in the EJB world, the Message-Driven
POJO (MDP) acts as a receiver for JMS messages. The one restriction (but see
[Using `MessageListenerAdapter`](#jms-receiving-async-message-listener-adapter))
on an MDP is that it must implement the `jakarta.jms.MessageListener` interface.
Note that, if your POJO receives messages on multiple threads, it is important to
ensure that your implementation is thread-safe.

The following example shows a simple implementation of an MDP:

#### Java

```java
public class ExampleListener implements MessageListener {

	public void onMessage(Message message) {
		if (message instanceof TextMessage textMessage) {
			try {
				System.out.println(textMessage.getText());
			}
			catch (JMSException ex) {
				throw new RuntimeException(ex);
			}
		}
		else {
			throw new IllegalArgumentException("Message must be of type TextMessage");
		}
	}
}
```

#### Kotlin

```kotlin
class ExampleListener : MessageListener {

	override fun onMessage(message: Message) {
		if (message is TextMessage) {
			try {
				println(message.text)
			} catch (ex: JMSException) {
				throw RuntimeException(ex)
			}
		} else {
			throw IllegalArgumentException("Message must be of type TextMessage")
		}
	}
}
```

Once you have implemented your `MessageListener`, it is time to create a message listener
container.

The following example shows how to define and configure one of the message listener
containers that ships with Spring (in this case, `DefaultMessageListenerContainer`):

#### Java

```java
@Bean
ExampleListener messageListener() {
	return new ExampleListener();
}

@Bean
DefaultMessageListenerContainer jmsContainer(ConnectionFactory connectionFactory, Destination destination,
		ExampleListener messageListener) {

	DefaultMessageListenerContainer jmsContainer = new DefaultMessageListenerContainer();
	jmsContainer.setConnectionFactory(connectionFactory);
	jmsContainer.setDestination(destination);
	jmsContainer.setMessageListener(messageListener);
	return jmsContainer;
}
```

#### Kotlin

```kotlin
@Bean
fun messageListener() = ExampleListener()

@Bean
fun jmsContainer(connectionFactory: ConnectionFactory, destination: Destination, messageListener: ExampleListener) =
	DefaultMessageListenerContainer().apply {
		setConnectionFactory(connectionFactory)
		setDestination(destination)
		setMessageListener(messageListener)
	}
```

#### Xml

```xml
<!-- this is the Message Driven POJO (MDP) -->
<bean id="messageListener" class="jmsexample.ExampleListener"/>

<!-- and this is the message listener container -->
<bean id="jmsContainer" class="org.springframework.jms.listener.DefaultMessageListenerContainer">
	<property name="connectionFactory" ref="connectionFactory"/>
	<property name="destination" ref="destination"/>
	<property name="messageListener" ref="messageListener"/>
</bean>
```

See the Spring javadoc of the various message listener containers (all of which implement
[MessageListenerContainer](https://docs.spring.io/spring-framework/docs/7.0.7/javadoc-api/org/springframework/jms/listener/MessageListenerContainer.html))
for a full description of the features supported by each implementation.

<a id="jms-receiving-async-session-aware-message-listener"></a>

## Using the `SessionAwareMessageListener` Interface

The `SessionAwareMessageListener` interface is a Spring-specific interface that provides
a similar contract to the JMS `MessageListener` interface but also gives the message-handling
method access to the JMS `Session` from which the `Message` was received.
The following listing shows the definition of the `SessionAwareMessageListener` interface:

```java
package org.springframework.jms.listener;

public interface SessionAwareMessageListener {

	void onMessage(Message message, Session session) throws JMSException;
}
```

You can choose to have your MDPs implement this interface (in preference to the standard
JMS `MessageListener` interface) if you want your MDPs to be able to respond to any
received messages (by using the `Session` supplied in the `onMessage(Message, Session)`
method). All of the message listener container implementations that ship with Spring
have support for MDPs that implement either the `MessageListener` or
`SessionAwareMessageListener` interface. Classes that implement the
`SessionAwareMessageListener` come with the caveat that they are then tied to Spring
through the interface. The choice of whether or not to use it is left entirely up to you
as an application developer or architect.

Note that the `onMessage(..)` method of the `SessionAwareMessageListener`
interface throws `JMSException`. In contrast to the standard JMS `MessageListener`
interface, when using the `SessionAwareMessageListener` interface, it is the
responsibility of the client code to handle any thrown exceptions.

<a id="jms-receiving-async-message-listener-adapter"></a>

## Using `MessageListenerAdapter`

The `MessageListenerAdapter` class is the final component in Spring’s asynchronous
messaging support. In a nutshell, it lets you expose almost any class as an MDP
(though there are some constraints).

Consider the following interface definition:

#### Java

```java
public interface MessageDelegate {

	void handleMessage(String message);

	void handleMessage(Map message);

	void handleMessage(byte[] message);

	void handleMessage(Serializable message);
}
```

#### Kotlin

```kotlin
interface MessageDelegate {
	fun handleMessage(message: String)
	fun handleMessage(message: Map<*, *>)
	fun handleMessage(message: ByteArray)
	fun handleMessage(message: Serializable)
}
```

Notice that, although the interface extends neither the `MessageListener` nor the
`SessionAwareMessageListener` interface, you can still use it as an MDP by using the
`MessageListenerAdapter` class. Notice also how the various message handling methods are
strongly typed according to the contents of the various `Message` types that they can
receive and handle.

Now consider the following implementation of the `MessageDelegate` interface:

#### Java

```java
public class DefaultMessageDelegate implements MessageDelegate {

	@Override
	public void handleMessage(String message) {
		// ...
	}

	@Override
	public void handleMessage(Map message) {
		// ...
	}

	@Override
	public void handleMessage(byte[] message) {
		// ...
	}

	@Override
	public void handleMessage(Serializable message) {
		// ...
	}
}
```

#### Kotlin

```kotlin
class DefaultMessageDelegate : MessageDelegate {

	override fun handleMessage(message: String) {
		// ...
	}

	override fun handleMessage(message: Map<*, *>) {
		// ...
	}

	override fun handleMessage(message: ByteArray) {
		// ...
	}

	override fun handleMessage(message: Serializable) {
		// ...
	}
}
```

In particular, note how the preceding implementation of the `MessageDelegate` interface (the
`DefaultMessageDelegate` class) has no JMS dependencies at all. It truly is a
POJO that we can make into an MDP through the following configuration:

#### Java

```java
@Bean
MessageListenerAdapter messageListener(DefaultMessageDelegate messageDelegate) {
	return new MessageListenerAdapter(messageDelegate);
}

@Bean
DefaultMessageListenerContainer jmsContainer(ConnectionFactory connectionFactory, Destination destination,
		ExampleListener messageListener) {

	DefaultMessageListenerContainer jmsContainer = new DefaultMessageListenerContainer();
	jmsContainer.setConnectionFactory(connectionFactory);
	jmsContainer.setDestination(destination);
	jmsContainer.setMessageListener(messageListener);
	return jmsContainer;
}
```

#### Kotlin

```kotlin
@Bean
fun messageListener(messageDelegate: DefaultMessageDelegate): MessageListenerAdapter {
	return MessageListenerAdapter(messageDelegate)
}

@Bean
fun jmsContainer(connectionFactory: ConnectionFactory, destination: Destination, messageListener: ExampleListener) =
	DefaultMessageListenerContainer().apply {
		setConnectionFactory(connectionFactory)
		setDestination(destination)
		setMessageListener(messageListener)
	}
```

#### Xml

```xml
<!-- this is the Message Driven POJO (MDP) -->
<bean id="messageListener" class="org.springframework.jms.listener.adapter.MessageListenerAdapter">
	<constructor-arg>
		<bean class="jmsexample.DefaultMessageDelegate"/>
	</constructor-arg>
</bean>

<!-- and this is the message listener container... -->
<bean id="jmsContainer" class="org.springframework.jms.listener.DefaultMessageListenerContainer">
	<property name="connectionFactory" ref="connectionFactory"/>
	<property name="destination" ref="destination"/>
	<property name="messageListener" ref="messageListener"/>
</bean>
```

The next example shows another MDP that can handle only receiving JMS
`TextMessage` messages. Notice how the message handling method is actually called
`receive` (the name of the message handling method in a `MessageListenerAdapter`
defaults to `handleMessage`), but it is configurable (as you can see later in this section). Notice
also how the `receive(..)` method is strongly typed to receive and respond only to JMS
`TextMessage` messages.
The following listing shows the definition of the `TextMessageDelegate` interface:

#### Java

```java
public interface TextMessageDelegate {

	void receive(TextMessage message);
}
```

#### Kotlin

```kotlin
interface TextMessageDelegate {
	fun receive(message: TextMessage)
}
```

The following listing shows a class that implements the `TextMessageDelegate` interface:

#### Java

```java
public class DefaultTextMessageDelegate implements TextMessageDelegate {

	@Override
	public void receive(TextMessage message) {
		// ...
	}
}
```

#### Kotlin

```kotlin
class DefaultTextMessageDelegate : TextMessageDelegate {

	override fun receive(message: TextMessage) {
		// ...
	}
}
```

The configuration of the attendant `MessageListenerAdapter` would then be as follows:

#### Java

```java
@Bean
MessageListenerAdapter messageListener(DefaultTextMessageDelegate messageDelegate) {
	MessageListenerAdapter messageListener = new MessageListenerAdapter(messageDelegate);
	messageListener.setDefaultListenerMethod("receive");
	// We don't want automatic message context extraction
	messageListener.setMessageConverter(null);
	return messageListener;
}
```

#### Kotlin

```kotlin
@Bean
fun messageListener(messageDelegate: DefaultTextMessageDelegate) = MessageListenerAdapter(messageDelegate).apply {
	setDefaultListenerMethod("receive")
	// We don't want automatic message context extraction
	setMessageConverter(null)
}
```

#### Xml

```xml
<bean id="messageListener" class="org.springframework.jms.listener.adapter.MessageListenerAdapter">
	<constructor-arg>
		<bean class="jmsexample.DefaultTextMessageDelegate"/>
	</constructor-arg>
	<property name="defaultListenerMethod" value="receive"/>
	<!-- we don't want automatic message context extraction -->
	<property name="messageConverter">
		<null/>
	</property>
</bean>
```

Note that, if the `messageListener` receives a JMS `Message` of a type
other than `TextMessage`, an `IllegalStateException` is thrown (and subsequently
swallowed). Another of the capabilities of the `MessageListenerAdapter` class is the
ability to automatically send back a response `Message` if a handler method returns a
non-void value. Consider the following interface and class:

#### Java

```java
public interface ResponsiveTextMessageDelegate {

	// Notice the return type...
	String receive(TextMessage message);
}
```

#### Kotlin

```kotlin
interface ResponsiveTextMessageDelegate {

	// Notice the return type...
	fun receive(message: TextMessage): String
}
```

#### Java

```java
public class DefaultResponsiveTextMessageDelegate implements ResponsiveTextMessageDelegate {

	@Override
	public String receive(TextMessage message) {
		return "message";
	}
}
```

#### Kotlin

```kotlin
class DefaultResponsiveTextMessageDelegate : ResponsiveTextMessageDelegate {

	override fun receive(message: TextMessage): String {
		return "message"
	}
}
```

If you use the `DefaultResponsiveTextMessageDelegate` in conjunction with a
`MessageListenerAdapter`, any non-null value that is returned from the execution of
the `'receive(..)'` method is (in the default configuration) converted into a
`TextMessage`. The resulting `TextMessage` is then sent to the `Destination` (if
one exists) defined in the JMS `Reply-To` property of the original `Message` or the
default `Destination` set on the `MessageListenerAdapter` (if one has been configured).
If no `Destination` is found, an `InvalidDestinationException` is thrown
(note that this exception is not swallowed and propagates up the
call stack).

<a id="jms-tx-participation"></a>

## Processing Messages Within Transactions

Invoking a message listener within a transaction requires only reconfiguration of the
listener container.

You can activate local resource transactions through the `sessionTransacted` flag
on the listener container definition. Each message listener invocation then operates
within an active JMS transaction, with message receipt rolled back in case of listener
execution failure. Sending a response message (through `SessionAwareMessageListener`) is
part of the same local transaction, but any other resource operations (such as
database access) operate independently. This usually requires duplicate message
detection in the listener implementation, to cover the case where database processing
has committed but message processing failed to commit.

Consider the following bean definition:

#### Java

```java
@Bean
DefaultMessageListenerContainer jmsContainer(ConnectionFactory connectionFactory, Destination destination,
		ExampleListener messageListener) {

	DefaultMessageListenerContainer jmsContainer = new DefaultMessageListenerContainer();
	jmsContainer.setConnectionFactory(connectionFactory);
	jmsContainer.setDestination(destination);
	jmsContainer.setMessageListener(messageListener);
	jmsContainer.setSessionTransacted(true);
	return jmsContainer;
}
```

#### Kotlin

```kotlin
@Bean
fun jmsContainer(connectionFactory: ConnectionFactory, destination: Destination, messageListener: ExampleListener) =
	DefaultMessageListenerContainer().apply {
		setConnectionFactory(connectionFactory)
		setDestination(destination)
		setMessageListener(messageListener)
		isSessionTransacted = true
	}
```

#### Xml

```xml
<bean id="jmsContainer" class="org.springframework.jms.listener.DefaultMessageListenerContainer">
	<property name="connectionFactory" ref="connectionFactory"/>
	<property name="destination" ref="destination"/>
	<property name="messageListener" ref="messageListener"/>
	<property name="sessionTransacted" value="true"/>
</bean>
```

To participate in an externally managed transaction, you need to configure a
transaction manager and use a listener container that supports externally managed
transactions (typically, `DefaultMessageListenerContainer`).

To configure a message listener container for XA transaction participation, you want
to configure a `JtaTransactionManager` (which, by default, delegates to the Jakarta EE
server’s transaction subsystem). Note that the underlying JMS `ConnectionFactory` needs to
be XA-capable and properly registered with your JTA transaction coordinator. (Check your
Jakarta EE server’s configuration of JNDI resources.) This lets message receipt as well
as (for example) database access be part of the same transaction (with unified commit
semantics, at the expense of XA transaction log overhead).

The following bean definition creates a transaction manager:

#### Java

```java
@Bean
JtaTransactionManager transactionManager()  {
	return new JtaTransactionManager();
}
```

#### Kotlin

```kotlin
@Bean
fun transactionManager() = JtaTransactionManager()
```

#### Xml

```xml
<bean id="transactionManager" class="org.springframework.transaction.jta.JtaTransactionManager"/>
```

Then we need to add it to our earlier container configuration. The container
takes care of the rest. The following example shows how to do so:

#### Java

```java
@Bean
DefaultMessageListenerContainer jmsContainer(ConnectionFactory connectionFactory, Destination destination,
		ExampleListener messageListener) {

	DefaultMessageListenerContainer jmsContainer = new DefaultMessageListenerContainer();
	jmsContainer.setConnectionFactory(connectionFactory);
	jmsContainer.setDestination(destination);
	jmsContainer.setMessageListener(messageListener);
	jmsContainer.setSessionTransacted(true);
	return jmsContainer;
}
```

#### Kotlin

```kotlin
@Bean
fun jmsContainer(connectionFactory: ConnectionFactory, destination: Destination, messageListener: ExampleListener,
				 transactionManager: JtaTransactionManager) =
	DefaultMessageListenerContainer().apply {
		setConnectionFactory(connectionFactory)
		setDestination(destination)
		setMessageListener(messageListener)
		setTransactionManager(transactionManager)
	}
```

#### Xml

```xml
<bean id="jmsContainer" class="org.springframework.jms.listener.DefaultMessageListenerContainer">
	<property name="connectionFactory" ref="connectionFactory"/>
	<property name="destination" ref="destination"/>
	<property name="messageListener" ref="messageListener"/>
	<property name="transactionManager" ref="transactionManager"/>
</bean>
```
