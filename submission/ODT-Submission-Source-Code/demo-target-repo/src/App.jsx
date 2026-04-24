import React, { useEffect, useMemo, useState } from "react";
import ActivityList from "./components/ActivityList";
import EmployeeForm from "./components/EmployeeForm";
import OracleLogo from "./components/OracleLogo.js";
import { fetchEmployees } from "./api/fetchEmployees";

export default function App() {
  const PAGE_SIZE = 10;
  const [employees, setEmployees] = useState([]);
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

  const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedEmployees = useMemo(
    () => employees.slice(startIndex, endIndex),
    [employees, startIndex, endIndex]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
        <h1>Employee Data Center</h1>
        <p>
          React UI with mock API data, a paginated employee roster, and a
          request form used for ODT feature and defect storytelling.
        </p>
        <div className="hero-pills">
          <span className="pill">
            Data source: {dataSource === "mock-api" ? "Mock API" : dataSource}
          </span>
          <span className="pill">Employees: {employees.length}</span>
          <span className="pill">Visible This Page: {paginatedEmployees.length}</span>
        </div>
      </header>

      <main className="layout-grid">
        <div className="left-column">
          <ActivityList
            employees={paginatedEmployees}
            loading={loading}
            error={error}
            currentPage={safePage}
            totalPages={totalPages}
            startIndex={employees.length ? startIndex + 1 : 0}
            endIndex={Math.min(endIndex, employees.length)}
            totalFilteredItems={employees.length}
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
