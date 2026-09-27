import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchTeacherClassResults, type ExamResultItem } from "../../features/examResults/examResultsSlice";

export default function TeacherStudentResults() {
  const dispatch = useAppDispatch();
  const { teacherResults, teacherLoading, error, teacherClassLevel, teacherTotalStudents } =
    useAppSelector((s) => s.examResults);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedResult, setSelectedResult] = useState<ExamResultItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    dispatch(fetchTeacherClassResults({}));
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(
      fetchTeacherClassResults({
        status: statusFilter !== "all" ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        studentName: search || undefined,
      })
    );
  };

  const handleReset = () => {
    setSearch("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    dispatch(fetchTeacherClassResults({}));
  };

  const filtered = useMemo(() => {
    return teacherResults.filter((item) => {
      const q = search.toLowerCase().trim();
      const name = (item.student?.name || item.studentID || "").toLowerCase();
      const sid = (item.student?.StudentId || item.studentID || "").toLowerCase();
      const examName = (item.exam?.name || "").toLowerCase();
      const matchSearch = !q || name.includes(q) || sid.includes(q) || examName.includes(q);
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      let matchDate = true;
      if (startDate || endDate) {
        const d = new Date(item.createdAt || item.updatedAt);
        if (startDate && d < new Date(startDate)) matchDate = false;
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (d > e) matchDate = false;
        }
      }
      return matchSearch && matchStatus && matchDate;
    });
  }, [teacherResults, search, statusFilter, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, startDate, endDate]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(s, s + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const passed = filtered.filter((r) => r.status === "Passed").length;
    const failed = total - passed;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const avgScore = total > 0 ? Math.round(filtered.reduce((a, r) => a + (r.score || 0), 0) / total) : 0;
    return { total, passed, failed, passRate, avgScore };
  }, [filtered]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-900/40 via-purple-900/30 to-indigo-900/40 p-6 shadow-2xl backdrop-blur-md">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-indigo-600/10 blur-2xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 shadow-lg">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">My Class Results</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Exam results for students in{" "}
                {teacherClassLevel ? (
                  <span className="text-violet-400 font-semibold">{teacherClassLevel}</span>
                ) : (
                  "your assigned class"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefresh}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/30 text-slate-300 text-xs sm:text-sm font-medium transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: "Total Results", value: stats.total, color: "violet", suffix: "" },
          { label: "Total Class Students", value: teacherTotalStudents, color: "indigo", suffix: "" },
          { label: "Passed", value: stats.passed, color: "emerald", suffix: "" },
          { label: "Failed", value: stats.failed, color: "rose", suffix: "" },
          { label: "Avg Score", value: stats.avgScore, color: "amber", suffix: "%" },
        ].map(({ label, value, color, suffix }) => (
          <div
            key={label}
            className={`bg-white/5 border border-white/10 hover:border-${color}-500/30 p-4 rounded-2xl transition-all shadow-lg`}
          >
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
            <p className={`text-2xl sm:text-3xl font-bold text-${color}-400 mt-2`}>
              {value}{suffix}
            </p>
          </div>
        ))}
      </div>

      {/* Pass Rate Progress Bar */}
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">Class Pass Rate</span>
          <span className="text-sm font-bold text-emerald-400">{stats.passRate}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
            style={{ width: `${stats.passRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-slate-500">
          <span>{stats.passed} Passed</span>
          <span>{stats.failed} Failed</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Filter Results</h2>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Search Student / Exam</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Student name, ID, exam..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>
          </div>
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Grade Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="Passed">🟢 Passed</option>
              <option value="Failed">🔴 Failed</option>
            </select>
          </div>
          {/* From Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>
          {/* To Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Results Table */}
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Result Records</h3>
            <p className="text-xs text-slate-400">
              Showing {filtered.length} of {teacherResults.length} total entries
            </p>
          </div>
          {teacherClassLevel && (
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
              Class: {teacherClassLevel}
            </span>
          )}
        </div>

        {teacherLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-300">No Results Found</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {teacherResults.length === 0
                ? "No exam results exist for your class yet, or no class level is assigned to your profile."
                : "Try adjusting your search or filter criteria."}
            </p>
            {teacherResults.length > 0 && (
              <button
                onClick={handleReset}
                className="mt-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 transition-all"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Exam / Subject</th>
                    <th className="px-5 py-4">Score</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Remarks</th>
                    <th className="px-5 py-4">Visibility</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {paginated.map((item) => {
                    const name = item.student?.name || `Student (${item.studentID})`;
                    const sid = item.student?.StudentId || item.studentID;
                    const isPassed = item.status === "Passed";
                    const examName = item.exam?.name || "Exam";
                    const subject = item.exam?.subject?.name || "—";
                    const scoreColor =
                      item.score >= 75 ? "text-emerald-400" :
                      item.score >= 50 ? "text-amber-400" : "text-rose-400";

                    return (
                      <tr key={item._id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white group-hover:text-violet-400 transition-colors leading-tight">{name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{sid}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-white text-xs">{examName}</p>
                          <p className="text-[11px] text-slate-400">{subject}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-bold ${scoreColor}`}>{item.score}%</span>
                            <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.score >= 75 ? "bg-emerald-500" :
                                  item.score >= 50 ? "bg-amber-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(item.score, 100)}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Pass: {item.passMark}%</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            isPassed
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            item.remarks === "Excellent" ? "text-emerald-400" :
                            item.remarks === "Good" ? "text-sky-400" :
                            item.remarks === "Fair" ? "text-amber-400" : "text-rose-400"
                          }`}>
                            {item.remarks}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                            item.isPublished
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}>
                            {item.isPublished ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", {
                            year: "numeric", month: "short", day: "numeric"
                          })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedResult(item)}
                            className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 text-xs font-medium transition-all"
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/5">
              {paginated.map((item) => {
                const name = item.student?.name || `Student (${item.studentID})`;
                const sid = item.student?.StudentId || item.studentID;
                const isPassed = item.status === "Passed";
                return (
                  <div key={item._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm leading-tight">{name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{sid}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-base font-bold ${isPassed ? "text-emerald-400" : "text-rose-400"}`}>
                          {item.score}%
                        </span>
                        <p className={`text-[11px] ${isPassed ? "text-emerald-500" : "text-rose-500"}`}>{item.status}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        {item.exam?.name || "Exam"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                        {item.exam?.subject?.name || "N/A"}
                      </span>
                      <span className={`px-2 py-0.5 rounded border ${
                        item.isPublished
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}>
                        {item.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[11px] text-slate-500">
                        {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => setSelectedResult(item)}
                        className="px-3 py-1 rounded-lg bg-violet-600/30 text-violet-300 font-medium text-xs"
                      >
                        View Report
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="p-4 sm:p-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5">
              <p className="text-xs text-slate-400">
                Showing{" "}
                <span className="font-semibold text-white">
                  {filtered.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-white">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                of <span className="font-semibold text-white">{filtered.length}</span> entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ← Back
                </button>
                <span className="text-xs text-slate-300 font-medium px-2">
                  Page <strong className="text-white">{currentPage}</strong> of{" "}
                  <strong className="text-white">{totalPages}</strong>
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1629] border border-violet-500/20 rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold">
                  Result Report
                </span>
                <h2 className="text-xl font-bold text-white mt-1.5">
                  {selectedResult.exam?.name || "Exam Result"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(selectedResult.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
              <div>
                <p className="text-xs text-slate-400">Student Name</p>
                <p className="font-semibold text-white mt-0.5">
                  {selectedResult.student?.name || selectedResult.studentID}
                </p>
                <p className="text-xs text-violet-400 font-mono mt-0.5">
                  ID: {selectedResult.student?.StudentId || selectedResult.studentID}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Program / Subject</p>
                <p className="font-semibold text-white mt-0.5">
                  {selectedResult.program?.name || selectedResult.student?.program?.name || "N/A"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedResult.exam?.subject?.name || "N/A"}
                </p>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Score", value: `${selectedResult.score}%`, color:
                  selectedResult.score >= 75 ? "text-emerald-400" :
                  selectedResult.score >= 50 ? "text-amber-400" : "text-rose-400" },
                { label: "Pass Mark", value: `${selectedResult.passMark}%`, color: "text-slate-300" },
                { label: "Status", value: selectedResult.status,
                  color: selectedResult.status === "Passed" ? "text-emerald-400" : "text-rose-400" },
                { label: "Remarks", value: selectedResult.remarks, color: "text-amber-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Answered Questions */}
            {selectedResult.answeredQuestions && selectedResult.answeredQuestions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  Answered Questions ({selectedResult.answeredQuestions.length})
                </h3>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedResult.answeredQuestions.map((q: any, i: number) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs space-y-1">
                      <p className="text-slate-200 font-medium">{i + 1}. {q.question || q.name || "Question"}</p>
                      <div className="flex gap-4 text-slate-400">
                        <span>Selected: <strong className="text-violet-300">{q.selectedOption || q.userAnswer || "N/A"}</strong></span>
                        <span>Correct: <strong className="text-emerald-400">{q.correctOption || q.correctAnswer || "N/A"}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
