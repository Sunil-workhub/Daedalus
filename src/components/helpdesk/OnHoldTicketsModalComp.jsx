import {
  ChevronRight,
  FileText,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { CATEGORY_META } from "./StyleComp";
import { HRPill } from "./FunctionComp";

// const STATUS_META = {
//   Open: {
//     dot: "bg-slate-400",
//     txt: "text-slate-600",
//     chip: "bg-slate-100 text-slate-600",
//     Icon: Inbox,
//   },
//   Requirement: {
//     dot: "bg-blue-400",
//     txt: "text-blue-700",
//     chip: "bg-blue-100 text-blue-700",
//     Icon: ClipboardList,
//   },
//   Discussion: {
//     dot: "bg-purple-400",
//     txt: "text-purple-700",
//     chip: "bg-purple-100 text-purple-700",
//     Icon: MessageSquareText,
//   },
//   Queue: {
//     dot: "bg-indigo-400",
//     txt: "text-indigo-700",
//     chip: "bg-indigo-100 text-indigo-700",
//     Icon: List,
//   },
//   Assigned: {
//     dot: "bg-blue-400",
//     txt: "text-blue-700",
//     chip: "bg-blue-100 text-blue-700",
//     Icon: UserCheck,
//   },
//   Acceptance: {
//     dot: "bg-sky-500",
//     txt: "text-sky-700",
//     chip: "bg-sky-100 text-sky-700",
//     Icon: BadgeCheck,
//   },
//   "In Progress": {
//     dot: "bg-blue-500",
//     txt: "text-blue-700",
//     chip: "bg-blue-100 text-blue-700",
//     Icon: Clock3,
//   },
//   "On Hold": {
//     dot: "bg-amber-500",
//     txt: "text-amber-700",
//     chip: "bg-amber-100 text-amber-700",
//     Icon: AlertCircle,
//   },
//   "Waiting for User Input": {
//     dot: "bg-orange-500",
//     txt: "text-orange-700",
//     chip: "bg-orange-100 text-orange-700",
//     Icon: Timer,
//   },
//   "IT Testing": {
//     dot: "bg-indigo-500",
//     txt: "text-indigo-700",
//     chip: "bg-indigo-100 text-indigo-700",
//     Icon: FlaskConical,
//   },
//   "Ready for Demo": {
//     dot: "bg-teal-500",
//     txt: "text-teal-700",
//     chip: "bg-teal-100 text-teal-700",
//     Icon: PlayCircle,
//   },
//   "User Testing": {
//     dot: "bg-amber-400",
//     txt: "text-amber-700",
//     chip: "bg-amber-100 text-amber-700",
//     Icon: TestTube,
//   },
//   Resolved: {
//     dot: "bg-emerald-500",
//     txt: "text-emerald-700",
//     chip: "bg-emerald-100 text-emerald-700",
//     Icon: ThumbsUp,
//   },
//   Closed: {
//     dot: "bg-slate-300",
//     txt: "text-slate-400",
//     chip: "bg-slate-100 text-slate-400",
//     Icon: XCircle,
//   },
// };

// const CATEGORY_META = {
//   software: {
//     label: "Software",
//     Icon: Zap,
//     pill: "bg-violet-50 text-violet-700 border-violet-200",
//     statuses: [
//       "Open",
//       "Requirement",
//       "Discussion",
//       "Acceptance",
//       "In Progress",
//       "IT Testing",
//       "Ready for Demo",
//       "User Testing",
//       "Waiting for User Input",
//       "Resolved",
//       "Closed",
//     ],
//     flowType: "full",
//   },
//   erp: {
//     label: "ERP Enhancement",
//     Icon: Database,
//     pill: "bg-cyan-50 text-cyan-700 border-cyan-200",
//     statuses: [
//       "Open",
//       "Requirement",
//       "Discussion",
//       "Acceptance",
//       "In Progress",
//       "IT Testing",
//       "Ready for Demo",
//       "User Testing",
//       "Waiting for User Input",
//       "Resolved",
//       "Closed",
//     ],
//     flowType: "full",
//   },
//   hardware: {
//     label: "Hardware",
//     Icon: HardDrive,
//     pill: "bg-amber-50 text-amber-700 border-amber-200",
//     statuses: [
//       "Open",
//       "Acceptance",
//       "In Progress",
//       "Waiting for User Input",
//       "Resolved",
//       "Closed",
//     ],
//     flowType: "simple",
//   },
//   networking: {
//     label: "Networking",
//     Icon: WifiOff,
//     pill: "bg-orange-50 text-orange-700 border-orange-200",
//     statuses: [
//       "Open",
//       "Acceptance",
//       "In Progress",
//       "Waiting for User Input",
//       "Resolved",
//       "Closed",
//     ],
//     flowType: "simple",
//   },
// };

const getCatMeta = (id) => CATEGORY_META[id] || CATEGORY_META.software;

// function HRPill({ small = false }) {
//   if (small)
//     return (
//       <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 flex-none">
//         <Briefcase className="w-2.5 h-2.5" />
//         HR
//       </span>
//     );
//   return (
//     <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
//       <Briefcase className="w-3 h-3" />
//       HR
//     </span>
//   );
// }

export default function OnHoldTicketsModal({
  open,
  onClose,
  tickets,
  onSelectTicket,
}) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay !z-[40]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box max-w-4xl">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              On Hold Tickets
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any ticket to open full details.
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
                No on hold tickets found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const statusMeta =
                  STATUS_META[ticket.status] || STATUS_META.Open;
                const cat =
                  ticket.ticketDept !== "HR" && ticket.category
                    ? getCatMeta(ticket.category)
                    : null;

                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => {
                      // onClose();
                      onSelectTicket(ticket.id);
                    }}
                    className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 hover:border-amber-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                            On Hold
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
                          <span className="text-[10px] font-bold text-black px-2 py-1 rounded-full bg-slate-100">
                            {ticket.ticketNo}
                          </span>
                        </div>

                        <p className="text-sm font-bold text-slate-900">
                          {ticket.description}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Owner {ticket.createdBy}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Submitted By {ticket.submittedBy}
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
