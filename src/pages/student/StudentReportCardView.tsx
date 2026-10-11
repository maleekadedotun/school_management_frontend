import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchStudentPublishedReportCards,
  fetchStudentTermReportCard,
} from "../../features/reportCards/reportCardsSlice";
import { ReportCardDocument } from "../../components/reportCard/ReportCardDocument";
import {
  HiOutlineLockClosed,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineCalendar,
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

export default function StudentReportCardView() {
  const dispatch = useAppDispatch();
  const {
    studentPublishedCards,
    studentActiveReportCard,
    studentLoading,
  } = useAppSelector((state) => state.reportCards);

  const [selectedTermId, setSelectedTermId] = useState<string>("");

  useEffect(() => {
    dispatch(fetchStudentPublishedReportCards());
  }, [dispatch]);

  // When published cards load, default to the most recent one
  useEffect(() => {
    if (studentPublishedCards.length > 0 && !selectedTermId) {
      const first = studentPublishedCards[0];
      const termId = first.academicTerm?._id || "";
      setSelectedTermId(termId);
    }
  }, [studentPublishedCards, selectedTermId]);

  const handleSelectTerm = (termId: string) => {
    setSelectedTermId(termId);
    dispatch(fetchStudentTermReportCard({ termId }));
  };

  const handleRefresh = () => {
    dispatch(fetchStudentPublishedReportCards());
    if (selectedTermId) {
      dispatch(fetchStudentTermReportCard({ termId: selectedTermId }));
    }
  };

  return (
    <div className="min-h-screen pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Page Header (hidden during print) */}
      <div className="no-print pt-6 pb-6 border-b border-gray-200 dark:border-gray-800 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-2">
              <HiOutlineSparkles className="w-3.5 h-3.5 text-indigo-500" />
              Academic Evaluation & Records
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              My Term Report Card
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Access and download your verified term report cards, subject scores, and teacher endorsements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={studentLoading}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <HiOutlineArrowPath className={`w-4 h-4 ${studentLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Term Switcher (if multiple published terms exist) */}
        {studentPublishedCards.length > 1 && (
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2 flex items-center gap-1">
              <HiOutlineCalendar className="w-4 h-4" /> Available Terms:
            </span>
            {studentPublishedCards.map((card) => {
              const termId = card.academicTerm?._id || "";
              const isSelected = selectedTermId === termId;
              return (
                <button
                  key={card._id}
                  onClick={() => handleSelectTerm(termId)}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {card.academicTerm?.name || "Term"} ({card.academicYear?.name || ""})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {studentLoading && !studentActiveReportCard ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Retrieving Report Card...</h3>
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
            Your official term report card is currently undergoing verification and administrative review. In accordance with school policy, results are only accessible after full principal approval and publication.
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
              <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700 ml-1 mr-1" /> 3. Principal approval & official release to students
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleRefresh}
              type="button"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition"
            >
              <HiOutlineArrowPath className="w-4 h-4" />
              Check Again
            </button>
          </div>
        </div>
      ) : studentActiveReportCard ? (
        /* Render Verified Official Report Card Document */
        <div>
          <ReportCardDocument reportCard={studentActiveReportCard} />
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          Please select an academic term above to view your report card.
        </div>
      )}
    </div>
  );
}
