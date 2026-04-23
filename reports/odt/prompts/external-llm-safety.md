# ODT External LLM Safety Guardrails

Use this checklist before sending any context to external LLMs (including chat.oracle.com).

## Required Steps
- Use `external-llm-sanitized-context.json` instead of raw intake text.
- Keep humans in the loop for requirement ambiguity and risk tradeoffs.
- Do not send source code containing credentials, internal endpoints, or user data.
- Remove ticket comments that include private customer details or incident logs.
- Prefer local Codex execution when repo-grounded analysis is required.

## Redaction Status
- Redactions applied: 0
- Sanitized context: reports/odt/prompts/external-llm-sanitized-context.json

## Review Gate
- Human reviewer must approve sanitized context before external prompt usage.
