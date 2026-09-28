import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchTeacherClassResults,
  teacherEnterResult,
  teacherTogglePublishResult,
  type ExamResultItem,
} from "../../features/examResults/examResultsSlice";
import { fetchTeacherClassStudents } from "../../features/students/studentsSlice";
import { fetchExams } from "../../features/exams/examsSlice";

export default function TeacherStudentResults() {
  const dispatch = useAppDispatch();
  const {
    teacherResults,
    teacherLoading,
    error,
    teacherClassLevel,
    teacherTotalStudents,
    enteringResult,
    teacherPublishingId,
  } = useAppSelector((s) => s.examResults);

  const { teacherClassStudents } = useAppSelector((s) => s.students);
  const { items: examsList } = useAppSelector((s) => s.exams);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [publishFilter, setPublishFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedResult, setSelectedResult] = useState<ExamResultItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Enter Result Modal State
  const [isEnterModalOpen, setIsEnterModalOpen] = useState(false);
  const [formStudentId, setFormStudentId] = useState("");
  const [formExamId, setFormExamId] = useState("");
  const [formScore, setFormScore] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchTeacherClassResults({}));
    dispatch(fetchTeacherClassStudents());
    dispatch(fetchExams());
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
    setPublishFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    dispatch(fetchTeacherClassResults({}));
  };

  const handleToggleTeacherPublish = async (id: string, currentTeacherPublished: boolean, isPublished?: boolean) => {
    if (isPublished && currentTeacherPublished) {
      alert("This exam result has already been officially approved and published by administration. It cannot be recalled by the teacher.");
      return;
    }
    const nextState = !currentTeacherPublished;
    const res = await dispatch(teacherTogglePublishResult({ id, publish: nextState }));
    if (teacherTogglePublishResult.rejected.match(res)) {
      alert((res.payload as string) || "Failed to update publication status");
      return;
    }
    if (selectedResult && selectedResult._id === id) {
      setSelectedResult((prev) =>
        prev
          ? {
              ...prev,
              isTeacherPublished: nextState,
              // If teacher recalls before admin, automatically reset published
              isPublished: nextState ? prev.isPublished : false,
            }
          : null
      );
    }
  };

  const filtered = useMemo(() => {
    return teacherResults.filter((item) => {
      const q = search.toLowerCase().trim();
      const name = (item.student?.name || item.studentID || "").toLowerCase();
      const sid = (item.student?.StudentId || item.studentID || "").toLowerCase();
      const examName = (item.exam?.name || "").toLowerCase();
      const matchSearch = !q || name.includes(q) || sid.includes(q) || examName.includes(q);
      const matchStatus = statusFilter === "all" || item.status === statusFilter;

      let matchPublish = true;
      if (publishFilter === "pending_teacher") {
        matchPublish = !item.isTeacherPublished;
      } else if (publishFilter === "pending_admin") {
        matchPublish = !!item.isTeacherPublished && !item.isPublished;
      } else if (publishFilter === "published") {
        matchPublish = !!item.isPublished;
      }

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
      return matchSearch && matchStatus && matchPublish && matchDate;
    });
  }, [teacherResults, search, statusFilter, publishFilter, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, publishFilter, startDate, endDate]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(s, s + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const passed = filtered.filter((r) => r.status === "Passed").length;
    const failed = total - passed;
    const pendingTeacher = filtered.filter((r) => !r.isTeacherPublished).length;
    const pendingAdmin = filtered.filter((r) => r.isTeacherPublished && !r.isPublished).length;
    const published = filtered.filter((r) => r.isPublished).length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const avgScore =
      total > 0 ? Math.round(filtered.reduce((a, r) => a + (r.score || 0), 0) / total) : 0;
    return { total, passed, failed, pendingTeacher, pendingAdmin, published, passRate, avgScore };
  }, [filtered]);

  // Selected Exam info in modal
  const activeExam = useMemo(() => {
    return examsList.find((e: any) => e._id === formExamId) || null;
  }, [examsList, formExamId]);

  // Computed grade and status in modal
  const computedModalMetrics = useMemo(() => {
    if (!formScore || isNaN(Number(formScore))) {
      return null;
    }
    const scoreNum = Number(formScore);
    const totalMark = activeExam?.totalMark || 100;
    const passMark = activeExam?.passMark || 50;
    const grade = Math.round((scoreNum / totalMark) * 100);
    const status = grade >= passMark ? "Passed" : "Failed";

    let suggestedRemarks = "Poor";
    if (grade >= 80) suggestedRemarks = "Excellent";
    else if (grade >= 70) suggestedRemarks = "Very Good";
    else if (grade >= 60) suggestedRemarks = "Good";
    else if (grade >= 50) suggestedRemarks = "Fair";

    return { grade, status, suggestedRemarks, totalMark, passMark };
  }, [formScore, activeExam]);

  // Submit Handler for entering results
  const handleEnterResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formStudentId) {
      setFormError("Please select a student.");
      return;
    }
    if (!formExamId) {
      setFormError("Please select an exam assessment.");
      return;
    }
    if (formScore === "" || isNaN(Number(formScore)) || Number(formScore) < 0) {
      setFormError("Please enter a valid non-negative numerical score.");
      return;
    }

    try {
      const result = await dispatch(
        teacherEnterResult({
          studentId: formStudentId,
          examId: formExamId,
          score: Number(formScore),
          remarks: formRemarks.trim() || undefined,
        })
      );

      if (teacherEnterResult.fulfilled.match(result)) {
        setFormSuccess(
          "Result saved successfully as UNPUBLISHED! It has been submitted for administrator review."
        );
        setTimeout(() => {
          setIsEnterModalOpen(false);
          setFormStudentId("");
          setFormExamId("");
          setFormScore("");
          setFormRemarks("");
          setFormSuccess(null);
          dispatch(fetchTeacherClassResults({}));
        }, 1400);
      } else {
        setFormError((result.payload as string) || "Failed to submit result.");
      }
    } catch {
      setFormError("Network error while submitting result. Please try again.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-900/40 via-purple-900/30 to-indigo-900/40 p-6 shadow-2xl backdrop-blur-md">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-indigo-600/10 blur-2xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 shadow-lg">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Class Exam Results</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Manage and record student grades for{" "}
                {teacherClassLevel ? (
                  <span className="text-violet-400 font-semibold">{teacherClassLevel}</span>
                ) : (
                  "your assigned class level"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsEnterModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Enter Student Result</span>
            </button>
            <button
              onClick={handleRefresh}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/30 text-slate-300 text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Process Ribbon */}
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-slate-900/50 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-sm shrink-0 border border-violet-500/30">
            ⚖️
          </div>
          <div>
            <h4 className="text-sm font-bold text-violet-200">Two-Tier Publishing Workflow Pipeline</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Admin <strong className="text-amber-300">cannot view</strong> any result until you verify & publish it to Admin. Once approved by Admin, the student sees their grade.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 overflow-x-auto pb-1 lg:pb-0">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap flex items-center gap-1">
            <span>1.</span> Student Completes
          </span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-violet-500/25 text-violet-200 border border-violet-400/50 whitespace-nowrap flex items-center gap-1 ring-1 ring-violet-400/40">
            <span>2.</span> Teacher Publishes (You)
          </span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap flex items-center gap-1">
            <span>3.</span> Admin Publishes
          </span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 whitespace-nowrap flex items-center gap-1">
            <span>4.</span> Student Sees Result
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: "Total Results", value: stats.total, suffix: "", badge: null, color: "text-white" },
          { label: "Class Students", value: teacherTotalStudents, suffix: "", badge: null, color: "text-white" },
          { label: "Pending Teacher", value: stats.pendingTeacher, suffix: "", badge: "Action Needed", color: "text-amber-400" },
          { label: "Sent to Admin", value: stats.pendingAdmin, suffix: "", badge: "In Review", color: "text-indigo-400" },
          { label: "Live to Student", value: stats.published, suffix: "", badge: "Published", color: "text-emerald-400" },
          { label: "Class Pass Rate", value: stats.passRate, suffix: "%", badge: null, color: "text-teal-400" },
        ].map(({ label, value, suffix, badge, color }) => (
          <div
            key={label}
            className="bg-white/5 border border-white/10 hover:border-violet-500/30 p-4 rounded-2xl transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">{label}</p>
              {badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-semibold">
                  {badge}
                </span>
              )}
            </div>
            <p className={`text-2xl sm:text-3xl font-bold mt-2 ${color}`}>
              {value}
              <span className="text-lg font-normal text-slate-400">{suffix}</span>
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Filter Results</h2>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div>
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
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Passed">🟢 Passed</option>
              <option value="Failed">🔴 Failed</option>
            </select>
          </div>
          {/* Publication State */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Pipeline Stage</label>
            <select
              value={publishFilter}
              onChange={(e) => setPublishFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
            >
              <option value="all">All Stages ({teacherResults.length})</option>
              <option value="pending_teacher">⏳ Pending Teacher Publish ({teacherResults.filter(r => !r.isTeacherPublished).length})</option>
              <option value="pending_admin">📨 Sent to Admin / In Review ({teacherResults.filter(r => r.isTeacherPublished && !r.isPublished).length})</option>
              <option value="published">✅ Live on Student Portal ({teacherResults.filter(r => r.isPublished).length})</option>
            </select>
          </div>
          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>
        </div>

        {/* Quick Review Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
          <span className="text-xs text-slate-400 font-medium">Quick Filter:</span>
          <button
            type="button"
            onClick={() => setPublishFilter("all")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
              publishFilter === "all"
                ? "bg-violet-600 text-white border-violet-500 shadow-md"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            All ({teacherResults.length})
          </button>
          <button
            type="button"
            onClick={() => setPublishFilter("pending_teacher")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
              publishFilter === "pending_teacher"
                ? "bg-amber-600 text-white border-amber-500 shadow-md"
                : "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            ⏳ Needs Teacher Publish ({teacherResults.filter((r) => !r.isTeacherPublished).length})
          </button>
          <button
            type="button"
            onClick={() => setPublishFilter("pending_admin")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
              publishFilter === "pending_admin"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            📨 Forwarded to Admin ({teacherResults.filter((r) => r.isTeacherPublished && !r.isPublished).length})
          </button>
          <button
            type="button"
            onClick={() => setPublishFilter("published")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
              publishFilter === "published"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            ✅ Live on Student Portal ({teacherResults.filter((r) => r.isPublished).length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-300">No Results Found</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {teacherResults.length === 0
                ? "No exam results recorded for your class yet. Click 'Enter Student Result' to add marks."
                : "Try adjusting your search or filter criteria."}
            </p>
            {teacherResults.length > 0 && (
              <button
                onClick={handleReset}
                className="mt-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 transition-all cursor-pointer"
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
                    <th className="px-5 py-4">Publication State</th>
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
                      item.score >= 75 ? "text-emerald-400" : item.score >= 50 ? "text-amber-400" : "text-rose-400";

                    return (
                      <tr key={item._id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white group-hover:text-violet-400 transition-colors leading-tight">
                                {name}
                              </p>
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
                                  item.score >= 75
                                    ? "bg-emerald-500"
                                    : item.score >= 50
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(item.score, 100)}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Pass: {item.passMark}%</p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                              isPassed
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              item.remarks === "Excellent"
                                ? "text-emerald-400"
                                : item.remarks === "Good" || item.remarks === "Very Good"
                                ? "text-sky-400"
                                : item.remarks === "Fair"
                                ? "text-amber-400"
                                : "text-rose-400"
                            }`}
                          >
                            {item.remarks}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {!item.isTeacherPublished ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 w-fit bg-amber-500/15 text-amber-300 border-amber-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Pending Teacher Review
                            </span>
                          ) : !item.isPublished ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 w-fit bg-indigo-500/15 text-indigo-300 border-indigo-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              Sent to Admin (In Review)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 w-fit bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Published Live
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!item.isTeacherPublished ? (
                              <button
                                onClick={() => handleToggleTeacherPublish(item._id, false, item.isPublished)}
                                disabled={teacherPublishingId === item._id}
                                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-violet-600 hover:from-amber-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Publish to Admin: Admin will only be able to view after you publish"
                              >
                                {teacherPublishingId === item._id ? (
                                  "Publishing..."
                                ) : (
                                  <>
                                    <span>🚀</span>
                                    <span>Publish to Admin</span>
                                  </>
                                )}
                              </button>
                            ) : !item.isPublished ? (
                              <button
                                onClick={() => handleToggleTeacherPublish(item._id, true, item.isPublished)}
                                disabled={teacherPublishingId === item._id}
                                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Recall result from Admin review queue back to draft"
                              >
                                {teacherPublishingId === item._id ? "Recalling..." : "↩️ Recall"}
                              </button>
                            ) : (
                              <span
                                className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-1 cursor-default select-none shadow-sm"
                                title="Officially approved by Administration — this result cannot be recalled"
                              >
                                <span className="text-xs">🔒</span>
                                <span>Approved (Locked)</span>
                              </span>
                            )}
                            <button
                              onClick={() => setSelectedResult(item)}
                              className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 text-xs font-medium transition-all cursor-pointer shrink-0"
                            >
                              View Report
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 sm:p-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                Page <strong className="text-white">{currentPage}</strong> of{" "}
                <strong className="text-white">{totalPages}</strong> ({filtered.length} total filtered results)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL: Enter Student Result */}
      {isEnterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f1629] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Enter Student Exam Result</h2>
                  <p className="text-xs text-slate-400">Record assessment score (saved as unpublished draft)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEnterModalOpen(false);
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Workflow Notice */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <span className="text-base shrink-0">⏳</span>
              <div>
                <strong className="font-semibold text-amber-200">Step 2: Saved as Unpublished:</strong>
                <p className="mt-0.5 text-amber-300/90 text-[11px] leading-relaxed">
                  When you submit this record, it is saved in <strong>Unpublished Draft</strong> mode. An Administrator will review and approve the result before it is visible to the student.
                </p>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM16.707 7.707a1 1 0 00-1.414-1.414L9 12.586 5.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l7-7z"
                    clipRule="evenodd"
                  />
                </svg>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleEnterResultSubmit} className="space-y-4">
              {/* Select Student */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Select Student *
                </label>
                <select
                  required
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="">-- Choose student from class --</option>
                  {teacherClassStudents && teacherClassStudents.length > 0 ? (
                    teacherClassStudents.map((s: any) => (
                      <option key={s._id || s.StudentId} value={s.StudentId || s._id}>
                        {s.name} ({s.StudentId}) • {s.currentClassLevel || "Class"}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No students found in your assigned class
                    </option>
                  )}
                </select>
              </div>

              {/* Select Exam */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Select Exam / Assessment *
                </label>
                <select
                  required
                  value={formExamId}
                  onChange={(e) => setFormExamId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="">-- Choose exam --</option>
                  {examsList && examsList.length > 0 ? (
                    examsList.map((ex: any) => (
                      <option key={ex._id} value={ex._id}>
                        {ex.name} • {ex.subject?.name || "Subject"} (Total: {ex.totalMark || 100} pts, Pass: {ex.passMark || 50} pts)
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No active exams found
                    </option>
                  )}
                </select>
              </div>

              {/* Score Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Score (Points) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={activeExam?.totalMark || 100}
                    required
                    placeholder={`e.g. 78 (Max: ${activeExam?.totalMark || 100})`}
                    value={formScore}
                    onChange={(e) => setFormScore(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Custom Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder={computedModalMetrics?.suggestedRemarks || "e.g. Excellent"}
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Live Preview Calculation */}
              {computedModalMetrics && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Calculated Percentage:</span>
                    <strong className="text-white text-sm">{computedModalMetrics.grade}%</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Assessment Result:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        computedModalMetrics.status === "Passed"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {computedModalMetrics.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Suggested Remarks:</span>
                    <span className="text-amber-300 font-semibold">
                      {formRemarks || computedModalMetrics.suggestedRemarks}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className="text-slate-400">Publish State:</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Unpublished (Awaiting Admin Review)
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEnterModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enteringResult || !formStudentId || !formExamId || formScore === ""}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {enteringResult ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Saving Draft...
                    </>
                  ) : (
                    "Save Result (Unpublished)"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f1629] border border-violet-500/20 rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold">
                    Result Report
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
                      selectedResult.isPublished
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedResult.isPublished ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    {selectedResult.isPublished ? "Published (Live to Student)" : "Unpublished (Draft)"}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-2">
                  {selectedResult.exam?.name || "Exam Result"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(selectedResult.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
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
                {
                  label: "Score",
                  value: `${selectedResult.score}%`,
                  color:
                    selectedResult.score >= 75
                      ? "text-emerald-400"
                      : selectedResult.score >= 50
                      ? "text-amber-400"
                      : "text-rose-400",
                },
                { label: "Pass Mark", value: `${selectedResult.passMark}%`, color: "text-slate-300" },
                {
                  label: "Status",
                  value: selectedResult.status,
                  color: selectedResult.status === "Passed" ? "text-emerald-400" : "text-rose-400",
                },
                { label: "Remarks", value: selectedResult.remarks, color: "text-amber-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Two-Tier Publication Tracker & Teacher Action */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>⚖️</span> Publication Pipeline Status
                </span>
                <span className="text-[11px] text-slate-400">Two-Tier Verification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Tier 1: Teacher */}
                <div className={`p-3 rounded-xl border ${
                  selectedResult.isTeacherPublished
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>Tier 1: Teacher Status</span>
                    <span>{selectedResult.isTeacherPublished ? "✓ Verified" : "⏳ Pending"}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {selectedResult.isTeacherPublished
                      ? `Published to Admin on ${selectedResult.teacherPublishedAt ? new Date(selectedResult.teacherPublishedAt).toLocaleDateString() : "Record"}`
                      : "Draft only. Admin cannot see this result yet."}
                  </p>
                </div>

                {/* Tier 2: Admin */}
                <div className={`p-3 rounded-xl border ${
                  selectedResult.isPublished
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : selectedResult.isTeacherPublished
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                    : "bg-slate-800/40 border-slate-700 text-slate-500"
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>Tier 2: Admin Release</span>
                    <span>
                      {selectedResult.isPublished
                        ? "✓ Live"
                        : selectedResult.isTeacherPublished
                        ? "⏳ In Review"
                        : "🔒 Awaiting Teacher"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {selectedResult.isPublished
                      ? `Released to student on ${selectedResult.adminPublishedAt ? new Date(selectedResult.adminPublishedAt).toLocaleDateString() : "Record"}`
                      : selectedResult.isTeacherPublished
                      ? "Awaiting Admin to approve and release to student."
                      : "Admin queue locked until teacher submits."}
                  </p>
                </div>
              </div>

              {/* Action Toggle Inside Modal */}
              {selectedResult.isPublished ? (
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                    <span className="text-base">🔒</span>
                    <span>
                      This exam result has been officially approved and published by administration. It is permanently active on the student portal and cannot be recalled by the teacher.
                    </span>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm">
                    <span>✓</span>
                    <span>Admin Approved & Locked</span>
                  </span>
                </div>
              ) : (
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    {!selectedResult.isTeacherPublished
                      ? "Publishing this record forwards it to the Admin dashboard for final release."
                      : "You can recall this result back to draft before Administration approves it."}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleToggleTeacherPublish(selectedResult._id, !!selectedResult.isTeacherPublished, selectedResult.isPublished)}
                    disabled={teacherPublishingId === selectedResult._id}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shrink-0 cursor-pointer disabled:opacity-50 ${
                      !selectedResult.isTeacherPublished
                        ? "bg-gradient-to-r from-amber-600 to-violet-600 hover:from-amber-500 hover:to-violet-500 text-white shadow-violet-500/25"
                        : "bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {teacherPublishingId === selectedResult._id ? (
                      "Processing..."
                    ) : !selectedResult.isTeacherPublished ? (
                      <>
                        <span>🚀</span>
                        <span>Verify & Publish to Admin</span>
                      </>
                    ) : (
                      <>
                        <span>↩️</span>
                        <span>Recall / Unpublish from Admin</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
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
