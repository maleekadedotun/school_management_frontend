import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchAdminResults, togglePublishResult, type ExamResultItem } from "../../features/examResults/examResultsSlice";
import { fetchPrograms } from "../../features/programs/programsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";

export default function StudentResultsList() {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("student") || searchParams.get("search") || "";

  const { results, loading, error, publishingId } = useAppSelector((s) => s.examResults);
  const { items: programs } = useAppSelector((s) => s.programs);
  const { items: academicTerms } = useAppSelector((s) => s.academicTerms);
  const { items: academicYears } = useAppSelector((s) => s.academicYears);

  // Filters state
  const [search, setSearch] = useState(initialSearch);
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [publishFilter, setPublishFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  // Selected Result for Detail Modal
  const [selectedResult, setSelectedResult] = useState<ExamResultItem | null>(null);

  useEffect(() => {
    dispatch(fetchAdminResults());
    dispatch(fetchPrograms());
    dispatch(fetchAcademicTerms());
    dispatch(fetchAcademicYears());
  }, [dispatch]);

  useEffect(() => {
    const param = searchParams.get("student") || searchParams.get("search");
    if (param) setSearch(param);
  }, [searchParams]);

  const handleRefresh = () => {
    dispatch(
      fetchAdminResults({
        program: selectedProgram !== "all" ? selectedProgram : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        academicTerm: termFilter !== "all" ? termFilter : undefined,
        academicYear: yearFilter !== "all" ? yearFilter : undefined,
      })
    );
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedProgram("all");
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
    setPublishFilter("all");
    setTermFilter("all");
    setYearFilter("all");
    dispatch(fetchAdminResults());
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedProgram, startDate, endDate, statusFilter, publishFilter, termFilter, yearFilter]);

  // Filtered Results Calculation
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      // Search match
      const query = search.toLowerCase().trim();
      const studentName = item.student?.name?.toLowerCase() || "";
      const studentId = (item.student?.StudentId || item.studentID || "").toLowerCase();
      const examName = item.exam?.name?.toLowerCase() || "";
      const subjectName = item.exam?.subject?.name?.toLowerCase() || "";
      const programName = (item.program?.name || item.student?.program?.name || "").toLowerCase();

      const matchesSearch =
        !query ||
        studentName.includes(query) ||
        studentId.includes(query) ||
        examName.includes(query) ||
        subjectName.includes(query) ||
        programName.includes(query);

      // Program / Department match
      const progId = item.program?._id || item.student?.program?._id || "";
      const progName = item.program?.name || item.student?.program?.name || "";
      const matchesProgram =
        selectedProgram === "all" ||
        progId === selectedProgram ||
        progName.toLowerCase() === selectedProgram.toLowerCase();

      // Status match (Passed / Failed)
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      // Publish match
      const matchesPublish =
        publishFilter === "all" ||
        (publishFilter === "published" && item.isPublished) ||
        (publishFilter === "unpublished" && !item.isPublished);

      // Term match
      const matchesTerm =
        termFilter === "all" ||
        item.academicTerm?._id === termFilter ||
        item.exam?.academicTerm?._id === termFilter;

      // Year match
      const matchesYear =
        yearFilter === "all" ||
        item.academicYear?._id === yearFilter ||
        item.exam?.academicYear?._id === yearFilter;

      // Date match
      let matchesDate = true;
      if (startDate || endDate) {
        const itemDate = new Date(item.createdAt || item.updatedAt);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesProgram && matchesStatus && matchesPublish && matchesTerm && matchesYear && matchesDate;
    });
  }, [results, search, selectedProgram, statusFilter, publishFilter, termFilter, yearFilter, startDate, endDate]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE) || 1;
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResults.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResults, currentPage]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredResults.length;
    const passed = filteredResults.filter((r) => r.status === "Passed").length;
    const failed = filteredResults.filter((r) => r.status === "Failed").length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const avgScore =
      total > 0
        ? Math.round(filteredResults.reduce((acc, r) => acc + (r.score || 0), 0) / total)
        : 0;

    return { total, passed, failed, passRate, avgScore };
  }, [filteredResults]);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOperating, setBulkOperating] = useState(false);

  // Clear selections when filters or page change
  useEffect(() => {
    setSelectedIds([]);
  }, [search, selectedProgram, startDate, endDate, statusFilter, publishFilter, termFilter, yearFilter, currentPage]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedResults.map((r) => r._id);
      setSelectedIds(pageIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedIds.length === 0) return;
    setBulkOperating(true);
    try {
      await Promise.all(
        selectedIds.map((id) => dispatch(togglePublishResult({ id, publish })).unwrap())
      );
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk publish error:", err);
    } finally {
      setBulkOperating(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredResults.length === 0) return;
    const headers = [
      "Student Name",
      "Student ID",
      "Department / Program",
      "Exam Title",
      "Subject",
      "Score (%)",
      "Grade",
      "Status",
      "Remarks",
      "Visibility",
      "Date",
    ];

    const escapeCsv = (str: any) => {
      const val = str === null || str === undefined ? "" : String(str);
      return `"${val.replace(/"/g, '""')}"`;
    };

    const rows = filteredResults.map((item) => {
      const studentName = item.student?.name || `Student (${item.studentID})`;
      const studentId = item.student?.StudentId || item.studentID;
      const progName = item.program?.name || item.student?.program?.name || "General";
      const examTitle = item.exam?.name || "Exam";
      const subjectName = item.exam?.subject?.name || "N/A";
      const date = new Date(item.createdAt || item.updatedAt || Date.now()).toLocaleDateString("en-US");

      return [
        escapeCsv(studentName),
        escapeCsv(studentId),
        escapeCsv(progName),
        escapeCsv(examTitle),
        escapeCsv(subjectName),
        escapeCsv(item.score ?? 0),
        escapeCsv(item.grade ?? "-"),
        escapeCsv(item.status),
        escapeCsv(item.remarks || "-"),
        escapeCsv(item.isPublished ? "Published" : "Draft"),
        escapeCsv(date),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `student-exam-results-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const unpublishedTotal = useMemo(() => results.filter((r) => !r.isPublished).length, [results]);
  const publishedTotal = useMemo(() => results.filter((r) => r.isPublished).length, [results]);

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    await dispatch(togglePublishResult({ id, publish: !currentStatus }));
    if (selectedResult && selectedResult._id === id) {
      setSelectedResult((prev) => (prev ? { ...prev, isPublished: !currentStatus } : null));
    }
  };

  const isAllPageSelected =
    paginatedResults.length > 0 && paginatedResults.every((r) => selectedIds.includes(r._id));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/50 p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-md shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Student Exam Results</h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Admin review & publication dashboard for academic evaluation and student score visibility.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredResults.length === 0}
            className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV ({filteredResults.length})
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs sm:text-sm font-medium transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* 5-Step Evaluation & Publishing Pipeline Ribbon */}
      <div className="bg-gradient-to-r from-slate-900/90 via-indigo-950/70 to-slate-900/90 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/5 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-400 animate-ping" />
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
              Evaluation & Publication Workflow
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Admin review gate ensures verification before marks unlock on student accounts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
          {/* Step 1 */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-300">
            <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
            <div className="truncate">
              <p className="font-semibold text-white truncate">Student Completes Exam</p>
              <p className="text-[10px] text-slate-400 truncate">Scores recorded</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-200">
            <span className="w-6 h-6 rounded-lg bg-violet-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-sm">2</span>
            <div className="truncate">
              <p className="font-semibold text-violet-200 truncate">Teacher Publishes</p>
              <p className="text-[10px] text-violet-300 truncate">Required for Admin view</p>
            </div>
          </div>

          {/* Step 3 (Active) */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 ring-1 ring-indigo-400/40">
            <span className="w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-sm">3</span>
            <div className="truncate">
              <p className="font-bold text-white truncate">Admin Reviews Result</p>
              <p className="text-[10px] text-indigo-300 truncate">Active Portal</p>
            </div>
          </div>

          {/* Step 4 (Action) */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200">
            <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-sm">4</span>
            <div className="truncate">
              <p className="font-bold text-emerald-200 truncate">Admin Publishes</p>
              <p className="text-[10px] text-emerald-400 truncate">adminToggleExamResult</p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-300">
            <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0">5</span>
            <div className="truncate">
              <p className="font-semibold text-white truncate">Student Sees Result</p>
              <p className="text-[10px] text-slate-400 truncate">Live on dashboard</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white/5 border border-white/10 hover:border-indigo-500/30 p-4 sm:p-5 rounded-2xl transition-all shadow-lg">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Records</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-white">{stats.total}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">All</span>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 p-4 sm:p-5 rounded-2xl transition-all shadow-lg cursor-pointer" onClick={() => setPublishFilter("unpublished")}>
          <p className="text-amber-300 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Pending Review
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-300">{unpublishedTotal}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 font-semibold">
              Draft
            </span>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 p-4 sm:p-5 rounded-2xl transition-all shadow-lg cursor-pointer" onClick={() => setPublishFilter("published")}>
          <p className="text-emerald-300 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Published (Live)
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-300">{publishedTotal}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-semibold">
              Visible
            </span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 hover:border-emerald-500/30 p-4 sm:p-5 rounded-2xl transition-all shadow-lg">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Pass Rate</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400">{stats.passRate}%</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              {stats.passed} Passed
            </span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 hover:border-amber-500/30 p-4 sm:p-5 rounded-2xl transition-all shadow-lg">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Average Score</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-400">{stats.avgScore}%</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">Mean</span>
          </div>
        </div>
      </div>

      {/* Visual Performance Distribution */}
      {stats.total > 0 && (
        <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Performance & Pass Rate Distribution
            </span>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Passed: {stats.passed} ({stats.passRate}%)
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                Failed: {stats.failed} ({100 - stats.passRate}%)
              </span>
            </div>
          </div>
          {/* Ratio Bar */}
          <div className="w-full h-3.5 bg-rose-500/30 rounded-full overflow-hidden flex border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${stats.passRate}%` }}
              title={`Passed: ${stats.passRate}%`}
            />
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
              style={{ width: `${100 - stats.passRate}%` }}
              title={`Failed: ${100 - stats.passRate}%`}
            />
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Filter & Search Results</h2>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1"
          >
            Clear All Filters
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search Box */}
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
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Department / Program Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Department / Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="all">All Departments / Programs</option>
              {programs.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.code ? `(${p.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range - Start Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Date Range - End Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Performance Status */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Grade Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="Passed">🟢 Passed</option>
              <option value="Failed">🔴 Failed</option>
            </select>
          </div>

          {/* Publish State */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Publish Status</label>
            <select
              value={publishFilter}
              onChange={(e) => setPublishFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="all">All Records ({results.length})</option>
              <option value="unpublished">⏳ Pending Review ({unpublishedTotal})</option>
              <option value="published">✅ Published Live ({publishedTotal})</option>
            </select>
          </div>

          {/* Academic Term */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Academic Term</label>
            <select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="all">All Terms</option>
              {academicTerms.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Academic Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="all">All Academic Years</option>
              {academicYears.map((y) => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Publication Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
          <span className="text-xs text-slate-400 font-medium">Quick Review Filter:</span>
          <button
            type="button"
            onClick={() => setPublishFilter("all")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
              publishFilter === "all"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            All Records ({results.length})
          </button>
          <button
            type="button"
            onClick={() => setPublishFilter("unpublished")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
              publishFilter === "unpublished"
                ? "bg-amber-600 text-white border-amber-500 shadow-md"
                : "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            ⏳ Needs Admin Review ({unpublishedTotal})
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
            ✅ Published Live ({publishedTotal})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Results Table & Responsive Container */}
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Result Records</h3>
            <p className="text-xs text-slate-400">
              Showing {filteredResults.length} of {results.length} total exam entries
            </p>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-950/70 border-b border-indigo-500/30 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold text-white">
                {selectedIds.length} result{selectedIds.length > 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-indigo-300 hover:text-white underline underline-offset-2 ml-2 transition-colors"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => handleBulkPublish(true)}
                disabled={bulkOperating}
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {bulkOperating ? "Processing..." : "Publish Selected"}
              </button>
              <button
                onClick={() => handleBulkPublish(false)}
                disabled={bulkOperating}
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {bulkOperating ? "Processing..." : "Unpublish Selected"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <svg className="w-12 h-12 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base font-semibold text-slate-300">No Student Results Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your filter criteria or clearing search parameters to view student records.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-0 cursor-pointer"
                        title="Select all on this page"
                      />
                    </th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Department / Program</th>
                    <th className="px-6 py-4">Exam & Subject</th>
                    <th className="px-6 py-4">Score / Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-center">Visibility</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {paginatedResults.map((item) => {
                    const studentName = item.student?.name || "Student (" + item.studentID + ")";
                    const studentId = item.student?.StudentId || item.studentID;
                    const progName = item.program?.name || item.student?.program?.name || "General";
                    const progCode = item.program?.code || item.student?.program?.code || "";
                    const examTitle = item.exam?.name || "Exam";
                    const subjectName = item.exam?.subject?.name || "N/A";
                    const isPassed = item.status === "Passed";
                    const isSelected = selectedIds.includes(item._id);

                    return (
                      <tr key={item._id} className={`hover:bg-white/5 transition-colors group ${isSelected ? "bg-indigo-500/10" : ""}`}>
                        {/* Checkbox */}
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item._id)}
                            className="rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Student Name & ID */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                              {studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                                {studentName}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">{studentId}</p>
                            </div>
                          </div>
                        </td>

                        {/* Program / Department */}
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium inline-flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {progName} {progCode ? `(${progCode})` : ""}
                          </span>
                        </td>

                        {/* Exam & Subject */}
                        <td className="px-6 py-4">
                          <p className="font-medium text-white">{examTitle}</p>
                          <p className="text-xs text-slate-400">{subjectName}</p>
                        </td>

                        {/* Score & Status */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-white">{item.score}%</span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                isPassed
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              }`}
                            >
                              {item.status} ({item.remarks})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Grade: {item.grade}</p>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Publish Status Toggle */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleTogglePublish(item._id, item.isPublished)}
                            disabled={publishingId === item._id}
                            title={
                              item.isPublished
                                ? "Click to unpublish (hide result from student)"
                                : "Click to review and publish to student"
                            }
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 mx-auto ${
                              item.isPublished
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30"
                                : "bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40"
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${item.isPublished ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                            {publishingId === item._id
                              ? "Updating..."
                              : item.isPublished
                              ? "Published Live"
                              : "🚀 Approve & Publish"}
                          </button>
                          <span className="text-[10px] text-emerald-400/90 font-medium block mt-1">
                            ✓ Teacher Verified
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedResult(item)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-all"
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

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-white/5">
              {paginatedResults.map((item) => {
                const studentName = item.student?.name || "Student (" + item.studentID + ")";
                const studentId = item.student?.StudentId || item.studentID;
                const progName = item.program?.name || item.student?.program?.name || "General";
                const isPassed = item.status === "Passed";
                const isSelected = selectedIds.includes(item._id);

                return (
                  <div key={item._id} className={`p-4 space-y-3 ${isSelected ? "bg-indigo-500/10" : ""}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item._id)}
                          className="rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-0 cursor-pointer mr-1"
                        />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {studentName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{studentName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{studentId}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          isPassed ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {item.score}%
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {progName}
                      </span>
                      <span>{item.exam?.name || "Exam"}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <button
                        onClick={() => handleTogglePublish(item._id, item.isPublished)}
                        disabled={publishingId === item._id}
                        className={`px-2.5 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${
                          item.isPublished
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/40"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isPublished ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                        {publishingId === item._id ? "Updating..." : item.isPublished ? "Published" : "Publish"}
                      </button>
                      <button
                        onClick={() => setSelectedResult(item)}
                        className="px-3 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 font-medium"
                      >
                        View Report
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 sm:p-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5">
              <p className="text-xs text-slate-400">
                Showing{" "}
                <span className="font-semibold text-white">
                  {filteredResults.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-white">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredResults.length)}
                </span>{" "}
                of <span className="font-semibold text-white">{filteredResults.length}</span> entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  ← Back
                </button>

                <span className="text-xs text-slate-300 font-medium px-2">
                  Page <strong className="text-white">{currentPage}</strong> of{" "}
                  <strong className="text-white">{totalPages}</strong>
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  Exam Result Report
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  {selectedResult.exam?.name || "Exam Report"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Submission Date: {new Date(selectedResult.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Student & Program Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 border border-white/5 rounded-xl p-4">
              <div>
                <p className="text-xs text-slate-400">Student Name</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {selectedResult.student?.name || selectedResult.studentID}
                </p>
                <p className="text-xs text-indigo-400 font-mono mt-0.5">
                  ID: {selectedResult.student?.StudentId || selectedResult.studentID}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Department / Program</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {selectedResult.program?.name || selectedResult.student?.program?.name || "N/A"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Subject: {selectedResult.exam?.subject?.name || "N/A"}
                </p>
              </div>
            </div>

            {/* Score & Status Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400">Score</p>
                <p className="text-xl font-bold text-white mt-1">{selectedResult.score}%</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400">Pass Mark</p>
                <p className="text-xl font-bold text-slate-300 mt-1">{selectedResult.passMark}%</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400">Status</p>
                <p
                  className={`text-xl font-bold mt-1 ${
                    selectedResult.status === "Passed" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {selectedResult.status}
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400">Remarks</p>
                <p className="text-xl font-bold text-amber-400 mt-1">{selectedResult.remarks}</p>
              </div>
            </div>

            {/* Answered Questions Breakdown if available */}
            {selectedResult.answeredQuestions && selectedResult.answeredQuestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Answered Questions ({selectedResult.answeredQuestions.length})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                  {selectedResult.answeredQuestions.map((q: any, index: number) => (
                    <div key={index} className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs space-y-1">
                      <p className="text-slate-200 font-medium">{index + 1}. {q.question || q.name || "Question"}</p>
                      <div className="flex gap-4 text-slate-400">
                        <span>Selected: <strong className="text-indigo-300">{q.selectedOption || q.userAnswer || "N/A"}</strong></span>
                        <span>Correct: <strong className="text-emerald-400">{q.correctOption || q.correctAnswer || "N/A"}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher Verification Prerequisite Check */}
            <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </span>
                <div>
                  <p className="font-semibold text-white">Tier 1: Respective Teacher Verified</p>
                  <p className="text-[11px] text-slate-400">
                    {selectedResult.teacherPublishedAt
                      ? `Approved & forwarded to Administration on ${new Date(selectedResult.teacherPublishedAt).toLocaleDateString()}`
                      : "Verified and forwarded to administration by respective instructor."}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 w-fit">
                Teacher Verified
              </span>
            </div>

            {/* Administrative Review & Publication Controls */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${selectedResult.isPublished ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                <div>
                  <p className="text-xs font-bold text-white">
                    {selectedResult.isPublished ? "Status: Published (Visible to Student)" : "Status: Draft / Unpublished (Hidden from Student)"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selectedResult.isPublished
                      ? "This student can see their official grade and breakdown on their portal."
                      : "Only administrators and teachers can see this result until approved."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleTogglePublish(selectedResult._id, selectedResult.isPublished)}
                disabled={publishingId === selectedResult._id}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-md shrink-0 ${
                  selectedResult.isPublished
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border-emerald-400"
                }`}
              >
                {publishingId === selectedResult._id
                  ? "Updating..."
                  : selectedResult.isPublished
                  ? "🔒 Unpublish Result"
                  : "🚀 Approve & Publish Result"}
              </button>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-5 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
