export function currentEvidenceItems(evidence, key) {
  return evidence?.current?.[key] || evidence?.[key] || [];
}

export function historicalEvidenceItems(evidence, key) {
  return evidence?.historical?.[key] || [];
}

export function evidenceTime(value) {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function currentPrReadinessReports(evidence = {}) {
  const reports = currentEvidenceItems(evidence, 'prReadinessReports');
  const latestImplementationEvidence = currentEvidenceItems(evidence, 'implementationEvidence')?.[0] || null;
  const latestPostImplementationCheck = currentEvidenceItems(evidence, 'standardsChecks')
    .find((check) => check.phase === 'post-implementation') || null;
  const implementationAt = evidenceTime(latestImplementationEvidence?.createdAt || latestImplementationEvidence?.updatedAt);
  const postCheckAt = evidenceTime(latestPostImplementationCheck?.createdAt);

  return reports.filter((report) => {
    const reportAt = evidenceTime(report.createdAt);
    if (implementationAt && reportAt < implementationAt) return false;
    if (postCheckAt && reportAt < postCheckAt) return false;
    return true;
  });
}

export function latestRepoAnalysisFromData(data) {
  return currentEvidenceItems(data?.evidence, 'repoAnalysis')?.[0]?.analysisJson || {};
}

export function rankedImpactCandidates(data) {
  return latestRepoAnalysisFromData(data)?.impactAnalysis?.rankedCandidates || [];
}

export function formatImpactCandidateCompact(item = {}) {
  const score = item.score || 0;
  const confidence = item.confidence || 'low';
  return `${item.file || 'Unknown file'} (score ${score}, ${confidence})`;
}
