import React, { useEffect, useMemo, useState } from "react";
import FilterBar from "./components/FilterBar";
import ActivityList from "./components/ActivityList";
import EmployeeForm from "./components/EmployeeForm";
import OracleLogo from "./components/OracleLogo.js";
import { fetchEmployees } from "./api/fetchEmployees";

function matchEmployee(employee, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    employee.name,
    employee.email,
    employee.title,
    employee.department,
    employee.employeeCode,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

export default function App() {
  const PAGE_SIZE = 10;
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataSource, setDataSource] = useState("loading");
  const [lastSubmission, setLastSubmission] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const result = await fetchEmployees();
      if (!active) return;

      setEmployees(result.employees);
      setDataSource(result.source);
      setError(result.note || "");
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const departments = useMemo(
    () =>
      [...new Set(employees.map((employee) => employee.department))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [employees]
  );

  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) => {
        const departmentMatch = selectedDepartment
          ? employee.department === selectedDepartment
          : true;
        return departmentMatch && matchEmployee(employee, query);
      }),
    [employees, query, selectedDepartment]
  );

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedDepartment]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const applyFilters = () => {
    // Filtering is live already; this button is for clear user intent in demos.
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedDepartment("");
    setCurrentPage(1);
  };

  const handleSubmit = (payload) => {
    setLastSubmission(payload);
    // Required by ticket: log filled form data on successful submit.
    // eslint-disable-next-line no-console
    console.log("[ODT Demo] Employee request submitted:", payload);
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-brand-row">
          <OracleLogo />
          <p className="kicker">Oracle Developer Twin Demo Target</p>
        </div>
        <h1>Employee Pulse Command Center</h1>
        <p>
          React UI with mock API data, search/filtering, validated request form,
          and observable submission events for hackathon storytelling.
        </p>
        <div className="hero-pills">
          <span className="pill">
            Data source: {dataSource === "mock-api" ? "Mock API" : dataSource}
          </span>
          <span className="pill">Employees: {employees.length}</span>
          <span className="pill">Visible: {filteredEmployees.length}</span>
        </div>
      </header>

      <main className="layout-grid">
        <div className="left-column">
          <FilterBar
            query={query}
            selectedDepartment={selectedDepartment}
            departments={departments}
            visibleCount={paginatedEmployees.length}
            filteredCount={filteredEmployees.length}
            totalCount={employees.length}
            onQueryChange={setQuery}
            onDepartmentChange={setSelectedDepartment}
            onApply={applyFilters}
            onClear={clearFilters}
          />
          <ActivityList
            employees={paginatedEmployees}
            loading={loading}
            error={error}
            currentPage={safePage}
            totalPages={totalPages}
            startIndex={filteredEmployees.length ? startIndex + 1 : 0}
            endIndex={Math.min(endIndex, filteredEmployees.length)}
            totalFilteredItems={filteredEmployees.length}
            onNextPage={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            onPreviousPage={() => setCurrentPage((page) => Math.max(page - 1, 1))}
          />
        </div>

        <div className="right-column">
          <EmployeeForm employees={employees} onSubmit={handleSubmit} />

          <section className="card submission-card" aria-label="Latest submission">
            <h2>Latest Submitted Payload</h2>
            <p>Great for live demos: submit form and show this + console logs.</p>
            <pre className="payload-preview" aria-live="polite">
              {lastSubmission
                ? JSON.stringify(lastSubmission, null, 2)
                : "No form submission yet. Fill and submit the form to preview payload JSON here."}
            </pre>
          </section>
        </div>
      </main>
    </div>
  );
}
