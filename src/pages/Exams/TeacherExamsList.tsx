import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchTeacherExamsAdmin } from "../../features/exams/examsSlice";
import { fetchAllTeachers } from "../../features/teachers/teachersSlice";
import { fetchSubjects } from "../../features/subjects/subjectsSlice";

export default function TeacherExamsList() {
  const dispatch = useAppDispatch();
  const { teacherExams, loading, error } = useAppSelector((s) => s.exams);
  const { teachers } = useAppSelector((s) => s.teachers);
  const { items: subjects } = useAppSelector((s) => s.subjects);

  // Filters
  const [teacherIdSearch, setTeacherIdSearch] = useState("");
  const [teacherNameSearch, setTeacherNameSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [examStatusFilter, setExamStatusFilter] = useState("all");
  const [generalSearch, setGeneralSearch] = useState("");

  // Modal
  const [selectedExam, setSelectedExam] = useState<any | null>(null);

  useEffect(() => {
    dispatch(fetchTeacherExamsAdmin());
    dispatch(fetchAllTeachers());
    dispatch(fetchSubjects());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(
      fetchTeacherExamsAdmin({
        teacherId: selectedTeacherId !== "all" ? selectedTeacherId : teacherIdSearch || undefined,
        teacherName: teacherNameSearch || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        subject: selectedSubject !== "all" ? selectedSubject : undefined,
      })
    );
  };

  const handleResetFilters = () => {
    setTeacherIdSearch("");
    setTeacherNameSearch("");
    setSelectedTeacherId("all");
    setStartDate("");
    setEndDate("");
    setSelectedSubject("all");
    setExamStatusFilter("all");
    setGeneralSearch("");
    dispatch(fetchTeacherExamsAdmin());
  };

  // Filtered Exams Calculation
  const filteredExams = useMemo(() => {
    return teacherExams.filter((exam) => {
      const teacher = exam.createdBy || {};
      const teacherName = (teacher.name || "").toLowerCase();
      const teacherId = (teacher.teacherId || teacher._id || "").toLowerCase();
      const examName = (exam.name || "").toLowerCase();
      const subjectName = (exam.subject?.name || "").toLowerCase();

      // Search filters
      const matchesTeacherId =
        !teacherIdSearch.trim() ||
        teacherId.includes(teacherIdSearch.trim().toLowerCase());

      const matchesTeacherName =
        !teacherNameSearch.trim() ||
        teacherName.includes(teacherNameSearch.trim().toLowerCase());

      const matchesDropdownTeacher =
        selectedTeacherId === "all" ||
        teacher.teacherId === selectedTeacherId ||
        teacher._id === selectedTeacherId;

      const matchesGeneral =
        !generalSearch.trim() ||
        examName.includes(generalSearch.trim().toLowerCase()) ||
        subjectName.includes(generalSearch.trim().toLowerCase()) ||
        teacherName.includes(generalSearch.trim().toLowerCase()) ||
        teacherId.includes(generalSearch.trim().toLowerCase());

      const matchesSubject =
        selectedSubject === "all" ||
        exam.subject?._id === selectedSubject ||
        exam.subject?.name?.toLowerCase() === selectedSubject.toLowerCase();

      const matchesStatus =
        examStatusFilter === "all" || exam.examStatus === examStatusFilter;

      // Date Range Match
      let matchesDate = true;
      if (startDate || endDate) {
        const targetDate = new Date(exam.examDate || exam.createdAt);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (targetDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (targetDate > end) matchesDate = false;
        }
      }

      return (
        matchesTeacherId &&
        matchesTeacherName &&
        matchesDropdownTeacher &&
        matchesGeneral &&
        matchesSubject &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    teacherExams,
    teacherIdSearch,
    teacherNameSearch,
    selectedTeacherId,
    generalSearch,
    selectedSubject,
    examStatusFilter,
    startDate,
    endDate,
  ]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    teacherIdSearch,
    teacherNameSearch,
    selectedTeacherId,
    startDate,
    endDate,
    selectedSubject,
    examStatusFilter,
    generalSearch,
  ]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredExams.length / ITEMS_PER_PAGE) || 1;
  const paginatedExams = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExams.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredExams, currentPage]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredExams.length;
    const uniqueTeachers = new Set(
      filteredExams.map((e) => e.createdBy?.teacherId || e.createdBy?.name).filter(Boolean)
    ).size;
    const liveCount = filteredExams.filter((e) => e.examStatus === "live").length;
    const pendingCount = filteredExams.filter((e) => e.examStatus === "pending").length;

    return { total, uniqueTeachers, liveCount, pendingCount };
  }, [filteredExams]);

  const handleExportCSV = () => {
    if (filteredExams.length === 0) return;
    const headers = [
      "Exam Name",
      "Teacher Name",
      "Teacher ID",
      "Subject",
      "Program",
      "Academic Year",
      "Academic Term",
      "Pass Mark",
      "Total Mark",
      "Exam Status",
      "Exam Date",
    ];

    const escapeCsv = (str: any) => {
      const val = str === null || str === undefined ? "" : String(str);
      return `"${val.replace(/"/g, '""')}"`;
    };

    const rows = filteredExams.map((exam) => {
      const examName = exam.name || "Exam";
      const teacherName = exam.createdBy?.name || "Unknown";
      const teacherId = exam.createdBy?.teacherId || "-";
      const subjectName = exam.subject?.name || "N/A";
      const progName = exam.program?.name || "General";
      const yearName = exam.academicYear?.name || "-";
      const termName = exam.academicTerm?.name || "-";
      const date = exam.examDate
        ? new Date(exam.examDate).toLocaleDateString("en-US")
        : new Date(exam.createdAt).toLocaleDateString("en-US");

      return [
        escapeCsv(examName),
        escapeCsv(teacherName),
        escapeCsv(teacherId),
        escapeCsv(subjectName),
        escapeCsv(progName),
        escapeCsv(yearName),
        escapeCsv(termName),
        escapeCsv(exam.passMark ?? "-"),
        escapeCsv(exam.totalMark ?? "-"),
        escapeCsv(exam.examStatus || "pending"),
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
      `teacher-created-exams-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900/50 p-6 rounded-2xl border border-amber-500/20 backdrop-blur-md shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Teacher Created Exams</h1>
              <p className="text-dark-400 text-xs sm:text-sm mt-0.5">
                Inspect and track all exams authored by teachers, filterable by date, teacher ID, and name.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredExams.length === 0}
            className="px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV ({filteredExams.length})
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs sm:text-sm font-medium transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/5 border border-white/10 hover:border-amber-500/30 p-4 sm:p-5 rounded-2xl transition-all shadow-lg">
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">Total Exams</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-dark">{stats.total}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">Exams</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 hover:border-indigo-500/30 p-4 sm:p-5 rounded-2xl transition-all shadow-lg">
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">Active Authors</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-400">{stats.uniqueTeachers}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">Teachers</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 hover:border-emerald-500/30 p-4 sm:p-5 rounded-2xl transition-all shadow-lg">
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">Live Exams</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400">{stats.liveCount}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">🟢 Active</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 hover:border-orange-500/30 p-4 sm:p-5 rounded-2xl transition-all shadow-lg">
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">Pending Exams</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-400">{stats.pendingCount}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">🟡 Pending</span>
          </div>
        </div>
      </div>

      {/* Visual Status Breakdown */}
      {stats.total > 0 && (
        <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Exam Lifecycle Distribution
            </span>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Live: {stats.liveCount} ({stats.total > 0 ? Math.round((stats.liveCount / stats.total) * 100) : 0}%)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                Pending: {stats.pendingCount} ({stats.total > 0 ? Math.round((stats.pendingCount / stats.total) * 100) : 0}%)
              </span>
              {stats.total - stats.liveCount - stats.pendingCount > 0 && (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
                  Other: {stats.total - stats.liveCount - stats.pendingCount}
                </span>
              )}
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.liveCount / stats.total) * 100 : 0}%` }}
              title={`Live: ${stats.total > 0 ? Math.round((stats.liveCount / stats.total) * 100) : 0}%`}
            />
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.pendingCount / stats.total) * 100 : 0}%` }}
              title={`Pending: ${stats.total > 0 ? Math.round((stats.pendingCount / stats.total) * 100) : 0}%`}
            />
            <div
              className="h-full bg-slate-600 transition-all duration-500"
              style={{
                width: `${
                  stats.total > 0
                    ? ((stats.total - stats.liveCount - stats.pendingCount) / stats.total) * 100
                    : 0
                }%`,
              }}
              title="Other"
            />
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Teacher & Exam Filters</h2>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors flex items-center gap-1"
          >
            Clear All Filters
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {/* Teacher ID Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Filter by Teacher ID</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. TEA123..."
                value={teacherIdSearch}
                onChange={(e) => setTeacherIdSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Teacher Name Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Filter by Teacher Name</label>
            <input
              type="text"
              placeholder="e.g. Dr. John Doe..."
              value={teacherNameSearch}
              onChange={(e) => setTeacherNameSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Select Teacher Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Select Teacher</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-all"
            >
              <option value="all">All Teachers</option>
              {teachers.map((t: any) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.teacherId || "No ID"})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-all"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s: any) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range - From Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Exam Date (From)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Date Range - To Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Exam Date (To)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Exam Status</label>
            <select
              value={examStatusFilter}
              onChange={(e) => setExamStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="live">🟢 Live</option>
              <option value="pending">🟡 Pending</option>
            </select>
          </div>

          {/* General Search */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">General Search</label>
            <input
              type="text"
              placeholder="Exam title..."
              value={generalSearch}
              onChange={(e) => setGeneralSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Results Container */}
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Teacher Exam Records</h3>
            <p className="text-xs text-slate-400">
              Showing {filteredExams.length} of {teacherExams.length} total exams created
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <svg className="w-12 h-12 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-base font-semibold text-slate-300">No Teacher Exams Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No exams match your current teacher ID, teacher name, or date filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-medium hover:bg-amber-500 transition-all"
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
                    <th className="px-6 py-4">Authoring Teacher</th>
                    <th className="px-6 py-4">Exam Title</th>
                    <th className="px-6 py-4">Subject & Program</th>
                    <th className="px-6 py-4">Exam Date & Time</th>
                    <th className="px-6 py-4">Marks & Duration</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {paginatedExams.map((exam) => {
                    const teacher = exam.createdBy || {};
                    const teacherName = teacher.name || "Unknown Teacher";
                    const teacherId = teacher.teacherId || "N/A";
                    const isLive = exam.examStatus === "live";

                    return (
                      <tr key={exam._id} className="hover:bg-white/5 transition-colors group">
                        {/* Teacher Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                              {teacherName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                                {teacherName}
                              </p>
                              <p className="text-[11px] text-amber-400 font-mono">ID: {teacherId}</p>
                              {teacher.email && <p className="text-[11px] text-slate-400">{teacher.email}</p>}
                            </div>
                          </div>
                        </td>

                        {/* Exam Title */}
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">{exam.name}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">{exam.description || "No description"}</p>
                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300">
                            {exam.examType || "Quiz"}
                          </span>
                        </td>

                        {/* Subject & Program */}
                        <td className="px-6 py-4">
                          <p className="font-medium text-white">{exam.subject?.name || "N/A"}</p>
                          <p className="text-xs text-slate-400">{exam.program?.name || "N/A"}</p>
                          {exam.classLevel?.name && (
                            <p className="text-[11px] text-indigo-400 mt-0.5">{exam.classLevel.name}</p>
                          )}
                        </td>

                        {/* Date & Time */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-white font-medium">
                            {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : "TBD"}
                          </p>
                          <p className="text-xs text-slate-400">{exam.examTime || "10:00 AM"}</p>
                        </td>

                        {/* Marks & Duration */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-slate-200 text-xs">Pass Mark: <strong className="text-white">{exam.passMark || 50}%</strong></p>
                          <p className="text-slate-200 text-xs">Total Mark: <strong className="text-white">{exam.totalMark || 100}</strong></p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Duration: {exam.duration || "30 mins"}</p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              isLive
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            }`}
                          >
                            {isLive ? "🟢 Live" : "🟡 Pending"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedExam(exam)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 text-amber-300 text-xs font-medium transition-all"
                          >
                            Inspect Exam
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
              {paginatedExams.map((exam) => {
                const teacher = exam.createdBy || {};
                const teacherName = teacher.name || "Unknown Teacher";
                const teacherId = teacher.teacherId || "N/A";
                const isLive = exam.examStatus === "live";

                return (
                  <div key={exam._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {teacherName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{teacherName}</p>
                          <p className="text-[11px] text-amber-400 font-mono">ID: {teacherId}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          isLive ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {isLive ? "Live" : "Pending"}
                      </span>
                    </div>

                    <div>
                      <p className="font-bold text-white text-sm">{exam.name}</p>
                      <p className="text-xs text-slate-400">{exam.subject?.name} · {exam.program?.name}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <span className="text-slate-400">
                        Date: {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : "TBD"}
                      </span>
                      <button
                        onClick={() => setSelectedExam(exam)}
                        className="px-3 py-1 rounded-lg bg-amber-600/30 text-amber-300 font-medium"
                      >
                        Inspect Exam
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
                  {filteredExams.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-white">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredExams.length)}
                </span>{" "}
                of <span className="font-semibold text-white">{filteredExams.length}</span> entries
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

      {/* Exam Details Modal */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                  Exam Details & Author Info
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedExam.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedExam.description || "No description provided."}</p>
              </div>
              <button
                onClick={() => setSelectedExam(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Author Teacher Card */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {(selectedExam.createdBy?.name || "T").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Authored By Teacher</p>
                  <p className="text-base font-bold text-white">{selectedExam.createdBy?.name || "Teacher"}</p>
                  <p className="text-xs text-amber-400 font-mono">Teacher ID: {selectedExam.createdBy?.teacherId || "N/A"}</p>
                </div>
              </div>
              {selectedExam.createdBy?.email && (
                <span className="text-xs px-3 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10 hidden sm:inline-block">
                  {selectedExam.createdBy.email}
                </span>
              )}
            </div>

            {/* Exam Configuration Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <p className="text-slate-400">Subject</p>
                <p className="text-sm font-semibold text-white mt-0.5">{selectedExam.subject?.name || "N/A"}</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <p className="text-slate-400">Program</p>
                <p className="text-sm font-semibold text-white mt-0.5">{selectedExam.program?.name || "N/A"}</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <p className="text-slate-400">Class Level</p>
                <p className="text-sm font-semibold text-white mt-0.5">{selectedExam.classLevel?.name || "N/A"}</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <p className="text-slate-400">Pass Mark</p>
                <p className="text-sm font-semibold text-emerald-400 mt-0.5">{selectedExam.passMark || 50}%</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <p className="text-slate-400">Total Mark</p>
                <p className="text-sm font-semibold text-white mt-0.5">{selectedExam.totalMark || 100}</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <p className="text-slate-400">Duration</p>
                <p className="text-sm font-semibold text-amber-400 mt-0.5">{selectedExam.duration || "30 mins"}</p>
              </div>
            </div>

            {/* Questions count */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between text-xs">
              <span className="text-slate-300">Questions Attached</span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-sm">
                {selectedExam.questions?.length || 0} Questions
              </span>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedExam(null)}
                className="px-5 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all"
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
