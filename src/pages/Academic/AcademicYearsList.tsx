import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
} from "../../features/academicYears/academicYearsSlice";
import { FiCalendar, FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";

export default function AcademicYearsList() {
  const dispatch = useAppDispatch();
  const { items: academicYears, loading, error } = useAppSelector((s) => s.academicYears);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    fromYear: "",
    toYear: "",
    isCurrent: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchAcademicYears());
  }, [dispatch]);

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.split("T")[0] || "";
    return d.toISOString().split("T")[0];
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ name: "", fromYear: "", toYear: "", isCurrent: false });
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      fromYear: formatDateForInput(item.fromYear),
      toYear: formatDateForInput(item.toYear),
      isCurrent: !!item.isCurrent,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (editingId) {
      await dispatch(updateAcademicYear({ id: editingId, ...form }));
    } else {
      await dispatch(createAcademicYear(form));
    }
    setSubmitting(false);
    setShowModal(false);
    setEditingId(null);
    setForm({ name: "", fromYear: "", toYear: "", isCurrent: false });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this Academic Year?")) {
      await dispatch(deleteAcademicYear(id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FiCalendar className="w-6 h-6 shrink-0" />
            </span>
            <span>Academic Years</span>
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            Manage session dates, start/end terms, and active academic year cycles
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4 shrink-0" />
          Add Academic Year
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
        ) : academicYears.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <FiCalendar className="w-8 h-8" />
            </div>
            <h3 className="mt-3 text-dark font-semibold text-lg">No Academic Years Found</h3>
            <p className="mt-1 text-dark-400 text-sm">
              Click the button above to create your first academic year.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-dark-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4 ">Name</th>
                  <th className="px-6 py-4">From Date</th>
                  <th className="px-6 py-4">To Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-dark-300">
                {academicYears.map((item) => (
                  <tr key={item._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-dark">{item.name}</td>
                    <td className="px-6 py-4">
                      {item.fromYear ? new Date(item.fromYear).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-dark">
                      {item.toYear ? new Date(item.toYear).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {item.isCurrent ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Current Session
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-dark-400 border border-slate-500/20">
                          Inactive / Past
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-dark-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                          title="Edit Academic Year"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Academic Year"
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
                {editingId ? "Edit Academic Year" : "Create Academic Year"}
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
                  Academic Year Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024/2025"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  From Date (Start)
                </label>
                <input
                  type="date"
                  required
                  value={form.fromYear}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  onChange={(e) => setForm({ ...form, fromYear: e.target.value })}
                  style={{ colorScheme: "dark" }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  To Date (End)
                </label>
                <input
                  type="date"
                  required
                  value={form.toYear}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  onChange={(e) => setForm({ ...form, toYear: e.target.value })}
                  style={{ colorScheme: "dark" }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCurrent"
                  checked={form.isCurrent}
                  onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 text-indigo-600 focus:ring-indigo-500 bg-white/5"
                />
                <label htmlFor="isCurrent" className="text-sm text-slate-300">
                  Set as Current Session
                </label>
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25"
                >
                  {submitting
                    ? editingId
                      ? "Updating..."
                      : "Creating..."
                    : editingId
                    ? "Update Academic Year"
                    : "Save Academic Year"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
