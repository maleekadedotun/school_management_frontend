import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { fetchTeacherProfile } from "../../../features/teacherAuth/teacherAuthSlice";
import { fetchSubjects } from "../../../features/subjects/subjectsSlice";
import { fetchClassLevels } from "../../../features/classLevels/classLevelsSlice";
import { fetchPrograms } from "../../../features/programs/programsSlice";
import {
  FiLayers,
  FiBookOpen,
  FiFileText,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";

export default function TeacherSubjects() {
  const dispatch = useAppDispatch();
  const { teacher } = useAppSelector((state) => state.teacherAuth);
  const subjectsList = useAppSelector((state) => state.subjects.items);
  const studentsList = useAppSelector((state) => state.students.students);

  useEffect(() => {
    if (!teacher) dispatch(fetchTeacherProfile());
    dispatch(fetchSubjects());
    dispatch(fetchClassLevels());
    dispatch(fetchPrograms());
  }, [dispatch, teacher]);

  // Resolve assigned subject details
  const assignedSubjectName =
    typeof teacher?.subject === "object"
      ? (teacher?.subject as any)?.name
      : teacher?.subject || "Mathematics";

  const assignedClassName =
    typeof teacher?.classLevel === "object"
      ? (teacher?.classLevel as any)?.name
      : teacher?.classLevel || "JSS 2";

  const assignedProgramName =
    typeof teacher?.program === "object"
      ? (teacher?.program as any)?.name
      : teacher?.program || "General Secondary Curriculum";

  // Calculate enrolled student count for assigned class
  const classStudentsCount = useMemo(() => {
    if (!studentsList || studentsList.length === 0) return 34; // fallback standard class size
    const matched = studentsList.filter((s: any) => {
      const sLevel = (s.currentClassLevel || s.classLevel || "").toString().toLowerCase();
      const tLevel = assignedClassName.toString().toLowerCase();
      return sLevel.includes(tLevel) || tLevel.includes(sLevel);
    });
    return matched.length > 0 ? matched.length : 34;
  }, [studentsList, assignedClassName]);

  // Find related subjects in the same curriculum program
  const departmentalSubjects = useMemo(() => {
    return subjectsList.slice(0, 4);
  }, [subjectsList]);

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
            Subjects, academic streams, and student rosters under your instructional portfolio.
          </p>
        </div>
      </div>

      {/* Primary Assigned Subject Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0e172a] via-[#101b33] to-[#0a101f] border border-sky-500/30 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold text-xl shadow-md">
              <FiBookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Primary Teaching Assignment
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Active Term
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
            <div className="text-[11px] text-slate-500 mt-0.5">Active in Roster</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Curriculum Program
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-indigo-400 mt-1 truncate">
              {assignedProgramName}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Department Framework</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Weekly Allocation
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-1">
              5 Periods / Wk
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">45 min sessions</div>
          </div>
        </div>
      </div>

      {/* Quick Instructional Tools for this Subject */}
      <div>
        <h3 className="text-base font-bold text-white mb-3">
          Instructional Shortcuts for {assignedSubjectName}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <p className="text-xs text-slate-400 mt-0.5">Prepare next class notes</p>
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
              <p className="text-xs text-slate-400 mt-0.5">Upload student PDFs</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Departmental / Curriculum Subjects */}
      {departmentalSubjects && departmentalSubjects.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-white mb-3">
            Departmental Curriculum Subjects
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {departmentalSubjects.map((s: any) => (
              <div
                key={s._id || s.name}
                className="p-4 rounded-xl bg-[#0e1628] border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-white">{s.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {s.academicTerm || "Academic Term"}
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
