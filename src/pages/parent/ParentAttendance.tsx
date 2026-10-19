import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchParentChildAttendanceSummary } from "../../features/attendance/attendanceSlice";
import { CalenderIcon } from "../../icons";

export default function ParentAttendance() {
  const dispatch = useAppDispatch();
  const { parentAttendanceData, parentDataLoading, error } = useAppSelector(
    (state) => state.attendance
  );

  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"all" | "Absent" | "Late" | "Present" | "Excused">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Initial load
  useEffect(() => {
    dispatch(fetchParentChildAttendanceSummary());
  }, [dispatch]);

  // Synchronize selected child when data arrives
  useEffect(() => {
    if (parentAttendanceData?.activeChild?._id && !selectedChildId) {
      setSelectedChildId(parentAttendanceData.activeChild._id);
    }
  }, [parentAttendanceData, selectedChildId]);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    dispatch(fetchParentChildAttendanceSummary(childId));
  };

  const activeChild = parentAttendanceData?.activeChild;
  const children = parentAttendanceData?.children || [];
  const summary = parentAttendanceData?.summary || {
    totalSessions: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    attendanceRate: 100,
  };

  // Filter records based on selected tab and search query
  const filteredRecords = useMemo(() => {
    let list = parentAttendanceData?.allRecords || [];

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
  }, [parentAttendanceData, activeFilter, searchTerm]);

  // Format date nicely (e.g. "Monday, Oct 12, 2026")
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
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <CalenderIcon className="w-3.5 h-3.5" />
              <span>Parent Portal • Attendance Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Child Attendance Summary
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
              Official roll-call records verified by class teachers. Track your child's presence, absent days, and late arrivals in real-time.
            </p>
          </div>

          {/* Child Switcher Pills (If parent has multiple children) */}
          {children.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
              <span className="block text-[11px] font-bold text-white/80 uppercase tracking-wider mb-1.5 px-2">
                Viewing Child:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {children.map((child: any) => {
                  const isSelected = (child._id || child) === selectedChildId;
                  return (
                    <button
                      key={child._id || child}
                      onClick={() => handleSelectChild(child._id || child)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        isSelected
                          ? "bg-white text-emerald-800 shadow-md scale-102"
                          : "text-white/90 hover:bg-white/20"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>{child.name || "Student"}</span>
                      <span className="opacity-70 text-[10px]">
                        ({child.currentClassLevel || "Class"})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {parentDataLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-16 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">
            Fetching verified attendance records...
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Loading real-time classroom register data for your child.
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-6 rounded-2xl text-rose-700 dark:text-rose-300 text-sm">
          <strong>Error loading attendance:</strong> {error}
        </div>
      ) : children.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
            ⚠️
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No Children Linked Yet
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            Please link your child using their student admission number in the Invoices section to view their attendance record.
          </p>
        </div>
      ) : (
        <>
          {/* Active Student Info Header */}
          {activeChild && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center justify-center text-lg">
                  {activeChild.name ? activeChild.name.charAt(0).toUpperCase() : "S"}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    {activeChild.name}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 font-bold border border-emerald-200 dark:border-emerald-800">
                      Active Student
                    </span>
                  </h2>
                  <div className="text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                    <span>Admission ID: <strong className="text-gray-700 dark:text-gray-300 font-mono">{activeChild.StudentId || activeChild.studentId || "N/A"}</strong></span>
                    <span>Class: <strong className="text-gray-700 dark:text-gray-300">{activeChild.currentClassLevel || "Unassigned"}</strong></span>
                    {activeChild.email && <span>Email: <strong className="text-gray-700 dark:text-gray-300">{activeChild.email}</strong></span>}
                  </div>
                </div>
              </div>

              <div className="text-right self-end sm:self-auto">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Attendance Status
                </span>
                <span
                  className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full mt-0.5 ${
                    summary.attendanceRate >= 85
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                      : summary.attendanceRate >= 70
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                      : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {summary.attendanceRate >= 85
                    ? "✓ Good Standing"
                    : summary.attendanceRate >= 70
                    ? "⚠️ Moderate Standing"
                    : "⚠️ Warning: Low Attendance"}
                </span>
              </div>
            </div>
          )}

          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* Card 1: Attendance Rate */}
            <div className="col-span-2 sm:col-span-1 bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Rate</span>
                <span className="text-lg">📊</span>
              </div>
              <div className="text-3xl font-black text-gray-900 dark:text-white">
                {summary.attendanceRate}%
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {summary.presentCount + summary.lateCount} of {summary.totalSessions} sessions attended
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

            {/* Card 2: Present Days */}
            <div
              onClick={() => setActiveFilter("Present")}
              className={`cursor-pointer bg-white dark:bg-gray-800 rounded-3xl p-5 border transition-all shadow-sm ${
                activeFilter === "Present"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-gray-100 dark:border-gray-700 hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Present Days
                </span>
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 text-xs flex items-center justify-center font-bold">
                  ✓
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {summary.presentCount}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                On-time full classroom attendance
              </p>
            </div>

            {/* Card 3: Absent Days (Requested Feature) */}
            <div
              onClick={() => setActiveFilter("Absent")}
              className={`cursor-pointer bg-white dark:bg-gray-800 rounded-3xl p-5 border transition-all shadow-sm ${
                activeFilter === "Absent"
                  ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                  : "border-gray-100 dark:border-gray-700 hover:border-rose-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Absent Days
                </span>
                <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 text-xs flex items-center justify-center font-bold">
                  ✕
                </span>
              </div>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
                {summary.absentCount}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Missed roll call or class sessions
              </p>
            </div>

            {/* Card 4: Late Days (Requested Feature) */}
            <div
              onClick={() => setActiveFilter("Late")}
              className={`cursor-pointer bg-white dark:bg-gray-800 rounded-3xl p-5 border transition-all shadow-sm ${
                activeFilter === "Late"
                  ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                  : "border-gray-100 dark:border-gray-700 hover:border-amber-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Late Arrivals
                </span>
                <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 text-xs flex items-center justify-center font-bold">
                  ⏱
                </span>
              </div>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {summary.lateCount}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Arrived late or after morning roll call
              </p>
            </div>

            {/* Card 5: Excused Days */}
            <div
              onClick={() => setActiveFilter("Excused")}
              className={`cursor-pointer bg-white dark:bg-gray-800 rounded-3xl p-5 border transition-all shadow-sm ${
                activeFilter === "Excused"
                  ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                  : "border-gray-100 dark:border-gray-700 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Excused Leave
                </span>
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 text-xs flex items-center justify-center font-bold">
                  ℹ
                </span>
              </div>
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {summary.excusedCount}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Officially excused with note/permit
              </p>
            </div>
          </div>

          {/* Interactive Filter Tabs & Search Bar */}
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
                  All Sessions ({summary.totalSessions})
                </button>
                <button
                  onClick={() => setActiveFilter("Absent")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeFilter === "Absent"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  }`}
                >
                  <span>Absent Days</span>
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
                  <span>Late Days</span>
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
                <button
                  onClick={() => setActiveFilter("Excused")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeFilter === "Excused"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                  }`}
                >
                  <span>Excused</span>
                  <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                    {summary.excusedCount}
                  </span>
                </button>
              </div>

              {/* Search Field */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search date, subject, remark..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3.5 py-2 pl-9 text-xs bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                />
                <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Attendance Days List */}
            {filteredRecords.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700/40 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                  {activeFilter === "Absent" ? "🎉" : activeFilter === "Late" ? "⏱" : "📅"}
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {activeFilter === "Absent"
                    ? "No Absent Days Logged!"
                    : activeFilter === "Late"
                    ? "No Late Arrival Records!"
                    : "No matching attendance records found."}
                </h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  {activeFilter === "Absent"
                    ? "Your child has maintained full attendance with zero unexcused absences recorded by the school."
                    : activeFilter === "Late"
                    ? "Your child has arrived punctually for all logged roll call sessions."
                    : "Try clearing your search term or switching to another filter."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Session / Subject</th>
                      <th className="py-3 px-4">Class Level</th>
                      <th className="py-3 px-4">Teacher</th>
                      <th className="py-3 px-4">Teacher's Note / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {filteredRecords.map((item: any, idx: number) => {
                      const isAbsent = item.status === "Absent";
                      const isLate = item.status === "Late";
                      const isPresent = item.status === "Present";

                      return (
                        <tr
                          key={item._id || idx}
                          className={`hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors ${
                            isAbsent
                              ? "bg-rose-50/30 dark:bg-rose-950/10"
                              : isLate
                              ? "bg-amber-50/30 dark:bg-amber-950/10"
                              : ""
                          }`}
                        >
                          {/* Date */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {formatDateDisplay(item.dateString, item.date)}
                            </div>
                            <span className="font-mono text-[10px] text-gray-400">
                              {item.dateString}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                isPresent
                                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                                  : isAbsent
                                  ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-black animate-pulse"
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

                          {/* Subject / Roll Call */}
                          <td className="py-3.5 px-4 font-semibold text-gray-800 dark:text-gray-200">
                            {item.subject || "Morning Roll Call"}
                          </td>

                          {/* Class Level */}
                          <td className="py-3.5 px-4 text-gray-500 font-medium">
                            {item.classLevel || activeChild.currentClassLevel || "—"}
                          </td>

                          {/* Teacher Name */}
                          <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                            {item.teacher?.name || "Class Teacher"}
                          </td>

                          {/* Remarks */}
                          <td className="py-3.5 px-4">
                            {item.remarks ? (
                              <span className="text-gray-700 dark:text-gray-300 italic bg-gray-100 dark:bg-gray-700/60 px-2.5 py-1 rounded-lg inline-block">
                                "{item.remarks}"
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[11px]">—</span>
                            )}
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
