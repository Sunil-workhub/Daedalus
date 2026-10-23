import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Plus,
  RefreshCw,
  Loader2,
  Search,
  X,
  ClipboardList,
  CheckCircle2,
  MapPin,
  LockKeyhole,
} from "lucide-react";
import Swal from "sweetalert2";
import CustomerService from "../../services/orderIntake/OrderIntakeService";

const cls =
  "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-white";
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const money = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const toast = (title, icon = "success") =>
  Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    timer: 2800,
    timerProgressBar: true,
    showConfirmButton: false,
  });

const user = () => {
  try {
    const u = JSON.parse(sessionStorage.getItem("user") || "{}");
    return String(u.emp_no || u.emp_id || "");
  } catch {
    return "";
  }
};
// Supports a direct array, APIResponseModel, and an Axios response wrapper.
const unwrapData = (response) => {
  let value = response;
  for (let i = 0; i < 3; i++) {
    if (Array.isArray(value) || value == null || typeof value !== "object")
      break;
    if (value.status_Code !== undefined && Number(value.status_Code) !== 200) {
      throw new Error(value.message || "API request failed");
    }
    if (!("data" in value)) break;
    value = value.data;
  }
  return value;
};
const asList = (response) => {
  const data = unwrapData(response);
  return Array.isArray(data) ? data : [];
};
const groupBy = (response, key) => {
  const rows = asList(response);
  const groups = new Map();
  rows.forEach((r) => {
    const id = r?.[key];
    if (id == null) return;
    if (!groups.has(id)) groups.set(id, { ...r, lines: [] });
    groups.get(id).lines.push(r);
  });
  return Array.from(groups.values());
};
const grouped = (rows) => groupBy(rows, "orderId");
const invoiceGroups = (rows) => groupBy(rows, "invoiceId");
export default function SalesInvoicePage({ mainHeaderHeight = 64 }) {
  const [orders, setOrders] = useState([]),
    [invoices, setInvoices] = useState([]),
    [form, setForm] = useState(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const [o, i] = await Promise.all([
        CustomerService.getOrders("", true),
        CustomerService.getInvoices(),
      ]);
      setOrders(
        grouped(o).filter((order) =>
          order.lines.some((line) => Number(line.pendingQty) > 0),
        ),
      );
      setInvoices(invoiceGroups(i));
    } catch (e) {
      toast(e.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const selectOrder = (id) => {
    const order = orders.find((o) => o.orderId === Number(id));
    setForm((f) => ({
      ...f,
      orderId: id,
      lines: order
        ? order.lines
            .filter((l) => Number(l.pendingQty) > 0)
            .map((l) => ({
              orderLineId: l.orderLineId,
              itemCode: l.itemCode,
              pendingQty: Number(l.pendingQty),
              rate: Number(l.rate),
              qty: 0,
            }))
        : [],
    }));
  };
  const save = async (e) => {
    e.preventDefault();
    const lines = form.lines
      .filter((l) => Number(l.qty) > 0)
      .map((l) => ({ orderLineId: l.orderLineId, qty: Number(l.qty) }));
    if (!lines.length)
      return toast(
        "Enter an invoice quantity for at least one item.",
        "warning",
      );
    if (
      form.lines.some(
        (l) =>
          !Number.isInteger(Number(l.qty)) ||
          Number(l.qty) < 0 ||
          Number(l.qty) > Number(l.pendingQty),
      )
    )
      return toast(
        "Invoice quantity must be a whole number within pending quantity.",
        "warning",
      );
    setBusy(true);
    try {
      const response = await CustomerService.createInvoice({
        orderId: Number(form.orderId),
        remarks: form.remarks,
        createdBy: user(),
        lines,
      });
      const r = unwrapData(response);
      setForm(null);
      await load();
      toast(`Invoice created: ${r?.number || r?.invoiceNo || "Saved"}`);
    } catch (e) {
      toast(e.message || "Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  };
  const selected = orders.find((o) => o.orderId === Number(form?.orderId));
  const total = useMemo(
    () =>
      (form?.lines || []).reduce(
        (s, l) => s + Number(l.qty || 0) * Number(l.rate || 0),
        0,
      ) || 0,
    [form],
  );
  const visible = invoices.filter((i) =>
    [i.invoiceNo, i.orderNo, i.customerOrderRef, i.partyName].some((v) =>
      String(v || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
  );
  const invoiceSummary = useMemo(
    () => ({
      count: invoices.length,
      amount: invoices.reduce(
        (s, i) =>
          s +
          i.lines.reduce(
            (a, l) =>
              a + Number(l.amount || Number(l.qty || 0) * Number(l.rate || 0)),
            0,
          ),
        0,
      ),
      units: invoices.reduce(
        (s, i) => s + i.lines.reduce((a, l) => a + Number(l.qty || 0), 0),
        0,
      ),
      available: orders.reduce(
        (s, o) =>
          s + o.lines.reduce((a, l) => a + Number(l.pendingQty || 0), 0),
        0,
      ),
    }),
    [invoices, orders],
  );
  const inputStyle =
    "w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const labelStyle = "mb-1.5 block text-[11px] font-semibold text-slate-600";
  return (
    <div
      className="bg-[#f6f8fb] px-4 pb-10 text-xs text-slate-800 sm:px-6"
      style={{ paddingTop: 18 }}
    >
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <FileText size={17} />
              </span>
              <div>
                <div className="text-[11px] font-medium text-slate-500">
                  Total invoices
                </div>
                <div className="text-lg font-bold tabular-nums text-slate-900">
                  {invoiceSummary.count}
                </div>
              </div>
            </div>
            <div className="border-l border-slate-200 pl-5">
              <div className="text-[11px] font-medium text-slate-500">
                Total invoiced value
              </div>
              <div className="text-lg font-bold tabular-nums text-slate-900">
                ₹{money(invoiceSummary.amount)}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
              Refresh
            </button>
            <button
              onClick={() => setForm({ orderId: "", remarks: "", lines: [] })}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={15} /> New Invoice
            </button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-[13px] font-bold text-slate-900">
                Invoice Register
              </h2>
              <p className="text-[11px] text-slate-500">
                All generated invoices and their order references
              </p>
            </div>
            <div className="relative w-full sm:w-[340px]">
              <Search
                size={14}
                className="absolute left-3 top-2.5 text-slate-400"
              />
              <input
                className={`${inputStyle} pl-9`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice, order, party, reference..."
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  {[
                    "Invoice / Date",
                    "Order number",
                    "Customer reference",
                    "Party name",
                    "Items / Qty",
                    "Total amount",
                    "Remarks",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-slate-500"
                    >
                      <Loader2
                        size={20}
                        className="mx-auto mb-2 animate-spin text-blue-600"
                      />
                      Loading invoices...
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-slate-500"
                    >
                      <FileText
                        size={28}
                        className="mx-auto mb-2 text-slate-300"
                      />
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  visible.map((i) => (
                    <tr key={i.invoiceId} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-blue-700">
                          {i.invoiceNo}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {String(i.invoiceDate || "").slice(0, 10)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{i.orderNo}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{i.customerOrderRef || "—"}</div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          Ref date:{" "}
                          {i.customerOrderRefDate
                            ? String(i.customerOrderRefDate).slice(0, 10)
                            : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <div>{i.partyName}</div>
                        <div className="mt-1 max-w-[300px] whitespace-normal text-[11px] font-normal leading-5 text-slate-500">
                          <span className="font-semibold text-slate-600">
                            Ship to:{" "}
                          </span>
                          {i.shippingAddress || "Not recorded"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex max-w-[280px] flex-wrap gap-1">
                          {i.lines.map((l, j) => (
                            <span
                              key={j}
                              className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-700"
                            >
                              {l.itemCode} <b>× {fmt(l.qty)}</b>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums text-slate-900">
                        ₹
                        {money(
                          i.lines.reduce(
                            (s, l) =>
                              s +
                              Number(
                                l.amount ||
                                  Number(l.qty || 0) * Number(l.rate || 0),
                              ),
                            0,
                          ),
                        )}
                      </td>
                      <td
                        className="max-w-[180px] truncate px-4 py-3 text-slate-500"
                        title={i.remarks || ""}
                      >
                        {i.remarks || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {form && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !busy) setForm(null);
          }}
        >
          <div className="flex max-h-[94vh] w-full max-w-[960px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Create Sales Invoice
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Invoice date and number will be generated on save
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-5 overflow-y-auto px-5 py-5">
                <div>
                  <label className={labelStyle}>
                    Select order number / customer order reference{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    className={inputStyle}
                    value={form.orderId}
                    onChange={(e) => selectOrder(e.target.value)}
                  >
                    <option value="">
                      Select an order with available quantity
                    </option>
                    {orders.map((o) => (
                      <option key={o.orderId} value={o.orderId}>
                        {o.orderNo} · {o.customerOrderRef || "No reference"} ·{" "}
                        {o.partyName}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Only orders with pending quantity appear here.
                  </p>
                </div>
                {selected ? (
                  <>
                    <div className="grid gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-3">
                      {[
                        { label: "Party name", value: selected.partyName },
                        { label: "Order number", value: selected.orderNo },
                        {
                          label: "Customer order ref",
                          value: selected.customerOrderRef || "—",
                        },
                        {
                          label: "Customer order ref date",
                          value: selected.customerOrderRefDate
                            ? String(selected.customerOrderRefDate).slice(0, 10)
                            : "—",
                        },
                      ].map((x) => (
                        <div key={x.label}>
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            {x.label}
                          </div>
                          <div className="mt-1 text-xs font-bold text-slate-800">
                            {x.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-1 flex items-center gap-2 font-bold text-slate-700">
                        <MapPin size={14} className="text-blue-600" /> Shipping
                        address{" "}
                        <LockKeyhole size={12} className="text-slate-400" />
                        <span className="font-normal text-[11px] text-slate-500">
                          From order · read-only
                        </span>
                      </div>
                      <p className="text-xs leading-5 text-slate-700">
                        {selected.shippingAddress ||
                          "No shipping address recorded for this order."}
                      </p>
                    </div>
                    <div>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-slate-800">
                            Invoice items
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Enter the quantity to invoice now. Remaining
                            quantities can be invoiced later.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              lines: f.lines.map((l) => ({
                                ...l,
                                qty: l.pendingQty,
                              })),
                            }))
                          }
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          Fill all pending
                        </button>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[600px] text-left">
                          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                            <tr>
                              {[
                                "Item code",
                                "Pending qty",
                                "Invoice qty",
                                "Rate (₹)",
                                "Amount (₹)",
                              ].map((h) => (
                                <th
                                  key={h}
                                  className="px-3 py-2.5 font-semibold"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {form.lines.map((l, i) => (
                              <tr key={l.orderLineId}>
                                <td className="px-3 py-3 font-semibold text-slate-800">
                                  {l.itemCode}
                                </td>
                                <td className="px-3 py-3">
                                  <span className="rounded-md bg-amber-50 px-2 py-1 font-bold tabular-nums text-amber-700">
                                    {fmt(l.pendingQty)}
                                  </span>
                                </td>
                                <td className="w-36 px-3 py-3">
                                  <input
                                    type="number"
                                    min="0"
                                    max={l.pendingQty}
                                    step="1"
                                    className={inputStyle}
                                    value={l.qty}
                                    onChange={(e) =>
                                      setForm((f) => ({
                                        ...f,
                                        lines: f.lines.map((x, j) =>
                                          j === i
                                            ? { ...x, qty: e.target.value }
                                            : x,
                                        ),
                                      }))
                                    }
                                  />
                                </td>
                                <td className="px-3 py-3 tabular-nums">
                                  {money(l.rate)}
                                </td>
                                <td className="px-3 py-3 font-bold tabular-nums">
                                  {money(
                                    Number(l.qty || 0) * Number(l.rate || 0),
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <div className="rounded-lg bg-slate-50 px-4 py-2">
                          <span className="mr-5 text-[11px] text-slate-500">
                            Invoice total
                          </span>
                          <span className="text-base font-bold tabular-nums text-slate-900">
                            ₹{money(total)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={labelStyle}>Invoice remarks</label>
                      <textarea
                        rows={2}
                        className={`${inputStyle} h-auto py-2.5`}
                        placeholder="Optional invoice-specific remarks"
                        value={form.remarks}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, remarks: e.target.value }))
                        }
                      />
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-500">
                    <ClipboardList
                      size={28}
                      className="mx-auto mb-2 text-slate-300"
                    />
                    <p className="font-semibold">Select an order to continue</p>
                    <p className="mt-1 text-[11px]">
                      Its customer and invoiceable items will appear here.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setForm(null)}
                  className="h-9 rounded-lg border border-slate-200 px-4 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Discard
                </button>
                <button
                  disabled={busy || !selected}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-5 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}{" "}
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
