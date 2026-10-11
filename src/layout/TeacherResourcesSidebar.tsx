import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import {
  FiArrowLeft,
  FiGrid,
  FiFileText,
  FiClock,
  FiBookOpen,
  FiLayers,
  FiFolder,
  FiCalendar,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";

interface TeacherResourcesSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const navItems = [
  {
    name: "Overview",
    path: "/teacher/resources",
    icon: <FiGrid className="w-5 h-5 shrink-0" />,
    exact: true,
    description: "Resources home & metrics",
  },
  {
    name: "Lesson Notes",
    path: "/teacher/resources/lesson-notes",
    icon: <FiFileText className="w-5 h-5 shrink-0" />,
    description: "Write & manage lesson notes",
  },
  {
    name: "Teacher Timetable",
    path: "/teacher/resources/timetable",
    icon: <FiClock className="w-5 h-5 shrink-0" />,
    description: "Weekly teaching schedule",
  },
  {
    name: "Lesson Plans",
    path: "/teacher/resources/lesson-plans",
    icon: <FiBookOpen className="w-5 h-5 shrink-0" />,
    description: "Curriculum & unit schemes",
  },
  {
    name: "My Subjects",
    path: "/teacher/resources/subjects",
    icon: <FiLayers className="w-5 h-5 shrink-0" />,
    description: "Assigned subjects & classes",
  },
  {
    name: "Teaching Materials",
    path: "/teacher/resources/materials",
    icon: <FiFolder className="w-5 h-5 shrink-0" />,
    description: "Documents, slides & PDFs",
  },
  {
    name: "Academic Calendar",
    path: "/teacher/resources/calendar",
    icon: <FiCalendar className="w-5 h-5 shrink-0" />,
    description: "Term dates, exams & events",
  },
];

export default function TeacherResourcesSidebar({
  isMobileOpen = false,
  onCloseMobile,
}: TeacherResourcesSidebarProps) {
  const navigate = useNavigate();
  const teacherState = useAppSelector((state) => state.teacherAuth);
  const teacher = teacherState.teacher;

  const teacherName = teacher?.name || "Teacher";
  const teacherSubject =
    typeof teacher?.subject === "object"
      ? (teacher?.subject as any)?.name
      : teacher?.subject || "Subject Instructor";

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0c1222] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header: Return to Main Teacher Dashboard */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <Link
              to="/teacher/dashboard"
              className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-all shadow-xs"
              title="Return to Main Teacher Dashboard"
            >
              <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Teacher Dashboard</span>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close Sidebar"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Workspace Branding */}
          <div className="flex items-center gap-3 pt-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <FiBookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">
                  Teaching Resources
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold uppercase">
                  Hub
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Academic & Instructional Tools</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Workspace Modules
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                    } transition-colors`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="truncate">{item.name}</div>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer: Logged in Teacher Badge & Quick Return */}
        <div className="p-3.5 border-t border-slate-800 bg-[#090d18]">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-9 h-9 rounded-lg bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
              {teacherName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                <span>{teacherName}</span>
                <FiCheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-400 truncate">{teacherSubject}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/teacher/dashboard")}
            className="w-full mt-2.5 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800 border border-slate-700/40 transition"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </aside>
    </>
  );
}
