---
title: "Annotated Controllers"
source: "ROOT:web/websocket/stomp/handle-annotations.adoc"
---

<a id="websocket-stomp-handle-annotations"></a>

# Annotated Controllers

Applications can use annotated `@Controller` classes to handle messages from clients.
Such classes can declare `@MessageMapping`, `@SubscribeMapping`, and `@ExceptionHandler`
methods, as described in the following topics:

- [`@MessageMapping`](#websocket-stomp-message-mapping)
- [`@SubscribeMapping`](#websocket-stomp-subscribe-mapping)
- [`@MessageExceptionHandler`](#websocket-stomp-exception-handler)

<a id="websocket-stomp-message-mapping"></a>

## `@MessageMapping`

You can use `@MessageMapping` to annotate methods that route messages based on their
destination. It is supported at the method level as well as at the type level. At the type
level, `@MessageMapping` is used to express shared mappings across all methods in a
controller.

By default, the mapping values are Ant-style path patterns (for example `/thing*`, `/thing/**`),
including support for template variables (for example, `/thing/{id}`). The values can be
referenced through `@DestinationVariable` method arguments. Applications can also switch to
a dot-separated destination convention for mappings, as explained in
[Dots as Separators](destination-separator.md).

<a id="supported-method-arguments"></a>

### Supported Method Arguments

The following table describes the method arguments:

| Method argument | Description |
| --- | --- |
| `Message` | For access to the complete message. |
| `MessageHeaders` | For access to the headers within the `Message`. |
| `MessageHeaderAccessor`, `SimpMessageHeaderAccessor`, and `StompHeaderAccessor` | For access to the headers through typed accessor methods. |
| `@Payload` | For access to the payload of the message, converted (for example, from JSON) by a configured `MessageConverter`. The presence of this annotation is not required since it is, by default, assumed if no other argument is matched. You can annotate payload arguments with `@jakarta.validation.Valid` or Spring’s `@Validated`, to have the payload arguments be automatically validated. |
| `@Header` | For access to a specific header value — along with type conversion using an `org.springframework.core.convert.converter.Converter`, if necessary. |
| `@Headers` | For access to all headers in the message. This argument must be assignable to `java.util.Map`. |
| `@DestinationVariable` | For access to template variables extracted from the message destination. Values are converted to the declared method argument type as necessary. |
| `java.security.Principal` | Reflects the user logged in at the time of the WebSocket HTTP handshake. |

<a id="return-values"></a>

### Return Values

By default, the return value from a `@MessageMapping` method is serialized to a payload
through a matching `MessageConverter` and sent as a `Message` to the `brokerChannel`,
from where it is broadcast to subscribers. The destination of the outbound message is the
same as that of the inbound message but prefixed with `/topic`.

You can use the `@SendTo` and `@SendToUser` annotations to customize the destination of
the output message. `@SendTo` is used to customize the target destination or to
specify multiple destinations. `@SendToUser` is used to direct the output message
to only the user associated with the input message. See [User Destinations](user-destination.md).

You can use both `@SendTo` and `@SendToUser` at the same time on the same method, and both
are supported at the class level, in which case they act as a default for methods in the
class. However, keep in mind that any method-level `@SendTo` or `@SendToUser` annotations
override any such annotations at the class level.

Messages can be handled asynchronously and a `@MessageMapping` method can return
`ListenableFuture`, `CompletableFuture`, or `CompletionStage`.

Note that `@SendTo` and `@SendToUser` are merely a convenience that amounts to using the
`SimpMessagingTemplate` to send messages. If necessary, for more advanced scenarios,
`@MessageMapping` methods can fall back on using the `SimpMessagingTemplate` directly.
This can be done instead of, or possibly in addition to, returning a value.
See [Sending Messages](handle-send.md).

<a id="websocket-stomp-subscribe-mapping"></a>

## `@SubscribeMapping`

`@SubscribeMapping` is similar to `@MessageMapping` but narrows the mapping to
subscription messages only. It supports the same
[method arguments](#websocket-stomp-message-mapping) as `@MessageMapping`. However
for the return value, by default, a message is sent directly to the client (through
`clientOutboundChannel`, in response to the subscription) and not to the broker (through
`brokerChannel`, as a broadcast to matching subscriptions). Adding `@SendTo` or
`@SendToUser` overrides this behavior and sends to the broker instead.

When is this useful? Assume that the broker is mapped to `/topic` and `/queue`, while
application controllers are mapped to `/app`. In this setup, the broker stores all
subscriptions to `/topic` and `/queue` that are intended for repeated broadcasts, and
there is no need for the application to get involved. A client could also subscribe to
some `/app` destination, and a controller could return a value in response to that
subscription without involving the broker without storing or using the subscription again
(effectively a one-time request-reply exchange). One use case for this is populating a UI
with initial data on startup.

When is this not useful? Do not try to map broker and controllers to the same destination
prefix unless you want both to independently process messages, including subscriptions,
for some reason. Inbound messages are handled in parallel. There are no guarantees whether
a broker or a controller processes a given message first. If the goal is to be notified
when a subscription is stored and ready for broadcasts, a client should ask for a
receipt if the server supports it (simple broker does not). For example, with the Java
[STOMP client](client.md), you could do the following to add a receipt:

```java
@Autowired
private TaskScheduler messageBrokerTaskScheduler;

// During initialization..
stompClient.setTaskScheduler(this.messageBrokerTaskScheduler);

// When subscribing..
StompHeaders headers = new StompHeaders();
headers.setDestination("/topic/...");
headers.setReceipt("r1");
FrameHandler handler = ...;
stompSession.subscribe(headers, handler).addReceiptTask(receiptHeaders -> {
	// Subscription ready...
});
```

A server side option is [to register](interceptors.md) an
`ExecutorChannelInterceptor` on the `brokerChannel` and implement the `afterMessageHandled`
method that is invoked after messages, including subscriptions, have been handled.

<a id="websocket-stomp-exception-handler"></a>

## `@MessageExceptionHandler`

An application can use `@MessageExceptionHandler` methods to handle exceptions from
`@MessageMapping` methods. You can declare exceptions in the annotation
itself or through a method argument if you want to get access to the exception instance.
The following example declares an exception through a method argument:

```java
@Controller
public class MyController {

	// ...

	@MessageExceptionHandler
	public ApplicationError handleException(MyException exception) {
		// ...
		return appError;
	}
}
```

`@MessageExceptionHandler` methods support flexible method signatures and support
the same method argument types and return values as
[`@MessageMapping`](#websocket-stomp-message-mapping) methods.

Typically, `@MessageExceptionHandler` methods apply within the `@Controller` class
(or class hierarchy) in which they are declared. If you want such methods to apply
more globally (across controllers), you can declare them in a class marked with
`@ControllerAdvice`. This is comparable to the
[similar support](../../webmvc/mvc-controller/ann-advice.md) available in Spring MVC.
