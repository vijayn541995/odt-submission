import { DEFAULT_API_BASE_URL } from '@odt/config';

export function createOdtApiClient({ baseUrl = DEFAULT_API_BASE_URL, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('createOdtApiClient requires a fetch implementation');
  }

  async function requestJson(path, options = {}) {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`ODT API ${response.status}: ${detail || response.statusText}`);
    }

    return response.json();
  }

  return {
    getSnapshot: () => requestJson('/api/snapshot'),
    getSettings: () => requestJson('/api/settings'),
    getWorkflowState: (assignmentId) => requestJson(`/api/workflow/state/${encodeURIComponent(assignmentId)}`),
    getEvidence: (assignmentId) => requestJson(`/api/assignments/${encodeURIComponent(assignmentId)}/evidence`)
  };
}
