export function titleCase(value) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function toneFor(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('fail') || text.includes('error') || text.includes('block')) return 'danger';
  if (text.includes('wait') || text.includes('review') || text.includes('pending') || text.includes('open') || text.includes('assign')) return 'warning';
  if (text.includes('ready') || text.includes('ok') || text.includes('done') || text.includes('online') || text.includes('answer') || text.includes('resolve') || text.includes('complete')) return 'success';
  return 'neutral';
}

export function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return 'Not set';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let next = bytes / 1024;
  let index = 0;
  while (next >= 1024 && index < units.length - 1) {
    next /= 1024;
    index += 1;
  }
  return `${next >= 10 ? next.toFixed(0) : next.toFixed(1)} ${units[index]}`;
}

export function formatTime(value) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value));
}

export function shortId(value) {
  return String(value || '').replace(/^run_/, 'run ').slice(0, 18);
}

export function safeDetail(detail) {
  try {
    const parsed = JSON.parse(detail || '{}');
    return Object.entries(parsed)
      .map(([key, value]) => `${key}: ${typeof value === 'object' && value !== null ? JSON.stringify(value) : value}`)
      .join(', ') || 'No detail';
  } catch {
    return String(detail || 'No detail');
  }
}
