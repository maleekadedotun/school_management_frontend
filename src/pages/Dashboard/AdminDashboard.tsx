import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Chart from "react-apexcharts";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchAllStudents } from "../../features/students/studentsSlice";
import { fetchAllTeachers, suspendTeacher, withdrawTeacher, unsuspendTeacher, unwithdrawTeacher } from "../../features/teachers/teachersSlice";
import { fetchPrograms } from "../../features/programs/programsSlice";
import { fetchSubjects } from "../../features/subjects/subjectsSlice";
import { fetchExams } from "../../features/exams/examsSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import { fetchYearGroups } from "../../features/yearGroups/yearGroupsSlice";

// React Icons Imports
import {
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineBookOpen,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCalendar,
  HiOutlineBuildingLibrary,
  HiOutlineChartBar,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineMinusCircle,
  HiOutlinePlus,
  HiOutlineArrowRight,
  HiOutlineFolderOpen,
} from "react-icons/hi2";

function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  shadow: string;
  link: string;
  subtitle: string;
  badge?: string;
}

function StatCard({ title, value, icon, gradient, shadow, link, subtitle, badge }: StatCardProps) {
  const count = useCountUp(value);
  return (
    <Link to={link} className="group block">
      <div className={`relative overflow-hidden rounded-2xl p-6 ${gradient} shadow-xl ${shadow} transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl border border-white/10`}>
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/10 translate-x-10 -translate-y-10 blur-xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{title}</p>
              {badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/20">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-4xl font-extrabold text-white tracking-tight">{count}</p>
            <p className="text-white/80 text-xs font-medium pt-1">{subtitle}</p>
          </div>
          <div className="p-3.5 bg-white/15 backdrop-blur-md rounded-2xl text-white text-2xl border border-white/20 shadow-inner shrink-0">
            {icon}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { students, loading: studentsLoading } = useAppSelector((s) => s.students);
  const { teachers, loading: teachersLoading } = useAppSelector((s) => s.teachers);
  const { items: programs } = useAppSelector((s) => s.programs);
  const { items: subjects } = useAppSelector((s) => s.subjects);
  const { items: exams } = useAppSelector((s) => s.exams);
  const { items: academicYears } = useAppSelector((s) => s.academicYears);
  const { items: academicTerms } = useAppSelector((s) => s.academicTerms);
  const { items: classLevels } = useAppSelector((s) => s.classLevels);
  const { items: yearGroups } = useAppSelector((s) => s.yearGroups);
  const { admin } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchAllStudents());
    dispatch(fetchAllTeachers());
    dispatch(fetchPrograms());
    dispatch(fetchSubjects());
    dispatch(fetchExams());
    dispatch(fetchAcademicYears());
    dispatch(fetchAcademicTerms());
    dispatch(fetchClassLevels());
    dispatch(fetchYearGroups());
  }, [dispatch]);

  // Derived Metrics from API
  const liveExams = exams.filter((e) => e.examStatus === "live").length;
  const pendingExams = exams.filter((e) => e.examStatus === "pending").length;
  const currentYear = academicYears.find((y) => y.isCurrent) || academicYears[0];
  const currentTerm = academicTerms[0];

  const graduatedStudents = students.filter((s) => s.isGraduated).length;
  const suspendedStudents = students.filter((s) => s.isSuspended).length;
  const withdrawnStudents = students.filter((s) => s.isWithDrawn).length;
  const activeStudents = Math.max(0, students.length - graduatedStudents - suspendedStudents - withdrawnStudents);

  const pendingTeachers = teachers.filter((t) => t.applicationStatus === "pending").length;
  const approvedTeachers = teachers.filter((t) => t.applicationStatus === "approved" || !t.applicationStatus).length;

  // Chart 1: Student Status Donut Chart
  const studentChartOptions: ApexCharts.ApexOptions = {
    chart: { type: "donut", background: "transparent" },
    colors: ["#10b981", "#ef4444", "#64748b", "#8b5cf6"],
    labels: ["Active Students", "Suspended", "Withdrawn", "Graduated"],
    legend: { position: "bottom", labels: { colors: "#94a3b8" } },
    dataLabels: { enabled: false },
    stroke: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Enrolled",
              color: "#94a3b8",
              formatter: () => `${students.length}`,
            },
            value: { color: "#ffffff", fontSize: "24px", fontWeight: "bold" },
          },
        },
      },
    },
    tooltip: { theme: "dark" },
  };

  const studentChartSeries = [
    activeStudents || (students.length > 0 ? students.length : 1),
    suspendedStudents,
    withdrawnStudents,
    graduatedStudents,
  ];

  // Chart 2: Academic & Exam Overview Bar Chart
  const examChartOptions: ApexCharts.ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, background: "transparent" },
    colors: ["#6366f1", "#f59e0b", "#10b981"],
    plotOptions: {
      bar: { borderRadius: 8, columnWidth: "45%", distributed: true },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: ["Total Exams", "Pending Approval", "Live Exams", "Programs", "Subjects"],
      labels: { style: { colors: "#94a3b8", fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: "#94a3b8" } } },
    grid: { borderColor: "rgba(255, 255, 255, 0.05)" },
    tooltip: { theme: "dark" },
  };

  const examChartSeries = [
    {
      name: "Count",
      data: [exams.length, pendingExams, liveExams, programs.length, subjects.length],
    },
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-[#0f172a] border border-white/10 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Welcome back, <span className="text-indigo-400">{admin?.name || "Administrator"}</span> 👋
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                School Administrator
              </span>
            </div>
            <p className="text-slate-300 text-sm flex items-center gap-2 flex-wrap pt-1">
              <HiOutlineCalendar className="text-indigo-400 text-base" />
              <span>Academic Year: <strong className="text-white">{currentYear?.name || "2025/2026"}</strong></span>
              {currentTerm && (
                <>
                  <span className="text-slate-500">•</span>
                  <span>Term: <strong className="text-emerald-400">{currentTerm?.name || "1st Term"}</strong></span>
                </>
              )}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/students"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
            >
              <HiOutlinePlus className="text-base" />
              Register Student
            </Link>
            <Link
              to="/teachers"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs transition-all flex items-center gap-2"
            >
              <HiOutlinePlus className="text-base" />
              Register Teacher
            </Link>
            <Link
              to="/exams"
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-all flex items-center gap-2"
            >
              <HiOutlinePlus className="text-base" />
              Create Exam
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Students Directory"
          value={students.length}
          subtitle={`${activeStudents} active · ${suspendedStudents} suspended · ${graduatedStudents} graduated`}
          link="/students"
          gradient="bg-gradient-to-br from-indigo-600 to-indigo-900"
          shadow="shadow-indigo-500/20"
          badge="Students"
          icon={<HiOutlineAcademicCap />}
        />
        <StatCard
          title="Teaching Staff"
          value={teachers.length}
          subtitle={`${approvedTeachers} approved · ${pendingTeachers} pending approval`}
          link="/teachers"
          gradient="bg-gradient-to-br from-violet-600 to-purple-900"
          shadow="shadow-violet-500/20"
          badge="Faculty"
          icon={<HiOutlineUserGroup />}
        />
        <StatCard
          title="Academic Programs"
          value={programs.length}
          subtitle={`${subjects.length} subjects · ${classLevels.length} class levels`}
          link="/academic/programs"
          gradient="bg-gradient-to-br from-emerald-600 to-teal-900"
          shadow="shadow-emerald-500/20"
          badge="Curriculum"
          icon={<HiOutlineBookOpen />}
        />
        <StatCard
          title="Exams & Evaluation"
          value={exams.length}
          subtitle={`${liveExams} live · ${pendingExams} pending publishing`}
          link="/exams"
          gradient="bg-gradient-to-br from-amber-500 to-orange-800"
          shadow="shadow-amber-500/20"
          badge="Exams"
          icon={<HiOutlineClipboardDocumentCheck />}
        />
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Distribution Donut Chart */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <HiOutlineUsers className="text-indigo-400" />
                Student Enrollment
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Distribution by status</p>
            </div>
            <Link to="/students" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              Manage →
            </Link>
          </div>
          <div className="py-2">
            <Chart options={studentChartOptions} series={studentChartSeries} type="donut" height={280} />
          </div>
        </div>

        {/* Academic Performance & Exam Metrics */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <HiOutlineChartBar className="text-emerald-400" />
                Academic & Exam Analytics
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">System curriculum & assessment breakdown</p>
            </div>
            <Link to="/exams" className="text-xs text-amber-400 hover:text-amber-300 font-medium">
              Exams Hub →
            </Link>
          </div>
          <div className="py-2">
            <Chart options={examChartOptions} series={examChartSeries} type="bar" height={260} />
          </div>
        </div>
      </div>

      {/* API Live Data Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Students */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HiOutlineAcademicCap className="text-indigo-400" />
              Recent Registered Students
            </h2>
            <Link to="/students" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              View all ({students.length}) <HiOutlineArrowRight />
            </Link>
          </div>

          <div className="space-y-3">
            {studentsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
              ))
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No students registered yet. <Link to="/students" className="text-indigo-400 hover:underline">Register one now</Link>
              </div>
            ) : (
              students.slice(0, 5).map((s, i) => (
                <div key={s._id || i} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                      {s.name?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{s.name}</p>
                      <p className="text-slate-400 text-xs truncate">{s.StudentId || s.email}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    s.isSuspended ? "bg-red-500/20 text-red-400 border-red-500/30" :
                    s.isWithDrawn ? "bg-slate-500/20 text-slate-400 border-slate-500/30" :
                    s.isGraduated ? "bg-violet-500/20 text-violet-400 border-violet-500/30" :
                    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  }`}>
                    {s.isSuspended ? "Suspended" : s.isWithDrawn ? "Withdrawn" : s.isGraduated ? "Graduated" : "Active"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Faculty / Teachers */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HiOutlineUserGroup className="text-violet-400" />
              Faculty Members & Staff
            </h2>
            <Link to="/teachers" className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
              View all ({teachers.length}) <HiOutlineArrowRight />
            </Link>
          </div>

          <div className="space-y-3">
            {teachersLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
              ))
            ) : teachers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No teachers registered yet. <Link to="/teachers" className="text-violet-400 hover:underline">Register one now</Link>
              </div>
            ) : (
                teachers.slice(0, 5).map((t, i) => (
                  <div key={t._id || i} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                        {t.name?.[0]?.toUpperCase() || "T"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{t.name}</p>
                        <p className="text-slate-400 text-xs truncate">{t.subject || t.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        t.applicationStatus === "approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                        t.applicationStatus === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}>
                        {t.applicationStatus || "approved"}
                      </span>
                      {t.isSuspended ? (
                        <button onClick={() => dispatch(unsuspendTeacher(t._id))} className="text-green-400 hover:text-green-300" title="Unsuspend Teacher">
                          <HiOutlineCheckCircle className="text-lg" />
                        </button>
                      ) : (
                        <button onClick={() => dispatch(suspendTeacher(t._id))} className="text-indigo-400 hover:text-indigo-300" title="Suspend Teacher">
                          <HiOutlineExclamationTriangle className="text-lg" />
                        </button>
                      )}
                      {t.isWithDrawn ? (
                        <button onClick={() => dispatch(unwithdrawTeacher(t._id))} className="text-yellow-400 hover:text-yellow-300" title="Unwithdraw Teacher">
                          <HiOutlineMinusCircle className="text-lg" />
                        </button>
                      ) : (
                        <button onClick={() => dispatch(withdrawTeacher(t._id))} className="text-amber-400 hover:text-amber-300" title="Withdraw Teacher">
                          <HiOutlineMinusCircle className="text-lg" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Academic Modules Quick Launch Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <HiOutlineBuildingLibrary className="text-indigo-400 text-lg" />
          Academic Infrastructure & Modules
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Academic Years", link: "/academic/years", icon: <HiOutlineCalendar className="text-indigo-400 text-xl" />, count: academicYears.length },
            { label: "Academic Terms", link: "/academic/terms", icon: <HiOutlineCalendar className="text-emerald-400 text-xl" />, count: academicTerms.length },
            { label: "Class Levels", link: "/academic/class-levels", icon: <HiOutlineBuildingLibrary className="text-violet-400 text-xl" />, count: classLevels.length },
            { label: "Year Groups", link: "/academic/year-groups", icon: <HiOutlineUserGroup className="text-purple-400 text-xl" />, count: yearGroups.length },
            { label: "Programs", link: "/academic/programs", icon: <HiOutlineBookOpen className="text-teal-400 text-xl" />, count: programs.length },
            { label: "Subjects", link: "/academic/subjects", icon: <HiOutlineFolderOpen className="text-amber-400 text-xl" />, count: subjects.length },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.link}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-2xl p-4 transition-all duration-200 group flex flex-col items-center text-center space-y-2 shadow-lg"
            >
              <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <p className="text-slate-300 text-xs font-medium leading-tight group-hover:text-white transition-colors">
                {item.label}
              </p>
              <p className="text-lg font-bold text-white">{item.count}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
