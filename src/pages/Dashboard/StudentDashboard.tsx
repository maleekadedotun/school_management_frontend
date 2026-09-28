import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchStudentProfile,
  updateStudentProfile,
  writeStudentExam,
  resetExamSubmitState,
  type Student,
} from "../../features/students/studentsSlice";
import { fetchExams } from "../../features/exams/examsSlice";
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineClipboardDocumentCheck,
  HiOutlineTrophy,
  HiOutlineSparkles,
  HiOutlineUserCircle,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowRight,
  HiOutlineArrowPath,
  HiOutlinePencilSquare,
  HiOutlineKey,
  HiOutlineEnvelope,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineUser,
  HiOutlineCheckBadge,
  HiOutlineFire,
  HiOutlineArrowTrendingUp,
} from "react-icons/hi2";

export default function StudentDashboard() {
  const dispatch = useAppDispatch();
  const {
    student,
    profile,
    currentExamResult,
    studentExamResults,
    profileLoading,
    profileUpdating,
    profileUpdateSuccess,
    profileUpdateError,
    examSubmitting,
    examSubmitSuccess,
    examSubmitError,
  } = useAppSelector((state) => state.students);

  const { items: exams, loading: examsLoading } = useAppSelector(
    (state) => state.exams
  );

  // Active student data merged from profile and stored student
  const activeStudent: Student = {
    ...(student || {}),
    ...(profile || {}),
  } as Student;

  // Tabs: 'overview' | 'exams' | 'results' | 'profile'
  const [activeTab, setActiveTab] = useState<
    "overview" | "exams" | "results" | "profile"
  >("overview");

  // Exam Search & Filter
  const [examSearch, setExamSearch] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("all");

  // Result Search & Filter
  const [resultSearch, setResultSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");

  // Selected Exam for Taking
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [examAnswers, setExamAnswers] = useState<{ [qIndex: number]: string }>({});
  const [examTimer, setExamTimer] = useState<number>(1800); // 30 min default
  const [showExamConfirmModal, setShowExamConfirmModal] = useState(false);

  // Result Detail Modal
  const [selectedResultDetail, setSelectedResultDetail] = useState<any | null>(null);
  const [showReviewQuestions, setShowReviewQuestions] = useState(false);

  // Profile Update Form
  const [updateEmail, setUpdateEmail] = useState("");
  const [updatePassword, setUpdatePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    dispatch(fetchStudentProfile());
    dispatch(fetchExams());
  }, [dispatch]);

  // Sync updateEmail initial value
  useEffect(() => {
    if (activeStudent?.email) {
      setUpdateEmail(activeStudent.email);
    }
  }, [activeStudent?.email]);

  // Exam Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (selectedExam && examTimer > 0) {
      interval = setInterval(() => {
        setExamTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedExam, examTimer]);

  // Dynamic Greeting based on current hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", icon: "☀️" };
    if (hour < 18) return { text: "Good Afternoon", icon: "🌤️" };
    return { text: "Good Evening", icon: "🌙" };
  }, []);

  // Level Progression Logic
  const levelOrder = ["Level 100", "Level 200", "Level 300", "Level 400"];
  const currentLevelStr = (activeStudent?.currentClassLevel || "Level 100").trim();
  const currentLevelIndex = useMemo(() => {
    const idx = levelOrder.findIndex(
      (lvl) => lvl.toLowerCase() === currentLevelStr.toLowerCase()
    );
    return idx !== -1 ? idx : 0;
  }, [currentLevelStr]);

  // Academic standing & gpa estimation
  const totalResults = studentExamResults?.length || 0;
  const passedResults = studentExamResults?.filter((r) => r.status === "Passed")
    ?.length || 0;
  const averageGrade = useMemo(() => {
    if (!studentExamResults || studentExamResults.length === 0) return 0;
    const sum = studentExamResults.reduce((acc, r) => acc + (Number(r.grade) || 0), 0);
    return Math.round(sum / studentExamResults.length);
  }, [studentExamResults]);

  // Check if student has already taken an exam
  const hasTakenExam = (examId: string) => {
    if (!studentExamResults) return false;
    return studentExamResults.some((res) => {
      const eId = res.exam?._id || res.exam;
      return eId?.toString() === examId?.toString();
    });
  };

  // Filter available exams
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const matchSearch =
        e.name?.toLowerCase().includes(examSearch.toLowerCase()) ||
        e.description?.toLowerCase().includes(examSearch.toLowerCase()) ||
        e.subject?.name?.toLowerCase().includes(examSearch.toLowerCase()) ||
        (typeof e.subject === "string" &&
          e.subject.toLowerCase().includes(examSearch.toLowerCase()));
      const matchType =
        examTypeFilter === "all" ||
        e.examType?.toLowerCase() === examTypeFilter.toLowerCase();
      return matchSearch && matchType;
    });
  }, [exams, examSearch, examTypeFilter]);

  // Filter exam results
  const filteredResults = useMemo(() => {
    return studentExamResults.filter((r) => {
      const examName = r.exam?.name || "Exam";
      const subjectName = r.exam?.subject?.name || "";
      const matchSearch =
        examName.toLowerCase().includes(resultSearch.toLowerCase()) ||
        subjectName.toLowerCase().includes(resultSearch.toLowerCase());
      const matchStatus =
        resultFilter === "all" ||
        r.status?.toLowerCase() === resultFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [studentExamResults, resultSearch, resultFilter]);

  // Handle Exam Launch
  const handleStartExam = (exam: any) => {
    if (activeStudent?.isSuspended || activeStudent?.isWithDrawn) {
      alert("Your account is currently suspended or withdrawn. You cannot take exams.");
      return;
    }
    if (hasTakenExam(exam._id)) {
      alert("You have already written this exam.");
      return;
    }
    if (!exam.questions || exam.questions.length === 0) {
      alert("This exam does not have any questions prepared yet. Please contact your instructor.");
      return;
    }
    setSelectedExam(exam);
    setExamAnswers({});
    const minutes = parseInt(exam.duration) || 30;
    setExamTimer(minutes * 60);
    dispatch(resetExamSubmitState());
  };

  // Handle Answer Selection
  const handleSelectAnswer = (qIndex: number, answerVal: string) => {
    setExamAnswers((prev) => ({
      ...prev,
      [qIndex]: answerVal,
    }));
  };

  // Handle Submit Exam
  const handleSubmitExam = async () => {
    if (!selectedExam) return;
    const questionsCount = selectedExam.questions?.length || 0;
    const answersArray: string[] = [];

    for (let i = 0; i < questionsCount; i++) {
      if (!examAnswers[i]) {
        alert(`Please answer question #${i + 1} before submitting.`);
        return;
      }
      answersArray.push(examAnswers[i]);
    }

    setShowExamConfirmModal(false);
    await dispatch(
      writeStudentExam({
        examId: selectedExam._id,
        answers: answersArray,
      })
    );
  };

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (updatePassword && updatePassword !== confirmPassword) {
      setFormFeedback("Passwords do not match.");
      return;
    }

    const payload: { email?: string; password?: string } = {};
    if (updateEmail && updateEmail !== activeStudent.email) {
      payload.email = updateEmail;
    }
    if (updatePassword) {
      payload.password = updatePassword;
    }

    if (Object.keys(payload).length === 0) {
      setFormFeedback("No changes were made.");
      return;
    }

    await dispatch(updateStudentProfile(payload));
    setUpdatePassword("");
    setConfirmPassword("");
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* 1. Suspension / Withdrawal Banner */}
      {activeStudent?.isSuspended && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md flex items-start gap-4 text-amber-200 shadow-lg">
          <HiOutlineExclamationTriangle className="w-7 h-7 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-base text-amber-300">
              Account Suspended
            </h4>
            <p className="text-sm text-amber-200/90 leading-relaxed">
              Your student account has been marked as suspended by school administration.
              You may review past records, but writing online exams or taking assessments is restricted.
              Please report to the Dean of Students or Administrator.
            </p>
          </div>
        </div>
      )}

      {activeStudent?.isWithDrawn && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 backdrop-blur-md flex items-start gap-4 text-rose-200 shadow-lg">
          <HiOutlineXCircle className="w-7 h-7 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-base text-rose-300">
              Withdrawn Student Status
            </h4>
            <p className="text-sm text-rose-200/90 leading-relaxed">
              This profile is marked as withdrawn. Access to new examinations and curriculum
              has been deactivated. Contact the registry for enrollment re-activation.
            </p>
          </div>
        </div>
      )}

      {activeStudent?.isGraduated && (
        <div className="rounded-2xl border border-yellow-500/40 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-emerald-500/20 p-6 backdrop-blur-md flex items-center justify-between gap-4 text-yellow-100 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-300 text-3xl shadow-lg">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-xl text-yellow-300">
                  Congratulations, Graduate!
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-400 text-slate-900">
                  Alumni Honors
                </span>
              </div>
              <p className="text-sm text-yellow-200/90 mt-1">
                You have successfully completed all degree requirements! Academic year
                graduated:{" "}
                <span className="font-bold text-white">
                  {activeStudent.yearGraduated
                    ? new Date(activeStudent.yearGraduated).getFullYear()
                    : new Date().getFullYear()}
                </span>
                .
              </p>
            </div>
          </div>
          <HiOutlineSparkles className="w-8 h-8 text-yellow-400 animate-pulse hidden sm:block" />
        </div>
      )}

      {/* 2. Hero Section - Attractive, Modern & Glassmorphic */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-500/20 p-6 md:p-10 shadow-2xl text-white">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left Avatar & Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 p-[3px] shadow-2xl shadow-indigo-500/40">
                <div className="w-full h-full rounded-[21px] bg-slate-900 flex items-center justify-center text-white font-extrabold text-3xl md:text-4xl">
                  {activeStudent?.name?.[0]?.toUpperCase() || "S"}
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-md ring-2 ring-emerald-400/50" />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
                  <HiOutlineAcademicCap className="w-4 h-4 text-indigo-400" />
                  Student Portal
                </span>

                {activeStudent?.prefectName && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    <HiOutlineTrophy className="w-3.5 h-3.5 text-amber-400" />
                    {activeStudent.prefectName}
                  </span>
                )}

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {activeStudent?.isSuspended
                    ? "Suspended"
                    : activeStudent?.isWithDrawn
                    ? "Withdrawn"
                    : "Good Standing"}
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
                {greeting.text}, {activeStudent?.name || "Student"}! {greeting.icon}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs md:text-sm text-indigo-200/80">
                <span className="flex items-center gap-1.5">
                  <HiOutlineShieldCheck className="w-4 h-4 text-indigo-400" />
                  ID:{" "}
                  <strong className="text-white font-semibold">
                    {activeStudent?.studentId ||
                      activeStudent?.StudentId ||
                      "STU-ACTIVE"}
                  </strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <HiOutlineBookOpen className="w-4 h-4 text-violet-400" />
                  Class:{" "}
                  <strong className="text-indigo-200 font-semibold">
                    {currentLevelStr}
                  </strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <HiOutlineEnvelope className="w-4 h-4 text-pink-400" />
                  {activeStudent?.email || "student@school.edu"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={() => setActiveTab("exams")}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <HiOutlineClipboardDocumentCheck className="w-5 h-5" />
              Take Online Exam
            </button>
            <button
              onClick={() => dispatch(fetchStudentProfile())}
              disabled={profileLoading}
              title="Refresh your student record"
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <HiOutlineArrowPath
                className={`w-5 h-5 ${profileLoading ? "animate-spin text-indigo-400" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Level Progression Roadmap Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <HiOutlineArrowTrendingUp className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Academic Promotion & Level Progression
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Passing your 3rd Term exams automatically unlocks promotion to the next class level.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 w-fit">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            Active: {currentLevelStr}
          </span>
        </div>

        {/* Milestone Steps Bar */}
        <div className="relative pt-4 pb-2">
          {/* Progress Connecting Line */}
          <div className="hidden md:block absolute top-1/2 left-8 right-8 h-1.5 bg-gray-200 dark:bg-slate-800 -translate-y-4 rounded-full z-0">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(10, ((currentLevelIndex + (activeStudent?.isGraduated ? 1 : 0.5)) / 4) * 100))}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
            {[
              { level: "Level 100", label: "Freshman", step: 0 },
              { level: "Level 200", label: "Sophomore", step: 1 },
              { level: "Level 300", label: "Junior", step: 2 },
              { level: "Level 400", label: "Senior", step: 3 },
              { level: "Graduation", label: "Degree Holder", step: 4 },
            ].map((stepItem) => {
              const isPast =
                activeStudent?.isGraduated ||
                currentLevelIndex > stepItem.step ||
                (stepItem.step === 4 && activeStudent?.isGraduated);
              const isCurrent =
                !activeStudent?.isGraduated && currentLevelIndex === stepItem.step;

              return (
                <div
                  key={stepItem.level}
                  className={`flex flex-col items-center text-center p-3.5 rounded-2xl transition-all duration-300 ${
                    isCurrent
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-500/60 shadow-lg shadow-indigo-500/10 scale-105"
                      : isPast
                      ? "bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800"
                      : "bg-transparent border border-dashed border-gray-200 dark:border-slate-800 opacity-60"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 shadow-md transition-all ${
                      isPast
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-500/30 animate-pulse"
                        : "bg-gray-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {isPast ? (
                      <HiOutlineCheck className="w-5 h-5 stroke-[3]" />
                    ) : stepItem.step === 4 ? (
                      "🎓"
                    ) : (
                      stepItem.step + 1
                    )}
                  </div>
                  <h4 className="font-bold text-xs md:text-sm text-gray-900 dark:text-white">
                    {stepItem.level}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {stepItem.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Quick Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Class Standing */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Current Level
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <HiOutlineAcademicCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {currentLevelStr}
            </h3>
            <p className="text-xs text-indigo-500 font-semibold mt-1 flex items-center gap-1">
              <HiOutlineCheckBadge className="w-4 h-4" />
              Active Academic Standing
            </p>
          </div>
        </div>

        {/* Stat 2: Latest Performance */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Latest Grade
            </span>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <HiOutlineTrophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {currentExamResult?.grade !== undefined
                  ? `${currentExamResult.grade}%`
                  : "N/A"}
              </h3>
              {currentExamResult?.remarks && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                  {currentExamResult.remarks}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {currentExamResult?.exam?.name || "No exam record yet"}
            </p>
          </div>
        </div>

        {/* Stat 3: Exams Completed */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Exams Completed
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <HiOutlineClipboardDocumentCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {totalResults}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {passedResults} Passed ({totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0}% success) • Avg: {averageGrade}%
            </p>
          </div>
        </div>

        {/* Stat 4: Assigned Instructor */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assigned Teacher
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <HiOutlineUser className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {typeof activeStudent?.assignedTeacher === "object"
                ? activeStudent.assignedTeacher?.name
                : "Department Faculty"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
              {activeStudent?.subject || "Core Curriculum Subject"}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 space-x-2 md:space-x-4 overflow-x-auto">
        {[
          { key: "overview", label: "Dashboard Overview", icon: HiOutlineChartBar },
          {
            key: "exams",
            label: "Take Exams",
            icon: HiOutlineClipboardDocumentCheck,
            badge: filteredExams.length,
          },
          {
            key: "results",
            label: "Exam Results Archive",
            icon: HiOutlineDocumentText,
            badge: totalResults,
          },
          { key: "profile", label: "Academic Info & Security", icon: HiOutlineUserCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 pb-3.5 px-3 md:px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-gray-900 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "bg-gray-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 6. TAB CONTENTS */}

      {/* === TAB 1: OVERVIEW === */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols) - Latest Published Result & Action Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Latest Exam Spotlight */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <HiOutlineTrophy className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    Latest Published Assessment
                  </h3>
                </div>
                {currentExamResult && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      currentExamResult.status === "Passed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                    }`}
                  >
                    {currentExamResult.status}
                  </span>
                )}
              </div>

              {currentExamResult ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-indigo-50/60 to-violet-50/60 dark:from-slate-800/40 dark:to-indigo-950/30 border border-indigo-100 dark:border-slate-800">
                    <div className="space-y-2 text-center sm:text-left">
                      <span className="text-xs font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
                        {currentExamResult.exam?.examType || "Official Test"}
                      </span>
                      <h4 className="text-xl font-extrabold text-gray-900 dark:text-white">
                        {currentExamResult.exam?.name || "Examination Result"}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Term:{" "}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {currentExamResult.academicTerm?.name || "Term Evaluation"}
                        </strong>{" "}
                        • Level:{" "}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {currentExamResult.classLevel?.name || currentLevelStr}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Big Grade Badge */}
                      <div className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 shadow-md">
                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                          {currentExamResult.grade}%
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Score: {currentExamResult.score}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remarks & Performance Note */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Instructor Remarks
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                        🌟 {currentExamResult.remarks || "Good Effort"}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Pass Benchmark
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                        {currentExamResult.passMark || 50}% Minimum Required
                      </p>
                    </div>
                  </div>

                  {/* Review Answered Questions Accordion Trigger */}
                  {currentExamResult.answeredQuestions &&
                    currentExamResult.answeredQuestions.length > 0 && (
                      <div className="pt-2">
                        <button
                          onClick={() => setShowReviewQuestions(!showReviewQuestions)}
                          className="w-full py-3 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {showReviewQuestions ? (
                            <>
                              <HiOutlineChevronUp className="w-4 h-4" />
                              Hide Question Breakdown
                            </>
                          ) : (
                            <>
                              <HiOutlineChevronDown className="w-4 h-4" />
                              Review Answered Questions ({currentExamResult.answeredQuestions.length})
                            </>
                          )}
                        </button>

                        {showReviewQuestions && (
                          <div className="mt-4 space-y-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                            {currentExamResult.answeredQuestions.map(
                              (q: any, i: number) => (
                                <div
                                  key={i}
                                  className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                                    q.isCorrect
                                      ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                                      : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-bold text-gray-900 dark:text-white">
                                      Q{i + 1}. {q.question}
                                    </span>
                                    {q.isCorrect ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-1 shrink-0">
                                        <HiOutlineCheck className="w-3 h-3" /> Correct
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 flex items-center gap-1 shrink-0">
                                        <HiOutlineXMark className="w-3 h-3" /> Incorrect
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                    Correct Answer:{" "}
                                    <strong className="text-emerald-600 dark:text-emerald-400">
                                      {q.correctAnswer}
                                    </strong>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-400 flex items-center justify-center text-3xl mx-auto">
                    📝
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">
                    No Published Exam Results Yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    When your teacher compiles and publishes test scores, your detailed performance breakdown will appear here.
                  </p>
                  <button
                    onClick={() => setActiveTab("exams")}
                    className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    View Available Tests <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Available Exams Highlight */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
                    <HiOutlineFire className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    Available Online Assessments
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab("exams")}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  View All ({exams.length})
                </button>
              </div>

              {examsLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Loading active exams...
                </div>
              ) : exams.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                  No online exams are scheduled at the moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {exams.slice(0, 3).map((exam) => {
                    const taken = hasTakenExam(exam._id);
                    return (
                      <div
                        key={exam._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                              {exam.examType || "Quiz"}
                            </span>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                              {exam.name}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Subject: {exam.subject?.name || typeof exam.subject === "string" ? exam.subject?.name || exam.subject : "General"} • Duration: {exam.duration || "30m"}
                          </p>
                        </div>

                        <div>
                          {taken ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                              <HiOutlineCheckCircle className="w-4 h-4" />
                              Completed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleStartExam(exam)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <HiOutlinePencilSquare className="w-4 h-4" />
                              Take Exam
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1 Col) - Student Identity & Academic Advisor */}
          <div className="space-y-6">
            {/* Student ID & Curriculum Card */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <HiOutlineAcademicCap className="w-5 h-5 text-indigo-500" />
                Academic Profile Details
              </h3>

              <div className="space-y-3.5 divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500 dark:text-slate-400">Student ID</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {activeStudent?.studentId || activeStudent?.StudentId || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-slate-500 dark:text-slate-400">Class Level</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {currentLevelStr}
                  </span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-slate-500 dark:text-slate-400">Program</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {typeof activeStudent?.program === "object"
                      ? (activeStudent?.program as any)?.name
                      : activeStudent?.program || "General Studies"}
                  </span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-slate-500 dark:text-slate-400">Enrolled Subject</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {activeStudent?.subject || "Core Sciences & Arts"}
                  </span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-slate-500 dark:text-slate-400">Date Admitted</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {activeStudent?.dateAdmitted
                      ? new Date(activeStudent.dateAdmitted).toLocaleDateString()
                      : "Registered Student"}
                  </span>
                </div>
                {activeStudent?.prefectName && (
                  <div className="flex justify-between pt-3">
                    <span className="text-slate-500 dark:text-slate-400">Honorary Post</span>
                    <span className="font-bold text-amber-500">
                      {activeStudent.prefectName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Teacher Card */}
            <div className="rounded-3xl bg-gradient-to-br from-indigo-900/10 via-violet-900/10 to-slate-900/20 border border-indigo-200/50 dark:border-indigo-900/40 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <HiOutlineUser className="w-5 h-5 text-violet-500" />
                Assigned Instructor
              </h3>

              {activeStudent?.assignedTeacher &&
              typeof activeStudent.assignedTeacher === "object" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-violet-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                      {activeStudent.assignedTeacher.name?.[0]?.toUpperCase() || "T"}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                        {activeStudent.assignedTeacher.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {activeStudent.assignedTeacher.email || "Faculty Instructor"}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="text-slate-500 dark:text-slate-400">
                      Subject Specialization:
                    </div>
                    <div className="font-bold text-indigo-700 dark:text-indigo-300">
                      {activeStudent.assignedTeacher.subject || activeStudent.subject || "Faculty Course"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 py-2">
                  Assigned by Department Administration. Contact the school registrar for advisory changes.
                </div>
              )}
            </div>

            {/* Account Credentials Quick Link */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <HiOutlineKey className="w-4 h-4 text-indigo-500" />
                Security & Portal Credentials
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can securely update your login email and portal password directly from your account settings.
              </p>
              <button
                onClick={() => setActiveTab("profile")}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Manage Credentials <HiOutlineArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === TAB 2: TAKE EXAMS === */}
      {activeTab === "exams" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                placeholder="Search exams by subject or title..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <HiOutlineBookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Type:
              </span>
              <select
                value={examTypeFilter}
                onChange={(e) => setExamTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="quiz">Quiz</option>
                <option value="midterm">MidTerm</option>
                <option value="final">Final</option>
              </select>
            </div>
          </div>

          {/* Exams Grid */}
          {examsLoading ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Loading available exams...
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-400 flex items-center justify-center text-3xl mx-auto">
                📚
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-base">
                No Exams Match Your Search
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try searching for a different keyword or reset filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam) => {
                const taken = hasTakenExam(exam._id);
                const qCount = exam.questions?.length || 0;

                return (
                  <div
                    key={exam._id}
                    className={`rounded-3xl bg-white dark:bg-slate-900 border p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${
                      taken
                        ? "border-emerald-500/30 opacity-90"
                        : "border-gray-200/80 dark:border-slate-800 hover:border-indigo-400"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {exam.examType || "Quiz"}
                        </span>
                        {taken && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <HiOutlineCheckCircle className="w-4 h-4" /> Completed
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                        {exam.name}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {exam.description || "Comprehensive test of syllabus topics."}
                      </p>

                      <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex justify-between">
                          <span>Subject:</span>
                          <strong className="text-gray-900 dark:text-white">
                            {exam.subject?.name || (typeof exam.subject === "string" ? exam.subject : "Academic Subject")}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Questions:</span>
                          <strong className="text-gray-900 dark:text-white">
                            {qCount} Questions
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <strong className="text-gray-900 dark:text-white">
                            {exam.duration || "30 Minutes"}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Pass Benchmark:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            {exam.passMark || 50}%
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 mt-4">
                      {taken ? (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-400 font-semibold text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <HiOutlineCheck className="w-4 h-4" /> Exam Submitted
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartExam(exam)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" /> Start Examination
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === TAB 3: EXAM RESULTS ARCHIVE === */}
      {activeTab === "results" && (
        <div className="space-y-6">
          {/* Results Filter */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={resultSearch}
                onChange={(e) => setResultSearch(e.target.value)}
                placeholder="Search results by exam or subject..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <HiOutlineDocumentText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Status:
              </span>
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-400 flex items-center justify-center text-3xl mx-auto">
                📊
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-base">
                No Results Found
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No past examination records match your filter criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result, idx) => {
                const examObj = result.exam || {};
                const isPassed = result.status === "Passed";

                return (
                  <div
                    key={result._id || idx}
                    className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Grade Pill */}
                      <div
                        className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border font-black shadow-sm ${
                          isPassed
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                        }`}
                      >
                        <span className="text-xl">{result.grade}%</span>
                        <span className="text-[9px] font-bold uppercase">
                          {isPassed ? "Pass" : "Fail"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-base text-gray-900 dark:text-white">
                            {examObj.name || `Exam #${idx + 1}`}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {examObj.examType || "Assessment"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Subject:{" "}
                          <strong className="text-slate-700 dark:text-slate-300">
                            {examObj.subject?.name || "Academic Course"}
                          </strong>{" "}
                          • Score:{" "}
                          <strong className="text-slate-700 dark:text-slate-300">
                            {result.score} pts
                          </strong>{" "}
                          • Remarks:{" "}
                          <strong className="text-indigo-600 dark:text-indigo-400">
                            {result.remarks}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedResultDetail(result)}
                        className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <HiOutlineDocumentText className="w-4 h-4" />
                        View Breakdown
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === TAB 4: PROFILE & SECURITY === */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Academic Records Overview */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <HiOutlineAcademicCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  Student Official Record
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Institutional record registered in the school database
                </p>
              </div>
            </div>

            <div className="space-y-4 divide-y divide-gray-100 dark:divide-slate-800 text-xs">
              <div className="flex justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400">Full Name:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {activeStudent?.name}
                </span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-slate-500 dark:text-slate-400">Matriculation ID:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {activeStudent?.studentId || activeStudent?.StudentId}
                </span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-slate-500 dark:text-slate-400">Current Level:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {currentLevelStr}
                </span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-slate-500 dark:text-slate-400">Academic Program:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {typeof activeStudent?.program === "object"
                    ? (activeStudent?.program as any)?.name
                    : activeStudent?.program || "General Education"}
                </span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-slate-500 dark:text-slate-400">Enrolled Subject:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {activeStudent?.subject || "Core Syllabus"}
                </span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-slate-500 dark:text-slate-400">Enrollment Date:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {activeStudent?.dateAdmitted
                    ? new Date(activeStudent.dateAdmitted).toLocaleDateString()
                    : "Active Record"}
                </span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-slate-500 dark:text-slate-400">Account Standing:</span>
                <span
                  className={`font-bold ${
                    activeStudent?.isSuspended
                      ? "text-amber-500"
                      : activeStudent?.isWithDrawn
                      ? "text-rose-500"
                      : "text-emerald-500"
                  }`}
                >
                  {activeStudent?.isSuspended
                    ? "Suspended"
                    : activeStudent?.isWithDrawn
                    ? "Withdrawn"
                    : "Good Standing"}
                </span>
              </div>
            </div>
          </div>

          {/* Update Credentials Card (updateStudentCtrl) */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                <HiOutlineKey className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  Update Account Credentials
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Powered by updateStudentCtrl API in your student controller
                </p>
              </div>
            </div>

            {profileUpdateSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <HiOutlineCheckCircle className="w-4 h-4 shrink-0" />
                Your credentials have been updated successfully!
              </div>
            )}

            {(profileUpdateError || formFeedback) && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <HiOutlineExclamationTriangle className="w-4 h-4 shrink-0" />
                {profileUpdateError || formFeedback}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={updateEmail}
                    onChange={(e) => setUpdateEmail(e.target.value)}
                    placeholder="student@school.edu"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <HiOutlineEnvelope className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password (leave empty to keep current)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={updatePassword}
                    onChange={(e) => setUpdatePassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <HiOutlineLockClosed className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? (
                      <HiOutlineEyeSlash className="w-4 h-4" />
                    ) : (
                      <HiOutlineEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {updatePassword && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                    <HiOutlineLockClosed className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={profileUpdating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {profileUpdating ? (
                  <>
                    <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                    Updating Credentials...
                  </>
                ) : (
                  <>
                    <HiOutlineCheck className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. INTERACTIVE ONLINE EXAM RUNNER MODAL */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-2xl p-6 md:p-8 text-white space-y-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                    {selectedExam.examType || "Assessment"}
                  </span>
                  <span className="text-xs text-slate-400">
                    Duration: {selectedExam.duration || "30m"}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white mt-1">
                  {selectedExam.name}
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedExam.subject?.name || "Core Subject"} • Pass Benchmark:{" "}
                  {selectedExam.passMark || 50}%
                </p>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono font-bold">
                <HiOutlineClock className="w-4 h-4 animate-pulse text-red-400" />
                <span>{formatTime(examTimer)}</span>
              </div>
            </div>

            {/* Questions Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {examSubmitError && (
                <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-medium">
                  {examSubmitError}
                </div>
              )}

              {examSubmitSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-4xl mx-auto shadow-xl">
                    🎉
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">
                    Exam Submitted Successfully!
                  </h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto">
                    Your answers were submitted directly through your student controller. Your scores and level advancement have been updated live!
                  </p>
                  <button
                    onClick={() => {
                      setSelectedExam(null);
                      dispatch(resetExamSubmitState());
                      setActiveTab("results");
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                  >
                    View My Result Report
                  </button>
                </div>
              ) : (
                <>
                  {selectedExam.questions?.map((q: any, qIdx: number) => {
                    const selectedAns = examAnswers[qIdx];
                    const options = [
                      { key: "A", val: q.optionA },
                      { key: "B", val: q.optionB },
                      { key: "C", val: q.optionC },
                      { key: "D", val: q.optionD },
                    ].filter((opt) => opt.val);

                    return (
                      <div
                        key={q._id || qIdx}
                        className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/30">
                            {qIdx + 1}
                          </span>
                          <h4 className="font-semibold text-sm text-white pt-0.5">
                            {q.question}
                          </h4>
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                          {options.map((opt) => {
                            const isChosen = selectedAns === opt.val;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => handleSelectAnswer(qIdx, opt.val)}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                                  isChosen
                                    ? "bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-500/20"
                                    : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-700/40"
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isChosen
                                      ? "bg-indigo-500 text-white"
                                      : "bg-slate-700 text-slate-400"
                                  }`}
                                >
                                  {opt.key}
                                </span>
                                <span className="flex-1 font-medium">{opt.val}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!examSubmitSuccess && (
              <div className="flex items-center justify-between border-t border-slate-800 pt-4 gap-4">
                <div className="text-xs text-slate-400">
                  Answered:{" "}
                  <strong className="text-indigo-400">
                    {Object.keys(examAnswers).length}
                  </strong>{" "}
                  of {selectedExam.questions?.length || 0}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to exit? Your answered inputs will not be saved."
                        )
                      ) {
                        setSelectedExam(null);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={examSubmitting}
                    onClick={() => setShowExamConfirmModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    {examSubmitting ? (
                      <>
                        <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <HiOutlineCheck className="w-4 h-4" />
                        Submit Final Answers
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog before Final Submission */}
      {showExamConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 text-white space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-white">
              Ready to submit your exam?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Once submitted, your responses are graded immediately by the system.
              Make sure you have carefully reviewed your answers before confirming.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowExamConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Review Answers
              </button>
              <button
                onClick={handleSubmitExam}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-md hover:from-emerald-400 hover:to-teal-500 cursor-pointer"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. SINGLE RESULT BREAKDOWN MODAL */}
      {selectedResultDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 text-white space-y-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  {selectedResultDetail.status}
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  {selectedResultDetail.exam?.name || "Exam Breakdown"}
                </h3>
                <p className="text-xs text-slate-400">
                  Grade: {selectedResultDetail.grade}% • Remarks:{" "}
                  {selectedResultDetail.remarks}
                </p>
              </div>
              <button
                onClick={() => setSelectedResultDetail(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {selectedResultDetail.answeredQuestions &&
              selectedResultDetail.answeredQuestions.length > 0 ? (
                selectedResultDetail.answeredQuestions.map(
                  (q: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                        q.isCorrect
                          ? "bg-emerald-950/20 border-emerald-800/60 text-emerald-200"
                          : "bg-rose-950/20 border-rose-800/60 text-rose-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-white">
                          Q{idx + 1}. {q.question}
                        </span>
                        {q.isCorrect ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 flex items-center gap-1 shrink-0">
                            <HiOutlineCheck className="w-3 h-3" /> Correct
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 flex items-center gap-1 shrink-0">
                            <HiOutlineXMark className="w-3 h-3" /> Incorrect
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Official Answer:{" "}
                        <strong className="text-emerald-400">
                          {q.correctAnswer}
                        </strong>
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No individual question breakdown logged for this assessment.
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedResultDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}