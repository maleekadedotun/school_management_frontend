import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchAdminReportCardOverview,
  fetchClassReportCards,
  approveClassReportCards,
  rejectClassReportCards,
  publishClassReportCards,
  updateAdminComment,
  fetchReportCardHistory,
  clearReviewHistory,
  type ReportCardItem,
  type AdminReportCardOverviewItem,
} from "../../features/reportCards/reportCardsSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import { fetchPrograms } from "../../features/programs/programsSlice";
import { ReportCardDocument } from "../../components/reportCard/ReportCardDocument";
import {
  HiOutlineCheckBadge,
  HiOutlineXCircle,
  HiOutlineGlobeAlt,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineBuildingLibrary,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineFunnel,
} from "react-icons/hi2";

export default function AdminReportCards() {
  const dispatch = useAppDispatch();
  const {
    adminSummaries,
    classReportCards,
    loading,
    actionLoading,
    activeReviewHistory,
  } = useAppSelector((state) => state.reportCards);

  const { items: academicYears } = useAppSelector((state) => state.academicYears);
  const { items: academicTerms } = useAppSelector((state) => state.academicTerms);
  const { items: classLevels } = useAppSelector((state) => state.classLevels);
  const { items: programs } = useAppSelector((state) => state.programs);

  // Active Tab: "overview" | "classReview"
  const [activeTab, setActiveTab] = useState<"overview" | "classReview">("overview");

  // Selection state for Class Review Tab
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");

  // Filter state for Overview Tab
  const [overviewYear, setOverviewYear] = useState<string>("");
  const [overviewTerm, setOverviewTerm] = useState<string>("");
  const [overviewProgram, setOverviewProgram] = useState<string>("");

  // Modals
  const [previewCard, setPreviewCard] = useState<ReportCardItem | null>(null);
  const [editingCard, setEditingCard] = useState<ReportCardItem | null>(null);
  const [principalCommentInput, setPrincipalCommentInput] = useState<string>("");
  const [promotionStatusInput, setPromotionStatusInput] = useState<string>("Promoted");
  const [isPromotedInput, setIsPromotedInput] = useState<boolean>(true);

  // Rejection Modal (Individual or Batch)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [targetCardForReject, setTargetCardForReject] = useState<ReportCardItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Review & Audit History Modal
  const [historyModalCard, setHistoryModalCard] = useState<ReportCardItem | null>(null);

  // Notification Banner
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAcademicTerms());
    dispatch(fetchClassLevels());
    dispatch(fetchPrograms());
  }, [dispatch]);

  // Fetch overview based on overview filters (Year, Term, Program)
  useEffect(() => {
    dispatch(
      fetchAdminReportCardOverview({
        academicYearId: overviewYear || undefined,
        academicTermId: overviewTerm || undefined,
        programId: overviewProgram || undefined,
      })
    );
  }, [dispatch, overviewYear, overviewTerm, overviewProgram]);

  // Load class report cards when review tab is active and class is selected
  useEffect(() => {
    if (selectedClass) {
      dispatch(
        fetchClassReportCards({
          classLevelId: selectedClass,
          academicYearId: selectedYear || undefined,
          academicTermId: selectedTerm || undefined,
          programId: selectedProgram || undefined,
        })
      );
    }
  }, [dispatch, selectedClass, selectedYear, selectedTerm, selectedProgram]);

  const handleRefresh = () => {
    dispatch(
      fetchAdminReportCardOverview({
        academicYearId: overviewYear || undefined,
        academicTermId: overviewTerm || undefined,
        programId: overviewProgram || undefined,
      })
    );
    if (selectedClass) {
      dispatch(
        fetchClassReportCards({
          classLevelId: selectedClass,
          academicYearId: selectedYear || undefined,
          academicTermId: selectedTerm || undefined,
          programId: selectedProgram || undefined,
        })
      );
    }
  };

  const handleOpenClassReview = (item: AdminReportCardOverviewItem) => {
    setSelectedClass(item.classLevelId);
    setSelectedYear(item.academicYearId);
    setSelectedTerm(item.academicTermId);
    setSelectedProgram(item.programId || "");
    setActiveTab("classReview");
  };

  const handleApproveClass = async () => {
    if (!selectedClass || !selectedYear || !selectedTerm) return;
    setAlertMsg(null);
    const res = await dispatch(
      approveClassReportCards({
        classLevelId: selectedClass,
        academicYearId: selectedYear,
        academicTermId: selectedTerm,
        programId: selectedProgram || undefined,
      })
    );
    if (approveClassReportCards.fulfilled.match(res)) {
      setAlertMsg({ text: res.payload?.message || "Class report cards approved!", type: "success" });
      handleRefresh();
    } else {
      setAlertMsg({ text: (res.payload as string) || "Failed to approve report cards.", type: "error" });
    }
  };

  const handleOpenBatchReject = () => {
    setTargetCardForReject(null);
    setRejectionReason("");
    setIsRejectModalOpen(true);
  };

  const handleOpenIndividualReject = (card: ReportCardItem) => {
    setTargetCardForReject(card);
    setRejectionReason(card.rejectionReason || "");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      setAlertMsg({ text: "Please enter a specific rejection reason for the teacher.", type: "error" });
      return;
    }

    setAlertMsg(null);
    if (targetCardForReject) {
      // Individual student rejection
      const res = await dispatch(
        rejectClassReportCards({
          reportCardId: targetCardForReject._id,
          rejectionReason: rejectionReason.trim(),
        })
      );
      setIsRejectModalOpen(false);
      setTargetCardForReject(null);
      setRejectionReason("");
      if (rejectClassReportCards.fulfilled.match(res)) {
        setAlertMsg({ text: res.payload?.message || "Student result returned to class teacher for correction.", type: "success" });
        handleRefresh();
      } else {
        setAlertMsg({ text: (res.payload as string) || "Failed to return student result.", type: "error" });
      }
    } else {
      // Batch rejection for entire class
      if (!selectedClass || !selectedYear || !selectedTerm) return;
      const res = await dispatch(
        rejectClassReportCards({
          classLevelId: selectedClass,
          academicYearId: selectedYear,
          academicTermId: selectedTerm,
          programId: selectedProgram || undefined,
          rejectionReason: rejectionReason.trim(),
        })
      );
      setIsRejectModalOpen(false);
      setRejectionReason("");
      if (rejectClassReportCards.fulfilled.match(res)) {
        setAlertMsg({ text: res.payload?.message || "Submitted report cards returned to teacher for corrections.", type: "success" });
        handleRefresh();
      } else {
        setAlertMsg({ text: (res.payload as string) || "Failed to return report cards.", type: "error" });
      }
    }
  };

  const handlePublishIndividual = async (card: ReportCardItem, publish: boolean) => {
    const studentName = card.student?.name || "this student";
    const confirm = window.confirm(
      publish
        ? `Publish ${studentName}'s report card? The student and their parents will be able to view and download it immediately.`
        : `Unpublish ${studentName}'s report card? It will no longer be visible to student or parent.`
    );
    if (!confirm) return;

    setAlertMsg(null);
    const res = await dispatch(
      publishClassReportCards({
        reportCardId: card._id,
        publish,
      })
    );
    if (publishClassReportCards.fulfilled.match(res)) {
      setAlertMsg({ text: res.payload?.message || `${studentName}'s publication status updated!`, type: "success" });
      handleRefresh();
    } else {
      setAlertMsg({ text: (res.payload as string) || "Failed to update publication status.", type: "error" });
    }
  };

  const handleBatchPublish = async () => {
    if (!selectedClass || !selectedYear || !selectedTerm) return;

    const eligible = classReportCards.filter(
      (c) =>
        c.status === "submitted_to_admin" ||
        c.status === "submitted" ||
        c.status === "approved" ||
        c.status === "resubmitted"
    ).length;

    const incomplete = classReportCards.filter(
      (c) => c.status === "returned_for_correction" || c.status === "draft"
    ).length;

    const confirm = window.confirm(
      `Publish all eligible results for this class?\n\n` +
      `• Eligible for immediate publication: ${eligible} students\n` +
      `• Incomplete / Returned for correction (will NOT be published): ${incomplete} students\n\n` +
      `Published report cards will instantly become accessible in student and parent portals. Continue?`
    );
    if (!confirm) return;

    setAlertMsg(null);
    const res = await dispatch(
      publishClassReportCards({
        classLevelId: selectedClass,
        academicYearId: selectedYear,
        academicTermId: selectedTerm,
        programId: selectedProgram || undefined,
        publish: true,
      })
    );
    if (publishClassReportCards.fulfilled.match(res)) {
      setAlertMsg({
        text: res.payload?.message || `Successfully published ${res.payload?.publishedCount || eligible} eligible student results!`,
        type: "success",
      });
      handleRefresh();
    } else {
      setAlertMsg({ text: (res.payload as string) || "Failed to publish report cards.", type: "error" });
    }
  };

  const handleOpenHistory = (card: ReportCardItem) => {
    setHistoryModalCard(card);
    dispatch(fetchReportCardHistory(card._id));
  };

  const handleOpenEditAdminEvaluation = (card: ReportCardItem) => {
    setEditingCard(card);
    setPrincipalCommentInput(card.principalComment || "");
    setPromotionStatusInput(card.promotionStatus || "Promoted");
    setIsPromotedInput(card.promoted !== undefined ? card.promoted : true);
  };

  const handleSaveAdminEvaluation = async () => {
    if (!editingCard) return;
    await dispatch(
      updateAdminComment({
        id: editingCard._id,
        principalComment: principalCommentInput,
        promotionStatus: promotionStatusInput,
        promoted: isPromotedInput,
      })
    );
    setEditingCard(null);
    setAlertMsg({ text: "Principal comment and promotion status updated successfully.", type: "success" });
  };

  const overallClassStatus = useMemo(() => {
    if (classReportCards.length === 0) return "uncalculated";
    const publishedCount = classReportCards.filter((c) => c.published).length;
    if (publishedCount === classReportCards.length) return "published";
    const approvedCount = classReportCards.filter((c) => c.status === "approved").length;
    if (approvedCount === classReportCards.length) return "approved";
    return classReportCards[0].status || "calculated";
  }, [classReportCards]);

  const quickPrincipalComments = [
    "Commendable academic excellence. A role model for the school community.",
    "Very good term results. Maintain this high academic standard.",
    "Pleasing progress. Strive for higher academic honors next term.",
    "Fair result. Must double effort in the upcoming academic term.",
    "Academic counseling recommended to assist this student in progressing.",
  ];

  return (
    <div className="min-h-screen pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="pt-6 pb-6 border-b border-gray-200 dark:border-gray-800 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 mb-2">
              <HiOutlineBuildingLibrary className="w-3.5 h-3.5" />
              Administrative Academic Oversight
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Term Report Cards & Publication Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Review teacher class submissions, inspect subject marks, verify positions, approve, and officially publish report cards to students.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <HiOutlineArrowPath className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-5 text-sm font-bold border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            All Classes Overview ({adminSummaries.length})
          </button>
          <button
            onClick={() => setActiveTab("classReview")}
            className={`py-3 px-5 text-sm font-bold border-b-2 transition-all ${
              activeTab === "classReview"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Class Inspection & Approvals
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alertMsg && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-sm ${
            alertMsg.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="text-gray-400 hover:text-gray-600">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW OF ALL CLASSES */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                Total Class Submissions
              </span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {adminSummaries.length}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                Pending Admin Review
              </span>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {adminSummaries.filter((s) => s.overallStatus === "submitted").length}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                Approved (Pending Release)
              </span>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {adminSummaries.filter((s) => s.overallStatus === "approved").length}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Officially Published
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {adminSummaries.filter((s) => s.overallStatus === "published").length}
              </p>
            </div>
          </div>

          {/* Filters Bar for Overview Tab */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <HiOutlineFunnel className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  Filter Overview by Term, Year & Program
                </span>
              </div>
              {(overviewYear || overviewTerm || overviewProgram) && (
                <button
                  type="button"
                  onClick={() => {
                    setOverviewYear("");
                    setOverviewTerm("");
                    setOverviewProgram("");
                  }}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Program Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Program:
                </label>
                <select
                  value={overviewProgram}
                  onChange={(e) => setOverviewProgram(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="">All Programs</option>
                  {programs.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Term Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Academic Term:
                </label>
                <select
                  value={overviewTerm}
                  onChange={(e) => setOverviewTerm(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="">All Academic Terms</option>
                  {academicTerms.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Academic Year:
                </label>
                <select
                  value={overviewYear}
                  onChange={(e) => setOverviewYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="">All Academic Years</option>
                  {academicYears.map((y) => (
                    <option key={y._id} value={y._id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Classes Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Classes Term Results Queue
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click on any class to inspect student results, approve, or release to students.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-bold uppercase text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-5">Class Level</th>
                    <th className="py-3 px-4">Program</th>
                    <th className="py-3 px-4">Academic Term</th>
                    <th className="py-3 px-4">Academic Year</th>
                    <th className="py-3 px-3 text-center">Students</th>
                    <th className="py-3 px-3 text-center">Class Average</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {adminSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        No class term results have been generated or submitted yet.
                      </td>
                    </tr>
                  ) : (
                    adminSummaries.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3.5 px-5 font-bold text-gray-900 dark:text-white">
                          {item.className}
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {item.programName || "All Programs"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                          {item.academicTermName}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                          {item.academicYearName}
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-gray-800 dark:text-gray-200">
                          {item.totalStudents}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                          {item.classAverage}%
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                              item.overallStatus === "published"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : item.overallStatus === "approved"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                : item.overallStatus === "submitted"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 animate-pulse"
                                : item.overallStatus === "rejected"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {item.overallStatus === "submitted" ? "Pending Review" : item.overallStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenClassReview(item)}
                            type="button"
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition"
                          >
                            Review Results →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLASS INSPECTION & APPROVALS */}
      {activeTab === "classReview" && (
        <div className="space-y-6">
          {/* Class Filters & Authority Actions Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              {/* Class Level Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Class Level:
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="">Select Class Level</option>
                  {classLevels.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Program Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Program:
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="">All Programs</option>
                  {programs.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Term Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Academic Term:
                </label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="">Select Term</option>
                  {academicTerms.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Academic Year:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="">Select Year</option>
                  {academicYears.map((y) => (
                    <option key={y._id} value={y._id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submitting Class Teacher & Submission Audit Details */}
            {classReportCards.length > 0 && (
              <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800/80 dark:to-indigo-950/40 rounded-2xl p-4 border border-blue-200 dark:border-indigo-900/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    CT
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      Class Teacher Submission:{" "}
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {classReportCards.find((c) => c.submittedBy)?.submittedBy?.name || "Designated Class Teacher"}
                      </span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                      {classReportCards.find((c) => c.submittedAt)?.submittedAt
                        ? `Submitted to Admin on: ${new Date(classReportCards.find((c) => c.submittedAt)!.submittedAt!).toLocaleString()}`
                        : "Results compilation in progress by Class Teacher"}
                      {classReportCards.find((c) => c.resubmittedAt)?.resubmittedAt && (
                        <span className="ml-2 text-purple-600 dark:text-purple-400 font-semibold">
                          • Resubmitted: {new Date(classReportCards.find((c) => c.resubmittedAt)!.resubmittedAt!).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    Status: {overallClassStatus}
                  </span>
                </div>
              </div>
            )}

            {/* Admin Decision Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Overall Status:</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {overallClassStatus}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {classReportCards.length} students loaded
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Approve Button */}
                <button
                  onClick={handleApproveClass}
                  disabled={actionLoading || classReportCards.length === 0}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                >
                  <HiOutlineCheckBadge className="w-4 h-4" />
                  Approve Results
                </button>

                {/* Reject / Request Correction Button (Batch) */}
                <button
                  onClick={handleOpenBatchReject}
                  disabled={actionLoading || classReportCards.length === 0}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 transition disabled:opacity-50"
                >
                  <HiOutlineXCircle className="w-4 h-4" />
                  Reject All Submitted
                </button>

                {/* Publish All Eligible Button */}
                <button
                  onClick={handleBatchPublish}
                  disabled={actionLoading || classReportCards.length === 0}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
                >
                  <HiOutlineGlobeAlt className="w-4 h-4" />
                  Publish All Eligible Results
                </button>
              </div>
            </div>
          </div>

          {/* Students Ranking Review Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-bold uppercase text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 text-center">Pos</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-3 text-center">Marks</th>
                    <th className="py-3 px-3 text-center">Average %</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                    <th className="py-3 px-3 text-center">Review Status</th>
                    <th className="py-3 px-4">Promotion</th>
                    <th className="py-3 px-4">Principal's Endorsement</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {classReportCards.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400">
                        {loading
                          ? "Loading class results..."
                          : "No report cards found for this class. Select a class above to review."}
                      </td>
                    </tr>
                  ) : (
                    classReportCards.map((card) => {
                      const isPublished = card.published === true || card.status === "published";
                      const isReturned = card.status === "returned_for_correction";
                      const isResubmitted = card.status === "resubmitted";
                      const isSubmitted = card.status === "submitted_to_admin" || card.status === "submitted";

                      return (
                        <tr
                          key={card._id}
                          className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-center font-bold font-mono text-indigo-600 dark:text-indigo-400">
                            {card.positionFormatted || `${card.position}th`}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {card.student?.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                              <span className="font-mono text-gray-400">{card.studentID}</span>
                              {(card.program?.name || card.student?.program?.name) && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium text-[10px] border border-purple-200 dark:border-purple-800">
                                  {card.program?.name || card.student?.program?.name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-gray-800 dark:text-gray-200">
                            {card.totalScore}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                            {card.averageScore}%
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                              {card.overallGrade}
                            </span>
                          </td>

                          {/* Review Status Column */}
                          <td className="py-3.5 px-3 text-center">
                            {isPublished ? (
                              <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                Published
                              </span>
                            ) : isReturned ? (
                              <div>
                                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                                  Returned for Fix
                                </span>
                                {card.rejectionReason && (
                                  <div className="text-[10px] text-rose-600 dark:text-rose-400 italic max-w-[120px] truncate mx-auto mt-0.5" title={card.rejectionReason}>
                                    "{card.rejectionReason}"
                                  </div>
                                )}
                              </div>
                            ) : isResubmitted ? (
                              <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                                Resubmitted
                              </span>
                            ) : isSubmitted ? (
                              <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                                Submitted
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                {card.status || "Draft"}
                              </span>
                            )}
                          </td>

                          {/* Promotion Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                                card.promoted
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              }`}
                            >
                              {card.promotionStatus || (card.promoted ? "Promoted" : "Pending")}
                            </span>
                          </td>

                          {/* Principal Remark */}
                          <td className="py-3.5 px-4 max-w-xs truncate text-xs text-gray-600 dark:text-gray-300 italic">
                            "{card.principalComment || "Standard endorsement"}"
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Preview Full Report Card */}
                              <button
                                onClick={() => setPreviewCard(card)}
                                title="Inspect Full Report Card"
                                type="button"
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition"
                              >
                                <HiOutlineEye className="w-4 h-4" />
                              </button>

                              {/* Edit Principal Remark */}
                              <button
                                onClick={() => handleOpenEditAdminEvaluation(card)}
                                title="Edit Principal Remark & Promotion"
                                type="button"
                                className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 hover:bg-purple-100 transition"
                              >
                                <HiOutlinePencilSquare className="w-4 h-4" />
                              </button>

                              {/* Individual Publish / Unpublish Button */}
                              {isPublished ? (
                                <button
                                  onClick={() => handlePublishIndividual(card, false)}
                                  disabled={actionLoading}
                                  title="Unpublish this student's result"
                                  type="button"
                                  className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 border border-amber-300 dark:border-amber-700 transition"
                                >
                                  <HiOutlineGlobeAlt className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handlePublishIndividual(card, true)}
                                  disabled={actionLoading || isReturned}
                                  title={isReturned ? "Cannot publish returned result until corrected" : "Publish this student's result individually to portal"}
                                  type="button"
                                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-700 disabled:opacity-40 transition"
                                >
                                  <HiOutlineGlobeAlt className="w-4 h-4" />
                                </button>
                              )}

                              {/* Individual Reject Button */}
                              {!isPublished && (
                                <button
                                  onClick={() => handleOpenIndividualReject(card)}
                                  disabled={actionLoading}
                                  title="Return this student's result for correction"
                                  type="button"
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 transition"
                                >
                                  <HiOutlineXCircle className="w-4 h-4" />
                                </button>
                              )}

                              {/* Audit Trail & History Button */}
                              <button
                                onClick={() => handleOpenHistory(card)}
                                title="View Result Review & Publication Audit History"
                                type="button"
                                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition"
                              >
                                <HiOutlineClock className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Report Card Preview */}
      {previewCard && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setPreviewCard(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            <ReportCardDocument reportCard={previewCard} />
          </div>
        </div>
      )}

      {/* Modal: Edit Principal Remark & Promotion Status */}
      {editingCard && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setEditingCard(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Principal's Official Endorsement & Promotion
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Student: <span className="font-semibold text-gray-700 dark:text-gray-200">{editingCard.student?.name}</span> ({editingCard.studentID})
            </p>

            {/* Promotion Setting */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Promotion Status:
              </label>
              <select
                value={promotionStatusInput}
                onChange={(e) => {
                  setPromotionStatusInput(e.target.value);
                  setIsPromotedInput(e.target.value === "Promoted" || e.target.value === "Promoted on Trial");
                }}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
              >
                <option value="Promoted">Promoted</option>
                <option value="Promoted on Trial">Promoted on Trial</option>
                <option value="Repeat">Repeat</option>
                <option value="Pending">Pending Review</option>
              </select>
            </div>

            {/* Suggested Phrases */}
            <div className="mb-3">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Suggested Remarks:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickPrincipalComments.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrincipalCommentInput(p)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-purple-50 hover:text-purple-600 text-gray-700 dark:text-gray-300 text-left transition"
                  >
                    {p.slice(0, 35)}...
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={principalCommentInput}
              onChange={(e) => setPrincipalCommentInput(e.target.value)}
              placeholder="Enter official principal endorsement..."
              className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white mb-4"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAdminEvaluation}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Admin Rejection with Feedback Reason (Individual or Batch) */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setIsRejectModalOpen(false);
                setTargetCardForReject(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 mb-1">
              {targetCardForReject
                ? `Return ${targetCardForReject.student?.name}'s Result for Correction`
                : "Return All Submitted Results for Correction"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {targetCardForReject
                ? `Provide specific feedback for the class teacher regarding this student's result. Other students will remain unaffected.`
                : `Provide feedback explaining why results for the whole class are being returned to the class teacher.`}
            </p>

            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Mathematics test score is missing or needs recalculation..."
              className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white mb-4 outline-none focus:ring-2 focus:ring-rose-500"
              required
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setTargetCardForReject(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Confirm & Send to Teacher"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Audit & Review History Timeline */}
      {historyModalCard && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 relative shadow-2xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setHistoryModalCard(null);
                dispatch(clearReviewHistory());
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <HiOutlineClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Review & Publication Audit History
              </h3>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              Student: <span className="font-semibold text-gray-800 dark:text-gray-200">{historyModalCard.student?.name}</span> ({historyModalCard.studentID})
            </p>

            {/* Current Metadata Summary */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-xs mb-4">
              <div>
                <span className="text-gray-500 block">Current Status:</span>
                <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">
                  {historyModalCard.status}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Publicly Visible:</span>
                <span className={`font-bold ${historyModalCard.published ? "text-emerald-600" : "text-amber-600"}`}>
                  {historyModalCard.published ? "Yes (Published)" : "No (Restricted)"}
                </span>
              </div>
              {historyModalCard.rejectionReason && (
                <div className="col-span-2 pt-1 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-rose-600 font-semibold block">Latest Return Feedback:</span>
                  <p className="text-gray-700 dark:text-gray-300 italic mt-0.5">
                    "{historyModalCard.rejectionReason}"
                  </p>
                </div>
              )}
            </div>

            {/* Chronological Audit Timeline */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                Workflow Timeline
              </span>
              {activeReviewHistory?.reviewHistory && activeReviewHistory.reviewHistory.length > 0 ? (
                activeReviewHistory.reviewHistory.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="capitalize text-indigo-600 dark:text-indigo-400">
                        {item.action?.replace(/_/g, " ")}
                      </span>
                      <span className="text-gray-400 text-[11px]">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : ""}
                      </span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 text-[11px] mt-1">
                      By: {item.performedBy?.name || "System"} ({item.role || "User"})
                    </div>
                    {item.notes && (
                      <div className="mt-1.5 p-2 bg-white dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-[11px]">
                        "{item.notes}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs">
                  No previous review events recorded for this report card.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setHistoryModalCard(null);
                  dispatch(clearReviewHistory());
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
