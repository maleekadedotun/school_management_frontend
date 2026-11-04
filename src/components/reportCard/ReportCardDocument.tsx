import React from "react";
import { type ReportCardItem } from "../../features/reportCards/reportCardsSlice";
import {
  HiOutlineAcademicCap,
  HiOutlineCheckBadge,
  HiOutlineTrophy,
  HiOutlinePrinter,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineIdentification,
  HiCheck,
} from "react-icons/hi2";

export interface ReportCardDocumentProps {
  reportCard: ReportCardItem;
  schoolName?: string;
  schoolMotto?: string;
  schoolAddress?: string;
  schoolLogo?: string;
  onPrint?: () => void;
  showPrintButton?: boolean;
}

/**
 * Identifies if a term document or name represents the Third Term / Final Term
 */
export const isThirdTerm = (termDocOrName?: any): boolean => {
  if (!termDocOrName) return false;
  const name = (
    typeof termDocOrName === "string" ? termDocOrName : termDocOrName.name || ""
  ).trim().toLowerCase();
  return (
    name.includes("3rd") ||
    name.includes("third") ||
    name.includes("term 3") ||
    name.includes("term3") ||
    name.includes("final")
  );
};

// Existing grading scale helpers
const getThirdTermGrade = (percentage: number): string => {
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
};

const getThirdTermRemark = (percentage: number): string => {
  if (percentage >= 80) return "Excellent";
  if (percentage >= 70) return "Very Good";
  if (percentage >= 60) return "Good";
  if (percentage >= 40) return "Fair";
  return "Poor";
};

const getThirdTermEvaluation = (average: number): { grade: string; remark: string } => {
  if (average >= 80) return { grade: "A", remark: "Distinction - Outstanding Performance" };
  if (average >= 70) return { grade: "B", remark: "Very Good - Commendable Result" };
  if (average >= 60) return { grade: "C", remark: "Good - Satisfactory Progress" };
  if (average >= 50) return { grade: "D", remark: "Fair - Needs More Dedication" };
  return { grade: "F", remark: "Poor - Needs Academic Intervention" };
};

