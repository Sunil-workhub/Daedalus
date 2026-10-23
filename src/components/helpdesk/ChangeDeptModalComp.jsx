import { ArrowLeftRight, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 font-semibold">{error}</p>
      )}
    </div>
  );
}

function AssigneeDropdown({
  value,
  onChange,
  label = "Assign Engineer",
  error,
  employees = [],
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <Field label={label} error={error}>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="w-full h-10 flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none hover:border-slate-400 transition-colors"
        >
          <span
            className={
              !value ? "text-slate-400" : "text-slate-800 font-semibold"
            }
          >
            {!value ? "Select engineer…" : value.emp_Name}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto thin-scroll">
            {employees.length === 0 && (
              <div className="px-3 py-4 text-xs text-slate-400 text-center">
                No engineers found
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2.5 text-left text-sm transition-colors border-b border-slate-100 ${!value ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-400 hover:bg-slate-50"} italic`}
            >
              None / Unassigned
            </button>
            {employees.map((emp) => {
              const sel = value?.emp_Id === emp.emp_Id;
              const initials = emp.emp_Name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <button
                  key={emp.emp_Id}
                  type="button"
                  onClick={() => {
                    onChange(emp);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${sel ? "bg-blue-50" : ""}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-none ${sel ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    {initials}
                  </div>
                  <span className="flex-1 min-w-0">
                    <span
                      className={`font-semibold ${sel ? "text-blue-700" : "text-slate-700"}`}
                    >
                      {emp.emp_Name}
                    </span>
                    <span className="ml-1 text-[10px] font-bold mono text-slate-400">
                      #{emp.emp_No}
                    </span>
                    <span
                      className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ORG_PILL[emp.org_Id] || "bg-slate-100 text-slate-600"}`}
                    >
                      {emp.org_Id}
                    </span>
                  </span>
                  {sel && (
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-none" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Field>
  );
}

export default function ChangeDeptModal({
  open,
  onClose,
  ticket,
  targetDept,
  employees,
  assignee,
  onAssigneeChange,
  loading,
  submitting,
  error,
  onSubmit,
}) {
  if (!open || !ticket) return null;

  const needsAssignee = ticket.status !== "Open";

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mini-modal p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Change Ticket Department
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Move ticket from {ticket.ticketDept} to {targetDept}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Current Department">
            <div className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center text-sm font-semibold text-slate-700">
              {ticket.ticketDept}
            </div>
          </Field>

          <Field label="Target Department">
            <div className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center text-sm font-semibold text-slate-700">
              {targetDept}
            </div>
          </Field>

          {needsAssignee ? (
            <AssigneeDropdown
              value={assignee}
              onChange={onAssigneeChange}
              label={`Assign ${targetDept} Member`}
              employees={employees}
              error={error}
            />
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 font-medium">
              Ticket is in Open status, so only department will change.
            </div>
          )}

          {loading ? (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading {targetDept} members...
            </div>
          ) : null}

          {!!error && !needsAssignee ? (
            <p className="text-xs text-red-600 font-semibold">{error}</p>
          ) : null}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || loading}
            className="flex-1 h-10 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowLeftRight className="w-4 h-4" />
            )}
            Change Department
          </button>
        </div>
      </div>
    </div>
  );
}
