import { FALLBACK_EMPLOYEES } from "../data/fallbackEmployees.js";

const DEPARTMENTS = [
  "Platform Engineering",
  "Experience Design",
  "Quality Engineering",
  "Delivery Operations",
  "Security Engineering",
  "Data Products",
];

const TITLES = [
  "Frontend Engineer",
  "UI Architect",
  "Accessibility Specialist",
  "QA Engineer",
  "Product Analyst",
  "Release Coordinator",
];

const NAME_SUFFIX = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
];

function toEmployee(user, index) {
  const department = DEPARTMENTS[index % DEPARTMENTS.length];
  const title = TITLES[index % TITLES.length];
  const address = user.address || {};
  const city = address.city || "Remote";
  const street = address.street || "Global Office";
  const id = index + 1;
  const rawName = user.name || "Employee";
  const suffix = NAME_SUFFIX[Math.floor(index / 10) % NAME_SUFFIX.length];
  const displayName = `${rawName} ${suffix}${id}`;
  const emailPrefix = String(user.email || `employee${id}@example.com`)
    .split("@")[0]
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();

  return {
    id,
    name: displayName,
    email: `${emailPrefix}+${id}@example.com`,
    phone: user.phone,
    department,
    title,
    location: `${city}, ${street}`,
    employeeCode: `EMP-${String(id).padStart(4, "0")}`,
  };
}

function generateEmployees(seedUsers, count = 300) {
  const users = Array.isArray(seedUsers) && seedUsers.length ? seedUsers : FALLBACK_EMPLOYEES;
  const expanded = [];

  for (let index = 0; index < count; index += 1) {
    const template = users[index % users.length];
    expanded.push(toEmployee(template, index));
  }

  return expanded;
}

export async function fetchEmployees() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const users = await response.json();
    if (!Array.isArray(users) || users.length === 0) {
      throw new Error("Unexpected users payload");
    }

    return {
      source: "mock-api",
      employees: generateEmployees(users, 300),
    };
  } catch (error) {
    return {
      source: "fallback",
      employees: generateEmployees(FALLBACK_EMPLOYEES, 300),
      note: `Using fallback employee dataset because mock API was unavailable: ${error.message}`,
    };
  }
}
