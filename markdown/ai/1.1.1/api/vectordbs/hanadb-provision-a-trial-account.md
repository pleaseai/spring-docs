---
title: "Provision SAP HANA Cloud trial account"
source: "ROOT:api/vectordbs/hanadb-provision-a-trial-account.adoc"
---

# Provision SAP HANA Cloud trial account

<a id="_provision_sap_hana_cloud_trial_account"></a>

## Provision SAP HANA Cloud trial account

Below are the steps to provision SAP Hana Database using a trial account

Let’s start with creating a [temporary email](https://temp-mail.org/en/) for registration purposes

![0](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/0.png)

> [!TIP]
> Don’t close the above window, otherwise a new email id would get generated.

Go to [sap.com](https://sap.com/) and navigate to `products` → `Trials and Demos`

![1](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/1.png)

Click `Advanced Trials`

![2](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/2.png)

Click `SAP BTP Trial`

![3](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/3.png)

Click `Start your free 90-day trial`

![4](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/4.png)

Paste the `temporary email id` that we created in the first step, and click `Next`

![5](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/5.png)

We fill in our details and click `Submit`

![6](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/6.png)

It’s time to check the inbox of our temporary email account

![7](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/7.png)

Notice that there is an email received in our temporary email account

![8](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/8.png)

Open the email and `click to activate` the trial account

![9](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/9.png)

It will prompt to create a `password`. Provide a password and click `Submit`

![10](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/10.png)

The trial account is now created. Click to `start the trial`

![11](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/11.png)

Provide your phone number and click `Continue`

![13](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/13.png)

We receive an OTP on the phone number. Provide the `code` and click `continue`

![14](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/14.png)

Select the `region` as `US East (VA) - AWS`

![15](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/15.png)

Click `Continue`

![16](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/16.png)

The `SAP BTP trial` account is ready. Click `Go to your Trial account`

![17](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/17.png)

Click the `Trial` sub-account

![18](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/18.png)

Open `Instances and Subscriptions`

![19](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/19.png)

It’s time to create a subscription. Click the `Create` button

![20.1](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/20.1.png)

While creating a subscription, Select `service` as `SAP Hana Cloud` and `Plan` as `tools` and click `Create`

![20.2](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/20.2.png)

Notice that `SAP Hana Cloud` subscription is now created. Click `Users` on the left panel

![21](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/21.png)

Select the username (temporary email that we supplied earlier) and click `Assign Role Collection`

![22](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/22.png)

Search `hana` and select all the 3 role collections that gets displayed. Click `Assign Role Collection`

![23](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/23.png)

Our `user` now has all the 3 role collections. Click `Instances and Subscriptions`

![24](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/24.png)

Now, click `SAP Hana Cloud` application under subscriptions

![25](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/25.png)

There are no instances yet. Let’s click `Create Instance`

![26](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/26.png)

Select Type as `SAP HANA Cloud, SAP HANA Database`. Click `Next Step`

![27](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/27.png)

Provide `Instance Name`, `Description`, `password` for DBADMIN administrator.
Select the latest version `2024.2 (QRC 1/2024)`. Click `Next Step`

![28](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/28.png)

Keep everything as default. Click `Next Step`

![29](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/29.png)

Click `Next Step`

![30](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/30.png)

Select `Allow all IP addresses` and click `Next Step`

![31](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/31.png)

Click `Review and Create`

![32](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/32.png)

Click `Create Instance`

![33](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/33.png)

Notice that the provisioning of `SAP Hana Database` instance has started. It takes some time to provision - please be patient.

![34.1](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/34.1.png)

Once the instance is provisioned (status is displayed as `Running`) we can get the datasource url (`SQL Endpoint`) by clicking the instance and selecting `Connections`

![34.2](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/34.2.png)

We navigate to `SAP Hana Database Explorer` by click the `…​`

![35](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/35.png)

Provide the administrator credentials and click `OK`

![36](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/36.png)

Open SQL console and create the table `CRICKET_WORLD_CUP` using the following DDL statement:

```
CREATE TABLE CRICKET_WORLD_CUP (
    _ID VARCHAR2(255) PRIMARY KEY,
    CONTENT CLOB,
    EMBEDDING REAL_VECTOR(1536)
)
```

![37](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/37.png)

Navigate to `hana_dev_db → Catalog → Tables` to find our table `CRICKET_WORLD_CUP`

![38](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/38.png)

Right-click on the table and click `Open Data`

![39](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/39.png)

Notice that the table data is now displayed. There are now rows as we didn’t create any embeddings yet.

![40](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.1/spring-ai-docs/src/main/antora/modules/ROOT/images/hanadb/40.png)

Next steps: [SAP Hana Vector Engine](hana.md)
