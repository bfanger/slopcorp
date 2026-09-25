# SlopCorp

A game where the player is chatting with a llm powered robot to perform tasks.
It is build using the [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api) running the LLM locally in the visitors browser.

## Purpose

This web experiment was to gain experience with integrating LLM into a project.

## Technical challenges

Tools like they are specified in the online examples doesn't work at all.

Checking for `{ type: "tool-response" }` and `{ type: "tool-call" }` results in `'available'`, but trying to `LanguageModel.create` the session results in a `The device is unable to create a session to run the model`

but that doesn't stop the llm from trying.
This project extracts the tool_code block from the text response and parses the tool call.

But the model is small (Gemini Nano), so it's prone to hallucinations.

## Overall challenges

Creating levels that are fun to play is quite hard.
