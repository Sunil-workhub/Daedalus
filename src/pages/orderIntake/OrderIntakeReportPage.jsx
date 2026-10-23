import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Loader2,
  Package,
  ChevronDown,
  ChevronRight,
  X,
  ClipboardList,
  CircleCheck,
  MapPin,
} from "lucide-react";
import Swal from "sweetalert2";
import CustomerService from "../../services/orderIntake/OrderIntakeService";

const asList = (response) => {
  if (response?.status_Code && Number(response.status_Code) !== 200)
    throw new Error(response.message || "Request failed");
  let data = response;
  for (
    let i = 0;
    i < 3 &&
    data &&
    !Array.isArray(data) &&
    typeof data === "object" &&
    "data" in data;
    i++
  )
    data = data.data;
  return Array.isArray(data) ? data : [];
};
// The address endpoint should return customerAddressId, addressType, address1/2/3, city, zipCode, gstNo.
const addressIdOf = (a) =>
  a.customerAddressId ?? a.addressId ?? a.address_Id ?? a.customer_Address_Id;
const addressText = (a) =>
  [
    a.addressType ?? a.address_Type,
    a.address1 ?? a.add1 ?? a.add_1,
    a.address2 ?? a.add2 ?? a.add_2,
    a.address3 ?? a.add3 ?? a.add_3,
    a.city,
    a.zipCode ?? a.zip_Code ?? a.zip,
  ]
    .filter(Boolean)
    .join(", ");
const getUser = () => {
  try {
    const u = JSON.parse(sessionStorage.getItem("user") || "{}");
    return String(u.emp_no || u.emp_id || "");
  } catch {
    return "";
  }
};
const cls =
  "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white";
