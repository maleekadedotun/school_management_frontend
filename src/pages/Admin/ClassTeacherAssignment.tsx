import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchClassTeacherAssignments,
  fetchEligibleTeachers,
  createClassTeacherAssignment,
  updateClassTeacherAssignment,
  toggleClassTeacherStatus,
  deleteClassTeacherAssignment,
  clearClassTeacherMessages,
  type ClassTeacherAssignmentItem,
} from "../../features/classTeachers/classTeachersSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import { fetchPrograms } from "../../features/programs/programsSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import {
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlinePlusCircle,
  HiOutlineArrowPath,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineFunnel,
} from "react-icons/hi2";

export default function ClassTeacherAssignment() {
  const dispatch = useAppDispatch();

  const {
    assignments,
    eligibleTeachers,
    loading,
    loadingEligibleTeachers,
    actionLoading,
    error,
    successMessage,
  } = useAppSelector((state) => state.classTeachers);

  const { items: classLevels } = useAppSelector((state) => state.classLevels);
  const { items: programs } = useAppSelector((state) => state.programs);
  const { items: academicYears } = useAppSelector((state) => state.academicYears);
  const { items: academicTerms } = useAppSelector((state) => state.academicTerms);

  // Form State for New Assignment
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedClassLevelId, setSelectedClassLevelId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedAcademicTermId, setSelectedAcademicTermId] = useState("");
  const [notes, setNotes] = useState("");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [classFilter, setClassFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  // Edit Modal State
  const [editingAssignment, setEditingAssignment] = useState<ClassTeacherAssignmentItem | null>(null);
  const [editTeacherId, setEditTeacherId] = useState("");
  const [editClassLevelId, setEditClassLevelId] = useState("");
  const [editProgramId, setEditProgramId] = useState("");
  const [editAcademicYearId, setEditAcademicYearId] = useState("");
  const [editAcademicTermId, setEditAcademicTermId] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editNotes, setEditNotes] = useState("");

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Local notification banner
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchClassTeacherAssignments({}));
    dispatch(fetchEligibleTeachers());
    dispatch(fetchClassLevels());
    dispatch(fetchPrograms());
    dispatch(fetchAcademicYears());
    dispatch(fetchAcademicTerms());
  }, [dispatch]);

  // Set default academic year to current when academicYears load
  useEffect(() => {
    if (academicYears && academicYears.length > 0 && !selectedAcademicYearId) {
      const currentYear = academicYears.find((y: any) => y.isCurrent);
      if (currentYear) {
        setSelectedAcademicYearId(currentYear._id);
      } else {
        setSelectedAcademicYearId(academicYears[0]._id);
      }
    }
  }, [academicYears, selectedAcademicYearId]);

  // Handle slice messages
  useEffect(() => {
    if (successMessage) {
      setBanner({ type: "success", text: successMessage });
      const timer = setTimeout(() => {
        dispatch(clearClassTeacherMessages());
        setBanner(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      setBanner({ type: "error", text: error });
    }
  }, [error]);

  const handleRefresh = () => {
    dispatch(fetchClassTeacherAssignments({}));
    dispatch(fetchEligibleTeachers());
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);

    if (!selectedTeacherId) {
      setBanner({ type: "error", text: "Please select an active teacher from the dropdown." });
      return;
    }
    if (!selectedClassLevelId) {
      setBanner({ type: "error", text: "Please select a class/class level." });
      return;
    }
    if (!selectedAcademicYearId) {
      setBanner({ type: "error", text: "Please select an academic year." });
      return;
    }

    try {
      const res = await dispatch(
        createClassTeacherAssignment({
          teacherId: selectedTeacherId,
          classLevelId: selectedClassLevelId,
          academicYearId: selectedAcademicYearId,
          programId: selectedProgramId || undefined,
          academicTermId: selectedAcademicTermId || undefined,
          notes: notes.trim() || undefined,
        })
      ).unwrap();

      if (res) {
        // Reset form inputs except academic year
        setSelectedTeacherId("");
        setSelectedClassLevelId("");
        setSelectedProgramId("");
        setSelectedAcademicTermId("");
        setNotes("");
      }
    } catch (err: any) {
      // Error handled via slice/banner
    }
  };

  const handleOpenEdit = (assignment: ClassTeacherAssignmentItem) => {
    setEditingAssignment(assignment);
    setEditTeacherId(assignment.teacher?._id || "");
    setEditClassLevelId(assignment.classLevel?._id || "");
    setEditProgramId(assignment.program?._id || "");
    setEditAcademicYearId(assignment.academicYear?._id || "");
    setEditAcademicTermId(assignment.academicTerm?._id || "");
    setEditIsActive(assignment.isActive);
    setEditNotes(assignment.notes || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;

    try {
      await dispatch(
        updateClassTeacherAssignment({
          id: editingAssignment._id,
          updates: {
            teacherId: editTeacherId,
            classLevelId: editClassLevelId,
            programId: editProgramId || undefined,
            academicYearId: editAcademicYearId,
            academicTermId: editAcademicTermId || undefined,
            isActive: editIsActive,
            status: editIsActive ? "active" : "inactive",
            notes: editNotes.trim() || undefined,
          },
        })
      ).unwrap();

      setEditingAssignment(null);
    } catch (err) {
      // Error handled via slice
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await dispatch(toggleClassTeacherStatus(id)).unwrap();
    } catch (err) {
      // Error handled via slice
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await dispatch(deleteClassTeacherAssignment(deletingId)).unwrap();
      setDeletingId(null);
    } catch (err) {
      // Error handled via slice
    }
  };

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // Search filter
      const teacherName = (a.teacher?.name || "").toLowerCase();
      const teacherId = (a.teacher?.teacherId || "").toLowerCase();
      const teacherEmail = (a.teacher?.email || "").toLowerCase();
      const className = (a.classLevel?.name || "").toLowerCase();
      const progName = (a.program?.name || "").toLowerCase();
      const yearName = (a.academicYear?.name || "").toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        !query ||
        teacherName.includes(query) ||
        teacherId.includes(query) ||
        teacherEmail.includes(query) ||
        className.includes(query) ||
        progName.includes(query) ||
        yearName.includes(query);

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && a.isActive) ||
        (statusFilter === "inactive" && !a.isActive);

      // Class filter
      const matchesClass =
        classFilter === "all" || a.classLevel?._id === classFilter;

      // Year filter
      const matchesYear =
        yearFilter === "all" || a.academicYear?._id === yearFilter;

      return matchesSearch && matchesStatus && matchesClass && matchesYear;
    });
  }, [assignments, searchTerm, statusFilter, classFilter, yearFilter]);

  return (
    <div className="min-h-screen pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pt-6 pb-6 border-b border-gray-200 dark:border-gray-800 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-2">
              <HiOutlineAcademicCap className="w-3.5 h-3.5" />
              Academic Class Staffing
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Class Teacher Assignment Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Designate class teachers to supervise specific classes, compile term results, and submit report cards for admin review.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              type="button"
              disabled={loading || loadingEligibleTeachers}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <HiOutlineArrowPath
                className={`w-4 h-4 ${loading || loadingEligibleTeachers ? "animate-spin" : ""}`}
              />
              Refresh Teachers & List
            </button>
          </div>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-sm ${
            banner.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" ? (
              <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <HiOutlineExclamationTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{banner.text}</span>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ASSIGNMENT FORM */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
          <HiOutlinePlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Assign Class Teacher
          </h2>
        </div>

        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Teacher Dropdown */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Class Teacher <span className="text-rose-500">*</span>
              </label>
              {loadingEligibleTeachers ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <HiOutlineArrowPath className="w-4 h-4 animate-spin text-indigo-600" />
                  Loading database teachers...
                </div>
              ) : (
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  required
                >
                  <option value="">-- Select Active Teacher --</option>
                  {Array.isArray(eligibleTeachers) && eligibleTeachers.map((t: any) => {
                    const isInactive = t.isWithDrawn || t.isSuspended;
                    return (
                      <option
                        key={t._id}
                        value={t._id}
                        disabled={isInactive}
                        className={isInactive ? "text-gray-400 bg-gray-100" : ""}
                      >
                        {t.name} {t.teacherId ? `(${t.teacherId})` : ""} - {t.email}{" "}
                        {isInactive ? "[Inactive / Suspended]" : ""}
                      </option>
                    );
                  })}
                </select>
              )}
              <span className="text-[11px] text-gray-400 mt-1 block">
                Stores MongoDB ObjectId. Inactive or suspended teachers are disabled.
              </span>
            </div>

            {/* Class Level Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Class / Class Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedClassLevelId}
                onChange={(e) => setSelectedClassLevelId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                required
              >
                <option value="">-- Select Class Level --</option>
                {classLevels.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Program Dropdown (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Program (Optional)
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              >
                <option value="">-- All Programs / None --</option>
                {programs.map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.code ? `(${p.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Academic Year <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedAcademicYearId}
                onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                required
              >
                <option value="">-- Select Academic Year --</option>
                {academicYears.map((y: any) => (
                  <option key={y._id} value={y._id}>
                    {y.name} {y.isCurrent ? "(Current Year)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Term Dropdown (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Academic Term (Optional)
              </label>
              <select
                value={selectedAcademicTermId}
                onChange={(e) => setSelectedAcademicTermId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              >
                <option value="">-- Full Year / All Terms --</option>
                {academicTerms.map((t: any) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Administrative Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Lead tutor for SSS1 Science A"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={actionLoading || loadingEligibleTeachers}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md disabled:opacity-50 transition"
            >
              <HiOutlinePlusCircle className="w-5 h-5" />
              {actionLoading ? "Assigning Class Teacher..." : "Assign Class Teacher"}
            </button>
          </div>
        </form>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search teacher, class, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
            <HiOutlineFunnel className="w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Class filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
          >
            <option value="all">All Classes</option>
            {classLevels.map((c: any) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Year filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
          >
            <option value="all">All Academic Years</option>
            {academicYears.map((y: any) => (
              <option key={y._id} value={y._id}>
                {y.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ASSIGNMENTS TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineUserGroup className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Assigned Class Teachers ({filteredAssignments.length})
            </h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {assignments.filter((a) => a.isActive).length} active assignments
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <HiOutlineArrowPath className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
            Loading assignments...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <HiOutlineUserGroup className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              No class teacher assignments found
            </p>
            <p className="text-xs mt-1">
              Use the form above to assign an active teacher to supervise a class.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Class Teacher
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Class Level
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Program
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Academic Year / Term
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Assigned By & Date
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAssignments.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                  >
                    {/* Teacher Details */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {item.teacher?.name || "Unknown Teacher"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.teacher?.teacherId ? `ID: ${item.teacher.teacherId} | ` : ""}
                        {item.teacher?.email}
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-gray-400 italic mt-0.5">
                          "{item.notes}"
                        </div>
                      )}
                    </td>

                    {/* Class */}
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {item.classLevel?.name || "N/A"}
                    </td>

                    {/* Program */}
                    <td className="px-6 py-4">
                      {item.program ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {item.program.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">General / All</span>
                      )}
                    </td>

                    {/* Academic Year / Term */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {item.academicYear?.name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.academicTerm?.name || "All Terms"}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(item._id)}
                        disabled={actionLoading}
                        title="Click to toggle active/inactive status"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                          item.isActive
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {item.isActive ? (
                          <>
                            <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <HiOutlineXCircle className="w-3.5 h-3.5" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>

                    {/* Assigned By & Date */}
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      <div>{item.assignedBy?.name || "Admin"}</div>
                      <div>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "-"}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Assignment"
                          className="p-1.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(item._id)}
                          title="Delete Assignment"
                          className="p-1.5 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
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

      {/* EDIT ASSIGNMENT MODAL */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Edit Class Teacher Assignment
              </h3>
              <button
                onClick={() => setEditingAssignment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Teacher
                </label>
                <select
                  value={editTeacherId}
                  onChange={(e) => setEditTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  {Array.isArray(eligibleTeachers) && eligibleTeachers.map((t: any) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Class Level
                </label>
                <select
                  value={editClassLevelId}
                  onChange={(e) => setEditClassLevelId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  {classLevels.map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Program
                </label>
                <select
                  value={editProgramId}
                  onChange={(e) => setEditProgramId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">General / None</option>
                  {programs.map((p: any) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Academic Year
                </label>
                <select
                  value={editAcademicYearId}
                  onChange={(e) => setEditAcademicYearId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  {academicYears.map((y: any) => (
                    <option key={y._id} value={y._id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Status
                </label>
                <div className="flex items-center gap-3 mt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-gray-800 dark:text-gray-200">
                      Active Class Teacher Assignment
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <HiOutlineExclamationTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Delete Assignment?
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to remove this class teacher assignment? The teacher will no longer be designated as the class tutor for compiling this class's results.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow transition disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
