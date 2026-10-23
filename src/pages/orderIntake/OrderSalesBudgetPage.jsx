import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Save,
  RefreshCw,
  X,
  Search,
  Loader2,
  Check,
  Trash2,
} from "lucide-react";
import Swal from "sweetalert2";
import CustomerService from "../../services/orderIntake/OrderIntakeService";

const MONTHS = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
];
const input =
  "w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const btn =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition disabled:opacity-50";
const list = (value) => {
  let v = value;
  for (
    let i = 0;
    i < 3 && v && !Array.isArray(v) && typeof v === "object" && "data" in v;
    i++
  )
    v = v.data;
  return Array.isArray(v) ? v : [];
};
const money = (v) =>
  Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 });
const fyNow = () => {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String(y + 1).slice(-2)}`;
};
const actor = () => {
  try {
    const u = JSON.parse(sessionStorage.getItem("user") || "{}");
    return String(u.emp_no || u.emp_id || "");
  } catch {
    return "";
  }
};
const rowKey = (r) => `${r.budgetCombinationId}-${r.financialMonth}`;

export default function DaedalusBudgetMasterPage({ mainHeaderHeight = 64 }) {
  const [fy, setFy] = useState(fyNow);
  const [rows, setRows] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [master, setMaster] = useState([]);
  const [draft, setDraft] = useState({});
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState(0);
  const [modal, setModal] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const notify = (title, icon = "success") =>
    Swal.fire({
      toast: true,
      position: "top-end",
      timer: 2700,
      showConfirmButton: false,
      icon,
      title,
    });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, c, m] = await Promise.all([
        CustomerService.getGrid(fy),
        CustomerService.getCombinations(fy),
        CustomerService.getItemCombinations(),
      ]);
      setRows(list(g));
      setCombinations(list(c));
      setMaster(list(m));
      setDraft({});
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [fy]);
  useEffect(() => {
    load();
  }, [load]);

  const valueOf = (r, field) => draft[rowKey(r)]?.[field] ?? r[field] ?? 0;
  const edit = (r, field, value) =>
    setDraft((prev) => ({
      ...prev,
      [rowKey(r)]: { ...prev[rowKey(r)], [field]: value },
    }));
  const changedCount = Object.keys(draft).length;
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!productFilter || r.product === productFilter) &&
          (!monthFilter || r.financialMonth === monthFilter) &&
          `${r.product} ${r.model}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [rows, search, productFilter, monthFilter],
  );
  const totals = useMemo(
    () =>
      rows.reduce(
        (a, r) => {
          a.order += Number(
            draft[rowKey(r)]?.orderIntakeBudget ?? r.orderIntakeBudget ?? 0,
          );
          a.sales += Number(
            draft[rowKey(r)]?.salesBudget ?? r.salesBudget ?? 0,
          );
          return a;
        },
        { order: 0, sales: 0 },
      ),
    [rows, draft],
  );
  const availableModels = useMemo(() => {
    const unique = new Map();
    master.forEach((item) => {
      const product = String(item.product ?? item.Product ?? "").trim();
      const model = String(item.model ?? item.Model ?? "").trim();
      if (product && model)
        unique.set(`${product.toLowerCase()}|${model.toLowerCase()}`, {
          product,
          model,
        });
    });
    return [...unique.values()].sort((a, b) =>
      `${a.product} ${a.model}`.localeCompare(`${b.product} ${b.model}`),
    );
  }, [master]);
  const isSelected = (item) =>
    combinations.some(
      (c) =>
        c.isActive &&
        c.product?.toLowerCase() === item.product.toLowerCase() &&
        c.model?.toLowerCase() === item.model.toLowerCase(),
    );
  const visibleModels = availableModels.filter((item) =>
    `${item.product} ${item.model}`
      .toLowerCase()
      .includes(modelSearch.toLowerCase()),
  );
  const save = async () => {
    const changes = rows
      .filter((r) => draft[rowKey(r)])
      .map((r) => ({
        budgetCombinationId: r.budgetCombinationId,
        financialMonth: r.financialMonth,
        orderIntakeBudget: Number(valueOf(r, "orderIntakeBudget")),
        salesBudget: Number(valueOf(r, "salesBudget")),
      }));
    if (!changes.length) return notify("No changes to save", "info");
    if (
      changes.some(
        (r) =>
          !Number.isFinite(r.orderIntakeBudget) ||
          !Number.isFinite(r.salesBudget) ||
          r.orderIntakeBudget < 0 ||
          r.salesBudget < 0,
      )
    )
      return notify("Budgets must be non-negative numbers", "warning");
    setSaving(true);
    try {
      await CustomerService.saveGrid({
        financialYear: fy,
        updatedBy: actor(),
        rows: changes,
      });
      await load();
      notify("Monthly budgets saved");
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const add = async (item) => {
    if (changedCount) {
      notify("Save your budget changes before selecting models", "warning");
      return;
    }
    setAdding(true);
    try {
      await CustomerService.addCombination({
        financialYear: fy,
        product: item.product,
        model: item.model,
        createdBy: actor(),
      });
      await load();
      notify("Existing Item Master model selected for this year");
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setAdding(false);
    }
  };
  const deactivate = async (c) => {
    if (changedCount)
      return notify(
        "Save your budget changes before removing models",
        "warning",
      );
    const r = await Swal.fire({
      title: "Remove budget combination?",
      text: `This hides ${c.product} / ${c.model} from ${fy}. Existing budgets are retained.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
    });
    if (!r.isConfirmed) return;
    try {
      await CustomerService.setCombinationActive({
        budgetCombinationId: c.budgetCombinationId,
        isActive: false,
      });
      await load();
      notify("Combination removed");
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const switchFY = (next) => {
    if (
      changedCount &&
      !window.confirm("Unsaved budget changes will be lost. Continue?")
    )
      return;
    setFy(next);
  };
  const startYear = Number(fy.slice(0, 4));
  const years = Array.from({ length: 9 }, (_, i) => {
    const y = startYear - 4 + i;
    return `${y}-${String(y + 1).slice(-2)}`;
  });

  return (
    <div
      className="min-h-full bg-slate-50 px-2 pb-3 text-slate-800 sm:px-3"
      style={{ paddingTop: 8 }}
    >
      <div className="w-full space-y-2">
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <span className="shrink-0 text-xs font-semibold text-slate-600">
            Financial Year
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <select
              className={`${input} w-32 font-semibold`}
              value={fy}
              onChange={(e) => switchFY(e.target.value)}
              aria-label="Financial year"
            >
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={load}
              disabled={loading}
              className={`${btn} border border-slate-300 bg-white`}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => setModal(true)}
              className={`${btn} border border-blue-200 bg-blue-50 text-blue-700`}
            >
              <Plus size={14} /> Select Models
            </button>
            <button
              onClick={save}
              disabled={!changedCount || saving}
              className={`${btn} bg-blue-700 text-white hover:bg-blue-800`}
            >
              {saving ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Save size={14} />
              )}{" "}
              Save Changes {changedCount ? `(${changedCount})` : ""}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[
            [
              "Product / model combinations",
              combinations.filter((x) => x.isActive).length,
            ],
            ["Monthly budget rows", rows.length],
            ["Order intake annual budget", money(totals.order)],
            ["Sales annual budget", money(totals.sales)],
          ].map(([label, val]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
            >
              <p className="text-[11px] font-medium text-slate-500">{label}</p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-slate-900">
                {val}
              </p>
            </div>
          ))}
        </div>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-nowrap items-center gap-3 overflow-x-auto border-b border-slate-200 px-3 py-2">
            <div className="min-w-0 shrink-0">
              <h2 className="text-sm font-bold">Monthly budget allocation</h2>
              <p className="text-[11px] text-slate-500">
                April–March · All values in quantity units · {filtered.length}{" "}
                rows shown
              </p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-2.5 text-slate-400"
                />
                <input
                  className={`${input} w-48 pl-8`}
                  placeholder="Search product or model"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className={`${input} w-40`}
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
              >
                <option value="">All products</option>
                {[...new Set(rows.map((r) => r.product))].sort().map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <select
                className={`${input} w-32`}
                value={monthFilter}
                onChange={(e) => setMonthFilter(Number(e.target.value))}
              >
                <option value={0}>All months</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="max-h-[calc(100dvh-315px)] min-h-[280px] overflow-auto">
            <table className="w-full min-w-[700px] table-fixed border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="w-[15%] border-b px-3 py-2 text-left">
                    Month
                  </th>
                  <th className="w-[24%] border-b px-3 py-2 text-left">
                    Product
                  </th>
                  <th className="w-[21%] border-b px-3 py-2 text-left">
                    Model
                  </th>
                  <th className="w-[20%] border-b px-3 py-2 text-right">
                    Order Intake Budget
                  </th>
                  <th className="w-[20%] border-b px-3 py-2 text-right">
                    Sales Budget
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-slate-500"
                    >
                      Loading budgets...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-slate-500"
                    >
                      No models selected for this year. Use Select Models to
                      choose existing Item Master models.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, idx) => {
                    const first =
                      idx === 0 ||
                      filtered[idx - 1].financialMonth !== r.financialMonth;
                    return (
                      <tr
                        key={rowKey(r)}
                        className={`border-b border-slate-100 hover:bg-blue-50/40 ${first ? "border-t border-t-slate-300" : ""}`}
                      >
                        <td className="px-3 py-1 font-semibold text-slate-700">
                          {first ? r.monthName : ""}
                        </td>
                        <td className="px-3 py-1">{r.product}</td>
                        <td className="px-3 py-1 font-medium">{r.model}</td>
                        {["orderIntakeBudget", "salesBudget"].map((field) => (
                          <td key={field} className="px-3 py-1 text-right">
                            <input
                              aria-label={`${r.monthName} ${r.product} ${r.model} ${field}`}
                              type="number"
                              min="0"
                              step="0.001"
                              className={`${input} ml-auto w-full max-w-[190px] text-right tabular-nums ${draft[rowKey(r)]?.[field] !== undefined ? "border-amber-400 bg-amber-50" : ""}`}
                              value={valueOf(r, field)}
                              onChange={(e) => edit(r, field, e.target.value)}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="sticky bottom-0 bg-slate-100 font-bold">
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right">
                    Annual totals (all combinations)
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {money(totals.order)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {money(totals.sales)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>
      {modal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <div className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-base font-bold">
                  Select models from Item Master
                </h2>
                <p className="text-xs text-slate-500">
                  Financial year {fy} · Choose existing combinations only
                </p>
              </div>
              <button onClick={() => setModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto p-4">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-2.5 text-slate-400"
                />
                <input
                  className={`${input} pl-9`}
                  placeholder="Search Item Master products or models"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{visibleModels.length} Item Master combinations</span>
                <span>
                  {combinations.filter((c) => c.isActive).length} selected for{" "}
                  {fy}
                </span>
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-1">
                {visibleModels.length === 0 && (
                  <p className="p-4 text-center text-xs text-slate-500">
                    No matching active Product / Model combinations in Item
                    Master.
                  </p>
                )}
                {visibleModels.map((item) => {
                  const selected = isSelected(item);
                  return (
                    <div
                      key={`${item.product}|${item.model}`}
                      className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1 text-xs">
                        <span className="font-semibold text-slate-800">
                          {item.product}
                        </span>
                        <span className="mx-2 text-slate-300">/</span>
                        <span className="text-slate-600">{item.model}</span>
                      </div>
                      {selected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <Check size={13} /> Selected
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => add(item)}
                          disabled={adding || changedCount > 0}
                          className={`${btn} h-7 bg-blue-700 px-2 text-white hover:bg-blue-800`}
                        >
                          <Plus size={12} /> Select
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-3">
                <p className="mb-2 text-xs font-bold text-slate-700">
                  Selected for financial year {fy}
                </p>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {combinations.filter((c) => c.isActive).length === 0 && (
                    <p className="py-3 text-center text-xs text-slate-500">
                      No models selected yet.
                    </p>
                  )}
                  {combinations
                    .filter((c) => c.isActive)
                    .map((c) => (
                      <div
                        key={c.budgetCombinationId}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-xs"
                      >
                        <span>
                          <strong>{c.product}</strong> / {c.model}
                        </span>
                        <button
                          type="button"
                          onClick={() => deactivate(c)}
                          disabled={changedCount > 0}
                          className="text-rose-600 disabled:opacity-40"
                          title="Remove from this year's budget"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            <div className="border-t px-5 py-3 text-right">
              <button
                className={`${btn} border border-slate-300`}
                onClick={() => setModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
