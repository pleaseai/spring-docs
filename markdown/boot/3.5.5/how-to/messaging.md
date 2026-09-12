---
title: "Messaging"
source: "how-to:messaging.adoc"
---

<a id="howto.messaging"></a>

# Messaging

Spring Boot offers a number of starters to support messaging.
This section answers questions that arise from using messaging with Spring Boot.

<a id="howto.messaging.disable-transacted-jms-session"></a>

## Disable Transacted JMS Session

If your JMS broker does not support transacted sessions, you have to disable the support of transactions altogether.
If you create your own [`JmsListenerContainerFactory`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/jms/config/JmsListenerContainerFactory.html), there is nothing to do, since, by default it cannot be transacted.
If you want to use the [`DefaultJmsListenerContainerFactoryConfigurer`](https://docs.spring.io/spring-boot/3.5.5/api/java/org/springframework/boot/autoconfigure/jms/DefaultJmsListenerContainerFactoryConfigurer.html) to reuse Spring Boot’s default, you can disable transacted sessions, as follows:

#### Java

```java
import jakarta.jms.ConnectionFactory;

import org.springframework.boot.autoconfigure.jms.DefaultJmsListenerContainerFactoryConfigurer;
import org.springframework.boot.jms.ConnectionFactoryUnwrapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.config.DefaultJmsListenerContainerFactory;

@Configuration(proxyBeanMethods = false)
public class MyJmsConfiguration {

	@Bean
	public DefaultJmsListenerContainerFactory jmsListenerContainerFactory(ConnectionFactory connectionFactory,
			DefaultJmsListenerContainerFactoryConfigurer configurer) {
		DefaultJmsListenerContainerFactory listenerFactory = new DefaultJmsListenerContainerFactory();
		configurer.configure(listenerFactory, ConnectionFactoryUnwrapper.unwrapCaching(connectionFactory));
		listenerFactory.setTransactionManager(null);
		listenerFactory.setSessionTransacted(false);
		return listenerFactory;
	}

}
```

#### Kotlin

```kotlin
import jakarta.jms.ConnectionFactory
import org.springframework.boot.jms.ConnectionFactoryUnwrapper
import org.springframework.boot.autoconfigure.jms.DefaultJmsListenerContainerFactoryConfigurer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.jms.config.DefaultJmsListenerContainerFactory

@Configuration(proxyBeanMethods = false)
class MyJmsConfiguration {

	@Bean
	fun jmsListenerContainerFactory(connectionFactory: ConnectionFactory?,
			configurer: DefaultJmsListenerContainerFactoryConfigurer): DefaultJmsListenerContainerFactory {
		val listenerFactory = DefaultJmsListenerContainerFactory()
		configurer.configure(listenerFactory, ConnectionFactoryUnwrapper.unwrapCaching(connectionFactory))
		listenerFactory.setTransactionManager(null)
		listenerFactory.setSessionTransacted(false)
		return listenerFactory
	}

}

```

The preceding example overrides the default factory, and it should be applied to any other factory that your application defines, if any.
