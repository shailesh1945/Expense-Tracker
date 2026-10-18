import api from "./client";

export async function getExpenses({ category, startDate, endDate, skip, limit }) {
  const params = { skip, limit };
  if (category) params.category = category;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const { data } = await api.get("/expenses", { params });
  return data;
}

export async function createExpense(payload) {
  const { data } = await api.post("/expenses", payload);
  return data;
}

export async function updateExpense(id, payload) {
  const { data } = await api.patch(`/expenses/${id}`, payload);
  return data;
}

export async function deleteExpense(id) {
  await api.delete(`/expenses/${id}`); // 204, no body
}