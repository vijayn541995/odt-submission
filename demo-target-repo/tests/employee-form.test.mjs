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
  filterEmployees,
  getEmployeeDepartments,
} from "../src/components/employeeFilterUtils.js";
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

const EMPLOYEE_FIXTURE = [
  {
    id: 1,
    name: "Amelia Chen",
    email: "amelia.chen@example.com",
    title: "Frontend Engineer",
    department: "Platform Engineering",
    employeeCode: "EMP-0101",
  },
  {
    id: 2,
    name: "Noah Singh",
    email: "noah.singh@example.com",
    title: "QA Engineer",
    department: "Quality Engineering",
    employeeCode: "EMP-0102",
  },
  {
    id: 3,
    name: "Liam Ortiz",
    email: "liam.ortiz@example.com",
    title: "Accessibility Specialist",
    department: "Experience Design",
    employeeCode: "EMP-0103",
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
    name: "submittable state transitions from invalid to valid",
    run() {
      const invalidForm = createValidForm({
        requesterEmail: "invalid-email",
      });
      const validForm = createValidForm({
        requesterEmail: "valid.user@example.com",
      });

      assert.equal(isFormSubmittable(invalidForm), false);
      assert.equal(isFormSubmittable(validForm), true);
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
    name: "employee finder filters by query across identity fields",
    run() {
      assert.deepEqual(
        filterEmployees(EMPLOYEE_FIXTURE, { query: "amelia" }).map(
          (employee) => employee.id
        ),
        [1]
      );
      assert.deepEqual(
        filterEmployees(EMPLOYEE_FIXTURE, { query: "QA" }).map(
          (employee) => employee.id
        ),
        [2]
      );
      assert.deepEqual(
        filterEmployees(EMPLOYEE_FIXTURE, { query: "EMP-0103" }).map(
          (employee) => employee.id
        ),
        [3]
      );
    },
  },
  {
    name: "employee finder combines query and department filters",
    run() {
      assert.deepEqual(
        filterEmployees(EMPLOYEE_FIXTURE, {
          query: "engineer",
          department: "Quality Engineering",
        }).map((employee) => employee.id),
        [2]
      );

      assert.deepEqual(
        filterEmployees(EMPLOYEE_FIXTURE, {
          query: "engineer",
          department: "Experience Design",
        }),
        []
      );
    },
  },
  {
    name: "employee finder returns all employees when no filters are applied",
    run() {
      assert.deepEqual(filterEmployees(EMPLOYEE_FIXTURE), EMPLOYEE_FIXTURE);
      assert.deepEqual(filterEmployees([], { query: "anything" }), []);
    },
  },
  {
    name: "department options are unique and sorted",
    run() {
      const departments = getEmployeeDepartments([
        ...EMPLOYEE_FIXTURE,
        {
          ...EMPLOYEE_FIXTURE[0],
          id: 4,
        },
      ]);

      assert.deepEqual(departments, [
        "Experience Design",
        "Platform Engineering",
        "Quality Engineering",
      ]);
    },
  },
  {
    name: "employee form source disables submit unless the form is ready",
    run() {
      const employeeFormSource = readFileSync(
        new URL("../src/components/EmployeeForm.jsx", import.meta.url),
        "utf8"
      );

      assert.match(
        employeeFormSource,
        /disabled=\{isSubmitting \|\| !isFormReady\}/
      );
      assert.match(
        employeeFormSource,
        /\{isSubmitting \? "Submitting\.\.\." : "Submit"\}/
      );
      assert.match(employeeFormSource, /aria-describedby=\{SUBMIT_STATUS_ID\}/);
      assert.doesNotMatch(employeeFormSource, /Submit Employee Form/);
      assert.doesNotMatch(employeeFormSource, /Submit Request/);
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
    name: "app uses employee finder panel and result counts",
    run() {
      const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
      const filterBarSource = readFileSync(
        new URL("../src/components/FilterBar.jsx", import.meta.url),
        "utf8"
      );

      assert.match(appSource, /import FilterBar from "\.\/components\/FilterBar";/);
      assert.match(appSource, /<FilterBar/);
      assert.match(appSource, /filteredCount=\{filteredEmployees\.length\}/);
      assert.match(filterBarSource, /type="submit" className="btn btn-primary"/);
      assert.match(filterBarSource, /id="employee-finder-results" aria-live="polite"/);
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
