import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Boxes,
  UsersRound,
  PackagePlus,
  ReceiptText,
  ChartNoAxesCombined,
  LogOut,
  UserRound,
  Search,
  Settings2,
  CircleHelp,
  FolderOpen,
} from "lucide-react";
import Swal from "sweetalert2";
import menuConfig from "../../config/menuConfig";
import IndefLogo from "../../assets/logo/IndefLogo.png";

// Paths must match src/config/menuConfig exactly.
const NAV_ITEMS = [
  {
    path: "/iReact/daedalus-item-master",
    label: "Item Master",
    section: "masters",
    icon: Boxes,
  },
  {
    path: "/iReact/daedalus-customer-master",
    label: "Customer Master",
    section: "masters",
    icon: UsersRound,
  },
  {
    path: "/iReact/daedalus-sales-budget",
    label: "Budget Master",
    section: "masters",
    icon: ChartNoAxesCombined,
  },
  {
    path: "/iReact/daedalus-order-intake-report",
    label: "Order Intake",
    section: "transactions",
    icon: PackagePlus,
  },
  {
    path: "/iReact/daedalus-sales",
    label: "Sales Invoices",
    section: "transactions",
    icon: ReceiptText,
  },
];
const SECTION_META = [
  { id: "masters", title: "Masters", icon: Boxes },
  { id: "transactions", title: "Transactions", icon: ReceiptText },
];
const getSessionUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "{}") || {};
  } catch {
    return {};
  }
};
const initialsOf = (value) =>
  String(value || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0] || "")
    .join("")
    .toUpperCase();

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState({
    masters: true,
    transactions: true,
    other: true,
  });
  const user = getSessionUser();
  const userName =
    user.emp_Name ||
    user.emp_name ||
    user.empName ||
    user.employeeName ||
    user.name ||
    user.userName ||
    user.emp_No ||
    user.emp_no ||
    "Employee";
  const employeeNumber =
    user.emp_No || user.emp_no || user.emp_Id || user.emp_id || "";
  const links = useMemo(() => {
    const registered = new Set(
      (Array.isArray(menuConfig) ? menuConfig : []).map((x) => x.path),
    );
    // Show only pages that are actually registered in AppRoutes.
    const configured = NAV_ITEMS.filter((item) => registered.has(item.path));
    const known = new Set(configured.map((item) => item.path));
    const extra = (Array.isArray(menuConfig) ? menuConfig : [])
      .filter((item) => item?.path && !known.has(item.path))
      .map((item) => ({
        ...item,
        label: item.label || item.path.split("/").pop().replace(/-/g, " "),
        section: "other",
        icon: LayoutGrid,
      }));
    return [...configured, ...extra];
  }, []);
  const sections = useMemo(() => {
    const metadata = [
      ...SECTION_META,
      { id: "other", title: "Other Pages", icon: FolderOpen },
    ];
    return metadata
      .map((section) => ({
        ...section,
        items: links.filter(
          (item) =>
            item.section === section.id &&
            `${item.label} ${item.path}`
              .toLowerCase()
              .includes(filter.trim().toLowerCase()),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [links, filter]);
  const active = links.find((item) => item.path === location.pathname);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const logout = async () => {
    const result = await Swal.fire({
      title: "Sign out?",
      text: "You will return to the Daedalus login page.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sign out",
      confirmButtonColor: "#1d4ed8",
    });
    if (!result.isConfirmed) return;
    sessionStorage.removeItem("user");
    sessionStorage.setItem("explicit_logout", "true");
    navigate("/daedalus-login", { replace: true });
  };

  const sidebar = (mobile = false) => (
    <div className="flex h-full flex-col">
      <div
        className={`flex h-[64px] shrink-0 items-center border-b border-white/10 ${collapsed && !mobile ? "justify-center px-2" : "justify-between px-4"}`}
      >
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <div className="text-[13px] font-extrabold tracking-[.18em] text-white">
              DAEDALUS
            </div>
            <div className="mt-0.5 text-[10px] text-blue-200/70">
              ORDER MANAGEMENT
            </div>
          </div>
        )}
        {mobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-blue-100 hover:bg-white/10"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed((x) => !x)}
            className="rounded-lg p-2 text-blue-100 hover:bg-white/10"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        )}
      </div>
      {(!collapsed || mobile) && (
        <div className="px-3 pt-4 pb-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-2.5 text-blue-200/70"
            />
            <input
              aria-label="Search menus"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Find a menu..."
              className="h-9 w-full rounded-lg border border-white/10 bg-white/10 pl-9 pr-3 text-[11px] text-white outline-none placeholder:text-blue-100/60 focus:border-blue-300/60"
            />
          </div>
        </div>
      )}
      <nav
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3"
        aria-label="Main navigation"
      >
        {sections.map((section) => {
          const SectionIcon = section.icon;
          const isOpen =
            filter || expanded[section.id] || (collapsed && !mobile);
          return (
            <div key={section.id}>
              {!collapsed || mobile ? (
                <button
                  onClick={() =>
                    setExpanded((p) => ({ ...p, [section.id]: !p[section.id] }))
                  }
                  className="flex w-full items-center justify-between px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-blue-200/60"
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${isOpen ? "" : "-rotate-90"}`}
                  />
                </button>
              ) : (
                <div className="mx-auto mb-2 h-px w-7 bg-white/15" />
              )}
              {isOpen && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon || LayoutGrid;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        title={collapsed && !mobile ? item.label : undefined}
                        onClick={() => mobile && setMobileOpen(false)}
                        className={({ isActive }) =>
                          `group flex min-h-[39px] items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${collapsed && !mobile ? "justify-center" : ""} ${isActive ? "bg-white text-blue-900 shadow-sm" : "text-blue-100/85 hover:bg-white/10 hover:text-white"}`
                        }
                      >
                        <ItemIcon size={17} className="shrink-0" />
                        {(!collapsed || mobile) && (
                          <>
                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>
                            <ChevronRight
                              size={13}
                              className="opacity-40 group-hover:opacity-80"
                            />
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {!sections.length && (
          <p className="px-2 text-[11px] text-blue-100/70">No matching menus</p>
        )}
      </nav>
      <div className="border-t border-white/10 p-3">
        {!collapsed || mobile ? (
          <div className="rounded-xl bg-white/10 px-3 py-3">
            <div className="text-[11px] font-semibold text-white">
              Daedalus Workspace
            </div>
            <div className="mt-1 text-[10px] text-blue-100/70">
              Order Intake · Sales · Masters
            </div>
          </div>
        ) : (
          <div className="flex justify-center text-blue-100">
            <LayoutGrid size={17} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen min-h-0 w-full overflow-hidden bg-[#f4f7fb] font-sans text-slate-800">
      <aside
        className={`hidden shrink-0 bg-gradient-to-b from-[#102b57] via-[#10274e] to-[#0a1a35] shadow-xl transition-[width] duration-200 md:block ${collapsed ? "w-[68px]" : "w-[240px]"}`}
      >
        {sidebar()}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-[110] md:hidden">
          <button
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/50"
          />
          <aside className="relative h-full w-[260px] bg-gradient-to-b from-[#102b57] to-[#0a1a35] shadow-2xl">
            {sidebar(true)}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-[64px] shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 md:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <img
              src={IndefLogo}
              alt="Bajaj Indef"
              className="h-10 w-auto max-w-[145px] object-contain sm:max-w-[175px]"
            />
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />
            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-[12px] font-bold text-slate-800">
                {active?.label || "Daedalus"}
              </div>
              <div className="text-[10px] text-slate-400">
                Order Intake Management
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-[11px] font-extrabold text-blue-700 ring-1 ring-blue-100">
                {initialsOf(userName)}
              </div>
              <div className="hidden max-w-[190px] text-right sm:block">
                <div className="truncate text-[12px] font-bold text-slate-800">
                  {userName}
                </div>
                <div className="text-[10px] text-slate-500">
                  {employeeNumber ? `Employee #${employeeNumber}` : "Signed in"}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
        <main
          className="min-h-0 flex-1 overflow-y-auto bg-[#f4f7fb]"
          id="daedalus-content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
