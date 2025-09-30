# API Call Patterns

This guide covers patterns for making HTTP requests using `@platform/api-call`.

## 🚫 Core Rule

**NEVER use `fetch()` directly.** Always use `@platform/api-call` for all HTTP requests.

## 📡 Making API Calls

### Non-Authenticated Requests

Use `unauthApiCall` for public endpoints:
