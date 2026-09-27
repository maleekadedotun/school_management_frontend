import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchExams, createExam, updateExam, deleteExam } from "../../features/exams/examsSlice";
import {
  fetchTeacherQuestions,
  createQuestion,
  updateQuestion,
} from "../../features/questions/questionsSlice";
import { fetchSubjects } from "../../features/subjects/subjectsSlice";
import { fetchPrograms } from "../../features/programs/programsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import { fetchTeacherProfile } from "../../features/teacherAuth/teacherAuthSlice";

const ITEMS_PER_PAGE = 10;

const EXAM_TYPES = ["Quiz", "MidTerm", "Final", "Assignment", "Practical"];

const emptyExamForm = {
  name: "",
  description: "",
  subject: "",
  program: "",
  academicTerm: "",
  duration: "",
  examDate: "",
  examTime: "",
  examType: "Quiz",
  classLevel: "",
  academicYear: "",
};

const emptyQForm = {
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "optionA",
};

export default function TeacherExamsManagement() {
  const dispatch = useAppDispatch();
  const { teacher } = useAppSelector((s) => s.teacherAuth);
  const { items: exams, loading, error } = useAppSelector((s) => s.exams);
  const { items: subjects } = useAppSelector((s) => s.subjects);
  const { items: programs } = useAppSelector((s) => s.programs);
  const { items: academicTerms } = useAppSelector((s) => s.academicTerms);
  const { items: academicYears } = useAppSelector((s) => s.academicYears);
  const { items: classLevels } = useAppSelector((s) => s.classLevels);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "pending">("all");
  const [viewScope, setViewScope] = useState<"my" | "all">("my");
  const [page, setPage] = useState(1);

  // Exam modal
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [examForm, setExamForm] = useState({ ...emptyExamForm });
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [examError, setExamError] = useState("");

  // View detail panel
  const [selectedExam, setSelectedExam] = useState<any | null>(null);

  // Question modal
  const [showQModal, setShowQModal] = useState(false);
  const [editingQ, setEditingQ] = useState<any | null>(null);
  const [qForm, setQForm] = useState({ ...emptyQForm });
  const [qSubmitting, setQSubmitting] = useState(false);
  const [qError, setQError] = useState("");

  useEffect(() => {
    dispatch(fetchTeacherProfile());
    dispatch(fetchExams());
    dispatch(fetchTeacherQuestions());
    dispatch(fetchSubjects());
    dispatch(fetchPrograms());
    dispatch(fetchAcademicTerms());
    dispatch(fetchAcademicYears());
    dispatch(fetchClassLevels());
  }, [dispatch]);

  const teacherId = teacher?._id || (teacher as any)?.id;

  const examsToFilter = useMemo(() => {
    if (viewScope === "all" || !teacherId) return exams;
    return exams.filter((e) => {
      const creatorId = e.createdBy?._id || e.createdBy;
      const isCreator = creatorId && creatorId.toString() === teacherId.toString();
      const inExamsCreated =
        Array.isArray((teacher as any)?.examsCreated) &&
        (teacher as any).examsCreated.some(
          (ex: any) => (ex?._id || ex)?.toString() === e._id?.toString()
        );
      return isCreator || inExamsCreated;
    });
  }, [exams, viewScope, teacherId, teacher]);

  const filtered = useMemo(() => {
    return examsToFilter.filter((e) => {
      const matchSearch =
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || e.examStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [examsToFilter, search, statusFilter]);

  const myExamsCount = useMemo(() => {
    if (!teacherId) return exams.length;
    return exams.filter((e) => {
      const creatorId = e.createdBy?._id || e.createdBy;
      const isCreator = creatorId && creatorId.toString() === teacherId.toString();
      const inExamsCreated =
        Array.isArray((teacher as any)?.examsCreated) &&
        (teacher as any).examsCreated.some(
          (ex: any) => (ex?._id || ex)?.toString() === e._id?.toString()
        );
      return isCreator || inExamsCreated;
    }).length;
  }, [exams, teacherId, teacher]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // ---- Exam CRUD ----
  const openCreateExam = () => {
    setEditingExam(null);
    setExamForm({ ...emptyExamForm });
    setExamError("");
    setShowExamModal(true);
  };
  const openEditExam = (exam: any) => {
    setEditingExam(exam);
    setExamForm({
      name: exam.name || "",
      description: exam.description || "",
      subject: exam.subject?._id || exam.subject || "",
      program: exam.program?._id || exam.program || "",
      academicTerm: exam.academicTerm?._id || exam.academicTerm || "",
      duration: exam.duration || "",
      examDate: exam.examDate ? exam.examDate.slice(0, 10) : "",
      examTime: exam.examTime || "",
      examType: exam.examType || "Quiz",
      classLevel: exam.classLevel?._id || exam.classLevel || "",
      academicYear: exam.academicYear?._id || exam.academicYear || "",
    });
    setExamError("");
    setShowExamModal(true);
  };
  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExamSubmitting(true);
    setExamError("");
    let result: any;
    if (editingExam) {
      result = await dispatch(updateExam({ id: editingExam._id, ...examForm }));
    } else {
      result = await dispatch(createExam(examForm));
    }
    setExamSubmitting(false);
    if (createExam.fulfilled.match(result) || updateExam.fulfilled.match(result)) {
      setShowExamModal(false);
      setEditingExam(null);
      dispatch(fetchExams());
    } else {
      setExamError((result.payload as string) || "Operation failed.");
    }
  };

  // ---- Question CRUD ----
  const openCreateQ = (exam: any) => {
    setSelectedExam(exam);
    setEditingQ(null);
    setQForm({ ...emptyQForm });
    setQError("");
    setShowQModal(true);
  };
  const handleQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQSubmitting(true);
    setQError("");
    let result: any;
    if (editingQ) {
      result = await dispatch(updateQuestion({ id: editingQ._id, ...qForm }));
    } else {
      result = await dispatch(createQuestion({ examId: selectedExam._id, ...qForm }));
    }
    setQSubmitting(false);
    if (createQuestion.fulfilled.match(result) || updateQuestion.fulfilled.match(result)) {
      setShowQModal(false);
      setEditingQ(null);
      dispatch(fetchTeacherQuestions());
    } else {
      setQError((result.payload as string) || "Operation failed.");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📝</span> My Exams
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {exams.length} total · {exams.filter((e) => e.examStatus === "live").length} live ·{" "}
            {exams.filter((e) => e.examStatus === "pending").length} pending
          </p>
        </div>
        <button
          onClick={openCreateExam}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 w-fit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Exam
        </button>
      </div>

      {/* Scope Selector: My Created Exams vs All School Exams */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setViewScope("my"); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              viewScope === "my"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>📝</span>
            <span>My Created Exams</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              viewScope === "my" ? "bg-black/20 text-black" : "bg-white/10 text-slate-300"
            }`}>
              {myExamsCount}
            </span>
          </button>

          <button
            onClick={() => { setViewScope("all"); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              viewScope === "all"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>🏫</span>
            <span>All School Exams</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              viewScope === "all" ? "bg-black/20 text-black" : "bg-white/10 text-slate-300"
            }`}>
              {exams.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-400 px-3">
          {viewScope === "my" ? "Showing exams authored by you" : "Showing all exams across the institution"}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search exams by title, description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "live", "pending"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize cursor-pointer ${
                statusFilter === f
                  ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"
              }`}
            >
              {f === "live" ? "🟢 Live" : f === "pending" ? "🟡 Pending" : "All Status"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {/* Exams List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="text-4xl">📝</span>
            <h3 className="mt-3 text-white font-semibold text-lg">No Exams Found</h3>
            <p className="mt-1 text-slate-400 text-sm">Click "Create Exam" to add your first exam.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-4">Exam</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Duration</th>
                  <th className="px-5 py-4">Questions</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {paginated.map((exam) => (
                  <tr key={exam._id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-white">{exam.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{exam.description || "—"}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {exam.examType || "Quiz"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : "—"}
                      {exam.examTime && <span className="block text-xs text-slate-500">{exam.examTime}</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-300">{exam.duration || "—"}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openCreateQ(exam)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium hover:bg-teal-500/20 transition-all"
                      >
                        <span>{exam.questions?.length ?? 0}</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Q
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        exam.examStatus === "live"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}>
                        {exam.examStatus === "live" ? "🟢 Live" : "🟡 Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditExam(exam)}
                          className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Edit Exam"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { if (window.confirm("Delete this exam?")) dispatch(deleteExam(exam._id)); }}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Exam"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {page} of {totalPages} · {filtered.length} exams
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Back
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ---- Create / Edit Exam Modal ---- */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-white">{editingExam ? "Edit Exam" : "Create Exam"}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingExam ? "Update exam details" : "Fill in the exam details below"}
                </p>
              </div>
              <button onClick={() => setShowExamModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {examError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{examError}</div>
              )}
              <form onSubmit={handleExamSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Exam Title *</label>
                    <input type="text" required value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                      placeholder="e.g. Mid-Term Mathematics" className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                  </div>
                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea rows={2} value={examForm.description} onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                      placeholder="What does this exam cover?" className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                  </div>
                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject</label>
                    <select value={examForm.subject} onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all">
                      <option value="">Select Subject</option>
                      {subjects.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  {/* Program */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Program</label>
                    <select value={examForm.program} onChange={(e) => setExamForm({ ...examForm, program: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all">
                      <option value="">Select Program</option>
                      {programs.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  {/* Academic Term */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Academic Term</label>
                    <select value={examForm.academicTerm} onChange={(e) => setExamForm({ ...examForm, academicTerm: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all">
                      <option value="">Select Term</option>
                      {academicTerms.map((t: any) => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                  {/* Academic Year */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Academic Year</label>
                    <select value={examForm.academicYear} onChange={(e) => setExamForm({ ...examForm, academicYear: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all">
                      <option value="">Select Year</option>
                      {academicYears.map((y: any) => <option key={y._id} value={y._id}>{y.name}</option>)}
                    </select>
                  </div>
                  {/* Class Level */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Class Level</label>
                    <select value={examForm.classLevel} onChange={(e) => setExamForm({ ...examForm, classLevel: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all">
                      <option value="">Select Class Level</option>
                      {classLevels.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  {/* Exam Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Exam Type</label>
                    <select value={examForm.examType} onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all">
                      {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {/* Exam Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Exam Date</label>
                    <input type="date" value={examForm.examDate} onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                  </div>
                  {/* Exam Time */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Exam Time</label>
                    <input type="text" value={examForm.examTime} onChange={(e) => setExamForm({ ...examForm, examTime: e.target.value })}
                      placeholder="e.g. 10:00 AM" className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                  </div>
                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Duration</label>
                    <input type="text" value={examForm.duration} onChange={(e) => setExamForm({ ...examForm, duration: e.target.value })}
                      placeholder="e.g. 2 hours" className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button type="button" onClick={() => setShowExamModal(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={examSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20">
                    {examSubmitting ? (editingExam ? "Updating..." : "Creating...") : editingExam ? "Update Exam" : "Create Exam"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---- Create / Edit Question Modal ---- */}
      {showQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-white">{editingQ ? "Edit Question" : "Add Question"}</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">
                  Exam: {selectedExam?.name}
                </p>
              </div>
              <button onClick={() => setShowQModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {qError && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{qError}</div>}
              <form onSubmit={handleQSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Question Text *</label>
                  <textarea rows={3} required value={qForm.question} onChange={(e) => setQForm({ ...qForm, question: e.target.value })}
                    placeholder="Enter your question here..." className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 transition-all" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(["optionA", "optionB", "optionC", "optionD"] as const).map((opt, idx) => (
                    <div key={opt}>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Option {["A", "B", "C", "D"][idx]} *
                      </label>
                      <input type="text" required value={qForm[opt]} onChange={(e) => setQForm({ ...qForm, [opt]: e.target.value })}
                        placeholder={`Option ${["A", "B", "C", "D"][idx]}`}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 transition-all" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Correct Answer *</label>
                  <select required value={qForm.correctAnswer} onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-teal-500 transition-all">
                    {["optionA", "optionB", "optionC", "optionD"].map((opt, idx) => (
                      <option key={opt} value={opt}>Option {["A", "B", "C", "D"][idx]} — {qForm[opt as keyof typeof qForm] || "(empty)"}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button type="button" onClick={() => setShowQModal(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={qSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-teal-500/20">
                    {qSubmitting ? (editingQ ? "Updating..." : "Adding...") : editingQ ? "Update Question" : "Add Question"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
