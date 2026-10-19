import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchParentsList } from "../../features/finance/financeSlice";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function ParentsList() {
  const dispatch = useAppDispatch();
  const { parents, loading } = useAppSelector((state) => state.finance);

  const [search, setSearch] = useState("");

  // Modal: Link Student
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any | null>(null);
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [linking, setLinking] = useState(false);

  // Modal: Register Parent (Admin-Only Registration)
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    studentIdentifier: "",
  });

  // Success summary modal for newly created credentials
  const [createdParentDetails, setCreatedParentDetails] = useState<{
    name: string;
    email: string;
    password: string;
    parentId: string;
  } | null>(null);

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

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const pwd = `Parent@${randomPart}`;
    setRegisterForm((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name.trim() || !registerForm.email.trim() || !registerForm.password.trim()) {
      toast.error("Please fill in Name, Email, and Password");
      return;
    }
    if (registerForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setRegistering(true);
    try {
      const { data } = await api.post("/parents/register", {
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone.trim(),
        password: registerForm.password.trim(),
        studentIdentifier: registerForm.studentIdentifier.trim() || undefined,
      });

      toast.success(data?.message || "Parent account registered successfully!");
      setShowRegisterModal(false);

      // Save credentials for admin confirmation dialog
      setCreatedParentDetails({
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password.trim(),
        parentId: data?.data?.parentId || "Generated",
      });

      setRegisterForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        studentIdentifier: "",
      });

      dispatch(fetchParentsList());
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to register parent");
    } finally {
      setRegistering(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-lg">
              👨‍👩‍👧‍👦
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Parents & Guardians Directory
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Admin registration, linked children verification, and contact directory
          </p>
        </div>

        {/* Action Button: Register Parent */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              generateRandomPassword();
              setShowRegisterModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Register New Parent</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by parent name, email, or parent ID..."
            className="w-full text-sm bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Clear
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Registered</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{parents.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading registered parents...
          </div>
        ) : filteredParents.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm space-y-3">
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">No parent accounts found.</p>
            <p className="text-xs text-gray-500">
              Parent accounts are registered exclusively by the administration. Click the button below to register a parent.
            </p>
            <button
              onClick={() => {
                generateRandomPassword();
                setShowRegisterModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              + Register New Parent
            </button>
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
                  <tr key={parent._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {parent.parentId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                      {parent.name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">{parent.email}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">{parent.phone || "—"}</td>
                    <td className="py-3.5 px-4">
                      {parent.children && parent.children.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {parent.children.map((child: any) => (
                            <span
                              key={child._id}
                              className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-md text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800"
                            >
                              {child.name} ({child.currentClassLevel || "Student"})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md font-medium">
                          No child linked
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedParent(parent);
                          setStudentIdentifier("");
                          setShowLinkModal(true);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
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

      {/* Modal 1: Register New Parent Account (Admin Only) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>👤</span>
                  <span>Register Parent Account</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Admin-provisioned registration for school parents and guardians
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Parent Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  placeholder="e.g. Mr. David Adebayo"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="parent@example.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    placeholder="e.g. 08012345678"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Initial Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    🎲 Generate Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  This password will be handed to the parent to log in to their portal.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Initial Child / Student ID (Optional)
                </label>
                <input
                  type="text"
                  value={registerForm.studentIdentifier}
                  onChange={(e) => setRegisterForm({ ...registerForm, studentIdentifier: e.target.value })}
                  placeholder="e.g. STD-2026-001 or student@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Optional: Automatically link their child right during registration.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {registering ? "Registering..." : "Complete Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Registration Success & Credentials Card */}
      {createdParentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full shadow-2xl border border-emerald-500/30 p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Parent Account Created!
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Please provide the following credentials to the parent to access their portal:
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600">
                <span className="text-gray-500">Parent Name:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{createdParentDetails.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600">
                <span className="text-gray-500">Parent ID:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{createdParentDetails.parentId}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600">
                <span className="text-gray-500">Portal Login:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{createdParentDetails.email}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Password:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{createdParentDetails.password}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const textToCopy = `Parent Portal Credentials:\nPortal: ${window.location.origin}/parent/login\nParent ID: ${createdParentDetails.parentId}\nEmail: ${createdParentDetails.email}\nPassword: ${createdParentDetails.password}`;
                  navigator.clipboard.writeText(textToCopy);
                  toast.success("Credentials copied to clipboard!");
                }}
                className="px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-colors cursor-pointer"
              >
                📋 Copy Credentials
              </button>
              <button
                type="button"
                onClick={() => setCreatedParentDetails(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Link Student to Parent */}
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
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md cursor-pointer"
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
