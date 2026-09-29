import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import api from "../../services/api";
import {
  fetchAllStudents,
  fetchTeacherClassStudents,
  registerStudent,
  updateStudentAdmin,
  suspendStudent,
  unsuspendStudent,
  withdrawStudent,
  unwithdrawStudent,
  type Student,
} from "../../features/students/studentsSlice";
import { fetchTeacherProfile } from "../../features/teacherAuth/teacherAuthSlice";

export default function StudentsList() {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((s) => s.auth);
  const teacherState = useAppSelector((s) => s.teacherAuth);
  const storedRole = localStorage.getItem("userRole");
  const isTeacher =
    teacherState.teacher?.role === "teacher" ||
    storedRole === "teacher" ||
    (!authState.admin && !!localStorage.getItem("teacherToken"));

  const { students, teacherClassStudents, teacherClassLevel, loading, error } = useAppSelector((s) => s.students);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Student Results Modal state
  const [resultsStudent, setResultsStudent] = useState<Student | null>(null);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [studentResultsLoading, setStudentResultsLoading] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", classLevels: "Level 100", subject: "", program: "" });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    classLevels: "",
    subject: "",
    prefectName: "",
    program: "",
    academicYear: "",
    isSuspended: false,
    isWithDrawn: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Academic & Teacher data for admin student assignment
  const [programs, setPrograms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    if (isTeacher) {
      dispatch(fetchTeacherClassStudents());
      dispatch(fetchTeacherProfile());
    } else {
      dispatch(fetchAllStudents());
      Promise.allSettled([
        api.get("/programs"),
        api.get("/subjects"),
        api.get("/class-levels"),
        api.get("/academic-years"),
        api.get("/teachers/admin"),
      ]).then(([pRes, sRes, cRes, yRes, tRes]) => {
        if (pRes.status === "fulfilled") setPrograms(pRes.value.data?.data || []);
        if (sRes.status === "fulfilled") setSubjects(sRes.value.data?.data || []);
        if (cRes.status === "fulfilled") setClassLevels(cRes.value.data?.data || []);
        if (yRes.status === "fulfilled") setAcademicYears(yRes.value.data?.data || []);
        if (tRes.status === "fulfilled") setTeachers(tRes.value.data?.data || []);
      });
    }
  }, [dispatch, isTeacher]);

  // Helper to group subjects by the chosen program while keeping ALL created subjects accessible
  const getSubjectGroups = (programVal: string) => {
    if (!programVal) {
      return { programSubjects: subjects, otherSubjects: [] };
    }
    const matched = programs.find(
      (p: any) => p.name?.toLowerCase() === programVal.toLowerCase() || p._id === programVal
    );
    const programId = (matched?._id || programVal).toString();
    const programName = (matched?.name || programVal).toString().toLowerCase();

    const programSubjects: any[] = [];
    const otherSubjects: any[] = [];

    subjects.forEach((s: any) => {
      const sProgId = typeof s.program === "object" ? s.program?._id?.toString() : s.program?.toString();
      const sProgName = typeof s.program === "object" ? s.program?.name?.toLowerCase() : "";
      const isInProgramArray =
        matched &&
        Array.isArray(matched.subjects) &&
        matched.subjects.some((sub: any) => (sub?._id || sub)?.toString() === s._id?.toString());

      if (
        isInProgramArray ||
        (sProgId && sProgId === programId) ||
        (sProgName && sProgName === programName)
      ) {
        programSubjects.push(s);
      } else {
        otherSubjects.push(s);
      }
    });

    return { programSubjects, otherSubjects };
  };



  // Preview the teacher auto-picked by the system for the chosen subject and class level
  const matchedTeacherPreview = useMemo(() => {
    if (!editForm.subject || !editForm.classLevels) return null;
    const sub = editForm.subject.toLowerCase().trim();
    const clsDigits = editForm.classLevels.toString().match(/\d+/)?.[0];
    return teachers.find((t: any) => {
      const tSub = (t.subject || "").toLowerCase().trim();
      const tDigits = (t.classLevel || "").toString().match(/\d+/)?.[0];
      const subMatch = tSub === sub;
      const classMatch = clsDigits && tDigits
        ? clsDigits === tDigits
        : (t.classLevel || "").toLowerCase().trim() === editForm.classLevels.toLowerCase().trim();
      return subMatch && classMatch;
    });
  }, [editForm.subject, editForm.classLevels, teachers]);

  const handleViewResults = async (s: Student) => {
    setResultsStudent(s);
    setStudentResultsLoading(true);
    try {
      const sid = s.StudentId || (s as any).studentId || s._id;
      const endpoint = isTeacher
        ? `/exam-results/teacher/student/${sid}`
        : `/exam-results/admin/student/${sid}`;
      const { data } = await api.get(endpoint);
      setStudentResults(data?.data || []);
    } catch (e) {
      console.error(e);
      setStudentResults([]);
    } finally {
      setStudentResultsLoading(false);
    }
  };

  const handleTogglePublishFromModal = async (resultId: string, currentStatus: boolean) => {
    setPublishingId(resultId);
    try {
      await api.put(`/exam-results/${resultId}/admin-toggle-publish`, { publish: !currentStatus });
      setStudentResults((prev) =>
        prev.map((r) => (r._id === resultId ? { ...r, isPublished: !currentStatus } : r))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setPublishingId(null);
    }
  };

  const currentTeacher = teacherState.teacher as any;
  const teacherId = currentTeacher?._id || currentTeacher?.id;
  const teacherSubject = (currentTeacher?.subject?.name || currentTeacher?.subject || "").toString().trim().toLowerCase();

  const targetClassLevel =
    (teacherState.teacher as any)?.classLevel?.name ||
    (teacherState.teacher as any)?.classLevel ||
    teacherClassLevel ||
    "";

  const teacherScopedList = useMemo<Student[]>(() => {
    if (!isTeacher) return students;
    if (!targetClassLevel && !teacherSubject) return teacherClassStudents;
    const teacherDigits = targetClassLevel ? targetClassLevel.toString().match(/\d+/)?.[0] : null;

    return teacherClassStudents.filter((s: Student) => {
      const studentLevel = (s.currentClassLevel || "").toString().trim();
      const studentDigits = studentLevel.match(/\d+/)?.[0];

      // 1. If teacher has a class level specified, student's class level MUST strictly match!
      if (targetClassLevel) {
        if (teacherDigits && studentDigits) {
          if (studentDigits !== teacherDigits) return false;
        } else if (studentLevel.toLowerCase() !== targetClassLevel.toString().toLowerCase()) {
          return false;
        }
      }

      // 2. Direct assignment (and verified class level)
      const assignedId = (s as any).assignedTeacher?._id || (s as any).assignedTeacher;
      if (assignedId && (assignedId.toString() === teacherId?.toString())) {
        return true;
      }

      // 3. Subject match
      const studentSub = (s.subject || "").toString().trim().toLowerCase();
      if (teacherSubject && studentSub && teacherSubject === studentSub) {
        return true;
      }

      // 4. Class level match without subject
      if (targetClassLevel && !teacherSubject) {
        return true;
      }

      return false;
    });
  }, [isTeacher, students, teacherClassStudents, targetClassLevel, teacherSubject, teacherId]);

  const rawList: Student[] = teacherScopedList;

  const filtered = rawList.filter(
    (s: Student) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.StudentId?.toLowerCase().includes(search.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedStudents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await dispatch(registerStudent({ ...form, classLevels: [form.classLevels] }));
    setSubmitting(false);
    setShowModal(false);
    setForm({ name: "", email: "", password: "", classLevels: "Level 100", subject: "", program: "" });
  };

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    setEditForm({
      name: s.name || "",
      email: s.email || "",
      classLevels: s.currentClassLevel || "",
      subject: (s as any).subject || "",
      prefectName: (s as any).prefectName || "",
      program: typeof s.program === "object" ? (s.program as any)?._id || (s.program as any)?.name || "" : (s.program || ""),
      academicYear: typeof s.academicYear === "object" ? (s.academicYear as any)?._id || (s.academicYear as any)?.name || "" : (s.academicYear || ""),
      isSuspended: !!s.isSuspended,
      isWithDrawn: !!s.isWithDrawn,
    });
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSubmitting(true);
    await dispatch(updateStudentAdmin({ id: editingStudent._id, updates: editForm }));
    setSubmitting(false);
    setEditingStudent(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-dark">
              {isTeacher ? "My Class Students" : "Students"}
            </h1>
            {isTeacher && teacherClassLevel && (
              <span className="px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-400 text-xs font-semibold">
                Class: {teacherClassLevel}
              </span>
            )}
          </div>
          <p className="text-dark-400 text-sm mt-1">
            {isTeacher
              ? teacherClassLevel
                ? `Showing ${rawList.length} student${rawList.length === 1 ? "" : "s"} enrolled in your assigned class (${teacherClassLevel}).`
                : "Students enrolled in your assigned class."
              : `${students.length} total students enrolled`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isTeacher ? (
            <>
              <Link
                to="/teacher/results"
                className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/10"
              >
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Class Exam Results
              </Link>
              <button
                onClick={() => dispatch(fetchTeacherClassStudents())}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </>
          ) : (
            <>
              <Link
                to="/admin/results"
                className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/10"
              >
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                All Student Results
              </Link>
              <button
                id="add-student-btn"
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Register Student
              </button>
            </>
          )}
        </div>
      </div>

      {/* Teacher unassigned warning */}
      {isTeacher && !teacherClassLevel && !loading && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold text-amber-200">No Class Level Assigned</p>
            <p className="text-xs text-amber-300/80 mt-0.5">
              Your teacher profile does not have an assigned class level yet. Please contact an administrator to assign your class level so your students appear here.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          id="student-search"
          type="text"
          placeholder="Search by name, email or ID..."
          value={search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-dark-500 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Error */}
      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      {/* Table */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-indigo-400 uppercase">
                <th className="text-left px-6 py-4  text-xs font-semibold  tracking-wider">Student</th>
                <th className="text-left px-6 py-4  text-xs font-semibold  tracking-wider">ID</th>
                <th className="text-left px-6 py-4  text-xs font-semibold  tracking-wider">Class Level</th>
                <th className="text-left px-6 py-4  text-xs font-semibold  tracking-wider">Subject</th>
                <th className="text-left px-6 py-4  text-xs font-semibold  tracking-wider">Teacher</th>
                <th className="text-left px-6 py-4  text-xs font-semibold  tracking-wider">Program</th>
                <th className="text-left px-6 py-4  text-xs font-semibold  tracking-wider">Status</th>
                <th className="text-right px-6 py-4  text-xs font-semibold  tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                    {search ? `No results for "${search}"` : "No students registered yet."}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s: Student, i: number) => (
                  <tr key={s._id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                          {s.name?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <p className="text-dark font-medium text-sm">{s.name}</p>
                          <p className="text-slate-400 text-xs">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark text-sm font-mono">{s.StudentId || "—"}</td>
                    <td className="px-6 py-4 text-dark text-sm font-medium">{s.currentClassLevel || "—"}</td>
                    <td className="px-6 py-4 text-dark-300 text-sm">{s.subject || "—"}</td>
                    <td className="px-6 py-4 text-sm">
                      {s.assignedTeacher ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-dark-300 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                          {typeof s.assignedTeacher === "object" ? s.assignedTeacher?.name : s.assignedTeacher}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-dark-300 text-sm">{typeof s.program === "object" ? s.program?.name : (s.program || "—")}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        s.isSuspended ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        s.isWithDrawn ? "bg-slate-500/20 text-slate-400 border border-slate-500/30" :
                        s.isGraduated ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" :
                        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {s.isSuspended ? "Suspended" : s.isWithDrawn ? "Withdrawn" : s.isGraduated ? "Graduated" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-dark-400 text-sm">
                      {s.dateAdmitted ? new Date(s.dateAdmitted).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewResults(s as Student)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-xs font-medium transition-all border border-emerald-500/30 flex items-center gap-1.5 shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Results
                        </button>
                        <button
                          onClick={() => setSelectedStudent(s as Student)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium transition-all border border-indigo-500/30"
                        >
                          View Profile
                        </button>
                        {!isTeacher && (
                          <>
                            <button
                              onClick={() => openEditModal(s as Student)}
                              className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-medium transition-all border border-violet-500/30 flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => dispatch(s.isSuspended ? unsuspendStudent(s._id) : suspendStudent(s._id))}
                              title={s.isSuspended ? "Unsuspend Student" : "Suspend Student"}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                s.isSuspended
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                                  : "text-amber-400 hover:bg-amber-500/10 border-amber-500/20"
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            </button>
                            <button
                              onClick={() => dispatch(s.isWithDrawn ? unwithdrawStudent(s._id) : withdrawStudent(s._id))}
                              title={s.isWithDrawn ? "Unwithdraw Student" : "Withdraw Student"}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                s.isWithDrawn
                                  ? "bg-red-500/20 text-red-300 border-red-500/50"
                                  : "text-red-400 hover:bg-red-500/10 border-red-500/20"
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
            <p className="text-slate-400 text-sm">
              Showing <span className="font-semibold text-dark">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-semibold text-dark">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of{" "}
              <span className="font-semibold text-dark">{filtered.length}</span> students
            </p>

            <div className="flex items-center gap-2">
              <button
                id="student-pagination-back-btn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-dark text-sm font-medium transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === page
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30"
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                id="student-pagination-next-btn"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-dark text-sm font-medium transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Profile Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {selectedStudent.name?.[0]?.toUpperCase() || "S"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedStudent.name}</h2>
                  <p className="text-slate-400 text-sm">{selectedStudent.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Student ID", value: selectedStudent.StudentId || "N/A" },
                { label: "Class Level", value: selectedStudent.currentClassLevel || "N/A" },
                { label: "Subject", value: selectedStudent.subject || "N/A" },
                { label: "Assigned Teacher", value: typeof selectedStudent.assignedTeacher === "object" ? selectedStudent.assignedTeacher?.name : (selectedStudent.assignedTeacher || "None") },
                { label: "Program", value: typeof selectedStudent.program === "object" ? selectedStudent.program?.name : (selectedStudent.program || "N/A") },
                { label: "Date Admitted", value: selectedStudent.dateAdmitted ? new Date(selectedStudent.dateAdmitted).toLocaleDateString() : "N/A" },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <p className="text-slate-500 text-xs font-medium">{item.label}</p>
                  <p className="text-white text-sm font-semibold mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Status Information</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Enrollment Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  selectedStudent.isSuspended ? "bg-red-500/20 text-red-400" :
                  selectedStudent.isWithDrawn ? "bg-slate-500/20 text-slate-400" :
                  selectedStudent.isGraduated ? "bg-violet-500/20 text-violet-400" :
                  "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {selectedStudent.isSuspended ? "Suspended" : selectedStudent.isWithDrawn ? "Withdrawn" : selectedStudent.isGraduated ? "Graduated" : "Active"}
                </span>
              </div>
            </div>

            {/* Direct button to view this student's exam results */}
            <button
              type="button"
              onClick={() => {
                const s = selectedStudent;
                setSelectedStudent(null);
                handleViewResults(s);
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-sm transition-all border border-emerald-500/30 flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Exam Results & Academic Performance
            </button>

            {!isTeacher ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    dispatch(selectedStudent.isSuspended ? unsuspendStudent(selectedStudent._id) : suspendStudent(selectedStudent._id));
                    setSelectedStudent(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-colors ${
                    selectedStudent.isSuspended
                      ? "bg-amber-600/30 border-amber-500/50 text-amber-200"
                      : "bg-amber-600/20 hover:bg-amber-600/40 border-amber-500/30 text-amber-300"
                  }`}
                >
                  {selectedStudent.isSuspended ? "Unsuspend" : "Suspend"}
                </button>
                <button
                  onClick={() => {
                    dispatch(selectedStudent.isWithDrawn ? unwithdrawStudent(selectedStudent._id) : withdrawStudent(selectedStudent._id));
                    setSelectedStudent(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-colors ${
                    selectedStudent.isWithDrawn
                      ? "bg-red-600/30 border-red-500/50 text-red-200"
                      : "bg-red-600/20 hover:bg-red-600/40 border-red-500/30 text-red-300"
                  }`}
                >
                  {selectedStudent.isWithDrawn ? "Unwithdraw" : "Withdraw"}
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Exam Results Modal */}
      {resultsStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {resultsStudent.name?.[0]?.toUpperCase() || "S"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{resultsStudent.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Exam Results
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Student ID: <span className="text-white font-mono">{resultsStudent.StudentId || "—"}</span> · Class: <span className="text-white">{resultsStudent.currentClassLevel || "—"}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResultsStudent(null)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Summary & Link */}
            <div className="flex items-center justify-between gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10">
              <div>
                <p className="text-xs text-slate-300">
                  Total Exams Written: <strong className="text-white">{studentResults.length}</strong>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Passed: <span className="text-emerald-400 font-semibold">{studentResults.filter(r => r.status === "Passed").length}</span> · Failed: <span className="text-rose-400 font-semibold">{studentResults.filter(r => r.status === "Failed").length}</span>
                </p>
              </div>
              <Link
                to={
                  isTeacher
                    ? `/teacher/results?student=${resultsStudent.StudentId || (resultsStudent as any).studentId || resultsStudent.name}`
                    : `/admin/results?student=${resultsStudent.StudentId || (resultsStudent as any).studentId || resultsStudent.name}`
                }
                className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all flex items-center gap-1.5"
              >
                Open in Full Results Screen
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>

            {/* Results List */}
            {studentResultsLoading ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : studentResults.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <svg className="w-10 h-10 text-slate-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-semibold text-slate-300">No Exam Results Yet</p>
                <p className="text-xs text-slate-500">This student has not submitted any exams or results have not been generated.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentResults.map((result: any) => {
                  const examName = result.exam?.name || "Exam";
                  const subjectName = result.exam?.subject?.name || "Subject";
                  const isPassed = result.status === "Passed";
                  const isPublished = !!result.isPublished;

                  return (
                    <div
                      key={result._id}
                      className="bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-2xl p-4 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{examName}</span>
                            <span className="px-2 py-0.5 rounded text-[11px] bg-white/10 text-slate-300">
                              {subjectName}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isPassed ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            }`}>
                              {result.status || (isPassed ? "Passed" : "Failed")}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              isPublished ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}>
                              {isPublished ? "🟢 Published" : "🟡 Unpublished"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Remarks: <span className="text-slate-300 font-medium">{result.remarks || "N/A"}</span> · Date: <span className="text-slate-400">{result.createdAt ? new Date(result.createdAt).toLocaleDateString() : "—"}</span>
                          </p>
                        </div>

                        {/* Publish toggle button (Admin only) */}
                        {!isTeacher && (
                          <button
                            onClick={() => handleTogglePublishFromModal(result._id, isPublished)}
                            disabled={publishingId === result._id}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shrink-0 ${
                              isPublished
                                ? "bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border-amber-500/30"
                                : "bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border-emerald-500/30 shadow-md shadow-emerald-500/20"
                            }`}
                          >
                            {publishingId === result._id ? "Updating..." : isPublished ? "Unpublish" : "Publish Result"}
                          </button>
                        )}
                      </div>

                      {/* Score bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Score: <strong className="text-white">{result.score}</strong> (Pass Mark: {result.passMark || 50})</span>
                          <span className={`font-bold ${isPassed ? "text-emerald-400" : "text-rose-400"}`}>{result.grade ?? result.score}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isPassed ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-rose-500 to-red-600"}`}
                            style={{ width: `${Math.min(result.grade ?? result.score ?? 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setResultsStudent(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Update Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Update Student (Admin)</h2>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Class Level</label>
                  <select
                    value={editForm.classLevels}
                    onChange={(e) => setEditForm({ ...editForm, classLevels: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0f1629] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Class Level...</option>
                    {classLevels.length > 0 ? (
                      classLevels.map((c: any) => (
                        <option key={c._id || c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      ["Level 100", "Level 200", "Level 300", "Level 400"].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Prefect Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Head Boy"
                    value={editForm.prefectName}
                    onChange={(e) => setEditForm({ ...editForm, prefectName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Program</label>
                  <select
                    value={editForm.program}
                    onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0f1629] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Program...</option>
                    {programs.map((p: any) => (
                      <option key={p._id || p.name} value={p._id || p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Subject
                    </label>
                    {editForm.program && (
                      <span className="text-[10px] text-indigo-400 font-mono">
                        Showing All Subjects
                      </span>
                    )}
                  </div>
                  <select
                    value={editForm.subject}
                    onChange={(e) => {
                      const selectedSub = e.target.value;
                      const foundSub = subjects.find((s: any) => (s.name || s) === selectedSub);
                      const associatedProgram = foundSub?.program?._id || foundSub?.program?.name || "";
                      setEditForm((prev) => ({
                        ...prev,
                        subject: selectedSub,
                        ...(associatedProgram && (!prev.program || prev.program !== associatedProgram) ? { program: associatedProgram } : {}),
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#0f1629] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Subject...</option>
                    {(() => {
                      const { programSubjects, otherSubjects } = getSubjectGroups(editForm.program);
                      if (!editForm.program || otherSubjects.length === 0) {
                        return subjects.map((s: any) => {
                          const sName = s.name || s;
                          const progTag = s.program?.name ? ` (${s.program.name})` : "";
                          return (
                            <option key={s._id || sName} value={sName}>
                              {sName}{progTag}
                            </option>
                          );
                        });
                      }
                      return (
                        <>
                          {programSubjects.length > 0 && (
                            <optgroup label="Subjects in Selected Program (Recommended)">
                              {programSubjects.map((s: any) => {
                                const sName = s.name || s;
                                return (
                                  <option key={s._id || sName} value={sName}>
                                    {sName}
                                  </option>
                                );
                              })}
                            </optgroup>
                          )}
                          {otherSubjects.length > 0 && (
                            <optgroup label="All Other Created Subjects">
                              {otherSubjects.map((s: any) => {
                                const sName = s.name || s;
                                const progTag = s.program?.name ? ` (${s.program.name})` : "";
                                return (
                                  <option key={s._id || sName} value={sName}>
                                    {sName}{progTag}
                                  </option>
                                );
                              })}
                            </optgroup>
                          )}
                        </>
                      );
                    })()}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Academic Year</label>
                <select
                  value={editForm.academicYear}
                  onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0f1629] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Academic Year...</option>
                  {academicYears.map((y: any) => (
                    <option key={y._id || y.name} value={y._id || y.name}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-selected Teacher Preview */}
              {matchedTeacherPreview ? (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                  <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Auto-selected Teacher: <strong className="text-white">{matchedTeacherPreview.name}</strong> ({matchedTeacherPreview.subject} · {matchedTeacherPreview.classLevel})
                  </span>
                </div>
              ) : editForm.subject && editForm.classLevels ? (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <svg className="w-4 h-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>No teacher currently registered for <strong>{editForm.subject}</strong> in <strong>{editForm.classLevels}</strong>. System will auto-assign when a matching teacher is assigned.</span>
                </div>
              ) : null}

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isSuspended}
                    onChange={(e) => setEditForm({ ...editForm, isSuspended: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-500"
                  />
                  Is Suspended
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isWithDrawn}
                    onChange={(e) => setEditForm({ ...editForm, isWithDrawn: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-500"
                  />
                  Is Withdrawn
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-500/30"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Register Student</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "John Doe" },
                { label: "Email", key: "email", type: "email", placeholder: "john@school.edu" },
                { label: "Password", key: "password", type: "password", placeholder: "••••••••" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{f.label}</label>
                  <input
                    id={`student-${f.key}`}
                    type={f.type}
                    required
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Program</label>
                <select
                  id="student-program"
                  value={form.program}
                  onChange={(e) => {
                    const newProg = e.target.value;
                    const { programSubjects } = getSubjectGroups(newProg);
                    const defaultSub = programSubjects.length > 0 ? programSubjects[0].name : form.subject;
                    setForm({ ...form, program: newProg, subject: defaultSub });
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0f1629] border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                >
                  <option value="">Select Program (Optional)...</option>
                  {programs.map((p: any) => (
                    <option key={p._id || p.name} value={p._id || p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {form.program && (
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                    <span>✨ Student will automatically do all subjects under this program.</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Class Level</label>
                  <select
                    id="student-classLevel"
                    value={form.classLevels}
                    onChange={(e) => setForm({ ...form, classLevels: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0f1629] border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  >
                    {classLevels.length > 0 ? (
                      classLevels.map((l: any) => (
                        <option key={l._id || l.name} value={l.name}>
                          {l.name}
                        </option>
                      ))
                    ) : (
                      ["Level 100", "Level 200", "Level 300", "Level 400"].map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Subject</label>
                  <select
                    id="student-subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0f1629] border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  >
                    <option value="">Select Subject...</option>
                    {(() => {
                      const { programSubjects, otherSubjects } = getSubjectGroups(form.program);
                      if (!form.program || otherSubjects.length === 0) {
                        return subjects.map((s: any) => {
                          const sName = s.name || s;
                          const progTag = s.program?.name ? ` (${s.program.name})` : "";
                          return (
                            <option key={s._id || sName} value={sName}>
                              {sName}{progTag}
                            </option>
                          );
                        });
                      }
                      return (
                        <>
                          {programSubjects.length > 0 && (
                            <optgroup label="Subjects in Selected Program (Enrolled automatically)">
                              {programSubjects.map((s: any) => {
                                const sName = s.name || s;
                                return (
                                  <option key={s._id || sName} value={sName}>
                                    ⭐ {sName}
                                  </option>
                                );
                              })}
                            </optgroup>
                          )}
                          {otherSubjects.length > 0 && (
                            <optgroup label="Other Subjects">
                              {otherSubjects.map((s: any) => {
                                const sName = s.name || s;
                                const progTag = s.program?.name ? ` (${s.program.name})` : "";
                                return (
                                  <option key={s._id || sName} value={sName}>
                                    {sName}{progTag}
                                  </option>
                                );
                              })}
                            </optgroup>
                          )}
                        </>
                      );
                    })()}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  id="student-register-submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm disabled:opacity-50 transition-all"
                >
                  {submitting ? "Registering..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
