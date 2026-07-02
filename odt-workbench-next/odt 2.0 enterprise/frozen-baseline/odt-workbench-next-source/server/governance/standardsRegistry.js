import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = dirname(dirname(__dirname));
const configPath = join(dirname(__dirname), 'standards', 'odt-standards.json');
const canonicalGuidePath = join(appRoot, 'docs', 'ODT-Oracle-Standards-Agent-Operating-Guide.md');
const accessibilityGuidePath = join(appRoot, 'docs', 'ODT-Agent-Accessibility-VPAT-WCAG-Redwood-Guide.md');

export function loadStandardsRegistry() {
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  return {
    ...config,
    sources: [
      describeSource('canonical-agent-operating-guide', canonicalGuidePath),
      describeSource('accessibility-redwood-guide', accessibilityGuidePath),
      describeSource('standards-config', configPath)
    ]
  };
}

function describeSource(id, path) {
  try {
    const stat = statSync(path);
    return {
      id,
      path,
      available: true,
      bytes: stat.size,
      updatedAt: stat.mtime.toISOString()
    };
  } catch {
    return { id, path, available: false };
  }
}
