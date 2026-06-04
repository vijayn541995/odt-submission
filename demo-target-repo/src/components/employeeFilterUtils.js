export function normalizeFilterValue(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function filterEmployees(employees = [], { query = "", department = "" } = {}) {
  if (!Array.isArray(employees) || employees.length === 0) {
    return [];
  }

  const normalizedQuery = normalizeFilterValue(query);
  const normalizedDepartment = normalizeFilterValue(department);

  return employees.filter((employee) => {
    const matchesDepartment =
      !normalizedDepartment ||
      normalizeFilterValue(employee.department) === normalizedDepartment;

    if (!matchesDepartment) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [employee.name, employee.email, employee.title, employee.employeeCode]
      .map((value) => normalizeFilterValue(value))
      .some((value) => value.includes(normalizedQuery));
  });
}

export function getEmployeeDepartments(employees = []) {
  if (!Array.isArray(employees) || employees.length === 0) {
    return [];
  }

  return [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right)
  );
}
