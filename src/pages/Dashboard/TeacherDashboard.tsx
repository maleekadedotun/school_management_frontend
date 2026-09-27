import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchTeacherProfile } from "../../features/teacherAuth/teacherAuthSlice";
import { fetchTeacherClassStudents, type Student } from "../../features/students/studentsSlice";
import { fetchExams } from "../../features/exams/examsSlice";
import { fetchTeacherQuestions } from "../../features/questions/questionsSlice";
import { Link } from "react-router-dom";

export default function TeacherDashboard() {
  const dispatch = useAppDispatch();
  const { teacher } = useAppSelector((state) => state.teacherAuth);
  const { teacherClassStudents, loading: studentsLoading } = useAppSelector((state) => state.students);
  const { items: exams, loading: examsLoading } = useAppSelector((state) => state.exams);
  const { teacherQuestions } = useAppSelector((state) => state.questions);

  const [studentSearch, setStudentSearch] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    dispatch(fetchTeacherProfile());
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

  // Filter exams authored by this teacher
  const myExams = useMemo(() => {
    if (!teacherId) return exams;
    return exams.filter((e) => {
      const creatorId = e.createdBy?._id || e.createdBy;
      const isCreator = creatorId && creatorId.toString() === teacherId.toString();
      const inExamsCreated =
        Array.isArray(t?.examsCreated) &&
        t.examsCreated.some(
          (ex: any) => (ex?._id || ex)?.toString() === e._id?.toString()
        );
      return isCreator || inExamsCreated;
    });
  }, [exams, teacherId, t]);

  const assignedClassLevelName =
    t?.classLevel?.name || t?.classLevel || (t?.subject?.name || t?.subject ? `${t?.subject?.name || t?.subject} (Subject)` : "Assigned Level");

  // Filter students strictly in the assigned class level or subject
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

      // 2. If student is assigned to this teacher directly and matches class (or teacher has no class restriction)
      const assignedId = (s.assignedTeacher as any)?._id || s.assignedTeacher;
      if (assignedId && (assignedId.toString() === teacherId?.toString() || assignedId.toString() === t?._id?.toString())) {
        return true;
      }

      // 3. If student matches teacher subject
      const studentSub = (s.subject || "").toString().trim().toLowerCase();
      if (teacherSubject && studentSub && teacherSubject === studentSub) {
        return true;
      }

      // 4. If teacher has a class level specified and no subject
      if (teacherStr && !teacherSubject) {
        return true;
      }

      return false;
    });
  }, [teacherClassStudents, t?.classLevel, t?.subject, teacherId, t?._id]);

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
          <div className="space-y-3">
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

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, {teacher?.name || "Teacher"}! 👋
            </h1>

            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              Manage your assigned class students, create and publish exams, review questions in your bank, and evaluate student progress.
            </p>

            {/* Academic Assignment Badges */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white flex items-center gap-1.5">
                <span className="text-emerald-400">🏫</span>
                <span className="text-slate-400">Class Level:</span>
                <strong className="text-emerald-300 font-semibold">
                  {t?.classLevel?.name || t?.classLevel || (t?.subject ? "All Classes (Subject Teacher)" : "Not Assigned")}
                </strong>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white flex items-center gap-1.5">
                <span className="text-teal-400">📖</span>
                <span className="text-slate-400">Subject:</span>
                <strong className="text-teal-300 font-semibold">
                  {t?.subject?.name || t?.subject || "Not Assigned"}
                </strong>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white flex items-center gap-1.5">
                <span className="text-indigo-400">🎓</span>
                <span className="text-slate-400">Program:</span>
                <strong className="text-indigo-300 font-semibold">
                  {t?.program?.name || t?.program || "General Academics"}
                </strong>
              </div>

              {t?.academicYear && (
                <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white flex items-center gap-1.5">
                  <span className="text-amber-400">📅</span>
                  <span className="text-slate-400">Year:</span>
                  <strong className="text-amber-300 font-semibold">
                    {t?.academicYear?.name || t?.academicYear}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/teacher/exams"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Create Exam
            </Link>

            <Link
              to="/teacher/questions"
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <span>❓</span>
              Question Bank
            </Link>
          </div>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Assigned Students",
            value: strictlyClassStudents.length,
            label: t?.classLevel ? `Enrolled in ${assignedClassLevelName}` : (t?.subject ? `Enrolled in ${t?.subject?.name || t?.subject}` : "Assigned to you"),
            icon: "👥",
            bg: "from-emerald-500/10 to-teal-500/5",
            border: "border-emerald-500/20",
            text: "text-emerald-400",
            badge: "Class Roster",
          },
          {
            title: "My Created Exams",
            value: myExams.length,
            label: "Authored by you",
            icon: "📝",
            bg: "from-blue-500/10 to-cyan-500/5",
            border: "border-blue-500/20",
            text: "text-blue-400",
            badge: "Assessments",
          },
          {
            title: "Questions Authored",
            value: myQuestions.length,
            label: "Created by you",
            icon: "❓",
            bg: "from-violet-500/10 to-purple-500/5",
            border: "border-violet-500/20",
            text: "text-violet-400",
            badge: "Question Bank",
          },
          {
            title: "Teaching Subject",
            value: t?.subject?.name || t?.subject || "Main",
            label: t?.program?.name || t?.program || "Curriculum",
            icon: "📖",
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
              <span className="text-lg">{stat.icon}</span>
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
                👥
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                My Class Students
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {assignedClassLevelName}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Viewing all students enrolled in your assigned class level ({strictlyClassStudents.length} total students)
            </p>
          </div>

          {/* Student Search */}
          <div className="relative w-full md:w-72">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
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
            <span className="text-4xl block">🎓</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => {
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MY RECENT EXAMS WIDGET */}
      <div className="rounded-3xl bg-[#0e172a]/90 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
                📝
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                My Authored Exams
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Recent exams created by you ({myExams.length} total exams created)
            </p>
          </div>

          <Link
            to="/teacher/exams"
            className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
          >
            Manage All Exams →
          </Link>
        </div>

        {examsLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading your exams...</div>
        ) : myExams.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <span className="text-3xl block">📋</span>
            <h4 className="text-base font-bold text-white">No Exams Authored Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't created any exams yet. Start preparing your class assessments today!
            </p>
            <Link
              to="/teacher/exams"
              className="inline-block px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md transition-all"
            >
              + Create First Exam
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myExams.slice(0, 6).map((exam) => (
              <div
                key={exam._id}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:border-blue-500/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {exam.examType || "Quiz"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      exam.examStatus === "live"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {exam.examStatus === "live" ? "🟢 Live" : "🟡 Pending"}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white truncate">{exam.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{exam.description || "No description provided."}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                  <span>⏱️ {exam.duration || "N/A"}</span>
                  <span className="text-teal-300 font-semibold">
                    ❓ {exam.questions?.length || 0} Questions
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. MY AUTHORED QUESTIONS SECTION ("only the questions created by each teacher should seen on their dashboard") */}
      <div className="rounded-3xl bg-[#0e172a]/90 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center font-bold text-sm">
                ❓
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
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
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
              <span>→</span>
            </Link>
          </div>
        </div>

        {myQuestions.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <span className="text-3xl block">💡</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuestions.slice(0, 6).map((q, idx) => (
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
                        {isCorrect && <span className="ml-auto text-emerald-400 text-xs font-bold">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
            ❓
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
            📝
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
            👤
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
                ✕
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

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all"
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
