import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchAllTeachers, registerTeacher, suspendTeacher, withdrawTeacher, unwithdrawTeacher, unsuspendTeacher, updateTeacherAdmin } from "../../features/teachers/teachersSlice";

interface Teacher {
  _id: string;
  name: string;
  email: string;
  teacherId?: string;
  subject?: string;
  classLevel?: string;
  program?: string;
  applicationStatus?: "pending" | "approved" | "rejected";
  isSuspended?: boolean;
  isWithdrawn?: boolean;
  isWithDrawn?: boolean;
  dateEmployed?: string;
}

export default function TeachersList() {
  const dispatch = useAppDispatch();
  const { teachers, loading, error } = useAppSelector((s) => s.teachers);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", subject: "", classLevel: "", program: "" });
  const [editTeacherForm, setEditTeacherForm] = useState({
    program: "",
    subject: "",
    classLevel: "",
    academicYear: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { dispatch(fetchAllTeachers()); }, [dispatch]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filtered = teachers.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.teacherId?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedTeachers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await dispatch(registerTeacher(form));
    setSubmitting(false);
    setShowModal(false);
    setForm({ name: "", email: "", password: "", subject: "", classLevel: "", program: "" });
  };

  const openEditTeacherModal = (t: Teacher) => {
    setEditingTeacher(t);
    setEditTeacherForm({
      program: t.program || "",
      subject: t.subject || "",
      classLevel: t.classLevel || "",
      academicYear: (t as any).academicYear || "",
    });
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setSubmitting(true);
    await dispatch(updateTeacherAdmin({ id: editingTeacher._id, updates: editTeacherForm }));
    setSubmitting(false);
    setEditingTeacher(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Teachers</h1>
          <p className="text-slate-400 text-sm mt-1">{teachers.length} total teachers</p>
        </div>
        <button
          id="add-teacher-btn"
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Register Teacher
        </button>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          id="teacher-search"
          type="text"
          placeholder="Search by name, email or subject..."
          value={search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-dark-500 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
        />
      </div>

      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Teacher</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">ID</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Subject</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Class Level</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Application</th>
                <th className="text-right px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-white/10 rounded animate-pulse w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500">{search ? `No results for "${search}"` : "No teachers registered yet."}</td></tr>
              ) : (
                paginatedTeachers.map((t, i) => (
                  <tr key={t._id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                          {t.name?.[0]?.toUpperCase() || "T"}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{t.name}</p>
                          <p className="text-slate-400 text-xs">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm font-mono">{t.teacherId || "—"}</td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{t.subject || "—"}</td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{t.classLevel || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        t.applicationStatus === "approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                        t.applicationStatus === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}>
                        {t.applicationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedTeacher(t as Teacher)}
                          className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-medium transition-all border border-violet-500/30"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditTeacherModal(t as Teacher)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium transition-all border border-indigo-500/30 flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => dispatch(t.isSuspended ? unsuspendTeacher(t._id) : suspendTeacher(t._id))}
                          title={t.isSuspended ? "Unsuspend Teacher" : "Suspend Teacher"}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            t.isSuspended
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                              : "text-amber-400 hover:bg-amber-500/10 border-amber-500/20"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </button>
                        <button
                          onClick={() => dispatch((t.isWithDrawn || t.isWithdrawn) ? unwithdrawTeacher(t._id) : withdrawTeacher(t._id))}
                          title={(t.isWithDrawn || t.isWithdrawn) ? "Unwithdraw Teacher" : "Withdraw Teacher"}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            (t.isWithDrawn || t.isWithdrawn)
                              ? "bg-red-500/20 text-red-300 border-red-500/50"
                              : "text-red-400 hover:bg-red-500/10 border-red-500/20"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
            <p className="text-slate-400 text-sm">
              Showing <span className="font-semibold text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-semibold text-white">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of{" "}
              <span className="font-semibold text-white">{filtered.length}</span> teachers
            </p>

            <div className="flex items-center gap-2">
              <button
                id="pagination-back-btn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-white text-sm font-medium transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === page
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/30"
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                id="pagination-next-btn"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-white text-sm font-medium transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Teacher Detail Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {selectedTeacher.name?.[0]?.toUpperCase() || "T"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedTeacher.name}</h2>
                  <p className="text-slate-400 text-sm">{selectedTeacher.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTeacher(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Teacher ID", value: selectedTeacher.teacherId || "N/A" },
                { label: "Subject", value: selectedTeacher.subject || "N/A" },
                { label: "Class Level", value: selectedTeacher.classLevel || "N/A" },
                { label: "Program", value: selectedTeacher.program || "N/A" },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <p className="text-slate-500 text-xs font-medium">{item.label}</p>
                  <p className="text-white text-sm font-semibold mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  dispatch(selectedTeacher.isSuspended ? unsuspendTeacher(selectedTeacher._id) : suspendTeacher(selectedTeacher._id));
                  setSelectedTeacher(null);
                }}
                className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-colors ${
                  selectedTeacher.isSuspended
                    ? "bg-amber-600/30 border-amber-500/50 text-amber-200"
                    : "bg-amber-600/20 hover:bg-amber-600/40 border-amber-500/30 text-amber-300"
                }`}
              >
                {selectedTeacher.isSuspended ? "Unsuspend" : "Suspend"}
              </button>
              <button
                onClick={() => {
                  dispatch((selectedTeacher.isWithDrawn || selectedTeacher.isWithdrawn) ? unwithdrawTeacher(selectedTeacher._id) : withdrawTeacher(selectedTeacher._id));
                  setSelectedTeacher(null);
                }}
                className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-colors ${
                  (selectedTeacher.isWithDrawn || selectedTeacher.isWithdrawn)
                    ? "bg-red-600/30 border-red-500/50 text-red-200"
                    : "bg-red-600/20 hover:bg-red-600/40 border-red-500/30 text-red-300"
                }`}
              >
                {(selectedTeacher.isWithDrawn || selectedTeacher.isWithdrawn) ? "Unwithdraw" : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Update Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Update Teacher (Admin)</h2>
              <button onClick={() => setEditingTeacher(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleUpdateTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={editTeacherForm.subject}
                    onChange={(e) => setEditTeacherForm({ ...editTeacherForm, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Class Level</label>
                  <input
                    type="text"
                    placeholder="e.g. Level 100"
                    value={editTeacherForm.classLevel}
                    onChange={(e) => setEditTeacherForm({ ...editTeacherForm, classLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Program</label>
                  <input
                    type="text"
                    placeholder="Program"
                    value={editTeacherForm.program}
                    onChange={(e) => setEditTeacherForm({ ...editTeacherForm, program: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Academic Year</label>
                  <input
                    type="text"
                    placeholder="Academic Year"
                    value={editTeacherForm.academicYear}
                    onChange={(e) => setEditTeacherForm({ ...editTeacherForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-md shadow-violet-500/30"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Register Teacher</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "Jane Smith" },
                { label: "Email", key: "email", type: "email", placeholder: "jane@school.edu" },
                { label: "Password", key: "password", type: "password", placeholder: "••••••••" },
                { label: "Subject", key: "subject", type: "text", placeholder: "Mathematics" },
                { label: "Class Level", key: "classLevel", type: "text", placeholder: "Level 200" },
                { label: "Program", key: "program", type: "text", placeholder: "Science" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{f.label}</label>
                  <input
                    id={`teacher-${f.key}`}
                    type={f.type}
                    required={["name", "email", "password"].includes(f.key)}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
                  />
                </div>
              ))}
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
                <button
                  type="submit"
                  id="teacher-register-submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
