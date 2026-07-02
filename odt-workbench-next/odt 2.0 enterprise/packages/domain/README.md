# Shared Domain Package

Shared business rules for ODT 2.0 Enterprise.

This package should hold pure product logic that both browser and native shells can use:

- workflow state
- standards gate decisions
- evidence freshness
- Jira verification classification
- worker run status
- PR readiness
- monitoring severity
- formatting and normalization rules

Keep this package independent from React, HTTP, Node process APIs, and SQLite.
