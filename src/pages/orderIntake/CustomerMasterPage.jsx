import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Pencil,
  Loader2,
  X,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import Swal from "sweetalert2";
import CustomerService from "../../services/orderIntake/OrderIntakeService";

// Accepts both the API envelope and services that already return response.data.
const unwrapResponse = (response) => {
  const value =
    response?.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data) &&
    "status_Code" in response.data
      ? response.data
      : response;
  if (
    value &&
    !Array.isArray(value) &&
    typeof value === "object" &&
    ("status_Code" in value || "status" in value)
  ) {
    if (
      (value.status_Code !== undefined && Number(value.status_Code) !== 200) ||
      (value.status && String(value.status).toLowerCase() !== "success")
    ) {
      throw new Error(value.message || "API request failed");
    }
    return value.data;
  }
  return value;
};
const asArray = (response) => {
  const value = unwrapResponse(response);
  return Array.isArray(value) ? value : [];
};
const getSavedId = (response, key, fallback = 0) => {
  const value = unwrapResponse(response);
  const id =
    typeof value === "number"
      ? value
      : (value?.[key] ?? value?.[key.charAt(0).toUpperCase() + key.slice(1)]);
  return Number(id || fallback);
};
const DEFAULT_ADDRESS_TYPES = [
  "Billing",
  "Shipping",
  "Consignee",
  "Registered Office",
  "Corporate Office",
  "Warehouse",
  "Factory",
  "Other",
];
const normalizeTypes = (response) => {
  const values = asArray(response)
    .map((t) =>
      typeof t === "string"
        ? t
        : (t?.address_Type ?? t?.Address_Type ?? t?.addressType ?? ""),
    )
    .filter(Boolean);
  return values.length ? [...new Set(values)] : DEFAULT_ADDRESS_TYPES;
};

