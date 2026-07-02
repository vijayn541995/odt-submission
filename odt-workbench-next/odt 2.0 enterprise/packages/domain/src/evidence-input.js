export function parseEvidenceLines(value) {
  return String(value || '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseTestEvidenceLines(value) {
  return parseEvidenceLines(value).map((line) => {
    const [nameOrCommand, status, ...notes] = line.split('|').map((part) => part.trim());
    return {
      name: nameOrCommand || 'Test evidence',
      command: nameOrCommand || '',
      status: normalizeEvidenceStatus(status || line),
      notes: notes.join(' | ')
    };
  });
}

export function normalizeEvidenceStatus(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('fail') || normalized.includes('error')) return 'failed';
  if (normalized.includes('skip')) return 'skipped';
  if (normalized.includes('not run') || normalized.includes('pending')) return 'not_run';
  if (normalized.includes('pass') || normalized.includes('success') || normalized.includes('ok')) return 'passed';
  return 'unknown';
}
