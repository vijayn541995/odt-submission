# ODT Prompt Contract - 03-tech-design

Stage: Tech Design

## Inputs (exact files)
- reports/dev-twin/intake.json (required): Feature/defect constraints and quality requirements.
- reports/dev-twin/impact-analysis.json (required): Scope and blast radius evidence.

## Task
- Define implementation approach with API, state, error, a11y, and testing strategy.
- Keep design scoped to blast-radius minimization and approved dependencies.

## Output Contract
- Write: reports/odt/tech-design.md
- Format: markdown
- Schema:
```json
{
  "sections": [
    "Scope",
    "API strategy",
    "State strategy",
    "Error handling",
    "Accessibility strategy",
    "Test strategy"
  ]
}
```
- Write: reports/odt/tech-design.json
- Format: json
- Schema:
```json
{
  "featureName": "string",
  "architecture": {
    "apiStrategy": "string",
    "stateStrategy": "string",
    "errorHandling": "string",
    "accessibility": "string",
    "testing": "string"
  },
  "qualityGates": [
    "string"
  ]
}
```

## Quality Gates (senior developer checks)
- Design addresses both functional and non-functional constraints.
- Error handling and rollback path are explicit.
- Accessibility and test strategy are first-class sections.

## Stop Conditions (pause and ask human)
- Design introduces unauthorized dependencies without approval.
- Critical error-state behavior is undefined.

