import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchPromotionPreview,
  executePromotions,
  fetchPromotionHistory,
  revertPromotion,
  fetchClassProgression,
  fetchPromotionSettings,
  transitionStudentToSss,
  type PromotionCandidate,
  type PromotionRecord,
} from "../../features/promotions/promotionsSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import toast from "react-hot-toast";
import {
  HiOutlineAcademicCap,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineFunnel,
  HiOutlineArrowRight,
  HiOutlineShieldCheck,
  HiOutlineXMark,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineInformationCircle,
  HiOutlineUserGroup,
  HiOutlineTrophy,
  HiOutlineArrowUturnLeft,
  HiOutlineSparkles,
} from "react-icons/hi2";

export default function StudentPromotion() {
  const dispatch = useAppDispatch();

  // Redux Slices
  const {
    previewData,
    loadingPreview,
    previewError,
    executing,
    history,
    loadingHistory,
    historyTotal,
  } = useAppSelector((state) => state.promotions);

  const { items: academicYears } = useAppSelector((state) => state.academicYears);
  const { items: academicTerms } = useAppSelector((state) => state.academicTerms);
  const { items: classLevels } = useAppSelector((state) => state.classLevels);

  // Active Tab: "workspace" | "history"
  const [activeTab, setActiveTab] = useState<"workspace" | "history">("workspace");

  // Selection Filters
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [nextYear, setNextYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("all");

  // Configurable Criteria
  const [passMark, setPassMark] = useState<number>(50);
  const [requirePublished, setRequirePublished] = useState<boolean>(true);
  const [allowTrial, setAllowTrial] = useState<boolean>(false);
  const [trialMinMark, setTrialMinMark] = useState<number>(40);
  const [showCriteriaModal, setShowCriteriaModal] = useState<boolean>(false);

  // Search & Filter within Preview
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected Students for Bulk Execution (Map studentId -> action)
  const [selectedStudents, setSelectedStudents] = useState<
    Map<string, { action: string; customRemarks?: string; candidate: PromotionCandidate }>
  >(new Map());

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [singleStudentToPromote, setSingleStudentToPromote] = useState<{
    candidate: PromotionCandidate;
    action: string;
  } | null>(null);
  const [revertTarget, setRevertTarget] = useState<PromotionRecord | null>(null);
  const [transitioningStudent, setTransitioningStudent] = useState<{ id: string; name: string } | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAcademicTerms());
    dispatch(fetchClassLevels());
    dispatch(fetchClassProgression());
  }, [dispatch]);

  // Auto-detect defaults: Current Academic Year and 3rd Term
  useEffect(() => {
    if (academicYears && academicYears.length > 0 && !selectedYear) {
      const currentYear = academicYears.find((y: any) => y.isCurrent) || academicYears[0];
      if (currentYear) {
        setSelectedYear(currentYear._id);
        // Find next year chronologically if available
        const currentIndex = academicYears.findIndex((y: any) => y._id === currentYear._id);
        if (currentIndex !== -1 && currentIndex + 1 < academicYears.length) {
          setNextYear(academicYears[currentIndex + 1]._id);
        }
      }
    }

    if (academicTerms && academicTerms.length > 0 && !selectedTerm) {
      // Find term matching 3rd Term or Third Term
      const thirdTerm = academicTerms.find((t: any) => {
        const name = (t.name || "").toLowerCase();
        return name.includes("3rd") || name.includes("third") || name.includes("term 3") || name.includes("final");
      }) || academicTerms[academicTerms.length - 1];

      if (thirdTerm) {
        setSelectedTerm(thirdTerm._id);
      }
    }
  }, [academicYears, academicTerms, selectedYear, selectedTerm]);

  // Load configured promotion target for selected academic year
  useEffect(() => {
    if (selectedYear) {
      dispatch(fetchPromotionSettings(selectedYear))
        .unwrap()
        .then((data) => {
          if (data && typeof data.promotionTarget === "number") {
            setPassMark(data.promotionTarget);
          }
        })
        .catch(() => {});
    }
  }, [selectedYear, dispatch]);

  // Load Preview when Year, Term, or Criteria change
  const handleLoadPreview = () => {
    if (!selectedYear || !selectedTerm) {
      toast.error("Please select an Academic Year and Academic Term.");
      return;
    }

    setSelectedStudents(new Map());
    dispatch(
      fetchPromotionPreview({
        academicYearId: selectedYear,
        academicTermId: selectedTerm,
        classLevelId: selectedClass !== "all" ? selectedClass : undefined,
        passMark,
        requirePublished,
        allowTrial,
        trialMinMark,
      })
    );
  };

  // Trigger preview fetch whenever selectedYear, selectedTerm, or selectedClass changes
  useEffect(() => {
    if (selectedYear && selectedTerm && activeTab === "workspace") {
      handleLoadPreview();
    }
  }, [selectedYear, selectedTerm, selectedClass, passMark, requirePublished, allowTrial, trialMinMark]);

  // Load History when tab changes
  useEffect(() => {
    if (activeTab === "history") {
      dispatch(fetchPromotionHistory({ academicYearId: selectedYear !== "all" ? selectedYear : undefined }));
    }
  }, [activeTab, selectedYear, dispatch]);

  // Is Third Term Check
  const currentTermDoc = useMemo(() => {
    return academicTerms.find((t: any) => t._id === selectedTerm);
  }, [academicTerms, selectedTerm]);

  const isTermThird = useMemo(() => {
    if (!currentTermDoc) return false;
    const name = (currentTermDoc.name || "").toLowerCase();
    return name.includes("3rd") || name.includes("third") || name.includes("term 3") || name.includes("final");
  }, [currentTermDoc]);

  // Filtered Students list across preview
  const filteredClasses = useMemo(() => {
    if (!previewData || !previewData.classes) return [];

    return previewData.classes.map((cls) => {
      const filtered = cls.students.filter((s) => {
        const matchesSearch =
          searchQuery === "" ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.program || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "eligible" && (s.status === "eligible" || s.status === "graduation_eligible")) ||
          (statusFilter === "repeat" && s.status === "repeat") ||
          (statusFilter === "trial" && s.status === "trial") ||
          (statusFilter === "incomplete" && ["no_results", "incomplete_results", "unresolved_review"].includes(s.status)) ||
          (statusFilter === "already_promoted" && s.status === "already_promoted");

        return matchesSearch && matchesStatus;
      });

      return {
        ...cls,
        filteredStudents: filtered,
      };
    });
  }, [previewData, searchQuery, statusFilter]);

  // Selection Handlers
  const handleToggleSelectStudent = (candidate: PromotionCandidate) => {
    if (candidate.alreadyPromoted || candidate.status === "withdrawn") return;

    setSelectedStudents((prev) => {
      const next = new Map(prev);
      if (next.has(candidate.studentId)) {
        next.delete(candidate.studentId);
      } else {
        next.set(candidate.studentId, {
          action: candidate.defaultAction || (candidate.isFinalYear ? "graduate" : "promote"),
          candidate,
        });
      }
      return next;
    });
  };

  const handleSelectAllEligibleInClass = (students: PromotionCandidate[]) => {
    setSelectedStudents((prev) => {
      const next = new Map(prev);
      const eligible = students.filter(
        (s) => s.isEligible && !s.alreadyPromoted && s.status !== "withdrawn"
      );

      const allSelected = eligible.every((s) => next.has(s.studentId));
      if (allSelected) {
        eligible.forEach((s) => next.delete(s.studentId));
      } else {
        eligible.forEach((s) => {
          next.set(s.studentId, {
            action: s.defaultAction || (s.isFinalYear ? "graduate" : "promote"),
            candidate: s,
          });
        });
      }
      return next;
    });
  };

  const handleSelectAllEligibleGlobally = () => {
    if (!previewData?.classes) return;
    const allEligible: PromotionCandidate[] = [];
    previewData.classes.forEach((cls) => {
      cls.students.forEach((s) => {
        if (s.isEligible && !s.alreadyPromoted && s.status !== "withdrawn") {
          allEligible.push(s);
        }
      });
    });

    setSelectedStudents((prev) => {
      const next = new Map(prev);
      const allSelected = allEligible.every((s) => next.has(s.studentId));
      if (allSelected) {
        allEligible.forEach((s) => next.delete(s.studentId));
      } else {
        allEligible.forEach((s) => {
          next.set(s.studentId, {
            action: s.defaultAction || (s.isFinalYear ? "graduate" : "promote"),
            candidate: s,
          });
        });
      }
      return next;
    });
  };

  // Execution Handlers
  const handleExecuteConfirmedPromotions = async () => {
    const listToExecute = singleStudentToPromote
      ? [
          {
            studentId: singleStudentToPromote.candidate.studentId,
            action: singleStudentToPromote.action,
            customRemarks: `Individual action: ${singleStudentToPromote.action}`,
          },
        ]
      : Array.from(selectedStudents.values()).map(({ candidate, action, customRemarks }) => ({
          studentId: candidate.studentId,
          action,
          customRemarks,
        }));

    if (listToExecute.length === 0) {
      toast.error("No students selected for promotion.");
      return;
    }

    try {
      const resultAction = await dispatch(
        executePromotions({
          academicYearId: selectedYear,
          academicTermId: selectedTerm,
          nextAcademicYearId: nextYear || undefined,
          promotions: listToExecute,
          passMark,
          allowTrial,
        })
      );

      if (executePromotions.fulfilled.match(resultAction)) {
        toast.success(
          `Successfully processed promotions! Promoted: ${resultAction.payload.summary.promotedCount}, Graduated: ${resultAction.payload.summary.graduatedCount}`
        );
        setShowConfirmModal(false);
        setSingleStudentToPromote(null);
        setSelectedStudents(new Map());
        handleLoadPreview();
      } else {
        toast.error((resultAction.payload as string) || "Failed to execute promotions.");
      }
    } catch {
      toast.error("An unexpected error occurred during execution.");
    }
  };

  // Revert Handler
  const handleConfirmRevert = async () => {
    if (!revertTarget) return;

    try {
      const resAction = await dispatch(revertPromotion(revertTarget._id));
      if (revertPromotion.fulfilled.match(resAction)) {
        toast.success(`Promotion reverted for ${revertTarget.studentName}`);
        setRevertTarget(null);
        dispatch(fetchPromotionHistory({ academicYearId: selectedYear !== "all" ? selectedYear : undefined }));
      } else {
        toast.error((resAction.payload as string) || "Failed to revert promotion");
      }
    } catch {
      toast.error("Failed to revert promotion record.");
    }
  };

  // Move graduated JSS student to SSS 1 Handler
  const handleConfirmTransitionToSss = async () => {
    if (!transitioningStudent) return;
    try {
      const resAction = await dispatch(
        transitionStudentToSss({
          studentId: transitioningStudent.id,
          customRemarks: `Moved graduated student "${transitioningStudent.name}" into SSS 1 by Administrator.`,
        })
      );
      if (transitionStudentToSss.fulfilled.match(resAction)) {
        toast.success(resAction.payload?.message || `Successfully moved ${transitioningStudent.name} to SSS 1!`);
        setTransitioningStudent(null);
        handleLoadPreview();
        dispatch(fetchPromotionHistory({ academicYearId: selectedYear !== "all" ? selectedYear : undefined }));
      } else {
        toast.error((resAction.payload as string) || "Failed to move student to SSS");
      }
    } catch {
      toast.error("Failed to move student to SSS.");
    }
  };

  const getBadgeStyle = (color: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "purple":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "yellow":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "rose":
      case "red":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "orange":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "amber":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      default:
        return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto text-slate-100 min-w-0">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Administration</span>
            <span>/</span>
            <span>Academic Setup</span>
            <span>/</span>
            <span className="text-indigo-300 font-medium">Class Promotion System</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
              <HiOutlineAcademicCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Automatic Student Class Promotion
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                End-of-year class advancement, graduation processing, and duplicate-safe promotion engine.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab("workspace")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "workspace"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Promotion Workspace
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Promotion Audit History ({historyTotal})
            </button>
          </div>

          <button
            onClick={() => setShowCriteriaModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer"
            title="Configure promotion threshold and policy"
          >
            <HiOutlineAdjustmentsHorizontal className="w-4 h-4 text-indigo-400" />
            <span>Criteria ({passMark}% Pass)</span>
          </button>
        </div>
      </div>

      {/* 2. Selection & Filter Toolbar */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 shadow-xl backdrop-blur-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Completed Academic Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Academic Year (Completed)</span>
              <span className="text-[10px] text-indigo-400 font-normal">Source Year</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="" disabled>
                Select completed year...
              </option>
              {academicYears.map((y: any) => (
                <option key={y._id} value={y._id}>
                  {y.name} {y.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Third Term Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Academic Term</span>
              {isTermThird && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <HiOutlineCheckCircle className="w-3 h-3" /> 3rd Term
                </span>
              )}
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="" disabled>
                Select academic term...
              </option>
              {academicTerms.map((t: any) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Next Academic Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Next Academic Year</span>
              <span className="text-[10px] text-violet-400 font-normal">Target Enrollment</span>
            </label>
            <select
              value={nextYear}
              onChange={(e) => setNextYear(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="">Keep current enrollment year</option>
              {academicYears.map((y: any) => (
                <option key={y._id} value={y._id}>
                  {y.name} {y.isCurrent ? "(Active Session)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Class Level Spotlight */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Filter Class Level</span>
              <span className="text-[10px] text-slate-400">Class Scope</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Class Levels</option>
              {classLevels.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Term Safety Warning Notice */}
        {!isTermThird && selectedTerm && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2.5">
            <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Notice:</strong> The selected term does not appear to be the Third Term. Student promotions
              are typically executed following final 3rd Term comprehensive results. You may still preview or
              promote if your school has finalized cumulative standings.
            </span>
          </div>
        )}
      </div>

      {/* 3. WORKSPACE TAB */}
      {activeTab === "workspace" && (
        <div className="space-y-6">
          {/* KPI Statistics Overview */}
          {previewData?.overallStats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">Total Students</span>
                <span className="text-xl sm:text-2xl font-black text-white">
                  {previewData.overallStats.totalStudents}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Evaluated in class</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs text-emerald-300 block mb-1">Eligible to Advance</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">
                  {previewData.overallStats.eligibleForPromotion}
                </span>
                <span className="text-[10px] text-emerald-400/70 block mt-1">Average &ge; {passMark}%</span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-xs text-purple-300 block mb-1">Graduation Ready</span>
                <span className="text-xl sm:text-2xl font-black text-purple-400">
                  {previewData.overallStats.eligibleForGraduation}
                </span>
                <span className="text-[10px] text-purple-400/70 block mt-1">Final year complete</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-xs text-rose-300 block mb-1">Repeat Class</span>
                <span className="text-xl sm:text-2xl font-black text-rose-400">
                  {previewData.overallStats.repeatCount}
                </span>
                <span className="text-[10px] text-rose-400/70 block mt-1">Below pass threshold</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-xs text-amber-300 block mb-1">Incomplete / Review</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400">
                  {previewData.overallStats.incompleteCount}
                </span>
                <span className="text-[10px] text-amber-400/70 block mt-1">Missing / unverified</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-300 block mb-1">Already Promoted</span>
                <span className="text-xl sm:text-2xl font-black text-indigo-300">
                  {previewData.overallStats.alreadyPromotedCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Duplicate prevented</span>
              </div>
            </div>
          )}

          {/* Search, Filter & Bulk Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Search student name, ID, program..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <HiOutlineFunnel className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Eligibility Standings</option>
                <option value="eligible">Eligible & Graduating</option>
                <option value="repeat">Repeat Required</option>
                <option value="trial">Promote on Trial</option>
                <option value="incomplete">Incomplete / Unresolved</option>
                <option value="already_promoted">Already Promoted</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleSelectAllEligibleGlobally}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                Select All Eligible
              </button>

              <button
                disabled={selectedStudents.size === 0}
                onClick={() => {
                  setSingleStudentToPromote(null);
                  setShowConfirmModal(true);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                  selectedStudents.size > 0
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95"
                    : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                }`}
              >
                <HiOutlineSparkles className="w-4 h-4" />
                <span>Bulk Promote ({selectedStudents.size} selected)</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loadingPreview && (
            <div className="p-16 rounded-3xl bg-slate-900/50 border border-white/10 text-center space-y-3">
              <HiOutlineArrowPath className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-white">Evaluating 3rd Term student results & progression...</p>
              <p className="text-xs text-slate-400">Verifying class structures, report cards, and duplicate records</p>
            </div>
          )}

          {/* Error State */}
          {previewError && !loadingPreview && (
            <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
              <HiOutlineExclamationTriangle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <strong className="block font-semibold">Promotion Evaluation Error</strong>
                <span>{previewError}</span>
              </div>
            </div>
          )}

          {/* Class Groupings & Student Tables */}
          {!loadingPreview && filteredClasses.length > 0 && (
            <div className="space-y-6">
              {filteredClasses.map((clsGroup) => {
                const students = clsGroup.filteredStudents || [];
                const allEligibleSelected =
                  students.filter((s) => s.isEligible && !s.alreadyPromoted).length > 0 &&
                  students
                    .filter((s) => s.isEligible && !s.alreadyPromoted)
                    .every((s) => selectedStudents.has(s.studentId));

                return (
                  <div
                    key={clsGroup.className}
                    className="rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl overflow-hidden backdrop-blur-md"
                  >
                    {/* Class Group Header */}
                    <div className="p-4 sm:p-5 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                          <HiOutlineUserGroup className="w-5 h-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                              {clsGroup.className}
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300">
                              {students.length} student{students.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {clsGroup.eligibleCount} eligible for next class • {clsGroup.graduatingCount} graduating •{" "}
                            {clsGroup.repeatCount} repeat required
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectAllEligibleInClass(students)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors cursor-pointer"
                        >
                          {allEligibleSelected ? "Deselect Eligible" : "Select Eligible in Class"}
                        </button>
                      </div>
                    </div>

                    {/* Students Table */}
                    {students.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No students in this class match the active search or eligibility filter.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/2 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                              <th className="p-3.5 w-10 text-center">
                                <span className="sr-only">Select</span>
                              </th>
                              <th className="p-3.5">Student Information</th>
                              <th className="p-3.5">Class Progression</th>
                              <th className="p-3.5 text-center">Annual Average</th>
                              <th className="p-3.5 text-center">Result Status</th>
                              <th className="p-3.5">Eligibility Standing</th>
                              <th className="p-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-medium">
                            {students.map((student) => {
                              const isSelected = selectedStudents.has(student.studentId);

                              return (
                                <tr
                                  key={student.studentId}
                                  className={`hover:bg-white/5 transition-colors ${
                                    isSelected ? "bg-indigo-500/10" : ""
                                  } ${student.alreadyPromoted ? "opacity-75" : ""}`}
                                >
                                  {/* Checkbox */}
                                  <td className="p-3.5 text-center">
                                    <input
                                      type="checkbox"
                                      disabled={student.alreadyPromoted || student.status === "withdrawn"}
                                      checked={isSelected}
                                      onChange={() => handleToggleSelectStudent(student)}
                                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                  </td>

                                  {/* Student Name & ID */}
                                  <td className="p-3.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                        {student.name?.[0]?.toUpperCase() || "S"}
                                      </div>
                                      <div>
                                        <span className="font-bold text-white block">{student.name}</span>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                          <span>{student.registrationNumber}</span>
                                          {student.program && <span>• {student.program}</span>}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Class Progression (Current -> Next) */}
                                  <td className="p-3.5">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-white/10 text-xs">
                                      <span className="text-slate-300">{student.currentClass}</span>
                                      <HiOutlineArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                      {student.isFinalYear || student.proposedNextClass === "Graduated" ? (
                                        <span className="text-amber-400 font-bold flex items-center gap-1">
                                          <HiOutlineTrophy className="w-3.5 h-3.5" /> Graduated
                                        </span>
                                      ) : (
                                        <span className="text-emerald-400 font-bold">
                                          {student.proposedNextClass}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Annual Average & Configured Target */}
                                  <td className="p-3.5 text-center">
                                    <span className="font-black text-white text-sm block">
                                      {student.annualAverage !== undefined && student.annualAverage !== null
                                        ? `${student.annualAverage}%`
                                        : student.averageScore ? `${student.averageScore}%` : "—"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block font-medium">
                                      Target: {student.promotionTarget ?? previewData?.criteria?.promotionTarget ?? passMark}%
                                    </span>
                                  </td>

                                  {/* Result / Report Card Status */}
                                  <td className="p-3.5 text-center">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        student.reportCardStatus === "published"
                                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                          : student.reportCardStatus === "approved"
                                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                          : ["returned_for_correction", "rejected"].includes(student.reportCardStatus || "")
                                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      }`}
                                    >
                                      {student.reportCardStatus
                                        ? student.reportCardStatus.replace(/_/g, " ").toUpperCase()
                                        : "NO CARD"}
                                    </span>
                                  </td>

                                  {/* Eligibility Standing / Calculated Promotion Status Badge */}
                                  <td className="p-3.5">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getBadgeStyle(
                                        student.color
                                      )}`}
                                    >
                                      <span>{student.promotionStatus || student.badge}</span>
                                    </span>
                                    {student.reasons && student.reasons.length > 0 && (
                                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs truncate" title={student.reasons[0]}>
                                        {student.reasons[0]}
                                      </p>
                                    )}
                                  </td>

                                  {/* Individual Action Buttons */}
                                  <td className="p-3.5 text-right">
                                    {student.alreadyPromoted ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-indigo-300 font-medium">
                                        <HiOutlineCheckCircle className="w-4 h-4 text-emerald-400" /> Promoted
                                      </span>
                                    ) : (
                                      <div className="inline-flex items-center gap-1.5">
                                        {student.isEligible ? (
                                          <>
                                            <button
                                              onClick={() => {
                                                setSingleStudentToPromote({
                                                  candidate: student,
                                                  action: student.isFinalYear ? "graduate" : "promote",
                                                });
                                                setShowConfirmModal(true);
                                              }}
                                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
                                            >
                                              {student.isFinalYear ? "Graduate" : "Promote"}
                                            </button>
                                            {/* If JSS final year or proposed to graduate from JSS, offer Move to SSS */}
                                            {((student.currentClass || "").toLowerCase().includes("jss") || (student.currentClass || "").toLowerCase().includes("junior")) && (student.isFinalYear || student.proposedNextClass === "Graduated") && (
                                              <button
                                                onClick={() => setTransitioningStudent({ id: student.studentId, name: student.name })}
                                                className="px-2.5 py-1 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                                title="Move this graduated JSS student into SSS 1 Class"
                                              >
                                                <HiOutlineArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                                                <span>Move to SSS</span>
                                              </button>
                                            )}
                                          </>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setSingleStudentToPromote({
                                                candidate: student,
                                                action: "repeat",
                                              });
                                              setShowConfirmModal(true);
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                                          >
                                            Repeat
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loadingPreview && (!previewData?.classes || previewData.classes.length === 0) && (
            <div className="p-16 rounded-3xl bg-slate-900/60 border border-white/10 text-center space-y-4">
              <HiOutlineInformationCircle className="w-12 h-12 text-slate-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Promotion Candidates Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Please verify that the selected academic year and term have registered students with calculated
                  report cards.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. PROMOTION AUDIT HISTORY TAB */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl overflow-hidden backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white">Promotion Audit Ledger</h2>
                <p className="text-xs text-slate-400">
                  Comprehensive audit trail of all student promotions, class progressions, and graduation records.
                </p>
              </div>

              <button
                onClick={() =>
                  dispatch(fetchPromotionHistory({ academicYearId: selectedYear !== "all" ? selectedYear : undefined }))
                }
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HiOutlineArrowPath className={`w-4 h-4 ${loadingHistory ? "animate-spin" : ""}`} />
                <span>Refresh Log</span>
              </button>
            </div>

            {loadingHistory ? (
              <div className="p-16 text-center space-y-2">
                <HiOutlineArrowPath className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading audit history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-400">
                No promotion records found in audit log.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/2 text-slate-400 uppercase text-[10px] font-semibold">
                      <th className="p-3.5">Date of Progression</th>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Previous Class</th>
                      <th className="p-3.5">New Class / Status</th>
                      <th className="p-3.5">Academic Year</th>
                      <th className="p-3.5 text-center">Annual Avg / Target</th>
                      <th className="p-3.5 text-center">Report Card</th>
                      <th className="p-3.5">Promotion Status</th>
                      <th className="p-3.5">Processed By</th>
                      <th className="p-3.5 text-right">Rollback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {history.map((record) => (
                      <tr key={record._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(record.promotionDate).toLocaleDateString()}
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(record.promotionDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="font-bold text-white block">{record.studentName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{record.studentID}</span>
                        </td>

                        <td className="p-3.5">
                          <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-300 font-semibold">
                            {record.fromClass}
                          </span>
                        </td>

                        <td className="p-3.5">
                          {record.action === "graduated" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
                              <HiOutlineTrophy className="w-3.5 h-3.5 text-amber-400" /> Graduated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                              <HiOutlineArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              {record.toClass}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-slate-300 text-xs whitespace-nowrap">
                          {record.academicYear?.name || "Completed Year"}
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="font-bold text-white block">
                            {record.averageScore !== undefined && record.averageScore !== null ? `${record.averageScore}%` : "—"}
                          </span>
                          <span className="text-[10px] text-indigo-300/80 block">
                            Target: {record.promotionTarget !== undefined && record.promotionTarget !== null ? `${record.promotionTarget}%` : "50%"}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {record.reportCardPublicationStatus || "Published"}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              record.action === "graduated"
                                ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                : record.action === "repeated"
                                ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {record.promotionStatus}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-300 text-xs">
                          <span>{record.promotedByName || record.promotedBy?.name || "Admin"}</span>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {record.action === "graduated" && ((record.fromClass || "").toLowerCase().includes("jss") || (record.fromClass || "").toLowerCase().includes("junior")) && (
                              <button
                                onClick={() => setTransitioningStudent({ id: record.student?._id || record.studentID, name: record.studentName })}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Move graduated JSS student into SSS 1"
                              >
                                <HiOutlineArrowRight className="w-3.5 h-3.5" />
                                <span>Move to SSS</span>
                              </button>
                            )}
                            <button
                              onClick={() => setRevertTarget(record)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Revert this promotion"
                            >
                              <HiOutlineArrowUturnLeft className="w-3.5 h-3.5" />
                              <span>Revert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <HiOutlineShieldCheck className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">Confirm Student Class Promotion</h3>
                  <p className="text-xs text-slate-400">Database commit review</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSingleStudentToPromote(null);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                You are about to commit the following class progression updates to the live database:
              </p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                {singleStudentToPromote ? (
                  <div className="flex items-center justify-between">
                    <span>Student:</span>
                    <strong className="text-white">
                      {singleStudentToPromote.candidate.name} ({singleStudentToPromote.candidate.registrationNumber})
                    </strong>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span>Total Students Selected:</span>
                    <strong className="text-emerald-400 font-bold text-sm">
                      {selectedStudents.size} student{selectedStudents.size === 1 ? "" : "s"}
                    </strong>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span>Completed Academic Year:</span>
                  <strong className="text-white">
                    {academicYears.find((y: any) => y._id === selectedYear)?.name || "Current Year"}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span>Next Academic Year Enrollment:</span>
                  <strong className="text-violet-400">
                    {academicYears.find((y: any) => y._id === nextYear)?.name || "Preserved existing"}
                  </strong>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-indigo-300">
                  <HiOutlineInformationCircle className="w-4 h-4 shrink-0" />
                  Promotion Guarantees:
                </span>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>Previous academic results, attendance, and fee history are preserved untouched.</li>
                  <li>Student portal dashboard will immediately display the new class level.</li>
                  <li>Duplicate promotion prevention is enforced for the completed year.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSingleStudentToPromote(null);
                }}
                disabled={executing}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={executing}
                onClick={handleExecuteConfirmedPromotions}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {executing ? (
                  <>
                    <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                    <span>Committing promotions...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    <span>Confirm & Execute Promotion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. REVERT CONFIRMATION MODAL */}
      {revertTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/15 p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                <HiOutlineArrowUturnLeft className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold">Revert Student Promotion</h3>
                <p className="text-xs text-slate-400">Undo accidental class transition</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to revert the promotion for{" "}
              <strong className="text-white">{revertTarget.studentName}</strong>? This will return the student
              from <strong className="text-rose-400">{revertTarget.toClass}</strong> back to{" "}
              <strong className="text-emerald-400">{revertTarget.fromClass}</strong> and reset their graduation status
              if applicable.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRevertTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevert}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30"
              >
                Yes, Revert Promotion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CONFIGURABLE CRITERIA MODAL */}
      {showCriteriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/15 p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <HiOutlineAdjustmentsHorizontal className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold">Promotion Policy & Criteria</h3>
              </div>
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Minimum Cumulative Pass Mark (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={passMark}
                  onChange={(e) => setPassMark(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Students with 3rd Term average score &ge; {passMark}% qualify for standard promotion.
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <div>
                  <span className="block font-semibold text-slate-200">Require Officially Published Results</span>
                  <span className="text-[10px] text-slate-400">Only promote after admin results publication</span>
                </div>
                <input
                  type="checkbox"
                  checked={requirePublished}
                  onChange={(e) => setRequirePublished(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <div>
                  <span className="block font-semibold text-slate-200">Allow Promotion on Trial</span>
                  <span className="text-[10px] text-slate-400">Borderline candidates (e.g. 40 - 49%)</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowTrial}
                  onChange={(e) => setAllowTrial(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                />
              </div>

              {allowTrial && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Trial Promotion Minimum Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={passMark}
                    value={trialMinMark}
                    onChange={(e) => setTrialMinMark(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCriteriaModal(false);
                  handleLoadPreview();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Apply Criteria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MOVE GRADUATED JSS STUDENT TO SSS MODAL */}
      {transitioningStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <HiOutlineAcademicCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Move Student to SSS Class</h3>
                <p className="text-xs text-slate-400">Promote graduated JSS student into Senior Secondary</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to transition <strong className="text-white">{transitioningStudent.name}</strong> into <span className="text-indigo-400 font-bold">SSS 1</span>? This will move their enrollment to the Senior Secondary track, register their new class, and assign the SSS 1 class curriculum.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setTransitioningStudent(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTransitionToSss}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <HiOutlineArrowRight className="w-4 h-4" />
                <span>Confirm Move to SSS 1</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
