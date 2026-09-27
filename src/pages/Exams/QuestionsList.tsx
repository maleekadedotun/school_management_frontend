import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchAdminQuestions, type QuestionItem } from "../../features/questions/questionsSlice";
import { fetchAllTeachers } from "../../features/teachers/teachersSlice";

export default function QuestionsList() {
  const dispatch = useAppDispatch();
  const { questions, loading, error } = useAppSelector((s) => s.questions);
  const { teachers } = useAppSelector((s) => s.teachers);

  // Filter States
  const [teacherIdSearch, setTeacherIdSearch] = useState("");
  const [teacherNameSearch, setTeacherNameSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");

  // Modal
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);

  useEffect(() => {
    dispatch(fetchAdminQuestions());
    dispatch(fetchAllTeachers());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(
      fetchAdminQuestions({
        teacherId: selectedTeacherId !== "all" ? selectedTeacherId : teacherIdSearch || undefined,
        teacherName: teacherNameSearch || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: questionSearch || undefined,
      })
    );
  };

  const handleResetFilters = () => {
    setTeacherIdSearch("");
    setTeacherNameSearch("");
    setSelectedTeacherId("all");
    setStartDate("");
    setEndDate("");
    setQuestionSearch("");
    dispatch(fetchAdminQuestions());
  };

  // Filtered Questions Calculation
  const filteredQuestions = useMemo(() => {
    return questions.filter((item) => {
      const teacher: any = item.createdBy || {};
      const teacherName = (teacher.name || "").toLowerCase();
      const teacherId = (teacher.teacherId || teacher._id || "").toLowerCase();
      const promptText = (item.question || "").toLowerCase();
      const examName = (item.exam?.name || "").toLowerCase();

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

      const matchesPrompt =
        !questionSearch.trim() ||
        promptText.includes(questionSearch.trim().toLowerCase()) ||
        examName.includes(questionSearch.trim().toLowerCase()) ||
        teacherName.includes(questionSearch.trim().toLowerCase()) ||
        teacherId.includes(questionSearch.trim().toLowerCase());

      // Date Range Match
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

      return matchesTeacherId && matchesTeacherName && matchesDropdownTeacher && matchesPrompt && matchesDate;
    });
  }, [questions, teacherIdSearch, teacherNameSearch, selectedTeacherId, questionSearch, startDate, endDate]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [teacherIdSearch, teacherNameSearch, selectedTeacherId, startDate, endDate, questionSearch]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredQuestions.length;
    const uniqueTeachers = new Set(
      filteredQuestions.map((q) => q.createdBy?.teacherId || q.createdBy?.name).filter(Boolean)
    ).size;
    const examSet = new Set(filteredQuestions.map((q) => q.exam?.name).filter(Boolean)).size;

    return { total, uniqueTeachers, examSet };
  }, [filteredQuestions]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-slate-900/50 p-6 rounded-2xl border border-violet-500/20 backdrop-blur-md shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Exam Question Bank</h1>
              <p className="text-dark-400 text-xs sm:text-sm mt-0.5">
                Admin view of all exam questions authored by teachers, filterable by date, teacher ID, and teacher name.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs sm:text-sm font-medium transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white/5 border border-white/10 hover:border-violet-500/30 p-4 sm:p-5 rounded-2xl transition-all shadow-lg">
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">Total Questions</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-dark">{stats.total}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">Questions</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 hover:border-indigo-500/30 p-4 sm:p-5 rounded-2xl transition-all shadow-lg">
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">Author Teachers</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-400">{stats.uniqueTeachers}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">Authors</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 hover:border-emerald-500/30 p-4 sm:p-5 rounded-2xl transition-all shadow-lg">
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">Associated Exams</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400">{stats.examSet}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">Exams</span>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Question Filters</h2>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors flex items-center gap-1"
          >
            Clear All Filters
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {/* Teacher ID Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Filter by Teacher ID</label>
            <input
              type="text"
              placeholder="e.g. TEA123..."
              value={teacherIdSearch}
              onChange={(e) => setTeacherIdSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all font-mono"
            />
          </div>

          {/* Teacher Name Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Filter by Teacher Name</label>
            <input
              type="text"
              placeholder="e.g. Dr. John Doe..."
              value={teacherNameSearch}
              onChange={(e) => setTeacherNameSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>

          {/* Select Teacher Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Select Teacher</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
            >
              <option value="all">All Teachers</option>
              {teachers.map((t: any) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.teacherId || "No ID"})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range - From Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Created Date (From)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>

          {/* Date Range - To Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Created Date (To)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>

          {/* Question Text Search */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Question / Exam Text Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search question content or exam title..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Questions Container */}
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Question Records</h3>
            <p className="text-xs text-slate-400">
              Showing {filteredQuestions.length} of {questions.length} total questions
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <svg className="w-12 h-12 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base font-semibold text-slate-300">No Exam Questions Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No questions match your current teacher ID, teacher name, or date filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 sm:p-6 space-y-4">
              {paginatedQuestions.map((q, idx) => {
                const teacher: any = q.createdBy || {};
                const teacherName = teacher.name || "Unknown Teacher";
                const teacherId = teacher.teacherId || "N/A";
                const itemIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;

                const options = [
                  { key: "A", text: q.optionA },
                  { key: "B", text: q.optionB },
                  { key: "C", text: q.optionC },
                  { key: "D", text: q.optionD },
                ];

                return (
                  <div
                    key={q._id || idx}
                    className="bg-white/5 border border-white/10 hover:border-violet-500/30 p-4 sm:p-5 rounded-2xl transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {teacherName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-white text-sm">{teacherName}</span>
                          <span className="ml-2 text-xs text-violet-400 font-mono">ID: {teacherId}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {q.exam?.name && (
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {q.exam.name}
                          </span>
                        )}
                        <span>
                          Created: {new Date(q.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div>
                      <h4 className="text-white text-sm sm:text-base font-semibold leading-relaxed">
                        {itemIndex}. {q.question}
                      </h4>
                    </div>

                    {/* Options List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {options.map((opt) => {
                        const isCorrect =
                          q.correctAnswer === opt.key ||
                          q.correctAnswer?.toLowerCase() === opt.text?.toLowerCase();

                        return (
                          <div
                            key={opt.key}
                            className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between border ${
                              isCorrect
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold"
                                : "bg-white/5 text-slate-300 border-white/5"
                            }`}
                          >
                            <span>
                              <strong className="mr-1.5 opacity-80">{opt.key}.</strong> {opt.text}
                            </span>
                            {isCorrect && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/30 text-emerald-200">
                                ✓ Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-end pt-2 border-t border-white/5">
                      <button
                        onClick={() => setSelectedQuestion(q)}
                        className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 text-xs font-medium transition-all"
                      >
                        Inspect Question Details
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
                  {filteredQuestions.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-white">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredQuestions.length)}
                </span>{" "}
                of <span className="font-semibold text-white">{filteredQuestions.length}</span> entries
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

      {/* Question Details Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold">
                  Exam Question Inspector
                </span>
                <h2 className="text-lg font-bold text-white mt-1">Question Details</h2>
              </div>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Author Teacher Card */}
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {(selectedQuestion.createdBy?.name || "T").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-violet-300 font-semibold uppercase tracking-wider">Author Teacher</p>
                  <p className="text-base font-bold text-white">{selectedQuestion.createdBy?.name || "Teacher"}</p>
                  <p className="text-xs text-violet-400 font-mono">ID: {selectedQuestion.createdBy?.teacherId || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Question Text */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-2">
              <p className="text-xs text-slate-400 uppercase font-medium">Question Prompt</p>
              <p className="text-white text-base font-medium leading-relaxed">{selectedQuestion.question}</p>
            </div>

            {/* Options Breakdown */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 uppercase font-medium">Options & Correct Choice</p>
              {[
                { key: "Option A", val: selectedQuestion.optionA, rawKey: "A" },
                { key: "Option B", val: selectedQuestion.optionB, rawKey: "B" },
                { key: "Option C", val: selectedQuestion.optionC, rawKey: "C" },
                { key: "Option D", val: selectedQuestion.optionD, rawKey: "D" },
              ].map((opt) => {
                const isCorrect =
                  selectedQuestion.correctAnswer === opt.rawKey ||
                  selectedQuestion.correctAnswer?.toLowerCase() === opt.val?.toLowerCase();

                return (
                  <div
                    key={opt.key}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      isCorrect
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                        : "bg-white/5 text-slate-300 border-white/5"
                    }`}
                  >
                    <span>{opt.key}: {opt.val}</span>
                    {isCorrect && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200">
                        ✓ Correct Answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedQuestion(null)}
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
