import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  fetchTeacherSchedule,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot,
} from "../../../features/timetable/timetableSlice";
import type { TimetableSlot } from "../../../features/timetable/timetableSlice";
import { fetchPrograms } from "../../../features/programs/programsSlice";
import { fetchSubjects } from "../../../features/subjects/subjectsSlice";
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
  FiCheckCircle,
  FiUser,
  FiStar,
  FiGrid,
} from "react-icons/fi";
import toast from "react-hot-toast";

export const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DayType = typeof ALL_DAYS[number];

const PERIOD_TIMES = [
  { period: 1, label: "08:00 AM - 08:45 AM", start: "08:00 AM", end: "08:45 AM" },
  { period: 2, label: "08:45 AM - 09:30 AM", start: "08:45 AM", end: "09:30 AM" },
  { period: 3, label: "09:30 AM - 10:15 AM", start: "09:30 AM", end: "10:15 AM" },
  { period: 4, label: "10:45 AM - 11:30 AM", start: "10:45 AM", end: "11:30 AM" },
  { period: 5, label: "11:30 AM - 12:15 PM", start: "11:30 AM", end: "12:15 PM" },
  { period: 6, label: "01:00 PM - 01:45 PM", start: "01:00 PM", end: "01:45 PM" },
  { period: 7, label: "01:45 PM - 02:30 PM", start: "01:45 PM", end: "02:30 PM" },
];

