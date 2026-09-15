---
title: "Language Reference"
source: "ROOT:core/expressions/language-ref.adoc"
---

<a id="expressions-language-ref"></a>

# Language Reference

Spring Expression Language (SpEL) expressions are composed of a sequence of tokens such
as literals, operators, method invocations, and so forth.

Whitespace can be used freely between tokens to format and improve the readability of
expressions. Specifically, the `\s` (space), `\t` (tab), `\r` (carriage return), and `\n`
(newline) characters are all valid separators between tokens. However, whitespace is
ignored by the expression parser unless it is part of a string literal.

The following sections describe the features and syntax of SpEL.
