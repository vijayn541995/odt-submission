# ODT Prompt Contract - 02-impact

Stage: Repo Impact

## Inputs (exact files)
- reports/dev-twin/intake.json (required): Requirement intent and scope.
- reports/dev-twin/impact-analysis.json (required): Repo-inferred module and file candidates.

## Task
- Rank likely impacted files with confidence and explain selection signals.
- Surface regression risks tied to impacted modules and related tests.

## Output Contract
- Write: reports/dev-twin/impact-analysis.json
- Format: json
- Schema:
```json
{
  "inference": {
    "mode": "string",
    "candidateDetails": [
      {
        "file": "string",
        "score": "number",
        "reasons": [
          "string"
        ]
      }
    ]
  },
  "totals": {
    "blastRadius": "number"
  }
}
```
- Write: reports/odt/impact-ranked-files.json
- Format: json
- Schema:
```json
{
  "stage": "impact",
  "rankedFiles": [
    {
      "file": "string",
      "score": "number",
      "confidence": "0..1",
      "reasons": [
        "string"
      ]
    }
  ],
  "regressionRisks": [
    "string"
  ]
}
```

## Quality Gates (senior developer checks)
- Confidence and rationale are present for each top candidate.
- Regression risks reference concrete repo surfaces.
- No broad, unbounded blast radius without explanation.

## Stop Conditions (pause and ask human)
- No candidate files are inferred and no module hints exist.
- Risk hotspots cannot be tied to any test or component area.

