import React, { useMemo, useState } from "react";
import {
  FIELD_CONFIG,
  INITIAL_FORM,
  MIN_SUMMARY_LENGTH,
  REQUIRED_FIELDS,
  SUBMIT_STATUS_ID,
  TEAM_OPTIONS,
  getFieldDescribedBy,
  getFormErrors,
  getSubmitStatusMessage,
  hasAllRequiredFields,
  isFormSubmittable,
  normalizeText,
} from "./employeeFormUtils";

export default function EmployeeForm({ employees = [], onSubmit }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fieldErrors = useMemo(() => getFormErrors(form), [form]);
  const hasAllRequiredValues = useMemo(() => hasAllRequiredFields(form), [form]);
  const isFormReady = useMemo(() => isFormSubmittable(form), [form]);
  const selectedManager = useMemo(
    () => employees.find((employee) => String(employee.id) === form.managerId),
    [employees, form.managerId]
  );

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setSuccessMessage("");
  };

  const markFieldTouched = (field) => {
    setTouched((current) => {
      if (current[field]) {
        return current;
      }

      return {
        ...current,
        [field]: true,
      };
    });
  };

  const showFieldError = (field) => Boolean(touched[field] && fieldErrors[field]);

  const getFieldA11yProps = (field) => {
    const shouldShowError = showFieldError(field);

    return {
      required: true,
      "aria-invalid": shouldShowError,
      "aria-describedby": getFieldDescribedBy(field, {
        showError: shouldShowError,
      }),
      "aria-errormessage": shouldShowError
        ? FIELD_CONFIG[field].errorId
        : undefined,
      onBlur: () => markFieldTouched(field),
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = getFormErrors(form);

    setTouched(
      REQUIRED_FIELDS.reduce(
        (nextTouched, field) => ({
          ...nextTouched,
          [field]: true,
        }),
        {}
      )
    );

    if (Object.keys(nextErrors).length > 0) {
      setSuccessMessage("");

      const firstInvalidField = REQUIRED_FIELDS.find((field) => nextErrors[field]);

      if (firstInvalidField) {
        event.currentTarget
          .querySelector(`#${FIELD_CONFIG[firstInvalidField].inputId}`)
          ?.focus();
      }

      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 550));

      const requesterName = normalizeText(form.requesterName);
      const requesterEmail = normalizeText(form.requesterEmail);
      const summary = normalizeText(form.summary);

      const payload = {
        requesterName,
        requesterEmail,
        team: form.team,
        priority: form.priority,
        managerId: Number(form.managerId),
        managerName: selectedManager ? selectedManager.name : "Unknown",
        summary,
        submittedAt: new Date().toISOString(),
      };

      if (typeof onSubmit === "function") {
        await Promise.resolve(onSubmit(payload));
      }

      setSuccessMessage(
        `Request submitted successfully for ${payload.requesterName}.`
      );
      setForm((current) => ({
        ...INITIAL_FORM,
        priority: current.priority,
      }));
      setTouched({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldError = (field) => {
    if (!showFieldError(field)) return null;

    return (
      <p className="field-error" id={FIELD_CONFIG[field].errorId} role="alert">
        {fieldErrors[field]}
      </p>
    );
  };

  const submitStatusMessage = getSubmitStatusMessage({
    hasAllRequiredValues,
    isFormReady,
    isSubmitting,
  });

  return (
    <section className="card form-card" aria-label="Employee request form">
      <div className="form-heading">
        <h2>Raise Employee Access Request</h2>
        <p>
          This form is ticket-ready: validations, accessibility cues, success
          feedback, and submission payload logging.
        </p>
        <p className="form-helper-text">Fields marked with * are required.</p>
      </div>

      <form noValidate onSubmit={handleSubmit}>
        <div className="form-grid">
          <label htmlFor="requester-name">
            Requester Name <span aria-hidden="true">*</span>
          </label>
          <input
            id="requester-name"
            type="text"
            autoComplete="name"
            value={form.requesterName}
            onChange={(event) => updateField("requesterName", event.target.value)}
            {...getFieldA11yProps("requesterName")}
          />
          {renderFieldError("requesterName")}

          <label htmlFor="requester-email">
            Requester Email <span aria-hidden="true">*</span>
          </label>
          <input
            id="requester-email"
            type="email"
            autoComplete="email"
            value={form.requesterEmail}
            onChange={(event) =>
              updateField("requesterEmail", event.target.value)
            }
            {...getFieldA11yProps("requesterEmail")}
          />
          {renderFieldError("requesterEmail")}

          <label htmlFor="request-team">
            Team <span aria-hidden="true">*</span>
          </label>
          <select
            id="request-team"
            value={form.team}
            onChange={(event) => updateField("team", event.target.value)}
            {...getFieldA11yProps("team")}
          >
            <option value="">Select team</option>
            {TEAM_OPTIONS.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
          {renderFieldError("team")}

          <label htmlFor="request-manager">
            Reporting Manager <span aria-hidden="true">*</span>
          </label>
          <select
            id="request-manager"
            value={form.managerId}
            onChange={(event) => updateField("managerId", event.target.value)}
            {...getFieldA11yProps("managerId")}
          >
            <option value="">Select manager</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} - {employee.title}
              </option>
            ))}
          </select>
          {renderFieldError("managerId")}

          <fieldset className="priority-fieldset">
            <legend>Priority</legend>
            <div className="radio-row">
              {["low", "medium", "high"].map((priority) => (
                <label key={priority} className="radio-chip">
                  <input
                    type="radio"
                    name="priority"
                    value={priority}
                    checked={form.priority === priority}
                    onChange={(event) =>
                      updateField("priority", event.target.value)
                    }
                  />
                  {priority}
                </label>
              ))}
            </div>
          </fieldset>

          <label htmlFor="request-summary">
            Request Summary <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="request-summary"
            rows={5}
            minLength={MIN_SUMMARY_LENGTH}
            value={form.summary}
            onChange={(event) => updateField("summary", event.target.value)}
            placeholder="Describe what access, role change, or employee update is needed."
            {...getFieldA11yProps("summary")}
          />
          <p id="request-summary-hint">
            Include at least {MIN_SUMMARY_LENGTH} characters.
          </p>
          {renderFieldError("summary")}

          <label className="checkbox-row" htmlFor="agree-to-policy">
            <input
              id="agree-to-policy"
              type="checkbox"
              checked={form.agreeToPolicy}
              onChange={(event) =>
                updateField("agreeToPolicy", event.target.checked)
              }
              {...getFieldA11yProps("agreeToPolicy")}
            />
            I confirm this request includes accessibility and compliance checks.
          </label>
          {renderFieldError("agreeToPolicy")}
        </div>

        <div className="button-row">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={isSubmitting || !isFormReady}
            aria-describedby={SUBMIT_STATUS_ID}
          >
            {isSubmitting ? "Submitting..." : "Submit Employee Form"}
          </button>
        </div>
        <p
          className="form-helper-text submit-status"
          id={SUBMIT_STATUS_ID}
          role="status"
          aria-live="polite"
        >
          {submitStatusMessage}
        </p>
      </form>

      {successMessage ? (
        <p className="status-pill success" role="status" aria-live="polite">
          {successMessage}
        </p>
      ) : null}
    </section>
  );
}
