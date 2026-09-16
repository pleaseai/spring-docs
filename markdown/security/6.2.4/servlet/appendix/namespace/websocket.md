---
title: "WebSocket Security"
source: "ROOT:servlet/appendix/namespace/websocket.adoc"
---

<a id="nsa-websocket-security"></a>

# WebSocket Security

Spring Security 4.0+ provides support for authorizing messages.
One concrete example of where this is useful is to provide authorization in WebSocket based applications.

<a id="nsa-websocket-message-broker"></a>

## <websocket-message-broker>

The websocket-message-broker element has two different modes.
If the [websocket-message-broker@id](#nsa-websocket-message-broker-id) is not specified, then it will do the following things:

- Ensure that any SimpAnnotationMethodMessageHandler has the AuthenticationPrincipalArgumentResolver registered as a custom argument resolver.
This allows the use of `@AuthenticationPrincipal` to resolve the principal of the current `Authentication`
- Ensures that the SecurityContextChannelInterceptor is automatically registered for the clientInboundChannel.
This populates the SecurityContextHolder with the user that is found in the Message
- Ensures that a ChannelSecurityInterceptor is registered with the clientInboundChannel.
This allows authorization rules to be specified for a message.
- Ensures that a CsrfChannelInterceptor is registered with the clientInboundChannel.
This ensures that only requests from the original domain are enabled.
- Ensures that a CsrfTokenHandshakeInterceptor is registered with WebSocketHttpRequestHandler, TransportHandlingSockJsService, or DefaultSockJsService.
This ensures that the expected CsrfToken from the HttpServletRequest is copied into the WebSocket Session attributes.

If additional control is necessary, the id can be specified and a ChannelSecurityInterceptor will be assigned to the specified id.
All the wiring with Spring’s messaging infrastructure can then be done manually.
This is more cumbersome, but provides greater control over the configuration.

<a id="nsa-websocket-message-broker-attributes"></a>

### <websocket-message-broker> Attributes

<a id="nsa-websocket-message-broker-id"></a>

- **id** A bean identifier, used for referring to the ChannelSecurityInterceptor bean elsewhere in the context.
If specified, Spring Security requires explicit configuration within Spring Messaging.
If not specified, Spring Security will automatically integrate with the messaging infrastructure as described in [<websocket-message-broker>](#nsa-websocket-message-broker)

<a id="nsa-websocket-message-broker-same-origin-disabled"></a>

- **same-origin-disabled** Disables the requirement for CSRF token to be present in the Stomp headers (default false).
Changing the default is useful if it is necessary to allow other origins to make SockJS connections.

<a id="nsa-websocket-message-broker-authorization-manager-ref"></a>

- **authorization-manager-ref** Use this `AuthorizationManager` instance; when set, `use-authorization-manager` is ignored and assumed to be `true`

<a id="nsa-websocket-message-broker-use-authorization-manager"></a>

- **use-authorization-manager** Use `AuthorizationManager` API instead of `SecurityMetadataSource` API (defaults to true).

<a id="nsa-websocket-message-broker-security-context-holder-strategy-ref"></a>

- **security-context-holder-strategy-ref** Use this `SecurityContextHolderStrategy` (note only supported in conjunction with the `AuthorizationManager` API)

<a id="nsa-websocket-message-broker-children"></a>

### Child Elements of <websocket-message-broker>

- [expression-handler](http.md#nsa-expression-handler)
- [intercept-message](#nsa-intercept-message)

<a id="nsa-intercept-message"></a>

## <intercept-message>

Defines an authorization rule for a message.

<a id="nsa-intercept-message-parents"></a>

### Parent Elements of <intercept-message>

- [websocket-message-broker](#nsa-websocket-message-broker)

<a id="nsa-intercept-message-attributes"></a>

### <intercept-message> Attributes

<a id="nsa-intercept-message-pattern"></a>

- **pattern** An ant based pattern that matches on the Message destination.
For example, "/**" matches any Message with a destination; "/admin/**" matches any Message that has a destination that starts with "/admin/\*\*".

<a id="nsa-intercept-message-type"></a>

- **type** The type of message to match on.
Valid values are defined in SimpMessageType (i.e. CONNECT, CONNECT\_ACK, HEARTBEAT, MESSAGE, SUBSCRIBE, UNSUBSCRIBE, DISCONNECT, DISCONNECT\_ACK, OTHER).

<a id="nsa-intercept-message-access"></a>

- **access** The expression used to secure the Message.
For example, "denyAll" will deny access to all of the matching Messages; "permitAll" will grant access to all of the matching Messages; "hasRole('ADMIN') requires the current user to have the role 'ROLE\_ADMIN' for the matching Messages.
