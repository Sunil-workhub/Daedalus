import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Pencil,
  X,
  Save,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Power,
} from "lucide-react";
import Swal from "sweetalert2";
import DaedalusItemService from "../../services/orderIntake/OrderIntakeService";

const empty = {
  item_Id: 0,
  item_Desc: "",
  item_Code: "",
  revision: "",
  uom: "NOS",
  item_Type: "",
  product: "",
  model: "",
};
const defaultProducts = [
  "Scissor Lift",
  "Boom Lift",
  "JibMaster",
  "Pushable Scissor Lift",
  "Common",
];
const normalize = (row) => ({
  item_Id: row.item_Id ?? row.Item_Id ?? 0,
  item_Desc: row.item_Desc ?? row.Item_Desc ?? "",
  item_Code: row.item_Code ?? row.Item_Code ?? "",
  revision: row.revision ?? row.Revision ?? "",
  uom: row.uom ?? row.UOM ?? "NOS",
  item_Type: row.item_Type ?? row.Item_Type ?? "",
  product: row.product ?? row.Product ?? "",
  model: row.model ?? row.Model ?? "",
  is_Active: row.is_Active ?? row.Is_Active ?? true,
});
const inputClass =
  "w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function DaedalusItemMasterPage({ mainHeaderHeight = 64 }) {
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState({
    itemTypes: [],
    products: defaultProducts,
  });
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const user = useMemo(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem("user") || "{}");
      return String(s.emp_no ?? s.emp_No ?? s.empNo ?? s.userId ?? "");
    } catch {
      return "";
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [itemResponse, optionResponse] = await Promise.all([
        DaedalusItemService.getItemsMaster("", true),
        DaedalusItemService.getItemsOptions(),
      ]);
      setItems((itemResponse.data || []).map(normalize));
      const data = optionResponse.data || {};
      setOptions({
        itemTypes: data.itemTypes ?? data.ItemTypes ?? [],
        products: data.products ?? data.Products ?? defaultProducts,
      });
    } catch (e) {
      setError(e.message || "Failed to load item master.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (includeInactive || i.is_Active) &&
          [i.item_Code, i.item_Desc, i.item_Type, i.product, i.model].some(
            (v) =>
              String(v || "")
                .toLowerCase()
                .includes(search.toLowerCase().trim()),
          ),
      ),
    [items, search, includeInactive],
  );
  const products = useMemo(
    () =>
      [
        ...new Set(
          [
            ...defaultProducts,
            ...options.products,
            ...items.map((x) => x.product),
          ].filter(Boolean),
        ),
      ].sort(),
    [items, options.products],
  );
  const openForm = (item = null) => {
    setForm(item ? { ...item } : { ...empty });
    setModal(true);
  };
  const change = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const save = async (e) => {
    e.preventDefault();
    if (
      !form.item_Desc.trim() ||
      !form.item_Code.trim() ||
      !form.item_Type ||
      !form.uom
    ) {
      Swal.fire(
        "Missing details",
        "Description, item code, UOM and item type are required.",
        "warning",
      );
      return;
    }
    if (!user) {
      Swal.fire(
        "Session missing",
        "Please sign in again to save changes.",
        "error",
      );
      return;
    }
    setSaving(true);
    try {
      await DaedalusItemService.saveItemMaster({
        item_Id: form.item_Id,
        item_Desc: form.item_Desc.trim(),
        item_Code: form.item_Code.trim(),
        revision: form.revision?.trim() || null,
        uom: form.uom,
        item_Type: form.item_Type,
        product: form.product?.trim() || null,
        model: form.model?.trim() || null,
        user,
      });
      setModal(false);
      await load();
      Swal.fire({
        icon: "success",
        title: "Item saved",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire("Unable to save", e.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const toggle = async (item) => {
    const next = !item.is_Active;
    const confirmation = await Swal.fire({
      title: `${next ? "Activate" : "Deactivate"} ${item.item_Code}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm",
    });
    if (!confirmation.isConfirmed) return;
    if (!user) {
      Swal.fire("Session missing", "Please sign in again.", "error");
      return;
    }
    try {
      await DaedalusItemService.setItemActive({
        item_Id: item.item_Id,
        is_Active: next,
        user,
      });
      await load();
    } catch (e) {
      Swal.fire("Unable to update", e.message, "error");
    }
  };
  return (
    <div className="bg-slate-50 text-slate-900 pb-10">
      <div
        className="bg-white border-b border-slate-200 shadow-sm"
        style={{ top: mainHeaderHeight }}
      >
        <div className="max-w-[1600px] mx-auto px-5 py-3 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3 items-center">
            <div className="bg-blue-700 text-white p-2.5 rounded-xl">
              <Package size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Item Master</h1>
              <p className="text-xs text-slate-500">
                Daedalus · Order Intake Management
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="px-3 py-2 border rounded-lg bg-white flex gap-2 items-center text-sm"
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              onClick={() => openForm()}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white flex gap-2 items-center text-sm font-semibold"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-5 pt-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            ["Total Items", items.length],
            ["Active", items.filter((x) => x.is_Active).length],
            ["Inactive", items.filter((x) => !x.is_Active).length],
            [
              "Products",
              new Set(items.map((x) => x.product).filter(Boolean)).size,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="bg-white border border-slate-200 rounded-xl p-4"
            >
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search
                size={17}
                className="absolute top-3 left-3 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code, description, product, model..."
                className={`${inputClass} pl-10`}
              />
            </div>
            <label className="text-sm text-slate-700 flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />{" "}
              Show inactive
            </label>
            <span className="text-xs font-semibold text-slate-500">
              {filtered.length} records
            </span>
          </div>
          {error && (
            <div className="m-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={17} />
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  {[
                    "Item Code",
                    "Item Description",
                    "Revision",
                    "UOM",
                    "Item Type",
                    "Product",
                    "Model",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-bold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-14">
                      <Loader2 className="animate-spin mx-auto text-blue-600" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-14 text-slate-500"
                    >
                      No items found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.item_Id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-semibold text-blue-800 whitespace-nowrap">
                        {item.item_Code}
                      </td>
                      <td className="px-4 py-3 min-w-[240px]">
                        {item.item_Desc}
                      </td>
                      <td className="px-4 py-3">{item.revision || "—"}</td>
                      <td className="px-4 py-3">{item.uom}</td>
                      <td className="px-4 py-3">{item.item_Type}</td>
                      <td className="px-4 py-3">{item.product || "—"}</td>
                      <td className="px-4 py-3">{item.model || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${item.is_Active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                        >
                          {item.is_Active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            title="Edit item"
                            onClick={() => openForm(item)}
                            className="p-2 rounded-lg text-blue-700 hover:bg-blue-100"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            title={item.is_Active ? "Deactivate" : "Activate"}
                            onClick={() => toggle(item)}
                            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                          >
                            <Power size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {modal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  {form.item_Id ? "Edit Item" : "Add New Item"}
                </h2>
                <p className="text-xs text-slate-500">
                  Enter item details for Daedalus
                </p>
              </div>
              <button
                onClick={() => setModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={save} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ["Item Description *", "item_Desc", "text"],
                  ["Item Code *", "item_Code", "text"],
                  ["Revision", "revision", "text"],
                  ["UOM *", "uom", "select"],
                  ["Item Type *", "item_Type", "select"],
                  ["Product", "product", "product"],
                  ["Model", "model", "text"],
                ].map(([label, key, type]) => (
                  <label
                    key={key}
                    className={`block ${key === "item_Desc" ? "sm:col-span-2" : ""}`}
                  >
                    <span className="block text-xs font-bold text-slate-700 mb-1.5">
                      {label}
                    </span>
                    {type === "select" ? (
                      <select
                        className={inputClass}
                        value={form[key]}
                        onChange={(e) => change(key, e.target.value)}
                        required
                      >
                        <option value="">
                          Select {label.replace(" *", "")}
                        </option>
                        {(key === "uom"
                          ? ["NOS", "Kgs"]
                          : options.itemTypes
                        ).map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <input
                          className={inputClass}
                          value={form[key] || ""}
                          onChange={(e) => change(key, e.target.value)}
                          list={
                            type === "product" ? "daedalus-products" : undefined
                          }
                          maxLength={
                            key === "item_Desc"
                              ? 500
                              : key === "item_Code"
                                ? 100
                                : key === "revision"
                                  ? 50
                                  : 150
                          }
                          required={label.endsWith("*")}
                          placeholder={`Enter ${label.replace(" *", "").toLowerCase()}`}
                        />
                        {type === "product" && (
                          <datalist id="daedalus-products">
                            {products.map((v) => (
                              <option key={v} value={v} />
                            ))}
                          </datalist>
                        )}
                      </>
                    )}
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-bold flex gap-2 items-center disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}{" "}
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