export const ReportCardDocument: React.FC<ReportCardDocumentProps> = ({
  reportCard,
  schoolName = "ACADEMIA INTERNATIONAL HIGH SCHOOL",
  schoolMotto = "Excellence, Knowledge & Integrity",
  schoolAddress = "124 Scholars Boulevard, Education District, Global Campus",
  schoolLogo,
  onPrint,
  showPrintButton = true,
}) => {
  const {
    student,
    studentID,
    academicYear,
    academicTerm,
    classLevel,
    subjectResults = [],
    totalScore,
    averageScore,
    positionFormatted,
    position,
    totalStudents,
    overallGrade,
    overallRemark,
    teacherComment,
    principalComment,
    promoted,
    promotionStatus,
    published,
  } = reportCard;

  const isThirdTermCard =
    reportCard.isThirdTerm === true || isThirdTerm(academicTerm);

  // 1. Resolve Class Teacher Signature Info
  // The report card is signed by the Class Teacher ONLY once published / pushed to Admin.
  // Until published to Admin (draft, calculated, saved, ready, or returned for correction), it remains unsigned.
  const isTeacherSubmittedToAdmin = Boolean(
    !reportCard.isUnderCorrection &&
    !["draft", "calculated", "saved", "ready", "returned_for_correction", "rejected"].includes(reportCard.status || "") &&
    (
      reportCard.isTeacherPublished === true ||
      Boolean(reportCard.submittedAt) ||
      Boolean(reportCard.resubmittedAt) ||
      ["submitted", "submitted_to_admin", "resubmitted", "approved", "published"].includes(reportCard.status || "")
    )
  );

  const teacherSignerName =
    (typeof reportCard.submittedBy === "object" && reportCard.submittedBy?.name) ||
    (typeof reportCard.resubmittedBy === "object" && reportCard.resubmittedBy?.name) ||
    (typeof (reportCard as any).teacherPublishedBy === "object" && (reportCard as any).teacherPublishedBy?.name) ||
    reportCard.reviewHistory?.find((h) => h.action === "submitted" || h.action === "resubmitted")?.performerName ||
    (typeof (reportCard as any).classTeacher === "object" && (reportCard as any).classTeacher?.name) ||
    (typeof (reportCard as any).classTeacher === "string" ? (reportCard as any).classTeacher : null) ||
    "Class Form Teacher";

  const teacherSignDate = isTeacherSubmittedToAdmin
    ? reportCard.submittedAt || reportCard.resubmittedAt || (reportCard as any).teacherPublishedAt
      ? new Date(
          reportCard.submittedAt || reportCard.resubmittedAt || (reportCard as any).teacherPublishedAt!
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : reportCard.reviewHistory?.find((h) => h.action === "submitted" || h.action === "resubmitted")?.timestamp
      ? new Date(
          reportCard.reviewHistory.find((h) => h.action === "submitted" || h.action === "resubmitted")!.timestamp
        ).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      : reportCard.updatedAt
      ? new Date(reportCard.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      : null
    : null;

  const isTeacherSigned = isTeacherSubmittedToAdmin;

  // 2. Resolve Principal / Administrator Signature Info
  const adminSignerName =
    (typeof reportCard.approvedBy === "object" && reportCard.approvedBy?.name) ||
    (typeof reportCard.publishedBy === "object" && reportCard.publishedBy?.name) ||
    reportCard.reviewHistory?.find((h) => h.action === "approved" || h.action === "published")?.performerName ||
    (reportCard.published || reportCard.status === "approved" || reportCard.status === "published"
      ? "School Principal"
      : null);

  const adminSignDate = reportCard.approvedAt || reportCard.publishedAt
    ? new Date(reportCard.approvedAt || reportCard.publishedAt!).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : reportCard.reviewHistory?.find((h) => h.action === "approved" || h.action === "published")?.timestamp
    ? new Date(
        reportCard.reviewHistory.find((h) => h.action === "approved" || h.action === "published")!.timestamp
      ).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : null;

  const isAdminSigned = Boolean(
    reportCard.published ||
    reportCard.status === "approved" ||
    reportCard.status === "published" ||
    reportCard.approvedBy ||
    reportCard.publishedBy
  );

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const getGradeBadgeColor = (grade: number) => {
    if (grade >= 80) return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300";
    if (grade >= 70) return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300";
    if (grade >= 60) return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300";
    if (grade >= 40) return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300";
    return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300";
  };

  // =========================================================================================
  // STRICT SCOPE: IF NOT THIRD TERM, RENDER THE EXACT UNCHANGED 1ST & 2ND TERM LAYOUT
  // =========================================================================================
  if (!isThirdTermCard) {
    return (
      <div className="report-card-container w-full max-w-4xl mx-auto">
        {/* Print Trigger Toolbar (hidden in print) */}
        {showPrintButton && (
          <div className="no-print flex items-center justify-between gap-3 mb-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  published
                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                }`}
              >
                {published ? "Official & Published" : "Draft / Review Mode"}
              </span>
              <span className="text-xs text-gray-400">|</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {classLevel?.name} • {academicTerm?.name} • {academicYear?.name}
              </span>
            </div>
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all duration-150"
            >
              <HiOutlinePrinter className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        )}

        {/* The Printable Report Card Body */}
        <div className="report-card-sheet bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 sm:p-10 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none">
          {/* Decorative Top Border Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-t-lg -mt-8 sm:-mt-10 mb-6 print:hidden" />

          {/* School Header */}
          <div className="text-center pb-6 border-b-2 border-indigo-100 dark:border-gray-800 relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 mb-3 shadow-inner">
              <HiOutlineAcademicCap className="w-10 h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
              {schoolName}
            </h1>
            <p className="text-xs sm:text-sm font-medium italic text-indigo-600 dark:text-indigo-400 mt-1">
              "{schoolMotto}"
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{schoolAddress}</p>

            <div className="mt-4 inline-block bg-indigo-600 text-white text-xs sm:text-sm font-bold uppercase tracking-widest px-6 py-1.5 rounded-full shadow-sm">
              Official Term Report Card
            </div>
          </div>

          {/* Student & Session Info Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-gray-200 dark:border-gray-800 text-xs sm:text-sm">
            <div className="space-y-1">
              <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                <HiOutlineUser className="w-3.5 h-3.5" /> Student Name:
              </span>
              <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                {student?.name || "Student"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                <HiOutlineIdentification className="w-3.5 h-3.5" /> Student ID:
              </span>
              <p className="font-bold font-mono text-indigo-700 dark:text-indigo-300">
                {studentID || student?.StudentId || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                <HiOutlineAcademicCap className="w-3.5 h-3.5" /> Class Level:
              </span>
              <p className="font-bold text-gray-900 dark:text-white">
                {classLevel?.name || student?.currentClassLevel || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                <HiOutlineCalendar className="w-3.5 h-3.5" /> Term & Session:
              </span>
              <p className="font-bold text-gray-900 dark:text-white">
                {academicTerm?.name || "Term"} ({academicYear?.name || "Year"})
              </p>
            </div>
          </div>

          {/* Summary Performance Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/20 border border-indigo-200/70 dark:border-indigo-800/60 text-center">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Total Score
              </span>
              <p className="text-xl sm:text-2xl font-black text-indigo-900 dark:text-indigo-200 mt-1">
                {totalScore}
              </p>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                across {subjectResults.length} subjects
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20 border border-purple-200/70 dark:border-purple-800/60 text-center">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                Average Score
              </span>
              <p className="text-xl sm:text-2xl font-black text-purple-900 dark:text-purple-200 mt-1">
                {averageScore !== null && averageScore !== undefined ? `${averageScore}%` : "Pending"}
              </p>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                Grade: {overallGrade || (averageScore !== null ? "N/A" : "Pending")}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200/70 dark:border-amber-800/60 text-center">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <HiOutlineTrophy className="w-3.5 h-3.5" /> Class Position
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
                {positionFormatted || `${position || 1}th`}
              </p>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                out of {totalStudents} students
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/60 text-center">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <HiOutlineCheckBadge className="w-3.5 h-3.5" /> Promotion Status
              </span>
              <p
                className={`text-sm sm:text-base font-black mt-2 uppercase ${
                  promoted
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-amber-700 dark:text-amber-300"
                }`}
              >
                {promotionStatus || (promoted ? "Promoted" : "Pending")}
              </p>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {promoted ? "Qualified for Next Class" : "Academic Review"}
              </span>
            </div>
          </div>

          {/* Subject Results Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 my-6">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-bold uppercase text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-800">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-3 text-center">Test (/30)</th>
                  <th className="py-3 px-3 text-center">Exam (/70)</th>
                  <th className="py-3 px-3 text-center">Total (/100)</th>
                  <th className="py-3 px-3 text-center">Grade</th>
                  <th className="py-3 px-3 text-center">Remark</th>
                  <th className="py-3 px-4">Subject Teacher</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {subjectResults.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-400">
                      No subject exam results recorded for this term yet.
                    </td>
                  </tr>
                ) : (
                  subjectResults.map((sub: any, index: number) => {
                    const isPending =
                      sub.status === "Pending" ||
                      (sub.testScore === null && sub.examScore === null && sub.totalScore === null && sub.score === undefined);
                    const testScoreDisplay =
                      sub.testScore !== undefined && sub.testScore !== null
                        ? sub.testScore
                        : isPending
                        ? "Pending"
                        : "-";
                    const examScoreDisplay =
                      sub.examScore !== undefined && sub.examScore !== null
                        ? sub.examScore
                        : sub.score !== undefined
                        ? sub.score
                        : isPending
                        ? "Pending"
                        : "-";
                    const totalScoreDisplay =
                      isPending
                        ? "Pending"
                        : sub.totalScore !== undefined && sub.totalScore !== null
                        ? sub.totalScore
                        : sub.score !== undefined
                        ? sub.score
                        : Number(sub.testScore || 0) + Number(sub.examScore || 0);

                    const percentageGrade =
                      sub.grade !== undefined && sub.grade !== null
                        ? sub.grade
                        : typeof totalScoreDisplay === "number"
                        ? totalScoreDisplay
                        : 0;

                    const letterGrade =
                      sub.letterGrade ||
                      (isPending
                        ? "—"
                        : percentageGrade >= 80
                        ? "A"
                        : percentageGrade >= 70
                        ? "B"
                        : percentageGrade >= 60
                        ? "C"
                        : percentageGrade >= 40
                        ? "D"
                        : "F");

                    const computedRemark =
                      sub.remark ||
                      sub.remarks ||
                      (isPending
                        ? "Pending"
                        : percentageGrade >= 80
                        ? "Excellent"
                        : percentageGrade >= 70
                        ? "Very Good"
                        : percentageGrade >= 60
                        ? "Good"
                        : percentageGrade >= 40
                        ? "Fair"
                        : "Poor");

                    const teacherName = sub.subjectTeacher || sub.teacherName || "Assigned Teacher";

                    return (
                      <tr
                        key={sub._id || index}
                        className={`hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors ${
                          isPending ? "bg-amber-50/30 dark:bg-amber-950/20" : ""
                        }`}
                      >
                        <td className="py-3 px-4 text-gray-400 font-mono text-xs">{index + 1}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          {sub.subjectName}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                          {testScoreDisplay === "Pending" ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium italic text-xs">
                              Pending
                            </span>
                          ) : (
                            testScoreDisplay
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                          {examScoreDisplay === "Pending" ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium italic text-xs">
                              Pending
                            </span>
                          ) : (
                            examScoreDisplay
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                          {totalScoreDisplay === "Pending" ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium italic text-xs">
                              Pending
                            </span>
                          ) : (
                            totalScoreDisplay
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-mono">
                          {letterGrade}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block font-bold px-2 py-0.5 rounded text-xs border ${
                              isPending
                                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                                : getGradeBadgeColor(percentageGrade)
                            }`}
                          >
                            {computedRemark}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-medium text-xs">
                          {teacherName}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPending
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                            }`}
                          >
                            {isPending ? "Pending" : "Submitted"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {subjectResults.length > 0 && (
                <tfoot>
                  <tr className="bg-indigo-50/80 dark:bg-indigo-950/60 font-bold border-t-2 border-indigo-300 dark:border-indigo-800">
                    <td colSpan={2} className="py-3.5 px-4 text-indigo-950 dark:text-indigo-200 uppercase text-xs">
                      Grand Total & Percentage
                    </td>
                    <td className="py-3.5 px-3 text-center text-gray-500 dark:text-gray-400 text-xs">
                      Test / {subjectResults.length * 30}
                    </td>
                    <td className="py-3.5 px-3 text-center text-gray-500 dark:text-gray-400 text-xs">
                      Exam / {subjectResults.length * 70}
                    </td>
                    <td className="py-3.5 px-3 text-center text-indigo-950 dark:text-white text-base font-extrabold">
                      {totalScore}{" "}
                      <span className="text-xs text-gray-500 font-normal">/ {subjectResults.length * 100}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-indigo-700 dark:text-indigo-300 font-extrabold text-sm">
                      {averageScore !== null && averageScore !== undefined ? `${averageScore}%` : "Pending"}
                    </td>
                    <td colSpan={3} className="py-3.5 px-4 text-indigo-900 dark:text-indigo-200 text-xs font-bold">
                      {overallRemark || "Academic Evaluation"}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Comments & Endorsements */}
          <div className="space-y-4 my-6">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                Class Teacher's Remark:
              </span>
              <p className="text-sm italic text-gray-800 dark:text-gray-200">
                "{teacherComment || "An encouraging performance. Keep working hard to maintain high standards."}"
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
                Principal / Administrator's Endorsement:
              </span>
              <p className="text-sm italic text-gray-800 dark:text-gray-200">
                "{principalComment || "Satisfactory academic achievement. Demonstrates consistent dedication to study."}"
              </p>
            </div>
          </div>

          {/* Grading Scale Legend */}
          <div className="p-3 bg-gray-100/60 dark:bg-gray-800/40 rounded-lg border border-gray-200/80 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-400 flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-gray-700 dark:text-gray-300">Official Grading Scale:</span>
            <span>A: 80% - 100% (Excellent)</span>
            <span>B: 70% - 79% (Very Good)</span>
            <span>C: 60% - 69% (Good)</span>
            <span>D: 50% - 59% (Pass / Fair)</span>
            <span>F: 0% - 49% (Fail)</span>
          </div>

          {/* Signatures & Seal Section */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-10 mt-6 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500 dark:text-gray-400 items-end">
            {/* Class Teacher Signature */}
            <div className="flex flex-col items-center">
              <div className="border-b-2 border-gray-400 dark:border-gray-600 w-4/5 mx-auto mb-2 min-h-16 flex flex-col items-center justify-end pb-1.5">
                {isTeacherSigned ? (
                  <div className="space-y-0.5 animate-fadeIn">
                    <span
                      className="block text-xl sm:text-2xl font-serif italic font-bold tracking-wide text-indigo-700 dark:text-indigo-400 select-none transform -rotate-2"
                      style={{
                        fontFamily: "'Dancing Script', 'Caveat', 'Great Vibes', 'Segoe Script', cursive, Georgia, serif",
                      }}
                    >
                      {teacherSignerName || "Class Teacher"}
                    </span>
                    <div className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                      <HiCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-300" />
                      <span>Digitally Signed {teacherSignDate ? `• ${teacherSignDate}` : ""}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs italic pb-1">
                    Pending Teacher Signature
                  </span>
                )}
              </div>
              <p className="font-bold text-gray-900 dark:text-gray-100 text-xs">
                {teacherSignerName || "Class Form Teacher"}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Class Teacher</p>
            </div>

            {/* Institutional Stamp & Seal */}
            <div className="hidden sm:flex flex-col items-center justify-center">
              {isAdminSigned ? (
                <div className="relative w-20 h-20 rounded-full border-2 border-double border-indigo-600 dark:border-indigo-400 flex flex-col items-center justify-center p-1 text-center bg-indigo-50/50 dark:bg-indigo-950/40 transform -rotate-6 shadow-sm">
                  <div className="w-full h-full rounded-full border border-dashed border-indigo-400 dark:border-indigo-500 flex flex-col items-center justify-center p-0.5">
                    <span className="text-[7.5px] font-black uppercase tracking-tight text-indigo-800 dark:text-indigo-300 leading-none">
                      OFFICIAL
                    </span>
                    <HiOutlineAcademicCap className="w-5 h-5 text-indigo-700 dark:text-indigo-300 my-0.5" />
                    <span className="text-[6.5px] font-black uppercase tracking-tighter text-emerald-700 dark:text-emerald-400 font-mono leading-none">
                      • VERIFIED •
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-[10px] uppercase font-bold text-gray-400">
                  School Stamp
                </div>
              )}
              <p className="font-semibold text-[11px] text-gray-600 dark:text-gray-400 mt-2">
                {isAdminSigned ? "Official School Stamp" : "School Stamp"}
              </p>
            </div>

            {/* Principal / Admin Signature */}
            <div className="flex flex-col items-center">
              <div className="border-b-2 border-gray-400 dark:border-gray-600 w-4/5 mx-auto mb-2 min-h-16 flex flex-col items-center justify-end pb-1.5">
                {isAdminSigned ? (
                  <div className="space-y-0.5 animate-fadeIn">
                    <span
                      className="block text-xl sm:text-2xl font-serif italic font-bold tracking-wide text-purple-700 dark:text-purple-400 select-none transform -rotate-1"
                      style={{
                        fontFamily: "'Dancing Script', 'Caveat', 'Great Vibes', 'Segoe Script', cursive, Georgia, serif",
                      }}
                    >
                      {adminSignerName || "School Principal"}
                    </span>
                    <div className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                      <HiCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-300" />
                      <span>Approved & Endorsed {adminSignDate ? `• ${adminSignDate}` : ""}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs italic pb-1">
                    Pending Admin Approval
                  </span>
                )}
              </div>
              <p className="font-bold text-gray-900 dark:text-gray-100 text-xs">
                {adminSignerName || "School Principal"}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Principal / Administrator</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================================
  // APPROVED THIRD TERM REPORT CARD DESIGN (STRICTLY FOR 3RD / FINAL TERM ONLY)
  // =========================================================================================

  // Calculate or retrieve student subject rows with validation
  let totalAnnualSum = 0;
  let completeSubjectsCount = 0;

  const thirdTermRows = subjectResults.map((sub: any, index: number) => {
    // 1st Term total score out of 100
    const firstTermScore: number | null =
      typeof sub.firstTermTotal === "number" ? sub.firstTermTotal : null;

    // 2nd Term total score out of 100
    const secondTermScore: number | null =
      typeof sub.secondTermTotal === "number" ? sub.secondTermTotal : null;

    // 3rd Term test score out of 30
    const thirdTest: number | null =
      typeof sub.thirdTermTestScore === "number"
        ? sub.thirdTermTestScore
        : typeof sub.testScore === "number"
        ? sub.testScore
        : null;

    // 3rd Term examination score out of 70
    const thirdExam: number | null =
      typeof sub.thirdTermExamScore === "number"
        ? sub.thirdTermExamScore
        : typeof sub.examScore === "number"
        ? sub.examScore
        : typeof sub.score === "number" && thirdTest === null
        ? sub.score
        : null;

    // 3rd Term total score out of 100: testScore + examScore
    let thirdTotal: number | null = null;
    if (typeof sub.thirdTermTotal === "number") {
      thirdTotal = sub.thirdTermTotal;
    } else if (typeof sub.totalScore === "number") {
      thirdTotal = sub.totalScore;
    } else if (thirdTest !== null && thirdExam !== null) {
      thirdTotal = thirdTest + thirdExam;
    } else if (typeof sub.score === "number") {
      thirdTotal = sub.score;
    }

    // Calculation Rules:
    // annualAverage = (firstTermTotal + secondTermTotal + thirdTermTotal) / 3
    // Validate missing results and scores: do NOT silently treat missing as zero!
    let annualAvg: number | null = null;
    let annualGrade = "—";
    let annualRemark = "Pending";

    if (typeof sub.annualAverage === "number") {
      const avgNum = sub.annualAverage;
      annualAvg = avgNum;
      annualGrade = sub.annualGrade || getThirdTermGrade(avgNum);
      annualRemark = sub.annualRemark || getThirdTermRemark(avgNum);
      totalAnnualSum += avgNum;
      completeSubjectsCount++;
    } else if (firstTermScore !== null && secondTermScore !== null && thirdTotal !== null) {
      const calculatedAvg = Number(((firstTermScore + secondTermScore + thirdTotal) / 3).toFixed(2));
      annualAvg = calculatedAvg;
      annualGrade = getThirdTermGrade(calculatedAvg);
      annualRemark = getThirdTermRemark(calculatedAvg);
      totalAnnualSum += calculatedAvg;
      completeSubjectsCount++;
    }

    return {
      sn: index + 1,
      subjectName: sub.subjectName || sub.name || "Subject",
      firstTermScore,
      secondTermScore,
      thirdTest,
      thirdExam,
      thirdTotal,
      annualAvg,
      annualGrade,
      annualRemark,
    };
  });

  // Overall Performance:
  // Use backend overallAnnualAverage if present, or compute average across complete subjects
  let computedOverallAnnualAverage: number | null = null;
  let computedOverallAnnualGrade = "Pending";
  let computedOverallAnnualRemark = "Incomplete Terms Pending";

  if (typeof reportCard.overallAnnualAverage === "number") {
    computedOverallAnnualAverage = reportCard.overallAnnualAverage;
    computedOverallAnnualGrade =
      reportCard.overallAnnualGrade || getThirdTermGrade(computedOverallAnnualAverage);
    computedOverallAnnualRemark =
      reportCard.overallAnnualRemark ||
      getThirdTermEvaluation(computedOverallAnnualAverage).remark;
  } else if (thirdTermRows.length > 0 && completeSubjectsCount === thirdTermRows.length) {
    computedOverallAnnualAverage = Number((totalAnnualSum / thirdTermRows.length).toFixed(2));
    computedOverallAnnualGrade = getThirdTermGrade(computedOverallAnnualAverage);
    computedOverallAnnualRemark = getThirdTermEvaluation(computedOverallAnnualAverage).remark;
  } else if (completeSubjectsCount > 0) {
    computedOverallAnnualAverage = Number((totalAnnualSum / completeSubjectsCount).toFixed(2));
    computedOverallAnnualGrade = "Pending";
    computedOverallAnnualRemark = `${thirdTermRows.length - completeSubjectsCount} Subject(s) Incomplete`;
  }

  // Student demographics
  const studentDob = (student as any)?.dateOfBirth || (student as any)?.dob;
  const formattedDob = studentDob
    ? new Date(studentDob).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : null;
  const studentGender = (student as any)?.gender || (student as any)?.sex || null;
  const studentClass = classLevel?.name || student?.currentClassLevel || "—";
  const studentAdmissionNo = studentID || student?.StudentId || "—";

  // Attendance metrics
  const attendanceData = reportCard.attendance;
  const hasAttendance =
    Boolean(attendanceData) &&
    typeof attendanceData?.daysOpened === "number" &&
    attendanceData.daysOpened > 0;

  return (
    <div className="report-card-container w-full max-w-4xl mx-auto">
      {/* Print Trigger Toolbar (hidden in print) */}
      {showPrintButton && (
        <div className="no-print flex items-center justify-between gap-3 mb-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                published
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
              }`}
            >
              {published ? "Official Published Final Report" : "Draft / Review Mode"}
            </span>
            <span className="text-xs text-slate-300">|</span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {studentClass} • Third Term • {academicYear?.name}
            </span>
          </div>
          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0f2942] hover:bg-[#163a5d] active:bg-[#091b2c] rounded-lg shadow-sm transition-all duration-150"
          >
            <HiOutlinePrinter className="w-4 h-4" />
            Print / Save PDF (A4)
          </button>
        </div>
      )}

      {/* The Printable Third Term Report Card Body */}
      <div className="report-card-sheet bg-white dark:bg-gray-900 text-slate-900 dark:text-slate-100 p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xl print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none">
        {/* Navy Top Accent Bar */}
        <div className="h-2.5 w-full bg-[#0f2942] rounded-t-lg -mt-8 sm:-mt-10 mb-6 print:hidden" />

        {/* ========================================================================= */}
        {/* SECTION A: SCHOOL HEADER                                                  */}
        {/* ========================================================================= */}
        <div className="text-center pb-6 border-b-2 border-slate-200 dark:border-gray-800 relative">
          <div className="flex flex-col items-center justify-center">
            {schoolLogo ? (
              <img
                src={schoolLogo}
                alt={schoolName}
                className="w-20 h-20 object-contain mb-3 drop-shadow-sm"
              />
            ) : (
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-[#0f2942] dark:text-sky-300 mb-3 shadow-inner">
                <HiOutlineAcademicCap className="w-10 h-10" />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-[#0f2942] dark:text-white">
              {schoolName}
            </h1>
            <p className="text-xs sm:text-sm font-semibold italic text-sky-800 dark:text-sky-400 mt-0.5">
              "{schoolMotto}"
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl mx-auto">
              {schoolAddress}
            </p>

            {/* Prominent Title: THIRD TERM REPORT CARD */}
            <div className="mt-4">
              <span className="inline-block bg-[#0f2942] text-white text-xs sm:text-sm font-black uppercase tracking-widest px-8 py-2 rounded-lg shadow-sm">
                THIRD TERM REPORT CARD
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1.5 uppercase tracking-wider">
                {academicYear?.name ? `${academicYear.name} Academic Session` : "Annual Academic Session"}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION B: STUDENT INFORMATION (Light Blue Panel)                         */}
        {/* ========================================================================= */}
        <div className="my-5 p-4 sm:p-5 rounded-xl bg-[#f0f7ff] dark:bg-slate-800/80 border border-[#bae0fd] dark:border-slate-700">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider block">
                Student Full Name
              </span>
              <p className="font-bold text-[#0f2942] dark:text-white text-sm sm:text-base">
                {student?.name || "Student"}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider block">
                Admission Number
              </span>
              <p className="font-bold font-mono text-[#0f2942] dark:text-sky-300 text-sm">
                {studentAdmissionNo}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider block">
                Current Class
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {studentClass}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider block">
                Term
              </span>
              <p className="font-extrabold text-[#0f2942] dark:text-sky-300">
                Third Term (Final)
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider block">
                Academic Session
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {academicYear?.name || "Session"}
              </p>
            </div>

            {studentGender && (
              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider block">
                  Gender
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {studentGender}
                </p>
              </div>
            )}

            {formattedDob && (
              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider block">
                  Date of Birth
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {formattedDob}
                </p>
              </div>
            )}

            <div className="space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider block">
                Class Teacher
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {teacherSignerName || "Assigned Form Teacher"}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION C: SUBJECT RESULTS TABLE                                          */}
        {/* ========================================================================= */}
        <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-gray-800 my-6 shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              {/* Grouped Table Header - Row 1 */}
              <tr className="border-b border-slate-600 font-bold uppercase text-[11px] tracking-wider text-center">
                <th
                  rowSpan={2}
                  className="bg-[#0f2942] text-white py-3 px-3 text-center border-r border-slate-600 w-10"
                >
                  S/N
                </th>
                <th
                  rowSpan={2}
                  className="bg-[#0f2942] text-white py-3 px-4 text-left border-r border-slate-600 min-w-[150px]"
                >
                  Subject
                </th>
                <th
                  colSpan={2}
                  className="bg-[#133250] text-sky-100 py-2 px-3 border-r border-slate-600"
                >
                  Previous Terms
                </th>
                <th
                  colSpan={3}
                  className="bg-[#0f2942] text-white py-2 px-3 border-r border-slate-600"
                >
                  Third Term
                </th>
                <th
                  colSpan={3}
                  className="bg-[#1a365d] text-white py-2 px-3"
                >
                  Annual Performance
                </th>
              </tr>

              {/* Grouped Table Header - Row 2 */}
              <tr className="border-b-2 border-slate-700 font-bold text-[11px] text-center">
                <th className="bg-[#1a3e63] text-sky-100 py-2.5 px-2 border-r border-slate-600 min-w-[70px]">
                  1st Term
                  <span className="block text-[9px] font-normal text-sky-200">(/100)</span>
                </th>
                <th className="bg-[#1a3e63] text-sky-100 py-2.5 px-2 border-r border-slate-600 min-w-[70px]">
                  2nd Term
                  <span className="block text-[9px] font-normal text-sky-200">(/100)</span>
                </th>
                <th className="bg-[#163a5d] text-sky-100 py-2.5 px-2 border-r border-slate-600 min-w-[65px]">
                  Test
                  <span className="block text-[9px] font-normal text-sky-200">(/30)</span>
                </th>
                <th className="bg-[#163a5d] text-sky-100 py-2.5 px-2 border-r border-slate-600 min-w-[65px]">
                  Exam
                  <span className="block text-[9px] font-normal text-sky-200">(/70)</span>
                </th>
                <th className="bg-[#0f2942] text-white py-2.5 px-2 border-r border-slate-600 min-w-[70px]">
                  Total
                  <span className="block text-[9px] font-normal text-sky-200">(/100)</span>
                </th>
                <th className="bg-[#234876] text-white py-2.5 px-2 border-r border-slate-600 min-w-[80px]">
                  Annual Avg
                  <span className="block text-[9px] font-normal text-sky-200">(%)</span>
                </th>
                <th className="bg-[#234876] text-white py-2.5 px-2 border-r border-slate-600 min-w-[55px]">
                  Grade
                </th>
                <th className="bg-[#234876] text-white py-2.5 px-3 min-w-[95px]">
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {thirdTermRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-400">
                    No subject records found for this Third Term report card.
                  </td>
                </tr>
              ) : (
                thirdTermRows.map((row) => {
                  const hasFirst = row.firstTermScore !== null;
                  const hasSecond = row.secondTermScore !== null;
                  const hasThird = row.thirdTotal !== null;
                  const isRowIncomplete = !hasFirst || !hasSecond || !hasThird;

                  return (
                    <tr
                      key={row.sn}
                      className={`hover:bg-slate-50 dark:hover:bg-gray-800/60 transition-colors ${
                        isRowIncomplete ? "bg-amber-50/20 dark:bg-amber-950/10" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-xs border-r border-slate-200 dark:border-gray-800">
                        {row.sn}
                      </td>

                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-gray-800">
                        {row.subjectName}
                      </td>

                      {/* First Term Total (No Breakdown!) */}
                      <td className="py-2.5 px-2 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-gray-800">
                        {hasFirst ? (
                          row.firstTermScore
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 italic text-xs">
                            —
                          </span>
                        )}
                      </td>

                      {/* Second Term Total (No Breakdown!) */}
                      <td className="py-2.5 px-2 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-gray-800">
                        {hasSecond ? (
                          row.secondTermScore
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 italic text-xs">
                            —
                          </span>
                        )}
                      </td>

                      {/* Third Term Test (/30) */}
                      <td className="py-2.5 px-2 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-gray-800">
                        {row.thirdTest !== null ? (
                          row.thirdTest
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 italic text-xs">
                            —
                          </span>
                        )}
                      </td>

                      {/* Third Term Exam (/70) */}
                      <td className="py-2.5 px-2 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-gray-800">
                        {row.thirdExam !== null ? (
                          row.thirdExam
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 italic text-xs">
                            —
                          </span>
                        )}
                      </td>

                      {/* Third Term Total (/100) */}
                      <td className="py-2.5 px-2 text-center font-bold text-[#0f2942] dark:text-sky-300 bg-sky-50/50 dark:bg-sky-950/20 border-r border-slate-200 dark:border-gray-800">
                        {hasThird ? (
                          row.thirdTotal
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 italic text-xs">
                            —
                          </span>
                        )}
                      </td>

                      {/* Annual Average ((1st + 2nd + 3rd) / 3 displayed to 2 decimal places) */}
                      <td className="py-2.5 px-2 text-center font-extrabold text-[#0f2942] dark:text-white bg-indigo-50/40 dark:bg-indigo-950/30 border-r border-slate-200 dark:border-gray-800">
                        {row.annualAvg !== null ? (
                          `${row.annualAvg.toFixed(2)}%`
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Grade derived from Annual Average */}
                      <td className="py-2.5 px-2 text-center font-bold font-mono text-sm border-r border-slate-200 dark:border-gray-800">
                        {row.annualGrade !== "—" ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs border ${
                              row.annualAvg !== null ? getGradeBadgeColor(row.annualAvg) : ""
                            }`}
                          >
                            {row.annualGrade}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Remarks derived from Annual Average */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block font-semibold px-2 py-0.5 rounded text-xs border ${
                            row.annualAvg !== null
                              ? getGradeBadgeColor(row.annualAvg)
                              : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {row.annualRemark}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer: Summary & Calculation Notes */}
            {thirdTermRows.length > 0 && (
              <tfoot>
                <tr className="bg-[#f0f7ff] dark:bg-slate-800/90 font-bold border-t-2 border-[#0f2942]">
                  <td
                    colSpan={2}
                    className="py-3 px-4 text-[#0f2942] dark:text-sky-200 uppercase text-xs border-r border-slate-300 dark:border-slate-700"
                  >
                    Annual Overall Average ({completeSubjectsCount}/{thirdTermRows.length} Complete)
                  </td>
                  <td
                    colSpan={5}
                    className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 text-xs border-r border-slate-300 dark:border-slate-700"
                  >
                    Formula: (1st Term + 2nd Term + 3rd Term) ÷ 3
                  </td>
                  <td className="py-3 px-2 text-center text-[#0f2942] dark:text-sky-300 font-black text-sm border-r border-slate-300 dark:border-slate-700">
                    {computedOverallAnnualAverage !== null ? `${computedOverallAnnualAverage.toFixed(2)}%` : "Pending"}
                  </td>
                  <td className="py-3 px-2 text-center text-[#0f2942] dark:text-sky-300 font-mono font-bold text-sm border-r border-slate-300 dark:border-slate-700">
                    {computedOverallAnnualGrade !== "Pending" ? computedOverallAnnualGrade : "—"}
                  </td>
                  <td className="py-3 px-3 text-center text-xs font-bold text-[#0f2942] dark:text-sky-300">
                    {computedOverallAnnualRemark}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ========================================================================= */}
        {/* SECTION D: OVERALL PERFORMANCE SUMMARY (Light Blue Panels)                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          {/* Card 1: Overall Annual Average */}
          <div className="p-4 rounded-xl bg-[#f0f7ff] dark:bg-slate-800/80 border border-[#bae0fd] dark:border-slate-700 text-center">
            <span className="text-xs font-bold text-[#0f2942] dark:text-sky-300 uppercase tracking-wider block">
              Annual Average
            </span>
            <p className="text-2xl sm:text-3xl font-black text-[#0f2942] dark:text-white mt-1">
              {computedOverallAnnualAverage !== null ? `${computedOverallAnnualAverage.toFixed(2)}%` : "Pending"}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Across {completeSubjectsCount} of {thirdTermRows.length} subjects
            </span>
          </div>

          {/* Card 2: Overall Annual Grade & Remark */}
          <div className="p-4 rounded-xl bg-[#f0f7ff] dark:bg-slate-800/80 border border-[#bae0fd] dark:border-slate-700 text-center">
            <span className="text-xs font-bold text-[#0f2942] dark:text-sky-300 uppercase tracking-wider block">
              Annual Grade
            </span>
            <p className="text-2xl sm:text-3xl font-black text-[#0f2942] dark:text-white mt-1">
              {computedOverallAnnualGrade !== "Pending" ? computedOverallAnnualGrade : "—"}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
              {computedOverallAnnualRemark}
            </span>
          </div>

          {/* Card 3: Class Position (Only if calculated by system) */}
          <div className="p-4 rounded-xl bg-[#f0f7ff] dark:bg-slate-800/80 border border-[#bae0fd] dark:border-slate-700 text-center">
            <span className="text-xs font-bold text-[#0f2942] dark:text-sky-300 uppercase tracking-wider flex items-center justify-center gap-1">
              <HiOutlineTrophy className="w-3.5 h-3.5 text-amber-600" /> Class Position
            </span>
            <p className="text-2xl sm:text-3xl font-black text-[#0f2942] dark:text-white mt-1">
              {positionFormatted || (position ? `${position}th` : "—")}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {totalStudents ? `out of ${totalStudents} students` : "Cohort position"}
            </span>
          </div>

          {/* Card 4: Promotion Status */}
          {(() => {
            const configuredPromotionTarget = (reportCard as any).promotionTarget ?? 50;
            const isResultsComplete = thirdTermRows.length > 0 && completeSubjectsCount === thirdTermRows.length;
            
            let currentPromotionStatus = "Pending Results";
            if (promotionStatus === "Promoted" || promotionStatus === "Graduated") {
              currentPromotionStatus = "Promoted";
            } else if (promotionStatus === "Failed to Promote" || promotionStatus === "Repeat") {
              currentPromotionStatus = "Failed to Promote";
            } else if (promotionStatus === "Pending Results" || promotionStatus === "Pending") {
              currentPromotionStatus = "Pending Results";
            } else if (!isResultsComplete || computedOverallAnnualAverage === null) {
              currentPromotionStatus = "Pending Results";
            } else if (computedOverallAnnualAverage >= configuredPromotionTarget) {
              currentPromotionStatus = "Promoted";
            } else {
              currentPromotionStatus = "Failed to Promote";
            }

            return (
              <div
                className={`p-4 rounded-xl border text-center transition-all ${
                  currentPromotionStatus === "Promoted"
                    ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                    : currentPromotionStatus === "Failed to Promote"
                    ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
                    : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 text-[#0f2942] dark:text-sky-300">
                  <HiOutlineCheckBadge
                    className={`w-4 h-4 ${
                      currentPromotionStatus === "Promoted"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : currentPromotionStatus === "Failed to Promote"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  />{" "}
                  Promotion Status
                </span>
                <div className="mt-2 flex flex-col items-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${
                      currentPromotionStatus === "Promoted"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-900/70 dark:text-emerald-200 dark:border-emerald-600"
                        : currentPromotionStatus === "Failed to Promote"
                        ? "bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-900/70 dark:text-rose-200 dark:border-rose-600"
                        : "bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/70 dark:text-amber-200 dark:border-amber-600"
                    }`}
                  >
                    {currentPromotionStatus}
                  </span>
                  <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                    <div>
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Target:</span>{" "}
                      <strong className="font-bold text-slate-900 dark:text-white">{configuredPromotionTarget}%</strong>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Annual Avg:</span>{" "}
                      <strong className="font-bold text-slate-900 dark:text-white">
                        {computedOverallAnnualAverage !== null ? `${computedOverallAnnualAverage.toFixed(2)}%` : "Pending"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ========================================================================= */}
        {/* SECTION E: ATTENDANCE RECORD (Where data is available)                    */}
        {/* ========================================================================= */}
        {hasAttendance && attendanceData && (
          <div className="my-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 page-break-avoid">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f2942] dark:text-sky-300 flex items-center gap-1.5 mb-3">
              <HiOutlineCalendar className="w-4 h-4 text-[#0f2942]" /> Annual Attendance Record
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Days</span>
                <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">{attendanceData.daysOpened}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-emerald-600 font-semibold uppercase">Days Present</span>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{attendanceData.daysPresent}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-rose-600 font-semibold uppercase">Days Absent</span>
                <p className="text-base font-bold text-rose-700 dark:text-rose-400 mt-0.5">{attendanceData.daysAbsent}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-sky-600 font-semibold uppercase">Attendance %</span>
                <p className="text-base font-bold text-[#0f2942] dark:text-sky-300 mt-0.5">
                  {attendanceData.attendancePercentage !== undefined
                    ? `${attendanceData.attendancePercentage}%`
                    : (attendanceData.daysOpened ?? 0) > 0
                    ? `${Math.round(((attendanceData.daysPresent ?? 0) / (attendanceData.daysOpened ?? 1)) * 100)}%`
                    : "100%"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION F: TEACHER & PRINCIPAL REMARKS                                    */}
        {/* ========================================================================= */}
        <div className="space-y-3.5 my-6 page-break-avoid">
          {/* Class Teacher's Remarks */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f2942] dark:text-sky-300 block mb-1">
              Class Teacher's Annual Remarks:
            </span>
            <p className="text-sm italic text-slate-800 dark:text-slate-200">
              "{teacherComment || "An encouraging performance across all terms. Keep working hard to maintain high standards."}"
            </p>
          </div>

          {/* Principal's Remarks */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f2942] dark:text-sky-300 block mb-1">
              Principal / Administrator's Annual Endorsement:
            </span>
            <p className="text-sm italic text-slate-800 dark:text-slate-200">
              "{principalComment || "Commendable academic effort throughout the academic session. Congratulations on completing the session."}"
            </p>
          </div>
        </div>

        {/* Official Grading Scale Reference */}
        <div className="p-3 bg-[#f0f7ff] dark:bg-slate-800/40 rounded-lg border border-[#bae0fd] dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2 page-break-avoid">
          <span className="font-bold text-[#0f2942] dark:text-sky-300">Annual Grading Scale:</span>
          <span>A: 80% - 100% (Excellent)</span>
          <span>B: 70% - 79% (Very Good)</span>
          <span>C: 60% - 69% (Good)</span>
          <span>D: 50% - 59% (Fair / Pass)</span>
          <span>F: 0% - 49% (Fail)</span>
        </div>

        {/* ========================================================================= */}
        {/* SECTION G: SIGNATURES, DATE & OFFICIAL SCHOOL SEAL                        */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 mt-6 border-t-2 border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 items-end page-break-avoid">
          {/* Class Teacher Signature */}
          <div className="flex flex-col items-center">
            <div className="border-b-2 border-slate-400 dark:border-slate-600 w-4/5 mx-auto mb-2 min-h-16 flex flex-col items-center justify-end pb-1.5">
              {isTeacherSigned ? (
                <div className="space-y-0.5">
                  <span
                    className="block text-xl sm:text-2xl font-serif italic font-bold tracking-wide text-[#0f2942] dark:text-sky-300 select-none transform -rotate-2"
                    style={{
                      fontFamily: "'Dancing Script', 'Caveat', 'Great Vibes', 'Segoe Script', cursive, Georgia, serif",
                    }}
                  >
                    {teacherSignerName || "Class Teacher"}
                  </span>
                  <div className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                    <HiCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-300" />
                    <span>Digitally Signed {teacherSignDate ? `• ${teacherSignDate}` : ""}</span>
                  </div>
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 text-xs italic pb-1">
                  Pending Teacher Signature
                </span>
              )}
            </div>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
              {teacherSignerName || "Class Form Teacher"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Class Form Teacher</p>
          </div>

          {/* Institutional Stamp & Seal */}
          <div className="hidden sm:flex flex-col items-center justify-center">
            {isAdminSigned ? (
              <div className="relative w-20 h-20 rounded-full border-2 border-double border-[#0f2942] dark:border-sky-400 flex flex-col items-center justify-center p-1 text-center bg-sky-50/50 dark:bg-sky-950/40 transform -rotate-6 shadow-sm">
                <div className="w-full h-full rounded-full border border-dashed border-[#0f2942] dark:border-sky-500 flex flex-col items-center justify-center p-0.5">
                  <span className="text-[7.5px] font-black uppercase tracking-tight text-[#0f2942] dark:text-sky-300 leading-none">
                    OFFICIAL
                  </span>
                  <HiOutlineAcademicCap className="w-5 h-5 text-sky-700 dark:text-sky-300 my-0.5" />
                  <span className="text-[6.5px] font-black uppercase tracking-tighter text-emerald-700 dark:text-emerald-400 font-mono leading-none">
                    • SEALED •
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">
                School Seal
              </div>
            )}
            <p className="font-semibold text-[11px] text-slate-600 dark:text-slate-400 mt-2">
              {isAdminSigned ? "Official Institutional Seal" : "Institutional Seal"}
            </p>
          </div>

          {/* Principal / Admin Signature */}
          <div className="flex flex-col items-center">
            <div className="border-b-2 border-slate-400 dark:border-slate-600 w-4/5 mx-auto mb-2 min-h-16 flex flex-col items-center justify-end pb-1.5">
              {isAdminSigned ? (
                <div className="space-y-0.5">
                  <span
                    className="block text-xl sm:text-2xl font-serif italic font-bold tracking-wide text-[#0f2942] dark:text-sky-300 select-none transform -rotate-1"
                    style={{
                      fontFamily: "'Dancing Script', 'Caveat', 'Great Vibes', 'Segoe Script', cursive, Georgia, serif",
                    }}
                  >
                    {adminSignerName || "School Principal"}
                  </span>
                  <div className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                    <HiCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-300" />
                    <span>Approved & Endorsed {adminSignDate ? `• ${adminSignDate}` : ""}</span>
                  </div>
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 text-xs italic pb-1">
                  Pending Principal Approval
                </span>
              )}
            </div>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
              {adminSignerName || "School Principal"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Principal / Head of School</p>
          </div>
        </div>

        {/* Footer with Motto & Security Notice */}
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-500 dark:text-slate-400 page-break-avoid">
          <p className="italic font-medium">"{schoolMotto}"</p>
          <p className="mt-0.5 text-slate-400">
            Official Third Term Academic Report Card • Verified Record • Confidential
          </p>
        </div>
      </div>
    </div>
  );
};
