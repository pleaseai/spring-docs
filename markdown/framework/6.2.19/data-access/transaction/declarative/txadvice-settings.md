---
title: "<tx:advice/> Settings"
source: "ROOT:data-access/transaction/declarative/txadvice-settings.adoc"
---

<a id="transaction-declarative-txadvice-settings"></a>

# <tx:advice/> Settings

This section summarizes the various transactional settings that you can specify by using
the `<tx:advice/>` tag. The default `<tx:advice/>` settings are:

- The [propagation setting](tx-propagation.md) is `REQUIRED.`
- The isolation level is `DEFAULT.`
- The transaction is read-write.
- The transaction timeout defaults to the default timeout of the underlying transaction
system or none if timeouts are not supported.
- Any `RuntimeException` triggers rollback, and any checked `Exception` does not.

You can change these default settings. The following table summarizes the various attributes of the `<tx:method/>` tags
that are nested within `<tx:advice/>` and `<tx:attributes/>` tags:

<a id="tx-method-settings"></a>

| Attribute | Required? | Default | Description |
| --- | --- | --- | --- |
| `name` | Yes |  | Method names with which the transaction attributes are to be associated. The wildcard (\*) character can be used to associate the same transaction attribute settings with a number of methods (for example, `get*`, `handle*`, `on*Event`, and so forth). |
| `propagation` | No | `REQUIRED` | Transaction propagation behavior. |
| `isolation` | No | `DEFAULT` | Transaction isolation level. Only applicable to propagation settings of `REQUIRED` or `REQUIRES_NEW`. |
| `timeout` | No | -1 | Transaction timeout (seconds). Only applicable to propagation `REQUIRED` or `REQUIRES_NEW`. |
| `read-only` | No | false | Read-write versus read-only transaction. Applies only to `REQUIRED` or `REQUIRES_NEW`. |
| `rollback-for` | No |  | Comma-delimited list of `Exception` instances that trigger rollback. For example, `com.foo.MyBusinessException,ServletException`. |
| `no-rollback-for` | No |  | Comma-delimited list of `Exception` instances that do not trigger rollback. For example, `com.foo.MyBusinessException,ServletException`. |
