import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchExams, createExam, deleteExam, publishExamResult } from "../../features/exams/examsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import { fetchSubjects } from "../../features/subjects/subjectsSlice";
import { fetchPrograms } from "../../features/programs/programsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";
import StudentWriteExam from "../student/StudentWriteExam";

export default function ExamsList() {
  const userRole = localStorage.getItem("userRole");
  if (userRole === "student") {
    return <StudentWriteExam />;
  }

  const dispatch = useAppDispatch();
  const { items: exams, loading, error } = useAppSelector((s) => s.exams);
  const { items: classLevels } = useAppSelector((s) => s.classLevels);
  const { items: subjects } = useAppSelector((s) => s.subjects);
  const { items: programs } = useAppSelector((s) => s.programs);
  const { items: academicTerms } = useAppSelector((s) => s.academicTerms);
  const { items: academicYears } = useAppSelector((s) => s.academicYears);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "pending">("all");
  const [classLevelFilter, setClassLevelFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    subject: "",
    program: "",
    classLevel: "",
    academicTerm: "",
    academicYear: "",
    duration: "1 hr",
    examType: "Quiz",
    examDate: "",
    examTime: "10:00 AM",
    passMark: 50,
    totalMark: 100,
  });

  useEffect(() => {
    dispatch(fetchExams());
    dispatch(fetchClassLevels());
    dispatch(fetchSubjects());
    dispatch(fetchPrograms());
    dispatch(fetchAcademicTerms());
    dispatch(fetchAcademicYears());
  }, [dispatch]);

  const filtered = useMemo(() => {
    return exams.filter((e) => {
      const q = search.toLowerCase().trim();
      const creatorName = (e.createdBy?.name || (e.createdBy?.role === "admin" ? "admin school administration" : "")).toLowerCase();
      const creatorId = (e.createdBy?.teacherId || "").toLowerCase();
      const classLevelName = (e.classLevel?.name || (typeof e.classLevel === "string" ? e.classLevel : "")).toLowerCase();
      const subjectName = (e.subject?.name || "").toLowerCase();

      const matchSearch =
        !q ||
        e.name?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        creatorName.includes(q) ||
        creatorId.includes(q) ||
        classLevelName.includes(q) ||
        subjectName.includes(q);

      const matchStatus = filter === "all" || e.examStatus === filter;

      const matchClassLevel =
        classLevelFilter === "all" ||
        (e.classLevel?._id || e.classLevel)?.toString() === classLevelFilter;

      return matchSearch && matchStatus && matchClassLevel;
    });
  }, [exams, search, filter, classLevelFilter]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await dispatch(createExam(form));
    setSubmitting(false);
    setShowModal(false);
    setForm({
      name: "",
      description: "",
      subject: "",
      program: "",
      classLevel: "",
      academicTerm: "",
      academicYear: "",
      duration: "1 hr",
      examType: "Quiz",
      examDate: "",
      examTime: "10:00 AM",
      passMark: 50,
      totalMark: 100,
    });
    dispatch(fetchExams());
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-lg">📝</span>
            Manage Exams
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {exams.length} total exams · {exams.filter(e => e.examStatus === "live").length} live · {exams.filter(e => e.examStatus === "pending").length} pending
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/teacher-exams"
            className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Teacher Exams
          </Link>
          <Link
            to="/admin/questions"
            className="px-4 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Question Bank
          </Link>
          <Link
            to="/admin/results"
            className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Student Results
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-sm transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Exam
          </button>
        </div>
      </div>

      {/* Filters Bar: Search, Class Level Filter, Status Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="exam-search"
            type="text"
            placeholder="Search by exam title, teacher name, class level, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm"
          />
        </div>

        {/* Class Level Dropdown Filter */}
        <select
          value={classLevelFilter}
          onChange={(e) => setClassLevelFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 transition-all"
        >
          <option value="all">🎓 All Class Levels</option>
          {classLevels.map((c: any) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        {/* Status Pills */}
        <div className="flex gap-2">
          {[{ key: "all" as const, label: "All Status" }, { key: "live" as const, label: "🟢 Live" }, { key: "pending" as const, label: "🟡 Pending" }].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === f.key ? "bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20" : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 bg-white/10 rounded-2xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center text-slate-400 text-sm py-16 bg-white/5 border border-white/10 rounded-2xl space-y-2">
            <span className="text-4xl block">📋</span>
            <p className="font-semibold text-white">No exams match your search</p>
            <p className="text-xs text-slate-500">Try adjusting your filters or click "+ Create Exam" to create a new exam.</p>
          </div>
        ) : (
          filtered.map((exam, i) => {
            const teacherName = exam.createdBy?.name || (exam.createdBy?.role === "admin" ? "School Administration" : "Unassigned");
            const isCreatedByAdmin = exam.createdBy?.role === "admin" || (!exam.createdBy?.teacherId && !exam.createdBy?.role);
            const classLevelName = exam.classLevel?.name || (typeof exam.classLevel === "string" ? exam.classLevel : "All Levels");

            return (
              <div key={exam._id || i} className="bg-white/5 border border-white/10 hover:border-amber-500/40 rounded-2xl p-5 transition-all group space-y-4 shadow-xl flex flex-col justify-between">
                <div className="space-y-3.5">
                  {/* Top Badges: Status, Exam Type, Class Level */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${exam.examStatus === "live" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}>
                        {exam.examStatus === "live" ? "🟢 Live" : "🟡 Pending"}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs border border-white/10 font-medium">
                        {exam.examType || "Quiz"}
                      </span>
                    </div>

                    {/* Class Level Badge */}
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1">
                      <span>🎯</span>
                      <span>{classLevelName}</span>
                    </span>
                  </div>

                  {/* Exam Title & Description */}
                  <div>
                    <h3 className="text-white font-bold text-base truncate group-hover:text-amber-300 transition-colors">
                      {exam.name}
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                      {exam.description || "No description provided."}
                    </p>
                  </div>

                  {/* PROMINENT TEACHER & CLASS LEVEL CARD ROW */}
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      {/* Teacher / Author Information */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCreatedByAdmin
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>
                          {isCreatedByAdmin ? "🏛️" : (teacherName.charAt(0).toUpperCase() || "👨‍🏫")}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Teacher / Author</span>
                          <span className="text-white font-semibold truncate block text-xs">
                            {teacherName}
                          </span>
                          {exam.createdBy?.teacherId && (
                            <span className="text-[10px] text-amber-400 font-mono block">ID: {exam.createdBy.teacherId}</span>
                          )}
                        </div>
                      </div>

                      {/* Class Level */}
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Class Level</span>
                        <span className="text-cyan-300 font-bold block text-xs">
                          {classLevelName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "Subject", value: exam.subject?.name || "General" },
                      { label: "Program", value: exam.program?.name || "Curriculum" },
                      { label: "Pass / Total", value: `${exam.passMark || 50}% / ${exam.totalMark || 100}` },
                      { label: "Duration", value: exam.duration || "1 hr" },
                      { label: "Exam Date", value: exam.examDate ? new Date(exam.examDate).toLocaleDateString() : "TBD" },
                      { label: "Questions", value: `${exam.questions?.length || 0} Questions` },
                    ].map((d) => (
                      <div key={d.label} className="bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5">
                        <p className="text-slate-500 text-[10px] uppercase font-semibold">{d.label}</p>
                        <p className="text-white text-xs font-medium truncate">{d.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/10 mt-2">
                  <button
                    onClick={() => dispatch(publishExamResult(exam._id))}
                    className="flex-1 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>📢</span>
                    <span>Publish Results</span>
                  </button>
                  <button
                    onClick={() => { if (window.confirm("Are you sure you want to delete this exam?")) dispatch(deleteExam(exam._id)); }}
                    title="Delete Exam"
                    className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">Create New Exam</h2>
                <p className="text-xs text-slate-400 mt-0.5">Administer a school examination or quiz</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Mathematics Exam"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Covers Algebra, Calculus, and Geometry..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Class Level Dropdown */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Class Level *</label>
                  <select
                    required
                    value={form.classLevel}
                    onChange={(e) => setForm({ ...form, classLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  >
                    <option value="">Select Class Level</option>
                    {classLevels.map((c: any) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subject Dropdown */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Subject *</label>
                  <select
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s: any) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Program Dropdown */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Program *</label>
                  <select
                    required
                    value={form.program}
                    onChange={(e) => setForm({ ...form, program: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  >
                    <option value="">Select Program</option>
                    {programs.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Academic Term Dropdown */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Academic Term *</label>
                  <select
                    required
                    value={form.academicTerm}
                    onChange={(e) => setForm({ ...form, academicTerm: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  >
                    <option value="">Select Term</option>
                    {academicTerms.map((t: any) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Academic Year Dropdown */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Academic Year *</label>
                  <select
                    required
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  >
                    <option value="">Select Year</option>
                    {academicYears.map((y: any) => (
                      <option key={y._id} value={y._id}>{y.name}</option>
                    ))}
                  </select>
                </div>

                {/* Exam Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Exam Type</label>
                  <select
                    value={form.examType}
                    onChange={(e) => setForm({ ...form, examType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  >
                    {["Quiz", "MidTerm", "Final", "Assignment"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Exam Date *</label>
                  <input
                    type="date"
                    required
                    value={form.examDate}
                    onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Duration</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 1 hr"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Exam Time</label>
                  <input
                    type="text"
                    value={form.examTime}
                    onChange={(e) => setForm({ ...form, examTime: e.target.value })}
                    placeholder="e.g. 10:00 AM"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Pass Mark (%)</label>
                  <input
                    type="number"
                    value={form.passMark}
                    onChange={(e) => setForm({ ...form, passMark: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Total Mark</label>
                  <input
                    type="number"
                    value={form.totalMark}
                    onChange={(e) => setForm({ ...form, totalMark: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm disabled:opacity-50 shadow-lg shadow-amber-500/30"
                >
                  {submitting ? "Creating..." : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
