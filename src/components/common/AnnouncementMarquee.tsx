import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchActiveAnnouncements } from "../../features/announcements/announcementsSlice";
import type { AnnouncementItem } from "../../features/announcements/announcementsSlice";
import {
  FiVolume2,
  FiX,
  FiPause,
  FiPlay,
  FiChevronRight,
  FiCalendar,
  FiUser,
} from "react-icons/fi";

export default function AnnouncementMarquee() {
  const dispatch = useAppDispatch();
  const { activeItems, activeLoading } = useAppSelector((state) => state.announcements);

  const admin = useAppSelector((state) => state.auth.admin);
  const teacher = useAppSelector((state) => state.teacherAuth.teacher);
  const student = useAppSelector(
    (state) => state.students.profile || state.students.student || state.students.currentStudent
  );
  const parent = useAppSelector((state) => state.parentAuth.parent);

  // Active role
  const userRole = useMemo(() => {
    if (admin) return "admin";
    if (teacher) return "teacher";
    if (student) return "student";
    if (parent) return "parent";
    return localStorage.getItem("userRole") || "general";
  }, [admin, teacher, student, parent]);

  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch active announcements on role resolution and periodic 60s refresh
  useEffect(() => {
    dispatch(fetchActiveAnnouncements(userRole));
    const timer = setInterval(() => {
      dispatch(fetchActiveAnnouncements(userRole));
    }, 60000);
    return () => clearInterval(timer);
  }, [dispatch, userRole]);

  // If no announcements or user dismissed for this page session, render nothing
  if (isDismissed || (!activeLoading && activeItems.length === 0)) {
    return null;
  }

  // Audience styling helper
  const getAudienceBadge = (target: string) => {
    switch (target) {
      case "teacher":
        return {
          label: "Teachers Only",
          cls: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        };
      case "student":
        return {
          label: "Students Notice",
          cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        };
      case "parent":
        return {
          label: "Parents Notice",
          cls: "bg-sky-500/20 text-sky-300 border-sky-500/30",
        };
      case "general":
      default:
        return {
          label: "General Notice",
          cls: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        };
    }
  };

  // Priority styling helper
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-600 text-white animate-pulse font-extrabold";
      case "high":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold";
      case "medium":
      default:
        return "";
    }
  };

  const handleOpenDetails = (item: AnnouncementItem) => {
    setSelectedAnnouncement(item);
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Sleek Under-Navbar Marquee Banner */}
      <div className="relative z-20 w-full bg-[#080d1a] border-b border-indigo-500/20 shadow-md overflow-hidden select-none">
        {/* Subtle accent glow line at the top */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="max-w-(--breakpoint-2xl) mx-auto px-3 sm:px-6 py-2 flex items-center gap-3">
          {/* Left Static Announcement Pill */}
          <div className="flex items-center gap-2 shrink-0 bg-indigo-950/80 border border-indigo-500/30 px-2.5 py-1 rounded-xl shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
              <FiVolume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Notice</span>
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/30 text-white">
              {activeItems.length}
            </span>
          </div>

          {/* Center Smooth Marquee Area */}
          <div
            className="flex-1 overflow-hidden relative cursor-pointer group"
            onClick={() => activeItems[0] && handleOpenDetails(activeItems[0])}
            title="Click to read full announcement"
          >
            {/* Fade masks on sides */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#080d1a] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#080d1a] to-transparent z-10 pointer-events-none" />

            {/* Marquee Content Rail */}
            <div
              className={`flex items-center gap-8 whitespace-nowrap will-change-transform ${
                isPaused ? "" : "animate-marquee hover:[animation-play-state:paused]"
              }`}
              style={{
                animationDuration: `${Math.max(20, activeItems.length * 15)}s`,
              }}
            >
              {/* Duplicate list to create a seamless infinite scrolling illusion */}
              {[...activeItems, ...activeItems].map((item, idx) => {
                const audience = getAudienceBadge(item.targetAudience);
                const priorityClass = getPriorityBadge(item.priority);

                return (
                  <div
                    key={`${item._id}-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetails(item);
                    }}
                    className="inline-flex items-center gap-2.5 text-xs text-slate-200 hover:text-white transition group/item px-2 py-0.5 rounded-lg hover:bg-slate-800/40"
                  >
                    {/* Audience badge */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${audience.cls}`}
                    >
                      {audience.label}
                    </span>

                    {/* Priority badge if urgent */}
                    {item.priority === "urgent" && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${priorityClass}`}
                      >
                        URGENT
                      </span>
                    )}

                    {/* Headline */}
                    <span className="font-bold text-white group-hover/item:text-indigo-300 transition">
                      {item.title}
                    </span>

                    <span className="text-slate-500 font-bold">•</span>

                    {/* Short message preview */}
                    <span className="text-slate-300 max-w-md truncate font-normal">
                      {item.message}
                    </span>

                    <span className="text-indigo-400/80 font-black text-sm">✦</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Pause / Play Toggle */}
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              title={isPaused ? "Resume Marquee" : "Pause Marquee"}
            >
              {isPaused ? <FiPlay className="w-3.5 h-3.5 text-emerald-400" /> : <FiPause className="w-3.5 h-3.5" />}
            </button>

            {/* View Modal Button */}
            <button
              type="button"
              onClick={() => activeItems[0] && handleOpenDetails(activeItems[0])}
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30 transition"
            >
              <span>View</span>
              <FiChevronRight className="w-3 h-3" />
            </button>

            {/* Dismiss for session */}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition"
              title="Hide Announcement Bar"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* FULL DETAILS MODAL */}
      {isModalOpen && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                      getAudienceBadge(selectedAnnouncement.targetAudience).cls
                    }`}
                  >
                    {getAudienceBadge(selectedAnnouncement.targetAudience).label}
                  </span>

                  {selectedAnnouncement.priority === "urgent" && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white uppercase">
                      URGENT
                    </span>
                  )}

                  <span className="text-[11px] text-slate-400 capitalize">
                    {selectedAnnouncement.category}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight">
                  {selectedAnnouncement.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Message Body */}
            <div className="p-4 rounded-2xl bg-[#090e1c] border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {selectedAnnouncement.message}
            </div>

            {/* Metadata Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <FiUser className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{selectedAnnouncement.createdByName || "School Administration"}</span>
                </span>

                <span className="flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {new Date(selectedAnnouncement.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </span>
              </div>

              {selectedAnnouncement.expiresAt && (
                <span className="text-[11px] text-amber-400/90 font-medium">
                  Expires: {new Date(selectedAnnouncement.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Close Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
