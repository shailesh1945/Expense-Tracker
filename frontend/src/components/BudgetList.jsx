import { Box, Button, Chip, Divider, IconButton, LinearProgress, Tooltip, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Fragment } from "react";

import { formatCurrency } from "../utils/format";

const STATUS = {
  ok: { color: "success", label: "On track" },
  warning: { color: "warning", label: "Close to limit" },
  exceeded: { color: "error", label: "Over budget" },
};

export default function BudgetList({ items, onEdit, onDelete, onAdd, canAdd }) {
  if (items.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          No budgets set for this month.
        </Typography>
        <Button variant="outlined" onClick={onAdd} disabled={!canAdd}>
          Set a budget
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {items.map((item, index) => {
        const s = STATUS[item.status];
        const over = item.remaining < 0;

        return (
          <Fragment key={item.category ?? "overall"}>
            {index > 0 && <Divider />}
            <Box sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography fontWeight={500}>{item.category ?? "Overall"}</Typography>
                  <Chip size="small" variant="outlined" color={s.color} label={s.label} />
                </Box>
                <Box sx={{ whiteSpace: "nowrap" }}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => onDelete(item)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={Math.min(item.percent_used, 100)}
                color={s.color}
                sx={{ height: 8, borderRadius: 4, my: 1 }}
              />

              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(item.spent)} of {formatCurrency(item.budget)} ({item.percent_used}%)
                </Typography>
                <Typography variant="body2" color={over ? "error.main" : "text.secondary"}>
                  {over
                    ? `${formatCurrency(Math.abs(item.remaining))} over`
                    : `${formatCurrency(item.remaining)} left`}
                </Typography>
              </Box>
            </Box>
          </Fragment>
        );
      })}
    </Box>
  );
}