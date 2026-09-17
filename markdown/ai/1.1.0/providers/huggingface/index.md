---
title: "Hugging Face"
source: "ROOT:providers/huggingface/index.adoc"
---

<a id="hugging-face"></a>

# Hugging Face

One of the easiest ways you can get access to many machine learning and artificial intelligence models is by using the [Hugging Face’s](https://en.wikipedia.org/wiki/Hugging_Face) [Inference Endpoints](https://huggingface.co/inference-endpoints).

Hugging Face Hub is a platform that provides a collaborative environment for creating and sharing tens of thousands of Open Source ML/AI models, data sets, and demo applications.

Inference Endpoints let you deploy AI Models on dedicated infrastructure with a pay-as-you-go billing model.
You can use infrastructure provided by Amazon Web Services, Microsoft Azure, and Google Cloud Platform.
Hugging Face lets you run the models on your own machine, but it is quite common to not have enough CPU/GPU resources to run the larger, more AI-focused models.

It provides access to Meta’s recent (August 2023) Llama 2 and CodeLlama 2 models and provides the [Open LLM Leaderboard](https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard), where you can quickly discover high quality models.

While Hugging Face has a free hosting tier, which is very useful for quickly evaluating if a specific ML/AI Model fits your needs, they do not let you access many of those models on the free tier by using the [Text Generation Interface API](https://huggingface.co/docs/text-generation-inference/main/en/index). If you want to end up on production anyway, with a stable API, pay a few cents to try out a reliable solution. Prices are as low as $0.06 per CPU core/hr and $0.6 per GPU/hr.
