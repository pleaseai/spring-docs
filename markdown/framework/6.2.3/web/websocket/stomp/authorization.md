---
title: "Authorization"
source: "ROOT:web/websocket/stomp/authorization.adoc"
---

<a id="websocket-stomp-authorization"></a>

# Authorization

Spring Security provides
[WebSocket sub-protocol authorization](https://docs.spring.io/spring-security/reference/servlet/integrations/websocket.html#websocket-authorization)
that uses a `ChannelInterceptor` to authorize messages based on the user header in them.
Also, Spring Session provides
[WebSocket integration](https://docs.spring.io/spring-session/reference/web-socket.html)
that ensures the user’s HTTP session does not expire while the WebSocket session is still active.
