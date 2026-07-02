# Frozen Baseline

This folder preserves the latest ODT 2.0 source snapshot before the enterprise restructuring begins.

Snapshot:

```text
odt-workbench-next-source
```

The snapshot includes source, docs, scripts, config, and current uncommitted code changes from the active workspace.

The snapshot excludes runtime and machine-local state:

- `.git`
- `node_modules`
- build output
- logs
- screenshots/output artifacts
- local workspaces
- SQLite database files
- `.env`

Use this baseline as the behavior reference while extracting browser, native, backend, domain, and persistence modules.
