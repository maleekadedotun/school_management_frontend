import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchTeacherQuestions,
  fetchQuestion,
  createQuestion,
  updateQuestion,
  clearCurrentQuestion,
  type QuestionItem,
} from "../../features/questions/questionsSlice";
import { fetchExams } from "../../features/exams/examsSlice";
import { fetchTeacherProfile } from "../../features/teacherAuth/teacherAuthSlice";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 10;

interface QuestionFormData {
  examId: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "optionA" | "optionB" | "optionC" | "optionD";
}

const emptyForm: QuestionFormData = {
  examId: "",
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "optionA",
};

export default function TeacherQuestionsList() {
  const dispatch = useAppDispatch();

  // Redux state
  const { teacher, loading: profileLoading } = useAppSelector((s) => s.teacherAuth);
  const {
    teacherQuestions,
    currentQuestion,
    loading: questionsLoading,
  } = useAppSelector((s) => s.questions);
  const { items: exams } = useAppSelector((s) => s.exams);

  // Local state for filtering & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExamFilter, setSelectedExamFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState<QuestionFormData>({ ...emptyForm });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [showRawJson, setShowRawJson] = useState(false);

  // Initial data loading
  useEffect(() => {
    dispatch(fetchTeacherProfile());
    dispatch(fetchTeacherQuestions());
    dispatch(fetchExams());
  }, [dispatch]);

  // Map question ID to associated Exam if available
  const examMap = useMemo(() => {
    const map: Record<string, any> = {};
    exams.forEach((exam: any) => {
      if (exam.questions && Array.isArray(exam.questions)) {
        exam.questions.forEach((q: any) => {
          const qId = typeof q === "string" ? q : q?._id;
          if (qId) map[qId] = exam;
        });
      }
    });
    return map;
  }, [exams]);

  const teacherId = teacher?._id || (teacher as any)?.id;

  // Filter questions authored by this teacher only
  const myTeacherQuestions = useMemo(() => {
    if (!teacherId) return teacherQuestions;
    return teacherQuestions.filter((q) => {
      const creatorId = q.createdBy?._id || q.createdBy;
      return !creatorId || creatorId.toString() === teacherId.toString();
    });
  }, [teacherQuestions, teacherId]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return myTeacherQuestions.filter((q) => {
      const associatedExam = q.exam || examMap[q._id];
      const examName = associatedExam?.name || "";
      const matchesExam =
        selectedExamFilter === "all" ||
        associatedExam?._id === selectedExamFilter ||
        examName.toLowerCase().includes(selectedExamFilter.toLowerCase());

      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        q.question.toLowerCase().includes(query) ||
        q.optionA.toLowerCase().includes(query) ||
        q.optionB.toLowerCase().includes(query) ||
        q.optionC.toLowerCase().includes(query) ||
        q.optionD.toLowerCase().includes(query) ||
        q.correctAnswer.toLowerCase().includes(query) ||
        examName.toLowerCase().includes(query);

      return matchesExam && matchesSearch;
    });
  }, [myTeacherQuestions, examMap, selectedExamFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedExamFilter]);

  // Helper to determine if an option is the correct answer
  const isOptionCorrect = (
    q: { correctAnswer: string; optionA: string; optionB: string; optionC: string; optionD: string },
    optKey: "optionA" | "optionB" | "optionC" | "optionD"
  ) => {
    const val = q[optKey]?.trim().toLowerCase();
    const ans = q.correctAnswer?.trim().toLowerCase();
    return ans === optKey.toLowerCase() || ans === val;
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormData({
      ...emptyForm,
      examId: exams.length > 0 ? exams[0]._id : "",
    });
    setFormError("");
    setShowCreateModal(true);
  };

  // Open View Modal (hits fetchQuestionCtrl via fetchQuestion)
  const handleOpenViewModal = (questionId: string) => {
    dispatch(fetchQuestion(questionId));
    setShowViewModal(true);
    setShowRawJson(false);
  };

  // Open Edit Modal (pre-fills with question data)
  const handleOpenEditModal = (q: QuestionItem) => {
    const associatedExam = q.exam || examMap[q._id];

    // Determine which key optionA..optionD was the correct answer
    let resolvedCorrectKey: "optionA" | "optionB" | "optionC" | "optionD" = "optionA";
    const ans = q.correctAnswer?.trim().toLowerCase();
    if (ans === "optiona" || ans === q.optionA.trim().toLowerCase()) resolvedCorrectKey = "optionA";
    else if (ans === "optionb" || ans === q.optionB.trim().toLowerCase()) resolvedCorrectKey = "optionB";
    else if (ans === "optionc" || ans === q.optionC.trim().toLowerCase()) resolvedCorrectKey = "optionC";
    else if (ans === "optiond" || ans === q.optionD.trim().toLowerCase()) resolvedCorrectKey = "optionD";

    setEditingQuestionId(q._id);
    setFormData({
      examId: associatedExam?._id || "",
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: resolvedCorrectKey,
    });
    setFormError("");
    setShowViewModal(false);
    setShowEditModal(true);
  };

  // Submit Create Question
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.examId) {
      setFormError("Please select an exam to link this question to.");
      return;
    }
    if (!formData.question.trim()) {
      setFormError("Question text cannot be empty.");
      return;
    }
    if (
      !formData.optionA.trim() ||
      !formData.optionB.trim() ||
      !formData.optionC.trim() ||
      !formData.optionD.trim()
    ) {
      setFormError("All 4 options (A, B, C, D) are required.");
      return;
    }

    setIsSubmitting(true);
    // Submit with the actual text of the correct option to ensure clear display in tests
    const chosenAnswerValue = formData[formData.correctAnswer];

    const result = await dispatch(
      createQuestion({
        examId: formData.examId,
        question: formData.question.trim(),
        optionA: formData.optionA.trim(),
        optionB: formData.optionB.trim(),
        optionC: formData.optionC.trim(),
        optionD: formData.optionD.trim(),
        correctAnswer: chosenAnswerValue.trim(),
      })
    );

    setIsSubmitting(false);

    if (createQuestion.fulfilled.match(result)) {
      toast.success("Question created and linked to exam successfully!");
      setShowCreateModal(false);
      dispatch(fetchTeacherQuestions());
    } else {
      const err = (result.payload as string) || "Failed to create question.";
      setFormError(err);
      toast.error(err);
    }
  };

  // Submit Update Question
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestionId) return;
    setFormError("");

    if (!formData.question.trim()) {
      setFormError("Question statement is required.");
      return;
    }
    if (
      !formData.optionA.trim() ||
      !formData.optionB.trim() ||
      !formData.optionC.trim() ||
      !formData.optionD.trim()
    ) {
      setFormError("All options must be filled.");
      return;
    }

    setIsSubmitting(true);
    const chosenAnswerValue = formData[formData.correctAnswer];

    const result = await dispatch(
      updateQuestion({
        id: editingQuestionId,
        question: formData.question.trim(),
        optionA: formData.optionA.trim(),
        optionB: formData.optionB.trim(),
        optionC: formData.optionC.trim(),
        optionD: formData.optionD.trim(),
        correctAnswer: chosenAnswerValue.trim(),
      })
    );

    setIsSubmitting(false);

    if (updateQuestion.fulfilled.match(result)) {
      toast.success("Question updated successfully!");
      setShowEditModal(false);
      setEditingQuestionId(null);
      dispatch(fetchTeacherQuestions());
    } else {
      const err = (result.payload as string) || "Failed to update question.";
      setFormError(err);
      toast.error(err);
    }
  };

  const t = teacher as any;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto min-h-screen">
      {/* 1. TEACHER PROFILE HERO BANNER (fetchTeacherProfile) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border border-emerald-500/20 p-6 sm:p-8 shadow-2xl shadow-emerald-950/40">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-emerald-500/30 border-2 border-white/20">
                {teacher?.name ? teacher.name[0].toUpperCase() : "T"}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#0a0f1e] flex items-center justify-center text-[10px] text-black font-bold">
                ✓
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {profileLoading ? "Loading Profile..." : teacher?.name || "Teacher Portal"}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Educator
                </span>
                {t?.teacherId && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-white/10 text-slate-300 border border-white/10">
                    ID: {t.teacherId}
                  </span>
                )}
              </div>

              <p className="text-slate-300 text-sm flex flex-wrap items-center gap-2">
                <span>{teacher?.email || "teacher@school.edu"}</span>
                {t?.program && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-300 font-medium">
                      Program: {t?.program?.name || t?.program}
                    </span>
                  </>
                )}
                {t?.subject && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-teal-300 font-medium">
                      Subject: {t?.subject?.name || t?.subject}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Link
              to="/teacher/profile"
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              View Full Profile
            </Link>

            <button
              onClick={handleOpenCreateModal}
              className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Create Question
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            title: "Question Bank",
            value: myTeacherQuestions.length,
            label: "Total Created",
            icon: "❓",
            bg: "from-emerald-500/10 to-teal-500/5",
            border: "border-emerald-500/20",
            text: "text-emerald-400",
          },
          {
            title: "Associated Exams",
            value: exams.length,
            label: "Active Tests",
            icon: "📋",
            bg: "from-blue-500/10 to-cyan-500/5",
            border: "border-blue-500/20",
            text: "text-blue-400",
          },
          {
            title: "Filtered Results",
            value: filteredQuestions.length,
            label: "Showing Match",
            icon: "🔍",
            bg: "from-violet-500/10 to-purple-500/5",
            border: "border-violet-500/20",
            text: "text-violet-400",
          },
          {
            title: "Pagination",
            value: `${currentPage} / ${totalPages}`,
            label: "Current Page",
            icon: "📄",
            bg: "from-amber-500/10 to-yellow-500/5",
            border: "border-amber-500/20",
            text: "text-amber-400",
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${stat.bg} border ${stat.border} backdrop-blur-xl space-y-1 transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>{stat.title}</span>
              <span className="text-base">{stat.icon}</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold ${stat.text}`}>{stat.value}</div>
            <div className="text-[11px] text-slate-400 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 3. TOOLBAR: SEARCH & EXAM SELECTOR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0e172a]/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <svg
            className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search questions, options, answer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter by Exam */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 hidden sm:inline">
            Exam:
          </span>
          <select
            value={selectedExamFilter}
            onChange={(e) => setSelectedExamFilter(e.target.value)}
            className="flex-1 md:w-64 px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
          >
            <option value="all">All Linked Exams</option>
            {exams.map((ex: any) => (
              <option key={ex._id} value={ex._id}>
                {ex.name} ({ex.questions?.length || 0} Qs)
              </option>
            ))}
          </select>

          {/* Quick Refresh */}
          <button
            onClick={() => {
              dispatch(fetchTeacherQuestions());
              dispatch(fetchExams());
              toast.success("Questions reloaded!");
            }}
            title="Refresh Questions"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 4. QUESTIONS LIST / CARDS (fetchAllQuestionsCtrl) */}
      <div className="space-y-4">
        {questionsLoading && teacherQuestions.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-300 text-sm font-medium">Fetching question bank...</p>
          </div>
        ) : paginatedQuestions.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white/5 border border-white/10 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mx-auto">
              📝
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No questions found</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                {searchTerm || selectedExamFilter !== "all"
                  ? "No questions match your search or exam filter. Try changing your filters."
                  : "You haven't authored any exam questions yet. Click 'Create Question' to get started."}
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20"
            >
              + Create First Question
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedQuestions.map((q, index) => {
              const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
              const associatedExam = q.exam || examMap[q._id];

              return (
                <div
                  key={q._id}
                  className="p-5 sm:p-6 rounded-2xl bg-[#0f172a]/90 border border-white/10 hover:border-emerald-500/40 transition-all duration-200 shadow-xl space-y-4 group"
                >
                  {/* Top Bar: Question Number + Exam Badge + Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
                        #{actualIndex}
                      </span>
                      {associatedExam ? (
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Exam: {associatedExam.name}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-400">
                          General Question
                        </span>
                      )}
                      {q.createdAt && (
                        <span className="text-[11px] text-slate-500 hidden sm:inline">
                          Created {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* View Single Question (fetchQuestionCtrl) */}
                      <button
                        onClick={() => handleOpenViewModal(q._id)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                        title="View Full Question Details"
                      >
                        <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Inspect
                      </button>

                      {/* Edit Question (updateQuestionCtrl) */}
                      <button
                        onClick={() => handleOpenEditModal(q)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Edit Question"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                      {q.question}
                    </h3>
                  </div>

                  {/* Options A, B, C, D Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {[
                      { key: "optionA" as const, label: "A", value: q.optionA },
                      { key: "optionB" as const, label: "B", value: q.optionB },
                      { key: "optionC" as const, label: "C", value: q.optionC },
                      { key: "optionD" as const, label: "D", value: q.optionD },
                    ].map((opt) => {
                      const isCorrect = isOptionCorrect(q, opt.key);

                      return (
                        <div
                          key={opt.key}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isCorrect
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200 shadow-sm shadow-emerald-500/10"
                              : "bg-white/5 border-white/5 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span
                              className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? "bg-emerald-500 text-black font-extrabold"
                                  : "bg-white/10 text-slate-400"
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span className="text-sm font-medium truncate">{opt.value}</span>
                          </div>

                          {isCorrect && (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. PAGINATION (10 per page, Back & Next) */}
        {filteredQuestions.length > ITEMS_PER_PAGE && (
          <div className="p-4 rounded-2xl bg-[#0e172a] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Showing{" "}
              <strong className="text-white font-semibold">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-white font-semibold">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredQuestions.length)}
              </strong>{" "}
              of <strong className="text-white font-semibold">{filteredQuestions.length}</strong>{" "}
              questions
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
              >
                ← Back
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  // Only show current, first, last, and neighbors if totalPages > 6
                  if (
                    totalPages > 6 &&
                    pNum !== 1 &&
                    pNum !== totalPages &&
                    Math.abs(pNum - currentPage) > 1
                  ) {
                    if (pNum === 2 || pNum === totalPages - 1) {
                      return (
                        <span key={pNum} className="text-slate-600 px-1 text-xs">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === pNum
                          ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                          : "bg-white/5 hover:bg-white/10 text-slate-300"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. CREATE QUESTION MODAL (createQuestion) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0b1329] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-sm font-bold">
                    +
                  </span>
                  <h3 className="text-xl font-bold text-white">Create New Question</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Author a multiple choice question and assign it to an exam
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Select Exam */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Associated Exam <span className="text-emerald-400">*</span>
                </label>
                <select
                  required
                  value={formData.examId}
                  onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                >
                  <option value="" disabled>
                    -- Select an Exam --
                  </option>
                  {exams.map((ex: any) => (
                    <option key={ex._id} value={ex._id}>
                      {ex.name} {ex.subject?.name ? `(${ex.subject.name})` : ""}
                    </option>
                  ))}
                </select>
                {exams.length === 0 && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    No exams found. Create an exam in 'My Exams' first or check exams list.
                  </p>
                )}
              </div>

              {/* Question Statement */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Question Statement <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. What is the fundamental unit of structure and function in living organisms?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Answer Options & Correct Key <span className="text-emerald-400">*</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Click radio button to mark as correct
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "optionA" as const, label: "A" },
                    { key: "optionB" as const, label: "B" },
                    { key: "optionC" as const, label: "C" },
                    { key: "optionD" as const, label: "D" },
                  ].map((opt) => (
                    <div
                      key={opt.key}
                      onClick={() => setFormData({ ...formData, correctAnswer: opt.key })}
                      className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                        formData.correctAnswer === opt.key
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-200"
                          : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="correctAnswerCreate"
                        checked={formData.correctAnswer === opt.key}
                        onChange={() => setFormData({ ...formData, correctAnswer: opt.key })}
                        className="accent-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="w-5 h-5 rounded-md bg-white/10 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {opt.label}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${opt.label}`}
                        value={formData[opt.key]}
                        onChange={(e) =>
                          setFormData({ ...formData, [opt.key]: e.target.value })
                        }
                        className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              {formData.question.trim() && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                    <span>👁️</span> Student Preview
                  </div>
                  <p className="text-sm font-semibold text-white">{formData.question}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(["optionA", "optionB", "optionC", "optionD"] as const).map((k) => (
                      <div
                        key={k}
                        className={`p-2 rounded-lg border ${
                          formData.correctAnswer === k
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold"
                            : "bg-black/20 border-white/5 text-slate-400"
                        }`}
                      >
                        {k.replace("option", "")}: {formData[k] || `[Option ${k.replace("option", "")}]`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Save Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. VIEW SINGLE QUESTION MODAL (fetchQuestionCtrl) */}
      {showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0b1329] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center text-sm font-bold">
                    👁️
                  </span>
                  <h3 className="text-xl font-bold text-white">Question Inspection</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Fetched via API endpoint: <code className="text-teal-300">GET /api/v1/questions/:id</code>
                </p>
              </div>

              <button
                onClick={() => {
                  setShowViewModal(false);
                  dispatch(clearCurrentQuestion());
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            {!currentQuestion ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-300">Fetching single question data from server...</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
                  <div>
                    <span className="text-slate-400 block">Question ID</span>
                    <span className="text-white font-mono truncate block" title={currentQuestion._id}>
                      {currentQuestion._id}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Correct Answer Value</span>
                    <span className="text-emerald-400 font-bold block truncate">
                      {currentQuestion.correctAnswer}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Created On</span>
                    <span className="text-white block">
                      {currentQuestion.createdAt
                        ? new Date(currentQuestion.createdAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Prompt */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Question Statement
                  </span>
                  <div className="p-4 rounded-2xl bg-[#1e293b]/70 border border-white/10 text-white text-base font-semibold">
                    {currentQuestion.question}
                  </div>
                </div>

                {/* Options Breakdown */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Options & Correctness
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "optionA" as const, label: "Option A", val: currentQuestion.optionA },
                      { key: "optionB" as const, label: "Option B", val: currentQuestion.optionB },
                      { key: "optionC" as const, label: "Option C", val: currentQuestion.optionC },
                      { key: "optionD" as const, label: "Option D", val: currentQuestion.optionD },
                    ].map((opt) => {
                      const isCorrect = isOptionCorrect(currentQuestion, opt.key);

                      return (
                        <div
                          key={opt.key}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                            isCorrect
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/10"
                              : "bg-white/5 border-white/10 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span
                              className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? "bg-emerald-500 text-black font-extrabold"
                                  : "bg-white/10 text-slate-400"
                              }`}
                            >
                              {opt.label.slice(-1)}
                            </span>
                            <span className="text-sm font-medium truncate">{opt.val}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-xs font-bold text-emerald-400 shrink-0">
                              ✓ KEY
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Raw JSON toggle */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <span>{showRawJson ? "▼ Hide" : "▶ Show"} Raw API Controller Response</span>
                  </button>
                  {showRawJson && (
                    <pre className="mt-2 p-3 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48">
                      {JSON.stringify(currentQuestion, null, 2)}
                    </pre>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      dispatch(clearCurrentQuestion());
                    }}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(currentQuestion)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit this Question
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. EDIT QUESTION MODAL (updateQuestionCtrl) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0b1329] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-sm font-bold">
                    ✏️
                  </span>
                  <h3 className="text-xl font-bold text-white">Edit Question</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Update question statement, options, or change the correct answer key
                </p>
              </div>

              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              {/* Question Statement */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Question Statement <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Options & Correct Key <span className="text-emerald-400">*</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Click an option to designate it as the correct answer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "optionA" as const, label: "A" },
                    { key: "optionB" as const, label: "B" },
                    { key: "optionC" as const, label: "C" },
                    { key: "optionD" as const, label: "D" },
                  ].map((opt) => (
                    <div
                      key={opt.key}
                      onClick={() => setFormData({ ...formData, correctAnswer: opt.key })}
                      className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                        formData.correctAnswer === opt.key
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-200"
                          : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="correctAnswerEdit"
                        checked={formData.correctAnswer === opt.key}
                        onChange={() => setFormData({ ...formData, correctAnswer: opt.key })}
                        className="accent-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="w-5 h-5 rounded-md bg-white/10 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {opt.label}
                      </span>
                      <input
                        type="text"
                        required
                        value={formData[opt.key]}
                        onChange={(e) =>
                          setFormData({ ...formData, [opt.key]: e.target.value })
                        }
                        className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
