import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCompact, formatCurrency, formatMonthShort } from "../utils/format";

export default function TrendChart({ months, selectedMonth }) {
  const data = months.map((m) => ({ ...m, label: formatMonthShort(m.month) }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" />
        <YAxis tickFormatter={formatCompact} width={50} />
        <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: "rgba(0, 0, 0, 0.04)" }} />
        <Bar dataKey="total" name="Spent" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            // The month you are viewing is the darker bar
            <Cell key={d.month} fill={d.month === selectedMonth ? "#2e7d32" : "#a5d6a7"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}