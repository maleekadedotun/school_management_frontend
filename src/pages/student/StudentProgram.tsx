import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchStudentEnrolledSubjects,
  fetchStudentProfile,
} from "../../features/students/studentsSlice";
import { fetchPrograms } from "../../features/programs/programsSlice";

const StudentProgram: React.FC = () => {
  const dispatch = useAppDispatch();
  const studentState = useAppSelector((state) => state.students);
  const programsState = useAppSelector((state) => state.programs);

  const { profile, student, currentStudent, enrolledSubjectsByClass, allEnrolledSubjects } = studentState;
  const currentStudentObj = profile || student || currentStudent;

  useEffect(() => {
    dispatch(fetchStudentProfile());
    dispatch(fetchStudentEnrolledSubjects());
    dispatch(fetchPrograms());
  }, [dispatch]);

  // Resolve assigned program data
  const rawProgram =
    typeof currentStudentObj?.program === "object" && currentStudentObj?.program !== null
      ? (currentStudentObj.program as any)
      : programsState.items.find(
          (p: any) =>
            p._id === currentStudentObj?.program ||
            p.name === currentStudentObj?.program
        );

  const programTitle =
    rawProgram?.name ||
    (typeof currentStudentObj?.program === "string" ? currentStudentObj.program : "") ||
    "Bachelor of Science in Software Engineering";

  const programDescription =
    rawProgram?.description ||
    "A rigorous, comprehensive degree program tailored to cultivate elite engineering minds. The curriculum seamlessly integrates deep theoretical foundations in algorithms and computational theory with practical mastery in distributed systems, modern software architectures, data engineering, and agile product development.";

  const programDuration = rawProgram?.duration || "4 Academic Years (8 Semesters)";
  const programCode = rawProgram?.code || "SE-2026-ENG";

  const classGroups =
    enrolledSubjectsByClass && enrolledSubjectsByClass.length > 0
      ? enrolledSubjectsByClass
      : [
          { classLevel: "Level 100", shortCode: "100L", isCurrent: false, isCompleted: true, isFinal: false, count: 0, subjects: [] },
          { classLevel: "Level 200", shortCode: "200L", isCurrent: false, isCompleted: false, isFinal: false, count: 0, subjects: [] },
          { classLevel: "Level 300", shortCode: "300L", isCurrent: false, isCompleted: false, isFinal: false, count: 0, subjects: [] },
          { classLevel: "Level 400", shortCode: "400L / Final", isCurrent: true, isCompleted: false, isFinal: true, count: 0, subjects: [] },
        ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/student/dashboard" className="hover:text-indigo-400 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-indigo-300 font-medium">Academic Program</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Enrolled & Active Status
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            ID: {currentStudentObj?.studentId || currentStudentObj?.StudentId || "STU-2026"}
          </span>
        </div>
      </div>

      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-[#0e172a] border border-indigo-500/30 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
              🎓 Degree Program
            </span>
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/5 text-slate-300 border border-white/10">
              Faculty of Computing & Technology
            </span>
            <span className="px-3 py-1 rounded-lg text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20">
              Code: {programCode}
            </span>
          </div>

          <div className="space-y-3 max-w-4xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              {programTitle}
            </h1>
            <p className="text-base sm:text-lg text-indigo-200/90 font-medium leading-relaxed">
              Standard 4-Year University Curriculum with Comprehensive Theoretical & Practical Focus
            </p>
          </div>

          {/* Key Facts Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Duration
              </span>
              <span className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                ⏱️ {programDuration}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Enrolled Subjects
              </span>
              <span className="text-sm sm:text-base font-bold text-indigo-300 flex items-center gap-1.5">
                📚 {allEnrolledSubjects.length} Courses
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Academic Levels
              </span>
              <span className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                🏛️ 100L – 400L Track
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Accreditation
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-1.5">
                ✓ Full Accreditation
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/student/subjects"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <span>View Enrolled Subjects</span>
              <span>→</span>
            </Link>
            <Link
              to="/student/exams"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/15 transition-all flex items-center gap-2"
            >
              <span>Exams & Assessments</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Description & Curriculum Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): About & Description + Pillars */}
        <div className="lg:col-span-2 space-y-8">
          {/* About The Program Card */}
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-lg">
                📖
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">About The Program</h2>
                <p className="text-xs text-slate-400">Detailed academic scope, mission, and learning philosophy</p>
              </div>
            </div>

            <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              <p className="font-normal text-slate-200">
                {programDescription}
              </p>
              {/* <p className="text-slate-400 text-sm">
                Students enrolled in this curriculum undergo rigorous intellectual conditioning in both computational theory and real-world engineering methodologies. Coursework is systematically arranged across progressive academic tiers (100L foundational principles, 200L algorithmic architectures, 300L advanced system design, and 400L specialized capstones) to ensure graduation readiness and industry competitiveness.
              </p> */}
            </div>

            {/* Curriculum Value Pillars */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-xs uppercase font-bold tracking-wider text-indigo-300 mb-4">
                Core Program Pillars
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 hover:border-indigo-500/30 transition-colors">
                  <span className="text-base">🧠</span>
                  <h4 className="text-sm font-semibold text-white">Algorithmic Foundations</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Mathematical logic, algorithmic complexity analysis, and scalable data structure design.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 hover:border-indigo-500/30 transition-colors">
                  <span className="text-base">💻</span>
                  <h4 className="text-sm font-semibold text-white">Full-Stack Engineering</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Modern web frameworks, distributed backend microservices, and database systems.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 hover:border-indigo-500/30 transition-colors">
                  <span className="text-base">🛡️</span>
                  <h4 className="text-sm font-semibold text-white">Security & Reliability</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Secure software lifecycles, defensive coding practices, and automated quality assurance.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 hover:border-indigo-500/30 transition-colors">
                  <span className="text-base">🚀</span>
                  <h4 className="text-sm font-semibold text-white">Capstone Innovation</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Year-long supervised capstone research translating theory into production-ready software.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Progression Roadmap (100L - 400L) */}
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 text-lg">
                  🗺️
                </span>
                <div>
                  <h2 className="text-xl font-bold text-white">Program Academic Pathway</h2>
                  <p className="text-xs text-slate-400">Class levels and subject progression track</p>
                </div>
              </div>
              <Link
                to="/student/subjects"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                <span>All Subjects</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classGroups.map((group, idx) => (
                <div
                  key={group.classLevel}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        Year {idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {group.count} {group.count === 1 ? "Subject" : "Subjects"}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {group.classLevel} ({group.shortCode})
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {idx === 0 && "Foundational sciences, core computing principles, problem-solving, and general studies."}
                      {idx === 1 && "Intermediate data structures, computer architecture, discrete mathematics, and database engines."}
                      {idx === 2 && "Software design paradigms, operating systems, networks, and advanced engineering labs."}
                      {idx >= 3 && "Advanced elective specializations, distributed architectures, and final capstone thesis."}
                    </p>
                  </div>

                  <Link
                    to={`/student/subjects?class=${encodeURIComponent(group.classLevel)}`}
                    className="inline-flex items-center justify-between w-full pt-3 border-t border-white/10 text-xs font-medium text-slate-300 group-hover:text-white transition-colors"
                  >
                    <span>Browse {group.shortCode} Subjects</span>
                    <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Degree Credentials & Advising */}
        <div className="space-y-8">
          {/* Degree Specifications Card */}
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
              <span className="text-lg">📜</span>
              <h3 className="text-base font-bold text-white">Degree Credentials</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start justify-between gap-2 py-1.5 border-b border-white/5">
                <span className="text-slate-400">Award Title:</span>
                <span className="font-semibold text-white text-right">B.Sc. (Honours)</span>
              </div>

              <div className="flex items-start justify-between gap-2 py-1.5 border-b border-white/5">
                <span className="text-slate-400">Total Credits:</span>
                <span className="font-semibold text-indigo-300 text-right">144 Minimum Units</span>
              </div>

              <div className="flex items-start justify-between gap-2 py-1.5 border-b border-white/5">
                <span className="text-slate-400">Graduation Criteria:</span>
                <span className="font-semibold text-emerald-400 text-right">Pass All Core Courses</span>
              </div>

              <div className="flex items-start justify-between gap-2 py-1.5 border-b border-white/5">
                <span className="text-slate-400">Study Mode:</span>
                <span className="font-semibold text-white text-right">Full-Time Academic</span>
              </div>

              <div className="flex items-start justify-between gap-2 py-1.5">
                <span className="text-slate-400">Examination Eligibility:</span>
                <span className="font-semibold text-emerald-400 text-right">75% Class Attendance</span>
              </div>
            </div>
          </div>

          {/* Career & Industry Horizons */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-purple-950/30 border border-indigo-500/20 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
              <span className="text-lg">🌐</span>
              <h3 className="text-base font-bold text-white">Career Pathways</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Graduates of this program are qualified for distinguished engineering and leadership positions:
            </p>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Full-Stack Software Engineer</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Cloud & DevOps Architect</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Data & Distributed Systems Engineer</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Security & Reliability Specialist</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Technology Entrepreneur & Consultant</span>
              </li>
            </ul>
          </div>

          {/* Academic Support Card */}
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
              <span className="text-lg">💬</span>
              <h3 className="text-base font-bold text-white">Academic Support</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Have questions regarding course selection, prerequisite approvals, or semester schedules? Consult your faculty advisor.
            </p>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-white">Faculty Dean's Office</div>
              <div className="text-slate-400">academics@university.edu</div>
              <div className="text-[11px] text-indigo-300">Mon – Fri: 9:00 AM – 4:00 PM</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgram;
