import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchExams, createExam, deleteExam, publishExamResult } from "../../features/exams/examsSlice";

export default function ExamsList() {
  const dispatch = useAppDispatch();
  const { items: exams, loading, error } = useAppSelector((s) => s.exams);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "pending">("all");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    examType: "Quiz",
    examDate: "",
    examTime: "10:00 AM",
    passMark: 50,
    totalMark: 100,
  });

  useEffect(() => { dispatch(fetchExams()); }, [dispatch]);

  const filtered = exams.filter((e) => {
    const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || e.examStatus === filter;
    return matchSearch && matchFilter;
  });

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await dispatch(createExam(form));
    setSubmitting(false);
    setShowModal(false);
    setForm({ name: "", description: "", examType: "Quiz", examDate: "", examTime: "10:00 AM", passMark: 50, totalMark: 100 });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Exams</h1>
          <p className="text-slate-400 text-sm mt-1">
            {exams.length} total · {exams.filter(e => e.examStatus === "live").length} live · {exams.filter(e => e.examStatus === "pending").length} pending
          </p>
        </div>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="exam-search"
            type="text"
            placeholder="Search exams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {[{ key: "all" as const, label: "All" }, { key: "live" as const, label: "🟢 Live" }, { key: "pending" as const, label: "🟡 Pending" }].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === f.key ? "bg-amber-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-white/10 rounded-2xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center text-slate-500 text-sm py-16 bg-white/5 border border-white/10 rounded-2xl">
            No exams found. Click "+ Create Exam" to create one.
          </div>
        ) : (
          filtered.map((exam, i) => (
            <div key={exam._id || i} className="bg-white/5 border border-white/10 hover:border-amber-500/40 rounded-2xl p-5 transition-all group space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${exam.examStatus === "live" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}>
                      {exam.examStatus === "live" ? "🟢 Live" : "🟡 Pending"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-400 text-xs border border-white/10">{exam.examType || "Quiz"}</span>
                  </div>
                  <h3 className="text-white font-semibold text-base truncate">{exam.name}</h3>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2">{exam.description || "No description provided"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Pass Mark", value: `${exam.passMark || 50}%` },
                  { label: "Total Mark", value: `${exam.totalMark || 100}` },
                  { label: "Duration", value: exam.duration || "1 hr" },
                  { label: "Exam Date", value: exam.examDate ? new Date(exam.examDate).toLocaleDateString() : "TBD" },
                ].map((d) => (
                  <div key={d.label} className="bg-white/5 border border-white/5 rounded-lg px-3 py-2">
                    <p className="text-slate-500 text-xs">{d.label}</p>
                    <p className="text-white text-sm font-medium">{d.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => dispatch(publishExamResult(exam._id))}
                  className="flex-1 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-all"
                >
                  Publish Results
                </button>
                <button
                  onClick={() => dispatch(deleteExam(exam._id))}
                  title="Delete Exam"
                  className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create Exam</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Exam Title</label>
                <input
                  type="text"
                  required
                  placeholder="Mid-Term Mathematics Exam"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Covers Algebra, Calculus, and Geometry..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Exam Type</label>
                  <select
                    value={form.examType}
                    onChange={(e) => setForm({ ...form, examType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0f1629] border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  >
                    {["Quiz", "MidTerm", "Final", "Assignment"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Exam Date</label>
                  <input
                    type="date"
                    required
                    value={form.examDate}
                    onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Pass Mark (%)</label>
                  <input
                    type="number"
                    value={form.passMark}
                    onChange={(e) => setForm({ ...form, passMark: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Total Mark</label>
                  <input
                    type="number"
                    value={form.totalMark}
                    onChange={(e) => setForm({ ...form, totalMark: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
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
