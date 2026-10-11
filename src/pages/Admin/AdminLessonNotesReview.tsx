import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchAdminLessonNotes,
  reviewLessonNote,
  type LessonNoteItem,
} from "../../features/lessonNotes/lessonNotesSlice";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiSearch,
  FiEye,
  FiCheck,
  FiX,
  FiUser,
  FiBookOpen,
  FiSend,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function AdminLessonNotesReview() {
  const dispatch = useAppDispatch();
  const { items: notes, loading, actionLoading } = useAppSelector(
    (state) => state.lessonNotes
  );

  useEffect(() => {
    dispatch(fetchAdminLessonNotes());
  }, [dispatch]);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"pending_review" | "approved" | "rejected" | "all">("pending_review");

  // Review Inspection Modal
  const [inspectingNote, setInspectingNote] = useState<LessonNoteItem | null>(null);
  const [adminFeedback, setAdminFeedback] = useState("");

  const stats = useMemo(() => {
    const total = notes.length;
    const pending = notes.filter((n) => n.status === "pending_review").length;
    const approved = notes.filter((n) => n.status === "approved").length;
    const rejected = notes.filter((n) => n.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        note.topic?.toLowerCase().includes(q) ||
        note.teacherName?.toLowerCase().includes(q) ||
        note.subjectName?.toLowerCase().includes(q) ||
        note.classLevelName?.toLowerCase().includes(q);

      const matchStatus = statusTab === "all" || note.status === statusTab;

      return matchSearch && matchStatus;
    });
  }, [notes, search, statusTab]);

  const handleOpenReview = (note: LessonNoteItem) => {
    setInspectingNote(note);
    setAdminFeedback(note.adminFeedback || "");
  };

  const handleExecuteReview = async (action: "approve" | "reject") => {
    if (!inspectingNote) return;

    if (action === "reject" && !adminFeedback.trim()) {
      toast.error("Please provide feedback or specific revisions required for the teacher.");
      return;
    }

    try {
      await dispatch(
        reviewLessonNote({
          id: inspectingNote._id,
          action,
          adminFeedback: adminFeedback.trim(),
        })
      ).unwrap();

      toast.success(
        action === "approve"
          ? "Lesson note approved and authorized for students!"
          : "Revision request sent back to the teacher."
      );
      setInspectingNote(null);
      dispatch(fetchAdminLessonNotes());
    } catch (err: any) {
      toast.error(err || "Failed to process review");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FiCheckCircle className="w-6 h-6 text-indigo-400" />
            <span>Lesson Notes Quality Review</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review submitted teacher lesson notes for pedagogical standards before authorizing them to be sent to students.
          </p>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0e1628] border border-amber-500/30 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Pending Review
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">{stats.pending}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting inspection</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <FiClock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1628] border border-emerald-500/30 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Approved
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{stats.approved}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Authorized for students</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <FiCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1628] border border-rose-500/30 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
              Revisions Needed
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1">{stats.rejected}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Feedback provided</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <FiAlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Submissions
            </div>
            <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">All teacher notes</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-slate-400">
            <FiBookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by topic, teacher name, subject, or class..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs sm:text-sm placeholder-slate-400 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl text-xs font-semibold text-slate-400 shrink-0">
          <button
            type="button"
            onClick={() => setStatusTab("pending_review")}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusTab === "pending_review"
                ? "bg-amber-500 text-black font-bold shadow-xs"
                : "hover:text-white"
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("approved")}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusTab === "approved"
                ? "bg-emerald-600 text-white font-bold shadow-xs"
                : "hover:text-white"
            }`}
          >
            Approved ({stats.approved})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("rejected")}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusTab === "rejected"
                ? "bg-rose-600 text-white font-bold shadow-xs"
                : "hover:text-white"
            }`}
          >
            Revisions ({stats.rejected})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("all")}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusTab === "all"
                ? "bg-slate-800 text-white font-bold shadow-xs"
                : "hover:text-white"
            }`}
          >
            All ({stats.total})
          </button>
        </div>
      </div>

      {/* Table of Submitted Notes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Loading lesson notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-[#0e1628] border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <FiBookOpen className="w-10 h-10 mx-auto mb-3 text-slate-500" />
          <h3 className="text-base font-bold text-white mb-1">No Lesson Notes Found</h3>
          <p className="text-xs">
            {statusTab === "pending_review"
              ? "All submitted lesson notes have been reviewed."
              : "No lesson notes matched your current filter criteria."}
          </p>
        </div>
      ) : (
        <div className="bg-[#0e1628] border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-[#0a0f1d] text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Lesson Topic</th>
                  <th className="py-3.5 px-4">Authoring Teacher</th>
                  <th className="py-3.5 px-4">Subject & Class</th>
                  <th className="py-3.5 px-4 text-center">Review Status</th>
                  <th className="py-3.5 px-4 text-center">Student Access</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredNotes.map((note) => (
                  <tr key={note._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-bold text-white text-sm line-clamp-1">{note.topic}</div>
                      <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {note.subtopic || "General topic"}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-200 flex items-center gap-1.5">
                        <FiUser className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{note.teacherName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{note.teacherEmail}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                          {note.subjectName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300">
                          {note.classLevelName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {note.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <FiCheck className="w-3 h-3" />
                          Approved
                        </span>
                      ) : note.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <FiAlertCircle className="w-3 h-3" />
                          Revision Needed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                          <FiClock className="w-3 h-3" />
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {note.sentToStudents ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                          <FiSend className="w-3.5 h-3.5" />
                          <span>Delivered</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          Locked (Awaiting Approval)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenReview(note)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition active:scale-95"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        <span>Inspect & Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review & Inspection Modal */}
      {inspectingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto text-xs sm:text-sm">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {inspectingNote.subjectName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300">
                    {inspectingNote.classLevelName}
                  </span>
                  <span className="text-xs text-slate-400">
                    Teacher: <strong className="text-white">{inspectingNote.teacherName}</strong>
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{inspectingNote.topic}</h2>
                {inspectingNote.subtopic && (
                  <p className="text-xs text-slate-400 mt-0.5">Subtopic: {inspectingNote.subtopic}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setInspectingNote(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Note Details */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-300 leading-relaxed flex-1">
              {inspectingNote.learningObjectives && (
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Learning Objectives
                  </h4>
                  <p className="whitespace-pre-line text-slate-200">{inspectingNote.learningObjectives}</p>
                </div>
              )}

              {inspectingNote.introduction && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Introduction / Hook
                  </h4>
                  <p className="whitespace-pre-line text-slate-200">{inspectingNote.introduction}</p>
                </div>
              )}

              {inspectingNote.lessonContent && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Core Lesson Content & Teaching Steps
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 whitespace-pre-line font-mono text-xs text-slate-200">
                    {inspectingNote.lessonContent}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inspectingNote.activities && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Student Activities
                    </h4>
                    <p className="whitespace-pre-line">{inspectingNote.activities}</p>
                  </div>
                )}
                {inspectingNote.teachingMaterials && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Teaching Aids & Materials
                    </h4>
                    <p className="whitespace-pre-line">{inspectingNote.teachingMaterials}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inspectingNote.assessment && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Assessment / Evaluation
                    </h4>
                    <p className="whitespace-pre-line">{inspectingNote.assessment}</p>
                  </div>
                )}
                {inspectingNote.conclusion && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Conclusion & Homework
                    </h4>
                    <p className="whitespace-pre-line">{inspectingNote.conclusion}</p>
                  </div>
                )}
              </div>

              {/* Admin Review Feedback Input */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                  Admin Feedback / Required Revisions (Sent to Teacher)
                </label>
                <textarea
                  rows={3}
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  placeholder="Enter remarks, recommendations, or necessary revisions if requesting changes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs sm:text-sm focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0a0f1d] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setInspectingNote(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Close
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleExecuteReview("reject")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs sm:text-sm font-semibold transition active:scale-95 disabled:opacity-50"
                >
                  <FiAlertCircle className="w-4 h-4" />
                  <span>Request Revisions</span>
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleExecuteReview("approve")}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
                >
                  <FiCheck className="w-4 h-4" />
                  <span>Approve & Authorize for Students</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
