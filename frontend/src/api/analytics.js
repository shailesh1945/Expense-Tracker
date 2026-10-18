import api from "./client";

export async function getCategorySummary(month) {
  const { data } = await api.get("/analytics/category-summary", { params: { month } });
  return data; // { month, total_spent, categories: [...] }
}

export async function getMonthlyTrend(months) {
  const { data } = await api.get("/analytics/monthly-trend", { params: { months } });
  return data; // { months: [{ month, total }] }
}

export async function getBudgetStatus(month) {
  const { data } = await api.get("/analytics/budget-status", { params: { month } });
  return data; // { month, items: [...] }
}