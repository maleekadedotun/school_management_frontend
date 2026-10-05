import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchTeacherAssignments,
  publishAssignment,
  deleteAssignment,
} from "../../features/assignments/assignmentsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import { fetchSubjects } from "../../features/subjects/subjectsSlice";
import { fetchPrograms } from "../../features/programs/programsSlice";
import {
  FiEdit3,
  FiSend,
  FiTrash2,
  FiPlus,
  FiClock,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
  FiSearch,
  FiCalendar,
  FiPaperclip,
} from "react-icons/fi";
import toast from "react-hot-toast";

interface AssignmentItem {
  _id: string;
  title: string;
  description?: string;
  status: "draft" | "published" | "active" | "closed";
  classLevel?: { _id: string; name: string } | string;
  subject?: { _id: string; name: string } | string;
  program?: { _id: string; name: string } | string;
  dueDate?: string;
  dueTime?: string;
  totalMarks?: number;
  passMark?: number;
  attachment?: {
    url: string;
    filename: string;
    fileType?: string;
    size?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function TeacherAssignmentDrafts() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { items: allAssignments, loading, actionLoading } = useAppSelector(
    (state) => state.assignments
  );
  const { items: classLevels } = useAppSelector((state) => state.classLevels);
  const { items: subjects } = useAppSelector((state) => state.subjects);
  const { items: programs } = useAppSelector((state) => state.programs);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [readinessFilter, setReadinessFilter] = useState<"all" | "ready" | "incomplete">("all");

  // Modals state
  const [publishingDraft, setPublishingDraft] = useState<AssignmentItem | null>(null);
  const [deletingDraft, setDeletingDraft] = useState<AssignmentItem | null>(null);
  const [missingFieldsDraft, setMissingFieldsDraft] = useState<{
    draft: AssignmentItem;
    missing: string[];
  } | null>(null);

  // Fetch teacher assignments and filters on mount
  useEffect(() => {
    dispatch(fetchTeacherAssignments());
    dispatch(fetchClassLevels());
    dispatch(fetchSubjects());
    dispatch(fetchPrograms());
  }, [dispatch]);

  // Extract all drafts
  const drafts = useMemo(() => {
    return allAssignments.filter((a) => a.status === "draft") as AssignmentItem[];
  }, [allAssignments]);

  // Helper to check what required fields are missing for a draft to be publishable
  const getDraftReadiness = (item: AssignmentItem) => {
    const missing: string[] = [];
    if (!item.title || !item.title.trim()) missing.push("Title");
    if (!item.classLevel) missing.push("Class Level");
    if (!item.subject) missing.push("Subject");
    if (!item.dueDate) missing.push("Due Date");
    if (
      !item.description ||
      !item.description.trim() ||
      item.description === "<p></p>" ||
      item.description === "<p><br></p>"
    ) {
      missing.push("Assignment Instructions/Content");
    }

    const isReady = missing.length === 0;
    return { isReady, missing };
  };

  // Filtered Drafts list
  const filteredDrafts = useMemo(() => {
    return drafts.filter((item) => {
      const q = search.toLowerCase().trim();
      const subjectName = typeof item.subject === "object" ? item.subject?.name : "";
      const className = typeof item.classLevel === "object" ? item.classLevel?.name : "";
      const descText = item.description ? item.description.replace(/<[^>]+>/g, " ") : "";

      const matchSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        subjectName?.toLowerCase().includes(q) ||
        className?.toLowerCase().includes(q) ||
        descText.toLowerCase().includes(q);

      const classId = typeof item.classLevel === "object" ? item.classLevel?._id : item.classLevel;
      const matchClass = classFilter === "all" || String(classId) === classFilter;

      const subjectId = typeof item.subject === "object" ? item.subject?._id : item.subject;
      const matchSubject = subjectFilter === "all" || String(subjectId) === subjectFilter;

      const { isReady } = getDraftReadiness(item);
      let matchReadiness = true;
      if (readinessFilter === "ready") matchReadiness = isReady;
      if (readinessFilter === "incomplete") matchReadiness = !isReady;

      return matchSearch && matchClass && matchSubject && matchReadiness;
    });
  }, [drafts, search, classFilter, subjectFilter, readinessFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = drafts.length;
    let readyCount = 0;
    let incompleteCount = 0;

    drafts.forEach((d) => {
      const { isReady } = getDraftReadiness(d);
      if (isReady) readyCount++;
      else incompleteCount++;
    });

    return { total, readyCount, incompleteCount };
  }, [drafts]);

  // Format date helper
  const formatDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return "Not set";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Not set";
    const formatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return timeStr ? `${formatted} at ${timeStr}` : formatted;
  };

