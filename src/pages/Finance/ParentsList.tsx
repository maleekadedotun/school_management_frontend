import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchParentsList } from "../../features/finance/financeSlice";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function ParentsList() {
  const dispatch = useAppDispatch();
  const { parents, loading } = useAppSelector((state) => state.finance);

  const [search, setSearch] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any | null>(null);
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    dispatch(fetchParentsList());
  }, [dispatch]);

  const filteredParents = parents.filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchName = p.name?.toLowerCase().includes(q);
    const matchEmail = p.email?.toLowerCase().includes(q);
    const matchId = p.parentId?.toLowerCase().includes(q);
    return matchName || matchEmail || matchId;
  });

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParent || !studentIdentifier.trim()) return;

    setLinking(true);
    try {
      const { data } = await api.post("/parents/link-student", {
        parentId: selectedParent._id,
        studentIdentifier: studentIdentifier.trim(),
      });
      toast.success(data?.message || "Student linked successfully");
      setShowLinkModal(false);
      setStudentIdentifier("");
      dispatch(fetchParentsList());
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to link student");
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Parents & Guardians Directory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage parent accounts, verified children associations, and contact details
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by parent name, email, or parent ID..."
          className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading parents...</div>
        ) : filteredParents.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No parent accounts found. Parents are registered when they create accounts or are added by admin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Parent ID</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Linked Children</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredParents.map((parent: any) => (
                  <tr key={parent._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                      {parent.parentId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                      {parent.name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{parent.email}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{parent.phone || "—"}</td>
                    <td className="py-3.5 px-4">
                      {parent.children && parent.children.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {parent.children.map((child: any) => (
                            <span
                              key={child._id}
                              className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-md text-[11px] font-medium"
                            >
                              {child.name} ({child.currentClassLevel || "Student"})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No children linked</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedParent(parent);
                          setStudentIdentifier("");
                          setShowLinkModal(true);
                        }}
                        className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100"
                      >
                        + Link Student
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Link Student */}
      {showLinkModal && selectedParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Link Student to {selectedParent.name}
              </h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLinkStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Student Admission ID or Email *
                </label>
                <input
                  type="text"
                  required
                  value={studentIdentifier}
                  onChange={(e) => setStudentIdentifier(e.target.value)}
                  placeholder="e.g. STU12345 or student@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md"
                >
                  {linking ? "Linking..." : "Link Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
