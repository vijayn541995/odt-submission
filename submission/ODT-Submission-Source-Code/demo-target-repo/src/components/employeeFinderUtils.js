function normalizeQuery(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export const DEFAULT_FINDER_FILTERS = {
  query: "",
  department: "",
};

export function applyEmployeeFilters(employees = [], filters = DEFAULT_FINDER_FILTERS) {
  const query = normalizeQuery(filters.query);
  const selectedDepartment = filters.department || "";

  return employees.filter((employee) => {
    const matchesDepartment =
      !selectedDepartment || employee.department === selectedDepartment;

    if (!matchesDepartment) {
      return false;
    }

    if (!query) {
      return true;
    }

    const searchableFields = [
      employee.name,
      employee.email,
      employee.title,
      employee.employeeCode,
    ];

    return searchableFields.some((field) =>
      String(field || "").toLowerCase().includes(query)
    );
  });
}

export function getDepartmentOptions(employees = []) {
  return [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b)
  );
}
