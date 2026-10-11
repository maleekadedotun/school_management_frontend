import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchAllTimetables,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot,
  publishTimetable,
} from "../../features/timetable/timetableSlice";
import type { TimetableSlot } from "../../features/timetable/timetableSlice";
import { fetchPrograms } from "../../features/programs/programsSlice";
import { fetchSubjects } from "../../features/subjects/subjectsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import { fetchAllTeachers } from "../../features/teachers/teachersSlice";
import {
  FiClock,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMapPin,
  FiLayers,
  FiCalendar,
  FiPrinter,
  FiX,
  FiUser,
  FiBookOpen,
  FiSearch,
  FiAlertCircle,
  FiGrid,
  FiList,
  FiCheckCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const PERIOD_DEFAULTS = [
  { period: 1, label: "08:00 AM - 08:45 AM", start: "08:00 AM", end: "08:45 AM" },
  { period: 2, label: "08:45 AM - 09:30 AM", start: "08:45 AM", end: "09:30 AM" },
  { period: 3, label: "09:30 AM - 10:15 AM", start: "09:30 AM", end: "10:15 AM" },
  { period: 4, label: "10:45 AM - 11:30 AM", start: "10:45 AM", end: "11:30 AM" },
  { period: 5, label: "11:30 AM - 12:15 PM", start: "11:30 AM", end: "12:15 PM" },
  { period: 6, label: "01:00 PM - 01:45 PM", start: "01:00 PM", end: "01:45 PM" },
  { period: 7, label: "01:45 PM - 02:30 PM", start: "01:45 PM", end: "02:30 PM" },
];

export default function TimetableManagement() {
  const dispatch = useAppDispatch();
  const { slots, actionLoading, metadata } = useAppSelector((state) => state.timetable);
  const { items: programs } = useAppSelector((state) => state.programs);
  const { items: subjects } = useAppSelector((state) => state.subjects);
  const { items: classLevels } = useAppSelector((state) => state.classLevels);
  const teachersState = useAppSelector((state) => state.teachers);
  const teachers = (teachersState as any)?.teachers || (teachersState as any)?.items || [];

  // Local UI filters
  const [selectedProgram, setSelectedProgram] = useState<string>("All");
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [selectedDay, setSelectedDay] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix");

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const initialFormState = {
    program: "",
    classLevel: "",
    subject: "",
    teacher: "",
    day: "Monday" as typeof DAYS[number],
    periodNumber: 1,
    startTime: "08:00 AM",
    endTime: "08:45 AM",
    room: "Room 101",
    notes: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  // Initial load
  useEffect(() => {
    dispatch(fetchAllTimetables());
    dispatch(fetchPrograms());
    dispatch(fetchSubjects());
    dispatch(fetchClassLevels());
    dispatch(fetchAllTeachers());
  }, [dispatch]);

  // Derived filter options
  const classOptions = useMemo(() => {
    const fromApi = classLevels.map((c: any) => c.name);
    const fromMeta = metadata.classes || [];
    const fromSlots = slots.map((s) => s.classLevel).filter(Boolean);
    return Array.from(new Set([...fromApi, ...fromMeta, ...fromSlots])).filter(Boolean);
  }, [classLevels, metadata.classes, slots]);

  // Filtered slots list
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      // Program filter
      if (selectedProgram !== "All") {
        const progId = slot.program?._id || slot.program;
        const progName = slot.programName || slot.program?.name;
        if (progId !== selectedProgram && progName !== selectedProgram) return false;
      }

      // Class level filter
      if (selectedClass !== "All") {
        if (slot.classLevel?.toLowerCase() !== selectedClass.toLowerCase()) return false;
      }

      // Day filter
      if (selectedDay !== "All") {
        if (slot.day !== selectedDay) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const match =
          slot.subjectName?.toLowerCase().includes(query) ||
          slot.teacherName?.toLowerCase().includes(query) ||
          slot.classLevel?.toLowerCase().includes(query) ||
          slot.room?.toLowerCase().includes(query) ||
          slot.notes?.toLowerCase().includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [slots, selectedProgram, selectedClass, selectedDay, searchQuery]);

  // KPI Metrics
  const totalPeriods = slots.length;
  const distinctClassesCount = useMemo(() => {
    return new Set(slots.map((s) => s.classLevel)).size;
  }, [slots]);
  const distinctTeachersCount = useMemo(() => {
    return new Set(slots.map((s) => s.teacherName || s.teacher?._id)).size;
  }, [slots]);
  const distinctSubjectsCount = useMemo(() => {
    return new Set(slots.map((s) => s.subjectName || s.subject?._id)).size;
  }, [slots]);

  // Handle open Add Modal
  const handleOpenAdd = (presetDay?: typeof DAYS[number], presetPeriod?: number) => {
    setEditingSlotId(null);
    setFormError(null);

    const defaultProg = programs[0]?._id || "";
    const defaultClass = classOptions[0] || (classLevels[0] as any)?.name || "Level 100";
    const defaultSub = subjects[0]?._id || "";
    const defaultTeach = teachers[0]?._id || "";
    const targetPeriod = presetPeriod || 1;
    const matchedPreset = PERIOD_DEFAULTS.find((p) => p.period === targetPeriod);

    setFormData({
      program: defaultProg,
      classLevel: defaultClass,
      subject: defaultSub,
      teacher: defaultTeach,
      day: presetDay || "Monday",
      periodNumber: targetPeriod,
      startTime: matchedPreset?.start || "08:00 AM",
      endTime: matchedPreset?.end || "08:45 AM",
      room: "Room 101",
      notes: "",
    });
    setIsModalOpen(true);
  };

  // Handle open Edit Modal
  const handleOpenEdit = (slot: TimetableSlot) => {
    setEditingSlotId(slot._id);
    setFormError(null);
    setFormData({
      program: slot.program?._id || slot.program || "",
      classLevel: slot.classLevel || "",
      subject: slot.subject?._id || slot.subject || "",
      teacher: slot.teacher?._id || slot.teacher || "",
      day: slot.day,
      periodNumber: slot.periodNumber,
      startTime: slot.startTime || "08:00 AM",
      endTime: slot.endTime || "08:45 AM",
      room: slot.room || "Room 101",
      notes: slot.notes || "",
    });
    setIsModalOpen(true);
  };

  // Period change shortcut
  const handlePeriodChange = (periodNum: number) => {
    const matched = PERIOD_DEFAULTS.find((p) => p.period === periodNum);
    setFormData((prev) => ({
      ...prev,
      periodNumber: periodNum,
      ...(matched ? { startTime: matched.start, endTime: matched.end } : {}),
    }));
  };

  // Handle Save
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.program || !formData.classLevel || !formData.subject || !formData.teacher) {
      setFormError("Please select Program, Class Level, Subject, and Teacher");
      return;
    }

    try {
      if (editingSlotId) {
        await dispatch(
          updateTimetableSlot({
            id: editingSlotId,
            data: formData,
          })
        ).unwrap();
        toast.success("Timetable slot successfully updated!");
      } else {
        await dispatch(createTimetableSlot(formData)).unwrap();
        toast.success("New timetable period created!");
      }
      setIsModalOpen(false);
      dispatch(fetchAllTimetables());
    } catch (err: any) {
      setFormError(err || "Schedule collision or validation error.");
    }
  };

  // Handle Delete
  const handleDeleteSlot = async (id: string, subjectName?: string) => {
    if (window.confirm(`Are you sure you want to remove ${subjectName || "this period"} from the timetable?`)) {
      try {
        await dispatch(deleteTimetableSlot(id)).unwrap();
        toast.success("Timetable slot removed");
      } catch (err: any) {
        toast.error(err || "Failed to remove slot");
      }
    }
  };

  // Handle Publish Timetable to Teachers & Students
  const handlePublishTimetable = async () => {
    try {
      await dispatch(publishTimetable({ isPublished: true })).unwrap();
      toast.success("Timetable Published! All teachers and students can now view the schedule.");
      dispatch(fetchAllTimetables());
    } catch (err: any) {
      toast.error(err || "Failed to publish timetable");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <FiClock className="w-6 h-6 text-indigo-400" />
              <span>Master Timetable Management</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live & Visible to Teachers</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build and organize class schedules by academic program, class level, subjects, and teachers. All published periods are accessible in the Teacher Timetable portal.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handlePublishTimetable}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/30 active:scale-95 transition cursor-pointer"
            title="Publish all timetable periods to teachers and students"
          >
            <FiCheckCircle className="w-4 h-4" />
            <span>Publish to Teachers</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <FiPrinter className="w-4 h-4" />
            <span className="hidden sm:inline">Print Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 active:scale-95 transition cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Period Slot</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Slots</div>
            <div className="text-2xl font-bold text-white mt-1">{totalPeriods}</div>
          </div>
          <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <FiCalendar className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Classes Scheduled</div>
            <div className="text-2xl font-bold text-white mt-1">{distinctClassesCount}</div>
          </div>
          <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <FiLayers className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Active Teachers</div>
            <div className="text-2xl font-bold text-white mt-1">{distinctTeachersCount}</div>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <FiUser className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Subjects Taught</div>
            <div className="text-2xl font-bold text-white mt-1">{distinctSubjectsCount}</div>
          </div>
          <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <FiBookOpen className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Program Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter by Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1d] border border-slate-700 text-xs text-white focus:border-indigo-500 outline-none"
            >
              <option value="All">All Programs</option>
              {programs.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Level Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter by Class Level</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1d] border border-slate-700 text-xs text-white focus:border-indigo-500 outline-none"
            >
              <option value="All">All Class Levels</option>
              {classOptions.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Day Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter by Day</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1d] border border-slate-700 text-xs text-white focus:border-indigo-500 outline-none"
            >
              <option value="All">All Days (Weekly Matrix)</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Search Keyword</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, teacher, room..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0a0f1d] border border-slate-700 text-xs text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* View Switcher and Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              Showing <span className="text-white font-bold">{filteredSlots.length}</span> of {slots.length} slots
            </span>
            {(selectedProgram !== "All" || selectedClass !== "All" || selectedDay !== "All" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProgram("All");
                  setSelectedClass("All");
                  setSelectedDay("All");
                  setSearchQuery("");
                }}
                className="text-[11px] text-indigo-400 hover:underline font-semibold ml-2"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-[#0a0f1d] p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                viewMode === "matrix" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              <FiGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Matrix View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                viewMode === "list" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              <FiList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List View</span>
            </button>
          </div>
        </div>
      </div>

      {/* MATRIX VIEW */}
      {viewMode === "matrix" ? (
        <div className="bg-[#0e1628] border border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#0a0f1d] border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 w-36 border-r border-slate-800">Period / Time</th>
                  {(selectedDay === "All" ? DAYS : [selectedDay as typeof DAYS[number]]).map((day) => (
                    <th key={day} className="py-3.5 px-4 text-center border-r border-slate-800 last:border-r-0">
                      <div className="font-extrabold text-white text-xs">{day}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {PERIOD_DEFAULTS.map(({ period, label }) => {
                  const isBreak = period === 4;
                  const isLunch = period === 6;

                  return (
                    <React.Fragment key={period}>
                      {isBreak && (
                        <tr className="bg-slate-900/60 text-slate-400 font-semibold text-[11px] text-center">
                          <td className="py-1.5 px-4 border-r border-slate-800 text-left">10:15 - 10:45 AM</td>
                          <td
                            colSpan={selectedDay === "All" ? DAYS.length : 1}
                            className="py-1.5 text-center tracking-widest uppercase text-amber-400/80"
                          >
                            ☕ Morning Recess / Interval
                          </td>
                        </tr>
                      )}
                      {isLunch && (
                        <tr className="bg-slate-900/60 text-slate-400 font-semibold text-[11px] text-center">
                          <td className="py-1.5 px-4 border-r border-slate-800 text-left">12:15 - 01:00 PM</td>
                          <td
                            colSpan={selectedDay === "All" ? DAYS.length : 1}
                            className="py-1.5 text-center tracking-widest uppercase text-emerald-400/80"
                          >
                            🥪 Lunch Interval
                          </td>
                        </tr>
                      )}

                      <tr className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-4 bg-[#0a0f1d]/50 border-r border-slate-800 font-medium text-slate-400 align-top">
                          <div className="text-white font-bold">Period {period}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
                        </td>

                        {(selectedDay === "All" ? DAYS : [selectedDay as typeof DAYS[number]]).map((day) => {
                          const slot = filteredSlots.find(
                            (s) => s.day === day && Number(s.periodNumber) === period
                          );

                          return (
                            <td
                              key={day}
                              className="py-2.5 px-3 border-r border-slate-800 last:border-r-0 align-top min-w-[170px]"
                            >
                              {slot ? (
                                <div className="p-3 rounded-2xl bg-[#090e1c] border border-slate-700/80 hover:border-indigo-500/60 shadow-sm transition-all space-y-1.5 relative group">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-white text-xs truncate">
                                      {slot.subjectName || slot.subject?.name}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-[10px] shrink-0">
                                      {slot.classLevel}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                                    <FiUser className="w-3 h-3 text-indigo-400 shrink-0" />
                                    <span className="truncate">{slot.teacherName || slot.teacher?.name}</span>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                                    <span className="flex items-center gap-1">
                                      <FiMapPin className="w-3 h-3 text-rose-400 shrink-0" />
                                      {slot.room}
                                    </span>
                                    <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
                                      {slot.programName || slot.program?.name}
                                    </span>
                                  </div>

                                  {slot.notes && (
                                    <p className="text-[10px] text-slate-400 italic border-t border-slate-800/80 pt-1 line-clamp-1">
                                      {slot.notes}
                                    </p>
                                  )}

                                  {/* Quick Action buttons */}
                                  <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-1 bg-slate-950/95 rounded-lg p-0.5 border border-slate-700">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(slot)}
                                      className="p-1 rounded text-slate-400 hover:text-white"
                                      title="Edit slot"
                                    >
                                      <FiEdit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSlot(slot._id, slot.subjectName)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                                      title="Delete slot"
                                    >
                                      <FiTrash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdd(day, period)}
                                  className="w-full h-full min-h-[68px] rounded-xl border border-dashed border-slate-800/80 hover:border-slate-600 hover:bg-slate-800/20 transition flex items-center justify-center text-slate-600 hover:text-slate-300"
                                  title={`Schedule on ${day} Period ${period}`}
                                >
                                  <FiPlus className="w-4 h-4 opacity-40 hover:opacity-100" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-[#0e1628] border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
          {filteredSlots.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No timetable slots match the selected criteria.
            </div>
          ) : (
            filteredSlots.map((slot) => (
              <div
                key={slot._id}
                className="p-4 hover:bg-slate-800/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                      {slot.day} • Period {slot.periodNumber}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {slot.timeSlot}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {slot.classLevel}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{slot.subjectName || slot.subject?.name}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({slot.programName || slot.program?.name})
                    </span>
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1 text-slate-300">
                      <FiUser className="w-3.5 h-3.5 text-indigo-400" />
                      {slot.teacherName || slot.teacher?.name}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <FiMapPin className="w-3.5 h-3.5 text-rose-400" />
                      {slot.room}
                    </span>
                    {slot.notes && <span className="italic text-slate-400">{slot.notes}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(slot)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition"
                    title="Edit Period"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(slot._id, slot.subjectName)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-slate-700 transition"
                    title="Delete Period"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CREATE / EDIT TIMETABLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingSlotId ? "Edit Timetable Period" : "Schedule Timetable Period"}
                </h3>
                <p className="text-xs text-slate-400">
                  Allocate academic program, class level, subject, teacher, and timeslot.
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
                <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs sm:text-sm">
              {/* Program & Class Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Academic Program *
                  </label>
                  <select
                    required
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  >
                    <option value="" disabled>
                      Select Program
                    </option>
                    {programs.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Class Level *
                  </label>
                  <input
                    type="text"
                    required
                    list="classList"
                    placeholder="e.g. Level 100, JSS 2A"
                    value={formData.classLevel}
                    onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  />
                  <datalist id="classList">
                    {classOptions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Subject & Teacher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Subject *
                  </label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  >
                    <option value="" disabled>
                      Select Subject
                    </option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Assigned Teacher *
                  </label>
                  <select
                    required
                    value={formData.teacher}
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  >
                    <option value="" disabled>
                      Select Teacher
                    </option>
                    {teachers.map((t: any) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.teacherId || "Teacher"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Day & Period Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Day of Week *</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Period Number *</label>
                  <select
                    value={formData.periodNumber}
                    onChange={(e) => handlePeriodChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  >
                    {PERIOD_DEFAULTS.map((p) => (
                      <option key={p.period} value={p.period}>
                        Period {p.period} ({p.label})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Start Time *</label>
                  <input
                    type="text"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    placeholder="e.g. 08:00 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">End Time *</label>
                  <input
                    type="text"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    placeholder="e.g. 08:45 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  />
                </div>
              </div>

              {/* Room & Focus Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Classroom / Hall</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g. Room 102, Science Hall"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes / Focus</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Weekly Quiz, Lab Practical"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
                    ? "Saving..."
                    : editingSlotId
                    ? "Update Period"
                    : "Create Period"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
