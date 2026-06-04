import React from "react";

export default function FilterBar({
  query,
  selectedDepartment,
  departments,
  visibleCount,
  filteredCount,
  totalCount,
  onQueryChange,
  onDepartmentChange,
  onApply,
  onClear,
}) {
  const totalFiltered = typeof filteredCount === "number" ? filteredCount : totalCount;

  return (
    <section className="card search-card" aria-label="Filter employees">
      <div className="search-heading-row">
        <h2>Employee Finder</h2>
        <p className="finder-count" id="finder-result-status" role="status" aria-live="polite">
          {totalFiltered} of {totalCount} employees match filters. Showing{" "}
          <strong>{visibleCount}</strong> on this page.
        </p>
      </div>

      <div className="search-grid">
        <label htmlFor="employee-search">
          Search by name, email, role, or employee code
        </label>
        <input
          id="employee-search"
          name="employee-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search employee name, email, role, or employee code"
          aria-describedby="finder-result-status"
        />

        <label htmlFor="department-filter">Department</label>
        <select
          id="department-filter"
          name="department-filter"
          value={selectedDepartment}
          onChange={(event) => onDepartmentChange(event.target.value)}
          aria-describedby="finder-result-status"
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </div>

      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={onApply}>
          Apply Filters
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClear}>
          Clear Filters
        </button>
      </div>
    </section>
  );
}
