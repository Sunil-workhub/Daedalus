import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Building2,
  AlertTriangle,
  Layers3,
  Users,
  CalendarDays,
  BriefcaseBusiness,
  Wrench,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronDown,
  ArrowUpRight,
  Activity,
  Filter,
  X,
  ChevronRight,
  User,
  UserCheck,
  MessageSquareText,
  Paperclip,
  Hourglass,
  Timer,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ITHelpdeskService from "../../services/helpdesk/HelpdeskService";

function getSessionUser() {
  try {
    const raw = sessionStorage.getItem("user");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
const sessionUser = getSessionUser();
const currentUser = sessionUser;

const loggedInUserDept =
  currentUser?.dept_Id === 7 ? "IT" : currentUser?.dept_Id === 5 ? "HR" : null;

const IT_STATUSES = [
  "Open",
  "Assigned",
  "Acceptance",
  "In Progress",
  "IT Testing",
  "Ready for Demo",
  "User Testing",
  "Waiting for User Input",
  "On Hold",
  "Resolved",
  "Closed",
];

const HR_STATUSES = [
  "Open",
  "Assigned",
  "Acceptance",
  "In Progress",
  "Waiting for User Input",
  "On Hold",
  "Resolved",
  "Closed",
];

const CARD_SHADOW =
  "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-12px_rgba(30,41,59,0.18)]";

const COLORS = {
  indigo: {
    text: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    dot: "bg-indigo-500",
    gradient: "from-indigo-500 to-violet-500",
    tint: "from-white to-indigo-50/60",
    ring: "ring-indigo-500/10",
  },
  amber: {
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    dot: "bg-amber-500",
    gradient: "from-amber-400 to-orange-500",
    tint: "from-white to-amber-50/60",
    ring: "ring-amber-500/10",
  },
  emerald: {
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    dot: "bg-emerald-500",
    gradient: "from-emerald-400 to-teal-500",
    tint: "from-white to-emerald-50/60",
    ring: "ring-emerald-500/10",
  },
  rose: {
    text: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    dot: "bg-rose-500",
    gradient: "from-rose-400 to-pink-500",
    tint: "from-white to-pink-50/60",
    ring: "ring-rose-500/10",
  },
  slate: {
    text: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
    dot: "bg-slate-700",
    gradient: "from-slate-600 to-slate-900",
    tint: "from-white to-slate-50",
    ring: "ring-slate-500/10",
  },
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

const fmt = (d) =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

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

function withinDateFilter(dateStr, dateFilter) {
  if (!dateStr || dateFilter === "ALL") return true;
  const months = { "3M": 3, "6M": 6, "12M": 12 }[dateFilter];
  if (!months) return true;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return new Date(dateStr) >= cutoff;
}

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

function normalizeReqType(reqType) {
  if (!reqType) return null;
  const lower = reqType.toLowerCase();
  if (lower.includes("incident")) return "Incident";
  if (lower.includes("service")) return "Service Request";
  if (lower.includes("cr") || lower.includes("change")) return "CR";
  return reqType;
}

function mapApiTicket(t) {
  const catParsed = parseCategoryStr(t.category || "");
  const rawStatus = t.status === "Enrolled" ? "Assigned" : t.status || "Open";

  return {
    id: t.ticket_Id,
    ticketNo: t.ticket_No || "",
    ticketDept: t.dept || "IT",
    userDept: t.user_Dept || "",
    description: t.description || "",
    catalogParent: catParsed.catalogParent,
    catalogCategory: catParsed.catalogCategory,
    catalogSubCategory: catParsed.catalogSubCategory,
    submittedBy: t.submitted_By_Name || "",
    createdBy: t.created_By_Name || "",
    priority: t.priority || null,
    requestType: normalizeReqType(t.req_Type),
    status: rawStatus,
    submittedDate: t.submitted_At ? t.submitted_At.slice(0, 10) : "",
    submittedDateTime: t.submitted_At || null,
    etaDate: t.eta_Date ? t.eta_Date.slice(0, 10) : null,
    closingDate: t.closing_Date ? t.closing_Date.slice(0, 10) : null,
    itRemarks: t.remarks || "",
    org: t.org_Id || t.org || "IML",
    itAssignees: parseAssignees(t.assigned_Person_Name || ""),
    itAssigneeIds: parseAssignees(String(t.assigned_Person || "")),
  };
}

export default function HelpdeskDashboard() {
  const [selectedDept, setSelectedDept] = useState("IT");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [selectedUserDept, setSelectedUserDept] = useState("ALL");
  const [userDeptOptions, setUserDeptOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [dashboardData, setDashboardData] = useState({
    summary: { totalTickets: 0, openTickets: 0, closedTickets: 0 },
    weeklyTrend: [],
    monthlyTrend: [],
    orgSummary: [],
    reqTypeStatus: [],
    reqTypePriority: [],
    userDeptSummary: [],
    ticketAging: { bucket0To60: 0, bucket60To90: 0, bucket90Plus: 0 },
  });

  const navigate = useNavigate();

  // Lifecycle & Aging drill-down modal state
  const [lifecycleModal, setLifecycleModal] = useState({
    open: false,
    reqType: "",
    status: "",
    tickets: [],
    loading: false,
  });
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        dept: selectedDept,
        dateFilter,
        userDept: selectedUserDept === "ALL" ? null : selectedUserDept,
      };
      const res = await ITHelpdeskService.getHelpdeskDashboardData(payload);

      if (res && res.status_Code === 200 && res.data) {
        const userDeptSummary = res.data.userDeptSummary || [];
        const agingData = res.data.agingSummary?.[0] || {
          bucket_0_60: 0,
          bucket_60_90: 0,
          bucket_90_plus: 0,
        };

        setDashboardData({
          summary: res.data.summary || {
            totalTickets: 0,
            openTickets: 0,
            closedTickets: 0,
          },
          weeklyTrend: res.data.weeklyTrend || [],
          monthlyTrend: res.data.monthlyTrend || [],
          orgSummary: res.data.orgSummary || [],
          reqTypeStatus: res.data.reqTypeStatus || [],
          reqTypePriority: res.data.reqTypePriority || [],
          userDeptSummary,
          ticketAging: agingData,
        });

        if (selectedUserDept === "ALL" && userDeptSummary.length > 0) {
          const opts = userDeptSummary.map((d) => d.userDept).filter(Boolean);
          setUserDeptOptions(opts);
        }
      } else {
        setDashboardData({
          summary: { totalTickets: 0, openTickets: 0, closedTickets: 0 },
          weeklyTrend: [],
          monthlyTrend: [],
          orgSummary: [],
          reqTypeStatus: [],
          reqTypePriority: [],
          userDeptSummary: [],
          ticketAging: { bucket0To60: 0, bucket60To90: 0, bucket90Plus: 0 },
        });

        if (res && res.status_Code !== 404) {
          setErrorMsg(res.message || "Failed to load dashboard data.");
        }
      }
    } catch (err) {
      console.error("HelpdeskDashboard - Fetch Error:", err);
      setErrorMsg(
        err?.message || "An unexpected error occurred while fetching data.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDept, dateFilter, selectedUserDept]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const openLifecycleModal = useCallback(
    async (reqType, status) => {
      setLifecycleModal({
        open: true,
        reqType,
        status,
        tickets: [],
        loading: true,
      });
      try {
        const res = await ITHelpdeskService.getTickets({
          dept: selectedDept,
          empId: currentUser.emp_Id,
        });
        const mapped = (res?.data || []).map(mapApiTicket);

        const filtered = mapped.filter((t) => {
          if (t.ticketDept !== selectedDept) return false;
          if (reqType && t.requestType !== reqType) return false;
          if (t.status !== status) return false;
          if (selectedUserDept !== "ALL" && t.userDept !== selectedUserDept)
            return false;
          if (!withinDateFilter(t.submittedDate, dateFilter)) return false;
          return true;
        });

        setLifecycleModal({
          open: true,
          reqType,
          status,
          tickets: filtered,
          loading: false,
        });
      } catch (err) {
        console.error("Lifecycle tickets fetch error:", err);
        setLifecycleModal({
          open: true,
          reqType,
          status,
          tickets: [],
          loading: false,
        });
      }
    },
    [selectedDept, selectedUserDept, dateFilter],
  );

  const openAgingModal = useCallback(
    async (bucketRange, bucketTitle) => {
      setLifecycleModal({
        open: true,
        reqType: "Aging Tickets",
        status: bucketTitle,
        tickets: [],
        loading: true,
      });
      try {
        const res = await ITHelpdeskService.getTickets({
          dept: selectedDept,
          empId: currentUser.emp_Id,
        });
        const mapped = (res?.data || []).map(mapApiTicket);

        const now = new Date();

        const filtered = mapped.filter((t) => {
          if (t.ticketDept !== selectedDept) return false;
          if (selectedUserDept !== "ALL" && t.userDept !== selectedUserDept)
            return false;
          if (!withinDateFilter(t.submittedDate, dateFilter)) return false;
          if (t.status === "Closed" || t.status === "Resolved") return false;
          if (!t.submittedDate) return false;

          const subDate = new Date(t.submittedDateTime || t.submittedDate);
          const ageInDays = Math.floor(
            (now.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (bucketRange === "0-60") return ageInDays <= 60;
          if (bucketRange === "60-90") return ageInDays > 60 && ageInDays <= 90;
          if (bucketRange === "90+") return ageInDays > 90;
          return false;
        });

        setLifecycleModal({
          open: true,
          reqType: "Aging Tickets",
          status: bucketTitle,
          tickets: filtered,
          loading: false,
        });
      } catch (err) {
        console.error("Aging tickets fetch error:", err);
        setLifecycleModal({
          open: true,
          reqType: "Aging Tickets",
          status: bucketTitle,
          tickets: [],
          loading: false,
        });
      }
    },
    [selectedDept, selectedUserDept, dateFilter],
  );

  const closeLifecycleModal = () => {
    setLifecycleModal({
      open: false,
      reqType: "",
      status: "",
      tickets: [],
      loading: false,
    });
  };

  const openTicketDetail = (ticketId) => setSelectedTicketId(ticketId);

  const closeTicketDetail = () => {
    setSelectedTicketId(null);
    setTicketDetail(null);
  };

  useEffect(() => {
    if (!selectedTicketId) {
      setTicketDetail(null);
      return;
    }
    let ignore = false;

    (async () => {
      setTicketDetailLoading(true);
      try {
        const [histRes, msgRes] = await Promise.all([
          ITHelpdeskService.getHistoryById(selectedTicketId).catch(() => null),
          ITHelpdeskService.getDiscussions(selectedTicketId).catch(() => null),
        ]);
        if (ignore) return;
        setTicketDetail({
          history: histRes?.data || [],
          messages: (msgRes?.data || []).map((m) => ({
            senderName: m.message_By_Name || "Unknown",
            text: m.message_Text || "",
            ts: m.message_At,
            fileName: m.attachment_File_Name || "",
          })),
        });
      } catch (err) {
        console.error("Ticket detail fetch error:", err);
        if (!ignore) setTicketDetail({ history: [], messages: [] });
      } finally {
        if (!ignore) setTicketDetailLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [selectedTicketId]);

  const selectedLifecycleTicket = useMemo(
    () => lifecycleModal.tickets.find((t) => t.id === selectedTicketId) || null,
    [lifecycleModal.tickets, selectedTicketId],
  );

  const activeStatuses = selectedDept === "HR" ? HR_STATUSES : IT_STATUSES;

  const reqTypeStatusMatrix = useMemo(() => {
    const matrix = {};

    dashboardData.reqTypeStatus.forEach((item) => {
      const { requestType, status, ticketCount } = item;
      if (!matrix[requestType]) matrix[requestType] = {};
      matrix[requestType][status] = ticketCount;
    });

    return Object.keys(matrix).map((reqType) => ({
      reqType,
      statuses: matrix[reqType],
    }));
  }, [dashboardData.reqTypeStatus]);

  const statusTotals = useMemo(() => {
    const totals = {};
    activeStatuses.forEach((status) => {
      totals[status] = 0;
    });

    dashboardData.reqTypeStatus.forEach((item) => {
      const { status, ticketCount } = item;
      totals[status] = (totals[status] || 0) + (Number(ticketCount) || 0);
    });

    return totals;
  }, [dashboardData.reqTypeStatus, activeStatuses]);

  const lifecycleGrandTotal = useMemo(
    () => Object.values(statusTotals).reduce((sum, v) => sum + v, 0),
    [statusTotals],
  );

  const priorityMatrix = useMemo(() => {
    const matrix = {};

    dashboardData.reqTypePriority.forEach((item) => {
      const { requestType, priority, ticketCount } = item;
      if (!matrix[requestType]) {
        matrix[requestType] = { Critical: 0, Medium: 0, Normal: 0 };
      }
      matrix[requestType][priority] = ticketCount;
    });

    return Object.keys(matrix).map((reqType) => ({
      reqType,
      counts: matrix[reqType],
    }));
  }, [dashboardData.reqTypePriority]);

  const maxWeeklyCount = useMemo(() => {
    if (!dashboardData.weeklyTrend.length) return 10;
    const maxVal = Math.max(
      ...dashboardData.weeklyTrend.map((w) =>
        Math.max(Number(w.openedCount) || 0, Number(w.closedCount) || 0),
      ),
    );
    return maxVal > 0 ? maxVal : 10;
  }, [dashboardData.weeklyTrend]);

  const maxMonthlyCount = useMemo(() => {
    if (!dashboardData.monthlyTrend.length) return 10;
    const maxVal = Math.max(
      ...dashboardData.monthlyTrend.map((m) =>
        Math.max(Number(m.openedCount) || 0, Number(m.closedCount) || 0),
      ),
    );
    return maxVal > 0 ? maxVal : 10;
  }, [dashboardData.monthlyTrend]);

  const resolutionRate = useMemo(() => {
    const { totalTickets, closedTickets } = dashboardData.summary;
    if (!totalTickets) return 0;
    return Math.round((closedTickets / totalTickets) * 100);
  }, [dashboardData.summary]);

  const activeRate = useMemo(() => {
    const { totalTickets, openTickets } = dashboardData.summary;
    if (!totalTickets) return 0;
    return Math.round((openTickets / totalTickets) * 100);
  }, [dashboardData.summary]);

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900 antialiased">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-indigo-300/25 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 top-1/4 h-[420px] w-[420px] rounded-full bg-violet-300/20 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-emerald-200/15 blur-[120px]" />

        <div className="relative z-10 mx-auto w-full max-w-[1520px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          {/* Header */}
          <header className="mb-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-slate-900 shadow-[0_10px_25px_-6px_rgba(79,70,229,0.45)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
                  <BarChart3
                    className="relative h-[19px] w-[19px] text-white"
                    strokeWidth={2.2}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-[18px] font-bold tracking-[-0.025em] text-slate-950">
                      Helpdesk Overview
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-700 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] font-medium text-slate-500">
                    Ticket volume, ticket aging, and departmental workload
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(loggedInUserDept === "IT" || loggedInUserDept === "HR") && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/helpdesk");
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    Go to Tickets
                  </button>
                )}
                {loggedInUserDept === "IT" && (
                  <SegmentedDepartment
                    value={selectedDept}
                    onChange={(dept) => {
                      setSelectedDept(dept);
                      setSelectedUserDept("ALL");
                    }}
                    disabled={loading}
                    loggedInUserDept={loggedInUserDept}
                  />
                )}

                {/* User Department Filter Dropdown */}
                <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <div className="relative">
                    <select
                      value={selectedUserDept}
                      onChange={(e) => setSelectedUserDept(e.target.value)}
                      disabled={loading}
                      className="cursor-pointer appearance-none bg-transparent pr-5 text-[11px] font-bold text-slate-700 outline-none max-w-[160px] truncate"
                    >
                      <option value="ALL">All User Depts</option>
                      {userDeptOptions.map((deptName) => (
                        <option key={deptName} value={deptName}>
                          {deptName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Date Filter Dropdown */}
                <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  <div className="relative">
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      disabled={loading}
                      className="cursor-pointer appearance-none bg-transparent pr-5 text-[11px] font-bold text-slate-700 outline-none"
                    >
                      <option value="ALL">All time</option>
                      <option value="3M">Last 3 months</option>
                      <option value="6M">Last 6 months</option>
                      <option value="12M">Last 12 months</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="group flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Refresh data"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 transition-transform ${
                      loading ? "animate-spin" : "group-hover:rotate-90"
                    }`}
                  />
                </button>
              </div>
            </div>
          </header>

          {errorMsg && (
            <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] font-semibold text-rose-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <LoadingState />
          ) : (
            <main className="space-y-4 animate-[dashboardIn_.35s_ease-out]">
              {/* Primary KPI row */}
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Total tickets"
                  value={dashboardData.summary.totalTickets}
                  helper="Combined ticket volume"
                  icon={Layers3}
                  tone="slate"
                />
                <MetricCard
                  label="Open tickets"
                  value={dashboardData.summary.openTickets}
                  helper={`${activeRate}% of total volume`}
                  icon={Clock3}
                  tone="amber"
                  progress={activeRate}
                />
                <MetricCard
                  label="Closed tickets"
                  value={dashboardData.summary.closedTickets}
                  helper={`${resolutionRate}% resolution rate`}
                  icon={CheckCircle2}
                  tone="emerald"
                  progress={resolutionRate}
                />
                <MetricCard
                  label="Department Scope"
                  value={
                    selectedUserDept !== "ALL"
                      ? `${selectedDept} (${selectedUserDept})`
                      : selectedDept
                  }
                  helper={
                    selectedUserDept !== "ALL"
                      ? `Filtered by ${selectedUserDept}`
                      : "Current dashboard scope"
                  }
                  icon={selectedDept === "IT" ? Wrench : BriefcaseBusiness}
                  tone="indigo"
                  isText
                />
              </section>

              {/* Ticket Aging Breakdown Section with Clickable Drill-down */}
              <Panel
                icon={Hourglass}
                title="Open Ticket Aging Buckets"
                subtitle="Age categorization of active/open tickets requiring attention · click a bucket to view tickets"
                tone="amber"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div
                    onClick={() => openAgingModal("0-60", "0 - 60 Days")}
                    className="group cursor-pointer rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 transition-all hover:bg-amber-100/60 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                        0 - 60 Days
                      </span>
                      <Timer className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-[26px] font-extrabold text-amber-950">
                        {formatNumber(dashboardData.ticketAging.bucket0To60)}
                      </div>
                      <ChevronRight className="h-4 w-4 text-amber-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600" />
                    </div>
                  </div>

                  <div
                    onClick={() => openAgingModal("60-90", "60 - 90 Days")}
                    className="group cursor-pointer rounded-xl border border-orange-200/80 bg-orange-50/50 p-3.5 transition-all hover:bg-orange-100/60 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-800">
                        60 - 90 Days
                      </span>
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-[26px] font-extrabold text-orange-950">
                        {formatNumber(dashboardData.ticketAging.bucket60To90)}
                      </div>
                      <ChevronRight className="h-4 w-4 text-orange-400 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-600" />
                    </div>
                  </div>

                  <div
                    onClick={() => openAgingModal("90+", "90+ Days")}
                    className="group cursor-pointer rounded-xl border border-rose-200/80 bg-rose-50/50 p-3.5 transition-all hover:bg-rose-100/60 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800">
                        90+ Days
                      </span>
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-[26px] font-extrabold text-rose-950">
                        {formatNumber(dashboardData.ticketAging.bucket90Plus)}
                      </div>
                      <ChevronRight className="h-4 w-4 text-rose-400 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-600" />
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Trend cards */}
              <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <TrendChart
                  title="Weekly performance"
                  subtitle="Opened vs closed tickets · recent weeks"
                  data={dashboardData.weeklyTrend}
                  maxCount={maxWeeklyCount}
                  openColor="#f59e0b"
                  closedColor="#10b981"
                  accent="amber"
                />
                <TrendChart
                  title="Monthly performance"
                  subtitle="Opened vs closed tickets · recent months"
                  data={dashboardData.monthlyTrend}
                  maxCount={maxMonthlyCount}
                  openColor="#6366f1"
                  closedColor="#10b981"
                  accent="indigo"
                />
              </section>

              {/* Organization + priority */}
              <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.86fr_1.7fr]">
                <Panel
                  icon={Building2}
                  title="Organization breakdown"
                  subtitle="Resolution health by organization"
                  tone="emerald"
                >
                  <div className="space-y-1">
                    {dashboardData.orgSummary.length > 0 ? (
                      dashboardData.orgSummary.map((org) => {
                        const total = Number(org.totalTickets) || 0;
                        const closed = Number(org.closedTickets) || 0;
                        const pct = total
                          ? Math.round((closed / total) * 100)
                          : 0;

                        return (
                          <div
                            key={org.org}
                            className="group rounded-xl px-2.5 py-2.5 transition-colors hover:bg-slate-50"
                          >
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                  <Building2 className="h-3 w-3" />
                                </span>
                                <p
                                  className="truncate text-[11.5px] font-bold text-slate-800"
                                  title={org.org}
                                >
                                  {org.org}
                                </p>
                              </div>
                              <span className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-400">
                                {formatNumber(total)}
                              </span>
                            </div>

                            <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <div className="mt-1.5 flex items-center justify-between text-[9.5px] font-semibold">
                              <span className="text-slate-400">
                                {pct}% resolved
                              </span>
                              <span className="text-slate-400">
                                <span className="text-amber-600">
                                  {org.openTickets || 0}
                                </span>{" "}
                                open
                                <span className="mx-1.5 text-slate-200">•</span>
                                <span className="text-emerald-600">
                                  {org.closedTickets || 0}
                                </span>{" "}
                                closed
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <EmptyRow />
                    )}
                  </div>
                </Panel>

                <Panel
                  icon={AlertTriangle}
                  title="Request type vs priority"
                  subtitle="Priority distribution across request categories"
                  tone="rose"
                  action={
                    <span className="hidden items-center gap-3 text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:flex">
                      <LegendDot color="bg-rose-500" label="Critical" />
                      <LegendDot color="bg-amber-500" label="Medium" />
                      <LegendDot color="bg-sky-500" label="Normal" />
                    </span>
                  }
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                          <th className="px-3 pb-2.5 text-left">
                            Request type
                          </th>
                          <th className="px-2 pb-2.5 text-center text-rose-500">
                            Critical
                          </th>
                          <th className="px-2 pb-2.5 text-center text-amber-500">
                            Medium
                          </th>
                          <th className="px-2 pb-2.5 text-center text-sky-500">
                            Normal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-[11px]">
                        {priorityMatrix.length > 0 ? (
                          priorityMatrix.map((row) => (
                            <tr
                              key={row.reqType}
                              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                            >
                              <td className="px-3 py-2.5 font-bold text-slate-800">
                                {row.reqType}
                              </td>
                              <td className="px-2 py-2.5 text-center">
                                <PriorityPill
                                  value={row.counts.Critical || 0}
                                  tone="rose"
                                />
                              </td>
                              <td className="px-2 py-2.5 text-center">
                                <PriorityPill
                                  value={row.counts.Medium || 0}
                                  tone="amber"
                                />
                              </td>
                              <td className="px-2 py-2.5 text-center">
                                <PriorityPill
                                  value={row.counts.Normal || 0}
                                  tone="sky"
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4}>
                              <EmptyRow />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </section>

              {/* Lifecycle matrix */}
              <Panel
                icon={Activity}
                title={`${selectedDept} request lifecycle`}
                subtitle="Granular ticket distribution across workflow stages · click a count to view tickets"
                tone="indigo"
                action={
                  <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:inline-flex">
                    {activeStatuses.length} stages
                  </span>
                }
              >
                <div className="overflow-x-auto thin-scroll">
                  <table className="w-full min-w-[980px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-[8.5px] font-bold uppercase tracking-[0.07em] text-slate-400">
                        <th className="sticky left-0 z-10 bg-slate-50/95 px-4 py-2.5 text-left">
                          Request type
                        </th>
                        {activeStatuses.map((status) => (
                          <th
                            key={status}
                            className="whitespace-nowrap px-1.5 py-2.5 text-center"
                          >
                            {status}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-[10.5px]">
                      {reqTypeStatusMatrix.length > 0 ? (
                        <>
                          {reqTypeStatusMatrix.map((row) => (
                            <tr
                              key={row.reqType}
                              className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                            >
                              <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-2.5 font-bold text-slate-800">
                                {row.reqType}
                              </td>
                              {activeStatuses.map((status) => {
                                const count = Number(row.statuses[status]) || 0;
                                return (
                                  <td
                                    key={status}
                                    className="px-1.5 py-2.5 text-center"
                                  >
                                    {count > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openLifecycleModal(
                                            row.reqType,
                                            status,
                                          )
                                        }
                                        title={`View ${count} ${row.reqType} · ${status} tickets`}
                                        className="inline-flex min-w-[25px] cursor-pointer items-center justify-center rounded-md bg-slate-900 px-1.5 py-1 text-[9px] font-bold tabular-nums text-white shadow-sm transition-all hover:bg-indigo-600"
                                      >
                                        {count}
                                      </button>
                                    ) : (
                                      <span className="inline-flex min-w-[25px] items-center justify-center rounded-md px-1.5 py-1 text-[9px] font-bold tabular-nums text-slate-300">
                                        {count}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}

                          <tr className="border-t-2 border-indigo-200 bg-indigo-50/50">
                            <td className="sticky left-0 z-10 whitespace-nowrap bg-indigo-50/95 px-4 py-2.5 font-extrabold text-slate-900">
                              Total{" "}
                              <span className="ml-1 font-semibold text-slate-400">
                                ({formatNumber(lifecycleGrandTotal)})
                              </span>
                            </td>
                            {activeStatuses.map((status) => {
                              const count = statusTotals[status] || 0;
                              return (
                                <td
                                  key={status}
                                  className="px-1.5 py-2.5 text-center"
                                >
                                  {count > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openLifecycleModal(null, status)
                                      }
                                      title={`View ${count} ${status} tickets`}
                                      className="inline-flex min-w-[25px] cursor-pointer items-center justify-center rounded-md bg-indigo-600 px-1.5 py-1 text-[9px] font-extrabold tabular-nums text-white shadow-sm hover:bg-indigo-700"
                                    >
                                      {count}
                                    </button>
                                  ) : (
                                    <span className="inline-flex min-w-[25px] items-center justify-center rounded-md bg-white px-1.5 py-1 text-[9px] font-extrabold tabular-nums text-slate-300 shadow-sm">
                                      {count}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan={activeStatuses.length + 1}>
                            <EmptyRow />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>

              {/* Requesting departments */}
              <Panel
                icon={Users}
                title="User department-wise volume"
                subtitle="Ticket demand grouped by requesting department"
                tone="amber"
              >
                {dashboardData.userDeptSummary.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {dashboardData.userDeptSummary.map((dept) => {
                      const total = Number(dept.totalTickets) || 0;
                      const closed = Number(dept.closedTickets) || 0;
                      const pct = total
                        ? Math.round((closed / total) * 100)
                        : 0;
                      const isSelected = selectedUserDept === dept.userDept;

                      return (
                        <div
                          key={dept.userDept}
                          onClick={() =>
                            setSelectedUserDept(
                              isSelected ? "ALL" : dept.userDept,
                            )
                          }
                          className={`group cursor-pointer rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-6px_rgba(15,23,42,0.14)] ${
                            isSelected
                              ? "border-indigo-400 bg-indigo-50/70 ring-2 ring-indigo-500/20"
                              : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm ${
                                  isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white text-slate-400"
                                }`}
                              >
                                <Users className="h-3.5 w-3.5" />
                              </span>
                              <p
                                className="truncate text-[11px] font-bold text-slate-800"
                                title={dept.userDept}
                              >
                                {dept.userDept}
                              </p>
                            </div>
                            <ArrowUpRight className="h-3 w-3 text-slate-300 transition-colors group-hover:text-slate-500" />
                          </div>

                          <div className="mt-3 flex items-end justify-between">
                            <div>
                              <span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                Total
                              </span>
                              <span className="mt-0.5 block text-[20px] font-extrabold leading-none tracking-tight text-slate-900">
                                {formatNumber(total)}
                              </span>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">
                              {pct}% closed
                            </span>
                          </div>

                          <div className="mt-3 flex h-1 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="bg-emerald-500"
                              style={{ width: `${pct}%` }}
                            />
                            <div
                              className="bg-amber-400"
                              style={{ width: `${100 - pct}%` }}
                            />
                          </div>

                          <div className="mt-2 flex justify-between text-[9px] font-semibold">
                            <span className="text-amber-600">
                              {dept.openTickets || 0} open
                            </span>
                            <span className="text-emerald-600">
                              {dept.closedTickets || 0} closed
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyRow />
                )}
              </Panel>
            </main>
          )}
        </div>

        <style>{`
          @keyframes dashboardIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .thin-scroll::-webkit-scrollbar { height: 5px; width: 5px; }
          .thin-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
          .thin-scroll::-webkit-scrollbar-track { background: transparent; }
          select option { font-weight: 600; }
          .modal-overlay{position:fixed;inset:0;z-index:50;background:rgba(15,23,42,0.65);display:flex;align-items:center;justify-content:center;padding:1rem;}
          .modal-box{background:#fff;border-radius:1.25rem;border:1px solid #e2e8f0;box-shadow:0 25px 60px rgba(0,0,0,0.2);width:100%;max-width:940px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;}
          @media(max-width:640px){
            .modal-box{max-height:98vh;border-radius:.75rem;}
          }
          @media(max-width:480px){.modal-overlay{padding:.5rem;}}
        `}</style>
      </div>

      <LifecycleTicketsModal
        modalState={lifecycleModal}
        onClose={closeLifecycleModal}
        onSelectTicket={openTicketDetail}
      />

      <TicketDetailViewModal
        ticket={selectedLifecycleTicket}
        detail={ticketDetail}
        loading={ticketDetailLoading}
        onClose={closeTicketDetail}
      />
    </>
  );
}

function SegmentedDepartment({ value, onChange, disabled, loggedInUserDept }) {
  const items = [
    loggedInUserDept === "IT" && { id: "IT", label: "IT", icon: Wrench },
    (loggedInUserDept === "HR" || loggedInUserDept === "IT") && {
      id: "HR",
      label: "HR",
      icon: BriefcaseBusiness,
    },
  ].filter(Boolean);

  const activeIndex = items.findIndex((item) => item.id === value);

  return (
    <div className="relative flex h-9 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
      {items.length > 0 && (
        <div
          className={`absolute bottom-1 top-1 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-[0_4px_10px_-2px_rgba(79,70,229,0.5)] transition-all duration-300 ease-out ${
            items.length === 1 ? "w-[calc(100%-8px)]" : "w-[calc(50%-4px)]"
          }`}
          style={{
            transform:
              items.length > 1
                ? `translateX(${activeIndex * 100}%)`
                : "translateX(0)",
          }}
        />
      )}

      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          disabled={disabled}
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-[10px] font-bold transition-colors ${
            value === id ? "text-white" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "slate",
  progress,
  isText,
}) {
  const color = COLORS[tone] || COLORS.slate;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${color.tint} px-4 py-4 ${CARD_SHADOW} ring-1 ${color.ring} transition-all hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_22px_48px_-14px_rgba(30,41,59,0.24)]`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${color.gradient}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </p>
          <div
            className={`mt-1.5 font-extrabold tracking-[-0.035em] text-slate-950 ${
              isText ? "text-[20px] truncate" : "text-[28px]"
            }`}
            title={isText ? value : undefined}
          >
            {isText ? value : formatNumber(value)}
          </div>
          <p className="mt-1 text-[9.5px] font-semibold text-slate-500">
            {helper}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color.bg} ${color.text} shadow-sm`}
        >
          <Icon className="h-4 w-4" strokeWidth={2.1} />
        </div>
      </div>

      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/70">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${color.gradient} transition-all duration-500`}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  tone = "slate",
}) {
  const color = COLORS[tone] || COLORS.slate;

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white ${CARD_SHADOW} ring-1 ${color.ring}`}
    >
      <div className={`h-[3px] bg-gradient-to-r ${color.gradient}`} />
      <div
        className={`flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r ${color.tint} px-4 py-3.5`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color.bg} ${color.text} shadow-sm`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-[11.5px] font-extrabold tracking-[-0.01em] text-slate-900">
              {title}
            </h2>
            <p className="mt-0.5 truncate text-[9.5px] font-medium text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function TrendChart({
  title,
  subtitle,
  data,
  maxCount,
  openColor,
  closedColor,
  accent = "indigo",
}) {
  const color = COLORS[accent] || COLORS.indigo;

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-4 ${CARD_SHADOW} ring-1 ${color.ring}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
            <h2 className="text-[11.5px] font-extrabold text-slate-900">
              {title}
            </h2>
          </div>
          <p className="mt-1 text-[9.5px] font-medium text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-[9px] font-bold text-slate-400">
          <LegendDot color="bg-amber-400" label="Open" />
          <LegendDot color="bg-emerald-500" label="Closed" />
        </div>
      </div>

      <div className="mt-4">
        {data.length > 0 ? (
          <div className="relative h-[205px]">
            <div className="relative flex h-full items-end gap-2 pl-9 pr-1 pt-2">
              {data.map((item, index) => {
                const open = Number(item.openedCount) || 0;
                const closed = Number(item.closedCount) || 0;
                const openHeight = (open / maxCount) * 100;
                const closedHeight = (closed / maxCount) * 100;

                return (
                  <div
                    key={index}
                    className="flex h-full min-w-0 flex-1 flex-col justify-end"
                  >
                    <div className="flex h-[176px] items-end justify-center gap-1">
                      <Bar value={open} height={openHeight} color={openColor} />
                      <Bar
                        value={closed}
                        height={closedHeight}
                        color={closedColor}
                      />
                    </div>
                    <span className="mt-2 truncate text-center text-[8.5px] font-bold text-slate-400">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-[205px] items-center justify-center rounded-xl bg-slate-50">
            <span className="text-[10px] font-semibold text-slate-300">
              No trend data available
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function Bar({ value, height, color }) {
  return (
    <div
      className="relative w-[12px] max-w-[18px] rounded-t-[4px] transition-all duration-500 sm:w-[15px]"
      style={{
        height: `${Math.max(height, 2.5)}%`,
        background: color,
      }}
    >
      {value > 0 && (
        <span
          className="pointer-events-none absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[7.5px] font-extrabold tabular-nums"
          style={{ color }}
        >
          {formatNumber(value)}
        </span>
      )}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function PriorityPill({ value, tone }) {
  const map = {
    rose: "border-rose-200 bg-rose-50 text-rose-600",
    amber: "border-amber-200 bg-amber-50 text-amber-600",
    sky: "border-sky-200 bg-sky-50 text-sky-600",
  };

  return (
    <span
      className={`inline-flex min-w-[31px] justify-center rounded-md border px-2 py-1 text-[9.5px] font-extrabold tabular-nums ${
        map[tone] || map.sky
      }`}
    >
      {value}
    </span>
  );
}

function LoadingState() {
  return (
    <div
      className={`flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white ${CARD_SHADOW}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
      <p className="mt-3 text-[11px] font-bold text-slate-500">
        Refreshing dashboard
      </p>
      <p className="mt-1 text-[9.5px] font-medium text-slate-300">
        Fetching the latest helpdesk data…
      </p>
    </div>
  );
}

function EmptyRow() {
  return (
    <div className="flex min-h-[100px] items-center justify-center text-[10px] font-semibold text-slate-300">
      No data available for this selection
    </div>
  );
}

function LifecycleTicketsModal({ modalState, onClose, onSelectTicket }) {
  const { open, reqType, status, tickets, loading } = modalState;
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box max-w-3xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {reqType ? `${reqType} · ${status}` : status}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} at this
              stage
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 max-h-[70vh] overflow-y-auto thin-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading tickets…
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
              No tickets found for this selection.
            </div>
          ) : (
            <div className="space-y-2.5">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTicket(t.id)}
                  className="w-full text-left rounded-xl border border-slate-200 bg-white p-3.5 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                          {t.ticketNo}
                        </span>
                        {t.org && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {t.org}
                          </span>
                        )}
                        {t.priority && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              t.priority === "Critical"
                                ? "bg-red-100 text-red-700"
                                : t.priority === "Medium"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {t.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {t.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3" /> {t.createdBy || "—"}
                        </span>
                        {t.itAssignees?.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />{" "}
                            {t.itAssignees.join(", ")}
                          </span>
                        )}
                        <span>{fmt(t.submittedDate)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-none" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
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

function TicketDetailViewModal({ ticket, detail, loading, onClose }) {
  const [tab, setTab] = useState("details");
  useEffect(() => {
    setTab("details");
  }, [ticket?.id]);

  if (!ticket) return null;

  return (
    <div
      className="modal-overlay !z-[60]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <div className="flex-none border-b border-slate-100 px-4 sm:px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="inline-flex items-center rounded-full bg-slate-900 text-white text-xs font-extrabold px-3 py-1">
                  {ticket.ticketNo}
                </span>
                {ticket.org && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {ticket.org}
                  </span>
                )}
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                  {ticket.status}
                </span>
                {ticket.requestType && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-sky-100 text-sky-700 border-sky-200">
                    {ticket.requestType}
                  </span>
                )}
                {ticket.priority && (
                  <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-700">
                    {ticket.priority}
                  </span>
                )}
              </div>
              <p className="text-base font-bold text-slate-900 leading-snug">
                {ticket.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 text-xs font-medium">
                  <User className="w-3 h-3" /> Owner: {ticket.createdBy || "—"}
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 text-xs font-medium">
                  <Users className="w-3 h-3" /> Submitted By:{" "}
                  {ticket.submittedBy || "—"}
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 text-xs font-medium">
                  <CalendarDays className="w-3 h-3" />{" "}
                  {fmtDateTime(ticket.submittedDateTime)}
                </span>
                {ticket.itAssignees?.length > 0 && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 text-xs font-medium">
                    <UserCheck className="w-3 h-3" />{" "}
                    {ticket.itAssignees.join(", ")}
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

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mt-3">
            {["details", "discussion", "history"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                  tab === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t}
                {t === "discussion" && detail?.messages?.length > 0
                  ? ` (${detail.messages.length})`
                  : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading details…
            </div>
          ) : (
            <>
              {tab === "details" && (
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-extrabold text-slate-900 mb-3">
                      Ticket Information
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <InfoBox
                        label="Submitted By"
                        value={ticket.createdBy || "—"}
                      />
                      <InfoBox
                        label="Department"
                        value={ticket.userDept || "—"}
                      />
                      <InfoBox
                        label="Submitted Date"
                        value={fmtDateTime(ticket.submittedDateTime)}
                      />
                      <InfoBox label="Organisation" value={ticket.org || "—"} />
                      <InfoBox
                        label="Request Type"
                        value={ticket.requestType || "—"}
                      />
                      <InfoBox
                        label="Priority"
                        value={ticket.priority || "—"}
                      />
                      <InfoBox
                        label="Assignee(s)"
                        value={ticket.itAssignees?.join(", ") || "—"}
                      />
                      <InfoBox label="ETA" value={fmt(ticket.etaDate)} />
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
                      <InfoBox
                        label="Closing Date"
                        value={fmt(ticket.closingDate)}
                      />
                    </div>
                    {ticket.itRemarks && (
                      <div className="mt-3 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-700 italic">
                        "{ticket.itRemarks}"
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === "discussion" && (
                <div className="p-4 sm:p-5 space-y-3">
                  {!detail?.messages || detail.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <MessageSquareText className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium">No messages yet.</p>
                    </div>
                  ) : (
                    detail.messages.map((msg, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-700">
                            {msg.senderName}
                          </span>
                          <span className="text-[10px] text-slate-400 mono">
                            {fmtTime(msg.ts)}
                          </span>
                        </div>
                        {msg.text && (
                          <p className="text-sm text-slate-700">{msg.text}</p>
                        )}
                        {msg.fileName && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-blue-600">
                            <Paperclip className="w-3 h-3" />
                            {msg.fileName}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === "history" && (
                <div className="p-4 sm:p-5 space-y-2">
                  {(!detail?.history || detail.history.length === 0) && (
                    <div className="text-center text-xs text-slate-400 py-8">
                      No history available.
                    </div>
                  )}
                  {[...(detail?.history || [])].reverse().map((e, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-none mt-0.5 bg-slate-200 text-slate-600">
                        <Activity className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700">
                            {e.new_Value || e.status || "Open"}
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
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
