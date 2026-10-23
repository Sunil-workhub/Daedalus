// HelpdeskPage.jsx — API-bound Helpdesk (IT + HR) — Updated with kanban/acceptance/category changes
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BellOff,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Clock3,
  Database,
  Download,
  EyeOff,
  Filter,
  FlaskConical,
  HardDrive,
  Inbox,
  List,
  Loader2,
  LogOut,
  Mail,
  MessageSquareText,
  Paperclip,
  PlayCircle,
  Plus,
  RefreshCw,
  Send,
  Tag,
  Timer,
  ArrowLeftRight,
  User,
  UserCheck,
  Users,
  WifiOff,
  Wrench,
  X,
  XCircle,
  Zap,
  ClipboardList,
  TestTube,
  ThumbsUp,
  ThumbsDown,
  BadgeCheck,
  KeyRound,
  FileText,
} from "lucide-react";
import ITHelpdeskService from "../../services/helpdesk/HelpdeskService";
import HelpdeskService from "../../services/helpdesk/HelpdeskService";
import ChangePasswordModal from "./ChangePasswordModal";

// ─── SESSION USER ─────────────────────────────────────────────────────────────
function getSessionUser() {
  try {
    const raw = sessionStorage.getItem("user");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function deriveRole(deptId) {
  if (deptId === 7) return "IT";
  if (deptId === 5) return "HR";
  return "User";
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// const CATALOG_CACHE_KEY = "enlife_hd_catalog_v2";

const CATEGORY_META = {
  software: {
    label: "Software",
    Icon: Zap,
    pill: "bg-violet-50 text-violet-700 border-violet-200",
    statuses: [
      "Open",
      "Requirement",
      "Discussion",
      "Acceptance",
      "In Progress",
      "IT Testing",
      "Ready for Demo",
      "User Testing",
      "Waiting for User Input",
      "Resolved",
      "Closed",
    ],
    flowType: "full",
  },
  erp: {
    label: "ERP Enhancement",
    Icon: Database,
    pill: "bg-cyan-50 text-cyan-700 border-cyan-200",
    statuses: [
      "Open",
      "Requirement",
      "Discussion",
      "Acceptance",
      "In Progress",
      "IT Testing",
      "Ready for Demo",
      "User Testing",
      "Waiting for User Input",
      "Resolved",
      "Closed",
    ],
    flowType: "full",
  },
  hardware: {
    label: "Hardware",
    Icon: HardDrive,
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    statuses: [
      "Open",
      "Acceptance",
      "In Progress",
      "Waiting for User Input",
      "Resolved",
      "Closed",
    ],
    flowType: "simple",
  },
  networking: {
    label: "Networking",
    Icon: WifiOff,
    pill: "bg-orange-50 text-orange-700 border-orange-200",
    statuses: [
      "Open",
      "Acceptance",
      "In Progress",
      "Waiting for User Input",
      "Resolved",
      "Closed",
    ],
    flowType: "simple",
  },
};

// HR statuses — Acceptance after Assigned, then In Progress
const HR_STATUSES = [
  "Open",
  "Queue",
  "Assigned",
  "Acceptance",
  "In Progress",
  "Resolved",
  "Closed",
];

const FULL_FLOW_CATEGORIES = ["software", "erp"];
const TESTING_STATUSES = ["IT Testing", "Ready for Demo", "User Testing"];

const STATUS_META = {
  Open: {
    dot: "bg-slate-400",
    txt: "text-slate-600",
    chip: "bg-slate-100 text-slate-600",
    Icon: Inbox,
  },
  Requirement: {
    dot: "bg-blue-400",
    txt: "text-blue-700",
    chip: "bg-blue-100 text-blue-700",
    Icon: ClipboardList,
  },
  Discussion: {
    dot: "bg-purple-400",
    txt: "text-purple-700",
    chip: "bg-purple-100 text-purple-700",
    Icon: MessageSquareText,
  },
  Queue: {
    dot: "bg-indigo-400",
    txt: "text-indigo-700",
    chip: "bg-indigo-100 text-indigo-700",
    Icon: List,
  },
  Assigned: {
    dot: "bg-blue-400",
    txt: "text-blue-700",
    chip: "bg-blue-100 text-blue-700",
    Icon: UserCheck,
  },
  Acceptance: {
    dot: "bg-sky-500",
    txt: "text-sky-700",
    chip: "bg-sky-100 text-sky-700",
    Icon: BadgeCheck,
  },
  "In Progress": {
    dot: "bg-blue-500",
    txt: "text-blue-700",
    chip: "bg-blue-100 text-blue-700",
    Icon: Clock3,
  },
  "On Hold": {
    dot: "bg-amber-500",
    txt: "text-amber-700",
    chip: "bg-amber-100 text-amber-700",
    Icon: AlertCircle,
  },
  "Waiting for User Input": {
    dot: "bg-orange-500",
    txt: "text-orange-700",
    chip: "bg-orange-100 text-orange-700",
    Icon: Timer,
  },
  "IT Testing": {
    dot: "bg-indigo-500",
    txt: "text-indigo-700",
    chip: "bg-indigo-100 text-indigo-700",
    Icon: FlaskConical,
  },
  "Ready for Demo": {
    dot: "bg-teal-500",
    txt: "text-teal-700",
    chip: "bg-teal-100 text-teal-700",
    Icon: PlayCircle,
  },
  "User Testing": {
    dot: "bg-amber-400",
    txt: "text-amber-700",
    chip: "bg-amber-100 text-amber-700",
    Icon: TestTube,
  },
  Resolved: {
    dot: "bg-emerald-500",
    txt: "text-emerald-700",
    chip: "bg-emerald-100 text-emerald-700",
    Icon: ThumbsUp,
  },
  Closed: {
    dot: "bg-slate-300",
    txt: "text-slate-400",
    chip: "bg-slate-100 text-slate-400",
    Icon: XCircle,
  },
};

const PRIORITIES = ["Critical", "Medium", "Normal"];
const PRIORITY_DETAILS = {
  Critical: "Impacting whole organisation",
  Medium: "Impacting multiple users",
  Normal: "Impacting single user",
};
const TICKET_TYPES = ["Service Request", "Incident"];

const HOLD_REASON_OPTIONS = [
  { value: "response_not_received", label: "Response Not Received" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "vendor_dependency", label: "Vendor Dependency" },
  { value: "other", label: "Other Issue" },
];

const PRIORITY_PILL = {
  Critical: "bg-red-100 text-red-700 border border-red-200",
  Medium: "bg-amber-100 text-amber-700 border border-amber-200",
  Normal: "bg-blue-100 text-blue-700 border border-blue-200",
};

const ORG_PILL = {
  IML: "bg-blue-100 text-blue-700 border border-blue-200",
  CSIL: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Daedalus: "bg-purple-100 text-purple-700 border border-purple-200",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmt = (d) =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  );
};
// Compute expected completion datetime for incidents (start date + ETA hours)
// Compute expected completion date for incidents (start date + ETA hours)
const addHoursToDate = (dateStr, hours) => {
  if (!dateStr || !hours) return null;
  const start = new Date(dateStr);
  if (isNaN(start.getTime())) return null;
  return new Date(start.getTime() + Number(hours) * 60 * 60 * 1000);
};

const fmtDateTime = (date) => {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  );
};
const daysBetween = (a, b) => {
  const d1 = new Date(a);
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(b);
  d2.setHours(0, 0, 0, 0);
  return Math.ceil((d2 - d1) / 86400000);
};
const getCatMeta = (id) => CATEGORY_META[id] || CATEGORY_META.software;

const parseAssignees = (str) =>
  str
    ? str
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

const parseCategoryStr = (str) => {
  const parts = (str || "").split(",");
  return {
    catalogParent: parts[0] || "",
    catalogCategory: parts[1] || "",
    catalogSubCategory: parts[2] || "",
  };
};
const buildCategoryStr = (parent, category, sub) =>
  [parent, category, sub].filter(Boolean).join(",");

function deriveCategory(parentName, categoryName) {
  const p = (parentName || "").toLowerCase();
  const c = (categoryName || "").toLowerCase();
  if (p.includes("hardware")) return "hardware";
  if (p.includes("network")) return "networking";
  if (p.includes("erp") || c.includes("erp") || c.includes("enhancement"))
    return "erp";
  return "software";
}

function etaBadge(etaDate, status) {
  if (status === "Closed")
    return {
      label: "Closed",
      cls: "bg-slate-100 text-slate-500 border border-slate-200",
    };
  if (!etaDate)
    return {
      label: "No ETA",
      cls: "bg-slate-100 text-slate-500 border border-slate-200",
    };
  const d = daysBetween(todayISO(), etaDate.slice?.(0, 10) || etaDate);
  if (d < 0)
    return {
      label: `Overdue ${Math.abs(d)}d`,
      cls: "bg-red-100 text-red-700 border border-red-200",
    };
  if (d === 0)
    return {
      label: "Due today",
      cls: "bg-orange-100 text-orange-700 border border-orange-200",
    };
  if (d <= 7)
    return {
      label: `${d}d left`,
      cls: "bg-amber-100 text-amber-700 border border-amber-200",
    };
  return {
    label: `${d}d left`,
    cls: "bg-slate-100 text-slate-600 border border-slate-200",
  };
}

function getStrikeGroups(strikes = []) {
  if (!strikes.length) return [];
  const groups = [];
  let cur = [];
  for (const s of strikes) {
    cur.push(s);
    if (cur.length === 3 && cur.every((x) => x.response_Received)) {
      groups.push([...cur]);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  return groups;
}

// ─── MAP API TICKET → UI TICKET ───────────────────────────────────────────────
function mapApiTicket(t) {
  const catParsed = parseCategoryStr(t.category || "");
  const derived = deriveCategory(
    catParsed.catalogParent,
    catParsed.catalogCategory,
  );

  // Normalize API status "Enrolled" → "Assigned" for consistent UI binding
  const rawStatus = t.status === "Enrolled" ? "Assigned" : t.status || "Open";

  return {
    id: t.ticket_Id,
    ticketNo: t.ticket_No || "",
    ticketDept: t.dept || "IT",
    userDept: t.user_Dept || "",
    description: t.description || "",
    category: derived,
    catalogParent: catParsed.catalogParent,
    catalogCategory: catParsed.catalogCategory,
    catalogSubCategory: catParsed.catalogSubCategory,
    submittedBy: t.submitted_By_Name || "",
    submittedByEmpId: String(t.submitted_By || ""),
    createdBy: t.created_By_Name || "",
    createdByEmpId: String(t.created_By || ""),
    onBehalfOf: "",
    priority: t.priority || null,
    ticketType: t.req_Type || null,
    requestType: t.req_Type || null,
    impact: t.impact || "user",
    status: rawStatus,
    submittedDate: t.submitted_At ? t.submitted_At.slice(0, 10) : "",
    submittedDateTime: t.submitted_At || null,
    itStartDate: t.start_Date ? t.start_Date.slice(0, 10) : null,
    etaDate: t.eta_Date ? t.eta_Date.slice(0, 10) : null,
    etaHours: t.eta_Time || null,
    closingDate: t.closing_Date ? t.closing_Date.slice(0, 10) : null,
    closingNote: "",
    updatedAt: t.updated_At || null,
    holdRemarks: "",
    holdReasonType: "",
    attachment: t.file_Name
      ? { name: t.file_Name, size: "", path: t.file_Path }
      : null,
    type: t.ticket_Type === "linked" ? "Linked Ticket" : "Ticket",
    parentId: t.parent_Ticket_Id || null,
    linkedTaskIds: [],
    enrolledByIT: t.status !== "Open",
    itAssignees: parseAssignees(t.assigned_Person_Name || ""),
    // ── Store all assignee IDs as strings for reliable ID-based matching ──
    itAssigneeIds: parseAssignees(String(t.assigned_Person || "")),
    itRemarks: t.remarks || "",
    org: t.org_Id || t.org || "IML",
    messages: [],
    strikes: [],
    statusHistory: [],
    autoClosedAfterStrikes: false,
    resolvedNote: "",
    userConfirmedResolved: false,
    acceptanceNote: "",
  };
}

// ─── CATALOG PARSE ────────────────────────────────────────────────────────────
function parseCatalog(items) {
  const itIncident = {},
    itService = {},
    hr = {};
  for (const item of items) {
    const { parentName, category, subCategory, reqType } = item;
    let bucket;
    if (reqType === "IT Incident") bucket = itIncident;
    else if (reqType === "IT Service") bucket = itService;
    else if (reqType === "HR") bucket = hr;
    else continue;
    if (!bucket[parentName]) bucket[parentName] = {};
    if (!bucket[parentName][category]) bucket[parentName][category] = [];
    if (subCategory) bucket[parentName][category].push(subCategory);
  }
  const toTree = (bucket) =>
    Object.entries(bucket).map(([parentName, cats]) => ({
      parentName,
      categories: Object.entries(cats).map(([name, subCategories]) => ({
        name,
        subCategories,
      })),
    }));
  return {
    itIncident: toTree(itIncident),
    itService: toTree(itService),
    hr: toTree(hr),
  };
}

// ─── NESTED CATALOG DROPDOWN ──────────────────────────────────────────────────
function NestedCatalogDropdown({
  tree,
  value,
  onChange,
  loading,
  accentColor = "slate",
}) {
  const [catOpen, setCatOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const catRef = useRef(null),
    subRef = useRef(null),
    itemRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (catRef.current && !catRef.current.contains(e.target))
        setCatOpen(false);
      if (subRef.current && !subRef.current.contains(e.target))
        setSubOpen(false);
      if (itemRef.current && !itemRef.current.contains(e.target))
        setItemOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const acc = {
    focus:
      accentColor === "indigo"
        ? "focus:border-indigo-400"
        : "focus:border-slate-400",
    hover:
      accentColor === "indigo" ? "hover:bg-indigo-50" : "hover:bg-slate-50",
    selected:
      accentColor === "indigo"
        ? "bg-indigo-50 text-indigo-700"
        : "bg-blue-50 text-blue-700",
    check: accentColor === "indigo" ? "text-indigo-500" : "text-blue-500",
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 py-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading catalog…
      </div>
    );
  if (!tree.length)
    return (
      <div className="text-xs text-slate-400 py-2 italic">
        No catalog items available.
      </div>
    );

  const allParents = tree.map((p) => p.parentName);
  const selectedParentObj = tree.find((p) => p.parentName === value.parentName);
  const allCategories = selectedParentObj?.categories || [];
  const isRootMode =
    allCategories.length === 1 && allCategories[0].name === value.parentName;
  const selectedCatObj = isRootMode
    ? allCategories[0]
    : allCategories.find((c) => c.name === value.categoryName);
  const allSubCats = (selectedCatObj?.subCategories || []).filter(
    (s) => s !== "Text Box",
  );

  const handleParentSelect = (p) => {
    const parentObj = tree.find((x) => x.parentName === p);
    const cats = parentObj?.categories || [];
    const isRoot = cats.length === 1 && cats[0].name === p;
    onChange({ parentName: p, categoryName: isRoot ? p : "", subCategory: "" });
    setCatOpen(false);
  };

  return (
    <div className="space-y-2">
      <div ref={catRef} className="relative">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
          Category
        </label>
        <button
          type="button"
          onClick={() => {
            setCatOpen((p) => !p);
            setSubOpen(false);
            setItemOpen(false);
          }}
          className={`w-full h-10 flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none transition-colors ${acc.focus} hover:border-slate-400`}
        >
          <span
            className={
              value.parentName
                ? "text-slate-800 font-semibold"
                : "text-slate-400"
            }
          >
            {value.parentName || "Select category…"}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${catOpen ? "rotate-180" : ""}`}
          />
        </button>
        {catOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto thin-scroll">
            {allParents.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleParentSelect(p)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${value.parentName === p ? acc.selected + " font-bold" : "text-slate-700 " + acc.hover}`}
              >
                <span>{p}</span>
                {value.parentName === p && (
                  <CheckCircle2 className={`w-3.5 h-3.5 ${acc.check}`} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {value.parentName && !isRootMode && allCategories.length > 0 && (
        <div ref={subRef} className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Sub-type
          </label>
          <button
            type="button"
            onClick={() => {
              setSubOpen((p) => !p);
              setItemOpen(false);
            }}
            className={`w-full h-10 flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none transition-colors ${acc.focus} hover:border-slate-400`}
          >
            <span
              className={
                value.categoryName
                  ? "text-slate-800 font-semibold"
                  : "text-slate-400"
              }
            >
              {value.categoryName || "Select sub-type…"}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${subOpen ? "rotate-180" : ""}`}
            />
          </button>
          {subOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto thin-scroll">
              {allCategories.map((c) => {
                const visibleSubs = c.subCategories.filter(
                  (s) => s !== "Text Box",
                );
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      onChange({
                        ...value,
                        categoryName: c.name,
                        subCategory: "",
                      });
                      setSubOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${value.categoryName === c.name ? acc.selected + " font-bold" : "text-slate-700 " + acc.hover}`}
                  >
                    <span className="flex-1 min-w-0 truncate">{c.name}</span>
                    <div className="flex items-center gap-1.5 flex-none ml-2">
                      {visibleSubs.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {visibleSubs.length} items
                        </span>
                      )}
                      {value.categoryName === c.name && (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${acc.check}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {(value.categoryName || (isRootMode && value.parentName)) &&
        allSubCats.length > 0 && (
          <div ref={itemRef} className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Specific item
            </label>
            <button
              type="button"
              onClick={() => setItemOpen((p) => !p)}
              className={`w-full h-10 flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none transition-colors ${acc.focus} hover:border-slate-400`}
            >
              <span
                className={
                  value.subCategory
                    ? "text-slate-800 font-semibold"
                    : "text-slate-400"
                }
              >
                {value.subCategory || "Select specific item… (optional)"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${itemOpen ? "rotate-180" : ""}`}
              />
            </button>
            {itemOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto thin-scroll">
                <button
                  type="button"
                  onClick={() => {
                    onChange({ ...value, subCategory: "" });
                    setItemOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2.5 text-left text-sm transition-colors border-b border-slate-100 ${!value.subCategory ? acc.selected + " font-bold" : "text-slate-400 " + acc.hover} italic`}
                >
                  None / Not sure
                </button>
                {allSubCats.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      onChange({ ...value, subCategory: sub });
                      setItemOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${value.subCategory === sub ? acc.selected + " font-bold" : "text-slate-700 " + acc.hover}`}
                  >
                    <span>{sub}</span>
                    {value.subCategory === sub && (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${acc.check}`} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      {value.parentName && (
        <div className="flex items-center gap-1 flex-wrap pt-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {value.parentName}
          </span>
          {value.categoryName && value.categoryName !== value.parentName && (
            <>
              <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {value.categoryName}
              </span>
            </>
          )}
          {value.subCategory && (
            <>
              <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                {value.subCategory}
              </span>
            </>
          )}
          <button
            onClick={() =>
              onChange({ parentName: "", categoryName: "", subCategory: "" })
            }
            className="ml-auto text-[10px] text-slate-400 hover:text-red-500 font-semibold"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ASSIGNEE DROPDOWN — SINGLE SELECT ───────────────────────────────────────
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

// ─── SHARED UI PRIMITIVES ─────────────────────────────────────────────────────
const ACCENT_CLS = {
  amber: "border-amber-200 bg-amber-50/70",
  emerald: "border-emerald-200 bg-emerald-50/70",
  red: "border-red-200 bg-red-50/70",
};
function Section({ title, subtitle, accent, children }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${ACCENT_CLS[accent] || "border-slate-200 bg-slate-50"}`}
    >
      <p className="text-sm font-extrabold text-slate-900">{title}</p>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-700 mt-0.5 truncate">
        {value}
      </p>
    </div>
  );
}
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
function HRPill({ small = false }) {
  if (small)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 flex-none">
        <Briefcase className="w-2.5 h-2.5" />
        HR
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
      <Briefcase className="w-3 h-3" />
      HR
    </span>
  );
}

const safeSheetName = (name, fallback = "Sheet") => {
  const cleaned = String(name || fallback)
    .replace(/[:\\/?*\[\]]/g, " - ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31);
  return cleaned || fallback;
};

function formatDiscussionsForExcel(ticketNo, messages) {
  console.log(`[Excel Export Log] Ticket No: ${ticketNo}`, {
    messagesReceived: messages,
    length: messages?.length || 0,
  });

  if (!messages || messages.length === 0) {
    return "";
  }

  const formatted = messages
    .map((m) => {
      const name = m.message_By_Name || m.senderName || "Unknown";
      const dateStr = m.message_At ? fmtTime(m.message_At) : "";
      const text = m.message_Text || m.text || "";
      return `${name}:${dateStr}:${text}`;
    })
    .join("\n");

  console.log(
    `[Excel Export Log] Formatted text for ${ticketNo}:\n`,
    formatted,
  );

  return formatted;
}

// ─── EXCEL DOWNLOAD ───────────────────────────────────────────────────────────
async function buildOngoingSheets(tickets, dept) {
  const deptTickets = tickets.filter(
    (t) => t.ticketDept === dept && t.status !== "Closed",
  );

  const ticketsWithDiscussions = await Promise.all(
    deptTickets.map(async (t) => {
      let msgs = t.messages || [];

      // If messages array is empty, fetch from API on-demand for export
      if (!msgs || msgs.length === 0) {
        try {
          console.log(
            `[Excel Export Log] Fetching discussions for ticket ${t.id} (${t.ticketNo})...`,
          );
          const res = await ITHelpdeskService.getDiscussions(t.id);
          msgs = res?.data || [];
          console.log(
            `[Excel Export Log] Received ${msgs.length} messages for ticket ${t.ticketNo}`,
          );
        } catch (err) {
          console.error(
            `[Excel Export Log] Failed to fetch discussions for ticket ${t.ticketNo}:`,
            err,
          );
          msgs = [];
        }
      }

      return {
        ...t,
        messages: msgs,
      };
    }),
  );

  const columns = [
    "Status",
    "Priority",
    "Ticket No",
    "Org",
    "Department",
    "User Department",
    "Description",
    "Category",
    "Catalog Parent",
    "Catalog Category",
    "Catalog Item",
    "Request Type",
    "Owner",
    "Owner Emp ID",
    "Submitted By",
    "Submitted By Emp ID",
    "Submitted Date",
    "Start Date",
    "ETA Date",
    "ETA Hours",
    "Assignees",
    "Remarks",
    "Attachment",
    "Discussions",
  ];

  const toRow = (t) => [
    t.status,
    t.priority || "",
    t.ticketNo || t.id,
    t.org,
    t.ticketDept === "HR" ? "HR" : "IT",
    t.userDept || "",
    t.description,
    t.ticketDept === "HR" ? "HR" : getCatMeta(t.category)?.label || t.category,
    t.catalogParent || "",
    t.catalogCategory || "",
    t.catalogSubCategory || "",
    t.requestType || "",
    t.createdBy || "",
    t.createdByEmpId || "",
    t.submittedBy || "",
    t.submittedByEmpId || "",
    t.submittedDate || "",
    t.itStartDate || "",
    t.etaDate || "",
    t.etaHours || "",
    t.itAssignees?.join(", ") || "",
    t.itRemarks || "",
    t.attachment?.name || "",
    formatDiscussionsForExcel(t.ticketNo || t.id, t.messages),
  ];

  const wb = XLSX.utils.book_new();
  const summaryData = [
    ["Helpdesk Ongoing Tickets Report"],
    ["Department", dept],
    ["Generated", new Date().toLocaleString("en-IN")],
    [],
    ["Status Breakdown", "Count"],
    ["Open", deptTickets.filter((t) => t.status === "Open").length],
    [
      "In Progress",
      deptTickets.filter((t) =>
        [
          "Requirement",
          "Discussion",
          "Assigned",
          "Acceptance",
          "In Progress",
          "IT Testing",
          "Ready for Demo",
          "User Testing",
          "Queue",
        ].includes(t.status),
      ).length,
    ],
    [
      "Waiting / On Hold",
      deptTickets.filter((t) =>
        ["Waiting for User Input", "On Hold"].includes(t.status),
      ).length,
    ],
    ["Resolved", deptTickets.filter((t) => t.status === "Resolved").length],
    [],
    ["Total Active", deptTickets.length],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs["!cols"] = [{ wch: 28 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  const data = [columns, ...ticketsWithDiscussions.map(toRow)];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  ws["!cols"] = [
    12, 10, 12, 8, 10, 10, 40, 15, 20, 20, 20, 14, 20, 10, 14, 14, 12, 10, 25,
    30, 20, 50,
  ].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName("All Ongoing Tickets"));
  return wb;
}

async function buildClosedSheet(tickets, dept, from, to) {
  const deptTickets = tickets.filter((t) => {
    if (t.ticketDept !== dept || t.status !== "Closed") return false;
    const d = t.submittedDate || "";
    return d >= from && d <= to;
  });

  const ticketsWithDiscussions = await Promise.all(
    deptTickets.map(async (t) => {
      let msgs = t.messages || [];

      // If messages array is empty, fetch from API on-demand for export
      if (!msgs || msgs.length === 0) {
        try {
          console.log(
            `[Excel Export Log] Fetching discussions for ticket ${t.id} (${t.ticketNo})...`,
          );
          const res = await ITHelpdeskService.getDiscussions(t.id);
          msgs = res?.data || [];
          console.log(
            `[Excel Export Log] Received ${msgs.length} messages for ticket ${t.ticketNo}`,
          );
        } catch (err) {
          console.error(
            `[Excel Export Log] Failed to fetch discussions for ticket ${t.ticketNo}:`,
            err,
          );
          msgs = [];
        }
      }

      return {
        ...t,
        messages: msgs,
      };
    }),
  );

  const columns = [
    "Status",
    "Priority",
    "Ticket No",
    "Org",
    "Department",
    "User Department",
    "Description",
    "Category",
    "Catalog Parent",
    "Catalog Category",
    "Catalog Item",
    "Request Type",
    "Submitted By",
    "Emp ID",
    "Submitted Date",
    "Start Date",
    "ETA Date",
    "ETA Hours",
    "Closing Date",
    "Closing Note",
    "Assignees",
    "Remarks",
    "Attachment",
    "Discussions",
  ];
  const toRow = (t) => {
    console.log("what is t", t);
    const daysToClose =
      t.submittedDate && t.closingDate
        ? daysBetween(t.submittedDate, t.closingDate)
        : "";
    return [
      t.status,
      t.priority || "",
      t.ticketNo || t.id,
      t.org,
      t.ticketDept === "HR" ? "HR" : "IT",
      t.userDept || "",
      t.description,
      t.ticketDept === "HR"
        ? "HR"
        : getCatMeta(t.category)?.label || t.category,
      t.catalogParent || "",
      t.catalogCategory || "",
      t.catalogSubCategory || "",
      t.requestType || "",
      t.createdBy,
      t.createdByEmpId || "",
      t.submittedDate || "",
      t.itStartDate || "",
      t.etaDate || "",
      t.etaHours || "",
      t.closingDate || "",
      t.closingNote || "",
      (t.itAssignees || []).join(", "),
      t.itRemarks || "",
      t.attachment?.name || "",
      formatDiscussionsForExcel(t.ticketNo || t.id, t.messages),
    ];
  };
  const wb = XLSX.utils.book_new();
  const summaryData = [
    ["Helpdesk Closed Tickets Report"],
    [`Department: ${dept}`],
    [`Date Range: ${from} to ${to}`],
    [`Generated: ${new Date().toLocaleString("en-IN")}`],
    [],
    ["Total Closed", deptTickets.length],
    ["Auto Closed", deptTickets.filter((t) => t.autoClosedAfterStrikes).length],
    [
      "Avg Days to Close",
      deptTickets.length
        ? (
            deptTickets.reduce((acc, t) => {
              if (t.submittedDate && t.closingDate)
                return acc + daysBetween(t.submittedDate, t.closingDate);
              return acc;
            }, 0) / deptTickets.length
          ).toFixed(1)
        : "N/A",
    ],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs["!cols"] = [{ wch: 28 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
  const data = [columns, ...ticketsWithDiscussions.map(toRow)];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  ws["!cols"] = [
    10, 10, 12, 8, 10, 10, 40, 15, 20, 20, 20, 14, 20, 10, 14, 14, 12, 10, 14,
    35, 25, 30, 20, 12, 10, 50,
  ].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, "Closed Tickets");
  return wb;
}

// ─── EXCEL DOWNLOAD MODAL ─────────────────────────────────────────────────────
function ExcelDownloadModal({ onClose, tickets, dept }) {
  const [mode, setMode] = useState(null);
  const [fromDate, setFrom] = useState("");
  const [toDate, setTo] = useState(todayISO());
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setError("");
    setDownloading(true);

    try {
      if (mode === "ongoing") {
        const wb = await buildOngoingSheets(tickets, dept);
        XLSX.writeFile(wb, `Helpdesk_${dept}_Ongoing_${todayISO()}.xlsx`);
        onClose();
      } else if (mode === "closed") {
        if (!fromDate) {
          setError("Please select a start date.");
          setDownloading(false);
          return;
        }
        if (fromDate > toDate) {
          setError("Start date must be before end date.");
          setDownloading(false);
          return;
        }
        const wb = await buildClosedSheet(tickets, dept, fromDate, toDate);
        XLSX.writeFile(
          wb,
          `Helpdesk_${dept}_Closed_${fromDate}_to_${toDate}.xlsx`,
        );
        onClose();
      }
    } catch (err) {
      console.error("[Excel Export Log] Download failed:", err);
      setError("Failed to export Excel file. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mini-modal p-6" style={{ maxWidth: "420px" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-slate-700" />
              Download Excel Report
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {dept} Helpdesk · Select report type
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            {
              key: "ongoing",
              label: "Ongoing Tickets",
              desc: "Open, In Progress, Waiting",
              icon: "🔄",
              active: "border-blue-500 bg-blue-50 ring-2 ring-blue-100",
              idle: "border-slate-200 bg-white hover:border-slate-300",
            },
            {
              key: "closed",
              label: "Closed Tickets",
              desc: "Select date range",
              icon: "✅",
              active:
                "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100",
              idle: "border-slate-200 bg-white hover:border-slate-300",
            },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setMode(opt.key);
                setError("");
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${mode === opt.key ? opt.active : opt.idle}`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <div>
                <p className="text-sm font-bold text-slate-700">{opt.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
              </div>
              {mode === opt.key && (
                <CheckCircle2 className="w-4 h-4 text-current" />
              )}
            </button>
          ))}
        </div>
        {mode === "closed" && (
          <div className="space-y-3 mb-4 p-3 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Date Range (Submitted Date)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:border-emerald-400"
                />
              </Field>
              <Field label="To">
                <input
                  type="date"
                  value={toDate}
                  max={todayISO()}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:border-emerald-400"
                />
              </Field>
            </div>
          </div>
        )}
        {error && (
          <p className="mb-3 text-xs text-red-600 font-semibold">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={!mode}
            className={`flex-1 h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 ${dept === "HR" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-900 hover:bg-slate-800"}`}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── REQUEST TYPE SELECTOR ────────────────────────────────────────────────────
function RequestTypeSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        {
          value: "Service Request",
          label: "Service Request",
          desc: "New requirements, installations, access",
          Icon: Zap,
          active: "border-sky-500 bg-sky-50 ring-2 ring-sky-200",
          idle: "border-sky-200 bg-sky-50/50 hover:bg-sky-50",
          iconCls: "text-sky-600",
          labelCls: "text-sky-900",
          descCls: "text-sky-600",
        },
        {
          value: "Incident",
          label: "Incident",
          desc: "Something broken or not working",
          Icon: AlertCircle,
          active: "border-red-500 bg-red-50 ring-2 ring-red-200",
          idle: "border-red-200 bg-red-50/50 hover:bg-red-50",
          iconCls: "text-red-600",
          labelCls: "text-red-900",
          descCls: "text-red-600",
        },
      ].map((rt) => {
        const isSel = value === rt.value;
        return (
          <button
            key={rt.value}
            type="button"
            onClick={() => onChange(rt.value)}
            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${isSel ? rt.active : rt.idle + " border-transparent"}`}
          >
            <rt.Icon
              className={`w-5 h-5 flex-none mt-0.5 ${isSel ? rt.iconCls : "text-slate-400"}`}
            />
            <div className="min-w-0">
              <p
                className={`text-sm font-bold leading-tight ${isSel ? rt.labelCls : "text-slate-800"}`}
              >
                {rt.label}
              </p>
              <p
                className={`text-[11px] mt-0.5 leading-tight ${isSel ? rt.descCls : "text-slate-500"}`}
              >
                {rt.desc}
              </p>
            </div>
            {isSel && (
              <CheckCircle2
                className={`w-4 h-4 flex-none ml-auto ${rt.iconCls}`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── PRIORITY SELECTOR ────────────────────────────────────────────────────────
function PrioritySelector({ value, onChange, error }) {
  return (
    <Field label="Priority" error={error}>
      <div className="flex gap-2">
        {PRIORITIES.map((p) => {
          const isSel = value === p;
          const cfg = {
            Critical: {
              base: "border-red-200 bg-red-50/60 hover:bg-red-50",
              active: "border-red-500 bg-red-50 ring-2 ring-red-100",
              txt: "text-red-700",
              detail: "text-red-500",
            },
            Medium: {
              base: "border-amber-200 bg-amber-50/60 hover:bg-amber-50",
              active: "border-amber-500 bg-amber-50 ring-2 ring-amber-100",
              txt: "text-amber-700",
              detail: "text-amber-500",
            },
            Normal: {
              base: "border-blue-200 bg-blue-50/60 hover:bg-blue-50",
              active: "border-blue-500 bg-blue-50 ring-2 ring-blue-100",
              txt: "text-blue-700",
              detail: "text-blue-500",
            },
          }[p];
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`flex-1 rounded-xl border-2 px-2 py-2 text-left transition-all ${isSel ? cfg.active : cfg.base}`}
            >
              <p className={`text-xs font-bold ${cfg.txt}`}>{p}</p>
              {isSel && (
                <p className={`text-[10px] mt-0.5 leading-tight ${cfg.detail}`}>
                  {PRIORITY_DETAILS[p]}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

function SearchableUserDropdown({
  value,
  onChange,
  label = "On behalf of",
  error,
  users = [],
  loading = false,
  placeholder = "Search employee name / number / email",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const name = (u.emp_Name || u.empName || "").toLowerCase();
      const no = String(u.emp_No || u.empNo || "").toLowerCase();
      const email = (u.emp_Email || u.empEmail || "").toLowerCase();
      return name.includes(q) || no.includes(q) || email.includes(q);
    });
  }, [users, query]);

  const selectedName =
    value?.emp_Name ||
    value?.empName ||
    [value?.firstName, value?.lastName].filter(Boolean).join(" ") ||
    "";

  const getOrgPillClass = (org) => {
    switch (org) {
      case "IML":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "CSIL":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "Daedalus":
        return "bg-purple-100 text-purple-700 border border-purple-200";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

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
              !selectedName ? "text-slate-400" : "text-slate-800 font-semibold"
            }
          >
            {!selectedName ? "Select employee (optional)" : selectedName}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="p-2 border-b border-slate-100 bg-slate-50">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="max-h-64 overflow-y-auto thin-scroll">
              {loading ? (
                <div className="px-3 py-4 text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading users...
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(null);
                      setQuery("");
                      setOpen(false);
                    }}
                    className={`w-full flex items-center px-3 py-2.5 text-left text-sm transition-colors border-b border-slate-100 ${
                      !value
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-400 hover:bg-slate-50"
                    } italic`}
                  >
                    None (self)
                  </button>

                  {filteredUsers.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-slate-400 text-center">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const userId = user.emp_Id || user.empId;
                      const isSelected =
                        String(value?.emp_Id || value?.empId || "") ===
                        String(userId);

                      const userName =
                        user.emp_Name ||
                        user.empName ||
                        [user.firstName, user.lastName]
                          .filter(Boolean)
                          .join(" ");

                      const userNo = user.emp_No || user.empNo;
                      const userEmail = user.emp_Email || user.empEmail;
                      const userOrg = user.org_Id || user.orgId;
                      const initials = (userName || "?")
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <button
                          key={userId}
                          type="button"
                          onClick={() => {
                            onChange(user);
                            setQuery("");
                            setOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${
                            isSelected ? "bg-blue-50" : ""
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-11px font-black flex-none ${
                              isSelected
                                ? "bg-blue-500 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`font-semibold ${isSelected ? "text-blue-700" : "text-slate-700"}`}
                              >
                                {userName}
                              </span>
                              {userNo ? (
                                <span className="text-10px font-bold mono text-slate-400">
                                  {userNo}
                                </span>
                              ) : null}
                              {userOrg ? (
                                <span
                                  className={`text-10px font-bold px-1.5 py-0.5 rounded-full ${
                                    getOrgPillClass[userOrg] ||
                                    "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {userOrg}
                                </span>
                              ) : null}
                            </div>
                            {userEmail ? (
                              <div className="text-11px text-slate-400 truncate">
                                {userEmail}
                              </div>
                            ) : null}
                          </div>

                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-none" />
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}

// ─── CREATE IT MODAL ──────────────────────────────────────────────────────────
function CreateITModal({
  catalogTree,
  catalogLoading,
  currentUser,
  onClose,
  onSubmit,
  submitting,
  isIT,
}) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    requestType: "Service Request",
    catalogValue: { parentName: "", categoryName: "", subCategory: "" },
    priority: "",
    type: "Ticket",
    parentId: "",
    description: "",
    attachment: null,
    onBehalfUser: null,
  });
  const [errors, setErrors] = useState({});

  const activeCatalogTree = useMemo(
    () =>
      form.requestType === "Incident"
        ? catalogTree.itIncident || []
        : catalogTree.itService || [],
    [form.requestType, catalogTree],
  );

  const handleRequestTypeChange = (v) => {
    setForm((p) => ({
      ...p,
      requestType: v,
      catalogValue: { parentName: "", categoryName: "", subCategory: "" },
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.catalogValue.parentName)
      errs.catalog = "Please select a category.";
    if (!form.description.trim()) errs.description = "Description required.";
    if (!form.priority) errs.priority = "Priority required.";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const [helpdeskUsers, setHelpdeskUsers] = useState([]);
  const [helpdeskUsersLoading, setHelpdeskUsersLoading] = useState(false);

  useEffect(() => {
    if (!isIT) return;

    setHelpdeskUsersLoading(true);
    ITHelpdeskService.getUsersForHD()
      .then((res) => setHelpdeskUsers(res?.data || []))
      .catch((e) => console.error("Helpdesk users fetch error", e))
      .finally(() => setHelpdeskUsersLoading(false));
  }, []);

  const handleSubmit = () => {
    if (!validate()) return;
    const catStr = buildCategoryStr(
      form.catalogValue.parentName,
      form.catalogValue.categoryName,
      form.catalogValue.subCategory,
    );
    onSubmit({
      ticketDept: "IT",
      description: form.description.trim(),
      categoryStr: catStr,
      requestType: form.requestType,
      ticketType: form.requestType,
      priority: form.priority,
      impact: "user",
      type: form.type,
      parentId:
        form.type === "Linked Ticket" && form.parentId
          ? Number(form.parentId)
          : null,
      attachment: form.attachment,
      onBehalfUser: form.onBehalfUser,
    });
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth: "540px" }}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-none">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-700" />
              Raise IT Ticket
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submitting as{" "}
              <span className="font-bold text-slate-700">
                {currentUser.emp_Name}
              </span>{" "}
              · #{currentUser.emp_No}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto thin-scroll flex-1 p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Request Type
            </label>
            <RequestTypeSelector
              value={form.requestType}
              onChange={handleRequestTypeChange}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Select Category
            </label>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <NestedCatalogDropdown
                tree={activeCatalogTree}
                value={form.catalogValue}
                onChange={(v) => setForm((p) => ({ ...p, catalogValue: v }))}
                loading={catalogLoading}
              />
            </div>
            {errors.catalog && (
              <p className="mt-1.5 text-xs text-red-600 font-semibold">
                {errors.catalog}
              </p>
            )}
          </div>
          <Field
            label="Description / Request Details"
            error={errors.description}
          >
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Clearly describe the request, affected system, scope, and urgency."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400 resize-none"
            />
          </Field>
          <PrioritySelector
            value={form.priority}
            onChange={(v) => setForm((p) => ({ ...p, priority: v }))}
            error={errors.priority}
          />
          <Field label="Ticket Type">
            <div className="grid grid-cols-2 gap-2">
              {["Ticket", "Linked Ticket"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      type,
                      parentId: type === "Linked Ticket" ? p.parentId : "",
                    }))
                  }
                  className={`h-10 rounded-xl border text-sm font-bold transition-colors ${form.type === type ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </Field>
          {isIT && (
            <SearchableUserDropdown
              label="On behalf of"
              value={form.onBehalfUser}
              users={helpdeskUsers}
              onChange={(user) =>
                setForm((p) => ({ ...p, onBehalfUser: user }))
              }
              placeholder="Search employee name / number"
              optional
            />
          )}
          {/* <Field label="Attachment (optional)">
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex items-center gap-3 rounded-xl border-2 border-dashed cursor-pointer px-4 py-3 transition-all ${form.attachment ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"}`}
            >
              <Paperclip
                className={`w-4 h-4 flex-none ${form.attachment ? "text-blue-500" : "text-slate-400"}`}
              />
              {form.attachment ? (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-700 truncate">
                    {form.attachment.name}
                  </p>
                  <p className="text-xs text-blue-400 mono">
                    {(form.attachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Click to attach
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    PDF, DOCX, XLSX, images
                  </p>
                </div>
              )}
              {form.attachment && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setForm((p) => ({ ...p, attachment: null }));
                  }}
                  className="p-1 rounded text-blue-400 hover:text-blue-600 flex-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setForm((p) => ({ ...p, attachment: f }));
              }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
            />
          </Field> */}
        </div>
        <div className="flex-none border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Submitted as{" "}
            <span className="font-semibold text-slate-600">
              {currentUser.emp_Name}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-10 px-5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Raise IT Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CREATE HR MODAL ──────────────────────────────────────────────────────────
function CreateHRModal({
  catalogTree,
  catalogLoading,
  currentUser,
  onClose,
  onSubmit,
  submitting,
}) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    catalogValue: { parentName: "", categoryName: "", subCategory: "" },
    priority: "",
    description: "",
    attachment: null,
  });
  const [errors, setErrors] = useState({});
  const hrTree = catalogTree.hr || [];

  const validate = () => {
    const errs = {};
    if (!form.description.trim()) errs.description = "Description required.";
    if (!form.catalogValue.parentName)
      errs.catalog = "Please select a category.";
    if (!form.priority) errs.priority = "Priority required.";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const catStr = buildCategoryStr(
      form.catalogValue.parentName,
      form.catalogValue.categoryName,
      form.catalogValue.subCategory,
    );
    onSubmit({
      ticketDept: "HR",
      description: form.description.trim(),
      categoryStr: catStr,
      requestType: "Service Request",
      ticketType: "Service Request",
      priority: form.priority,
      impact: "general_inquiry",
      type: "Ticket",
      parentId: null,
      attachment: form.attachment,
    });
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth: "540px" }}>
        <div className="flex items-center justify-between border-b border-indigo-100 px-6 py-4 flex-none bg-indigo-50/50">
          <div>
            <h2 className="text-base font-extrabold text-indigo-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Raise HR Ticket
            </h2>
            <p className="text-xs text-indigo-400 mt-0.5">
              Submitting as{" "}
              <span className="font-bold text-indigo-700">
                {currentUser.emp_Name}
              </span>{" "}
              · #{currentUser.emp_No}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto thin-scroll flex-1 p-6 space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Select HR Category
            </p>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3">
              <NestedCatalogDropdown
                tree={hrTree}
                value={form.catalogValue}
                onChange={(v) => setForm((p) => ({ ...p, catalogValue: v }))}
                loading={catalogLoading}
                accentColor="indigo"
              />
            </div>
            {errors.catalog && (
              <p className="mt-1.5 text-xs text-red-600 font-semibold">
                {errors.catalog}
              </p>
            )}
          </div>
          <Field
            label="Description / Request Details"
            error={errors.description}
          >
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Describe the HR request, employee name, and relevant details."
              className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none"
            />
          </Field>
          <PrioritySelector
            value={form.priority}
            onChange={(v) => setForm((p) => ({ ...p, priority: v }))}
            error={errors.priority}
          />
          <Field label="Attachment (optional)">
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex items-center gap-3 rounded-xl border-2 border-dashed cursor-pointer px-4 py-3 transition-all ${form.attachment ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/50"}`}
            >
              <Paperclip
                className={`w-4 h-4 flex-none ${form.attachment ? "text-indigo-500" : "text-slate-400"}`}
              />
              {form.attachment ? (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-indigo-700 truncate">
                    {form.attachment.name}
                  </p>
                  <p className="text-xs text-indigo-400 mono">
                    {(form.attachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Click to attach
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    PDF, DOCX, images
                  </p>
                </div>
              )}
              {form.attachment && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setForm((p) => ({ ...p, attachment: null }));
                  }}
                  className="p-1 rounded text-indigo-400 hover:text-indigo-600 flex-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setForm((p) => ({ ...p, attachment: f }));
              }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
            />
          </Field>
        </div>
        <div className="flex-none border-t border-indigo-100 px-6 py-4 flex items-center justify-between gap-3 bg-indigo-50/30">
          <p className="text-xs text-indigo-400">
            Submitted as{" "}
            <span className="font-semibold text-indigo-700">
              {currentUser.emp_Name}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-10 px-5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Raise HR Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const isResolvedOlderThan3Days = (ticket) => {
  if (!ticket || ticket.status !== "Resolved" || !ticket.updatedAt)
    return false;

  const updatedTime = new Date(ticket.updatedAt).getTime();
  if (Number.isNaN(updatedTime)) return false;

  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  return Date.now() - updatedTime > threeDaysMs;
};

// ─── TICKET CARD ──────────────────────────────────────────────────────────────
function TicketCard({ ticket, active, onClick, currentUser }) {
  const isHRTicket = ticket.ticketDept === "HR";
  const cat =
    !isHRTicket && ticket.category ? getCatMeta(ticket.category) : null;
  const badge = etaBadge(ticket.etaDate, ticket.status);
  const groups = getStrikeGroups(ticket.strikes || []);
  const ag =
    groups.length > 0 &&
    !groups[groups.length - 1].every((s) => s.response_Received)
      ? groups[groups.length - 1]
      : null;
  // ── ID-based assignment check ──────────────────────────────────────────────
  const isAssigned =
    currentUser && ticket.itAssigneeIds?.includes(String(currentUser.emp_Id));

  const isResolvedStale = isResolvedOlderThan3Days(ticket);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border bg-white p-2.5 text-left shadow-sm transition-all duration-150 ${
        active
          ? "border-slate-800 ring-2 ring-slate-200 shadow-md"
          : isResolvedStale
            ? "border-red-500 hover:border-red-600 hover:shadow"
            : "border-slate-200 hover:border-slate-300 hover:shadow"
      }`}
    >
      <span
        className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-none mb-1 ${ORG_PILL[ticket.org] || "bg-slate-100 text-slate-600"}`}
      >
        {ticket.ticketNo}
      </span>
      <div className="flex items-center gap-1 mb-1.5 flex-wrap">
        <span
          className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-none ${ORG_PILL[ticket.org] || "bg-slate-100 text-slate-600"}`}
        >
          {ticket.org}
        </span>
        {isHRTicket ? (
          <HRPill small />
        ) : cat ? (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-none ${cat.pill}`}
          >
            <cat.Icon className="w-2.5 h-2.5" />
            {cat.label}
          </span>
        ) : null}
        {ticket.requestType && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-none ${ticket.requestType === "Incident" ? "bg-red-100 text-red-700 border border-red-200" : "bg-sky-100 text-sky-700 border border-sky-200"}`}
          >
            {ticket.requestType}
          </span>
        )}
        {ticket.priority && (
          <span
            className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-none ${PRIORITY_PILL[ticket.priority] || "bg-slate-100 text-slate-600"}`}
          >
            {ticket.priority}
          </span>
        )}
      </div>
      <p className="text-[13px] font-semibold text-slate-800 truncate mb-1">
        {ticket.description}
      </p>
      {(ticket.catalogParent || ticket.catalogCategory) && (
        <div className="flex items-center gap-1 mb-1 flex-wrap">
          {ticket.catalogParent && (
            <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-slate-100 text-slate-500 truncate max-w-[80px]">
              {ticket.catalogParent}
            </span>
          )}
          {ticket.catalogSubCategory && (
            <>
              <ChevronRight className="w-2 h-2 text-slate-300" />
              <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-emerald-50 text-emerald-600 truncate max-w-[80px]">
                {ticket.catalogSubCategory}
              </span>
            </>
          )}
        </div>
      )}
      <div className="flex items-center gap-1.5 text-[10px]">
        <User className="w-2.5 h-2.5 text-slate-400 flex-none" />
        <span className="text-slate-500 truncate flex-1 min-w-0">
          {ticket.createdBy}
        </span>
        <span
          className={`font-semibold px-1.5 py-0.5 rounded-full flex-none ${badge.cls}`}
        >
          {badge.label}
        </span>
      </div>
      {ticket.itAssignees?.length > 0 && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
          <UserCheck className="w-2.5 h-2.5" />
          <span className={isAssigned ? "text-blue-600 font-semibold" : ""}>
            {ticket.itAssignees.join(", ")}
          </span>
        </div>
      )}
      {ag && ag.length > 0 && ag.every((s) => !s.response_Received) && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-orange-700 bg-orange-50 rounded-lg px-2 py-1 border border-orange-200">
          <Bell className="w-2.5 h-2.5" />
          {ag.length}/3 follow-ups · no response
        </div>
      )}
      {ticket.messages?.length > 0 && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
          <MessageSquareText className="w-2.5 h-2.5" />
          <span>
            {ticket.messages.length} msg
            {ticket.messages.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
      <div className="mt-1">
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${(STATUS_META[ticket.status] || STATUS_META["Open"]).chip}`}
        >
          {ticket.status}
        </span>
      </div>
    </button>
  );
}

// ─── USER DASHBOARD ───────────────────────────────────────────────────────────
const USER_PAGE_SIZE = 5;
function UserDashboard({
  currentUser,
  tickets,
  ticketsLoading,
  onSelectTicket,
  selectedId,
  onCreateITTicket,
  onCreateHRTicket,
  onLogout,
}) {
  const [page, setPage] = useState(1);
  const myTickets = tickets.filter(
    (t) =>
      t.submittedByEmpId === String(currentUser.emp_Id) ||
      t.submittedBy === currentUser.emp_Name,
  );
  const stats = {
    total: myTickets.length,
    open: myTickets.filter((t) => t.status === "Open").length,
    inProgress: myTickets.filter((t) =>
      [
        "In Progress",
        "Requirement",
        "Discussion",
        "Acceptance",
        "IT Testing",
        "Ready for Demo",
        "User Testing",
        "Queue",
        "Assigned",
      ].includes(t.status),
    ).length,
    waiting: myTickets.filter((t) => t.status === "Waiting for User Input")
      .length,
    resolved: myTickets.filter((t) => t.status === "Resolved").length,
    closed: myTickets.filter((t) => t.status === "Closed").length,
  };
  const totalPages = Math.max(1, Math.ceil(myTickets.length / USER_PAGE_SIZE));
  const paginated = myTickets.slice(
    (page - 1) * USER_PAGE_SIZE,
    page * USER_PAGE_SIZE,
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="flex-none border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-5 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-none">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                  Helpdesk · My Tickets
                </h1>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  {/* Enlife System ·{" "} */}
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded-full text-[10px] ${ORG_PILL[currentUser.org_Id] || ""}`}
                  >
                    {currentUser.org_Id}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 border border-teal-200 bg-teal-50">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black bg-teal-500 text-white">
                  {currentUser.emp_Name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-none">
                    {currentUser.emp_Name}
                  </p>
                  <p className="text-[10px] font-semibold text-teal-600">
                    #{currentUser.emp_No}
                  </p>
                </div>
              </div>
              <button
                onClick={onCreateITTicket}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 sm:px-4 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">IT </span>Ticket
              </button>
              {/* <button
                onClick={onCreateHRTicket}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 sm:px-4 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">HR </span>Ticket
              </button> */}
              <button
                onClick={onLogout}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-5">
          {[
            { l: "Total", v: stats.total, t: "slate" },
            { l: "Open", v: stats.open, t: "slate" },
            { l: "In Progress", v: stats.inProgress, t: "blue" },
            { l: "Waiting", v: stats.waiting, t: "orange" },
            { l: "Resolved", v: stats.resolved, t: "emerald" },
            { l: "Closed", v: stats.closed, t: "slate" },
          ].map((s) => (
            <div
              key={s.l}
              className={`rounded-2xl border px-3 py-2.5 ${s.t === "blue" ? "bg-blue-50 border-blue-200 text-blue-700" : s.t === "orange" ? "bg-orange-50 border-orange-200 text-orange-700" : s.t === "emerald" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-700"}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                {s.l}
              </p>
              <p className="text-xl sm:text-2xl font-extrabold leading-none mt-1">
                {s.v}
              </p>
            </div>
          ))}
        </div>
        {ticketsLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            Loading tickets…
          </div>
        ) : myTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
              <Inbox className="w-10 h-10 opacity-40" />
            </div>
            <p className="text-xl font-extrabold text-slate-700 mb-1">
              No tickets yet
            </p>
            <p className="text-sm text-slate-400 mb-8">
              Raise a new ticket to get started.
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <button
                onClick={onCreateITTicket}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:border-slate-400 p-6 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-600 flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-extrabold text-slate-800">
                    Raise IT Ticket
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hardware, software, network
                  </p>
                </div>
              </button>
              {/* <button
                onClick={onCreateHRTicket}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50 hover:border-indigo-400 p-6 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-extrabold text-indigo-800">
                    Raise HR Ticket
                  </p>
                  <p className="text-xs text-indigo-400 mt-0.5">
                    Payroll, attendance, HR
                  </p>
                </div> 
              </button>*/}
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginated.map((t) => {
                const isHR = t.ticketDept === "HR";
                const cat = !isHR ? getCatMeta(t.category) : null;
                const sm = STATUS_META[t.status] || STATUS_META["Open"];
                const badge = etaBadge(t.etaDate, t.status);
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className={`w-full text-left rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${selectedId === t.id ? "border-slate-800 ring-2 ring-slate-200" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${ORG_PILL[t.org] || ""}`}
                          >
                            {t.org}
                          </span>
                          {isHR ? (
                            <HRPill />
                          ) : (
                            cat && (
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cat.pill}`}
                              >
                                {cat.label}
                              </span>
                            )
                          )}
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sm.chip}`}
                          >
                            {t.status}
                          </span>
                          {t.priority && (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ml-auto ${PRIORITY_PILL[t.priority] || ""}`}
                            >
                              {t.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-800 mb-1">
                          {t.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {fmt(t.submittedDateTime)}
                          </span>
                          {t.itAssignees?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              {t.itAssignees.join(", ")}
                            </span>
                          )}
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200 flex-wrap gap-3">
                <p className="text-xs text-slate-500 font-medium">
                  Showing {(page - 1) * USER_PAGE_SIZE + 1}–
                  {Math.min(page * USER_PAGE_SIZE, myTickets.length)} of{" "}
                  {myTickets.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pg) => (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pg === page ? "bg-slate-900 text-white border border-slate-900" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        {pg}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── TICKET MODAL ─────────────────────────────────────────────────────────────
function TicketModal({
  ticket,
  currentUser,
  isIT,
  isHR,
  canAct,
  onClose,
  enrollForm,
  setEnrollForm,
  enrollErrors,
  onEnroll,
  enrollLoading,
  onMoveStatus,
  onPutOnHold,
  onWaitingForUserInput,
  onOpenResolutionFeedback,
  onResolveTicket,
  onAcceptanceTicket,
  strikeForm,
  setStrikeForm,
  strikeErrors,
  onSendStrike,
  responseForm,
  setResponseForm,
  onMarkResponse,
  onAutoClose,
  newMsg,
  setNewMsg,
  onSendMsg,
  msgLoading,
  onReassign,
  onEditType,
  onEditPriority,
  detailLoading,
  employees,
  catalogTree,
  catalogLoading,
  onCloseTicket,
}) {
  const [tab, setTab] = useState("details");
  const isHRTicket = ticket.ticketDept === "HR";
  const cat =
    !isHRTicket && ticket.category ? getCatMeta(ticket.category) : null;
  const sm = STATUS_META[ticket.status] || STATUS_META["Open"];
  const badge = etaBadge(ticket.etaDate, ticket.status);
  const isClosed = ticket.status === "Closed";
  const isResolved = ticket.status === "Resolved";
  const canCloseResolvedTicket = isResolvedOlderThan3Days(ticket);
  const isAcceptance = ticket.status === "Acceptance";
  const isOnHold = ticket.status === "On Hold";
  const isWaiting = ticket.status === "Waiting for User Input";
  const isAssigned = ticket.status === "Assigned";
  const catFlow = isHRTicket ? HR_STATUSES : cat ? cat.statuses : [];
  const curIdx = catFlow.indexOf(ticket.status);
  const endRef = useRef(null);
  const isIncident = ticket.requestType === "Incident";
  const isFullFlowIT =
    !isHRTicket && FULL_FLOW_CATEGORIES.includes(ticket.category);
  const isReadOnly = (isIT || isHR) && !canAct && ticket.enrolledByIT;

  const [discussionFile, setDiscussionFile] = useState(null);
  const discFileRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setDiscussionFile(files[0]);
    }
  };

  const isTicketOwner =
    String(ticket.createdByEmpId || "") ===
    String(currentUser.empId || currentUser.emp_Id || "");
  // ||      ticket.submittedBy === currentUser.empName;

  useEffect(() => {
    setTab("details");
  }, [ticket.id]);
  useEffect(() => {
    if (tab === "discussion")
      endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.messages, tab]);

  const enrollActiveCatalogTree = useMemo(() => {
    if (isHRTicket) return catalogTree?.hr || [];
    return enrollForm.ticketType === "Incident"
      ? catalogTree?.itIncident || []
      : catalogTree?.itService || [];
  }, [enrollForm.ticketType, catalogTree, isHRTicket]);

  const handleEnrollRequestTypeChange = (v) => {
    setEnrollForm((f) => ({
      ...f,
      ticketType: v,
      enrollCatalogValue: { parentName: "", categoryName: "", subCategory: "" },
    }));
  };

  const nextStatuses =
    canAct &&
    !isClosed &&
    !isResolved &&
    !isAcceptance &&
    !isOnHold &&
    !isWaiting &&
    !isAssigned
      ? catFlow.filter(
          (s, i) =>
            i > curIdx &&
            s !== "Closed" &&
            s !== "Resolved" &&
            s !== "Acceptance" &&
            s !== "Waiting for User Input" &&
            s !== "On Hold" &&
            s !== "Open",
        )
      : [];

  const allStrikes = ticket.strikes || [];
  const groups = getStrikeGroups(allStrikes);
  const activeGroup =
    groups.length > 0 &&
    !groups[groups.length - 1].every((s) => s.response_Received)
      ? groups[groups.length - 1]
      : [];
  const canSendNext = isWaiting && activeGroup.length < 3;
  const allActiveNoReply =
    activeGroup.length === 3 && activeGroup.every((s) => !s.response_Received);
  const prevGroups = groups.length > 1 ? groups.slice(0, -1) : [];
  const lastGroupAllDone =
    groups.length > 0 &&
    groups[groups.length - 1].every((s) => s.response_Received);

  console.log("enrollForm", enrollForm);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        {/* Header */}
        <div className="flex-none border-b border-slate-100 px-4 sm:px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span
                  className={`text-[11px] font-bold px-2 py-1 rounded-full ${ORG_PILL[ticket.org] || "bg-slate-100 text-slate-600"}`}
                >
                  {ticket.org}
                </span>
                {isHRTicket ? (
                  <HRPill />
                ) : (
                  cat && (
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cat.pill}`}
                    >
                      <cat.Icon className="w-3 h-3" />
                      {cat.label}
                    </span>
                  )
                )}
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${sm.chip}`}
                >
                  {ticket.status}
                </span>
                {ticket.requestType && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${isIncident ? "bg-red-100 text-red-700 border-red-200" : "bg-sky-100 text-sky-700 border-sky-200"}`}
                  >
                    {ticket.requestType}
                  </span>
                )}
                {ticket.priority && (
                  <span
                    className={`text-[11px] font-bold px-2 py-1 rounded-md ${PRIORITY_PILL[ticket.priority] || ""}`}
                  >
                    {ticket.priority}
                  </span>
                )}
                {/* {ticket.ticketNo && (
                  <span className="text-[10px] font-bold text-black px-2 py-1 rounded-full bg-slate-100">
                    {ticket.ticketNo}
                  </span>
                )} */}
                {isReadOnly && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    <EyeOff className="w-2.5 h-2.5" />
                    View Only
                  </span>
                )}
                {canAct && ticket.enrolledByIT && !isClosed && !isHRTicket && (
                  <>
                    <button
                      onClick={onEditType}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                    >
                      <ArrowLeftRight className="w-2.5 h-2.5" />
                      Edit Type
                    </button>
                    <button
                      onClick={onEditPriority}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      Edit Priority
                    </button>
                  </>
                )}
                {canAct && ticket.enrolledByIT && !isClosed && isHRTicket && (
                  <button
                    onClick={onEditPriority}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    Edit Priority
                  </button>
                )}
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="inline-flex items-center rounded-full bg-slate-900 text-white text-xs font-extrabold px-3 py-1 shadow-sm">
                      {ticket.ticketNo}
                    </span>
                  </div>

                  <p className="text-base font-bold text-slate-900 leading-snug">
                    {ticket.description}
                  </p>
                </div>
              </div>
              {(ticket.catalogParent ||
                ticket.catalogCategory ||
                ticket.catalogSubCategory) && (
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {ticket.catalogParent && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {ticket.catalogParent}
                    </span>
                  )}
                  {ticket.catalogCategory &&
                    ticket.catalogCategory !== ticket.catalogParent && (
                      <>
                        <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                          {ticket.catalogCategory}
                        </span>
                      </>
                    )}
                  {ticket.catalogSubCategory && (
                    <>
                      <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {ticket.catalogSubCategory}
                      </span>
                    </>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 text-xs font-medium">
                  <User className="w-3 h-3" />
                  Owner: {ticket.createdBy || "—"}
                </span>

                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 text-xs font-medium">
                  <Users className="w-3 h-3" />
                  Submitted By: {ticket.submittedBy || "—"}
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 text-xs font-medium">
                  <CalendarDays className="w-3 h-3" />
                  Submitted {fmtDateTime(ticket.submittedDateTime)}
                </span>
                {ticket.itAssignees?.length > 0 && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 text-xs font-medium">
                    <UserCheck className="w-3 h-3" />
                    {ticket.itAssignees.join(", ")}
                    {canAct && !isClosed && (
                      <button
                        onClick={onReassign}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                )}
                {ticket.attachment && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">
                    <Paperclip className="w-3 h-3" />
                    {ticket.attachment.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 flex-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Active
              </p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">
                {daysBetween(ticket.submittedDate, todayISO())}d
              </p>
            </div>
            <div className={`rounded-xl border px-3 py-2 ${badge.cls}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                ETA
              </p>
              <p className="text-sm font-bold mt-0.5">{badge.label}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Msgs
              </p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">
                {ticket.messages?.length || 0}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Strikes
              </p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">
                {allStrikes.length}
              </p>
            </div>
          </div>

          {catFlow.length > 0 && (
            <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
              {catFlow.map((s, i) => {
                const done = curIdx > i;
                const curr = ticket.status === s;
                const m = STATUS_META[s] || STATUS_META["Open"];
                return (
                  <div key={s} className="flex items-center gap-1 flex-none">
                    <div
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ${curr ? m.chip + " border border-current/20" : done ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                    >
                      {done && "✓ "}
                      {s}
                    </div>
                    {i < catFlow.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-slate-300 flex-none" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mt-3">
            {["details", "discussion", "history"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t}
                {t === "discussion" && ticket.messages?.length > 0
                  ? ` (${ticket.messages.length})`
                  : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div
          className={`flex-1 min-h-0 ${tab === "discussion" ? "flex flex-col overflow-hidden" : "overflow-y-auto thin-scroll"}`}
        >
          {detailLoading && (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading details…
            </div>
          )}

          {!detailLoading && tab === "details" && (
            <div className="p-4 sm:p-6 space-y-4">
              {isReadOnly && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
                  <EyeOff className="w-5 h-5 text-slate-400 flex-none mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      View only — not assigned to you
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assigned to{" "}
                      <span className="font-semibold">
                        {ticket.itAssignees?.join(", ")}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              )}

              <Section title="Ticket Information">
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <InfoBox
                    label="Submitted By"
                    value={`${ticket.createdBy}${ticket.createdByEmpId ? " #" + ticket.createdByEmpId : ""}`}
                  />
                  <InfoBox
                    label="Department"
                    value={
                      // ticket.ticketDept === "HR"
                      //   ? "HR Department"
                      //   : "IT Department"
                      ticket.userDept
                    }
                  />
                  <InfoBox
                    label="Submitted Date"
                    value={fmtDateTime(ticket.submittedDateTime)}
                  />
                  <InfoBox label="Organisation" value={ticket.org} />
                  <InfoBox
                    label="Request Type"
                    value={ticket.requestType || "—"}
                  />
                  {!isHRTicket && (
                    <InfoBox label="Category" value={cat?.label || "—"} />
                  )}
                  {ticket.attachment && (
                    <InfoBox
                      label="Attachment"
                      value={ticket.attachment.name}
                    />
                  )}
                  {ticket.catalogParent && (
                    <InfoBox
                      label="Catalog Parent"
                      value={ticket.catalogParent}
                    />
                  )}
                  {ticket.catalogCategory && (
                    <InfoBox
                      label="Catalog Category"
                      value={ticket.catalogCategory}
                    />
                  )}
                  {ticket.catalogSubCategory && (
                    <InfoBox
                      label="Catalog Item"
                      value={ticket.catalogSubCategory}
                    />
                  )}
                </div>
              </Section>

              {/* ── ENROLL SECTION ─────────────────────────────────────────── */}
              {(isIT || isHR) &&
                canAct &&
                !ticket.enrolledByIT &&
                ticket.status === "Open" && (
                  <Section
                    title="Enroll Ticket"
                    accent="amber"
                    subtitle={`Assign ${isHRTicket ? "HR officer" : "IT engineer"}, set priority and ETA.`}
                  >
                    <div className="mt-4 space-y-3">
                      {(ticket.catalogParent ||
                        ticket.catalogCategory ||
                        ticket.catalogSubCategory) && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                            Submitted Category
                          </p>
                          <div className="flex items-center gap-1 flex-wrap">
                            {ticket.catalogParent && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                                {ticket.catalogParent}
                              </span>
                            )}
                            {ticket.catalogCategory &&
                              ticket.catalogCategory !==
                                ticket.catalogParent && (
                                <>
                                  <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                    {ticket.catalogCategory}
                                  </span>
                                </>
                              )}
                            {ticket.catalogSubCategory && (
                              <>
                                <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                  {ticket.catalogSubCategory}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {!isHRTicket && (
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                            Request Type
                          </label>
                          <RequestTypeSelector
                            value={enrollForm.ticketType || "Service Request"}
                            onChange={handleEnrollRequestTypeChange}
                          />
                          {enrollErrors.ticketType && (
                            <p className="mt-1 text-xs text-red-600 font-semibold">
                              {enrollErrors.ticketType}
                            </p>
                          )}
                        </div>
                      )}

                      {!isHRTicket && (
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                            Update Category{" "}
                            <span className="normal-case font-normal text-slate-400">
                              (optional — change if needed)
                            </span>
                          </label>
                          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                            <NestedCatalogDropdown
                              tree={enrollActiveCatalogTree}
                              value={
                                enrollForm.enrollCatalogValue || {
                                  parentName: "",
                                  categoryName: "",
                                  subCategory: "",
                                }
                              }
                              onChange={(v) =>
                                setEnrollForm((f) => ({
                                  ...f,
                                  enrollCatalogValue: v,
                                }))
                              }
                              loading={catalogLoading}
                            />
                          </div>
                        </div>
                      )}

                      <PrioritySelector
                        value={enrollForm.priority}
                        onChange={(v) =>
                          setEnrollForm((f) => ({ ...f, priority: v }))
                        }
                        error={enrollErrors.priority}
                      />

                      <AssigneeDropdown
                        value={enrollForm.assignee || null}
                        onChange={(v) =>
                          setEnrollForm((f) => ({ ...f, assignee: v }))
                        }
                        error={enrollErrors.assignee}
                        label={
                          isHRTicket ? "Assign HR Officer" : "Assign Engineer"
                        }
                        employees={employees}
                      />

                      {(isHRTicket || enrollForm.ticketType === "Incident") && (
                        <div className="grid grid-cols-2 gap-3">
                          <Field
                            label="Start Date"
                            error={enrollErrors.itStartDate}
                          >
                            <input
                              type="date"
                              value={enrollForm.itStartDate}
                              onChange={(e) =>
                                setEnrollForm((p) => ({
                                  ...p,
                                  itStartDate: e.target.value,
                                }))
                              }
                              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:border-slate-400"
                            />
                          </Field>

                          {!isHRTicket &&
                          enrollForm.ticketType === "Incident" ? (
                            (() => {
                              const incidentETA = {
                                Critical: {
                                  label: "4 Hours",
                                  hours: "4",
                                  badge:
                                    "bg-red-100 text-red-700 border-red-200",
                                },
                                Medium: {
                                  label: "2 Days",
                                  hours: "48",
                                  badge:
                                    "bg-amber-100 text-amber-700 border-amber-200",
                                },
                                Normal: {
                                  label: "4 Days",
                                  hours: "96",
                                  badge:
                                    "bg-blue-100 text-blue-700 border-blue-200",
                                },
                              }[enrollForm.priority];

                              return (
                                <Field
                                  label="Est. Completion"
                                  error={enrollErrors.etaHours}
                                >
                                  {incidentETA ? (
                                    <div
                                      className={`h-10 w-full rounded-xl border-2 px-3 flex items-center justify-between text-sm font-bold ${incidentETA.badge}`}
                                    >
                                      <span>{incidentETA.label}</span>
                                      <span className="text-[10px] font-semibold opacity-60 uppercase tracking-widest">
                                        Auto-set
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="h-10 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 flex items-center text-xs text-slate-400 italic">
                                      Select priority first…
                                    </div>
                                  )}
                                </Field>
                              );
                            })()
                          ) : (
                            <Field
                              label="ETA Date"
                              error={enrollErrors.etaDate}
                            >
                              <input
                                type="date"
                                min={enrollForm.itStartDate}
                                value={enrollForm.etaDate}
                                onChange={(e) =>
                                  setEnrollForm((p) => ({
                                    ...p,
                                    etaDate: e.target.value,
                                  }))
                                }
                                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:border-slate-400"
                              />
                            </Field>
                          )}
                        </div>
                      )}

                      <Field label="Remarks (optional)">
                        <textarea
                          rows={2}
                          value={enrollForm.itRemarks}
                          onChange={(e) =>
                            setEnrollForm((p) => ({
                              ...p,
                              itRemarks: e.target.value,
                            }))
                          }
                          placeholder="Scope, dependencies…"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400 resize-none"
                        />
                      </Field>

                      <button
                        onClick={onEnroll}
                        disabled={enrollLoading}
                        className={`w-full h-11 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${isHRTicket ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-900 hover:bg-slate-800"}`}
                      >
                        {enrollLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                        Enroll & Assign
                      </button>
                    </div>
                  </Section>
                )}

              {ticket.enrolledByIT && (
                <Section title="Enrollment Details">
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <InfoBox label="Priority" value={ticket.priority || "—"} />
                    <InfoBox
                      label="Request Type"
                      value={ticket.requestType || "—"}
                    />
                    <InfoBox
                      label="Start Date"
                      value={fmt(ticket.itStartDate)}
                    />
                    <InfoBox
                      label={isIncident ? "ETA (Hours)" : "ETA Date"}
                      value={
                        isIncident
                          ? ticket.etaHours
                            ? `${ticket.etaHours} hrs`
                            : "—"
                          : fmt(ticket.etaDate)
                      }
                    />
                    {isIncident && (
                      <InfoBox
                        label="Expected Completion"
                        value={fmt(
                          addHoursToDate(ticket.itStartDate, ticket.etaHours),
                        )}
                      />
                    )}

                    <InfoBox
                      label="Closing Date"
                      value={fmt(ticket.closingDate)}
                    />
                  </div>
                  <div className="mt-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Assignee
                    </p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">
                      {ticket.itAssignees?.join(", ") || "—"}
                    </p>
                  </div>
                  {ticket.itRemarks && (
                    <div className="mt-3 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-700 italic">
                      "{ticket.itRemarks}"
                    </div>
                  )}
                </Section>
              )}

              {(isOnHold || isWaiting) && (
                <div
                  className={`rounded-2xl border p-4 ${isWaiting ? "border-orange-200 bg-orange-50" : "border-amber-200 bg-amber-50"}`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5 ${isWaiting ? "text-orange-600" : "text-amber-600"}`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {isWaiting ? "Waiting for User Input" : "Hold Reason"}
                  </p>
                  {ticket.holdReasonType && (
                    <p className="text-sm font-bold text-slate-800 mb-1">
                      {
                        HOLD_REASON_OPTIONS.find(
                          (o) => o.value === ticket.holdReasonType,
                        )?.label
                      }
                    </p>
                  )}
                  {ticket.holdRemarks && (
                    <p className="text-sm text-slate-700">
                      {ticket.holdRemarks}
                    </p>
                  )}
                </div>
              )}

              {canAct && ticket.enrolledByIT && isAssigned && !isClosed && (
                <Section
                  title="Accept Ticket"
                  subtitle="Review the ticket details and confirm acceptance before starting work."
                  accent="amber"
                >
                  <div className="mt-3 space-y-2">
                    <div className="rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2.5 text-xs text-sky-700">
                      <span className="font-bold">What is Acceptance?</span>{" "}
                      Moving to Acceptance confirms you have reviewed and
                      acknowledged the ticket. After acceptance you can move it
                      to In Progress.
                    </div>
                    <button
                      onClick={onAcceptanceTicket}
                      className="w-full h-11 rounded-xl bg-sky-600 text-sm font-bold text-white hover:bg-sky-700 flex items-center justify-center gap-2"
                    >
                      <BadgeCheck className="w-4 h-4" />
                      Accept Ticket
                    </button>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={onResolveTicket}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-semibold hover:bg-emerald-200"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Mark Resolved
                      </button>
                      {/* <button
                        onClick={onCloseTicket}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900"
                      >
                        <XCircle className="w-4 h-4" />
                        Close Ticket
                      </button> */}

                      {ticket.itAssignees?.length > 0 && (
                        <button
                          onClick={onReassign}
                          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold hover:bg-blue-100"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Reassign
                        </button>
                      )}
                    </div>
                  </div>
                </Section>
              )}

              {isAcceptance && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <BadgeCheck className="w-5 h-5 text-sky-600 flex-none mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-sky-800">
                        Ticket Accepted — Ready to Start
                      </p>
                      <p className="text-xs text-sky-600 mt-0.5">
                        Ticket has been accepted. Move to In Progress to begin
                        work.
                      </p>
                      {ticket.acceptanceNote && (
                        <div className="mt-2 rounded-xl bg-white/70 border border-sky-100 px-3 py-2">
                          <p className="text-sm text-slate-700">
                            {ticket.acceptanceNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {canAct && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => onMoveStatus("In Progress")}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                      >
                        <Clock3 className="w-4 h-4" />
                        Start — Move to In Progress
                      </button>
                      <button
                        onClick={onResolveTicket}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-semibold hover:bg-emerald-200"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Mark Resolved
                      </button>
                      {/* <button
                        onClick={onCloseTicket}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900"
                      >
                        <XCircle className="w-4 h-4" />
                        Close Ticket
                      </button> */}
                      {ticket.itAssignees?.length > 0 && (
                        <button
                          onClick={onReassign}
                          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold hover:bg-blue-100"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Reassign
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {canAct && isWaiting && isFullFlowIT && (
                <Section
                  title="Three-Strike Follow-up"
                  accent="amber"
                  subtitle="Up to 3 follow-ups per round."
                >
                  <div className="mt-4 space-y-3">
                    {prevGroups.length > 0 && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-2">
                          Completed Rounds
                        </p>
                        {prevGroups.map((g, gi) => (
                          <div
                            key={gi}
                            className="flex items-center justify-between py-1.5 border-b border-emerald-100 last:border-0"
                          >
                            <span className="text-xs font-bold text-emerald-700">
                              Round {gi + 1}
                            </span>
                            <span className="text-[10px] text-emerald-600 mono">
                              {fmt(g[0].sent_At?.slice(0, 10))} →{" "}
                              {fmt(
                                g
                                  .find((s) => s.response_Received)
                                  ?.response_At?.slice(0, 10),
                              )}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 rounded-full px-2 py-0.5">
                              All Responded
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {[1, 2, 3].map((num) => {
                      const strike = activeGroup.find(
                        (s) => s.strike_No === num,
                      );
                      const isNext = !strike && activeGroup.length === num - 1;
                      const locked = !strike && !isNext;
                      const isLastSentStrike =
                        activeGroup.length > 0 &&
                        activeGroup[activeGroup.length - 1]?.strike_Id ===
                          strike?.strike_Id;
                      return (
                        <div
                          key={num}
                          className={`rounded-xl border p-4 transition-all ${locked ? "bg-slate-50 border-slate-100 opacity-40" : strike?.response_Received ? "bg-emerald-50 border-emerald-200" : strike ? "bg-orange-50 border-orange-200" : "bg-white border-slate-200"}`}
                        >
                          <div className="flex items-center gap-2.5 mb-3">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-none ${strike?.response_Received ? "bg-emerald-500 text-white" : strike ? "bg-orange-500 text-white" : isNext ? "bg-slate-200 text-slate-600" : "bg-slate-200 text-slate-400"}`}
                            >
                              {num}
                            </div>
                            <div className="flex-1 flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-800">
                                Strike {num}
                              </span>
                              {strike && (
                                <span className="mono text-[11px] text-slate-500">
                                  Sent {fmt(strike.sent_At?.slice(0, 10))}
                                </span>
                              )}
                              {strike?.mail_Id && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
                                  <Mail className="w-2.5 h-2.5" />
                                  {strike.mail_Id}
                                </span>
                              )}
                              {strike?.response_Received && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                  ✓ Response
                                </span>
                              )}
                              {strike &&
                                !strike.response_Received &&
                                !isLastSentStrike && (
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                    Window Closed
                                  </span>
                                )}
                              {strike &&
                                !strike.response_Received &&
                                isLastSentStrike && (
                                  <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                                    No Reply
                                  </span>
                                )}
                            </div>
                          </div>
                          {strike && (
                            <div className="bg-white/80 rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-700 italic mb-2">
                              "{strike.strike_Note}"
                            </div>
                          )}
                          {strike?.response_Received && (
                            <div className="bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800">
                              <span className="font-bold">
                                Response (
                                {fmt(strike.response_At?.slice(0, 10))}):
                              </span>{" "}
                              {strike.response_Note}
                            </div>
                          )}
                          {strike &&
                            !strike.response_Received &&
                            isLastSentStrike && (
                              <div className="mt-2 space-y-2">
                                <input
                                  type="text"
                                  value={
                                    responseForm[strike.strike_Id]?.note || ""
                                  }
                                  onChange={(e) =>
                                    setResponseForm((p) => ({
                                      ...p,
                                      [strike.strike_Id]: {
                                        ...p[strike.strike_Id],
                                        note: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Enter user's response note…"
                                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:border-emerald-400"
                                />
                                {responseForm[strike.strike_Id]?.error && (
                                  <p className="text-[11px] text-red-600">
                                    {responseForm[strike.strike_Id].error}
                                  </p>
                                )}
                                <button
                                  onClick={() =>
                                    onMarkResponse(strike.strike_Id)
                                  }
                                  className="w-full h-9 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Mark Response Received
                                </button>
                              </div>
                            )}
                          {isNext && canSendNext && (
                            <div className="space-y-2">
                              <Field
                                label="Recipient Mail ID"
                                error={strikeErrors.mailId}
                              >
                                <div className="relative">
                                  <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                  <input
                                    type="email"
                                    value={strikeForm.mailId}
                                    onChange={(e) =>
                                      setStrikeForm((p) => ({
                                        ...p,
                                        mailId: e.target.value,
                                      }))
                                    }
                                    placeholder="user@company.com"
                                    className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs focus:outline-none focus:border-orange-400"
                                  />
                                </div>
                              </Field>
                              <Field
                                label="Follow-up Message"
                                error={strikeErrors.note}
                              >
                                <textarea
                                  rows={2}
                                  value={strikeForm.note}
                                  onChange={(e) =>
                                    setStrikeForm((p) => ({
                                      ...p,
                                      note: e.target.value,
                                    }))
                                  }
                                  placeholder={`Strike ${num} follow-up…`}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-none focus:border-orange-400 resize-none"
                                />
                              </Field>
                              <button
                                onClick={onSendStrike}
                                className="w-full h-9 rounded-lg bg-orange-500 text-xs font-bold text-white hover:bg-orange-600 flex items-center justify-center gap-1.5"
                              >
                                <Bell className="w-3.5 h-3.5" />
                                Send Strike {num}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {allActiveNoReply && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <BellOff className="w-5 h-5 text-red-600 flex-none mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-red-800">
                              All 3 follow-ups unanswered
                            </p>
                            <p className="text-xs text-red-600 mt-0.5">
                              You may now close this ticket.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={onAutoClose}
                          className="w-full h-10 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Close — No Response
                        </button>
                      </div>
                    )}
                    {lastGroupAllDone && activeGroup.length === 0 && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-none" />
                        All answered. Start a new round if needed.
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {canAct &&
                ticket.enrolledByIT &&
                !isClosed &&
                !isResolved &&
                !isAcceptance &&
                !isOnHold &&
                !isWaiting &&
                !isAssigned &&
                nextStatuses.length > 0 && (
                  <Section title="Advance Stage" subtitle="Move forward.">
                    <div className="mt-3 flex flex-wrap gap-2">
                      {nextStatuses.map((s) => {
                        const m = STATUS_META[s] || STATUS_META["Open"];
                        const SI = m.Icon;
                        return (
                          <button
                            key={s}
                            onClick={() => onMoveStatus(s)}
                            className={`flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-semibold transition-all hover:opacity-80 ${m.chip}`}
                          >
                            <SI className="w-4 h-4" />
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </Section>
                )}

              {canAct &&
                ticket.enrolledByIT &&
                !isClosed &&
                !isResolved &&
                !isAcceptance &&
                !isAssigned && (
                  <Section
                    title={isOnHold || isWaiting ? "Actions" : "Quick Actions"}
                  >
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {!isOnHold && !isWaiting && isFullFlowIT && (
                        <>
                          <button
                            onClick={onPutOnHold}
                            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 text-sm font-semibold hover:bg-amber-200"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Put On Hold
                          </button>
                          <button
                            onClick={onWaitingForUserInput}
                            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-orange-100 text-orange-800 border border-orange-200 text-sm font-semibold hover:bg-orange-200"
                          >
                            <Timer className="w-4 h-4" />
                            Waiting for User Input
                          </button>
                        </>
                      )}
                      {(isOnHold || isWaiting) && (
                        <button
                          onClick={() => onMoveStatus("In Progress")}
                          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-100 text-blue-800 border border-blue-200 text-sm font-semibold hover:bg-blue-200"
                        >
                          <Clock3 className="w-4 h-4" />
                          Resume to In Progress
                        </button>
                      )}
                      {!isOnHold && !isWaiting && (
                        <button
                          onClick={onResolveTicket}
                          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-semibold hover:bg-emerald-200"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Mark Resolved
                        </button>
                      )}
                      {/* <button
                        onClick={onCloseTicket}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900"
                      >
                        <XCircle className="w-4 h-4" />
                        Close Ticket
                      </button> */}
                      {ticket.itAssignees?.length > 0 && !isClosed && (
                        <button
                          onClick={onReassign}
                          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold hover:bg-blue-100"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Reassign
                        </button>
                      )}
                    </div>
                  </Section>
                )}

              {isResolved && !isClosed && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <ThumbsUp className="w-5 h-5 text-emerald-600 flex-none mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-emerald-800">
                        Marked as Resolved
                      </p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Awaiting user confirmation.
                      </p>
                      {ticket.resolvedNote && (
                        <div className="mt-2 rounded-xl bg-white/70 border border-emerald-100 px-3 py-2.5">
                          <p className="text-sm text-slate-700">
                            "{ticket.resolvedNote}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {isTicketOwner && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <button
                        onClick={() => onOpenResolutionFeedback("resolved")}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Issue Resolved
                      </button>

                      <button
                        onClick={() => onOpenResolutionFeedback("not_resolved")}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white border border-orange-300 text-orange-800 text-sm font-semibold hover:bg-orange-50"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Issue Not Resolved
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isResolved &&
                !isClosed &&
                ticket.enrolledByIT &&
                canAct &&
                canCloseResolvedTicket && (
                  <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <ThumbsUp className="w-5 h-5 text-emerald-600 flex-none mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-emerald-800">
                          Marked as Closed
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Ticket is resolved and can be closed.
                        </p>
                      </div>
                    </div>
                    {canCloseResolvedTicket && (
                      <button
                        onClick={onCloseTicket}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900"
                      >
                        <XCircle className="w-4 h-4" />
                        Close Ticket
                      </button>
                    )}
                  </div>
                )}

              {isClosed && (
                <div
                  className={`rounded-2xl border p-4 ${ticket.autoClosedAfterStrikes ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}
                >
                  <div className="flex items-start gap-3">
                    {ticket.autoClosedAfterStrikes ? (
                      <BellOff className="w-5 h-5 text-red-600 flex-none mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-none mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-bold ${ticket.autoClosedAfterStrikes ? "text-red-800" : "text-emerald-800"}`}
                      >
                        {ticket.autoClosedAfterStrikes
                          ? "Auto-Closed — 3 unanswered follow-ups"
                          : "Ticket Closed"}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${ticket.autoClosedAfterStrikes ? "text-red-600" : "text-emerald-600"}`}
                      >
                        Closed {fmt(ticket.closingDate)}
                      </p>
                      {ticket.closingNote && (
                        <div className="mt-2 rounded-xl bg-white/70 border border-current/10 px-3 py-2.5">
                          <p className="text-sm text-slate-700">
                            {ticket.closingNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!detailLoading && tab === "discussion" && (
            <div
              className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* 1. SCROLLABLE MESSAGES CONTAINER */}
              <div
                className={`flex-1 overflow-y-auto thin-scroll p-4 sm:p-5 space-y-3 min-h-0 transition-colors ${
                  isDragging
                    ? "bg-blue-50/50 border-2 border-dashed border-blue-400"
                    : ""
                }`}
              >
                {isDragging && (
                  <div className="text-center py-6 text-blue-600 font-bold text-sm">
                    Drop file to attach to message
                  </div>
                )}

                {(!ticket.messages || ticket.messages.length === 0) &&
                  !isDragging && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <MessageSquareText className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium">No messages yet.</p>
                    </div>
                  )}

                {ticket.messages?.map((msg) => {
                  const senderName =
                    msg.message_By_Name || msg.senderName || "Unknown";
                  const isSelf =
                    msg.message_By === currentUser.emp_Id ||
                    msg.senderId === currentUser.emp_Id;
                  const isITMsg = msg.isIT;
                  const isHRMsg = msg.isHR;
                  const initials = senderName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={msg.discussion_Id || msg.id}
                      className={`flex items-end gap-2 ${isSelf ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex-none flex items-center justify-center text-[10px] font-black ${
                          isITMsg
                            ? "bg-blue-500 text-white"
                            : isHRMsg
                              ? "bg-indigo-500 text-white"
                              : "bg-emerald-500 text-white"
                        }`}
                      >
                        {initials}
                      </div>
                      <div
                        className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-500">
                            {senderName}
                          </span>
                          <span className="text-[10px] text-slate-400 mono">
                            {fmtTime(msg.message_At || msg.ts)}
                          </span>
                        </div>
                        <div
                          className={
                            isSelf
                              ? "cb-self"
                              : isITMsg
                                ? "cb-it"
                                : isHRMsg
                                  ? "cb-hr"
                                  : "cb-user"
                          }
                        >
                          {msg.message_Text || msg.text}
                          {msg.file_Name && (
                            <div className="mt-1 pt-1 border-t border-white/20 flex items-center gap-1 text-xs">
                              <Paperclip className="w-3 h-3" />
                              <span>{msg.file_Name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {/* 2. FIXED FOOTER INPUT CONTAINER */}
              {!isClosed ? (
                <div className="flex-none border-t border-slate-200 p-3 sm:p-4 bg-white space-y-2">
                  {/* File Attachment Pill */}
                  {discussionFile && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[200px]">
                        {discussionFile.name}
                      </span>
                      <button
                        onClick={() => setDiscussionFile(null)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    {/* File Upload Trigger */}
                    <button
                      type="button"
                      onClick={() => discFileRef.current?.click()}
                      className="w-10 h-10 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 flex-none transition-colors"
                      title="Attach File"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      ref={discFileRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setDiscussionFile(e.target.files[0]);
                        }
                      }}
                    />

                    {/* Input Box */}
                    <textarea
                      rows={2}
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onSendMsg(discussionFile);
                          setDiscussionFile(null);
                        }
                      }}
                      placeholder="Type a message or drag & drop a file..."
                      className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-slate-400 resize-none"
                    />

                    {/* Send Button */}
                    <button
                      onClick={() => {
                        onSendMsg(discussionFile);
                        setDiscussionFile(null);
                      }}
                      disabled={msgLoading}
                      className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white hover:bg-slate-800 flex-none disabled:opacity-60 transition-colors"
                    >
                      {msgLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-1">
                    Sending as{" "}
                    <span className="font-bold">{currentUser.emp_Name}</span> ·{" "}
                    <span className="mono">#{currentUser.emp_No}</span>
                  </p>
                </div>
              ) : (
                <div className="flex-none border-t border-slate-200 p-4 bg-slate-50 text-center text-xs text-slate-400 font-medium">
                  Discussion closed — ticket is closed.
                </div>
              )}
            </div>
          )}

          {!detailLoading && tab === "history" && (
            <div className="p-5 space-y-2">
              {ticket.statusHistory.length === 0 && (
                <div className="text-center text-xs text-slate-400 py-8">
                  No history available.
                </div>
              )}
              {[...ticket.statusHistory].reverse().map((e, i) => {
                const status = e.new_Value || e.status || "Open";
                const m = STATUS_META[status] || STATUS_META["Open"];
                const SI = m.Icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-none mt-0.5 ${m.chip}`}
                    >
                      <SI className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold ${m.txt}`}>
                          {status}
                        </span>
                        <span className="mono text-[11px] text-slate-400 flex-none">
                          {fmt(e.action_At?.slice?.(0, 10) || e.date)}
                        </span>
                      </div>
                      {(e.remarks || e.action_Type) && (
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {e.action_Type || ""}
                          {e.remarks ? " — " + e.remarks : ""}
                        </p>
                      )}
                      {e.action_By_Name && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          by {e.action_By_Name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverdueTicketsModal({ open, onClose, tickets, onSelectTicket }) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box max-w-4xl">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Overdue Tickets
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any ticket to open its full details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-slate-600">
                No overdue tickets found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const badge = etaBadge(ticket.etaDate, ticket.status);
                const statusMeta =
                  STATUS_META[ticket.status] || STATUS_META["Open"];
                const cat =
                  ticket.ticketDept !== "HR" && ticket.category
                    ? getCatMeta(ticket.category)
                    : null;

                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectTicket(ticket.id);
                    }}
                    className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 hover:border-red-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                            {badge.label}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusMeta.chip}`}
                          >
                            {ticket.status}
                          </span>
                          {ticket.ticketDept === "HR" ? (
                            <HRPill small />
                          ) : cat ? (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cat.pill}`}
                            >
                              {cat.label}
                            </span>
                          ) : null}
                          {ticket.ticketNo && (
                            <span className="text-[10px] font-bold text-black px-2 py-1 rounded-full bg-slate-100">
                              {ticket.ticketNo}
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-bold text-slate-900">
                          {ticket.description}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Owner: {ticket.createdBy || "—"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Submitted By: {ticket.submittedBy || "—"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            ETA: {fmt(ticket.etaDate)}
                          </span>
                          {ticket.itAssignees?.length > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              {ticket.itAssignees.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400">
                        <FileText className="w-4 h-4" />
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN HELPDESK PAGE ───────────────────────────────────────────────────────
export default function HelpdeskPage() {
  const sessionUser = getSessionUser();
  if (!sessionUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 font-semibold">
            Session not found. Please log in first.
          </p>
        </div>
      </div>
    );
  }

  const currentUser = sessionUser;
  const role = deriveRole(currentUser.dept_Id);
  const isIT = role === "IT";
  const isHR = role === "HR";
  const isDeptUser = role === "User";

  const [tickets, setTickets] = useState([]);
  console.log("tickets", tickets);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [orgFilter, setOrgFilter] = useState("All");
  const [catalogRaw, setCatalogRaw] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [createITOpen, setCreateITOpen] = useState(false);
  const [createHROpen, setCreateHROpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);

  const [ticketMessages, setTicketMessages] = useState({});
  const [ticketStrikes, setTicketStrikes] = useState({});
  const [ticketHistory, setTicketHistory] = useState({});

  const [enrollForm, setEnrollForm] = useState({
    assignee: null,
    itStartDate: todayISO(),
    etaDate: "",
    etaHours: "",
    itRemarks: "",
    priority: "Medium",
    ticketType: "Service Request",
    enrollCatalogValue: { parentName: "", categoryName: "", subCategory: "" },
  });
  const [enrollErrors, setEnrollErrors] = useState({});
  const [newMsg, setNewMsg] = useState("");
  const [holdModal, setHoldModal] = useState(false);
  const [holdNote, setHoldNote] = useState("");
  const [holdReasonType, setHoldReasonType] = useState("");
  const [holdError, setHoldError] = useState("");
  const [holdModalType, setHoldModalType] = useState("hold");
  const [closeModal, setCloseModal] = useState(false);
  const [closeNote, setCloseNote] = useState("");
  const [closeError, setCloseError] = useState("");
  const [resolveModal, setResolveModal] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [resolveError, setResolveError] = useState("");
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackDecision, setFeedbackDecision] = useState("");
  const [feedbackRemark, setFeedbackRemark] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [acceptanceModal, setAcceptanceModal] = useState(false);
  const [acceptanceNote, setAcceptanceNote] = useState("");
  const [acceptanceError, setAcceptanceError] = useState("");
  const [strikeForm, setStrikeForm] = useState({ mailId: "", note: "" });
  const [strikeErrors, setStrikeErrors] = useState({});
  const [responseForm, setResponseForm] = useState({});
  const [stageRemarksModal, setStageRemarksModal] = useState({
    open: false,
    targetStatus: "",
    remarks: "",
  });
  const [reassignModal, setReassignModal] = useState(false);
  const [reassignee, setReassignee] = useState(null);
  const [editTypeModal, setEditTypeModal] = useState(false);
  const [editPriorityModal, setEditPriorityModal] = useState(false);

  const navigate = useNavigate();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // add inside HelpdeskPage() state section
  const [overdueModalOpen, setOverdueModalOpen] = useState(false);

  function isTicketOverdue(ticket) {
    if (!ticket?.etaDate) return false;
    if (ticket.status === "Closed") return false;

    const eta = ticket.etaDate?.slice?.(0, 10) || ticket.etaDate;
    return daysBetween(todayISO(), eta) < 0;
  }

  const overdueTickets = useMemo(() => {
    return tickets.filter(isTicketOverdue);
  }, [tickets]);

  const [acceptanceDetailModal, setAcceptanceDetailModal] = useState(false);
  const [acceptanceDetailForm, setAcceptanceDetailForm] = useState({
    startDate: todayISO(),
    etaDate: "",
  });
  const [acceptanceDetailError, setAcceptanceDetailError] = useState("");

  const profileMenuRef = useRef(null);

  // const handleLogout = useCallback(() => {
  //   try {
  //     sessionStorage.removeItem("user");
  //     sessionStorage.setItem("explicitlogout", "true");
  //   } catch (e) {
  //     console.error("Logout failed", e);
  //   }
  //   navigate("/", { replace: true });
  // }, [navigate]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const catalogTree = useMemo(() => parseCatalog(catalogRaw), [catalogRaw]);

  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const payload = isIT
        ? {
            dept: "IT",
            empId: currentUser.emp_Id,
            org: orgFilter === "All" ? "" : orgFilter,
          }
        : isHR
          ? {
              dept: "HR",
              empId: currentUser.emp_Id,
              org: orgFilter === "All" ? "" : orgFilter,
            }
          : {
              empId: currentUser.emp_Id,
              org: orgFilter === "All" ? "" : orgFilter,
            };
      const res = await ITHelpdeskService.getTickets(payload);
      setTickets((res?.data || []).map(mapApiTicket));
    } catch (e) {
      console.error("Fetch tickets error:", e);
    } finally {
      setTicketsLoading(false);
    }
  }, [isIT, isHR, currentUser.emp_Id, orgFilter]);

  useEffect(() => {
    setCatalogLoading(true);
    HelpdeskService.GetHDCatalog()
      .then((res) => {
        setCatalogRaw(res?.data || []);
      })
      .catch((e) => console.error("Catalog fetch failed:", e))
      .finally(() => setCatalogLoading(false));
  }, []);

  useEffect(() => {
    const dept = isIT ? "IT" : isHR ? "HR" : null;
    if (!dept) return;
    ITHelpdeskService.getTicketEmployees(dept)
      .then((res) => setEmployees(res?.data || []))
      .catch((e) => console.error("Employees fetch error:", e));
  }, [isIT, isHR]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!selectedId) return;
    const loadDetail = async () => {
      setDetailLoading(true);
      try {
        const [histRes, msgRes, strikeRes] = await Promise.all([
          ITHelpdeskService.getHistoryById(selectedId).catch(() => null),
          ITHelpdeskService.getDiscussions(selectedId).catch(() => null),
          ITHelpdeskService.getStrikes(selectedId).catch(() => null),
        ]);
        setTicketHistory((prev) => ({
          ...prev,
          [selectedId]: histRes?.data || [],
        }));
        const msgs = (msgRes?.data || []).map((m) => {
          const emp = employees.find((e) => e.emp_Id === m.message_By);
          return {
            ...m,
            isIT: emp?.dept_Id === 7,
            isHR: emp?.dept_Id === 5,
            senderId: m.message_By,
          };
        });
        setTicketMessages((prev) => ({ ...prev, [selectedId]: msgs }));
        setTicketStrikes((prev) => ({
          ...prev,
          [selectedId]: strikeRes?.data || [],
        }));
      } catch (e) {
        console.error("Detail load error:", e);
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetail();
  }, [selectedId, employees]);

  useEffect(() => {
    // AFTER
    const ticketForEnroll = tickets.find((t) => t.id === selectedId);
    setEnrollForm({
      assignee:
        ticketForEnroll?.itAssigneeIds?.length && employees.length
          ? employees.find((e) =>
              ticketForEnroll.itAssigneeIds.includes(String(e.emp_Id)),
            ) || null
          : null,
      itStartDate: ticketForEnroll?.itStartDate || todayISO(),
      etaDate: ticketForEnroll?.etaDate || "",
      etaHours: ticketForEnroll?.etaHours || "",
      itRemarks: ticketForEnroll?.itRemarks || "",
      priority: ticketForEnroll?.priority || "Medium",
      ticketType: ticketForEnroll?.requestType || "Service Request",
      enrollCatalogValue: ticketForEnroll?.catalogParent
        ? {
            parentName: ticketForEnroll.catalogParent,
            categoryName: ticketForEnroll.catalogCategory || "",
            subCategory: ticketForEnroll.catalogSubCategory || "",
          }
        : { parentName: "", categoryName: "", subCategory: "" },
    });
    setEnrollErrors({});
    setHoldModal(false);
    // setCloseModal(false);
    setResolveModal(false);
    setAcceptanceModal(false);
    setAcceptanceNote("");
    setFeedbackModal(false);
    setFeedbackDecision("");
    setFeedbackRemark("");
    setFeedbackError("");
    setStrikeForm({ mailId: "", note: "" });
    setStrikeErrors({});
    setResponseForm({});
    setStageRemarksModal({ open: false, targetStatus: "", remarks: "" });
    setReassignModal(false);
    setReassignee(null);
    setEditTypeModal(false);
    setEditPriorityModal(false);
  }, [selectedId, tickets, employees]);

  const sel = useMemo(() => {
    if (!selectedId) return null;
    const base = tickets.find((t) => t.id === selectedId);
    if (!base) return null;
    return {
      ...base,
      messages: ticketMessages[selectedId] || [],
      strikes: ticketStrikes[selectedId] || [],
      statusHistory: ticketHistory[selectedId] || [],
    };
  }, [selectedId, tickets, ticketMessages, ticketStrikes, ticketHistory]);

  // ── Derive current user's string ID once — used everywhere ──────────────────
  const myEmpId = String(currentUser.emp_Id);

  // ── canActOnTicket: purely ID-based ─────────────────────────────────────────
  const canActOnTicket = useMemo(() => {
    if (!sel || isDeptUser) return false;
    const isMyTicket = sel.itAssigneeIds?.includes(myEmpId);
    const isOpen = sel.status === "Open";
    if (isIT && sel.ticketDept === "IT") return isOpen || isMyTicket;
    if (isHR && sel.ticketDept === "HR") return isOpen || isMyTicket;
    return false;
  }, [sel, isIT, isHR, isDeptUser, myEmpId]);

  const patchLocal = useCallback((id, data) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t)),
    );
  }, []);

  const createTicket = async (fields) => {
    setSubmitting(true);
    try {
      const actingUser = currentUser; // logged-in IT user
      const targetUser = fields.onBehalfUser || currentUser;

      const payload = {
        dept: fields.ticketDept,
        ticket_type: fields.type === "Linked Ticket" ? "linked" : "new",
        req_type: fields.requestType,
        category: fields.categoryStr,
        project: "",
        impact: fields.impact || "user",
        description: fields.description,
        org: targetUser.org_Id || targetUser.orgId || currentUser.orgId,
        submitted_by: currentUser.emp_Id,
        created_by: targetUser.emp_Id || targetUser.empId || actingUser.empId,
        priority: fields.priority || "",
        parent_ticket_id: fields.parentId || "",
        file: fields.attachment || null,
        Creator_Email: targetUser.emp_Email || targetUser.empEmail || "",
        Creator_Name:
          targetUser.emp_Name ||
          `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim() ||
          targetUser.empName ||
          "",
        user_dept: targetUser.dept_Id || targetUser.deptId || "",
      };
      await ITHelpdeskService.createITHelpdeskTicket(payload);
      await fetchTickets();
      setCreateITOpen(false);
      setCreateHROpen(false);
    } catch (e) {
      console.error("Create ticket error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const enrollTicket = async () => {
    const errs = {};
    if (!enrollForm.assignee) errs.assignee = "Please select an assignee.";
    if (!enrollForm.priority) errs.priority = "Priority required.";

    const isHRTicket = sel?.ticketDept === "HR";
    const isServiceRequest =
      !isHRTicket && enrollForm.ticketType === "Service Request";
    const isIncident = !isHRTicket && enrollForm.ticketType === "Incident";

    if (!isHRTicket && !enrollForm.ticketType) {
      errs.ticketType = "Ticket type required.";
    }

    if (isHRTicket || isIncident) {
      if (!enrollForm.itStartDate) errs.itStartDate = "Start date required.";
    }

    if (isIncident && !enrollForm.priority) {
      errs.priority = "Priority required to auto-set completion time.";
    }

    if (isHRTicket && !enrollForm.etaDate) {
      errs.etaDate = "ETA required.";
    }

    setEnrollErrors(errs);
    if (Object.keys(errs).length) return;

    setEnrollLoading(true);
    try {
      const catValue = enrollForm.enrollCatalogValue;
      const hasCatalogChange = catValue?.parentName;
      const updatedCategoryStr = hasCatalogChange
        ? buildCategoryStr(
            catValue.parentName,
            catValue.categoryName,
            catValue.subCategory,
          )
        : null;

      const INCIDENT_HOURS = { Critical: "4", Medium: "48", Normal: "96" };
      const resolvedEtaHours =
        isHRTicket || enrollForm.ticketType !== "Incident"
          ? ""
          : INCIDENT_HOURS[enrollForm.priority] || "";

      await ITHelpdeskService.enrollTicket({
        ticket_Id: sel.id,
        priority: enrollForm.priority,
        req_Type: isHRTicket ? "Service Request" : enrollForm.ticketType,
        assigned_Person: JSON.stringify(enrollForm.assignee.emp_Id),
        start_Date:
          isHRTicket || isIncident ? enrollForm.itStartDate || null : null,
        eta_Date: isHRTicket ? enrollForm.etaDate || null : null,
        eta_Time: resolvedEtaHours,
        remarks: enrollForm.itRemarks.trim(),
        updated_By: currentUser.emp_Id,
        ...(updatedCategoryStr ? { category: updatedCategoryStr } : {}),
      });

      try {
        await ITHelpdeskService.updateHistory({
          ticket_Id: sel.id,
          action_Type: "ENROLLED",
          old_Value: "Open",
          new_Value: "Assigned",
          remarks: `Enrolled and assigned to ${enrollForm.assignee.emp_Name}${enrollForm.itRemarks.trim() ? " — " + enrollForm.itRemarks.trim() : ""}`,
          action_By: currentUser.emp_Id,
        });
      } catch (histErr) {
        console.warn("History log after enroll failed:", histErr);
      }

      await fetchTickets();
      setSelectedId(null);
    } catch (e) {
      console.error("Enroll error:", e);
    } finally {
      setEnrollLoading(false);
    }
  };

  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const submitAcceptanceWithDetails = async () => {
    if (!sel?.id || statusActionLoading) return;

    if (!acceptanceDetailForm.startDate) {
      setAcceptanceDetailError("Start date is required.");
      return;
    }

    if (!acceptanceDetailForm.etaDate) {
      setAcceptanceDetailError("ETA date is required.");
      return;
    }

    if (acceptanceDetailForm.etaDate < acceptanceDetailForm.startDate) {
      setAcceptanceDetailError("ETA date cannot be before start date.");
      return;
    }

    setAcceptanceDetailError("");
    setStatusActionLoading(true);

    try {
      await HelpdeskService.updateDetailWhileAcceptingTicket({
        ticket_Id: sel.id,
        start_Date: acceptanceDetailForm.startDate,
        eta_Date: acceptanceDetailForm.etaDate,
        remarks: acceptanceNote.trim() || "Ticket accepted",
        updated_By: currentUser.emp_Id,
      });

      try {
        await ITHelpdeskService.updateHistory({
          ticket_Id: sel.id,
          action_Type: "STATUS_CHANGED",
          old_Value: sel.status,
          new_Value: "Acceptance",
          remarks: `${acceptanceNote.trim() || "Ticket accepted"} | Start: ${acceptanceDetailForm.startDate} | ETA: ${acceptanceDetailForm.etaDate}`,
          action_By: currentUser.emp_Id,
        });
      } catch (histErr) {
        console.warn(
          "History log after acceptance with details failed:",
          histErr,
        );
      }

      patchLocal(sel.id, {
        status: "Acceptance",
        acceptanceNote: acceptanceNote.trim(),
        itStartDate: acceptanceDetailForm.startDate,
        etaDate: acceptanceDetailForm.etaDate,
      });

      setAcceptanceDetailModal(false);
      setAcceptanceModal(false);
      setAcceptanceNote("");
      setAcceptanceDetailForm({
        startDate: todayISO(),
        etaDate: "",
      });
      setSelectedId(null);
      await fetchTickets();
    } catch (e) {
      console.error("Acceptance detail update error:", e);
    } finally {
      setStatusActionLoading(false);
    }
  };

  // const overdueTickets = useMemo(() => {
  //   return tickets.filter((t) => {
  //     if (!t.etaDate) return false;
  //     if (["Closed", "Resolved"].includes(t.status)) return false;
  //     return daysBetween(todayISO(), t.etaDate.slice?.(0, 10) || t.etaDate) < 0;
  //   });
  // }, [tickets]);

  const moveStatus = async (ns, remarks = "") => {
    if (!sel?.id || statusActionLoading) return;

    if (ns === "Open") {
      console.warn("Attempted to move back to Open — blocked.");
      return;
    }
    setStatusActionLoading(true);
    try {
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: ns,
        remarks,
        updated_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, { status: ns });
      setSelectedId(null);
      await fetchTickets();
    } catch (e) {
      console.error("Status update error:", e);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const submitHold = async () => {
    if (!holdReasonType) {
      setHoldError("Please select a reason type.");
      return;
    }
    if (!sel?.id || statusActionLoading) return;
    setHoldError("");
    setStatusActionLoading(true);
    const label =
      HOLD_REASON_OPTIONS.find((o) => o.value === holdReasonType)?.label || "";
    try {
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: "On Hold",
        remarks: `${label}${holdNote.trim() ? ": " + holdNote.trim() : ""}`,
        updated_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, {
        status: "On Hold",
        holdRemarks: holdNote.trim(),
        holdReasonType,
      });
      setHoldModal(false);
      setHoldNote("");
      setHoldReasonType("");
      setSelectedId(null);
      await fetchTickets();
    } catch (e) {
      console.error("Hold error:", e);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const submitWaiting = async () => {
    if (!sel?.id || statusActionLoading) return;

    setStatusActionLoading(true);
    try {
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: "Waiting for User Input",
        remarks: holdNote.trim() || "",
        updated_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, {
        status: "Waiting for User Input",
        holdRemarks: holdNote.trim(),
      });
      setHoldModal(false);
      setHoldNote("");
      setHoldReasonType("");
      setSelectedId(null);
      await fetchTickets();
    } catch (e) {
      console.error("Waiting error:", e);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const submitAcceptance = async () => {
    if (!sel?.id || statusActionLoading) return;

    const isServiceRequest =
      sel.ticketDept !== "HR" && sel.requestType === "Service Request";

    if (isServiceRequest) {
      setAcceptanceDetailError("");
      setAcceptanceDetailForm({
        startDate: sel.itStartDate || todayISO(),
        etaDate: sel.etaDate || "",
      });
      setAcceptanceModal(false);
      setAcceptanceDetailModal(true);
      return;
    }

    setAcceptanceError("");
    setStatusActionLoading(true);
    try {
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: "Acceptance",
        remarks: acceptanceNote.trim() || "Ticket accepted",
        updated_By: currentUser.emp_Id,
      });

      try {
        await ITHelpdeskService.updateHistory({
          ticket_Id: sel.id,
          action_Type: "STATUS_CHANGED",
          old_Value: sel.status,
          new_Value: "Acceptance",
          remarks: acceptanceNote.trim() || "Ticket accepted",
          action_By: currentUser.emp_Id,
        });
      } catch (histErr) {
        console.warn("History log after acceptance failed:", histErr);
      }

      patchLocal(sel.id, {
        status: "Acceptance",
        acceptanceNote: acceptanceNote.trim(),
      });

      setAcceptanceModal(false);
      setAcceptanceNote("");
      setSelectedId(null);
      await fetchTickets();
    } catch (e) {
      console.error("Acceptance error:", e);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const submitResolve = async () => {
    if (!resolveNote.trim()) {
      setResolveError("Resolution note is required.");
      return;
    }

    if (!sel?.id || statusActionLoading) return;
    setResolveError("");
    setStatusActionLoading(true);

    try {
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: "Resolved",
        remarks: resolveNote.trim(),
        updated_By: currentUser.emp_Id,
      });
      try {
        await ITHelpdeskService.updateHistory({
          ticket_Id: sel.id,
          action_Type: "STATUS_CHANGED",
          old_Value: sel.status,
          new_Value: "Resolved",
          remarks: resolveNote.trim(),
          action_By: currentUser.emp_Id,
        });
      } catch (histErr) {
        console.warn("History log after resolve failed:", histErr);
      }
      patchLocal(sel.id, {
        status: "Resolved",
        resolvedNote: resolveNote.trim(),
      });
      setResolveModal(false);
      setResolveNote("");
      setSelectedId(null);
      await fetchTickets();
    } catch (e) {
      console.error("Resolve error:", e);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const openResolutionFeedback = (decision) => {
    if (!sel?.id) return;
    setFeedbackDecision(decision || "");
    setFeedbackRemark("");
    setFeedbackError("");
    setFeedbackModal(true);
  };

  const submitClose = async () => {
    if (!closeNote.trim()) {
      setCloseError("Closing remarks are required.");
      return;
    }
    if (!sel?.id || statusActionLoading) return;
    setCloseError("");
    setStatusActionLoading(true);

    try {
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: "Closed",
        remarks: closeNote.trim(),
        updated_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, {
        status: "Closed",
        closingDate: todayISO(),
        closingNote: closeNote.trim(),
      });
      setCloseModal(false);
      setCloseNote("");
      setSelectedId(null);
      await fetchTickets();
    } catch (e) {
      console.error("Close error:", e);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const submitResolutionFeedback = async () => {
    if (!feedbackDecision) {
      setFeedbackError("Please choose whether the issue is resolved or not.");
      return;
    }

    if (!feedbackRemark.trim()) {
      setFeedbackError("Remark is required.");
      return;
    }

    if (!sel?.id || statusActionLoading) return;

    setFeedbackError("");
    setStatusActionLoading(true);

    const isResolved = feedbackDecision === "resolved";
    const nextStatus = isResolved ? "Closed" : "In Progress";
    const remark = feedbackRemark.trim();

    try {
      await ITHelpdeskService.confirmResolvedFeedback({
        ticket_Id: sel.id,
        is_Resolved: isResolved,
        remarks: remark,
        updated_By: currentUser.emp_Id,
      });

      patchLocal(sel.id, {
        status: nextStatus,
        closingDate: isResolved ? todayISO() : null,
        closingNote: isResolved ? remark : "",
      });

      setFeedbackModal(false);
      setFeedbackDecision("");
      setFeedbackRemark("");
      setFeedbackError("");
      await fetchTickets();
    } catch (e) {
      console.error("Resolution feedback error:", e);
    } finally {
      setStatusActionLoading(false);
    }
  };

  // const openResolutionFeedback = (decision = "") => {
  //   setFeedbackDecision(decision);
  //   setFeedbackRemark("");
  //   setFeedbackError("");
  //   setFeedbackModal(true);
  // };

  const sendStrike = async () => {
    const errs = {};
    if (!strikeForm.mailId.trim()) errs.mailId = "Mail ID required.";
    if (!strikeForm.note.trim()) errs.note = "Follow-up message required.";
    setStrikeErrors(errs);
    if (Object.keys(errs).length) return;
    const strikes = ticketStrikes[sel.id] || [];
    const groups = getStrikeGroups(strikes);
    const activeGroup =
      groups.length > 0 &&
      !groups[groups.length - 1].every((s) => s.response_Received)
        ? groups[groups.length - 1]
        : [];
    try {
      await ITHelpdeskService.sendStrike({
        ticket_Id: sel.id,
        strike_No: activeGroup.length + 1,
        mail_Id: strikeForm.mailId.trim(),
        strike_Note: strikeForm.note.trim(),
        sent_By: currentUser.emp_Id,
      });
      const res = await ITHelpdeskService.getStrikes(sel.id);
      setTicketStrikes((prev) => ({ ...prev, [sel.id]: res?.data || [] }));
      setStrikeForm({ mailId: "", note: "" });
    } catch (e) {
      console.error("Strike error:", e);
    }
  };

  const markResponse = async (strikeId) => {
    const note = (responseForm[strikeId]?.note || "").trim();
    if (!note) {
      setResponseForm((p) => ({
        ...p,
        [strikeId]: { ...p[strikeId], error: "Response note required." },
      }));
      return;
    }
    setResponseForm((p) => ({ ...p, [strikeId]: { note: "", error: "" } }));
    try {
      await ITHelpdeskService.respondStrike({
        strike_Id: strikeId,
        response_Note: note,
      });
      const res = await ITHelpdeskService.getStrikes(sel.id);
      setTicketStrikes((prev) => ({ ...prev, [sel.id]: res?.data || [] }));
    } catch (e) {
      console.error("Respond strike error:", e);
    }
  };

  const autoClose = async () => {
    try {
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: "Closed",
        remarks: "Auto-closed after 3 unanswered follow-ups.",
        updated_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, {
        status: "Closed",
        closingDate: todayISO(),
        autoClosedAfterStrikes: true,
        closingNote: "Auto-closed after 3 unanswered follow-ups.",
      });
      setSelectedId(null);
      await fetchTickets();
    } catch (e) {
      console.error("Auto close error:", e);
    }
  };

  const [helpdeskUsers, setHelpdeskUsers] = useState([]);
  console.log("helpdeskUsers", helpdeskUsers);
  const [helpdeskUsersLoading, setHelpdeskUsersLoading] = useState(false);

  useEffect(() => {
    if (!isIT) return;

    setHelpdeskUsersLoading(true);
    ITHelpdeskService.getUsersForHD()
      .then((res) => setHelpdeskUsers(res?.data || []))
      .catch((e) => console.error("Helpdesk users fetch error", e))
      .finally(() => setHelpdeskUsersLoading(false));
  }, []);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    setMsgLoading(true);
    let receiver_id =
      currentUser.emp_Id === sel.createdByEmpId
        ? sel.itAssigneeIds?.[0]
        : sel.createdByEmpId;

    try {
      await ITHelpdeskService.addDiscussion({
        ticket_Id: sel.id,
        message_Text: newMsg.trim(),
        message_By: currentUser.emp_Id,
        receiver_Email: receiver_id
          ? helpdeskUsers.find((e) => String(e.emp_Id) === receiver_id)
              ?.emp_Email || ""
          : "",
        ticket_No: sel.ticketNo,
        sender_Name: currentUser.emp_Name,
      });
      const res = await ITHelpdeskService.getDiscussions(sel.id);
      const msgs = (res?.data || []).map((m) => ({
        ...m,
        isIT: m.message_By === currentUser.emp_Id && isIT,
        isHR: m.message_By === currentUser.emp_Id && isHR,
        senderId: m.message_By,
      }));
      setTicketMessages((prev) => ({ ...prev, [sel.id]: msgs }));
      setNewMsg("");
    } catch (e) {
      console.error("Message error:", e);
    } finally {
      setMsgLoading(false);
    }
  };

  const confirmStageMove = async () => {
    if (!stageRemarksModal.targetStatus) return;
    await moveStatus(stageRemarksModal.targetStatus, stageRemarksModal.remarks);
    setStageRemarksModal({ open: false, targetStatus: "", remarks: "" });
  };

  const submitReassign = async () => {
    if (!reassignee) return;
    try {
      await ITHelpdeskService.reassignTicket({
        ticket_Id: sel.id,
        assigned_Person: reassignee.emp_Id,
        updated_By: currentUser.emp_Id,
        remarks: "",
      });
      try {
        await ITHelpdeskService.updateHistory({
          ticket_Id: sel.id,
          action_Type: "REASSIGNED",
          old_Value: sel.itAssignees?.join(", ") || "",
          new_Value: reassignee.emp_Name,
          remarks: `Reassigned to ${reassignee.emp_Name}`,
          action_By: currentUser.emp_Id,
        });
      } catch (histErr) {
        console.warn("History log after reassign failed:", histErr);
      }
      patchLocal(sel.id, {
        itAssignees: [reassignee.emp_Name],
        itAssigneeIds: [String(reassignee.emp_Id)],
      });
      setReassignModal(false);
      await fetchTickets();
    } catch (e) {
      console.error("Reassign error:", e);
    }
  };

  const submitEditType = async (nt) => {
    try {
      await ITHelpdeskService.updateHistory({
        ticket_Id: sel.id,
        action_Type: "TYPE_CHANGED",
        old_Value: sel.requestType || "",
        new_Value: nt,
        remarks: "",
        action_By: currentUser.emp_Id,
      });
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: sel.status,
        remarks: `Type → ${nt}`,
        updated_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, { ticketType: nt, requestType: nt });
      setEditTypeModal(false);
    } catch (e) {
      console.error("Edit type error:", e);
    }
  };

  const submitEditPriority = async (np) => {
    try {
      await ITHelpdeskService.updateHistory({
        ticket_Id: sel.id,
        action_Type: "PRIORITY_CHANGED",
        old_Value: sel.priority || "",
        new_Value: np,
        remarks: "",
        action_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, { priority: np });
      setEditPriorityModal(false);
    } catch (e) {
      console.error("Edit priority error:", e);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.setItem("explicit_logout", "true");
    window.location.href = "/";
  };

  // --- NEW FILTER STATES ---
  const [ticketNoSearch, setTicketNoSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [requestTypeFilter, setRequestTypeFilter] = useState("All");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Derive unique user departments directly from fetched data
  const uniqueUserDepts = useMemo(() => {
    const depts = tickets
      .map((t) => t.userDept)
      .filter((d) => d && d.trim() !== "");
    return ["All", ...Array.from(new Set(depts))];
  }, [tickets]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setTicketNoSearch("");
    setDeptFilter("All");
    setRequestTypeFilter("All");
    setOrgFilter("All");
  };

  // ── Visible tickets ──────────────────────────────────────────────────────────
  const visibleTickets = useMemo(() => {
    let base = tickets;

    // Existing role filter
    if (isIT) base = base.filter((t) => t.ticketDept === "IT");
    if (isHR) base = base.filter((t) => t.ticketDept === "HR");

    // Existing Org filter
    if (orgFilter && orgFilter !== "All") {
      base = base.filter((t) => t.org === orgFilter);
    }

    // 1. Ticket No Search Box filter
    if (ticketNoSearch.trim()) {
      const query = ticketNoSearch.trim().toLowerCase();
      base = base.filter((t) =>
        (t.ticketNo || "").toLowerCase().includes(query),
      );
    }

    // 2. User Dept Dropdown filter
    if (deptFilter && deptFilter !== "All") {
      base = base.filter((t) => t.userDept === deptFilter);
    }

    // 3. Request Type filter
    if (requestTypeFilter && requestTypeFilter !== "All") {
      base = base.filter((t) => t.requestType === requestTypeFilter);
    }

    return base;
  }, [
    tickets,
    isIT,
    isHR,
    orgFilter,
    ticketNoSearch,
    deptFilter,
    requestTypeFilter,
  ]);

  const stats = useMemo(() => {
    const base = visibleTickets;
    const overdue = base.filter(
      (t) =>
        t.etaDate &&
        t.status !== "Closed" &&
        daysBetween(todayISO(), t.etaDate) < 0,
    ).length;
    return {
      total: base.length,
      open: base.filter((t) => t.status === "Open").length,
      inProgress: base.filter((t) => t.status === "In Progress").length,
      onHold: base.filter((t) => t.status === "On Hold").length,
      waiting: base.filter((t) => t.status === "Waiting for User Input").length,
      acceptance: base.filter((t) => t.status === "Acceptance").length,
      resolved: base.filter((t) => t.status === "Resolved").length,
      closed: base.filter((t) => t.status === "Closed").length,
      overdue,
    };
  }, [visibleTickets]);

  // ── Kanban helpers — ID-based assignment check ───────────────────────────────
  // All "is this ticket mine?" checks use itAssigneeIds + myEmpId exclusively.
  const isMine = (t) => t.itAssigneeIds?.includes(myEmpId);

  // ── buildITColumns ───────────────────────────────────────────────────────────
  const buildITColumns = () => {
    const openUnassigned = visibleTickets.filter(
      (t) => !t.enrolledByIT && t.status === "Open",
    );

    // Queue: enrolled, not-closed, not-open, NOT mine
    const queueTickets = visibleTickets.filter(
      (t) =>
        t.enrolledByIT &&
        t.status !== "Closed" &&
        t.status !== "Open" &&
        t.status !== "Resolved" &&
        !isMine(t),
    );

    const assignedToMe = visibleTickets.filter(
      (t) => t.enrolledByIT && t.status === "Assigned" && isMine(t),
    );

    const acceptanceMe = visibleTickets.filter(
      (t) => t.status === "Acceptance" && isMine(t),
    );

    const inProgressMe = visibleTickets.filter(
      (t) => t.enrolledByIT && t.status === "In Progress" && isMine(t),
    );

    const testingMe = visibleTickets.filter(
      (t) => t.enrolledByIT && TESTING_STATUSES.includes(t.status) && isMine(t),
    );

    const waitingMe = visibleTickets.filter(
      (t) =>
        t.status === "Waiting for User Input" &&
        FULL_FLOW_CATEGORIES.includes(t.category) &&
        isMine(t),
    );

    const onHoldMe = visibleTickets.filter(
      (t) =>
        t.status === "On Hold" &&
        FULL_FLOW_CATEGORIES.includes(t.category) &&
        isMine(t),
    );

    const resolvedMe = visibleTickets.filter((t) => t.status === "Resolved");

    const closedAll = visibleTickets.filter((t) => t.status === "Closed");

    const cols = [
      {
        key: "open",
        label: "Open",
        meta: STATUS_META["Open"],
        items: openUnassigned,
        subtitle: "Awaiting assignment",
        accent: "emerald",
      },
      {
        key: "queue",
        label: "Queue",
        meta: {
          dot: "bg-slate-400",
          txt: "text-slate-600",
          chip: "bg-slate-100 text-slate-600",
          Icon: List,
        },
        items: queueTickets,
        subtitle: "Others' ongoing tickets",
        accent: "slate",
      },
      {
        key: "assigned_me",
        label: "Assigned to Me",
        meta: STATUS_META["Assigned"],
        items: assignedToMe,
        subtitle: "Enrolled & assigned to you",
        accent: "purple",
      },
      {
        key: "acceptance_me",
        label: "Acceptance",
        meta: STATUS_META["Acceptance"],
        items: acceptanceMe,
        subtitle: "Review then start work",
        accent: "sky",
      },
      {
        key: "in_progress_me",
        label: "In Progress",
        meta: STATUS_META["In Progress"],
        items: inProgressMe,
        subtitle: "My active work",
        accent: "blue",
      },
      {
        key: "testing_me",
        label: "Testing",
        meta: {
          dot: "bg-indigo-500",
          txt: "text-indigo-700",
          chip: "bg-indigo-100 text-indigo-700",
          Icon: FlaskConical,
        },
        items: testingMe,
        subtitle: "IT / User testing",
        accent: "indigo",
      },
    ];

    if (waitingMe.length > 0)
      cols.push({
        key: "waiting_me",
        label: "Waiting for User Input",
        meta: STATUS_META["Waiting for User Input"],
        items: waitingMe,
        subtitle: "Awaiting user response",
        accent: "orange",
      });

    if (onHoldMe.length > 0)
      cols.push({
        key: "on_hold_me",
        label: "On Hold",
        meta: STATUS_META["On Hold"],
        items: onHoldMe,
        subtitle: "Blocked / paused",
        accent: "amber",
      });

    cols.push(
      {
        key: "resolved_me",
        label: "Resolved",
        meta: STATUS_META["Resolved"],
        items: resolvedMe,
        subtitle: "Awaiting confirmation",
        accent: "emerald",
      },
      {
        key: "closed",
        label: "Closed",
        meta: STATUS_META["Closed"],
        items: closedAll,
        subtitle: null,
        accent: "slate",
      },
    );

    return cols;
  };

  // ── buildHRColumns ───────────────────────────────────────────────────────────
  const buildHRColumns = () => {
    const openUnassigned = visibleTickets.filter(
      (t) => !t.enrolledByIT && t.status === "Open",
    );

    // Queue: enrolled, not-closed, not-open, NOT mine
    const queueTickets = visibleTickets.filter(
      (t) =>
        t.enrolledByIT &&
        t.status !== "Closed" &&
        t.status !== "Open" &&
        !isMine(t),
    );

    const assignedToMe = visibleTickets.filter(
      (t) => t.enrolledByIT && t.status === "Assigned" && isMine(t),
    );

    const acceptanceMe = visibleTickets.filter(
      (t) => t.status === "Acceptance" && isMine(t),
    );

    const inProgressMe = visibleTickets.filter(
      (t) => t.enrolledByIT && t.status === "In Progress" && isMine(t),
    );

    const resolvedMe = visibleTickets.filter(
      (t) => t.status === "Resolved" && isMine(t),
    );

    const closedAll = visibleTickets.filter((t) => t.status === "Closed");

    return [
      {
        key: "hr_open",
        label: "Open",
        meta: STATUS_META["Open"],
        items: openUnassigned,
        subtitle: "Awaiting HR",
        accent: "slate",
      },
      {
        key: "hr_queue",
        label: "Queue",
        meta: {
          dot: "bg-slate-400",
          txt: "text-slate-600",
          chip: "bg-slate-100 text-slate-600",
          Icon: List,
        },
        items: queueTickets,
        subtitle: "Others' ongoing tickets",
        accent: "slate",
      },
      {
        key: "hr_assigned_me",
        label: "Assigned to Me",
        meta: STATUS_META["Assigned"],
        items: assignedToMe,
        subtitle: "Assigned to you",
        accent: "purple",
      },
      {
        key: "hr_acceptance_me",
        label: "Acceptance",
        meta: STATUS_META["Acceptance"],
        items: acceptanceMe,
        subtitle: "Review then start work",
        accent: "sky",
      },
      {
        key: "hr_inprogress_me",
        label: "In Progress",
        meta: STATUS_META["In Progress"],
        items: inProgressMe,
        subtitle: "My active work",
        accent: "indigo",
      },
      {
        key: "hr_resolved_me",
        label: "Resolved",
        meta: STATUS_META["Resolved"],
        items: resolvedMe,
        subtitle: "Awaiting confirmation",
        accent: "emerald",
      },
      {
        key: "hr_closed",
        label: "Closed",
        meta: STATUS_META["Closed"],
        items: closedAll,
        subtitle: null,
        accent: "slate",
      },
    ];
  };

  const allKanbanCols = isHR ? buildHRColumns() : buildITColumns();

  const ACCENT_COL = {
    emerald: {
      border: "border-emerald-200",
      bg: "bg-emerald-50/20",
      hdr: "border-emerald-100",
      sub: "text-emerald-600",
      inner: "bg-emerald-50/10",
    },
    blue: {
      border: "border-blue-200",
      bg: "bg-blue-50/30",
      hdr: "border-blue-100",
      sub: "text-blue-500",
      inner: "bg-blue-50/20",
    },
    indigo: {
      border: "border-indigo-200",
      bg: "bg-indigo-50/30",
      hdr: "border-indigo-100",
      sub: "text-indigo-500",
      inner: "bg-indigo-50/20",
    },
    purple: {
      border: "border-purple-200",
      bg: "bg-purple-50/30",
      hdr: "border-purple-100",
      sub: "text-purple-500",
      inner: "bg-purple-50/20",
    },
    orange: {
      border: "border-orange-200",
      bg: "bg-orange-50/30",
      hdr: "border-orange-100",
      sub: "text-orange-500",
      inner: "bg-orange-50/20",
    },
    amber: {
      border: "border-amber-200",
      bg: "bg-amber-50/30",
      hdr: "border-amber-100",
      sub: "text-amber-500",
      inner: "bg-amber-50/20",
    },
    sky: {
      border: "border-sky-200",
      bg: "bg-sky-50/30",
      hdr: "border-sky-100",
      sub: "text-sky-500",
      inner: "bg-sky-50/20",
    },
    slate: {
      border: "border-slate-200",
      bg: "bg-white",
      hdr: "border-slate-100",
      sub: "text-slate-400",
      inner: "bg-slate-50/50",
    },
  };

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;}
    body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;margin:0;}
    .mono{font-family:'JetBrains Mono',monospace;}
    .thin-scroll::-webkit-scrollbar{width:4px;}
    .thin-scroll::-webkit-scrollbar-track{background:transparent;}
    .thin-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px;}
    .modal-overlay{position:fixed;inset:0;z-index:50;background:rgba(15,23,42,0.65);display:flex;align-items:center;justify-content:center;padding:1rem;}
    .modal-box{background:#fff;border-radius:1.25rem;border:1px solid #e2e8f0;box-shadow:0 25px 60px rgba(0,0,0,0.2);width:100%;max-width:940px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;}
    .mini-modal{background:#fff;border-radius:1rem;border:1px solid #e2e8f0;box-shadow:0 20px 50px rgba(0,0,0,0.25);width:100%;max-width:440px;}
    .cb-it{background:#1e293b;color:#f8fafc;border-radius:1rem 1rem 0.25rem 1rem;padding:.5rem .875rem;max-width:78%;font-size:.8125rem;line-height:1.5;}
    .cb-hr{background:#4338ca;color:#fff;border-radius:1rem 1rem 0.25rem 1rem;padding:.5rem .875rem;max-width:78%;font-size:.8125rem;line-height:1.5;}
    .cb-user{background:#f1f5f9;color:#1e293b;border-radius:1rem 1rem 1rem 0.25rem;padding:.5rem .875rem;max-width:78%;font-size:.8125rem;line-height:1.5;}
    .cb-self{background:#3b82f6;color:#fff;border-radius:1rem 1rem 0.25rem 1rem;padding:.5rem .875rem;max-width:78%;font-size:.8125rem;line-height:1.5;}
    @media(max-width:640px){
      .modal-box{max-height:98vh;border-radius:.75rem;}
      .mini-modal{max-width:100%!important;}
    }
    @media(max-width:480px){.modal-overlay{padding:.5rem;}}
  `;

  // ─── User view ───────────────────────────────────────────────────────────────
  if (isDeptUser) {
    return (
      <>
        <style>{globalStyles}</style>
        <UserDashboard
          currentUser={currentUser}
          tickets={tickets}
          ticketsLoading={ticketsLoading}
          onSelectTicket={setSelectedId}
          selectedId={selectedId}
          onCreateITTicket={() => setCreateITOpen(true)}
          onCreateHRTicket={() => setCreateHROpen(true)}
          onLogout={handleLogout}
        />
        {sel && (
          <TicketModal
            ticket={sel}
            currentUser={currentUser}
            isIT={false}
            isHR={false}
            canAct={false}
            onClose={() => setSelectedId(null)}
            enrollForm={enrollForm}
            setEnrollForm={setEnrollForm}
            enrollErrors={enrollErrors}
            onEnroll={enrollTicket}
            enrollLoading={enrollLoading}
            onMoveStatus={(ns) =>
              setStageRemarksModal({
                open: true,
                targetStatus: ns,
                remarks: "",
              })
            }
            onPutOnHold={() => {
              setHoldNote("");
              setHoldReasonType("");
              setHoldError("");
              setHoldModalType("hold");
              setHoldModal(true);
            }}
            onWaitingForUserInput={() => {
              setHoldNote("");
              setHoldReasonType("");
              setHoldError("");
              setHoldModalType("waiting");
              setHoldModal(true);
            }}
            onCloseTicket={() => {
              setCloseNote("");
              setCloseError("");
              setCloseModal(true);
            }}
            onOpenResolutionFeedback={openResolutionFeedback}
            onResolveTicket={() => {
              setResolveNote("");
              setResolveError("");
              setResolveModal(true);
            }}
            onAcceptanceTicket={() => {
              setAcceptanceNote("");
              setAcceptanceError("");
              setAcceptanceModal(true);
            }}
            strikeForm={strikeForm}
            setStrikeForm={setStrikeForm}
            strikeErrors={strikeErrors}
            onSendStrike={sendStrike}
            responseForm={responseForm}
            setResponseForm={setResponseForm}
            onMarkResponse={markResponse}
            onAutoClose={autoClose}
            newMsg={newMsg}
            setNewMsg={setNewMsg}
            onSendMsg={sendMessage}
            msgLoading={msgLoading}
            onReassign={() => {
              setReassignee(null);
              setReassignModal(true);
            }}
            onEditType={() => setEditTypeModal(true)}
            onEditPriority={() => setEditPriorityModal(true)}
            detailLoading={detailLoading}
            employees={employees}
            catalogTree={catalogTree}
            catalogLoading={catalogLoading}
          />
        )}
        {createITOpen && (
          <CreateITModal
            catalogTree={catalogTree}
            catalogLoading={catalogLoading}
            currentUser={currentUser}
            onClose={() => setCreateITOpen(false)}
            onSubmit={createTicket}
            submitting={submitting}
            isIT={isIT}
          />
        )}
        {createHROpen && (
          <CreateHRModal
            catalogTree={catalogTree}
            catalogLoading={catalogLoading}
            currentUser={currentUser}
            onClose={() => setCreateHROpen(false)}
            onSubmit={createTicket}
            submitting={submitting}
          />
        )}

        {feedbackModal && (
          <div
            className="modal-overlay"
            onClick={(e) =>
              e.target === e.currentTarget && setFeedbackModal(false)
            }
          >
            <div className="mini-modal p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Resolution Feedback
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Confirm whether the issue is resolved and add a remark.
                  </p>
                </div>
                <button
                  onClick={() => setFeedbackModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <Field label="Confirmation" error="">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackDecision("resolved")}
                    className={`h-10 rounded-xl border text-sm font-bold transition-colors ${
                      feedbackDecision === "resolved"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Issue Resolved
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackDecision("not_resolved")}
                    className={`h-10 rounded-xl border text-sm font-bold transition-colors ${
                      feedbackDecision === "not_resolved"
                        ? "bg-orange-600 text-white border-orange-600"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Issue Not Resolved
                  </button>
                </div>
              </Field>

              <Field label="Remark" error={feedbackError}>
                <textarea
                  rows={4}
                  value={feedbackRemark}
                  onChange={(e) => setFeedbackRemark(e.target.value)}
                  placeholder="Enter user confirmation / denial remark..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 resize-none"
                />
              </Field>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setFeedbackModal(false)}
                  className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitResolutionFeedback}
                  className="flex-1 h-10 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 flex items-center justify-center gap-2"
                >
                  {statusActionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {statusActionLoading ? "Processing..." : "Submit Feedback"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ─── IT / HR Kanban view ─────────────────────────────────────────────────────
  return (
    <>
      <style>{globalStyles}</style>
      <div className="h-screen overflow-hidden bg-slate-100 text-slate-900 flex flex-col">
        <header className="flex-none border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto max-w-[1900px] px-3 sm:px-5 py-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-none">
                  {isHR ? (
                    <Briefcase className="w-4 h-4 text-white" />
                  ) : (
                    <Wrench className="w-4 h-4 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                    {isHR ? "HR" : "IT"} Helpdesk
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                    Category-driven ticket management
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* <div
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${isHR ? "border-indigo-200 bg-indigo-50" : "border-teal-200 bg-teal-50"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${isHR ? "bg-indigo-500" : "bg-teal-500"} text-white`}
                  >
                    {currentUser.emp_Name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-none">
                      {currentUser.emp_Name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      #{currentUser.emp_No}
                    </p>
                  </div>
                </div> */}
                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((p) => !p)}
                    className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 hover:bg-teal-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center text-xs font-black">
                      {currentUser.emp_Name
                        ?.split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-bold text-slate-800 leading-none">
                        {currentUser.emp_Name}
                      </p>
                      <p className="text-[10px] font-semibold text-teal-600">
                        {currentUser.emp_No || currentUser.emp_Id}
                      </p>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-teal-700 transition-transform ${
                        profileMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {currentUser.emp_Name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Employee ID:{" "}
                          {currentUser.emp_No || currentUser.emp_Id}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setChangePasswordOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <KeyRound className="w-4 h-4 text-slate-500" />
                        Change Password
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setCreateITOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 sm:px-4 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">IT </span>Ticket
                </button>
                {/* <button
                  onClick={() => setCreateHROpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 sm:px-4 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">HR </span>Ticket
                </button> */}
                <button
                  onClick={() => setExcelModalOpen(true)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 sm:px-4 text-xs sm:text-sm font-bold border transition-colors ${isHR ? "border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100" : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"}`}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-2 sm:mt-3 flex items-center justify-between flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-2 flex-wrap relative">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Org:
                </span>
                {["All", "IML", "CSIL", "Daedalus"].map((org) => (
                  <button
                    key={org}
                    onClick={() => setOrgFilter(org)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                      orgFilter === org
                        ? org === "All"
                          ? "bg-slate-800 text-white border-slate-800"
                          : ORG_PILL[org] + " shadow-sm"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {org}
                  </button>
                ))}
                {/* Search Box by Ticket No */}
                <div className="relative">
                  <input
                    type="text"
                    value={ticketNoSearch}
                    onChange={(e) => setTicketNoSearch(e.target.value)}
                    placeholder="Search Ticket No..."
                    className="h-8 w-36 sm:w-44 rounded-lg border border-slate-300 bg-white px-2.5 text-xs focus:outline-none focus:border-slate-500"
                  />
                  {ticketNoSearch && (
                    <button
                      onClick={() => setTicketNoSearch("")}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Toggle Dropdown Panel for Dept & Request Type */}
                <button
                  type="button"
                  onClick={() => setFilterPanelOpen((p) => !p)}
                  className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                    deptFilter !== "All" || requestTypeFilter !== "All"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>More Filters</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      filterPanelOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Reset Filters Button */}
                {(ticketNoSearch ||
                  deptFilter !== "All" ||
                  requestTypeFilter !== "All" ||
                  orgFilter !== "All") && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 underline px-1"
                  >
                    Reset
                  </button>
                )}

                <button
                  onClick={fetchTickets}
                  className="ml-1 w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${ticketsLoading ? "animate-spin" : ""}`}
                  />
                </button>

                {/* Collapsible Dropdown Panel */}
                {filterPanelOpen && (
                  <div className="absolute top-full left-0 mt-2 z-50 w-72 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        User Dept
                      </label>
                      <select
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs focus:outline-none focus:border-slate-500"
                      >
                        {uniqueUserDepts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Request Type
                      </label>
                      <select
                        value={requestTypeFilter}
                        onChange={(e) => setRequestTypeFilter(e.target.value)}
                        className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs focus:outline-none focus:border-slate-500"
                      >
                        <option value="All">All Types</option>
                        <option value="Incident">Incident</option>
                        <option value="Service Request">Service Request</option>
                      </select>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setFilterPanelOpen(false)}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {[
                  { l: "Total", v: stats.total, t: "slate" },
                  { l: "Open", v: stats.open, t: "slate" },
                  { l: "Progress", v: stats.inProgress, t: "blue" },
                  ...(isIT
                    ? [
                        { l: "On Hold", v: stats.onHold, t: "amber" },
                        { l: "Waiting", v: stats.waiting, t: "orange" },
                      ]
                    : []),
                  { l: "Acceptance", v: stats.acceptance, t: "sky" },
                  { l: "Resolved", v: stats.resolved, t: "emerald" },
                  { l: "Closed", v: stats.closed, t: "slate" },
                  { l: "Overdue", v: stats.overdue, t: "red", clickable: isIT },
                ].map((s) => {
                  const colorClass =
                    s.t === "red"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : s.t === "blue"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : s.t === "amber"
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : s.t === "orange"
                            ? "bg-orange-50 border-orange-200 text-orange-700"
                            : s.t === "emerald"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : s.t === "sky"
                                ? "bg-sky-50 border-sky-200 text-sky-700"
                                : "bg-white border-slate-200 text-slate-700";

                  if (s.clickable) {
                    return (
                      <button
                        key={s.l}
                        type="button"
                        onClick={() => setOverdueModalOpen(true)}
                        className={`rounded-xl border px-2 sm:px-3 py-1.5 sm:py-2 text-left transition-all hover:shadow-sm hover:border-red-300 cursor-pointer ${colorClass}`}
                        title="View overdue tickets"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                          {s.l}
                        </p>
                        <p className="text-base sm:text-lg font-extrabold leading-none mt-1">
                          {s.v}
                        </p>
                      </button>
                    );
                  }

                  return (
                    <div
                      key={s.l}
                      className={`rounded-xl border px-2 sm:px-3 py-1.5 sm:py-2 ${colorClass}`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                        {s.l}
                      </p>
                      <p className="text-base sm:text-lg font-extrabold leading-none mt-1">
                        {s.v}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-auto overflow-y-hidden p-3 sm:p-4 min-h-0">
          {ticketsLoading && !tickets.length ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mr-3" />
              Loading tickets…
            </div>
          ) : (
            <div
              className="flex gap-3 h-full"
              style={{ minWidth: `${allKanbanCols.length * 215}px` }}
            >
              {allKanbanCols.map((col) => {
                const Icon = col.meta.Icon;
                const ac = ACCENT_COL[col.accent] || ACCENT_COL.slate;
                return (
                  <div
                    key={col.key}
                    className={`flex flex-col rounded-2xl border shadow-sm min-h-0 ${ac.border} ${ac.bg}`}
                    style={{ minWidth: "200px", flex: "1" }}
                  >
                    <div
                      className={`flex flex-col border-b px-3 py-2.5 flex-none ${ac.hdr}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${col.meta.dot}`}
                          />
                          <Icon className={`w-3.5 h-3.5 ${col.meta.txt}`} />
                          <span className={`text-xs font-bold ${col.meta.txt}`}>
                            {col.label}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.meta.chip}`}
                        >
                          {col.items.length}
                        </span>
                      </div>
                      {col.subtitle && (
                        <p
                          className={`text-[10px] mt-0.5 ml-[18px] ${ac.sub} font-medium`}
                        >
                          {col.subtitle}
                        </p>
                      )}
                    </div>
                    <div
                      className={`flex-1 overflow-y-auto thin-scroll p-2 space-y-2 min-h-0 ${ac.inner}`}
                    >
                      {col.items.length === 0 ? (
                        <div className="flex items-center justify-center h-14 rounded-xl border border-dashed border-slate-200 bg-white text-[11px] text-slate-400">
                          No tickets
                        </div>
                      ) : (
                        col.items.map((t) => (
                          <TicketCard
                            key={t.id}
                            ticket={t}
                            active={t.id === selectedId}
                            onClick={() => setSelectedId(t.id)}
                            currentUser={currentUser}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {sel && (
        <TicketModal
          ticket={sel}
          currentUser={currentUser}
          isIT={isIT}
          isHR={isHR}
          canAct={canActOnTicket}
          onClose={() => setSelectedId(null)}
          enrollForm={enrollForm}
          setEnrollForm={setEnrollForm}
          enrollErrors={enrollErrors}
          onEnroll={enrollTicket}
          enrollLoading={enrollLoading}
          onMoveStatus={(ns) =>
            setStageRemarksModal({ open: true, targetStatus: ns, remarks: "" })
          }
          onPutOnHold={() => {
            setHoldNote("");
            setHoldReasonType("");
            setHoldError("");
            setHoldModalType("hold");
            setHoldModal(true);
          }}
          onWaitingForUserInput={() => {
            setHoldNote("");
            setHoldReasonType("");
            setHoldError("");
            setHoldModalType("waiting");
            setHoldModal(true);
          }}
          onCloseTicket={() => {
            setCloseNote("");
            setCloseError("");
            setCloseModal(true);
          }}
          onOpenResolutionFeedback={openResolutionFeedback}
          onResolveTicket={() => {
            setResolveNote("");
            setResolveError("");
            setResolveModal(true);
          }}
          onAcceptanceTicket={() => {
            setAcceptanceNote("");
            setAcceptanceError("");
            setAcceptanceModal(true);
          }}
          strikeForm={strikeForm}
          setStrikeForm={setStrikeForm}
          strikeErrors={strikeErrors}
          onSendStrike={sendStrike}
          responseForm={responseForm}
          setResponseForm={setResponseForm}
          onMarkResponse={markResponse}
          onAutoClose={autoClose}
          newMsg={newMsg}
          setNewMsg={setNewMsg}
          onSendMsg={sendMessage}
          msgLoading={msgLoading}
          onReassign={() => {
            // Pre-select current assignee by ID
            setReassignee(
              employees.find((e) =>
                sel.itAssigneeIds?.includes(String(e.emp_Id)),
              ) || null,
            );
            setReassignModal(true);
          }}
          onEditType={() => setEditTypeModal(true)}
          onEditPriority={() => setEditPriorityModal(true)}
          detailLoading={detailLoading}
          employees={employees}
          catalogTree={catalogTree}
          catalogLoading={catalogLoading}
        />
      )}

      {/* Stage remarks modal */}
      {stageRemarksModal.open && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget &&
            setStageRemarksModal({ open: false, targetStatus: "", remarks: "" })
          }
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Move to: {stageRemarksModal.targetStatus}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add remarks (optional).
                </p>
              </div>
              <button
                onClick={() =>
                  setStageRemarksModal({
                    open: false,
                    targetStatus: "",
                    remarks: "",
                  })
                }
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Field label="Remarks (optional)">
              <textarea
                rows={3}
                value={stageRemarksModal.remarks}
                onChange={(e) =>
                  setStageRemarksModal((p) => ({
                    ...p,
                    remarks: e.target.value,
                  }))
                }
                placeholder="Notes…"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
              />
            </Field>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() =>
                  setStageRemarksModal({
                    open: false,
                    targetStatus: "",
                    remarks: "",
                  })
                }
                className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStageMove}
                className="flex-1 h-10 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                {statusActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {statusActionLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold / Waiting modal */}
      {holdModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setHoldModal(false)}
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {holdModalType === "waiting"
                    ? "Set: Waiting for User Input"
                    : "Put On Hold"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {holdModalType === "waiting"
                    ? "Optionally add a note."
                    : "Document reason."}
                </p>
              </div>
              <button
                onClick={() => setHoldModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {holdModalType === "hold" && (
              <Field label="Reason Type" error={holdError}>
                <div className="relative">
                  <select
                    value={holdReasonType}
                    onChange={(e) => setHoldReasonType(e.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Select reason…</option>
                    {HOLD_REASON_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </Field>
            )}
            <div className={holdModalType === "hold" ? "mt-3" : ""}>
              <Field label="Remarks (optional)">
                <textarea
                  rows={3}
                  value={holdNote}
                  onChange={(e) => setHoldNote(e.target.value)}
                  placeholder={
                    holdModalType === "waiting"
                      ? "What are you waiting on? (optional)"
                      : "Optional context…"
                  }
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none resize-none ${holdModalType === "waiting" ? "border-orange-300 focus:border-orange-400" : "border-slate-300 focus:border-amber-400"}`}
                />
              </Field>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setHoldModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={
                  holdModalType === "waiting" ? submitWaiting : submitHold
                }
                className={`flex-1 h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 ${holdModalType === "waiting" ? "bg-orange-500 hover:bg-orange-600" : "bg-amber-500 hover:bg-amber-600"}`}
              >
                {holdModalType === "waiting" ? (
                  <>
                    <Timer className="w-4 h-4" />
                    Set Waiting
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Put On Hold
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Acceptance modal */}
      {acceptanceModal && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setAcceptanceModal(false)
          }
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-sky-600" />
                  Accept Ticket
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm you have reviewed the ticket. After acceptance you can
                  start work.
                </p>
              </div>
              <button
                onClick={() => setAcceptanceModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Field label="Acceptance Note (optional)" error={acceptanceError}>
              <textarea
                rows={3}
                value={acceptanceNote}
                onChange={(e) => setAcceptanceNote(e.target.value)}
                placeholder="Any notes about what you reviewed or clarified?"
                className="w-full rounded-xl border border-sky-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 resize-none"
              />
            </Field>
            <div className="mt-3 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-700">
              <p className="font-bold mb-0.5">What happens next?</p>
              <p>
                Ticket moves to <b>Acceptance</b>. From there you can move it to{" "}
                <b>In Progress</b> to begin working.
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setAcceptanceModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAcceptance}
                className="flex-1 h-10 rounded-xl bg-sky-600 text-sm font-bold text-white hover:bg-sky-700 flex items-center justify-center gap-2"
              >
                {statusActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BadgeCheck className="w-4 h-4" />
                )}
                {statusActionLoading ? "Processing..." : "Accept Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve modal */}
      {resolveModal && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setResolveModal(false)
          }
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                  Mark as Resolved
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add resolution note. User will need to confirm before closing.
                </p>
              </div>
              <button
                onClick={() => setResolveModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Field label="Resolution Note" error={resolveError}>
              <textarea
                rows={4}
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="What was done to resolve this? Steps taken, outcome…"
                className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 resize-none"
              />
            </Field>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setResolveModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitResolve}
                className="flex-1 h-10 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close modal */}
      {closeModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setCloseModal(false)}
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Close Ticket
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add closing remarks.
                </p>
              </div>
              <button
                onClick={() => setCloseModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Field label="Closing Remarks" error={closeError}>
              <textarea
                rows={4}
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="Outcome, what was done…"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 resize-none"
              />
            </Field>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setCloseModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitClose}
                className="flex-1 h-10 rounded-xl bg-slate-800 text-sm font-bold text-white hover:bg-slate-900 flex items-center justify-center gap-2"
              >
                {statusActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {statusActionLoading ? "Processing..." : "Confirm Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackModal && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setFeedbackModal(false)
          }
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Resolution Feedback
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm whether the issue is resolved and add a remark.
                </p>
              </div>
              <button
                onClick={() => setFeedbackModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Field label="Confirmation" error="">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackDecision("resolved")}
                  className={`h-10 rounded-xl border text-sm font-bold transition-colors ${
                    feedbackDecision === "resolved"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Issue Resolved
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackDecision("not_resolved")}
                  className={`h-10 rounded-xl border text-sm font-bold transition-colors ${
                    feedbackDecision === "not_resolved"
                      ? "bg-orange-600 text-white border-orange-600"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Issue Not Resolved
                </button>
              </div>
            </Field>

            <Field label="Remark" error={feedbackError}>
              <textarea
                rows={4}
                value={feedbackRemark}
                onChange={(e) => setFeedbackRemark(e.target.value)}
                placeholder="Enter user confirmation / denial remark..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 resize-none"
              />
            </Field>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setFeedbackModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitResolutionFeedback}
                className="flex-1 h-10 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                {statusActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {statusActionLoading ? "Processing..." : "Submit Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign modal */}
      {reassignModal && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setReassignModal(false)
          }
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Reassign
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select an engineer.
                </p>
              </div>
              <button
                onClick={() => setReassignModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <AssigneeDropdown
              value={reassignee}
              onChange={setReassignee}
              employees={employees}
              label="Select Engineer"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setReassignModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReassign}
                disabled={!reassignee}
                className="flex-1 h-10 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Reassign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Type modal */}
      {editTypeModal && sel && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setEditTypeModal(false)
          }
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Change Request Type
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Current:{" "}
                  <span className="font-bold">{sel.requestType || "—"}</span>
                </p>
              </div>
              <button
                onClick={() => setEditTypeModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <RequestTypeSelector
              value={sel.requestType || "Service Request"}
              onChange={(nt) => submitEditType(nt)}
            />
          </div>
        </div>
      )}

      {/* Edit Priority modal */}
      {editPriorityModal && sel && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setEditPriorityModal(false)
          }
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Change Priority
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Current:{" "}
                  <span className="font-bold">{sel.priority || "—"}</span>
                </p>
              </div>
              <button
                onClick={() => setEditPriorityModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {PRIORITIES.map((p) => {
                const isSel = sel.priority === p;
                const cfg = {
                  Critical: {
                    base: "border-red-200 bg-red-50/60",
                    active: "border-red-500 bg-red-50 ring-2 ring-red-100",
                    txt: "text-red-700",
                    detail: "text-red-500",
                  },
                  Medium: {
                    base: "border-amber-200 bg-amber-50/60",
                    active:
                      "border-amber-500 bg-amber-50 ring-2 ring-amber-100",
                    txt: "text-amber-700",
                    detail: "text-amber-500",
                  },
                  Normal: {
                    base: "border-blue-200 bg-blue-50/60",
                    active: "border-blue-500 bg-blue-50 ring-2 ring-blue-100",
                    txt: "text-blue-700",
                    detail: "text-blue-500",
                  },
                }[p];
                return (
                  <button
                    key={p}
                    onClick={() => submitEditPriority(p)}
                    className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all flex items-center justify-between ${isSel ? cfg.active : cfg.base + " hover:opacity-80"}`}
                  >
                    <div>
                      <p className={`text-sm font-bold ${cfg.txt}`}>{p}</p>
                      <p className={`text-[11px] mt-0.5 ${cfg.detail}`}>
                        {PRIORITY_DETAILS[p]}
                      </p>
                    </div>
                    {isSel && <CheckCircle2 className={`w-4 h-4 ${cfg.txt}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {acceptanceDetailModal && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setAcceptanceDetailModal(false)
          }
        >
          <div className="mini-modal p-6" style={{ maxWidth: "460px" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Accept Service Request
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add start date and ETA date before moving this ticket to
                  Acceptance.
                </p>
              </div>
              <button
                onClick={() => setAcceptanceDetailModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Start Date">
                <input
                  type="date"
                  value={acceptanceDetailForm.startDate}
                  onChange={(e) =>
                    setAcceptanceDetailForm((p) => ({
                      ...p,
                      startDate: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:border-slate-400"
                />
              </Field>

              <Field label="ETA Date">
                <input
                  type="date"
                  min={acceptanceDetailForm.startDate}
                  value={acceptanceDetailForm.etaDate}
                  onChange={(e) =>
                    setAcceptanceDetailForm((p) => ({
                      ...p,
                      etaDate: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:border-slate-400"
                />
              </Field>

              {!!acceptanceNote && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Acceptance note: {acceptanceNote}
                </div>
              )}

              {acceptanceDetailError && (
                <p className="text-xs font-semibold text-red-600">
                  {acceptanceDetailError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setAcceptanceDetailModal(false)}
                  className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAcceptanceWithDetails}
                  disabled={statusActionLoading}
                  className="flex-1 h-10 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {statusActionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BadgeCheck className="w-4 h-4" />
                  )}
                  Accept Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {createITOpen && (
        <CreateITModal
          catalogTree={catalogTree}
          catalogLoading={catalogLoading}
          currentUser={currentUser}
          onClose={() => setCreateITOpen(false)}
          onSubmit={createTicket}
          submitting={submitting}
          isIT={isIT}
        />
      )}
      {createHROpen && (
        <CreateHRModal
          catalogTree={catalogTree}
          catalogLoading={catalogLoading}
          currentUser={currentUser}
          onClose={() => setCreateHROpen(false)}
          onSubmit={createTicket}
          submitting={submitting}
        />
      )}
      {excelModalOpen && (
        <ExcelDownloadModal
          onClose={() => setExcelModalOpen(false)}
          tickets={tickets}
          dept={isIT ? "IT" : "HR"}
        />
      )}
      {changePasswordOpen && (
        <ChangePasswordModal
          currentUser={currentUser}
          onClose={() => setChangePasswordOpen(false)}
        />
      )}
      <OverdueTicketsModal
        open={overdueModalOpen}
        onClose={() => setOverdueModalOpen(false)}
        tickets={overdueTickets}
        onSelectTicket={setSelectedId}
      />
    </>
  );
}
