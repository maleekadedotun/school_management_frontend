import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchParentDashboard,
  linkStudentToParent,
  clearParentErrors,
  type DashboardChildSummary,
} from "../../features/parentAuth/parentAuthSlice";
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineClipboardDocumentCheck,
  HiOutlineTrophy,
  HiOutlineSparkles,
  HiOutlineUserCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowRight,
  HiOutlineArrowPath,
  HiOutlineEnvelope,
  HiOutlineShieldCheck,
  HiOutlineCheck,
  HiOutlineUser,
  HiOutlineCheckBadge,
  HiOutlineArrowTrendingUp,
  HiOutlineCurrencyDollar,
  HiOutlineCalendarDays,
  HiOutlineEye,
  HiOutlineLink,
  HiOutlinePhone,
  HiOutlineInformationCircle,
  HiOutlineMegaphone,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from "react-icons/hi2";
import toast from "react-hot-toast";

export interface ParentDashboardProps {
  initialTab?: "overview" | "assignments" | "exams" | "attendance" | "teachers" | "results";
}

export default function ParentDashboard({ initialTab }: ParentDashboardProps = {}) {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get("tab");

  const {
    parent,
    dashboardData,
    dashboardLoading,
    linkLoading,
    linkError,
    linkSuccess,
  } = useAppSelector((state) => state.parentAuth);

  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [studentIdentifierInput, setStudentIdentifierInput] = useState("");

  const resolveTab = (t?: string | null): "overview" | "assignments" | "exams" | "attendance" | "teachers" => {
    if (t === "results" || t === "exams") return "exams";
    if (t && ["overview", "assignments", "exams", "attendance", "teachers"].includes(t)) {
      return t as any;
    }
    return "overview";
  };

  const [activeTab, setActiveTab] = useState<"overview" | "assignments" | "exams" | "attendance" | "teachers">(
    resolveTab(initialTab || queryTab)
  );

  // Sync activeTab when initialTab or URL query parameter changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(resolveTab(initialTab));
    } else if (queryTab) {
      setActiveTab(resolveTab(queryTab));
    }
  }, [initialTab, queryTab]);

  // Exam Search & Filter State
  const [examSearch, setExamSearch] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [selectedExamDetail, setSelectedExamDetail] = useState<any | null>(null);

  // Announcement Detail Modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);

  // Fetch parent dashboard data
  useEffect(() => {
    dispatch(fetchParentDashboard(selectedChildId));
  }, [dispatch, selectedChildId]);

  // Handle toast messages for linking
  useEffect(() => {
    if (linkSuccess) {
      toast.success("Student linked successfully to your parent profile!");
      setShowLinkModal(false);
      setStudentIdentifierInput("");
      dispatch(fetchParentDashboard(selectedChildId));
      dispatch(clearParentErrors());
    }
    if (linkError) {
      toast.error(linkError);
      dispatch(clearParentErrors());
    }
  }, [linkSuccess, linkError, dispatch, selectedChildId]);

  const activeChild = dashboardData?.activeChild;
  const childProfile = activeChild?.profile;
  const kpis = activeChild?.kpis;
  const milestones = activeChild?.milestones;
  const recentAssignments = activeChild?.recentAssignments || [];
  const recentExams = activeChild?.recentExams || [];
  const attendance = activeChild?.attendanceSummary;
  const childrenList: DashboardChildSummary[] = dashboardData?.children || [];
  const announcements = dashboardData?.announcements || (dashboardData?.activeChild as any)?.announcements || [];
  const publishedReportCards = dashboardData?.activeChild?.publishedReportCards || [];
  const latestReportCard = dashboardData?.activeChild?.latestReportCard || publishedReportCards[0] || null;

  // Filtered Exam results for search & status filter
  const filteredExams = useMemo(() => {
    return recentExams.filter((exam) => {
      const q = examSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        exam.examName.toLowerCase().includes(q) ||
        exam.subject.toLowerCase().includes(q) ||
        (exam.term && exam.term.toLowerCase().includes(q)) ||
        (exam.remarks && exam.remarks.toLowerCase().includes(q));
      const matchesFilter =
        examFilter === "all" ||
        (examFilter === "passed" && exam.status === "Passed") ||
        (examFilter === "failed" && exam.status === "Failed");
      return matchesSearch && matchesFilter;
    });
  }, [recentExams, examSearch, examFilter]);

  // Dynamic greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", icon: "☀️" };
    if (hour < 18) return { text: "Good Afternoon", icon: "🌤️" };
    return { text: "Good Evening", icon: "🌙" };
  }, []);

  // Level Progression Milestone definitions matching student view
  const levelOrder = ["Level 100", "Level 200", "Level 300", "Level 400"];
  const currentLevelStr = (childProfile?.currentClassLevel || "Level 100").trim();
  const currentLevelIndex = useMemo(() => {
    const idx = levelOrder.findIndex(
      (lvl) => lvl.toLowerCase() === currentLevelStr.toLowerCase()
    );
    return idx !== -1 ? idx : milestones?.stepIndex ?? 0;
  }, [currentLevelStr, milestones?.stepIndex]);

  // Handle Student Linking submit
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdentifierInput.trim()) {
      toast.error("Please provide a Student ID, Admission Number, or Student Email");
      return;
    }
    await dispatch(linkStudentToParent({ studentIdentifier: studentIdentifierInput.trim() }));
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* 1. Header Toolbar with Observer Banner & Multi-Child Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-2xl p-4 shadow-md text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <HiOutlineShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-indigo-300 uppercase">
                Parent Observer Portal
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Monitoring Active
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Real-time mirror of student coursework, grades, attendance, and milestone standing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Link Another Student Button */}
          <button
            onClick={() => setShowLinkModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold text-indigo-200 hover:text-white transition-all cursor-pointer"
          >
            <HiOutlineLink className="w-4 h-4 text-indigo-300" />
            Link Child
          </button>

          {/* Refresh Data */}
          <button
            onClick={() => dispatch(fetchParentDashboard(selectedChildId))}
            disabled={dashboardLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-200 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <HiOutlineArrowPath className={`w-4 h-4 ${dashboardLoading ? "animate-spin text-indigo-400" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Children Selector Pills */}
      {childrenList.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-3 sm:px-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <HiOutlineUser className="w-4 h-4 text-indigo-500" />
            <span>Select Student Profile:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {childrenList.map((c) => {
              const isSelected =
                selectedChildId === c._id ||
                (selectedChildId === "all" && activeChild?.profile?._id === c._id);
              return (
                <button
                  key={c._id}
                  onClick={() => setSelectedChildId(c._id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-500/40"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{c.name}</span>
                  <span className="text-[10px] opacity-75">
                    ({c.currentClassLevel || "Level 100"})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* If No Children Linked Yet */}
      {childrenList.length === 0 && !dashboardLoading && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-indigo-400/50 p-8 md:p-12 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center text-3xl mb-4 shadow-inner">
            <HiOutlineAcademicCap className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            No Student Linked to this Account Yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
            Link your child using their Student ID or admission email to monitor assignments, attendance, exam scores, and academic milestones in real-time.
          </p>
          <button
            onClick={() => setShowLinkModal(true)}
            className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <HiOutlineLink className="w-5 h-5" />
            Link Your Child Now
          </button>
        </div>
      )}

      {/* 3. Student Status Alert Banners (Suspension / Withdrawn / Graduation) */}
      {childProfile?.isSuspended && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md flex items-start gap-4 text-amber-200 shadow-lg">
          <HiOutlineExclamationTriangle className="w-7 h-7 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-base text-amber-300">
              Student Account Suspended
            </h4>
            <p className="text-sm text-amber-200/90 leading-relaxed">
              Your child's profile has been marked as suspended by school administration. Assessment submission and examination writing are restricted. Please consult the school registry.
            </p>
          </div>
        </div>
      )}

      {childProfile?.isWithDrawn && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 backdrop-blur-md flex items-start gap-4 text-rose-200 shadow-lg">
          <HiOutlineXCircle className="w-7 h-7 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-base text-rose-300">
              Withdrawn Student Status
            </h4>
            <p className="text-sm text-rose-200/90 leading-relaxed">
              This student profile is marked as withdrawn. Course access is inactive. Contact the administration desk for re-enrollment procedures.
            </p>
          </div>
        </div>
      )}

      {childProfile?.isGraduated && (
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
                {childProfile.name} has completed all academic degree requirements! Class of{" "}
                <strong className="text-white">
                  {childProfile.yearGraduated
                    ? new Date(childProfile.yearGraduated).getFullYear()
                    : new Date().getFullYear()}
                </strong>
                .
              </p>
            </div>
          </div>
          <HiOutlineSparkles className="w-8 h-8 text-yellow-400 animate-pulse hidden sm:block" />
        </div>
      )}

      {/* 4. Student Hero Section - Matches Student Portal Aesthetics */}
      {childProfile && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-500/20 p-6 md:p-10 shadow-2xl text-white">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative group">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 p-[3px] shadow-2xl shadow-indigo-500/40">
                  <div className="w-full h-full rounded-[21px] bg-slate-900 flex items-center justify-center text-white font-extrabold text-3xl md:text-4xl">
                    {childProfile?.name?.[0]?.toUpperCase() || "S"}
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-md ring-2 ring-emerald-400/50" />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
                    <HiOutlineAcademicCap className="w-4 h-4 text-indigo-400" />
                    Student View
                  </span>

                  {childProfile?.prefectName && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      <HiOutlineTrophy className="w-3.5 h-3.5 text-amber-400" />
                      {childProfile.prefectName}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {childProfile?.isSuspended
                      ? "Suspended"
                      : childProfile?.isWithDrawn
                      ? "Withdrawn"
                      : "Good Standing"}
                  </span>
                </div>

                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  {greeting.text}, {parent?.name || "Parent"}! {greeting.icon}
                </h1>
                <p className="text-sm text-indigo-200/90">
                  Currently monitoring student:{" "}
                  <strong className="text-white font-bold">{childProfile?.name}</strong>
                </p>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs md:text-sm text-indigo-200/80 pt-1">
                  <span className="flex items-center gap-1.5">
                    <HiOutlineShieldCheck className="w-4 h-4 text-indigo-400" />
                    ID:{" "}
                    <strong className="text-white font-semibold">
                      {childProfile?.StudentId || childProfile?.studentId || "STU-ACTIVE"}
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
                  {childProfile?.program?.name && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <HiOutlineSparkles className="w-4 h-4 text-pink-400" />
                        Program:{" "}
                        <strong className="text-indigo-200 font-semibold">
                          {childProfile.program.name}
                        </strong>
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <HiOutlineEnvelope className="w-4 h-4 text-pink-400" />
                    {childProfile?.email || "student@school.edu"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links on Hero */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <Link
                to="/parent/assignments"
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <HiOutlineClipboardDocumentCheck className="w-5 h-5" />
                View Assignments
              </Link>
              <Link
                to="/parent/invoices"
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <HiOutlineCurrencyDollar className="w-5 h-5 text-emerald-400" />
                Tuition & Fees
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 5. Level Progression Roadmap Card - Matches Student View */}
      {childProfile && (
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
                Direct view of student academic advancement through Level 100 to Degree Graduation.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 w-fit">
              <HiOutlineSparkles className="w-3.5 h-3.5" />
              Active: {currentLevelStr}
            </span>
          </div>

          {/* Milestone Steps Bar */}
          <div className="relative pt-4 pb-2">
            <div className="hidden md:block absolute top-1/2 left-8 right-8 h-1.5 bg-gray-200 dark:bg-slate-800 -translate-y-4 rounded-full z-0">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(10, ((currentLevelIndex + (childProfile?.isGraduated ? 1 : 0.5)) / 4) * 100)
                  )}%`,
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
                  childProfile?.isGraduated ||
                  currentLevelIndex > stepItem.step ||
                  (stepItem.step === 4 && childProfile?.isGraduated);
                const isCurrent =
                  !childProfile?.isGraduated && currentLevelIndex === stepItem.step;

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
      )}

      {/* 6. Quick Metric Stat Cards */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Stat 1: Class Standing */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Class Standing
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
                {childProfile?.program?.name || "Enrolled"}
              </p>
            </div>
          </div>

          {/* Stat 2: Exam Performance */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Exam Average
              </span>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                <HiOutlineTrophy className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {kpis.examAverage > 0 ? `${kpis.examAverage}%` : "N/A"}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                  {kpis.passedExams}/{kpis.totalExamsTaken} Passed
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {kpis.totalExamsTaken > 0
                  ? `${kpis.totalExamsTaken} examinations recorded`
                  : "No completed exams yet"}
              </p>
            </div>
          </div>

          {/* Stat 3: Coursework & Assignments */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Coursework
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <HiOutlineClipboardDocumentCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {kpis.assignmentsGraded + kpis.assignmentsSubmitted}/{kpis.assignmentsTotal}
                </h3>
                {kpis.assignmentsPending > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    {kpis.assignmentsPending} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {kpis.assignmentsGraded > 0
                  ? `Average score: ${kpis.assignmentAvg}%`
                  : "No graded coursework yet"}
              </p>
            </div>
          </div>

          {/* Stat 4: Attendance Rate */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Attendance Rate
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <HiOutlineCalendarDays className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {kpis.attendanceRate}%
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  {attendance?.presentCount || 0} Present
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {attendance?.totalSessions || 0} total classroom sessions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. Detailed Tabs: Overview / Coursework Assignments / Exam Results / Attendance / Teachers */}
      {childProfile && (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2 overflow-x-auto">
            {[
              { id: "overview", label: "Child Overview", icon: <HiOutlineEye className="w-4 h-4" /> },
              { id: "assignments", label: "Coursework Assignments", icon: <HiOutlineClipboardDocumentCheck className="w-4 h-4" /> },
              { id: "exams", label: "Exam Results", icon: <HiOutlineTrophy className="w-4 h-4" /> },
              { id: "attendance", label: "Attendance Log", icon: <HiOutlineCalendarDays className="w-4 h-4" /> },
              { id: "teachers", label: "Assigned Teachers", icon: <HiOutlineUserCircle className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Announcements, Assignments & Exams */}
              <div className="lg:col-span-2 space-y-6">
                {/* School Notices & Campus Broadcasts (Student & Parent Announcements) */}
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <HiOutlineMegaphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">
                          School Notices & Announcements
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Live campus bulletins broadcast to student and parent dashboards
                        </p>
                      </div>
                    </div>
                    {announcements.length > 0 && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        {announcements.length} Active Notice{announcements.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {announcements.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      <HiOutlineMegaphone className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                      No active announcements published for students and parents at this time.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {announcements.map((ann: any) => {
                        const isUrgent = ann.priority === "urgent";
                        const isHigh = ann.priority === "high";

                        return (
                          <div
                            key={ann._id}
                            className={`p-4 rounded-2xl border transition-all ${
                              isUrgent
                                ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/40"
                                : isHigh
                                ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/40"
                                : "bg-slate-50 dark:bg-slate-800/40 border-gray-200/70 dark:border-slate-800"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                                  {ann.title}
                                </h4>
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    isUrgent
                                      ? "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                                      : isHigh
                                      ? "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                                      : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                  }`}
                                >
                                  {ann.priority || "Normal"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                                <span className="flex items-center gap-1">
                                  <HiOutlineClock className="w-3.5 h-3.5" />
                                  {new Date(ann.createdAt).toLocaleDateString()}
                                </span>
                                {ann.category && (
                                  <span className="capitalize px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700/60 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                                    {ann.category}
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                              {ann.message}
                            </p>

                            <div className="mt-3 flex items-center justify-between border-t border-gray-200/60 dark:border-slate-800/80 pt-2.5">
                              <span className="text-[11px] text-slate-400">
                                Broadcast: <strong className="text-slate-600 dark:text-slate-300 capitalize">{ann.targetAudience === "student" ? "Students & Parents" : ann.targetAudience}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedAnnouncement(ann)}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                              >
                                Read Full Notice <HiOutlineArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Coursework Assignment Widget */}
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <HiOutlineClipboardDocumentCheck className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        Recent Coursework Assignments
                      </h3>
                    </div>
                    <Link
                      to="/parent/assignments"
                      className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                      View All <HiOutlineArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {recentAssignments.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      No active assignments published for this class level currently.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentAssignments.map((assign) => {
                        const isOverdue = assign.submissionStatus === "overdue";
                        const isGraded = assign.submissionStatus === "graded";
                        const isSubmitted = assign.submissionStatus === "submitted";

                        return (
                          <div
                            key={assign._id}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/40 transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                  {assign.title}
                                </h4>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                  {typeof assign.subject === "object" ? assign.subject?.name : assign.subject}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <HiOutlineClock className="w-3.5 h-3.5" />
                                  Due: {new Date(assign.dueDate).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span>Max Marks: {assign.totalMarks || 100}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isGraded ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  <HiOutlineCheckBadge className="w-3.5 h-3.5" />
                                  Graded: {assign.submission?.score}/{assign.totalMarks || 100}
                                </span>
                              ) : isSubmitted ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                                  <HiOutlineCheck className="w-3.5 h-3.5" />
                                  Submitted by Child
                                </span>
                              ) : isOverdue ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                  <HiOutlineExclamationTriangle className="w-3.5 h-3.5" />
                                  Overdue
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  <HiOutlineClock className="w-3.5 h-3.5" />
                                  Pending Submission
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Exams Results Widget */}
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <HiOutlineTrophy className="w-5 h-5 text-violet-500" />
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        Recent Official Examination Records
                      </h3>
                    </div>
                  </div>

                  {recentExams.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      No published examination results yet for this student.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentExams.map((exam) => {
                        const passed = exam.status === "Passed";
                        return (
                          <div
                            key={exam._id}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200/70 dark:border-slate-800 flex items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                  {exam.examName}
                                </h4>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                  {exam.subject}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Pass threshold: {exam.passMark || 50}% • {exam.term || "Academic Term"}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-base font-extrabold text-gray-900 dark:text-white">
                                {exam.score !== undefined ? `${exam.score}%` : `${exam.grade}%`}
                              </span>
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  passed
                                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                    : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                                }`}
                              >
                                {exam.status || (passed ? "Passed" : "Failed")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Assigned Teacher Card & Tuition Balance Card */}
              <div className="space-y-6">
                {/* Assigned Primary Teacher */}
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <HiOutlineUserCircle className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      Assigned Class Teacher
                    </h3>
                  </div>

                  {childProfile?.assignedTeacher ? (
                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                          {childProfile.assignedTeacher.name?.[0]?.toUpperCase() || "T"}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                            {childProfile.assignedTeacher.name}
                          </h4>
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            {childProfile.assignedTeacher.subject || "Head Teacher"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-indigo-200/40 dark:border-indigo-800/40">
                        <p className="flex items-center gap-2">
                          <HiOutlineEnvelope className="w-4 h-4 text-indigo-500" />
                          <span>{childProfile.assignedTeacher.email}</span>
                        </p>
                        {childProfile.assignedTeacher.phone && (
                          <p className="flex items-center gap-2">
                            <HiOutlinePhone className="w-4 h-4 text-indigo-500" />
                            <span>{childProfile.assignedTeacher.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      No designated class teacher assigned yet.
                    </div>
                  )}
                </div>

                {/* Tuition & Fee Balance Card */}
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <HiOutlineCurrencyDollar className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        Tuition & Fees
                      </h3>
                    </div>
                    <Link
                      to="/parent/invoices"
                      className="text-xs font-semibold text-emerald-500 hover:text-emerald-600"
                    >
                      Invoices →
                    </Link>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Total Billed:</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        ₦{(((kpis?.totalInvoiced ?? 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Amount Paid:</span>
                      <span className="text-xs font-bold text-emerald-500">
                        ₦{(((kpis?.totalPaid ?? 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Balance Due:
                      </span>
                      <span className="text-base font-extrabold text-rose-500">
                        ₦{(((kpis?.feeBalance ?? 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="pt-2">
                      <span
                        className={`inline-block w-full text-center py-1.5 rounded-xl text-xs font-bold ${
                          kpis?.feeStatus === "Fully Paid"
                            ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                            : kpis?.feeStatus === "Partially Paid"
                            ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                            : "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {kpis?.feeStatus || "Unpaid"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Important Read-Only Parent Reminder */}
                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                    <HiOutlineInformationCircle className="w-4 h-4 shrink-0" />
                    <span>Parent Portal Policy</span>
                  </div>
                  <p className="leading-relaxed">
                    Parents can actively observe scores, attendance, and feedback. Coursework submission and online examinations are restricted to student login credentials only.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COURSEWORK ASSIGNMENTS FULL LIST */}
          {activeTab === "assignments" && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Coursework & Assessments for {childProfile.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Viewing real-time coursework progress and grading evaluations
                  </p>
                </div>
                <Link
                  to="/parent/assignments"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
                >
                  Open Full Assignment Hub →
                </Link>
              </div>

              {recentAssignments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No active assignments currently available for this class.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAssignments.map((assign) => (
                    <div
                      key={assign._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                            {assign.title}
                          </h4>
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            {typeof assign.subject === "object" ? assign.subject?.name : assign.subject}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>Due: {new Date(assign.dueDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Max Marks: {assign.totalMarks || 100}</span>
                          {assign.createdBy?.name && (
                            <>
                              <span>•</span>
                              <span>Teacher: {assign.createdBy.name}</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {assign.submissionStatus === "graded" ? (
                          <div className="text-right">
                            <span className="block text-sm font-extrabold text-emerald-500">
                              Score: {assign.submission?.score}/{assign.totalMarks || 100}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {assign.submission?.feedback || "Graded by Teacher"}
                            </span>
                          </div>
                        ) : assign.submissionStatus === "submitted" ? (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                            Submitted • Under Review
                          </span>
                        ) : assign.submissionStatus === "overdue" ? (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            Overdue Submission
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            Pending Student Submission
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXAM RESULTS FULL LIST */}
          {activeTab === "exams" && (
            <div className="space-y-6">
              {/* Header with Quick Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <HiOutlineTrophy className="w-6 h-6 text-violet-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Examination Records & Student Results
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Official semester examinations, subject test assessments, and term report cards for {childProfile.name}
                  </p>
                </div>

                <Link
                  to={childProfile?._id ? `/parent/report-card?studentId=${childProfile._id}` : "/parent/report-card"}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
                >
                  <HiOutlineDocumentText className="w-4 h-4" />
                  Official Term Report Cards →
                </Link>
              </div>

              {/* Official Term Report Card Executive Banner (if published) */}
              {latestReportCard && (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/30 p-6 shadow-xl text-white">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                          <HiOutlineTrophy className="w-4 h-4 text-amber-400" />
                          Published Term Report Card
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Approved & Released
                        </span>
                      </div>
                      <h4 className="text-xl font-extrabold text-white">
                        {latestReportCard.academicTerm?.name || "Term"} Official Evaluation ({latestReportCard.academicYear?.name || ""})
                      </h4>
                      <p className="text-xs text-indigo-200/90 max-w-xl leading-relaxed">
                        Cumulative academic performance for {childProfile.name} in {childProfile.currentClassLevel || "Class"}.
                        {latestReportCard.teacherComment && (
                          <span className="block mt-1 italic text-slate-300">
                            Teacher Remarks: "{latestReportCard.teacherComment}"
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 shrink-0">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[95px]">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300">Class Rank</span>
                        <span className="text-lg font-black text-amber-400">
                          {latestReportCard.positionFormatted || `${latestReportCard.position}th`}
                        </span>
                        <span className="block text-[10px] text-slate-400">of {latestReportCard.totalStudents || 0} Students</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[95px]">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300">Average</span>
                        <span className="text-lg font-black text-emerald-400">
                          {latestReportCard.averageScore}%
                        </span>
                        <span className="block text-[10px] text-slate-400">Grade: {latestReportCard.overallGrade || "A"}</span>
                      </div>

                      <Link
                        to={childProfile?._id ? `/parent/report-card?studentId=${childProfile._id}` : "/parent/report-card"}
                        className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                      >
                        <HiOutlineDocumentText className="w-4 h-4" />
                        Print Official Card
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                    placeholder="Search results by exam or subject..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Outcome:
                  </span>
                  <select
                    value={examFilter}
                    onChange={(e) => setExamFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Outcomes</option>
                    <option value="passed">Passed Only</option>
                    <option value="failed">Failed Only</option>
                  </select>
                </div>
              </div>

              {/* Exam Records Grid */}
              {filteredExams.length === 0 ? (
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-400 flex items-center justify-center text-3xl mx-auto">
                    📊
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">
                    No Examination Records Found
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {recentExams.length === 0
                      ? "No published examination results are registered yet for this student."
                      : "No exam records match your search or filter criteria."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredExams.map((exam, idx) => {
                    const isPassed = exam.status === "Passed";
                    const hasQuestions = exam.answeredQuestions && exam.answeredQuestions.length > 0;

                    return (
                      <div
                        key={exam._id || idx}
                        className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-start sm:items-center gap-4">
                          {/* Outcome Status Badge */}
                          <div
                            className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border font-bold shadow-sm ${
                              isPassed
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                            }`}
                          >
                            {isPassed ? (
                              <HiOutlineCheckBadge className="w-7 h-7" />
                            ) : (
                              <HiOutlineXCircle className="w-7 h-7" />
                            )}
                            <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">
                              {isPassed ? "Pass" : "Fail"}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-base text-gray-900 dark:text-white">
                                {exam.examName}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                {exam.examType || "Assessment"}
                              </span>
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {exam.subject}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>Term: <strong className="text-slate-700 dark:text-slate-300">{exam.term || "Term 1"}</strong></span>
                              {exam.academicYear && (
                                <>
                                  <span>•</span>
                                  <span>Year: <strong className="text-slate-700 dark:text-slate-300">{exam.academicYear}</strong></span>
                                </>
                              )}
                              <span>•</span>
                              <span>Pass Benchmark: <strong className="text-emerald-600 dark:text-emerald-400">{exam.passMark || 50}%</strong></span>
                              {exam.remarks && (
                                <>
                                  <span>•</span>
                                  <span>Remarks: <strong className="text-indigo-600 dark:text-indigo-400">{exam.remarks}</strong></span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-slate-800">
                          <div className="text-right">
                            <span className="block text-2xl font-black text-gray-900 dark:text-white">
                              {exam.score !== undefined ? `${exam.score}%` : `${exam.grade}%`}
                            </span>
                            <span className={`text-[11px] font-bold ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {exam.status || (isPassed ? "Passed" : "Failed")}
                            </span>
                          </div>

                          {hasQuestions ? (
                            <button
                              type="button"
                              onClick={() => setSelectedExamDetail(exam)}
                              className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800"
                            >
                              <HiOutlineEye className="w-4 h-4" />
                              Review Questions ({exam.answeredQuestions?.length})
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 text-xs font-medium">
                              Exam Completed
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

          {/* TAB 4: ATTENDANCE FULL LIST */}
          {activeTab === "attendance" && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Attendance History
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Attendance records registered by subject and class teachers
                  </p>
                </div>
                <Link
                  to="/parent/attendance"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all"
                >
                  Full Attendance Report →
                </Link>
              </div>

              {!attendance?.recentRecords || attendance.recentRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No attendance entries logged yet for this student.
                </div>
              ) : (
                <div className="space-y-3">
                  {attendance.recentRecords.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                          {att.dateString || new Date(att.date).toLocaleDateString()}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Teacher: {att.teacher || "Class Instructor"}
                          {att.remarks && ` • Note: ${att.remarks}`}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          att.status === "Present"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : att.status === "Late"
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                            : att.status === "Excused"
                            ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                            : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ASSIGNED TEACHERS & SUBJECTS */}
          {activeTab === "teachers" && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Academic Faculty & Enrolled Subjects
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Teachers responsible for your child's courses and curriculum in {currentLevelStr}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Teacher */}
                {childProfile.assignedTeacher && (
                  <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200">
                      Primary Class Teacher
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                        {childProfile.assignedTeacher.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                          {childProfile.assignedTeacher.name}
                        </h4>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">
                          {childProfile.assignedTeacher.subject || "Head of Class"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <HiOutlineEnvelope className="w-4 h-4 text-indigo-500" />
                      {childProfile.assignedTeacher.email}
                    </p>
                  </div>
                )}

                {/* Enrolled Subjects summary */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                    Enrolled Subject Curriculum
                  </h4>
                  {childProfile.enrolledSubjects && childProfile.enrolledSubjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {childProfile.enrolledSubjects.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          {s.subject?.name || "Subject"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Standard program curriculum applicable for {currentLevelStr}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. Link Child Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <HiOutlineLink className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Link Student to Parent
                </h3>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Enter your child's official Student ID (e.g. STU-1234) or school admission email address to link their profile to your parent account.
            </p>

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Student ID or Email Address
                </label>
                <input
                  type="text"
                  value={studentIdentifierInput}
                  onChange={(e) => setStudentIdentifierInput(e.target.value)}
                  placeholder="e.g. STU-9402 or child@school.edu"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="w-1/2 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkLoading}
                  className="w-1/2 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {linkLoading ? (
                    <>
                      <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <HiOutlineCheck className="w-4 h-4" />
                      Confirm Link
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Question Breakdown Review Modal */}
      {selectedExamDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 text-white space-y-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedExamDetail.status === "Passed"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {selectedExamDetail.status || "Exam Completed"}
                  </span>
                  <span className="text-xs text-slate-400">
                    Score: <strong className="text-white">{selectedExamDetail.score !== undefined ? `${selectedExamDetail.score}%` : `${selectedExamDetail.grade}%`}</strong>
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white mt-1.5">
                  {selectedExamDetail.examName} Question Evaluation
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Subject: <strong className="text-slate-300">{selectedExamDetail.subject}</strong> • Pass Benchmark: <strong className="text-emerald-400">{selectedExamDetail.passMark || 50}%</strong>
                  {selectedExamDetail.remarks && ` • Remarks: ${selectedExamDetail.remarks}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedExamDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {selectedExamDetail.answeredQuestions && selectedExamDetail.answeredQuestions.length > 0 ? (
                selectedExamDetail.answeredQuestions.map((q: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      q.isCorrect
                        ? "bg-emerald-950/20 border-emerald-800/60 text-emerald-200"
                        : "bg-rose-950/20 border-rose-800/60 text-rose-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-bold text-white text-sm">
                        Q{idx + 1}. {q.question}
                      </span>
                      {q.isCorrect ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 flex items-center gap-1 shrink-0 border border-emerald-500/30">
                          <HiOutlineCheck className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 flex items-center gap-1 shrink-0 border border-rose-500/30">
                          <HiOutlineXMark className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px]">
                      <div>
                        <span className="text-slate-400">Child's Selected Answer: </span>
                        <strong className={q.isCorrect ? "text-emerald-300" : "text-rose-300"}>
                          {q.selectedAnswer || q.studentAnswer || "Not answered"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Official Correct Key: </span>
                        <strong className="text-emerald-400">
                          {q.correctAnswer}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No individual question response breakdown recorded for this examination.
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedExamDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. School Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 sm:p-8 text-gray-900 dark:text-white space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      selectedAnnouncement.priority === "urgent"
                        ? "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"
                        : selectedAnnouncement.priority === "high"
                        ? "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300"
                        : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                    }`}
                  >
                    {selectedAnnouncement.priority || "Normal"} Priority
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                    {selectedAnnouncement.category || "General"}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 capitalize">
                    {selectedAnnouncement.targetAudience === "student" ? "Students & Parents" : selectedAnnouncement.targetAudience}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedAnnouncement.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <HiOutlineClock className="w-3.5 h-3.5" />
                    {new Date(selectedAnnouncement.createdAt).toLocaleDateString(undefined, {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span>•</span>
                  <span>From: {selectedAnnouncement.createdByName || "School Administration"}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-slate-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto pr-2">
              {selectedAnnouncement.message}
            </div>

            <div className="border-t border-gray-100 dark:border-slate-800 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
