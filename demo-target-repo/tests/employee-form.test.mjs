import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  FIELD_CONFIG,
  INITIAL_FORM,
  MIN_SUMMARY_LENGTH,
  getFieldDescribedBy,
  getFormErrors,
  getSubmitStatusMessage,
  hasAllRequiredFields,
  isFormSubmittable,
} from "../src/components/employeeFormUtils.js";
import OracleLogo, { ORACLE_LOGO_LABEL } from "../src/components/OracleLogo.js";

function createValidForm(overrides = {}) {
  return {
    ...INITIAL_FORM,
    requesterName: "Asha Patel",
    requesterEmail: "asha.patel@example.com",
    team: "Platform Engineering",
    managerId: "7",
    summary: "Access request details are clearly documented.",
    agreeToPolicy: true,
    ...overrides,
  };
}

const tests = [
  {
    name: "empty required fields keep the form disabled",
    run() {
      const errors = getFormErrors(INITIAL_FORM);

      assert.equal(hasAllRequiredFields(INITIAL_FORM), false);
      assert.equal(isFormSubmittable(INITIAL_FORM), false);
      assert.equal(errors.requesterName, "Requester name is required.");
      assert.equal(errors.requesterEmail, "Requester email is required.");
      assert.equal(errors.team, "Select a team.");
      assert.equal(errors.managerId, "Select a reporting manager.");
      assert.equal(errors.summary, "Request summary is required.");
      assert.equal(
        errors.agreeToPolicy,
        "You must confirm compliance and accessibility checks."
      );
    },
  },
  {
    name: "filled but invalid values still block submission",
    run() {
      const form = createValidForm({
        requesterEmail: "asha.patel",
        summary: "Too short",
      });
      const errors = getFormErrors(form);

      assert.equal(hasAllRequiredFields(form), true);
      assert.equal(isFormSubmittable(form), false);
      assert.equal(errors.requesterEmail, "Enter a valid email address.");
      assert.equal(
        errors.summary,
        `Summary must be at least ${MIN_SUMMARY_LENGTH} characters.`
      );
    },
  },
  {
    name: "valid required values enable submission",
    run() {
      const form = createValidForm();

      assert.equal(hasAllRequiredFields(form), true);
      assert.equal(isFormSubmittable(form), true);
      assert.deepEqual(getFormErrors(form), {});
    },
  },
  {
    name: "aria descriptions only include hint and error ids when needed",
    run() {
      assert.equal(getFieldDescribedBy("requesterName"), undefined);
      assert.equal(getFieldDescribedBy("summary"), FIELD_CONFIG.summary.hintId);
      assert.equal(
        getFieldDescribedBy("summary", { showError: true }),
        `${FIELD_CONFIG.summary.hintId} ${FIELD_CONFIG.summary.errorId}`
      );
      assert.equal(
        getFieldDescribedBy("agreeToPolicy", { showError: true }),
        FIELD_CONFIG.agreeToPolicy.errorId
      );
    },
  },
  {
    name: "submit status messages explain why the button is disabled",
    run() {
      assert.equal(
        getSubmitStatusMessage({
          hasAllRequiredValues: true,
          isFormReady: true,
          isSubmitting: true,
        }),
        "Submitting employee form."
      );
      assert.equal(
        getSubmitStatusMessage({
          hasAllRequiredValues: false,
          isFormReady: false,
          isSubmitting: false,
        }),
        "Complete all required fields to enable submission."
      );
      assert.equal(
        getSubmitStatusMessage({
          hasAllRequiredValues: true,
          isFormReady: false,
          isSubmitting: false,
        }),
        "Resolve the remaining validation errors to enable submission."
      );
      assert.equal(
        getSubmitStatusMessage({
          hasAllRequiredValues: true,
          isFormReady: true,
          isSubmitting: false,
        }),
        "All required fields are complete. The Submit Employee Form button is enabled."
      );
    },
  },
  {
    name: "employee form source uses the updated submit button label",
    run() {
      const employeeFormSource = readFileSync(
        new URL("../src/components/EmployeeForm.jsx", import.meta.url),
        "utf8"
      );

      assert.match(employeeFormSource, /Submit Employee Form/);
      assert.doesNotMatch(employeeFormSource, /Submit Request/);
      assert.match(employeeFormSource, /aria-describedby=\{SUBMIT_STATUS_ID\}/);
    },
  },
  {
    name: "oracle logo markup stays accessible for the home page hero",
    run() {
      const markup = renderToStaticMarkup(React.createElement(OracleLogo));
      const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

      assert.match(markup, /aria-label="Oracle logo"/);
      assert.match(markup, /class="oracle-logo"/);
      assert.match(markup, /ORACLE/);
      assert.equal(ORACLE_LOGO_LABEL, "Oracle logo");
      assert.match(appSource, /import OracleLogo from "\.\/components\/OracleLogo\.js";/);
      assert.match(appSource, /<OracleLogo \/>/);
    },
  },
];

let failed = 0;

for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${test.name}`);
    console.error(error.stack);
  }
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log(`\n${tests.length} tests passed.`);
}
