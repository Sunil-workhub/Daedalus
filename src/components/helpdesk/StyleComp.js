import {
  AlertCircle,
  BadgeCheck,
  ClipboardList,
  Clock3,
  Database,
  FlaskConical,
  HardDrive,
  Inbox,
  List,
  MessageSquareText,
  PlayCircle,
  TestTube,
  ThumbsUp,
  Timer,
  UserCheck,
  WifiOff,
  XCircle,
  Zap,
} from "lucide-react";

export const CATEGORY_META = {
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

export const FULL_FLOW_CATEGORIES = ["software", "erp"];

export const TESTING_STATUSES = [
  "IT Testing",
  "Ready for Demo",
  "User Testing",
];

export const STATUS_META = {
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

export const PRIORITIES = ["Critical", "Medium", "Normal"];

export const PRIORITY_DETAILS = {
  Critical: "Impacting whole organisation",
  Medium: "Impacting multiple users",
  Normal: "Impacting single user",
};

export const TICKET_TYPES = ["Service Request", "Incident"];

export const PRIORITY_PILL = {
  Critical: "bg-red-100 text-red-700 border border-red-200",
  Medium: "bg-amber-100 text-amber-700 border border-amber-200",
  Normal: "bg-blue-100 text-blue-700 border border-blue-200",
};

export const ORG_PILL = {
  IML: "bg-blue-100 text-blue-700 border border-blue-200",
  CSIL: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Daedalus: "bg-purple-100 text-purple-700 border border-purple-200",
};

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const fmt = (d) =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
export const fmtTime = (iso) => {
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

export const addHoursToDate = (dateStr, hours) => {
  if (!dateStr || !hours) return null;
  const start = new Date(dateStr);
  if (isNaN(start.getTime())) return null;
  return new Date(start.getTime() + Number(hours) * 60 * 60 * 1000);
};

export const fmtDateTime = (date) => {
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
export const daysBetween = (a, b) => {
  const d1 = new Date(a);
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(b);
  d2.setHours(0, 0, 0, 0);
  return Math.ceil((d2 - d1) / 86400000);
};
