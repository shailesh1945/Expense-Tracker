import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  TextField,
} from "@mui/material";

import { getErrorMessage } from "../api/client";
import { setBudget } from "../api/budgets";
import { CATEGORIES, OVERALL } from "../constants";
import { formatMonth } from "../utils/format";

const MAX_AMOUNT = 100_000_000; // same limit as the backend

const labelFor = (key) => (key === OVERALL ? "Overall (all categories)" : key);

export default function BudgetFormDialog({ month, budget, takenKeys, onClose, onSaved }) {
  const isEdit = Boolean(budget);
  const options = [OVERALL, ...CATEGORIES].filter((key) => isEdit || !takenKeys.includes(key));

  const [categoryKey, setCategoryKey] = useState(isEdit ? (budget.category ?? OVERALL) : options[0]);
  const [amount, setAmount] = useState(isEdit ? String(budget.budget) : "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    if (value > MAX_AMOUNT) {
      setError("Amount is too large.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await setBudget({
        month,
        category: categoryKey === OVERALL ? null : categoryKey,
        amount: value,
      });
      onSaved(isEdit ? "Budget updated" : "Budget saved");
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { component: "form", onSubmit: handleSubmit, noValidate: true } }}
    >
      <DialogTitle>
        {isEdit ? "Edit" : "Set"} budget: {formatMonth(month)}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            select
            label="Applies to"
            value={categoryKey}
            onChange={(e) => setCategoryKey(e.target.value)}
            disabled={isEdit}
          >
            {options.map((key) => (
              <MenuItem key={key} value={key}>
                {labelFor(key)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Monthly limit"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            required
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
              htmlInput: { min: 0.01, step: "0.01" },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? "Saving..." : "Save budget"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}