const blankCustomer = { customer_Id: 0, party_Name: "" };
const blankAddress = {
  address_Id: 0,
  address_Type: "Billing",
  add1: "",
  add2: "",
  add3: "",
  city: "",
  segment: "",
  sector: "",
  zip_Code: "",
  gst: "",
  is_Default: true,
};
const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50";
function Field({ label, required = false, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-slate-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
    </label>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
function getEmpNo() {
  try {
    const u = JSON.parse(sessionStorage.getItem("user") || "{}");
    return String(u.emp_no || u.emp_No || u.emp_id || "");
  } catch {
    return "";
  }
}

export default function DaedalusCustomerMaster({ mainHeaderHeight = 64 }) {
  const [customers, setCustomers] = useState([]),
    [addresses, setAddresses] = useState([]),
    [types, setTypes] = useState([]);
  const [selected, setSelected] = useState(null),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(false),
    [detailLoading, setDetailLoading] = useState(false),
    [saving, setSaving] = useState(false);
  const [customerForm, setCustomerForm] = useState(null),
    [addressForm, setAddressForm] = useState(null),
    [newCustomerFirstAddress, setNewCustomerFirstAddress] = useState(false);
  const notify = (message, icon = "success") =>
    Swal.fire({
      toast: true,
      position: "top-end",
      timer: 3000,
      showConfirmButton: false,
      icon,
      title: message,
    });
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      setCustomers(asArray(await CustomerService.getCustomers("", true)));
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadCustomers();
    CustomerService.getAddressTypes()
      .then((result) => setTypes(normalizeTypes(result)))
      .catch((e) => notify(e.message, "error"));
  }, [loadCustomers]);
  const loadAddresses = useCallback(async (id) => {
    setDetailLoading(true);
    try {
      setAddresses(asArray(await CustomerService.getAddresses(id, true)));
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setDetailLoading(false);
    }
  }, []);
  useEffect(() => {
    if (selected?.customer_Id) loadAddresses(selected.customer_Id);
    else setAddresses([]);
  }, [selected?.customer_Id, loadAddresses]);
  const filtered = useMemo(
    () =>
      (Array.isArray(customers) ? customers : []).filter((c) =>
        [c.party_Name].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
      ),
    [customers, search],
  );
  const updateCustomer = (k, v) => setCustomerForm((p) => ({ ...p, [k]: v }));
  const updateAddress = (k, v) => setAddressForm((p) => ({ ...p, [k]: v }));
  const openNew = () => {
    setCustomerForm({ ...blankCustomer });
    setAddressForm({ ...blankAddress });
    setNewCustomerFirstAddress(true);
  };
  const saveCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.party_Name.trim())
      return notify("Party name is required", "warning");
    if (
      newCustomerFirstAddress &&
      (!addressForm.add1.trim() || !addressForm.city.trim())
    )
      return notify("First address and city are required", "warning");
    setSaving(true);
    try {
      const savedCustomer = await CustomerService.saveCustomer({
        ...customerForm,
        updated_By: getEmpNo(),
      });
      const id = getSavedId(
        savedCustomer,
        "customer_Id",
        customerForm.customer_Id,
      );
      if (!id)
        throw new Error(
          "Customer saved but no Customer_Id was returned by the API.",
        );
      if (newCustomerFirstAddress) {
        try {
          unwrapResponse(
            await CustomerService.saveAddress({
              ...addressForm,
              customer_Id: id,
              updated_By: getEmpNo(),
            }),
          );
        } catch (err) {
          await loadCustomers();
          setCustomerForm(null);
          setAddressForm(null);
          notify(
            `Customer created, but address failed: ${err.message}`,
            "error",
          );
          return;
        }
      }
      await loadCustomers();
      setSelected({
        customer_Id: id,
        party_Name: customerForm.party_Name,
        is_Active: true,
      });
      await loadAddresses(id);
      setCustomerForm(null);
      setAddressForm(null);
      notify("Customer saved successfully");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const saveAddress = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      unwrapResponse(
        await CustomerService.saveAddress({
          ...addressForm,
          customer_Id: selected.customer_Id,
          updated_By: getEmpNo(),
        }),
      );
      setAddressForm(null);
      await loadAddresses(selected.customer_Id);
      notify("Address saved successfully");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  };
  const toggleCustomer = async (c) => {
    const r = await Swal.fire({
      title: `${c.is_Active ? "Deactivate" : "Activate"} customer?`,
      text: c.party_Name,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm",
    });
    if (!r.isConfirmed) return;
    try {
      unwrapResponse(
        await CustomerService.setCustomerActive({
          customer_Id: c.customer_Id,
          is_Active: !c.is_Active,
          updated_By: getEmpNo(),
        }),
      );
      await loadCustomers();
      setSelected((p) =>
        p?.customer_Id === c.customer_Id
          ? { ...p, is_Active: !c.is_Active }
          : p,
      );
      notify("Customer status updated");
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const toggleAddress = async (a) => {
    const r = await Swal.fire({
      title: `${a.is_Active ? "Deactivate" : "Activate"} address?`,
      icon: "question",
      showCancelButton: true,
    });
    if (!r.isConfirmed) return;
    try {
      unwrapResponse(
        await CustomerService.setAddressActive({
          customer_Id: selected.customer_Id,
          address_Id: a.address_Id,
          is_Active: !a.is_Active,
          updated_By: getEmpNo(),
        }),
      );
      await loadAddresses(selected.customer_Id);
      notify("Address status updated");
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const addressFields = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Address Type" required>
        <select
          className={inputClass}
          value={addressForm?.address_Type || "Billing"}
          onChange={(e) => updateAddress("address_Type", e.target.value)}
        >
          {(types.length ? types : DEFAULT_ADDRESS_TYPES).map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="City" required>
        <input
          className={inputClass}
          required
          value={addressForm?.city || ""}
          onChange={(e) => updateAddress("city", e.target.value)}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Address Line 1" required>
          <input
            className={inputClass}
            required
            value={addressForm?.add1 || ""}
            onChange={(e) => updateAddress("add1", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Address Line 2">
        <input
          className={inputClass}
          value={addressForm?.add2 || ""}
          onChange={(e) => updateAddress("add2", e.target.value)}
        />
      </Field>
      <Field label="Address Line 3">
        <input
          className={inputClass}
          value={addressForm?.add3 || ""}
          onChange={(e) => updateAddress("add3", e.target.value)}
        />
      </Field>
      <Field label="Segment">
        <input
          className={inputClass}
          value={addressForm?.segment || ""}
          onChange={(e) => updateAddress("segment", e.target.value)}
        />
      </Field>
      <Field label="Sector">
        <input
          className={inputClass}
          value={addressForm?.sector || ""}
          onChange={(e) => updateAddress("sector", e.target.value)}
        />
      </Field>
      <Field label="Zip Code">
        <input
          className={inputClass}
          maxLength={20}
          value={addressForm?.zip_Code || ""}
          onChange={(e) => updateAddress("zip_Code", e.target.value)}
        />
      </Field>
      <Field label="GSTIN">
        <input
          className={inputClass}
          maxLength={15}
          value={addressForm?.gst || ""}
          onChange={(e) => updateAddress("gst", e.target.value.toUpperCase())}
          placeholder="15-character GSTIN"
        />
      </Field>
      <label className="sm:col-span-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={!!addressForm?.is_Default}
          onChange={(e) => updateAddress("is_Default", e.target.checked)}
        />{" "}
        Set as default for this address type
      </label>
    </div>
  );
  return (
    <div
      className="bg-slate-50 px-4 pb-12 text-slate-900 sm:px-6"
      style={{ paddingTop: 20 }}
    >
      <div className="mx-auto max-w-[1550px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-700 p-3 text-white">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Customer Master</h1>
              <p className="text-sm text-slate-600">
                Daedalus · Party and multiple address management
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className={`${buttonClass} border bg-white`}
              onClick={loadCustomers}
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              className={`${buttonClass} bg-blue-700 text-white hover:bg-blue-800`}
              onClick={openNew}
            >
              <Plus size={16} /> Add Customer
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(350px,0.85fr)_minmax(0,1.15fr)]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Customers</h2>
                <span className="text-xs text-slate-500">
                  {filtered.length} records
                </span>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  className={`${inputClass} pl-9`}
                  placeholder="Search party name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-[68vh] divide-y overflow-y-auto">
              {loading ? (
                <p className="p-8 text-center">
                  <Loader2 className="mx-auto animate-spin" />
                </p>
              ) : filtered.length === 0 ? (
                <p className="p-8 text-center text-slate-500">
                  No customers found
                </p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.customer_Id}
                    onClick={() => setSelected(c)}
                    className={`w-full p-4 text-left hover:bg-blue-50 ${selected?.customer_Id === c.customer_Id ? "bg-blue-50 border-l-4 border-blue-700" : ""}`}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-bold text-sm">{c.party_Name}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-bold ${c.is_Active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                      >
                        {c.is_Active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Customer ID: {c.customer_Id}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
          <section className="min-h-[450px] rounded-xl border border-slate-200 bg-white shadow-sm">
            {!selected ? (
              <div className="flex h-full min-h-[450px] flex-col items-center justify-center gap-3 text-slate-500">
                <Building2 size={42} className="text-slate-300" />
                <p>Select a customer to view and manage addresses</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
                  <div>
                    <h2 className="text-lg font-extrabold">
                      {selected.party_Name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Customer ID: {selected.customer_Id}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`${buttonClass} border bg-white`}
                      onClick={() => {
                        setCustomerForm({ ...selected });
                        setNewCustomerFirstAddress(false);
                      }}
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      className={`${buttonClass} border bg-white`}
                      onClick={() => toggleCustomer(selected)}
                    >
                      {selected.is_Active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      disabled={!selected.is_Active}
                      className={`${buttonClass} bg-blue-700 text-white`}
                      onClick={() => setAddressForm({ ...blankAddress })}
                    >
                      <Plus size={14} /> Add Address
                    </button>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  <h3 className="text-sm font-bold text-slate-700">
                    Addresses ({addresses.length})
                  </h3>
                  {detailLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : addresses.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">
                      No addresses yet. Add the first address for this customer.
                    </p>
                  ) : (
                    addresses.map((a) => (
                      <div
                        key={a.address_Id}
                        className={`rounded-xl border p-4 ${a.is_Active ? "border-slate-200" : "border-red-200 bg-red-50/30"}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <MapPin size={17} className="text-blue-700" />
                            <strong className="text-sm">
                              {a.address_Type}
                            </strong>
                            {a.is_Default && (
                              <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                Default
                              </span>
                            )}
                            {!a.is_Active && (
                              <span className="text-xs text-red-700">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="text-xs font-bold text-blue-700"
                              onClick={() => setAddressForm({ ...a })}
                            >
                              Edit
                            </button>
                            <button
                              className="text-xs font-bold text-slate-600"
                              onClick={() => toggleAddress(a)}
                            >
                              {a.is_Active ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                          {[a.add1, a.add2, a.add3, a.city, a.zip_Code]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {[a.segment, a.sector].filter(Boolean).join(" · ") ||
                            "Segment / Sector not specified"}
                        </p>
                        {a.gst && (
                          <p className="mt-1 text-xs font-semibold text-slate-600">
                            GSTIN: {a.gst}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
      {customerForm && (
        <Modal
          title={
            customerForm.customer_Id
              ? "Edit Customer"
              : "Add Customer & First Address"
          }
          onClose={() => {
            setCustomerForm(null);
            setAddressForm(null);
          }}
        >
          <form onSubmit={saveCustomer} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Party Name" required>
                  <input
                    required
                    className={inputClass}
                    value={customerForm.party_Name}
                    onChange={(e) =>
                      updateCustomer("party_Name", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>
            {newCustomerFirstAddress && (
              <>
                <div className="border-t pt-4">
                  <h3 className="mb-3 font-bold">First Address</h3>
                  {addressFields}
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 border-t pt-4">
              <button
                type="button"
                className={`${buttonClass} border`}
                onClick={() => setCustomerForm(null)}
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className={`${buttonClass} bg-blue-700 text-white`}
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}{" "}
                Save Customer
              </button>
            </div>
          </form>
        </Modal>
      )}
      {addressForm && !customerForm && (
        <Modal
          title={
            addressForm.address_Id
              ? "Edit Address"
              : `Add Address · ${selected?.party_Name}`
          }
          onClose={() => setAddressForm(null)}
        >
          <form onSubmit={saveAddress} className="space-y-5">
            {addressFields}
            <div className="flex justify-end gap-2 border-t pt-4">
              <button
                type="button"
                className={`${buttonClass} border`}
                onClick={() => setAddressForm(null)}
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className={`${buttonClass} bg-blue-700 text-white`}
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}{" "}
                Save Address
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
