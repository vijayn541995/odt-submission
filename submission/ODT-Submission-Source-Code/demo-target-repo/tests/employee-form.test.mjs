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
import {
  DEFAULT_FINDER_FILTERS,
  applyEmployeeFilters,
  getDepartmentOptions,
} from "../src/components/employeeFinderUtils.js";
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

const FINDER_FIXTURE_EMPLOYEES = [
  {
    id: 1,
    name: "Amelia Hart",
    email: "amelia.hart@example.com",
    title: "Frontend Engineer",
    department: "Platform Engineering",
    employeeCode: "EMP-0001",
  },
  {
    id: 2,
    name: "Noah Reyes",
    email: "noah.reyes@example.com",
    title: "QA Engineer",
    department: "Quality Engineering",
    employeeCode: "EMP-0002",
  },
  {
    id: 3,
    name: "Priya Menon",
    email: "priya.menon@example.com",
    title: "Product Analyst",
    department: "Data Products",
    employeeCode: "EMP-0003",
  },
];

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
    name: "form readiness transitions reflect true submit availability",
    run() {
      const incomplete = createValidForm({ requesterName: "" });
      const invalid = createValidForm({ requesterEmail: "not-an-email" });
      const valid = createValidForm();

      assert.equal(isFormSubmittable(incomplete), false);
      assert.equal(isFormSubmittable(invalid), false);
      assert.equal(isFormSubmittable(valid), true);
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
        "Submitting request."
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
        "All required fields are complete. The Submit button is enabled."
      );
    },
  },
  {
    name: "employee form source keeps submit button disabled until form is ready",
    run() {
      const employeeFormSource = readFileSync(
        new URL("../src/components/EmployeeForm.jsx", import.meta.url),
        "utf8"
      );

      assert.match(employeeFormSource, /\{isSubmitting \? "Submitting\.\.\." : "Submit"\}/);
      assert.match(employeeFormSource, /disabled=\{isSubmitting \|\| !isFormReady\}/);
      assert.doesNotMatch(employeeFormSource, /Submit Employee Form/);
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
  {
    name: "app hero uses the updated heading copy and oracle red heading color",
    run() {
      const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
      const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

      assert.match(appSource, /<h1>Employee Data Center<\/h1>/);
      assert.doesNotMatch(appSource, /Employee Pulse Command Center/);
      assert.match(stylesSource, /\.hero h1\s*\{[^}]*color:\s*#c74634;/s);
    },
  },
  {
    name: "employee finder search matches name, email, role, and employee code",
    run() {
      assert.equal(
        applyEmployeeFilters(FINDER_FIXTURE_EMPLOYEES, {
          query: "amelia",
          department: "",
        }).length,
        1
      );
      assert.equal(
        applyEmployeeFilters(FINDER_FIXTURE_EMPLOYEES, {
          query: "noah.reyes@example.com",
          department: "",
        }).length,
        1
      );
      assert.equal(
        applyEmployeeFilters(FINDER_FIXTURE_EMPLOYEES, {
          query: "qa engineer",
          department: "",
        }).length,
        1
      );
      assert.equal(
        applyEmployeeFilters(FINDER_FIXTURE_EMPLOYEES, {
          query: "emp-0003",
          department: "",
        }).length,
        1
      );
    },
  },
  {
    name: "employee finder applies department filter and supports clear defaults",
    run() {
      const filtered = applyEmployeeFilters(FINDER_FIXTURE_EMPLOYEES, {
        query: "",
        department: "Quality Engineering",
      });
      const reset = applyEmployeeFilters(
        FINDER_FIXTURE_EMPLOYEES,
        DEFAULT_FINDER_FILTERS
      );

      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].department, "Quality Engineering");
      assert.equal(reset.length, FINDER_FIXTURE_EMPLOYEES.length);
    },
  },
  {
    name: "employee finder handles empty results and department options deterministically",
    run() {
      const filtered = applyEmployeeFilters(FINDER_FIXTURE_EMPLOYEES, {
        query: "missing",
        department: "Data Products",
      });
      const departments = getDepartmentOptions([
        ...FINDER_FIXTURE_EMPLOYEES,
        { ...FINDER_FIXTURE_EMPLOYEES[0] },
      ]);

      assert.equal(filtered.length, 0);
      assert.deepEqual(departments, [
        "Data Products",
        "Platform Engineering",
        "Quality Engineering",
      ]);
    },
  },
  {
    name: "app source wires the employee finder panel and accessible controls",
    run() {
      const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
      const filterSource = readFileSync(
        new URL("../src/components/FilterBar.jsx", import.meta.url),
        "utf8"
      );

      assert.match(appSource, /import FilterBar from "\.\/components\/FilterBar";/);
      assert.match(appSource, /<FilterBar/);
      assert.match(filterSource, /<h2>Employee Finder<\/h2>/);
      assert.match(filterSource, /role="status"/);
      assert.match(filterSource, /aria-live="polite"/);
      assert.match(filterSource, /Apply Filters/);
      assert.match(filterSource, /Clear Filters/);
      assert.match(filterSource, /<option value="">All departments<\/option>/);
      assert.match(filterSource, /Search by name, email, role, or employee code/);
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
