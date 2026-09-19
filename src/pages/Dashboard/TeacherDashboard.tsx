import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchTeacherProfile } from "../../features/teacherAuth/teacherAuthSlice";

export default function TeacherDashboard() {
  const dispatch = useAppDispatch();
  const { teacher, loading } = useAppSelector((state) => state.teacherAuth);

  useEffect(() => {
    dispatch(fetchTeacherProfile());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-white/20 rounded-full backdrop-blur-md mb-3">
            Teacher Workspace
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, {teacher?.name || "Teacher"}! 👋
          </h1>
          <p className="mt-2 text-emerald-100 text-sm md:text-base max-w-2xl">
            Manage your courses, view student submissions, evaluate exam results, and monitor your academic progress.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Profile Overview Card & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
              {teacher?.name?.[0]?.toUpperCase() || "T"}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{teacher?.name || "N/A"}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{teacher?.email || "No email"}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                Role: {teacher?.role || "Teacher"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Assigned Program
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-2">
            {(teacher as any)?.program || "General Academics"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Class Level & Subject
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-2">
            {(teacher as any)?.classLevel || "All Levels"} — {(teacher as any)?.subject || "Main Subject"}
          </p>
        </div>
      </div>

      {/* Main Content Info */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Academic Management & Exams
        </h2>
        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading teacher details...</div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Use the navigation sidebar to access your assigned class lists, create and publish exam questions, and manage student grades.
          </p>
        )}
      </div>
    </div>
  );
}
