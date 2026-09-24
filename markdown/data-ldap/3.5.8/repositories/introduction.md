---
title: "Introduction"
source: "ROOT:repositories/introduction.adoc"
---

<a id="common.basics"></a>

# Introduction

This chapter explains the basic foundations of Spring Data repositories.
Before continuing to the LDAP specifics, make sure you have a sound understanding of the basic concepts explained here.

<a id="repositories"></a>

## Working with Spring Data Repositories

The goal of the Spring Data repository abstraction is to significantly reduce the amount of boilerplate code required to implement data access layers for various persistence stores.

> [!IMPORTANT]
> *Spring Data repository documentation and your module*
>
> This chapter explains the core concepts and interfaces of Spring Data repositories.
> The information in this chapter is pulled from the Spring Data Commons module.
> It uses the configuration and code samples for the Jakarta Persistence API (JPA) module.
> If you want to use XML configuration you should adapt the XML namespace declaration and the types to be extended to the equivalents of the particular module that you use. “[Namespace reference](namespace-reference.md#repositories.namespace-reference)” covers XML configuration, which is supported across all Spring Data modules that support the repository API.
> “[Repository query keywords](query-keywords-reference.md)” covers the query method keywords supported by the repository abstraction in general.
> For detailed information on the specific features of your module, see the chapter on that module of this document.
