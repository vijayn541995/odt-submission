# ODT Review Packet
- Status: needs_review
- Target repo: /Users/vn105957/Desktop/odt-submission/demo-target-repo
- Generated: 2026-05-14T15:04:10.796Z
- Changed files: 6
- Staged: 0
- Unstaged: 5
- Untracked: 1
## Files
### src/App.jsx

- Status: modified
- Kind: ui
- Planned scope: no
- Risk: out_of_scope
### src/components/EmployeeForm.jsx

- Status: modified
- Kind: ui
- Planned scope: no
- Risk: out_of_scope
### src/components/FilterBar.jsx

- Status: modified
- Kind: ui
- Planned scope: no
- Risk: out_of_scope
### tests/activity-filter.spec.md

- Status: modified
- Kind: test
- Planned scope: yes
- Risk: normal
### tests/employee-form.test.mjs

- Status: modified
- Kind: test
- Planned scope: yes
- Risk: normal
### src/components/employeeFilterUtils.js

- Status: untracked
- Kind: ui
- Planned scope: no
- Risk: out_of_scope
## Diff Stat
### Unstaged

```text
src/App.jsx                     |  57 ++++++++++++++--
 src/components/EmployeeForm.jsx |   2 +-
 src/components/FilterBar.jsx    |  77 ++++++++++++----------
 tests/activity-filter.spec.md   |  11 ++--
 tests/employee-form.test.mjs    | 142 +++++++++++++++++++++++++++++++++++++++-
 5 files changed, 240 insertions(+), 49 deletions(-)
```
## Diff Preview
```diff
# Unstaged diff
diff --git a/src/App.jsx b/src/App.jsx
index 9a72652..471b3a3 100644
--- a/src/App.jsx
+++ b/src/App.jsx
@@ -1,8 +1,13 @@
 import React, { useEffect, useMemo, useState } from "react";
 import ActivityList from "./components/ActivityList";
 import EmployeeForm from "./components/EmployeeForm";
+import FilterBar from "./components/FilterBar";
 import OracleLogo from "./components/OracleLogo.js";
 import { fetchEmployees } from "./api/fetchEmployees";
+import {
+  filterEmployees,
+  getEmployeeDepartments,
+} from "./components/employeeFilterUtils";
 
 export default function App() {
   const PAGE_SIZE = 10;
@@ -12,6 +17,12 @@ export default function App() {
   const [error, setError] = useState("");
   const [dataSource, setDataSource] = useState("loading");
   const [lastSubmission, setLastSubmission] = useState(null);
+  const [queryInput, setQueryInput] = useState("");
+  const [selectedDepartmentInput, setSelectedDepartmentInput] = useState("");
+  const [appliedFilters, setAppliedFilters] = useState({
+    query: "",
+    department: "",
+  });
 
   useEffect(() => {
     let active = true;
@@ -33,13 +44,19 @@ export default function App() {
     };
   }, []);
 
-  const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
+  const departments = useMemo(() => getEmployeeDepartments(employees), [employees]);
+  const filteredEmployees = useMemo(
+    () => filterEmployees(employees, appliedFilters),
+    [employees, appliedFilters]
+  );
+
+  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
   const safePage = Math.min(currentPage, totalPages);
   const startIndex = (safePage - 1) * PAGE_SIZE;
   const endIndex = startIndex + PAGE_SIZE;
   const paginatedEmployees = useMemo(
-    () => employees.slice(startIndex, endIndex),
-    [employees, startIndex, endIndex]
+    () => filteredEmployees.slice(startIndex, endIndex),
+    [filteredEmployees, startIndex, endIndex]
   );
 
   useEffect(() => {
@@ -48,6 +65,21 @@ export default function App() {
     }
   }, [currentPage, totalPages]);
 
+  const handleApplyFilters = () => {
+    setAppliedFilters({
+      query: queryInput,
+      department: selectedDepartmentInput,
+    });
+    setCurrentPage(1);
+  };
+
+  const handleClearFilters = () => {
+    setQueryInput("");
+    setSelectedDepartmentInput("");
+    setAppliedFilters({ query: "", department: "" });
+    setCurrentPage(1);
+  };
+
   const handleSubmit = (payload) => {
     setLastSubmission(payload);
     // Required by ticket: log filled form data on successful submit.
@@ -78,15 +110,28 @@ export default function App() {
 
       <main className="layout-grid">
         <div className="left-column">
+          <FilterBar
+            query={queryInput}
+            selectedDepartment={selectedDepartmentInput}
+            departments={departments}
+            visibleCount={paginatedEmployees.length}
+            filteredCount={filteredEmployees.length}
+            totalCount={employees.length}
+            onQueryChange={setQueryInput}
+            onDepartmentChange={setSelectedDepartmentInput}
+            onApply={handleApplyFilters}
+            onClear={handleClearFilters}
+          />
+
           <ActivityList
             employees={paginatedEmployees}
             loading={loading}
             error={error}
             currentPage={safePage}
             totalPages={totalPages}
-            startIndex={employees.length ? startIndex + 1 : 0}
-            endIndex={Math.min(endIndex, employees.length)}
-            totalFilteredItems={employees.length}
+            startIndex={filteredEmployees.length ? startIndex + 1 : 0}
+            endIndex={Math.min(endIndex, filteredEmployees.length)}
+            totalFilteredItems={filteredEmployees.length}
             onNextPage={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
             onPreviousPage={() => setCurrentPage((page) => Math.max(page - 1, 1))}
           />
diff --git a/src/components/EmployeeForm.jsx b/src/components/EmployeeForm.jsx
index db95ada..4c91a8d 100644
--- a/src/components/EmployeeForm.jsx
+++ b/src/components/EmployeeForm.jsx
@@ -281,7 +281,7 @@ export default function EmployeeForm({ employees = [], onSubmit }) {
           <button
             className="btn btn-primary"
             type="submit"
-            disabled={isSubmitting}
+            disabled={isSubmitting || !isFormReady}
             aria-describedby={SUBMIT_STATUS_ID}
           >
             {isSubmitting ? "Submitting..." : "Submit"}
diff --git a/src/components/FilterBar.jsx b/src/components/FilterBar.jsx
index 9ec9915..4c34905 100644
--- a/src/components/FilterBar.jsx
+++ b/src/components/FilterBar.jsx
@@ -14,52 +14,59 @@ export default function FilterBar({
 }) {
   const totalFiltered = typeof filteredCount === "number" ? filteredCount : totalCount;
 
+  const handleSubmit = (event) => {
+    event.preventDefault();
+    onApply();
+  };
+
   return (
     <section className="card search-card" aria-label="Filter employees">
       <div className="search-heading-row">
         <h2>Employee Finder</h2>
-        <p aria-live="polite">
+        <p id="employee-finder-results" aria-live="polite">
           Showing <strong>{visibleCount}</strong> of {totalFiltered} filtered
           ({totalCount} total)
         </p>
       </div>
 
-      <div className="search-grid">
-        <label htmlFor="employee-search">
-          Search by name, email, role, or employee code
-        </label>
-        <input
-          id="employee-search"
-          name="employee-search"
-          value={query}
-          onChange={(event) => onQueryChange(event.target.value)}
-          placeholder="Try: Amelia, QA, EMP-0004..."
-        />
+      <form onSubmit={handleSubmit} aria-describedby="employee-finder-results">
+        <div className="search-grid">
+          <label htmlFor="employee-search">
+            Search by name, email, role, or employee code
+      

[truncated 6024 chars]
```
