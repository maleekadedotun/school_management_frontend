import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchStudentEnrolledSubjects,
  studentEnrollSubject,
  studentUnenrollSubject,
  fetchStudentProfile,
  resetEnrollState,
  type EnrolledSubjectItem,
} from "../../features/students/studentsSlice";
import { fetchSubjects } from "../../features/subjects/subjectsSlice";
import { fetchExams } from "../../features/exams/examsSlice";
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineClipboardDocumentCheck,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineInformationCircle,
  HiOutlineSparkles,
  HiOutlineMagnifyingGlass,
  HiOutlineTrophy,
  HiOutlineCheck,
  HiOutlineXMark,
} from "react-icons/hi2";

export default function StudentSubjects() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    enrolledSubjectsByClass,
    allEnrolledSubjects,
    enrolledLoading,
    enrollSubmitting,
    student,
    profile,
  } = useAppSelector((state) => state.students);

  const { items: allSchoolSubjects, loading: subjectsLoading } = useAppSelector(
    (state) => state.subjects
  );

  const { items: exams } = useAppSelector((state) => state.exams);

  const activeStudent = { ...(student || {}), ...(profile || {}) };

  // Query parameter filters (e.g. from sidebar: ?class=Level+100&subject=...)
  const selectedClassParam = searchParams.get("class") || "all";
  const highlightedSubjectParam = searchParams.get("subject") || "";

  // Local filter states
  const [activeTab, setActiveTab] = useState<string>(selectedClassParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState<EnrolledSubjectItem | null>(null);

  // Enrollment Modal states
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollClassLevel, setEnrollClassLevel] = useState<string>("Level 100");
  const [enrollSubjectId, setEnrollSubjectId] = useState<string>("");
  const [enrollFeedback, setEnrollFeedback] = useState<string | null>(null);

  // Drop / Unenroll confirmation modal
  const [subjectToDrop, setSubjectToDrop] = useState<{ id: string; name: string; classLevel: string } | null>(null);

  useEffect(() => {
    dispatch(fetchStudentEnrolledSubjects());
    dispatch(fetchStudentProfile());
    dispatch(fetchSubjects());
    dispatch(fetchExams());
  }, [dispatch]);

  // Sync tab with URL search parameter
  useEffect(() => {
    if (selectedClassParam) {
      setActiveTab(selectedClassParam);
    }
  }, [selectedClassParam]);

  // Reset feedback on modal open
  const handleOpenEnrollModal = (defaultClass?: string) => {
    dispatch(resetEnrollState());
    setEnrollFeedback(null);
    if (defaultClass) {
      setEnrollClassLevel(defaultClass);
    } else if (activeStudent?.currentClassLevel) {
      setEnrollClassLevel(activeStudent.currentClassLevel);
    } else {
      setEnrollClassLevel("Level 100");
    }

    if (allSchoolSubjects.length > 0) {
      setEnrollSubjectId(allSchoolSubjects[0]._id);
    }
    setShowEnrollModal(true);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollSubjectId) return;

    setEnrollFeedback(null);
    const res = await dispatch(
      studentEnrollSubject({
        subjectId: enrollSubjectId,
        classLevel: enrollClassLevel,
      })
    );

    if (studentEnrollSubject.fulfilled.match(res)) {
      setEnrollFeedback("Subject enrolled successfully!");
      setTimeout(() => {
        setShowEnrollModal(false);
        setEnrollFeedback(null);
      }, 1200);
    } else {
      setEnrollFeedback((res.payload as string) || "Failed to enroll in subject.");
    }
  };

  const handleDropConfirm = async () => {
    if (!subjectToDrop) return;
    await dispatch(
      studentUnenrollSubject({
        subjectId: subjectToDrop.id,
        classLevel: subjectToDrop.classLevel,
      })
    );
    setSubjectToDrop(null);
  };

  // Filter groups according to tab and search query
  const filteredGroups = useMemo(() => {
    return enrolledSubjectsByClass
      .filter((group) => {
        if (activeTab === "all") return true;
        const groupNorm = group.classLevel.toLowerCase().trim();
        const tabNorm = activeTab.toLowerCase().trim();
        return (
          groupNorm === tabNorm ||
          group.shortCode.toLowerCase() === tabNorm ||
          (Boolean(tabNorm.match(/\d+/)) && groupNorm.includes(tabNorm.match(/\d+/)?.[0] || ""))
        );
      })
      .map((group) => {
        if (!searchQuery.trim()) return group;
        const q = searchQuery.toLowerCase().trim();
        const filteredSubjects = group.subjects.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            s.teacher?.name?.toLowerCase().includes(q)
        );
        return {
          ...group,
          subjects: filteredSubjects,
        };
      });
  }, [enrolledSubjectsByClass, activeTab, searchQuery]);

  // Total enrolled subjects count
  const totalEnrolledCount = allEnrolledSubjects.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-purple-950/60 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm">
                <HiOutlineAcademicCap className="w-4 h-4 text-indigo-400" />
                <span>Student Academic Portal</span>
              </span>

              {activeStudent?.currentClassLevel && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Current: {activeStudent.currentClassLevel}</span>
                </span>
              )}

              {activeStudent?.program && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1.5 shadow-sm">
                  <HiOutlineBookOpen className="w-3.5 h-3.5 text-violet-400" />
                  <span>Program: {typeof activeStudent.program === "object" ? activeStudent.program?.name : activeStudent.program}</span>
                </span>
              )}

              {activeStudent?.StudentId && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-white/5 text-slate-400 border border-white/10">
                  ID: {activeStudent.StudentId}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <span>My Enrolled Subjects</span>
                <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-400/30">
                  100L to Final
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl leading-relaxed">
                Explore your enrolled subjects and course curriculum systematically arranged under their respective class levels from Year 1 (100L) through your Final Year.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => handleOpenEnrollModal()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer"
            >
              <HiOutlinePlus className="w-5 h-5 stroke-2" />
              <span>+ Enroll in Subject</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <HiOutlineBookOpen className="w-4 h-4 text-indigo-400" />
              <span>Total Enrolled</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">
              {totalEnrolledCount} <span className="text-xs font-normal text-slate-400">Course{totalEnrolledCount === 1 ? "" : "s"}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <HiOutlineAcademicCap className="w-4 h-4 text-emerald-400" />
              <span>Current Level</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 truncate">
              {activeStudent?.currentClassLevel || "Level 100"}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <HiOutlineTrophy className="w-4 h-4 text-amber-400" />
              <span>Academic Status</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-300 mt-1">
              {activeStudent?.isGraduated ? "Graduated 🎓" : "In Progress"}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <HiOutlineSparkles className="w-4 h-4 text-purple-400" />
              <span>Program Track</span>
            </div>
            <div className="text-sm font-semibold text-white mt-1.5 truncate">
              {typeof activeStudent?.program === "object"
                ? (activeStudent?.program as any)?.name
                : activeStudent?.program || "Undergraduate Curriculum"}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Class Level Tabs from 100L to Final */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <button
            onClick={() => {
              setActiveTab("all");
              setSearchParams({});
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "all"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 font-semibold"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            All Classes (100L - Final)
          </button>

          {enrolledSubjectsByClass.map((group) => {
            const isSelected =
              activeTab.toLowerCase().trim() === group.classLevel.toLowerCase().trim() ||
              activeTab.toLowerCase().trim() === group.shortCode.toLowerCase().trim();

            return (
              <button
                key={group.classLevel}
                onClick={() => {
                  setActiveTab(group.classLevel);
                  setSearchParams({ class: group.classLevel });
                }}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 font-semibold"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                <span>{group.shortCode}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-white/10 text-slate-400 group-hover:text-white"
                  }`}
                >
                  {group.count}
                </span>
                {group.isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px] sm:min-w-[280px]">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search subjects, codes, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Main Content: Grouped by Class Level (100L to Final) */}
      {enrolledLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 animate-pulse space-y-4">
              <div className="h-6 w-48 bg-white/10 rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="h-44 bg-white/5 rounded-2xl" />
                <div className="h-44 bg-white/5 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto">
            <HiOutlineBookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Subjects Found</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            No enrolled subjects match your current filter. You can enroll in available subjects using the button below.
          </p>
          <button
            onClick={() => handleOpenEnrollModal()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all cursor-pointer"
          >
            + Enroll in a Subject Now
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredGroups.map((group) => {
            const isLevelCurrent = group.isCurrent;
            const isLevelCompleted = group.isCompleted;

            return (
              <section
                key={group.classLevel}
                id={`class-${group.shortCode.toLowerCase()}`}
                className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 sm:p-7 space-y-5 transition-all shadow-xl"
              >
                {/* Level Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-md ${
                        group.isFinal
                          ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25"
                          : isLevelCurrent
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25"
                          : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/25"
                      }`}
                    >
                      {group.shortCode.slice(0, 4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                          {group.classLevel}
                        </h2>
                        <span className="text-xs text-slate-400">({group.shortCode})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isLevelCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Current Class Level
                          </span>
                        )}
                        {isLevelCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                            <HiOutlineCheck className="w-3 h-3" /> Completed Tier
                          </span>
                        )}
                        {group.isFinal && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <HiOutlineTrophy className="w-3 h-3" /> Final Year Curriculum
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs text-slate-400">
                      {group.subjects.length} subject{group.subjects.length === 1 ? "" : "s"} enrolled
                    </span>
                    <button
                      onClick={() => handleOpenEnrollModal(group.classLevel)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <HiOutlinePlus className="w-3.5 h-3.5" />
                      <span>Add to {group.shortCode}</span>
                    </button>
                  </div>
                </div>

                {/* Subjects Grid */}
                {group.subjects.length === 0 ? (
                  <div className="py-8 px-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-3">
                    <p className="text-slate-400 text-sm">
                      No subjects are currently registered under <strong className="text-slate-200">{group.classLevel}</strong>.
                    </p>
                    <button
                      onClick={() => handleOpenEnrollModal(group.classLevel)}
                      className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <HiOutlinePlus className="w-4 h-4" />
                      <span>Enroll in {group.shortCode} Subjects</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.subjects.map((sub) => {
                      const isHighlighted =
                        highlightedSubjectParam &&
                        sub.name.toLowerCase() === highlightedSubjectParam.toLowerCase();

                      // Find exams related to this subject set by assigned teacher for this class
                      const relatedExams = exams.filter((e: any) => {
                        // 1. Subject match
                        const subNameMatch =
                          (typeof e.subject === "object" ? e.subject?.name : e.subject)?.trim().toLowerCase() === sub.name.trim().toLowerCase();
                        const subIdMatch =
                          (typeof e.subject === "object" ? e.subject?._id : e.subject) === sub.subjectId ||
                          (typeof e.subject === "object" ? e.subject?._id : e.subject) === sub._id;
                        if (!subNameMatch && !subIdMatch) return false;

                        // 2. Class Level match
                        const examClassStr = (typeof e.classLevel === "object" ? e.classLevel?.name : e.classLevel) || "";
                        const examClassNum = examClassStr.toString().match(/\d+/)?.[0];
                        const groupClassNum = group.classLevel.toString().match(/\d+/)?.[0];
                        if (examClassNum && groupClassNum && examClassNum !== groupClassNum) {
                          return false;
                        }

                        // 3. Assigned Teacher match
                        const studentAssignedTeacherObj = typeof activeStudent.assignedTeacher === "object" ? (activeStudent.assignedTeacher as any) : null;
                        const teacherId = sub.teacher?._id || (typeof sub.teacher === "string" ? sub.teacher : null) || studentAssignedTeacherObj?._id || (typeof activeStudent.assignedTeacher === "string" ? activeStudent.assignedTeacher : null);
                        const teacherName = (sub.teacher?.name || studentAssignedTeacherObj?.name || "").trim().toLowerCase();

                        const examCreatorId = e.createdBy?._id || (typeof e.createdBy === "string" ? e.createdBy : null);
                        const examCreatorName = (e.createdBy?.name || "").trim().toLowerCase();

                        const isAssigned =
                          (teacherId && examCreatorId && teacherId.toString() === examCreatorId.toString()) ||
                          (teacherName && examCreatorName && (examCreatorName === teacherName || examCreatorName.includes(teacherName) || teacherName.includes(examCreatorName)));

                        if (!isAssigned && (teacherId || teacherName)) return false;

                        return true;
                      });

                      return (
                        <div
                          key={sub._id || sub.name}
                          className={`relative rounded-2xl p-5 border transition-all flex flex-col justify-between group ${
                            isHighlighted
                              ? "bg-indigo-950/60 border-indigo-400 shadow-xl shadow-indigo-500/20 ring-1 ring-indigo-400"
                              : "bg-white/5 border-white/10 hover:border-indigo-500/40 hover:bg-white/[0.07]"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                                <HiOutlineBookOpen className="w-5 h-5" />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-slate-300">
                                  {sub.duration || "1 Semester"}
                                </span>
                                <button
                                  onClick={() =>
                                    setSubjectToDrop({
                                      id: sub.subjectId || sub._id,
                                      name: sub.name,
                                      classLevel: group.classLevel,
                                    })
                                  }
                                  title="Unenroll / Drop Subject"
                                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                                >
                                  <HiOutlineTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                                {sub.name}
                              </h3>
                              <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                                {sub.description || "Course syllabus, learning outcomes, and assessment modules."}
                              </p>
                            </div>

                            {/* Metadata Pills */}
                            <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs text-slate-300">
                              {sub.teacher && (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <HiOutlineUser className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  <span className="truncate">
                                    Lecturer: {typeof sub.teacher === "object" ? sub.teacher?.name : sub.teacher}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center gap-2 text-slate-400">
                                <HiOutlineClock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>Academic Level: {sub.classLevel}</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setSelectedSubjectDetail(sub)}
                              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                            >
                              <HiOutlineInformationCircle className="w-4 h-4" />
                              <span>View Details</span>
                            </button>

                            {relatedExams.length > 0 ? (
                              <Link
                                to={`/student/exams`}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                              >
                                <HiOutlineClipboardDocumentCheck className="w-3.5 h-3.5" />
                                <span>Take Exam</span>
                              </Link>
                            ) : (
                              <span className="text-[11px] text-slate-500">No exams pending</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Enroll Subject Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#0f172a] border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowEnrollModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>

            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Course Enrollment
              </span>
              <h2 className="text-xl font-bold text-white mt-2">Enroll in Subject</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Select your academic tier (100L - Final) and choose a subject from the school catalog.
              </p>
            </div>

            {enrollFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium ${
                  enrollFeedback.includes("success")
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/15 border border-red-500/30 text-red-300"
                }`}
              >
                {enrollFeedback}
              </div>
            )}

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Academic Class Level (100L to Final)
                </label>
                <select
                  value={enrollClassLevel}
                  onChange={(e) => setEnrollClassLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Level 100" className="bg-slate-900 text-white">Level 100 (100L)</option>
                  <option value="Level 200" className="bg-slate-900 text-white">Level 200 (200L)</option>
                  <option value="Level 300" className="bg-slate-900 text-white">Level 300 (300L)</option>
                  <option value="Level 400" className="bg-slate-900 text-white">Level 400 (400L / Final Year)</option>
                  <option value="Final year 2027" className="bg-slate-900 text-white">Final Year (Graduating Class)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Subject to Enroll
                </label>
                {subjectsLoading ? (
                  <p className="text-slate-400 text-xs">Loading course catalog...</p>
                ) : allSchoolSubjects.length === 0 ? (
                  <p className="text-slate-400 text-xs">No subjects currently available in catalog.</p>
                ) : (
                  <select
                    value={enrollSubjectId}
                    onChange={(e) => setEnrollSubjectId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {allSchoolSubjects.map((s) => (
                      <option key={s._id} value={s._id} className="bg-slate-900 text-white">
                        {s.name} {s.program?.name ? `(${s.program.name})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollSubmitting || allSchoolSubjects.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {enrollSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enrolling...</span>
                    </>
                  ) : (
                    <span>Confirm & Enroll</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Detail Modal */}
      {selectedSubjectDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-white/15 p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedSubjectDetail(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                <HiOutlineBookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300">
                  {selectedSubjectDetail.classLevel}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedSubjectDetail.name}
                </h3>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              {selectedSubjectDetail.description || "Course details, lectures, practical assignments, and end-of-term examinations."}
            </p>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Class Level:</span>
                <span className="text-white font-medium">{selectedSubjectDetail.classLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="text-white font-medium">{selectedSubjectDetail.duration || "3 months"}</span>
              </div>
              {selectedSubjectDetail.teacher && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Teacher:</span>
                  <span className="text-indigo-300 font-medium">
                    {typeof selectedSubjectDetail.teacher === "object"
                      ? selectedSubjectDetail.teacher?.name
                      : selectedSubjectDetail.teacher}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedSubjectDetail(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <Link
                to="/student/exams"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <HiOutlineClipboardDocumentCheck className="w-4 h-4" />
                <span>View Exams</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Drop / Unenroll Confirmation Dialog */}
      {subjectToDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0f172a] border border-red-500/20 p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <HiOutlineTrash className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Drop Subject?</h3>
              <p className="text-slate-400 text-xs mt-1">
                Are you sure you want to drop <strong className="text-white">{subjectToDrop.name}</strong> from {subjectToDrop.classLevel}?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setSubjectToDrop(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDropConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
              >
                Yes, Drop Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
