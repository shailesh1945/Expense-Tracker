import { Box, Typography } from "@mui/material";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { CATEGORY_COLORS } from "../constants";
import { formatCurrency } from "../utils/format";

export default function CategoryChart({ categories }) {
  if (categories.length === 0) {
    return (
      <Box sx={{ height: 300, display: "grid", placeItems: "center" }}>
        <Typography color="text.secondary">No expenses in this month.</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={categories} dataKey="total" nameKey="category" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {categories.map((c) => (
            <Cell key={c.category} fill={CATEGORY_COLORS[c.category]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}