import React from "react";

function EmployeeCard({ employee, index }) {
  return (
    <li className="employee-card" style={{ "--stagger": `${index * 60}ms` }}>
      <div className="employee-top-row">
        <h3>{employee.name}</h3>
        <span className="employee-tag">{employee.employeeCode}</span>
      </div>

      <p className="employee-role">{employee.title}</p>

      <dl className="employee-meta">
        <div>
          <dt>Email</dt>
          <dd>{employee.email}</dd>
        </div>
        <div>
          <dt>Department</dt>
          <dd>{employee.department}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{employee.phone}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{employee.location}</dd>
        </div>
      </dl>
    </li>
  );
}

export default function ActivityList({
  employees = [],
  loading,
  error,
  currentPage = 1,
  totalPages = 1,
  startIndex = 0,
  endIndex = 0,
  totalFilteredItems = 0,
  onNextPage,
  onPreviousPage,
}) {
  return (
    <section className="card list-card" aria-label="Employee list">
      <div className="list-heading">
        <h2>Employee Directory</h2>
        <p>Live dataset for ticket-driven frontend delivery demos.</p>
      </div>

      {loading ? (
        <p className="status-pill" role="status">
          Loading mock employee data...
        </p>
      ) : null}

      {error ? (
        <p className="status-pill warning" role="status">
          {error}
        </p>
      ) : null}

      {!loading && employees.length === 0 ? (
        <div className="empty-state" role="status">
          <h3>No employees found</h3>
          <p>Try clearing filters or searching with broader keywords.</p>
        </div>
      ) : null}

      {employees.length > 0 ? (
        <>
          <div className="pagination-summary" aria-live="polite">
            Showing {startIndex}-{endIndex} of {totalFilteredItems} results
          </div>
          <ul className="employee-grid">
            {employees.map((employee, index) => (
              <EmployeeCard key={employee.id} employee={employee} index={index} />
            ))}
          </ul>
          <div className="pagination-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onPreviousPage}
              disabled={currentPage <= 1}
            >
              Previous
            </button>
            <span className="page-pill" aria-live="polite">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onNextPage}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
