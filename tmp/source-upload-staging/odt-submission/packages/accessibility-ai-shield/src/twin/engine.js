const { severityWeight } = require('./parser');

const RULE_PLAYBOOKS = {
  'custom/icon-a11y-label': {
    title: 'Add icon accessibility labels',
    whyItMatters: 'Unlabeled functional icons are silent for assistive technology users.',
    implementationHint: 'Add a11yLabel to functional Terra icons. Hide decorative icons with aria-hidden.',
    estimatedMinutesPerFinding: 2
  },
  'custom/click-keyboard-parity': {
    title: 'Restore keyboard parity for click handlers',
    whyItMatters: 'Mouse-only interactions block keyboard and switch-device users.',
    implementationHint: 'Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.',
    estimatedMinutesPerFinding: 4
  },
  'custom/form-control-label': {
    title: 'Attach explicit form labels',
    whyItMatters: 'Form fields without labels create ambiguity for screen readers.',
    implementationHint: 'Connect label and control via htmlFor/id or aria-labelledby.',
    estimatedMinutesPerFinding: 3
  }
};

function toSortedEntries(input) {
  return Object.entries(input).sort((a, b) => b[1] - a[1]);
}

function getPlaybook(ruleId, fallbackFix) {
  const playbook = RULE_PLAYBOOKS[ruleId];
  if (playbook) return playbook;

  return {
    title: `Resolve ${ruleId}`,
    whyItMatters: 'Accessibility defects can block keyboard/screen-reader usage and increase compliance risk.',
    implementationHint: fallbackFix || 'Apply semantic HTML and WCAG-compliant labeling.',
    estimatedMinutesPerFinding: 5
  };
}

function scoreFinding(finding, indexes) {
  const ruleFrequency = indexes.byRule[finding.ruleId] || 0;
  const fileFrequency = indexes.byFile[finding.file] || 0;
  const priorityBoost = finding.policyPriority === 'high' ? 20 : 10;

  return (
    severityWeight(finding.severity) +
    Math.min(ruleFrequency, 25) +
    Math.min(fileFrequency, 15) +
    priorityBoost
  );
}

function buildPriorityQueue(findings, indexes, limit) {
  return findings
    .map((finding) => ({
      ...finding,
      score: scoreFinding(finding, indexes),
      playbook: getPlaybook(finding.ruleId, finding.suggestedFix)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function buildRuleSummary(indexes) {
  return toSortedEntries(indexes.byRule).map(([ruleId, count]) => ({
    ruleId,
    count,
    playbook: getPlaybook(ruleId)
  }));
}

function buildFileHotspots(indexes, limit) {
  return toSortedEntries(indexes.byFile)
    .slice(0, limit)
    .map(([file, count]) => ({ file, count }));
}

function estimateEffort(priorityQueue) {
  const totalMinutes = priorityQueue.reduce((sum, finding) => (
    sum + finding.playbook.estimatedMinutesPerFinding
  ), 0);

  const triageMinutesWithoutTwin = priorityQueue.length * 3;
  const triageMinutesWithTwin = Math.ceil(priorityQueue.length * 0.5);

  return {
    remediationMinutes: totalMinutes,
    remediationHours: Number((totalMinutes / 60).toFixed(1)),
    triageMinutesWithoutTwin,
    triageMinutesWithTwin,
    triageReductionPercent: Math.round(
      ((triageMinutesWithoutTwin - triageMinutesWithTwin) / triageMinutesWithoutTwin) * 100
    )
  };
}

function buildRecommendationBacklog(ruleSummary, limit) {
  return ruleSummary.slice(0, limit).map((rule, index) => ({
    rank: index + 1,
    ruleId: rule.ruleId,
    count: rule.count,
    action: rule.playbook.title,
    whyItMatters: rule.playbook.whyItMatters,
    implementationHint: rule.playbook.implementationHint
  }));
}

module.exports = {
  buildPriorityQueue,
  buildRuleSummary,
  buildFileHotspots,
  buildRecommendationBacklog,
  estimateEffort
};
