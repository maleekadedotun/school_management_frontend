import { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  fetchTeacherLessonNotes,
  createLessonNote,
  updateLessonNote,
  submitLessonNoteForReview,
  sendLessonNoteToStudents,
  deleteLessonNote,
  type LessonNoteItem,
} from "../../../features/lessonNotes/lessonNotesSlice";
import {
  FiFileText,
  FiPlus,
  FiSearch,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiX,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiSend,
  FiShield,
  FiMessageSquare,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function LessonNotes() {
  const dispatch = useAppDispatch();
  const teacher = useAppSelector((state) => state.teacherAuth.teacher);
  const subjectsList = useAppSelector((state) => state.subjects.items);
  const classLevelsList = useAppSelector((state) => state.classLevels.items);
  const { items: reduxNotes, loading } = useAppSelector((state) => state.lessonNotes);

  // Fetch teacher notes from backend on mount
  useEffect(() => {
    dispatch(fetchTeacherLessonNotes());
  }, [dispatch]);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals & Active Note
  const [viewingNote, setViewingNote] = useState<LessonNoteItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    subjectName:
      typeof teacher?.subject === "object"
        ? (teacher?.subject as any)?.name
        : teacher?.subject || "Mathematics",
    classLevelName:
      typeof teacher?.classLevel === "object"
        ? (teacher?.classLevel as any)?.name
        : teacher?.classLevel || "JSS 1",
    topic: "",
    subtopic: "",
    week: "Week 1",
    duration: "45 Minutes",
    lessonDate: new Date().toISOString().split("T")[0],
    learningObjectives: "",
    introduction: "",
    lessonContent: "",
    activities: "",
    teachingMaterials: "",
    assessment: "",
    conclusion: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingNoteId(null);
    setFormData(initialFormState);
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (note: LessonNoteItem) => {
    if (note.status === "pending_review") {
      toast.error("This note is currently locked under Admin review. Please wait for the admin decision.");
      return;
    }
    setEditingNoteId(note._id);
    setFormData({
      subjectName: note.subjectName || "",
      classLevelName: note.classLevelName || "",
      topic: note.topic || "",
      subtopic: note.subtopic || "",
      week: note.week || "Week 1",
      duration: note.duration || "45 Minutes",
      lessonDate: note.lessonDate ? new Date(note.lessonDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      learningObjectives: note.learningObjectives || "",
      introduction: note.introduction || "",
      lessonContent: note.lessonContent || "",
      activities: note.activities || "",
      teachingMaterials: note.teachingMaterials || "",
      assessment: note.assessment || "",
      conclusion: note.conclusion || "",
    });
    setIsEditorOpen(true);
  };

  // Save Note as Draft or Submit directly for review
  const handleSaveNote = async (action: "draft" | "submit_for_review") => {
    if (!formData.topic.trim()) {
      toast.error("Please enter a topic for the lesson note");
      return;
    }
    if (!formData.subjectName.trim()) {
      toast.error("Please select or enter a subject");
      return;
    }
    if (!formData.classLevelName.trim()) {
      toast.error("Please select or enter a class level");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        status: action === "submit_for_review" ? "pending_review" : "draft",
      };

      if (editingNoteId) {
        await dispatch(updateLessonNote({ id: editingNoteId, ...payload })).unwrap();
        if (action === "submit_for_review") {
          await dispatch(submitLessonNoteForReview(editingNoteId)).unwrap();
          toast.success("Lesson note updated and submitted for Admin review!");
        } else {
          toast.success("Lesson note draft updated successfully!");
        }
      } else {
        await dispatch(createLessonNote(payload)).unwrap();
        toast.success(
          action === "submit_for_review"
            ? "Lesson note submitted for Admin review!"
            : "Lesson note saved as draft!"
        );
      }
      setIsEditorOpen(false);
      dispatch(fetchTeacherLessonNotes());
    } catch (err: any) {
      toast.error(err || "Failed to save lesson note");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit an existing draft or rejected note for admin review
  const handleSubmitForReview = async (id: string, topic: string) => {
    try {
      await dispatch(submitLessonNoteForReview(id)).unwrap();
      toast.success(`"${topic}" has been submitted for Admin review!`);
      dispatch(fetchTeacherLessonNotes());
    } catch (err: any) {
      toast.error(err || "Failed to submit for review");
    }
  };

  // Send an approved note to students
  const handleSendToStudents = async (note: LessonNoteItem) => {
    if (note.status !== "approved") {
      toast.error("Admin has to review and approve the lesson note before it can be sent to students.");
      return;
    }

    try {
      await dispatch(sendLessonNoteToStudents(note._id)).unwrap();
      toast.success(`Lesson note published to ${note.classLevelName} students!`);
      dispatch(fetchTeacherLessonNotes());
    } catch (err: any) {
      toast.error(err || "Failed to send lesson note to students");
    }
  };

  // Delete Note
  const handleDeleteNote = async (id: string, topicName: string) => {
    if (window.confirm(`Are you sure you want to delete lesson note "${topicName}"?`)) {
      try {
        await dispatch(deleteLessonNote(id)).unwrap();
        toast.success("Lesson note deleted");
        if (viewingNote?._id === id) setViewingNote(null);
        dispatch(fetchTeacherLessonNotes());
      } catch (err: any) {
        toast.error(err || "Failed to delete lesson note");
      }
    }
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return reduxNotes.filter((n) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        n.topic.toLowerCase().includes(q) ||
        (n.subtopic && n.subtopic.toLowerCase().includes(q)) ||
        n.subjectName.toLowerCase().includes(q) ||
        n.classLevelName.toLowerCase().includes(q) ||
        (n.lessonContent && n.lessonContent.toLowerCase().includes(q));

      const matchSubject = subjectFilter === "all" || n.subjectName === subjectFilter;
      const matchClass = classFilter === "all" || n.classLevelName === classFilter;
      const matchStatus = statusFilter === "all" || n.status === statusFilter;

      return matchSearch && matchSubject && matchClass && matchStatus;
    });
  }, [reduxNotes, search, subjectFilter, classFilter, statusFilter]);

  // Unique subjects and classes for filter dropdowns
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    reduxNotes.forEach((n) => n.subjectName && set.add(n.subjectName));
    subjectsList.forEach((s) => s.name && set.add(s.name));
    return Array.from(set);
  }, [reduxNotes, subjectsList]);

  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    reduxNotes.forEach((n) => n.classLevelName && set.add(n.classLevelName));
    classLevelsList.forEach((c) => c.name && set.add(c.name));
    return Array.from(set);
  }, [reduxNotes, classLevelsList]);

  // Status badge helper
  const renderStatusBadge = (note: LessonNoteItem) => {
    switch (note.status) {
      case "approved":
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <FiCheckCircle className="w-3 h-3" />
              Approved by Admin
            </span>
            {note.sentToStudents ? (
              <span className="text-[10px] text-blue-400 font-medium">
                Sent to Students
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 font-medium">
                Ready to Send
              </span>
            )}
          </div>
        );
      case "pending_review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <FiClock className="w-3 h-3 animate-spin" />
            Under Admin Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <FiAlertCircle className="w-3 h-3" />
            Revision Requested
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FiFileText className="w-6 h-6 text-indigo-400" />
            <span>Lesson Notes</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Write, structure, and submit classroom lesson notes for administrative review and student release.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 active:scale-95 transition self-start sm:self-auto"
        >
          <FiPlus className="w-4 h-4" />
          <span>Write Lesson Note</span>
        </button>
      </div>

      {/* Admin Review Gate Banner */}
      <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900 border border-blue-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shrink-0 mt-0.5">
            <FiShield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Admin Quality Review Workflow</span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-semibold bg-blue-500/20 text-blue-300 rounded">
                Mandatory Policy
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
              In accordance with academic standard guidelines, <strong className="text-white">Admin has to review and approve all lesson notes before they can be sent to students</strong>. You can write drafts, submit them for review, and once approved, publish them to your class.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => dispatch(fetchTeacherLessonNotes())}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 shrink-0 self-end md:self-center transition"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by topic, subtopic, subject..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-900/80 text-white text-xs sm:text-sm placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl text-xs font-medium text-slate-400 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              statusFilter === "all"
                ? "bg-slate-800 text-white font-semibold shadow-xs"
                : "hover:text-white"
            }`}
          >
            All ({reduxNotes.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              statusFilter === "approved"
                ? "bg-slate-800 text-emerald-400 font-semibold shadow-xs"
                : "hover:text-emerald-300"
            }`}
          >
            Approved ({reduxNotes.filter((n) => n.status === "approved").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending_review")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              statusFilter === "pending_review"
                ? "bg-slate-800 text-blue-400 font-semibold shadow-xs"
                : "hover:text-blue-300"
            }`}
          >
            Pending Review ({reduxNotes.filter((n) => n.status === "pending_review").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("rejected")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              statusFilter === "rejected"
                ? "bg-slate-800 text-rose-400 font-semibold shadow-xs"
                : "hover:text-rose-300"
            }`}
          >
            Revisions ({reduxNotes.filter((n) => n.status === "rejected").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("draft")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              statusFilter === "draft"
                ? "bg-slate-800 text-amber-400 font-semibold shadow-xs"
                : "hover:text-amber-300"
            }`}
          >
            Drafts ({reduxNotes.filter((n) => n.status === "draft").length})
          </button>
        </div>

        {/* Subject Filter */}
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="text-xs py-2 px-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 focus:border-indigo-500 outline-none"
        >
          <option value="all">All Subjects</option>
          {availableSubjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Class Filter */}
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="text-xs py-2 px-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 focus:border-indigo-500 outline-none"
        >
          <option value="all">All Classes</option>
          {availableClasses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Notes Table / Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading lesson notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-[#0e1628] border border-slate-800 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center mb-4">
            <FiFileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Lesson Notes Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
            {search || subjectFilter !== "all" || classFilter !== "all" || statusFilter !== "all"
              ? "No lesson notes match your current filters. Try resetting search filters."
              : "You have not created any lesson notes yet. Write your first classroom lesson note now."}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 active:scale-95 transition"
          >
            <FiPlus className="w-4 h-4" />
            <span>Write Lesson Note</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-[#0a0f1d] text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Topic & Subtopic</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Week & Duration</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Student Access / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredNotes.map((note) => (
                  <tr
                    key={note._id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setViewingNote(note)}
                  >
                    <td className="py-4 px-4 sm:px-6 max-w-xs">
                      <div className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {note.topic}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {note.subtopic || "No subtopic specified"}
                      </div>
                      {note.status === "rejected" && note.adminFeedback && (
                        <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-[11px] flex items-start gap-1.5">
                          <FiMessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                          <span className="line-clamp-2">
                            <strong>Admin:</strong> {note.adminFeedback}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {note.subjectName}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-200 whitespace-nowrap">
                      {note.classLevelName}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">
                      <div className="font-medium text-slate-300">{note.week || "Week 1"}</div>
                      <div className="text-[11px] text-slate-500">{note.duration || "45 Mins"}</div>
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {renderStatusBadge(note)}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* Send to Students Button (Active ONLY if Approved) */}
                        {note.status === "approved" && !note.sentToStudents && (
                          <button
                            type="button"
                            onClick={() => handleSendToStudents(note)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-xs transition"
                            title="Send this approved lesson note to enrolled students"
                          >
                            <FiSend className="w-3 h-3" />
                            <span>Send to Students</span>
                          </button>
                        )}

                        {/* Submit for Review Button (for Draft or Rejected) */}
                        {(note.status === "draft" || note.status === "rejected") && (
                          <button
                            type="button"
                            onClick={() => handleSubmitForReview(note._id, note.topic)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition"
                            title="Submit for Admin review"
                          >
                            <FiSend className="w-3 h-3" />
                            <span>Submit for Review</span>
                          </button>
                        )}

                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => setViewingNote(note)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="View Note"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>

                        {/* Edit Button (disabled while pending review) */}
                        {note.status !== "pending_review" && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(note)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                            title="Edit Note"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note._id, note.topic)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete Note"
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
        </div>
      )}

      {/* Editor Modal: Create / Edit Lesson Note */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {editingNoteId ? "Edit Lesson Note" : "Create New Lesson Note"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Admin will review this lesson note prior to granting student access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Form Fields */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
              {/* Row 1: Subject, Class Level, Week, Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    placeholder="e.g. Mathematics"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Class Level <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.classLevelName}
                    onChange={(e) => setFormData({ ...formData, classLevelName: e.target.value })}
                    placeholder="e.g. JSS 2"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Week
                  </label>
                  <input
                    type="text"
                    value={formData.week}
                    onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                    placeholder="e.g. Week 3"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Lesson Date
                  </label>
                  <input
                    type="date"
                    value={formData.lessonDate}
                    onChange={(e) => setFormData({ ...formData, lessonDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Topic & Subtopic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Main Topic <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g. Algebraic Expressions & Factorization"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Subtopic
                  </label>
                  <input
                    type="text"
                    value={formData.subtopic}
                    onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                    placeholder="e.g. Grouping and Common Factors"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Learning Objectives */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Learning Objectives (Behavioral Outcomes)
                </label>
                <textarea
                  rows={3}
                  value={formData.learningObjectives}
                  onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
                  placeholder="By the end of the lesson, students should be able to:&#10;1. Identify...&#10;2. Apply...&#10;3. Solve..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Row 4: Introduction / Starter */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Introduction / Hook (5 - 10 mins)
                </label>
                <textarea
                  rows={2}
                  value={formData.introduction}
                  onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                  placeholder="Prior knowledge review, provocative question, or real-world hook..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Row 5: Core Lesson Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Core Lesson Content & Teaching Steps
                </label>
                <textarea
                  rows={5}
                  value={formData.lessonContent}
                  onChange={(e) => setFormData({ ...formData, lessonContent: e.target.value })}
                  placeholder="Detailed breakdown of definitions, worked examples, formulas, diagrams, and explanations..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none font-sans text-xs"
                />
              </div>

              {/* Row 6: Student Activities & Teaching Materials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Student Activities / Classwork
                  </label>
                  <textarea
                    rows={3}
                    value={formData.activities}
                    onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                    placeholder="Group work, pair problem-solving, workbook tasks..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Teaching Materials & Instructional Aids
                  </label>
                  <textarea
                    rows={3}
                    value={formData.teachingMaterials}
                    onChange={(e) => setFormData({ ...formData, teachingMaterials: e.target.value })}
                    placeholder="Textbooks, charts, models, laboratory apparatus, slides..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 7: Assessment & Conclusion */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Assessment / Evaluation Questions
                  </label>
                  <textarea
                    rows={3}
                    value={formData.assessment}
                    onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                    placeholder="Formative evaluation questions to gauge student understanding..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Conclusion & Summary
                  </label>
                  <textarea
                    rows={3}
                    value={formData.conclusion}
                    onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                    placeholder="Summary of key takeaways and homework assignment..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0a0f1d] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <FiShield className="w-3.5 h-3.5 text-blue-400" />
                Note will be queued for Admin approval before release to students.
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white rounded-xl transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveNote("draft")}
                  className="px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-semibold transition disabled:opacity-50"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveNote("submit_for_review")}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 active:scale-95 transition disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <FiSend className="w-3.5 h-3.5" />
                  <span>Submit for Admin Review</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal: Detailed Lesson Note View */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {viewingNote.subjectName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300">
                    {viewingNote.classLevelName}
                  </span>
                  <span className="text-xs text-slate-400">
                    {viewingNote.week} • {viewingNote.duration}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {viewingNote.topic}
                </h2>
                {viewingNote.subtopic && (
                  <p className="text-xs text-slate-400 mt-0.5">Subtopic: {viewingNote.subtopic}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewingNote(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Admin Feedback Banner inside Note View */}
            {viewingNote.status === "rejected" && viewingNote.adminFeedback && (
              <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-400 mb-1">
                  <FiAlertCircle className="w-4 h-4" />
                  Admin Reviewer Feedback / Revision Request
                </div>
                <p className="text-xs leading-relaxed">{viewingNote.adminFeedback}</p>
              </div>
            )}

            {/* Note Content Breakdown */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-300 flex-1 leading-relaxed">
              {viewingNote.learningObjectives && (
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Learning Objectives
                  </h4>
                  <p className="whitespace-pre-line text-slate-200">{viewingNote.learningObjectives}</p>
                </div>
              )}

              {viewingNote.introduction && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Introduction / Starter
                  </h4>
                  <p className="whitespace-pre-line text-slate-200">{viewingNote.introduction}</p>
                </div>
              )}

              {viewingNote.lessonContent && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Lesson Content & Procedures
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 whitespace-pre-line text-slate-200 font-sans">
                    {viewingNote.lessonContent}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewingNote.activities && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Student Activities
                    </h4>
                    <p className="whitespace-pre-line">{viewingNote.activities}</p>
                  </div>
                )}

                {viewingNote.teachingMaterials && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Teaching Aids & Materials
                    </h4>
                    <p className="whitespace-pre-line">{viewingNote.teachingMaterials}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewingNote.assessment && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Assessment & Evaluation
                    </h4>
                    <p className="whitespace-pre-line">{viewingNote.assessment}</p>
                  </div>
                )}

                {viewingNote.conclusion && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Summary & Conclusion
                    </h4>
                    <p className="whitespace-pre-line">{viewingNote.conclusion}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Actions */}
            <div className="p-4 border-t border-slate-800 bg-[#0a0f1d] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Review Status:</span>
                {renderStatusBadge(viewingNote)}
              </div>

              <div className="flex items-center gap-2.5">
                {viewingNote.status === "approved" && !viewingNote.sentToStudents && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSendToStudents(viewingNote);
                      setViewingNote(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <FiSend className="w-3.5 h-3.5" />
                    <span>Send to Students</span>
                  </button>
                )}

                {(viewingNote.status === "draft" || viewingNote.status === "rejected") && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSubmitForReview(viewingNote._id, viewingNote.topic);
                      setViewingNote(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <FiSend className="w-3.5 h-3.5" />
                    <span>Submit for Admin Review</span>
                  </button>
                )}

                {viewingNote.status !== "pending_review" && (
                  <button
                    type="button"
                    onClick={() => {
                      const toEdit = viewingNote;
                      setViewingNote(null);
                      handleOpenEdit(toEdit);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <FiEdit3 className="w-3.5 h-3.5" />
                    <span>Edit Note</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
