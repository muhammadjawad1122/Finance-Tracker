import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { fetchCategories, createCategory, deleteCategory } from "../services/categories";
import { fetchTransactions, createTransaction, deleteTransaction as removeTxn } from "../services/transactions";
import { fetchSummary, fetchByCategory, fetchMonthly } from "../services/stats";
import { updateMe } from "../services/user";
import { formatMoney } from "../utils/money";

// === AI ASSISTANT START ===
// Import axios for AI backend call
import axios from "axios";

const monthLabel = (m) =>
  ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1];

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toYmd(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function getThisMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toYmd(start), to: toYmd(end) };
}
function getLastMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { from: toYmd(start), to: toYmd(end) };
}

export default function Dashboard() {
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // === AI ASSISTANT START ===
  // AI Assistant state
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // AI Assistant handler
  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const res = await axios.post(
        "https://finance-tracker-production-a359.up.railway.app/api/ai/ask",
        { question: aiQuestion },
        { withCredentials: true }
      );
      setAiResponse(res.data.answer || "No answer received");
    } catch (e2) {
      setAiResponse("AI error: " + (e2.response?.data?.error || e2.message));
    } finally {
      setAiLoading(false);
    }
  };
  // === AI ASSISTANT END ===

  const [currencyUpdating, setCurrencyUpdating] = useState(false);

  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [summary, setSummary] = useState({ incomeTotal: 0, expenseTotal: 0, balance: 0 });
  const [expenseByCategory, setExpenseByCategory] = useState([]);
  const [monthly, setMonthly] = useState([]);

  const [catForm, setCatForm] = useState({ name: "", type: "expense", color: "#607D8B" });
  const [txnForm, setTxnForm] = useState({ amount: "", categoryId: "", date: "", note: "" });

  const [rangePreset, setRangePreset] = useState("thisMonth"); // all | thisMonth | lastMonth | custom
  const [range, setRange] = useState(() => getThisMonthRange());

  const currency = user?.currency || "PKR";
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const compactNumber = (n) => {
    try {
      return new Intl.NumberFormat(undefined, {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(Number(n || 0));
    } catch {
      return String(n ?? 0);
    }
  };

  const effectiveRangeParams = useMemo(() => {
    if (rangePreset === "all") return {};
    return { from: range.from || undefined, to: range.to || undefined };
  }, [rangePreset, range.from, range.to]);

  const expenseCategories = useMemo(() => categories.filter((c) => c.type === "expense"), [categories]);
  const incomeCategories = useMemo(() => categories.filter((c) => c.type === "income"), [categories]);

  const categoryOptions = useMemo(() => {
    return categories.slice().sort((a, b) => (a.type + a.name).localeCompare(b.type + b.name));
  }, [categories]);

  const monthlyChartData = useMemo(() => {
    return (monthly || []).map((m) => ({
      name: monthLabel(m.month),
      income: m.income,
      expense: m.expense,
    }));
  }, [monthly]);

  const refreshAll = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const [catRes, txnRes, sumRes, byCatRes, monthlyRes] = await Promise.all([
        fetchCategories(),
        fetchTransactions({ page: 1, limit: 10, ...effectiveRangeParams }),
        fetchSummary(effectiveRangeParams),
        fetchByCategory({ type: "expense", ...effectiveRangeParams }),
        fetchMonthly({ year: currentYear }),
      ]);

      setCategories(catRes.data.categories);
      setTransactions(txnRes.data.transactions);
      setSummary(sumRes.data);
      setExpenseByCategory(byCatRes.data.data);
      setMonthly(monthlyRes.data.months);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [effectiveRangeParams, currentYear]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const applyPreset = (preset) => {
    setRangePreset(preset);
    if (preset === "thisMonth") setRange(getThisMonthRange());
    if (preset === "lastMonth") setRange(getLastMonthRange());
    if (preset === "all") setRange({ from: "", to: "" });
  };

  const applyCustomRange = (e) => {
    e.preventDefault();
    setRangePreset("custom");
  };

  const onChangeCurrency = async (newCurrency) => {
    setErr("");
    setCurrencyUpdating(true);
    try {
      const res = await updateMe({ currency: newCurrency }); // { user }
      setUser(res.user);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to update currency");
    } finally {
      setCurrencyUpdating(false);
    }
  };

  const onCreateTransaction = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (!txnForm.categoryId) throw new Error("Select a category");
      await createTransaction({
        ...txnForm,
        amount: Number(txnForm.amount),
        date: txnForm.date || undefined,
      });
      setTxnForm({ amount: "", categoryId: "", date: "", note: "" });
      await refreshAll();
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message);
    }
  };

  const onDeleteTransaction = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    setErr("");
    try {
      await removeTxn(id);
      await refreshAll();
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message);
    }
  };

  const onCreateCategory = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await createCategory(catForm);
      setCatForm({ name: "", type: "expense", color: "#607D8B" });
      await refreshAll();
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message);
    }
  };

  const onDeleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return;
    setErr("");
    try {
      await deleteCategory(id);
      await refreshAll();
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message);
    }
  };

  return (
    <div className="container-app">
      <Navbar />

      {err ? (
        <div className="card mt-4 border-rose-500/30 bg-rose-500/10">
          <div className="card-body text-rose-200">{err}</div>
        </div>
      ) : null}

      {/* Controls */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-1">
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm muted">Currency</div>
                <div className="font-semibold">{currency}</div>
              </div>
              <select
                className="select max-w-[180px]"
                value={currency}
                disabled={currencyUpdating}
                onChange={(e) => onChangeCurrency(e.target.value)}
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
                <option value="TRY">TRY</option>
                <option value="CNY">CNY</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-sm muted">Date range</div>
              <div className="flex flex-wrap gap-2">
                <button className="btn" type="button" onClick={() => applyPreset("all")} disabled={loading}>
                  All time
                </button>
                <button className="btn" type="button" onClick={() => applyPreset("thisMonth")} disabled={loading}>
                  This month
                </button>
                <button className="btn" type="button" onClick={() => applyPreset("lastMonth")} disabled={loading}>
                  Last month
                </button>
              </div>

              <form onSubmit={applyCustomRange} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  className="field"
                  type="date"
                  value={range.from}
                  onChange={(e) => setRange((s) => ({ ...s, from: e.target.value }))}
                />
                <input
                  className="field"
                  type="date"
                  value={range.to}
                  onChange={(e) => setRange((s) => ({ ...s, to: e.target.value }))}
                />
                <button className="btn btn-primary sm:col-span-2" type="submit" disabled={loading}>
                  Apply Custom
                </button>
              </form>

              <div className="text-xs muted">
                Active:{" "}
                {rangePreset === "all" ? "All time" : `${range.from || "?"} → ${range.to || "?"}`}{" "}
                ({rangePreset})
              </div>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="card-body">
              <div className="text-sm muted">Income</div>
              <div className="mt-1 text-2xl font-extrabold">{formatMoney(summary.incomeTotal, currency)}</div>
              <div className="mt-2 pill pill-income">IN</div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="text-sm muted">Expense</div>
              <div className="mt-1 text-2xl font-extrabold">{formatMoney(summary.expenseTotal, currency)}</div>
              <div className="mt-2 pill pill-expense">OUT</div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="text-sm muted">Balance</div>
              <div className="mt-1 text-2xl font-extrabold">{formatMoney(summary.balance, currency)}</div>
              <div className="mt-2 pill">NET</div>
            </div>
          </div>
        </div>
      </div>

      {/* === AI ASSISTANT START === */}
      {/* Finance AI Assistant - Ask questions about your transactions */}
      <div className="card mt-4">
        <div className="card-header">
          <div className="font-bold">💬 Finance AI Assistant</div>
          <div className="text-sm muted">Ask questions like: "How much did I spend?" or "What is my balance?"</div>
        </div>
        <div className="card-body">
          <div className="flex gap-3">
            <input
              className="field flex-1"
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="Ask something about your finances..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAskAI();
              }}
            />
            <button className="btn btn-primary" onClick={handleAskAI} disabled={aiLoading}>
              {aiLoading ? "Asking..." : "Ask AI"}
            </button>
          </div>

          {aiResponse && (
            <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-950/30 px-4 py-4">
              <div className="font-semibold text-sm mb-2">AI Answer:</div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{aiResponse}</div>
            </div>
          )}
        </div>
      </div>
      {/* === AI ASSISTANT END === */}

      {/* Add transaction */}
      <div className="card mt-4">
        <div className="card-header">
          <div className="font-bold">Add Transaction</div>
          <div className="text-sm muted">Quick add income/expense</div>
        </div>
        <div className="card-body">
          <form onSubmit={onCreateTransaction} className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input
              className="field md:col-span-1"
              placeholder="Amount"
              type="number"
              step="0.01"
              value={txnForm.amount}
              onChange={(e) => setTxnForm((s) => ({ ...s, amount: e.target.value }))}
            />

            <select
              className="select md:col-span-2"
              value={txnForm.categoryId}
              onChange={(e) => setTxnForm((s) => ({ ...s, categoryId: e.target.value }))}
            >
              <option value="">Select category</option>
              {categoryOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.type.toUpperCase()} - {c.name}
                </option>
              ))}
            </select>

            <input
              className="field md:col-span-1"
              type="date"
              value={txnForm.date}
              onChange={(e) => setTxnForm((s) => ({ ...s, date: e.target.value }))}
            />

            <input
              className="field md:col-span-2"
              placeholder="Note (optional)"
              value={txnForm.note}
              onChange={(e) => setTxnForm((s) => ({ ...s, note: e.target.value }))}
            />

            <button className="btn btn-primary md:col-span-6" type="submit">
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">
            <div className="font-bold">Expense by Category</div>
            <div className="text-sm muted">for selected range</div>
          </div>
          <div className="card-body">
            <div className="h-[300px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="total" nameKey="name" outerRadius={95} label>
                    {expenseByCategory.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color || "#607D8B"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, { payload }) => [
                      formatMoney(value, currency),
                      payload?.name || "Amount",
                    ]}
                    contentStyle={{
                      background: "rgba(2, 6, 23, 0.92)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="font-bold">Monthly (Income vs Expense)</div>
            <div className="text-sm muted">{currentYear}</div>
          </div>
          <div className="card-body">
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={monthlyChartData}>
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={compactNumber} />
                  <Tooltip
                    formatter={(value, name) => [formatMoney(value, currency), name]}
                    contentStyle={{
                      background: "rgba(2, 6, 23, 0.92)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#22c55e" />
                  <Bar dataKey="expense" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card mt-4">
        <div className="card-header">
          <div className="font-bold">Recent Transactions</div>
          <div className="text-sm muted">latest 10 (range)</div>
        </div>

        <div className="card-body">
          {transactions.length === 0 ? (
            <div className="muted">No transactions yet.</div>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div
                  key={t._id}
                  className="rounded-xl border border-slate-800/60 bg-slate-950/30 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`pill ${t.type === "income" ? "pill-income" : "pill-expense"}`}>
                      {t.type.toUpperCase()}
                    </span>
                    <div>
                      <div className="font-semibold">{t.categoryId?.name || "Unknown"}</div>
                      <div className="text-xs muted">
                        {new Date(t.date).toLocaleDateString()} {t.note ? `• ${t.note}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3">
                    <div className="text-lg font-extrabold">{formatMoney(t.amount, currency)}</div>
                    <button className="btn btn-danger" onClick={() => onDeleteTransaction(t._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="card mt-4">
        <div className="card-header">
          <div className="font-bold">Categories</div>
          <div className="text-sm muted">manage your categories</div>
        </div>

        <div className="card-body space-y-4">
          <form onSubmit={onCreateCategory} className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input
              className="field md:col-span-3"
              placeholder="Category name"
              value={catForm.name}
              onChange={(e) => setCatForm((s) => ({ ...s, name: e.target.value }))}
            />

            <select
              className="select md:col-span-1"
              value={catForm.type}
              onChange={(e) => setCatForm((s) => ({ ...s, type: e.target.value }))}
            >
              <option value="expense">expense</option>
              <option value="income">income</option>
            </select>

            <input
              className="field md:col-span-1 h-[42px]"
              type="color"
              value={catForm.color}
              onChange={(e) => setCatForm((s) => ({ ...s, color: e.target.value }))}
            />

            <button className="btn btn-primary md:col-span-1" type="submit">
              Add
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expense */}
            <div className="space-y-2">
              <div className="font-semibold">Expense</div>
              {expenseCategories.map((c) => (
                <div
                  key={c._id}
                  className="rounded-xl border border-slate-800/60 bg-slate-950/30 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded" style={{ background: c.color }} />
                    <div className="font-medium">
                      {c.name}{" "}
                      {c.isDefault ? <span className="text-xs muted">(default)</span> : null}
                    </div>
                  </div>

                  <button
                    className={`btn ${c.isDefault ? "" : "btn-danger"}`}
                    type="button"
                    disabled={c.isDefault}
                    onClick={() => (c.isDefault ? null : onDeleteCategory(c._id))}
                    title={c.isDefault ? "Default category cannot be deleted" : "Delete category"}
                  >
                    {c.isDefault ? "Locked" : "Delete"}
                  </button>
                </div>
              ))}
            </div>

            {/* Income */}
            <div className="space-y-2">
              <div className="font-semibold">Income</div>
              {incomeCategories.map((c) => (
                <div
                  key={c._id}
                  className="rounded-xl border border-slate-800/60 bg-slate-950/30 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded" style={{ background: c.color }} />
                    <div className="font-medium">
                      {c.name}{" "}
                      {c.isDefault ? <span className="text-xs muted">(default)</span> : null}
                    </div>
                  </div>

                  <button
                    className={`btn ${c.isDefault ? "" : "btn-danger"}`}
                    type="button"
                    disabled={c.isDefault}
                    onClick={() => (c.isDefault ? null : onDeleteCategory(c._id))}
                    title={c.isDefault ? "Default category cannot be deleted" : "Delete category"}
                  >
                    {c.isDefault ? "Locked" : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {loading ? <div className="muted">Loading…</div> : null}
        </div>
      </div>
    </div>
  );
}