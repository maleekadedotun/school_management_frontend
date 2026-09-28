import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  markAttendance,
  fetchAttendanceByDate,
  fetchAttendanceHistory,
  fetchAttendanceStats,
  deleteAttendance,
  clearSubmitState,
} from "../../features/attendance/attendanceSlice";
import { fetchTeacherClassStudents } from "../../features/students/studentsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import {
  HiOutlineCalendar,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineDocumentArrowDown,
  HiOutlinePrinter,
  HiOutlineMagnifyingGlass,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineChartBar,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineLockClosed,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi2";

type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";

// Helper: Format Date to YYYY-MM-DD using local time
const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 5-Hour Lockout in milliseconds
const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

export default function TeacherAttendance() {
  const dispatch = useAppDispatch();

  // Redux state
  const { teacher } = useAppSelector((state) => state.teacherAuth);
  const { teacherClassStudents, loading: studentsLoading } = useAppSelector(
    (state) => state.students
  );
  const {
    currentSession,
    history,
    stats,
    loading: sessionLoading,
    submitting,
    submitSuccess,
    submitMessage,
    error: submitError,
  } = useAppSelector((state) => state.attendance);

  const { items: classLevelsList } = useAppSelector((state) => state.classLevels);
  const { items: academicTermsList } = useAppSelector((state) => state.academicTerms);

  // Active Teacher details
  const activeTeacher = useMemo(() => {
    if (teacher) return teacher;
    try {
      const stored = localStorage.getItem("teacher");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [teacher]);

  // Primary Dates & Relative Helpers
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatLocalDate(d);
  }, []);

  // Primary Filters
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedClassLevel, setSelectedClassLevel] = useState<string>(
    activeTeacher?.classLevel || "Level 100"
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(
    activeTeacher?.subject || "General Subject"
  );
  const [selectedTerm, setSelectedTerm] = useState<string>("1st Term");

  // Local Attendance State
  // { [studentId]: { status: AttendanceStatus, remarks: string } }
  const [attendanceRecords, setAttendanceRecords] = useState<{
    [studentId: string]: { status: AttendanceStatus; remarks: string };
  }>({});

  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"register" | "history" | "stats">("register");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Calendar Modal & Month View State
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Current timestamp for real-time 5-hour countdown calculation (refreshes every 10s)
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    dispatch(fetchTeacherClassStudents());
    dispatch(fetchClassLevels());
    dispatch(fetchAcademicTerms());
    dispatch(fetchAttendanceHistory());
    dispatch(fetchAttendanceStats());
  }, [dispatch]);

  // Sync Teacher Class & Subject default
  useEffect(() => {
    if (activeTeacher?.classLevel && selectedClassLevel === "Level 100") {
      setSelectedClassLevel(activeTeacher.classLevel);
    }
    if (activeTeacher?.subject && selectedSubject === "General Subject") {
      setSelectedSubject(activeTeacher.subject);
    }
  }, [activeTeacher]);

  // Fetch Attendance Session whenever Date or Class changes
  useEffect(() => {
    if (selectedDate && selectedClassLevel) {
      dispatch(
        fetchAttendanceByDate({
          date: selectedDate,
          classLevel: selectedClassLevel,
          subject: selectedSubject,
        })
      );
    }
  }, [dispatch, selectedDate, selectedClassLevel, selectedSubject]);

  // Populate Attendance Records from fetched session or initialize defaults
  useEffect(() => {
    const newRecords: { [studentId: string]: { status: AttendanceStatus; remarks: string } } = {};

    if (currentSession && currentSession.records && currentSession.records.length > 0) {
      // Existing session in database
      currentSession.records.forEach((rec: any) => {
        const sId = rec.student?._id || rec.student;
        if (sId) {
          newRecords[sId.toString()] = {
            status: (rec.status as AttendanceStatus) || "Present",
            remarks: rec.remarks || "",
          };
        }
      });
      setSessionNotes(currentSession.notes || "");
    } else if (teacherClassStudents && teacherClassStudents.length > 0) {
      // New session: default all students to "Present" for swift marking
      teacherClassStudents.forEach((student: any) => {
        const sId = student._id?.toString();
        if (sId) {
          newRecords[sId] = {
            status: "Present",
            remarks: "",
          };
        }
      });
      setSessionNotes("");
    }

    setAttendanceRecords(newRecords);
  }, [currentSession, teacherClassStudents]);

  // Dismiss success notification after 4s
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        dispatch(clearSubmitState());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess, dispatch]);

  // === 5-HOUR LOCKOUT COMPUTATION ===
  const sessionLockInfo = useMemo(() => {
    if (!currentSession) {
      return { isLocked: false, remainingMs: null, submittedAt: null, lockExpiresAt: null };
    }
    const submittedAtStr = currentSession.firstSubmittedAt || currentSession.createdAt;
    if (!submittedAtStr) {
      return { isLocked: false, remainingMs: null, submittedAt: null, lockExpiresAt: null };
    }

    const submittedTime = new Date(submittedAtStr).getTime();
    const expiresTime = submittedTime + FIVE_HOURS_MS;
    const remainingMs = Math.max(0, expiresTime - nowTimestamp);
    const isLocked = currentSession.isLocked || nowTimestamp >= expiresTime;

    return {
      isLocked,
      remainingMs,
      submittedAt: new Date(submittedTime),
      lockExpiresAt: new Date(expiresTime),
    };
  }, [currentSession, nowTimestamp]);

  const isSessionLocked = sessionLockInfo.isLocked;

  // Format countdown string: e.g. "4h 15m left"
  const formatTimeRemaining = (ms: number | null): string => {
    if (ms === null || ms <= 0) return "0m";
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  // Helper for History record lockout check
  const isHistoryRecordLocked = (item: any): boolean => {
    if (!item) return false;
    if (item.isLocked) return true;
    const timeStr = item.firstSubmittedAt || item.createdAt;
    if (!timeStr) return false;
    const time = new Date(timeStr).getTime();
    return nowTimestamp - time >= FIVE_HOURS_MS;
  };

  const getHistoryRecordRemaining = (item: any): string => {
    const timeStr = item.firstSubmittedAt || item.createdAt;
    if (!timeStr) return "";
    const time = new Date(timeStr).getTime();
    const expires = time + FIVE_HOURS_MS;
    const rem = Math.max(0, expires - nowTimestamp);
    return formatTimeRemaining(rem);
  };

  // Quick Date Selectors
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(formatLocalDate(d));
  };

  const handlePrevDay = () => {
    const current = new Date(selectedDate + "T00:00:00");
    current.setDate(current.getDate() - 1);
    setSelectedDate(formatLocalDate(current));
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate + "T00:00:00");
    current.setDate(current.getDate() + 1);
    setSelectedDate(formatLocalDate(current));
  };

  // Calendar Month Navigation
  const handlePrevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isTomorrow: boolean;
      isSelected: boolean;
      hasAttendance: boolean;
      attendanceRate?: number;
    }> = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const str = formatLocalDate(prevDate);
      days.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: str === todayStr,
        isTomorrow: str === tomorrowStr,
        isSelected: str === selectedDate,
        hasAttendance: history.some((h) => h.dateString === str),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const str = formatLocalDate(curDate);
      const histMatch = history.find((h) => h.dateString === str);
      days.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: str === todayStr,
        isTomorrow: str === tomorrowStr,
        isSelected: str === selectedDate,
        hasAttendance: !!histMatch,
        attendanceRate: histMatch?.summary?.attendanceRate,
      });
    }

    // Next month padding to fill a complete 7-day grid
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextDate = new Date(year, month + 1, d);
        const str = formatLocalDate(nextDate);
        days.push({
          dateStr: str,
          dayNumber: d,
          isCurrentMonth: false,
          isToday: str === todayStr,
          isTomorrow: str === tomorrowStr,
          isSelected: str === selectedDate,
          hasAttendance: history.some((h) => h.dateString === str),
        });
      }
    }

    return days;
  }, [calendarMonth, todayStr, tomorrowStr, selectedDate, history]);

  // Selected date human-readable title
  const dateFormattedTitle = useMemo(() => {
    try {
      const d = new Date(selectedDate + "T00:00:00");
      return d.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Status Toggler
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (isSessionLocked) return;
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        remarks: prev[studentId]?.remarks || "",
      },
    }));
  };

  // Remarks Updater
  const handleRemarksChange = (studentId: string, remarks: string) => {
    if (isSessionLocked) return;
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: prev[studentId]?.status || "Present",
        remarks,
      },
    }));
  };

  // Bulk Operations
  const handleMarkAll = (status: AttendanceStatus) => {
    if (isSessionLocked) return;
    const updated: { [studentId: string]: { status: AttendanceStatus; remarks: string } } = {};
    teacherClassStudents.forEach((s: any) => {
      const sId = s._id?.toString();
      if (sId) {
        updated[sId] = {
          status,
          remarks: attendanceRecords[sId]?.remarks || "",
        };
      }
    });
    setAttendanceRecords(updated);
  };

  // Live Summary Calculation
  const liveSummary = useMemo(() => {
    const total = teacherClassStudents.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    Object.values(attendanceRecords).forEach((rec) => {
      if (rec.status === "Present") present++;
      else if (rec.status === "Absent") absent++;
      else if (rec.status === "Late") late++;
      else if (rec.status === "Excused") excused++;
    });

    const attended = present + late;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 100;

    return { total, present, absent, late, excused, rate };
  }, [attendanceRecords, teacherClassStudents]);

  // Filtered Students for Table View
  const filteredStudents = useMemo(() => {
    return teacherClassStudents.filter((student: any) => {
      const name = (student.name || "").toLowerCase();
      const id = (student.StudentId || student.studentId || "").toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch = name.includes(query) || id.includes(query);

      const record = attendanceRecords[student._id?.toString()];
      const studentStatus = record?.status || "Present";
      const matchesStatus =
        statusFilter === "all" || studentStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [teacherClassStudents, searchTerm, statusFilter, attendanceRecords]);

  // Submit / Save Attendance to Backend
  const handleSaveAttendance = () => {
    if (isSessionLocked) {
      alert("This attendance session is locked and cannot be edited after 5 hours.");
      return;
    }

    if (teacherClassStudents.length === 0) {
      alert("No students available in your assigned class to mark attendance.");
      return;
    }

    const recordsArray = teacherClassStudents.map((s: any) => {
      const sId = s._id?.toString();
      const record = attendanceRecords[sId];
      return {
        student: sId,
        status: record?.status || "Present",
        remarks: record?.remarks || "",
      };
    });

    dispatch(
      markAttendance({
        date: selectedDate,
        classLevel: selectedClassLevel,
        subject: selectedSubject,
        academicTerm: selectedTerm,
        academicYear: activeTeacher?.academicYear || "2025/2026",
        records: recordsArray,
        notes: sessionNotes,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        dispatch(fetchAttendanceHistory());
        dispatch(fetchAttendanceStats());
      }
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (teacherClassStudents.length === 0) return;

    const headers = ["Student Name", "Student ID", "Class Level", "Status", "Remarks", "Date"];
    const rows = teacherClassStudents.map((s: any) => {
      const sId = s._id?.toString();
      const rec = attendanceRecords[sId] || { status: "Present", remarks: "" };
      return [
        `"${s.name || ""}"`,
        `"${s.StudentId || s.studentId || ""}"`,
        `"${s.currentClassLevel || selectedClassLevel}"`,
        `"${rec.status}"`,
        `"${rec.remarks || ""}"`,
        `"${selectedDate}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `attendance-${selectedClassLevel.replace(/\s+/g, "_")}-${selectedDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <HiOutlineAcademicCap className="w-4 h-4 text-indigo-400" />
                Teacher Portal • Student Attendance
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {selectedClassLevel}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                {selectedSubject}
              </span>
              {selectedDate === tomorrowStr && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1">
                  <HiOutlineSparkles className="w-3.5 h-3.5" />
                  Taking Next Day Attendance
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Student Attendance Management
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
              Take daily roll call, plan ahead for the next day, and track attendance records.
              <span className="text-amber-300/90 font-medium ml-1">
                Note: Attendance records lock permanently 5 hours after submission.
              </span>
            </p>
          </div>

          {/* Action Tabs & Calendar View Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowCalendarModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <HiOutlineCalendarDays className="w-4 h-4 text-indigo-300" />
              <span>Full Calendar</span>
            </button>

            <div className="bg-slate-800/80 p-1 rounded-2xl border border-white/10 flex items-center">
              <button
                onClick={() => setActiveTab("register")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "register"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Mark Register
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "history"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Attendance Log ({history.length})
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "stats"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Analytics
              </button>
            </div>

            <button
              onClick={() => {
                dispatch(fetchTeacherClassStudents());
                dispatch(
                  fetchAttendanceByDate({
                    date: selectedDate,
                    classLevel: selectedClassLevel,
                    subject: selectedSubject,
                  })
                );
              }}
              title="Refresh attendance records"
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer"
            >
              <HiOutlineArrowPath className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 flex items-center justify-between text-xs sm:text-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{submitMessage || "Attendance recorded and saved successfully!"}</span>
          </div>
          <button
            onClick={() => dispatch(clearSubmitState())}
            className="text-emerald-300 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {submitError && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <HiOutlineXCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{submitError}</span>
          </div>
          <button
            onClick={() => dispatch(clearSubmitState())}
            className="text-rose-300 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Stat 1: Total Enrolled */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase">Total Students</span>
            <HiOutlineUserGroup className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {liveSummary.total}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Enrolled in Class</p>
          </div>
        </div>

        {/* Stat 2: Attendance Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase">Daily Presence</span>
            <HiOutlineChartBar className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span
              className={`text-2xl font-black ${
                liveSummary.rate >= 85
                  ? "text-emerald-500"
                  : liveSummary.rate >= 70
                  ? "text-amber-500"
                  : "text-rose-500"
              }`}
            >
              {liveSummary.rate}%
            </span>
            <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  liveSummary.rate >= 85
                    ? "bg-emerald-500"
                    : liveSummary.rate >= 70
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${liveSummary.rate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stat 3: Present */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
              Present
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {liveSummary.present}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {liveSummary.total > 0
                ? Math.round((liveSummary.present / liveSummary.total) * 100)
                : 0}
              % of class
            </p>
          </div>
        </div>

        {/* Stat 4: Absent */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase text-rose-600 dark:text-rose-400">
              Absent
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {liveSummary.absent}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Needs follow-up</p>
          </div>
        </div>

        {/* Stat 5: Late */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase text-amber-600 dark:text-amber-400">
              Late Arrivals
            </span>
            <HiOutlineClock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {liveSummary.late}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Tardy records</p>
          </div>
        </div>

        {/* Stat 6: Excused */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase text-sky-600 dark:text-sky-400">
              Excused
            </span>
            <HiOutlineShieldCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
              {liveSummary.excused}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Medical / official</p>
          </div>
        </div>
      </div>

      {/* === VIEW 1: MARK REGISTER === */}
      {activeTab === "register" && (
        <div className="space-y-6">
          {/* Controls Bar: Date, Calendar Quick Switcher, Class, Subject */}
          <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-5">
            {/* Top Interactive Calendar Navigation Strip */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  title="Previous Day"
                  className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                >
                  <HiOutlineChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev Day</span>
                </button>

                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-600">
                  <HiOutlineCalendar className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {dateFormattedTitle}
                  </span>
                  {selectedDate === todayStr && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold ml-1">
                      Today
                    </span>
                  )}
                  {selectedDate === tomorrowStr && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                      Tomorrow (Next Day)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextDay}
                  title="Next Day"
                  className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                >
                  <span className="hidden sm:inline">Next Day</span>
                  <HiOutlineChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Jump Pills */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDate === todayStr
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 border border-gray-200 dark:border-slate-600"
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedDate === tomorrowStr
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm ring-2 ring-emerald-400/50"
                      : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 border border-gray-200 dark:border-slate-600"
                  }`}
                >
                  <HiOutlineSparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Next Day (Tomorrow)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCalendarModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 transition-all cursor-pointer flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
                >
                  <HiOutlineCalendarDays className="w-4 h-4" />
                  <span>Pick on Calendar</span>
                </button>
              </div>
            </div>

            {/* Standard Filter Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <HiOutlineCalendar className="w-4 h-4 text-indigo-500" />
                    Attendance Date
                  </span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Class Level Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HiOutlineAcademicCap className="w-4 h-4 text-indigo-500" />
                  Target Class Level
                </label>
                <select
                  value={selectedClassLevel}
                  onChange={(e) => setSelectedClassLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {classLevelsList && classLevelsList.length > 0 ? (
                    classLevelsList.map((lvl: any) => (
                      <option key={lvl._id} value={lvl.name}>
                        {lvl.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Level 100">Level 100</option>
                      <option value="Level 200">Level 200</option>
                      <option value="Level 300">Level 300</option>
                      <option value="Level 400">Level 400</option>
                    </>
                  )}
                </select>
              </div>

              {/* Subject Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HiOutlineBookOpen className="w-4 h-4 text-indigo-500" />
                  Course / Subject
                </label>
                <input
                  type="text"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  placeholder="e.g. Mathematics, Science"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Academic Term */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HiOutlineSparkles className="w-4 h-4 text-indigo-500" />
                  Academic Term
                </label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {academicTermsList && academicTermsList.length > 0 ? (
                    academicTermsList.map((t: any) => (
                      <option key={t._id} value={t.name}>
                        {t.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="1st Term">1st Term</option>
                      <option value="2nd Term">2nd Term</option>
                      <option value="3rd Term">3rd Term</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Quick Bulk Action Row */}
            <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Bulk Actions:
                </span>
                <button
                  type="button"
                  onClick={() => handleMarkAll("Present")}
                  disabled={isSessionLocked}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    isSessionLocked
                      ? "bg-gray-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 cursor-pointer"
                  }`}
                >
                  <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll("Absent")}
                  disabled={isSessionLocked}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    isSessionLocked
                      ? "bg-gray-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 cursor-pointer"
                  }`}
                >
                  <HiOutlineXCircle className="w-3.5 h-3.5" />
                  All Absent
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll("Late")}
                  disabled={isSessionLocked}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    isSessionLocked
                      ? "bg-gray-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 cursor-pointer"
                  }`}
                >
                  <HiOutlineClock className="w-3.5 h-3.5" />
                  All Late
                </button>
              </div>

              {/* Status / Lock Badges */}
              <div className="flex items-center gap-2 text-xs">
                {isSessionLocked ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                    <HiOutlineLockClosed className="w-3.5 h-3.5 text-rose-500" />
                    Locked (5h Expired)
                  </span>
                ) : currentSession ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Saved • Editable ({formatTimeRemaining(sessionLockInfo.remainingMs)})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    Unsaved Draft Session
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* === 5-HOUR LOCKOUT WARNING / NOTICE BANNER === */}
          {isSessionLocked ? (
            <div className="p-4 md:p-5 rounded-3xl bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-rose-950/40 border border-rose-500/30 text-rose-200 shadow-sm flex items-start gap-4 animate-fadeIn">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <HiOutlineLockClosed className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm md:text-base text-rose-300 flex items-center gap-2">
                  <span>Attendance Register Locked (5-Hour Window Expired)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 font-mono">
                    Read-Only
                  </span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This attendance session was initially submitted on{" "}
                  <strong>
                    {sessionLockInfo.submittedAt
                      ? sessionLockInfo.submittedAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) +
                        " (" +
                        sessionLockInfo.submittedAt.toLocaleDateString() +
                        ")"
                      : "earlier today"}
                  </strong>
                  . According to academic policy, attendance registers can no longer be edited,
                  modified, or deleted once 5 hours have elapsed.
                </p>
              </div>
            </div>
          ) : currentSession && sessionLockInfo.remainingMs !== null ? (
            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <HiOutlineClock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  <strong>5-Hour Edit Window Active:</strong> You have{" "}
                  <strong className="text-indigo-600 dark:text-indigo-300 font-mono">
                    {formatTimeRemaining(sessionLockInfo.remainingMs)}
                  </strong>{" "}
                  remaining to make adjustments. The record will lock permanently at{" "}
                  <span className="font-semibold underline">
                    {sessionLockInfo.lockExpiresAt?.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  .
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                Auto-Locks in 5 Hours
              </span>
            </div>
          ) : null}

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student by name or ID..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 text-xs text-gray-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
              <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Filter Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="all">All ({teacherClassStudents.length})</option>
                <option value="Present">Present Only ({liveSummary.present})</option>
                <option value="Absent">Absent Only ({liveSummary.absent})</option>
                <option value="Late">Late Only ({liveSummary.late})</option>
                <option value="Excused">Excused Only ({liveSummary.excused})</option>
              </select>

              <button
                type="button"
                onClick={handleExportCSV}
                title="Export this register as CSV"
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200/80 dark:border-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <HiOutlineDocumentArrowDown className="w-4 h-4 text-indigo-500" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Student Register Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {studentsLoading || sessionLoading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-semibold">Loading student roll call...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-400 flex items-center justify-center text-2xl mx-auto">
                  📋
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  No Students Found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {teacherClassStudents.length === 0
                    ? `No students are registered under ${selectedClassLevel} or assigned to your teacher account yet.`
                    : "No students match your active search or status filter."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200/80 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40 text-slate-400 uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 font-bold">#</th>
                      <th className="py-3.5 px-4 font-bold">Student Name & ID</th>
                      <th className="py-3.5 px-4 font-bold">Class & Program</th>
                      <th className="py-3.5 px-4 font-bold text-center">Attendance Status</th>
                      <th className="py-3.5 px-4 font-bold">Remarks / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    {filteredStudents.map((student: any, idx: number) => {
                      const sId = student._id?.toString();
                      const currentRec = attendanceRecords[sId] || {
                        status: "Present",
                        remarks: "",
                      };
                      const currentStatus = currentRec.status;

                      return (
                        <tr
                          key={sId || idx}
                          className="hover:bg-gray-50/60 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-4 px-4 font-semibold text-slate-400 text-center w-12">
                            {idx + 1}
                          </td>

                          {/* Student Info */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                                {student.name
                                  ? student.name
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()
                                  : "ST"}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                  {student.name}
                                </h4>
                                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                                  {student.StudentId || student.studentId || "STU-ID"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Class & Program */}
                          <td className="py-4 px-4">
                            <span className="font-semibold text-gray-900 dark:text-white block">
                              {student.currentClassLevel || selectedClassLevel}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate block max-w-xs">
                              {typeof student.program === "object"
                                ? student.program?.name
                                : student.program || "Standard Curriculum"}
                            </span>
                          </td>

                          {/* Attendance Status Selector Buttons */}
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Present */}
                              <button
                                type="button"
                                disabled={isSessionLocked}
                                onClick={() => handleStatusChange(sId, "Present")}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 ${
                                  isSessionLocked
                                    ? currentStatus === "Present"
                                      ? "bg-emerald-600 text-white opacity-80 cursor-not-allowed"
                                      : "bg-gray-100 dark:bg-slate-800 text-slate-400 opacity-40 cursor-not-allowed"
                                    : currentStatus === "Present"
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/50 cursor-pointer"
                                    : "bg-gray-100 hover:bg-emerald-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 cursor-pointer"
                                }`}
                              >
                                <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                                <span>Present</span>
                              </button>

                              {/* Absent */}
                              <button
                                type="button"
                                disabled={isSessionLocked}
                                onClick={() => handleStatusChange(sId, "Absent")}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 ${
                                  isSessionLocked
                                    ? currentStatus === "Absent"
                                      ? "bg-rose-600 text-white opacity-80 cursor-not-allowed"
                                      : "bg-gray-100 dark:bg-slate-800 text-slate-400 opacity-40 cursor-not-allowed"
                                    : currentStatus === "Absent"
                                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-500/50 cursor-pointer"
                                    : "bg-gray-100 hover:bg-rose-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 cursor-pointer"
                                }`}
                              >
                                <HiOutlineXCircle className="w-3.5 h-3.5" />
                                <span>Absent</span>
                              </button>

                              {/* Late */}
                              <button
                                type="button"
                                disabled={isSessionLocked}
                                onClick={() => handleStatusChange(sId, "Late")}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 ${
                                  isSessionLocked
                                    ? currentStatus === "Late"
                                      ? "bg-amber-500 text-white opacity-80 cursor-not-allowed"
                                      : "bg-gray-100 dark:bg-slate-800 text-slate-400 opacity-40 cursor-not-allowed"
                                    : currentStatus === "Late"
                                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-400/50 cursor-pointer"
                                    : "bg-gray-100 hover:bg-amber-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 cursor-pointer"
                                }`}
                              >
                                <HiOutlineClock className="w-3.5 h-3.5" />
                                <span>Late</span>
                              </button>

                              {/* Excused */}
                              <button
                                type="button"
                                disabled={isSessionLocked}
                                onClick={() => handleStatusChange(sId, "Excused")}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 ${
                                  isSessionLocked
                                    ? currentStatus === "Excused"
                                      ? "bg-sky-600 text-white opacity-80 cursor-not-allowed"
                                      : "bg-gray-100 dark:bg-slate-800 text-slate-400 opacity-40 cursor-not-allowed"
                                    : currentStatus === "Excused"
                                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-500/50 cursor-pointer"
                                    : "bg-gray-100 hover:bg-sky-50 dark:bg-slate-800 text-slate-400 hover:text-sky-500 cursor-pointer"
                                }`}
                              >
                                <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                                <span>Excused</span>
                              </button>
                            </div>
                          </td>

                          {/* Remarks Column */}
                          <td className="py-4 px-4">
                            <div className="relative">
                              <input
                                type="text"
                                value={currentRec.remarks}
                                disabled={isSessionLocked}
                                onChange={(e) => handleRemarksChange(sId, e.target.value)}
                                placeholder={isSessionLocked ? "No remarks" : "Add note (optional)..."}
                                className={`w-full px-3 py-1.5 rounded-xl border text-xs ${
                                  isSessionLocked
                                    ? "bg-gray-100 dark:bg-slate-800/40 border-gray-200 dark:border-slate-800 text-slate-400 cursor-not-allowed"
                                    : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                                }`}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Session Notes & Bottom Sticky Action Bar */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-1/2 space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                <HiOutlineChatBubbleBottomCenterText className="w-4 h-4 text-indigo-500" />
                Session Overall Notes (Optional)
              </label>
              <input
                type="text"
                value={sessionNotes}
                disabled={isSessionLocked}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="e.g. Field trip period, heavy rainfall delay, special lecture..."
                className={`w-full px-3.5 py-2 rounded-xl border text-xs ${
                  isSessionLocked
                    ? "bg-gray-100 dark:bg-slate-800/40 border-gray-200 dark:border-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                }`}
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-3 rounded-2xl border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <HiOutlinePrinter className="w-4 h-4" />
                Print Register
              </button>

              {isSessionLocked ? (
                <button
                  type="button"
                  disabled
                  className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 font-bold text-xs flex items-center gap-2 cursor-not-allowed opacity-80 shadow-inner"
                >
                  <HiOutlineLockClosed className="w-4 h-4 text-rose-400" />
                  <span>Attendance Locked (5h Expired)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={submitting || teacherClassStudents.length === 0}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Attendance...</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineCheckCircle className="w-4 h-4" />
                      <span>
                        {currentSession ? "Update Attendance Register" : "Save Attendance Register"}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === VIEW 2: ATTENDANCE HISTORY LOG === */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HiOutlineCalendar className="w-5 h-5 text-indigo-500" />
              Past Attendance Registers Log
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {history.length} Saved Record(s)
            </span>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                No past attendance records saved yet.
              </p>
              <p className="text-xs text-slate-400">
                Mark your daily attendance in the "Mark Register" tab to build your historical log.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => {
                const s = item.summary || {
                  total: 0,
                  present: 0,
                  absent: 0,
                  late: 0,
                  excused: 0,
                  attendanceRate: 0,
                };
                const recordLocked = isHistoryRecordLocked(item);
                const remaining = getHistoryRecordRemaining(item);

                return (
                  <div
                    key={item._id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                            {item.dateString}
                          </span>
                          {recordLocked ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-900 flex items-center gap-1">
                              <HiOutlineLockClosed className="w-3 h-3 text-rose-500" />
                              Locked
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                              <HiOutlineClock className="w-3 h-3 text-emerald-500" />
                              {remaining || "Editable"}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-base text-gray-900 dark:text-white mt-0.5">
                          {item.classLevel}
                        </h4>
                        <span className="text-[11px] text-slate-400">{item.subject || "Subject"}</span>
                      </div>

                      <span
                        className={`text-lg font-black px-2.5 py-1 rounded-xl ${
                          s.attendanceRate >= 85
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : s.attendanceRate >= 70
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                        }`}
                      >
                        {s.attendanceRate}%
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs pt-2 border-t border-gray-100 dark:border-slate-800">
                      <div className="p-1.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20">
                        <span className="text-[10px] text-slate-400 block uppercase">Present</span>
                        <strong className="font-bold text-emerald-600 dark:text-emerald-400">
                          {s.present}
                        </strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20">
                        <span className="text-[10px] text-slate-400 block uppercase">Absent</span>
                        <strong className="font-bold text-rose-600 dark:text-rose-400">
                          {s.absent}
                        </strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                        <span className="text-[10px] text-slate-400 block uppercase">Late</span>
                        <strong className="font-bold text-amber-600 dark:text-amber-400">
                          {s.late}
                        </strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-sky-50/50 dark:bg-sky-950/20">
                        <span className="text-[10px] text-slate-400 block uppercase">Excused</span>
                        <strong className="font-bold text-sky-600 dark:text-sky-400">
                          {s.excused}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(item.dateString);
                          setSelectedClassLevel(item.classLevel);
                          if (item.subject) setSelectedSubject(item.subject);
                          setActiveTab("register");
                        }}
                        className={`text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                          recordLocked
                            ? "text-slate-500 hover:text-indigo-600 dark:text-slate-400"
                            : "text-indigo-600 dark:text-indigo-400 hover:underline"
                        }`}
                      >
                        {recordLocked ? (
                          <>
                            <HiOutlineLockClosed className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Register (Locked)</span>
                          </>
                        ) : (
                          <>
                            <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                            <span>Re-open & Edit</span>
                          </>
                        )}
                      </button>

                      {!recordLocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Delete attendance record for ${item.classLevel} on ${item.dateString}?`
                              )
                            ) {
                              dispatch(deleteAttendance(item._id));
                            }
                          }}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      ) : (
                        <span
                          title="This record cannot be deleted because 5 hours have passed"
                          className="text-[11px] text-slate-400 flex items-center gap-1"
                        >
                          <HiOutlineLockClosed className="w-3 h-3 text-slate-400" />
                          Non-deletable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === VIEW 3: ATTENDANCE ANALYTICS === */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <HiOutlineChartBar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  Attendance Metrics & Analytics
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aggregated presence statistics across all saved sessions for your class
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700/60">
                <span className="text-xs text-slate-400 block font-semibold uppercase">
                  Total Sessions Logged
                </span>
                <span className="text-3xl font-black text-gray-900 dark:text-white mt-1 block">
                  {stats?.totalSessions || history.length}
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700/60">
                <span className="text-xs text-slate-400 block font-semibold uppercase">
                  Lifetime Attendance Rate
                </span>
                <span className="text-3xl font-black text-emerald-500 mt-1 block">
                  {stats?.overallRate || 95}%
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700/60">
                <span className="text-xs text-slate-400 block font-semibold uppercase">
                  Class Headcount
                </span>
                <span className="text-3xl font-black text-indigo-500 mt-1 block">
                  {teacherClassStudents.length} Students
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === INTERACTIVE CALENDAR MODAL / DIALOG === */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <HiOutlineCalendarDays className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-extrabold text-base sm:text-lg">
                    Academic Attendance Calendar
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Select any date to take attendance, plan ahead for the next day, or view records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-bold cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            {/* Calendar Controls & Month Switcher */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-lg text-gray-900 dark:text-white">
                    {calendarMonth.toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 transition-all cursor-pointer"
                  >
                    <HiOutlineChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Current Month
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 transition-all cursor-pointer"
                  >
                    <HiOutlineChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 uppercase py-1 border-b border-gray-100 dark:border-slate-800">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Calendar Grid of Days */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((item, idx) => {
                  const isSel = item.dateStr === selectedDate;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedDate(item.dateStr);
                        setShowCalendarModal(false);
                      }}
                      className={`min-h-[58px] p-1.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer relative ${
                        isSel
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-105 z-10"
                          : item.isTomorrow
                          ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 hover:border-emerald-400"
                          : item.isToday
                          ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 hover:border-indigo-400"
                          : item.isCurrentMonth
                          ? "bg-gray-50/70 hover:bg-gray-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-gray-200/70 dark:border-slate-800 text-gray-800 dark:text-slate-200"
                          : "bg-transparent border-transparent text-slate-300 dark:text-slate-600 opacity-40 hover:opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-black ${
                            isSel
                              ? "text-white"
                              : item.isTomorrow
                              ? "text-emerald-600 dark:text-emerald-400"
                              : item.isToday
                              ? "text-indigo-600 dark:text-indigo-400"
                              : ""
                          }`}
                        >
                          {item.dayNumber}
                        </span>

                        {item.isTomorrow && !isSel && (
                          <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-emerald-500 text-white leading-none">
                            Next
                          </span>
                        )}
                        {item.isToday && !isSel && (
                          <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-indigo-500 text-white leading-none">
                            Now
                          </span>
                        )}
                      </div>

                      {/* Logged attendance indicator */}
                      {item.hasAttendance && (
                        <div className="mt-1 flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSel ? "bg-white" : "bg-emerald-500"
                            }`}
                          />
                          <span
                            className={`text-[9px] font-semibold ${
                              isSel ? "text-indigo-100" : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {item.attendanceRate !== undefined ? `${item.attendanceRate}%` : "Saved"}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Jump Shortcuts at Bottom of Calendar */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(todayStr);
                      setShowCalendarModal(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-gray-800 dark:text-slate-200 transition-all cursor-pointer"
                  >
                    Select Today ({todayStr})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(tomorrowStr);
                      setShowCalendarModal(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1 cursor-pointer"
                  >
                    <HiOutlineSparkles className="w-3.5 h-3.5" />
                    <span>Take Next Day ({tomorrowStr})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
