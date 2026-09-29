import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchTeacherClassReports,
  createClassReport,
  clearReportStatus,
  type ClassReportItem,
} from "../../features/classReports/classReportsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import { fetchSubjects } from "../../features/subjects/subjectsSlice";
import { fetchTeacherClassStudents } from "../../features/students/studentsSlice";
import {
  HiOutlineDocumentText,
  HiOutlinePlusCircle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineEye,
  HiOutlineXMark,
} from "react-icons/hi2";

export default function TeacherWeeklyReports() {
  const dispatch = useAppDispatch();
  const { reports, unreadReports, readReports, loading, submitting, error, successMessage } =
    useAppSelector((state) => state.classReports);
  const { items: classLevels } = useAppSelector((state) => state.classLevels);
  const { items: subjects } = useAppSelector((state) => state.subjects);
  const { teacherClassStudents } = useAppSelector((state) => state.students);
  const teacher = useAppSelector((state) => state.teacherAuth.teacher);

  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<ClassReportItem | null>(null);

  // Form state
  const [form, setForm] = useState({
    weekNumber: 1,
    weekStartDate: "",
    weekEndDate: "",
    classLevel: "",
    subject: "",
    title: "",
    summary: "",
    totalStudents: 0,
    attendanceRate: 95,
    passRate: 85,
    averageScore: 78,
    topPerformers: "",
    studentsNeedingSupport: "",
    topicsCovered: "",
    challenges: "",
    recommendations: "",
  });

  useEffect(() => {
    dispatch(fetchTeacherClassReports());
    dispatch(fetchClassLevels());
    dispatch(fetchSubjects());
    dispatch(fetchTeacherClassStudents());
  }, [dispatch]);

  // Pre-fill teacher's assigned class level and subject
  useEffect(() => {
    if (teacher) {
      const teacherObj = teacher as any;
      const rawClass = typeof teacherObj.classLevel === "object" ? teacherObj.classLevel?._id : teacherObj.classLevel;
      const rawSubject = typeof teacherObj.subject === "object" ? teacherObj.subject?._id : teacherObj.subject;

      // Find matching classLevel by ID or name
      let matchedClassId = "";
      if (rawClass) {
        const found = classLevels.find(
          (c) => c._id === rawClass || c.name?.trim().toLowerCase() === String(rawClass).trim().toLowerCase()
        );
        matchedClassId = found ? found._id : (classLevels[0]?._id ?? String(rawClass));
      } else if (classLevels.length > 0) {
        matchedClassId = classLevels[0]._id;
      }

      // Find matching subject by ID or name
      let matchedSubjectId = "";
      if (rawSubject) {
        const found = subjects.find(
          (s) => s._id === rawSubject || s.name?.trim().toLowerCase() === String(rawSubject).trim().toLowerCase()
        );
        matchedSubjectId = found ? found._id : (subjects[0]?._id ?? String(rawSubject));
      } else if (subjects.length > 0) {
        matchedSubjectId = subjects[0]._id;
      }

      setForm((prev) => ({
        ...prev,
        classLevel: prev.classLevel || matchedClassId || (classLevels[0]?._id ?? ""),
        subject: prev.subject || matchedSubjectId || (subjects[0]?._id ?? ""),
        totalStudents: prev.totalStudents || teacherClassStudents.length || 25,
      }));
    }
  }, [teacher, classLevels, subjects, teacherClassStudents]);

  const currentDisplayReports = useMemo(() => {
    if (activeTab === "unread") return unreadReports;
    if (activeTab === "read") return readReports;
    return reports;
  }, [activeTab, reports, unreadReports, readReports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.summary.trim()) {
      alert("Please provide a summary of the class performance for this week.");
      return;
    }

    const payload = {
      ...form,
      weekNumber: Number(form.weekNumber),
      totalStudents: Number(form.totalStudents),
      attendanceRate: Number(form.attendanceRate),
      passRate: Number(form.passRate),
      averageScore: Number(form.averageScore),
    };

    const resAction = await dispatch(createClassReport(payload));
    if (createClassReport.fulfilled.match(resAction)) {
      setShowCreateModal(false);
      setForm((prev) => ({
        ...prev,
        weekNumber: Number(prev.weekNumber) + 1,
        title: "",
        summary: "",
        topPerformers: "",
        studentsNeedingSupport: "",
        topicsCovered: "",
        challenges: "",
        recommendations: "",
      }));
      dispatch(fetchTeacherClassReports());
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
              <HiOutlineDocumentText className="w-4 h-4 text-indigo-400" />
              Administrative Weekly Reporting
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Weekly Class Performance Reports 📊
            </h1>
            <p className="text-xs md:text-sm text-indigo-200/80 max-w-2xl leading-relaxed">
              Submit your weekly class academic summary, attendance rates, challenges, and recommendations directly to school administration. You will be automatically notified as soon as administration reviews your report.
            </p>
          </div>

          <button
            onClick={() => {
              dispatch(clearReportStatus());
              setShowCreateModal(true);
            }}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer w-fit shrink-0"
          >
            <HiOutlinePlusCircle className="w-4 h-4" />
            Submit Weekly Report
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => dispatch(clearReportStatus())}
            className="p-1 hover:text-white"
          >
            <HiOutlineXMark className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineExclamationTriangle className="w-5 h-5 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => dispatch(clearReportStatus())}
            className="p-1 hover:text-white"
          >
            <HiOutlineXMark className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xl font-bold">
            📋
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {reports.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Total Reports Submitted
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold">
            <HiOutlineCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {readReports.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Read & Acknowledged by Admin
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-bold">
            <HiOutlineClock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-500">
              {unreadReports.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Unread / Pending Admin Review
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          All Reports ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab("unread")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "unread"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
              : "bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <HiOutlineClock className="w-4 h-4" />
          Pending Review ({unreadReports.length})
        </button>

        <button
          onClick={() => setActiveTab("read")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "read"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <HiOutlineCheckCircle className="w-4 h-4" />
          Read by Admin ({readReports.length})
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">
          Loading performance reports...
        </div>
      ) : currentDisplayReports.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-400 flex items-center justify-center text-3xl mx-auto">
            📑
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white text-base">
            No Reports Found
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {activeTab === "unread"
              ? "You have no reports currently pending review by administration."
              : activeTab === "read"
              ? "Administration has not marked any reports as read yet."
              : "You haven't submitted any weekly class performance reports yet. Click 'Submit Weekly Report' above to send one."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentDisplayReports.map((rep) => {
            const isRead = rep.status === "read" || rep.isRead;
            return (
              <div
                key={rep._id}
                className={`rounded-3xl bg-white dark:bg-slate-900 border p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${
                  isRead
                    ? "border-emerald-500/30"
                    : "border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      Week {rep.weekNumber}
                    </span>

                    {isRead ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" />
                        Read by Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <HiOutlineClock className="w-4 h-4 text-amber-500" />
                        Pending Review
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                      {rep.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {rep.summary}
                    </p>
                  </div>

                  {/* Metrics Badge Row */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-center">
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60">
                      <span className="text-[10px] text-slate-400 block font-medium">Students</span>
                      <span className="font-bold text-xs text-gray-900 dark:text-white">
                        {rep.totalStudents || 0}
                      </span>
                    </div>

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

                  {/* Read Receipt info if read */}
                  {isRead && rep.readAt && (
                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                        Reviewed by {rep.readByName || "Administration"} on{" "}
                        {new Date(rep.readAt).toLocaleDateString()}
                      </div>
                      {rep.adminFeedback && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                          "{rep.adminFeedback}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Submitted: {new Date(rep.createdAt).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => setSelectedReportDetail(rep)}
                    className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <HiOutlineEye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE REPORT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 md:p-8 text-gray-900 dark:text-white shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  New Submission
                </span>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                  Submit Weekly Class Performance Report
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-gray-900 dark:hover:text-white"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Week Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={form.weekNumber}
                    onChange={(e) => setForm({ ...form, weekNumber: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Class Level *
                  </label>
                  <select
                    value={form.classLevel}
                    onChange={(e) => setForm({ ...form, classLevel: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                  >
                    <option value="">Select Class Level</option>
                    {classLevels.map((lvl) => (
                      <option key={lvl._id} value={lvl._id}>
                        {lvl.name}
                      </option>
                    ))}
                    {form.classLevel && !classLevels.some((l) => l._id === form.classLevel) && (
                      <option value={form.classLevel}>{form.classLevel}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Subject / Course
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                  >
                    <option value="">General Class Performance (All Subjects)</option>
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                    {form.subject && !subjects.some((s) => s._id === form.subject) && (
                      <option value={form.subject}>{form.subject}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Week Start Date
                  </label>
                  <input
                    type="date"
                    value={form.weekStartDate}
                    onChange={(e) => setForm({ ...form, weekStartDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Week End Date
                  </label>
                  <input
                    type="date"
                    value={form.weekEndDate}
                    onChange={(e) => setForm({ ...form, weekEndDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-200/80 dark:border-slate-700/80 space-y-3">
                <span className="text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400">
                  Weekly Class Key Metrics
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Total Students
                    </label>
                    <input
                      type="number"
                      value={form.totalStudents}
                      onChange={(e) => setForm({ ...form, totalStudents: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Attendance Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.attendanceRate}
                      onChange={(e) => setForm({ ...form, attendanceRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Pass Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.passRate}
                      onChange={(e) => setForm({ ...form, passRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Average Score (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.averageScore}
                      onChange={(e) => setForm({ ...form, averageScore: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Weekly Class Executive Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Provide a comprehensive summary of student participation, syllabus progress, and weekly achievements..."
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Topics / Curriculum Covered This Week
                </label>
                <input
                  type="text"
                  value={form.topicsCovered}
                  onChange={(e) => setForm({ ...form, topicsCovered: e.target.value })}
                  placeholder="e.g. Chapter 4: Linear Equations & Graphs"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Top Performing Students
                  </label>
                  <input
                    type="text"
                    value={form.topPerformers}
                    onChange={(e) => setForm({ ...form, topPerformers: e.target.value })}
                    placeholder="e.g. Alice Smith (98%), Michael Brown (94%)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Students Needing Academic Support
                  </label>
                  <input
                    type="text"
                    value={form.studentsNeedingSupport}
                    onChange={(e) => setForm({ ...form, studentsNeedingSupport: e.target.value })}
                    placeholder="e.g. David Lee (low quiz score), Emma Johnson (absent twice)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Challenges Faced
                  </label>
                  <textarea
                    rows={2}
                    value={form.challenges}
                    onChange={(e) => setForm({ ...form, challenges: e.target.value })}
                    placeholder="e.g. Shortage of textbook copies, noisy neighboring classroom..."
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Recommendations to Administration
                  </label>
                  <textarea
                    rows={2}
                    value={form.recommendations}
                    onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
                    placeholder="e.g. Provide additional practice workbooks, schedule tutoring..."
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? "Sending Report to Admin..." : "Submit to Administration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedReportDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 md:p-8 text-gray-900 dark:text-white shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    Week {selectedReportDetail.weekNumber}
                  </span>
                  {selectedReportDetail.isRead ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <HiOutlineCheckCircle className="w-4 h-4" /> Read by Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
                      <HiOutlineClock className="w-4 h-4" /> Pending Admin Review
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1">
                  {selectedReportDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-gray-900 dark:hover:text-white"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              {/* Metric stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Students</span>
                  <span className="text-sm font-bold">{selectedReportDetail.totalStudents}</span>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Attendance</span>
                  <span className="text-sm font-bold text-emerald-500">{selectedReportDetail.attendanceRate}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Pass Rate</span>
                  <span className="text-sm font-bold text-indigo-500">{selectedReportDetail.passRate}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Avg Score</span>
                  <span className="text-sm font-bold text-violet-500">{selectedReportDetail.averageScore}%</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                  Weekly Executive Summary
                </h4>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 leading-relaxed">
                  {selectedReportDetail.summary}
                </div>
              </div>

              {selectedReportDetail.topicsCovered && (
                <div>
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                    Topics / Curriculum Covered
                  </h4>
                  <p className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 font-medium">
                    {selectedReportDetail.topicsCovered}
                  </p>
                </div>
              )}

              {selectedReportDetail.topPerformers && (
                <div>
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                    Top Performers
                  </h4>
                  <p className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800/40">
                    {selectedReportDetail.topPerformers}
                  </p>
                </div>
              )}

              {selectedReportDetail.studentsNeedingSupport && (
                <div>
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                    Students Needing Support
                  </h4>
                  <p className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800/40">
                    {selectedReportDetail.studentsNeedingSupport}
                  </p>
                </div>
              )}

              {selectedReportDetail.challenges && (
                <div>
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                    Challenges Faced
                  </h4>
                  <p className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
                    {selectedReportDetail.challenges}
                  </p>
                </div>
              )}

              {selectedReportDetail.recommendations && (
                <div>
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                    Recommendations to Administration
                  </h4>
                  <p className="p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                    {selectedReportDetail.recommendations}
                  </p>
                </div>
              )}

              {/* Admin Review Status */}
              <div className="pt-2">
                {selectedReportDetail.isRead ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" />
                      <span>Reviewed and Marked as Read by Administration</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">
                      Reviewer: <strong>{selectedReportDetail.readByName || "Admin"}</strong> • Read on:{" "}
                      {selectedReportDetail.readAt
                        ? new Date(selectedReportDetail.readAt).toLocaleString()
                        : "Verified"}
                    </div>
                    {selectedReportDetail.adminFeedback && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 mt-2">
                        <span className="block font-bold text-emerald-700 dark:text-emerald-300 text-[10px] uppercase">
                          Admin Feedback:
                        </span>
                        <p className="text-xs italic text-slate-700 dark:text-slate-200 mt-0.5">
                          "{selectedReportDetail.adminFeedback}"
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-center gap-3">
                    <HiOutlineClock className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <div className="font-bold">Pending Review</div>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                        This report is currently in the administration's unread queue. You will receive a navbar notification once the administrator opens and acknowledges it.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-800 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
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
