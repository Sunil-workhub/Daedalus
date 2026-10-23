import { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import HelpdeskService from "../../services/helpdesk/HelpdeskService";

const PASSWORDREGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

function PasswordField({
  label,
  value,
  onChange,
  error,
  visible,
  onToggle,
  autoComplete,
  placeholder,
}) {
  return (
    <div>
      <label className="block text-11px font-bold uppercase tracking-widest text-slate-400 mb-1.5">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`w-full h-11 rounded-xl border bg-white pl-3 pr-11 text-sm focus:outline-none transition-colors ${
            error
              ? "border-red-300 bg-red-50 focus:border-red-400"
              : "border-slate-300 focus:border-slate-400"
          }`}
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {visible ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-600 font-semibold">{error}</p>
      )}
    </div>
  );
}

export default function ChangePasswordModal({ currentUser, onClose }) {
  const empId = useMemo(() => String(currentUser?.emp_No || ""), [currentUser]);

  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const validate = () => {
    const e = {};

    if (!empId.trim()) e.empId = "Employee ID not available.";
    if (!form.oldPassword.trim()) e.oldPassword = "Old password is required.";

    if (!form.newPassword.trim()) {
      e.newPassword = "New password is required.";
    } else if (!PASSWORDREGEX.test(form.newPassword)) {
      e.newPassword =
        "Password must contain 1 uppercase, 1 lowercase, 1 number, and 1 special character.";
    }

    if (!form.confirmNewPassword.trim()) {
      e.confirmNewPassword = "Please confirm the new password.";
    } else if (form.newPassword !== form.confirmNewPassword) {
      e.confirmNewPassword = "New password and confirm password must match.";
    }

    if (
      form.oldPassword &&
      form.newPassword &&
      form.oldPassword === form.newPassword
    ) {
      e.newPassword = "New password must be different from old password.";
    }

    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = await HelpdeskService.updateUserPassword({
        user_id: empId.trim(),
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      if (data.status !== "Success") {
        throw new Error(data.message || "Password update failed.");
      }

      setSuccessMessage(data.message || "Password changed successfully.");
      setForm({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setApiError(err.message || "Unable to change password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth: 460 }}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-700" />
              Change Password
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your helpdesk login password
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-11px font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Employee No
            </label>
            <input
              type="text"
              value={empId}
              disabled
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600 cursor-not-allowed"
            />
            {errors.empId && (
              <p className="mt-1 text-xs text-red-600 font-semibold">
                {errors.empId}
              </p>
            )}
          </div>

          <PasswordField
            label="Old Password"
            value={form.oldPassword}
            onChange={(e) => {
              const value = e.target.value;
              setForm((p) => ({ ...p, oldPassword: value }));
              if (errors.oldPassword) {
                setErrors((p) => ({ ...p, oldPassword: undefined }));
              }
            }}
            error={errors.oldPassword}
            visible={showOldPassword}
            onToggle={() => setShowOldPassword((p) => !p)}
            autoComplete="current-password"
            placeholder="Enter old password"
          />

          <PasswordField
            label="New Password"
            value={form.newPassword}
            onChange={(e) => {
              const value = e.target.value;
              setForm((p) => ({ ...p, newPassword: value }));
              setErrors((p) => ({
                ...p,
                newPassword: undefined,
                confirmNewPassword:
                  form.confirmNewPassword && value !== form.confirmNewPassword
                    ? "New password and confirm password must match."
                    : undefined,
              }));
            }}
            error={errors.newPassword}
            visible={showNewPassword}
            onToggle={() => setShowNewPassword((p) => !p)}
            autoComplete="new-password"
            placeholder="Enter new password"
          />

          <PasswordField
            label="Confirm New Password"
            value={form.confirmNewPassword}
            onChange={(e) => {
              const value = e.target.value;
              setForm((p) => ({ ...p, confirmNewPassword: value }));
              setErrors((p) => ({
                ...p,
                confirmNewPassword:
                  form.newPassword && value !== form.newPassword
                    ? "New password and confirm password must match."
                    : undefined,
              }));
            }}
            error={errors.confirmNewPassword}
            visible={showConfirmNewPassword}
            onToggle={() => setShowConfirmNewPassword((p) => !p)}
            autoComplete="new-password"
            placeholder="Confirm new password"
          />

          <div className="text-xs text-slate-500 leading-relaxed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            New password must contain at least 1 uppercase, 1 lowercase, 1
            number, and 1 special character.
          </div>

          {apiError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 font-medium">
              {apiError}
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 font-medium">
              {successMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