const qty = (x) =>
  Number(x || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const groupOrders = (rows) =>
  Object.values(
    asList(rows).reduce((m, r) => {
      const k = r.orderId;
      if (!m[k]) m[k] = { ...r, lines: [] };
      m[k].lines.push(r);
      return m;
    }, {}),
  );
export default function OrderIntakePage() {
  const toast = (title, icon = "success") =>
    Swal.fire({
      toast: true,
      position: "top-end",
      timer: 2700,
      timerProgressBar: true,
      showConfirmButton: false,
      icon,
      title,
    });
  const [orders, setOrders] = useState([]),
    [customers, setCustomers] = useState([]),
    [items, setItems] = useState([]),
    [search, setSearch] = useState("");
  const [form, setForm] = useState(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [expanded, setExpanded] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      setOrders(asList(await CustomerService.getOrders()));
    } catch (e) {
      toast(e.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    Promise.all([
      CustomerService.getCustomers("", false),
      CustomerService.getItemsMaster("", false),
    ])
      .then(([customerResponse, itemResponse]) => {
        setCustomers(asList(customerResponse));
        setItems(asList(itemResponse));
      })
      .catch((e) => toast(e.message || "Unable to load master data", "error"));
  }, []);
  const grouped = useMemo(
    () =>
      groupOrders(orders).filter((o) =>
        [o.orderNo, o.customerOrderRef, o.partyName].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
      ),
    [orders, search],
  );
  const chooseCustomer = async (customerId) => {
    setForm((f) => ({ ...f, customerId, shippingAddressId: "" }));
    setAddresses([]);
    if (!customerId) return;
    setAddressLoading(true);
    try {
      const result = await CustomerService.getCustomerAddresses(
        Number(customerId),
      );
      setAddresses(asList(result)); // all address types are permitted
    } catch (e) {
      toast(e.message || "Unable to load customer addresses", "error");
    } finally {
      setAddressLoading(false);
    }
  };
  const add = () =>
    setForm({
      customerId: "",
      shippingAddressId: "",
      customerOrderRef: "",
      customerOrderRefDate: "",
      remarks: "",
      lines: [{ itemId: "", qty: 1, rate: 0 }],
    });
  const lineChange = (index, key, value) =>
    setForm((f) => ({
      ...f,
      lines: f.lines.map((x, i) => (i === index ? { ...x, [key]: value } : x)),
    }));
  const submit = async (e) => {
    e.preventDefault();
    if (!form.customerId || !form.lines.length) return;
    if (
      !form.shippingAddressId ||
      !addresses.some(
        (a) => Number(addressIdOf(a)) === Number(form.shippingAddressId),
      )
    ) {
      return toast(
        "Select a shipping address belonging to this customer.",
        "warning",
      );
    }
    const lines = form.lines.map((x) => ({
      itemId: Number(x.itemId),
      qty: Number(x.qty),
      rate: Number(x.rate),
    }));
    if (
      lines.some(
        (x) =>
          !x.itemId || !Number.isInteger(x.qty) || x.qty <= 0 || x.rate < 0,
      ) ||
      new Set(lines.map((x) => x.itemId)).size !== lines.length
    )
      return toast(
        "Select distinct items with positive whole-number quantities and non-negative rates.",
        "warning",
      );
    setBusy(true);
    try {
      const r = await CustomerService.createOrder({
        customerId: Number(form.customerId),
        shippingAddressId: Number(form.shippingAddressId),
        customerOrderRef: form.customerOrderRef,
        customerOrderRefDate: form.customerOrderRefDate || null,
        remarks: form.remarks,
        createdBy: getUser(),
        lines,
      });
      setForm(null);
      await load();
      toast(
        `Order created: ${r?.data?.number || r?.data?.orderNo || r?.number || r?.orderNo || "Saved"}`,
      );
    } catch (e) {
      toast(e.message || "Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  };
  const cancel = async (l) => {
    const result = await Swal.fire({
      title: `Cancel pending quantity for ${l.itemCode}`,
      input: "number",
      inputAttributes: {
        min: "1",
        max: String(l.pendingQty),
        step: "1",
      },
      inputValue: String(l.pendingQty),
      showCancelButton: true,
      confirmButtonText: "Cancel quantity",
      preConfirm: (v) => {
        const n = Number(v);
        if (!Number.isInteger(n) || n <= 0 || n > Number(l.pendingQty)) {
          Swal.showValidationMessage(
            `Enter a whole number between 1 and ${l.pendingQty}`,
          );
          return false;
        }
        return n;
      },
    });
    if (!result.isConfirmed) return;
    try {
      await CustomerService.cancelQty({
        orderLineId: l.orderLineId,
        qty: Number(result.value),
        updatedBy: getUser(),
      });
      await load();
      toast("Pending quantity cancelled");
    } catch (e) {
      toast(e.message || "Something went wrong", "error");
    }
  };
  const allGrouped = useMemo(() => groupOrders(orders), [orders]);
  const summary = useMemo(() => ({ orders: allGrouped.length }), [allGrouped]);
  const orderTotal = (form?.lines || []).reduce(
    (s, l) => s + Number(l.qty || 0) * Number(l.rate || 0),
    0,
  );
  const money = (n) =>
    Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <ClipboardList size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">
                Total orders
              </p>
              <p className="text-xl font-bold leading-tight tabular-nums text-slate-900">
                {summary.orders}
              </p>
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
              onClick={add}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={15} /> New Order
            </button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-[13px] font-bold text-slate-900">
                Order Register
              </h2>
              <p className="text-[11px] text-slate-500">
                Select an order to review its items and quantities
              </p>
            </div>
            <div className="relative w-full sm:w-[340px]">
              <Search
                size={14}
                className="absolute left-3 top-2.5 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order no, reference, customer..."
                className={`${inputStyle} pl-9`}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  {[
                    "Order number / Date",
                    "Customer / Reference",
                    "Items",
                    "Ordered",
                    "Invoiced",
                    "Cancelled",
                    "Pending",
                    "Status",
                    "",
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
                      colSpan={9}
                      className="py-16 text-center text-slate-500"
                    >
                      <Loader2
                        size={20}
                        className="mx-auto mb-2 animate-spin text-blue-600"
                      />
                      Loading orders...
                    </td>
                  </tr>
                ) : grouped.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-16 text-center text-slate-500"
                    >
                      <Package
                        size={28}
                        className="mx-auto mb-2 text-slate-300"
                      />
                      No orders found
                    </td>
                  </tr>
                ) : (
                  grouped.map((o) => {
                    const ordered = o.lines.reduce(
                        (s, l) => s + Number(l.orderedQty || 0),
                        0,
                      ),
                      invoiced = o.lines.reduce(
                        (s, l) => s + Number(l.invoicedQty || 0),
                        0,
                      ),
                      cancelled = o.lines.reduce(
                        (s, l) => s + Number(l.cancelledQty || 0),
                        0,
                      ),
                      pending = o.lines.reduce(
                        (s, l) => s + Number(l.pendingQty || 0),
                        0,
                      );
                    return (
                      <React.Fragment key={o.orderId}>
                        <tr
                          onClick={() =>
                            setExpanded((p) => ({
                              ...p,
                              [o.orderId]: !p[o.orderId],
                            }))
                          }
                          className="cursor-pointer hover:bg-blue-50/40"
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-blue-700">
                              {o.orderNo}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              {String(o.orderDate || "").slice(0, 10)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">
                              {o.partyName}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              Ref: {o.customerOrderRef || "—"}
                              {o.customerOrderRefDate
                                ? ` · ${String(o.customerOrderRefDate).slice(0, 10)}`
                                : ""}
                            </div>
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {o.lines.length}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {qty(ordered)}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-emerald-700">
                            {qty(invoiced)}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-rose-600">
                            {qty(cancelled)}
                          </td>
                          <td className="px-4 py-3 font-bold tabular-nums text-slate-900">
                            {qty(pending)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${pending <= 0 ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"}`}
                            >
                              {pending <= 0 ? "Closed" : "In progress"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {expanded[o.orderId] ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </td>
                        </tr>
                        {expanded[o.orderId] && (
                          <tr className="bg-slate-50/70">
                            <td colSpan={9} className="px-4 py-4">
                              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                                  <span className="font-bold text-slate-700">
                                    Order line details
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    Cancellation is limited to pending quantity
                                  </span>
                                </div>
                                <table className="w-full text-left">
                                  <thead className="bg-slate-50 text-[10px] text-slate-500">
                                    <tr>
                                      {[
                                        "Item code",
                                        "Ordered",
                                        "Invoiced",
                                        "Cancelled",
                                        "Pending",
                                        "Rate (₹)",
                                        "Action",
                                      ].map((h) => (
                                        <th
                                          key={h}
                                          className="px-4 py-2 font-semibold"
                                        >
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {o.lines.map((l) => (
                                      <tr key={l.orderLineId}>
                                        <td className="px-4 py-3 font-semibold text-slate-800">
                                          {l.itemCode}
                                        </td>
                                        <td className="px-4 py-3">
                                          {qty(l.orderedQty)}
                                        </td>
                                        <td className="px-4 py-3 text-emerald-700">
                                          {qty(l.invoicedQty)}
                                        </td>
                                        <td className="px-4 py-3 text-rose-600">
                                          {qty(l.cancelledQty)}
                                        </td>
                                        <td className="px-4 py-3 font-bold">
                                          {qty(l.pendingQty)}
                                        </td>
                                        <td className="px-4 py-3">
                                          {money(l.rate)}
                                        </td>
                                        <td className="px-4 py-3">
                                          <button
                                            disabled={Number(l.pendingQty) <= 0}
                                            onClick={() => cancel(l)}
                                            className="rounded-md border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                                          >
                                            Cancel pending
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {o.shippingAddress && (
                                  <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-600">
                                    <b>Shipping address: </b>
                                    {o.shippingAddress}
                                  </div>
                                )}
                                {o.remarks && (
                                  <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500">
                                    <b className="text-slate-700">
                                      Order remarks:
                                    </b>{" "}
                                    {o.remarks}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
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
          <div className="flex max-h-[94vh] w-full max-w-[980px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Create New Order
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Order date and number will be assigned automatically
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
            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-5 overflow-y-auto px-5 py-5">
                <div>
                  <h3 className="mb-3 text-xs font-bold text-slate-800">
                    Customer details
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelStyle}>
                        Party name <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        className={inputStyle}
                        value={form.customerId}
                        onChange={(e) => chooseCustomer(e.target.value)}
                      >
                        <option value="">Select a customer</option>
                        {customers
                          .filter((c) => c.is_Active !== false)
                          .map((c) => (
                            <option key={c.customer_Id} value={c.customer_Id}>
                              {c.party_Name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelStyle}>
                        Customer order reference
                      </label>
                      <input
                        className={inputStyle}
                        placeholder="Enter customer PO / reference"
                        value={form.customerOrderRef}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            customerOrderRef: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelStyle}>
                        Customer order reference date
                      </label>
                      <input
                        type="date"
                        className={inputStyle}
                        value={form.customerOrderRefDate || ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            customerOrderRefDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={labelStyle}>
                      Shipping address <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      className={inputStyle}
                      disabled={!form.customerId || addressLoading}
                      value={form.shippingAddressId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          shippingAddressId: e.target.value,
                        }))
                      }
                    >
                      <option value="">
                        {addressLoading
                          ? "Loading addresses..."
                          : !form.customerId
                            ? "Select customer first"
                            : addresses.length
                              ? "Select shipping address"
                              : "No addresses found for customer"}
                      </option>
                      {addresses.map((a) => (
                        <option key={addressIdOf(a)} value={addressIdOf(a)}>
                          {addressText(a)}
                        </option>
                      ))}
                    </select>
                    {form.shippingAddressId && (
                      <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-slate-700">
                        <MapPin
                          size={14}
                          className="mr-1 inline text-blue-600"
                        />
                        {addressText(
                          addresses.find(
                            (a) =>
                              String(addressIdOf(a)) ===
                              String(form.shippingAddressId),
                          ) || {},
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">
                        Order items
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Select unique items and enter quantities and rates
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          lines: [...f.lines, { itemId: "", qty: 1, rate: 0 }],
                        }))
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                    >
                      <Plus size={13} /> Add item
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[650px] text-left">
                      <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2.5">Item code</th>
                          <th className="w-28 px-3 py-2.5">Qty</th>
                          <th className="w-36 px-3 py-2.5">Rate (₹)</th>
                          <th className="w-36 px-3 py-2.5 text-right">
                            Amount (₹)
                          </th>
                          <th className="w-12" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {form.lines.map((l, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">
                              <select
                                required
                                className={inputStyle}
                                value={l.itemId}
                                onChange={(e) =>
                                  lineChange(i, "itemId", e.target.value)
                                }
                              >
                                <option value="">Select item</option>
                                {items
                                  .filter((x) => x.is_Active !== false)
                                  .map((x) => (
                                    <option key={x.item_Id} value={x.item_Id}>
                                      {x.item_Code} — {x.item_Desc}
                                    </option>
                                  ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                required
                                type="number"
                                min="1"
                                step="1"
                                className={inputStyle}
                                value={l.qty}
                                onChange={(e) =>
                                  lineChange(i, "qty", e.target.value)
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                className={inputStyle}
                                value={l.rate}
                                onChange={(e) =>
                                  lineChange(i, "rate", e.target.value)
                                }
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums">
                              {money(Number(l.qty) * Number(l.rate))}
                            </td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                title="Remove item"
                                disabled={form.lines.length === 1}
                                onClick={() =>
                                  setForm((f) => ({
                                    ...f,
                                    lines: f.lines.filter((_, j) => j !== i),
                                  }))
                                }
                                className="rounded-md p-2 text-rose-500 hover:bg-rose-50 disabled:opacity-30"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <div className="rounded-lg bg-slate-50 px-4 py-2 text-right">
                      <span className="mr-5 text-[11px] text-slate-500">
                        Order total
                      </span>
                      <span className="text-base font-bold tabular-nums text-slate-900">
                        ₹{money(orderTotal)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelStyle}>Order remarks</label>
                  <textarea
                    rows={2}
                    className={`${inputStyle} h-auto py-2.5`}
                    placeholder="Optional notes for this order"
                    value={form.remarks}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, remarks: e.target.value }))
                    }
                  />
                </div>
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
                  disabled={busy}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-5 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CircleCheck size={14} />
                  )}{" "}
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
