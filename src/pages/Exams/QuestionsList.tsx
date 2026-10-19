import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchAdminQuestions, type QuestionItem } from "../../features/questions/questionsSlice";
import { fetchAllTeachers } from "../../features/teachers/teachersSlice";
import { fetchExams } from "../../features/exams/examsSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";

const getObjName = (obj: any): string => {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj.name || obj.title || "";
};

export default function QuestionsList() {
  const dispatch = useAppDispatch();
  const { questions, loading, error } = useAppSelector((s) => s.questions);
  const { teachers } = useAppSelector((s) => s.teachers);
  const { items: exams } = useAppSelector((s) => s.exams);
  const { items: academicYears } = useAppSelector((s) => s.academicYears);
  const { items: academicTerms } = useAppSelector((s) => s.academicTerms);

  // Table Expanded State (click row to display questions under each examination)
  const [expandedExamIds, setExpandedExamIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"assessments" | "flat">("assessments");

  // Filter States
  const [teacherIdSearch, setTeacherIdSearch] = useState("");
  const [teacherNameSearch, setTeacherNameSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [selectedYearFilter, setSelectedYearFilter] = useState("all");
  const [selectedTermFilter, setSelectedTermFilter] = useState("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all"); // 'all' | 'Exam' | 'Test'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");

  // Pagination for table
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);

  useEffect(() => {
    dispatch(fetchAdminQuestions());
    dispatch(fetchAllTeachers());
    dispatch(fetchExams());
    dispatch(fetchAcademicYears());
    dispatch(fetchAcademicTerms());
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
    dispatch(fetchExams());
  };

  const handleResetFilters = () => {
    setTeacherIdSearch("");
    setTeacherNameSearch("");
    setSelectedTeacherId("all");
    setSelectedYearFilter("all");
    setSelectedTermFilter("all");
    setSelectedTypeFilter("all");
    setStartDate("");
    setEndDate("");
    setQuestionSearch("");
    dispatch(fetchAdminQuestions());
  };

  // Available Academic Years & Terms
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    academicYears.forEach((y: any) => {
      const n = getObjName(y);
      if (n) set.add(n);
    });
    questions.forEach((q) => {
      if (q.academicYear) set.add(q.academicYear);
    });
    exams.forEach((e: any) => {
      const n = getObjName(e.academicYear);
      if (n) set.add(n);
    });
    if (!set.has("2026/2027")) set.add("2026/2027");
    return Array.from(set);
  }, [academicYears, questions, exams]);

  const availableTerms = useMemo(() => {
    const set = new Set<string>();
    academicTerms.forEach((t: any) => {
      const n = getObjName(t);
      if (n) set.add(n);
    });
    questions.forEach((q) => {
      if (q.academicTerm) set.add(q.academicTerm);
    });
    exams.forEach((e: any) => {
      const n = getObjName(e.academicTerm);
      if (n) set.add(n);
    });
    if (set.size === 0) {
      set.add("First Term");
      set.add("Second Term");
      set.add("Third Term");
    }
    return Array.from(set);
  }, [academicTerms, questions, exams]);

  // Aggregate questions into assessments (Exam or Test for Academic Year, Term, Name)
  const assessments = useMemo(() => {
    const map: Record<string, any> = {};

    // 1. Seed from exams
    exams.forEach((exam: any) => {
      const yearName = getObjName(exam.academicYear);
      const termName = getObjName(exam.academicTerm);
      const subName = getObjName(exam.subject);
      const className = getObjName(exam.classLevel);
      const rawType = (exam.examType || "Exam").trim();
      const isTest = ["test", "quiz", "continuous assessment", "ca"].includes(rawType.toLowerCase());

      map[exam._id] = {
        id: exam._id,
        name: exam.name,
        description: exam.description || "",
        examType: isTest ? "Test" : (rawType || "Exam"),
        academicYear: yearName || "2026/2027",
        academicTerm: termName || "First Term",
        subject: subName,
        classLevel: className,
        passMark: exam.passMark ?? (isTest ? 15 : 40),
        totalMark: exam.totalMark ?? (isTest ? 30 : 70),
        duration: exam.duration || "30 mins",
        createdBy: exam.createdBy,
        questions: [] as QuestionItem[],
      };
    });

    // 2. Map questions
    questions.forEach((q) => {
      const associatedExam = q.exam;
      const examId = associatedExam?._id;

      if (examId && map[examId]) {
        if (!map[examId].questions.some((existingQ: any) => existingQ._id === q._id)) {
          map[examId].questions.push(q);
        }
      } else if (examId) {
        const yearName = q.academicYear || associatedExam?.academicYear || "2026/2027";
        const termName = q.academicTerm || associatedExam?.academicTerm || "First Term";
        const rawType = (q.examType || associatedExam?.examType || "Exam").trim();
        const isTest = ["test", "quiz", "continuous assessment", "ca"].includes(rawType.toLowerCase());

        map[examId] = {
          id: examId,
          name: associatedExam?.name || "Exam / Assessment",
          description: associatedExam?.description || "",
          examType: isTest ? "Test" : (rawType || "Exam"),
          academicYear: yearName,
          academicTerm: termName,
          subject: associatedExam?.subject || "",
          classLevel: associatedExam?.classLevel || "",
          passMark: associatedExam?.passMark ?? 40,
          totalMark: associatedExam?.totalMark ?? 70,
          duration: associatedExam?.duration || "30 mins",
          createdBy: q.createdBy,
          questions: [q],
        };
      } else {
        const fallbackId = "general-unlinked";
        if (!map[fallbackId]) {
          map[fallbackId] = {
            id: fallbackId,
            name: "General Question Bank",
            description: "Questions not linked to a specific exam",
            examType: "Question Bank",
            academicYear: q.academicYear || "2026/2027",
            academicTerm: q.academicTerm || "First Term",
            subject: "General",
            classLevel: "General",
            passMark: 0,
            totalMark: 0,
            duration: "N/A",
            questions: [],
          };
        }
        if (!map[fallbackId].questions.some((existingQ: any) => existingQ._id === q._id)) {
          map[fallbackId].questions.push(q);
        }
      }
    });

    return Object.values(map);
  }, [exams, questions]);

  // Filtered Assessments Calculation
  const filteredAssessments = useMemo(() => {
    return assessments.filter((item) => {
      const matchesYear =
        selectedYearFilter === "all" ||
        item.academicYear?.toLowerCase() === selectedYearFilter.toLowerCase();

      const matchesTerm =
        selectedTermFilter === "all" ||
        item.academicTerm?.toLowerCase() === selectedTermFilter.toLowerCase();

      const matchesType =
        selectedTypeFilter === "all" ||
        (selectedTypeFilter === "Exam" && item.examType === "Exam") ||
        (selectedTypeFilter === "Test" && item.examType === "Test");

      const query = questionSearch.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.subject && item.subject.toLowerCase().includes(query)) ||
        (item.classLevel && item.classLevel.toLowerCase().includes(query)) ||
        item.questions.some((q: QuestionItem) =>
          q.question?.toLowerCase().includes(query)
        );

      const matchesTeacher =
        selectedTeacherId === "all" ||
        item.questions.some((q: QuestionItem) => {
          const t: any = q.createdBy || {};
          return t._id === selectedTeacherId || t.teacherId === selectedTeacherId;
        });

      return matchesYear && matchesTerm && matchesType && matchesSearch && matchesTeacher;
    });
  }, [assessments, selectedYearFilter, selectedTermFilter, selectedTypeFilter, questionSearch, selectedTeacherId]);

  // Toggle row expansion (click row to display questions under each examination)
  const toggleRowExpansion = (id: string) => {
    setExpandedExamIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExpandAll = () => {
    if (expandedExamIds.length === paginatedAssessments.length) {
      setExpandedExamIds([]);
    } else {
      setExpandedExamIds(paginatedAssessments.map((a) => a.id));
    }
  };

  // Pagination for table
  const totalPages = Math.max(1, Math.ceil(filteredAssessments.length / ITEMS_PER_PAGE));
  const paginatedAssessments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssessments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssessments, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [teacherIdSearch, teacherNameSearch, selectedTeacherId, selectedYearFilter, selectedTermFilter, selectedTypeFilter, startDate, endDate, questionSearch]);

  // Filtered Questions for flat list view
  const filteredQuestions = useMemo(() => {
    return questions.filter((item) => {
      const teacher: any = item.createdBy || {};
      const teacherName = (teacher.name || "").toLowerCase();
      const teacherId = (teacher.teacherId || teacher._id || "").toLowerCase();
      const promptText = (item.question || "").toLowerCase();
      const examName = (item.exam?.name || "").toLowerCase();

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

      const matchesYear =
        selectedYearFilter === "all" ||
        (item.academicYear && item.academicYear.toLowerCase() === selectedYearFilter.toLowerCase());

      const matchesTerm =
        selectedTermFilter === "all" ||
        (item.academicTerm && item.academicTerm.toLowerCase() === selectedTermFilter.toLowerCase());

      const matchesType =
        selectedTypeFilter === "all" ||
        (selectedTypeFilter === "Exam" && item.examType === "Exam") ||
        (selectedTypeFilter === "Test" && item.examType === "Test");

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

      return matchesTeacherId && matchesTeacherName && matchesDropdownTeacher && matchesPrompt && matchesYear && matchesTerm && matchesType && matchesDate;
    });
  }, [questions, teacherIdSearch, teacherNameSearch, selectedTeacherId, questionSearch, selectedYearFilter, selectedTermFilter, selectedTypeFilter, startDate, endDate]);

  const flatTotalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE) || 1;
  const paginatedFlatQuestions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  const stats = useMemo(() => {
    const total = filteredQuestions.length;
    const uniqueTeachers = new Set(
      filteredQuestions.map((q) => q.createdBy?.teacherId || q.createdBy?.name).filter(Boolean)
    ).size;
    const examSet = new Set(filteredQuestions.map((q) => q.exam?.name).filter(Boolean)).size;

    return { total, uniqueTeachers, examSet };
  }, [filteredQuestions]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-16">
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
              <h1 className="text-2xl font-extrabold text-dark tracking-tight">Exam & Test Question Bank Table</h1>
              <p className="text-dark-400 text-xs sm:text-sm mt-0.5">
                Saved according to examination name and academic year. Click on any row to display questions under each examination.
              </p>
            </div>
          </div>
        </div>

        {/* View mode toggle & Refresh */}
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-xl bg-black/40 border border-white/10 flex items-center">
            <button
              onClick={() => setViewMode("assessments")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === "assessments"
                  ? "bg-violet-600 text-white shadow-md font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>📊</span>
              <span>Examination Table</span>
            </button>

            <button
              onClick={() => setViewMode("flat")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === "flat"
                  ? "bg-violet-600 text-white shadow-md font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>📋</span>
              <span>All Questions</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs sm:text-sm font-medium transition-all flex items-center gap-2"
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
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">Total Examinations</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-dark">{assessments.length}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">Exams & Tests</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 hover:border-indigo-500/30 p-4 sm:p-5 rounded-2xl transition-all shadow-lg">
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">Total Questions</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-400">{stats.total}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">In Bank</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 hover:border-emerald-500/30 p-4 sm:p-5 rounded-2xl transition-all shadow-lg">
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">Author Teachers</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400">{stats.uniqueTeachers}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">Educators</span>
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
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Filters</h2>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "assessments" && (
              <button
                type="button"
                onClick={handleExpandAll}
                className="text-xs font-medium text-slate-300 hover:text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 transition-colors"
              >
                {expandedExamIds.length === paginatedAssessments.length ? "Collapse All" : "Expand All"}
              </button>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Academic Year</label>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all [&>option]:text-slate-900 [&>option]:bg-white"
            >
              <option value="all" className="text-slate-900 bg-white">All Academic Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="text-slate-900 bg-white">
                  {yr} {yr === "2026/2027" ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Academic Term</label>
            <select
              value={selectedTermFilter}
              onChange={(e) => setSelectedTermFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all [&>option]:text-slate-900 [&>option]:bg-white"
            >
              <option value="all" className="text-slate-900 bg-white">All Terms</option>
              {availableTerms.map((tm) => (
                <option key={tm} value={tm} className="text-slate-900 bg-white">
                  {tm}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Assessment Type</label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all [&>option]:text-slate-900 [&>option]:bg-white"
            >
              <option value="all" className="text-slate-900 bg-white">All Types (Exam & Test)</option>
              <option value="Exam" className="text-slate-900 bg-white">Exams</option>
              <option value="Test" className="text-slate-900 bg-white">Tests & Quizzes</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Teacher Author</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all [&>option]:text-slate-900 [&>option]:bg-white"
            >
              <option value="all" className="text-slate-900 bg-white">All Teachers</option>
              {teachers.map((t: any) => (
                <option key={t._id} value={t._id} className="text-slate-900 bg-white">
                  {t.name} ({t.teacherId || "No ID"})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-xs font-medium text-slate-400 mb-1">Search Examination Name / Subject / Question</label>
            <input
              type="text"
              placeholder="e.g. 2026/2027 Mathematics Exam, Physics Test, or question prompt..."
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Main Table: Examinations Table with Expandable Questions */}
      {loading && questions.length === 0 ? (
        <div className="p-16 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 text-sm font-medium">Fetching examination & question records...</p>
        </div>
      ) : viewMode === "assessments" ? (
        <div className="bg-[#0f1629] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div>
              <h3 className="text-base font-bold text-dark flex items-center gap-2">
                <span>📊</span>
                <span>Examinations & Tests Table</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
                  {filteredAssessments.length} Records
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any row or click <strong className="text-violet-400">"View Questions"</strong> to display the questions under each examination
              </p>
            </div>
          </div>

          {filteredAssessments.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <p className="text-base font-semibold text-slate-300">No Examinations Found</p>
              <p className="text-xs text-slate-500">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-10 text-center">#</th>
                    <th className="py-3.5 px-4">Examination Name</th>
                    <th className="py-3.5 px-3">Type</th>
                    <th className="py-3.5 px-3">Academic Year</th>
                    <th className="py-3.5 px-3">Term</th>
                    <th className="py-3.5 px-4">Subject & Class</th>
                    <th className="py-3.5 px-3 text-center">Questions</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedAssessments.map((assessment, idx) => {
                    const isExpanded = expandedExamIds.includes(assessment.id);
                    const isTest = assessment.examType === "Test";
                    const qCount = assessment.questions.length;

                    return (
                      <React.Fragment key={assessment.id || idx}>
                        <tr
                          onClick={() => toggleRowExpansion(assessment.id)}
                          className={`group cursor-pointer transition-colors ${
                            isExpanded
                              ? "bg-violet-500/[0.08] border-l-4 border-l-violet-500"
                              : "hover:bg-white/[0.03]"
                          }`}
                        >
                          <td className="py-4 px-4 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpansion(assessment.id);
                              }}
                              className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-violet-500/20 text-slate-400 group-hover:text-violet-300 font-bold flex items-center justify-center transition-all"
                            >
                              <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
                            </button>
                          </td>

                          <td className="py-4 px-4">
                            <div className="font-bold text-white group-hover:text-violet-300 transition-colors text-sm sm:text-base">
                              {assessment.name}
                            </div>
                            {assessment.description && (
                              <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{assessment.description}</p>
                            )}
                          </td>

                          <td className="py-4 px-3 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                                isTest
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                              }`}
                            >
                              {isTest ? "⚡ Test" : "📋 Exam"}
                            </span>
                          </td>

                          <td className="py-4 px-3 whitespace-nowrap">
                            <span className="font-semibold text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono">
                              📅 {assessment.academicYear}
                            </span>
                          </td>

                          <td className="py-4 px-3 whitespace-nowrap">
                            <span className="font-medium text-teal-300 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs">
                              🏷️ {assessment.academicTerm}
                            </span>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-200">{assessment.subject || "General"}</div>
                            <div className="text-[11px] text-slate-400">{assessment.classLevel || "All Levels"}</div>
                          </td>

                          <td className="py-4 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                qCount > 0
                                  ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                                  : "bg-white/5 text-slate-400 border-white/10"
                              }`}
                            >
                              <span>{qCount}</span>
                              <span className="font-normal opacity-80">Qs</span>
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => toggleRowExpansion(assessment.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ml-auto ${
                                isExpanded
                                  ? "bg-violet-600 text-white border-violet-500 shadow-md"
                                  : "bg-white/5 hover:bg-white/10 text-violet-300 border-white/10"
                              }`}
                            >
                              <span>{isExpanded ? "Hide Questions" : "View Questions"}</span>
                              <span>{isExpanded ? "▲" : "▼"}</span>
                            </button>
                          </td>
                        </tr>

                        {/* Expandable row: Display questions under this examination */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0 border-b border-violet-500/20 bg-[#080d1a]/90">
                              <div className="p-5 sm:p-6 space-y-4 m-2 rounded-2xl border border-violet-500/30 bg-[#0b1328]/95 shadow-inner">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                                  <div>
                                    <h4 className="text-base font-bold text-white">
                                      Questions for: <span className="text-violet-300">{assessment.name}</span>
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                      Academic Year: {assessment.academicYear} • Term: {assessment.academicTerm} • Subject: {assessment.subject || "General"}
                                    </p>
                                  </div>
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 text-slate-300">
                                    {assessment.questions.length} Questions
                                  </span>
                                </div>

                                {assessment.questions.length === 0 ? (
                                  <div className="p-8 text-center text-slate-400 bg-white/5 rounded-xl border border-white/10">
                                    No questions currently linked to this examination.
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {assessment.questions.map((q: QuestionItem, qIdx: number) => {
                                      const options = [
                                        { key: "A", text: q.optionA },
                                        { key: "B", text: q.optionB },
                                        { key: "C", text: q.optionC },
                                        { key: "D", text: q.optionD },
                                      ];

                                      return (
                                        <div
                                          key={q._id || qIdx}
                                          className="bg-[#0f172a] border border-white/10 hover:border-violet-500/30 p-4 rounded-xl transition-all space-y-2.5"
                                        >
                                          <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs text-slate-400">
                                            <span className="font-bold text-violet-400">Question #{qIdx + 1}</span>
                                            {q.createdBy?.name && (
                                              <span>Author: {q.createdBy.name}</span>
                                            )}
                                          </div>

                                          <h5 className="text-white text-sm font-semibold">{q.question}</h5>

                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                            {options.map((opt) => {
                                              const isCorrect =
                                                q.correctAnswer === opt.key ||
                                                q.correctAnswer?.toLowerCase() === opt.text?.toLowerCase() ||
                                                q.correctAnswer?.toLowerCase() === `option${opt.key}`.toLowerCase();

                                              return (
                                                <div
                                                  key={opt.key}
                                                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center justify-between border ${
                                                    isCorrect
                                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                                                      : "bg-white/5 text-slate-300 border-white/5"
                                                  }`}
                                                >
                                                  <span>
                                                    <strong className="mr-1.5 opacity-80">{opt.key}.</strong> {opt.text}
                                                  </span>
                                                  {isCorrect && (
                                                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/30 text-emerald-200 font-bold">
                                                      ✓ Correct
                                                    </span>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>

                                          <div className="flex items-center justify-end pt-1">
                                            <button
                                              onClick={() => setSelectedQuestion(q)}
                                              className="px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 text-xs font-medium transition-all"
                                            >
                                              Inspect
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredAssessments.length > ITEMS_PER_PAGE && (
            <div className="p-4 sm:p-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02]">
              <p className="text-xs text-slate-400">
                Showing{" "}
                <strong className="text-white font-semibold">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </strong>{" "}
                to{" "}
                <strong className="text-white font-semibold">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredAssessments.length)}
                </strong>{" "}
                of <strong className="text-white font-semibold">{filteredAssessments.length}</strong> examinations
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold disabled:opacity-40"
                >
                  ← Back
                </button>

                <span className="text-xs text-slate-300 font-medium px-2">
                  Page <strong className="text-white">{currentPage}</strong> of{" "}
                  <strong className="text-white">{totalPages}</strong>
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Flat Questions View */
        <div className="bg-[#0f1629] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">All Questions List</h3>
              <p className="text-xs text-slate-400">
                Showing {filteredQuestions.length} of {questions.length} total questions
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {paginatedFlatQuestions.map((q, idx) => {
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
                      {q.academicYear && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {q.academicYear}
                        </span>
                      )}
                      {q.academicTerm && (
                        <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                          {q.academicTerm}
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-white text-sm sm:text-base font-semibold leading-relaxed">
                    {itemIndex}. {q.question}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {options.map((opt) => {
                      const isCorrect =
                        q.correctAnswer === opt.key ||
                        q.correctAnswer?.toLowerCase() === opt.text?.toLowerCase() ||
                        q.correctAnswer?.toLowerCase() === `option${opt.key}`.toLowerCase();

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

          <div className="p-4 sm:p-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5">
            <p className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-white">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
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
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white disabled:opacity-30"
              >
                ← Back
              </button>

              <span className="text-xs text-slate-300 font-medium px-2">
                Page <strong className="text-white">{currentPage}</strong> of{" "}
                <strong className="text-white">{flatTotalPages}</strong>
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, flatTotalPages))}
                disabled={currentPage === flatTotalPages || flatTotalPages === 0}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Details Inspector Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400">❓</span>
                Question Inspector
              </h3>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <span className="text-slate-400 block text-xs">Author Teacher</span>
                  <span className="text-white font-semibold">{selectedQuestion.createdBy?.name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Teacher ID</span>
                  <span className="text-violet-400 font-mono">{selectedQuestion.createdBy?.teacherId || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Associated Examination</span>
                  <span className="text-indigo-300 font-medium">{selectedQuestion.exam?.name || "General Question"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Academic Year / Term</span>
                  <span className="text-white">
                    {selectedQuestion.academicYear || selectedQuestion.exam?.academicYear || "2026/2027"} •{" "}
                    {selectedQuestion.academicTerm || selectedQuestion.exam?.academicTerm || "First Term"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Question Statement
                </span>
                <p className="text-white font-medium p-3.5 rounded-xl bg-white/5 border border-white/10 leading-relaxed">
                  {selectedQuestion.question}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Answer Options & Designations
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { k: "A", val: selectedQuestion.optionA },
                    { k: "B", val: selectedQuestion.optionB },
                    { k: "C", val: selectedQuestion.optionC },
                    { k: "D", val: selectedQuestion.optionD },
                  ].map((o) => {
                    const isKey =
                      selectedQuestion.correctAnswer === o.k ||
                      selectedQuestion.correctAnswer?.toLowerCase() === o.val?.toLowerCase() ||
                      selectedQuestion.correctAnswer?.toLowerCase() === `option${o.k}`.toLowerCase();

                    return (
                      <div
                        key={o.k}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          isKey
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-semibold"
                            : "bg-white/5 border-white/5 text-slate-300"
                        }`}
                      >
                        <span>
                          <strong>{o.k}.</strong> {o.val}
                        </span>
                        {isKey && <span className="text-[10px] text-emerald-400 font-bold">✓ CORRECT KEY</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedQuestion(null)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
