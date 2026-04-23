# Oracle Developer Twin Kit

Portable setup helper to install ODT + A11y Shield into another repository.

## What this does

1. Copies `packages/accessibility-ai-shield`
2. Copies `packages/delivery-copilot`
3. Copies `.a11y-shieldrc.js`
4. Copies `docs/a11y-vpat-mapping.md`
5. Adds ODT/A11y npm scripts to target `package.json`

## Usage

From this repository (or with `--source` pointing here):

```bash
node oracle-dev-twin-kit/install-into-repo.js --target /path/to/another-repo
```

Options:

1. `--target /path/to/repo` target repository
2. `--source /path/to/journey-builder-js` source repository containing kit assets
3. `--force` overwrite existing copied files

## After install (in target repo)

```bash
npm run odt:autopilot -- --work-item feature --withA11y
```

Dashboards/artifacts are generated under `reports/`.
