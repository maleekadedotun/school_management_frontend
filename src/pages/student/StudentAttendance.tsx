import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchStudentAttendanceSummary } from "../../features/attendance/attendanceSlice";
import { CalenderIcon } from "../../icons";

export default function StudentAttendance() {
  const dispatch = useAppDispatch();
  const { studentSummary, studentSummaryLoading, error } = useAppSelector(
    (state) => state.attendance
  );

  const [activeFilter, setActiveFilter] = useState<"all" | "Absent" | "Late" | "Present" | "Excused">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchStudentAttendanceSummary());
  }, [dispatch]);

  const student = studentSummary?.student;
  const summary = studentSummary?.summary || {
    totalSessions: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    attendanceRate: 100,
  };

  const filteredRecords = useMemo(() => {
    let list = studentSummary?.allRecords || [];

    if (activeFilter !== "all") {
      list = list.filter((r) => r.status === activeFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          r.dateString?.toLowerCase().includes(q) ||
          r.subject?.toLowerCase().includes(q) ||
          r.remarks?.toLowerCase().includes(q) ||
          r.teacher?.name?.toLowerCase().includes(q) ||
          r.status?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [studentSummary, activeFilter, searchTerm]);

  const formatDateDisplay = (dateString?: string, date?: string) => {
    const d = new Date(dateString || date || Date.now());
    if (isNaN(d.getTime())) return dateString || "—";
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <CalenderIcon className="w-3.5 h-3.5" />
              <span>Student Academic Record • Attendance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Attendance Record
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1 max-w-lg">
              Official roll call records entered by your class teachers. Read-only verified records.
            </p>
          </div>

          {student && (
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 self-start sm:self-auto text-xs space-y-1">
              <div className="text-white/80">Student: <strong className="text-white">{student.name}</strong></div>
              <div className="text-white/80">ID: <strong className="text-white font-mono">{student.StudentId || "N/A"}</strong></div>
              <div className="text-white/80">Class: <strong className="text-white">{student.currentClassLevel || "Level"}</strong></div>
            </div>
          )}
        </div>
      </div>

      {studentSummaryLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-16 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">
            Loading your attendance records...
          </h3>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-6 rounded-2xl text-rose-700 dark:text-rose-300 text-sm">
          <strong>Error loading attendance:</strong> {error}
        </div>
      ) : (
        <>
          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* Rate Card */}
            <div className="col-span-2 sm:col-span-1 bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Attendance Rate
              </span>
              <div className="text-3xl font-black text-gray-900 dark:text-white">
                {summary.attendanceRate}%
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {summary.presentCount + summary.lateCount} of {summary.totalSessions} sessions
              </p>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    summary.attendanceRate >= 85
                      ? "bg-emerald-500"
                      : summary.attendanceRate >= 70
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, summary.attendanceRate))}%` }}
                />
              </div>
            </div>

            {/* Present Card */}
            <div
              onClick={() => setActiveFilter("Present")}
              className={`cursor-pointer bg-white dark:bg-gray-800 rounded-3xl p-5 border transition-all shadow-sm ${
                activeFilter === "Present"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-gray-100 dark:border-gray-700 hover:border-emerald-300"
              }`}
            >
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                Days Present
              </span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {summary.presentCount}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Full attendance sessions</p>
            </div>

            {/* Absent Card */}
            <div
              onClick={() => setActiveFilter("Absent")}
              className={`cursor-pointer bg-white dark:bg-gray-800 rounded-3xl p-5 border transition-all shadow-sm ${
                activeFilter === "Absent"
                  ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                  : "border-gray-100 dark:border-gray-700 hover:border-rose-300"
              }`}
            >
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">
                Days Absent
              </span>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
                {summary.absentCount}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Recorded absences</p>
            </div>

            {/* Late Card */}
            <div
              onClick={() => setActiveFilter("Late")}
              className={`cursor-pointer bg-white dark:bg-gray-800 rounded-3xl p-5 border transition-all shadow-sm ${
                activeFilter === "Late"
                  ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                  : "border-gray-100 dark:border-gray-700 hover:border-amber-300"
              }`}
            >
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
                Days Late
              </span>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {summary.lateCount}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Late arrivals</p>
            </div>

            {/* Excused Card */}
            <div
              onClick={() => setActiveFilter("Excused")}
              className={`cursor-pointer bg-white dark:bg-gray-800 rounded-3xl p-5 border transition-all shadow-sm ${
                activeFilter === "Excused"
                  ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                  : "border-gray-100 dark:border-gray-700 hover:border-indigo-300"
              }`}
            >
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                Days Excused
              </span>
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {summary.excusedCount}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Official leaves</p>
            </div>
          </div>

          {/* Records Table Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Tab Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === "all"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  All ({summary.totalSessions})
                </button>
                <button
                  onClick={() => setActiveFilter("Absent")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeFilter === "Absent"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  }`}
                >
                  <span>Absent</span>
                  <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                    {summary.absentCount}
                  </span>
                </button>
                <button
                  onClick={() => setActiveFilter("Late")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeFilter === "Late"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  }`}
                >
                  <span>Late</span>
                  <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                    {summary.lateCount}
                  </span>
                </button>
                <button
                  onClick={() => setActiveFilter("Present")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeFilter === "Present"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  }`}
                >
                  <span>Present</span>
                  <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                    {summary.presentCount}
                  </span>
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search date, subject, notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3.5 py-2 pl-9 text-xs bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                />
                <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
              </div>
            </div>

            {/* List */}
            {filteredRecords.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs">
                No attendance sessions matching your current filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Session / Subject</th>
                      <th className="py-3 px-4">Teacher</th>
                      <th className="py-3 px-4">Teacher's Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {filteredRecords.map((item: any, idx: number) => {
                      const isAbsent = item.status === "Absent";
                      const isLate = item.status === "Late";
                      const isPresent = item.status === "Present";

                      return (
                        <tr key={item._id || idx} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30">
                          <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                            {formatDateDisplay(item.dateString, item.date)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                isPresent
                                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                                  : isAbsent
                                  ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold"
                                  : isLate
                                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold"
                                  : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isPresent
                                    ? "bg-emerald-500"
                                    : isAbsent
                                    ? "bg-rose-500"
                                    : isLate
                                    ? "bg-amber-500"
                                    : "bg-indigo-500"
                                }`}
                              />
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-gray-800 dark:text-gray-200">
                            {item.subject || "Morning Roll Call"}
                          </td>
                          <td className="py-3.5 px-4 text-gray-500">
                            {item.teacher?.name || "Class Teacher"}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300 italic">
                            {item.remarks ? `"${item.remarks}"` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
