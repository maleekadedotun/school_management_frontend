import { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchStudentPublishedReportCards,
  fetchStudentTermReportCard,
  type ReportCardItem,
} from "../../features/reportCards/reportCardsSlice";
import { fetchStudentProfile, fetchStudentEnrolledSubjects } from "../../features/students/studentsSlice";
import { fetchParentDashboard } from "../../features/parentAuth/parentAuthSlice";
import { ReportCardDocument } from "../../components/reportCard/ReportCardDocument";
import {
  HiOutlineLockClosed,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineCalendar,
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
  HiOutlineUser,
  HiOutlineArrowLeft,
  HiOutlineExclamationTriangle,
  HiOutlineEye,
  HiOutlineDocumentText,
  HiOutlineTableCells,
  HiOutlineTrophy,
} from "react-icons/hi2";

export default function StudentReportCardView() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    studentPublishedCards,
    studentActiveReportCard,
    studentLoading,
  } = useAppSelector((state) => state.reportCards);

  const { parent, dashboardData } = useAppSelector((state) => state.parentAuth);

  const isParent = useMemo(() => {
    return (
      location.pathname.startsWith("/parent") ||
      localStorage.getItem("userRole") === "parent" ||
      Boolean(parent)
    );
  }, [location.pathname, parent]);

  const children = useMemo(() => {
    const list = dashboardData?.children || parent?.children || [];
    return list;
  }, [dashboardData, parent]);

  const [selectedChildId, setSelectedChildId] = useState<string>(() => {
    return searchParams.get("studentId") || "";
  });

  const [selectedTermId, setSelectedTermId] = useState<string>(() => {
    return searchParams.get("termId") || "";
  });

  const [selectedCardId, setSelectedCardId] = useState<string>(() => {
    return searchParams.get("cardId") || "";
  });

  // View Mode: "table" (Table / Div Overview list) vs "report" (Full Report Card Document)
  const [viewMode, setViewMode] = useState<"table" | "report">(() => {
    return searchParams.get("termId") ? "report" : "table";
  });

  // If parent and no children data yet, fetch parent dashboard
  useEffect(() => {
    if (isParent && (!children || children.length === 0)) {
      dispatch(fetchParentDashboard());
    }
  }, [isParent, children, dispatch]);

  // If parent and no selected child, pick the first one
  useEffect(() => {
    if (isParent && children.length > 0 && !selectedChildId) {
      const firstId = children[0]._id;
      setSelectedChildId(firstId);
    }
  }, [isParent, children, selectedChildId]);

  // Fetch published cards whenever selectedChildId (for parents) or on mount (for students)
  useEffect(() => {
    if (isParent) {
      if (selectedChildId) {
        dispatch(fetchStudentPublishedReportCards({ studentId: selectedChildId }));
        dispatch(fetchParentDashboard());
      }
    } else {
      dispatch(fetchStudentPublishedReportCards());
      dispatch(fetchStudentProfile());
      dispatch(fetchStudentEnrolledSubjects());
    }
  }, [dispatch, isParent, selectedChildId]);

  // Sync selected term card if termId is specified in searchParams or when switching cards
  useEffect(() => {
    if (studentPublishedCards.length > 0) {
      const paramTermId = searchParams.get("termId");
      const paramCardId = searchParams.get("cardId");
      if (paramTermId) {
        setSelectedTermId(paramTermId);
        if (paramCardId) setSelectedCardId(paramCardId);
        setViewMode("report");
        const matchedCard =
          (paramCardId && studentPublishedCards.find((c) => c._id === paramCardId)) ||
          studentPublishedCards.find(
            (c) => (c.academicTerm?._id || (c.academicTerm as any)) === paramTermId
          );
        dispatch(
          fetchStudentTermReportCard({
            termId: paramTermId,
            academicYearId: matchedCard?.academicYear?._id,
            classLevelId: matchedCard?.classLevel?._id || (matchedCard?.classLevel as any),
            reportCardId: paramCardId || matchedCard?._id,
            studentId: isParent ? selectedChildId : undefined,
          })
        );
      } else if (!selectedTermId) {
        // Prepare first term id in background
        setSelectedTermId(studentPublishedCards[0].academicTerm?._id || "");
        setSelectedCardId(studentPublishedCards[0]._id || "");
      }
    }
  }, [studentPublishedCards, isParent, selectedChildId, searchParams, dispatch]);

  const selectedPublishedCard = useMemo(() => {
    if (selectedCardId) {
      const byId = studentPublishedCards.find((c) => c._id === selectedCardId);
      if (byId) return byId;
    }
    if (!selectedTermId) return studentPublishedCards[0] || null;
    return (
      studentPublishedCards.find(
        (c) => (c.academicTerm?._id || (c.academicTerm as any)) === selectedTermId
      ) ||
      studentPublishedCards[0] ||
      null
    );
  }, [studentPublishedCards, selectedTermId, selectedCardId]);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    setSelectedTermId("");
    setSelectedCardId("");
    setViewMode("table");
    setSearchParams({ studentId: childId });
    dispatch(fetchStudentPublishedReportCards({ studentId: childId }));
  };

  const handleReviewReportCard = (card: ReportCardItem) => {
    const termId = card.academicTerm?._id || "";
    const cardId = card._id || "";
    const classLevelId = card.classLevel?._id || (typeof card.classLevel === "string" ? card.classLevel : undefined);
    setSelectedTermId(termId);
    setSelectedCardId(cardId);
    setViewMode("report");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (termId) next.set("termId", termId);
      if (cardId) next.set("cardId", cardId);
      return next;
    });
    dispatch(
      fetchStudentTermReportCard({
        termId,
        academicYearId: card.academicYear?._id,
        classLevelId,
        reportCardId: cardId || undefined,
        studentId: isParent ? selectedChildId : undefined,
      })
    );
  };

  const handleBackToTable = () => {
    setViewMode("table");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("termId");
      next.delete("cardId");
      return next;
    });
  };

  const handleSelectTermFromSwitcher = (termId: string, card?: ReportCardItem) => {
    const targetCard =
      card ||
      studentPublishedCards.find(
        (c) => (c.academicTerm?._id || (c.academicTerm as any)) === termId
      );
    const cardId = targetCard?._id || "";
    const classLevelId = targetCard?.classLevel?._id || (typeof targetCard?.classLevel === "string" ? targetCard.classLevel : undefined);
    setSelectedTermId(termId);
    if (cardId) setSelectedCardId(cardId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("termId", termId);
      if (cardId) next.set("cardId", cardId);
      return next;
    });
    dispatch(
      fetchStudentTermReportCard({
        termId,
        academicYearId: targetCard?.academicYear?._id,
        classLevelId,
        reportCardId: cardId || undefined,
        studentId: isParent ? selectedChildId : undefined,
      })
    );
  };

  const handleRefresh = () => {
    dispatch(
      fetchStudentPublishedReportCards(
        isParent && selectedChildId ? { studentId: selectedChildId } : undefined
      )
    );
    if (selectedTermId) {
      dispatch(
        fetchStudentTermReportCard({
          termId: selectedTermId,
          academicYearId: selectedPublishedCard?.academicYear?._id,
          classLevelId: selectedPublishedCard?.classLevel?._id || (typeof selectedPublishedCard?.classLevel === "string" ? selectedPublishedCard.classLevel : undefined),
          reportCardId: selectedCardId || selectedPublishedCard?._id,
          studentId: isParent ? selectedChildId : undefined,
        })
      );
    }
  };

  const activeChildObj = children.find((c) => c._id === selectedChildId);

  // Grade badge styling helper
  const getGradeBadge = (grade?: string | number) => {
    const g = String(grade || "").toUpperCase();
    if (g.startsWith("A") || g === "EXCELLENT") {
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
    }
    if (g.startsWith("B") || g === "VERY GOOD") {
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800";
    }
    if (g.startsWith("C") || g === "GOOD") {
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800";
    }
    if (g.startsWith("D") || g === "FAIR") {
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800";
    }
    return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800";
  };

  return (
    <div className="min-h-screen pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Page Header (hidden during print) */}
      <div className="no-print pt-6 pb-6 border-b border-gray-200 dark:border-gray-800 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-2">
              <HiOutlineSparkles className="w-3.5 h-3.5 text-indigo-500" />
              {isParent ? "Parent Observer • Academic Evaluation" : "Academic Evaluation & Records"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {isParent
                ? `${activeChildObj?.name ? `${activeChildObj.name}'s` : "Student"} Term Report Cards`
                : "My Term Report Cards"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isParent
                ? "Official verified academic term evaluations, scores, teacher endorsements, and promotions."
                : "Review your verified term report cards, academic year performance, and teacher evaluations."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isParent && (
              <Link
                to="/parent/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <HiOutlineArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            )}
            <button
              onClick={handleRefresh}
              disabled={studentLoading}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
            >
              <HiOutlineArrowPath className={`w-4 h-4 ${studentLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Multi-Child Selector for Parents */}
        {isParent && children.length > 0 && (
          <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <HiOutlineUser className="w-4 h-4 text-indigo-500" />
              <span>Select Child:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {children.map((c) => {
                const isSelected = selectedChildId === c._id;
                return (
                  <button
                    key={c._id}
                    onClick={() => handleSelectChild(c._id)}
                    type="button"
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-500/40"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{c.name}</span>
                    {c.currentClassLevel && (
                      <span className="text-[10px] opacity-75">
                        ({c.currentClassLevel})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Tabs (Table Overview vs Full Report Card Document) */}
        {studentPublishedCards.length > 0 && (
          <div className="mt-6 flex items-center justify-between flex-wrap gap-3 border-b border-gray-200 dark:border-gray-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center gap-2 pb-2.5 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
                  viewMode === "table"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <HiOutlineTableCells className="w-4 h-4" />
                Published Results Overview ({studentPublishedCards.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  if (studentActiveReportCard || selectedTermId) {
                    setViewMode("report");
                  } else if (studentPublishedCards.length > 0) {
                    handleReviewReportCard(studentPublishedCards[0]);
                  }
                }}
                className={`inline-flex items-center gap-2 pb-2.5 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
                  viewMode === "report"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <HiOutlineDocumentText className="w-4 h-4" />
                Report Card Document
                {selectedPublishedCard?.academicTerm?.name && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {selectedPublishedCard.academicTerm.name}
                  </span>
                )}
              </button>
            </div>

            {viewMode === "report" && (
              <button
                type="button"
                onClick={handleBackToTable}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
              >
                <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                Back to All Results
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {studentLoading && !studentActiveReportCard && studentPublishedCards.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Retrieving Report Cards...</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Verifying official administrative publication.</p>
        </div>
      ) : studentPublishedCards.length === 0 ? (
        /* Unpublished / Empty State */
        <div className="max-w-2xl mx-auto py-16 px-6 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 shadow-inner">
            <HiOutlineLockClosed className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Report Card Not Published Yet
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 max-w-lg mx-auto leading-relaxed">
            {isParent
              ? `The official report card for ${activeChildObj?.name || "this student"} is currently undergoing compilation and administrative review. Results become available immediately upon principal approval and publication.`
              : "Your official term report card is currently undergoing verification and administrative review. In accordance with school policy, results are only accessible after full principal approval and publication."}
          </p>

          <div className="mt-8 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 text-left text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <div className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <HiOutlineAcademicCap className="w-4 h-4 text-indigo-500" />
              Evaluation Workflow Progress:
            </div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <HiOutlineCheckCircle className="w-4 h-4" /> 1. Subject scores entered by subject teachers
            </div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse ml-1 mr-1" /> 2. Class rankings calculated & submitted to administration
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700 ml-1 mr-1" /> 3. Principal approval & official release to students and parents
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleRefresh}
              type="button"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition cursor-pointer"
            >
              <HiOutlineArrowPath className="w-4 h-4" />
              Check Again
            </button>
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE & DIV FORMAT: Academic Term, Academic Year, Class, and Review Action */
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <HiOutlineCalendar className="w-4 h-4 text-indigo-500" />
                <span>Published Terms</span>
              </div>
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {studentPublishedCards.length}
              </span>
              <span className="block text-[10px] text-gray-400 mt-0.5">
                Evaluated terms on record
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <HiOutlineSparkles className="w-4 h-4 text-purple-500" />
                <span>Latest Average</span>
              </div>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {studentPublishedCards[0]?.averageScore !== null && studentPublishedCards[0]?.averageScore !== undefined
                  ? `${studentPublishedCards[0].averageScore}%`
                  : "—"}
              </span>
              <span className="block text-[10px] text-gray-400 mt-0.5">
                Grade: {studentPublishedCards[0]?.overallGrade || "—"}
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <HiOutlineAcademicCap className="w-4 h-4 text-emerald-500" />
                <span>Class Level</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate block">
                {studentPublishedCards[0]?.classLevel?.name || studentPublishedCards[0]?.student?.currentClassLevel || "Class"}
              </span>
              <span className="block text-[10px] text-gray-400 mt-0.5">
                Current academic grade
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <HiOutlineTrophy className="w-4 h-4 text-amber-500" />
                <span>Latest Position</span>
              </div>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {studentPublishedCards[0]?.positionFormatted || (studentPublishedCards[0]?.position ? `${studentPublishedCards[0].position}` : "—")}
              </span>
              <span className="block text-[10px] text-gray-400 mt-0.5">
                of {studentPublishedCards[0]?.totalStudents || "cohort"}
              </span>
            </div>
          </div>

          {/* SECTION HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Verified Term Report Cards</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {studentPublishedCards.length} Available
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Select any academic term and click <strong>Review</strong> to inspect the full subject scores, teacher remark, and printable document.
              </p>
            </div>
          </div>

          {/* 1. DESKTOP TABLE FORMAT (Clean, elegant, responsive) */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-bold uppercase text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-5">Academic Term</th>
                    <th className="py-3.5 px-5">Academic Year</th>
                    <th className="py-3.5 px-5">Class</th>
                    <th className="py-3.5 px-4 text-center">Average Score</th>
                    <th className="py-3.5 px-4 text-center">Grade</th>
                    <th className="py-3.5 px-4 text-center">Class Position</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {studentPublishedCards.map((card, idx) => {
                    const isOfficiallyPublished = card.published === true && card.status === "published";
                    const isCardBlurred = Boolean(
                      card.isBlurred ||
                      !isOfficiallyPublished ||
                      card.status === "returned_for_correction" ||
                      (!isOfficiallyPublished && (card as any).isUnderCorrection)
                    );
                    const isCurrent = selectedTermId === (card.academicTerm?._id || card.academicTerm);

                    return (
                      <tr
                        key={card._id || idx}
                        className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors ${
                          isCurrent ? "bg-indigo-50/30 dark:bg-indigo-950/30" : ""
                        }`}
                      >
                        <td className="py-4 px-4 text-gray-400 font-mono text-xs font-bold">
                          {idx + 1}
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 border border-indigo-200 dark:border-indigo-800">
                              <HiOutlineCalendar className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-extrabold text-gray-900 dark:text-white block text-sm">
                                {card.academicTerm?.name || "Term"}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                {card.overallRemark || "Academic Standing"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                            {card.academicYear?.name || "Academic Year"}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 font-bold text-gray-900 dark:text-white text-xs">
                            <HiOutlineAcademicCap className="w-4 h-4 text-emerald-500" />
                            {card.classLevel?.name || card.student?.currentClassLevel || "Class"}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="font-black text-sm text-indigo-700 dark:text-indigo-400">
                            {card.averageScore !== null && card.averageScore !== undefined
                              ? `${card.averageScore}%`
                              : "—"}
                          </span>
                          {card.totalScore !== undefined && (
                            <span className="block text-[10px] text-gray-400">
                              Total: {card.totalScore}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-extrabold border ${getGradeBadge(
                              card.overallGrade
                            )}`}
                          >
                            {card.overallGrade || "—"}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="font-mono font-bold text-gray-900 dark:text-white text-xs">
                            {card.positionFormatted || (card.position ? `${card.position}` : "—")}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          {isCardBlurred ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                              Under Review
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                              <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              Official
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleReviewReportCard(card)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-1 ring-white/20"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. MOBILE DIV FORMAT (Stacked responsive modern cards) */}
          <div className="md:hidden space-y-4">
            {studentPublishedCards.map((card, idx) => {
              const isOfficiallyPublished = card.published === true && card.status === "published";
              const isCardBlurred = Boolean(
                card.isBlurred ||
                !isOfficiallyPublished ||
                card.status === "returned_for_correction" ||
                (!isOfficiallyPublished && (card as any).isUnderCorrection)
              );

              return (
                <div
                  key={card._id || idx}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-200 dark:border-indigo-800">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                          {card.academicTerm?.name || "Term"}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <span className="font-medium">{card.academicYear?.name || "Academic Year"}</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {card.classLevel?.name || card.student?.currentClassLevel || "Class"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCardBlurred ? (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                          Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                          <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          Official
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl text-center border border-gray-100 dark:border-gray-800">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                        Average
                      </span>
                      <span className="text-sm font-black text-indigo-700 dark:text-indigo-400 mt-0.5 block">
                        {card.averageScore !== null && card.averageScore !== undefined
                          ? `${card.averageScore}%`
                          : "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                        Grade
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold mt-0.5 border ${getGradeBadge(
                          card.overallGrade
                        )}`}
                      >
                        {card.overallGrade || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                        Position
                      </span>
                      <span className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                        {card.positionFormatted || (card.position ? `${card.position}` : "—")}
                      </span>
                    </div>
                  </div>

                  {/* Review Action Button */}
                  <button
                    type="button"
                    onClick={() => handleReviewReportCard(card)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 transition cursor-pointer"
                  >
                    <HiOutlineEye className="w-4 h-4" />
                    Review Report Card
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* REPORT CARD DOCUMENT VIEW (Active when reviewing a specific term card) */
        <div className="space-y-6">
          {/* Navigation & Controls Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToTable}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition cursor-pointer"
              >
                <HiOutlineArrowLeft className="w-4 h-4" />
                Back to All Results
              </button>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

              <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HiOutlineCalendar className="w-4 h-4 text-indigo-500" />
                <span>
                  Viewing: <strong>{selectedPublishedCard?.academicTerm?.name || "Term"}</strong> ({selectedPublishedCard?.academicYear?.name})
                </span>
              </span>
            </div>

            {/* Quick Switcher across published terms */}
            {studentPublishedCards.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                  Switch Term:
                </span>
                <div className="flex items-center gap-1.5">
                  {studentPublishedCards.map((c) => {
                    const cTermId = c.academicTerm?._id || "";
                    const isCurrent = selectedCardId ? selectedCardId === c._id : selectedTermId === cTermId;
                    return (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => handleSelectTermFromSwitcher(cTermId, c)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isCurrent
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {c.academicTerm?.name || "Term"}{c.classLevel?.name ? ` (${c.classLevel.name})` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Loading or Document Container */}
          {studentLoading && !studentActiveReportCard && !selectedPublishedCard ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-10 h-10 mx-auto mb-3 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Loading official report card document...
              </p>
            </div>
          ) : (
            (() => {
              const activeCard = studentActiveReportCard || selectedPublishedCard;
              if (!activeCard) {
                return (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500">Please select an academic term from the results table.</p>
                  </div>
                );
              }

              const isOfficiallyPublished = activeCard.published === true && activeCard.status === "published";
              const isCardBlurred = Boolean(
                activeCard.isBlurred ||
                !isOfficiallyPublished ||
                activeCard.status === "returned_for_correction" ||
                (!isOfficiallyPublished && (activeCard as any).isUnderCorrection)
              );
              const correctionReason = (activeCard as any).correctionReason;

              if (isCardBlurred) {
                return (
                  <div className="relative space-y-6">
                    {/* Floating Glassmorphism Alert Banner */}
                    <div className="rounded-3xl bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-amber-600/90 backdrop-blur-xl text-white p-6 shadow-2xl border border-amber-300/40 animate-pulse">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl shrink-0 mt-0.5">
                          <HiOutlineExclamationTriangle className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="font-extrabold text-lg tracking-wide flex items-center gap-2">
                              <span>Result Withheld for Correction</span>
                              <span className="text-xs px-3 py-1 rounded-full bg-black/30 font-black uppercase tracking-wider border border-white/20">
                                Temporarily Blurred
                              </span>
                            </h4>
                          </div>
                          <p className="text-sm text-amber-50 leading-relaxed font-medium">
                            {isParent
                              ? "This academic report card has been unpublished by school administration for score review and correction. The report card details are temporarily blurred pending teacher adjustments and administrator re-approval."
                              : "Your academic report card has been unpublished by school administration for score review and correction. The document and grades are temporarily blurred pending teacher adjustments and administrator re-approval."}
                          </p>
                          {correctionReason && (
                            <div className="text-xs bg-black/25 rounded-xl p-3 border border-white/10 text-amber-100">
                              <span className="font-bold text-amber-300">Administration Note:</span> {correctionReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Blurred Document Container */}
                    <div className="filter blur-md opacity-40 select-none pointer-events-none transition-all duration-500 rounded-2xl overflow-hidden">
                      <ReportCardDocument reportCard={activeCard} showPrintButton={false} />
                    </div>
                  </div>
                );
              }

              return (
                <div>
                  <ReportCardDocument reportCard={activeCard} />
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}
