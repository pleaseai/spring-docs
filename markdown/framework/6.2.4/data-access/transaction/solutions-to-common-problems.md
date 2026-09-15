---
title: "Solutions to Common Problems"
source: "ROOT:data-access/transaction/solutions-to-common-problems.adoc"
---

<a id="transaction-solutions-to-common-problems"></a>

# Solutions to Common Problems

This section describes solutions to some common problems.

<a id="transaction-solutions-to-common-problems-wrong-ptm"></a>

## Using the Wrong Transaction Manager for a Specific `DataSource`

Use the correct `PlatformTransactionManager` implementation based on your choice of
transactional technologies and requirements. Used properly, the Spring Framework merely
provides a straightforward and portable abstraction. If you use global
transactions, you must use the
`org.springframework.transaction.jta.JtaTransactionManager` class (or an
[application server-specific subclass](application-server-integration.md) of
it) for all your transactional operations. Otherwise, the transaction infrastructure
tries to perform local transactions on such resources as container `DataSource`
instances. Such local transactions do not make sense, and a good application server
treats them as errors.
