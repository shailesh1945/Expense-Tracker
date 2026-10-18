import api from "./client";

export async function getBudgets(month) {
  const { data } = await api.get("/budgets", { params: { month } });
  return data;
}

// category = null means the overall budget. PUT creates or updates.
export async function setBudget({ month, category, amount }) {
  const { data } = await api.put("/budgets", { month, category, amount });
  return data;
}

export async function deleteBudget(id) {
  await api.delete(`/budgets/${id}`); // 204, no body
}