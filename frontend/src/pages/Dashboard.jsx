import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, LinearProgress, Snackbar, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { getBudgetStatus, getCategorySummary, getMonthlyTrend } from "../api/analytics";
import { getBudgets, deleteBudget } from "../api/budgets";
import { getErrorMessage } from "../api/client";
import BudgetFormDialog from "../components/BudgetFormDialog";
import BudgetList from "../components/BudgetList";
import CategoryChart from "../components/CategoryChart";
import ConfirmDialog from "../components/ConfirmDialog";
import MonthSwitcher from "../components/MonthSwitcher";
import Section from "../components/Section";
import StatCard from "../components/StatCard";
import TrendChart from "../components/TrendChart";
import { CATEGORIES, OVERALL } from "../constants";
import { currentMonth, formatCurrency, formatMonth } from "../utils/format";

const TREND_MONTHS = 6;

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth);
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  const [budgetDialog, setBudgetDialog] = useState({ open: false, budget: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // Same pattern as the Expenses page: loading = the stored result is for an older request
  const requestKey = `${month}|${refreshKey}`;
  const loading = result.key !== requestKey;

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getCategorySummary(month),
      getMonthlyTrend(TREND_MONTHS),
      getBudgetStatus(month),
      getBudgets(month), // only needed for the budget ids (used by delete)
    ])
      .then(([summary, trend, status, budgets]) => {
        if (cancelled) return;
        setResult({ key: requestKey, data: { summary, trend, status, budgets }, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult({ key: requestKey, data: null, error: getErrorMessage(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [month, requestKey]);

  const { data } = result;

  // { Food: "id1", __overall__: "id2", ... }
  const budgetIds = useMemo(
    () => Object.fromEntries((data?.budgets ?? []).map((b) => [b.category ?? OVERALL, b.id])),
    [data]
  );
  const takenKeys = Object.keys(budgetIds);
  const canAddBudget = takenKeys.length < CATEGORIES.length + 1;

  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });
  const refresh = () => setRefreshKey((k) => k + 1);

  const handleBudgetSaved = (message) => {
    setBudgetDialog({ open: false, budget: null });
    refresh();
    showToast(message);
  };

  const handleDeleteBudget = async () => {
    setDeleting(true);
    try {
      await deleteBudget(budgetIds[toDelete.category ?? OVERALL]);
      setToDelete(null);
      refresh();
      showToast("Budget deleted");
    } catch (err) {
      setToDelete(null);
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  };

  // Numbers for the summary cards
  const summary = data?.summary;
  const expenseCount = summary ? summary.categories.reduce((n, c) => n + c.count, 0) : 0;
  const topCategory = summary?.categories[0];
  const overall = data?.status.items.find((i) => i.category === null);
  const overallColor = { ok: "success.main", warning: "warning.main", exceeded: "error.main" }[overall?.status];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" fontWeight={600}>
          Dashboard
        </Typography>
        <MonthSwitcher month={month} onChange={setMonth} />
      </Box>

      {result.error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={refresh}>Retry</Button>}>
          {result.error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {data && (
        <Box sx={{ display: "grid", gap: 3, opacity: loading ? 0.5 : 1, transition: "opacity 0.2s" }}>
          {/* Summary cards */}
          <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
            <StatCard
              label={`Spent in ${formatMonth(month)}`}
              value={formatCurrency(summary.total_spent)}
              hint={`${expenseCount} expense${expenseCount === 1 ? "" : "s"}`}
            />
            <StatCard
              label="Top category"
              value={topCategory ? topCategory.category : "-"}
              hint={topCategory ? `${formatCurrency(topCategory.total)} (${topCategory.percentage}%)` : "No expenses yet"}
            />
            <StatCard
              label="Overall budget"
              value={
                overall
                  ? overall.remaining >= 0
                    ? `${formatCurrency(overall.remaining)} left`
                    : `${formatCurrency(Math.abs(overall.remaining))} over`
                  : "Not set"
              }
              valueColor={overallColor}
              hint={
                overall
                  ? `${overall.percent_used}% of ${formatCurrency(overall.budget)} used`
                  : "Set a monthly budget below"
              }
            />
          </Box>

          {/* Charts */}
          <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Section title="Spending by category">
              <CategoryChart categories={summary.categories} />
            </Section>
            <Section title={`Last ${TREND_MONTHS} months`}>
              <TrendChart months={data.trend.months} selectedMonth={month} />
            </Section>
          </Box>

          {/* Budgets */}
          <Section
            title="Budgets"
            action={
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!canAddBudget}
                onClick={() => setBudgetDialog({ open: true, budget: null })}
              >
                Set budget
              </Button>
            }
          >
            <BudgetList
              items={data.status.items}
              canAdd={canAddBudget}
              onAdd={() => setBudgetDialog({ open: true, budget: null })}
              onEdit={(item) => setBudgetDialog({ open: true, budget: item })}
              onDelete={setToDelete}
            />
          </Section>
        </Box>
      )}

      {budgetDialog.open && (
        <BudgetFormDialog
          month={month}
          budget={budgetDialog.budget}
          takenKeys={takenKeys}
          onClose={() => setBudgetDialog({ open: false, budget: null })}
          onSaved={handleBudgetSaved}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this budget?"
        message={
          toDelete ? `The ${toDelete.category ?? "overall"} budget for ${formatMonth(month)} will be removed.` : ""
        }
        loading={deleting}
        onConfirm={handleDeleteBudget}
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