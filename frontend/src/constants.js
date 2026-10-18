// Must match the Category enum in backend/app/schemas/expense.py
export const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Education",
  "Other",
];


// One fixed colour per category, so a category looks the same everywhere
export const CATEGORY_COLORS = {
  Food: "#ef6c00",
  Transport: "#1976d2",
  Shopping: "#8e24aa",
  Bills: "#c62828",
  Health: "#2e7d32",
  Entertainment: "#f9a825",
  Education: "#00838f",
  Other: "#757575",
};

// Stands for "overall budget" (category = null on the backend) in dropdowns and lookups
export const OVERALL = "__overall__";