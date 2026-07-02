# Architecture Notes

This folder should hold the enterprise migration design for ODT 2.0.

## System Shape

ODT should evolve into one shared product core with two delivery shells:

- Browser app: web access through Vite/React.
- Native app: desktop packaging with local developer workflow support.

Both shells should share:

- UI components and sidebar feature pages.
- Domain rules for workflow, standards, evidence, workers, and PR readiness.
- API client contracts.
- Test fixtures and smoke flows.

The backend should be organized by capability, not by screen. Screens can map to features, but backend modules should own stable product concepts such as workflow, governance, intake, workers, monitoring, and persistence.

## First Extraction Order

1. Shared constants and route IDs.
2. Sidebar layout and page shell.
3. Workflow/evidence domain helpers.
4. API client wrapper.
5. One low-risk UI feature page.
6. Backend workflow module.
7. SQLite schema and repository layer.
8. Worker and monitoring modules.
9. Browser shell parity.
10. Native shell startup and packaging.

## Operator Guides

- [Agent Team Operator Guide](./agent-team-operator-guide.md): button-by-button usage, safe Agent Team sequences, demo flow, relay handoff guidance, and troubleshooting.
- [Demo Hardening Runbook](./demo-hardening-runbook.md): clean-start commands, all-sidebar smoke, Agent Team relay regression, demo path, and known demo risks.

## Design Rule

Every extraction should preserve behavior from the frozen baseline before moving to the next module.
