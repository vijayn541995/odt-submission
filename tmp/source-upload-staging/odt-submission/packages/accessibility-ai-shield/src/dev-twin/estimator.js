function toComplexityMultiplier(complexity) {
  if (complexity === 'high') return 1.4;
  if (complexity === 'low') return 0.8;
  return 1;
}

function safeNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function estimate(intake, options = {}) {
  const complexity = intake.scope && intake.scope.complexity ? intake.scope.complexity : 'medium';
  const criteriaCount = intake.requirements && intake.requirements.acceptanceCriteria
    ? intake.requirements.acceptanceCriteria.length
    : 3;
  const modulesTouched = intake.scope && intake.scope.modulesTouched ? intake.scope.modulesTouched.length : 1;
  const complexityMultiplier = toComplexityMultiplier(complexity);

  const baselineHours = Math.round((criteriaCount * 3 + modulesTouched * 4 + 8) * complexityMultiplier);

  const codingReductionPercent = safeNumber(options.codingReductionPercent, 35);
  const testingReductionPercent = safeNumber(options.testingReductionPercent, 45);
  const triageReductionPercent = safeNumber(options.triageReductionPercent, 80);

  const aiDeviationBufferPercent = safeNumber(options.aiDeviationBufferPercent, 15);
  const tokenRetryOverheadPercent = safeNumber(options.tokenRetryOverheadPercent, 8);
  const errorHandlingBufferPercent = safeNumber(options.errorHandlingBufferPercent, 10);

  const humanCodingHours = Math.round(baselineHours * 0.55);
  const humanTestingHours = Math.round(baselineHours * 0.30);
  const humanTriageHours = Math.max(2, Math.round(baselineHours * 0.15));

  const aiCodingHours = Math.round(humanCodingHours * (1 - codingReductionPercent / 100));
  const aiTestingHours = Math.round(humanTestingHours * (1 - testingReductionPercent / 100));
  const aiTriageHours = Math.round(humanTriageHours * (1 - triageReductionPercent / 100));

  const aiBaseHours = aiCodingHours + aiTestingHours + aiTriageHours;
  const bufferPercent = aiDeviationBufferPercent + tokenRetryOverheadPercent + errorHandlingBufferPercent;
  const bufferHours = Math.max(1, Math.round(aiBaseHours * (bufferPercent / 100)));
  const aiTotalHoursWithBuffer = aiBaseHours + bufferHours;

  const manualTotalHours = humanCodingHours + humanTestingHours + humanTriageHours;
  const netSavedHours = Math.max(0, manualTotalHours - aiTotalHoursWithBuffer);
  const netReductionPercent = manualTotalHours
    ? Math.round((netSavedHours / manualTotalHours) * 100)
    : 0;

  return {
    assumptions: {
      complexity,
      criteriaCount,
      modulesTouched,
      codingReductionPercent,
      testingReductionPercent,
      triageReductionPercent,
      aiDeviationBufferPercent,
      tokenRetryOverheadPercent,
      errorHandlingBufferPercent
    },
    baseline: {
      manualTotalHours,
      humanCodingHours,
      humanTestingHours,
      humanTriageHours
    },
    aiPlan: {
      aiBaseHours,
      aiCodingHours,
      aiTestingHours,
      aiTriageHours,
      bufferHours,
      bufferPercent,
      aiTotalHoursWithBuffer
    },
    impact: {
      netSavedHours,
      netReductionPercent
    }
  };
}

function buildRisks(intake, estimateResult) {
  const risks = [];
  const nonFunctional = intake.requirements && intake.requirements.nonFunctional
    ? intake.requirements.nonFunctional
    : [];

  if (!nonFunctional.includes('a11y')) {
    risks.push('Accessibility requirement missing from non-functional scope.');
  }

  if (estimateResult.assumptions.modulesTouched > 5) {
    risks.push('High module blast radius; enforce phased roll-out.');
  }

  if (estimateResult.aiPlan.bufferPercent < 25) {
    risks.push('AI buffer may be too low for unstable prompts or token retries.');
  }

  if (!risks.length) {
    risks.push('No critical planning risk detected. Keep human-in-loop for merge approvals.');
  }

  return risks;
}

module.exports = {
  estimate,
  buildRisks
};
