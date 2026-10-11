import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchStudentTimetable } from "../../features/timetable/timetableSlice";
import {
  FiClock,
  FiCalendar,
  FiPrinter,
  FiMapPin,
  FiUser,
  FiBookOpen,
  FiCheckCircle,
  FiAward,
  FiLayers,
  FiInfo,
} from "react-icons/fi";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

const PERIOD_DEFAULTS = [
  { period: 1, label: "08:00 AM - 08:45 AM" },
  { period: 2, label: "08:45 AM - 09:30 AM" },
  { period: 3, label: "09:30 AM - 10:15 AM" },
  { period: 4, label: "10:45 AM - 11:30 AM" },
  { period: 5, label: "11:30 AM - 12:15 PM" },
  { period: 6, label: "01:00 PM - 01:45 PM" },
  { period: 7, label: "01:45 PM - 02:30 PM" },
];

export default function StudentTimetable() {
  const dispatch = useAppDispatch();
  const { studentTimetable } = useAppSelector((state) => state.timetable);

  // Active filter by single subject (optional spotlight)
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("All");

  // Mobile active day
  const [activeMobileDay, setActiveMobileDay] = useState<typeof DAYS[number]>("Monday");

  useEffect(() => {
    dispatch(fetchStudentTimetable());
  }, [dispatch]);

  const student = studentTimetable?.student;
  const rawSlots = studentTimetable?.slots || [];
  const offeredSubjects = student?.offeredSubjects || [];

  // Filter slots if student spotlighted a specific subject
  const slots = useMemo(() => {
    if (selectedSubjectFilter === "All") return rawSlots;
    return rawSlots.filter(
      (s) =>
        (s.subjectName || s.subject?.name || "").toLowerCase() ===
        selectedSubjectFilter.toLowerCase()
    );
  }, [rawSlots, selectedSubjectFilter]);

  // Metric stats
  const totalOfferedCount = offeredSubjects.length || student?.offeredSubjectsCount || 0;
  const totalWeeklyPeriods = slots.length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-indigo-900/60 via-purple-900/40 to-[#0e1628] border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <FiAward className="w-3.5 h-3.5" />
              <span>Personalized Student Schedule</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {student?.name ? `${student.name}'s Timetable` : "My Timetable"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Timetable customized to your academic program, class level, and the{" "}
              <span className="text-indigo-300 font-bold">{totalOfferedCount} subject{totalOfferedCount === 1 ? "" : "s"}</span> you
              are currently offering.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white font-semibold flex items-center gap-1.5">
                <FiLayers className="w-3.5 h-3.5 text-amber-400" />
                <span>Class: {student?.currentClassLevel || "Level 100"}</span>
              </span>

              {student?.program && (
                <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 flex items-center gap-1.5">
                  <FiBookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Program: {student?.program?.name || student?.program}</span>
                </span>
              )}

              {student?.studentId && (
                <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-400">
                  ID: <span className="text-slate-200 font-mono font-medium">{student.studentId}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              <FiPrinter className="w-4 h-4 text-indigo-400" />
              <span>Print Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Offered Subjects Showcase Banner */}
      <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FiInfo className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Your Offered Subjects ({totalOfferedCount}):
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any subject to spotlight its periods on your schedule
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedSubjectFilter("All")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              selectedSubjectFilter === "All"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            <span>All My Subjects</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
              {rawSlots.length}
            </span>
          </button>

          {offeredSubjects.map((sub, idx) => {
            const isSelected = selectedSubjectFilter.toLowerCase() === sub.name.toLowerCase();
            const subjectSlotCount = rawSlots.filter(
              (s) =>
                (s.subjectName || s.subject?.name || "").toLowerCase() === sub.name.toLowerCase()
            ).length;

            return (
              <button
                key={sub.id || `${sub.name}-${idx}`}
                type="button"
                onClick={() => setSelectedSubjectFilter(isSelected ? "All" : sub.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30"
                    : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
                }`}
              >
                <span>{sub.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? "bg-black/20 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {subjectSlotCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Metric Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Offered Subjects</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalOfferedCount} Subjects</div>
          </div>
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <FiBookOpen className="w-4 h-4" />
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Weekly Periods</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalWeeklyPeriods} Classes</div>
          </div>
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <FiCalendar className="w-4 h-4" />
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Current Class</div>
            <div className="text-xl font-bold text-white mt-0.5 truncate max-w-[120px]">
              {student?.currentClassLevel || "Level 100"}
            </div>
          </div>
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <FiCheckCircle className="w-4 h-4" />
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Weekly Hours</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {Math.round((totalWeeklyPeriods * 45) / 60)}h / wk
            </div>
          </div>
          <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <FiClock className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* MOBILE DAY SELECTOR & CARDS (Hidden on lg) */}
      <div className="block lg:hidden space-y-4">
        {/* Day Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {DAYS.map((day) => {
            const count = slots.filter((s) => s.day === day).length;
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
          {slots.filter((s) => s.day === activeMobileDay).length === 0 ? (
            <div className="p-8 text-center bg-[#0e1628] border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No classes scheduled for your offered subjects on {activeMobileDay}.
            </div>
          ) : (
            slots
              .filter((s) => s.day === activeMobileDay)
              .sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0))
              .map((slot) => (
                <div
                  key={slot._id}
                  className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 hover:border-slate-700 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                      Period {slot.periodNumber}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <FiClock className="w-3 h-3 text-indigo-400" />
                      {slot.timeSlot || `${slot.startTime} - ${slot.endTime}`}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">{slot.subjectName || slot.subject?.name}</h4>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1 text-slate-300">
                      <FiUser className="w-3 h-3 text-indigo-400" />
                      {slot.teacherName || slot.teacher?.name}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <FiMapPin className="w-3 h-3 text-rose-400" />
                      {slot.room}
                    </span>
                  </div>

                  {slot.notes && (
                    <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                      {slot.notes}
                    </p>
                  )}
                </div>
              ))
          )}
        </div>
      </div>

      {/* DESKTOP MATRIX TABLE (Hidden on mobile) */}
      <div className="hidden lg:block bg-[#0e1628] border border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0a0f1d] border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 w-40 border-r border-slate-800">Period / Time</th>
                {DAYS.map((day) => (
                  <th key={day} className="py-3.5 px-4 text-center border-r border-slate-800 last:border-r-0">
                    <div className="font-extrabold text-white text-xs">{day}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {PERIOD_DEFAULTS.map(({ period, label }) => {
                const isBreakTime = period === 4;
                const isLunchTime = period === 6;

                return (
                  <React.Fragment key={period}>
                    {isBreakTime && (
                      <tr className="bg-slate-900/60 text-slate-400 font-semibold text-[11px] text-center">
                        <td className="py-1.5 px-4 border-r border-slate-800 text-left">10:15 - 10:45 AM</td>
                        <td colSpan={5} className="py-1.5 text-center tracking-widest uppercase text-amber-400/80">
                          ☕ Morning Recess / Interval
                        </td>
                      </tr>
                    )}
                    {isLunchTime && (
                      <tr className="bg-slate-900/60 text-slate-400 font-semibold text-[11px] text-center">
                        <td className="py-1.5 px-4 border-r border-slate-800 text-left">12:15 - 01:00 PM</td>
                        <td colSpan={5} className="py-1.5 text-center tracking-widest uppercase text-emerald-400/80">
                          🥪 Lunch Interval
                        </td>
                      </tr>
                    )}

                    <tr className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4 bg-[#0a0f1d]/50 border-r border-slate-800 font-medium text-slate-400 align-top">
                        <div className="text-white font-bold">Period {period}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
                      </td>

                      {DAYS.map((day) => {
                        const slot = slots.find(
                          (s) => s.day === day && Number(s.periodNumber) === period
                        );

                        return (
                          <td
                            key={day}
                            className="py-2.5 px-3 border-r border-slate-800 last:border-r-0 align-top min-w-[170px]"
                          >
                            {slot ? (
                              <div className="p-3 rounded-2xl bg-[#090e1c] border border-indigo-500/40 hover:border-indigo-400 shadow-sm transition-all space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-xs truncate">
                                    {slot.subjectName || slot.subject?.name}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                                    Offered
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                                  <FiUser className="w-3 h-3 text-indigo-400 shrink-0" />
                                  <span className="truncate">{slot.teacherName || slot.teacher?.name}</span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                                  <span className="flex items-center gap-1">
                                    <FiMapPin className="w-3 h-3 text-rose-400" />
                                    {slot.room}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {slot.timeSlot || `${slot.startTime}`}
                                  </span>
                                </div>

                                {slot.notes && (
                                  <div className="text-[10px] text-slate-400 truncate pt-0.5 border-t border-slate-800/80">
                                    {slot.notes}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-full min-h-[64px] rounded-xl border border-dashed border-slate-800/40 flex items-center justify-center text-slate-700 text-[11px]">
                                Free Period
                              </div>
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
    </div>
  );
}
