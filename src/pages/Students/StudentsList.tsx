import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchAllStudents, registerStudent, updateStudentAdmin, suspendStudent, unsuspendStudent, withdrawStudent, unwithdrawStudent } from "../../features/students/studentsSlice";

interface Student {
  _id: string;
  name: string;
  email: string;
  StudentId?: string;
  currentClassLevel?: string;
  program?: { name: string } | string;
  isSuspended?: boolean;
  isWithDrawn?: boolean;
  isGraduated?: boolean;
  dateAdmitted?: string;
  academicYear?: { name: string } | string;
}

export default function StudentsList() {
  const dispatch = useAppDispatch();
  const { students, loading, error } = useAppSelector((s) => s.students);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", classLevels: "Level 100" });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    classLevels: "",
    prefectName: "",
    program: "",
    academicYear: "",
    isSuspended: false,
    isWithDrawn: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => { dispatch(fetchAllStudents()); }, [dispatch]);

  const filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.StudentId?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedStudents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await dispatch(registerStudent({ ...form, classLevels: [form.classLevels] }));
    setSubmitting(false);
    setShowModal(false);
    setForm({ name: "", email: "", password: "", classLevels: "Level 100" });
  };

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    setEditForm({
      name: s.name || "",
      email: s.email || "",
      classLevels: s.currentClassLevel || "",
      prefectName: (s as any).prefectName || "",
      program: typeof s.program === "object" ? s.program?.name || "" : (s.program || ""),
      academicYear: typeof s.academicYear === "object" ? s.academicYear?.name || "" : (s.academicYear || ""),
      isSuspended: !!s.isSuspended,
      isWithDrawn: !!s.isWithDrawn,
    });
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSubmitting(true);
    await dispatch(updateStudentAdmin({ id: editingStudent._id, updates: editForm }));
    setSubmitting(false);
    setEditingStudent(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-slate-400 text-sm mt-1">{students.length} total students enrolled</p>
        </div>
        <button
          id="add-student-btn"
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Register Student
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          id="student-search"
          type="text"
          placeholder="Search by name, email or ID..."
          value={search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-dark-500 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Error */}
      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      {/* Table */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">ID</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Class Level</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Program</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Admitted</th>
                <th className="text-right px-6 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    {search ? `No results for "${search}"` : "No students registered yet."}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s, i) => (
                  <tr key={s._id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                          {s.name?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{s.name}</p>
                          <p className="text-slate-400 text-xs">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm font-mono">{s.StudentId || "—"}</td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{s.currentClassLevel || "—"}</td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{typeof s.program === "object" ? s.program?.name : (s.program || "—")}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        s.isSuspended ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        s.isWithDrawn ? "bg-slate-500/20 text-slate-400 border border-slate-500/30" :
                        s.isGraduated ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" :
                        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {s.isSuspended ? "Suspended" : s.isWithDrawn ? "Withdrawn" : s.isGraduated ? "Graduated" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {s.dateAdmitted ? new Date(s.dateAdmitted).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedStudent(s as Student)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium transition-all border border-indigo-500/30"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => openEditModal(s as Student)}
                          className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-medium transition-all border border-violet-500/30 flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => dispatch(s.isSuspended ? unsuspendStudent(s._id) : suspendStudent(s._id))}
                          title={s.isSuspended ? "Unsuspend Student" : "Suspend Student"}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            s.isSuspended
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                              : "text-amber-400 hover:bg-amber-500/10 border-amber-500/20"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </button>
                        <button
                          onClick={() => dispatch(s.isWithDrawn ? unwithdrawStudent(s._id) : withdrawStudent(s._id))}
                          title={s.isWithDrawn ? "Unwithdraw Student" : "Withdraw Student"}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            s.isWithDrawn
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
              <span className="font-semibold text-white">{filtered.length}</span> students
            </p>

            <div className="flex items-center gap-2">
              <button
                id="student-pagination-back-btn"
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
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30"
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                id="student-pagination-next-btn"
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

      {/* Student Profile Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {selectedStudent.name?.[0]?.toUpperCase() || "S"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedStudent.name}</h2>
                  <p className="text-slate-400 text-sm">{selectedStudent.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Student ID", value: selectedStudent.StudentId || "N/A" },
                { label: "Class Level", value: selectedStudent.currentClassLevel || "N/A" },
                { label: "Program", value: typeof selectedStudent.program === "object" ? selectedStudent.program?.name : (selectedStudent.program || "N/A") },
                { label: "Date Admitted", value: selectedStudent.dateAdmitted ? new Date(selectedStudent.dateAdmitted).toLocaleDateString() : "N/A" },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <p className="text-slate-500 text-xs font-medium">{item.label}</p>
                  <p className="text-white text-sm font-semibold mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Status Information</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Enrollment Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  selectedStudent.isSuspended ? "bg-red-500/20 text-red-400" :
                  selectedStudent.isWithDrawn ? "bg-slate-500/20 text-slate-400" :
                  selectedStudent.isGraduated ? "bg-violet-500/20 text-violet-400" :
                  "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {selectedStudent.isSuspended ? "Suspended" : selectedStudent.isWithDrawn ? "Withdrawn" : selectedStudent.isGraduated ? "Graduated" : "Active"}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  dispatch(selectedStudent.isSuspended ? unsuspendStudent(selectedStudent._id) : suspendStudent(selectedStudent._id));
                  setSelectedStudent(null);
                }}
                className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-colors ${
                  selectedStudent.isSuspended
                    ? "bg-amber-600/30 border-amber-500/50 text-amber-200"
                    : "bg-amber-600/20 hover:bg-amber-600/40 border-amber-500/30 text-amber-300"
                }`}
              >
                {selectedStudent.isSuspended ? "Unsuspend" : "Suspend"}
              </button>
              <button
                onClick={() => {
                  dispatch(selectedStudent.isWithDrawn ? unwithdrawStudent(selectedStudent._id) : withdrawStudent(selectedStudent._id));
                  setSelectedStudent(null);
                }}
                className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-colors ${
                  selectedStudent.isWithDrawn
                    ? "bg-red-600/30 border-red-500/50 text-red-200"
                    : "bg-red-600/20 hover:bg-red-600/40 border-red-500/30 text-red-300"
                }`}
              >
                {selectedStudent.isWithDrawn ? "Unwithdraw" : "Withdraw"}
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Update Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Update Student (Admin)</h2>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Class Level</label>
                  <input
                    type="text"
                    placeholder="e.g. Level 100"
                    value={editForm.classLevels}
                    onChange={(e) => setEditForm({ ...editForm, classLevels: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Prefect Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Head Boy"
                    value={editForm.prefectName}
                    onChange={(e) => setEditForm({ ...editForm, prefectName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Program ID / Name</label>
                  <input
                    type="text"
                    placeholder="Program"
                    value={editForm.program}
                    onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Academic Year</label>
                  <input
                    type="text"
                    placeholder="Academic Year"
                    value={editForm.academicYear}
                    onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isSuspended}
                    onChange={(e) => setEditForm({ ...editForm, isSuspended: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-500"
                  />
                  Is Suspended
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isWithDrawn}
                    onChange={(e) => setEditForm({ ...editForm, isWithDrawn: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-500"
                  />
                  Is Withdrawn
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-500/30"
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
              <h2 className="text-xl font-bold text-white">Register Student</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "John Doe" },
                { label: "Email", key: "email", type: "email", placeholder: "john@school.edu" },
                { label: "Password", key: "password", type: "password", placeholder: "••••••••" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{f.label}</label>
                  <input
                    id={`student-${f.key}`}
                    type={f.type}
                    required
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Class Level</label>
                <select
                  id="student-classLevel"
                  value={form.classLevels}
                  onChange={(e) => setForm({ ...form, classLevels: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0f1629] border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                >
                  {["Level 100", "Level 200", "Level 300", "Level 400"].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  id="student-register-submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm disabled:opacity-50 transition-all"
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
