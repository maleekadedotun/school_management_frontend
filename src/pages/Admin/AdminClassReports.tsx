import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchAdminClassReports,
  markClassReportAsRead,
  type ClassReportItem,
} from "../../features/classReports/classReportsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import {
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineUser,
  HiOutlineAcademicCap,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from "react-icons/hi2";

export default function AdminClassReports() {
  const dispatch = useAppDispatch();
  const { reports, unreadReports, readReports, unreadCount, readCount, totalCount, loading, actionLoading } =
    useAppSelector((state) => state.classReports);
  const { items: classLevels } = useAppSelector((state) => state.classLevels);

  const [activeTab, setActiveTab] = useState<"unread" | "read" | "all">("unread");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Review & Reading modal state
  const [readingReport, setReadingReport] = useState<ClassReportItem | null>(null);
  const [adminFeedback, setAdminFeedback] = useState("");
  const [readToast, setReadToast] = useState<{ message: string; teacherName: string } | null>(null);

  useEffect(() => {
    dispatch(fetchAdminClassReports());
    dispatch(fetchClassLevels());
  }, [dispatch]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    let sourceList: ClassReportItem[] = [];
    if (activeTab === "unread") sourceList = unreadReports;
    else if (activeTab === "read") sourceList = readReports;
    else sourceList = reports;

    return sourceList.filter((r) => {
      const matchClass =
        selectedClass === "all" ||
        r.classLevel?._id === selectedClass ||
        r.classLevel === selectedClass ||
        r.classLevelName === selectedClass;

      const matchWeek =
        selectedWeek === "all" ||
        r.weekNumber?.toString() === selectedWeek;

      const matchSearch =
        !searchQuery.trim() ||
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.teacherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.classLevelName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.summary?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchClass && matchWeek && matchSearch;
    });
  }, [activeTab, unreadReports, readReports, reports, selectedClass, selectedWeek, searchQuery]);

  // Open report reader
  const handleOpenReader = (report: ClassReportItem) => {
    setReadingReport(report);
    setAdminFeedback(report.adminFeedback || "");
  };

  // Mark as Read and Notify Teacher
  const handleConfirmRead = async () => {
    if (!readingReport) return;

    const resAction = await dispatch(
      markClassReportAsRead({
        id: readingReport._id,
        adminFeedback: adminFeedback.trim(),
      })
    );

    if (markClassReportAsRead.fulfilled.match(resAction)) {
      setReadToast({
        message: `Report marked as read. Teacher ${readingReport.teacherName} has been automatically notified!`,
        teacherName: readingReport.teacherName,
      });
      setReadingReport(null);
      setAdminFeedback("");
      dispatch(fetchAdminClassReports());
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-500/30 p-6 md:p-10 shadow-2xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <HiOutlineAcademicCap className="w-4 h-4 text-indigo-400" />
              Administrative Overview
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Class Performance Reports 📑
            </h1>
            <p className="text-xs md:text-sm text-indigo-200/80 max-w-2xl leading-relaxed">
              Monitor weekly class performance reports submitted by teachers. Review syllabus coverage, student attendance, pass rates, and teacher recommendations. When you mark a report as read, the authoring teacher is instantly notified.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center">
              <span className="text-2xl font-black text-white block">{unreadCount}</span>
              <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                Unread Reports
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center">
              <span className="text-2xl font-black text-white block">{readCount}</span>
              <span className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">
                Read Archive
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Read Toast */}
      {readToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-teal-950/60 border border-emerald-500/40 text-emerald-200 text-xs shadow-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{readToast.message}</span>
          </div>
          <button
            onClick={() => setReadToast(null)}
            className="p-1 hover:text-white"
          >
            <HiOutlineXMark className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs: UNREAD vs READ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("unread")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "unread"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <HiOutlineClock className="w-4 h-4" />
            Unread Reports
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "unread"
                  ? "bg-black/30 text-white"
                  : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
              }`}
            >
              {unreadCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("read")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "read"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <HiOutlineCheckCircle className="w-4 h-4" />
            Read Reports
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "read"
                  ? "bg-black/30 text-white"
                  : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {readCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            All ({totalCount})
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports or teacher..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs"
            />
            <HiOutlineMagnifyingGlass className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs"
          >
            <option value="all">All Classes</option>
            {classLevels.map((lvl) => (
              <option key={lvl._id} value={lvl._id}>
                {lvl.name}
              </option>
            ))}
          </select>

          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs"
          >
            <option value="all">All Weeks</option>
            {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w.toString()}>
                Week {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">
          Loading class performance reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-400 flex items-center justify-center text-3xl mx-auto">
            {activeTab === "unread" ? "🎉" : "📑"}
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white text-base">
            {activeTab === "unread" ? "All Caught Up!" : "No Reports Found"}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {activeTab === "unread"
              ? "There are no unread weekly class performance reports pending administrative review."
              : "No class reports match your filter criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((rep) => {
            const isRead = rep.status === "read" || rep.isRead;

            return (
              <div
                key={rep._id}
                className={`rounded-3xl bg-white dark:bg-slate-900 border p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${
                  isRead
                    ? "border-emerald-500/30"
                    : "border-amber-500/50 bg-amber-50/20 dark:bg-amber-950/10 ring-1 ring-amber-500/30"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      Week {rep.weekNumber}
                    </span>

                    {isRead ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                        <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Read
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 animate-pulse">
                        <HiOutlineClock className="w-3.5 h-3.5" /> New / Unread
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                      {rep.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                      <HiOutlineUser className="w-3.5 h-3.5" />
                      <span>{rep.teacherName}</span>
                      <span className="text-slate-400 font-normal">• {rep.classLevelName}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {rep.summary}
                    </p>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-center">
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60">
                      <span className="text-[10px] text-slate-400 block font-medium">Attendance</span>
                      <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {rep.attendanceRate}%
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60">
                      <span className="text-[10px] text-slate-400 block font-medium">Pass Rate</span>
                      <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        {rep.passRate}%
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60">
                      <span className="text-[10px] text-slate-400 block font-medium">Avg Score</span>
                      <span className="font-bold text-xs text-violet-600 dark:text-violet-400">
                        {rep.averageScore}%
                      </span>
                    </div>
                  </div>

                  {/* Read Receipt info if already read */}
                  {isRead && rep.readAt && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                      <span>
                        Read on {new Date(rep.readAt).toLocaleDateString()} by{" "}
                        <strong>{rep.readByName || "Admin"}</strong>
                      </span>
                      {rep.adminFeedback && (
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 italic mt-0.5 truncate">
                          "{rep.adminFeedback}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-4 border-t border-gray-100 dark:border-slate-800">
                  {isRead ? (
                    <button
                      onClick={() => handleOpenReader(rep)}
                      className="w-full py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <HiOutlineEye className="w-4 h-4" />
                      View Read Report
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenReader(rep)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <HiOutlineDocumentText className="w-4 h-4" />
                      Review & Mark as Read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* READING & REVIEW MODAL */}
      {readingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 md:p-8 text-gray-900 dark:text-white shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    Week {readingReport.weekNumber}
                  </span>
                  <span className="text-xs text-slate-400">
                    {readingReport.classLevelName} • {readingReport.subjectName || "All Subjects"}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mt-1">
                  {readingReport.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span>Author: <strong>{readingReport.teacherName}</strong></span>
                  <span>•</span>
                  <span>Submitted: {new Date(readingReport.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setReadingReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-gray-900 dark:hover:text-white"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              {/* Metric stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Students</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {readingReport.totalStudents}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Attendance Rate</span>
                  <span className="text-sm font-bold text-emerald-500">{readingReport.attendanceRate}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Pass Rate</span>
                  <span className="text-sm font-bold text-indigo-500">{readingReport.passRate}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Average Score</span>
                  <span className="text-sm font-bold text-violet-500">{readingReport.averageScore}%</span>
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                  Teacher's Weekly Performance Summary
                </h4>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 leading-relaxed text-slate-800 dark:text-slate-200">
                  {readingReport.summary}
                </div>
              </div>

              {/* Topics */}
              {readingReport.topicsCovered && (
                <div>
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                    Topics / Curriculum Covered
                  </h4>
                  <p className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 font-medium">
                    {readingReport.topicsCovered}
                  </p>
                </div>
              )}

              {/* Students details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {readingReport.topPerformers && (
                  <div>
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                      Top Performing Students
                    </h4>
                    <p className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800/40">
                      {readingReport.topPerformers}
                    </p>
                  </div>
                )}

                {readingReport.studentsNeedingSupport && (
                  <div>
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                      Students Requiring Support
                    </h4>
                    <p className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800/40">
                      {readingReport.studentsNeedingSupport}
                    </p>
                  </div>
                )}
              </div>

              {/* Challenges & Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {readingReport.challenges && (
                  <div>
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                      Challenges Reported
                    </h4>
                    <p className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {readingReport.challenges}
                    </p>
                  </div>
                )}

                {readingReport.recommendations && (
                  <div>
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                      Recommendations to Administration
                    </h4>
                    <p className="p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                      {readingReport.recommendations}
                    </p>
                  </div>
                )}
              </div>

              {/* Admin Feedback Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800 border border-indigo-200/80 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  Administrative Feedback / Notes to Teacher (Optional)
                </label>
                <textarea
                  rows={2}
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  placeholder="Enter notes or recommendations for the teacher (this will be attached to the notification sent to the teacher)..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs"
                />
                <span className="text-[11px] text-slate-500 block">
                  🔔 Marking this report as read will immediately notify Teacher <strong>{readingReport.teacherName}</strong>.
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="border-t border-gray-100 dark:border-slate-800 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setReadingReport(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmRead}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <HiOutlineCheckCircle className="w-4 h-4" />
                {actionLoading
                  ? "Marking as Read..."
                  : readingReport.isRead
                  ? "Update Feedback & Notify Teacher"
                  : "Mark as Read & Notify Teacher"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
