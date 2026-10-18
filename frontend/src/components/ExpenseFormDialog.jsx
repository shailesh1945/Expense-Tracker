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
import { createExpense, updateExpense } from "../api/expenses";
import { CATEGORIES } from "../constants";
import { todayISO } from "../utils/format";

const MAX_AMOUNT = 10_000_000; // same limit as the backend
const MAX_NOTE = 200;

export default function ExpenseFormDialog({ expense, onClose, onSaved }) {
  const isEdit = Boolean(expense);

  const [form, setForm] = useState({
    amount: expense ? String(expense.amount) : "",
    category: expense?.category ?? "Food",
    date: expense?.date ?? todayISO(),
    note: expense?.note ?? "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const validate = () => {
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      return "Enter an amount greater than 0.";
    }
    if (amount > MAX_AMOUNT) return "Amount is too large.";
    if (!form.date) return "Pick a date.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    setError("");
    setSubmitting(true);

    const payload = {
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      note: form.note.trim() || null, // empty note is sent as null
    };

    try {
      if (isEdit) {
        await updateExpense(expense.id, payload);
      } else {
        await createExpense(payload);
      }
      onSaved(isEdit ? "Expense updated" : "Expense added", !isEdit);
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
      <DialogTitle>{isEdit ? "Edit expense" : "Add expense"}</DialogTitle>

      <DialogContent>
        <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Amount"
            type="number"
            value={form.amount}
            onChange={handleChange("amount")}
            autoFocus
            required
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
              htmlInput: { min: 0.01, step: "0.01" },
            }}
          />

          <TextField select label="Category" value={form.category} onChange={handleChange("category")}>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Date"
            type="date"
            value={form.date}
            onChange={handleChange("date")}
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Note (optional)"
            value={form.note}
            onChange={handleChange("note")}
            helperText={`${form.note.length}/${MAX_NOTE}`}
            slotProps={{ htmlInput: { maxLength: MAX_NOTE } }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? "Saving..." : isEdit ? "Save changes" : "Add expense"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}