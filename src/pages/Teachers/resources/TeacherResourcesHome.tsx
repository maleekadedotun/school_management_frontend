import { Link } from "react-router-dom";
import { useAppSelector } from "../../../app/hooks";
import {
  FiFileText,
  FiClock,
  FiBookOpen,
  FiLayers,
  FiFolder,
  FiCalendar,
  FiArrowRight,
  FiArrowLeft,
  FiCheckCircle,
  FiBookmark,
} from "react-icons/fi";

export default function TeacherResourcesHome() {
  const teacher = useAppSelector((state) => state.teacherAuth.teacher);

  const teacherName = teacher?.name || "Teacher";
  const teacherSubject =
    typeof teacher?.subject === "object"
      ? (teacher?.subject as any)?.name
      : teacher?.subject || "Subject Instructor";
  const teacherClass =
    typeof teacher?.classLevel === "object"
      ? (teacher?.classLevel as any)?.name
      : teacher?.classLevel || "Assigned Level";

  const resourceModules = [
    {
      title: "Lesson Notes",
      description: "Write, structure, and organize comprehensive notes for your classroom lessons with clear objectives and activities.",
      path: "/teacher/resources/lesson-notes",
      icon: <FiFileText className="w-6 h-6 text-indigo-400" />,
      accentColor: "border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/40",
      badge: "Instructional",
      quickAction: "Write Note",
    },
    {
      title: "Teacher Timetable",
      description: "View your weekly schedule, class timeslots, assigned periods, and designated classrooms at a glance.",
      path: "/teacher/resources/timetable",
      icon: <FiClock className="w-6 h-6 text-amber-400" />,
      accentColor: "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40",
      badge: "Schedule",
      quickAction: "View Timetable",
    },
    {
      title: "Lesson Plans",
      description: "Design multi-week curriculum schemes, learning targets, teaching steps, and assessment criteria.",
      path: "/teacher/resources/lesson-plans",
      icon: <FiBookOpen className="w-6 h-6 text-emerald-400" />,
      accentColor: "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40",
      badge: "Curriculum",
      quickAction: "Plan Lesson",
    },
    {
      title: "My Subjects",
      description: "Inspect assigned subjects, class curriculum streams, enrolled student rosters, and departmental requirements.",
      path: "/teacher/resources/subjects",
      icon: <FiLayers className="w-6 h-6 text-sky-400" />,
      accentColor: "border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40",
      badge: "Teaching Load",
      quickAction: "View Subjects",
    },
    {
      title: "Teaching Materials",
      description: "Upload, store, and manage reference PDFs, presentation slide decks, worksheets, and study materials.",
      path: "/teacher/resources/materials",
      icon: <FiFolder className="w-6 h-6 text-purple-400" />,
      accentColor: "border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40",
      badge: "Repository",
      quickAction: "Manage Files",
    },
    {
      title: "Academic Calendar",
      description: "Track term dates, examination blocks, holiday periods, school functions, and critical academic deadlines.",
      path: "/teacher/resources/calendar",
      icon: <FiCalendar className="w-6 h-6 text-rose-400" />,
      accentColor: "border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40",
      badge: "Term Schedule",
      quickAction: "Open Calendar",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/80 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <FiBookmark className="w-3.5 h-3.5" />
              <span>Teaching Resources Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {teacherName}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Manage your instructional materials, classroom lesson notes, teaching timetable, curriculum schemes, and academic schedule in one dedicated workspace.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <FiLayers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Subject: {teacherSubject}</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Class: {teacherClass}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0">
            <Link
              to="/teacher/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold border border-slate-700 transition shadow-xs"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Teacher Dashboard</span>
            </Link>

            <Link
              to="/teacher/resources/lesson-notes"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <FiFileText className="w-4 h-4" />
              <span>Write Lesson Note</span>
            </Link>
          </div>
        </div>

        {/* Ambient Decorative Blurs */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-56 h-56 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Grid of 6 Resource Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Instructional & Planning Modules
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any tool below to begin organizing your academic term.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resourceModules.map((mod) => (
            <Link
              key={mod.path}
              to={mod.path}
              className={`group flex flex-col justify-between p-6 rounded-2xl border ${mod.accentColor} bg-[#0e1628] hover:bg-[#121c33] transition-all duration-200 shadow-sm hover:shadow-xl hover:-translate-y-0.5`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 group-hover:scale-105 transition-transform">
                    {mod.icon}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                    {mod.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                <span>{mod.quickAction}</span>
                <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
