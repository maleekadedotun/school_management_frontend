import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { fetchAcademicYears } from "../../../features/academicYears/academicYearsSlice";
import { fetchAcademicTerms } from "../../../features/academicTerms/academicTermsSlice";
import {
  FiCalendar,
  FiClock,
  FiPlus,
  FiX,
  FiTrash2,
} from "react-icons/fi";
import toast from "react-hot-toast";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  category: "Term Milestone" | "Examination" | "Holiday" | "Submission Deadline" | "Staff Meeting";
  description?: string;
  isCustom?: boolean;
}

const DEFAULT_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "First Term Resumption & Staff Orientation",
    date: "2026-09-14",
    category: "Term Milestone",
    description: "Official start of academic term. Distribution of syllabus and class registers.",
  },
  {
    id: "evt-2",
    title: "Continuous Assessment Test 1 (CAT 1)",
    date: "2026-10-19",
    endDate: "2026-10-23",
    category: "Examination",
    description: "Classroom test block for mid-term progress assessment across all subjects.",
  },
  {
    id: "evt-3",
    title: "Mid-Term Break & Staff In-Service Training",
    date: "2026-10-26",
    endDate: "2026-10-30",
    category: "Holiday",
    description: "School closed for mid-term recess. Staff development workshops on Wednesday.",
  },
  {
    id: "evt-4",
    title: "Assignment 1 Submission Deadline",
    date: "2026-11-06",
    category: "Submission Deadline",
    description: "All first-half coursework assignments must be turned in by students.",
  },
  {
    id: "evt-5",
    title: "End of Term Examination Block",
    date: "2026-12-07",
    endDate: "2026-12-18",
    category: "Examination",
    description: "Term summative examinations across all secondary levels.",
  },
  {
    id: "evt-6",
    title: "Vacation & Report Card Presentation Day",
    date: "2026-12-22",
    category: "Term Milestone",
    description: "End of First Term vacating day and parent-teacher consultative meeting.",
  },
];

export default function AcademicCalendar() {
  const dispatch = useAppDispatch();
  const { items: academicYears } = useAppSelector((state) => state.academicYears);
  const { items: academicTerms } = useAppSelector((state) => state.academicTerms);

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAcademicTerms());
  }, [dispatch]);

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const stored = localStorage.getItem("teacher_academic_events");
      if (stored) return JSON.parse(stored);
      return DEFAULT_CALENDAR_EVENTS;
    } catch {
      return DEFAULT_CALENDAR_EVENTS;
    }
  });

  useEffect(() => {
    localStorage.setItem("teacher_academic_events", JSON.stringify(events));
  }, [events]);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    endDate: "",
    category: "Submission Deadline" as CalendarEvent["category"],
    description: "",
  });

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) {
      toast.error("Please enter event title");
      return;
    }

    const created: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newEvent.title.trim(),
      date: newEvent.date,
      endDate: newEvent.endDate || undefined,
      category: newEvent.category,
      description: newEvent.description.trim(),
      isCustom: true,
    };

    setEvents((prev) => [...prev, created]);
    toast.success("Event added to academic calendar!");
    setIsAddModalOpen(false);
    setNewEvent({
      title: "",
      date: new Date().toISOString().split("T")[0],
      endDate: "",
      category: "Submission Deadline",
      description: "",
    });
  };

  const handleDeleteCustomEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Event removed");
  };

  const filteredEvents = useMemo(() => {
    const list = categoryFilter === "all" ? events : events.filter((e) => e.category === categoryFilter);
    return [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, categoryFilter]);

  const activeYear = academicYears[0]?.name || "2026/2027 Academic Year";
  const activeTerm = academicTerms[0]?.name || "First Term";

  const getBadgeStyle = (category: CalendarEvent["category"]) => {
    switch (category) {
      case "Examination":
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
      case "Holiday":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "Submission Deadline":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "Staff Meeting":
        return "bg-sky-500/15 text-sky-300 border-sky-500/30";
      default:
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FiCalendar className="w-6 h-6 text-rose-400" />
            <span>Academic Calendar & Key Dates</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Current academic session: <strong className="text-white">{activeYear}</strong> • <strong className="text-indigo-400">{activeTerm}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-rose-600/30 active:scale-95 transition self-start sm:self-auto"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Reminder / Event</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {["all", "Term Milestone", "Examination", "Holiday", "Submission Deadline", "Staff Meeting"].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              categoryFilter === cat
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "bg-[#0e1628] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            {cat === "all" ? "All Dates & Events" : cat}
          </button>
        ))}
      </div>

      {/* Timeline List of Events */}
      <div className="space-y-3">
        {filteredEvents.map((evt) => {
          const formattedDate = new Date(evt.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const formattedEnd = evt.endDate
            ? new Date(evt.endDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : null;

          return (
            <div
              key={evt.id}
              className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800 hover:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getBadgeStyle(
                      evt.category
                    )}`}
                  >
                    {evt.category}
                  </span>
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <FiClock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formattedDate}</span>
                    {formattedEnd && <span> - {formattedEnd}</span>}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight">
                  {evt.title}
                </h3>

                {evt.description && (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {evt.description}
                  </p>
                )}
              </div>

              {evt.isCustom && (
                <button
                  type="button"
                  onClick={() => handleDeleteCustomEvent(evt.id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition self-end sm:self-center"
                  title="Remove Event"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiCalendar className="w-5 h-5 text-rose-400" />
                <span>Add Academic Calendar Event</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Event / Milestone Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. Mid-term Assessment Review"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-rose-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">End Date (Optional)</label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-rose-500 outline-none"
                >
                  <option value="Submission Deadline">Submission Deadline</option>
                  <option value="Examination">Examination</option>
                  <option value="Term Milestone">Term Milestone</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Staff Meeting">Staff Meeting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Notes, room location, or instructions..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-rose-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 active:scale-95 transition"
                >
                  Add to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
