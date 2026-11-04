import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchAcademicTerms,
  createAcademicTerm,
  updateAcademicTerm,
  deleteAcademicTerm,
} from "../../features/academicTerms/academicTermsSlice";
import { FiCalendar, FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";

export default function AcademicTermsList() {
  const dispatch = useAppDispatch();
  const { items: academicTerms, loading, error } = useAppSelector((s) => s.academicTerms);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration: "3 months",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchAcademicTerms());
  }, [dispatch]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ name: "", description: "", duration: "3 months" });
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      description: item.description || "",
      duration: item.duration || "3 months",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (editingId) {
      await dispatch(updateAcademicTerm({ id: editingId, ...form }));
    } else {
      await dispatch(createAcademicTerm(form));
    }
    setSubmitting(false);
    setShowModal(false);
    setEditingId(null);
    setForm({ name: "", description: "", duration: "3 months" });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this Academic Term?")) {
      await dispatch(deleteAcademicTerm(id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <FiCalendar className="w-6 h-6 shrink-0" />
            </span>
            <span>Academic Terms</span>
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            Manage academic terms, semester durations, and term descriptions
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 transition-all flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4 shrink-0" />
          Add Academic Term
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
        ) : academicTerms.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
              <FiCalendar className="w-8 h-8" />
            </div>
            <h3 className="mt-3 text-dark font-semibold text-lg">No Academic Terms Found</h3>
            <p className="mt-1 text-dark-400 text-sm">
              Click the button above to create your first academic term.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-dark-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Term Name</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-dark-300">
                {academicTerms.map((item) => (
                  <tr key={item._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-dark">{item.name}</td>
                    <td className="px-6 py-4 text-dark-300">{item.description || "—"}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {item.duration || "3 months"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-dark-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                          title="Edit Academic Term"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Academic Term"
                        >
                          <FiTrash2 className="w-4 h-4" />
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingId ? "Edit Academic Term" : "Create Academic Term"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Term Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Term / Semester 1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  required
                  placeholder="e.g. First term of the academic session"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all h-24"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3 months"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
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
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25"
                >
                  {submitting
                    ? editingId
                      ? "Updating..."
                      : "Creating..."
                    : editingId
                    ? "Update Academic Term"
                    : "Save Academic Term"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
