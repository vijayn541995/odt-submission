# Native App

Native desktop shell for ODT 2.0 Enterprise.

Target role:

- Desktop packaging for the ODT workbench.
- Hosts the shared React UI.
- Starts or connects to the local ODT API service.
- Supports native developer workflows such as local repo selection, terminal launch, worker logs, and local evidence files.

Recommended first implementation: Electron, because the current app already uses React, Vite, Node, local APIs, and local process orchestration.

Current status: scaffold only. Native packaging should begin after the shared UI and API client are extracted.