  // Time elapsed helper
  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    const updated = new Date(dateStr).getTime();
    const diff = Math.floor((Date.now() - updated) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Publish Draft handler
  const handlePublishClick = (draft: AssignmentItem) => {
    const { isReady, missing } = getDraftReadiness(draft);
    if (!isReady) {
      setMissingFieldsDraft({ draft, missing });
      return;
    }
    setPublishingDraft(draft);
  };

  const confirmPublish = async () => {
    if (!publishingDraft) return;
    try {
      await dispatch(publishAssignment(publishingDraft._id)).unwrap();
      toast.success(`"${publishingDraft.title}" published successfully! Students can now access it.`);
      setPublishingDraft(null);
      dispatch(fetchTeacherAssignments());
    } catch (err: any) {
      toast.error(err || "Failed to publish assignment. Please try again.");
    }
  };

  // Delete Draft handler
  const confirmDelete = async () => {
    if (!deletingDraft) return;
    try {
      await dispatch(deleteAssignment(deletingDraft._id)).unwrap();
      toast.success("Draft deleted successfully.");
      setDeletingDraft(null);
      dispatch(fetchTeacherAssignments());
    } catch (err: any) {
      toast.error(err || "Failed to delete draft.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Link
            to="/teacher/assignments"
            className="p-2.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition shadow-xs"
            title="Back to Assignments Portal"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Assignment Drafts
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                {stats.total} {stats.total === 1 ? "Draft" : "Drafts"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your saved in-progress assignments. Pick up where you left off anytime or publish when ready.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Link
            to="/teacher/assignments"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-xs transition"
          >
            <FiFileText className="w-4 h-4 text-gray-500" />
            <span>Assignments Portal</span>
          </Link>

          <Link
            to="/teacher/assignments/create"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 active:scale-95 transition"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create New Assignment</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Saved Drafts
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {stats.total}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Available to continue editing
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl">
            <FiClock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ready to Publish
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.readyCount}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              All required fields completed
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl">
            <FiCheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Incomplete Drafts
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-500 dark:text-rose-400 mt-1">
              {stats.incompleteCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Missing deadline or class details
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 flex items-center justify-center text-xl">
            <FiAlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drafts by title, subject, class..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-hidden transition"
          />
        </div>

        {/* Readiness Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">
          <button
            type="button"
            onClick={() => setReadinessFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition ${
              readinessFilter === "all"
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs font-semibold"
                : "hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            All ({drafts.length})
          </button>
          <button
            type="button"
            onClick={() => setReadinessFilter("ready")}
            className={`px-3 py-1.5 rounded-lg transition ${
              readinessFilter === "ready"
                ? "bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                : "hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Ready ({stats.readyCount})
          </button>
          <button
            type="button"
            onClick={() => setReadinessFilter("incomplete")}
            className={`px-3 py-1.5 rounded-lg transition ${
              readinessFilter === "incomplete"
                ? "bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 shadow-xs font-semibold"
                : "hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Incomplete ({stats.incompleteCount})
          </button>
        </div>

        {/* Class Filter */}
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="text-xs py-2 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="all">All Classes</option>
          {classLevels.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Subject Filter */}
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="text-xs py-2 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Drafts List Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Loading your assignment drafts...</p>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4 text-2xl">
            <FiFileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {search || classFilter !== "all" || subjectFilter !== "all" || readinessFilter !== "all"
              ? "No drafts matched your filters"
              : "No Assignment Drafts Found"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
            {search || classFilter !== "all" || subjectFilter !== "all" || readinessFilter !== "all"
              ? "Try resetting your search or filter options to see all saved drafts."
              : "You do not have any pending drafts. Click below to start creating a new assignment."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {(search || classFilter !== "all" || subjectFilter !== "all" || readinessFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setClassFilter("all");
                  setSubjectFilter("all");
                  setReadinessFilter("all");
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Reset Filters
              </button>
            )}
            <Link
              to="/teacher/assignments/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand-500/20 active:scale-95 transition"
            >
              <FiPlus className="w-4 h-4" />
              <span>Create an Assignment</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrafts.map((draft) => {
            const { isReady, missing } = getDraftReadiness(draft);
            const subjectName =
              typeof draft.subject === "object" ? draft.subject?.name : draft.subject || "No Subject";
            const className =
              typeof draft.classLevel === "object"
                ? draft.classLevel?.name
                : draft.classLevel || "No Class";
            const programName =
              typeof draft.program === "object" ? draft.program?.name : draft.program;
            const plainText = draft.description
              ? draft.description.replace(/<[^>]+>/g, " ").trim()
              : "No instructions typed yet.";

            return (
              <div
                key={draft._id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Draft Card Header */}
                <div className="p-5 pb-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                      <FiClock className="w-3 h-3" />
                      Draft
                    </span>

                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      {draft.updatedAt ? `Saved ${timeAgo(draft.updatedAt)}` : ""}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-500 transition-colors">
                    {draft.title || "Untitled Assignment Draft"}
                  </h3>

                  {/* Academic Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="px-2 py-0.5 rounded-lg font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                      {subjectName}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {className}
                    </span>
                    {programName && (
                      <span className="px-2 py-0.5 rounded-lg font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {programName}
                      </span>
                    )}
                  </div>

                  {/* Excerpt preview */}
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {plainText}
                  </p>

                  {/* Attachment Badge if present */}
                  {draft.attachment && draft.attachment.url && (
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <FiPaperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{draft.attachment.filename || "Attached File"}</span>
                    </div>
                  )}

                  {/* Completeness Checklist / Readiness Indicator */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-semibold text-gray-500 dark:text-gray-400">
                        Publish Readiness:
                      </span>
                      {isReady ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <FiCheckCircle className="w-3 h-3" /> Ready to publish
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                          <FiAlertCircle className="w-3 h-3" /> Missing {missing.length} {missing.length === 1 ? "field" : "fields"}
                        </span>
                      )}
                    </div>

                    {!isReady && (
                      <div className="flex flex-wrap gap-1">
                        {missing.map((field, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40"
                          >
                            Missing {field}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Draft Card Footer & Actions */}
                <div className="p-4 pt-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{draft.dueDate ? `Due: ${formatDate(draft.dueDate, draft.dueTime)}` : "No due date set"}</span>
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {draft.totalMarks || 100} Marks
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Primary Resume Editing Button */}
                    <Link
                      to={`/teacher/assignments/create?draftId=${draft._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95"
                    >
                      <FiEdit3 className="w-3.5 h-3.5" />
                      <span>Resume Editing</span>
                    </Link>

                    {/* Publish Button */}
                    <button
                      type="button"
                      onClick={() => handlePublishClick(draft)}
                      disabled={actionLoading}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition active:scale-95 disabled:opacity-50"
                      title={isReady ? "Publish Assignment Now" : "Review & Complete to Publish"}
                    >
                      <FiSend className="w-3.5 h-3.5" />
                      <span>Publish</span>
                    </button>

                    {/* Delete Draft Button */}
                    <button
                      type="button"
                      onClick={() => setDeletingDraft(draft)}
                      disabled={actionLoading}
                      className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                      title="Delete Draft"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Publish Draft */}
      {publishingDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto sm:mx-0">
              <FiSend className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Publish "{publishingDraft.title}"?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                Publishing this assignment will immediately give all eligible students in the designated class and subject access to view and solve it directly on their portal.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-xs text-gray-600 dark:text-gray-300 space-y-1.5">
              <div>
                <strong className="text-gray-900 dark:text-white">Subject:</strong>{" "}
                {typeof publishingDraft.subject === "object" ? publishingDraft.subject?.name : publishingDraft.subject}
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Class Level:</strong>{" "}
                {typeof publishingDraft.classLevel === "object" ? publishingDraft.classLevel?.name : publishingDraft.classLevel}
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Deadline:</strong>{" "}
                {formatDate(publishingDraft.dueDate, publishingDraft.dueTime)}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPublishingDraft(null)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmPublish}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition"
              >
                {actionLoading ? "Publishing..." : "Confirm & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal: Missing Fields before Publishing */}
      {missingFieldsDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto sm:mx-0">
              <FiAlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Draft Cannot Be Published Yet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                Before students can receive this assignment, the following required information must be provided:
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              {missingFieldsDraft.missing.map((field, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>{field}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMissingFieldsDraft(null)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = missingFieldsDraft.draft._id;
                  setMissingFieldsDraft(null);
                  navigate(`/teacher/assignments/create?draftId=${id}`);
                }}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition"
              >
                Resume & Complete Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Draft */}
      {deletingDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto sm:mx-0">
              <FiTrash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Draft?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                Are you sure you want to permanently delete "{deletingDraft.title || "Untitled Draft"}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDraft(null)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmDelete}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition"
              >
                {actionLoading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
