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
} from "react-icons/hi2";

interface ReportCardDocumentProps {
  reportCard: ReportCardItem;
  schoolName?: string;
  schoolMotto?: string;
  schoolAddress?: string;
  onPrint?: () => void;
  showPrintButton?: boolean;
}

export const ReportCardDocument: React.FC<ReportCardDocumentProps> = ({
  reportCard,
  schoolName = "ACADEMIA INTERNATIONAL HIGH SCHOOL",
  schoolMotto = "Excellence, Knowledge & Integrity",
  schoolAddress = "124 Scholars Boulevard, Education District, Global Campus",
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
                  const isPending = sub.status === "Pending" || (sub.testScore === null && sub.examScore === null && sub.totalScore === null && sub.score === undefined);
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
                          <span className="text-amber-600 dark:text-amber-400 font-medium italic text-xs">Pending</span>
                        ) : (
                          testScoreDisplay
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                        {examScoreDisplay === "Pending" ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium italic text-xs">Pending</span>
                        ) : (
                          examScoreDisplay
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                        {totalScoreDisplay === "Pending" ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium italic text-xs">Pending</span>
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
                    {totalScore} <span className="text-xs text-gray-500 font-normal">/ {subjectResults.length * 100}</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-10 mt-6 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500 dark:text-gray-400">
          <div>
            <div className="border-b border-gray-400 dark:border-gray-600 w-3/4 mx-auto mb-2 h-8 flex items-end justify-center font-serif italic text-indigo-600 dark:text-indigo-400">
              Teacher's Signature
            </div>
            <p className="font-medium">Class Teacher</p>
          </div>

          <div className="hidden sm:block">
            <div className="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-indigo-300 dark:border-indigo-700 flex items-center justify-center text-[10px] uppercase font-bold text-indigo-400">
              Official Seal
            </div>
            <p className="font-medium mt-1">School Stamp</p>
          </div>

          <div>
            <div className="border-b border-gray-400 dark:border-gray-600 w-3/4 mx-auto mb-2 h-8 flex items-end justify-center font-serif italic text-indigo-600 dark:text-indigo-400">
              Principal's Signature
            </div>
            <p className="font-medium">School Principal</p>
          </div>
        </div>
      </div>
    </div>
  );
};
