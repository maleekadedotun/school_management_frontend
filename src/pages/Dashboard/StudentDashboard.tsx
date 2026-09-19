import { useAppSelector } from "../../app/hooks";

export default function StudentDashboard() {
  const { student, currentStudent } = useAppSelector((state) => state.students);
  const activeStudent = student || currentStudent;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-white/20 rounded-full backdrop-blur-md mb-3">
            Student Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, {activeStudent?.name || "Student"}! 🎓
          </h1>
          <p className="mt-2 text-indigo-100 text-sm md:text-base max-w-2xl">
            Track your class level, review exam results, view academic achievements, and stay updated with school notices.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-lg">
              {activeStudent?.name?.[0]?.toUpperCase() || "S"}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{activeStudent?.name || "Student Name"}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{activeStudent?.email || "No email"}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                Role: {activeStudent?.role || "Student"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Current Class Level
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-2">
            {(activeStudent as any)?.currentClassLevel || "Level 100"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Student ID
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-2">
            {(activeStudent as any)?.studentId || (activeStudent as any)?.StudentId || "STU-ACTIVE"}
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Exam Performance & Status
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You are currently active. Make sure to complete all assigned online tests and exams before deadlines.
        </p>
      </div>
    </div>
  );
}