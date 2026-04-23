const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'for', 'from', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'of', 'on', 'or', 'so', 'that', 'the',
  'their', 'this', 'to', 'up', 'user', 'using', 'want', 'we', 'when', 'with'
]);

function run(command, cwd = process.cwd()) {
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
  } catch (error) {
    return '';
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueBy(items, selector) {
  const seen = new Set();
  return items.filter((item) => {
    const key = selector(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function listAllSourceFiles(repoRoot = process.cwd()) {
  let output = run('rg --files src', repoRoot);
  if (!output) {
    output = run('find src -type f \\( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \\)', repoRoot);
  }
  if (!output) return [];
  return unique(
    output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((file) => /\.(js|jsx|ts|tsx)$/.test(file))
  );
}

function listFilesForModule(modulePath, repoRoot = process.cwd()) {
  const escaped = `${modulePath}`.replace(/"/g, '\\"');
  let output = run(`rg --files "${escaped}"`, repoRoot);
  if (!output) {
    output = run(`find "${escaped}" -type f 2>/dev/null`, repoRoot);
  }
  if (!output) return [];
  return output.split('\n').map((line) => line.trim()).filter(Boolean);
}

function sanitizeToken(token) {
  return `${token || ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function safeReadFile(file, repoRoot = process.cwd()) {
  try {
    return fs.readFileSync(path.resolve(repoRoot, file), 'utf8');
  } catch (error) {
    return '';
  }
}

function extractExportNames(content) {
  const names = [];
  const patterns = [
    /export\s+default\s+(?:function|class)?\s*([A-Za-z0-9_]+)/g,
    /export\s+(?:const|function|class)\s+([A-Za-z0-9_]+)/g,
    /module\.exports\s*=\s*([A-Za-z0-9_]+)/g
  ];

  patterns.forEach((pattern) => {
    let match = pattern.exec(content);
    while (match) {
      names.push(match[1]);
      match = pattern.exec(content);
    }
  });

  return unique(names);
}

function buildPreview(content, maxLines = 4) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines)
    .join(' ')
    .slice(0, 220);
}

function extractKeywords(intake) {
  const promptOverrides = intake.promptOverrides && typeof intake.promptOverrides === 'object'
    ? Object.values(intake.promptOverrides)
    : [];
  const textParts = [
    intake.title,
    intake.featureName,
    intake.summary,
    intake.reviewEdits,
    ...promptOverrides,
    ...((intake.requirements && intake.requirements.acceptanceCriteria) || []),
    ...((intake.requirements && intake.requirements.nonFunctional) || []),
    intake.defectContext && intake.defectContext.observedBehavior,
    intake.defectContext && intake.defectContext.expectedBehavior,
    ...((intake.developerHints && intake.developerHints.relatedComponents) || []),
    ...((intake.developerHints && intake.developerHints.suspectedAreas) || [])
  ].filter(Boolean).join(' ');

  return unique(
    textParts
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 4 && !STOP_WORDS.has(part))
      .map((part) => sanitizeToken(part))
  ).slice(0, 24);
}

function deriveModulePath(file) {
  const parts = file.split('/');
  const modulesIndex = parts.indexOf('modules');
  if (modulesIndex >= 0 && parts.length > modulesIndex + 2) {
    return parts.slice(0, modulesIndex + 3).join('/');
  }
  const mobileIndex = parts.indexOf('mobile_components');
  if (mobileIndex >= 0 && parts.length > mobileIndex + 2) {
    return parts.slice(0, mobileIndex + 3).join('/');
  }
  const coreIndex = parts.indexOf('core-components');
  if (coreIndex >= 0 && parts.length > coreIndex + 1) {
    return parts.slice(0, coreIndex + 2).join('/');
  }
  return path.dirname(file);
}

function scoreFile(file, intake, keywords, hintedAreas) {
  const normalizedPath = sanitizeToken(file.replace(/[/._-]+/g, ' '));
  const basename = sanitizeToken(path.basename(file, path.extname(file)));
  const summaryText = sanitizeToken([
    intake.title,
    intake.featureName,
    intake.summary,
    intake.workItemType
  ].filter(Boolean).join(' '));

  let score = 0;

  keywords.forEach((keyword) => {
    if (normalizedPath.includes(keyword)) score += 6;
    if (basename.includes(keyword)) score += 8;
    if (summaryText.includes(keyword) && normalizedPath.includes(keyword)) score += 3;
  });

  hintedAreas.forEach((hint) => {
    const normalizedHint = `${hint}`.toLowerCase();
    if (file.toLowerCase().includes(normalizedHint)) score += 14;
  });

  if (intake.workItemType === 'defect' && /modal|list|table|container|page|home/.test(file)) {
    score += 2;
  }

  if (file.includes('/components/')) score += 1;
  if (file.includes('/container-components/')) score += 1;

  return score;
}

function buildCandidateDetail(file, intake, keywords, hintedAreas, repoRoot = process.cwd(), baseScore = null) {
  const content = safeReadFile(file, repoRoot);
  const exportNames = extractExportNames(content);
  const preview = buildPreview(content);
  const reasons = [];
  let score = baseScore === null ? scoreFile(file, intake, keywords, hintedAreas) : baseScore;

  keywords.forEach((keyword) => {
    if (sanitizeToken(file).includes(keyword)) {
      reasons.push(`path:${keyword}`);
    }
  });

  exportNames.forEach((name) => {
    const normalizedExport = sanitizeToken(name);
    keywords.forEach((keyword) => {
      if (normalizedExport.includes(keyword)) {
        score += 10;
        reasons.push(`export:${name}`);
      }
    });
  });

  if (preview) {
    const normalizedPreview = sanitizeToken(preview);
    keywords.forEach((keyword) => {
      if (normalizedPreview.includes(keyword)) {
        score += 3;
        reasons.push(`preview:${keyword}`);
      }
    });
  }

  hintedAreas.forEach((hint) => {
    if (file.toLowerCase().includes(`${hint}`.toLowerCase())) {
      reasons.push(`hint:${hint}`);
    }
  });

  return {
    file,
    score,
    exportNames,
    preview,
    reasons: unique(reasons).slice(0, 6)
  };
}

function inferCandidateFiles(intake, repoRoot = process.cwd()) {
  const hintedAreas = unique((intake.developerHints && intake.developerHints.suspectedAreas) || []);
  const explicitModules = unique((intake.scope && intake.scope.modulesTouched) || []);
  const keywords = extractKeywords(intake);

  if (explicitModules.length) {
    const files = explicitModules.flatMap((modulePath) => (
      listFilesForModule(modulePath, repoRoot).filter((file) => /\.(js|jsx|ts|tsx)$/.test(file))
    ));
    const candidateDetails = uniqueBy(
      files.map((file) => buildCandidateDetail(file, intake, keywords, explicitModules, repoRoot, 20)),
      (item) => item.file
    )
      .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file))
      .slice(0, 18);

    return {
      mode: 'hinted',
      keywords,
      hintedAreas: explicitModules,
      files: candidateDetails.map((item) => item.file),
      candidateDetails
    };
  }

  const sourceFiles = listAllSourceFiles(repoRoot);
  const rankedBase = sourceFiles
    .map((file) => ({
      file,
      score: scoreFile(file, intake, keywords, hintedAreas)
    }))
    .filter((item) => item.score > 0);

  const shortlist = (rankedBase.length ? rankedBase : sourceFiles.slice(0, 12).map((file) => ({ file, score: 1 })))
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file))
    .slice(0, 36);

  const candidateDetails = shortlist
    .map((item) => buildCandidateDetail(item.file, intake, keywords, hintedAreas, repoRoot, item.score))
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file))
    .slice(0, 18);

  return {
    mode: rankedBase.length ? 'repo_inferred_manifest' : 'fallback_manifest',
    keywords,
    hintedAreas,
    files: candidateDetails.map((item) => item.file),
    candidateDetails
  };
}

function testPatternsForModule(modulePath) {
  const leaf = modulePath.split('/').filter(Boolean).pop() || '';
  if (!leaf) return [];
  return [
    `tests/jest/**/${leaf}.test.js`,
    `tests/jest/**/${leaf}.test.jsx`,
    `tests/jest/**/${leaf}*.test.js`,
    `tests/jest/**/${leaf}*.test.jsx`
  ];
}

function listMatchingTests(modulePath, repoRoot = process.cwd()) {
  const patterns = testPatternsForModule(modulePath);
  const matched = patterns.flatMap((pattern) => {
    const out = run(`rg --files tests/jest -g "${pattern}"`, repoRoot);
    if (!out) return [];
    return out.split('\n').map((line) => line.trim()).filter(Boolean);
  });
  return unique(matched);
}

function analyzeImpact(intake, options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const inference = inferCandidateFiles(intake, repoRoot);
  const grouped = new Map();

  inference.files.forEach((file) => {
    const modulePath = deriveModulePath(file);
    const current = grouped.get(modulePath) || [];
    current.push(file);
    grouped.set(modulePath, current);
  });

  const moduleImpacts = [...grouped.entries()].map(([modulePath, sourceFiles]) => {
    const testFiles = listMatchingTests(modulePath, repoRoot);
    return {
      modulePath,
      sourceFiles: unique(sourceFiles),
      testFiles,
      sourceFileCount: unique(sourceFiles).length,
      testFileCount: testFiles.length
    };
  }).sort((a, b) => (b.sourceFileCount + b.testFileCount) - (a.sourceFileCount + a.testFileCount));

  const totalSourceFiles = moduleImpacts.reduce((sum, item) => sum + item.sourceFileCount, 0);
  const totalTestFiles = moduleImpacts.reduce((sum, item) => sum + item.testFileCount, 0);

  const hotspots = moduleImpacts
    .slice(0, 6)
    .map((item) => ({
      modulePath: item.modulePath,
      blastRadius: item.sourceFileCount + item.testFileCount
    }));

  return {
    inference: {
      mode: inference.mode,
      keywords: inference.keywords,
      hintedAreas: inference.hintedAreas,
      candidateFiles: inference.files.slice(0, 12),
      candidateDetails: (inference.candidateDetails || []).slice(0, 12)
    },
    moduleImpacts,
    totals: {
      modules: moduleImpacts.length,
      totalSourceFiles,
      totalTestFiles,
      blastRadius: totalSourceFiles + totalTestFiles
    },
    hotspots
  };
}

module.exports = {
  analyzeImpact
};
