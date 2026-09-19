import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchPrograms, createProgram, deleteProgram } from "../../features/programs/programsSlice";
import { fetchSubjects, createSubject, deleteSubject } from "../../features/subjects/subjectsSlice";

export default function ProgramsSubjects() {
  const dispatch = useAppDispatch();
  const { items: programs, loading: pLoading } = useAppSelector((s) => s.programs);
  const { items: subjects, loading: sLoading } = useAppSelector((s) => s.subjects);
  const [activeTab, setActiveTab] = useState<"programs" | "subjects">("programs");
  const [showForm, setShowForm] = useState(false);
  const [pForm, setPForm] = useState({ name: "", description: "", duration: "4 years" });
  const [sForm, setSForm] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchPrograms());
    dispatch(fetchSubjects());
  }, [dispatch]);

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await dispatch(createProgram(pForm));
    setSubmitting(false);
    setShowForm(false);
    setPForm({ name: "", description: "", duration: "4 years" });
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await dispatch(createSubject(sForm));
    setSubmitting(false);
    setShowForm(false);
    setSForm({ name: "", description: "" });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Programs & Subjects</h1>
        <p className="text-slate-400 text-sm mt-1">Manage academic programs and course subjects</p>
      </div>

      <div className="flex gap-2">
        {[{ key: "programs" as const, label: "📚 Programs", count: programs.length },
          { key: "subjects" as const, label: "📖 Subjects", count: subjects.length }].map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setShowForm(false); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === t.key ? "bg-emerald-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"}`}
          >
            {t.label} <span className="ml-1 text-xs opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {activeTab === "programs" && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium transition-all">
              {showForm ? "Cancel" : "+ Add Program"}
            </button>
          </div>
          {showForm && (
            <form onSubmit={handleProgramSubmit} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[{ key: "name", label: "Program Name", placeholder: "Computer Science" },
                  { key: "description", label: "Description", placeholder: "Program description" },
                  { key: "duration", label: "Duration", placeholder: "4 years" }].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-slate-400 mb-1">{f.label}</label>
                    <input type="text" required placeholder={f.placeholder} value={(pForm as any)[f.key]} onChange={(e) => setPForm({ ...pForm, [f.key]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                  </div>
                ))}
              </div>
              <button type="submit" disabled={submitting} className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">
                {submitting ? "Creating..." : "Create Program"}
              </button>
            </form>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-white/10 rounded-2xl animate-pulse" />) :
              programs.length === 0 ? <p className="text-slate-500 text-sm col-span-3 text-center py-10">No programs created yet.</p> :
              programs.map((p, i) => (
                <div key={p._id || i} className="bg-white/5 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-5 transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm mb-3">
                      {p.name?.[0]?.toUpperCase()}
                    </div>
                    <button onClick={() => dispatch(deleteProgram(p._id))} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <h3 className="text-white font-semibold mb-1">{p.name}</h3>
                  <p className="text-slate-400 text-xs mb-3 line-clamp-2">{p.description}</p>
                  <div className="flex gap-2">
                    {p.code && <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono">{p.code}</span>}
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-400 text-xs">{p.duration}</span>
                  </div>
                  {(p.students?.length > 0 || p.teachers?.length > 0) && (
                    <div className="flex gap-3 mt-3 pt-3 border-t border-white/10">
                      <span className="text-xs text-slate-400">{p.students?.length || 0} students</span>
                      <span className="text-xs text-slate-400">{p.teachers?.length || 0} teachers</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </>
      )}

      {activeTab === "subjects" && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium transition-all">
              {showForm ? "Cancel" : "+ Add Subject"}
            </button>
          </div>
          {showForm && (
            <form onSubmit={handleSubjectSubmit} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[{ key: "name", label: "Subject Name", placeholder: "Mathematics" },
                  { key: "description", label: "Description", placeholder: "Subject description" }].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-slate-400 mb-1">{f.label}</label>
                    <input type="text" required placeholder={f.placeholder} value={(sForm as any)[f.key]} onChange={(e) => setSForm({ ...sForm, [f.key]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                  </div>
                ))}
              </div>
              <button type="submit" disabled={submitting} className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50">
                {submitting ? "Creating..." : "Create Subject"}
              </button>
            </form>
          )}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {sLoading ? <div className="p-6"><div className="h-10 bg-white/10 rounded animate-pulse" /></div> :
              subjects.length === 0 ? <p className="px-6 py-12 text-center text-slate-500 text-sm">No subjects created yet.</p> : (
              <table className="w-full">
                <thead><tr className="border-b border-white/10"><th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Name</th><th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Description</th><th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Created</th><th className="px-6 py-3" /></tr></thead>
                <tbody>
                  {subjects.map((s, i) => (
                    <tr key={s._id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3 text-white font-medium text-sm">{s.name}</td>
                      <td className="px-6 py-3 text-slate-400 text-sm">{s.description || "—"}</td>
                      <td className="px-6 py-3 text-slate-400 text-sm">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => dispatch(deleteSubject(s._id))} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
