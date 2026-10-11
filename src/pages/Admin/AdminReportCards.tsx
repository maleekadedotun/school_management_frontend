import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchAdminReportCardOverview,
  fetchClassReportCards,
  approveClassReportCards,
  rejectClassReportCards,
  publishClassReportCards,
  updateAdminComment,
  type ReportCardItem,
  type AdminReportCardOverviewItem,
} from "../../features/reportCards/reportCardsSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
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
} from "react-icons/hi2";

export default function AdminReportCards() {
  const dispatch = useAppDispatch();
  const {
    adminSummaries,
    classReportCards,
    loading,
    actionLoading,
  } = useAppSelector((state) => state.reportCards);

  const { items: academicYears } = useAppSelector((state) => state.academicYears);
  const { items: academicTerms } = useAppSelector((state) => state.academicTerms);
  const { items: classLevels } = useAppSelector((state) => state.classLevels);

  // Active Tab: "overview" | "classReview"
  const [activeTab, setActiveTab] = useState<"overview" | "classReview">("overview");

  // Selection state
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  // Modals
  const [previewCard, setPreviewCard] = useState<ReportCardItem | null>(null);
  const [editingCard, setEditingCard] = useState<ReportCardItem | null>(null);
  const [principalCommentInput, setPrincipalCommentInput] = useState<string>("");
  const [promotionStatusInput, setPromotionStatusInput] = useState<string>("Promoted");
  const [isPromotedInput, setIsPromotedInput] = useState<boolean>(true);

  // Rejection Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Notification Banner
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAcademicTerms());
    dispatch(fetchClassLevels());
    dispatch(fetchAdminReportCardOverview({}));
  }, [dispatch]);

  // Load class report cards when review tab is active and class is selected
  useEffect(() => {
    if (selectedClass) {
      dispatch(
        fetchClassReportCards({
          classLevelId: selectedClass,
          academicYearId: selectedYear || undefined,
          academicTermId: selectedTerm || undefined,
        })
      );
    }
  }, [dispatch, selectedClass, selectedYear, selectedTerm]);

  const handleOpenClassReview = (item: AdminReportCardOverviewItem) => {
    setSelectedClass(item.classLevelId);
    setSelectedYear(item.academicYearId);
    setSelectedTerm(item.academicTermId);
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
      })
    );
    if (approveClassReportCards.fulfilled.match(res)) {
      setAlertMsg({ text: res.payload?.message || "Class report cards approved!", type: "success" });
      dispatch(fetchAdminReportCardOverview({}));
      dispatch(fetchClassReportCards({ classLevelId: selectedClass, academicYearId: selectedYear, academicTermId: selectedTerm }));
    } else {
      setAlertMsg({ text: (res.payload as string) || "Failed to approve report cards.", type: "error" });
    }
  };

  const handleRejectClass = async () => {
    if (!selectedClass || !selectedYear || !selectedTerm) return;
    setAlertMsg(null);
    const res = await dispatch(
      rejectClassReportCards({
        classLevelId: selectedClass,
        academicYearId: selectedYear,
        academicTermId: selectedTerm,
        rejectionReason: rejectionReason.trim() || "Adjustments required by administrator.",
      })
    );
    setIsRejectModalOpen(false);
    setRejectionReason("");
    if (rejectClassReportCards.fulfilled.match(res)) {
      setAlertMsg({ text: res.payload?.message || "Report cards returned to teacher for corrections.", type: "success" });
      dispatch(fetchAdminReportCardOverview({}));
      dispatch(fetchClassReportCards({ classLevelId: selectedClass, academicYearId: selectedYear, academicTermId: selectedTerm }));
    } else {
      setAlertMsg({ text: (res.payload as string) || "Failed to return report cards.", type: "error" });
    }
  };

  const handleTogglePublish = async (publish: boolean) => {
    if (!selectedClass || !selectedYear || !selectedTerm) return;
    const confirm = window.confirm(
      publish
        ? "Publish results officially to students? Students will immediately be able to view and download their report cards."
        : "Unpublish results? Students will no longer be able to access their report cards."
    );
    if (!confirm) return;

    setAlertMsg(null);
    const res = await dispatch(
      publishClassReportCards({
        classLevelId: selectedClass,
        academicYearId: selectedYear,
        academicTermId: selectedTerm,
        publish,
      })
    );
    if (publishClassReportCards.fulfilled.match(res)) {
      setAlertMsg({ text: res.payload?.message || "Publication status updated successfully!", type: "success" });
      dispatch(fetchAdminReportCardOverview({}));
      dispatch(fetchClassReportCards({ classLevelId: selectedClass, academicYearId: selectedYear, academicTermId: selectedTerm }));
    } else {
      setAlertMsg({ text: (res.payload as string) || "Failed to update publication status.", type: "error" });
    }
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
              onClick={() => {
                dispatch(fetchAdminReportCardOverview({}));
                if (selectedClass) {
                  dispatch(
                    fetchClassReportCards({
                      classLevelId: selectedClass,
                      academicYearId: selectedYear || undefined,
                      academicTermId: selectedTerm || undefined,
                    })
                  );
                }
              }}
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
                      <td colSpan={7} className="py-12 text-center text-gray-400">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

            {/* Admin Decision Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Status:</span>
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

                {/* Reject / Request Correction Button */}
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={actionLoading || classReportCards.length === 0}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 transition disabled:opacity-50"
                >
                  <HiOutlineXCircle className="w-4 h-4" />
                  Reject / Request Fix
                </button>

                {/* Publish to Students Button */}
                {overallClassStatus !== "published" ? (
                  <button
                    onClick={() => handleTogglePublish(true)}
                    disabled={actionLoading || classReportCards.length === 0}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
                  >
                    <HiOutlineGlobeAlt className="w-4 h-4" />
                    Publish to Students
                  </button>
                ) : (
                  <button
                    onClick={() => handleTogglePublish(false)}
                    disabled={actionLoading}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition"
                  >
                    Unpublish
                  </button>
                )}
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
                    <th className="py-3 px-4">Promotion</th>
                    <th className="py-3 px-4">Principal's Endorsement</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {classReportCards.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        {loading
                          ? "Loading class results..."
                          : "No report cards found for this class. Select a class above to review."}
                      </td>
                    </tr>
                  ) : (
                    classReportCards.map((card) => (
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
                          <div className="text-[11px] font-mono text-gray-400">
                            {card.studentID}
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
                        <td className="py-3.5 px-4 max-w-xs truncate text-xs text-gray-600 dark:text-gray-300 italic">
                          "{card.principalComment || "Standard endorsement"}"
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setPreviewCard(card)}
                              title="Inspect Full Report Card"
                              type="button"
                              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition"
                            >
                              <HiOutlineEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditAdminEvaluation(card)}
                              title="Edit Principal Remark & Promotion"
                              type="button"
                              className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 hover:bg-purple-100 transition"
                            >
                              <HiOutlinePencilSquare className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Modal: Admin Rejection with Feedback Reason */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsRejectModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 mb-1">
              Return Results to Teacher for Correction
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Provide specific feedback explaining why the results are rejected and what the teacher must adjust.
            </p>

            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Mathematics total mark was miscalculated, or student STU002 requires remark adjustment..."
              className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white mb-4"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectClass}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition"
              >
                Confirm & Send to Teacher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
