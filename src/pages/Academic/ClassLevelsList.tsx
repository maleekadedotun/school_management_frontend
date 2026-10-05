import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchClassLevels,
  createClassLevel,
  updateClassLevel,
  deleteClassLevel,
} from "../../features/classLevels/classLevelsSlice";
import { fetchAllStudents } from "../../features/students/studentsSlice";
import { fetchSubjects } from "../../features/subjects/subjectsSlice";

export default function ClassLevelsList() {
  const dispatch = useAppDispatch();
  const { items: classLevels, loading, error } = useAppSelector((s) => s.classLevels);
  const { students } = useAppSelector((s) => s.students);
  const { items: subjects } = useAppSelector((s) => s.subjects);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Modal to inspect enrolled students or subjects of a class
  const [detailModal, setDetailModal] = useState<{
    className: string;
    type: "students" | "subjects";
    items: any[];
  } | null>(null);

  useEffect(() => {
    dispatch(fetchClassLevels());
    dispatch(fetchAllStudents());
    dispatch(fetchSubjects());
  }, [dispatch]);

  // Helper to get enrolled students for a class level
  const getEnrolledStudents = (item: any) => {
    const targetName = (item.name || "").trim().toLowerCase();
    const targetId = item._id ? item._id.toString() : "";

    // 1. If backend already populated objects in item.students
    if (Array.isArray(item.students) && item.students.length > 0 && typeof item.students[0] === "object") {
      return item.students;
    }

    // 2. Search loaded students list in Redux
    return students.filter((s: any) => {
      const current = (s.currentClassLevel || (Array.isArray(s.classLevels) && s.classLevels.length > 0 ? s.classLevels[s.classLevels.length - 1] : "") || "").trim().toLowerCase();
      if (current && (current === targetName || current === targetId)) {
        return true;
      }
      return false;
    });
  };

  // Helper to get subjects assigned to a class level
  const getClassSubjects = (item: any) => {
    const targetName = (item.name || "").trim().toLowerCase();
    const targetId = item._id ? item._id.toString() : "";

    // 1. If backend already populated objects in item.subjects
    if (Array.isArray(item.subjects) && item.subjects.length > 0 && typeof item.subjects[0] === "object") {
      return item.subjects;
    }

    // 2. Search loaded subjects list in Redux
    return subjects.filter((sub: any) => {
      const subLvl = (sub.classLevel || "").trim().toLowerCase();
      return subLvl && (subLvl === targetName || subLvl === targetId);
    });
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ name: "", description: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      description: item.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (editingId) {
      await dispatch(updateClassLevel({ id: editingId, ...form }));
    } else {
      await dispatch(createClassLevel(form));
    }
    setSubmitting(false);
    setShowModal(false);
    setEditingId(null);
    setForm({ name: "", description: "" });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this Class Level?")) {
      await dispatch(deleteClassLevel(id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <span>🏫</span> Class Levels
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            Manage grade levels, year tiers, and class level assignments
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Class Level
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-white/10 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : classLevels.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="text-4xl">🏫</span>
            <h3 className="mt-3 text-dark font-semibold text-lg">No Class Levels Found</h3>
            <p className="mt-1 text-dark-400 text-sm">
              Click the button above to create your first class level.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-dark-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Level Name</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Students Enrolled</th>
                  <th className="px-6 py-4">Subjects</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-dark-300">
                {classLevels.map((item) => {
                  const enrolledStudents = getEnrolledStudents(item);
                  const classSubjects = getClassSubjects(item);
                  const studentCount =
                    typeof item.studentCount === "number"
                      ? item.studentCount
                      : Array.isArray(item.students) && item.students.length > 0
                      ? item.students.length
                      : enrolledStudents.length;

                  const subjectCount =
                    typeof item.subjectCount === "number"
                      ? item.subjectCount
                      : Array.isArray(item.subjects) && item.subjects.length > 0
                      ? item.subjects.length
                      : classSubjects.length;

                  return (
                    <tr key={item._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-dark">{item.name}</td>
                      <td className="px-6 py-4">{item.description || "—"}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setDetailModal({
                              className: item.name,
                              type: "students",
                              items: enrolledStudents,
                            })
                          }
                          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer inline-flex items-center gap-1.5"
                          title="Click to view enrolled students"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          {studentCount} {studentCount === 1 ? "Student" : "Students"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setDetailModal({
                              className: item.name,
                              type: "subjects",
                              items: classSubjects,
                            })
                          }
                          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer inline-flex items-center gap-1.5"
                          title="Click to view subjects"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          {subjectCount} {subjectCount === 1 ? "Subject" : "Subjects"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-dark-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                      </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Edit Class Level"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Class Level"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingId ? "Edit Class Level" : "Create Class Level"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Level Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Level 100 / Grade 9"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  required
                  placeholder="e.g. First year undergraduate students"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all h-24"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25"
                >
                  {submitting
                    ? editingId
                      ? "Updating..."
                      : "Creating..."
                    : editingId
                    ? "Update Class Level"
                    : "Save Class Level"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Inspection Modal for Enrolled Students / Subjects */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{detailModal.type === "students" ? "👨‍🎓" : "📚"}</span>
                  {detailModal.type === "students"
                    ? `Students Enrolled in ${detailModal.className}`
                    : `Subjects in ${detailModal.className}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total: {detailModal.items.length} {detailModal.type === "students" ? "student(s)" : "subject(s)"}
                </p>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="text-slate-400 hover:text-white transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {detailModal.items.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No {detailModal.type === "students" ? "students" : "subjects"} found for this class level.
                </div>
              ) : detailModal.type === "students" ? (
                detailModal.items.map((student: any, idx: number) => (
                  <div
                    key={student._id || idx}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-sm"
                  >
                    <div>
                      <div className="font-semibold text-white">{student.name}</div>
                      <div className="text-xs text-slate-400">{student.email || "No email"}</div>
                    </div>
                    {student.StudentId && (
                      <span className="font-mono text-xs px-2 py-1 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                        {student.StudentId}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                detailModal.items.map((subject: any, idx: number) => (
                  <div
                    key={subject._id || idx}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-sm"
                  >
                    <div>
                      <div className="font-semibold text-white">{subject.name}</div>
                      <div className="text-xs text-slate-400">{subject.description || "Standard curriculum course"}</div>
                    </div>
                    {subject.duration && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300">
                        {subject.duration}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setDetailModal(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
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
