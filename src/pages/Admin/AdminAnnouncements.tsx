import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
  fetchActiveAnnouncements,
  type AnnouncementItem,
} from "../../features/announcements/announcementsSlice";
import {
  FiVolume2,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiUserCheck,
  FiGlobe,
  FiCalendar,
  FiSearch,
  FiAlertTriangle,
  FiCheckCircle,
  FiX,
  FiClock,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function AdminAnnouncements() {
  const dispatch = useAppDispatch();
  const { items, metrics, actionLoading } = useAppSelector((state) => state.announcements);

  const [activeTab, setActiveTab] = useState<"all" | "general" | "teacher" | "student" | "active" | "archived">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const initialFormState = {
    title: "",
    message: "",
    targetAudience: "general" as "general" | "teacher" | "student",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    category: "general" as "general" | "academic" | "administrative" | "event" | "emergency",
    status: "active" as "active" | "archived" | "draft",
    expiresAt: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAllAnnouncements());
  }, [dispatch]);

  // Open modal with pre-selected audience
  const handleOpenCreate = (audience: "general" | "teacher" | "student") => {
    setEditingId(null);
    setFormError(null);
    setFormData({
      ...initialFormState,
      targetAudience: audience,
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (item: AnnouncementItem) => {
    setEditingId(item._id);
    setFormError(null);
    setFormData({
      title: item.title,
      message: item.message,
      targetAudience: item.targetAudience,
      priority: item.priority,
      category: item.category,
      status: item.status,
      expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().split("T")[0] : "",
    });
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim() || !formData.message.trim()) {
      setFormError("Title and message content are required.");
      return;
    }

    try {
      if (editingId) {
        await dispatch(
          updateAnnouncement({
            id: editingId,
            data: {
              ...formData,
              expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
            },
          })
        ).unwrap();
        toast.success("Announcement updated successfully");
      } else {
        await dispatch(
          createAnnouncement({
            ...formData,
            expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
          })
        ).unwrap();
        toast.success(
          `Announcement dropped for ${
            formData.targetAudience === "general"
              ? "all (Teachers & Students)"
              : formData.targetAudience + "s"
          }!`
        );
      }
      setIsModalOpen(false);
      dispatch(fetchAllAnnouncements());
      dispatch(fetchActiveAnnouncements("admin"));
    } catch (err: any) {
      setFormError(err || "Failed to save announcement.");
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await dispatch(deleteAnnouncement(id)).unwrap();
        toast.success("Announcement removed");
        dispatch(fetchAllAnnouncements());
        dispatch(fetchActiveAnnouncements("admin"));
      } catch (err: any) {
        toast.error(err || "Failed to delete");
      }
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (id: string) => {
    try {
      await dispatch(toggleAnnouncementStatus(id)).unwrap();
      toast.success("Status updated");
      dispatch(fetchAllAnnouncements());
      dispatch(fetchActiveAnnouncements("admin"));
    } catch (err: any) {
      toast.error(err || "Failed to update status");
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === "general" && item.targetAudience !== "general") return false;
      if (activeTab === "teacher" && item.targetAudience !== "teacher") return false;
      if (activeTab === "student" && item.targetAudience !== "student") return false;
      if (activeTab === "active" && item.status !== "active") return false;
      if (activeTab === "archived" && item.status !== "archived") return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches =
          item.title.toLowerCase().includes(query) ||
          item.message.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [items, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FiVolume2 className="w-6 h-6 text-indigo-400" />
            <span>School Announcements Broadcast</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Broadcast messages and notices to teachers, students, or the entire school via the navbar marquee ticker.
          </p>
        </div>

        {/* 3 Dedicated Creation Action Buttons requested by user */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* 1. Teacher Announcement Button */}
          <button
            type="button"
            onClick={() => handleOpenCreate("teacher")}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-semibold shadow-xs active:scale-95 transition"
            title="Drop announcement for teachers only"
          >
            <FiUserCheck className="w-4 h-4 text-amber-400" />
            <span>Teacher Announcement</span>
          </button>

          {/* 2. Student Announcement Button */}
          <button
            type="button"
            onClick={() => handleOpenCreate("student")}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm font-semibold shadow-xs active:scale-95 transition"
            title="Drop announcement for students only"
          >
            <FiUsers className="w-4 h-4 text-emerald-400" />
            <span>Student Announcement</span>
          </button>

          {/* 3. General Announcement Button */}
          <button
            type="button"
            onClick={() => handleOpenCreate("general")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 active:scale-95 transition"
            title="Drop announcement for both teachers and students"
          >
            <FiGlobe className="w-4 h-4" />
            <span>General Announcement</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Total Notices</div>
            <div className="text-xl font-bold text-white mt-0.5">{metrics.total}</div>
          </div>
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <FiVolume2 className="w-4 h-4" />
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Teachers Only</div>
            <div className="text-xl font-bold text-amber-300 mt-0.5">{metrics.teacherCount}</div>
          </div>
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <FiUserCheck className="w-4 h-4" />
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Students Only</div>
            <div className="text-xl font-bold text-emerald-300 mt-0.5">{metrics.studentCount}</div>
          </div>
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <FiUsers className="w-4 h-4" />
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">General (Both)</div>
            <div className="text-xl font-bold text-indigo-300 mt-0.5">{metrics.generalCount}</div>
          </div>
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <FiGlobe className="w-4 h-4" />
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Active on Marquee</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{metrics.activeCount}</div>
          </div>
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <FiCheckCircle className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "All Notices", count: items.length },
              { id: "general", label: "General (Both)", count: metrics.generalCount },
              { id: "teacher", label: "Teachers Only", count: metrics.teacherCount },
              { id: "student", label: "Students Only", count: metrics.studentCount },
              { id: "active", label: "Active", count: metrics.activeCount },
              { id: "archived", label: "Archived", count: metrics.total - metrics.activeCount },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-[#0a0f1d] text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <FiSearch className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0a0f1d] border border-slate-700 text-xs text-white focus:border-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Announcements Directory Table / Cards */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <FiVolume2 className="w-8 h-8 mx-auto text-slate-600" />
            <p>No announcements found under this filter.</p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleOpenCreate("general")}
                className="text-xs text-indigo-400 hover:underline font-semibold"
              >
                + Drop a General Announcement
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredList.map((item) => {
              const isTeacher = item.targetAudience === "teacher";
              const isStudent = item.targetAudience === "student";

              return (
                <div
                  key={item._id}
                  className="p-4 sm:p-5 hover:bg-slate-800/20 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Target Audience Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          isTeacher
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : isStudent
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                        }`}
                      >
                        {isTeacher
                          ? "👨‍🏫 Teachers Only"
                          : isStudent
                          ? "🎓 Students Only"
                          : "🌐 General (Both)"}
                      </span>

                      {/* Priority Badge */}
                      {item.priority === "urgent" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white uppercase animate-pulse">
                          Urgent
                        </span>
                      )}
                      {item.priority === "high" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                          High Priority
                        </span>
                      )}

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          item.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {item.status === "active" ? "● Active on Marquee" : "○ Archived"}
                      </span>

                      {/* Category */}
                      <span className="text-[11px] text-slate-400 capitalize">
                        • {item.category}
                      </span>
                    </div>

                    {/* Headline */}
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {item.title}
                    </h3>

                    {/* Content Preview */}
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <FiCalendar className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </span>

                      {item.expiresAt && (
                        <span className="flex items-center gap-1 text-amber-400/80">
                          <FiClock className="w-3 h-3" />
                          <span>Expires: {new Date(item.expiresAt).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item._id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        item.status === "active"
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                          : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40"
                      }`}
                      title={item.status === "active" ? "Archive this notice" : "Re-activate in Marquee"}
                    >
                      {item.status === "active" ? "Archive" : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition"
                      title="Edit Notice"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item._id, item.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-slate-700 transition"
                      title="Delete Notice"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT ANNOUNCEMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingId ? "Edit Announcement" : "Drop New Announcement"}
                </h3>
                <p className="text-xs text-slate-400">
                  Broadcast notice will scroll on the top navbar marquee ticker.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              {/* Target Audience Radio Selector with 3 choices */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Target Audience *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetAudience: "teacher" })}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      formData.targetAudience === "teacher"
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-xs"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <FiUserCheck className="w-4 h-4" />
                    <span className="text-[11px]">Teachers</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetAudience: "student" })}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      formData.targetAudience === "student"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-xs"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <FiUsers className="w-4 h-4" />
                    <span className="text-[11px]">Students</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetAudience: "general" })}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      formData.targetAudience === "general"
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold shadow-xs"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <FiGlobe className="w-4 h-4" />
                    <span className="text-[11px]">General (Both)</span>
                  </button>
                </div>
              </div>

              {/* Title / Headline */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Announcement Title / Headline *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Mid-term Exam Schedule & Hall Allocations Released"
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                />
              </div>

              {/* Detailed Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Detailed Message Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Provide complete announcement details for the audience..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs leading-relaxed"
                />
              </div>

              {/* Priority and Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  >
                    <option value="low">Low (Standard Info)</option>
                    <option value="medium">Medium (Important)</option>
                    <option value="high">High (Attention Required)</option>
                    <option value="urgent">Urgent (Flashing Red)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  >
                    <option value="general">General</option>
                    <option value="academic">Academic</option>
                    <option value="administrative">Administrative</option>
                    <option value="event">Event / Assembly</option>
                    <option value="emergency">Emergency / Alert</option>
                  </select>
                </div>
              </div>

              {/* Expiry Date (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Leave blank if the announcement should stay active indefinitely until manually archived.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 active:scale-95 transition"
                >
                  {actionLoading
                    ? "Publishing..."
                    : editingId
                    ? "Update Announcement"
                    : "Publish Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