export default function TeacherTimetable() {
  const dispatch = useAppDispatch();
  const teacher = useAppSelector((state) => state.teacherAuth.teacher);
  const { teacherSchedule, actionLoading } = useAppSelector((state) => state.timetable);
  const { items: programs } = useAppSelector((state) => state.programs);
  const { items: subjects } = useAppSelector((state) => state.subjects);

  // Selected class filter for viewing full class schedule
  const [selectedClass, setSelectedClass] = useState<string>("All Classes");

  // Mode: "all-class" (all subjects in class) vs "my-schedule" (only my assigned periods)
  const [displayMode, setDisplayMode] = useState<"all-class" | "my-schedule">("all-class");

  // Mobile active day tab
  const [activeMobileDay, setActiveMobileDay] = useState<DayType>("Monday");

  // Modal State for Add / Edit slot
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    const classParam =
      selectedClass && selectedClass !== "All Classes"
        ? { classLevel: selectedClass }
        : { classLevel: "All" };
    dispatch(fetchTeacherSchedule(classParam));
    dispatch(fetchPrograms());
    dispatch(fetchSubjects());
  }, [dispatch, selectedClass]);

  // Sync selectedClass with backend's returned default if needed
  useEffect(() => {
    if ((!selectedClass || selectedClass === "All Classes") && teacherSchedule?.selectedClass) {
      // Keep "All Classes" or sync if backend specific
      if (teacherSchedule.selectedClass !== "All Classes") {
        setSelectedClass(teacherSchedule.selectedClass);
      }
    }
  }, [teacherSchedule]);

  const rawAvailable = teacherSchedule?.availableClasses || [];
  const availableClasses = useMemo(() => {
    const list = rawAvailable.filter((c) => c && c.toLowerCase() !== "all classes");
    return ["All Classes", ...list];
  }, [rawAvailable]);

  const myTeachingSlots = teacherSchedule?.myTeachingSlots || [];
  const classTimetableSlots = teacherSchedule?.classTimetableSlots || [];

  // Check if weekend slots exist in the schedule
  const hasWeekendSlots = useMemo(() => {
    return (
      myTeachingSlots.some((s) => s.day === "Saturday" || s.day === "Sunday") ||
      classTimetableSlots.some((s) => s.day === "Saturday" || s.day === "Sunday")
    );
  }, [myTeachingSlots, classTimetableSlots]);

  const activeDays: DayType[] = useMemo(() => {
    if (hasWeekendSlots) {
      return [...ALL_DAYS];
    }
    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  }, [hasWeekendSlots]);

  // Active slots according to toggle mode
  const activeSlots = useMemo(() => {
    if (displayMode === "my-schedule") {
      return myTeachingSlots;
    }
    return classTimetableSlots;
  }, [displayMode, myTeachingSlots, classTimetableSlots]);

  // Form data for slot modal
  const initialForm = {
    program: programs[0]?._id || "",
    classLevel: (selectedClass !== "All Classes" ? selectedClass : "") || (typeof teacher?.classLevel === "object" ? (teacher?.classLevel as any)?.name : teacher?.classLevel) || "jss 1",
    subject: typeof teacher?.subject === "object" ? (teacher?.subject as any)?._id || "" : "",
    teacher: teacher?._id || "",
    day: "Monday" as DayType,
    periodNumber: 1,
    startTime: "08:00 AM",
    endTime: "08:45 AM",
    room: "Room 102",
    notes: "",
  };

  const [formData, setFormData] = useState(initialForm);

  const handleOpenAdd = (day?: DayType, period?: number) => {
    setEditingSlotId(null);
    const targetPeriod = period || 1;
    const matched = PERIOD_TIMES.find((p) => p.period === targetPeriod);
    setFormData({
      ...initialForm,
      program: programs[0]?._id || "",
      classLevel: (selectedClass !== "All Classes" ? selectedClass : "") || initialForm.classLevel,
      day: day || activeMobileDay,
      periodNumber: targetPeriod,
      startTime: matched?.start || "08:00 AM",
      endTime: matched?.end || "08:45 AM",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slot: TimetableSlot) => {
    setEditingSlotId(slot._id);
    setFormData({
      program: slot.program?._id || slot.program || programs[0]?._id || "",
      classLevel: slot.classLevel,
      subject: slot.subject?._id || slot.subject || "",
      teacher: slot.teacher?._id || slot.teacher || teacher?._id || "",
      day: slot.day as any,
      periodNumber: slot.periodNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
      notes: slot.notes || "",
    });
    setIsModalOpen(true);
  };

  const handlePeriodChange = (periodNum: number) => {
    const matched = PERIOD_TIMES.find((p) => p.period === periodNum);
    setFormData((prev) => ({
      ...prev,
      periodNumber: periodNum,
      ...(matched ? { startTime: matched.start, endTime: matched.end } : {}),
    }));
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.classLevel) {
      toast.error("Subject and Class Level are required");
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
        toast.success("Period updated successfully");
      } else {
        await dispatch(createTimetableSlot(formData)).unwrap();
        toast.success("New class period scheduled");
      }
      setIsModalOpen(false);
      const classParam =
        selectedClass && selectedClass !== "All Classes"
          ? { classLevel: selectedClass }
          : { classLevel: "All" };
      dispatch(fetchTeacherSchedule(classParam));
    } catch (err: any) {
      toast.error(err || "Schedule conflict or save failure");
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (window.confirm("Remove this period from the timetable?")) {
      try {
        await dispatch(deleteTimetableSlot(id)).unwrap();
        toast.success("Period removed");
        const classParam =
          selectedClass && selectedClass !== "All Classes"
            ? { classLevel: selectedClass }
            : { classLevel: "All" };
        dispatch(fetchTeacherSchedule(classParam));
      } catch (err: any) {
        toast.error(err || "Failed to remove period");
      }
    }
  };

  // Stats calculation
  const totalMyWeeklyPeriods = myTeachingSlots.length;
  const distinctClassesTaught = useMemo(() => {
    return Array.from(new Set(myTeachingSlots.map((s) => s.classLevel))).length;
  }, [myTeachingSlots]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <FiClock className="w-6 h-6 text-amber-400" />
              <span>Teacher Timetable & Class Schedule</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Published & Live ({activeSlots.length} Periods)</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Weekly instructional schedule. View all subjects scheduled for your class and note your exact teaching days & times.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <FiPrinter className="w-4 h-4" />
            <span className="hidden sm:inline">Print Timetable</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 active:scale-95 transition cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Class Period</span>
          </button>
        </div>
      </div>

      {/* Class Level Selector & Schedule View Mode Toggle */}
      <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Class Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <FiLayers className="w-4 h-4 text-amber-400" />
            <span>Select Class Level:</span>
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-[#0a0f1d] border border-slate-700 text-xs text-white focus:border-indigo-500 outline-none font-semibold cursor-pointer"
          >
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls === "All Classes" ? "All Classes (Master Timetable)" : cls}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400">
            {selectedClass === "All Classes"
              ? "Showing master timetable across all school classes"
              : <span>Showing all subjects scheduled for class <span className="text-white font-bold">{selectedClass}</span></span>}
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#0a0f1d] p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setDisplayMode("all-class")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              displayMode === "all-class"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FiGrid className="w-3.5 h-3.5" />
            <span>All Subjects in Class</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode("my-schedule")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              displayMode === "my-schedule"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FiStar className="w-3.5 h-3.5" />
            <span>My Teaching Schedule Only</span>
          </button>
        </div>
      </div>

      {/* Metric summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">My Weekly Periods</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalMyWeeklyPeriods}</div>
          </div>
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <FiCalendar className="w-4 h-4" />
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Classes Taught</div>
            <div className="text-xl font-bold text-white mt-0.5">{distinctClassesTaught} Classes</div>
          </div>
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <FiLayers className="w-4 h-4" />
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Selected Class Slots</div>
            <div className="text-xl font-bold text-white mt-0.5">{classTimetableSlots.length} Periods</div>
          </div>
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <FiCheckCircle className="w-4 h-4" />
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Teaching Hours</div>
            <div className="text-xl font-bold text-white mt-0.5">{Math.round((totalMyWeeklyPeriods * 45) / 60)}h / wk</div>
          </div>
          <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <FiClock className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Highlight Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500 inline-block" />
          <span className="text-slate-300 font-medium">Your Assigned Teaching Periods (Note your Date & Time)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-slate-900 border border-slate-700 inline-block" />
          <span>Other Teachers' Periods in {selectedClass}</span>
        </span>
      </div>

      {/* MOBILE VIEW: Day Tabs + Vertical Period Cards */}
      <div className="block lg:hidden space-y-4">
        {/* Day Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {activeDays.map((day) => {
            const count = activeSlots.filter((s) => s.day === day).length;
            const isSelected = activeMobileDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setActiveMobileDay(day)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-[#0e1628] text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <span>{day}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Class Cards */}
        <div className="space-y-3">
          {activeSlots.filter((s) => s.day === activeMobileDay).length === 0 ? (
            <div className="p-8 text-center bg-[#0e1628] border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No classes scheduled on {activeMobileDay}.
              <button
                type="button"
                onClick={() => handleOpenAdd(activeMobileDay)}
                className="mt-3 block mx-auto text-indigo-400 hover:underline font-semibold"
              >
                + Add a period on {activeMobileDay}
              </button>
            </div>
          ) : (
            activeSlots
              .filter((s) => s.day === activeMobileDay)
              .sort((a, b) => a.periodNumber - b.periodNumber)
              .map((slot) => {
                const isMyClass =
                  slot.isMyClass ||
                  slot.teacher?._id?.toString() === teacher?._id?.toString() ||
                  slot.teacherName?.toLowerCase() === teacher?.name?.toLowerCase();

                return (
                  <div
                    key={slot._id}
                    className={`p-4 rounded-2xl bg-[#0e1628] border shadow-xs flex items-center justify-between gap-3 ${
                      isMyClass
                        ? "border-amber-500/60 ring-1 ring-amber-500/30 bg-amber-500/5"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isMyClass ? "bg-amber-500 text-slate-950 font-extrabold" : "bg-indigo-500/20 text-indigo-300"
                          }`}
                        >
                          Period {slot.periodNumber} {isMyClass && "• YOUR CLASS"}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <FiClock className="w-3 h-3 text-indigo-400" />
                          {slot.timeSlot || `${slot.startTime} - ${slot.endTime}`}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white">
                        {slot.subjectName || slot.subject?.name}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1 text-slate-300">
                          <FiUser className="w-3 h-3 text-indigo-400" />
                          {isMyClass ? "You" : slot.teacherName || slot.teacher?.name}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-300">
                          <FiLayers className="w-3 h-3 text-amber-400" />
                          {slot.classLevel}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <FiMapPin className="w-3 h-3 text-rose-400" />
                          {slot.room}
                        </span>
                      </div>

                      {slot.notes && (
                        <p className="text-[11px] text-slate-400 italic pt-1">{slot.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(slot)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Edit Period"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot._id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete Period"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* DESKTOP VIEW: Full Weekly Matrix Table */}
      <div className="hidden lg:block bg-[#0e1628] border border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0a0f1d] border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 w-36 border-r border-slate-800">Period / Time</th>
                {activeDays.map((day) => (
                  <th key={day} className="py-3.5 px-4 text-center border-r border-slate-800 last:border-r-0">
                    <div className="font-extrabold text-white text-xs">{day}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {PERIOD_TIMES.map(({ period, label }) => {
                const isBreakTime = period === 4;
                const isLunchTime = period === 6;

                return (
                  <React.Fragment key={period}>
                    {isBreakTime && (
                      <tr className="bg-slate-900/60 text-slate-400 font-semibold text-[11px] text-center">
                        <td className="py-1.5 px-4 border-r border-slate-800 text-left">10:15 - 10:45 AM</td>
                        <td colSpan={activeDays.length} className="py-1.5 text-center tracking-widest uppercase text-amber-400/80">
                          ☕ Morning Recess / Break
                        </td>
                      </tr>
                    )}
                    {isLunchTime && (
                      <tr className="bg-slate-900/60 text-slate-400 font-semibold text-[11px] text-center">
                        <td className="py-1.5 px-4 border-r border-slate-800 text-left">12:15 - 01:00 PM</td>
                        <td colSpan={activeDays.length} className="py-1.5 text-center tracking-widest uppercase text-emerald-400/80">
                          🥪 Lunch Interval
                        </td>
                      </tr>
                    )}

                    <tr className="hover:bg-slate-800/20 transition-colors">
                      {/* Period Header Column */}
                      <td className="py-3 px-4 bg-[#0a0f1d]/50 border-r border-slate-800 font-medium text-slate-400">
                        <div className="text-white font-bold">Period {period}</div>
                        <div className="text-[11px] text-slate-500">{label}</div>
                      </td>

                      {/* Day Columns */}
                      {activeDays.map((day) => {
                        const slot = activeSlots.find(
                          (s) => s.day === day && s.periodNumber === period
                        );

                        const isMyClass =
                          slot &&
                          (slot.isMyClass ||
                            slot.teacher?._id?.toString() === teacher?._id?.toString() ||
                            slot.teacherName?.toLowerCase() === teacher?.name?.toLowerCase());

                        return (
                          <td
                            key={day}
                            className="py-2.5 px-3 border-r border-slate-800 last:border-r-0 align-top relative group min-w-[170px]"
                          >
                            {slot ? (
                              <div
                                className={`p-3 rounded-2xl shadow-xs transition-all space-y-1 relative group/card ${
                                  isMyClass
                                    ? "bg-amber-500/10 border-2 border-amber-500/80 text-white"
                                    : "bg-slate-900/90 border border-slate-700/60 hover:border-indigo-500/50"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-xs truncate">
                                    {slot.subjectName || slot.subject?.name}
                                  </span>
                                  {isMyClass ? (
                                    <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wide">
                                      Your Class
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 font-medium text-[10px]">
                                      {slot.classLevel}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                                  <FiUser className={`w-3 h-3 ${isMyClass ? "text-amber-400" : "text-indigo-400"}`} />
                                  <span className="truncate">
                                    {isMyClass ? <strong className="text-amber-300">You</strong> : slot.teacherName || slot.teacher?.name}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <FiMapPin className="w-3 h-3 text-rose-400" />
                                    {slot.room}
                                  </span>
                                </div>

                                {slot.notes && (
                                  <div className="text-[10px] text-slate-400 truncate pt-0.5 border-t border-slate-800/80">
                                    {slot.notes}
                                  </div>
                                )}

                                {/* Action overlay */}
                                <div className="absolute top-1 right-1 hidden group-hover/card:flex items-center gap-0.5 bg-slate-950/90 rounded-lg p-0.5 border border-slate-700">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(slot)}
                                    className="p-1 rounded text-slate-400 hover:text-white"
                                    title="Edit"
                                  >
                                    <FiEdit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlot(slot._id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-400"
                                    title="Delete"
                                  >
                                    <FiTrash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenAdd(day, period)}
                                className="w-full h-full min-h-[64px] rounded-xl border border-dashed border-slate-800 hover:border-slate-600 hover:bg-slate-800/20 transition flex items-center justify-center text-slate-600 hover:text-slate-300 text-xs"
                                title={`Add period on ${day} Period ${period}`}
                              >
                                <FiPlus className="w-4 h-4 opacity-50 hover:opacity-100" />
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

      {/* Add / Edit Period Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingSlotId ? "Edit Class Period" : "Schedule Class Period"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Day</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  >
                    {ALL_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Period</label>
                  <select
                    value={formData.periodNumber}
                    onChange={(e) => handlePeriodChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  >
                    {PERIOD_TIMES.map((p) => (
                      <option key={p.period} value={p.period}>
                        Period {p.period} ({p.label.split(" - ")[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject</label>
                <select
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                >
                  <option value="" disabled>Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Class / Stream</label>
                  <input
                    type="text"
                    required
                    value={formData.classLevel}
                    onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                    placeholder="e.g. JSS 2A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Room</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g. Room 102"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lesson Focus / Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Weekly Quiz & Review"
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-indigo-500 outline-none text-xs"
                />
              </div>

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
                  {actionLoading ? "Saving..." : editingSlotId ? "Update Period" : "Schedule Period"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
