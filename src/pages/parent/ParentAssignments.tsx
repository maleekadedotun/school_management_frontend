import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchParentChildrenAssignments } from "../../features/assignments/assignmentsSlice";
import {
  fetchParentProfile,
  linkStudentToParent,
} from "../../features/parentAuth/parentAuthSlice";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineEye,
  HiOutlineArrowDownTray,
  HiOutlineXMark,
  HiOutlineLockClosed,
  HiOutlineMagnifyingGlass,
  HiOutlineUserCircle,
  HiOutlinePlusCircle,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import toast from "react-hot-toast";

export default function ParentAssignments() {
  const dispatch = useAppDispatch();

  const { parentData, loading } = useAppSelector((state) => state.assignments);
  const { parent, linkLoading } = useAppSelector((state) => state.parentAuth);

  // Filters & Selection
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [activeStatusTab, setActiveStatusTab] = useState<
    "all" | "pending" | "submitted" | "graded" | "overdue"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Modals
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [childIdentifierInput, setChildIdentifierInput] = useState("");

  // Initial Data Fetch
  useEffect(() => {
    dispatch(fetchParentProfile());
    dispatch(fetchParentChildrenAssignments());
  }, [dispatch]);

  // Refetch when child filter changes
  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    dispatch(
      fetchParentChildrenAssignments({
        studentId: childId === "all" ? undefined : childId,
      })
    );
  };

  // Handle Linking another student to parent
  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childIdentifierInput.trim()) {
      toast.error("Please enter student admission number (StudentId) or email");
      return;
    }

    const res = await dispatch(
      linkStudentToParent({ studentIdentifier: childIdentifierInput.trim() })
    );

    if (linkStudentToParent.fulfilled.match(res)) {
      toast.success("Child successfully linked to your parent portal!");
      setShowLinkModal(false);
      setChildIdentifierInput("");
      dispatch(fetchParentProfile());
      dispatch(fetchParentChildrenAssignments());
    } else {
      toast.error((res.payload as string) || "Could not find student with this identifier");
    }
  };

  const children = parentData?.children || parent?.children || [];
  const assignments = parentData?.assignments || [];
  const stats = parentData?.stats || {
    total: 0,
    pending: 0,
    submitted: 0,
    graded: 0,
    late: 0,
    averageScore: 0,
  };

  // Distinct subjects for subject filter
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach((a) => {
      const name = a.subject?.name || (typeof a.subject === "string" ? a.subject : "");
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [assignments]);

  // Filtered Assignments List
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      // Child Filter
      if (selectedChildId !== "all" && item.child?._id !== selectedChildId) {
        return false;
      }

      // Status Filter
      if (activeStatusTab !== "all") {
        const subStatus: string = item.submissionStatus || "pending";
        if (activeStatusTab === "pending" && subStatus !== "pending") {
          return false;
        }
        if (activeStatusTab === "submitted" && subStatus !== "submitted") {
          return false;
        }
        if (activeStatusTab === "graded" && subStatus !== "graded") {
          return false;
        }
        if (activeStatusTab === "overdue" && subStatus !== "overdue") {
          return false;
        }
      }

      // Subject Filter
      if (selectedSubject !== "all") {
        const subName = item.subject?.name || item.subject || "";
        if (subName !== selectedSubject) return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const subjectMatch = (item.subject?.name || item.subject || "").toLowerCase().includes(q);
        const childMatch = (item.child?.name || "").toLowerCase().includes(q);
        const teacherMatch = (item.createdBy?.name || "").toLowerCase().includes(q);
        if (!titleMatch && !subjectMatch && !childMatch && !teacherMatch) {
          return false;
        }
      }

      return true;
    });
  }, [assignments, selectedChildId, activeStatusTab, selectedSubject, searchQuery]);

  // Format date helper
  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "No deadline";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr?: string | Date) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Relative status text
  const getDeadlineStatus = (dueDateStr?: string, submissionStatus?: string) => {
    if (submissionStatus === "graded") {
      return { text: "Graded & Completed", color: "text-emerald-600 dark:text-emerald-400" };
    }
    if (submissionStatus === "submitted") {
      return { text: "Submitted on time", color: "text-blue-600 dark:text-blue-400" };
    }
    if (submissionStatus === "late") {
      return { text: "Submitted late", color: "text-amber-600 dark:text-amber-400" };
    }
    if (submissionStatus === "overdue") {
      return { text: "Deadline passed (Overdue)", color: "text-rose-600 dark:text-rose-400 font-bold" };
    }
    if (!dueDateStr) {
      return { text: "Open deadline", color: "text-slate-500" };
    }

    const due = new Date(dueDateStr).getTime();
    const now = Date.now();
    const diffHours = Math.round((due - now) / (1000 * 60 * 60));

    if (diffHours < 0) {
      return { text: "Overdue", color: "text-rose-600 dark:text-rose-400 font-bold" };
    }
    if (diffHours <= 24) {
      return { text: "Due today!", color: "text-amber-600 dark:text-amber-400 font-bold" };
    }
    const diffDays = Math.ceil(diffHours / 24);
    return { text: `Due in ${diffDays} day${diffDays > 1 ? "s" : ""}`, color: "text-slate-600 dark:text-slate-300" };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2.5 text-blue-200 border border-white/10">
              <HiOutlineClipboardDocumentList className="w-4 h-4 text-indigo-300" />
              <span>Parent Portal • Student Assignment Monitor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Student Assignments
            </h1>
            <p className="text-blue-100/90 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Track assigned homework, coursework questions, submission deadlines, and grading feedback for your children in real time.
            </p>
          </div>

          {/* Child Switcher Pills */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <HiOutlineUserCircle className="w-4 h-4 text-indigo-300" />
              Select Child:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectChild("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedChildId === "all"
                    ? "bg-white text-indigo-950 shadow-md scale-102 font-extrabold"
                    : "bg-white/10 text-white/90 hover:bg-white/20 border border-white/10"
                }`}
              >
                All Children ({children.length})
              </button>

              {children.map((child: any) => {
                const childId = child._id || child;
                const isSelected = selectedChildId === childId;
                return (
                  <button
                    key={childId}
                    type="button"
                    onClick={() => handleSelectChild(childId)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-white text-indigo-950 shadow-md scale-102 font-extrabold"
                        : "bg-white/10 text-white/90 hover:bg-white/20 border border-white/10"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span>{child.name || "Student"}</span>
                    {child.currentClassLevel && (
                      <span className="text-[10px] opacity-75 font-normal">
                        ({child.currentClassLevel})
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowLinkModal(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/60 hover:bg-indigo-600 text-white border border-indigo-400/30 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Link another child"
              >
                <HiOutlinePlusCircle className="w-4 h-4" />
                <span>Link Child</span>
              </button>
            </div>
          </div>
        </div>

        {/* Read-Only Notice Bar */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center gap-2.5 text-xs text-blue-200/90 bg-white/5 px-4 py-2.5 rounded-2xl">
          <HiOutlineLockClosed className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            <strong className="text-white font-semibold">Monitor Mode:</strong> You are viewing official assignment records for your child. Parents are not permitted to take or submit assignments; all coursework must be submitted directly through the student portal.
          </span>
        </div>
      </div>

      {/* Analytics & Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Assigned */}
        <div className="bg-white dark:bg-[#0f1629] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
            <HiOutlineClipboardDocumentList className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Assigned
            </p>
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">
              {stats.total}
            </p>
          </div>
        </div>

        {/* Pending Action */}
        <div className="bg-white dark:bg-[#0f1629] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
            <HiOutlineClock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending
            </p>
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">
              {stats.pending}
            </p>
          </div>
        </div>

        {/* Submitted */}
        <div className="bg-white dark:bg-[#0f1629] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0">
            <HiOutlineCheckCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Submitted
            </p>
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">
              {stats.submitted}
            </p>
          </div>
        </div>

        {/* Graded */}
        <div className="bg-white dark:bg-[#0f1629] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
            <HiOutlineShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Graded
            </p>
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">
              {stats.graded}
            </p>
          </div>
        </div>

        {/* Average Score */}
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#0f1629] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xl shrink-0">
            <HiOutlineAcademicCap className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Avg. Grade
            </p>
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">
              {stats.averageScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-[#0f1629] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl">
            {(
              [
                { id: "all" as const, label: "All Tasks" },
                { id: "pending" as const, label: "Pending", count: stats.pending },
                { id: "submitted" as const, label: "Submitted", count: stats.submitted },
                { id: "graded" as const, label: "Graded", count: stats.graded },
                { id: "overdue" as const, label: "Overdue" },
              ] as {
                id: "all" | "pending" | "submitted" | "graded" | "overdue";
                label: string;
                count?: number;
              }[]
            ).map((tab) => {
              const active = activeStatusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveStatusTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        active
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box & Subject Filter */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Subject Selector */}
            {subjectsList.length > 0 && (
              <select
                aria-label="Filter by Subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="h-10 text-xs px-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Subjects</option>
                {subjectsList.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by assignment title, subject, teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Assignments List */}
      {loading ? (
        <div className="bg-white dark:bg-[#0f1629] rounded-3xl p-16 text-center shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            Loading student assignments...
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Retrieving published coursework records for your children.
          </p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white dark:bg-[#0f1629] rounded-3xl p-16 text-center shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <HiOutlineClipboardDocumentList className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            No assignments found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            {children.length === 0
              ? "You do not have any students linked to your parent account yet. Click 'Link Child' above to link your child using their admission number."
              : activeStatusTab !== "all" || searchQuery
              ? "No assignments matched your active filters. Try changing or clearing your search."
              : "No coursework or assignments have been issued to your child's class yet."}
          </p>
          {children.length === 0 && (
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md"
            >
              Link Child Account
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredAssignments.map((item) => {
            const deadlineStatus = getDeadlineStatus(item.dueDate, item.submissionStatus);

            // Badge styling
            const currentStatus: string = item.submissionStatus || "pending";
            let statusBadge = {
              text: "Pending",
              bg: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800",
            };
            if (currentStatus === "submitted") {
              statusBadge = {
                text: "Submitted",
                bg: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800",
              };
            } else if (currentStatus === "graded") {
              statusBadge = {
                text: `Graded • ${item.submission?.score}/${item.totalMarks || 100}`,
                bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold",
              };
            } else if (currentStatus === "late") {
              statusBadge = {
                text: "Submitted Late",
                bg: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800",
              };
            } else if (currentStatus === "overdue") {
              statusBadge = {
                text: "Overdue",
                bg: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold",
              };
            }

            return (
              <div
                key={`${item._id}-${item.child?._id}`}
                className="bg-white dark:bg-[#0f1629] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Header: Child Tag & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {item.child?.name || "Student"}
                      {item.child?.currentClassLevel && (
                        <span className="text-[10px] opacity-75">
                          • {item.child.currentClassLevel}
                        </span>
                      )}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}
                    >
                      {statusBadge.text}
                    </span>
                  </div>

                  {/* Subject & Title */}
                  <div className="mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                      {item.subject?.name || item.subject || "General Subject"}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1 mt-0.5">
                      {item.title}
                    </h3>
                  </div>

                  {/* Description preview snippet */}
                  {item.description && (
                    <p
                      className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: item.description.replace(/<[^>]*>?/gm, " "),
                      }}
                    />
                  )}

                  {/* Due Date & Teacher metadata */}
                  <div className="space-y-1.5 py-3 border-t border-gray-100 dark:border-gray-800/80 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <HiOutlineClock className="w-4 h-4 text-gray-400" />
                        <span>Due Date:</span>
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {formatDate(item.dueDate)} ({item.dueTime || "23:59"})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span>Timeline:</span>
                      <span className={`font-semibold ${deadlineStatus.color}`}>
                        {deadlineStatus.text}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span>Total Marks:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {item.totalMarks || 100} pts (Pass: {item.passMark || 50} pts)
                      </span>
                    </div>

                    {item.createdBy?.name && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Teacher:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          {item.createdBy.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: View Details & Non-submission indicator */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <HiOutlineLockClosed className="w-3.5 h-3.5 text-amber-500" />
                    <span>Monitor Only</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedAssignment(item)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <HiOutlineEye className="w-4 h-4" />
                    <span>View Progress</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Details & Monitor Modal */}
      {selectedAssignment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedAssignment(null)}
        >
          <div
            className="bg-white dark:bg-[#0f1629] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4 bg-gradient-to-r from-gray-50 to-indigo-50/30 dark:from-gray-900/40 dark:to-indigo-950/20">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                    {selectedAssignment.subject?.name || selectedAssignment.subject || "Subject"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    Child: {selectedAssignment.child?.name}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {selectedAssignment.title}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setSelectedAssignment(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer shrink-0"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-sm text-gray-700 dark:text-gray-300">
              {/* Parent Security Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                <HiOutlineLockClosed className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Parent View Only:</strong>
                  <span>
                    You are monitoring your child's assignment progress. You cannot take or submit assignments from this parent portal. Submissions must be done from your child's student account.
                  </span>
                </div>
              </div>

              {/* Assignment Meta Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800/80 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                    Due Date & Time
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatDate(selectedAssignment.dueDate)} at {selectedAssignment.dueTime || "23:59"}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                    Max Marks / Pass
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {selectedAssignment.totalMarks || 100} pts ({selectedAssignment.passMark || 50} pts)
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                    Assigned By
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {selectedAssignment.createdBy?.name || "Teacher"}
                  </span>
                </div>
              </div>

              {/* Teacher Instructions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Assignment Instructions & Description:
                </h4>
                <div
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 leading-relaxed text-xs sm:text-sm prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedAssignment.description ||
                      "<p className='text-gray-400 italic'>No special instructions provided.</p>",
                  }}
                />
              </div>

              {/* Teacher Attachment File (if any) */}
              {selectedAssignment.attachment?.url && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Teacher Attached Document:
                  </h4>
                  <a
                    href={selectedAssignment.attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-semibold text-xs transition-all cursor-pointer"
                  >
                    <HiOutlineArrowDownTray className="w-4 h-4" />
                    <span>
                      Download {selectedAssignment.attachment.filename || "Assignment Guide / Question Paper"}
                    </span>
                  </a>
                </div>
              )}

              {/* Child's Submission Section */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-between">
                  <span>Child Submission Status:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold normal-case">
                    {selectedAssignment.child?.name}
                  </span>
                </h4>

                {selectedAssignment.submission ? (
                  <div className="space-y-3.5">
                    {/* Submission Metadata Card */}
                    <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-blue-900 dark:text-blue-200">
                          Submitted On:
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {formatDateTime(selectedAssignment.submission.submittedAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-blue-900 dark:text-blue-200">
                          Submission Status:
                        </span>
                        <span className="font-bold uppercase tracking-wider text-xs text-blue-700 dark:text-blue-300">
                          {selectedAssignment.submission.status}
                        </span>
                      </div>

                      {/* Submitted Text */}
                      {selectedAssignment.submission.submissionText && (
                        <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/50">
                          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                            Student Response:
                          </span>
                          <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-white/70 dark:bg-black/20 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                            {selectedAssignment.submission.submissionText}
                          </p>
                        </div>
                      )}

                      {/* Submitted Attachment */}
                      {selectedAssignment.submission.attachment?.url && (
                        <div className="pt-2">
                          <a
                            href={selectedAssignment.submission.attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline"
                          >
                            <HiOutlineArrowDownTray className="w-4 h-4" />
                            <span>
                              Download Submitted Work ({selectedAssignment.submission.attachment.filename || "Attachment"})
                            </span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Teacher Grading & Feedback */}
                    {selectedAssignment.submission.status === "graded" && (
                      <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                            Teacher Evaluation & Score:
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-sm">
                            {selectedAssignment.submission.score} / {selectedAssignment.totalMarks || 100}
                          </span>
                        </div>

                        {selectedAssignment.submission.feedback && (
                          <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/50">
                            <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 block mb-1">
                              Teacher Feedback:
                            </span>
                            <blockquote className="text-xs italic text-emerald-950 dark:text-emerald-100 bg-white/70 dark:bg-black/20 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                              "{selectedAssignment.submission.feedback}"
                            </blockquote>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center">
                    <HiOutlineExclamationTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Not Submitted Yet
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 max-w-md mx-auto">
                      Your child {selectedAssignment.child?.name} has not turned in work for this assignment. Please encourage them to log in before the deadline on {formatDate(selectedAssignment.dueDate)}.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/60">
              <span className="text-[11px] text-gray-400">
                School LMS • Parent Monitoring Portal
              </span>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Child Modal */}
      {showLinkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowLinkModal(false)}
        >
          <div
            className="bg-white dark:bg-[#0f1629] rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Link Child to Parent Account
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Enter your child's student admission number (e.g. STU12345) or registered student email to connect them to your parent monitoring dashboard.
            </p>

            <form onSubmit={handleLinkChild} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Student ID or Email Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. STU12345 or child@school.com"
                  value={childIdentifierInput}
                  onChange={(e) => setChildIdentifierInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {linkLoading ? "Linking..." : "Link Child"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
