import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchTeacherProfile } from "../../features/teacherAuth/teacherAuthSlice";
import { fetchTeacherClassStudents, type Student } from "../../features/students/studentsSlice";
import { fetchExams } from "../../features/exams/examsSlice";
import { fetchTeacherQuestions } from "../../features/questions/questionsSlice";
import { fetchMyAssignments } from "../../features/classTeachers/classTeachersSlice";
import { Link } from "react-router-dom";
import {
  FiSun,
  FiHome,
  FiBookOpen,
  FiAward,
  FiCalendar,
  FiUsers,
  FiFileText,
  FiHelpCircle,
  FiSearch,
  FiArrowRight,
  FiEdit3,
  FiClipboard,
  FiClock,
  FiCheck,
  FiCheckCircle,
  FiUser,
  FiX,
  FiShield,
  FiInfo,
} from "react-icons/fi";

export default function TeacherDashboard() {
  const dispatch = useAppDispatch();
  const { teacher } = useAppSelector((state) => state.teacherAuth);
  const { myAssignments } = useAppSelector((state) => state.classTeachers);
  const { teacherClassStudents, loading: studentsLoading } = useAppSelector((state) => state.students);
  const { items: exams, loading: examsLoading } = useAppSelector((state) => state.exams);
  const { teacherQuestions } = useAppSelector((state) => state.questions);

  const [studentSearch, setStudentSearch] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [examTab, setExamTab] = useState<"accessible" | "admin" | "my">("accessible");

  useEffect(() => {
    dispatch(fetchTeacherProfile());
    dispatch(fetchMyAssignments());
    dispatch(fetchTeacherClassStudents());
    dispatch(fetchExams());
    dispatch(fetchTeacherQuestions());
  }, [dispatch]);

  const teacherId = teacher?._id || (teacher as any)?.id;
  const t = teacher as any;

  // Filter questions authored by this teacher only
  const myQuestions = useMemo(() => {
    if (!teacherId) return teacherQuestions;
    return teacherQuestions.filter((q) => {
      const creatorId = q.createdBy?._id || q.createdBy;
      return !creatorId || creatorId.toString() === teacherId.toString();
    });
  }, [teacherQuestions, teacherId]);

  // Filtered questions for dashboard search
  const filteredQuestions = useMemo(() => {
    if (!questionSearch.trim()) return myQuestions;
    const q = questionSearch.toLowerCase().trim();
    return myQuestions.filter((item) => {
      const examName = item.exam?.name || "";
      return (
        item.question?.toLowerCase().includes(q) ||
        item.optionA?.toLowerCase().includes(q) ||
        item.optionB?.toLowerCase().includes(q) ||
        item.optionC?.toLowerCase().includes(q) ||
        item.optionD?.toLowerCase().includes(q) ||
        examName.toLowerCase().includes(q)
      );
    });
  }, [myQuestions, questionSearch]);

  // Helper to identify if an exam was created by Admin / School Administration
  const isCreatedByAdmin = (e: any): boolean => {
    if (!e) return false;
    const role = e.createdBy?.role?.toLowerCase();
    if (role === "admin") return true;
    const name = (e.createdBy?.name || "").toLowerCase();
    if (name.includes("admin") || name.includes("school administration")) return true;
    if (!e.createdBy || (!e.createdBy.teacherId && e.createdBy.role !== "teacher")) return true;
    return false;
  };

  // Helper to identify if an exam was created by this logged-in teacher
  const isCreatedByMe = (e: any): boolean => {
    if (!teacherId || !e) return false;
    const creatorId = e.createdBy?._id || e.createdBy;
    const isCreator = creatorId && creatorId.toString() === teacherId.toString();
    const inExamsCreated =
      Array.isArray(t?.examsCreated) &&
      t.examsCreated.some(
        (ex: any) => (ex?._id || ex)?.toString() === e._id?.toString()
      );
    return Boolean(isCreator || inExamsCreated);
  };

  // Filter exams authored by this teacher
  const myExams = useMemo(() => {
    if (!teacherId) return exams;
    return exams.filter(isCreatedByMe);
  }, [exams, teacherId, t]);

  // Filter exams created by Admin
  const adminExams = useMemo(() => {
    return exams.filter(isCreatedByAdmin);
  }, [exams]);

  // All accessible exams: all Admin exams PLUS teacher's authored exams
  const accessibleExams = useMemo(() => {
    return exams.filter((e) => isCreatedByAdmin(e) || isCreatedByMe(e));
  }, [exams, teacherId, t]);

  // Exams displayed in the dashboard widget according to active tab
  const displayedDashboardExams = useMemo(() => {
    if (examTab === "admin") return adminExams;
    if (examTab === "my") return myExams;
    return accessibleExams;
  }, [examTab, adminExams, myExams, accessibleExams]);

  const isAssignedClassTeacher = useMemo(
    () => Array.isArray(myAssignments) && myAssignments.some((a: any) => a.isActive),
    [myAssignments]
  );

  const assignedClassLevelName =
    isAssignedClassTeacher
      ? (t?.classLevel?.name || t?.classLevel || "Assigned Level")
      : (t?.subject?.name || t?.subject ? `${t?.subject?.name || t?.subject} (Subject)` : "Subject Teacher");

  // Filter students strictly in the assigned class level offering the teacher subject alone
  const strictlyClassStudents = useMemo(() => {
    const list = teacherClassStudents || [];
    const teacherSubject = (t?.subject?.name || t?.subject || "").toString().trim().toLowerCase();
    const teacherStr = (t?.classLevel?.name || t?.classLevel || "").toString().trim();
    const teacherDigits = teacherStr.match(/\d+/)?.[0];

    // If teacher has neither class level nor subject restriction, return list
    if (!teacherStr && !teacherSubject) return list;

    return list.filter((s) => {
      const studentLevel = (s.currentClassLevel || "").toString().trim();
      const studentDigits = studentLevel.match(/\d+/)?.[0];

      // 1. If teacher has a class level restriction, student MUST strictly match that class level!
      if (teacherStr) {
        if (teacherDigits && studentDigits) {
          if (studentDigits !== teacherDigits) return false;
        } else if (studentLevel.toLowerCase() !== teacherStr.toLowerCase()) {
          return false;
        }
      }

      // 2. If teacher has a subject specified, student MUST be offering this teacher's subject alone
      if (teacherSubject) {
        const studentSub = (s.subject || "").toString().trim().toLowerCase();
        const matchesDirectSub =
          studentSub === teacherSubject ||
          studentSub.includes(teacherSubject) ||
          teacherSubject.includes(studentSub);

        const matchesEnrolledSub =
          Array.isArray((s as any).enrolledSubjects) &&
          (s as any).enrolledSubjects.some((es: any) => {
            const esSub = es?.subject;
            const esName = typeof esSub === "object" ? (esSub?.name || "") : (es?.name || "");
            const cleanEsName = esName.toString().trim().toLowerCase();
            return (
              cleanEsName === teacherSubject ||
              cleanEsName.includes(teacherSubject) ||
              teacherSubject.includes(cleanEsName)
            );
          });

        if (!matchesDirectSub && !matchesEnrolledSub) {
          return false;
        }
      }

      return true;
    });
  }, [teacherClassStudents, t?.classLevel, t?.subject]);

  // Filter students in the assigned class level for search
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return strictlyClassStudents;
    const q = studentSearch.toLowerCase().trim();
    return strictlyClassStudents.filter((s) => {
      return (
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.StudentId?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.currentClassLevel?.toLowerCase().includes(q)
      );
    });
  }, [strictlyClassStudents, studentSearch]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-2 sm:p-4 pb-12">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border border-emerald-500/20 p-6 sm:p-8 md:p-10 shadow-2xl shadow-emerald-950/40">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Teacher Workspace
              </span>
              {t?.teacherId && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-white/10 text-slate-300 border border-white/10">
                  ID: {t.teacherId}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Welcome back, {teacher?.name || "Teacher"}!</span>
              <FiSun className="w-8 h-8 text-amber-400 shrink-0" />
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Manage your assigned class students, create and publish exams, review questions in your bank, and evaluate student progress.
            </p>
          </div>

          {/* Academic Assignment Badges positioned in a row to the right */}
          <div className="flex flex-wrap items-center lg:justify-end gap-2.5 text-xs">
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center gap-2 shadow-sm backdrop-blur-md">
              <FiHome className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-400">Class Role:</span>
              <strong className="text-emerald-300 font-semibold whitespace-nowrap">
                {isAssignedClassTeacher
                  ? `Class Teacher (${t?.classLevel?.name || t?.classLevel || "Assigned Level"})`
                  : `Subject Teacher (${t?.subject?.name || t?.subject || "All Classes"})`}
              </strong>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center gap-2 shadow-sm backdrop-blur-md">
              <FiBookOpen className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-slate-400">Subject:</span>
              <strong className="text-teal-300 font-semibold whitespace-nowrap">
                {t?.subject?.name || t?.subject || "Not Assigned"}
              </strong>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center gap-2 shadow-sm backdrop-blur-md">
              <FiAward className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400">Program:</span>
              <strong className="text-indigo-300 font-semibold whitespace-nowrap">
                {t?.program?.name || t?.program || "General Academics"}
              </strong>
            </div>

            {t?.academicYear && (
              <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center gap-2 shadow-sm backdrop-blur-md">
                <FiCalendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-400">Year:</span>
                <strong className="text-amber-300 font-semibold whitespace-nowrap">
                  {t?.academicYear?.name || t?.academicYear}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: isAssignedClassTeacher ? "Class Students" : "Subject Students",
            value: strictlyClassStudents.length,
            label: isAssignedClassTeacher
              ? `Enrolled in ${assignedClassLevelName}`
              : (t?.subject ? `Enrolled in ${t?.subject?.name || t?.subject}` : "Taking your course"),
            icon: <FiUsers className="w-5 h-5 text-emerald-400 shrink-0" />,
            bg: "from-emerald-500/10 to-teal-500/5",
            border: "border-emerald-500/20",
            text: "text-emerald-400",
            badge: isAssignedClassTeacher ? "Class Roster" : "Subject Roster",
          },
          {
            title: "Accessible Exams",
            value: accessibleExams.length,
            label: `${adminExams.length} Admin · ${myExams.length} by you`,
            icon: <FiFileText className="w-5 h-5 text-blue-400 shrink-0" />,
            bg: "from-blue-500/10 to-cyan-500/5",
            border: "border-blue-500/20",
            text: "text-blue-400",
            badge: "Available to Teach",
          },
          {
            title: "Questions Authored",
            value: myQuestions.length,
            label: "Created by you",
            icon: <FiHelpCircle className="w-5 h-5 text-violet-400 shrink-0" />,
            bg: "from-violet-500/10 to-purple-500/5",
            border: "border-violet-500/20",
            text: "text-violet-400",
            badge: "Question Bank",
          },
          {
            title: "Teaching Subject",
            value: t?.subject?.name || t?.subject || "Main",
            label: t?.program?.name || t?.program || "Curriculum",
            icon: <FiBookOpen className="w-5 h-5 text-amber-400 shrink-0" />,
            bg: "from-amber-500/10 to-yellow-500/5",
            border: "border-amber-500/20",
            text: "text-amber-400",
            badge: "Department",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`p-5 rounded-3xl bg-gradient-to-br ${stat.bg} border ${stat.border} backdrop-blur-xl shadow-lg space-y-2 hover:scale-[1.01] transition-transform`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
                {stat.title}
              </span>
              <span className="p-2 rounded-xl bg-white/5 border border-white/10">{stat.icon}</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold ${stat.text} truncate`}>
              {stat.value}
            </div>
            <div className="flex items-center justify-between text-xs text-dark-400 pt-1 border-t border-white/5">
              <span className="truncate">{stat.label}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-dark-300 shrink-0">
                {stat.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. ASSIGNED CLASS STUDENTS SECTION ("each teacher should see all student in the class level assign to them") */}
      <div className="rounded-3xl bg-[#0e172a]/90 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
                <FiUsers className="w-4 h-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {isAssignedClassTeacher ? "My Class Students" : "My Subject Students"}
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {assignedClassLevelName}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              {isAssignedClassTeacher
                ? `Viewing all students enrolled in your assigned class level (${strictlyClassStudents.length} total students)`
                : `Viewing students offering your subject (${strictlyClassStudents.length} total students)`}
            </p>
          </div>

          {/* Actions & Student Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Link
              to="/teacher/results?open=true"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 shrink-0 ring-1 ring-emerald-300"
            >
              <FiFileText className="w-4 h-4 shrink-0" />
              Record Exam & Test
            </Link>

            <div className="relative w-full sm:w-64">
              <FiSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search student name or ID..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Student List View */}
        {studentsLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading assigned class students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <FiAward className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Students Found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              {studentSearch
                ? `No students matching "${studentSearch}". Try a different keyword.`
                : t?.classLevel
                ? `No students are currently enrolled under ${assignedClassLevelName}.`
                : "You do not have a specific class level assigned yet by the administrator."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.slice(0, 3).map((student) => {
                const programName =
                  typeof student.program === "object"
                    ? student.program?.name
                    : student.program || "General";

                return (
                  <div
                    key={student._id}
                    onClick={() => setSelectedStudent(student)}
                    className="p-4 sm:p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 transition-all duration-200 cursor-pointer space-y-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                        {student.name?.[0]?.toUpperCase() || "S"}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <h4 className="font-semibold text-white text-sm sm:text-base group-hover:text-emerald-300 transition-colors truncate">
                          {student.name}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">{student.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                      <span className="font-mono text-slate-300 font-medium">
                        {student.StudentId || student.studentId || "ID: —"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {student.currentClassLevel || assignedClassLevelName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate">Program: {programName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${
                          student.isSuspended
                            ? "bg-red-500/20 text-red-400"
                            : student.isWithDrawn
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {student.isSuspended
                          ? "Suspended"
                          : student.isWithDrawn
                          ? "Withdrawn"
                          : "Active"}
                      </span>
                    </div>

                    <Link
                      to={`/teacher/results?open=true&studentId=${encodeURIComponent(student.StudentId || student.studentId || student._id)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <FiFileText className="w-3.5 h-3.5 shrink-0" /> Record Exam & Test Score
                    </Link>
                  </div>
                );
              })}
            </div>

            {filteredStudents.length > 3 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
                <span className="text-slate-400">
                  Showing <strong className="text-white font-semibold">3</strong> of{" "}
                  <strong className="text-emerald-400 font-semibold">{filteredStudents.length}</strong> students enrolled in your class
                </span>
                <Link
                  to="/teacher/results"
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>View All Class Students & Results</span>
                  <FiArrowRight className="w-3.5 h-3.5 shrink-0" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. SCHOOL & TEACHER EXAMS WIDGET */}
      <div className="rounded-3xl bg-[#0e172a]/90 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
                <FiFileText className="w-4 h-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                School & Authored Exams
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              All exams created by Administration and authored by you ({accessibleExams.length} accessible · {adminExams.length} Admin · {myExams.length} authored)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setExamTab("accessible")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  examTab === "accessible"
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All ({accessibleExams.length})
              </button>
              <button
                onClick={() => setExamTab("admin")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  examTab === "admin"
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FiShield className="w-3.5 h-3.5 shrink-0" />
                <span>Admin ({adminExams.length})</span>
              </button>
              <button
                onClick={() => setExamTab("my")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  examTab === "my"
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FiEdit3 className="w-3.5 h-3.5 shrink-0" />
                <span>My Authored ({myExams.length})</span>
              </button>
            </div>

            <Link
              to="/teacher/exams"
              className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors px-2 py-1"
            >
              Manage All Exams <FiArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>
        </div>

        {examsLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading exams...</div>
        ) : displayedDashboardExams.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <FiClipboard className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white">
              {examTab === "admin"
                ? "No Admin Exams Found"
                : examTab === "my"
                ? "No Exams Authored Yet"
                : "No Exams Available"}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {examTab === "admin"
                ? "There are currently no institution-wide exams created by Admin."
                : "You haven't created any exams yet. Start preparing your class assessments today!"}
            </p>
            <Link
              to="/teacher/exams"
              className="inline-block px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md transition-all"
            >
              + Create First Exam
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedDashboardExams.slice(0, 3).map((exam) => (
                <div
                  key={exam._id}
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:border-blue-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {exam.examType || "Quiz"}
                        </span>
                        {isCreatedByAdmin(exam) ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 inline-flex items-center gap-1">
                            <FiShield className="w-3 h-3 shrink-0" />
                            <span>Admin Exam</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                            <FiEdit3 className="w-3 h-3 shrink-0" />
                            <span>My Exam</span>
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          exam.examStatus === "live"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {exam.examStatus === "live" ? (
                          <>
                            <FiCheckCircle className="w-3 h-3 shrink-0" />
                            <span>Live</span>
                          </>
                        ) : (
                          <>
                            <FiClock className="w-3 h-3 shrink-0" />
                            <span>Pending</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white truncate">{exam.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{exam.description || "No description provided."}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <FiClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{exam.duration || "N/A"}</span>
                      </span>
                      <span className="text-teal-300 font-semibold inline-flex items-center gap-1">
                        <FiHelpCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {Math.max(
                            exam.questions?.length || 0,
                            teacherQuestions.filter((q: any) => {
                              const qExamId = (q.exam?._id || q.exam || (q as any).examId)?.toString();
                              const eId = (exam._id || exam.id)?.toString();
                              return qExamId && eId && qExamId === eId;
                            }).length
                          )} Questions
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>By: <strong className="text-slate-300 font-medium">{isCreatedByAdmin(exam) ? "Administration" : (exam.createdBy?.name || teacher?.name || "Teacher")}</strong></span>
                      <Link to="/teacher/exams" className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1">
                        <span>View</span>
                        <FiArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {displayedDashboardExams.length > 3 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
                <span className="text-slate-400">
                  Showing <strong className="text-white font-semibold">3</strong> of{" "}
                  <strong className="text-blue-400 font-semibold">{displayedDashboardExams.length}</strong> exams ({examTab === "admin" ? "Admin" : examTab === "my" ? "Authored" : "All"})
                </span>
                <Link
                  to="/teacher/exams"
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>Manage All Exams</span>
                  <FiArrowRight className="w-3.5 h-3.5 shrink-0" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. MY AUTHORED QUESTIONS SECTION ("only the questions created by each teacher should seen on their dashboard") */}
      <div className="rounded-3xl bg-[#0e172a]/90 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center font-bold text-sm">
                <FiHelpCircle className="w-4 h-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                My Authored Questions
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {myQuestions.length} Questions
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Questions created exclusively by you across your test papers
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Question search input */}
            <div className="relative w-full sm:w-64">
              <FiSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search your questions..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              />
            </div>

            <Link
              to="/teacher/questions"
              className="px-4 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>Question Bank</span>
              <FiArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>
        </div>

        {myQuestions.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
              <FiInfo className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white">No Questions Authored Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't authored any questions yet. Create test items for your examinations today!
            </p>
            <Link
              to="/teacher/questions"
              className="inline-block px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-black font-bold text-xs shadow-md transition-all"
            >
              + Create First Question
            </Link>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
            No questions matching "{questionSearch}".
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuestions.slice(0, 2).map((q, idx) => (
                <div
                  key={q._id || idx}
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      {q.exam?.name ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 truncate max-w-[200px]">
                          {q.exam.name}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/10 text-slate-400">
                          Exam Item
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-white line-clamp-2">
                    {q.question}
                  </p>

                  {/* Multiple choice options */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    {[
                      { label: "A", val: q.optionA, key: "optionA" },
                      { label: "B", val: q.optionB, key: "optionB" },
                      { label: "C", val: q.optionC, key: "optionC" },
                      { label: "D", val: q.optionD, key: "optionD" },
                    ].map((opt) => {
                      const isCorrect =
                        q.correctAnswer === opt.key ||
                        q.correctAnswer?.toLowerCase().trim() === opt.val?.toLowerCase().trim();
                      return (
                        <div
                          key={opt.key}
                          className={`p-2 rounded-xl border flex items-center gap-2 ${
                            isCorrect
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold"
                              : "bg-white/5 border-white/5 text-slate-400"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${
                              isCorrect
                                ? "bg-emerald-500 text-black"
                                : "bg-white/10 text-slate-300"
                            }`}
                          >
                            {opt.label}
                          </span>
                          <span className="truncate">{opt.val}</span>
                          {isCorrect && <FiCheck className="ml-auto w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {filteredQuestions.length > 2 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
                <span className="text-slate-400">
                  Showing <strong className="text-white font-semibold">2</strong> of{" "}
                  <strong className="text-violet-400 font-semibold">{filteredQuestions.length}</strong> authored questions
                </span>
                <Link
                  to="/teacher/questions"
                  className="text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>View All in Question Bank</span>
                  <FiArrowRight className="w-3.5 h-3.5 shrink-0" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. QUICK SHORTCUTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/teacher/questions"
          className="p-5 rounded-2xl bg-gradient-to-br hover:bg-gray-900 hover:text-white from-violet-600/10 to-purple-600/5 border border-violet-500/20 hover:border-violet-500/40 p-5 space-y-2 group transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
            <FiHelpCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate text-base">Question Bank</h3>
          <p className="text-xs text-dark-400">
            Create, inspect, and update multiple choice questions for all your tests.
          </p>
        </Link>

        <Link
          to="/teacher/exams"
          className="p-5 rounded-2xl bg-gradient-to-br hover:bg-gray-900 hover:text-white from-emerald-600/10 to-teal-600/5 border border-emerald-500/20 hover:border-emerald-500/40 p-5 space-y-2 group transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
            <FiFileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate text-base">My Exam Schedules</h3>
          <p className="text-xs text-dark-400">
            Configure examination schedules, durations, and manage questions per exam.
          </p>
        </Link>

        <Link
          to="/teacher/profile"
          className="p-5 rounded-2xl bg-gradient-to-br hover:bg-gray-900 from-blue-600/10 hover:text-white to-cyan-600/5 border border-blue-500/20 hover:border-blue-500/40 p-5 space-y-2 group transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
            <FiUser className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate text-base">Educator Profile</h3>
          <p className="text-xs text-dark-400">
            Review your academic assignments, staff credentials, and update password.
          </p>
        </Link>
      </div>

      {/* 6. STUDENT DETAIL MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0b1329] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-lg flex items-center justify-center">
                  {selectedStudent.name?.[0]?.toUpperCase() || "S"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-400">{selectedStudent.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-400">Student ID</span>
                <span className="font-mono text-white font-semibold">
                  {selectedStudent.StudentId || selectedStudent.studentId || "—"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-400">Class Level</span>
                <span className="text-emerald-300 font-semibold">
                  {selectedStudent.currentClassLevel || assignedClassLevelName}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-400">Program</span>
                <span className="text-white">
                  {typeof selectedStudent.program === "object"
                    ? selectedStudent.program?.name
                    : selectedStudent.program || "General"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-400">Admission Date</span>
                <span className="text-white">
                  {selectedStudent.dateAdmitted
                    ? new Date(selectedStudent.dateAdmitted).toLocaleDateString()
                    : "—"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-400">Status</span>
                <span className="text-emerald-400 font-bold">
                  {selectedStudent.isSuspended
                    ? "Suspended"
                    : selectedStudent.isWithDrawn
                    ? "Withdrawn"
                    : "Active Student"}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <Link
                to={`/teacher/results?open=true&studentId=${encodeURIComponent(selectedStudent.StudentId || selectedStudent.studentId || selectedStudent._id)}`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <FiFileText className="w-3.5 h-3.5 shrink-0" /> Record Exam & Test Score
              </Link>
              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer"
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
