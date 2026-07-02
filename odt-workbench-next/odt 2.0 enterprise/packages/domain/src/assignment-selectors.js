import { currentEvidenceItems } from './evidence-selectors.js';
import { workflowStateFromData } from './workflow.js';

const DEFAULT_ASSIGNMENT_ID = 'assignment-local-mvp';
const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/;

export function activeAssignmentId(data, fallback = DEFAULT_ASSIGNMENT_ID) {
  return data?.assignmentId
    || data?.evidence?.assignment?.id
    || data?.snapshot?.activeAssignmentId
    || data?.snapshot?.assignments?.find((assignment) => assignment.isActive)?.id
    || data?.snapshot?.assignments?.[0]?.id
    || fallback;
}

export function extractWorkKeyFromText(value) {
  const match = String(value || '').match(ISSUE_KEY_PATTERN);
  return match?.[0] || '';
}

export function activeWorkKey(data, fallbackAssignmentId = DEFAULT_ASSIGNMENT_ID) {
  const evidence = data?.evidence || {};
  const workflow = workflowStateFromData(data);
  const candidates = [
    evidence.requirementSignals?.issueKey,
    workflow?.verificationProfile?.issueKey,
    currentEvidenceItems(evidence, 'prReadinessReports')?.[0]?.reportJson?.linkedJira,
    evidence.requirements?.[0]?.rawText,
    evidence.assignment?.title,
    evidence.assignment?.id,
    data?.snapshot?.assignments?.find((assignment) => assignment.isActive)?.title,
    data?.snapshot?.assignments?.find((assignment) => assignment.isActive)?.id,
    activeAssignmentId(data, fallbackAssignmentId)
  ];

  for (const candidate of candidates) {
    const key = extractWorkKeyFromText(candidate);
    if (key) return key;
  }

  return '';
}
