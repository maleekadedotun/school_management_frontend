import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchStudentProfile,
  fetchStudentEnrolledSubjects,
  updateStudentProfile,
} from "../../features/students/studentsSlice";

const StudentProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const studentState = useAppSelector((state) => state.students);
  const { profile, student, currentStudent, allEnrolledSubjects, enrolledSubjectsByClass } = studentState;

  const currentStudentObj = profile || student || currentStudent;

  const [activeTab, setActiveTab] = useState<"overview" | "academic" | "exams" | "settings">("overview");
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

  // Exam Performance Data
  const examResults: any[] = currentStudentObj?.examsResults || [];
  const pendingTeacherCount = (currentStudentObj as any)?.pendingTeacherReviewCount || 0;
  const pendingAdminCount = (currentStudentObj as any)?.pendingAdminReviewCount || 0;
  const hasPendingReview = pendingTeacherCount > 0 || pendingAdminCount > 0;
  const totalExams = examResults.length;
  const passedExams = examResults.filter((r) => r?.status === "Pass" || (r?.score && r?.score >= 50)).length;
  const averageScore = totalExams > 0
    ? Math.round(examResults.reduce((acc, r) => acc + (Number(r?.score) || 0), 0) / totalExams)
    : 84;

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
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
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
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
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
                <span>🆔 ID:</span>
                <span className="font-mono text-indigo-300 font-bold">{studentId}</span>
                <span className="text-[10px] text-slate-400">
                  {copiedId ? "✓ Copied" : "Copy"}
                </span>
              </button>

              <span className="flex items-center gap-1.5 text-slate-400">
                <span>✉️</span>
                <span>{studentEmail}</span>
              </span>

              <span className="flex items-center gap-1.5 text-slate-400">
                <span>📅</span>
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
          <p className="text-[11px] text-slate-400">Across 100L – 400L class tiers</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg space-y-1">
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            Exams Taken
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white flex items-baseline gap-2">
            <span>{totalExams}</span>
            <span className="text-xs text-emerald-400 font-normal">{passedExams} Passed</span>
          </div>
          <p className="text-[11px] text-slate-400">Official graded evaluations</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg space-y-1">
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            Average Score
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-300 flex items-baseline gap-2">
            <span>{averageScore}%</span>
            <span className="text-xs text-slate-300 font-normal">Grade A</span>
          </div>
          <p className="text-[11px] text-slate-400">Cumulative academic marks</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg space-y-1">
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            Academic Status
          </span>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
            <span>✓ Good Standing</span>
          </div>
          <p className="text-[11px] text-slate-400">Eligible for examinations & promotion</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "overview"
              ? "text-indigo-400 border-indigo-500 font-bold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          👤 Profile Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("academic")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "academic"
              ? "text-indigo-400 border-indigo-500 font-bold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          🎓 Academic Record & Degree
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("exams")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "exams"
              ? "text-indigo-400 border-indigo-500 font-bold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          📝 Examination Results ({totalExams})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "settings"
              ? "text-indigo-400 border-indigo-500 font-bold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          ⚙️ Account & Credentials
        </button>
      </div>

      {/* Tab Content 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information Card */}
          <div className="lg:col-span-2 rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📋</span> Student Information & Credentials
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
                <span className="text-slate-300">Degree Progression (100L $\rightarrow$ 400L)</span>
                <span className="text-indigo-400 font-bold">85% Completed</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 w-[85%] transition-all duration-500" />
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1 text-[11px] text-center text-slate-400">
                <span className="text-emerald-400 font-medium">✓ 100L Done</span>
                <span className="text-emerald-400 font-medium">✓ 200L Done</span>
                <span className="text-emerald-400 font-medium">✓ 300L Done</span>
                <span className="text-indigo-300 font-bold">Current (400L)</span>
              </div>
            </div>
          </div>

          {/* Quick Advising & Contact */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🛡️</span> Academic Standing
              </h3>
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <div className="font-bold">Active & Good Academic Standing</div>
                <div className="text-[11px] text-emerald-400/80">
                  You are fully certified to enroll in subjects, take all scheduled midterm and final examinations, and access university research facilities.
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Exam Clearance Status: Approved</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Course Enrollment: Completed</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Library & Computing Lab Access: Granted</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>👨‍🏫</span> Faculty Mentor
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
                  <span>🎓</span> Degree Program & Curriculum Roadmap
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Official matriculation curriculum track</p>
              </div>
              <Link
                to="/student/program"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 w-fit"
              >
                <span>Full Program Page</span>
                <span>→</span>
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
                <span className="text-xs text-emerald-400">✓ Fully Accredited</span>
              </div>
            </div>

            {/* Class Levels Breakdown */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📚</span> Enrolled Academic Class Tiers & Course Load
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
                        className="inline-block text-xs font-semibold text-indigo-400 hover:text-indigo-300 pt-1"
                      >
                        Explore Level →
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
                <span>📝</span> Examination Transcripts & Score Reports
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
              <span>→</span>
            </Link>
          </div>

          {/* Two-Tier Publication Architecture Notice */}
          <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-indigo-950/40 p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold text-sm shrink-0 border border-violet-500/30">
                ⚖️
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

          {examResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Exam / Course</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Class Level</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {examResults.map((result: any, idx: number) => {
                    const examName = result?.exam?.name || result?.examName || `Examination #${idx + 1}`;
                    const subjectName = result?.exam?.subject?.name || result?.subject?.name || result?.subject || "General Subject";
                    const classLevel = result?.classLevel?.name || result?.classLevel || currentLevel;
                    const score = Number(result?.score) || 0;
                    const grade = result?.grade || (score >= 70 ? "A" : score >= 60 ? "B" : score >= 50 ? "C" : "D");
                    const status = result?.status || (score >= 50 ? "Pass" : "Fail");

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
                            status === "Pass" ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            <span>{status === "Pass" ? "✓" : "✗"}</span>
                            <span>{status}</span>
                          </span>
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
              <span className="text-4xl block">📝</span>
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
                <span>🔒</span> Security & Account Credentials
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Update your login email address and secure password
              </p>
            </div>

            {updateSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <span>✓</span>
                <span>{updateSuccess}</span>
              </div>
            )}

            {updateError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
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
              <span>🛡️</span> Security Protocols
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
    </div>
  );
};

export default StudentProfile;
