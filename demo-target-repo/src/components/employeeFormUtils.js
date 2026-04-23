export const INITIAL_FORM = {
  requesterName: "",
  requesterEmail: "",
  team: "",
  priority: "medium",
  managerId: "",
  summary: "",
  agreeToPolicy: false,
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_SUMMARY_LENGTH = 20;

export const TEAM_OPTIONS = [
  "Platform Engineering",
  "Experience Design",
  "Quality Engineering",
  "Delivery Operations",
  "Security Engineering",
  "Data Products",
];

export const FIELD_CONFIG = {
  requesterName: {
    inputId: "requester-name",
    errorId: "requester-name-error",
  },
  requesterEmail: {
    inputId: "requester-email",
    errorId: "requester-email-error",
  },
  team: {
    inputId: "request-team",
    errorId: "request-team-error",
  },
  managerId: {
    inputId: "request-manager",
    errorId: "request-manager-error",
  },
  summary: {
    inputId: "request-summary",
    hintId: "request-summary-hint",
    errorId: "request-summary-error",
  },
  agreeToPolicy: {
    inputId: "agree-to-policy",
    errorId: "agree-to-policy-error",
  },
};

export const REQUIRED_FIELDS = Object.keys(FIELD_CONFIG);
export const SUBMIT_STATUS_ID = "employee-form-submit-status";

export function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function hasAllRequiredFields(form) {
  return Boolean(
    normalizeText(form.requesterName) &&
      normalizeText(form.requesterEmail) &&
      form.team &&
      form.managerId &&
      normalizeText(form.summary) &&
      form.agreeToPolicy
  );
}

export function getFormErrors(form) {
  const next = {};
  const requesterName = normalizeText(form.requesterName);
  const requesterEmail = normalizeText(form.requesterEmail);
  const summary = normalizeText(form.summary);

  if (!requesterName) {
    next.requesterName = "Requester name is required.";
  }

  if (!requesterEmail) {
    next.requesterEmail = "Requester email is required.";
  } else if (!EMAIL_PATTERN.test(requesterEmail)) {
    next.requesterEmail = "Enter a valid email address.";
  }

  if (!form.team) {
    next.team = "Select a team.";
  }

  if (!form.managerId) {
    next.managerId = "Select a reporting manager.";
  }

  if (!summary) {
    next.summary = "Request summary is required.";
  } else if (summary.length < MIN_SUMMARY_LENGTH) {
    next.summary = `Summary must be at least ${MIN_SUMMARY_LENGTH} characters.`;
  }

  if (!form.agreeToPolicy) {
    next.agreeToPolicy =
      "You must confirm compliance and accessibility checks.";
  }

  return next;
}

export function isFormSubmittable(form) {
  return hasAllRequiredFields(form) && Object.keys(getFormErrors(form)).length === 0;
}

export function getFieldDescribedBy(field, { showError = false } = {}) {
  const config = FIELD_CONFIG[field];

  if (!config) {
    return undefined;
  }

  return [config.hintId, showError ? config.errorId : null]
    .filter(Boolean)
    .join(" ") || undefined;
}

export function getSubmitStatusMessage({
  hasAllRequiredValues,
  isFormReady,
  isSubmitting,
}) {
  if (isSubmitting) {
    return "Submitting employee form.";
  }

  if (!hasAllRequiredValues) {
    return "Complete all required fields to enable submission.";
  }

  if (!isFormReady) {
    return "Resolve the remaining validation errors to enable submission.";
  }

  return "All required fields are complete. The Submit Employee Form button is enabled.";
}
