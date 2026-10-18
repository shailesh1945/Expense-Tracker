import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { getErrorMessage } from "../api/client";
import { deleteExpense, getExpenses } from "../api/expenses";
import ConfirmDialog from "../components/ConfirmDialog";
import ExpenseFormDialog from "../components/ExpenseFormDialog";
import { CATEGORIES } from "../constants";
import { formatCurrency, formatDate } from "../utils/format";

const PAGE_SIZE = 10;
const NO_RESULT = { key: null, rows: [], hasNext: false, error: "" };

export default function Expenses() {
  const [filters, setFilters] = useState({ category: "", startDate: "", endDate: "" });
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState(NO_RESULT);

  const [formState, setFormState] = useState({ open: false, expense: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const { category, startDate, endDate } = filters;
  const rangeInvalid = Boolean(startDate && endDate && startDate > endDate);
  const hasFilters = Boolean(category || startDate || endDate);

  // Identifies "which request is the current one". While the stored result
  // belongs to an older request, we are loading.
  const requestKey = [category, startDate, endDate, page, refreshKey].join("|");
  const loading = !rangeInvalid && result.key !== requestKey;

  useEffect(() => {
    if (rangeInvalid) return;

    let cancelled = false; // ignore answers from outdated requests
    getExpenses({
      category,
      startDate,
      endDate,
      skip: page * PAGE_SIZE,
      limit: PAGE_SIZE + 1, // ask for one extra row to know if a next page exists
    })
      .then((data) => {
        if (cancelled) return;
        setResult({
          key: requestKey,
          rows: data.slice(0, PAGE_SIZE),
          hasNext: data.length > PAGE_SIZE,
          error: "",
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult({ key: requestKey, rows: [], hasNext: false, error: getErrorMessage(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [category, startDate, endDate, page, requestKey, rangeInvalid]);

  const showToast = (message, severity = "success") =>
    setToast({ open: true, message, severity });

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({ category: "", startDate: "", endDate: "" });
    setPage(0);
  };

  const closeForm = () => setFormState({ open: false, expense: null });

  const handleSaved = (message, isNew) => {
    closeForm();
    if (isNew) setPage(0);
    setRefreshKey((k) => k + 1);
    showToast(message);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteExpense(toDelete.id);
      setToDelete(null);
      // Deleted the only row on a later page? Step back one page
      if (result.rows.length === 1 && page > 0) setPage((p) => p - 1);
      setRefreshKey((k) => k + 1);
      showToast("Expense deleted");
    } catch (err) {
      setToDelete(null);
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" fontWeight={600}>
          Expenses
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormState({ open: true, expense: null })}>
          Add expense
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          select
          size="small"
          label="Category"
          value={category}
          onChange={handleFilterChange("category")}
          sx={{ minWidth: 180 }}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">All categories</MenuItem>
          {CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          label="From"
          type="date"
          value={startDate}
          onChange={handleFilterChange("startDate")}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small"
          label="To"
          type="date"
          value={endDate}
          onChange={handleFilterChange("endDate")}
          error={rangeInvalid}
          helperText={rangeInvalid ? "Must not be before 'From'" : ""}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        {hasFilters && <Button onClick={clearFilters}>Clear filters</Button>}
      </Paper>

      {result.error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => setRefreshKey((k) => k + 1)}>Retry</Button>}>
          {result.error}
        </Alert>
      )}

      {/* Table */}
      <Paper>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Note</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ opacity: loading ? 0.5 : 1 }}>
              {result.rows.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(expense.date)}</TableCell>
                  <TableCell>
                    <Chip label={expense.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {expense.note || "-"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setFormState({ open: true, expense })}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setToDelete(expense)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && !result.error && result.rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    {hasFilters ? "No expenses match these filters." : "No expenses yet. Add your first one!"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2, mt: 2 }}>
        <Button disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <Typography variant="body2">Page {page + 1}</Typography>
        <Button disabled={!result.hasNext || loading} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </Box>

      {/* Dialogs */}
      {formState.open && (
        <ExpenseFormDialog expense={formState.expense} onClose={closeForm} onSaved={handleSaved} />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this expense?"
        message={
          toDelete
            ? `${formatCurrency(toDelete.amount)} on ${toDelete.category} (${formatDate(toDelete.date)}) will be permanently removed.`
            : ""
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((t) => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}