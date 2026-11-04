import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchParentsList,
  registerParentAdmin,
  updateParentAdmin,
  suspendParentAdmin,
  unsuspendParentAdmin,
  deleteParentAdmin,
  unlinkStudentFromParent,
} from "../../features/finance/financeSlice";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  FiUsers,
  FiUserCheck,
  FiCheck,
  FiBook,
  FiMail,
  FiPhone,
  FiX,
  FiKey,
  FiClipboard,
  FiEdit2,
  FiPauseCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

export default function ParentsList() {
  const dispatch = useAppDispatch();
  const { parents, loading } = useAppSelector((state) => state.finance);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Enrolled students list for searchable child picker
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Registration Form state
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    selectedStudentIds: [] as string[],
    manualStudentId: "",
  });

  // Modal: Success Summary & Credentials Card
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    parentId: string;
    childrenCount: number;
  } | null>(null);

  // Modal: View Parent Profile / Details
  const [viewParent, setViewParent] = useState<any | null>(null);

  // Modal: Edit Parent
  const [editParent, setEditParent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    isSuspended: boolean;
    selectedStudentIds: string[];
  }>({
    id: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    isSuspended: false,
    selectedStudentIds: [],
  });
  const [updating, setUpdating] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Modal: Link Student Quick Modal
  const [linkParent, setLinkParent] = useState<any | null>(null);
  const [linkStudentId, setLinkStudentId] = useState("");
  const [manualLinkIdentifier, setManualLinkIdentifier] = useState("");
  const [linking, setLinking] = useState(false);

  // Child picker search query inside modals
  const [pickerSearch, setPickerSearch] = useState("");

  // Fetch initial parents and enrolled students
  useEffect(() => {
    dispatch(fetchParentsList());
    loadEnrolledStudents();
  }, [dispatch]);

  const loadEnrolledStudents = async () => {
    setLoadingStudents(true);
    try {
      const { data } = await api.get("/students/admin");
      setEnrolledStudents(data?.data || []);
    } catch {
      // Fallback silently if admin student list fails
      try {
        const { data } = await api.get("/students");
        setEnrolledStudents(data?.data || []);
      } catch {
        setEnrolledStudents([]);
      }
    } finally {
      setLoadingStudents(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Parent@${randomPart}`;
  };

  // Filtered parents based on main search query
  const filteredParents = useMemo(() => {
    if (!search.trim()) return parents;
    const q = search.toLowerCase().trim();
    return parents.filter((p: any) => {
      const matchName = p.name?.toLowerCase().includes(q);
      const matchEmail = p.email?.toLowerCase().includes(q);
      const matchId = p.parentId?.toLowerCase().includes(q);
      const matchPhone = p.phone?.toLowerCase().includes(q);
      const matchChild = Array.isArray(p.children) && p.children.some((c: any) =>
        (c?.name && c.name.toLowerCase().includes(q)) ||
        (c?.studentId && c.studentId.toLowerCase().includes(q)) ||
        (c?.StudentId && c.StudentId.toLowerCase().includes(q))
      );
      return matchName || matchEmail || matchId || matchPhone || matchChild;
    });
  }, [parents, search]);

  const totalPages = Math.ceil(filteredParents.length / itemsPerPage) || 1;
  const paginatedParents = filteredParents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filtered enrolled students for the child picker
  const filteredStudentsForPicker = useMemo(() => {
    if (!pickerSearch.trim()) return enrolledStudents.slice(0, 15);
    const q = pickerSearch.toLowerCase().trim();
    return enrolledStudents.filter((s: any) => {
      const matchName = s.name?.toLowerCase().includes(q);
      const matchId = (s.studentId || s.StudentId || "").toLowerCase().includes(q);
      const matchClass = (s.currentClassLevel || "").toLowerCase().includes(q);
      return matchName || matchId || matchClass;
    }).slice(0, 20);
  }, [enrolledStudents, pickerSearch]);

  // Open Register Parent Modal
  const handleOpenRegister = () => {
    const pwd = generateRandomPassword();
    setRegisterForm({
      name: "",
      email: "",
      phone: "",
      password: pwd,
      selectedStudentIds: [],
      manualStudentId: "",
    });
    setPickerSearch("");
    setShowPassword(true);
    setShowRegisterModal(true);
  };

  // Submit Parent Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name.trim() || !registerForm.email.trim() || !registerForm.password.trim()) {
      toast.error("Full Name, Email, and Password are required");
      return;
    }
    if (registerForm.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setRegistering(true);
    try {
      const payload: any = {
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone.trim(),
        password: registerForm.password.trim(),
        studentIds: registerForm.selectedStudentIds,
      };

      if (registerForm.manualStudentId.trim()) {
        payload.studentIdentifier = registerForm.manualStudentId.trim();
      }

      const res = await dispatch(registerParentAdmin(payload));
      if (registerParentAdmin.fulfilled.match(res)) {
        const createdData = res.payload?.data;
        toast.success("Parent account registered successfully!");
        setShowRegisterModal(false);

        // Display credentials card modal
        setCreatedCredentials({
          name: registerForm.name.trim(),
          email: registerForm.email.trim(),
          password: registerForm.password.trim(),
          parentId: createdData?.parentId || "Generated",
          childrenCount: registerForm.selectedStudentIds.length + (registerForm.manualStudentId ? 1 : 0),
        });

        dispatch(fetchParentsList());
      } else {
        toast.error((res.payload as string) || "Failed to register parent");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to register parent");
    } finally {
      setRegistering(false);
    }
  };

  // Open Edit Parent Modal
  const handleOpenEdit = (parent: any) => {
    setEditParent(parent);
    setEditForm({
      id: parent._id,
      name: parent.name || "",
      email: parent.email || "",
      phone: parent.phone || "",
      password: "",
      isSuspended: !!parent.isSuspended,
      selectedStudentIds: Array.isArray(parent.children)
        ? parent.children.map((c: any) => (typeof c === "object" ? c._id : c))
        : [],
    });
    setPickerSearch("");
    setShowEditPassword(false);
  };

  // Submit Edit Parent
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast.error("Name and Email are required");
      return;
    }

    setUpdating(true);
    try {
      const updates: any = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        isSuspended: editForm.isSuspended,
        studentIds: editForm.selectedStudentIds,
      };
      if (editForm.password.trim()) {
        if (editForm.password.trim().length < 6) {
          toast.error("New password must be at least 6 characters");
          setUpdating(false);
          return;
        }
        updates.password = editForm.password.trim();
      }

      const res = await dispatch(updateParentAdmin({ id: editForm.id, updates }));
      if (updateParentAdmin.fulfilled.match(res)) {
        toast.success("Parent details updated successfully!");
        setEditParent(null);
        if (viewParent && viewParent._id === editForm.id) {
          setViewParent(res.payload?.data);
        }
        dispatch(fetchParentsList());
      } else {
        toast.error((res.payload as string) || "Failed to update parent");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update parent");
    } finally {
      setUpdating(false);
    }
  };

  // Toggle Suspend / Unsuspend
  const handleToggleSuspend = async (parent: any) => {
    const isSuspending = !parent.isSuspended;
    const confirmMsg = isSuspending
      ? `Are you sure you want to SUSPEND parent "${parent.name}"? They will lose access to the parent portal.`
      : `Are you sure you want to UNSUSPEND parent "${parent.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      if (isSuspending) {
        const res = await dispatch(suspendParentAdmin(parent._id));
        if (suspendParentAdmin.fulfilled.match(res)) {
          toast.success(`Parent account suspended`);
          dispatch(fetchParentsList());
        } else {
          toast.error((res.payload as string) || "Failed to suspend parent");
        }
      } else {
        const res = await dispatch(unsuspendParentAdmin(parent._id));
        if (unsuspendParentAdmin.fulfilled.match(res)) {
          toast.success(`Parent account unsuspended`);
          dispatch(fetchParentsList());
        } else {
          toast.error((res.payload as string) || "Failed to unsuspend parent");
        }
      }
    } catch {
      toast.error("Operation failed");
    }
  };

  // Delete Parent
  const handleDeleteParent = async (parent: any) => {
    if (
      !window.confirm(
        `Are you sure you want to DELETE parent account "${parent.name}" (${parent.parentId})? This will unlink their children and permanently remove this account.`
      )
    ) {
      return;
    }

    try {
      const res = await dispatch(deleteParentAdmin(parent._id));
      if (deleteParentAdmin.fulfilled.match(res)) {
        toast.success("Parent account deleted successfully");
        if (viewParent && viewParent._id === parent._id) {
          setViewParent(null);
        }
        dispatch(fetchParentsList());
      } else {
        toast.error((res.payload as string) || "Failed to delete parent");
      }
    } catch {
      toast.error("Failed to delete parent");
    }
  };

  // Unlink a Child from Parent
  const handleUnlinkChild = async (parentId: string, studentId: string, studentName: string) => {
    if (!window.confirm(`Unlink student "${studentName}" from this parent?`)) return;

    try {
      const res = await dispatch(unlinkStudentFromParent({ parentId, studentId }));
      if (unlinkStudentFromParent.fulfilled.match(res)) {
        toast.success(`Student "${studentName}" unlinked successfully`);
        if (viewParent && viewParent._id === parentId) {
          setViewParent(res.payload?.data);
        }
        dispatch(fetchParentsList());
      } else {
        toast.error((res.payload as string) || "Failed to unlink student");
      }
    } catch {
      toast.error("Failed to unlink student");
    }
  };

  // Link a Child via Quick Modal
  const handleLinkStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkParent) return;

    const identifier = linkStudentId || manualLinkIdentifier.trim();
    if (!identifier) {
      toast.error("Please select a student or enter an admission ID / email");
      return;
    }

    setLinking(true);
    try {
      const { data } = await api.post("/parents/link-student", {
        parentId: linkParent._id,
        studentIdentifier: identifier,
      });

      toast.success(data?.message || "Student linked successfully");
      setLinkParent(null);
      setLinkStudentId("");
      setManualLinkIdentifier("");
      setPickerSearch("");
      dispatch(fetchParentsList());

      if (viewParent && viewParent._id === linkParent._id) {
        setViewParent(data?.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to link student");
    } finally {
      setLinking(false);
    }
  };

  // Aggregate stats
  const totalParents = parents.length;
  const activeParents = parents.filter((p: any) => !p.isSuspended).length;
  const suspendedParents = parents.filter((p: any) => p.isSuspended).length;
  const totalLinkedChildren = parents.reduce((acc: number, p: any) => {
    return acc + (Array.isArray(p.children) ? p.children.length : 0);
  }, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xl shadow-lg shadow-indigo-500/10 flex items-center justify-center">
              <FiUsers className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Parents & Guardians Directory
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Admin registration, linked children verification, and parent portal credentials
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              dispatch(fetchParentsList());
              loadEnrolledStudents();
              toast.success("Refreshing parents and student directory...");
            }}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FiRefreshCw className="w-4 h-4 text-indigo-400" />
            Refresh
          </button>

          <button
            id="add-parent-btn"
            onClick={handleOpenRegister}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Register Parent</span>
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Parents</p>
            <p className="text-2xl font-bold text-white mt-1">{totalParents}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
            <FiUsers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Accounts</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{activeParents}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
            <FiUserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Suspended</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">{suspendedParents}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
            <FiPauseCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Linked Children</p>
            <p className="text-2xl font-bold text-violet-400 mt-1">{totalLinkedChildren}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-sm">
            <FiBook className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by parent name, parent ID, email, phone, or linked student name..."
          className="w-full pl-11 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              setCurrentPage(1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
          >
            Clear
          </button>
        )}
      </div>

      {/* Parents Glassmorphic Table */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-indigo-400 uppercase text-xs font-semibold tracking-wider">
                <th className="px-6 py-4">Parent Details</th>
                <th className="px-6 py-4">Parent ID</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Linked Children</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredParents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-xl">
                        <FiUsers className="w-6 h-6" />
                      </div>
                      <p className="text-base font-semibold text-white">
                        {search ? `No parents found for "${search}"` : "No parent accounts registered yet."}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Parent accounts are registered exclusively by the administration so student records stay securely linked.
                      </p>
                      <button
                        onClick={handleOpenRegister}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                      >
                        <FiPlus className="w-3.5 h-3.5" /> Register First Parent
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedParents.map((parent: any) => {
                  const children = Array.isArray(parent.children) ? parent.children : [];
                  const initials = parent.name
                    ? parent.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "P";

                  return (
                    <tr
                      key={parent._id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">
                              {parent.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Registered: {parent.createdAt ? new Date(parent.createdAt).toLocaleDateString() : "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Parent ID */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                          {parent.parentId || "—"}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-300 flex items-center gap-1.5">
                            <FiMail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{parent.email}</span>
                          </div>
                          {parent.phone && (
                            <div className="text-xs text-slate-400 flex items-center gap-1.5">
                              <FiPhone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{parent.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Linked Children */}
                      <td className="px-6 py-4">
                        {children.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {children.map((child: any) => {
                              const cId = typeof child === "object" ? child._id : child;
                              const cName = typeof child === "object" ? child.name : `Student (${cId})`;
                              const cClass = typeof child === "object" ? child.currentClassLevel : "";
                              return (
                                <span
                                  key={cId}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                                  title={`Admission ID: ${child.studentId || child.StudentId || "—"}`}
                                >
                                  <span>{cName}</span>
                                  {cClass && (
                                    <span className="text-[10px] text-indigo-400/80 font-mono">
                                      ({cClass})
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleUnlinkChild(parent._id, cId, cName)}
                                    title="Unlink child from parent"
                                    className="text-indigo-400/60 hover:text-rose-400 transition-colors ml-0.5 p-0.5 cursor-pointer"
                                  >
                                    <FiX className="w-3 h-3" />
                                  </button>
                                </span>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => {
                                setLinkParent(parent);
                                setLinkStudentId("");
                                setManualLinkIdentifier("");
                                setPickerSearch("");
                              }}
                              className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-indigo-300 text-xs font-semibold border border-dashed border-white/15 transition-colors cursor-pointer"
                              title="Link another student"
                            >
                              + Link
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-medium">
                              No child linked
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setLinkParent(parent);
                                setLinkStudentId("");
                                setManualLinkIdentifier("");
                                setPickerSearch("");
                              }}
                              className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
                            >
                              + Link child
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            parent.isSuspended
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {parent.isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => setViewParent(parent)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium transition-all border border-indigo-500/30 cursor-pointer"
                            title="View Parent Profile"
                          >
                            View
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEdit(parent)}
                            className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-medium transition-all border border-violet-500/30 flex items-center gap-1 cursor-pointer"
                            title="Edit Parent Details & Children"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>

                          {/* Suspend / Unsuspend */}
                          <button
                            onClick={() => handleToggleSuspend(parent)}
                            title={parent.isSuspended ? "Unsuspend Parent Account" : "Suspend Parent Account"}
                            className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                              parent.isSuspended
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                                : "text-amber-400 hover:bg-amber-500/10 border-amber-500/20"
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>

                          {/* Delete Parent */}
                          <button
                            onClick={() => handleDeleteParent(parent)}
                            title="Delete Parent Account"
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredParents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
            <p className="text-slate-400 text-xs">
              Showing <span className="font-semibold text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-semibold text-white">
                {Math.min(currentPage * itemsPerPage, filteredParents.length)}
              </span>{" "}
              of <span className="font-semibold text-white">{filteredParents.length}</span> parents
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-slate-300 text-xs font-medium transition-all"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400 px-2 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-slate-300 text-xs font-medium transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: REGISTER PARENT (ADMIN-ONLY WORKFLOW)            */}
      {/* ========================================================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 sm:p-7 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/20">
                  <FiUsers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Register Parent Account</h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Admin provisioned account with automatic child verification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Parent Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Parent / Guardian Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  placeholder="e.g. Mr. Babatunde Alabi"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Parent Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="parent@example.com"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">This email serves as the portal login credential</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    placeholder="e.g. 08012345678"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">For SMS alerts and urgent contact</p>
                </div>
              </div>

              {/* Initial Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Initial Password <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateRandomPassword();
                      setRegisterForm({ ...registerForm, password: pwd });
                      setShowPassword(true);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiKey className="w-3.5 h-3.5" />
                    <span>Generate Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-16 bg-white/5 border border-white/10 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  You will receive a credentials card to copy and share with the parent after registration.
                </p>
              </div>

              {/* Child Picker / Student Linker Section */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-slate-200">
                      Link Enrolled Child / Student(s)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Select which student(s) belong to this parent to link them immediately.
                    </p>
                  </div>
                  {registerForm.selectedStudentIds.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {registerForm.selectedStudentIds.length} Selected
                    </span>
                  )}
                </div>

                {/* Selected Students Pill Preview */}
                {registerForm.selectedStudentIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white/5 border border-white/10">
                    {registerForm.selectedStudentIds.map((sId) => {
                      const st = enrolledStudents.find((s) => s._id === sId);
                      return (
                        <span
                          key={sId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs"
                        >
                          <span>{st?.name || sId}</span>
                          {st?.currentClassLevel && (
                            <span className="text-[10px] text-indigo-300/80">
                              ({st.currentClassLevel})
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setRegisterForm({
                                ...registerForm,
                                selectedStudentIds: registerForm.selectedStudentIds.filter((id) => id !== sId),
                              })
                            }
                            className="text-indigo-300 hover:text-white ml-0.5 p-0.5"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Filter / Search within child picker */}
                <div className="relative">
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search enrolled students by name, ID or class..."
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                {/* Student Selection Checklist Box */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-black/20 border border-white/5">
                  {loadingStudents ? (
                    <div className="text-center py-4 text-xs text-slate-500">Loading students directory...</div>
                  ) : filteredStudentsForPicker.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500">
                      {pickerSearch ? `No students found matching "${pickerSearch}"` : "No students available."}
                    </div>
                  ) : (
                    filteredStudentsForPicker.map((student: any) => {
                      const isSelected = registerForm.selectedStudentIds.includes(student._id);
                      return (
                        <div
                          key={student._id}
                          onClick={() => {
                            if (isSelected) {
                              setRegisterForm({
                                ...registerForm,
                                selectedStudentIds: registerForm.selectedStudentIds.filter((id) => id !== student._id),
                              });
                            } else {
                              setRegisterForm({
                                ...registerForm,
                                selectedStudentIds: [...registerForm.selectedStudentIds, student._id],
                              });
                            }
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? "bg-indigo-600/30 border border-indigo-500/40 text-white"
                              : "hover:bg-white/5 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent div
                              className="rounded border-white/20 text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="font-medium text-white">{student.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({student.studentId || student.StudentId || "No ID"})
                            </span>
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-400">
                            {student.currentClassLevel || "Student"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Fallback Student Identifier */}
                <div className="pt-2">
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Or Enter Student ID / Email Manually (Optional)
                  </label>
                  <input
                    type="text"
                    value={registerForm.manualStudentId}
                    onChange={(e) => setRegisterForm({ ...registerForm, manualStudentId: e.target.value })}
                    placeholder="e.g. STU12345 or student@school.com"
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {registering ? "Registering Parent..." : "Complete Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SUCCESS CREDENTIALS CARD                         */}
      {/* ========================================================= */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-emerald-500/30 rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-xl font-bold">
                <FiCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Parent Account Provisioned!</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                The parent account has been registered by admin. Please copy and provide these credentials to the parent:
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-400 font-sans">Full Name:</span>
                <span className="font-semibold text-white">{createdCredentials.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-400 font-sans">Parent ID:</span>
                <span className="font-bold text-indigo-400">{createdCredentials.parentId}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-400 font-sans">Portal Login (Email):</span>
                <span className="font-semibold text-white">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-400 font-sans">Initial Password:</span>
                <span className="font-bold text-emerald-400 text-sm">{createdCredentials.password}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 font-sans">Linked Children:</span>
                <span className="font-semibold text-violet-300 font-sans">
                  {createdCredentials.childrenCount} child(ren) linked
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-slate-300 space-y-1">
              <p className="font-semibold text-indigo-300">Parent Portal URL:</p>
              <p className="text-white font-mono break-all">
                {window.location.origin}/parent/login
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const clip = `Parent Portal Credentials:\nPortal: ${window.location.origin}/parent/login\nParent ID: ${createdCredentials.parentId}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLinked Children: ${createdCredentials.childrenCount}`;
                  navigator.clipboard.writeText(clip);
                  toast.success("Credentials copied to clipboard!");
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FiClipboard className="w-3.5 h-3.5" />
                <span>Copy Credentials</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: VIEW PARENT PROFILE & CHILDREN DETAILS           */}
      {/* ========================================================= */}
      {viewParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 sm:p-7 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {viewParent.name?.[0]?.toUpperCase() || "P"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{viewParent.name}</h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        viewParent.isSuspended
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {viewParent.isSuspended ? "Suspended" : "Active"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Parent ID: <span className="font-mono text-indigo-400 font-bold">{viewParent.parentId}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewParent(null)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Contact Details Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Email Address:</span>
                <span className="font-semibold text-white">{viewParent.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Phone Number:</span>
                <span className="font-semibold text-white">{viewParent.phone || "Not provided"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Account Role:</span>
                <span className="font-semibold text-indigo-300 capitalize">{viewParent.role || "Parent"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Registration Date:</span>
                <span className="font-semibold text-white">
                  {viewParent.createdAt ? new Date(viewParent.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>

            {/* Linked Children List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FiBook className="w-4 h-4 text-indigo-400" />
                  <span>Linked Children ({Array.isArray(viewParent.children) ? viewParent.children.length : 0})</span>
                </h3>
                <button
                  onClick={() => {
                    setLinkParent(viewParent);
                    setLinkStudentId("");
                    setManualLinkIdentifier("");
                    setPickerSearch("");
                  }}
                  className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all cursor-pointer"
                >
                  + Link Another Child
                </button>
              </div>

              {(!viewParent.children || viewParent.children.length === 0) ? (
                <div className="py-8 text-center text-slate-400 bg-white/5 rounded-xl border border-white/5 space-y-2">
                  <p className="text-xs">No children are currently linked to this parent account.</p>
                  <button
                    onClick={() => {
                      setLinkParent(viewParent);
                      setLinkStudentId("");
                      setManualLinkIdentifier("");
                      setPickerSearch("");
                    }}
                    className="text-xs text-indigo-400 hover:underline font-semibold"
                  >
                    Click here to link a student
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {viewParent.children.map((child: any) => {
                    const cId = typeof child === "object" ? child._id : child;
                    const cName = typeof child === "object" ? child.name : `Student (${cId})`;
                    const cAdmission = typeof child === "object" ? child.studentId || child.StudentId : "—";
                    const cClass = typeof child === "object" ? child.currentClassLevel : "—";
                    const cEmail = typeof child === "object" ? child.email : "";

                    return (
                      <div
                        key={cId}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">{cName}</span>
                            <span className="font-mono text-xs text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10">
                              {cAdmission}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300">
                              {cClass}
                            </span>
                          </div>
                          {cEmail && <p className="text-xs text-slate-400">{cEmail}</p>}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnlinkChild(viewParent._id, cId, cName)}
                          className="px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-medium transition-colors"
                        >
                          Unlink
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions in View Modal */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleToggleSuspend(viewParent);
                    setViewParent(null);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    viewParent.isSuspended
                      ? "bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {viewParent.isSuspended ? "Unsuspend Account" : "Suspend Account"}
                </button>
                <button
                  onClick={() => {
                    handleDeleteParent(viewParent);
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-all"
                >
                  Delete Account
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(viewParent);
                    setViewParent(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setViewParent(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: EDIT PARENT DETAILS                              */}
      {/* ========================================================= */}
      {editParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 sm:p-7 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                  <FiEdit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Edit Parent Details</h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Modify profile details, reset password, and update linked children
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditParent(null)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Parent Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="e.g. 08012345678"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Password Reset (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Reset Password (leave blank to keep current)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateRandomPassword();
                      setEditForm({ ...editForm, password: pwd });
                      setShowEditPassword(true);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiKey className="w-3.5 h-3.5" />
                    <span>Generate Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Enter new password or leave blank"
                    className="w-full px-4 py-2.5 pr-16 bg-white/5 border border-white/10 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                  {editForm.password && (
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
                    >
                      {showEditPassword ? "Hide" : "Show"}
                    </button>
                  )}
                </div>
              </div>

              {/* Account Status Switch */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Account Suspension</span>
                  <span className="text-[11px] text-slate-400">
                    Suspended accounts cannot log in to the parent portal
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isSuspended}
                    onChange={(e) => setEditForm({ ...editForm, isSuspended: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {/* Linked Children Modifier */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">
                    Manage Linked Students ({editForm.selectedStudentIds.length})
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Add or remove child associations
                  </span>
                </div>

                {/* Selected tags */}
                {editForm.selectedStudentIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white/5 border border-white/10">
                    {editForm.selectedStudentIds.map((sId) => {
                      const st = enrolledStudents.find((s) => s._id === sId);
                      return (
                        <span
                          key={sId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs"
                        >
                          <span>{st?.name || sId}</span>
                          {st?.currentClassLevel && (
                            <span className="text-[10px] text-indigo-300/80">
                              ({st.currentClassLevel})
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm({
                                ...editForm,
                                selectedStudentIds: editForm.selectedStudentIds.filter((id) => id !== sId),
                              })
                            }
                            className="text-indigo-300 hover:text-white ml-0.5 p-0.5"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Search in picker */}
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search enrolled students to add or remove..."
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />

                {/* List */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-black/20 border border-white/5">
                  {filteredStudentsForPicker.map((student: any) => {
                    const isSelected = editForm.selectedStudentIds.includes(student._id);
                    return (
                      <div
                        key={student._id}
                        onClick={() => {
                          if (isSelected) {
                            setEditForm({
                              ...editForm,
                              selectedStudentIds: editForm.selectedStudentIds.filter((id) => id !== student._id),
                            });
                          } else {
                            setEditForm({
                              ...editForm,
                              selectedStudentIds: [...editForm.selectedStudentIds, student._id],
                            });
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? "bg-indigo-600/30 border border-indigo-500/40 text-white"
                            : "hover:bg-white/5 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-white/20 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                          <span className="font-medium text-white">{student.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({student.studentId || student.StudentId || "No ID"})
                          </span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-400">
                          {student.currentClassLevel || "Student"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditParent(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {updating ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: LINK STUDENT TO PARENT QUICK MODAL               */}
      {/* ========================================================= */}
      {linkParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">
                  Link Student to {linkParent.name}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5 font-mono">
                  Parent ID: {linkParent.parentId}
                </p>
              </div>
              <button
                onClick={() => setLinkParent(null)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Enrolled Student
                </label>
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Filter student list..."
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs mb-2"
                />

                <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-black/20 border border-white/5">
                  {filteredStudentsForPicker.map((s: any) => {
                    const isSelected = linkStudentId === s._id;
                    return (
                      <div
                        key={s._id}
                        onClick={() => {
                          setLinkStudentId(isSelected ? "" : s._id);
                          setManualLinkIdentifier("");
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? "bg-indigo-600/30 border border-indigo-500/40 text-white"
                            : "hover:bg-white/5 text-slate-300"
                        }`}
                      >
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {s.studentId || s.StudentId} · {s.currentClassLevel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Or Enter Student Admission ID / Email
                </label>
                <input
                  type="text"
                  value={manualLinkIdentifier}
                  onChange={(e) => {
                    setManualLinkIdentifier(e.target.value);
                    if (e.target.value) setLinkStudentId("");
                  }}
                  placeholder="e.g. STU-2026-001 or student@example.com"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setLinkParent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking || (!linkStudentId && !manualLinkIdentifier.trim())}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl shadow-md transition-all cursor-pointer"
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
