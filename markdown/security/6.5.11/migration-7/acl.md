---
title: "ACL"
source: "ROOT:migration-7/acl.adoc"
---

# ACL

<a id="_favor_aclpermissionevaluator"></a>

## Favor `AclPermissionEvaluator`

`AclEntryVoter`, `AclEntryAfterInvocationProvider`, and `AclPermissionEvaluator` provide the same service, plugged into different Spring Security APIs. Now that `AccessDecisionVoter` and `AfterInvocationProvider` are both deprecated, the corresponding ACL plugins are obsolete.

As such, begin using `AclPermissionEvaluator` before updating to Spring Security 7.
