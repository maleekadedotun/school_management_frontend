import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchTeacherQuestions,
  fetchQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  clearCurrentQuestion,
  type QuestionItem,
} from "../../features/questions/questionsSlice";
import { fetchExams, createExam } from "../../features/exams/examsSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import { fetchSubjects } from "../../features/subjects/subjectsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import { fetchPrograms } from "../../features/programs/programsSlice";
import { fetchTeacherProfile } from "../../features/teacherAuth/teacherAuthSlice";
import toast from "react-hot-toast";

interface QuestionFormData {
  academicYear: string;
  academicTerm: string;
  examId: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "optionA" | "optionB" | "optionC" | "optionD";
}

const emptyForm: QuestionFormData = {
  academicYear: "",
  academicTerm: "",
  examId: "",
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "optionA",
};

const emptyExamForm = {
  name: "",
  description: "",
  examType: "Exam",
  academicYear: "",
  academicTerm: "",
  subject: "",
  classLevel: "",
  program: "",
  duration: "30 minutes",
  examDate: new Date().toISOString().split("T")[0],
  examTime: "09:00",
  passMark: 40,
  totalMark: 70,
};

const getObjName = (obj: any): string => {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj.name || obj.title || "";
};

const getObjId = (obj: any): string => {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj._id || obj.id || "";
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
  const { items: academicYears } = useAppSelector((s) => s.academicYears);
  const { items: academicTerms } = useAppSelector((s) => s.academicTerms);
  const { items: subjects } = useAppSelector((s) => s.subjects);
  const { items: classLevels } = useAppSelector((s) => s.classLevels);
  const { items: programs } = useAppSelector((s) => s.programs);

  // Table State: Expanded Examination Rows (click row to display questions under each examination)
  const [expandedExamIds, setExpandedExamIds] = useState<string[]>([]);

  // Filter States
  const [selectedYearFilter, setSelectedYearFilter] = useState("all");
  const [selectedTermFilter, setSelectedTermFilter] = useState("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all"); // 'all' | 'Exam' | 'Test'
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<QuestionFormData>({ ...emptyForm });
  const [examForm, setExamForm] = useState({ ...emptyExamForm });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [showRawJson, setShowRawJson] = useState(false);

  // Initial data loading
  useEffect(() => {
    dispatch(fetchTeacherProfile());
    dispatch(fetchTeacherQuestions());
    dispatch(fetchExams());
    dispatch(fetchAcademicYears());
    dispatch(fetchAcademicTerms());
    dispatch(fetchSubjects());
    dispatch(fetchClassLevels());
    dispatch(fetchPrograms());
  }, [dispatch]);

  const teacherId = teacher?._id || (teacher as any)?.id;
  const t: any = teacher || {};

  // Filter questions authored by this teacher only
  const myTeacherQuestions = useMemo(() => {
    if (!teacherId) return teacherQuestions;
    return teacherQuestions.filter((q) => {
      const creatorId = q.createdBy?._id || q.createdBy;
      return !creatorId || creatorId.toString() === teacherId.toString();
    });
  }, [teacherQuestions, teacherId]);

  // Aggregate questions into assessments (Exam or Test for Academic Year, Term, Examination Name)
  const assessments = useMemo(() => {
    const map: Record<string, any> = {};

    // 1. Initialize from exams
    exams.forEach((exam: any) => {
      const yearName = getObjName(exam.academicYear);
      const termName = getObjName(exam.academicTerm);
      const subName = getObjName(exam.subject);
      const className = getObjName(exam.classLevel);
      const rawType = (exam.examType || "Exam").trim();
      const isTest = ["test", "quiz", "continuous assessment", "ca"].includes(rawType.toLowerCase());

      // Questions directly embedded inside exam.questions
      const embeddedQuestions: QuestionItem[] = [];
      if (exam.questions && Array.isArray(exam.questions)) {
        exam.questions.forEach((q: any) => {
          if (q && typeof q === "object" && q._id && q.question) {
            embeddedQuestions.push({
              ...q,
              exam: {
                _id: exam._id,
                name: exam.name,
                examType: isTest ? "Test" : "Exam",
                subject: subName,
                program: getObjName(exam.program),
                academicYear: yearName,
                academicTerm: termName,
                classLevel: className,
              },
              academicYear: yearName,
              academicTerm: termName,
              examType: isTest ? "Test" : "Exam",
            });
          }
        });
      }

      map[exam._id] = {
        id: exam._id,
        name: exam.name,
        description: exam.description || "",
        examType: isTest ? "Test" : (rawType || "Exam"),
        rawExamType: rawType,
        academicYear: yearName || "2026/2027",
        academicYearId: getObjId(exam.academicYear),
        academicTerm: termName || "First Term",
        academicTermId: getObjId(exam.academicTerm),
        subject: subName,
        classLevel: className,
        passMark: exam.passMark ?? (isTest ? 15 : 40),
        totalMark: exam.totalMark ?? (isTest ? 30 : 70),
        duration: exam.duration || "30 mins",
        examDate: exam.examDate,
        examTime: exam.examTime,
        questions: embeddedQuestions,
      };
    });

    // 2. Attach questions from myTeacherQuestions
    myTeacherQuestions.forEach((q) => {
      const associatedExam = q.exam || (q as any).examId;
      const examId = typeof associatedExam === "object" ? associatedExam?._id : associatedExam;

      if (examId && map[examId]) {
        if (!map[examId].questions.some((existingQ: any) => existingQ._id === q._id)) {
          map[examId].questions.push(q);
        }
      } else if (examId) {
        const yearName = q.academicYear || getObjName(associatedExam?.academicYear) || "2026/2027";
        const termName = q.academicTerm || getObjName(associatedExam?.academicTerm) || "First Term";
        const rawType = (q.examType || associatedExam?.examType || "Exam").trim();
        const isTest = ["test", "quiz", "continuous assessment", "ca"].includes(rawType.toLowerCase());

        map[examId] = {
          id: examId,
          name: associatedExam?.name || "Exam / Assessment",
          description: associatedExam?.description || "",
          examType: isTest ? "Test" : (rawType || "Exam"),
          rawExamType: rawType,
          academicYear: yearName,
          academicYearId: "",
          academicTerm: termName,
          academicTermId: "",
          subject: associatedExam?.subject || "",
          classLevel: associatedExam?.classLevel || "",
          passMark: associatedExam?.passMark ?? 40,
          totalMark: associatedExam?.totalMark ?? 70,
          duration: associatedExam?.duration || "30 mins",
          questions: [q],
        };
      } else {
        const fallbackId = "general-unlinked";
        if (!map[fallbackId]) {
          map[fallbackId] = {
            id: fallbackId,
            name: "General Question Bank",
            description: "Questions authored without an active examination link",
            examType: "Question Bank",
            rawExamType: "Bank",
            academicYear: q.academicYear || "2026/2027",
            academicYearId: "",
            academicTerm: q.academicTerm || "First Term",
            academicTermId: "",
            subject: "General",
            classLevel: "All Levels",
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
  }, [exams, myTeacherQuestions]);

  // Unique Academic Years & Terms
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    academicYears.forEach((y: any) => {
      const n = getObjName(y);
      if (n) set.add(n);
    });
    assessments.forEach((a) => {
      if (a.academicYear) set.add(a.academicYear);
    });
    if (!set.has("2026/2027")) set.add("2026/2027");
    return Array.from(set);
  }, [academicYears, assessments]);

  const availableTerms = useMemo(() => {
    const set = new Set<string>();
    academicTerms.forEach((t: any) => {
      const n = getObjName(t);
      if (n) set.add(n);
    });
    assessments.forEach((a) => {
      if (a.academicTerm) set.add(a.academicTerm);
    });
    if (set.size === 0) {
      set.add("First Term");
      set.add("Second Term");
      set.add("Third Term");
    }
    return Array.from(set);
  }, [academicTerms, assessments]);

  // Filtered Assessments
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

      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.subject && item.subject.toLowerCase().includes(query)) ||
        (item.classLevel && item.classLevel.toLowerCase().includes(query)) ||
        item.questions.some((q: QuestionItem) =>
          q.question?.toLowerCase().includes(query)
        );

      return matchesYear && matchesTerm && matchesType && matchesSearch;
    });
  }, [assessments, selectedYearFilter, selectedTermFilter, selectedTypeFilter, searchTerm]);

  // Pagination for table
  const totalPages = Math.max(1, Math.ceil(filteredAssessments.length / ITEMS_PER_PAGE));
  const paginatedAssessments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssessments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssessments, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYearFilter, selectedTermFilter, selectedTypeFilter, searchTerm]);

  // Total questions count
  const totalQuestionsCount = useMemo(() => {
    let count = 0;
    assessments.forEach((a) => {
      count += a.questions.length;
    });
    return count;
  }, [assessments]);

  // Toggle row expansion (click row to show questions under each examination)
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

  // Helper to check correct answer
  const isOptionCorrect = (
    q: { correctAnswer: string; optionA: string; optionB: string; optionC: string; optionD: string },
    optKey: "optionA" | "optionB" | "optionC" | "optionD"
  ) => {
    const val = (q[optKey] || "").trim().toLowerCase();
    const ans = (q.correctAnswer || "").trim().toLowerCase();
    return ans === optKey.toLowerCase() || (val && ans === val);
  };

  // Open Create Question Modal
  const handleOpenCreateModal = (targetAssessmentId?: string) => {
    const targetExam = targetAssessmentId
      ? assessments.find((a) => a.id === targetAssessmentId)
      : assessments[0] || null;

    const yearVal = targetExam?.academicYear || availableYears[0] || "2026/2027";
    const termVal = targetExam?.academicTerm || availableTerms[0] || "First Term";
    const examIdVal = targetExam?.id && targetExam.id !== "general-unlinked" ? targetExam.id : (exams[0]?._id || "");

    setFormData({
      ...emptyForm,
      academicYear: yearVal,
      academicTerm: termVal,
      examId: examIdVal,
    });
    setFormError("");
    setShowCreateModal(true);
  };

  // Open View Single Question Modal (API: fetchQuestion)
  const handleOpenViewModal = (questionId: string) => {
    dispatch(fetchQuestion(questionId));
    setShowViewModal(true);
    setShowRawJson(false);
  };

  // Open Edit Question Modal
  const handleOpenEditModal = (q: QuestionItem) => {
    const associatedExam = q.exam;
    let resolvedCorrectKey: "optionA" | "optionB" | "optionC" | "optionD" = "optionA";
    const ans = (q.correctAnswer || "").trim().toLowerCase();
    if (ans === "optiona" || ans === (q.optionA || "").trim().toLowerCase()) resolvedCorrectKey = "optionA";
    else if (ans === "optionb" || ans === (q.optionB || "").trim().toLowerCase()) resolvedCorrectKey = "optionB";
    else if (ans === "optionc" || ans === (q.optionC || "").trim().toLowerCase()) resolvedCorrectKey = "optionC";
    else if (ans === "optiond" || ans === (q.optionD || "").trim().toLowerCase()) resolvedCorrectKey = "optionD";

    setEditingQuestionId(q._id);
    setFormData({
      academicYear: q.academicYear || associatedExam?.academicYear || "",
      academicTerm: q.academicTerm || associatedExam?.academicTerm || "",
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

  // Delete Question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("Are you sure you want to remove this question?")) return;
    setDeletingId(questionId);
    try {
      const res = await dispatch(deleteQuestion(questionId));
      if (deleteQuestion.fulfilled.match(res)) {
        toast.success("Question deleted successfully!");
        dispatch(fetchTeacherQuestions());
        dispatch(fetchExams());
      } else {
        toast.error((res.payload as string) || "Failed to delete question");
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Submit Create Question
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.examId) {
      setFormError("Please select an Examination / Assessment to save this question under.");
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
    const chosenAnswerValue = formData[formData.correctAnswer];

    // Find matching AcademicYear and AcademicTerm ObjectIds if available
    const matchedYear = academicYears.find(
      (y: any) => y.name === formData.academicYear || y._id === formData.academicYear
    );
    const matchedTerm = academicTerms.find(
      (t: any) => t.name === formData.academicTerm || t._id === formData.academicTerm
    );

    const yearPayload = matchedYear?._id || formData.academicYear;
    const termPayload = matchedTerm?._id || formData.academicTerm;

    const result = await dispatch(
      createQuestion({
        examId: formData.examId,
        academicYear: yearPayload,
        academicTerm: termPayload,
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
      toast.success("Question created and saved to the exam successfully!");
      setShowCreateModal(false);
      // Auto expand this exam row so user immediately sees their new question
      if (!expandedExamIds.includes(formData.examId)) {
        setExpandedExamIds((prev) => [...prev, formData.examId]);
      }
      dispatch(fetchTeacherQuestions());
      dispatch(fetchExams());
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

    setIsSubmitting(true);
    const chosenAnswerValue = formData[formData.correctAnswer];

    const matchedYear = academicYears.find(
      (y: any) => y.name === formData.academicYear || y._id === formData.academicYear
    );
    const matchedTerm = academicTerms.find(
      (t: any) => t.name === formData.academicTerm || t._id === formData.academicTerm
    );

    const yearPayload = matchedYear?._id || formData.academicYear || undefined;
    const termPayload = matchedTerm?._id || formData.academicTerm || undefined;

    const result = await dispatch(
      updateQuestion({
        id: editingQuestionId,
        examId: formData.examId || undefined,
        academicYear: yearPayload,
        academicTerm: termPayload,
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
      dispatch(fetchExams());
    } else {
      const err = (result.payload as string) || "Failed to update question.";
      setFormError(err);
      toast.error(err);
    }
  };

  // Submit Quick Create Assessment (Exam or Test)
  const handleCreateExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!examForm.name.trim()) {
      setFormError("Examination name is required.");
      return;
    }
    if (!examForm.subject) {
      setFormError("Please choose a subject.");
      return;
    }
    if (!examForm.classLevel) {
      setFormError("Please choose a class level.");
      return;
    }
    if (!examForm.academicYear) {
      setFormError("Please choose an academic year.");
      return;
    }
    if (!examForm.academicTerm) {
      setFormError("Please choose an academic term.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...examForm,
      program: examForm.program || (programs[0]?._id ?? ""),
    };

    const res = await dispatch(createExam(payload));
    setIsSubmitting(false);

    if (createExam.fulfilled.match(res)) {
      toast.success(`${examForm.examType} "${examForm.name}" created successfully!`);
      setShowCreateExamModal(false);
      const newExam = res.payload.data || res.payload;
      if (newExam?._id) {
        setExpandedExamIds((prev) => [...prev, newExam._id]);
      }
      dispatch(fetchExams());
    } else {
      const err = (res.payload as string) || "Failed to create examination.";
      setFormError(err);
      toast.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. TEACHER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1629] via-[#0f223a] to-[#0a1826] border border-emerald-500/20 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-emerald-500/30 border-2 border-white/20">
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
                  Question Bank Table
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
                      Program: {getObjName(t.program)}
                    </span>
                  </>
                )}
                {t?.subject && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-teal-300 font-medium">
                      Subject: {getObjName(t.subject)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                setExamForm({
                  ...emptyExamForm,
                  academicYear: availableYears[0] || "",
                  academicTerm: availableTerms[0] || "",
                  subject: subjects[0]?._id || "",
                  classLevel: classLevels[0]?._id || "",
                  program: programs[0]?._id || "",
                });
                setFormError("");
                setShowCreateExamModal(true);
              }}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              + Create Examination / Test
            </button>

            <button
              onClick={() => handleOpenCreateModal()}
              className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              + Create Question
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            title: "Examinations & Tests",
            value: assessments.length,
            label: "Assessment Records",
            icon: "📋",
            bg: "from-blue-500/10 to-indigo-500/5",
            border: "border-blue-500/20",
            text: "text-blue-400",
          },
          {
            title: "Total Questions",
            value: totalQuestionsCount,
            label: "Questions in Bank",
            icon: "❓",
            bg: "from-emerald-500/10 to-teal-500/5",
            border: "border-emerald-500/20",
            text: "text-emerald-400",
          },
          {
            title: "Academic Years",
            value: availableYears.length,
            label: "e.g. 2026/2027",
            icon: "📅",
            bg: "from-violet-500/10 to-purple-500/5",
            border: "border-violet-500/20",
            text: "text-violet-400",
          },
          {
            title: "Current Term",
            value: availableTerms[0] || "Active",
            label: "Session Term",
            icon: "🎯",
            bg: "from-amber-500/10 to-yellow-500/5",
            border: "border-amber-500/20",
            text: "text-amber-400",
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${stat.bg} border ${stat.border} backdrop-blur-xl space-y-1 transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between text-xs text-dark-400 font-semibold uppercase tracking-wider">
              <span>{stat.title}</span>
              <span className="text-base">{stat.icon}</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold ${stat.text} truncate`}>{stat.value}</div>
            <div className="text-[11px] text-dark-400 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 3. FILTERS BAR: YEAR, TERM, TYPE, SEARCH */}
      <div className="p-5 rounded-2xl bg-[#0e172a]/95 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
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
              placeholder="Search by examination name, academic year, subject..."
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleExpandAll}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{expandedExamIds.length === paginatedAssessments.length ? "▲ Collapse All" : "▼ Expand All"}</span>
            </button>

            <button
              onClick={() => {
                dispatch(fetchTeacherQuestions());
                dispatch(fetchExams());
                toast.success("Question bank updated!");
              }}
              title="Refresh Question Bank"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/5">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Academic Year:
            </label>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#1e293b] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-medium [&>option]:text-slate-900 [&>option]:bg-white"
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
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Academic Term:
            </label>
            <select
              value={selectedTermFilter}
              onChange={(e) => setSelectedTermFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#1e293b] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-medium [&>option]:text-slate-900 [&>option]:bg-white"
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
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Assessment Type:
            </label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#1e293b] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-medium [&>option]:text-slate-900 [&>option]:bg-white"
            >
              <option value="all" className="text-slate-900 bg-white">All Types (Exam & Test)</option>
              <option value="Exam" className="text-slate-900 bg-white">Exams (Final / MidTerm)</option>
              <option value="Test" className="text-slate-900 bg-white">Tests (Continuous Assessment / CA)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. MAIN TABLE: EXAM / TEST QUESTION BANK TABLE */}
      <div className="bg-[#0f1629] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>📊</span>
              <span>Examination & Test Question Records</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                {filteredAssessments.length} Examination{filteredAssessments.length === 1 ? "" : "s"}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click on any row or click <strong className="text-emerald-400">"View Questions"</strong> to display questions under each examination
            </p>
          </div>

          <div className="text-xs text-slate-400">
            Total in Bank: <strong className="text-white font-semibold">{totalQuestionsCount}</strong> Questions
          </div>
        </div>

        {questionsLoading && assessments.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-300 text-sm font-medium">Fetching examination & question records...</p>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mx-auto">
              📋
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No examinations found</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                {searchTerm || selectedYearFilter !== "all" || selectedTermFilter !== "all" || selectedTypeFilter !== "all"
                  ? "No examination records match your selected filters. Try clearing or broadening your search."
                  : "No examinations or tests have been created yet. Create an examination to start authoring questions."}
              </p>
            </div>
            <button
              onClick={() => {
                setExamForm({
                  ...emptyExamForm,
                  academicYear: availableYears[0] || "",
                  academicTerm: availableTerms[0] || "",
                  subject: subjects[0]?._id || "",
                  classLevel: classLevels[0]?._id || "",
                  program: programs[0]?._id || "",
                });
                setShowCreateExamModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20"
            >
              + Create First Examination
            </button>
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
                  <th className="py-3.5 px-3 text-center">Marks</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedAssessments.map((assessment, index) => {
                  const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                  const isExpanded = expandedExamIds.includes(assessment.id);
                  const isTest = assessment.examType === "Test";
                  const qCount = assessment.questions.length;

                  return (
                    <React.Fragment key={assessment.id}>
                      {/* Examination Row */}
                      <tr
                        onClick={() => toggleRowExpansion(assessment.id)}
                        className={`group cursor-pointer transition-colors ${
                          isExpanded
                            ? "bg-emerald-500/[0.08] border-l-4 border-l-emerald-500"
                            : "hover:bg-white/[0.03]"
                        }`}
                      >
                        {/* Expand Icon & Number */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-mono text-slate-500 text-xs font-semibold">{actualIndex}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpansion(assessment.id);
                              }}
                              className="w-6 h-6 rounded-lg bg-white/5 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-300 font-bold flex items-center justify-center transition-all"
                              title={isExpanded ? "Collapse questions" : "Click to view questions"}
                            >
                              <span className="text-[10px] transition-transform duration-200">
                                {isExpanded ? "▼" : "▶"}
                              </span>
                            </button>
                          </div>
                        </td>

                        {/* Examination Name */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-white group-hover:text-emerald-300 transition-colors text-sm sm:text-base flex items-center gap-2">
                            <span>{assessment.name}</span>
                            {isExpanded && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Viewing Questions
                              </span>
                            )}
                          </div>
                          {assessment.description && (
                            <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                              {assessment.description}
                            </p>
                          )}
                        </td>

                        {/* Category (Exam vs Test) */}
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

                        {/* Academic Year */}
                        <td className="py-4 px-3 whitespace-nowrap">
                          <span className="font-semibold text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono">
                            📅 {assessment.academicYear}
                          </span>
                        </td>

                        {/* Academic Term */}
                        <td className="py-4 px-3 whitespace-nowrap">
                          <span className="font-medium text-teal-300 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs">
                            🏷️ {assessment.academicTerm}
                          </span>
                        </td>

                        {/* Subject & Class */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-200">
                            {assessment.subject || "General"}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {assessment.classLevel || "All Class Levels"}
                          </div>
                        </td>

                        {/* Questions Count Badge */}
                        <td className="py-4 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                              qCount > 0
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                                : "bg-white/5 text-slate-400 border-white/10"
                            }`}
                          >
                            <span>{qCount}</span>
                            <span className="font-normal opacity-80">Qs</span>
                          </span>
                        </td>

                        {/* Marks & Duration */}
                        <td className="py-4 px-3 text-center whitespace-nowrap text-xs text-slate-300">
                          <div>
                            <span className="font-bold text-white">{assessment.passMark}</span> / {assessment.totalMark}
                          </div>
                          <div className="text-[10px] text-slate-500">{assessment.duration}</div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => toggleRowExpansion(assessment.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                                isExpanded
                                  ? "bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20"
                                  : "bg-white/5 hover:bg-white/10 text-emerald-300 border-white/10"
                              }`}
                            >
                              <span>{isExpanded ? "Hide Questions" : "View Questions"}</span>
                              <span>{isExpanded ? "▲" : "▼"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenCreateModal(assessment.id)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                              title="Add Question directly to this exam"
                            >
                              <span>+</span>
                              <span className="hidden sm:inline">Add Q</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED ROW: DISPLAY QUESTIONS UNDER THIS EXAMINATION */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-0 border-b border-emerald-500/20 bg-[#080d1a]/90">
                            <div className="p-5 sm:p-6 space-y-4 m-2 rounded-2xl border border-emerald-500/30 bg-[#0b1328]/95 shadow-inner animate-in fade-in duration-200">
                              {/* Sub-header inside expansion */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <h4 className="text-base font-bold text-white">
                                      Questions for: <span className="text-emerald-300">{assessment.name}</span>
                                    </h4>
                                  </div>
                                  <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                                    <span>Academic Year: <strong className="text-white">{assessment.academicYear}</strong></span>
                                    <span>•</span>
                                    <span>Term: <strong className="text-white">{assessment.academicTerm}</strong></span>
                                    <span>•</span>
                                    <span>Category: <strong className="text-white">{assessment.examType}</strong></span>
                                    <span>•</span>
                                    <span>Subject: <strong className="text-white">{assessment.subject || "General"}</strong></span>
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenCreateModal(assessment.id)}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                  </svg>
                                  + Add Question to {assessment.name}
                                </button>
                              </div>

                              {/* Questions Under This Examination */}
                              {assessment.questions.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                  <p className="text-sm font-semibold text-white">
                                    No questions currently saved under this examination.
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Click "+ Add Question to {assessment.name}" above to save the first question for this assessment.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {assessment.questions.map((q: QuestionItem, qIdx: number) => {
                                    return (
                                      <div
                                        key={q._id || qIdx}
                                        className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-white/10 hover:border-emerald-500/40 transition-all space-y-3 shadow-md"
                                      >
                                        {/* Top Bar of Question */}
                                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                                          <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center">
                                              #{qIdx + 1}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-300">
                                              Saved under: {assessment.name} ({assessment.academicYear})
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenViewModal(q._id)}
                                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors"
                                            >
                                              Inspect
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEditModal(q)}
                                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/20 transition-colors"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteQuestion(q._id)}
                                              disabled={deletingId === q._id}
                                              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/20 transition-colors disabled:opacity-50"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>

                                        {/* Question Text */}
                                        <h5 className="text-white text-sm sm:text-base font-semibold leading-relaxed">
                                          {q.question}
                                        </h5>

                                        {/* Options Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                          {[
                                            { k: "optionA" as const, l: "A", val: q.optionA },
                                            { k: "optionB" as const, l: "B", val: q.optionB },
                                            { k: "optionC" as const, l: "C", val: q.optionC },
                                            { k: "optionD" as const, l: "D", val: q.optionD },
                                          ].map((opt) => {
                                            const isCorrect = isOptionCorrect(q, opt.k);

                                            return (
                                              <div
                                                key={opt.k}
                                                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                                  isCorrect
                                                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-semibold"
                                                    : "bg-white/5 border-white/5 text-slate-300"
                                                }`}
                                              >
                                                <div className="flex items-center gap-2 truncate">
                                                  <span
                                                    className={`w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                                      isCorrect
                                                        ? "bg-emerald-500 text-black font-extrabold"
                                                        : "bg-white/10 text-slate-400"
                                                    }`}
                                                  >
                                                    {opt.l}
                                                  </span>
                                                  <span className="truncate">{opt.val}</span>
                                                </div>

                                                {isCorrect && (
                                                  <span className="text-[10px] font-bold text-emerald-400 shrink-0 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                                    ✓ KEY
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

        {/* Table Pagination */}
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
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. CREATE QUESTION MODAL (Saved according to examination name & academic year) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0b1329] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-sm font-bold">
                    +
                  </span>
                  <h3 className="text-xl font-bold text-white">Save Question to Examination</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Author a question and save it according to the examination name and academic year
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Academic Year & Academic Term */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Academic Year <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 [&>option]:text-slate-900 [&>option]:bg-white"
                  >
                    <option value="" disabled className="text-slate-900 bg-white">-- Select Academic Year --</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr} className="text-slate-900 bg-white">
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Academic Term <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.academicTerm}
                    onChange={(e) => setFormData({ ...formData, academicTerm: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 [&>option]:text-slate-900 [&>option]:bg-white"
                  >
                    <option value="" disabled className="text-slate-900 bg-white">-- Select Academic Term --</option>
                    {availableTerms.map((tm) => (
                      <option key={tm} value={tm} className="text-slate-900 bg-white">
                        {tm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Examination Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Examination / Assessment Name <span className="text-emerald-400">*</span>
                </label>
                <select
                  required
                  value={formData.examId}
                  onChange={(e) => {
                    const exId = e.target.value;
                    const foundEx = assessments.find((a) => a.id === exId);
                    setFormData({
                      ...formData,
                      examId: exId,
                      academicYear: foundEx?.academicYear || formData.academicYear,
                      academicTerm: foundEx?.academicTerm || formData.academicTerm,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 [&>option]:text-slate-900 [&>option]:bg-white"
                >
                  <option value="" disabled className="text-slate-900 bg-white">-- Select Examination or Test --</option>
                  {assessments
                    .filter((a) => a.id !== "general-unlinked")
                    .map((ex) => (
                      <option key={ex.id} value={ex.id} className="text-slate-900 bg-white">
                        [{ex.academicYear} • {ex.academicTerm} • {ex.examType}] {ex.name} ({ex.subject || "Subject"})
                      </option>
                    ))}
                </select>
              </div>

              {/* Question Statement */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Question Statement <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Which of the following is an example of an endothermic reaction?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                />
              </div>

              {/* Options A - D */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Answer Options & Correct Answer Key <span className="text-emerald-400">*</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Click radio button to mark correct key
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

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Question to Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CREATE EXAM / TEST MODAL */}
      {showCreateExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0b1329] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Create Examination / Test</h3>
                <p className="text-xs text-slate-400">
                  Create a new assessment to house question banks for an academic year
                </p>
              </div>
              <button
                onClick={() => setShowCreateExamModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateExamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExamForm({ ...examForm, examType: "Exam", totalMark: 70, passMark: 40 })}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                      examForm.examType === "Exam"
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    📋 Examination (Final / MidTerm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamForm({ ...examForm, examType: "Test", totalMark: 30, passMark: 15 })}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                      examForm.examType === "Test"
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    ⚡ Test / Continuous Assessment
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Examination Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026/2027 First Term Biology Midterm Test"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Academic Year <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    required
                    value={examForm.academicYear}
                    onChange={(e) => setExamForm({ ...examForm, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 [&>option]:text-slate-900 [&>option]:bg-white"
                  >
                    <option value="" disabled className="text-slate-900 bg-white">-- Select Year --</option>
                    {academicYears.map((y: any) => (
                      <option key={y._id} value={y._id} className="text-slate-900 bg-white">
                        {y.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Academic Term <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    required
                    value={examForm.academicTerm}
                    onChange={(e) => setExamForm({ ...examForm, academicTerm: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 [&>option]:text-slate-900 [&>option]:bg-white"
                  >
                    <option value="" disabled className="text-slate-900 bg-white">-- Select Term --</option>
                    {academicTerms.map((t: any) => (
                      <option key={t._id} value={t._id} className="text-slate-900 bg-white">
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Subject <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    required
                    value={examForm.subject}
                    onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 [&>option]:text-slate-900 [&>option]:bg-white"
                  >
                    <option value="" disabled className="text-slate-900 bg-white">-- Select Subject --</option>
                    {subjects.map((s: any) => (
                      <option key={s._id} value={s._id} className="text-slate-900 bg-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Class Level <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    required
                    value={examForm.classLevel}
                    onChange={(e) => setExamForm({ ...examForm, classLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 [&>option]:text-slate-900 [&>option]:bg-white"
                  >
                    <option value="" disabled className="text-slate-900 bg-white">-- Select Class Level --</option>
                    {classLevels.map((c: any) => (
                      <option key={c._id} value={c._id} className="text-slate-900 bg-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateExamModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? "Creating..." : "Save Examination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. VIEW QUESTION INSPECT MODAL */}
      {showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0b1329] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center text-sm font-bold">
                    👁️
                  </span>
                  <h3 className="text-xl font-bold text-white">Question Inspection</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Fetched via endpoint: <code className="text-teal-300">GET /api/v1/questions/:id</code>
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

            {!currentQuestion ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-300">Fetching question data...</p>
              </div>
            ) : (
              <div className="space-y-5">
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
                        ? new Date(currentQuestion.createdAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Question Statement
                  </span>
                  <div className="p-4 rounded-2xl bg-[#1e293b]/70 border border-white/10 text-white text-base font-semibold">
                    {currentQuestion.question}
                  </div>
                </div>

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

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      dispatch(clearCurrentQuestion());
                    }}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-medium"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(currentQuestion)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                  >
                    Edit this Question
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. EDIT QUESTION MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0b1329] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-sm font-bold">
                    ✏️
                  </span>
                  <h3 className="text-xl font-bold text-white">Edit Question</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Update question statement, options, or designated answer key
                </p>
              </div>

              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Question Statement <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Options & Correct Key <span className="text-emerald-400">*</span>
                </span>

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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20"
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
