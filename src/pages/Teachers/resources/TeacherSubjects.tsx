import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { fetchTeacherProfile, fetchTeacherMySubjects } from "../../../features/teacherAuth/teacherAuthSlice";
import { fetchSubjects } from "../../../features/subjects/subjectsSlice";
import { fetchClassLevels } from "../../../features/classLevels/classLevelsSlice";
import { fetchPrograms } from "../../../features/programs/programsSlice";
import { fetchTeacherClassStudents } from "../../../features/students/studentsSlice";
import {
  FiLayers,
  FiBookOpen,
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiCheck,
  FiAward,
  FiInfo,
} from "react-icons/fi";

export interface AssignedSubjectInfo {
  _id: string;
  name: string;
  description?: string;
  program?: string;
  academicTerm?: string;
  classLevel?: string;
}

export default function TeacherSubjects() {
  const dispatch = useAppDispatch();
  const { teacher } = useAppSelector((state) => state.teacherAuth);
  const subjectsList = useAppSelector((state) => state.subjects.items);
  const studentsList = useAppSelector((state) => state.students.students);
  const teacherClassStudents = useAppSelector((state) => state.students.teacherClassStudents);

  // Always refresh teacher profile and academic subjects on mount
  useEffect(() => {
    dispatch(fetchTeacherProfile());
    dispatch(fetchTeacherMySubjects());
    dispatch(fetchSubjects());
    dispatch(fetchClassLevels());
    dispatch(fetchPrograms());
    dispatch(fetchTeacherClassStudents());
  }, [dispatch]);

  const currentTeacherId = teacher?._id?.toString() || (teacher as any)?.id?.toString() || "";
  const currentTeacherName = teacher?.name?.trim().toLowerCase() || "";
  const currentTeacherEmail = teacher?.email?.trim().toLowerCase() || "";

  // Strictly resolve ONLY the subjects that the admin selected/assigned for this teacher
  const assignedSubjects: AssignedSubjectInfo[] = useMemo(() => {
    const list: AssignedSubjectInfo[] = [];
    const addedIds = new Set<string>();
    const addedNames = new Set<string>();

    const addSubject = (raw: any) => {
      if (!raw) return;

      // Case 1: Populated Subject object
      if (typeof raw === "object" && raw.name) {
        const idStr = raw._id?.toString();
        const normName = raw.name.trim().toLowerCase();
        if (idStr && addedIds.has(idStr)) return;
        if (normName && addedNames.has(normName)) return;

        // Try to enrich with matching entry from full subjectsList
        const matched = (subjectsList || []).find(
          (s: any) =>
            (idStr && s._id?.toString() === idStr) ||
            s.name?.trim().toLowerCase() === normName
        );

        const progObj = raw.program || matched?.program || teacher?.program;
        const progName = typeof progObj === "object" ? progObj?.name : progObj;

        const termObj = raw.academicTerms || raw.academicTerm || matched?.academicTerms || (teacher as any)?.academicTerm;
        const termName = typeof termObj === "object" ? termObj?.name : termObj;

        const classObj = raw.classLevel || matched?.classLevel || teacher?.classLevel;
        const className = typeof classObj === "object" ? classObj?.name : classObj;

        const finalSub: AssignedSubjectInfo = {
          _id: idStr || matched?._id?.toString() || normName,
          name: raw.name.trim(),
          description: raw.description || matched?.description || "Curriculum subject assigned by administration.",
          program: progName || "Assigned Stream",
          academicTerm: termName || "Active Term",
          classLevel: className || (typeof teacher?.classLevel === "object" ? (teacher?.classLevel as any)?.name : teacher?.classLevel) || "Standard Stream",
        };

        if (idStr) addedIds.add(idStr);
        if (normName) addedNames.add(normName);
        list.push(finalSub);
        return;
      }

      // Case 2: String identifier (ObjectId or subject name)
      const str = raw.toString().trim();
      if (!str) return;

      const matched = (subjectsList || []).find(
        (s: any) =>
          s._id?.toString() === str ||
          s.name?.trim().toLowerCase() === str.toLowerCase()
      );

      if (matched) {
        const idStr = matched._id?.toString();
        const normName = matched.name?.trim().toLowerCase();
        if (idStr && addedIds.has(idStr)) return;
        if (normName && addedNames.has(normName)) return;

        const progObj = matched.program || teacher?.program;
        const progName = typeof progObj === "object" ? progObj?.name : progObj;

        const termObj = matched.academicTerms || (teacher as any)?.academicTerm;
        const termName = typeof termObj === "object" ? termObj?.name : termObj;

        const classObj = matched.classLevel || teacher?.classLevel;
        const className = typeof classObj === "object" ? classObj?.name : classObj;

        if (idStr) addedIds.add(idStr);
        if (normName) addedNames.add(normName);
        list.push({
          _id: idStr || normName,
          name: matched.name.trim(),
          description: matched.description || "Curriculum subject assigned by administration.",
          program: progName || "Assigned Stream",
          academicTerm: termName || "Active Term",
          classLevel: className || (typeof teacher?.classLevel === "object" ? (teacher?.classLevel as any)?.name : teacher?.classLevel) || "Standard Stream",
        });
        return;
      }

      // String is a human name (exclude unresolvable 24-character hexadecimal MongoDB IDs)
      const isHexId = str.length === 24 && /^[0-9a-fA-F]{24}$/.test(str);
      if (!isHexId) {
        const normName = str.toLowerCase();
        if (!addedNames.has(normName)) {
          addedNames.add(normName);
          list.push({
            _id: str,
            name: str,
            description: "Curriculum subject assigned by administration.",
            program: (typeof teacher?.program === "object" ? (teacher?.program as any)?.name : teacher?.program) || "Assigned Stream",
            academicTerm: (teacher as any)?.academicTerm || "Active Term",
            classLevel: (typeof teacher?.classLevel === "object" ? (teacher?.classLevel as any)?.name : teacher?.classLevel) || "Standard Stream",
          });
        }
      }
    };

    // 1. Process subjects array on teacher profile (assigned by admin)
    if (Array.isArray(teacher?.subjects) && teacher.subjects.length > 0) {
      teacher.subjects.forEach(addSubject);
    }

    // 2. Process primary subject on teacher profile (assigned by admin)
    if (teacher?.subject) {
      addSubject(teacher.subject);
    }

    // 3. Process subjects in school database explicitly linked to this teacher ID
    if (Array.isArray(subjectsList) && currentTeacherId) {
      subjectsList.forEach((s: any) => {
        const sTeacher = s.teacher;
        const isAssigned =
          sTeacher &&
          ((typeof sTeacher === "object" &&
            (sTeacher._id?.toString() === currentTeacherId ||
              (currentTeacherEmail && sTeacher.email?.toLowerCase() === currentTeacherEmail) ||
              (currentTeacherName && sTeacher.name?.toLowerCase() === currentTeacherName))) ||
            sTeacher?.toString() === currentTeacherId);

        if (isAssigned) {
          addSubject(s);
        }
      });
    }

    return list;
  }, [teacher, subjectsList, currentTeacherId, currentTeacherEmail, currentTeacherName]);

  // Selected active subject focus
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const activeSubject: AssignedSubjectInfo | null = useMemo(() => {
    if (assignedSubjects.length === 0) return null;
    if (selectedSubjectId) {
      const found = assignedSubjects.find(
        (s) => s._id === selectedSubjectId || s.name === selectedSubjectId
      );
      if (found) return found;
    }
    return assignedSubjects[0];
  }, [assignedSubjects, selectedSubjectId]);

  const assignedSubjectName = activeSubject?.name || "No Subject Assigned";
  const assignedClassName =
    activeSubject?.classLevel ||
    (typeof teacher?.classLevel === "object"
      ? (teacher?.classLevel as any)?.name
      : teacher?.classLevel) ||
    "General Stream";

  const assignedProgramName =
    activeSubject?.program ||
    (typeof teacher?.program === "object"
      ? (teacher?.program as any)?.name
      : teacher?.program) ||
    "Curriculum Stream";

  const assignedAcademicTerm =
    activeSubject?.academicTerm ||
    (typeof (teacher as any)?.academicTerm === "object"
      ? (teacher as any)?.academicTerm?.name
      : (teacher as any)?.academicTerm) ||
    "Active Term";

  // Calculate enrolled student count for the active subject
  const allStudents = useMemo(() => {
    const combined = [...(studentsList || []), ...(teacherClassStudents || [])];
    const map = new Map<string, any>();
    combined.forEach((s) => {
      const id = s._id?.toString() || (s as any).id?.toString();
      if (id && !map.has(id)) map.set(id, s);
    });
    return Array.from(map.values());
  }, [studentsList, teacherClassStudents]);

  const classStudentsCount = useMemo(() => {
    if (!activeSubject || allStudents.length === 0) return 0;
    const activeSubName = activeSubject.name.toLowerCase().trim();
    const activeSubId = activeSubject._id;

    const matched = allStudents.filter((s: any) => {
      // 1. Check if student is explicitly enrolled in this subject
      if (Array.isArray(s.enrolledSubjects) && s.enrolledSubjects.length > 0) {
        const enrolled = s.enrolledSubjects.some((es: any) => {
          const subObj = es?.subject || es;
          const subId = typeof subObj === "object" ? subObj?._id?.toString() : subObj?.toString();
          const subName = typeof subObj === "object" ? subObj?.name?.toLowerCase()?.trim() : "";
          return (
            (activeSubId && subId === activeSubId) ||
            (activeSubName && subName === activeSubName)
          );
        });
        if (enrolled) return true;
      }

      // 2. Check student's direct subject field
      const studentSub = (s.subject || "").toString().toLowerCase().trim();
      if (activeSubName && studentSub && (studentSub === activeSubName || studentSub.includes(activeSubName))) {
        return true;
      }

      // 3. Fallback: match by class level for students assigned to this teacher
      const teacherClass = (typeof teacher?.classLevel === "object" ? (teacher?.classLevel as any)?.name : teacher?.classLevel || "").toLowerCase();
      const sLevel = (s.currentClassLevel || s.classLevel || "").toString().toLowerCase();
      if (teacherClass && sLevel && (sLevel.includes(teacherClass) || teacherClass.includes(sLevel))) {
        const sTeacherId = typeof s.assignedTeacher === "object" ? s.assignedTeacher?._id?.toString() : s.assignedTeacher?.toString();
        if (sTeacherId && currentTeacherId && sTeacherId === currentTeacherId) {
          return true;
        }
      }
      return false;
    });

    return matched.length;
  }, [allStudents, activeSubject, teacher, currentTeacherId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FiLayers className="w-6 h-6 text-sky-400" />
            <span>My Teaching Subjects & Rosters</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Subjects and student rosters assigned exclusively to your profile by the administration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <FiCheckCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>{assignedSubjects.length} {assignedSubjects.length === 1 ? "Subject" : "Subjects"} Assigned</span>
          </span>
        </div>
      </div>

      {/* Multiple Subjects Switcher Tabs (If Admin selected 2 or more subjects, e.g. English and Mathematics) */}
      {assignedSubjects.length > 1 && (
        <div className="p-2 rounded-2xl bg-[#0c1424] border border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">
            Your Subjects:
          </span>
          {assignedSubjects.map((s, idx) => {
            const isSelected = activeSubject?._id === s._id;
            return (
              <button
                key={s._id || s.name}
                type="button"
                onClick={() => setSelectedSubjectId(s._id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/30 scale-[1.02]"
                    : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <FiBookOpen className="w-3.5 h-3.5" />
                <span>{s.name}</span>
                {idx === 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    isSelected ? "bg-white/20 text-white" : "bg-sky-500/20 text-sky-300"
                  }`}>
                    Primary
                  </span>
                )}
                {isSelected && <FiCheck className="w-3.5 h-3.5 ml-0.5" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Primary / Active Assigned Subject Card */}
      {activeSubject ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0e172a] via-[#101b33] to-[#0a101f] border border-sky-500/30 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold text-xl shadow-md">
                <FiBookOpen className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {assignedSubjects[0]?._id === activeSubject._id
                      ? "Primary Teaching Assignment"
                      : "Assigned Subject Portfolio"}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {assignedAcademicTerm}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {assignedSubjectName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/teacher/resources/lesson-notes"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/30 transition active:scale-95"
              >
                <FiFileText className="w-4 h-4" />
                <span>Write Lesson Note</span>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Class Level
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-white mt-1">
                {assignedClassName}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Assigned Stream</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Enrolled Students
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-sky-400 mt-1">
                {classStudentsCount} Learners
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Active in Subject</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Curriculum Program
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-indigo-400 mt-1 truncate">
                {assignedProgramName}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Academic Framework</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Instructional Status
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-1 flex items-center gap-1.5">
                <FiCheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Assigned</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Admin Selected</div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State if no subjects assigned by admin */
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0e172a] border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <FiInfo className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-xl font-bold text-white">No Teaching Subjects Assigned Yet</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              The administrator has not yet assigned any subjects to your teacher account. Once an administrator assigns your subjects (such as English and Mathematics), they will be automatically loaded here.
            </p>
          </div>
        </div>
      )}

      {/* Quick Instructional Tools for this Active Subject */}
      {activeSubject && (
        <div>
          <h3 className="text-base font-bold text-white mb-3">
            Instructional Shortcuts for {assignedSubjectName}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Link
              to="/teacher/resources/lesson-notes"
              className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800 hover:border-sky-500/40 transition-all flex items-center gap-3.5 group shadow-xs"
            >
              <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-105 transition-transform">
                <FiFileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-sky-400 transition-colors">
                  Lesson Notes
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Prepare notes for {assignedSubjectName}</p>
              </div>
            </Link>

            <Link
              to="/teacher/resources/timetable"
              className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800 hover:border-amber-500/40 transition-all flex items-center gap-3.5 group shadow-xs"
            >
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                <FiClock className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                  Timetable Slots
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Inspect teaching hours</p>
              </div>
            </Link>

            <Link
              to="/teacher/resources/materials"
              className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800 hover:border-purple-500/40 transition-all flex items-center gap-3.5 group shadow-xs"
            >
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
                <FiBookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">
                  Teaching Materials
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Upload PDFs & handouts</p>
              </div>
            </Link>

            <Link
              to="/teacher/results"
              className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center gap-3.5 group shadow-xs"
            >
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                <FiAward className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                  Student Results
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Enter grades & score sheets</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Admin Assigned Teaching Subjects Portfolio (ONLY the subjects admin selected for this teacher) */}
      {assignedSubjects.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Assigned Teaching Portfolio ({assignedSubjects.length} {assignedSubjects.length === 1 ? "Subject" : "Subjects"})
              </h3>
              <p className="text-xs text-slate-400">
                Only subjects explicitly allocated to your teaching appointment by the school administration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedSubjects.map((s, idx) => {
              const isCurrent = activeSubject?._id === s._id;
              return (
                <div
                  key={s._id || s.name}
                  onClick={() => setSelectedSubjectId(s._id)}
                  className={`p-5 rounded-2xl bg-[#0e1628] border transition-all cursor-pointer relative group ${
                    isCurrent
                      ? "border-sky-500/50 shadow-lg shadow-sky-500/10 bg-gradient-to-b from-[#111c38] to-[#0e1628]"
                      : "border-slate-800 hover:border-slate-700 hover:bg-[#101b33]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        isCurrent
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          : "bg-slate-800 text-slate-300"
                      }`}>
                        <FiBookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                          {s.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {s.classLevel || assignedClassName}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                        <FiCheck className="w-2.5 h-2.5" />
                        <span>Assigned</span>
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/20 uppercase">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {s.description || "Instructional coursework under your portfolio."}
                  </p>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate max-w-[150px]">
                      {s.program}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubjectId(s._id);
                      }}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                        isCurrent
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      }`}
                    >
                      {isCurrent ? "Active Focus" : "View Details"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
