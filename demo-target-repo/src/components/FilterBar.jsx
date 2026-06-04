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

  const handleSubmit = (event) => {
    event.preventDefault();
    onApply();
  };

  return (
    <section className="card search-card" aria-label="Filter employees">
      <div className="search-heading-row">
        <h2>Employee Finder</h2>
        <p id="employee-finder-results" aria-live="polite">
          Showing <strong>{visibleCount}</strong> of {totalFiltered} filtered
          ({totalCount} total)
        </p>
      </div>

      <form onSubmit={handleSubmit} aria-describedby="employee-finder-results">
        <div className="search-grid">
          <label htmlFor="employee-search">
            Search by name, email, role, or employee code
          </label>
          <input
            id="employee-search"
            name="employee-search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Try: Amelia, QA, EMP-0004..."
          />

          <label htmlFor="department-filter">Filter by department</label>
          <select
            id="department-filter"
            name="department-filter"
            value={selectedDepartment}
            onChange={(event) => onDepartmentChange(event.target.value)}
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
          <button type="submit" className="btn btn-primary">
            Apply Filters
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClear}>
            Clear Filters
          </button>
        </div>
      </form>
    </section>
  );
}
