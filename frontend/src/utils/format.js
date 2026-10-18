export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

// "2026-10-15" -> "15 Oct 2026"
export function formatDate(isoDate) {
  // Adding a time makes JS read the date in local time, which avoids a one-day shift
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Today as "YYYY-MM-DD" in the user's local timezone
export function todayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function formatCompact(amount) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

// Current month as "YYYY-MM" in the user's local timezone
export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// shiftMonth("2026-12", 1) -> "2027-01"
export function shiftMonth(month, delta) {
  const [year, mon] = month.split("-").map(Number);
  const d = new Date(year, mon - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// "2026-10" -> "October 2026"
export function formatMonth(month) {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

// "2026-10" -> "Oct 26" (for chart labels)
export function formatMonthShort(month) {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}