import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchStudentProfile,
  fetchStudentEnrolledSubjects,
  updateStudentProfile,
} from "../../features/students/studentsSlice";
import {
  HiOutlineChevronDown,
  HiOutlineBookOpen,
  HiOutlineAcademicCap,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
} from "react-icons/hi2";
import {
  FiCheck,
  FiCheckCircle,
  FiMail,
  FiCalendar,
  FiUser,
  FiUserCheck,
  FiAward,
  FiFileText,
  FiSettings,
  FiBookOpen,
  FiClipboard,
  FiShield,
  FiX,
  FiLock,
  FiClock,
  FiAlertTriangle,
  FiArrowRight,
  FiCopy,
  FiHash,
} from "react-icons/fi";

const StudentProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const studentState = useAppSelector((state) => state.students);
  const {
    profile,
    student,
    currentStudent,
    allEnrolledSubjects,
    enrolledSubjectsByClass,
    allExamResults: sliceAllExamResults,
    writtenExamIds,
  } = studentState;

  const currentStudentObj = profile || student || currentStudent;

  const [activeTab, setActiveTab] = useState<"overview" | "academic" | "exams" | "settings" | "subjects">(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    if (["overview", "academic", "exams", "settings", "subjects"].includes(hash)) {
      return hash as any;
    }
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem("student_profile_active_tab") : null;
    if (saved && ["overview", "academic", "exams", "settings", "subjects"].includes(saved)) {
      return saved as any;
    }
    return "subjects"; // Default to subjects so user immediately sees their subjects upon opening / refreshing!
  });

  const handleTabChange = (tab: "overview" | "academic" | "exams" | "settings" | "subjects") => {
    setActiveTab(tab);
    try {
      localStorage.setItem("student_profile_active_tab", tab);
      window.location.hash = tab;
    } catch {}
  };

  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  const isClassExpanded = (lvl: string): boolean => {
    const norm = (lvl || "").toLowerCase().trim();
    if (expandedClasses[norm] !== undefined) {
      return expandedClasses[norm];
    }
    // All classes start dropped down by default so subjects are visible immediately!
    return true;
  };

  const toggleClassDropdown = (lvl: string) => {
    const norm = (lvl || "").toLowerCase().trim();
    setExpandedClasses((prev) => {
      const current = prev[norm] !== undefined ? prev[norm] : true;
      return {
        ...prev,
        [norm]: !current,
      };
    });
  };

  const [copiedId, setCopiedId] = useState(false);

  // Profile Edit Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchStudentProfile());
    dispatch(fetchStudentEnrolledSubjects());
  }, [dispatch]);

  useEffect(() => {
    if (currentStudentObj?.email) {
      setEmail(currentStudentObj.email);
    }
  }, [currentStudentObj?.email]);

  const studentName = currentStudentObj?.name || "Student User";
  const studentId = currentStudentObj?.studentId || currentStudentObj?.StudentId || "STU-2026";
  const studentEmail = currentStudentObj?.email || "student@university.edu";

  // Resolve Program Information
  const rawProgram =
    typeof currentStudentObj?.program === "object" && currentStudentObj?.program !== null
      ? (currentStudentObj.program as any)
      : null;
  const programName =
    rawProgram?.name ||
    (typeof currentStudentObj?.program === "string" ? currentStudentObj.program : "") ||
    "Bachelor of Science in Software Engineering";
  const programDuration = rawProgram?.duration || "4 Academic Years";
  const programCode = rawProgram?.code || "SE-2026-ENG";

  // Academic Year & Level
  const academicYearName =
    typeof currentStudentObj?.academicYear === "object" && currentStudentObj?.academicYear !== null
      ? (currentStudentObj.academicYear as any).name
      : currentStudentObj?.academicYear || "2025/2026 Academic Session";

  const currentLevel = currentStudentObj?.currentClassLevel || "Level 400";
  const admissionDate = currentStudentObj?.dateAdmitted
    ? new Date(currentStudentObj.dateAdmitted).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "September 15, 2022";

  // Helper to reliably display teacher name or "empty"
  const getTeacherDisplayName = (teacher: any): string => {
    if (!teacher) return "empty";
    if (typeof teacher === "object" && teacher.name) {
      const rawName = teacher.name;
      if (rawName && !/^[0-9a-fA-F]{24}$/.test(rawName) && rawName.toLowerCase() !== "not assigned" && rawName !== "-") {
        return rawName;
      }
      return "empty";
    }
    if (typeof teacher === "string") {
      if (/^[0-9a-fA-F]{24}$/.test(teacher)) return "empty";
      const trimmed = teacher.trim();
      if (!trimmed || trimmed.toLowerCase() === "not assigned" || trimmed === "-" || trimmed.toLowerCase() === "empty") return "empty";
      return trimmed;
    }
    return "empty";
  };

  const isCoreSubject = (name: string, isCoreFlag?: boolean) => {
    if (isCoreFlag) return true;
    return /^(math|mathematics|english|general math)/i.test(name || "");
  };

  const getSubjectsForClass = (targetClass: string) => {
    const targetNorm = targetClass.toLowerCase().trim();
    const targetDigits = targetNorm.match(/\d+/)?.[0] || "";

    // 1. Check enrolledSubjectsByClass
    const group = (enrolledSubjectsByClass || []).find((g) => {
      const gName = (g.classLevel || g.shortCode || "").toLowerCase().trim();
      const gDigits = gName.match(/\d+/)?.[0] || "";
      if (targetDigits && gDigits) return targetDigits === gDigits;
      return gName === targetNorm;
    });

    let subjects: any[] = [];
    if (group && Array.isArray(group.subjects) && group.subjects.length > 0) {
      subjects = [...group.subjects];
    } else {
      // 2. Filter allEnrolledSubjects
      subjects = (allEnrolledSubjects || []).filter((s: any) => {
        const sClass = (s.classLevel || "").toLowerCase().trim();
        const sDigits = sClass.match(/\d+/)?.[0] || "";
        if (targetDigits && sDigits) return targetDigits === sDigits;
        return sClass === targetNorm;
      });
    }

    // 3. For promoted classes (JSS 2 if promoted, JSS 3 if promoted), carry forward any subjects attended in JSS 1
    if (targetDigits && Number(targetDigits) > 1 && Number(targetDigits) <= maxStudentStep) {
      const jss1Group = (enrolledSubjectsByClass || []).find((g) => {
        const gName = (g.classLevel || g.shortCode || "").toLowerCase().trim();
        return gName.includes("jss 1") || gName === "jss 1" || (gName.match(/\d+/)?.[0] === "1" && gName.includes("jss"));
      });
      const jss1Subjects = (jss1Group && Array.isArray(jss1Group.subjects) && jss1Group.subjects.length > 0)
        ? jss1Group.subjects
        : (allEnrolledSubjects || []).filter((s: any) => {
            const sClass = (s.classLevel || "").toLowerCase().trim();
            return sClass.includes("jss 1") || sClass === "jss 1" || (sClass.match(/\d+/)?.[0] === "1" && sClass.includes("jss"));
          });

      jss1Subjects.forEach((j1Sub: any) => {
        const alreadyExists = subjects.some(
          (s: any) => (s.name || "").toLowerCase().trim() === (j1Sub.name || "").toLowerCase().trim()
        );
        if (!alreadyExists) {
          subjects.push({
            ...j1Sub,
            classLevel: targetClass,
            teacher: null, // Unassigned in this class level -> displays "empty"
          });
        }
      });
    }

    return subjects;
  };

  // Determine the highest class level the student has been promoted to
  const maxStudentStep = useMemo(() => {
    const curLevel = (currentStudentObj?.currentClassLevel || "").toLowerCase();
    const classLevelsList: string[] = Array.isArray(currentStudentObj?.classLevels)
      ? (currentStudentObj.classLevels as string[])
      : typeof currentStudentObj?.classLevels === "string"
      ? [currentStudentObj.classLevels]
      : [];
    const allStrings = [curLevel, ...classLevelsList.map((c) => (c || "").toLowerCase())];
    if (allStrings.some((c) => /(?:jss|sss|js|ss)\s*3|three|\b3\b/i.test(c))) return 3;
    if (allStrings.some((c) => /(?:jss|sss|js|ss)\s*2|two|\b2\b/i.test(c))) return 2;
    return 1;
  }, [currentStudentObj?.currentClassLevel, currentStudentObj?.classLevels]);

  const availableClassLevels = useMemo(() => {
    const curLevel = (currentStudentObj?.currentClassLevel || "").toLowerCase();
    const classLevelsList: string[] = Array.isArray(currentStudentObj?.classLevels)
      ? (currentStudentObj.classLevels as string[])
      : typeof currentStudentObj?.classLevels === "string"
      ? [currentStudentObj.classLevels]
      : [];
    const isSSS =
      curLevel.includes("sss") ||
      curLevel.startsWith("ss") ||
      classLevelsList.some((c) => (c || "").toLowerCase().includes("sss"));
    const prefix = isSSS ? "SSS" : "JSS";

    const list: string[] = [`${prefix} 1`];
    if (maxStudentStep >= 2 && !list.includes(`${prefix} 2`)) {
      list.push(`${prefix} 2`);
    }
    if (maxStudentStep >= 3 && !list.includes(`${prefix} 3`)) {
      list.push(`${prefix} 3`);
    }

    // Only include classes from enrolledSubjectsByClass if student has actually reached them
    (enrolledSubjectsByClass || []).forEach((g) => {
      const name = (g.classLevel || "").trim();
      const gDigits = name.match(/\d+/)?.[0];
      if (gDigits && Number(gDigits) > maxStudentStep) {
        return; // Never show next/future class!
      }
      if (name && !list.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
        list.push(name);
      }
    });
    return list;
  }, [maxStudentStep, enrolledSubjectsByClass, currentStudentObj?.currentClassLevel, currentStudentObj?.classLevels]);

  // Exam Performance Data (Evaluations taken by student)
  const allTakenList: any[] = useMemo(() => {
    const list =
      (currentStudentObj as any)?.allExamResults ||
      (currentStudentObj as any)?.allExamsTaken ||
      sliceAllExamResults ||
      (Array.isArray(currentStudentObj?.examsResults) ? currentStudentObj.examsResults : []);
    return Array.isArray(list) ? list : [];
  }, [currentStudentObj, sliceAllExamResults]);

  const totalExamsTaken = useMemo(() => {
    if ((currentStudentObj as any)?.totalExamsTaken !== undefined && (currentStudentObj as any)?.totalExamsTaken !== null) {
      return Number((currentStudentObj as any).totalExamsTaken);
    }
    if ((currentStudentObj as any)?.examsTakenCount !== undefined && (currentStudentObj as any)?.examsTakenCount !== null) {
      return Number((currentStudentObj as any).examsTakenCount);
    }
    if (allTakenList.length > 0) return allTakenList.length;
    if (writtenExamIds && writtenExamIds.length > 0) return writtenExamIds.length;
    return 0;
  }, [currentStudentObj, allTakenList, writtenExamIds]);

  const passedExamsCount = useMemo(() => {
    if ((currentStudentObj as any)?.passedExamsCount !== undefined && (currentStudentObj as any)?.passedExamsCount !== null) {
      return Number((currentStudentObj as any).passedExamsCount);
    }
    return allTakenList.filter(
      (r) => r?.status === "Pass" || r?.status === "Passed" || (r?.score && Number(r?.score) >= 50)
    ).length;
  }, [currentStudentObj, allTakenList]);

  const averageScore = useMemo(() => {
    if (allTakenList.length > 0) {
      const sum = allTakenList.reduce((acc, r) => acc + (Number(r?.score) || 0), 0);
      return Math.round(sum / allTakenList.length);
    }
    if ((currentStudentObj as any)?.averageScore) {
      return Number((currentStudentObj as any).averageScore);
    }
    return 84;
  }, [allTakenList, currentStudentObj]);

  const pendingTeacherCount =
    (currentStudentObj as any)?.pendingTeacherReviewCount ??
    (allTakenList.filter((r) => !r?.isTeacherPublished).length || 0);
  const pendingAdminCount =
    (currentStudentObj as any)?.pendingAdminReviewCount ??
    (allTakenList.filter((r) => r?.isTeacherPublished === true && !r?.isPublished).length || 0);
  const hasPendingReview = pendingTeacherCount > 0 || pendingAdminCount > 0;

  const publishedExamResults = allTakenList.filter((r: any) => r?.isPublished === true);
  const examResultsToDisplay = allTakenList.length > 0 ? allTakenList : publishedExamResults;

  const handleCopyId = () => {
    navigator.clipboard.writeText(studentId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);

    if (password && password !== confirmPassword) {
      setUpdateError("Passwords do not match. Please verify.");
      return;
    }

    if (password && password.length < 6) {
      setUpdateError("Password must be at least 6 characters long.");
      return;
    }

    setIsUpdating(true);
    const payload: { email?: string; password?: string } = {};
    if (email && email !== currentStudentObj?.email) payload.email = email;
    if (password) payload.password = password;

    if (Object.keys(payload).length === 0) {
      setIsUpdating(false);
      setUpdateError("No changes detected to update.");
      return;
    }

    try {
      const res = await dispatch(updateStudentProfile(payload));
      if (updateStudentProfile.fulfilled.match(res)) {
        setUpdateSuccess("Profile credentials successfully updated!");
        setPassword("");
        setConfirmPassword("");
        dispatch(fetchStudentProfile());
      } else {
        setUpdateError((res.payload as string) || "Failed to update profile.");
      }
    } catch {
      setUpdateError("An unexpected error occurred while updating profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto text-slate-100 min-w-0">
      {/* Top Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/student/dashboard" className="hover:text-indigo-400 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-indigo-300 font-medium">My Student Profile</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Verified Student Status
          </span>
        </div>
      </div>

      {/* Hero Passport Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-[#0e172a] border border-indigo-500/30 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8">
          {/* Avatar with dynamic initials */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white text-3xl sm:text-4xl font-extrabold shadow-2xl shadow-indigo-500/40 border-2 border-white/20">
              {studentName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join("") || "ST"}
            </div>
            <span className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-emerald-500 text-white border-2 border-[#070b14] shadow-md" title="Active">
              <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          </div>

          {/* Student Identity Information */}
          <div className="flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {studentName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentLevel}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Good Standing
              </span>
            </div>

            <p className="text-sm sm:text-base text-indigo-200/90 font-medium">
              {programName}
            </p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1 text-xs text-slate-300 font-medium">
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-colors cursor-pointer"
                title="Click to copy Matriculation ID"
              >
                <span className="inline-flex items-center gap-1">
                  <FiHash className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span>ID:</span>
                </span>
                <span className="font-mono text-indigo-300 font-bold">{studentId}</span>
                <span className="text-[10px] text-slate-400 inline-flex items-center gap-0.5">
                  {copiedId ? (
                    <>
                      <FiCheck className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-2.5 h-2.5" />
                      <span>Copy</span>
                    </>
                  )}
                </span>
              </button>

              <span className="flex items-center gap-1.5 text-slate-400">
                <FiMail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{studentEmail}</span>
              </span>

              <span className="flex items-center gap-1.5 text-slate-400">
                <FiCalendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Admitted: {admissionDate}</span>
              </span>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
            <Link
              to="/student/subjects"
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 text-center transition-all"
            >
              Enrolled Subjects ({allEnrolledSubjects.length})
            </Link>
            <Link
              to="/student/program"
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 text-center transition-all"
            >
              Curriculum Roadmap
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg space-y-1">
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            Total Subjects
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white flex items-baseline gap-2">
            <span>{allEnrolledSubjects.length}</span>
            <span className="text-xs text-indigo-400 font-normal">Active Courses</span>
          </div>
          <p className="text-[11px] text-slate-400">Across enrolled class tiers</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg space-y-1">
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            Exams Taken
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white flex items-baseline gap-2">
            <span>{totalExamsTaken}</span>
            <span className="text-xs text-emerald-400 font-normal">{passedExamsCount} Passed</span>
          </div>
          <p className="text-[11px] text-slate-400">Official graded evaluations</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg space-y-1">
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            Average Score
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-300 flex items-baseline gap-2">
            <span>{averageScore}%</span>
            <span className="text-xs text-slate-300 font-normal">
              {averageScore >= 70 ? "Grade A" : averageScore >= 60 ? "Grade B" : "Grade C"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Cumulative academic marks</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg space-y-1">
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            Academic Status
          </span>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
            <FiCheckCircle className="w-5 h-5 shrink-0" />
            <span>Good Standing</span>
          </div>
          <p className="text-[11px] text-slate-400">Eligible for examinations & promotion</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar gap-2">
        <button
          type="button"
          onClick={() => handleTabChange("overview")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
            activeTab === "overview"
              ? "text-indigo-400 border-indigo-500 font-bold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <FiUser className="w-4 h-4 shrink-0" />
          <span>Profile Overview</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("academic")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
            activeTab === "academic"
              ? "text-indigo-400 border-indigo-500 font-bold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <FiAward className="w-4 h-4 shrink-0" />
          <span>Academic Record & Degree</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("exams")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
            activeTab === "exams"
              ? "text-indigo-400 border-indigo-500 font-bold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <FiFileText className="w-4 h-4 shrink-0" />
          <span>Examination Results ({totalExamsTaken})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("settings")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
            activeTab === "settings"
              ? "text-indigo-400 border-indigo-500 font-bold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <FiSettings className="w-4 h-4 shrink-0" />
          <span>Account & Credentials</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("subjects")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
            activeTab === "subjects"
              ? "text-indigo-400 border-indigo-500 font-bold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <FiBookOpen className="w-4 h-4 shrink-0" />
          <span>Student Subjects</span>
        </button>
      </div>

      {/* Tab Content 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information Card */}
          <div className="lg:col-span-2 rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FiClipboard className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>Student Information & Credentials</span>
              </h2>
              <span className="text-xs text-indigo-400 font-mono">Official Record</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-xs text-slate-400 block">Full Legal Name</span>
                <span className="font-semibold text-white">{studentName}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-xs text-slate-400 block">Matriculation ID</span>
                <span className="font-semibold text-indigo-300 font-mono">{studentId}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-xs text-slate-400 block">Student Email</span>
                <span className="font-semibold text-white truncate block">{studentEmail}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-xs text-slate-400 block">Current Class Tier</span>
                <span className="font-semibold text-emerald-400">{currentLevel}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-xs text-slate-400 block">Degree Track</span>
                <span className="font-semibold text-white">{programName}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-xs text-slate-400 block">Academic Session</span>
                <span className="font-semibold text-white">{academicYearName}</span>
              </div>
            </div>

            {/* Academic Progression Progress */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">
                  Academic Progression ({enrolledSubjectsByClass.map((g) => g.shortCode).join(" → ") || "Class Progression"})
                </span>
                <span className="text-indigo-400 font-bold">
                  {currentStudentObj?.isGraduated ? "100% Completed" : "In Progress"}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-all duration-500"
                  style={{
                    width: `${
                      currentStudentObj?.isGraduated
                        ? 100
                        : Math.min(
                            100,
                            Math.max(
                              25,
                              (((enrolledSubjectsByClass.findIndex((g) => g.isCurrent) + 1) || 1) /
                                (enrolledSubjectsByClass.length || 1)) *
                                100
                            )
                          )
                    }%`,
                  }}
                />
              </div>
              <div className="grid grid-flow-col auto-cols-fr gap-2 pt-1 text-[11px] text-center text-slate-400">
                {enrolledSubjectsByClass.map((g) => (
                  <span
                    key={g.classLevel}
                    className={
                      g.isCurrent
                        ? "text-indigo-300 font-bold"
                        : g.isCompleted
                        ? "text-emerald-400 font-medium inline-flex items-center justify-center gap-1"
                        : "text-slate-500"
                    }
                  >
                    {g.isCompleted ? (
                      <>
                        <FiCheck className="w-3 h-3 shrink-0" />
                        <span>{g.shortCode}</span>
                      </>
                    ) : g.isCurrent ? (
                      `Current (${g.shortCode})`
                    ) : (
                      g.shortCode
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Advising & Contact */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FiShield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Academic Standing</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <div className="font-bold">Active & Good Academic Standing</div>
                <div className="text-[11px] text-emerald-400/80">
                  You are fully certified to enroll in subjects, take all scheduled midterm and final examinations, and access university research facilities.
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Exam Clearance Status: Approved</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Course Enrollment: Completed</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Library & Computing Lab Access: Granted</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FiUserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Faculty Mentor</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your designated academic advisor oversees your course selection, GPA verification, and graduation audit.
              </p>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-200 space-y-1">
                <div className="font-semibold text-white">Dean of Academic Affairs</div>
                <div className="text-slate-400">faculty.advising@university.edu</div>
                <div className="text-[11px] text-indigo-300">Office: Technology Complex, Rm 304</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Academic Record & Degree */}
      {activeTab === "academic" && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FiAward className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span>Degree Program & Curriculum Roadmap</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Official matriculation curriculum track</p>
              </div>
              <Link
                to="/student/program"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 w-fit"
              >
                <span>Full Program Page</span>
                <FiArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <span className="text-xs text-slate-400 uppercase font-semibold">Award Title</span>
                <span className="text-sm font-bold text-white block">Bachelor of Science (B.Sc.)</span>
                <span className="text-xs text-indigo-300">{programName}</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <span className="text-xs text-slate-400 uppercase font-semibold">Standard Duration</span>
                <span className="text-sm font-bold text-white block">{programDuration}</span>
                <span className="text-xs text-slate-400">8 Semesters Full-Time</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <span className="text-xs text-slate-400 uppercase font-semibold">Curriculum Code</span>
                <span className="text-sm font-bold text-amber-300 font-mono block">{programCode}</span>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <FiCheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Fully Accredited</span>
                </span>
              </div>
            </div>

            {/* Class Levels Breakdown */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FiBookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Enrolled Academic Class Tiers & Course Load</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {enrolledSubjectsByClass && enrolledSubjectsByClass.length > 0 ? (
                  enrolledSubjectsByClass.map((group) => (
                    <div
                      key={group.classLevel}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400">{group.shortCode}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {group.count} Courses
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white">{group.classLevel}</div>

                      <div className="text-xs text-slate-400">
                        {group.subjects && group.subjects.length > 0 ? (
                          <div className="space-y-1">
                            {group.subjects.slice(0, 3).map((s) => (
                              <div key={s._id} className="truncate text-slate-300">
                                • {s.name}
                              </div>
                            ))}
                            {group.subjects.length > 3 && (
                              <div className="text-[11px] text-indigo-400 font-medium">
                                +{group.subjects.length - 3} more subjects
                              </div>
                            )}
                          </div>
                        ) : (
                          <span>Curriculum completed or no active subjects</span>
                        )}
                      </div>

                      <Link
                        to={`/student/subjects?class=${encodeURIComponent(group.classLevel)}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 pt-1"
                      >
                        <span>Explore Level</span>
                        <FiArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-xs text-slate-400">
                    Loading academic tiers...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Examination Results */}
      {activeTab === "exams" && (
        <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FiFileText className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>Examination Transcripts & Score Reports</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official graded semester tests, midterms, and finals
              </p>
            </div>

            <Link
              to="/student/exams"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 w-fit"
            >
              <span>Take Scheduled Exams</span>
              <FiArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>

          {/* Two-Tier Publication Architecture Notice */}
          <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-indigo-950/40 p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold text-sm shrink-0 border border-violet-500/30">
                <FiShield className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">Results Evaluation & Release Policy</h4>
                <p className="text-xs text-slate-300">
                  All examination scripts follow a strict two-stage release protocol: Respective Teacher Review &rarr; Administrative Approval &rarr; Official Publication.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                <span className="font-bold block text-white">1. Student Takes Exam</span>
                <span className="text-[11px] text-slate-400">Responses recorded securely</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <span className="font-bold block text-amber-300">2. Teacher Reviews</span>
                <span className="text-[11px] text-amber-300/80">Submitted to instructor for verification</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200">
                <span className="font-bold block text-indigo-300">3. Admin Publishes</span>
                <span className="text-[11px] text-indigo-300/80">Administration verifies & officially releases</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
                <span className="font-bold block text-emerald-300">4. Official Transcript</span>
                <span className="text-[11px] text-emerald-300/80">Visible on student dashboard</span>
              </div>
            </div>
          </div>

          {/* Pending Reviews Notice */}
          {hasPendingReview && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Submissions In Review Pipeline
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                {pendingTeacherCount > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200">
                    <span className="font-bold block">Stage 1: Awaiting Respective Teacher Review</span>
                    <span className="text-[11px] text-amber-300/80">
                      {pendingTeacherCount} exam submission(s) currently with your teacher for review and publishing. (Admin cannot view until teacher publishes)
                    </span>
                  </div>
                )}
                {pendingAdminCount > 0 && (
                  <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-200">
                    <span className="font-bold block">Stage 2: Approved by Teacher — Under Admin Review</span>
                    <span className="text-[11px] text-indigo-300/80">
                      {pendingAdminCount} exam submission(s) verified by your teacher and currently with Administration for final publishing.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {examResultsToDisplay.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Exam / Course</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Class Level</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Publication</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {examResultsToDisplay.map((result: any, idx: number) => {
                    const examName = result?.exam?.name || result?.examName || `Examination #${idx + 1}`;
                    const subjectName = result?.exam?.subject?.name || result?.subject?.name || result?.subject || "General Subject";
                    const classLevel = result?.classLevel?.name || result?.classLevel || currentLevel;
                    const score = Number(result?.score) || 0;
                    const grade = result?.grade || (score >= 70 ? "A" : score >= 60 ? "B" : score >= 50 ? "C" : "D");
                    const status = result?.status || (score >= 50 ? "Pass" : "Fail");
                    const isFullyPublished = result?.isPublished === true;
                    const isAwaitingAdmin = result?.isTeacherPublished === true && !result?.isPublished;

                    return (
                      <tr key={result._id || idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">{examName}</td>
                        <td className="py-3.5 px-4 text-indigo-300">{subjectName}</td>
                        <td className="py-3.5 px-4">{classLevel}</td>
                        <td className="py-3.5 px-4 font-bold text-white">{score}%</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                            grade === "A"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : grade === "B"
                              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}>
                            {grade}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 font-semibold ${
                            status === "Pass" || status === "Passed" ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {status === "Pass" || status === "Passed" ? (
                              <FiCheck className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <FiX className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isFullyPublished ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <FiCheckCircle className="w-3 h-3 shrink-0" />
                              <span>Published</span>
                            </span>
                          ) : isAwaitingAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              <FiClock className="w-3 h-3 shrink-0" />
                              <span>Admin Review</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <FiClock className="w-3 h-3 shrink-0" />
                              <span>Teacher Review</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 italic">
                          {result?.remarks || "Satisfactory academic performance"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <FiFileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">No Exam Transcripts Recorded Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Once you sit for tests or end-of-term examinations, your graded scripts, percentage breakdown, and faculty remarks will automatically populate here.
              </p>
              <Link
                to="/student/exams"
                className="inline-block mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                Browse Scheduled Exams
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 4: Settings & Credentials */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Edit Credentials Form */}
          <div className="lg:col-span-2 rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FiLock className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>Security & Account Credentials</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Update your login email address and secure password
              </p>
            </div>

            {updateSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 shrink-0" />
                <span>{updateSuccess}</span>
              </div>
            )}

            {updateError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4 shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Student Name (Managed by Registrar)
                </label>
                <input
                  type="text"
                  disabled
                  value={studentName}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 text-sm cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 focus:border-indigo-500 focus:outline-none text-white text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 focus:border-indigo-500 focus:outline-none text-white text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 focus:border-indigo-500 focus:outline-none text-white text-sm transition-all"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Credentials</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Guidelines */}
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FiShield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Security Protocols</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your student credentials provide access to examination sessions, coursework submissions, and academic records.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Use at least 8 characters with numbers and symbols</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Never share your Matriculation password with peers</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Log out after using public campus library workstations</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab Content 5: Student Subjects */}
      {activeTab === "subjects" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                <HiOutlineBookOpen className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Student Subjects & Curriculum History
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <HiOutlineSparkles className="w-3.5 h-3.5" />
                    Official Attended Records
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Review the subjects you partook in for each class level. Click on any class tier below (e.g. <strong>JSS 1</strong>) to drop down the complete subjects table with assigned teachers and curriculum duration.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 text-right">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Active Class</span>
                <span className="text-sm font-bold text-indigo-300 font-mono">{currentLevel}</span>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 text-right">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Total Subjects</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{allEnrolledSubjects.length}</span>
              </div>
            </div>
          </div>

          {/* Collapsible Class Level Sections */}
          <div className="space-y-4">
            {availableClassLevels.map((lvl) => {
              const classSubjects = getSubjectsForClass(lvl);
              const isExpanded = isClassExpanded(lvl);
              const isJss1 = lvl.toLowerCase().includes("jss 1") || lvl.toLowerCase().includes("jss1");
              const isCurrent = currentLevel.toLowerCase().includes(lvl.toLowerCase().replace(/\s+/g, ""));

              return (
                <div
                  key={lvl}
                  className="rounded-3xl bg-slate-900/60 border border-white/10 overflow-hidden backdrop-blur-xl shadow-xl transition-all"
                >
                  {/* Dropdown Header Trigger */}
                  <button
                    type="button"
                    onClick={() => toggleClassDropdown(lvl)}
                    className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`p-3 rounded-2xl border shrink-0 transition-transform group-hover:scale-105 ${
                          isJss1
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : isCurrent
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        }`}
                      >
                        <HiOutlineAcademicCap className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                            {lvl} Subjects
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isJss1
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : isCurrent
                                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                                : "bg-slate-700/50 text-slate-300 border-slate-600/30"
                            }`}
                          >
                            {isJss1
                              ? "Attended & Completed"
                              : isCurrent
                              ? "Current Class Level"
                              : "Attended Curriculum"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isJss1
                            ? "Official curriculum and subjects completed during JSS 1 academic session."
                            : `Subjects registered and attended under ${lvl}.`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-300 border border-white/10">
                        {classSubjects.length} {classSubjects.length === 1 ? "Subject" : "Subjects"}
                      </span>
                      <div
                        className={`p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 transition-transform duration-300 ${
                          isExpanded ? "rotate-180 text-indigo-400 bg-indigo-500/10 border-indigo-500/30" : ""
                        }`}
                      >
                        <HiOutlineChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {/* Dropdown Subjects Table */}
                  {isExpanded && (
                    <div className="border-t border-white/5 p-4 sm:p-6 bg-slate-950/40">
                      {classSubjects.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          No registered subjects found for {lvl}.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/40">
                          <table className="w-full text-left text-xs sm:text-sm border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400 text-[11px] uppercase tracking-wider">
                                <th className="py-3.5 px-3 sm:px-4 font-semibold w-12 text-center">#</th>
                                <th className="py-3.5 px-3 sm:px-4 font-semibold">Subject Name</th>
                                <th className="py-3.5 px-3 sm:px-4 font-semibold">Class Level</th>
                                <th className="py-3.5 px-3 sm:px-4 font-semibold">Assigned Teacher</th>
                                <th className="py-3.5 px-3 sm:px-4 font-semibold">Duration</th>
                                <th className="py-3.5 px-3 sm:px-4 font-semibold">Type</th>
                                <th className="py-3.5 px-3 sm:px-4 font-semibold text-center">Progression Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {classSubjects.map((sub: any, idx: number) => {
                                const isCore = isCoreSubject(sub.name, sub.isCore);
                                const teacherName = getTeacherDisplayName(sub.teacher);
                                return (
                                  <tr
                                    key={sub._id || `${sub.name}-${idx}`}
                                    className="hover:bg-white/[0.03] transition-colors"
                                  >
                                    {/* Index */}
                                    <td className="py-3.5 px-3 sm:px-4 text-center font-medium text-slate-500">
                                      {idx + 1}
                                    </td>

                                    {/* Subject Name */}
                                    <td className="py-3.5 px-3 sm:px-4 font-medium text-white">
                                      <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                                          <HiOutlineBookOpen className="w-4 h-4" />
                                        </div>
                                        <span className="font-semibold text-slate-200">{sub.name}</span>
                                      </div>
                                    </td>

                                    {/* Class Level */}
                                    <td className="py-3.5 px-3 sm:px-4 text-slate-300">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        {lvl}
                                      </span>
                                    </td>

                                    {/* Assigned Teacher */}
                                    <td className="py-3.5 px-3 sm:px-4 text-slate-300 whitespace-nowrap">
                                      {teacherName === "empty" || teacherName === "-" ? (
                                        <span className="text-slate-400 italic font-medium text-xs">
                                          empty
                                        </span>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-[10px] font-bold text-indigo-200">
                                            {teacherName.charAt(0).toUpperCase()}
                                          </div>
                                          <span className="text-slate-200 font-medium text-xs">
                                            {teacherName}
                                          </span>
                                        </div>
                                      )}
                                    </td>

                                    {/* Duration */}
                                    <td className="py-3.5 px-3 sm:px-4 text-slate-400 text-xs whitespace-nowrap">
                                      <div className="flex items-center gap-1.5">
                                        <HiOutlineClock className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{sub.duration || "3 months"}</span>
                                      </div>
                                    </td>

                                    {/* Subject Type */}
                                    <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                                      {isCore ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                          CORE
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30">
                                          Elective
                                        </span>
                                      )}
                                    </td>

                                    {/* Status */}
                                    <td className="py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                                        Attended
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
