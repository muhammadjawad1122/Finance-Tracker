import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../utils/money";

import { fetchCategories } from "../services/categories";
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transactions";

function toInputDateValue(d) {
  const date = d ? new Date(d) : new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function csvEscape(val) {
  const s = String(val ?? "");
  return `"${s.replaceAll('"', '""')}"`;
}

export default function Transactions() {
  const { user } = useAuth();
  const currency = user?.currency || "PKR";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    type: "",
    categoryId: "",
    page: 1,
    limit: 10,
  });

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const [createForm, setCreateForm] = useState({
    amount: "",
    categoryId: "",
    date: "",
    note: "",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    categoryId: "",
    date: "",
    note: "",
  });

  const categoryOptions = useMemo(() => {
    return categories
      .slice()
      .sort((a, b) => (a.type + a.name).localeCompare(b.type + b.name));
  }, [categories]);

  const loadTransactions = async (custom = filters) => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetchTransactions({
        ...custom,
        from: custom.from || undefined,
        to: custom.to || undefined,
        type: custom.type || undefined,
        categoryId: custom.categoryId || undefined,
      });

      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
      setFilters((s) => ({
        ...s,
        page: res.data.pagination.page,
        limit: res.data.pagination.limit,
      }));
    } catch (e) {
      setErr(
        e?.response?.data?.message || e.message || "Failed to load transactions"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadInitial = async () => {
    setErr("");
    setLoading(true);
    try {
      const catRes = await fetchCategories();
      setCategories(catRes.data.categories);
      await loadTransactions({ ...filters, page: 1 });
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApplyFilters = async (e) => {
    e.preventDefault();
    await loadTransactions({ ...filters, page: 1 });
  };

  const onResetFilters = async () => {
    const reset = {
      from: "",
      to: "",
      type: "",
      categoryId: "",
      page: 1,
      limit: 10,
    };
    setFilters(reset);
    await loadTransactions(reset);
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (!createForm.amount) throw new Error("Amount is required");
      if (!createForm.categoryId) throw new Error("Category is required");

      await createTransaction({
        amount: Number(createForm.amount),
        categoryId: createForm.categoryId,
        date: createForm.date
          ? new Date(createForm.date).toISOString()
          : undefined,
        note: createForm.note || "",
      });

      setCreateForm({ amount: "", categoryId: "", date: "", note: "" });
      await loadTransactions({ ...filters, page: 1 });
    } catch (e2) {
      setErr(
        e2?.response?.data?.message ||
          e2.message ||
          "Failed to create transaction"
      );
    }
  };

  const openEdit = (txn) => {
    setEditId(txn._id);
    setEditForm({
      amount: String(txn.amount ?? ""),
      categoryId: txn.categoryId?._id || "",
      date: toInputDateValue(txn.date),
      note: txn.note || "",
    });
    setEditOpen(true);
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (!editId) return;
      if (!editForm.amount) throw new Error("Amount is required");
      if (!editForm.categoryId) throw new Error("Category is required");

      await updateTransaction(editId, {
        amount: Number(editForm.amount),
        categoryId: editForm.categoryId,
        date: editForm.date
          ? new Date(editForm.date).toISOString()
          : undefined,
        note: editForm.note || "",
      });

      setEditOpen(false);
      setEditId(null);
      await loadTransactions(filters);
    } catch (e2) {
      setErr(
        e2?.response?.data?.message ||
          e2.message ||
          "Failed to update transaction"
      );
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    setErr("");
    try {
      await deleteTransaction(id);

      const newPage =
        transactions.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await loadTransactions({ ...filters, page: newPage });
    } catch (e2) {
      setErr(
        e2?.response?.data?.message ||
          e2.message ||
          "Failed to delete transaction"
      );
    }
  };

  const onExportCsv = async () => {
    setErr("");
    setLoading(true);
    try {
      const limit = 100;
      let page = 1;
      let pages = 1;
      const all = [];

      do {
        const res = await fetchTransactions({
          ...filters,
          page,
          limit,
          from: filters.from || undefined,
          to: filters.to || undefined,
          type: filters.type || undefined,
          categoryId: filters.categoryId || undefined,
        });

        all.push(...res.data.transactions);
        pages = res.data.pagination.pages;
        page += 1;
      } while (page <= pages);

      const header = ["Date", "Type", "Category", "Amount", "Note"];
      const rows = all.map((t) => [
        csvEscape(new Date(t.date).toISOString().slice(0, 10)),
        csvEscape(t.type),
        csvEscape(t.categoryId?.name || "Unknown"),
        csvEscape(String(t.amount)),
        csvEscape(t.note || ""),
      ]);

      const csv = [
        header.map(csvEscape).join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to export CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-app">
      <Navbar />

      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold">Transactions</h2>
          <div className="text-sm muted">
            Filter, export, edit and manage your transactions
          </div>
        </div>

        <button className="btn btn-primary" type="button" onClick={onExportCsv}>
          Export CSV
        </button>
      </div>

      {err ? (
        <div className="card mt-4 border-rose-500/30 bg-rose-500/10">
          <div className="card-body text-rose-200">{err}</div>
        </div>
      ) : null}

      {/* Filters */}
      <div className="card mt-4">
        <div className="card-header">
          <div className="font-bold">Filters</div>
          <div className="text-sm muted">
            Total: {pagination.total} • Page {pagination.page}/{pagination.pages}
          </div>
        </div>

        <div className="card-body">
          <form
            onSubmit={onApplyFilters}
            className="grid grid-cols-1 md:grid-cols-6 gap-3"
          >
            <input
              className="field md:col-span-1"
              type="date"
              value={filters.from}
              onChange={(e) =>
                setFilters((s) => ({ ...s, from: e.target.value }))
              }
            />
            <input
              className="field md:col-span-1"
              type="date"
              value={filters.to}
              onChange={(e) =>
                setFilters((s) => ({ ...s, to: e.target.value }))
              }
            />

            <select
              className="select md:col-span-1"
              value={filters.type}
              onChange={(e) =>
                setFilters((s) => ({ ...s, type: e.target.value }))
              }
            >
              <option value="">All types</option>
              <option value="income">income</option>
              <option value="expense">expense</option>
            </select>

            <select
              className="select md:col-span-2"
              value={filters.categoryId}
              onChange={(e) =>
                setFilters((s) => ({ ...s, categoryId: e.target.value }))
              }
            >
              <option value="">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.type.toUpperCase()} - {c.name}
                </option>
              ))}
            </select>

            <div className="md:col-span-1 flex gap-2">
              <button className="btn btn-primary w-full" type="submit">
                Apply
              </button>
              <button className="btn w-full" type="button" onClick={onResetFilters}>
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Create */}
      <div className="card mt-4">
        <div className="card-header">
          <div className="font-bold">Add Transaction</div>
          <div className="text-sm muted">Quick add</div>
        </div>

        <div className="card-body">
          <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input
              className="field md:col-span-1"
              placeholder="Amount"
              type="number"
              step="0.01"
              value={createForm.amount}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, amount: e.target.value }))
              }
            />

            <select
              className="select md:col-span-2"
              value={createForm.categoryId}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, categoryId: e.target.value }))
              }
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
              value={createForm.date}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, date: e.target.value }))
              }
            />

            <input
              className="field md:col-span-2"
              placeholder="Note (optional)"
              value={createForm.note}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, note: e.target.value }))
              }
            />

            <button className="btn btn-primary md:col-span-6" type="submit">
              Add
            </button>
          </form>
        </div>
      </div>

      {/* List (Table) */}
      <div className="card mt-4">
        <div className="card-header">
          <div className="font-bold">List</div>

          <div className="flex items-center gap-2">
            <button
              className="btn"
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() =>
                loadTransactions({ ...filters, page: pagination.page - 1 })
              }
            >
              Prev
            </button>

            <button
              className="btn"
              type="button"
              disabled={pagination.page >= pagination.pages || loading}
              onClick={() =>
                loadTransactions({ ...filters, page: pagination.page + 1 })
              }
            >
              Next
            </button>

            <select
              className="select w-[140px]"
              value={filters.limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setFilters((s) => ({ ...s, limit: newLimit }));
                loadTransactions({ ...filters, limit: newLimit, page: 1 });
              }}
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        <div className="card-body">
          {loading ? <div className="muted">Loading…</div> : null}

          {!loading && transactions.length === 0 ? (
            <div className="muted">No transactions found.</div>
          ) : null}

          {transactions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-300">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Note</th>
                    <th className="py-2 pr-3 text-right">Amount</th>
                    <th className="py-2 pr-0 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((t) => (
                    <tr key={t._id} className="align-top">
                      <td className="py-3 pr-3 whitespace-nowrap text-slate-200">
                        {new Date(t.date).toLocaleDateString()}
                      </td>

                      <td className="py-3 pr-3">
                        <span
                          className={`pill ${
                            t.type === "income" ? "pill-income" : "pill-expense"
                          }`}
                        >
                          {t.type.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 pr-3 text-slate-100 font-medium">
                        {t.categoryId?.name || "Unknown"}
                      </td>

                      <td className="py-3 pr-3 text-slate-300 max-w-[360px] break-words">
                        {t.note || <span className="muted">—</span>}
                      </td>

                      <td className="py-3 pr-3 text-right font-extrabold text-slate-100 whitespace-nowrap">
                        {formatMoney(t.amount, currency)}
                      </td>

                      <td className="py-3 pr-0">
                        <div className="flex justify-end gap-2">
                          <button className="btn" type="button" onClick={() => openEdit(t)}>
                            Edit
                          </button>
                          <button className="btn btn-danger" type="button" onClick={() => onDelete(t._id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      {/* Edit modal */}
      {editOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"
          onClick={() => setEditOpen(false)}
        >
          <div className="card w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <div className="font-bold">Edit Transaction</div>
              <button className="btn" type="button" onClick={() => setEditOpen(false)}>
                Close
              </button>
            </div>

            <div className="card-body">
              <form onSubmit={onUpdate} className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <input
                  className="field md:col-span-2"
                  placeholder="Amount"
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, amount: e.target.value }))
                  }
                />

                <select
                  className="select md:col-span-2"
                  value={editForm.categoryId}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, categoryId: e.target.value }))
                  }
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.type.toUpperCase()} - {c.name}
                    </option>
                  ))}
                </select>

                <input
                  className="field md:col-span-2"
                  type="date"
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, date: e.target.value }))
                  }
                />

                <input
                  className="field md:col-span-6"
                  placeholder="Note (optional)"
                  value={editForm.note}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, note: e.target.value }))
                  }
                />

                <div className="md:col-span-6 flex justify-end gap-2">
                  <button className="btn" type="button" onClick={() => setEditOpen(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" type="submit">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}